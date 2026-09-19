

    var fishArr = [];
    var colorPallete = [];
    var maxFish = 20;

    function checkBreeding()
    {
        let breedingChance = 0.02
        //check every fish every frame
        for(let i = 0; i < fishArr.length; i++)
            {
                //if not ready yet, decrease frames until ready
                if(fishArr[i].framesUntilReady > 0)
                    {
                        fishArr[i].framesUntilReady -= 1;
                    }
                else
                    {
                        //otherwise check for possible collissions
                        for(let j = 0; j < fishArr.length; j++)
                        {
                            if(
                                i !== j && //fish cant breed with themselves
                                fishArr[i].collidingWithOther(fishArr[j]) &&
                                fishArr[j].framesUntilReady == 0
                            )
                            {
                                if(random() < breedingChance)
                                    {
                                        fishArr.push(fishArr[i].reproduce(fishArr[j]));
                                        fishArr[i].framesUntilReady = 600;
                                        fishArr[j].framesUntilReady = 600;
                                    }
                            }
                        }
                    }
                
            }

            //cap fish population
            
            //find # of fish who arn't marked as leaving
            let numOfFishStaying = 0;
            for(let i = 0; i<fishArr.length; i++)
                {
                    if (!fishArr[i].isLeaving) numOfFishStaying++;
                }

            if(numOfFishStaying > maxFish)
            {
                //find oldest fish not marked as leaving
                for(let i = 0; i < fishArr.length; i++)
                    {
                        if (!fishArr[i].isLeaving)
                            {
                                fishArr[i].startLeaving()
                                break;
                            }
                    }
            }
    }

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

    class Star
    {
        constructor() 
        {
        this.x = random(width);
        this.y = random(height);
        this.baseSize = random(1, 3);
        this.twinklePhase = random(TWO_PI);
        this.twinkleSpeed = random(0.02, 0.05);
        }

            display() 
            {
            let twinkle = (sin(frameCount * this.twinkleSpeed + this.twinklePhase) + 1) / 2; // 0 to 1
            let brightness_ = map(twinkle, 0, 1, 40, 100);
            let size = this.baseSize * map(twinkle, 0, 1, 0.7, 1.3);

            noStroke();
            drawingContext.shadowBlur = 4;
            drawingContext.shadowColor = color(0, 0, 100);
            fill(0, 0, brightness_);
            circle(this.x, this.y, size);
            drawingContext.shadowBlur = 0;
            }
    }
        
    var stars = [];
    function setup() {
        createCanvas(800, 600);
        rectMode(CENTER);
        colorMode(HSB, 360, 100, 100, 100);
        //setup color pallete
        colorPallete.push(color(15, 85, 100));   // coral red
        colorPallete.push(color(30, 90, 100));   // tangerine
        colorPallete.push(color(45, 85, 100));   // gold
        colorPallete.push(color(50, 40, 100));   // pale yellow
        colorPallete.push(color(190, 70, 95));   // sky cyan
        colorPallete.push(color(205, 80, 90));   // ocean blue
        colorPallete.push(color(260, 55, 90));   // periwinkle purple
        colorPallete.push(color(320, 65, 95));   // hot pink
        colorPallete.push(color(340, 50, 100));  // rose
        colorPallete.push(color(0, 0, 100));     // white

        for (let i = 0; i < 80; i++) 
        {
        stars.push(new Star());
        }

        for(let i = 0; i< 10; i++)
            {
                fishArr[i] = generateNormalFish();
            }
    }

    function draw() {
        background(260, 60, 6, 20);
            for (let star of stars) 
            {
                star.display();
            }

        checkBreeding();
        
        //get rid of any fish that are leaving and are off screen
        for(let i = 0; i < fishArr.length; i++)
            {
                if (fishArr[i].isOffScreen() && fishArr[i].isLeaving)
                    {
                        fishArr.splice(i,1);
                        i--;
                    }
            }

        for(let i = 0; i< fishArr.length; i++)
            {
                fishArr[i].move();
                fishArr[i].display();
            }
    }
