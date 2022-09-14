import { api, LightningElement, track, wire } from 'lwc';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import PROPERTY_OBJECT from '@salesforce/schema/Property__c';
import { getRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import { updateRecord } from 'lightning/uiRecordApi';
import ID_FIELD from '@salesforce/schema/Verification__c.Id';
import STATUS_FIELD from '@salesforce/schema/Verification__c.Status__c';
import BusinessDate from '@salesforce/label/c.Business_Date';
import NAME from '@salesforce/schema/Application__c.Name';
import getLastLoginDate from '@salesforce/apex/DatabaseUtililty.getLastLoginDate';
import getAllApplicantMeta from '@salesforce/apex/FSFivBLwcController.getAllApplicantMeta';
import getPropertyData from '@salesforce/apex/FSFivBLwcController.getPropertyData';
import getCashflowData from '@salesforce/apex/FSFivBLwcController.getCashflowData';
import getCharacterData from '@salesforce/apex/FSFivBLwcController.getCharacterData';
import generateFIVBPdf from '@salesforce/apex/FSFIVBReportVfController.generateFIVBPdf';
import getVerificationRecord from '@salesforce/apex/FSFivBLwcController.getVerificationRecord';
import getRequiredDocuments from '@salesforce/apex/fsGenericUploadDocumentsController.getRequiredDocuments';

export default class fsFiv_B_Lwc extends NavigationMixin(LightningElement) {
    @api recordId;
    @track recordTypeId;
    @api applicationId;
    @api staffLoan;
    @api riskDocument;
    @api preLoginOwnerName;
    @api listOfLoanApplicants;
    @api listOfApplicants;
    @api allApplicantData;
    @api allLoanApplicant;
    @api verificationStatus;
    @track requiredDocuments;
    @track isSpinnerActive;
    @track tabName = "Cashflow";
    @track lastLoginDate;
    @track errorMsgs = [];
    @track showErrorTab = false;
    @track todaysDate = BusinessDate;
    @track applicationName;
    @track localTNI = 0;
    @track localTPV = 0;
    @track propertyData;
    @track rowAction = [
        {
            //label: 'Edit',
            type: 'button-icon',
            fixedWidth: 50,
            typeAttributes: {
                iconName: 'utility:edit',
                title: 'Edit',
                variant: 'border-filled',
                alternativeText: 'Edit',
                name: 'edit'
            }
        },
        {
            //label: 'Delete',
            type: 'button-icon',
            fixedWidth: 50,
            typeAttributes: {
                iconName: 'utility:delete',
                title: 'Delete',
                variant: 'border-filled',
                alternativeText: 'Delete',
                name: 'delete'
            }
        },
    ]
    @track btns = [
        {
            name: 'FIV-B Report',
            label: 'FIV-B Report',
            variant: 'brand',
            class: 'slds-m-left_x-small'
        }
    ]

    @wire(getObjectInfo, { objectApiName: PROPERTY_OBJECT })
    getRecordType({ data, error }) {
        if (data) {
            console.log(':: data :: ',JSON.stringify(data));
            const rtis = data.recordTypeInfos;
            this.recordTypeId = Object.keys(rtis).find(rti => rtis[rti].name === 'FIV-B Property Detail');
        } else if (error) {
            
        }
    }


    @wire(getRecord, { recordId: '$applicationId', fields: [NAME] })
    applicationDetails({ error, data }) {
        if (data) {
            this.applicationName = data.fields.Name.value;
        } else if (error) {
            console.log('error in getting applicationDetails = ', error);
        }
    }
    connectedCallback() {
        this.handleGetLastLoginDate();
        console.log('verificationStatus ### ', JSON.stringify(this.verificationStatus));
        this.verificationStatus = this.verificationStatus === 'Completed' ? true : false;
        console.log('allLoanApplicant #### ', this.listOfApplicants);
        this.getRequiredDocuments();
        let tabs = this.template.querySelectorAll('lightning-tab');
        console.log('tablength ', tabs.length);
        tabs.forEach(element => {
            element.loadContent();
        });
    }
    getRequiredDocuments() {
        this.requiredDocuments = [];
        getRequiredDocuments({ stage: 'FIV - B', parentId: this.applicationId })
            .then(result => {
                console.log('::: result ::: ',JSON.stringify(result));
                this.requiredDocuments = result;
            })
            .catch(error => {
                console.log('error doc upload ', error);
            })
    }

    handleGetLastLoginDate() {
        getLastLoginDate().then((result) => {
            this.lastLoginDate = result
        }).catch((err) => {
            console.log('Error in getLastLoginDate= ', err);
        });
    }
    handleFileUplaod(event) {
        this.template.querySelector('c-generic-view-documents').getDocuments();
    }
    getCashflowData() {
        getCashflowData({ allLoanApplicant: this.allLoanApplicant })
            .then(result => {
                var data = JSON.parse(result.strDataTableData);
                console.log('data #### ', data.length);
                if (!data.length > 0) {
                    this.errorMsgs.push('* Create Atleast One Record On Cashflow.');
                } else {
                    data.forEach(element => {
                        if (element.Is_Fiv_B_Completed__c === 'false') {
                            this.errorMsgs.push('* Fill Required Data On ' + element.Name_LABEL + ' In Cashflow Tab');
                        }
                    });
                }
            })
            .catch(error => {
                console.log(error);
            })
    }
    requiredDocumentValidation() {
        if (this.requiredDocuments.length > 0) {
            this.requiredDocuments.forEach(element => {
                this.errorMsgs.push('Upload Required Document ' + element + ' In Document Upload Tab');
            });
        }
    }

    getPropertyData() {
        getPropertyData({ applicationId: this.applicationId })
            .then(result => {
                var data = JSON.parse(result.strDataTableData);
                this.propertyData = data;
                if (!data.length > 0) {
                    this.errorMsgs.push('* Create Atleast One Record On Collateral.');
                } else {
                    data.forEach(element => {
                        if (element.Is_Fiv_B_Completed__c === 'false') {
                            this.errorMsgs.push('* Fill Required Data On ' + element.Name_LABEL + ' In Collateral Tab');
                        }
                    });
                }
            })
            .catch(error => {

            })
    }
    getOnLoadPropertyData() {
        getPropertyData({ applicationId: this.applicationId })
            .then(result => {
                console.log('### ', result);
                var tableDT = JSON.parse(result.strDataTableData);
                tableDT.forEach(element => {
                    if (element.Total_Value__c !== undefined) {
                        this.localTPV += Number(element.Total_Value__c);
                    }
                });
                console.log('localTPV Result #### ', this.localTPV);
            })
            .catch(error => {

            })
    }
    getCharacterData() {
        getCharacterData({ allLoanApplicant: this.allLoanApplicant })
            .then(result => {
                var data = JSON.parse(result.strDataTableData);
                if (!data.length > 0) {
                    this.errorMsgs.push('* Create Atleast One Record On Character.');
                } else {
                    data.forEach(element => {
                        if (element.Is_Fiv_B_Completed__c === 'false') {
                            this.errorMsgs.push('* Fill Required Data On ' + element.Name_LABEL + ' In Character Tab');
                        }
                    });
                }
            })
            .catch(error => {

            })
    }

    getVerificationRecord() {
        getVerificationRecord({ verificationId: this.recordId })
            .then(result => {
                console.log('verification #### ', result.BM_Recommended_Amount__c);
                if (result.BM_Recommended_Amount__c === undefined) {
                    this.errorMsgs.push('* Fill Required Fields On Summary Tab');
                }
            })
            .catch(error => {

            })
    }

    generateFIVBPdf() {
        console.log('getFIVBPdf ', this.recordId + ' :: ' + this.applicationId);
        generateFIVBPdf({ verificationId: this.recordId, applicationId: this.applicationId })
            .then(result => {
                console.log('$$report', result);
                // this.isSpinnerActive=true;
                this.showToast('Success', 'Success', result);
                this.isSpinnerActive = false;
            })
            .catch(error => {
                console.log('**err', error);
                this.showToast('Error', 'Error', error);
                this.isSpinnerActive = false;
            })
    }
    rowselectionevent(event) {
        this.isSpinnerActive = false;
        var detail = event.detail;
        console.log('detail ### ', JSON.stringify(detail));
        if (detail === 'FIV-B Report') {
            this.isSpinnerActive = true;
            console.log('params ', this.recordId + ' :: ' + this.applicationId);
            this.generateFIVBPdf();

        }

    }

    handleSubmit() {
        this.isSpinnerActive = true;
        this.errorMsgs = [];
        this.getCashflowData();
        this.getPropertyData();
        this.getCharacterData();
        this.requiredDocumentValidation();
        this.getVerificationRecord();

        setTimeout(() => {
            console.log('this.errorMsgs. #### ', JSON.stringify(this.errorMsgs));
            if (this.errorMsgs.length > 0) {
                this.showToast('Error', 'Error', 'Remove All Error');
                this.isSpinnerActive = false;
                let ref = this;
                setTimeout(() => {
                    this.showErrorTab = true;
                    ref.tabName = 'Error';
                }, 800);
            } else {
                const fields = {};
                fields[ID_FIELD.fieldApiName] = this.recordId;
                fields[STATUS_FIELD.fieldApiName] = 'Completed'
                const recordInput = { fields };
                updateRecord(recordInput)
                    .then(() => {
                        this.showToast('Success', 'Success', 'Verification Submitted Successfully.');
                        this[NavigationMixin.Navigate]({
                            type: 'standard__recordPage',
                            attributes: {
                                recordId: this.recordId,
                                objectApiName: 'Application__c',
                                actionName: 'view'
                            }
                        });
                    })
                    .catch(error => {
                        console.log(error);
                    });

                /*  generateFIVBPdf({ verificationId: this.recordId, applicationId: this.applicationId })
                    .then(result => {
    
                    })
                    .catch(error => {
    
                    })*/
            }
        }, 3000);
    }
    handleMoveToNextStage() {
        moveToNextStage({ appId: this.recordId }).then((result) => {
            if (result == 'success') {
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

    //Mark for delete//
    getAllApplicantMeta() {
        getAllApplicantMeta({ applicationId: this.applicationId })
            .then(result => {
                this.allApplicantData = result;
                console.log('this.allApplicantData ### ', JSON.stringify(this.allApplicantData));
                var tempApplicant = JSON.parse(result);
                this.allLoanApplicant = [];
                tempApplicant.forEach(element => {
                    this.allLoanApplicant.push(element.Id);
                });
            })
            .catch(error => {

            })
    }
    handleActive(event) {
        this.tabName = event.target.value;
        if (this.tabName === 'Summary') {
            this.localTNI = this.template.querySelector('c-fs-fiv_-b_-cashflow').getTotalIncome()
            console.log('TNI Result #### ', this.localTNI);
            this.DBR = this.template.querySelector('c-fs-fiv_-b_-cashflow').getDBR();
            console.log('DBR Result #### ', this.DBR);

            this.getOnLoadPropertyData();
        }
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
    handleCancel() {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this.recordId,
                objectApiName: 'Application__c',
                actionName: 'view'
            }
        });
    }
    changedFromChild(event) {
        console.log('event details parent #### ', JSON.stringify(event.detail));
    }
    handleRequiredDocument(event){
        console.log('required doc list :: ',JSON.stringify(event.detail));
        this.requiredDocuments = event.detail;
    }
}