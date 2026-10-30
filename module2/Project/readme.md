# Keep Talking and Nobody Explodes: Raspberry Pi Edition

The inspiration for this game came from its namesake, the video game Keep Talking and Nobody Explodes - a multiplayer co-op game in which one group of players is tasked with defusing a bomb with a time limit and one other player is tasked with communicating exactly how to defuse the bomb based on a reference manual. 

We decided it would be fun to implement this game physically (without the bomb exploding part). In our version of the game, there are two players who have control of the bomb (the defusers), and one player who has the bomb defusal manual (the expert) tells them what to do based on the bomb’s current status. 

## Hardware

To build this game, we used/combined the following hardware components:

| Count | Name |
| --- | --- |
| 1 | Raspberry Pi |
| 1 | ESP32 Microcontroller |
| 4 | Buttons |
| 3 | Joysticks |
| 2 | Switches |
| 1 | Breadboard |
| Dozens | Wires |
| 1 | 3-D Printed Enclosure |
| 1 | Cardboard Base |
| 1 | Game Manual |
| 2 | OLED Displays |

We began by anchoring our interactive components in the surface of our tetrahedral enclosure, with our base enclosing the Raspberry Pi, breadboard, and ESP32. We then wired the components into the breadboard and then into our electronics, which required significant trial and error to get correct. Additionally, there were issues with securing our components into the enclosure, which also needed to be solved. 

In order to clearly visually organize the game and balance the game for users, we separated different components and displays on different sides of the enclosure.  With three players, we saw a tetrahedral enclosure with three playable sides as the fairest setup. 

On one side, we added just the timer OLED display, because of course the most important thing about time defusal is knowing exactly how much time is left. 

On another side for one of the defusers, we added the three joysticks in a row (all of which are used in the same challenge), as well as one button, one LED and one switch. 

Finally, on the third side for the other defusers, we added three buttons all differently colored, another switch, as well as the other OLED display. 

For both defuser sides, we chose to mix the components so that both players were necessary in most/all challenges, and to make it interesting/balanced for each side so that both players were engaging simultaneously. 

After testing, we had to cut the LED and the timer display due to issues with the wiring in which they could not respond to input. This forced us to cut the second puzzle due to its reliance on the timer display and forced us to move readings away from the LED towards the OLED display in the other two. Despite the limitations, the remaining inputs allowed us to successfully test and solve both remaining puzzles consistently. 

## Software

Building on the Module 2 Technical task, we wrote the code in Python to run on the Raspberry Pi and interact with the ESP32 through the *serial* library. We also used the *luma* library to write to the OLED displays. 

Our main game loop is set up to read inputs indefinitely and then interpret the component inputs depending on the specific module/puzzle currently being solved. In addition to the timer running out, we raised the difficulty by adding another failure condition, automatically exploding the bomb if three failed puzzles/strikes are entered. 

```jsx
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
        result = MODULES[current]3

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
```

The puzzles themselves are implemented as modules composed of a puzzle setup and a puzzle check. 

```jsx
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

```

The above code shows the first puzzle, *On The Subject of Buttons,* as an example. The button_setup() function defines the puzzle and randomly generates the serial number, thus selecting the correct output for the puzzle. In turn, the button_check() function tracks the buttons inputted by the defusing players and matches them against the correct output, returning either a strike or a success based on the outcome. 

## Video

https://youtube.com/shorts/BLJz7DE6Vso?is=kSTBMmcp3ADJRoAt
