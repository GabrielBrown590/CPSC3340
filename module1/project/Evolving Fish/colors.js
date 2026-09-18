//adopted from https://sighack.com/post/procedural-color-algorithms-color-variations
function hsbModify(base, hv, sv, bv) {
    /* The hue should be wrapped around if it crosses 360 */
    new_hue = (hue(base) + hv) % 360;
    new_sat = constrain(saturation(base) + sv, 0, 100);
    new_bri = constrain(brightness(base) + bv, 0, 100);
  return color(new_hue, new_sat, new_bri);
}
    
//original code
var colorGeneticVariance = 30; //different var for color variance because its different from physical
function averageHues(h1, h2)
{
    let diff = h2 - h1;

    //if difference between 2 hues is more than 180 we need to make sure the average goes the right way around the circle.
    if (diff > 180) h2 -= 360; 
    else if (diff < -180) h2 += 360;

    let average = (h1 + h2) / 2;

    if (average < 0) average += 360;
    if (average >= 360) average -= 360;

    return average;
}

function offspringColor(p1Color, p2Color)
{
    let retHue = averageHues(hue(p1Color), hue(p2Color)) + colorGeneticVariance;
    
    //keep these fixed so the color stays looking good
    let retSat = random(60, 85);
    let retBri = random(75, 95);
    return color(retHue, retSat, retBri);
}