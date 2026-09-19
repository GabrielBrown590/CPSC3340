var geneticVariance = 0.3;//var to decide how much randomness is introduced into reproduction

//helper function that generates a random number between the two other numbers and applies genetic variance. Doesnt care about which num comes first
function genOffspringNum(p1Num, p2Num)
{
    let lowerNum = min(p1Num, p2Num);
    let upperNum = max(p1Num, p2Num);
    let retNum = random(lowerNum, upperNum) * random(1-geneticVariance,1+geneticVariance);
    return retNum;
}

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

            //mark fish as not leaving
            this.isLeaving = false;

            //caculate corner radii. CRadiusFactor is a value between 0 and 1 representing radius size relative to size of fish
            this.c1Radius=options.c1RadiusFactor * min(this.height, this.width);
            this.c2Radius=options.c2RadiusFactor * min(this.height, this.width);
            this.c3Radius=options.c3RadiusFactor * min(this.height, this.width);
            this.c4Radius=options.c4RadiusFactor * min(this.height, this.width);
            //save the radius factors for offpsring reasons
            this.c1RadiusFactor=options.c1RadiusFactor;
            this.c2RadiusFactor=options.c2RadiusFactor;
            this.c3RadiusFactor=options.c3RadiusFactor;
            this.c4RadiusFactor=options.c4RadiusFactor;

            //set the center coodinates
            this.centerx = options.x;
            this.centery = options.y;
                
            
            //calculate eye location relative to center
            this.eyexOffset = lerp(-0.5*this.width, 0.5*this.width, options.eyeOffsetx);
            this.eyeyOffset = lerp(-0.5*this.height, 0.5*this.height, options.eyeOffsety);
            //save original eyeoffset for offspring
            this.originalEyeOffsetx = options.eyeOffsetx;
            this.originalEyeOffsety = options.eyeOffsety;
        
            //calculate eye size in pixels
            this.eyeSize = options.eyeSizeFactor * min(this.height, this.width);
            //save original eyesize factor
            this.eyeSizeFactor=options.eyeSizeFactor


            //set all tail factors

            //sets tail type, either wide where the 2 points of triangle are outward or narrow where the 2 points are inwards
            this.tailType = options.tail.type;

            //calculate the tail points. innerxFactor is how far into the fish the tail starts. outerxFactor is how far out the tail goes. spreadfactor is how far spread the points of the fish tail are.
            this.tailInnerxOffset = -options.tail.innerxFactor * 0.5  * this.width;
            this.tailOuterxOffset = -0.5*this.width - options.tail.outerxFactor * this.width;
            this.tailTopyOffset = -options.tail.spreadFactor * 0.5 * this.height;
            this.tailBotyOffset = options.tail.spreadFactor * 0.5 * this.height;
            //save the tail factors for offspring reasons
            this.tail = options.tail;


            //velocity
            this.vx = options.vx;
            this.vy = options.vy;

            //angle. Starts off facing straight
            this.angle = 0

            //color
            this.color = options.color;

            //Frames until ready to Reproduce
            this.framesUntilReady = 10 * 60; //new fish cant reproduce for 10 seconds
        }
        reproduce(otherFish)
        {
            let childOptions = 
            {
                type: random([this.type, otherFish.type]),
                x: (this.x + otherFish.x)/2, y: (this.y + otherFish.y)/2,
                w: genOffspringNum(this.width, otherFish.width),
                h: genOffspringNum(this.height, otherFish.height),
                c1RadiusFactor: genOffspringNum(this.c1RadiusFactor, otherFish.c1RadiusFactor),
                c2RadiusFactor: genOffspringNum(this.c2RadiusFactor, otherFish.c2RadiusFactor),
                c3RadiusFactor: genOffspringNum(this.c3RadiusFactor, otherFish.c3RadiusFactor),
                c4RadiusFactor: genOffspringNum(this.c4RadiusFactor, otherFish.c4RadiusFactor),
                eyeSizeFactor: genOffspringNum(this.eyeSizeFactor, otherFish.eyeSizeFactor),
                eyeOffsetx: genOffspringNum(this.originalEyeOffsetx, otherFish.originalEyeOffsetx),
                eyeOffsety: genOffspringNum(this.originalEyeOffsety, otherFish.originalEyeOffsety),
                tail:{
                    type:random([this.tailType, otherFish.tailType]),
                    innerxFactor: genOffspringNum(this.tail.innerxFactor, otherFish.tail.innerxFactor),
                    outerxFactor: genOffspringNum(this.tail.outerxFactor, otherFish.tail.outerxFactor),
                    spreadFactor: genOffspringNum(this.tail.spreadFactor, otherFish.tail.spreadFactor)
                },
                vx:random(-3, 3), vy:random(-3,3),
                color: offspringColor(this.color,otherFish.color)
            }
            return new Fish(childOptions)
        }

        move()
        {
            //change velocity randomly
            this.vx += random(-0.2,0.2)
            this.vy += random(-0.2,0.2)

            //cap speed
            let speedLimit=3
            if (this.vx > speedLimit) this.vx = speedLimit;
            if (this.vx < -speedLimit) this.vx = -speedLimit;
            if (this.vy > speedLimit) this.vy = speedLimit;
            if (this.vy < -speedLimit) this.vy = -speedLimit;

            //change position based on velocity
            this.x += this.vx;
            this.y += this.vy;

            //Stay on screen and towards the center as long as fish isnt leaving
            if(!this.isLeaving)
            {
                if(this.x > width || this.x < 0) this.vx = this.vx * -1;
                if(this.y > height || this.y < 0) this.vy = this.vy * -1;
                let centerx = width/2;
                let centery = height/2;
                let pullStrength = 0.015;
                this.vx += (centerx - this.x) * pullStrength * 0.01;
                this.vy += (centery - this.y) * pullStrength * 0.01;
            }
            // face direction of travel(smoothly)
            let targetAngle = atan2(this.vy, this.vx); 
            this.angle = lerp(this.angle, atan2(this.vy, this.vx), 0.03); 
        }
        display()
        {
            noStroke()

            push();
            translate(this.x, this.y);
            rotate(this.angle);
            translate(-this.x, -this.y);

            //TODO color
            fill(this.color)

            //fish tail
            fill(this.color);
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
        startLeaving() {
        this.isLeaving = true;
        // steer toward whichever edge is closest
        let distLeft = this.x;
        let distRight = width - this.x;
        let distTop = this.y;
        let distBottom = height - this.y;
        let minDist = Math.min(distLeft, distRight, distTop, distBottom);

        if (minDist === distLeft) { this.vx = -Math.abs(this.vx) - 1; }
        else if (minDist === distRight) { this.vx = Math.abs(this.vx) + 1; }
        else if (minDist === distTop) { this.vy = -Math.abs(this.vy) - 1; }
        else { this.vy = Math.abs(this.vy) + 1; }
    }

    isOffScreen() {
        return this.x < -this.width || this.x > width + this.width ||
            this.y < -this.height || this.y > height + this.height;
    }
    }