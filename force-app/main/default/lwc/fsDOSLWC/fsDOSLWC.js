/*
* ──────────────────────────────────────────────────────────────────────────────────────────────────
* @author           Kuldeep Sahu  
* @modifiedBy       Kuldeep Sahu   
* @created          2022-07-19
* @modified         2022-07-21
* @Description      This component is build to handle all the operations related to 
                    DOS Stage in FiveStar.              
* ──────────────────────────────────────────────────────────────────────────────────────────────────
*/
import { LightningElement, api, wire, track } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import getLastLoginDate from '@salesforce/apex/DatabaseUtililty.getLastLoginDate';
import generatePublicLink from '@salesforce/apex/DatabaseUtililty.generatePublicLink';
import getDOSData from '@salesforce/apex/FS_DOS_Controller.getDOSDataNew';
import saveDOSData from '@salesforce/apex/FS_DOS_Controller.saveDOSData';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import DOS_OBJECT from '@salesforce/schema/DOS__c';
import VERIFICATION_FIELD from '@salesforce/schema/DOS__c.Verification__c';
import STATUS_FIELD from '@salesforce/schema/DOS__c.Status__c';
import NAME from '@salesforce/schema/Application__c.Name';
import DECISION from '@salesforce/schema/Application__c.DOS_Decision__c';
import BusinessDate from '@salesforce/label/c.Business_Date';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
export default class FsDOSLWC extends NavigationMixin(LightningElement) {
    @api recordId;

    @track todaysDate = BusinessDate;
    @track lastLoginDate;
    @track applicationName;
    @track dosData;

    @track verificationPicklistVal;
    @track statusPicklistVal;
    @track tabName = 'DataEntry';
    @track validationObj = {
        dataEntry: false,
        decision: false
    };
    @track errorMsgs;

    @track showSpinner = false;
    @track showErrorTab = false;

    @wire(getObjectInfo, { objectApiName: DOS_OBJECT })
    dosMetadata;

    @wire(getRecord, { recordId: '$recordId', fields: [NAME, DECISION] })
    applicationDetails({ error, data }) {
        console.log('applicationDetails= ', data);
        if (data) {
            this.applicationName = data.fields.Name.value;
            if (data.fields.DOS_Decision__c && data.fields.DOS_Decision__c.value) {
                this.validationObj.decision = true;
            }
        } else if (error) {
            console.log('error in getting applicationDetails = ', error);
        }
    }

    @wire(getPicklistValues, { recordTypeId: "$dosMetadata.data.defaultRecordTypeId", fieldApiName: VERIFICATION_FIELD })
    verificationPicklistInfo({ data, error }) {
        if (data) this.verificationPicklistVal = data.values;
    }

    @wire(getPicklistValues, { recordTypeId: "$dosMetadata.data.defaultRecordTypeId", fieldApiName: STATUS_FIELD })
    statusPicklistInfo({ data, error }) {
        if (data) this.statusPicklistVal = data.values;
    }

    // This Method Is Used To Get All Data At Initial Level(Loading)
    connectedCallback() {
        this.handleGetLastLoginDate();
        this.handleGetDOSData();
    }

    // This Method Is Used To Handle Tab Activation Event
    handleActive(event) {
        this.tabName = event.target.value;
    }

    // This Method Is Used To Handle Form Values
    handleFormValues(event) {
        let index = event.target.dataset.id;
        let childIndex = event.target.dataset.childId;
        let tempData = JSON.parse(JSON.stringify(this.dosData));
        tempData[index].dosList[childIndex][event.target.name] = event.target.value;
        this.dosData = JSON.parse(JSON.stringify(tempData));
    }

    // This Method Is Used To Handle Check Validations For Form
    checkFormValidity() {
        const allValid1 = [
            ...this.template.querySelectorAll('lightning-combobox'),
        ].reduce((validSoFar, inputCmp) => {
            inputCmp.reportValidity();
            return validSoFar && inputCmp.checkValidity();
        }, true);

        const allValid2 = [
            ...this.template.querySelectorAll('lightning-textarea'),
        ].reduce((validSoFar, inputCmp) => {
            inputCmp.reportValidity();
            return validSoFar && inputCmp.checkValidity();
        }, true);

        this.validationObj.dataEntry = (allValid1 && allValid2);
    }

    // This Method Is Used To Handle Post Submit Actions
    handleSubmit() {
        console.log('handleSubmit ');
    }

    // This Method Is Used To Handle Post Success Actions
    handleSuccess() {
        console.log('handleSuccess ');
        this.showNotifications('','Data saved successfully!','success');
        this.validationObj.decision = true;
    }

    // This Method Is Used To Save All DOS Data
    handleSaveDOSData() {
        this.handleDOSSave();
    }

    // This Method Is Used To Handle Submit Button
    handleDOSSubmit() {
        this.errorMsgs = [];
        this.showErrorTab = false;
        this.checkFormValidity();
        if (this.validationObj.decision && this.validationObj.dataEntry) {
            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: this.recordId,
                    objectApiName: 'Application__c',
                    actionName: 'view'
                }
            });
        } else {
            if (!this.validationObj.decision) {
                this.errorMsgs.push('Complete All Entries In Decision Section');
            }
            if (!this.validationObj.dataEntry) {
                this.errorMsgs.push('Complete All Entries In Data Entry Section');
            }

            this.showErrorTab = true;
            let ref = this;
            setTimeout(() => {
                ref.tabName = 'Error';
            }, 300);
        }
    }

    // This Method Is Used To Show Toast Notification
    showNotifications(title, msg, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title: title,
            message: msg,
            variant: variant
        }));
    }

    /* ----------------- All the apex method below --------------------- */

    // This Method Is Used To Save All DOS Data.
    handleDOSSave() {
        this.showSpinner = true;
        console.log('this.dosData= ', this.dosData)
        saveDOSData({ applicationId: this.recordId, strData: JSON.stringify(this.dosData) }).then((result) => {
            this.showSpinner = false;
            if (result == 'success') {
                this.dosData = undefined;
                this.showNotifications('','Data saved successfully!','success');
                this.handleGetDOSData();
            }
        }).catch((err) => {
            this.showSpinner = false;
            console.log('Error in handleDOSSave= ', err);
        });
    }

    // This Method Is Used To Get All DOS Data.
    handleGetDOSData() {
        this.showSpinner = true;
        getDOSData({ applicationId: this.recordId }).then((result) => {
            console.log('handleGetDOSData= ', result);
            this.showSpinner = false;
            this.dosData = JSON.parse(JSON.stringify(result));
        }).catch((err) => {
            this.showSpinner = false;
            console.log('Error in handleGetDOSData= ', err);
        });
    }

    // This Method Is Used To Generate Public Link Of Uploaded File On File Upload Section.
    handleFileUplaod(event) {
        generatePublicLink({ contentVersionId: event.detail[0].contentVersionId, uploadedFrom: 'LegalOpinion' }).then((result) => {
            console.log('handleFileUplaod= ', result);
            this.template.querySelector('c-generic-view-documents').getDocuments();
        }).catch((err) => {
            console.log('Error in handle File upload= ', err);
        });
    }

    // This Method Is Used To Get User's Last Login Date From Server Side.
    handleGetLastLoginDate() {
        getLastLoginDate().then((result) => {
            console.log('getLastLoginDate= ', result);
            this.lastLoginDate = result
        }).catch((err) => {
            console.log('Error in getLastLoginDate= ', err);
        });
    }
}