/*
  ForeverCorp - ESP32-S3 controller

  Runs the game and tells the Python audio script which state it's in.

  States (sent to Python as a number on its own line, on every change and every 0.5 s):
    0 = unsubscribed        ads play, screen asks you to subscribe
    1 = subscribed          bill climbs on the screen, the unsubscribe button dodges around
    2 = pressed unsubscribe screen asks for your ID
    3 = verifying ID        fake progress bar; Biscuit gets moved to the shelter
    4 = unsubscribed        "You're temporary", then back to state 0

  Messages from Python (one per line):
    puppy     the "Biscuit is now being returned to the shelter" clip just started
    verified  the last verification clip finished

  Before powering on, turn the unsubscribe button to its middle position:
  the code treats wherever it starts as the middle.
*/

#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <ESP32Servo.h>

// ------------------------------------------------------------------ pins
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

// ------------------------------------------------------------------ settings to tweak
#define LCD_ADDRESS 0x27            // the address the component tester found (usually 0x27 or 0x3F)
#define CARD_INSERTED_LEVEL LOW     // what the card reader pin reads WITH a card in (HIGH or LOW)

#define PUPPY_HOME_ANGLE 180          // servo angle with Biscuit in his forever home
#define PUPPY_SHELTER_ANGLE 90     // servo angle with Biscuit at the shelter
#define PUPPY_MOVE_DELAY_MS 900     // the voice starts ~0.9 s into the clip, so wait this long
#define PUPPY_STEP_MS 15            // ms per degree of servo movement: bigger = slower, sadder

#define UNSUB_WIGGLE_DEGREES 20     // how far the unsubscribe button turns each way from the middle
#define STEPPER_STEP_US 1800        // microseconds between motor steps: bigger = slower
#define STEPS_PER_REV 4096          // 28BYJ-48 in half-step mode

#define UNSUB_TIMEOUT_MS 30000      // no ID this long after pressing unsubscribe -> back to subscribed (0 = never)
#define VERIFY_BAR_MS 45000         // how long the fake progress bar takes to crawl to 99%
#define VERIFY_SAFETY_MS 120000     // if Python never sends "verified", finish verifying anyway after this long
#define UNSUBBED_HOLD_MS 15000      // how long state 4 lasts before going back to state 0

#define SIGNUP_FEE_CENTS 999        // bill when you subscribe ($9.99)
#define RECURRING_FEE_CENTS 99      // added every BILL_TICK_MS
#define BILL_TICK_MS 1000
#define EXTRA_FEE_EVERY_MS 8000     // a random named fee gets added this often

// ------------------------------------------------------------------ game state
#define UNSUBBED 0
#define SUBBED 1
#define UNSUB_PRESSED 2
#define VERIFYING 3
#define UNSUBSCRIBED 4

int gameState = UNSUBBED;
unsigned long stateStart = 0;   // millis() when the current state began
unsigned long lastSend = 0;     // last time the state was sent to Python

// ------------------------------------------------------------------ inputs (debounced)
struct DebouncedInput {
  int pin;
  int stable;                 // settled reading (HIGH/LOW)
  int lastRaw;
  unsigned long lastChange;
  unsigned long debounceMs;
};

DebouncedInput subButton, unsubButton, cardReader;

void initInput(DebouncedInput &in, int pin, unsigned long debounceMs) {
  pinMode(pin, INPUT_PULLUP);
  in.pin = pin;
  in.stable = in.lastRaw = digitalRead(pin);
  in.lastChange = millis();
  in.debounceMs = debounceMs;
}

// returns true once each time the input settles into a new state
bool updateInput(DebouncedInput &in) {
  int raw = digitalRead(in.pin);
  if (raw != in.lastRaw) {
    in.lastRaw = raw;
    in.lastChange = millis();
  }
  if (raw != in.stable && millis() - in.lastChange > in.debounceMs) {
    in.stable = raw;
    return true;
  }
  return false;
}

// ------------------------------------------------------------------ LCD
LiquidCrystal_I2C lcd(LCD_ADDRESS, 16, 2);
char shownLine[2][17] = {"", ""};

// writes a line only if it changed, so the screen doesn't flicker
void showLine(int row, const char *text) {
  char padded[17];
  snprintf(padded, sizeof(padded), "%-16s", text);
  if (strcmp(padded, shownLine[row]) != 0) {
    lcd.setCursor(0, row);
    lcd.print(padded);
    strcpy(shownLine[row], padded);
  }
}

// ------------------------------------------------------------------ the bill
long billCents = 0;
unsigned long lastBillTick = 0;
unsigned long lastExtraFee = 0;
const char *bannerText = "";     // shown on line 1 instead of "Your total bill:" for a moment
unsigned long bannerUntil = 0;

const int NUM_FEES = 6;
const char *feeNames[NUM_FEES] = {"+Puppy upkeep", "+Forever fee", "+Family tax", "+Breathing fee", "+Loyalty fee", "+Fee fee"};
const int feeCents[NUM_FEES] = {499, 299, 199, 99, 349, 150};

void showBanner(const char *text, unsigned long ms) {
  bannerText = text;
  bannerUntil = millis() + ms;
}

// the bill keeps growing while you're subscribed, even while you try to leave
void updateBill() {
  unsigned long now = millis();
  if (now - lastBillTick >= BILL_TICK_MS) {
    lastBillTick = now;
    billCents += RECURRING_FEE_CENTS;
  }
  if (now - lastExtraFee >= EXTRA_FEE_EVERY_MS) {
    lastExtraFee = now;
    int i = random(NUM_FEES);
    billCents += feeCents[i];
    showBanner(feeNames[i], 2000);
  }
}

// ------------------------------------------------------------------ Biscuit's servo
Servo puppyServo;
int puppyAngle = PUPPY_HOME_ANGLE;
int puppyTarget = PUPPY_HOME_ANGLE;
unsigned long puppyMoveAt = 0;     // when a delayed move to the shelter starts (0 = none waiting)
unsigned long lastPuppyStep = 0;

void sendPuppyHome() {
  puppyMoveAt = 0;
  puppyTarget = PUPPY_HOME_ANGLE;
}

// moves the servo one degree at a time so Biscuit slides away slowly
void updatePuppy() {
  if (puppyMoveAt != 0 && millis() >= puppyMoveAt) {
    puppyMoveAt = 0;
    puppyTarget = PUPPY_SHELTER_ANGLE;
  }
  if (puppyAngle != puppyTarget && millis() - lastPuppyStep >= PUPPY_STEP_MS) {
    lastPuppyStep = millis();
    puppyAngle += (puppyTarget > puppyAngle) ? 1 : -1;
    puppyServo.write(puppyAngle);
  }
}

// ------------------------------------------------------------------ unsubscribe-button stepper
const int motorPins[4] = {motorControllerIn1Pin, motorControllerIn2Pin, motorControllerIn3Pin, motorControllerIn4Pin};
const byte halfStep[8][4] = {
  {1, 0, 0, 0}, {1, 1, 0, 0}, {0, 1, 0, 0}, {0, 1, 1, 0},
  {0, 0, 1, 0}, {0, 0, 1, 1}, {0, 0, 0, 1}, {1, 0, 0, 1}
};
const long wiggleRange = (long)UNSUB_WIGGLE_DEGREES * STEPS_PER_REV / 360;

long stepperPos = 0;          // current position in steps (0 = middle)
long stepperTarget = 0;
bool wiggling = false;
bool coilsOn = false;
unsigned long lastStepUs = 0;
unsigned long nextWiggleAt = 0;

void stepperCoils(long pos) {
  int s = ((pos % 8) + 8) % 8;
  for (int p = 0; p < 4; p++) digitalWrite(motorPins[p], halfStep[s][p]);
  coilsOn = true;
}

void stepperRelease() {
  if (!coilsOn) return;
  for (int p = 0; p < 4; p++) digitalWrite(motorPins[p], LOW);
  coilsOn = false;
}

// on = dodge around randomly; off = go back to the middle and stop
void setWiggle(bool on) {
  wiggling = on;
  if (on) nextWiggleAt = millis();
  else stepperTarget = 0;
}

void updateStepper() {
  if (stepperPos == stepperTarget) {
    if (wiggling) {
      if (millis() >= nextWiggleAt) {
        long t;
        do {   // pick a new spot that's a decent distance from where it is now
          t = random(-wiggleRange, wiggleRange + 1);
        } while (labs(t - stepperPos) < wiggleRange / 3);
        stepperTarget = t;
      }
    } else {
      stepperRelease();   // parked in the middle: turn the coils off so the motor stays cool
    }
    return;
  }
  if (micros() - lastStepUs >= STEPPER_STEP_US) {
    lastStepUs = micros();
    stepperPos += (stepperTarget > stepperPos) ? 1 : -1;
    stepperCoils(stepperPos);
    if (stepperPos == stepperTarget && wiggling) {
      nextWiggleAt = millis() + random(150, 900);   // short random pause before the next dodge
    }
  }
}

// ------------------------------------------------------------------ talking to Python
void sendState() {
  Serial.println(gameState);
  lastSend = millis();
}

void setState(int newState) {
  int oldState = gameState;
  gameState = newState;
  stateStart = millis();
  sendState();

  if (newState == UNSUBBED) {
    setWiggle(false);
    sendPuppyHome();          // a fresh Biscuit for the next customer
    billCents = 0;
  } else if (newState == SUBBED) {
    setWiggle(true);
    if (oldState == UNSUBBED) {
      billCents = SIGNUP_FEE_CENTS;
      lastBillTick = lastExtraFee = millis();
    } else {                  // came back from trying to unsubscribe
      sendPuppyHome();
      showBanner("Welcome back!", 3000);
    }
  } else if (newState == UNSUB_PRESSED) {
    setWiggle(false);
  } else if (newState == UNSUBSCRIBED) {
    setWiggle(false);
  }
}

char rxLine[32];
int rxLen = 0;

void handleMessage(const char *msg) {
  if (gameState != VERIFYING) return;
  if (strcmp(msg, "puppy") == 0) {
    puppyMoveAt = millis() + PUPPY_MOVE_DELAY_MS;
    if (puppyMoveAt == 0) puppyMoveAt = 1;
  } else if (strcmp(msg, "verified") == 0) {
    setState(UNSUBSCRIBED);
  }
}

void readPython() {
  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\n' || c == '\r') {
      rxLine[rxLen] = '\0';
      if (rxLen > 0) handleMessage(rxLine);
      rxLen = 0;
    } else if (rxLen < (int)sizeof(rxLine) - 1) {
      rxLine[rxLen++] = c;
    }
  }
}

// ------------------------------------------------------------------ screen for each state
void updateScreen() {
  unsigned long now = millis();
  char line[17];

  if (gameState == UNSUBBED) {
    const char *pitch[3] = {"Press SUBSCRIBE!", "Only $9.99/mo*", "*forever"};
    showLine(0, "  FOREVERCORP");
    showLine(1, pitch[(now / 2000) % 3]);

  } else if (gameState == SUBBED) {
    showLine(0, now < bannerUntil ? bannerText : "Your total bill:");
    snprintf(line, sizeof(line), "$%ld.%02ld", billCents / 100, billCents % 100);
    showLine(1, line);

  } else if (gameState == UNSUB_PRESSED) {
    showLine(0, "To unsubscribe,");
    showLine(1, (now / 500) % 2 ? "insert ID below" : "");

  } else if (gameState == VERIFYING) {
    bool puppyBusy = (puppyMoveAt != 0) || (puppyAngle != puppyTarget);
    showLine(0, puppyBusy ? "Rehoming Biscuit" : "Verifying ID...");
    long pct = (long)((now - stateStart) * 100 / VERIFY_BAR_MS);
    if (pct > 99) pct = 99;   // stuck at 99% until Python says it's done
    int cells = pct * 12 / 100;
    for (int i = 0; i < 12; i++) line[i] = (i < cells) ? (char)255 : ' ';   // 255 = solid block
    snprintf(line + 12, sizeof(line) - 12, " %2ld%%", pct);
    showLine(1, line);

  } else if (gameState == UNSUBSCRIBED) {
    showLine(0, "Unsubscribed.");
    showLine(1, "You're temporary");
  }
}

// ------------------------------------------------------------------ setup and main loop
void setup() {
  Serial.begin(9600);

  initInput(subButton, subButtonPin, 40);
  initInput(unsubButton, unsubscribeButtonPin, 40);
  initInput(cardReader, cardReaderPin, 100);

  for (int p = 0; p < 4; p++) {
    pinMode(motorPins[p], OUTPUT);
    digitalWrite(motorPins[p], LOW);
  }

  puppyServo.setPeriodHertz(50);
  puppyServo.attach(servoPin, 500, 2400);
  puppyServo.write(PUPPY_HOME_ANGLE);

  Wire.begin(screenSDAPin, screenSCLPin);   // must come before lcd.init() so it uses pins 17/18
  lcd.init();
  lcd.backlight();
  lcd.clear();

  setState(UNSUBBED);
}

void loop() {
  bool subPressed = updateInput(subButton) && subButton.stable == LOW;
  bool unsubPressed = updateInput(unsubButton) && unsubButton.stable == LOW;
  updateInput(cardReader);
  bool cardIn = (cardReader.stable == CARD_INSERTED_LEVEL);
  readPython();

  unsigned long inState = millis() - stateStart;

  if (gameState == UNSUBBED) {
    if (subPressed) setState(SUBBED);

  } else if (gameState == SUBBED) {
    if (unsubPressed) setState(UNSUB_PRESSED);

  } else if (gameState == UNSUB_PRESSED) {
    if (cardIn) setState(VERIFYING);
    else if (UNSUB_TIMEOUT_MS > 0 && inState > UNSUB_TIMEOUT_MS) setState(SUBBED);

  } else if (gameState == VERIFYING) {
    if (!cardIn) setState(SUBBED);                       // pulled the ID out: still subscribed!
    else if (inState > VERIFY_SAFETY_MS) setState(UNSUBSCRIBED);

  } else if (gameState == UNSUBSCRIBED) {
    if (inState > UNSUBBED_HOLD_MS) setState(UNSUBBED);
  }

  if (gameState == SUBBED || gameState == UNSUB_PRESSED || gameState == VERIFYING) updateBill();
  updatePuppy();
  updateStepper();
  updateScreen();

  if (millis() - lastSend >= 500) sendState();   // repeat the state so Python never misses it
}