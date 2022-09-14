import { LightningElement, track, wire, api } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import CV_OBJECT from '@salesforce/schema/ContentVersion';
import DOC_TYPE_FIELD from '@salesforce/schema/ContentVersion.Agreement_Document_Type__c';
import DOC_CON_FIELD from '@salesforce/schema/ContentVersion.Document_Condition__c';
import getContentVersionRecords from '@salesforce/apex/AgreementExecutionController.getContentVersionRecordsNew';
import updateDocuments from '@salesforce/apex/AgreementExecutionController.updateDocuments';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
export default class FsAgreementExecutionListOfDocuments extends NavigationMixin(LightningElement) {

    @api applicationId;

    @track allContentVersionRecord;
    @track stageName = 'Agreement Execution';
    @track docTypeList;
    @track docConList;
    @track showSpinner = false;
    @track validationObj = false;

    @wire(getObjectInfo, { objectApiName: CV_OBJECT })
    cvMetadata;

    @wire(getPicklistValues, { recordTypeId: "$cvMetadata.data.defaultRecordTypeId", fieldApiName: DOC_TYPE_FIELD })
    docTypePicklistInfo({ data, error }) {
        if (data) {
            console.log('data ', data);
            this.docTypeList = data.values;
        }
        if (error) {
            console.log('Error while getting docType ', error);
        }
    }

    @wire(getPicklistValues, { recordTypeId: "$cvMetadata.data.defaultRecordTypeId", fieldApiName: DOC_CON_FIELD })
    docConPicklistInfo({ data, error }) {
        if (data) this.docConList = data.values;
        if (error) console.log('Error while getting docType ', error);
    }


    connectedCallback() {
        this.getContentVersionRecords();
    }


    handleValueChange(event) {
        let indexNumber = event.currentTarget.dataset.id;
        console.log('indexNumber= ', indexNumber);
        let tempData = JSON.parse(JSON.stringify(this.allContentVersionRecord));
        tempData[indexNumber].cv[event.target.name] = event.target.value;
        this.allContentVersionRecord = JSON.parse(JSON.stringify(tempData));
    }

    @api getContentVersionRecords() {
        this.showSpinner = true;
        this.allContentVersionRecord = undefined;
        getContentVersionRecords({ parentId: this.applicationId, stage: this.stageName }).then((result) => {
            this.validationObj = true;
            this.showSpinner = false;
            this.allContentVersionRecord = JSON.parse(JSON.stringify(result));
            if(this.allContentVersionRecord && this.allContentVersionRecord.length ){
                this.allContentVersionRecord.forEach(currentItem => {
                    if(!(currentItem.cv.Agreement_Document_Type__c && currentItem.cv.Document_Condition__c && 
                    currentItem.cv.Number_of_Pages__c != undefined && currentItem.cv.Number_of_Pages__c != null && currentItem.cv.Number_of_Pages__c != '')){
                        this.validationObj = false;
                    }
                });
            }

            this.dispatchEvent(new CustomEvent('docEntryValidation', {
                detail: this.validationObj
            }));
            console.log('getContentVersionRecords result #### ', result);
        }).catch((err) => {
            console.log('getContentVersionRecords Error #### ', err);
        });
    }

    generateDocument(event){
        this[NavigationMixin.GenerateUrl]({
            type: 'standard__webPage',
            attributes: {
                url: '/apex/AcknowledgementSlipVf' + '?applicationId=' + this.applicationId + '&stage=Agreement Execution'
            }
        }).then(generatedUrl => {
            window.open(generatedUrl);
        });
    }

    handleSave() {
        console.log('handle Save = ', JSON.parse(JSON.stringify(this.allContentVersionRecord)));
        this.showSpinner = true;    
        updateDocuments({ strData: JSON.stringify(this.allContentVersionRecord) }).then((result) => {
            console.log('Result updateDocuments= ', result);
            if(result == 'success'){
                this.getContentVersionRecords();
                this.showToast('Success','Success','Record Saved Successfully!!');
            }
            this.showSpinner = false;
        }).catch((err) => {
            console.log('Error in updateDocuments= ', err);
            this.showSpinner = false;
        });
    }
    
    showToast(title, variant, message) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                variant: variant,
                message: message,
            })
        );
    }
}