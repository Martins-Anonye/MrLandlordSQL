




var first1 = document.getElementsByClassName("first");
var second1 = document.getElementsByClassName("second");
var other = document.getElementsByClassName("other");
var phone1= document.getElementsByClassName("phone");
var alter1 = document.getElementsByClassName("alter");
var email1= document.getElementsByClassName("email");
var savee1 = document.getElementById("save3");

savee1.addEventListener("click",function(e){

e.preventDefault();



var first1 = first.value;
var second1 = second.value;
var other1 = other.value;
var phone1= phone.value;
var alter1 = alter.value;
var email1= email.value;

var categorytype ="student";

if(type1AsHouse.checked){
 categorytype =type1AsHouse.value;
}

if(type1AsShop.checked){
 selectedType =type1AsShop.value;
}

var timestamp = Date.now();
db.ref("Vacancy/"+userName+"/"+categorytype+"/"+timestamp).set(
 {
    


    first: first1,               
    second:second1,
    other:other1,
    phone:phone1,
    alter:alter1,
    email:email1,
   

 }
);

});




var bank1 = document.getElementsByClassName("bank");
var account1 = document.getElementsByClassName("account");
var accountname1 = document.getElementsByClassName("accountname");
var submit1= document.getElementsByClassName("submit");

submit1.addEventListener("click",function(e){

 e.preventDefault();



 var bank1 = bank.value;
 var account1 =account.value;
 varaccountname1 = accountname.value;
 

 var categorytype ="student";

 if(type1AsHouse.checked){
     categorytype =type1AsHouse.value;
 }

 if(type1AsShop.checked){
     selectedType =type1AsShop.value;
 }

 var timestamp = Date.now();
 db.ref("Vacancy/"+userName+"/"+categorytype+"/"+timestamp).set(
     {
        


        bank:bank1 ,
        account:account1,
        accountname:accountname1,
      

     }
 );

});