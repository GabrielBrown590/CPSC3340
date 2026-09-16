class Fish
{
    constructor(type,
        x, y, //x and y coodinates of fish
        w, h, //width and height of fish
        c1RadiusFacter, c2RadiusFacter, c3RadiusFacter, c4RadiusFacter, //determines roundness of each corner as a percentage of the fish size. Only matters for rectangular fish
        eyeOffsetx, eyeOffsety, //amount interpreted from start to end of fish for eye position. Ex. 0.5, 0.5 is middle of fish. 0.1, 0.1 is nearer the top left
        color)
    {
        //type. Either e for elliptical or r for rectangualar
        this.type = type

        //Fish location and dimensions.
        this.x = x;
        this.y = y;
        this.width = w
        this.height = h

        //caculate corner radii
        this.c1Radius=c1RadiusFacter * min(this.height, this.width);
        this.c2Radius=c2RadiusFacter * min(this.height, this.width);
        this.c3Radius=c3RadiusFacter * min(this.height, this.width);
        this.c4Radius=c4RadiusFacter * min(this.height, this.width);

        //calculate the center coodinates
        if(this.type == "e")
            {
                this.centerx = x;
                this.centery = y;
            }
        else if (this.type =="r")
            {
                this.centerx = x + 0.5*this.width;
                this.centery = y + 0.5*this.height;
            }
        
        //calculate eye location
        this.eyex = lerp(this.centerx-0.5*this.width, this.centerx+0.5*this.width, eyeOffsetx);
        this.eyey = lerp(this.centery-0.5*this.height, this.centery+0.5*this.height, eyeOffsety);
       
        //color
        this.color = color;
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
        pop();
    }
}

    var testFish;
function setup() {
    createCanvas(800, 600);
     testFish = new Fish("r", 400, 400, 200, 100, 0.2, 0.2, 0.2, 0.2, 0.5, 0.5, "blue");
    
}

function draw() {
    background("220");
    testFish.dispay();
}
