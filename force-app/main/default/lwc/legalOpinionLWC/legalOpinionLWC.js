import { LightningElement, api, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getExternalLawyerTableData from '@salesforce/apex/LegalOpinionApprovalController.getExternalLawyerTableData';
import generatePublicLink from '@salesforce/apex/DatabaseUtililty.generatePublicLink';
import moveToNextStage from '@salesforce/apex/LegalOpinionApprovalController.moveToNextStage';
import checkRequiredDocs from '@salesforce/apex/DatabaseUtililty.checkRequiredDocs';
import getLastLoginDate from '@salesforce/apex/DatabaseUtililty.getLastLoginDate';
import { getRecord } from 'lightning/uiRecordApi';
import { updateRecord } from 'lightning/uiRecordApi';
import APPLICATION_ID from '@salesforce/schema/Application__c.Id';
import NAME from '@salesforce/schema/Application__c.Name';
import LegalOpinionDate from '@salesforce/schema/Application__c.Date_of_legal_opinion__c';
import ExternalLawyer from '@salesforce/schema/Application__c.External_Lawyer__c';
import BusinessDate from '@salesforce/label/c.Business_Date';
import LAWYER_MISSING_ERROR_MSG from '@salesforce/label/c.Legal_Opinion_Lawyer_Error_Message';
import REQUIRED_DOC_ERROR_MSG from '@salesforce/label/c.Legal_Opion_Report_Missing_Error_Message';
import REQUIRED_FIELD_ERROR_MSG from '@salesforce/label/c.Legal_Opinion_Required_Field_Missing_Error_Message';
import getProperties from '@salesforce/apex/LegalOpinionApprovalController.getProperties';
import getExternalLawyer from '@salesforce/apex/LegalOpinionApprovalController.getExternalLawyer';
import updateProperties from '@salesforce/apex/LegalOpinionApprovalController.updateProperties';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
const rowAction = [{
    label: 'Action',
    type: 'button-icon',
    typeAttributes: {
        iconName: 'utility:check',
        title: 'Select',
        variant: 'border-filled',
        alternativeText: 'Select',
        name: 'select'
    }
}];
export default class LegalOpinionLWC extends NavigationMixin(LightningElement) {
    @api recordId;

    @track lawyerId;

    @track todaysDate = new Date().toISOString();
    @track todaysDate1 = BusinessDate;
    @track lastLoginDate;
    @track applicationName;

    @track externalLawyerTableData;
    @track rowAction = rowAction;
    @track callOnce = false;
    @track tabName = "LawyerSelection";

    @track legalOpValidation = {
        isLawyerSelected: false,
        allDocUploaded: true,
        dataEntryDone: false
    };
    @track errorMsgs;
    @track showErrorTab = false;

    @track isSpinner = false;
    @track isVisible = false;
    @track options = [];
    @track properties = [{
        Id: undefined,
        Name: undefined,
        Title_Deed_Date__c: undefined,
        Title_Deed_Number__c: undefined,
        External_Lawyer__c: undefined
    }];

    @wire(getRecord, { recordId: '$recordId', fields: [NAME, LegalOpinionDate, ExternalLawyer] })
    applicationDetails({ error, data }) {
        console.log('applicationDetails= ', data);
        if (data) {
            this.applicationName = data.fields.Name.value;
            if (data.fields.Date_of_legal_opinion__c && data.fields.Date_of_legal_opinion__c.value) {
                this.legalOpValidation.dataEntryDone = true;
            }
            if (data.fields.External_Lawyer__c && data.fields.External_Lawyer__c.value) {
                // this.legalOpValidation.isLawyerSelected = true;
                // this.lawyerId = data.fields.External_Lawyer__c.value;
            }
        } else if (error) {
            console.log('error in getting applicationDetails = ', error);
        }
    }

    connectedCallback() {
        console.log('Legal Opinion = ', this.recordId);
        this.handleGetLastLoginDate();
        //this.handleGetExternalLawyerTableData();
        this.handleCheckRequiredDocs(false);
        this.getApplicationProperty();
        this.getAllExternalLawyer();
    }
    renderedCallback() {
        if (!this.callOnce) {
            const style = document.createElement('style');
            style.innerText = `.slds-form-element__label{
            font-weight: bold;
        }`;
            this.template.querySelector('[data-id="legalOpinion"]').appendChild(style);
            const label = this.template.querySelectorAll('label');
            label.forEach(element => {
                element.classList.add('bold');
            });
            console.log('renderedCallback()');
        }
    }

    handleActive(event) {
        console.log('handleActive= ', event.target.value);
        this.tabName = event.target.value;
    }

    handleSubmit(event) {
        console.log('handleSubmit');
        this.showNotifications('', 'Data Saved Successfully', 'success');
    }

    handleLegalOpinionSubmit() {
        console.log('handleLegalOpinionSubmit', this.legalOpValidation.isLawyerSelected, this.legalOpValidation.isLawyerSelected, this.legalOpValidation.dataEntryDone)
        this.errorMsgs = [];
        if (this.legalOpValidation.isLawyerSelected && this.legalOpValidation.dataEntryDone) {
            console.log('move to next stage')
            this.showErrorTab = false;
            this.handleMoveToNextStage();
        } else {
            console.log('Error part')
            if (!this.legalOpValidation.isLawyerSelected) {
                console.log('LAWYER MISSING')
                this.properties.forEach(currentItem => {
                    console.log('PROPERTY LAWYER =',currentItem.External_Lawyer__c)
                    if (!currentItem.External_Lawyer__c) {
                        this.errorMsgs.push('No Lawyer is selected for Property ' + currentItem.Name + ', please select any lawyer.');
                    }
                });
            }
            if (!this.legalOpValidation.allDocUploaded) {
                console.log('DOC MISSING')
                this.errorMsgs.push(REQUIRED_DOC_ERROR_MSG);
            }
            if (!this.legalOpValidation.dataEntryDone) {
                console.log('dataEntryDone MISSING')
                this.errorMsgs.push(REQUIRED_FIELD_ERROR_MSG);
            }
            this.showErrorTab = true;
            let ref = this;
            console.log('this.errorMsgs = ',this.errorMsgs)
            setTimeout(() => {
                ref.tabName = 'Error';
            }, 300);
        }
    }

    handleSuccess() {
        console.log('handleSuccess');
        this.legalOpValidation.dataEntryDone = true;
    }

    handleCheckRequiredDocs(showMsg) {
        checkRequiredDocs({ appId: this.recordId, docList: ['Legal Opinion Report'] }).then((result) => {
            console.log('checkRequiredDocs= ', result);
            if (result && result['Legal Opinion Report'] == true) {
                this.legalOpValidation.allDocUploaded = true;
                if (showMsg) {
                    this.showNotifications('', 'Legal Report Uploaded Successfully', 'success');
                }
            }
        }).catch((err) => {
            console.log('Error in handleCheckRequiredDocs= ', err);
        });
    }

    handleMoveToNextStage() {
        moveToNextStage({ appId: this.recordId }).then((result) => {
            console.log('moveToNextStage= ', result);
            if (result == 'success') {
                console.log('result= ', result);
                this[NavigationMixin.Navigate]({
                    type: 'standard__recordPage',
                    attributes: {
                        recordId: this.recordId,
                        objectApiName: 'Application__c',
                        actionName: 'view'
                    }
                });
            }
        }).catch((err) => {
            console.log('Error in moveToNextStage= ', err);
        });
    }

    handleDataEntryValidation() {

    }

    handleFileUplaod(event) {
        console.log('handleFileUplaod= ', event.detail);

        generatePublicLink({ contentVersionId: event.detail[0].contentVersionId, uploadedFrom: 'LegalOpinion' }).then((result) => {
            console.log('handleFileUplaod= ', result);
            this.template.querySelector('c-generic-view-documents').getDocuments();
            this.handleCheckRequiredDocs(true);
        }).catch((err) => {
            console.log('Error in handle File upload= ', err);
        });
    }

    /* ----------------- All the table method below --------------------- */

    /*handleLawyerSelection(evt) {
        console.log('handleLawyerSelection= ', JSON.stringify(evt.detail));
        var data = evt.detail;
        if (data !== undefined && data !== '') {
            this.lawyerId = data.recordData.Id;
            this.legalOpValidation.isLawyerSelected = true;
            let lawyerName = data.recordData.Name_LABEL;
            const fields = {};
            fields[APPLICATION_ID.fieldApiName] = this.recordId;
            fields[ExternalLawyer.fieldApiName] = this.lawyerId;

            const recordInput = { fields };

            updateRecord(recordInput).then(() => {
                console.log('Lawyer selection is done succesfully ');
                this.showNotifications('', (lawyerName + ' is selected'), 'info');
            }).catch(error => {
                console.log('Error in Lawyer selection= ', error);
                this.legalOpValidation.isLawyerSelected = false;
            });
        }
    }*/

    showNotifications(title, msg, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title: title,
            message: msg,
            variant: variant
        }));
    }

    /* ----------------- All the apex method below --------------------- */
    handleGetExternalLawyerTableData() {
        getExternalLawyerTableData().then((result) => {
            console.log('getExternalLawyerTableData = ', result);
            this.externalLawyerTableData = result;
        }).catch((err) => {
            console.log('getExternalLawyerTableData Error= ', err);
        });
    }

    handleGetLastLoginDate() {
        getLastLoginDate().then((result) => {
            console.log('getLastLoginDate= ', result);
            this.lastLoginDate = result
        }).catch((err) => {
            console.log('Error in getLastLoginDate= ', err);
        });
    }
    handleFromValue(event) {
        let foundelement = this.properties.find(ele => ele.Id == event.target.dataset.id);
        foundelement.External_Lawyer__c = event.target.value
        console.log(foundelement.External_Lawyer__c);
        this.properties = [...this.properties];
    }
    getApplicationProperty() {
        this.isSpinner = false;
        this.legalOpValidation.isLawyerSelected = true;
        getProperties({ appId: this.recordId })
            .then(result => {
                this.properties = JSON.parse(JSON.stringify(result));
                this.isSpinner = true;
                this.properties.forEach(currentItem => {
                    console.log('currentItem.External_Lawyer__c= ',currentItem.External_Lawyer__c)
                    if (!currentItem.External_Lawyer__c) {
                        this.legalOpValidation.isLawyerSelected = false;
                    }
                });
                if (this.properties.length > 0) {
                    this.isVisible = true;
                }
            })
            .catch(error => {

            });
    }
    getAllExternalLawyer() {
        getExternalLawyer()
            .then(result => {
                result.forEach(currentItem => {
                    const option = {
                        label: currentItem.Name,
                        value: currentItem.Id
                    };
                    this.options = [...this.options, option];
                });
            })
            .catch(error => {
            });
    }
    saveProperty() {
        var isInputsCorrect = [...this.template.querySelectorAll('lightning-combobox')]
            .reduce((validSoFar, inputField) => {
                inputField.reportValidity();
                return validSoFar && inputField.checkValidity();
            }, true);
        if (isInputsCorrect) {
            this.legalOpValidation.isLawyerSelected = true;
            this.updateAllProperties();
        }
    }
    updateAllProperties() {
        updateProperties({ propertyList: JSON.stringify(this.properties) })
            .then(result => {
                console.log('Property Updated Succcessfully');
                this.showNotifications('Success', 'Property updated successfully', 'success');
            })
            .catch(error => {

            })
    }
}