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

Meeting submission requirements:
This project runs automatically on start. It further uses conditionals to activate certain features (advanced fish tail waggling and stars) based on whether the screen is big enough/too big to handle them. It also varies the amount of fish based on screen size to keep the Pi from overloading while also keeping the screen occupied.

Link to video demo:https://www.youtube.com/watch?v=UEdl5F6Hpaw
link to blogpost going into more detail:https://app.notion.com/p/Portfolio-project-1-3e454524970f8086a017c6097ac607f6?source=copy_link

Blog can also be found in documentation folder