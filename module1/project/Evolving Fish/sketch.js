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
                
            
            //calculate eye location relative to center
            this.eyexOffset = lerp(-0.5*this.width, 0.5*this.width, options.eyeOffsetx);
            this.eyeyOffset = lerp(-0.5*this.height, 0.5*this.height, options.eyeOffsety);
        
            //calculate eye size in pixels
            this.eyeSize = options.eyeSizeFactor * min(this.height, this.width);
            


            //set all tail factors

            //sets tail type, either wide where the 2 points of triangle are outward or narrow where the 2 points are inwards
            this.tailType = options.tail.type;

            //calculate the tail points. innerxFactor is how far into the fish the tail starts. outerxFactor is how far out the tail goes. spreadfactor is how far spread the points of the fish tail are.
            this.tailInnerxOffset = -options.tail.innerxFactor * 0.5  * this.width;
            this.tailOuterxOffset = -0.5*this.width - options.tail.outerxFactor * this.width;
            this.tailTopyOffset = -options.tail.spreadFactor * 0.5 * this.height;
            this.tailBotyOffset = options.tail.spreadFactor * 0.5 * this.height;

            //velocity
            this.vx = options.vx;
            this.vy = options.vy;

            //angle. Starts off facing straight
            this.angle = 0

            //color
            this.color = options.color;
        }
        move()
        {
            //change velocity randomly
            this.vx += random(-0.2,0.2)
            this.vy += random(-0.2,0.2)

            //change position based on velocity
            this.x += this.vx;
            this.y += this.vy;

            // face direction of travel
            this.angle = atan2(this.vy, this.vx); 
        }
        display()
        {
            push();
            translate(this.x, this.y);
            rotate(this.angle);
            translate(-this.x, -this.y);

            //TODO color
            fill("blue")

            //fish tail
            fill("blue");
            if (this.tailType == "w")
                {
                    //triangle with one point at inner x, and two at outer x. The outer points are at tailTopy and tailBoty
                    triangle(this.tailInnerxOffset+this.x, this.y, this.tailOuterxOffset+this.x, this.tailTopyOffset+this.y, this.tailOuterxOffset+this.x, this.tailBotyOffset+this.y)
                }
            else if (this.tailType == "n")
                {
                    //triangle with one point at outer x and two at inner x. Outer point has y centered and the inner points are at tailTopy and tailBoty
                    triangle(this.tailInnerxOffset+this.x, this.tailTopyOffset+this.y, this.tailInnerxOffset+this.x, this.tailBotyOffset+this.y, this.tailOuterxOffset+this.x, this.y)
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
            circle(this.eyexOffset+this.x, this.eyeyOffset+this.y, this.eyeSize);

            

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
            let w = random(40, 120);
            let h = random(20, 60);
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
                vx:random(-10, 10), vy:random(-10,10),
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
                fishArr[i].move();
                fishArr[i].display();
            }
    }
