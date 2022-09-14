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
                this.comment = data.recordData.Senior_Person_Comments__c;
            } else {
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
        console.log('handleRevisitSubmit called');
        this.showTemporaryLoader();
    }

    // This Method Is Used To Handle Post Success Actions.
    handleRevisitSuccess() {
        console.log('handleRevisitSuccess');
        this.revisitRecordId = undefined;
        this.revisitTableData = undefined;
        setTimeout(() => {
            this.revisitTableData = undefined;
        }, 200);
        if (this.isSeniorVisit) {
            this.handleGetRevisitData('FIV_C_Senior_Revisit');
        } else {
            this.handleGetRevisitData('FIV_C_Revisit');
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