
//adopted from https://sighack.com/post/procedural-color-algorithms-color-variations
function hsbModify(base, hv, sv, bv) {
    /* The hue should be wrapped around if it crosses 360 */
    new_hue = (hue(base) + hv) % 360;
    new_sat = constrain(saturation(base) + sv, 0, 100);
    new_bri = constrain(brightness(base) + bv, 0, 100);
  return color(new_hue, new_sat, new_bri);
}
    
//original code
    var fishArr = [];
    var colorPallete = [];
    function generateNormalFish()
    {
        const fishScale = 0.6; //a var to scale fish while keeping them proportional
        let attemptNumber = 1;
        //creates a fish and ensures it does not occupy the space of another fish.
        do
        {
            //mark that this is a new attempt so we dont try too many times
            attemptNumber++;

            //generate random height and width and rest of options based on what I consider semi-normal paramaters
            let w = random(40, 120)*fishScale;
            let h = random(20, 60)*fishScale;
            let normalOptions = 
            {
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
            }

            //create this fish using parameters and test if he is colliding with another fish, if so, regenerate him and try again up to 30 times
            var newFish = new Fish(normalOptions);
            var newFishColliding = false;
            for (let i = 0; i < fishArr.length; i++)
                {
                    if(newFish.collidingWithOther(fishArr[i]))
                        {
                            newFishColliding = true;
                            
                        }
                }
        }
        while(newFishColliding && attemptNumber < 50)

        return newFish;
        
    }

        

    function setup() {
        createCanvas(800, 600);
        rectMode(CENTER);
        colorMode(HSB, 360, 100, 100);
        //setup color pallete
        colorPallete.push(color(35, 89, 100));
        colorPallete.push(color(34, 59, 100));
        colorPallete.push(color(0, 0, 100));
        colorPallete.push(color(176, 16, 95));
        colorPallete.push(color(174, 77, 77));

        for(let i = 0; i< 10; i++)
            {
                fishArr[i] = generateNormalFish();
            }
    }

    function draw() {
        background("220");
        for(let i = 0; i< fishArr.length; i++)
            {
                fishArr[i].move();
                fishArr[i].display();
            }
    }
