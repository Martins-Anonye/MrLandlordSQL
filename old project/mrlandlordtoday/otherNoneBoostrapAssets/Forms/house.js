
 // Initialize Firebase


 window.onload= function(){


    firebase.initializeApp(firebaseConfig());
   // const analytics = firebase.getAnalytics();
    var db =firebase.database();
   
   var Category1 = document.getElementById("Category");
   var toilet1 = document.getElementById("toilet");
   var room1 = document.getElementById("room");
   var adre = document.getElementById("address");
   var area1 = document.getElementById("area");
   var closet1 = document.getElementById("closet");
   var any= document.getElementById("anygood");
   var water1 = document.getElementById("water");
   var electricity = document.getElementById("electric");
   var prep = document.getElementById("prepaid");
   var meter1 = document.getElementById("meter");
   var under = document.getElementById("contribution");
   var law = document.getElementById("lawyer");
   var lawyerfee1 = document.getElementById("lawyerfee");


   
   var student = document.getElementById("student");
   var corper1 = document.getElementById("corper");
   var male1 = document.getElementById("male");
   var female1= document.getElementById("female");
   var restrict1 = document.getElementById("restrict");
   var business1= document.getElementById("business");
   var family1 = document.getElementById("family");
   var youth1= document.getElementById("youth");
var savee = document.getElementById("normalSave1");

var typeofvacancy = document.getElementsByName("typeofvacancy");
   
   var type1AsHouse =typeofvacancy[0];
   var type1AsShop =typeofvacancy[1];
   

   var studentcheck = 0;
   var businesscheck = 0;
   var femaletenant = 0;
   var corpercheck = 0;
   var youthcheck = 0;
   var maletenant =0;
   var familycheck = 0;

  


    student.addEventListener("change", function(e){
        if(student.checked==true){
            studentcheck=1;
        }
        else{studentcheck=0;}
       });

       business1.addEventListener("change", function(e){
        if(business1.checked==true){
            businesscheck=1;
        }
        else{businesscheck=0;}
       });
   
       family1.addEventListener("change", function(e){
        if(family1.checked==true){
            familycheck=1;
        }
        else{familycheck=0;}
       });
      
       corper1.addEventListener("change", function(e){
        if(corper1.checked==true){
            corpercheck=1;
        }
        else{corpercheck=0;}
       });
      
      female1.addEventListener("change", function(e){
        if( female1.checked==true){
            femaletenant=1;
        }
        else{ femaletenant=0;}
       });
       
       youth1.addEventListener("change", function(e){
        if(youth1.checked==true){
            youthcheck=1;
        }
        else{  youthcheck=0;}
       });
       
      male1.addEventListener("change", function(e){
        if(male1.checked==true){
            maletenant=1;
        }
        else{   maletenant=0;}
       });
      

   var userName ="MrJohn";
   savee.addEventListener("click",function(e){
   
   e.preventDefault();
       var Category1 = Category.value;
       var toilet1 = toilet.value;
       var room1 = room.value;
       var address1 = address.value;
       var area1 =area.value;
       var closet1 =closet.value;
       var any= anygood.value;
       var water1 = water.value;
       var electricity = electric.value;
       var prep = prepaid.value;
       var meter1 = meter.value;
       var under = contribution.value;
       var law = lawyer.value;
       var law1 = lawyerfee.value;

       
   

    var catSet = studentcheck+"_" + businesscheck+"_" +familycheck+"_" + corpercheck+"_"+ youthcheck+"_" + maletenant+"_"+femaletenant;
   
       var selectedType ="house";
   
       if(type1AsHouse.checked){
           selectedType =type1AsHouse.value;
       }
   
       if(type1AsShop.checked){
           selectedType =type1AsShop.value;
       }
      
      (async function(e){
       var timestamp = Date.now();
                try{
                                await db.ref(selectedType+"/Flats/TwoBedFlat/"+userName+"/"+timestamp+"/"+selectedType).set(
                                    {
                                        category:Category1,
                                        toilet:toilet1,
                                        room:room1,
                                    address:address1,
                                        area:area1,
                                    closet:closet1,
                                    anygood:any,
                                    water:water1,
                                    electric:electricity,
                                    prepaid:prep,
                                    meter:meter1,
                                    contribution:under,
                                    lawyer:law,
                                    lawyerfee:law1,
                        
                                    category:catSet
                        
                                    }
                                );

                             navigateToNext(timestamp)
            }
                
            catch(e){
                alert(e);
            }

      })();
    //    then(e=>{
    //     navigateToNext(timestamp)
    //    }
    //    ).catch(e=>{
       
    //    });
   });
   
   
function navigateToNext(timestamp){
    console.log("successful");
    window.location.href= "roomimages.html?timestamp="+timestamp;
        
    return true;
}

   


   

}