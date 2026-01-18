
var newreg=document.getElementById("newreg")


newreg.addEventListener("click",e=>{
    navigateToNext()
});
function navigateToNext(){
    console.log("successful");
    window.location.href= "signup.html";
        
    return true;
}