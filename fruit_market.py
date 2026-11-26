# ============================================================
#   BERRY LANE MARKET
#   A cosy market game for Thonny. Press the green Run button.
#
#   CONTROLS
#     Arrow keys or WASD ... walk around
#     E or Space ........... talk / use the thing in front of you
#     I .................... look in your cart
#     In menus: Up/Down to pick, Left/Right to change, Enter to choose,
#               Esc to close
#
#   You start with $50. Buy berries from the stalls, bid at the
#   auction tent, forage the bushes, then walk to YOUR cart in the
#   middle of the square and open it. The dearer your prices, the
#   fewer critters buy.
# ============================================================

import tkinter as tk
import random

W, H = 960, 640
FONT = "Verdana"
DAYS = 15
START_CASH = 50.0

# name: (normal price per punnet, days it stays fresh, popularity, colour)
BERRIES = {
    "Strawberry":   (4.0, 3, 10, "#e8334a"),
    "Blueberry":    (4.5, 4, 10, "#4a6cd4"),
    "Raspberry":    (5.0, 2, 9, "#d81e5b"),
    "Blackberry":   (4.5, 3, 8, "#2d1b3d"),
    "Cranberry":    (3.5, 6, 5, "#b3122e"),
    "Gooseberry":   (4.0, 4, 4, "#a8c256"),
    "Elderberry":   (5.5, 3, 3, "#3b2a4f"),
    "Mulberry":     (6.0, 2, 4, "#5c1f4a"),
    "Boysenberry":  (6.5, 2, 4, "#7a2048"),
    "Loganberry":   (6.5, 2, 3, "#b02a50"),
    "Huckleberry":  (8.0, 3, 3, "#3a3f8f"),
    "Lingonberry":  (7.0, 6, 3, "#d1293d"),
    "Cloudberry":   (14.0, 2, 2, "#f2a03d"),
    "Salmonberry":  (8.0, 2, 2, "#f77f5e"),
    "Bilberry":     (7.5, 3, 3, "#35407a"),
    "Blackcurrant": (5.0, 4, 5, "#241a2e"),
    "Redcurrant":   (5.0, 4, 5, "#e0263a"),
    "Goji Berry":   (9.0, 7, 3, "#f0522b"),
    "Acai Berry":   (12.0, 2, 3, "#3d1e4f"),
    "Tayberry":     (7.0, 2, 3, "#9c2542"),
    "Dewberry":     (6.0, 2, 3, "#4b2a5e"),
    "Marionberry":  (7.5, 2, 3, "#331a33"),
    "Honeyberry":   (9.0, 3, 2, "#5560b8"),
    "Chokeberry":   (4.0, 6, 2, "#2a2230"),
    "Thimbleberry": (10.0, 1, 2, "#e04a5a"),
}
WILD = ["Blackberry", "Raspberry", "Blueberry", "Dewberry", "Mulberry",
        "Elderberry", "Huckleberry", "Thimbleberry", "Salmonberry"]

# mult = share of the normal price the stall charges you
# fresh = extra days of freshness ("gamble" is Shifty's special)
STALLS = [
    {"name": "Bramble Barn", "owner": "Hazel", "fur": "#b98a5e", "ears": "round", "awning": "#e2574c",
     "mult": 0.60, "fresh": 0,
     "berries": ["Raspberry", "Blackberry", "Boysenberry", "Loganberry", "Tayberry",
                 "Marionberry", "Dewberry", "Mulberry"],
     "blurb": "Hazel the hedgehog picks everything herself. Fair prices, prickly handshake."},
    {"name": "Bargain Bucket", "owner": "Biff", "fur": "#8d8d99", "ears": "round", "awning": "#f2b134",
     "mult": 0.48, "fresh": -1,
     "berries": ["Strawberry", "Blueberry", "Cranberry", "Gooseberry", "Blackcurrant",
                 "Redcurrant", "Chokeberry"],
     "blurb": "Biff sells yesterday's berries cheap. They go off a day sooner."},
    {"name": "Northern Berries", "owner": "Sven", "fur": "#a9744f", "ears": "long", "awning": "#4aa3df",
     "mult": 0.62, "fresh": 0,
     "berries": ["Lingonberry", "Cloudberry", "Bilberry", "Huckleberry", "Honeyberry", "Cranberry"],
     "blurb": "Sven hauls berries down from the cold north. He hums while he weighs them."},
    {"name": "The Rare Punnet", "owner": "Madame Plume", "fur": "#d9c7a3", "ears": "pointy", "awning": "#9b59b6",
     "mult": 0.68, "fresh": 1,
     "berries": ["Acai Berry", "Goji Berry", "Cloudberry", "Salmonberry", "Thimbleberry", "Elderberry"],
     "blurb": "Madame Plume keeps rare berries on velvet. Dear, but fresh an extra day."},
    {"name": "Shifty's Wagon", "owner": "Shifty", "fur": "#e8843c", "ears": "pointy", "awning": "#555b6e",
     "mult": 0.33, "fresh": "gamble",
     "berries": [],
     "blurb": "'Fell off a wagon, friend.' Dirt cheap. Might be mush by tomorrow."},
]
STALL_X = [110, 295, 480, 665, 850]
STALL_Y = 132

EVENTS = [
    {"name": "Sunny Day", "text": "A calm, sunny day on Berry Lane.",
     "hint": "tomorrow looks perfectly ordinary", "prices": {}, "crowd": 1.0},
    {"name": "Heatwave", "text": "It's roasting! Everyone wants something cold and juicy.",
     "hint": "it's going to be a scorcher", "prices": {"Strawberry": 1.5, "Blueberry": 1.3, "Raspberry": 1.3}, "crowd": 1.2},
    {"name": "Rainy Day", "text": "Drizzle all day. The square is half empty.",
     "hint": "my knees say rain", "prices": {}, "crowd": 0.6},
    {"name": "Lantern Festival", "text": "The festival is on and the square is packed!",
     "hint": "they're hanging bunting tonight", "prices": {"Strawberry": 1.2, "Cloudberry": 1.3}, "crowd": 1.6},
    {"name": "Jam Fair", "text": "Jam Fair today! Every grandma in town needs berries.",
     "hint": "the grannies are sterilising jars",
     "prices": {"Raspberry": 1.6, "Strawberry": 1.4, "Blackcurrant": 1.7, "Redcurrant": 1.5, "Gooseberry": 1.5}, "crowd": 1.3},
    {"name": "Smoothie Craze", "text": "A famous otter posted a purple smoothie. Chaos.",
     "hint": "a famous otter is about to post something",
     "prices": {"Acai Berry": 1.7, "Blueberry": 1.4, "Goji Berry": 1.6, "Honeyberry": 1.3}, "crowd": 1.2},
    {"name": "Pie Contest", "text": "The Great Pie Contest is today. Bakers everywhere.",
     "hint": "ovens are being pre-heated all over town",
     "prices": {"Blackberry": 1.6, "Huckleberry": 1.5, "Marionberry": 1.6, "Boysenberry": 1.4, "Mulberry": 1.3}, "crowd": 1.3},
    {"name": "Tourist Coaches", "text": "Coach loads of tourists want berries they've never heard of.",
     "hint": "coaches are booked for the square",
     "prices": {"Cloudberry": 1.5, "Lingonberry": 1.5, "Salmonberry": 1.5, "Thimbleberry": 1.5, "Tayberry": 1.3}, "crowd": 1.3},
    {"name": "Wasp Scare", "text": "Wasps in the news. Soft berries are a hard sell.",
     "hint": "I saw an awful lot of wasps",
     "prices": {"Strawberry": 0.6, "Raspberry": 0.6, "Loganberry": 0.7}, "crowd": 0.9},
]

UPGRADES = [
    {"key": "cart",   "name": "Bigger Cart",      "cost": 35, "max": 4, "desc": "+20 punnets of space"},
    {"key": "cooler", "name": "Ice Box",          "cost": 55, "max": 2, "desc": "new berries last +1 day"},
    {"key": "sign",   "name": "Painted Sign",     "cost": 45, "max": 3, "desc": "+6 visitors a day"},
    {"key": "charm",  "name": "Haggling Lessons", "cost": 30, "max": 2, "desc": "better odds when haggling"},
]
RIVALS = ["Big Marge", "Lemony Lou", "The Baroness", "Old Pip", "Juice Bar Jess"]
FURS = ["#f4d9b0", "#c9a27a", "#9aa7b8", "#f2c1d1", "#b7d8a8", "#e8b25e", "#d6d6d6", "#a98bd1", "#8fc7d9"]
SHIRTS = ["#e2574c", "#4aa3df", "#f2b134", "#59b36b", "#9b59b6", "#ff8fab", "#3d8f8f"]


def money(x):
    return "${:,.2f}".format(x)


def verdict(ratio):
    if ratio <= 0.75:
        return "a steal"
    if ratio <= 0.95:
        return "a bargain"
    if ratio <= 1.1:
        return "fair"
    if ratio <= 1.35:
        return "a bit dear"
    if ratio <= 1.7:
        return "expensive"
    return "a rip-off"


def sell_chance(ratio):
    # THE BIG RULE: the higher your price compared with what the berry
    # is worth today, the lower the chance a customer buys it.
    if ratio <= 1:
        chance = 0.70 + (1 - ratio) * 0.55
    else:
        chance = 0.70 - (ratio - 1) * 0.80
    return max(0.02, min(0.97, chance))


class Game:
    def __init__(self, root):
        self.root = root
        root.title("Berry Lane Market")
        root.resizable(False, False)
        self.c = tk.Canvas(root, width=W, height=H, highlightthickness=0, bg="#8fd16a")
        self.c.pack()
        self.keys = set()
        root.bind("<KeyPress>", self.key_down)
        root.bind("<KeyRelease>", self.key_up)
        self.c.focus_set()

        # scenery that never changes
        rnd = random.Random(7)
        self.tufts = [(rnd.randint(0, W), rnd.randint(225, H)) for _ in range(70)]
        self.flowers = [(rnd.randint(10, W - 10), rnd.randint(235, H - 10),
                         rnd.choice(["#ffffff", "#ff8fab", "#ffd166", "#c9a0ff"])) for _ in range(45)]
        self.flowers = [f for f in self.flowers if not (400 < f[0] < 560 and f[1] < 540)
                        and not (640 < f[0] < 880 and f[1] > 480)]
        self.trees = [(30, 300), (930, 300), (245, 330), (715, 330), (40, 470),
                      (925, 455), (235, 610), (580, 615), (385, 600)]
        self.bush_spots = [(70, 250), (890, 250), (310, 520), (130, 580)]
        self.obstacles = [(x - 58, STALL_Y - 40, x + 58, STALL_Y + 6) for x in STALL_X]
        self.obstacles += [(65, 335, 195, 392), (775, 335, 885, 392),     # tent, shed
                           (655, 500, 865, 590), (428, 408, 532, 456)]   # pond, your cart
        self.obstacles += [(x - 12, y - 14, x + 12, y + 3) for x, y in self.trees + self.bush_spots]

        self.t = 0
        self.panel = None
        self.toast = ("", 0)
        self.new_game()
        self.title_panel()
        self.tick()

    # ------------------------------------------------------------ state

    def new_game(self):
        self.day = 0
        self.cash = START_CASH
        self.rep = 10.0
        self.inv = {b: [] for b in BERRIES}        # berry -> list of [punnets, days left]
        self.prices = {}
        self.up = {u["key"]: 0 for u in UPGRADES}
        self.next_event = EVENTS[0]
        self.event = EVENTS[0]
        self.best_day = 0.0
        self.rotted = 0
        self.px, self.py, self.face = 480.0, 300.0, 1
        self.walking = False
        self.phase = "morning"
        self.night = False
        self.sell = None
        self.value = {b: BERRIES[b][0] for b in BERRIES}
        self.offers = [{"stock": {}, "haggled": False} for _ in STALLS]
        self.bushes = [None] * len(self.bush_spots)
        self.wanderers = []

    def stock(self, berry):
        return sum(b[0] for b in self.inv[berry])

    def total(self):
        return sum(self.stock(b) for b in BERRIES)

    def capacity(self):
        return 30 + 20 * self.up["cart"]

    def space(self):
        return self.capacity() - self.total()

    def add(self, berry, qty, life):
        self.inv[berry].append([qty, max(1, life + self.up["cooler"])])
        self.inv[berry].sort(key=lambda b: b[1])        # oldest sells first

    def remove(self, berry, qty):
        for batch in self.inv[berry]:
            take = min(batch[0], qty)
            batch[0] -= take
            qty -= take
        self.inv[berry] = [b for b in self.inv[berry] if b[0] > 0]

    def pay(self, amount):
        self.cash = round(self.cash - amount, 2)

    def say(self, text):
        self.toast = (text, 110)

    # ------------------------------------------------------------ days

    def start_day(self):
        self.day += 1
        self.event = self.next_event
        self.next_event = EVENTS[0] if random.random() < 0.35 else random.choice(EVENTS[1:])
        self.value = {}
        for berry, info in BERRIES.items():
            self.value[berry] = round(info[0] * random.uniform(0.8, 1.25) * self.event["prices"].get(berry, 1.0), 2)
        self.offers = []
        for stall in STALLS:
            pool = stall["berries"] or list(BERRIES)
            stock = {}
            for berry in random.sample(pool, random.randint(3, 4)):
                price = BERRIES[berry][0] * stall["mult"] * random.uniform(0.85, 1.15)
                price *= 1 + (self.event["prices"].get(berry, 1.0) - 1) * 0.4
                stock[berry] = {"price": round(price, 2), "qty": random.randint(6, 20)}
            self.offers.append({"stock": stock, "haggled": False})
        self.bushes = [random.choice(WILD) for _ in self.bush_spots]
        self.auction_done = False
        self.tip_bought = False
        self.phase = "morning"
        self.night = False
        self.sell = None
        self.px, self.py, self.face = 480.0, 300.0, 1
        self.wanderers = [self.make_critter(random.randint(60, 900), random.randint(240, 600)) for _ in range(4)]
        for w in self.wanderers:
            w["tx"], w["ty"] = w["x"], w["y"]

        def build(p):
            p["lines"] = [self.event["text"], "",
                          "Coins: {}     Cart: {}/{} punnets".format(money(self.cash), self.total(), self.capacity())]
            p["rows"] = [("Off to market!", "", None)]
        self.open_panel("Day {} of {}:  {}".format(self.day, DAYS, self.event["name"]),
                        build, lambda a, i: self.close_panel() if a == "enter" else None)

    def make_critter(self, x, y):
        return {"x": float(x), "y": float(y), "tx": x, "ty": y, "fur": random.choice(FURS),
                "shirt": random.choice(SHIRTS), "ears": random.choice(["round", "pointy", "long"]),
                "state": "in", "timer": 0, "bubble": "", "good": True, "face": 1}

    # ------------------------------------------------------------ panels

    def open_panel(self, title, build, on, esc=True, hint="Up/Down pick    Enter choose    Esc close"):
        self.panel = {"title": title, "build": build, "on": on, "esc": esc, "sel": 0,
                      "rows": [], "lines": [], "hint": hint}
        build(self.panel)

    def close_panel(self):
        self.panel = None

    def title_panel(self):
        def build(p):
            p["lines"] = ["Welcome to Berry Lane! You've got {} and {} days to become the".format(money(START_CASH), DAYS),
                          "richest berry seller in the square.", "",
                          "Walk with the ARROW KEYS or WASD. Press E next to things.",
                          "Buy berries at the five stalls along the top, bid at the red",
                          "auction tent, and shake the wild bushes for free ones.",
                          "Then walk to YOUR cart in the middle and open it.", "",
                          "The dearer your prices, the fewer critters buy. Berries rot!"]
            p["rows"] = [("Start the season", "", None)]

        def on(action, i):
            if action == "enter":
                self.close_panel()
                self.start_day()
        self.open_panel("BERRY LANE MARKET", build, on, esc=False, hint="Press Enter")

    def stall_panel(self, index):
        stall, offer = STALLS[index], self.offers[index]
        note = [stall["blurb"]]

        def build(p):
            p["lines"] = [note[0], "Coins: {}     Cart space: {}".format(money(self.cash), self.space())]
            p["rows"] = []
            for berry, item in offer["stock"].items():
                p["rows"].append(("{}  ({} left)".format(berry, item["qty"]),
                                  "{}   sells for ~{}".format(money(item["price"]), money(self.value[berry])),
                                  BERRIES[berry][3]))
            p["rows"].append(("Haggle with " + stall["owner"], "", None))
            p["rows"].append(("Leave", "", None))

        def on(action, i):
            names = list(offer["stock"])
            if i < len(names):
                if action not in ("enter", "right"):
                    return
                berry = names[i]
                item = offer["stock"][berry]
                qty = min(1 if action == "enter" else 5, item["qty"], self.space(),
                          int(self.cash / item["price"] + 1e-9))
                if qty <= 0:
                    note[0] = "You can't buy that. (No coins, no cart space, or none left.)"
                    return
                self.pay(qty * item["price"])
                item["qty"] -= qty
                life = BERRIES[berry][1]
                note[0] = "Bought {} {} for {}.".format(qty, berry, money(qty * item["price"]))
                if stall["fresh"] == "gamble":
                    if random.random() < 0.35:
                        life = 1
                        note[0] += " Hmm. They feel a bit soft..."
                    else:
                        life -= 1
                else:
                    life += stall["fresh"]
                self.add(berry, qty, life)
            elif i == len(names) and action == "enter":
                if offer["haggled"]:
                    note[0] = "{} folds their arms. 'We already did this today.'".format(stall["owner"])
                    return
                offer["haggled"] = True
                if random.random() < 0.45 + 0.15 * self.up["charm"] + self.rep / 400:
                    note[0] = "{} sighs. 'Fine. 15% off, just for today.'".format(stall["owner"])
                    change = 0.85
                else:
                    note[0] = "{} is offended! Prices just went UP 10%.".format(stall["owner"])
                    change = 1.10
                for item in offer["stock"].values():
                    item["price"] = round(item["price"] * change, 2)
            elif i == len(names) + 1 and action == "enter":
                self.close_panel()
        self.open_panel(stall["name"], build, on,
                        hint="Enter buy 1    Right arrow buy 5    Esc leave")

    def cart_panel(self):
        def build(p):
            p["lines"] = ["Coins: {}     Reputation: {}/100     Space: {}/{}".format(
                money(self.cash), int(self.rep), self.total(), self.capacity())]
            p["rows"] = []
            for berry in BERRIES:
                for qty, days in self.inv[berry]:
                    warn = "LAST DAY!" if days == 1 else "{} days left".format(days)
                    p["rows"].append(("{}  x{}".format(berry, qty), warn, BERRIES[berry][3]))
            if not p["rows"]:
                p["lines"].append("Empty. Not even a single berry.")
            p["rows"].append(("Close", "", None))

        def on(action, i):
            if action == "enter":
                self.close_panel()
        self.open_panel("Your Cart", build, on)

    def upgrade_panel(self):
        note = ["Hank the beaver wipes his paws. 'What'll it be?'"]

        def build(p):
            p["lines"] = [note[0], "Coins: " + money(self.cash)]
            p["rows"] = []
            for u in UPGRADES:
                level = self.up[u["key"]]
                tag = "MAXED" if level >= u["max"] else money(u["cost"] * (level + 1))
                p["rows"].append(("{}  (level {}/{})".format(u["name"], level, u["max"]),
                                  "{}   {}".format(u["desc"], tag), None))
            p["rows"].append(("Leave", "", None))

        def on(action, i):
            if action != "enter":
                return
            if i == len(UPGRADES):
                self.close_panel()
                return
            u = UPGRADES[i]
            level = self.up[u["key"]]
            cost = u["cost"] * (level + 1)
            if level >= u["max"]:
                note[0] = "'Can't make it any better than that.'"
            elif self.cash < cost:
                note[0] = "'Come back when you're richer, kid.'"
            else:
                self.pay(cost)
                self.up[u["key"]] += 1
                note[0] = "Upgraded! {} is now level {}.".format(u["name"], level + 1)
        self.open_panel("Hank's Workshop", build, on)

    def gossip_panel(self):
        note = ["Old Croak the frog blinks slowly. 'Three coins and I'll tell you about tomorrow.'"]

        def build(p):
            p["lines"] = [note[0], "Coins: " + money(self.cash)]
            p["rows"] = [("Pay $3 for a tip", "", None), ("Leave", "", None)]

        def on(action, i):
            if action != "enter":
                return
            if i == 1:
                self.close_panel()
            elif self.tip_bought:
                note[0] = "'I already told you everything I know. Ribbit.'"
            elif self.cash < 3:
                note[0] = "'No coins, no gossip.'"
            else:
                self.pay(3)
                self.tip_bought = True
                # Croak is right most of the time. Most of the time.
                event = self.next_event if random.random() < 0.8 else random.choice(EVENTS)
                note[0] = "Croak whispers: 'I reckon {}.'".format(event["hint"])
        self.open_panel("Old Croak", build, on)

    # ------------------------------------------------------------ auction

    def auction_panel(self):
        if self.auction_done:
            self.say("The auction tent is closed until tomorrow.")
            return
        self.auction_done = True
        lots = []
        for _ in range(2):
            berry = random.choice(list(BERRIES))
            lots.append((berry, random.randint(6, 16), False))
        lots.append((random.choice(["Cloudberry", "Acai Berry", "Thimbleberry", "Goji Berry", "Honeyberry",
                                    "Huckleberry", "Strawberry", "Chokeberry", "Cranberry"]),
                     random.randint(8, 16), True))
        a = {"lots": lots, "n": -1, "log": [], "over": True}

        def next_lot():
            a["n"] += 1
            berry, qty, mystery = lots[a["n"]]
            a["fair"] = qty * self.value[berry] * 0.6
            spread = (0.4, 1.5) if mystery else (0.55, 1.2)
            a["bidders"] = {n: a["fair"] * random.uniform(*spread)
                            for n in random.sample(RIVALS, random.randint(2, 3))}
            a["step"] = max(1, round(a["fair"] * 0.08))
            a["price"] = max(1, round(a["fair"] * 0.3))
            a["leader"] = None
            a["over"] = False
            if mystery:
                a["log"] = ["LOT 3: a MYSTERY CRATE. About {} punnets. It smells... interesting.".format(qty)]
            else:
                a["log"] = ["LOT {}: {} punnets of {}. Customers would pay about {}.".format(
                    a["n"] + 1, qty, berry, money(qty * self.value[berry]))]

        def win():
            berry, qty, mystery = lots[a["n"]]
            a["over"] = True
            self.pay(a["price"])
            a["log"].append("Going once... twice... SOLD to you for {}!".format(money(a["price"])))
            life = BERRIES[berry][1]
            if mystery:
                a["log"].append("You open the crate: {} punnets of {}!".format(qty, berry))
                if random.random() < 0.25:
                    qty, life = qty // 2, 1
                    a["log"].append("Ugh. Half are mouldy. You keep {}.".format(qty))
            if qty > self.space():
                extra = qty - self.space()
                back = round(extra * self.value[berry] * 0.4, 2)
                self.cash = round(self.cash + back, 2)
                a["log"].append("Cart full! You sell {} spare to a rival for {}.".format(extra, money(back)))
                qty -= extra
            if qty > 0:
                self.add(berry, qty, life)

        def build(p):
            p["lines"] = a["log"][-5:] + ["", "Coins: {}     Cart space: {}".format(money(self.cash), self.space())]
            if not a["over"]:
                bid = a["price"] if a["leader"] is None else a["price"] + a["step"]
                p["rows"] = [("Bid " + money(bid), "", None), ("Pass", "", None)]
            elif a["n"] < len(lots) - 1:
                p["rows"] = [("Next lot", "", None)]
            else:
                p["rows"] = [("Leave the tent", "", None)]
            p["sel"] = min(p["sel"], len(p["rows"]) - 1)

        def on(action, i):
            if action != "enter":
                return
            if a["over"]:
                if a["n"] < len(lots) - 1:
                    next_lot()
                else:
                    self.close_panel()
                return
            if i == 0:
                bid = a["price"] if a["leader"] is None else a["price"] + a["step"]
                if self.cash < bid:
                    a["log"].append("You can't afford {}.".format(money(bid)))
                    return
                a["price"], a["leader"] = bid, "you"
                a["log"].append("You bid {}.".format(money(bid)))
                keen = [n for n, limit in a["bidders"].items() if limit >= a["price"] + a["step"]]
                if keen and random.random() < 0.85:
                    a["leader"] = random.choice(keen)
                    a["price"] += a["step"]
                    a["log"].append("{} bids {}!".format(a["leader"], money(a["price"])))
                else:
                    win()
            else:
                if a["leader"] is None:
                    keen = [n for n, limit in a["bidders"].items() if limit >= a["price"]]
                    a["leader"] = random.choice(keen) if keen else None
                if a["leader"]:
                    a["log"].append("SOLD to {} for {}.".format(a["leader"], money(a["price"])))
                else:
                    a["log"].append("Nobody wants it. The crate is wheeled away.")
                a["over"] = True

        next_lot()
        self.open_panel("The Auction Tent", build, on, esc=False, hint="Up/Down pick    Enter choose")

    # ------------------------------------------------------------ selling

    def expected_crowd(self):
        stocked = [b for b in BERRIES if self.stock(b) > 0]
        ratios = [self.prices[b] / self.value[b] for b in stocked]
        average = sum(ratios) / len(ratios)
        # A stall with higher AVERAGE prices pulls fewer visitors.
        pull = max(0.35, min(1.4, 1.7 - 0.7 * average))
        crowd = (12 + 6 * self.up["sign"] + self.rep / 4) * self.event["crowd"] * pull
        return average, max(2, int(crowd))

    def price_panel(self):
        if self.phase != "morning":
            return
        stocked = [b for b in BERRIES if self.stock(b) > 0]
        if not stocked:
            def build(p):
                p["lines"] = ["Your cart is empty! Buy berries at a stall, win a crate at the",
                              "auction tent, or shake a wild bush first."]
                p["rows"] = [("Keep shopping", "", None), ("Give up on today", "", None)]

            def on(action, i):
                if action == "enter":
                    self.close_panel()
                    if i == 1:
                        self.summary_panel({}, {}, 0, False)
            self.open_panel("Your Cart", build, on)
            return
        for berry in stocked:
            if berry not in self.prices:
                self.prices[berry] = max(0.25, round(self.value[berry] * 4) / 4)

        def build(p):
            average, crowd = self.expected_crowd()
            p["lines"] = ["Left/Right changes a price. Dear stalls scare critters away.",
                          "Right now your stall looks {}. About {} visitors expected.".format(verdict(average), crowd)]
            p["rows"] = []
            for berry in stocked:
                ratio = self.prices[berry] / self.value[berry]
                p["rows"].append(("{} x{}  (worth {})".format(berry, self.stock(berry), money(self.value[berry])),
                                  "<  {}  >   {}".format(money(self.prices[berry]), verdict(ratio)),
                                  BERRIES[berry][3]))
            p["rows"].append(("OPEN THE STALL!", "", None))

        def on(action, i):
            if i < len(stocked):
                if action == "left":
                    self.prices[stocked[i]] = max(0.25, self.prices[stocked[i]] - 0.25)
                elif action == "right":
                    self.prices[stocked[i]] = min(99.0, self.prices[stocked[i]] + 0.25)
            elif action == "enter":
                self.close_panel()
                self.begin_selling(stocked)
        self.open_panel("Set Your Prices", build, on,
                        hint="Up/Down pick    Left/Right change price    Esc back")
        self.panel["sel"] = len(stocked)

    def begin_selling(self, stocked):
        crowd = int(self.expected_crowd()[1] * random.uniform(0.85, 1.15)) + 1
        self.phase = "selling"
        self.px, self.py, self.face = 480.0, 410.0, 1
        self.wanderers = []
        self.sell = {"left": crowd, "spawn": 20, "customers": [], "stocked": stocked, "fast": False,
                     "sold": {b: 0 for b in stocked}, "earned": {b: 0.0 for b in stocked},
                     "walked": 0, "sold_out": False}

    def serve(self):
        s = self.sell
        available = [b for b in s["stocked"] if self.stock(b) > 0]
        if not available:
            s["walked"] += 1
            s["sold_out"] = True
            return "Sold out? Aww.", False
        text = ""
        for attempt in range(2):          # they might look at a second berry
            weights = [BERRIES[b][2] * self.event["prices"].get(b, 1.0) for b in available]
            berry = random.choices(available, weights=weights)[0]
            ratio = self.prices[berry] / self.value[berry]
            if random.random() < sell_chance(ratio) + (self.rep - 10) / 400:
                qty = min(1 if BERRIES[berry][0] >= 10 else random.randint(1, 3), self.stock(berry))
                self.remove(berry, qty)
                takings = round(qty * self.prices[berry], 2)
                self.cash = round(self.cash + takings, 2)
                s["sold"][berry] += qty
                s["earned"][berry] += takings
                if ratio <= 1.1:
                    self.rep = min(100, self.rep + 0.25)
                return "♥ {} x{}  +{}".format(berry, qty, money(takings)), True
            if ratio > 1.5:
                self.rep = max(0, self.rep - 0.4)
                text = "{} for {}?! Robbery!".format(money(self.prices[berry]), berry)
            else:
                text = random.choice(["Hmm, no thanks.", "Bit dear for me.", "Maybe tomorrow."])
            if random.random() < 0.6:
                break
        s["walked"] += 1
        return text, False

    def update_selling(self):
        s = self.sell
        for _ in range(4 if s["fast"] else 1):
            s["spawn"] -= 1
            if s["left"] > 0 and s["spawn"] <= 0:
                s["left"] -= 1
                s["spawn"] = random.randint(10, 20)
                side = random.choice(["left", "right", "bottom"])
                x, y = {"left": (-20, random.randint(470, 600)), "right": (W + 20, random.randint(470, 600)),
                        "bottom": (random.randint(250, 640), H + 30)}[side]
                critter = self.make_critter(x, y)
                critter["tx"] = 480 + random.randint(-75, 75)
                critter["ty"] = 478 + random.randint(0, 34)
                s["customers"].append(critter)
            for c in s["customers"]:
                if c["state"] == "wait":
                    c["timer"] -= 1
                    if c["timer"] <= 0:
                        c["state"] = "out"
                        c["tx"] = random.choice([-40, W + 40])
                        c["ty"] = random.randint(480, 610)
                elif self.step_towards(c, 3.2):
                    if c["state"] == "in":
                        c["state"], c["timer"] = "wait", 38
                        c["bubble"], c["good"] = self.serve()
                    else:
                        c["state"] = "gone"
            s["customers"] = [c for c in s["customers"] if c["state"] != "gone"]
            if s["left"] == 0 and not s["customers"]:
                self.summary_panel(s["sold"], s["earned"], s["walked"], s["sold_out"])
                self.sell = None
                return

    def step_towards(self, c, speed):
        dx, dy = c["tx"] - c["x"], c["ty"] - c["y"]
        dist = (dx * dx + dy * dy) ** 0.5
        if dist <= speed:
            c["x"], c["y"] = float(c["tx"]), float(c["ty"])
            return True
        c["x"] += dx / dist * speed
        c["y"] += dy / dist * speed
        if abs(dx) > 1:
            c["face"] = 1 if dx > 0 else -1
        return False

    def summary_panel(self, sold, earned, walked, sold_out):
        self.phase = "evening"
        total = sum(earned.values())
        self.best_day = max(self.best_day, total)

        def build(p):
            p["lines"] = []
            ranked = sorted(sold, key=lambda b: -earned[b])
            for berry in ranked[:7]:
                p["lines"].append("{}:  sold {} for {}   ({} left)".format(
                    berry, sold[berry], money(earned[berry]), self.stock(berry)))
            if len(ranked) > 7:
                p["lines"].append("...and {} other kinds.".format(len(ranked) - 7))
            if sold_out:
                p["lines"].append("You SOLD OUT! Latecomers left with empty paws.")
            p["lines"] += ["", "Takings today: {}     Left without buying: {}".format(money(total), walked),
                           "Coins: " + money(self.cash)]
            p["rows"] = [("Pack up for the night", "", None)]

        def on(action, i):
            if action == "enter":
                self.night_panel()
        self.open_panel("Closing Time", build, on, esc=False, hint="Press Enter")

    def night_panel(self):
        self.night = True
        lines = []
        fee = 4 + self.day // 3
        self.pay(fee)
        lines.append("The market warden collects the {} pitch fee.".format(money(fee)))
        rotted = 0
        for berry in BERRIES:
            for batch in self.inv[berry]:
                batch[1] -= 1
                if batch[1] <= 0:
                    rotted += batch[0]
            self.inv[berry] = [b for b in self.inv[berry] if b[1] > 0]
        if rotted:
            self.rotted += rotted
            lines.append("{} punnets went mouldy overnight. Into the compost.".format(rotted))
        stocked = [b for b in BERRIES if self.stock(b) > 0]
        if stocked and random.random() < 0.12:
            berry = random.choice(stocked)
            eaten = min(self.stock(berry), random.randint(1, 3))
            self.remove(berry, eaten)
            lines.append("A cheeky magpie pinched {} {} from your cart!".format(eaten, berry))
        lines += ["", "You end day {} with {}.".format(self.day, money(self.cash))]

        def build(p):
            p["lines"] = lines
            p["rows"] = [("Sleep" if self.day < DAYS else "See how you did", "", None)]

        def on(action, i):
            if action == "enter":
                self.close_panel()
                if self.day < DAYS:
                    self.start_day()
                else:
                    self.ending_panel()
        self.open_panel("Night Falls on Berry Lane", build, on, esc=False, hint="Press Enter")

    def ending_panel(self):
        leftovers = round(sum(self.stock(b) * self.value[b] * 0.3 for b in BERRIES), 2)
        self.cash = round(self.cash + leftovers, 2)
        cash = self.cash
        if cash >= 1500:
            title = "BERRY EMPEROR. They're naming a jam after you."
        elif cash >= 800:
            title = "BERRY TYCOON. Hazel asks YOU for advice now."
        elif cash >= 400:
            title = "MARKET HOTSHOT. The other stalls are nervous."
        elif cash >= 150:
            title = "SOLID TRADER. Your cart has all four wheels."
        elif cash >= START_CASH:
            title = "SURVIVOR. You made it out with your shirt."
        else:
            title = "BERRY FLOP. The magpie did better than you."
        lines = []
        if leftovers:
            lines.append("The jam factory buys your leftovers for {}.".format(money(leftovers)))
        lines += ["Final coins:  " + money(cash), "Profit:  " + money(cash - START_CASH),
                  "Best day:  " + money(self.best_day), "Punnets wasted:  {}".format(self.rotted),
                  "Reputation:  {}/100".format(int(self.rep)), "", "Your title:  " + title]

        def build(p):
            p["lines"] = lines
            p["rows"] = [("Play again", "", None), ("Quit", "", None)]

        def on(action, i):
            if action == "enter":
                if i == 0:
                    self.new_game()
                    self.close_panel()
                    self.start_day()
                else:
                    self.root.destroy()
        self.open_panel("The Season Is Over", build, on, esc=False)

    # ------------------------------------------------------------ input

    def key_down(self, event):
        k = event.keysym.lower()
        self.keys.add(k)
        p = self.panel
        if p:
            action = {"up": "up", "w": "up", "down": "down", "s": "down", "left": "left", "a": "left",
                      "right": "right", "d": "right", "return": "enter", "space": "enter", "e": "enter",
                      "kp_enter": "enter", "escape": "esc"}.get(k)
            if action == "up":
                p["sel"] = (p["sel"] - 1) % len(p["rows"])
            elif action == "down":
                p["sel"] = (p["sel"] + 1) % len(p["rows"])
            elif action == "esc":
                if p["esc"]:
                    self.close_panel()
            elif action:
                p["on"](action, p["sel"])
                if self.panel is p:
                    p["build"](p)
                    p["sel"] = min(p["sel"], len(p["rows"]) - 1)
            return
        if self.phase == "selling":
            if k == "space" and self.sell:
                self.sell["fast"] = not self.sell["fast"]
            return
        if k in ("e", "space", "return"):
            spot = self.nearest()
            if spot:
                spot[3]()
        elif k == "i":
            self.cart_panel()

    def key_up(self, event):
        self.keys.discard(event.keysym.lower())

    def spots(self):
        found = [(x, STALL_Y + 34, STALLS[i]["name"], lambda i=i: self.stall_panel(i))
                 for i, x in enumerate(STALL_X)]
        found.append((130, 415, "Auction Tent", self.auction_panel))
        found.append((830, 415, "Hank's Workshop", self.upgrade_panel))
        found.append((625, 548, "Old Croak", self.gossip_panel))
        found.append((480, 478, "Your cart: set prices and open", self.price_panel))
        for i, (x, y) in enumerate(self.bush_spots):
            if self.bushes[i]:
                found.append((x, y + 18, "Shake the bush", lambda i=i: self.forage(i)))
        return found

    def nearest(self):
        best, best_d = None, 62 ** 2
        for spot in self.spots():
            d = (spot[0] - self.px) ** 2 + (spot[1] - self.py) ** 2
            if d < best_d:
                best, best_d = spot, d
        return best

    def forage(self, i):
        berry = self.bushes[i]
        qty = min(random.randint(1, 3), self.space())
        if qty <= 0:
            self.say("Your cart is full!")
            return
        self.bushes[i] = None
        self.add(berry, qty, BERRIES[berry][1])
        self.say("Rustle rustle... you picked {} punnets of wild {}!".format(qty, berry))

    def blocked(self, x, y):
        if not (22 < x < W - 22 and 150 < y < H - 8):
            return True
        return any(x1 < x < x2 and y1 < y < y2 for x1, y1, x2, y2 in self.obstacles)

    # ------------------------------------------------------------ loop

    def tick(self):
        self.t += 1
        if not self.panel:
            if self.phase == "morning":
                dx = ("right" in self.keys or "d" in self.keys) - ("left" in self.keys or "a" in self.keys)
                dy = ("down" in self.keys or "s" in self.keys) - ("up" in self.keys or "w" in self.keys)
                speed = 4.2 if not (dx and dy) else 3.0
                self.walking = bool(dx or dy)
                if dx:
                    self.face = dx
                    if not self.blocked(self.px + dx * speed, self.py):
                        self.px += dx * speed
                if dy and not self.blocked(self.px, self.py + dy * speed):
                    self.py += dy * speed
            elif self.phase == "selling" and self.sell:
                self.walking = False
                self.update_selling()
        if self.phase == "morning":
            for w in self.wanderers:
                if self.step_towards(w, 1.2) and random.random() < 0.02:
                    w["tx"], w["ty"] = random.randint(40, 920), random.randint(235, 610)
        if self.toast[1] > 0:
            self.toast = (self.toast[0], self.toast[1] - 1)
        self.draw()
        self.root.after(33, self.tick)

    # ------------------------------------------------------------ drawing

    def rrect(self, x1, y1, x2, y2, r, **kw):
        pts = [x1 + r, y1, x2 - r, y1, x2, y1, x2, y1 + r, x2, y2 - r, x2, y2,
               x2 - r, y2, x1 + r, y2, x1, y2, x1, y2 - r, x1, y1 + r, x1, y1]
        return self.c.create_polygon(pts, smooth=True, **kw)

    def critter(self, x, y, fur, shirt, ears, moving=False, face=1, hair=None):
        c = self.c
        bob = 2 if moving and (self.t // 5) % 2 else 0
        y -= bob
        c.create_oval(x - 13, y - 4 + bob, x + 13, y + 5 + bob, fill="#5a9a48", outline="")
        if moving:
            swing = 4 if (self.t // 5) % 2 else -4
            c.create_oval(x - 9 + swing, y - 6, x - 1 + swing, y + 2, fill="#5b4636", outline="")
            c.create_oval(x + 1 - swing, y - 6, x + 9 - swing, y + 2, fill="#5b4636", outline="")
        else:
            c.create_oval(x - 9, y - 5, x - 1, y + 2, fill="#5b4636", outline="")
            c.create_oval(x + 1, y - 5, x + 9, y + 2, fill="#5b4636", outline="")
        c.create_oval(x - 11, y - 25, x + 11, y - 2, fill=shirt, outline="#3b3b3b")
        if ears == "round":
            c.create_oval(x - 17, y - 52, x - 5, y - 40, fill=fur, outline="#3b3b3b")
            c.create_oval(x + 5, y - 52, x + 17, y - 40, fill=fur, outline="#3b3b3b")
        elif ears == "pointy":
            c.create_polygon(x - 15, y - 40, x - 12, y - 58, x - 3, y - 45, fill=fur, outline="#3b3b3b")
            c.create_polygon(x + 15, y - 40, x + 12, y - 58, x + 3, y - 45, fill=fur, outline="#3b3b3b")
        elif ears == "long":
            c.create_oval(x - 13, y - 68, x - 5, y - 40, fill=fur, outline="#3b3b3b")
            c.create_oval(x + 5, y - 68, x + 13, y - 40, fill=fur, outline="#3b3b3b")
        c.create_oval(x - 16, y - 50, x + 16, y - 20, fill=fur, outline="#3b3b3b")
        if hair:
            c.create_arc(x - 16, y - 52, x + 16, y - 24, start=0, extent=180, fill=hair, outline="#3b3b3b")
        ex = 3 * face
        c.create_oval(x - 8 + ex, y - 38, x - 4 + ex, y - 32, fill="#222222", outline="")
        c.create_oval(x + 4 + ex, y - 38, x + 8 + ex, y - 32, fill="#222222", outline="")
        c.create_oval(x - 13 + ex, y - 31, x - 8 + ex, y - 27, fill="#ff9aa8", outline="")
        c.create_oval(x + 8 + ex, y - 31, x + 13 + ex, y - 27, fill="#ff9aa8", outline="")
        if not hair:
            c.create_oval(x - 2 + ex, y - 32, x + 2 + ex, y - 29, fill="#4a3728", outline="")

    def punnet(self, x, y, colour):
        c = self.c
        c.create_polygon(x - 9, y - 2, x + 9, y - 2, x + 7, y + 7, x - 7, y + 7, fill="#f3e3c3", outline="#9c7a4d")
        for dx, dy in ((-5, -4), (0, -6), (5, -4), (-2, -1), (3, -1)):
            c.create_oval(x + dx - 3, y + dy - 3, x + dx + 3, y + dy + 3, fill=colour, outline="")

    def awning(self, x, y, width, colour):
        c = self.c
        n = width // 20
        for j in range(n):
            sx = x - width // 2 + j * 20
            fill = colour if j % 2 == 0 else "#fff7e8"
            c.create_rectangle(sx, y, sx + 20, y + 20, fill=fill, outline="")
            c.create_oval(sx, y + 12, sx + 20, y + 28, fill=fill, outline="")
        c.create_line(x - width // 2, y, x + width // 2, y, fill="#6b4a2b", width=3)

    def draw_stall(self, i):
        c = self.c
        x, y = STALL_X[i], STALL_Y
        stall = STALLS[i]
        c.create_rectangle(x - 57, y - 80, x - 51, y, fill="#8a5a33", outline="")
        c.create_rectangle(x + 51, y - 80, x + 57, y, fill="#8a5a33", outline="")
        self.critter(x, y - 4, stall["fur"], stall["awning"], stall["ears"])
        self.rrect(x - 60, y - 30, x + 60, y + 6, 8, fill="#c98b4f", outline="#6b4a2b")
        c.create_rectangle(x - 58, y - 30, x + 58, y - 24, fill="#e3b074", outline="")
        for j, berry in enumerate(self.offers[i]["stock"]):
            self.punnet(x - 39 + j * 26, y - 34, BERRIES[berry][3])
        self.awning(x, y - 84, 120, stall["awning"])
        c.create_text(x, y - 10, text=stall["name"], font=(FONT, 8, "bold"), fill="#fff7e8")

    def draw_tent(self):
        c = self.c
        x, y = 130, 392
        c.create_polygon(x - 72, y, x, y - 105, x + 72, y, fill="#e2574c", outline="#7a2a25", width=2)
        c.create_polygon(x - 36, y, x, y - 105, x - 12, y, fill="#fff7e8", outline="")
        c.create_polygon(x + 36, y, x, y - 105, x + 12, y, fill="#fff7e8", outline="")
        c.create_polygon(x - 14, y, x, y - 46, x + 14, y, fill="#5a2a25", outline="")
        c.create_line(x, y - 105, x, y - 128, fill="#6b4a2b", width=3)
        c.create_polygon(x, y - 128, x + 24, y - 121, x, y - 114, fill="#f2b134", outline="")
        self.rrect(x - 40, y - 72, x + 40, y - 54, 6, fill="#fff7e8", outline="#7a2a25")
        c.create_text(x, y - 63, text="AUCTION", font=(FONT, 9, "bold"), fill="#7a2a25")

    def draw_shed(self):
        c = self.c
        x, y = 830, 392
        c.create_rectangle(x - 52, y - 58, x + 52, y, fill="#f0dcb4", outline="#6b4a2b", width=2)
        c.create_polygon(x - 64, y - 56, x, y - 104, x + 64, y - 56, fill="#4aa3df", outline="#2b5f85", width=2)
        c.create_rectangle(x - 12, y - 36, x + 12, y, fill="#8a5a33", outline="#6b4a2b")
        c.create_rectangle(x + 22, y - 42, x + 42, y - 24, fill="#bfe6ff", outline="#6b4a2b")
        c.create_text(x, y - 68, text="HANK'S", font=(FONT, 9, "bold"), fill="#ffffff")
        c.create_line(x - 44, y - 30, x - 24, y - 14, fill="#777777", width=4)
        c.create_rectangle(x - 50, y - 38, x - 38, y - 28, fill="#999999", outline="")

    def draw_cart(self):
        c = self.c
        x, y = 480, 452
        c.create_rectangle(x - 50, y - 96, x - 45, y - 30, fill="#8a5a33", outline="")
        c.create_rectangle(x + 45, y - 96, x + 50, y - 30, fill="#8a5a33", outline="")
        self.rrect(x - 54, y - 38, x + 54, y - 4, 8, fill="#d9a066", outline="#6b4a2b")
        c.create_rectangle(x - 52, y - 38, x + 52, y - 32, fill="#f0c38e", outline="")
        for wx in (x - 34, x + 34):
            c.create_oval(wx - 13, y - 14, wx + 13, y + 12, fill="#6b4a2b", outline="#3b2a1a", width=2)
            c.create_oval(wx - 4, y - 5, wx + 4, y + 3, fill="#d9a066", outline="")
        stocked = [b for b in BERRIES if self.stock(b) > 0]
        for j, berry in enumerate(stocked[:5]):
            self.punnet(x - 42 + j * 21, y - 43, BERRIES[berry][3])
        self.awning(x, y - 100, 100, "#59b36b")
        c.create_text(x, y - 20, text="YOUR STALL", font=(FONT, 8, "bold"), fill="#fff7e8")

    def draw_tree(self, x, y):
        c = self.c
        c.create_oval(x - 20, y - 5, x + 20, y + 7, fill="#5a9a48", outline="")
        c.create_rectangle(x - 6, y - 30, x + 6, y, fill="#8a5a33", outline="#5a3a1f")
        c.create_oval(x - 30, y - 82, x + 30, y - 22, fill="#3f9b4b", outline="#2b6b34", width=2)
        c.create_oval(x - 20, y - 76, x + 4, y - 52, fill="#57b862", outline="")

    def draw_bush(self, i):
        c = self.c
        x, y = self.bush_spots[i]
        c.create_oval(x - 22, y - 26, x + 22, y + 6, fill="#3f9b4b", outline="#2b6b34", width=2)
        c.create_oval(x - 14, y - 22, x + 2, y - 8, fill="#57b862", outline="")
        if self.bushes[i]:
            colour = BERRIES[self.bushes[i]][3]
            for dx, dy in ((-11, -6), (0, -14), (10, -8), (-3, 0), (8, 1)):
                c.create_oval(x + dx - 4, y + dy - 4, x + dx + 4, y + dy + 4, fill=colour, outline="#ffffff")

    def draw_bubble(self, x, y, text, colour):
        half = 14 + len(text) * 3.6
        x = max(half + 6, min(W - half - 6, x))
        self.rrect(x - half, y - 24, x + half, y, 8, fill="#ffffff", outline="#3b3b3b")
        self.c.create_text(x, y - 12, text=text, font=(FONT, 9, "bold"), fill=colour)

    def draw(self):
        c = self.c
        c.delete("all")
        if self.night:
            c.create_rectangle(0, 0, W, H, fill="#1d2547", outline="")
            rnd = random.Random(3)
            for _ in range(80):
                x, y = rnd.randint(0, W), rnd.randint(0, H)
                r = 1 + ((self.t // 12 + x) % 2)
                c.create_oval(x - r, y - r, x + r, y + r, fill="#fff7c2", outline="")
            c.create_oval(790, 50, 870, 130, fill="#fff3b0", outline="")
            c.create_oval(812, 44, 884, 116, fill="#1d2547", outline="")
        else:
            self.draw_world()
        self.draw_hud()
        if self.panel:
            self.draw_panel()

    def draw_world(self):
        c = self.c
        grass = {"morning": "#8fd16a", "selling": "#a4d468", "evening": "#7fb86a"}[self.phase]
        c.create_rectangle(0, 0, W, H, fill=grass, outline="")
        for x, y in self.tufts:
            c.create_line(x, y, x - 3, y - 6, x, y, x + 3, y - 6, fill="#6fb552", width=2)
        self.rrect(-20, 168, W + 20, 216, 20, fill="#ecd9a6", outline="#d9c28a")
        self.rrect(446, 200, 514, 400, 20, fill="#ecd9a6", outline="")
        c.create_oval(385, 440, 575, 535, fill="#ecd9a6", outline="#d9c28a")
        for x, y, colour in self.flowers:
            c.create_oval(x - 5, y - 5, x + 5, y + 5, fill=colour, outline="")
            c.create_oval(x - 2, y - 2, x + 2, y + 2, fill="#f2b134", outline="")
        # pond
        c.create_oval(650, 492, 870, 596, fill="#d9c28a", outline="")
        c.create_oval(658, 498, 862, 590, fill="#6ec3e8", outline="#4a9cc4", width=2)
        shine = (self.t // 8) % 30
        c.create_line(700 + shine, 525, 730 + shine, 525, fill="#c8ecff", width=3)
        c.create_line(770 - shine, 560, 800 - shine, 560, fill="#c8ecff", width=3)
        c.create_oval(800, 520, 828, 536, fill="#57b862", outline="#2b6b34")
        c.create_oval(712, 556, 736, 570, fill="#57b862", outline="#2b6b34")
        if self.event["name"] == "Lantern Festival":
            for j in range(24):
                x = j * 40 + 20
                c.create_polygon(x - 12, 48, x + 12, 48, x, 68, outline="",
                                 fill=["#e2574c", "#f2b134", "#4aa3df", "#59b36b"][j % 4])

        things = [(STALL_Y, lambda i=i: self.draw_stall(i)) for i in range(5)]
        things += [(392, self.draw_tent), (392, self.draw_shed), (452, self.draw_cart)]
        things += [(y, lambda x=x, y=y: self.draw_tree(x, y)) for x, y in self.trees]
        things += [(y, lambda i=i: self.draw_bush(i)) for i, (x, y) in enumerate(self.bush_spots)]
        things.append((548, lambda: self.critter(625, 548, "#7cc470", "#7cc470", "none")))
        things.append((415, lambda: self.critter(212, 415, "#d6d6d6", "#7a2a25", "long")))
        things.append((415, lambda: self.critter(752, 415, "#9c6b43", "#f2b134", "round")))
        for w in self.wanderers:
            moving = (w["x"], w["y"]) != (w["tx"], w["ty"])
            things.append((w["y"], lambda w=w, m=moving: self.critter(
                w["x"], w["y"], w["fur"], w["shirt"], w["ears"], m, w["face"])))
        customers = self.sell["customers"] if self.sell else []
        for cu in customers:
            things.append((cu["y"], lambda cu=cu: self.critter(
                cu["x"], cu["y"], cu["fur"], cu["shirt"], cu["ears"], cu["state"] != "wait", cu["face"])))
        things.append((self.py, lambda: self.critter(
            self.px, self.py, "#ffd9b3", "#ff8fab", "none", self.walking, self.face, hair="#7a4a2b")))
        for _, fn in sorted(things, key=lambda t: t[0]):
            fn()

        for cu in customers:
            if cu["state"] == "wait":
                self.draw_bubble(cu["x"], cu["y"] - 72, cu["bubble"], "#2e8b3d" if cu["good"] else "#c0392b")
        if self.event["name"] == "Rainy Day":
            rnd = random.Random(self.t)
            for _ in range(70):
                x, y = rnd.randint(0, W), rnd.randint(40, H)
                c.create_line(x, y, x - 4, y + 12, fill="#cfe8ff", width=2)

        if self.phase == "morning" and not self.panel:
            spot = self.nearest()
            if spot:
                self.draw_bubble(self.px, self.py - 74, "[E]  " + spot[2], "#3b3b3b")
        if self.phase == "selling" and self.sell:
            speed = "FAST" if self.sell["fast"] else "normal"
            self.draw_bubble(W / 2, H - 10, "Stall is open!  Space = speed ({})   {} still to come".format(
                speed, self.sell["left"]), "#3b3b3b")
        elif self.toast[1] > 0:
            self.draw_bubble(W / 2, H - 10, self.toast[0], "#3b3b3b")

    def draw_hud(self):
        c = self.c
        self.rrect(8, 6, W - 8, 40, 14, fill="#fff7e8", outline="#6b4a2b", width=2)
        c.create_text(24, 23, anchor="w", font=(FONT, 11, "bold"), fill="#6b4a2b",
                      text="Day {}/{}   {}".format(max(1, self.day), DAYS, self.event["name"]))
        c.create_oval(330, 13, 350, 33, fill="#f2b134", outline="#b07a12", width=2)
        c.create_text(358, 23, anchor="w", font=(FONT, 11, "bold"), fill="#6b4a2b", text=money(self.cash))
        c.create_text(480, 23, anchor="w", font=(FONT, 11, "bold"), fill="#6b4a2b",
                      text="Cart {}/{}".format(self.total(), self.capacity()))
        for j in range(5):
            c.create_text(610 + j * 18, 23, text="♥", font=(FONT, 13),
                          fill="#e2574c" if self.rep >= j * 20 + 1 else "#e0cfb0")
        c.create_text(W - 24, 23, anchor="e", font=(FONT, 9), fill="#8a6a4a",
                      text="Arrows/WASD walk   E use   I cart")

    def draw_panel(self):
        c = self.c
        p = self.panel
        left, right = 150, W - 150
        body = c.create_text(0, 0, anchor="nw", width=right - left - 56, font=(FONT, 11),
                             fill="#5b4636", text="\n".join(p["lines"]))
        box = c.bbox(body)
        text_h = box[3] - box[1] if p["lines"] else 0
        shown = min(8, len(p["rows"]))
        height = 64 + text_h + 14 + shown * 32 + 34
        top = max(46, (H - height) // 2 + 10)
        self.rrect(left + 5, top + 7, right + 5, top + height + 7, 30, fill="#4d7a3d", outline="")
        self.rrect(left, top, right, top + height, 30, fill="#fff7e8", outline="#6b4a2b", width=3)
        self.rrect(left + 40, top - 16, right - 40, top + 22, 18, fill="#59b36b", outline="#2b6b34", width=2)
        c.create_text(W / 2, top + 3, text=p["title"], font=(FONT, 14, "bold"), fill="#ffffff")
        c.coords(body, left + 28, top + 36)
        c.tag_raise(body)

        first = max(0, min(p["sel"] - 3, len(p["rows"]) - shown))
        y = top + 36 + text_h + 14
        for n in range(first, first + shown):
            label, extra, colour = p["rows"][n]
            if n == p["sel"]:
                self.rrect(left + 18, y, right - 18, y + 28, 12, fill="#ffe08a", outline="#e0a83a", width=2)
                c.create_text(left + 30, y + 14, text="▶", font=(FONT, 9), fill="#b07a12")
            tx = left + 46
            if colour:
                c.create_oval(tx, y + 6, tx + 16, y + 22, fill=colour, outline="#3b3b3b")
                tx += 24
            c.create_text(tx, y + 14, anchor="w", text=label, font=(FONT, 11, "bold"), fill="#5b4636")
            c.create_text(right - 30, y + 14, anchor="e", text=extra, font=(FONT, 10), fill="#8a6a4a")
            y += 32
        more = ""
        if first > 0:
            more += "▲ more above   "
        if first + shown < len(p["rows"]):
            more += "▼ more below   "
        c.create_text(W / 2, top + height - 17, text=more + p["hint"], font=(FONT, 9), fill="#a08a6a")


if __name__ == "__main__":
    window = tk.Tk()
    Game(window)
    window.mainloop()
