Captain’s radio log: CPSC 3340 Module 3

General Overview & Artistic Vision

Blog post with embedded videos showing project in action:https://app.notion.com/p/scottpetersen/Gabriel-s-Project-Captain-s-radio-log-4091da996fce804f9be5f3a2512f1af2

I was inspired in the creation of this installation by the maritime log books that all ships keep. These logs keep track of not only all the journeys a ship has been on but also things like the difficulty of a voyage and the danger encountered on the way. I was then further inspired by maritime radio culture and the maritime radio sonic aesthetic.

This inspired me to make a digital log that could keep track of its own journeys without the input of a human and then sonify them based on the characteristics of the journey.

Thus the project is split into 2 parts, a logbook that records journeys (esp32) and a radio receiver that receives them (raspberry pi).

The book. The ESP32 reads a piezo taped inside the book's cavity. Vibration above a threshold starts a journey, and 10 seconds of stillness ends it. During the journey it counts light and rough handling events. When the journey ends, it sends the whole journey to the Pi as one UDP packet. A copper tape switch (the DIY sensor) reports when the book is opened or closed.

The radio. The Pi runs a program sonifying esp data using PYO. There is a constant sea, plus a voice for each journey up to a max (12 bells, 3 winds, 2 foghorns). Each voyage plays a Morse burst and starts the next voice in its pool. When a pool is full, the newest voyage replaces the oldest, so the sound only remembers recent voyages.

Journey	Voice	    Shaped by
Longer than 30 s	Foghorn	Length → blast length (4–9 s). Roughness → distortion and rasp
Any rough events	Bell	Length → how long it rings. Roughness → bell tone
Otherwise	Wind	Random pitch from the scale

Opening the book hushes the sea and wind, and rings each logged bell once, oldest first, like reading back the log. Closing it brings the sea back.

Hardware
Part	Notes
ESP32	Inside the book
Piezo	GPIO 4
Copper tape switch	GPIO 40 and GND
LiPo + LiPo Rider Plus
Raspberry Pi 5	The radio

Setup:
Turn on esp32 and plug in Pi. Everything else happens automatically

Code:
esp32code runs on esp32
sounSynthesis.py runs on radio/py