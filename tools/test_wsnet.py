"""python3 tools/test_wsnet.py — raw-socket tests of shared/wsnet.py plus vendored-copy checks."""
import base64, filecmp, glob, json, os, socket, struct, subprocess, sys, time
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
passed, fails = 0, []
def ok(c, m):
    global passed
    if c: passed += 1
    else: fails.append(m)

# every game folder that uses a shared module carries an identical copy
for name in ("wsnet.py", "turnrooms.py", "arcade-net.js"):
    canon = os.path.join(ROOT, "shared", name)
    for copy in glob.glob(os.path.join(ROOT, "*", name)) + glob.glob(os.path.join(ROOT, "*", "js", name)):
        if "/shared/" in copy: continue
        ok(filecmp.cmp(canon, copy, shallow=False), f"{os.path.relpath(copy, ROOT)} matches shared/{name}")

# a live server (connect-4 uses wsnet + turnrooms) for raw-frame tests
port = 9399
proc = subprocess.Popen([sys.executable, "server.py"], cwd=os.path.join(ROOT, "connect-4"), env={**os.environ, "PORT": str(port)}, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.8)
def handshake(key=base64.b64encode(os.urandom(16)).decode(), version="13"):
    s = socket.create_connection(("127.0.0.1", port), timeout=3)
    s.sendall(f"GET /ws HTTP/1.1\r\nHost: x\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: {version}\r\n\r\n".encode())
    head = b""
    while b"\r\n\r\n" not in head: head += s.recv(1)
    return s, head.decode()
def frame(payload, op=0x1, fin=True, mask=True):
    b0 = (0x80 if fin else 0) | op
    n = len(payload)
    h = bytes([b0, (0x80 if mask else 0) | n]) if n < 126 else bytes([b0, (0x80 if mask else 0) | 126]) + struct.pack(">H", n)
    if not mask: return h + payload
    k = os.urandom(4); return h + k + bytes(c ^ k[i & 3] for i, c in enumerate(payload))
def read(s):
    b0, b1 = s.recv(2); n = b1 & 0x7F
    if n == 126: n = struct.unpack(">H", s.recv(2))[0]
    data = b""
    while len(data) < n: data += s.recv(n - len(data))
    return b0 & 0x0F, data
try:
    s, head = handshake()
    ok(head.startswith("HTTP/1.1 101"), "handshake answers HTTP/1.1 101")
    ok("connection: close" not in head.lower() and "connection: upgrade" in head.lower(), "no Connection: close on the upgrade")
    ok(json.loads(read(s)[1])["t"] == "hello", "hello frame")
    # fragmented text message: {"t":"ping","id":5} in three pieces
    msg = b'{"t":"ping","id":5}'
    s.sendall(frame(msg[:5], 0x1, fin=False) + frame(msg[5:11], 0x0, fin=False) + frame(msg[11:], 0x0, fin=True))
    ok(json.loads(read(s)[1]) == {"t": "pong", "id": 5}, "fragmented message reassembled")
    s.sendall(frame(b"hi", 0x9)); op, data = read(s); ok(op == 0xA and data == b"hi", "ping frame answered with pong")
    s.sendall(frame(struct.pack(">H", 1000), 0x8)); op, _ = read(s); ok(op == 0x8, "close frame answered")
    s.close()
    s, _ = handshake(); read(s); s.sendall(frame(b"x" * 6000)); op, data = read(s)
    ok(op == 0x8 and struct.unpack(">H", data[:2])[0] == 1009, "oversized message closed with 1009")
    s.close()
    s, _ = handshake(); read(s); s.sendall(frame(b'{"t":"ping"}', mask=False)); s.settimeout(2)
    try: gone = s.recv(10) == b""
    except OSError: gone = True
    ok(gone, "unmasked client frame drops the socket"); s.close()
    _, head = handshake(key="short"); ok(head.startswith("HTTP/1.0 400") or " 400 " in head.split("\r\n")[0], "bad key refused with 400")
    _, head = handshake(version="8"); ok(" 400 " in head.split("\r\n")[0], "wrong version refused with 400")
finally:
    proc.terminate(); proc.wait()
if fails:
    for f in fails: print("FAIL", f)
    sys.exit(1)
print(f"{passed} wsnet checks passed")
