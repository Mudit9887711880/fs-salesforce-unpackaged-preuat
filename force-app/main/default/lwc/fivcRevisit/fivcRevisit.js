/*
* ──────────────────────────────────────────────────────────────────────────────────────────────────
* @author           Kuldeep Sahu  
* @modifiedBy       Kuldeep Sahu   
* @created          2022-07-07
* @modified         2022-07-21
* @Description      This component is build to handle all the operations related to 
                    Revist/Senior Revisit Tab in Verification-C in FiveStar.              
* ──────────────────────────────────────────────────────────────────────────────────────────────────
*/
import { LightningElement, api, track } from 'lwc';
import getRevisitData from '@salesforce/apex/FIV_C_Controller.getRevisitData';
import deleteRecord from '@salesforce/apex/Utility.deleteRecord';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
export default class FivcRevisit extends LightningElement {
    @api verificationId;
    @api isSeniorVisit = false;

    @track revisitValidation = false;
    @track revisitTableData;
    @track revisitRecordId;
    @track revisitType = 'General Revisit';
    @track showSpinner = false;
    @track showDeleteModal = false;
    @track showOther = false;
    @track comment;
    @track todayDate;
    @track revisitDate;
    @track revisitedPersonId;
    @track revisitedPersonName;
    @track rowAction = [{
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
    }];

    get isRemarkRequired() {
        return this.comment != 'Positive' ? true : false;
    }

    // This Method Is Used To Get All Data At Initial Level(Loading).
    connectedCallback() {
        console.log('REVIST COMPONENT LOADED');
        this.todayDate = new Date().toISOString();
        if (this.isSeniorVisit) {
            this.revisitType = 'Senior Revisit';
            this.handleGetRevisitData('FIV_C_Senior_Revisit');
        } else {
            this.revisitType = 'General Revisit';
            this.handleGetRevisitData('FIV_C_Revisit');
        }
    }

    // This Method Is Used To Handle Form Values.
    handleFormValues(event) {
        if (event.target.fieldName == 'Revisit_done__c') {
            if (event.target.value == 'Yes') {
                this.showOther = true;
            } else if (event.target.value == 'No') {
                this.showOther = false;
            }
        } else if (event.target.fieldName == 'Senior_Auditor_Confirmation_Visit__c') {
            if (event.target.value == 'Yes') {
                this.showOther = true;
            } else if (event.target.value == 'No') {
                this.showOther = false;
            }
        } else if (event.target.fieldName == 'Senior_Person_Comments__c') {
            this.comment = event.target.value;
        } else if (event.target.name == 'Revisit_date__c') {
            this.revisitDate = event.target.value;
        }
    }

    handleSelect(event) {
        console.log('User Selected = ', event.detail)
        if (event.detail.length > 0) {
            this.revisitedPersonId = event.detail[0].id;
            this.revisitedPersonName = event.detail[0].subtitle;
            console.log('this.revisitedPersonId =', this.revisitedPersonId);
        } else {
            this.revisitedPersonName = undefined;
            this.revisitedPersonId = undefined;
            console.log('input',this.template.querySelector('[data-id="Employee_Name_Of_Person_Revisited__c"]'));
            this.template.querySelector('[data-id="Employee_Name_Of_Person_Revisited__c"]').reset();
        }
    }

    // This Method Is Used To Handle Revisit Record Selection From Table.
    handleSelectedRevisit(evt) {
        console.log('handleSelectedRevisit= ', JSON.stringify(evt.detail));
        var data = evt.detail;
        if (data && data.ActionName == 'edit') {
            this.revisitRecordId = data.recordData.Id;
            if (this.isSeniorVisit) {
                if (data.recordData.Senior_Auditor_Confirmation_Visit__c == 'Yes') {
                    this.showOther = true;
                } else if (data.recordData.Senior_Auditor_Confirmation_Visit__c == 'No') {
                    this.showOther = false;
                }
                this.revisitedPersonId = data.recordData.Employee_No_Of_Person_Revisited__c;
                this.comment = data.recordData.Senior_Person_Comments__c;
            } else {

                if (data.recordData.Revisit_date__c) {
                    this.revisitDate = data.recordData.Revisit_date__c.substring(0, 10);
                }
                if (data.recordData.Revisit_done__c == 'Yes') {
                    this.showOther = true;
                } else if (data.recordData.Revisit_done__c == 'No') {
                    this.showOther = false;
                }
            }
        } else if (data && data.ActionName == 'delete') {
            this.revisitRecordId = data.recordData.Id;
            this.showDeleteModal = true;
        }
    }

    onCancel() {
        this.revisitDate = undefined;
        this.comment = undefined;
        this.showOther = false;
        this.revisitRecordId = undefined;
        const inputFields = this.template.querySelectorAll(
            'lightning-input-field'
        );
        if (inputFields) {
            inputFields.forEach(field => {
                field.reset();
            });
        }
    }

    // This Method Is Used To Handle Delete Functionality.
    handleDelete(event) {
        console.log('handleDelete= ', event.target.label)
        let label = event.target.label;
        if (label == 'Yes') {
            this.showDeleteModal = false;
            this.handleDeleteRecord(this.revisitRecordId);
        } else if (label == 'No') {
            this.showDeleteModal = false;
            this.revisitRecordId = undefined;
        }
    }

    // This Method Is Used To Handle Post Submit Actions.
    handleRevisitSubmit(evt) {
        console.log('handleRevisitSubmit called= ', this.isSeniorVisit);
        if (this.isSeniorVisit) {
            this.showTemporaryLoader();
        } else {
            let checkValidity = this.checkInputValidity()
            console.log('checkValidity =', checkValidity);
            if (!this.checkInputValidity()) {
                evt.preventDefault();
                return;
            }
            this.showTemporaryLoader();
        }
    }

    // This Method Is Used To Handle Post Success Actions.
    handleRevisitSuccess() {
        console.log('handleRevisitSuccess');
        this.revisitRecordId = undefined;
        this.revisitTableData = undefined;
        this.onCancel();
        setTimeout(() => {
            this.revisitRecordId = undefined;
            this.revisitTableData = undefined;
        }, 200);
        if (this.isSeniorVisit) {
            this.handleGetRevisitData('FIV_C_Senior_Revisit');
            this.showNotifications('', 'Senior Revisit record is saved successfully', 'success');
        } else {
            this.handleGetRevisitData('FIV_C_Revisit');
            this.showNotifications('', 'Revisit record is saved successfully', 'success');
        }
    }

    // This Method Is Used To Show Loader For Short Time.
    showTemporaryLoader() {
        this.showSpinner = true;
        let ref = this;
        setTimeout(function () {
            ref.showSpinner = false;
        }, 500);
    }

    // This Method Is Used To Handle Revisit/Senior Revisit Validation.
    sendValidationData() {
        this.dispatchEvent(new CustomEvent('revisitvalidation', {
            detail: this.revisitValidation
        }));
    }

    // This Method Is Used To Handle Check Validations For Form
    checkInputValidity() {
        const allValid = [
            ...this.template.querySelectorAll('lightning-input'),
        ].reduce((validSoFar, inputCmp) => {
            inputCmp.reportValidity();
            return validSoFar && inputCmp.checkValidity();
        }, true);
        return allValid;
    }

    // This Method Is Used To Show Toast Notification
    showNotifications(title, msg, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title: title,
            message: msg,
            variant: variant
        }));
    }

    /*=================  All server methods  ====================*/

    // This Method Is Used To Get Table Data From Server Side.
    handleGetRevisitData(mdtName) {
        getRevisitData({
            recordId: this.verificationId,
            metadataName: mdtName,
            type: this.revisitType
        }).then((result) => {
            console.log('handleGetRevisitData = ', result)
            this.revisitTableData = JSON.parse(JSON.stringify(result));
            if (this.revisitTableData && this.revisitTableData.strDataTableData && JSON.parse(this.revisitTableData.strDataTableData).length > 0) {
                this.revisitValidation = true;
                console.log('Rivist Validation success');
            } else {
                this.revisitValidation = false;
            }
            this.sendValidationData();
        }).catch((err) => {
            console.log('handleGetRevisitData Error= ', err)
        });
    }

    // This Method Is Used To Delete Record.
    handleDeleteRecord(recordIdToDelete) {
        this.showTemporaryLoader();
        deleteRecord({ recordId: recordIdToDelete }).then((result) => {
            console.log('handleDeleteRecord = ', result);
            if (result == 'success') {
                this.showNotifications('', 'Record deleted successfully', 'success');
                this.revisitRecordId = undefined;
                this.revisitTableData = undefined;
                let ref = this;
                setTimeout(() => {
                    if (ref.isSeniorVisit) {
                        ref.handleGetRevisitData('FIV_C_Senior_Revisit');
                    } else {
                        ref.handleGetRevisitData('FIV_C_Revisit');
                    }
                }, 400);
            }
        }).catch((err) => {
            console.log('Error in handleDeleteRecord = ', err);
        });
    }
}