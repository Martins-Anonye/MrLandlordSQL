
class FileValidatorMaker{

    isFileSelected = false;

    acceptedSizeValueNmber = 2;
    fileDataElement;
    constructor(isFileSelected){

        this.isFileSelected = isFileSelected;
    }
    setAcceptableSize(acceptedSizeValueNmber){
    this.acceptedSizeValueNmber = acceptedSizeValueNmber;
    }

    getIsFileSelected(){
        return  this.isFileSelected;
    }

    getIsFileSelectedFromElementAttributeBooleanInStringFormate(){

        if(this.fileDataElement != null){

           var isFileSelectedVal =  this.fileDataElement.getAttribute("isFileSelected");
        
           if(isFileSelectedVal == "true"){



            return true;
           }else{

            return false;
           }
        }
        else{
            return false;

        }
        
    }
    FileValidator(educationErrorElement,fileData,filenamSelected,fileSize, fileDetail){

        this.fileDataElement = fileData;
            fileData.addEventListener("change",e=>{

                var FileValidatorMakerFileSelectedEvent = new Event("FileValidatorMakerFileSelectedEvent");
                fileData.dispatchEvent(FileValidatorMakerFileSelectedEvent);
                  
                var FileValidatorMakerShowCleaner = new Event("FileValidatorMakerShowCleaner");
                fileData.dispatchEvent(FileValidatorMakerShowCleaner);
                  
                

                //  fileData.click();
                            fileDetail.style.visibility = "visible"
                            fileSize.innerText= "";
                            educationErrorElement.innerHTML="";

                        if(!e || !e.target || !e.target.files || !e.target.files.length === 0 ){

                            educationErrorElement.innerHTML=  "File Error: No file selected";

                            this.isFileSelected = false;
                            fileData.setAttribute("isFileSelected","false");
                        }
                        else if( fileData.value =="" || fileData.value =="undifined"){
                            educationErrorElement.innerHTML=  "File Error: No file selected";

                            this.isFileSelected = false;
                            fileData.setAttribute("isFileSelected","false");

                        }
                        else if(!window.FileReader){
                            educationErrorElement.innerHTML=  "File API not supported";
                            this.isFileSelected = false;
                        }
                        else if(!fileData.files){
                            educationErrorElement.innerHTML=  "This browser doesn't seem to support the files property of file inputs.";
                            this.isFileSelected = false;
                            fileData.setAttribute("isFileSelected","false");

                        }
                        else if(!fileData.files[0]){
                            educationErrorElement.innerHTML=  "Please select a file before clicking add.";
                            this.isFileSelected = false;
                            fileData.setAttribute("isFileSelected","false");

                        }
                        else{
                        //fileData.style.visibility="visible";
                       // filenamSelected.innerHTML= fileData.value;
                       var file = fileData.value;
                       var filenameAndExtension =  file.substr(file.lastIndexOf("\\")+1);
                       var fileName = filenameAndExtension.split(".")[0];
                       var extension = filenameAndExtension.split(".")[1];
                       filenamSelected.innerHTML = fileName;  
                       fileSize.innerText =    this.mfileSize(fileData,educationErrorElement); // file selection is still checked 

                        var ext =   extension.toLowerCase();
                        this.setAttributeForMetaDataExtension(ext,fileData);

                       fileData.setAttribute("fileNameOnly",fileName);

                       this.autoResizeTextArea(filenamSelected);           

                     

                        } 


                        
                        

                    }
            );




 }






  getSelectedFileNameOnlyAndSizeForRecordPurpuse(){
    var fileNameOnly =  this.fileDataElement.getAttribute("fileNameOnly");
     var  fileSize =  this.fileDataElement.getAttribute("fileSize");



     var FilenameAndSize = fileNameOnly+","+fileSize+" mb";
     return FilenameAndSize;
  }
 

  mfileSize(inputFilee, educationError){
    var sizee =  inputFilee.files[0].size;

    var mb = 1024*1024;
    var acceptedSize =  2*mb;

    sizee = sizee/mb;
    var twoDecimalPlaces = (Math.round((sizee + Number.EPSILON) *100)/100); // 100 defined two decimal places;


    inputFilee.setAttribute("fileSize",twoDecimalPlaces);

   // if(twoDecimalPlaces > 2){

    if(twoDecimalPlaces > this.acceptedSizeValueNmber){
        
        this.isFileSelected = false;
        inputFilee.setAttribute("isFileSelected","false");

        educationError.innerText= `File size exceeds: ${this.acceptedSizeValueNmber}mb`;
        educationError.style.color="lightcoral";
        educationError.style.visibility="visible";
       return "Size Error !";
      
    }else{
        this.isFileSelected = true;
        inputFilee.setAttribute("isFileSelected","true");

    return  twoDecimalPlaces+"mb";
    }
 }




getExtensionNameAndApplicationMetaData(){

   return  this.fileDataElement.getAttribute("myfileMeta");

}




 setAttributeForMetaDataExtension(ext, fileInput){
 
       if(ext.indexOf("pdf") > -1){
        fileInput.setAttribute("myfileMeta","application/pdf,"+ext);

       }else if(ext.indexOf("docx") > -1){
        fileInput.setAttribute("myfileMeta", "application/docx,"+ext);

       }
       else if(ext.indexOf("doc") > -1){
        fileInput.setAttribute("myfileMeta","application/doc,"+ext);

       }

       else if(ext.indexOf("docx") > -1){
        fileInput.setAttribute("myfileMeta","application/docx,"+ext);

       }
       else if(ext.indexOf("jpg") > -1){
        fileInput.setAttribute("myfileMeta","image/jpg,"+ext);

       }

       else if(ext.indexOf("jpeg") > -1){
        fileInput.setAttribute("myfileMeta","image/jpeg,"+ext);

       }
       else if(ext.indexOf("png") > -1){
        fileInput.setAttribute("myfileMeta","image/png,"+ext);

       }else if(ext.indexOf("xls") > -1){
       
        fileInput.setAttribute("myfileMeta"," application/vnd.ms-excel,"+ext);

       }
       
       else if(ext.indexOf("mp4") > -1){
       
        fileInput.setAttribute("myfileMeta","video/mp4,"+ext);

       }
       else if(ext.indexOf("x-m4v") > -1){
       
        fileInput.setAttribute("myfileMeta","video/mp4,"+ext);

       }else if(ext.indexOf("video") > -1){
       
        fileInput.setAttribute("myfileMeta","video/mp4,"+ext);

       }
       else{
        fileInput.setAttribute("myfileMeta","image/jpeg,"+ext);

       }


}




 autoResizeTextArea(textmsg){

    textmsg.oninput= e=>{

        //(textmsg.style.height.replace("px","")*1)+
        if(textmsg.scrollHeight > 50){
            textmsg.style.height =   (textmsg.scrollHeight-5)+"px";

             //console.log(textmsg.style.height);
        }
       
    }
}




ResetFileSeletionAfterUseAndSetToFalse(fileInput, fileTextAreaNameDisplay, fileSize){
    this.isFileSelected = false;

    fileInput.value="";
    fileTextAreaNameDisplay.innerHTML ="";
    fileSize.innerText = "";
    fileInput.setAttribute("isFileSelected","false");
}
reSetIsFileSelectedToNotSelected(fileInput){
    this.isFileSelected = false;
    fileInput.setAttribute("isFileSelected","false");

}

}

export {FileValidatorMaker};