import { LightningElement, api, wire, track } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import NAME from '@salesforce/schema/Application__c.Name';
import TOTAL_AMOUNT_RECOMMENDAD from '@salesforce/schema/Application__c.Total_amount_recommended__c';
import getLastLoginDate from '@salesforce/apex/DatabaseUtililty.getLastLoginDate';
import getExistingMODRegistraton from '@salesforce/apex/FS_MODRegistrationController.getExistingMODRegistraton';
// import getRequiredDocuments from '@salesforce/apex/fsGenericUploadDocumentsController.getRequiredDocuments';
import getLoanApplicantRecords from '@salesforce/apex/FS_MODRegistrationController.getLoanApplicantRecords';
import { updateRecord } from 'lightning/uiRecordApi';
import APPLICATION_ID from '@salesforce/schema/Application__c.Id';
import STAGE from '@salesforce/schema/Application__c.Stage__c';
import BusinessDate from '@salesforce/label/c.Business_Date';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
export default class ModRegisterationLWC extends NavigationMixin(LightningElement) {
    @api recordId;

    @track lastLoginDate;
    @track todaysDate = BusinessDate;
    @track applicationName;
    @track totalRecommendadAmount;

    @track customerMap;
    @track customerList1;
    @track customerList2;

    @track erpDate;
    @track oneYearBackDate;
    @track oneMonthLaterDate;

    @track tabName = 'DocUpload';
    @track errorMsgs;
    @track showSpinner = false;
    @track showErrorTab = false;
    @track secondRequired = true;

    @track modId;
    @track trial = 1;

    @track modObj = {
        MOD_Done__c: undefined,
        MOD_Commitment_Date__c: undefined,
        MOD_Date__c: undefined,
        MOD_Amount__c: undefined,
        Sourcing_Officer__c: undefined,
        Sourcing_BM__c: undefined,
        Customer_for_Collection_A__c: undefined,
        Mobile_Number_of_A__c: undefined,
        Customer_for_Collection_B__c: undefined,
        Mobile_Number_of_B__c: undefined
    };


    @track validationObj = {
        dataEntry: false,
        fileUpload: true
    };

    get isMODDone() {
        return this.modObj.MOD_Done__c == 'Yes' ? true : false;
    }


    @wire(getRecord, { recordId: '$recordId', fields: [NAME, TOTAL_AMOUNT_RECOMMENDAD] })
    applicationDetails({ error, data }) {
        console.log('applicationDetails= ', data);
        if (data) {
            this.applicationName = data.fields.Name.value;
            this.totalRecommendadAmount = data.fields.Total_amount_recommended__c.value;
        } else if (error) {
            console.log('error in getting applicationDetails = ', error);
        }
    }

    // This Method Is Used To Get All Data At Initial Level(Loading)
    connectedCallback() {
        let businessDateStr = this.todaysDate.substr(6, 4) + '-' + this.todaysDate.substr(3, 2) + '-' + this.todaysDate.substr(0, 2)
        console.log('businessDateStr=', businessDateStr)
        this.erpDate = new Date(businessDateStr).toISOString().substr(0, 10);
        const d = new Date(businessDateStr);
        d.setFullYear(d.getFullYear() - 1);
        this.oneYearBackDate = d.toISOString().substr(0, 10);

        const d2 = new Date(businessDateStr);
        d2.setMonth(d2.getMonth() + 1);
        this.oneMonthLaterDate = d2.toISOString().substr(0, 10);

        console.log('erpDate= ', this.erpDate, 'oneYearBackDate= ', this.oneYearBackDate, 'oneMonthLaterDate= ', this.oneMonthLaterDate);

        this.handleGetExistingRecord();
       // this.handleGetRequiredDocuments();
        this.handleGetLastLoginDate();
        this.handleGetApplicantRecords();
    }

    // This Method Is Used To Handle Tab Activation Event
    handleActive(event) {
        this.tabName = event.target.value;
    }

    handleFormValues(event) {
        if (event.target.fieldName == 'MOD_Done__c') {
            this.modObj.MOD_Done__c = event.target.value;
        } else if (event.target.name == 'MOD_Amount__c') {
            if (event.target.value) {
                this.modObj.MOD_Amount__c = parseInt(event.target.value);
            } else {
                this.modObj.MOD_Amount__c = event.target.value;
            }
        } else if (event.target.name == 'Customer_for_Collection_A__c') {
            this.modObj.Customer_for_Collection_A__c = event.target.value;
            let customerObj = JSON.parse(JSON.stringify(this.customerMap[event.target.value]))
            console.log('customerObj= ', customerObj);
            this.modObj.Mobile_Number_of_A__c = customerObj.Mobile__c;
            this.makeSecondList();
        } else if (event.target.name == 'Mobile_Number_of_A__c') {
            this.modObj.Mobile_Number_of_A__c = event.target.value;
        } else if (event.target.name == 'Customer_for_Collection_B__c') {
            this.modObj.Customer_for_Collection_B__c = event.target.value;
            let customerObj = JSON.parse(JSON.stringify(this.customerMap[event.target.value]))
            console.log('customerObj= ', customerObj);
            this.modObj.Mobile_Number_of_B__c = customerObj.Mobile__c;
        } else if (event.target.name == 'Mobile_Number_of_B__c') {
            this.modObj.Mobile_Number_of_B__c = event.target.value;
        } else if (event.target.name == 'MOD_Date__c') {
            this.modObj.MOD_Date__c = event.target.value;
        } else if (event.target.name == 'MOD_Commitment_Date__c') {
            this.modObj.MOD_Commitment_Date__c = event.target.value;
        }
    }

    handleBlur() {
        console.log('handleBlur called', this.totalRecommendadAmount, this.modObj.MOD_Amount__c);
        if (this.totalRecommendadAmount && this.modObj.MOD_Amount__c && this.totalRecommendadAmount > this.modObj.MOD_Amount__c && this.trial < 2) {
            this.modObj.MOD_Amount__c = undefined;
            this.trial = 2
            this.showNotifications('', 'MOD amount is less than the sanctioned amount. Please check the same', 'error');
        }
    }

    makeSecondList() {
        let tempList = [];
        if (this.customerList1) {
            this.customerList1.forEach(element => {
                if (element.value != this.modObj.Customer_for_Collection_A__c) {
                    tempList.push({ label: element.label, value: element.value });
                }
            });

            this.customerList2 = JSON.parse(JSON.stringify(tempList));
            if(!(this.customerList2 && this.customerList2.length)){
                this.secondRequired = false; 
            }
        }
    }

    handleCheckValidity() {
        const allValid1 = [
            ...this.template.querySelectorAll('lightning-input'),
        ].reduce((validSoFar, inputCmp) => {
            inputCmp.reportValidity();
            return validSoFar && inputCmp.checkValidity();
        }, true);
        const allValid2 = [
            ...this.template.querySelectorAll('lightning-combobox'),
        ].reduce((validSoFar, inputCmp) => {
            inputCmp.reportValidity();
            return validSoFar && inputCmp.checkValidity();
        }, true);
        return (allValid1 && allValid2);
    }

    // This Method Is Used To Handle MOD Submit
    handleMODSubmit() {
        this.errorMsgs = [];
        if (!this.validationObj.dataEntry) {
            this.errorMsgs.push('Complete all entries in Data Entry section.');
        }
        if (!this.validationObj.fileUpload) {
            this.errorMsgs.push('Upload all the required files.');
        }


        if (this.errorMsgs && this.errorMsgs.length) {
            this.showErrorTab = true;
            let ref = this;
            setTimeout(() => {
                ref.tabName = 'Error';
            }, 300);
        } else {
            this.showErrorTab = false;
            // this.showNotifications('','MOD Registration is completed successfully!','success');
            // this[NavigationMixin.Navigate]({
            //     type: 'standard__recordPage',
            //     attributes: {
            //         recordId: this.recordId,
            //         objectApiName: 'Application__c',
            //         actionName: 'view'
            //     }
            // });

            const fields = {};
            fields[APPLICATION_ID.fieldApiName] = this.recordId;
            fields[STAGE.fieldApiName] = 'Agreement Execution';
            const recordInput = { fields };
            updateRecord(recordInput).then(() => {
                console.log('Stage Updated= ');
                this.showNotifications('','MOD Registration is completed successfully!','success');
                this[NavigationMixin.Navigate]({
                    type: 'standard__recordPage',
                    attributes: {
                        recordId: this.recordId,
                        objectApiName: 'Application__c',
                        actionName: 'view'
                    }
                });
            }).catch(error => {
                console.log('Error in Stage Updation= ', error);
            });
        }
    }

    // This Method Is Used To Reset All Fields
    onCancel() {
        const inputFields = this.template.querySelectorAll('lightning-input-field');
        if (inputFields) {
            inputFields.forEach(field => {
                field.reset();
            });
        }
    }

    handleSubmit(event) {
        console.log('Record Submitted Successfully')
        let allValid = this.handleCheckValidity();
        console.log('allValid= ', allValid);
        if (!allValid) {
            event.preventDefault();
            return;
        }
    }

    handleSuccess() {
        console.log('Record Saved Successfully')
        this.validationObj.dataEntry = true;
        this.showNotifications('', 'Record Saved Successfully.', 'success');
    }

    handleError(evt) {
        console.log('handleError= ', evt);
        console.log('handleError= ', evt.detail);
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

    // This Method Is Used To Get User's Last Login Date From Server Side.
    handleGetLastLoginDate() {
        getLastLoginDate().then((result) => {
            console.log('getLastLoginDate= ', result);
            this.lastLoginDate = result
        }).catch((err) => {
            console.log('Error in getLastLoginDate= ', err);
        });
    }

    // This Method Is Used To Get Existing Registration Record.
    handleGetExistingRecord() {
        this.showSpinner = true;
        getExistingMODRegistraton({ appId: this.recordId }).then((result) => {
            this.showSpinner = false;
            console.log('handleGetExistingRecord= ', result);
            this.validationObj.dataEntry = false;
            if (result) {
                this.modId = result.Id;
                this.modObj = JSON.parse(JSON.stringify(result));
                this.makeSecondList();
                this.validationObj.dataEntry = true;
            }
        }).catch((err) => {
            this.showSpinner = false;
            console.log('Error in handleGetExistingRecord= ', err);
        });
    }

    // handleGetRequiredDocuments() {
    //     this.validationObj.fileUpload = true;
    //     getRequiredDocuments({ stageName: 'MOD Registration', parentId: this.recordId }).then((result) => {
    //         console.log('GetRequiredDocuments= ', result);
    //         if (!result.length) {
    //             this.validationObj.fileUpload = true;
    //         }
    //     }).catch((err) => {
    //         console.log('Error in getRequiredDocuments= ', err);
    //     });
    // }

    handleGetApplicantRecords() {
        getLoanApplicantRecords({ appId: this.recordId }).then((result) => {
            this.customerMap = JSON.parse(JSON.stringify(result))
            let tempList = [];

            for (let keyValue of Object.keys(result)) {
                tempList.push({ label: keyValue, value: keyValue });
            }
            this.customerList1 = JSON.parse(JSON.stringify(tempList))
            this.makeSecondList();
        }).catch((err) => {
            console.log('getApplicantRecords= ', err);
        });
    }
}