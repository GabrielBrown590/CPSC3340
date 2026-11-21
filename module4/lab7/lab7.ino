#include <Stepper.h>
#include <ESP32Servo.h>

int stepper1;
int stepper2;
int stepper3;
int stepper4;

int servoPin;
int servoPos;
int numSteps;
Stepper myStepper(2048, 15, 16, 17, 18);

Servo myServo;
void setup(){
  stepper1 = 15;
  stepper2 = 16;
  stepper3 = 17;
  stepper4 = 18;
  servoPin = 5;
  numSteps = 0;
servoPos = 0;
myStepper.setSpeed(10);
myServo.attach(servoPin);
}
void loop(){
myStepper.step(128);
numSteps+= 128;
if (numSteps % 2048 == 0)
{
  if (servoPos != 180)
    servoPos += 10;
  else 
    servoPos = 0;

  myServo.write(servoPos);
}
delay(100);

}