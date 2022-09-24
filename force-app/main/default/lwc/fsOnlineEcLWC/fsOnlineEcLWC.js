import {  LightningElement, api,track, wire } from 'lwc';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import PROPERTY_OBJECT from '@salesforce/schema/Property__c';
import { getRecord } from 'lightning/uiRecordApi';
import BusinessDate from '@salesforce/label/c.Business_Date';
import NAME from '@salesforce/schema/Application__c.Name';
import ID_FIELD from '@salesforce/schema/Verification__c.Id';
import STATUS_FIELD from '@salesforce/schema/Verification__c.Status__c';
import getLastLoginDate from '@salesforce/apex/DatabaseUtililty.getLastLoginDate';
import getCollateralDetails from '@salesforce/apex/FsOnlineECController.getCollateralDetails';
import getVerification from '@salesforce/apex/FsOnlineECController.getVerification';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { updateRecord } from 'lightning/uiRecordApi';
import { NavigationMixin } from 'lightning/navigation';
import { CurrentPageReference } from 'lightning/navigation';

export default class fsOnlineEcLWC extends NavigationMixin(LightningElement) {
    @api recTypeId;
    @api applicationId;
    @api recordId;
    @track recordTypeId;
    @track VericationStatus;
    @track tabName = "Collateral";
    @track activeError = 'Collateral';
    @track errorMsgs;
    @track isSpinnerActive;
    @track showErrorTab = false;
    @track showSpinner = false;
    @track todaysDate = BusinessDate;
    @track applicationName;
    @track lastLoginDate;
    @track checkRequiredDocs = false;
    @track checkRequiredField = false;
    @track requiredDocuments;
    loadAll = false;
    @track isReqCalled = false;
    @track rowAction = [
        {
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
        /*      {
                    type: 'button-icon',
                    fixedWidth: 50,
                    typeAttributes: {
                        iconName: 'utility:delete',
                        title: 'Delete',
                        variant: 'border-filled',
                        alternativeText: 'Delete',
                        name: 'delete'
                    }
                },*/
    ]
    @track button = [
        {
            name: 'submit',
            label: 'Submit',
            variant: 'brand',
            class: 'slds-m-left_x-small'
        }
    ];

    @wire(getObjectInfo, { objectApiName: PROPERTY_OBJECT })
    getRecordType({ data, error }) {
        if (data) {
            console.log(':: data :: ', JSON.stringify(data));
            const rtis = data.recordTypeInfos;
            this.recordTypeId = Object.keys(rtis).find(rti => rtis[rti].name === 'Online EC Property Detail');
        } else if (error) {

        }
    }

    // @wire(CurrentPageReference)
    // getStateParameters(currentPageReference) {

    //     if (currentPageReference && !this.recordId) {
    //         console.log('page', currentPageReference);
    //         this.recordId = currentPageReference.attributes.recordId;
    //         console.log('id', this.recordId);
    //     }
    // }

    @wire(getRecord, { recordId: '$applicationId', fields: [NAME] })
    applicationDetails({ error, data }) {
        console.log('applicationDetails= ', data);
        if (data) {
            this.applicationName = data.fields.Name.value;
        } else if (error) {
            console.log('error in getting applicationDetails = ', error);
        }
    }

    connectedCallback() {
        console.log('connected Callback this.recordId= ',this.recordId);
        this.disablePullToRefresh();
        console.log('applicationId ##### ' + JSON.stringify(this.applicationId));
        console.log('recordId ##### ' + JSON.stringify(this.recordId));
        this.handleGetLastLoginDate();
        getVerification({ recordId: this.recordId })
            .then((result) => {
                this.VericationStatus = result;
            })
            .catch((error) => {
            });
    }

    renderedCallback() {
        if (this.loadAll == false) {
            console.log('i am in check validity');
            let currentTab = this.activeError;
            console.log('currentTab= ', currentTab);
            let tabs = this.template.querySelectorAll('lightning-tab');
            console.log('tabs ', tabs);
            tabs.forEach(element => {
                element.loadContent();
            });
            console.log('currentTab= ', currentTab);
            this.activeError = currentTab;
            if (tabs && tabs.length == 2) {
                this.loadAll = true;
            }
        }
    }

    disablePullToRefresh() {
        const disableRefresh = new CustomEvent("updateScrollSettings", {
            detail: {
                isPullToRefreshEnabled: false
            },
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(disableRefresh);
    }

    handleGetLastLoginDate() {
        getLastLoginDate().then((result) => {
            this.lastLoginDate = result
        }).catch((err) => {
            console.log('Error in getLastLoginDate= ', err);
        });
    }


    getPropertyData() {
        getCollateralDetails({ applicationId: this.applicationId })
            .then(result => {
                console.log('result ### ', JSON.stringify(JSON.parse(result.strDataTableData)));
                var data = JSON.parse(result.strDataTableData);
                data.forEach(element => {
                    if (element.Is_Online_Ec_Completed__c === 'false') {
                        this.errorMsgs.push('Fill Required Data On ' + element.Name_LABEL + ' In Collateral Tab');
                    }
                });
            })
            .catch(error => {

            })
    }
    // getRequiredDocuments() {
    //     this.requiredDocuments = [];
    //     getRequiredDocuments({ stage: 'Online EC', parentId: this.applicationId })
    //         .then(result => {
    //             console.log('::: result ::: ', JSON.stringify(result));
    //             this.requiredDocuments = result;
    //         })
    //         .catch(error => {
    //             console.log('error doc upload ', error);
    //         })
    // }

    // handleCheckRequiredDocs() {
    //     if (this.requiredDocuments.length > 0) {
    //         this.requiredDocuments.forEach(element => {
    //             this.errorMsgs.push('Upload Required Document ' + element + ' In Document Upload Tab');
    //         });
    //     }
    // }

    /* checkRequired(event) {
    console.log('Check Required Online Ec', event.detail);
    this.checkRequiredField = event.detail;
    }*/
    handleCancel() {
        console.log('cancel call');
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this.recordId,
                objectApiName: 'Verification__c',
                actionName: 'view'
            }
        })
    }
    handleActive(event) {
        this.tabName = event.target.value;
        // if (this.tabName === 'Document Upload') {
        //     try {
        //         this.template.querySelector('c-fs-generic-upload-documents').getAllRequiredData()
        //     } catch (error) {
        //         console.log('error :: ', error);
        //     }
        // }
    }


    handleRequiredDocument(event) {
        console.log('required doc list :: ', JSON.stringify(event.detail));
        this.requiredDocuments = event.detail;
    }

    requiredDocumentValidation() {
        console.log('requiredDocuments ', JSON.stringify(this.requiredDocuments));
        if (this.requiredDocuments.length > 0) {
            this.requiredDocuments.forEach(element => {
                console.log('element #### ', JSON.stringify(element));
                if (element.documentType === 'Application') {
                    this.errorMsgs.push('Upload Application Document ' + element.documentName + ' In Document Upload Tab');
                }
                if (element.documentType === 'Applicant') {
                    this.errorMsgs.push('Upload Document ' + element.documentName + ' For ' + element.customerName + ' In Document Upload Tab');
                }
                if (element.documentType === 'Asset') {
                    this.errorMsgs.push('Upload Document ' + element.documentName + ' For ' + element.propertyName + ' In Document Upload Tab');
                }
            });
        }
    }


    handleOnlineECSubmit() {
        this.isSpinnerActive = true;
        //this.template.querySelector('c-fs-generic-upload-documents').checkAllRequiredDocument();
        setTimeout(() => {
            this.isSpinnerActive = false;
            this.handleSubmit();
        }, 3000);
    }

    // setTimeout(() => {
    //     this.requiredDocumentValidation();
    // }, 3000);

    handleSubmit() {
        console.log('Callling....');
        // try{
        //     this.template.querySelector('c-fs-generic-upload-documents').checkAllRequiredDocument();   
        // }catch(error){
        //     console.log(error)
        // }
        // setTimeout(() => {
        //     this.requiredDocumentValidation();
        // }, 3000);
        this.isSpinnerActive = true;
        //this.errorMsgs = [];
        this.getPropertyData();
        this.errorMsgs = [];
        this.requiredDocumentValidation();
        setTimeout(() => {
            if (this.VericationStatus == 'Completed') {
                console.log('#11', STATUS_FIELD.fieldApiName);
                this.toastMessage('Error', 'Online Ec is already Completed .', 'Error');
                this[NavigationMixin.Navigate]({
                    type: 'standard__recordPage',
                    attributes: {
                        recordId: this.recordId,
                        objectApiName: 'Verification__c',
                        actionName: 'view'
                    }
                });
            }
            else {
                console.log('this.errorMsgs. #### ', JSON.stringify(this.errorMsgs));
                if (this.errorMsgs.length > 0) {
                    this.toastMessage('Error', 'Remove All Error', 'Error');
                    this.isSpinnerActive = false;

                    let ref = this;
                    setTimeout(() => {
                        this.showErrorTab = true;
                        ref.tabName = 'Error';
                    }, 2000);
                } else {
                    const fields = {};
                    try {
                        console.log('this.recordId= ',this.recordId);
                        fields[ID_FIELD.fieldApiName] = this.recordId;
                        fields[STATUS_FIELD.fieldApiName] = 'Completed';
                        const recordInput = { fields };
                        console.log('fiield ', fields);
                        updateRecord(recordInput)
                            .then(() => {
                                console.log('inside updateRecord');
                                this.toastMessage('Success', 'Verification Submitted Successfully.', 'Success');
                                this[NavigationMixin.Navigate]({
                                    type: 'standard__recordPage',
                                    attributes: {
                                        recordId: this.recordId,
                                        objectApiName: 'Verification__c',
                                        actionName: 'view'
                                    }
                                });
                            })
                            .catch(error => {
                                console.log('upd ', error);
                            });
                    }
                    catch (exe) {
                        console.error('try ', exe);
                    }
                }
            }
        }, 1000);
    }

    toastMessage(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(event);
    }

    headerButtonClick(event) {
        if (event.detail === 'submit') {
            //this.handleFIVCSubmit();
            this.handleOnlineECSubmit();
        }
    }
}