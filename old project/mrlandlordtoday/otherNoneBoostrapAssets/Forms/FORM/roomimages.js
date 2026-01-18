
var photo = document.getElementById("photo1");
var photoo = document.getElementById("photo2");
var photooo = document.getElementById("photo3");
var phot = document.getElementById("photo4");
var shortvideo = document.getElementById("short");
var upload1 =document.getElementsByClassName("upload");
var typeofvacancy = document.getElementsByName("typeofvacancy");




var type1AsHouse =typeofvacancy[0];
var type1AsShop =typeofvacancy[1];


var userName ="MrJohn";
upload1.addEventListener("click",function(e){

e.preventDefault()
    var photo = photo1.value;
    var photoo = photo2.value;
    var photooo = photo3.value;
    var phot =photo4.value;
    var shortvideo1 =short.value;
   


    var selectedType ="house";

    if(type1AsHouse.checked){
        selectedType =type1AsHouse.value;
    }

    if(type1AsShop.checked){
        selectedType =type1AsShop.value;
    }
   
    var timestamp = Date.now();
    db.ref("Vacancy/"+userName+"/"+selectedType+"/"+timestamp).set(
        {
            photo1: photo.value,
             photo2:photoo.value,
             photo3: photooo.value,
            photo4 :phot.value,
             shortvideo1:shortvideo.value,

        }
    );
});








