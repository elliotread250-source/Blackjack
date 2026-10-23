"""Open Arcade: authoritative rooms and five original arena games. Stdlib only."""
import json, math, os, random, secrets, threading, time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from functools import partial
from collections import deque
from urllib.parse import urlsplit
ROOT=os.path.dirname(os.path.abspath(__file__))
GAMES=('paper','snake','scissor','hole','blob')
rooms={}
lock=threading.RLock()
R=470

def distance(a,b): return math.hypot(a['x']-b['x'],a['y']-b['y'])
def cell(x,y): return (int((x+500)//20),int((y+500)//20))
def inside(c): return math.hypot(c[0]*20-490,c[1]*20-490)<R
CELLS={ (x,y) for x in range(50) for y in range(50) if inside((x,y)) }
class Room:
 def __init__(self,game):
  self.game=game; self.auth={}; self.players={}; self.items=[]; self.tiles={}; self.end=time.time()+180; self.last=time.time(); self.winner=None
  for i in range(7): self.add('bot-'+str(i),['Juniper','Moth','Clover','Saffron','Otter','Pip','Finch'][i],True)
  for i in range(160 if game!='hole' else 100): self.item()
 def item(self):
  a=random.random()*math.tau; d=math.sqrt(random.random())*(R-30)
  size=random.choice([4,5,7,10,16,24,36]) if self.game=='hole' else 3
  self.items.append(dict(x=math.cos(a)*d,y=math.sin(a)*d,r=size,kind=random.randrange(4)))
 def add(self,token,name,bot=False):
  a=random.random()*math.tau; d=random.uniform(90,350)
  p=dict(id=token,name=name[:18],bot=bot,x=math.cos(a)*d,y=math.sin(a)*d,angle=a,mass=70,score=0,trail=[],cells=[],alive=True,respawn=0,last=time.time(),input={},cool=0,color=random.randrange(8))
  self.players[token]=p; self.spawn(p)
  return p
 def spawn(self,p):
  a=random.random()*math.tau; p.update(x=math.cos(a)*random.uniform(100,340),y=math.sin(a)*random.uniform(100,340),mass=70,trail=[],cells=[],alive=True,input={})
  if self.game=='blob': p['cells']=[dict(x=p['x'],y=p['y'],mass=70,merge=time.time())]
  if self.game in ('paper','scissor'):
   c=cell(p['x'],p['y'])
   for x in range(c[0]-2,c[0]+3):
    for y in range(c[1]-2,c[1]+3):
     if (x,y) in CELLS: self.tiles[(x,y)]=p['id']
 def kill(self,p):
  p.update(alive=False,respawn=time.time()+3)
  if self.game=='snake':
   for q in p['trail'][::4][:max(0,500-len(self.items))]: self.items.append(dict(x=q[0],y=q[1],r=3,kind=0))
  p['trail']=[];p['cells']=[]
 def capture(self,p):
  boundary={c for c,v in self.tiles.items() if v==p['id']}|{tuple(c) for c in p['trail']}
  # Flood fill outside the loop; unreachable cells belong to the completed enclosure.
  outside=set(); todo=deque(c for c in CELLS-boundary if any((c[0]+dx,c[1]+dy) not in CELLS for dx,dy in [(1,0),(-1,0),(0,1),(0,-1)]))
  while todo:
   c=todo.popleft()
   if c in outside or c in boundary: continue
   outside.add(c)
   for dx,dy in [(1,0),(-1,0),(0,1),(0,-1)]:
    n=(c[0]+dx,c[1]+dy)
    if n in CELLS and n not in outside and n not in boundary: todo.append(n)
  for c in CELLS-outside: self.tiles[c]=p['id']
  p['trail']=[]
 def tick(self,dt):
  now=time.time()
  if now>self.end:
   if self.winner is None:
    best=max(self.players.values(),key=lambda p:p['score'],default=None)
    self.winner=dict(name=best['name'],score=best['score']) if best else dict(name='Nobody',score=0)
   if now<self.end+6:return
   self.end=now+180;self.winner=None;self.tiles.clear();self.items=[]
   for _ in range(100 if self.game=='hole' else 160):self.item()
   for p in self.players.values():p['score']=0;self.spawn(p)

  for k,p in list(self.players.items()):
   if not p['bot'] and now-p['last']>60:
    del self.players[k]; self.auth={t:v for t,v in self.auth.items() if v!=k}; self.tiles={c:v for c,v in self.tiles.items() if v!=k}; continue
   if not p['alive']:
    if now>=p['respawn']: self.spawn(p)
    continue
   i=p['input']; boost=bool(i.get('boost'))
   if p['bot']:
    if self.game in ('paper','scissor'):
     phase=int(now/2+p['color'])%4; angle=phase*math.pi/2
     if math.hypot(p['x'],p['y'])>400: angle=math.atan2(-p['y'],-p['x'])
    else:
     choices=[q for q in self.items if q['r']<(math.sqrt(p['mass'])*2 if self.game=='hole' else 100)]
     target=min(choices,key=lambda q:distance(p,q)) if choices else dict(x=0,y=0)
     angle=math.atan2(target['y']-p['y'],target['x']-p['x'])
     threats=[q for q in self.players.values() if q is not p and q['alive'] and q['mass']>p['mass']*1.3 and distance(p,q)<100]
     if threats: angle=math.atan2(p['y']-threats[0]['y'],p['x']-threats[0]['x'])
   else:
    angle=i.get('angle',p['angle'])
   delta=(angle-p['angle']+math.pi)%math.tau-math.pi; p['angle']+=max(-dt*5,min(dt*5,delta))
   speed=100 if self.game!='blob' else max(36,170-p['mass']**.5*5)
   if self.game=='snake' and boost and p['mass']>75: speed*=1.8;p['mass']-=dt*12
   if self.game=='scissor' and boost and now>p['cool']: speed*=2.8;p['cool']=now+0.08
   if self.game!='blob':
    p['x']+=math.cos(p['angle'])*speed*dt;p['y']+=math.sin(p['angle'])*speed*dt
    d=math.hypot(p['x'],p['y'])
    if d>R-8:
     if self.game in ('paper','snake','scissor'): self.kill(p);continue
     p['x']*= (R-8)/d;p['y']*= (R-8)/d
   if self.game in ('paper','scissor'):
    c=cell(p['x'],p['y'])
    if self.tiles.get(c)==p['id']:
     if p['trail']: self.capture(p)
    elif not p['trail'] or tuple(p['trail'][-1])!=c:
     if c in [tuple(t) for t in p['trail'][:-2]]: self.kill(p);continue
     p['trail'].append(list(c))
    for q in self.players.values():
     if q is not p and q['alive'] and c in [tuple(t) for t in q['trail']]: self.kill(q);p['score']+=50
    p['score']=sum(v==p['id'] for v in self.tiles.values())
   elif self.game=='snake':
    p['trail'].insert(0,[p['x'],p['y']]);p['trail']=p['trail'][:int(p['mass']/3)]
    for q in self.players.values():
     if q is not p and q['alive'] and any(math.hypot(p['x']-t[0],p['y']-t[1])<10 for t in q['trail'][3::2]): self.kill(p);q['score']+=50;break
   elif self.game=='blob':
    if i.pop('split',False) and len(p['cells'])<8:
     for c in list(p['cells']):
      if c['mass']>=50 and len(p['cells'])<8:
       c['mass']/=2;c['merge']=now+12
       p['cells'].append(dict(x=c['x']+math.cos(angle)*45,y=c['y']+math.sin(angle)*45,mass=c['mass'],merge=now+12))
    for c in p['cells']:
     cs=max(36,170-math.sqrt(c['mass'])*5)
     cohesion=.7 if now>c['merge'] else 0
     c['x']=max(-450,min(450,c['x']+(math.cos(angle)*cs+(p['x']-c['x'])*cohesion)*dt));c['y']=max(-450,min(450,c['y']+(math.sin(angle)*cs+(p['y']-c['y'])*cohesion)*dt))
     d=math.hypot(c['x'],c['y'])
     if d>450:c['x']*=450/d;c['y']*=450/d
    for c in list(p['cells']):
     for b in list(p['cells']):
      if c is not b and c in p['cells'] and b in p['cells'] and now>max(c['merge'],b['merge']) and distance(c,b)<math.sqrt(c['mass'])*2:
       c['mass']+=b['mass'];p['cells'].remove(b)
    if p['cells']:p['x']=sum(c['x'] for c in p['cells'])/len(p['cells']);p['y']=sum(c['y'] for c in p['cells'])/len(p['cells'])
   if self.game in ('snake','hole','blob') and p['alive']:
    for f in list(self.items):
     eat=False
     if self.game=='blob':
      for c in p['cells']:
       if distance(c,f)<math.sqrt(c['mass'])*2: c['mass']+=2;eat=True;break
     elif self.game=='hole': eat=f['r']<math.sqrt(p['mass'])*1.7 and distance(p,f)<math.sqrt(p['mass'])*2-f['r']*.4
     else:eat=distance(p,f)<14
     if eat:self.items.remove(f);p['mass']+=max(2,f['r']*.8);p['score']+=int(f['r']);self.item()
    for q in list(self.players.values()):
     if q is p or not q['alive']:continue
     if self.game=='hole' and p['mass']>q['mass']*1.6 and distance(p,q)<math.sqrt(p['mass']):p['mass']+=q['mass']*.3;p['score']+=50;self.kill(q)
     if self.game=='blob':
      for c in p['cells']:
       for b in list(q['cells']):
        if c['mass']>b['mass']*1.25 and distance(c,b)<math.sqrt(c['mass'])*2-math.sqrt(b['mass'])*.5:c['mass']+=b['mass'];q['cells'].remove(b)
      if not q['cells']: self.kill(q)
    if self.game=='blob':p['mass']=sum(c['mass'] for c in p['cells']);p['score']=int(p['mass'])
 def state(self):
  return dict(game=self.game,winner=self.winner,restartIn=max(0,int(self.end+6-time.time())),remaining=max(0,int(self.end-time.time())),players=[{k:v for k,v in p.items() if k not in ('input','last','cool')} for p in self.players.values()],items=self.items,tiles=[[x,y,v] for (x,y),v in self.tiles.items()])

def loop():
 last=time.monotonic()
 while True:
  now=time.monotonic();dt=min(.1,now-last);last=now
  with lock:
   for code,r in list(rooms.items()):
    if not any(not p['bot'] for p in r.players.values()):del rooms[code];continue
    r.tick(dt)
  time.sleep(.04)
class Handler(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
 def do_GET(self):
  if self.path=='/healthz':return self.reply(200,{'ok':True})
  if urlsplit(self.path).path not in ('/','/index.html','/app.js','/style.css'):
   return self.reply(404,{'error':'Not found'})
  return super().do_GET()
 def reply(self,status,data):
  body=json.dumps(data).encode();self.send_response(status);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(body)));self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(body)
 def do_POST(self):
  try:
   length=int(self.headers.get('Content-Length',0))
   if length<0 or length>4096:return self.reply(413,{'error':'Request too large'})
   data=json.loads(self.rfile.read(length));game=data.get('game')
   with lock:
    if self.path=='/api/join':
     if game not in GAMES:return self.reply(400,{'error':'Unknown game'})
     requested=str(data.get('room','')).strip().upper()
     if requested:
      if requested not in rooms:return self.reply(404,{'error':'Room not found. Ask your friend to create one.'})
      room=rooms[requested]
      if room.game!=game:return self.reply(400,{'error':'That room is playing a different game.'})
      code=requested
     else:
      if len(rooms)>=80:return self.reply(503,{'error':'All arenas are busy'})
      code=secrets.token_hex(3).upper();room=Room(game);rooms[code]=room
     if sum(not p['bot'] for p in room.players.values())>=8:return self.reply(409,{'error':'Room is full'})
     token=secrets.token_hex(16);public=secrets.token_hex(6);room.auth[token]=public;room.add(public,str(data.get('name','Guest')) or 'Guest')
     return self.reply(200,dict(room=code,token=token,player=public,state=room.state()))
    if self.path=='/api/input':
     room=rooms.get(data.get('room'));p=room.players.get(room.auth.get(data.get('token'))) if room else None
     if not p:return self.reply(404,{'error':'Session expired. Join again.'})
     angle=float(data.get('angle',0))
     if not math.isfinite(angle):raise ValueError('angle')
     p['input']=dict(angle=angle,boost=bool(data.get('boost')),split=bool(data.get('split')));p['last']=time.time()
     return self.reply(200,dict(state=room.state()))
    self.reply(404,{'error':'Not found'})
  except (ValueError,TypeError,AttributeError):self.reply(400,{'error':'Invalid request'})
def start():
 threading.Thread(target=loop,daemon=True).start()

def dispatch(original):
 """Handle only the /arenas namespace using the hub's existing socket."""
 path=urlsplit(original.path).path
 if path=='/arenas':
  original.send_response(302);original.send_header('Location','/arenas/');original.end_headers();return True
 if not path.startswith('/arenas/'):return False
 adapter=Handler.__new__(Handler)
 adapter.__dict__=original.__dict__.copy()
 adapter.path=original.path[len('/arenas'):]
 adapter.directory=ROOT
 if original.command=='POST':adapter.do_POST()
 elif original.command=='HEAD':
  if urlsplit(adapter.path).path not in ('/','/index.html','/app.js','/style.css'):
   adapter.send_error(404)
  else:adapter.do_HEAD()
 else:adapter.do_GET()
 return True

if __name__=='__main__':
 start()
 ThreadingHTTPServer(('0.0.0.0',int(os.environ.get('PORT','8081'))),partial(Handler,directory=ROOT)).serve_forever()
