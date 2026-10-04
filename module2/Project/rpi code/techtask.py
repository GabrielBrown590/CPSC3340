#from gpiozero import Button
from signal import pause
from RPi import GPIO
import random
import time
import serial
#TODO make sure we install this stuff
from luma.core.interface.serial import i2c
from luma.core.render import canvas
from luma.oled.device import ssd1306
from PIL import ImageFont
from luma.core.device import dummy
timer = dummy()

#setup play and timer OLED
oled = ssd1306(i2c(port=1, address=0x3C))
#timer = ssd1306(i2c(port=1, address=0x3D))
BIG = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 28)



#setup serial for the joystick
ser = serial.Serial('/dev/ttyUSB0', 9600, timeout=1)


GPIO.setmode(GPIO.BCM)


#joystick switch input
GPIO.setup(22, GPIO.IN, pull_up_down=GPIO.PUD_UP)

#TODO fill in buttons with pin info
RED_BUTTON = 0
GREEN_BUTTON = 0
BLUE_BUTTON = 0
YELLOW_BUTTON = 0
for pin in (RED_BUTTON, GREEN_BUTTON, BLUE_BUTTON, YELLOW_BUTTON):
    GPIO.setup(pin, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)

#TODO fill in with switch pin info
SWITCH1 = 0
SWITCH2 = 0
for pin in (SWITCH1, SWITCH2):
    GPIO.setup(pin, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)

#TODO fill in with led pin info
RED_PIN = 0
GREEN_PIN = 0
BLUE_PIN = 0
for pin in (RED_PIN,GREEN_PIN,BLUE_PIN):
    GPIO.setup(pin, GPIO.OUT, initial=GPIO.LOW)

#handle the joysticks
joy_values = [2048, 2048, 2048]

def read_joysticks():
    global joy_values
    while ser.in_waiting:
        parts = ser.readline().decode("ascii", errors="ignore").split()
        #makes sure the input is all good
        if len(parts) == 3 and all(v.isdigit() for v in parts):
            joy_values = [int(v) for v in parts]
    return joy_values


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


def show_oled(text):
    with canvas(oled) as draw:
        draw.text((0, 0), text, font=BIG, fill="white")

timer_text = None
def show_timer(text):
    global timer_text
    if text == timer_text:
        return
    timer_text = text
    with canvas(timer) as draw:
        draw.text((0, 0), text, font=BIG, fill="white")


    
def read_inputs():
        js1, js2, js3 = read_joysticks()
        return {
            "blue_button": GPIO.input(BLUE_BUTTON),
            "red_button": GPIO.input(RED_BUTTON),
            "green_button": GPIO.input(GREEN_BUTTON),
            "yellow_button": GPIO.input(YELLOW_BUTTON),
            "switch1": GPIO.input(SWITCH1),
            "switch2": GPIO.input(SWITCH2),
            "js1": js1,
            "js2": js2,
            "js3": js3,
            "js1sw": 1 - GPIO.input(22)
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
    return {"order": order, "step": 0, "clue": f"Serial number: {SERIAL}","led": LED_color, "oled": SERIAL,}

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

# Hold game
# player holds a button, LED changes based on that they release it at a certain time and with certain switch positions
def hold_setup():
    words = ["OH", "O", "OWE", "BY", "BYE", "BUY"]
    first_LED_colors = ["RED", "BLUE"]
    second_LED_colors = ["GREEN", "YELLOW"]
    hold_rules = {
    # (word, first LED, second LED): (button to hold, switch1, switch2, time digit)
    ("OH",  "RED",  "GREEN"):  ("blue_button",   True,  True,  5),
    ("OH",  "RED",  "YELLOW"): ("blue_button",   False, True,  2),
    ("OH",  "BLUE", "GREEN"):  ("yellow_button", True,  False, 8),
    ("OH",  "BLUE", "YELLOW"): ("yellow_button", False, False, 1),

    ("O",   "RED",  "GREEN"):  ("green_button",  False, False, 3),
    ("O",   "RED",  "YELLOW"): ("green_button",  True,  False, 7),
    ("O",   "BLUE", "GREEN"):  ("red_button",    False, True,  0),
    ("O",   "BLUE", "YELLOW"): ("red_button",    True,  True,  4),

    ("OWE", "RED",  "GREEN"):  ("yellow_button", True,  False, 9),
    ("OWE", "RED",  "YELLOW"): ("yellow_button", True,  True,  6),
    ("OWE", "BLUE", "GREEN"):  ("green_button",  False, False, 4),
    ("OWE", "BLUE", "YELLOW"): ("green_button",  False, True,  7),

    ("BY",  "RED",  "GREEN"):  ("red_button",    False, True,  1),
    ("BY",  "RED",  "YELLOW"): ("red_button",    False, False, 8),
    ("BY",  "BLUE", "GREEN"):  ("blue_button",   True,  True,  3),
    ("BY",  "BLUE", "YELLOW"): ("blue_button",   True,  False, 0),

    ("BYE", "RED",  "GREEN"):  ("green_button",  True,  True,  2),
    ("BYE", "RED",  "YELLOW"): ("green_button",  True,  False, 5),
    ("BYE", "BLUE", "GREEN"):  ("yellow_button", False, True,  6),
    ("BYE", "BLUE", "YELLOW"): ("yellow_button", False, False, 9),

    ("BUY", "RED",  "GREEN"):  ("blue_button",   False, False, 7),
    ("BUY", "RED",  "YELLOW"): ("blue_button",   False, True,  3),
    ("BUY", "BLUE", "GREEN"):  ("red_button",    True,  False, 1),
    ("BUY", "BLUE", "YELLOW"): ("red_button",    True,  True,  8),
    }
    word = random.choice(words)
    first = random.choice(first_LED_colors)
    second = random.choice(second_LED_colors)
    button, switch1, switch2, digit = hold_rules[(word, first, second)]
    return {"button": button, "second": second,
            "switch1": switch1, "switch2": switch2, "digit": digit,
            "holding": False, "led": first, "oled": word,
            "clue": "Read the display."}

def hold_check(p, now, last):
    for action in ["red_button", "blue_button", "green_button", "yellow_button"]:
        if pressed(action, now, last):            
            if action != p["button"]:
                return "strike"
            p["holding"] = True
            setLED(p["second"])

    # did they let go of the right button?
    if p["holding"] and last[p["button"]] == 1 and now[p["button"]] == 0:
        p["holding"] = False
        if (now["switch1"] == p["switch1"]
                and now["switch2"] == p["switch2"]
                and time_left() % 10 == p["digit"]):
            setLED("OFF")
            return "solved"
        setLED(p["led"])                          
        return "strike"
    return None

#Maze game
#player dropped into a 3d grid, the LED and word tell them how far they are from the target
def maze_setup():
    #distance to the target, from near to far
    xdistance = ["WHITE", "BLUE", "YELLOW", "RED", "GREEN"]
    ydistance = ["ZAP", "RUE", "EVE", "ART", "RIG"]
    zdistance = [0, 0.2, 0.35, 0.6, 1.0]

    #generate player and target location
    playerPos = [random.randint(0,4), random.randint(0,4), random.randint(0,4)]
    targetPos = [random.randint(0,4), random.randint(0,4), random.randint(0,4)]
    while playerPos == targetPos:
        targetPos = [random.randint(0,4), random.randint(0,4), random.randint(0,4)]

    #starting distance on each axis
    x = abs(playerPos[0] - targetPos[0])
    y = abs(playerPos[1] - targetPos[1])
    z = abs(playerPos[2] - targetPos[2])
    return {"playerPos": playerPos, "targetPos": targetPos, "pushed": [0, 0, 0],
            "x distances": xdistance, "y distances": ydistance, "z distances": zdistance,
            "led": xdistance[x], "oled": f"{ydistance[y]}",
            "clue": "Read the display."}

def maze_check(p, now, last):
    sticks = ["js1", "js2", "js3"]
    for i in range(3):
        value = now[sticks[i]]
        if value > 3000:
            direction = 1
        elif value < 1000:
            direction = -1
        else:
            direction = 0
        #move one step, only when the stick first leaves the center
        if direction != 0 and p["pushed"][i] == 0 and direction + p["playerPos"][i] < 5 and direction + p["playerPos"][i] > -1:
            p["playerPos"][i] += direction
        p["pushed"][i] = direction

    #calculate the new distances
    x = abs(p["playerPos"][0] - p["targetPos"][0])
    y = abs(p["playerPos"][1] - p["targetPos"][1])
    z = abs(p["playerPos"][2] - p["targetPos"][2])
    oled = p["y distances"][y]

    #LED color = x distance, flash speed = z distance
    color = p["x distances"][x]
    flash = p["z distances"][z]

    #smaller the denominator the quicker this fraction will grow causing faster flashing.
    if flash == 0 or int(time.time() / flash) % 2 == 0:
        led = color
    else:
        led = "OFF"

    #update the displays only if they changed
    if led != p["led"]:
        p["led"] = led
        setLED(led)
    if oled != p["oled"]:
        p["oled"] = oled
        show_oled(oled)

    #click to lock in
    if pressed("js1sw", now, last):
        if p["playerPos"] == p["targetPos"]:
            setLED("OFF")
            return "solved"
        else:
            return "strike"
    return None


# setup the game
MODULES = [
    ("The Button", "Button: press   X: submit", button_setup, button_check),
    ("Hold", "X / Y / Button: one action per symbol", hold_setup, hold_check),
    ("Maze","", maze_setup,maze_check)
]

puzzles = [setup() for _, _, setup, _ in MODULES]
solved = [False] * len(MODULES)

def show_module(i):
    name, controls = MODULES[i][0], MODULES[i][1]
    print(f"\n=== Module {i+1}/{len(MODULES)}: {name} ===")
    print(puzzles[i]["clue"])
    print("  Controls:", controls)
    setLED(puzzles[i].get("led", "OFF"))
    show_oled(puzzles[i].get("oled", ""))

# main game
strikes = 0
strike_until = 0
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
        if time.time() < strike_until:
            show_timer("X" * strikes)
        else:
            show_timer(f"{remaining // 60}:{remaining % 60:02d}")

        if remaining <= 0:
            show_timer("BOOM!")
            time.sleep(3)
            break

        # current module decides what the inputs mean
        result = MODULES[current][3](puzzles[current], now, last)

        if result == "strike":
            strikes += 1
            show_timer("X"*strikes)
            strike_until = time.time() + 2
            if strikes >= MAX_STRIKES:
                show_timer("BOOM!")
                time.sleep(3)
                break
        elif result == "solved":
            solved[current] = True
            current+=1
            print("  Module solved!")
            if all(solved):
                show_timer("U WIN!")
                time.sleep(3)
                break
            show_module(current)

        last = now
        time.sleep(0.1)
finally:
    GPIO.cleanup()


            