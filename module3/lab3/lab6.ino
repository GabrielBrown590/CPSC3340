#include <WiFi.h>

const char* ssid = "yale wireless";
const char* password = "";

const char* pcIP = "10.67.65.131";
const int pcPort = 3333;

int lightSensorPin = 4;

WiFiUDP udp;

void setup() {
    Serial.begin(115200);
   
    WiFi.begin(ssid);

    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
}

void loop() {
    int brightness = analogRead(lightSensorPin);

    udp.beginPacket(pcIP, pcPort);
    udp.write((uint8_t*)&brightness, sizeof(brightness));
    udp.endPacket();
}
