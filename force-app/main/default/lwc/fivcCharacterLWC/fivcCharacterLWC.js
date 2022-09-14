/*
* ──────────────────────────────────────────────────────────────────────────────────────────────────
* @author           Kuldeep Sahu  
* @modifiedBy       Kuldeep Sahu   
* @created          2022-05-02
* @modified         2022-07-21
* @Description      This component is build to handle all the operations related to 
                    Verification-C Character Tab in FiveStar.              
* ──────────────────────────────────────────────────────────────────────────────────────────────────
*/
import { LightningElement, api, track } from 'lwc';
import getApplicantList from '@salesforce/apex/FIV_C_Controller.getApplicantList';
import getCharacterTabRecords from '@salesforce/apex/FIV_C_Controller.getCharacterTabRecords';
import deleteRecord from '@salesforce/apex/Utility.deleteRecord';
import getRecordTypeId from '@salesforce/apex/DatabaseUtililty.getRecordTypeId';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
const rowAction = [{
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

const rowAction2 = [{
    label: 'Action',
    type: 'button-icon',
    fixedWidth: 50,
    typeAttributes: {
        iconName: 'utility:live_message',
        title: 'Verify Mobile',
        variant: 'border-filled',
        alternativeText: 'Verify Mobile',
        name: 'verify'
    }
}];

export default class FivcCharacterLWC extends LightningElement {
    @api applicationId;
    @api verificationId;
    @api loginId;
    @api preLoginRecordType;
    @api loanAmount;

    @track rowAction = rowAction;
    @track rowAction2 = rowAction2;
    @track customerList;
    @track customerData;

    @track familyTableData;
    @track neighbourTableData;
    @track affiliationTableData;
    @track livingStandardTableData;
    @track repaymentTableData;

    @track customerId;
    @track loanApplicantId;
    @track familyMemberId;
    @track neighbourId;
    @track affiliationId;
    @track livingStandardId;
    @track repaymentId;

    @track characterRecordTypeFIVC;

    @track disableFields = false;
    @track isFamilyTab = true;
    @track isNeighbourDetail = false;
    @track isAffiliationDetail = false;
    @track isLivingDetail = false;
    @track isRepaymentDetail = false;

    @track showLoader = false;;

    @track isInvolvedValue;
    @track neighbourName;
    @track neighbourNumber;
    @track familyMemberName;
    @track neighbourFeedback;

    @track showDeleteModal = false;
    @track characterValidation = {
        familyDetail: false,
        neighbourInfo: false,
        affiliationDetail: false,
        livingStandardInfo: false,
        repaymentInfo: false
    };

    @track affiliationWithVal;

    get modalClasses() {
        return 'slds-modal slds-fade-in-open slds-modal_large';
    }

    get modalStyle() {
        return this.isOtpSend ? 'max-width: 7rem !important;' : '';
    }

    get isAffiliationFieldRequired() {
        return this.isInvolvedValue == 'Yes' ? true : false;
    }

    get isNeighbourRemarkRequired() {
        return (this.neighbourFeedback == 'Negative' || this.neighbourFeedback == 'Neutral') ? true : false;
    }

    get isPolitics() {
        return this.affiliationWithVal && this.affiliationWithVal.includes('Politics') ? true : false;
    }

    get isPoliceOrLawyer() {
        return this.affiliationWithVal && (this.affiliationWithVal.includes('Police') || this.affiliationWithVal.includes('Advocate')) ? true : false;
    }

    get showSecondLifestyle() {
        return (this.loanAmount > 200000) ? true : false;
    }

    get showThirdLifestyle() {
        return (this.loanAmount > 400000) ? true : false;
    }

    get showFourthLifestyle() {
        return (this.loanAmount > 800000) ? true : false;
    }

    // This Method Is Used To Get All Data At Initial Level(Loading)
    connectedCallback() {
        this.showLoader = true;
        this.handleGetCharacterRecordType();
        this.handleGetApplicantList(true);
    }

    // This Method Is Used To Handle Tab Activation Event
    handleTabActivation(event) {
        console.log('handleTabActivation= ', event.target.value);
        this.isFamilyTab = false;
        this.isNeighbourDetail = false;
        this.isAffiliationDetail = false;
        this.isLivingDetail = false;
        this.isRepaymentDetail = false;

        if (event.target.value == 'neighbour') {
            this.isNeighbourDetail = true;
        } else if (event.target.value == 'affiliation') {
            this.isAffiliationDetail = true;
        } else if (event.target.value == 'living') {
            this.isLivingDetail = true;
        } else if (event.target.value == 'repayment') {
            this.isRepaymentDetail = true;
        } else if (event.target.value == 'family') {
            this.isFamilyTab = true;
        }
    }

    // This Method Is Used To Handle Form Values
    handleFormValues(event) {
        if (this.isNeighbourDetail) {
            if (event.target.name == "Neighbour_Name__c") {
                this.neighbourName = event.target.value;
            } else if (event.target.name == "Neighbour_Number__c") {
                this.neighbourNumber = event.target.value;
            } else if (event.target.fieldName == "FeedBack__c") {
                this.neighbourFeedback = event.target.value;
            }
        } else if (this.isFamilyTab) {
            if (event.target.name == "Family_Member_Name__c") {
                this.familyMemberName = event.target.value;
            }
        }
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

    // This Method Is Used To Handle Customer Selection
    handleCustomerSelection(evt) {
        this.isInvolvedValue = undefined;
        this.customerId = evt.target.value;
        this.loanApplicantId = this.customerData[this.customerId].Id;
        this.customerTypeVal = this.customerData[this.customerId].Customer_Type__c;
    }

    // This Method Is Used To Handle Affiliation Form Values
    handleAffiliationFormValues(evt) {
        if (evt.target.fieldName == 'Is_Involved__c') {
            this.isInvolvedValue = evt.target.value;
        } else if (evt.target.fieldName == 'Affiliation_with__c') {
            console.log('this.affiliationWithVal= ', this.affiliationWithVal);
            this.affiliationWithVal = evt.target.value;
        }
    }

    // This Method Is Used To Handle Table Row Selection Event
    handleTableSelection(evt) {
        console.log('handleTableSelection= ', JSON.stringify(evt.detail));
        var data = evt.detail;

        if (data && data.recordData && data.recordData.Loan_Applicant__c) {
            let loanApplicant = data.recordData.Loan_Applicant__c;
            this.customerId = loanApplicant;
            console.log('Customer Id = ', this.customerId)
        }
        if (this.isFamilyTab) {
            if (data && data.ActionName == 'edit') {
                this.familyMemberId = data.recordData.Id;
                this.familyMemberName = data.recordData.Family_Member_Name__c;
                this.customerTypeVal = data.recordData.Customer_Type__c;
            } else if (data && data.ActionName == 'delete') {
                this.familyMemberId = data.recordData.Id;
                this.showDeleteModal = true;
            }
        } else if (this.isNeighbourDetail) {
            if (data && data.ActionName == 'edit') {
                this.neighbourId = data.recordData.Id;
                this.neighbourName = data.recordData.Neighbour_Name__c;
                this.neighbourNumber = data.recordData.Neighbour_Number__c;
                this.neighbourFeedback = data.recordData.FeedBack__c;
            } else if (data && data.ActionName == 'delete') {
                this.neighbourId = data.recordData.Id;
                this.showDeleteModal = true;
            }
        } else if (this.isAffiliationDetail) {
            if (data && data.ActionName == 'edit') {
                this.affiliationId = data.recordData.Id;
                this.affiliationWithVal = data.recordData.Affiliation_with__c;
            } else if (data && data.ActionName == 'delete') {
                this.affiliationId = data.recordData.Id;
                this.showDeleteModal = true;
            }
        } else if (this.isLivingDetail) {
            if (data && data.ActionName == 'edit') {
                this.livingStandardId = data.recordData.Id;
                this.loanApplicantId = data.recordData.Loan_Applicant__c;
                let text = data.recordData.Loan_Applicant__r_Customer_Information__c_VALUE;
                const myArray = text.split("/");
                let word = myArray[3];
                this.customerId = word;
            } else if (data && data.ActionName == 'delete') {
                this.livingStandardId = data.recordData.Id;
                this.showDeleteModal = true;
            }
        } else if (this.isRepaymentDetail) {
            if (data && data.ActionName == 'edit') {
                this.repaymentId = data.recordData.Id;
                this.loanApplicantId = data.recordData.Loan_Applicant__c;
                let text = data.recordData.Loan_Applicant__r_Customer_Information__c_VALUE;
                const myArray = text.split("/");
                let word = myArray[3];
                this.customerId = word;
            } else if (data && data.ActionName == 'delete') {
                this.repaymentId = data.recordData.Id;
                this.showDeleteModal = true;
            }
        }
    }

    // This Method Is Used To Check Character Tab Validations
    @api
    checkCharacterValidation() {
        console.log('checkCharacterValidation')
        this.characterValidation = {
            familyDetail: true,
            neighbourInfo: true,
            affiliationDetail: true,
            livingStandardInfo: true,
            repaymentInfo: true
        };

        if (!(this.familyTableData && this.familyTableData.strDataTableData && JSON.parse(this.familyTableData.strDataTableData).length > 0)) {
            this.characterValidation.familyDetail = false;
            console.log('1');
        }

        if (!(this.neighbourTableData && this.neighbourTableData.strDataTableData && JSON.parse(this.neighbourTableData.strDataTableData).length > 0)) {
            this.characterValidation.neighbourInfo = false;
            console.log('2');
        }

        if (!(this.affiliationTableData && this.affiliationTableData.strDataTableData && JSON.parse(this.affiliationTableData.strDataTableData).length > 0)) {
            this.characterValidation.affiliationDetail = false;
            console.log('3');
        }

        if ((this.livingStandardTableData && this.livingStandardTableData.strDataTableData && JSON.parse(this.livingStandardTableData.strDataTableData).length > 0)) {
        } else {
            this.characterValidation.livingStandardInfo = false;
        }
        console.log('checkCharacterValidation = ', JSON.parse(JSON.stringify(this.characterValidation)));

        this.dispatchEvent(new CustomEvent('charactervalidation', {
            detail: this.characterValidation
        }));
    }

    // This Method Is Used To Show Loader For Short Time
    showTemporaryLoader() {
        this.showLoader = true;
        let ref = this;
        setTimeout(function () {
            ref.showLoader = false;
        }, 500);
    }

    // This Method Is Used To Handle Post Submit Actions
    handleSubmit(event) {
        let checkValidation = this.checkInputValidity();
        console.log('handleSubmit checkValidation= ', checkValidation)

        if (!checkValidation) {
            event.preventDefault();
            this.showNotifications('Invalid input', 'You haven\'t entered correct data', 'error');
        } else if (!this.customerId) {
            event.preventDefault();
            this.showNotifications('Missing values', 'You haven\'t selected any customer', 'error');
        } else {
            this.showTemporaryLoader();
        }
    }

    // This Method Is Used To Handle Post Success Actions
    handleSuccess() {
        console.log('HandleSuccess');
        let ref = this;
        this.customerId = undefined;
        this.loanApplicantId = undefined;
        if (this.isFamilyTab) {
            this.familyMemberId = undefined;
            this.familyTableData = undefined;
            this.familyMemberName = undefined;
            this.customerTypeVal = undefined;
            this.isFamilyTab = false;
            setTimeout(() => {
                ref.familyMemberId = undefined;
                ref.isFamilyTab = true;
            }, 200);
            this.getFamilyDetailTableRecords();
        } else if (this.isNeighbourDetail) {
            this.neighbourId = undefined;
            this.neighbourName = undefined;
            this.neighbourNumber = undefined;
            this.neighbourFeedback = undefined;
            this.neighbourTableData = undefined;
            this.isNeighbourDetail = false;
            setTimeout(() => {
                ref.neighbourId = undefined;
                ref.isNeighbourDetail = true;
            }, 200);
            this.getNeighbourTableRecords();
        } else if (this.isAffiliationDetail) {
            this.affiliationId = undefined;
            this.affiliationTableData = undefined;
            this.isAffiliationDetail = false;
            this.affiliationWithVal = undefined;
            setTimeout(() => {
                ref.affiliationId = undefined;
                ref.isAffiliationDetail = true;
            }, 200);
            this.getAffiliationTableRecords();
        } else if (this.isLivingDetail) {
            this.livingStandardId = undefined;
            this.livingStandardTableData = undefined;
            setTimeout(() => {
                ref.livingStandardId = undefined;
                ref.isLivingDetail = true;
            }, 200);
            this.getLivingStandardTableRecords();
        } else if (this.isRepaymentDetail) {
            this.repaymentId = undefined;
            this.repaymentTableData = undefined;
            setTimeout(() => {
                ref.repaymentId = undefined;
                ref.isRepaymentDetail = true;
            }, 200);
            this.getRepaymentTableRecords();
        }
    }

    // This Method Is Used To Handle Cancel Event On Form
    onCancel() {
        const inputFields = this.template.querySelectorAll(
            'lightning-input-field'
        );
        if (inputFields) {
            inputFields.forEach(field => {
                field.reset();
            });
        }
        this.customerId = undefined;
        if (this.isFamilyTab) {
            this.familyMemberId = undefined;
            this.familyMemberName = undefined;
            this.customerTypeVal = undefined;
        } else if (this.isNeighbourDetail) {
            this.neighbourId = undefined;
            this.neighbourName = undefined;
            this.neighbourNumber = undefined;
            this.neighbourFeedback = undefined;
        } else if (this.isAffiliationDetail) {
            this.affiliationId = undefined;
            this.affiliationWithVal = undefined;
        } else if (this.isLivingDetail) {
            this.livingStandardId = undefined;
        } else if (this.isRepaymentDetail) {
            this.repaymentId = undefined;
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

    // This Method Is Used To Handle Delete Operation
    handleDelete(event) {
        console.log('handleDelete= ', event.target.label)
        let label = event.target.label;
        if (label == 'Yes') {
            this.showDeleteModal = false;
            if (this.isFamilyTab) {
                this.handleDeleteRecord(this.familyMemberId);
            } else if (this.isNeighbourDetail) {
                this.handleDeleteRecord(this.neighbourId);
            } else if (this.isAffiliationDetail) {
                this.handleDeleteRecord(this.affiliationId);
            } else if (this.isLivingDetail) {
                this.handleDeleteRecord(this.livingStandardId);
            } else if (this.isRepaymentDetail) {
                this.handleDeleteRecord(this.repaymentId);
            }
        } else if (label == 'No') {
            this.showDeleteModal = false;
            this.repaymentId = undefined;
            this.livingStandardId = undefined;
            this.familyMemberId = undefined;
            this.neighbourId = undefined;
            this.affiliationId = undefined;
        }
    }

    /*=================  All server methods  ====================*/

    // This Method Is Used To Get Applicant List From Server Side
    handleGetApplicantList(callOthers) {
        this.showLoader = true;
        getApplicantList({ appId: this.applicationId }).then((result) => {
            console.log('handleGetApplicantList = ', result);
            if (result) {
                let tempList = [];
                this.customerData = JSON.parse(JSON.stringify(result));

                for (let keyValue of Object.keys(this.customerData)) {
                    let element = JSON.parse(JSON.stringify(this.customerData[keyValue]))
                    tempList.push({ label: element.Customer_Information__r.Name, value: element.Id });
                }

                this.customerList = JSON.parse(JSON.stringify(tempList));
                if (callOthers) {
                    this.getFamilyDetailTableRecords();
                }
            }
        }).catch((err) => {
            if (callOthers) {
                this.getFamilyDetailTableRecords();
            }
            console.log('handleGetApplicantList Error= ', err)
        });
    }

    // This Method Is Used To Get Records For Family Detail Tab From Server Side
    getFamilyDetailTableRecords() {
        getCharacterTabRecords({ appId: this.applicationId, metadataName: "FIV_C_Family_Details", sectionName: "Family Detail" }).then((result) => {
            console.log('getFamilyDetailTableRecords= ', result);
            this.familyTableData = JSON.parse(JSON.stringify(result));
            this.getNeighbourTableRecords();
        }).catch((err) => {
            this.familyTableData = undefined;
            console.log('getFamilyDetailTableRecords Error= ', err);
            this.getNeighbourTableRecords();
        });
    }

    // This Method Is Used To Get Records For Neighbour Detail Tab From Server Side
    getNeighbourTableRecords() {
        this.neighbourTableData = undefined;
        getCharacterTabRecords({ appId: this.applicationId, metadataName: "FIV_C_Neighbour", sectionName: "Neighbour Detail" }).then((result) => {
            console.log('getNeighbourTableRecords= ', result);
            this.neighbourTableData = JSON.parse(JSON.stringify(result));
            this.getAffiliationTableRecords();
        }).catch((err) => {
            this.neighbourTableData = undefined;
            console.log('getNeighbourTableRecords Error= ', err);
            this.getAffiliationTableRecords();
        });
    }

    // This Method Is Used To Get Records For Affiliation Tab From Server Side
    getAffiliationTableRecords() {
        this.affiliationTableData = undefined;
        getCharacterTabRecords({ appId: this.applicationId, metadataName: "FIV_C_Affiliation", sectionName: "Affiliation Detail" }).then((result) => {
            console.log('getAffiliationTableRecords= ', result);
            this.affiliationTableData = JSON.parse(JSON.stringify(result));
            this.getLivingStandardTableRecords();
        }).catch((err) => {
            this.affiliationTableData = undefined;
            console.log('getAffiliationTableRecords Error= ', err);
            this.getLivingStandardTableRecords();
        });
    }

    // This Method Is Used To Get Records For Living Standard Tab From Server Side
    getLivingStandardTableRecords() {
        this.livingStandardTableData = undefined;
        getCharacterTabRecords({ appId: this.applicationId, metadataName: "FIV_C_LivingStandard", sectionName: "Living Standard Detail" }).then((result) => {
            console.log('getLivingStandardTableRecords= ', result);
            this.livingStandardTableData = JSON.parse(JSON.stringify(result));
            this.checkCharacterValidation();
            this.showLoader = false;
        }).catch((err) => {
            this.livingStandardTableData = undefined;
            console.log('getLivingStandardTableRecords Error= ', err);
            this.showLoader = false;
            this.checkCharacterValidation();
        });
    }

    // This Method Is Used To Delete Record From Server Side
    handleDeleteRecord(recordIdToDelete) {
        this.showTemporaryLoader();
        deleteRecord({ recordId: recordIdToDelete }).then((result) => {
            console.log('handleDeleteRecord = ', result);
            if (result == 'success') {
                this.showNotifications('', 'Record deleted successfully', 'success');
                if (this.isFamilyTab) {
                    this.familyTableData = undefined;
                    this.familyMemberId = undefined;
                    this.getFamilyDetailTableRecords();
                } else if (this.isNeighbourDetail) {
                    this.neighbourId = undefined;
                    this.neighbourTableData = undefined;
                    this.getNeighbourTableRecords();
                } else if (this.isAffiliationDetail) {
                    this.affiliationTableData = undefined;
                    this.affiliationId = undefined;
                    this.getAffiliationTableRecords();
                } else if (this.isLivingDetail) {
                    this.livingStandardId = undefined;
                    this.livingStandardTableData = undefined;
                    this.getLivingStandardTableRecords();
                } else if (this.isRepaymentDetail) {
                    this.repaymentId = undefined;
                    this.repaymentTableData = undefined;
                    this.getRepaymentTableRecords();
                }
            }
        }).catch((err) => {
            console.log('Error in handleDeleteRecord = ', err);
        });
    }

    // This Method Is Used To Get Character RecordTypeId From Server Side
    handleGetCharacterRecordType() {
        getRecordTypeId({
            sObjectName: 'Character__c',
            recordTypeName: 'FIV-C Character'
        }).then((result) => {
            console.log('handleGetPersonRecordTypeId = ', result);
            this.characterRecordTypeFIVC = result
        }).catch((err) => {
            console.log('Error in handleGetPersonRecordTypeId = ', err);
        });
    }
}