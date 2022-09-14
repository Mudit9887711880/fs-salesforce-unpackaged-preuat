import { api, LightningElement, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
//import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import PROPERTY_OBJECT from '@salesforce/schema/Property__c';

import getAllApplicantMeta from '@salesforce/apex/FsLeadDetailsControllerHelper.getAllApplicantMeta';
import getLastLoginDate from '@salesforce/apex/DatabaseUtililty.getLastLoginDate';
import BusinessDate from '@salesforce/label/c.Business_Date';
import { getRecord } from 'lightning/uiRecordApi';
import NAME from '@salesforce/schema/Application__c.Name';
import getPropertyDetailsData from '@salesforce/apex/FsLeadDetailsControllerHelper.getPropertyDetailsData';
import getPropertyOwners from '@salesforce/apex/FetchDataTableRecordsController.getPropertyOwners';
import getRequiredDocuments from '@salesforce/apex/fsGenericUploadDocumentsController.getRequiredDocuments';

import { createRecord } from 'lightning/uiRecordApi';
import VERIFICATION_OBJECT from '@salesforce/schema/Verification__c';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { NavigationMixin } from 'lightning/navigation';
import { updateRecord } from 'lightning/uiRecordApi';
import ID_FIELD from '@salesforce/schema/Application__c.Id';
import STAGE_FIELD from '@salesforce/schema/Application__c.Stage__c';
import SUB_STAGE_FIELD from '@salesforce/schema/Application__c.Sub_Stage__c';
export default class FsLeadDetails extends NavigationMixin(LightningElement) {
    @api recordId;
    @api preLogin;
    @api allLoanApplicant;
    @api isPCRecordAvailable;
    @track recordTypeId;
    @track requiredDocuments;
    @track isSpinnerActive;
    @track isCoApplicant;
    @track isGuarantor;
    @track isMobileVerified;
    @track propertyAllData;
    @track allApplicantData;
    @track showErrorTab = false;
    @track activeError = 'step-1';
    @track checkEmpDetails = false;
    @track checkBank = false;
    @track checkLoanType = false;
    @track checkPropDetails = false;
    @track isAddApplicant = false;
    @track isAddProperty = false;
    @track initiateRetrigger = false;
    @track isLoanType = true;
    @api primaryApplicantName;
    @track dedupeDetails;
    @track childData = {
        'PersonalInformation': '',
        'Education': '',
        'Family': '',
        'EmploymentDetails': '',
        'IncomeDetails': '',
        'BankDetails': '',
        'ReferenceDetails': '',
        'ReceiptDetails': '',
        'LoanType': '',
        'PropertyDetails': '',
        'PropertyBoundaries': '',
        'PropertyMeasurements': '',
    };
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
            name: 'AddApplicant',
            label: 'Add Applicant',
            variant: 'brand',
            class: 'slds-m-left_x-small'
        },
        {
            name: 'AddProperty',
            label: 'Add Property',
            variant: 'brand',
            class: 'slds-m-left_x-small'
        },
        {
            name: 'InitiateRetrigger',
            label: 'Initiate Retrigger',
            variant: 'brand',
            class: 'slds-m-left_x-small'
        }
    ]
    @track applicationName;
    @track todaysDate = BusinessDate;
    @track lastLoginDate;
    @track callOnce = false;
    @track pcRecordTypeId;
    //checkValidity
    @track personalInfo = [];
    @track errorMsgs = [];
    @track recordTypeId;

    @wire(getObjectInfo, { objectApiName: PROPERTY_OBJECT })
    getRecordType({ data, error }) {
        if (data) {
            console.log(':: data :: ', JSON.stringify(data));
            const rtis = data.recordTypeInfos;
            this.recordTypeId = Object.keys(rtis).find(rti => rtis[rti].name === 'Lead Detail');
        } else if (error) {

        }
    }

    @wire(getObjectInfo, { objectApiName: VERIFICATION_OBJECT })
    getPcRecordData({ data, error }) {
        if (data) {
            var recordTypeData = data.recordTypeInfos;
            this.pcRecordTypeId = Object.keys(recordTypeData).find(rti => recordTypeData[rti].name === 'PC');
        }
    }
    connectedCallback() {
        this.isSpinnerActive = true;
        console.log('preLogin ### ', this.preLogin);
        this.getRequiredDocuments();
        this.handleGetLastLoginDate();
        this.getAllApplicantMeta();
    }

    renderedCallback() {
        if (!this.callOnce) {
            let currentTab = this.activeError;
            let tabs = this.template.querySelectorAll('lightning-tab');
            console.log('entry 1');
            if (tabs && tabs.length) {
                console.log('entry 2= ', tabs);
                tabs.forEach(element => {
                    element.loadContent();
                    if (element.label == 'Loan Details') {
                        let childTabs = element.querySelectorAll('lightning-tab');
                        console.log('entry 3= ', childTabs);
                        if (childTabs && childTabs.length) {
                            childTabs.forEach(currentItem => {
                                currentItem.loadContent();
                                this.isSpinnerActive = false;
                            });
                            this.callOnce = true;
                        }
                    }
                });
            }
            this.activeError = currentTab;
        }
    }

    getAllApplicantMeta() {
        console.log('called metadata');
        this.allApplicantData = undefined;
        getAllApplicantMeta({ allLoanApplicant: this.allLoanApplicant })
            .then(result => {
                this.allApplicantData = result;
            })
            .catch(error => {
                console.log(error);
            })
    }

    handleGetLastLoginDate() {
        getLastLoginDate().then((result) => {
            this.lastLoginDate = result;
        }).catch((err) => {
            console.log('Error in getLastLoginDate= ', err);
        });
    }

    showToastMessage(title, message, variant) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(evt);
    }

    @wire(getRecord, { recordId: '$recordId', fields: [NAME] })
    applicationDetails({ error, data }) {
        console.log('applicationDetails= ', data);
        if (data) {
            this.applicationName = data.fields.Name.value;
        } else if (error) {
            console.log('error in getting applicationDetails = ', error);
        }
    }
    getRequiredDocuments() {
        this.requiredDocuments = [];
        getRequiredDocuments({ stage: 'Lead Detail', parentId: this.applicationId })
            .then(result => {
                console.log('::: result ::: ', JSON.stringify(result));
                this.requiredDocuments = result;
            })
            .catch(error => {
                console.log('error doc upload ', error);
            })
    }

    handleCheckRequiredDocs() {
        if (this.requiredDocuments.length > 0) {
            this.requiredDocuments.forEach(element => {
                this.errorMsgs.push('Upload Required Document ' + element + ' In Document Upload Tab');
            });
        }
    }


    handleSubmit() {
        this.isSpinnerActive = true;
        this.errorMsgs = [];
        try {

            this.template.querySelector('c-fs-lead-details-personal-information').getPersonalInformationData(false);
            this.template.querySelector('c-fs-lead-details-employment-details').getEmploymentDetailsAllData();
            this.template.querySelector('c-fs-lead-details-property-details').getPropertyVal();
            this.template.querySelector('c-fs-lead-details-loan-type').getLoanTypeData();
            this.handleCheckRequiredDocs();
            console.log('loan type data ', this.isLoanType);
        } catch (error) { console.log(error) }
        setTimeout(() => {
            console.log('this.personalInfo.length ', this.personalInfo.length);
            console.log('this.checkEmpDetails ', this.checkEmpDetails);
            console.log('this.checkPropDetails ', this.checkPropDetails);
            console.log('!this.isLoanType ', this.isLoanType);
            console.log('!this.isCoApplicant ', this.isCoApplicant);
            console.log('!this.isGuarantor ', this.isGuarantor);
            console.log('this.isMobileVerified', this.isMobileVerified);
            if (this.personalInfo.length == 0 && this.checkEmpDetails && this.checkPropDetails && this.isLoanType && ((this.isCoApplicant || this.isGuarantor) && this.isMobileVerified)) {
                this.showErrorTab = false;
                var fields = { 'Application__c': this.recordId, 'RecordTypeId': this.pcRecordTypeId};//'this.recordTypeId 
                var objRecordInput = { 'apiName': 'Verification__c', fields };
                if (!this.isPCRecordAvailable) {
                    createRecord(objRecordInput)
                        .then(response => {
                            console.log('Verification created with Id: ' + response.id);
                            const fields = {};
                            fields[ID_FIELD.fieldApiName] = this.recordId;
                            fields[STAGE_FIELD.fieldApiName] = 'Process Credit';
                            fields[SUB_STAGE_FIELD.fieldApiName] = 'Legal Opinion';
                            const recordInput = { fields };
                            updateRecord(recordInput)
                                .then(() => {
                                    this.showToastMessage('Success', 'Lead Detail Completed Successfully.', 'Success');
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
                        }).catch(error => {
                            console.log('Verification ' + JSON.stringify(error));
                        });
                } else {
                    const fields = {};
                    fields[ID_FIELD.fieldApiName] = this.recordId;
                    fields[STAGE_FIELD.fieldApiName] = 'Process Credit';
                    fields[SUB_STAGE_FIELD.fieldApiName] = 'Legal Opinion';
                    const recordInput = { fields };
                    updateRecord(recordInput)
                        .then(() => {
                            this.showToastMessage('Success', 'Lead Detail Completed Successfully.', 'Success');
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
                }

            }
            else {
                this.isSpinnerActive = false;
                console.log('test @@@@ ', typeof this.checkPropDetails);
                if (!this.isCoApplicant && !this.isGuarantor) {
                    this.errorMsgs.push('Atleast one Co-Applicant or Guarantor will be mandatory On Personal  Information Tab.')
                }
                console.log('this.isMobileVerified=', this.isMobileVerified);
                if (!this.isMobileVerified) {
                    console.log('this.isMobileVerified1111', this.isMobileVerified);
                    this.errorMsgs.push('Verify Mobile of ' + this.personalInfo.join() + ' on Personal Information Tab');
                }
                if (this.personalInfo.length > 0) {
                    this.errorMsgs.push('Fill Required Fields Of ' + this.personalInfo.join() + ' By Editing Them In Applicant Information Tab')
                }
                if (!this.checkEmpDetails) {
                    this.errorMsgs.push('Create Atleast A Record On Employment Detail Tab.')
                }

                if (this.isLoanType === false) {
                    this.errorMsgs.push('Fill Required Fields On Loan Type Tab.')
                }
                if (this.checkPropDetails === false) {
                    this.errorMsgs.push('Fill Required Fields On Property Details Tab')
                }
                if(this.errorMsgs.length){
                    this.showErrorTab = true;
                    let ref = this;
                    setTimeout(() => {
                        ref.activeError = 'Error';
                    }, 300);
                }
            }
        }, 1000);
    }

    //child handler

    checkPersonalInfo(event) {
        var details = event.detail
        console.log('details #### applicant ### ', JSON.stringify(details));
        this.personalInfo = details.IsAllRecordEdit;
        this.isCoApplicant = details.IsCoApplicant;
        this.isGuarantor = details.IsGuarantor;
        this.isMobileVerified = details.IsMobileVerified;
        console.log('this.isMobileVerified###', this.isMobileVerified);
        console.log('child ####  ', JSON.stringify(event.detail));
    }

    checkEmpTabDetails(event) {
        this.checkEmpDetails = event.detail;
        console.log('chils ', this.checkEmpDetails);
    }

    checkBankTab(event) {
        this.checkBank = event.detail;
    }

    checkLoanTypeTab(event) {
    }
    checkloantypeinfo(event) {

        this.isLoanType = event.detail
        console.log('this.isLoanType ####', this.isLoanType);
    }
    checkpropertyvalidation(event) {
        this.checkPropDetails = event.detail;
        console.log('this.checkPropDetails ### ', this.checkPropDetails);
    }
    // Check Validity Method

    getPropertyDetailsData() {
        try {
            getPropertyDetailsData({ applicationId: this.applicantId })
                .then(result => {
                    this.checkLoanType = false;
                    var temp = JSON.parse(result.strDataTableData);
                    console.log('result #### ', temp);
                    if (temp.length == 0)
                        this.checkPropDetails = false;
                    else
                        this.checkPropDetails = true;
                })
                .catch(error => {

                })
        } catch (error) { console.log(error) }
    }

    handleActive(event) {
        this.activeError = event.target.value;
        setTimeout(() => {
            if (event.target.value == 'Property Details') {
                this.template.querySelector('c-fs-lead-details-property-details').refreshAddNewProperty();
            }
            if (event.target.value == 'Property Boundaries') {
                this.template.querySelector('c-fs-lead-details-property-boundaries').refreshAddNewProperty();
            }
            if (event.target.value == 'Property Measurement') {
                this.template.querySelector('c-fs-lead-details-property-measurement').refreshAddNewProperty();
            }
            if (event.target.value == 'Property Address') {
                this.template.querySelector('c-fs-lead-details-property-address').refreshAddNewProperty();
            }
            if (event.target.value == 'Ownership Details') {
                this.template.querySelector('c-fs-lead-details-ownership-details').refreshAddNewProperty();
            }
        }, 1000)
    }

    rowselectionevent(event) {
        var detail = event.detail;
        console.log('detail ### ', JSON.stringify(detail));
        if (detail === 'AddApplicant') {
            this.isAddApplicant = true;
            //this.allLoanApplicant.push();
        }
        if (detail === 'AddProperty') {
            this.getAllOwners();
        }
        if (detail === 'InitiateRetrigger') {
            this.initiateRetrigger = true;
        }
    }
    addapplicantclose() {
        this.isAddApplicant = false;
    }
    getapplicantid(event) {
        try {
            this.isAddApplicant = false;
            var tempApplicant = this.allLoanApplicant;
            this.allLoanApplicant = undefined;
            try {
                tempApplicant = [...tempApplicant, event.detail];
                this.allLoanApplicant = tempApplicant;
                this.getAllApplicantMeta();
                this.tableData = undefined;
                setTimeout(() => {
                    console.log("Delayed for 1 second.");
                    this.template.querySelector('c-fs-lead-details-personal-information').getPersonalInformationData(true);
                }, "1000")
            } catch (error) {
                console.log(error);
            }
        } catch (error) {
            console.log(error);
        }

    }
    getAllOwners() {
        console.log('get property owners called!!', this.allLoanApplicant);
        getPropertyOwners({ applicantId: this.allLoanApplicant })
            .then(result => {
                console.log('datatable result ', result);
                this.propertyAllData = result;
                this.isAddProperty = true;
            })
            .catch(error => {
                console.log('error in getpropownersdata ', error);
            })
    }
    addpropertyclose() {
        this.isAddProperty = false;
    }
    handleRequiredDocument(event) {
        console.log('required doc list :: ', JSON.stringify(event.detail));
        this.requiredDocuments = event.detail;
    }
    getpropertydata() {
        this.isAddProperty = false;
        if (this.activeError == 'Property Details') {
            this.template.querySelector('c-fs-lead-details-property-details').refreshAddNewProperty();
        }
        if (this.activeError == 'Property Boundaries') {
            this.template.querySelector('c-fs-lead-details-property-boundaries').refreshAddNewProperty();
        }
        if (this.activeError == 'Property Measurement') {
            this.template.querySelector('c-fs-lead-details-property-measurement').refreshAddNewProperty();
        }
        if (this.activeError == 'Property Address') {
            this.template.querySelector('c-fs-lead-details-property-address').refreshAddNewProperty();
        }
        if (this.activeError == 'Ownership Details') {
            this.template.querySelector('c-fs-lead-details-ownership-details').refreshAddNewProperty();
        }
    }
    handleRetriggerClose() {
        this.initiateRetrigger = false;
    }
    getdedupedetails(event) {
        let result = event.detail;
        this.dedupeDetails = JSON.parse(result);
        console.log('Dedupe Details', this.dedupeDetails);
        //if(this.dedupeDetails.errorFlag)
          //this.errorMsg.push(this.dedupeDetails.message);
    }
}