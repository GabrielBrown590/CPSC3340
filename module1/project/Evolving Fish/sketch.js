    class Fish
    {
        constructor(options)
        {
            //type. Either e for elliptical or r for rectangualar
            this.type = options.type

            //Fish location and dimensions in pixels.
            this.x = options.x;
            this.y = options.y;
            this.width = options.w
            this.height = options.h

            //caculate corner radii. CRadiusFactor is a value between 0 and 1 representing radius size relative to size of fish
            this.c1Radius=options.c1RadiusFactor * min(this.height, this.width);
            this.c2Radius=options.c2RadiusFactor * min(this.height, this.width);
            this.c3Radius=options.c3RadiusFactor * min(this.height, this.width);
            this.c4Radius=options.c4RadiusFactor * min(this.height, this.width);

            //set the center coodinates
            this.centerx = options.x;
            this.centery = options.y;
                
            
            //calculate eye location
            this.eyex = lerp(this.centerx-0.5*this.width, this.centerx+0.5*this.width, options.eyeOffsetx);
            this.eyey = lerp(this.centery-0.5*this.height, this.centery+0.5*this.height, options.eyeOffsety);
        
            //calculate eye size in pixels
            this.eyeSize = options.eyeSizeFactor * min(this.height, this.width);
            


            //set all tail factors

            //sets tail type, either wide where the 2 points of triangle are outward or narrow where the 2 points are inwards
            this.tailType = options.tail.type;

            //calculate the tail points. innerxFactor is how far into the fish the tail starts. outerxFactor is how far out the tail goes. spreadfactor is how far spread the points of the fish tail are.
            this.tailInnerx = this.x - options.tail.innerxFactor * 0.5  * this.width;
            this.tailOuterx = this.x- 0.5*this.width - options.tail.outerxFactor * this.width;
            this.tailTopy = this.y - options.tail.spreadFactor * 0.5 * this.height;
            this.tailBoty = this.y + options.tail.spreadFactor * 0.5 * this.height;

            //color
            this.color = options.color;
        }

        display()
        {
            push();

            //TODO color
            fill("blue")

            //fish tail
            fill("blue");
            if (this.tailType == "w")
                {
                    //triangle with one point at inner x, and two at outer x. The outer points are at tailTopy and tailBoty
                    triangle(this.tailInnerx, this.y, this.tailOuterx, this.tailTopy, this.tailOuterx, this.tailBoty)
                }
            else if (this.tailType == "n")
                {
                    //triangle with one point at outer x and two at inner x. Outer point has y centered and the inner points are at tailTopy and tailBoty
                    triangle(this.tailInnerx, this.tailTopy, this.tailInnerx, this.tailBoty, this.tailOuterx, this.y)
                }  

            //fish body
            if(this.type == "r")
                {
                    rect(this.x, this.y, this.width, this.height,
                        this.c1Radius, this.c2Radius, this.c3Radius, this.c4Radius);
                }
            else if(this.type == "e")
                {
                    ellipse(this.x, this.y, this.width, this.height);
                }

            
            //fish eye
            fill("black")
            circle(this.eyex, this.eyey, this.eyeSize);

            

            pop();
        }

        collidingWithOther(other)
        {
            //calculate rectangle that encompasses this fish
            let myLeft = this.x - 0.5 * this.width;
            let myRight = this.x + 0.5 * this.width;
            let myTop = this.y - 0.5 * this.height;
            let myBottom = this.y + 0.5 * this.height;
            
            //calculate rectangle encompassing other fish
            let otherLeft = other.x - 0.5 * other.width;
            let otherRight = other.x + 0.5 * other.width;
            let otherTop = other.y - 0.5 * other.height;
            let otherBottom = other.y + 0.5 * other.height;

            //test to make sure there is no overlap
            return myLeft < otherRight && myRight > otherLeft &&
                myTop < otherBottom && myBottom > otherTop;
        }
    }
    var fishArr = [];
    function generateNormalFish()
    {
        let attemptNumber = 1;
        //creates a fish and ensures it does not occupy the space of another fish.
        do
        {
            //mark that this is a new attempt so we dont try too many times
            attemptNumber++;

            //generate random height and width and rest of options based on what I consider semi-normal paramaters
            let w = random(60, 220);
            let h = random(30, 110);
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
                color: "blue"
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
        for(let i = 0; i< 10; i++)
            {
                fishArr[i] = generateNormalFish();
            }
    }

    function draw() {
        background("220");
        for(let i = 0; i< fishArr.length; i++)
            {
                fishArr[i].display();
            }
    }
