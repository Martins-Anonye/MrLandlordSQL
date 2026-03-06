


var backgroundDesign = document.getElementById("backgroundDesign");
var imageLocation = backgroundDesign.getAttribute("imageLocation");
const numBubbles = 100;
var house = `<center>
<img src="${imageLocation}" width="80%" height="80%"  style="margin:5px 0px 0px 0px" /> </center>`;
for(var i = 0; i<numBubbles;i++){
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    const size = Math.random()* 40 + 10;
    bubble.innerHTML = house;
    bubble.style.width =`${size}px`;
    bubble.style.height =`${size}px`; 
    bubble.style.left =`${Math.random()* 100}vw`;
    bubble.style.animationDuration =`${5+ Math.random() * 10}s`;
    backgroundDesign.appendChild(bubble);
}
