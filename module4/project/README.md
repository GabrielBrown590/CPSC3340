# ForeverCorp Mobile Subscription Unit

## Who:
By Gabriel Brown

## What:
My project is a ”mobile subscription unit” for a fake company called Forevercorp. The way my sculpture behaves follows a loop with clearly defined steps.
1.Goad the user into pressing the subscribe button using voice clips and an LCD with messages.
2.inform the user they have subscribed and tell them to press the unsubscribe button. Start a bill that ticks up.
3.ask the user to verify their ID, guilt trip them into stopping the unsubscription process using a dog on a servo and voice clips. If they remove their ID, return to step 2.
4.User has unsubscribed, inform them of this and go back to step 1.

The Repo is organized with the code running on the ESP32 in a file called esp32Code.ino, the code running on the Pi in a file called rpiCode and a folder called sounds with all the different audio clips.

Here are the audio clips organized by the use:
```
#clips that play before the player has subscribed
enticingClips = ["sounds/forevercorp_upbeat_female_1.mp3",
    "sounds/forevercorp_research_female_1.mp3",
    "sounds/forevercorp_forever_female_1.mp3",
    "sounds/forevercorp_button_female_1.mp3"]
#clips that play once the user has subbed
subscribeClips =  ["sounds/forevercorp_welcome_female_1.mp3"]
#clips that play once the user hits the unsub button
unsubButtonClips = [ "sounds/forevercorp_unsub_1_verify_id_request.mp3"]
#clips that play once the user has inserted their card
verifyClips = ["sounds/forevercorp_biscuit_intro.mp3",
    "sounds/forevercorp_unsub_2_please_wait.mp3",
    "sounds/forevercorp_unsub_3_remove_id_reminder.mp3",
    "sounds/forevercorp_biscuit_shelter.mp3",
    "sounds/forevercorp_unsub_4_stay_family.mp3",
    "sounds/forevercorp_unsub_5_lose_benefits.mp3"]
#clip that plays once the user has actually unsubscribed
ActualUnsubClips = ["sounds/forevercorp_unsub_6_unsubscribed.mp3"] 
```
## How:
### Wiring
assume all components are also connected to ground and 3v or 5v power as neccesary.
The following components are used in the project and are connected to the following esp32 pins:
```
#define cardReaderPin 15
#define subButtonPin 16
#define screenSDAPin 17
#define screenSCLPin 18
#define servoPin 35
#define motorControllerIn1Pin 4
#define motorControllerIn2Pin 5
#define motorControllerIn3Pin 6
#define motorControllerIn4Pin 7
#define unsubscribeButtonPin 40
```
The esp32 is then connected to the raspberry pi via a usb cable. The raspberry pi is also connected to a speaker via a usb cable.

The motor controller is powered via its own seperate power and the rpi has a power cable, giving us 3 cables coming out the the device(the speaker is external).

### Dependencies
The esp32 code relies on the following libraries for the following purposes:
#include <Wire.h> - needed to help establish communication with the LCD display
#include <LiquidCrystal_I2C.h> - needed to display messages on the LCD display
#include <ESP32Servo.h> - used to communicate with the servo

The raspberry pi uses the following libraries for the following purposes:
pygame - used to play the voice clips stored in sounds
time - used to keep track of how often voice clips should be played
serial - used to communicate with the esp32
random - used to pick which voice clip to play
os - used to get the voice clips from the folder

### Operation
To run, flash the esp32 with the appropriate code(only done once), then run the python code on the raspberry pi. The device is in a loop so as soon as one user is done, the next user can begin without resetting the project.

Set up the project such that the side with the display is easily visible and the rod with the unsubscibe button is facing the user.

Make sure both the pi and motor controller power cables are plugged in.