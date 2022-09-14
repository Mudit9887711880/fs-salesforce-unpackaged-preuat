import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import fetchDocumentTypes from "@salesforce/apex/genericFileUploadController.getDocumentNames";
import updateDocumentName from "@salesforce/apex/genericFileUploadController.updateDocumentName";
export default class GenericFileUploadLWC extends LightningElement {
    @api recordId;
    @track resultWrapper;
    @track listDocumentOption = [];
    selectedDocumentOption;
    selectedDocumentTypeName;
    @track listDocumentTypeName = [];
    selectedDocumentName;
    @track listDocumentName = [];
    documentNameSuffix;
    mapDocumentNameWIthCode = new Map();

    //CH01 Start
    @track listAcctNames = [];
    slcdAccName;
    mapAccIdName;
    //CH01 END

    connectedCallback() {
        fetchDocumentTypes({ recordId: this.recordId })
            .then((result) => {
                // console.log(result.mapDocumentTypeName);
                this.resultWrapper = result.mapDocumentTypeName;
                //prettier-ignore
                for (let index = 0; index < Object.keys(this.resultWrapper).length; index++) {
                    //prettier-ignore
                    let option = { label: Object.keys(this.resultWrapper)[index], value: Object.keys(this.resultWrapper)[index] };
                    this.listDocumentOption = [...this.listDocumentOption, option];
                }

                this.selectedDocumentOption = this.listDocumentOption[0].label;
                //prettier-ignore
                this.listDocumentTypeName = this.getDocumentTypes(this.resultWrapper[this.selectedDocumentOption], 'Group_ID__c', '');
                this.selectedDocumentTypeName = this.listDocumentTypeName[0].label;

                //prettier-ignore
                this.listDocumentName = this.getDocumentTypes(this.resultWrapper[this.selectedDocumentOption], "Document_Name__c", 'Group_ID__c#' + this.selectedDocumentTypeName);
                this.selectedDocumentName = this.listDocumentName[0].label;

                //CH01 START
                //prettier-ignore
                this.mapAccIdName = result.mapAccIdName;
                for (let accId of Object.keys(result.mapAccIdName)) {
                    // this.mapAccIdName.set(accId, result.mapAccIdName[accId]);

                    let option = { label: result.mapAccIdName[accId], value: accId };//CH02
                    this.listAcctNames = [...this.listAcctNames, option];
                }

                console.log(this.listAcctNames);
                this.slcdAccName = this.listAcctNames[0].value;
                //CH01 END
            })
            .catch((error) => {
                //prettier-ignore
                this.dispatchEvent(new ShowToastEvent({ title: "Error", message: error.message, variant: "error" }));
            });
    }
    //Param: list from the wrapper and next is the sobject column and third is for filter column with value
    getDocumentTypes(listToIterate, selectedColumn, filterColumnAndValue) {
        try {
            var listTemp = [];
            var filterColumn = "";
            var filterColumnVal = "";
            if (filterColumnAndValue && filterColumnAndValue.includes("#")) {
                filterColumn = filterColumnAndValue.split("#")[0];
                filterColumnVal = filterColumnAndValue.split("#")[1];
            }
            //prettier-ignore
            for (var index = 0; index < listToIterate.length; index++) {
                // console.log( '@@@@@' + JSON.stringify(listToIterate[index]) );
                //prettier-ignore
                var option = { label: listToIterate[index][selectedColumn], value: listToIterate[index][selectedColumn] };

                if (listToIterate[index].Document_No__c) {
                    this.mapDocumentNameWIthCode[listToIterate[index][selectedColumn]] = listToIterate[index].Document_No__c;
                }
                if (filterColumn && filterColumnVal) {
                    if (listToIterate[index][filterColumn] == filterColumnVal) {
                        listTemp = [...listTemp, option];
                    }
                } else {
                    listTemp = [...listTemp, option];
                }
            } //end of for loop

            //console.log(JSON.stringify(this.mapDocumentNameWIthCode));
            //_______________ Remove duplicate options from the List
            var jsonObject = listTemp.map(JSON.stringify);
            var uniqueSet = new Set(jsonObject);
            var uniqueArray = Array.from(uniqueSet).map(JSON.parse);
        } catch (error) {
            console.error(error);
            // expected output: ReferenceError: nonExistentFunction is not defined
            // Note - error messages will vary depending on browser
        }
        return uniqueArray;
    }
    handleInputChange(event) {
        let name = event.target.name;
        let value = event.target.value;
        console.log(name);
        console.log(value);
        if (name == "documentOption") {
            this.selectedDocumentOption = value;
            //prettier-ignore
            this.listDocumentTypeName = this.getDocumentTypes(this.resultWrapper[this.selectedDocumentOption], 'Group_ID__c', '');
            this.selectedDocumentTypeName = this.listDocumentTypeName[0].label;
            //prettier-ignore
            this.listDocumentName = this.getDocumentTypes(this.resultWrapper[this.selectedDocumentOption], "Document_Name__c", 'Group_ID__c#' + this.selectedDocumentTypeName);
            this.selectedDocumentName = this.listDocumentName[0].label;
        } else if (name == "groupId") {
            this.selectedDocumentTypeName = value;
            //prettier-ignore
            this.listDocumentName = this.getDocumentTypes(this.resultWrapper[this.selectedDocumentOption], "Document_Name__c", 'Group_ID__c#' + this.selectedDocumentTypeName);
            this.selectedDocumentName = this.listDocumentName[0].label;
        } else if (name == "documentName") {
            this.selectedDocumentName = value;
        } else if (name == "accName") {
            this.slcdAccName = value;
        }
    }
    handleUploadFinished(event) {
        // Get the list of uploaded files
        const uploadedFiles = event.detail.files;
        this.dispatchEvent(new CustomEvent('fileupload', {
            detail: uploadedFiles
        }));
        let docId = uploadedFiles[0].documentId;
        let documentNameSuffix;
        //prettier-ignore
        let documentNo = this.mapDocumentNameWIthCode[this.selectedDocumentName];
        //prettier-ignore
        documentNameSuffix = this.selectedDocumentOption ? this.selectedDocumentOption : '';
        //prettier-ignore
        documentNameSuffix += this.selectedDocumentTypeName ? '__' + this.selectedDocumentTypeName : ''
        console.log("accId" + this.slcdAccName);
        console.log("mapAccIdName" + this.mapAccIdName);
        if (this.slcdAccName && this.slcdAccName != "--NONE--") {
            documentNameSuffix += "__" + this.mapAccIdName[this.slcdAccName];
        }
        //prettier-ignore
        documentNameSuffix += documentNo ? '__(' + documentNo + ')' : '';
        //prettier-ignore
        documentNameSuffix += this.selectedDocumentName ? '___' + this.selectedDocumentName : '';
        console.log(" documentNameSuffix  --> " + documentNameSuffix);
        //prettier-ignore
        console.log('this.slcdAccName >>> ' + JSON.stringify(this.slcdAccName));
        updateDocumentName({
            docName: documentNameSuffix,
            documentId: docId,
            docType: this.selectedDocumentName,
            accountId: this.slcdAccName
        }).then((result) => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: "Success",
                    message: documentNameSuffix + " file uploaded successfully",
                    variant: "success"
                })
            );
        }).catch((error) => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: "Error - cannot upload file.",
                    message: error.message,
                    variant: "error"
                })
            );
        });
    }
}