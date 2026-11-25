# ============================================================
#   FRUIT MARKET TYCOON
#   A text game for Thonny. Just press the green Run button.
#
#   You start with $50 and a wobbly cart. Buy fruit from the
#   wholesale stalls, win crates at the auction house, then
#   set your own prices and sell to the public.
#
#   Remember: the pricier your stall, the fewer people buy.
# ============================================================

import random

DAYS = 15
START_CASH = 50.0

# base  = normal retail price for one fruit
# life  = days before it rots
# pop   = how often customers ask for it
FRUITS = {
    "Apple":       {"base": 2.0,  "life": 5, "pop": 10},
    "Banana":      {"base": 1.5,  "life": 3, "pop": 10},
    "Orange":      {"base": 2.5,  "life": 5, "pop": 8},
    "Strawberry":  {"base": 4.0,  "life": 2, "pop": 7},
    "Mango":       {"base": 5.0,  "life": 3, "pop": 6},
    "Pineapple":   {"base": 6.0,  "life": 4, "pop": 5},
    "Watermelon":  {"base": 8.0,  "life": 4, "pop": 5},
    "Dragonfruit": {"base": 12.0, "life": 3, "pop": 3},
    "Durian":      {"base": 25.0, "life": 3, "pop": 1.5},
}

# mult  = how much of the retail value the stall charges you
# fresh = bonus or penalty to shelf life ("gamble" = Shady Sam special)
STALLS = [
    {"name": "Granny Smith's Orchard", "owner": "Granny Smith",
     "fruits": ["Apple", "Orange", "Strawberry"], "mult": 0.60, "fresh": 0,
     "blurb": "Honest fruit, honest prices, and a suspicious amount of knitting."},
    {"name": "Bargain Barry's Bins", "owner": "Barry",
     "fruits": ["Apple", "Banana", "Orange", "Watermelon"], "mult": 0.48, "fresh": -1,
     "blurb": "Cheap! Cheap! Cheap! (It's yesterday's delivery, so it rots a day sooner.)"},
    {"name": "Tropic Tony's", "owner": "Tony",
     "fruits": ["Banana", "Mango", "Pineapple", "Watermelon"], "mult": 0.62, "fresh": 0,
     "blurb": "Tony wears a Hawaiian shirt in every weather and knows his mangoes."},
    {"name": "The Exotic Emporium", "owner": "Madame Zest",
     "fruits": ["Mango", "Dragonfruit", "Durian"], "mult": 0.68, "fresh": 1,
     "blurb": "Rare fruit on velvet cushions. Pricey, but it stays fresh an extra day."},
    {"name": "Shady Sam's Cart", "owner": "Sam",
     "fruits": [], "mult": 0.33, "fresh": "gamble",
     "blurb": "'Fell off the back of a truck, mate.' Dirt cheap. Might be mush by tomorrow."},
]

# Each event can change fruit values and how many customers turn up.
EVENTS = [
    {"name": "Ordinary Day", "text": "Nothing special is happening in town.",
     "hint": "it'll be a perfectly normal day", "prices": {}, "crowd": 1.0},
    {"name": "Heatwave", "text": "It's boiling! Everyone wants something juicy.",
     "hint": "it's going to be a scorcher", "prices": {"Watermelon": 1.6, "Pineapple": 1.4, "Orange": 1.2}, "crowd": 1.2},
    {"name": "Rainstorm", "text": "It's bucketing down. The market is half empty.",
     "hint": "dark clouds are rolling in", "prices": {}, "crowd": 0.6},
    {"name": "Town Festival", "text": "The festival is on and the streets are packed!",
     "hint": "the town is putting up bunting", "prices": {"Strawberry": 1.3, "Mango": 1.2}, "crowd": 1.6},
    {"name": "Banana Ship Stuck", "text": "The banana ship ran aground. Bananas are gold dust.",
     "hint": "a cargo ship is in trouble at the docks", "prices": {"Banana": 2.2}, "crowd": 1.0},
    {"name": "Health Craze", "text": "A celebrity said 'an apple a day'. People are obsessed.",
     "hint": "some celebrity is about to post about fruit", "prices": {"Apple": 1.7, "Orange": 1.4}, "crowd": 1.2},
    {"name": "Tourist Buses", "text": "Three tour buses just unloaded. They love weird fruit.",
     "hint": "tour buses are booked for the market", "prices": {"Dragonfruit": 1.5, "Durian": 1.5, "Pineapple": 1.2}, "crowd": 1.3},
    {"name": "Fruit Fly Scare", "text": "The newspaper ran a fruit fly story. Berries are a hard sell.",
     "hint": "the newspaper has a nasty story ready about berries", "prices": {"Strawberry": 0.55, "Mango": 0.8}, "crowd": 0.9},
    {"name": "Smoothie Contest", "text": "Smoothie contest today! Blenders everywhere.",
     "hint": "people have been buying blenders", "prices": {"Banana": 1.4, "Strawberry": 1.5, "Mango": 1.4}, "crowd": 1.3},
]

UPGRADES = [
    {"key": "cart",   "name": "Bigger Cart",      "cost": 35, "max": 4, "desc": "+20 fruit capacity"},
    {"key": "cooler", "name": "Ice Cooler",       "cost": 55, "max": 2, "desc": "new fruit lasts +1 day"},
    {"key": "sign",   "name": "Neon Sign",        "cost": 45, "max": 3, "desc": "+6 customers a day"},
    {"key": "charm",  "name": "Haggling Lessons", "cost": 30, "max": 2, "desc": "better odds when haggling"},
]

RIVALS = ["Big Marge", "Lemon Larry", "The Baroness", "Old Man Pip", "Juice Bar Jess"]
CUSTOMERS = ["A jogger", "A grandpa", "A chef", "A kid with pocket money", "A tourist",
             "A busy mum", "A student", "A man in a suit", "A nurse", "A street musician"]


# ---------------------------- helpers ----------------------------

def money(x):
    return "${:,.2f}".format(x)


def line(char="-"):
    print(char * 60)


def pause():
    input("\n(press Enter to continue) ")


def ask_int(prompt, lo, hi):
    while True:
        text = input(prompt).strip()
        if text.isdigit() and lo <= int(text) <= hi:
            return int(text)
        print("  Type a number from", lo, "to", hi)


def ask_yes(prompt):
    while True:
        text = input(prompt + " (y/n) ").strip().lower()
        if text in ("y", "yes"):
            return True
        if text in ("n", "no", ""):
            return False


def stock_of(game, fruit):
    return sum(batch[0] for batch in game["inv"][fruit])


def total_stock(game):
    return sum(stock_of(game, f) for f in FRUITS)


def capacity(game):
    return 30 + 20 * game["up"]["cart"]


def add_fruit(game, fruit, qty, life):
    life = max(1, life + game["up"]["cooler"])
    game["inv"][fruit].append([qty, life])
    game["inv"][fruit].sort(key=lambda b: b[1])   # oldest first


def remove_fruit(game, fruit, qty):
    # takes the oldest fruit first
    for batch in game["inv"][fruit]:
        take = min(batch[0], qty)
        batch[0] -= take
        qty -= take
        if qty == 0:
            break
    game["inv"][fruit] = [b for b in game["inv"][fruit] if b[0] > 0]


def show_inventory(game):
    line()
    print("YOUR CART  ({}/{} fruit)   Cash: {}   Reputation: {}/100".format(
        total_stock(game), capacity(game), money(game["cash"]), int(game["rep"])))
    line()
    if total_stock(game) == 0:
        print("  Empty. Not even a grape.")
    for fruit in FRUITS:
        for qty, days in game["inv"][fruit]:
            warn = "  <-- sell it today or bin it!" if days == 1 else ""
            print("  {:<12} x{:<4} fresh for {} more day(s){}".format(fruit, qty, days, warn))
    line()


def verdict(ratio):
    if ratio <= 0.75:
        return "an absolute steal"
    if ratio <= 0.95:
        return "a bargain"
    if ratio <= 1.1:
        return "fair"
    if ratio <= 1.35:
        return "a bit pricey"
    if ratio <= 1.7:
        return "expensive"
    return "a total rip-off"


def sell_chance(ratio):
    # THE BIG RULE: the higher the price compared to what the fruit
    # is worth today, the lower the chance a customer buys it.
    if ratio <= 1:
        chance = 0.70 + (1 - ratio) * 0.55
    else:
        chance = 0.70 - (ratio - 1) * 0.80
    return max(0.02, min(0.97, chance))


# ---------------------------- new day ----------------------------

def roll_event():
    if random.random() < 0.4:
        return EVENTS[0]
    return random.choice(EVENTS[1:])


def start_day(game):
    game["event"] = game["next_event"]
    game["next_event"] = roll_event()
    event = game["event"]

    # what each fruit is worth to customers today
    game["value"] = {}
    for fruit, info in FRUITS.items():
        wobble = random.uniform(0.8, 1.25)
        game["value"][fruit] = round(info["base"] * wobble * event["prices"].get(fruit, 1.0), 2)

    # what each stall is selling today
    game["offers"] = []
    for stall in STALLS:
        fruits = stall["fruits"] or random.sample(list(FRUITS), 3)
        chosen = random.sample(fruits, min(len(fruits), random.randint(2, 4)))
        offer = {}
        for fruit in chosen:
            price = FRUITS[fruit]["base"] * stall["mult"] * random.uniform(0.85, 1.15)
            # stalls notice big events and bump their prices a little
            price *= 1 + (event["prices"].get(fruit, 1.0) - 1) * 0.4
            offer[fruit] = {"price": round(max(0.1, price), 2), "qty": random.randint(8, 30)}
        game["offers"].append({"stock": offer, "haggled": False})

    game["auction_done"] = False
    game["tip_bought"] = False


# ---------------------------- wholesale stalls ----------------------------

def visit_stall(game, index):
    stall = STALLS[index]
    offer = game["offers"][index]
    while True:
        print()
        line("=")
        print(stall["name"].upper())
        print(stall["blurb"])
        line("=")
        fruits = list(offer["stock"])
        for i, fruit in enumerate(fruits, 1):
            item = offer["stock"][fruit]
            print("  {}) {:<12} {:>7} each   ({} left)   customers pay about {}".format(
                i, fruit, money(item["price"]), item["qty"], money(game["value"][fruit])))
        print("  {}) Haggle with {}".format(len(fruits) + 1, stall["owner"]))
        print("  0) Leave")
        print("Cash: {}   Cart space: {}".format(money(game["cash"]), capacity(game) - total_stock(game)))
        choice = ask_int("> ", 0, len(fruits) + 1)

        if choice == 0:
            return
        if choice == len(fruits) + 1:
            haggle(game, stall, offer)
            continue

        fruit = fruits[choice - 1]
        item = offer["stock"][fruit]
        space = capacity(game) - total_stock(game)
        most = min(item["qty"], space, int(game["cash"] / item["price"] + 1e-9))
        if most <= 0:
            print("  You can't buy any. (No cash, no cart space, or none left.)")
            continue
        qty = ask_int("  How many {}s? (0-{}) ".format(fruit, most), 0, most)
        if qty == 0:
            continue
        game["cash"] = round(game["cash"] - qty * item["price"], 2)
        item["qty"] -= qty

        life = FRUITS[fruit]["life"]
        if stall["fresh"] == "gamble":
            if random.random() < 0.35:
                life = 1
                print("  Hmm. These feel a bit... soft. Sam is suddenly very busy.")
            else:
                life -= 1
                print("  Sam winks. 'Pleasure doing business.'")
        else:
            life += stall["fresh"]
        add_fruit(game, fruit, qty, life)
        print("  Bought {} {}(s) for {}.".format(qty, fruit, money(qty * item["price"])))


def haggle(game, stall, offer):
    if offer["haggled"]:
        print("  {} folds their arms. 'We've done this dance already today.'".format(stall["owner"]))
        return
    offer["haggled"] = True
    chance = 0.45 + 0.15 * game["up"]["charm"] + game["rep"] / 400
    if random.random() < chance:
        print("  You tell a sob story about your cart. {} sighs. '15% off, just today.'".format(stall["owner"]))
        change = 0.85
    else:
        print("  {} is offended by your offer. Prices just went UP 10%.".format(stall["owner"]))
        change = 1.10
    for item in offer["stock"].values():
        item["price"] = round(item["price"] * change, 2)


# ---------------------------- auction house ----------------------------

def make_lots(game):
    lots = []
    for _ in range(2):
        fruit = random.choice(list(FRUITS))
        qty = random.randint(2, 5) if FRUITS[fruit]["base"] >= 10 else random.randint(8, 20)
        lots.append({"fruit": fruit, "qty": qty, "mystery": False})
    # mystery crate: could be treasure, could be compost
    fruit = random.choices(list(FRUITS), weights=[2, 2, 2, 3, 4, 4, 3, 5, 4])[0]
    qty = random.randint(3, 6) if FRUITS[fruit]["base"] >= 10 else random.randint(10, 18)
    lots.append({"fruit": fruit, "qty": qty, "mystery": True})
    return lots


def auction(game):
    if game["auction_done"]:
        print("  The auction house is closed. Come back tomorrow.")
        return
    game["auction_done"] = True
    print()
    line("=")
    print("THE AUCTION HOUSE")
    print("The auctioneer bangs her gavel. 'Three lots today, no time wasters!'")
    line("=")
    for number, lot in enumerate(make_lots(game), 1):
        run_lot(game, number, lot)
    pause()


def run_lot(game, number, lot):
    fruit, qty = lot["fruit"], lot["qty"]
    fair = qty * game["value"][fruit] * 0.6          # roughly wholesale value
    print()
    if lot["mystery"]:
        print("LOT {}: MYSTERY CRATE. About {} fruits inside. It smells... interesting.".format(number, qty))
    else:
        print("LOT {}: {} x {}.  Customers would pay about {} for the lot.".format(
            number, qty, fruit, money(qty * game["value"][fruit])))

    # rivals each have a secret limit
    bidders = {}
    for name in random.sample(RIVALS, random.randint(2, 3)):
        spread = (0.4, 1.5) if lot["mystery"] else (0.55, 1.2)
        bidders[name] = fair * random.uniform(*spread)

    step = max(1, round(fair * 0.08))
    price = max(1, round(fair * 0.3))
    leader = None

    while True:
        bid = price if leader is None else price + step
        # your turn
        if game["cash"] < bid:
            print("  The bid is {} and you can't afford it.".format(money(bid)))
            wants = False
        else:
            wants = ask_yes("  Bid {}? (you have {})".format(money(bid), money(game["cash"])))
        if not wants:
            if leader is None:
                keen = [n for n, limit in bidders.items() if limit >= price]
                leader = random.choice(keen) if keen else None
            if leader:
                print("  SOLD to {} for {}.".format(leader, money(price)))
            else:
                print("  Nobody wants it. The crate is wheeled away.")
            return
        price, leader = bid, "you"

        # rivals' turn
        keen = [n for n, limit in bidders.items() if limit >= price + step]
        if keen and random.random() < 0.85:
            leader = random.choice(keen)
            price += step
            print("  {} bids {}!".format(leader, money(price)))
        else:
            print("  Going once... going twice... SOLD to you for {}!".format(money(price)))
            break

    game["cash"] = round(game["cash"] - price, 2)
    life = FRUITS[fruit]["life"] - 1
    if lot["mystery"]:
        print("  You crack open the crate and find... {} {}s!".format(qty, fruit))
        if random.random() < 0.25:
            qty = qty // 2
            life = 1
            print("  Ugh. Half of them are mouldy. You keep {}.".format(qty))
        elif fruit in ("Durian", "Dragonfruit"):
            print("  JACKPOT. The rivals glare at you.")
    space = capacity(game) - total_stock(game)
    if qty > space:
        extra = qty - space
        cash_back = round(extra * game["value"][fruit] * 0.4, 2)
        game["cash"] = round(game["cash"] + cash_back, 2)
        print("  Your cart is full! You flog {} spare ones to a rival for {}.".format(extra, money(cash_back)))
        qty = space
    if qty > 0:
        add_fruit(game, fruit, qty, life)


# ---------------------------- upgrades and gossip ----------------------------

def upgrade_shop(game):
    while True:
        print()
        line("=")
        print("HANDY HANK'S HARDWARE")
        line("=")
        for i, up in enumerate(UPGRADES, 1):
            level = game["up"][up["key"]]
            if level >= up["max"]:
                tag = "MAXED OUT"
            else:
                tag = money(up["cost"] * (level + 1))
            print("  {}) {:<17} level {}/{}   {:<26} {}".format(
                i, up["name"], level, up["max"], up["desc"], tag))
        print("  0) Leave        Cash:", money(game["cash"]))
        choice = ask_int("> ", 0, len(UPGRADES))
        if choice == 0:
            return
        up = UPGRADES[choice - 1]
        level = game["up"][up["key"]]
        cost = up["cost"] * (level + 1)
        if level >= up["max"]:
            print("  Hank shrugs. 'Can't make it any better than that.'")
        elif game["cash"] < cost:
            print("  Hank looks at your coins. 'Come back when you're richer.'")
        else:
            game["cash"] = round(game["cash"] - cost, 2)
            game["up"][up["key"]] += 1
            print("  Upgraded! {} is now level {}.".format(up["name"], level + 1))


def gossip(game):
    if game["tip_bought"]:
        print("  Gossip Gus has nothing new. 'I told you everything I know!'")
        return
    if game["cash"] < 3:
        print("  Gus doesn't talk for free. Tips cost $3.")
        return
    if not ask_yes("  Gossip Gus leans in. 'Three bucks and I'll tell you about tomorrow.' Pay?"):
        return
    game["cash"] = round(game["cash"] - 3, 2)
    game["tip_bought"] = True
    # Gus is right most of the time. Most of the time.
    event = game["next_event"] if random.random() < 0.8 else random.choice(EVENTS)
    print("  Gus whispers: 'I heard {}.'".format(event["hint"]))


# ---------------------------- your own stall ----------------------------

def set_prices(game):
    print()
    line("=")
    print("SET YOUR PRICES")
    print("Type a price, or just press Enter to keep the one in [brackets].")
    print("Pricier stalls scare customers away. Cheap stalls pull a crowd.")
    line("=")
    for fruit in FRUITS:
        qty = stock_of(game, fruit)
        if qty == 0:
            continue
        value = game["value"][fruit]
        current = game["prices"].get(fruit, value)
        while True:
            text = input("  {:<12} x{:<3} worth about {:>6} today.  Your price [{}]: ".format(
                fruit, qty, money(value), money(current))).strip().replace("$", "")
            if text == "":
                price = current
                break
            try:
                price = round(float(text), 2)
                if 0.01 <= price <= 999:
                    break
            except ValueError:
                pass
            print("    Type a price like 2.50")
        game["prices"][fruit] = price
        print("      Customers will think that's {}.".format(verdict(price / value)))


def open_stall(game):
    stocked = [f for f in FRUITS if stock_of(game, f) > 0]
    if not stocked:
        print("\nYou have nothing to sell, so you spend the day juggling for coins.")
        tips = round(random.uniform(1, 4), 2)
        game["cash"] = round(game["cash"] + tips, 2)
        print("You made {} in tips.".format(money(tips)))
        return

    set_prices(game)

    # A stall with higher AVERAGE prices gets fewer visitors.
    ratios = [game["prices"][f] / game["value"][f] for f in stocked]
    average = sum(ratios) / len(ratios)
    pull = max(0.35, min(1.4, 1.7 - 0.7 * average))
    crowd = (12 + 6 * game["up"]["sign"] + game["rep"] / 4) * game["event"]["crowd"] * pull
    crowd = max(2, int(crowd * random.uniform(0.85, 1.15)))

    print()
    print("Word on the street is that your stall is {}.".format(verdict(average)))
    print("{} people stop at your cart today...".format(crowd))
    line()

    sold = {f: 0 for f in stocked}
    earned = {f: 0.0 for f in stocked}
    walked = 0
    chatter = []
    sold_out = False

    for _ in range(crowd):
        available = [f for f in stocked if stock_of(game, f) > 0]
        if not available:
            walked += 1
            sold_out = True
            continue
        # two looks: if the first fruit is too pricey they might try another
        bought = False
        for attempt in range(2):
            weights = [FRUITS[f]["pop"] * game["event"]["prices"].get(f, 1.0) for f in available]
            fruit = random.choices(available, weights=weights)[0]
            ratio = game["prices"][fruit] / game["value"][fruit]
            chance = sell_chance(ratio) + (game["rep"] - 10) / 400
            if random.random() < chance:
                want = 1 if FRUITS[fruit]["base"] >= 10 else random.randint(1, 3)
                qty = min(want, stock_of(game, fruit))
                remove_fruit(game, fruit, qty)
                takings = round(qty * game["prices"][fruit], 2)
                game["cash"] = round(game["cash"] + takings, 2)
                sold[fruit] += qty
                earned[fruit] += takings
                if ratio <= 1.1:
                    game["rep"] = min(100, game["rep"] + 0.25)
                chatter.append("{} buys {} {}(s) for {}.".format(
                    random.choice(CUSTOMERS), qty, fruit, money(takings)))
                bought = True
                break
            if ratio > 1.5:
                game["rep"] = max(0, game["rep"] - 0.4)
                chatter.append("{} sees {} for a {} and gasps. 'Daylight robbery!'".format(
                    random.choice(CUSTOMERS), money(game["prices"][fruit]), fruit))
            if random.random() < 0.6:
                break
        if not bought:
            walked += 1

    for text in random.sample(chatter, min(6, len(chatter))):
        print("  " + text)
    if sold_out:
        print("  You SOLD OUT! Latecomers stared at your empty cart and wandered off.")
    line()
    print("END OF TRADING")
    total = 0
    for fruit in stocked:
        print("  {:<12} sold {:<3} for {:>9}   ({} left)".format(
            fruit, sold[fruit], money(earned[fruit]), stock_of(game, fruit)))
        total += earned[fruit]
    print("  Takings: {}    Customers who left empty handed: {}".format(money(total), walked))
    game["best_day"] = max(game["best_day"], total)


# ---------------------------- night time ----------------------------

def night(game):
    print()
    fee = 4 + game["day"] // 3
    game["cash"] = round(game["cash"] - fee, 2)
    print("The market inspector collects the {} pitch fee.".format(money(fee)))

    rotted = 0
    for fruit in FRUITS:
        for batch in game["inv"][fruit]:
            batch[1] -= 1
            if batch[1] <= 0:
                rotted += batch[0]
        game["inv"][fruit] = [b for b in game["inv"][fruit] if b[1] > 0]
    if rotted:
        print("{} fruit went rotten overnight. Into the bin they go.".format(rotted))
        game["rotted"] += rotted

    stocked = [f for f in FRUITS if stock_of(game, f) > 0]
    if stocked and random.random() < 0.10:
        fruit = random.choice(stocked)
        eaten = min(stock_of(game, fruit), random.randint(1, 4))
        remove_fruit(game, fruit, eaten)
        print("A raccoon broke into your cart and ate {} {}(s). It looked very pleased.".format(eaten, fruit))

    print("You finish day {} with {}.".format(game["day"], money(game["cash"])))
    pause()


# ---------------------------- the main game ----------------------------

def morning_menu(game):
    while True:
        print()
        line("=")
        print("DAY {} of {}   |   {}   |   Cash: {}".format(
            game["day"], DAYS, game["event"]["name"], money(game["cash"])))
        print(game["event"]["text"])
        line("=")
        for i, stall in enumerate(STALLS, 1):
            print("  {}) Visit {}".format(i, stall["name"]))
        print("  6) Auction House" + ("  (closed)" if game["auction_done"] else "  (3 lots today)"))
        print("  7) Handy Hank's Hardware (upgrades)")
        print("  8) Gossip Gus (tip about tomorrow, $3)")
        print("  9) Look in your cart")
        print("  0) Open your stall and start selling!")
        choice = ask_int("> ", 0, 9)
        if 1 <= choice <= 5:
            visit_stall(game, choice - 1)
        elif choice == 6:
            auction(game)
        elif choice == 7:
            upgrade_shop(game)
        elif choice == 8:
            gossip(game)
        elif choice == 9:
            show_inventory(game)
        else:
            return


def ending(game):
    print()
    line("=")
    print("THE MARKET SEASON IS OVER")
    line("=")
    leftovers = 0
    for fruit in FRUITS:
        leftovers += stock_of(game, fruit) * game["value"][fruit] * 0.3
    if leftovers:
        leftovers = round(leftovers, 2)
        game["cash"] = round(game["cash"] + leftovers, 2)
        print("The juice factory buys your leftover fruit for {}.".format(money(leftovers)))
    cash = game["cash"]
    print("Final cash:       ", money(cash))
    print("Profit:           ", money(cash - START_CASH))
    print("Best day takings: ", money(game["best_day"]))
    print("Fruit wasted:     ", game["rotted"])
    print("Reputation:       ", int(game["rep"]), "/ 100")
    print()
    if cash >= 1500:
        title = "FRUIT EMPEROR. They're naming a mango after you."
    elif cash >= 800:
        title = "FRUIT TYCOON. Granny Smith asks YOU for advice now."
    elif cash >= 400:
        title = "MARKET HOTSHOT. The other stalls are nervous."
    elif cash >= 150:
        title = "SOLID TRADER. You can afford a cart with four wheels."
    elif cash >= START_CASH:
        title = "SURVIVOR. You made it out with your shirt."
    else:
        title = "FRUIT FLOP. The raccoon did better than you."
    print("Your title:", title)
    line("=")


def play():
    game = {
        "day": 0, "cash": START_CASH, "rep": 10.0,
        "inv": {f: [] for f in FRUITS},
        "prices": {}, "up": {u["key"]: 0 for u in UPGRADES},
        "next_event": EVENTS[0], "best_day": 0.0, "rotted": 0,
    }
    line("=")
    print("          F R U I T   M A R K E T   T Y C O O N")
    line("=")
    print("You've got {}, an empty cart and {} days to make your fortune.".format(money(START_CASH), DAYS))
    print("Each morning: buy fruit from stalls or gamble at the auction.")
    print("Then open your stall and set your prices.")
    print("Charge too much and people walk. Charge too little and you starve.")
    print("Fruit rots, so don't hoard it. And watch out for the raccoon.")
    pause()

    for day in range(1, DAYS + 1):
        game["day"] = day
        start_day(game)
        if game["cash"] < 1 and total_stock(game) == 0:
            print("\nYou're flat broke with an empty cart. The inspector takes your pitch.")
            break
        morning_menu(game)
        open_stall(game)
        night(game)
    ending(game)


while True:
    play()
    if not ask_yes("\nPlay again?"):
        print("Thanks for playing. Go eat some fruit.")
        break
