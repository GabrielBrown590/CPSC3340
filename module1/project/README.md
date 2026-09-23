The project Evolving fish depicts a sort of neon hyper space fish bowl filled with fish that reproduce over time.

The project used p5.js and is based all around a fish class that is used to model a fish. Initially these fish are generated randomly all around the fishbowl however when they collide they have a chance to reproduce creating a new fish who's characteristics are generated from his two parents.

The characteristics of a fish are provided below in the excerpt from my generate normal fish function:
type: random(["r", "e"]),
x: random(w, width-w), y: random(h, height-h),
w: w, h: h,
c1RadiusFactor: random(0, 0.5), c2RadiusFactor: random(0, 0.5), c3RadiusFactor: random(0, 0.5), c4RadiusFactor: random(0, 0.5),
eyeSizeFactor: random(0.1, 0.3),
eyeOffsetx: random(0.65, 0.9), eyeOffsety: random(0.35, 0.65),
tail:{
    type:random(["w","n"]),
    innerxFactor: random(0.3, 0.7),
    outerxFactor: random(0.2, 0.6),
    spreadFactor: random(0.4, 1.0)
},
vx:random(-3, 3), vy:random(-3,3),
color: random(colorPallete)

Of notable interest in my project is my implementaion of HSB color in order to generate random yet appealing colors. This can be found largely in my colors.js file. Also the use of an autostart file in order to run this project automatically on a raspberry pi.

To run simply run the index.html file.

To run automatically: install the files in piFiles to your home directory, this includes an autostart file which will be automatically run by a raspberry Pi on boot. Then copy Evolving Fish folder into your home directory and change the autostart file to point at the new location of index.html