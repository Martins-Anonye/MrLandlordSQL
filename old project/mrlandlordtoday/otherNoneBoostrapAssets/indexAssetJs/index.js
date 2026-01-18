firebase.initializeApp(configuration());
const db = firebase.database();

var  dataModelForVideoFiles = []; // empty

window.onload=e=>{
    signOutFromIndexMaker();
    var sexContainer = document. getElementsByClassName("sexContainer")[0];
    sexContainer.addEventListener("myFirebaseFetchOperationIsCompleted",e=>{
        var myVdideoCardsHolder ="";
        Object.keys(dataModelForVideoFiles).map(keyAccess =>{
            var individualObjectAdded = dataModelForVideoFiles[keyAccess];
            console.log(individualObjectAdded);
            var listofItemInTheKey = individualObjectAdded.listofItemInTheKey;
        })
    });
};

const fetchChat = db.ref ("UploadedSEXvideoData");
fetchChat.on("child_added", function (snapshot){
    const data = snapshot.val();
    if (snapshot.exists()){
        myClearAndResetObjectDataModelForVideo();
        snapshot.forEach(snapshot2 =>{
            //uniqe id push level1 = snapshot4.key
            console.log("snapshot2 Key :" + snapshot2.key);
            //var listOfDataInTheKey = [];//array
            var objectOfDataAccessibleByKey = {}; // object
            snapshot2.forEach((child)=>
            { console.log(child.key + "," + child.val());
            //we add both key and value
            //listOfDataInKey.push(child.key + "," + child.val()); // add to array

            //listOfDataInKey.push( child.val()); // add to array
            objectOfDataAccessibleByKey[child.key] = child.val();
            // console.log ("intVal", this.intVal)


            var category = listofItemInTheKey["category"]; // square access pattern
            var title = listofItemInTheKey["title"];  // square access pattern
            var description = listofItemInTheKey["description"];  // square access pattern
             var price = listofItemInTheKey["price"];  // square access pattern

            });
            myObjectOfDataAccessibleByKey(snapshot2.key,objectOfDataAccessibleByKey);
        });

    }



    var myFirebaseFetchOperationIsCompleted = new Event ("myFirebaseFetchOperationIsCompleted");
    sexContainer.dispatchEvent9(myFirebaseFetchOperationIsCompleted);
});








function myClearAndResetObjectDataModelForVideo(){
    dataModelForVideoFiles = [];// empty
}
function myObjectOfDataAccessibleByKey (listKey, listofItemInTheKey){
    dataModelForVideoFiles.push({listKey,listofItemInTheKey});
}
