"""Chess rules for the online server: a faithful Python port of js/chess.js (Position, legal moves,
make/unmake, SAN and outcomes), so the server validates exactly what the browser allows.
tools/test_rules.py checks the two agree (perft counts and random games compared move by move).

Squares 0..63: index = rank * 8 + file, rank 0 = the 8th rank (top), file 0 = the a-file.
Pieces 'PNBRQK' white, 'pnbrqk' black, '' empty. Moves are identified by UCI strings ("e2e4", "e7e8q").
"""

FILES = "abcdefgh"
START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
KN = ((-2, -1), (-2, 1), (-1, -2), (-1, 2), (1, -2), (1, 2), (2, -1), (2, 1))
KG = ((-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1))
DIAG = ((-1, -1), (-1, 1), (1, -1), (1, 1))
ORTH = ((-1, 0), (1, 0), (0, -1), (0, 1))
DROP = {60: "KQ", 4: "kq", 63: "K", 56: "Q", 7: "k", 0: "q"}


def sq_name(i):
    return FILES[i & 7] + str(8 - (i >> 3))


def sq_index(n):
    return (8 - int(n[1])) * 8 + FILES.index(n[0])


def color_of(p):
    return ("w" if p == p.upper() else "b") if p else None


def other(c):
    return "b" if c == "w" else "w"


class Move:
    __slots__ = ("frm", "to", "piece", "captured", "flag", "promo")

    def __init__(self, frm, to, piece, captured, flag="", promo=""):
        self.frm, self.to, self.piece, self.captured, self.flag, self.promo = frm, to, piece, captured, flag, promo

    def uci(self):
        return sq_name(self.frm) + sq_name(self.to) + (self.promo.lower() if self.promo else "")


class Position:
    def __init__(self, fen=START):
        self.load(fen)

    def load(self, fen):
        parts = fen.split()
        rows, turn = parts[0], parts[1] if len(parts) > 1 else "w"
        castle = parts[2] if len(parts) > 2 else "-"
        ep = parts[3] if len(parts) > 3 else "-"
        self.board = []
        for ch in rows.replace("/", ""):
            if ch.isdigit():
                self.board.extend([""] * int(ch))
            else:
                self.board.append(ch)
        if len(self.board) != 64:
            raise ValueError("bad FEN")
        self.turn = turn
        self.castle = "" if castle == "-" else castle
        self.ep = -1 if ep == "-" else sq_index(ep)
        self.half = int(parts[4]) if len(parts) > 4 else 0
        self.full = int(parts[5]) if len(parts) > 5 else 1
        self.history = []
        self.keys = [self.key()]

    def fen(self):
        out = []
        for r in range(8):
            s, empty = "", 0
            for f in range(8):
                p = self.board[r * 8 + f]
                if not p:
                    empty += 1
                    continue
                if empty:
                    s += str(empty)
                    empty = 0
                s += p
            if empty:
                s += str(empty)
            out.append(s)
        ep = sq_name(self.ep) if self.ep >= 0 else "-"
        return f"{'/'.join(out)} {self.turn} {self.castle or '-'} {ep} {self.half} {self.full}"

    def key(self):
        return ",".join(self.board) + self.turn + self.castle + str(self.ep)

    def king_sq(self, c):
        return self.board.index("K" if c == "w" else "k")

    def attacked(self, sq, by):
        B, r, f = self.board, sq >> 3, sq & 7

        def at(rr, ff):
            return B[rr * 8 + ff] if 0 <= rr < 8 and 0 <= ff < 8 else None

        def own(p):
            return p and color_of(p) == by

        pawn_row = r + 1 if by == "w" else r - 1
        P = "P" if by == "w" else "p"
        if at(pawn_row, f - 1) == P or at(pawn_row, f + 1) == P:
            return True
        for dr, df in KN:
            p = at(r + dr, f + df)
            if own(p) and p.lower() == "n":
                return True
        for dr, df in KG:
            p = at(r + dr, f + df)
            if own(p) and p.lower() == "k":
                return True
        for dirs, kinds in ((DIAG, "bq"), (ORTH, "rq")):
            for dr, df in dirs:
                rr, ff = r + dr, f + df
                while 0 <= rr < 8 and 0 <= ff < 8:
                    p = B[rr * 8 + ff]
                    if p:
                        if own(p) and p.lower() in kinds:
                            return True
                        break
                    rr += dr
                    ff += df
        return False

    def in_check(self, c=None):
        c = c or self.turn
        return self.attacked(self.king_sq(c), other(c))

    def pseudo(self):
        B, c, out = self.board, self.turn, []

        def add(frm, to, flag="", promo=""):
            cap = ("p" if c == "w" else "P") if flag == "ep" else B[to]
            out.append(Move(frm, to, B[frm], cap, flag, promo))

        for sq in range(64):
            p = B[sq]
            if not p or color_of(p) != c:
                continue
            r, f, kind = sq >> 3, sq & 7, p.lower()
            if kind == "p":
                d, start, last = (-1, 6, 0) if c == "w" else (1, 1, 7)

                def push(to, flag=""):
                    if (to >> 3) == last:
                        for q in "qrbn":
                            add(sq, to, flag, q.upper() if c == "w" else q)
                    else:
                        add(sq, to, flag)

                one = sq + d * 8
                if not B[one]:
                    push(one)
                    if r == start and not B[one + d * 8]:
                        add(sq, one + d * 8, "double")
                for df in (-1, 1):
                    ff = f + df
                    if ff < 0 or ff > 7:
                        continue
                    to = (r + d) * 8 + ff
                    if B[to] and color_of(B[to]) != c:
                        push(to)
                    elif to == self.ep:
                        add(sq, to, "ep")
                continue

            def jump(deltas, slide):
                for dr, df in deltas:
                    rr, ff = r + dr, f + df
                    while 0 <= rr < 8 and 0 <= ff < 8:
                        to = rr * 8 + ff
                        q = B[to]
                        if q:
                            if color_of(q) != c:
                                add(sq, to)
                            break
                        add(sq, to)
                        if not slide:
                            break
                        rr += dr
                        ff += df

            if kind == "n":
                jump(KN, False)
            elif kind == "b":
                jump(DIAG, True)
            elif kind == "r":
                jump(ORTH, True)
            elif kind == "q":
                jump(DIAG + ORTH, True)
            elif kind == "k":
                jump(KG, False)
                opp, row = other(c), (7 if c == "w" else 0)
                k = row * 8 + 4
                if sq == k and not self.attacked(k, opp):
                    ks, qs, rook = ("K", "Q", "R") if c == "w" else ("k", "q", "r")
                    if ks in self.castle and not B[k + 1] and not B[k + 2] and B[k + 3] == rook \
                            and not self.attacked(k + 1, opp) and not self.attacked(k + 2, opp):
                        add(k, k + 2, "castle")
                    if qs in self.castle and not B[k - 1] and not B[k - 2] and not B[k - 3] and B[k - 4] == rook \
                            and not self.attacked(k - 1, opp) and not self.attacked(k - 2, opp):
                        add(k, k - 2, "castle")
        return out

    def moves(self):
        c, legal = self.turn, []
        for m in self.pseudo():
            self.make(m)
            if not self.attacked(self.king_sq(c), other(c)):
                legal.append(m)
            self.unmake()
        return legal

    def make(self, m):
        B, c = self.board, self.turn
        self.history.append((m, self.castle, self.ep, self.half, self.full))
        B[m.to] = m.promo or m.piece
        B[m.frm] = ""
        if m.flag == "ep":
            B[m.to + (8 if c == "w" else -8)] = ""
        if m.flag == "castle":
            if m.to > m.frm:
                B[m.frm + 1], B[m.frm + 3] = B[m.frm + 3], ""
            else:
                B[m.frm - 1], B[m.frm - 4] = B[m.frm - 4], ""
        for s in (m.frm, m.to):
            for ch in DROP.get(s, ""):
                self.castle = self.castle.replace(ch, "")
        self.ep = (m.frm + m.to) >> 1 if m.flag == "double" else -1
        self.half = 0 if m.piece.lower() == "p" or m.captured else self.half + 1
        if c == "b":
            self.full += 1
        self.turn = other(c)
        self.keys.append(self.key())

    def unmake(self):
        if not self.history:
            return
        m, castle, ep, half, full = self.history.pop()
        self.keys.pop()
        B = self.board
        self.turn = other(self.turn)
        c = self.turn
        B[m.frm] = m.piece
        B[m.to] = "" if m.flag == "ep" else m.captured
        if m.flag == "ep":
            B[m.to + (8 if c == "w" else -8)] = m.captured
        if m.flag == "castle":
            if m.to > m.frm:
                B[m.frm + 3], B[m.frm + 1] = B[m.frm + 1], ""
            else:
                B[m.frm - 4], B[m.frm - 1] = B[m.frm - 1], ""
        self.castle, self.ep, self.half, self.full = castle, ep, half, full

    def repetitions(self):
        k = self.keys[-1]
        return self.keys.count(k)

    def insufficient(self):
        rest = [p for p in self.board if p and p.lower() != "k"]
        if not rest:
            return True
        if len(rest) == 1 and rest[0].lower() in "nb":
            return True
        if all(p.lower() == "b" for p in rest):
            colours = {((i >> 3) + (i & 7)) % 2 for i, p in enumerate(self.board) if p and p.lower() == "b"}
            return len(colours) == 1
        return False

    def outcome(self):
        """None while play goes on, else (result, reason) with result '1-0', '0-1' or '1/2-1/2'."""
        if not self.moves():
            if self.in_check():
                return ("0-1" if self.turn == "w" else "1-0", "checkmate")
            return ("1/2-1/2", "stalemate")
        if self.half >= 100:
            return ("1/2-1/2", "fifty-move rule")
        if self.repetitions() >= 3:
            return ("1/2-1/2", "threefold repetition")
        if self.insufficient():
            return ("1/2-1/2", "insufficient material")
        return None

    def san(self, m):
        if m.flag == "castle":
            s = "O-O" if m.to > m.frm else "O-O-O"
        else:
            kind = m.piece.upper()
            cap = "x" if m.captured else ""
            if kind == "P":
                s = (FILES[m.frm & 7] if cap else "") + cap + sq_name(m.to) + ("=" + m.promo.upper() if m.promo else "")
            else:
                rivals = [o for o in self.moves() if o.piece == m.piece and o.to == m.to and o.frm != m.frm]
                dis = ""
                if rivals:
                    same_file = any((o.frm & 7) == (m.frm & 7) for o in rivals)
                    same_rank = any((o.frm >> 3) == (m.frm >> 3) for o in rivals)
                    dis = FILES[m.frm & 7] if not same_file else str(8 - (m.frm >> 3)) if not same_rank else sq_name(m.frm)
                s = kind + dis + cap + sq_name(m.to)
        self.make(m)
        o = self.outcome()
        if o and o[1] == "checkmate":
            s += "#"
        elif self.in_check():
            s += "+"
        self.unmake()
        return s

    def perft(self, depth):
        if not depth:
            return 1
        n = 0
        for m in self.moves():
            self.make(m)
            n += self.perft(depth - 1)
            self.unmake()
        return n
