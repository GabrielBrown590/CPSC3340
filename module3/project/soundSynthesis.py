from pyo import *
import random
import socket

TEST_MODE = True
IP = "0.0.0.0"
PORT = 3333
sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.bind((IP, PORT))


s = Server(duplex=0, buffersize=1024)
s.boot()
s.start()

scale = midiToHz([57, 59, 61, 64, 66])   # A, B, C#, E, F#: the A major pentatonic scale so everything sounds good

#sea noise
seaSwell = Sine(freq=0.1, mul=0.5, add=0.7)
seaNoise = PinkNoise(mul=0.2 * seaSwell)
sea = ButLP(seaNoise, 300+900*seaSwell)


#wind
class Wind:
    def __init__(self):
        self.volume = SigTo(0, 10)
        self.gust = Randi(min=0.2, max=1, freq=random.uniform(0.2, 0.4))
        self.pitch = Randi(min=0.9, max=1.1, freq=0.15)
        self.oscillation = ButBP(Noise(mul=0.45 * self.gust * self.volume), freq=scale[0] * 2 * self.pitch, q=5)

    def start(self):
        self.oscillation.freq = random.choice(scale) * 2 * self.pitch
        self.volume.value = 1

winds = [Wind() for i in range(3)]
windMix = Mix([w.oscillation for w in winds], voices=1)


#foghorn
class Foghorn:
    def __init__(self):
        self.volume = SigTo(0, 30)
        self.envelope = Adsr(attack=1.0, decay=0, sustain=1, release=2.0, dur=7)
        self.sag = Linseg([(0, 1), (5.2, 1), (7, 0.88)], initToFirstVal=True)        # sinks as it dies
        self.sub = SuperSaw(freq=scale[0] / 4 * self.sag, detune=0.2, bal=0.8, mul=0.6)   # A, 55 Hz
        self.horn = SuperSaw(freq=scale[0] / 2 * self.sag, detune=0.3, bal=0.8)           # A, 110 Hz
        self.growl = Sine(freq=32, mul=0.25, add=1)                                       # the rasp
        self.driven = Disto((self.sub + self.horn) * 0.6 * self.growl, drive=0.9, slope=0.6)
        self.blastSound = ButLP(self.driven, freq=180 + 1400 * self.envelope,
                                mul=0.16 * self.envelope * self.volume)
        self.echo = ButLP(Delay(self.blastSound, delay=1.6, feedback=0.4, maxdelay=2), freq=350)
        self.oscillation = self.blastSound + self.echo        # what gets mixed, like the bells
        self.pattern = Pattern(self.blast, time=30)           # first blast once it has faded in

    def blast(self):
        self.envelope.play()
        self.sag.play()
        self.pattern.time = random.uniform(40, 90)            # long, irregular gaps between blasts

    def start(self):
        self.volume.value = 1
        self.pattern.play()

foghorns = [Foghorn() for i in range(2)]
foghornMix = Mix([f.oscillation for f in foghorns], voices=1)

#bells.
# We have 12 bell objects that always exist, when ring is called they start a new pattern
class Bell:
    #create the envelope and oscillaton on creaton of bell object. Create the pattern to call ring()
    def __init__(self):
        self.envelope = Adsr(attack=0.005, decay=2.5, sustain=0, release=0.1, dur=2.6)
        self.volume = SigTo(0,30)
        self.oscillation = FM(carrier= scale[0],ratio=1.4, index=6 * self.envelope, mul=0.1 * self.envelope * self.volume)
        self.pattern = Pattern(self.ring, time=4)
    #ring functon chooses the note and plays it
    def ring(self):
        self.envelope.play()
        self.pattern.time = random.uniform(3,8)
    def start(self):
        self.oscillation.carrier = random.choice(scale)
        self.pattern.play()
        self.volume.value = 1
bells = [Bell() for i in range(12)]
bellMix = Mix([b.oscillation for b in bells], voices=1)


#morse code
morseEnvelope = Adsr(attack=0.005, decay=0, sustain=1, release=0.01, dur=0.09)
morseOscillation = Sine(freq=scale[2]*2, mul=0.1*morseEnvelope)
beepsLeft = 20
def codeTap():
    global beepsLeft
    morseEnvelope.dur=random.choice([0.09, 0.27]) #randomly pick dot or dash
    morseEnvelope.play()
    beepsLeft-=1
    if(beepsLeft <= 0):
        morsePattern.stop()
    else:
        morsePattern.time=morseEnvelope.dur+random.choice([0.15, 0.2])
morsePattern = Pattern(codeTap, 0.9)

def playRandomCode():
    global beepsLeft
    beepsLeft = random.randint(10,20)
    morsePattern.play()

    
    

#voyage
nextBell = 0
nextWind = 0
nextFoghorn = 0

def newVoyage():
    global nextBell, nextWind, nextFoghorn
    voice = random.choices(["bell", "wind", "foghorn"], weights=[6, 2, 1])[0]
    if voice == "bell":
        bells[nextBell].start()
        nextBell = (nextBell + 1) % len(bells)
    elif voice == "wind":
        winds[nextWind].start()
        nextWind = (nextWind + 1) % len(winds)
    else:
        foghorns[nextFoghorn].start()
        nextFoghorn = (nextFoghorn + 1) % len(foghorns)
    playRandomCode()

if TEST_MODE:
    voyages = Pattern(newVoyage, time=20)
    voyages.play()




#s.recstart("bellsSeaWindMorse.wav")
#combining the sounds
verb = Freeverb(windMix + sea + bellMix + foghornMix, size=0.9, damp=0.6, bal=0.7)
morseVerb = Freeverb(morseOscillation, size=0.4, damp=0.6, bal=0.2)
master = Compress(verb + morseVerb, thresh=-12, ratio=6, risetime=0.005, falltime=0.2, knee=0.5)
output = Pan(master, outs=2, pan=0.5).out()
try:
    while True:
        data, addr = sock.recvfrom(1024)
        print("voyage from", addr, data, flush=True)
        newVoyage()
finally:
    s.stop()
    #s.recstop()
