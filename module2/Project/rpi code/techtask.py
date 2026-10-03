#from gpiozero import Button
from signal import pause
from RPi import GPIO
import random
import time

GPIO.setmode(GPIO.BCM)


GPIO.setup(27, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)
GPIO.setup(23, GPIO.IN, pull_up_down=GPIO.PUD_UP)
GPIO.setup(24, GPIO.IN, pull_up_down=GPIO.PUD_UP)
GPIO.setup(22, GPIO.IN, pull_up_down=GPIO.PUD_UP)

#TODO fill in buttons with pin info
RED_BUTTON = 0
GREEN_BUTTON = 0
BLUE_BUTTON = 0
YELLOW_BUTTON= 0
for pin in (RED_BUTTON, GREEN_BUTTON, BLUE_BUTTON, YELLOW_BUTTON):
    GPIO.setup(pin, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)

#TODO fill in with led pin info
RED_PIN = 0
GREEN_PIN = 0
BLUE_PIN = 0
for pin in (RED_PIN,GREEN_PIN,BLUE_PIN):
    GPIO.setup(pin, GPIO.OUT, initial=GPIO.LOW)


def setLED(name):
    colors = {
    "OFF":    (0, 0, 0),
    "RED":    (1, 0, 0),
    "GREEN":  (0, 1, 0),
    "BLUE":   (0, 0, 1),
    "YELLOW": (1, 1, 0),
    "WHITE":  (1, 1, 1),
    }
    r, g, b = colors[name]
    GPIO.output(RED_PIN, r)
    GPIO.output(GREEN_PIN, g)
    GPIO.output(BLUE_PIN, b)


    
def read_inputs():
        return {
            "blue_button": GPIO.input(BLUE_BUTTON),
            "red_button": GPIO.input(RED_BUTTON),
            "green_button": GPIO.input(GREEN_BUTTON),
            "yellow_button": GPIO.input(YELLOW_BUTTON),
            "switch": GPIO.input(27),
            "x": 1-GPIO.input(23),
            "y": 1-GPIO.input(24),
            "joySW": 1 - GPIO.input(22)
            }
    
def pressed(name, now, last):
    return now[name] == 1 and last[name] == 0

# game settings
TIME_LIMIT = 180
MAX_STRIKES = 3
start = time.time()

def time_left():
    return TIME_LIMIT - int(time.time() - start)
def generate_serial():
    letters = "".join(random.choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ") for _ in range(4))
    serial = letters + str(random.randint(0,9))
    return serial
SERIAL = generate_serial()

# button game
# LED shows color. Based on color & SERIAL need to press certain buttons in order
def button_setup():
    #gets the facts about the serial to determine which button RULE
    serial_has_even = any(ch in "02468" for ch in SERIAL)
    serial_has_vowel = any(ch in "AEIOU" for ch in SERIAL)
    serial_has_5 = any(ch == "5" for ch in SERIAL)
    serial_has_prime_except_5 = any(ch in "237" for ch in SERIAL)
    
    BUTTON_RULES = {
    # clueLED:   (serial fact,
    #          order if true,
    #          order if false)
    "RED":    (serial_has_even,
               ["blue_button", "red_button", "yellow_button", "green_button"],
               ["green_button", "red_button", "blue_button", "yellow_button"]),
    "GREEN":  (serial_has_vowel,
               ["yellow_button", "blue_button", "green_button", "red_button"],
               ["red_button", "yellow_button", "blue_button", "green_button"]),
    "BLUE":   (serial_has_5,
               ["green_button", "yellow_button", "red_button", "blue_button"],
               ["blue_button", "green_button", "yellow_button", "red_button"]),
    "YELLOW": (serial_has_prime_except_5,
               ["red_button", "green_button", "blue_button", "yellow_button"],
               ["yellow_button", "green_button", "red_button", "blue_button"]),
    "WHITE":  (serial_has_even,
               ["yellow_button", "red_button", "green_button", "blue_button"],
               ["blue_button", "yellow_button", "green_button", "red_button"]),
}
    LED_color = random.choice(["RED","GREEN","BLUE","YELLOW","WHITE"])
    setLED(LED_color)

    fact, if_true, if_false = BUTTON_RULES[LED_color]
    order = if_true if fact else if_false
    return {"order": order, "step": 0, "clue": f"Serial number: {SERIAL}"}

def button_check(p, now, last):
    for button in  ["red_button", "green_button", "blue_button", "yellow_button"]:
        if pressed(button, now, last):
            if button != p["order"][p["step"]]:
                p["step"] = 0
                return "strike"
            else:
                p["step"] += 1
                print(f" step {p['step']} correct")
                if p['step'] == len(p["order"]):
                    setLED("OFF")
                    return "solved"
                
    
    # if pressed("button", now, last):
    #     p["presses"] += 1
    #     print(" *click*")
    # if pressed("x", now, last):
    #     if p["presses"] == BUTTON_RULES[p["color"]]:
    #         return "solved"
    #     p["presses"] = 0
    #     return "strike"
    # return None

# symbols game
# symbol sequence dictates order of presses
SYMBOL_RULES = {"STAR": "x", "MOON": "y", "SUN": "button", "SKULL": "y"}

def symbols_setup():
    seq = random.sample(list(SYMBOL_RULES), 3)
    return {"seq": seq, "step": 0, "clue": "Symbols: " + "  ".join(seq)}

def symbols_check(p, now, last):
    for action in ["x", "y", "button"]:
        if pressed(action, now, last):
            if action != SYMBOL_RULES[p["seq"][p["step"]]]:
                p["step"] = 0
                return "strike"
            p["step"] += 1
            print(f" step {p['step']} correct")
            if p["step"] == len(p["seq"]):
                return "solved"
    return None

# serial game
# if vowel in serial number, set switch to 1, else 0
# use button to submit
def switch_setup():
    print("nothing RN")

def switch_answer(serial):
    if any(ch in "AEIOU" for ch in serial):
        return 1 # if has vowel, return 1
    return 0 # else 0

def switch_check(p, now, last):
    if pressed("button", now, last):
        if now["switch"] == switch_answer(p["serial"]):
            return "solved"
        return "strike"
    return None

# timing game
# code dictates what the last digit of the time needs to be when you submit
TIMING_RULES = {"ALPHA": 2, "BRAVO": 7, "CHARLIE": 9, "DELTA": 5}

def timing_setup():
    word = random.choice(list(TIMING_RULES))
    return {"word": word, "clue": f"The display reads: {word}."}

def timing_check(p, now, last):
    if pressed("button", now, last):
        t = time_left()
        print(f" Clock: {t // 60}:{t % 60:02d}")
    if pressed("switch", now, last):
        if time_left() % 10 == TIMING_RULES[p["word"]]:
            return "solved"
        return "strike"
    return None

# dial game? workshop the name
# codes dictate what dial needs to be set at
# use x and y to set dial, 0 loops to 9
DIAL_RULES = {"SHELL": 3, "HALL": 8, "STICKS": 1, "TRAIN": 9, "BOX": 6}

def dial_setup():
    word = random.choice(list(DIAL_RULES))
    return {"word": word, "value": 0, "clue": f"The display reads: {word}."}

def dial_check(p, now, last):
    if pressed("x", now, last):
        p["value"] = (p["value"] + 1) % 10
    if pressed("y", now, last):
        p["value"] = (p["value"] - 1) % 10
    if pressed("button", now, last):
        if p["value"] == DIAL_RULES[p["word"]]:
            return "solved"
        return "strike"
    return None

# setup the game
MODULES = [
    ("The Button", "Button: press   X: submit", button_setup, button_check),
    ("The Switch", "Switch: set   Button: submit", switch_setup, switch_check),
    ("Symbols", "X / Y / Button: one action per symbol", symbols_setup, symbols_check),
    ("Timing", "Button: check clock   Switch ON: act", timing_setup, timing_check),
    ("The Dial", "X: up   Y: down   Button: submit", dial_setup, dial_check),
]

puzzles = [setup() for _, _, setup, _ in MODULES]
solved = [False] * len(MODULES)

def show_module(i):
    name, controls = MODULES[i][0], MODULES[i][1]
    print(f"\n=== Module {i+1}/{len(MODULES)}: {name} ===")
    print(puzzles[i]["clue"])
    print("  Controls:", controls)

# main game
strikes = 0
current = 0
last_announce = None
last = read_inputs()

print("BOMB ARMED: You have", TIME_LIMIT, "seconds.")
show_module(current)

try:
    while True:
        now = read_inputs()

        # timer
        remaining = time_left()
        if remaining <= 0:
            print("\n*** BOOM! Time ran out. ***")
            break
        if remaining % 10 == 0 and remaining != last_announce:
            print(f"  [{remaining // 60}:{remaining % 60:02d} left | strikes {strikes}/{MAX_STRIKES}]")
            last_announce = remaining

        # current module decides what the inputs mean
        result = MODULES[current][3](puzzles[current], now, last)

        if result == "strike":
            strikes += 1
            print(f"  STRIKE {strikes}/{MAX_STRIKES}!")
            if strikes >= MAX_STRIKES:
                print("\n*** BOOM! Too many strikes. ***")
                break
        elif result == "solved":
            solved[current] = True
            current+=1
            print("  Module solved!")
            if all(solved):
                print("\n*** BOMB DEFUSED! You win! ***")
                break
            show_module(current)

        last = now
        time.sleep(0.1)
finally:
    GPIO.cleanup()


            