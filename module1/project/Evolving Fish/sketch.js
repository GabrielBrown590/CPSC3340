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

        dispay()
        {
            push();

            //TODO color
            fill("blue")

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
            
            //fish eye
            fill("black")
            circle(this.eyex, this.eyey, this.eyeSize);

            

            pop();
        }
    }
    function generateNormalFish()
    {
        
    }

        var testFishR;

    function setup() {
        createCanvas(800, 600);
        rectMode(CENTER);
        testFishR = new Fish
        ({
            type: "r",
            x: 400, y: 400,
            w: 200, h: 100,
            c1RadiusFactor: 0.2, c2RadiusFactor: 0.2, c3RadiusFactor: 0.2, c4RadiusFactor: 0.2,
            eyeSizeFactor: 0.3,
            eyeOffsetx: 0.5, eyeOffsety: 0.5,
            tail:{
                type:"w",
                innerxFactor:0.5,
                outerxFactor:0.5,
                spreadFactor:0.5
            },
            color: "blue"

        });        
    }

    function draw() {
        background("220");
        testFishR.dispay();
    }
