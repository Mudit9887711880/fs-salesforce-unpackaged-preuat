import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import saveRecord from '@salesforce/apex/FsLeadDetailsController.saveRecord';
import getSectionContent from '@salesforce/apex/FsLeadDetailsController.getSectionContent';
import getLoanDetailsData from '@salesforce/apex/FsLeadDetailsControllerHelper.getLoanDetailsData';
import { deleteRecord } from 'lightning/uiRecordApi';
import getAllApplicantMeta from '@salesforce/apex/FsLeadDetailsControllerHelper.getAllApplicantMeta';
export default class FsLeadDetailsLoanType extends LightningElement {
    @api recordId;
    @track fieldsContent;
    @track isSpinnerActive = false;
    connectedCallback() {
        this.getSectionPageContent();
    }

    getSectionPageContent(recId) {
        try {
            this.isSpinnerActive = true;
            getSectionContent({ recordIds: this.recordId, metaDetaName: 'Lead_Details_Loan_Type' })
                .then(result => {
                    this.fieldsContent = result.data;
                    this.isSpinnerActive = false;
                    console.log('this.fieldsContent #### ', this.fieldsContent);

                    this.fieldsContent = result.data;
                    this.isSpinnerActive = false;
                    var _tempVar = JSON.parse(this.fieldsContent);
                    for (var i = 0; i < _tempVar[0].fieldsContent.length; i++) {
                        if (_tempVar[0].fieldsContent[i].fieldAPIName === 'Take_Over__c') {
                            var val = _tempVar[0].fieldsContent[i].value === 'Yes' ? true : false;
                            console.log('value #### ',val);
                            setTimeout(() => {
                                this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setValues('Take_Over_Amount__c', val)));
                            }, 200);
                        }
                    }
                })
                .catch(error => {
                    console.log(error);
                });
        } catch (error) {
            console.log(error);
        }
    }

    @api
    getLoanTypeData() {
        var isRequiredFieldCompleted = true;
        getSectionContent({ recordIds: this.recordId, metaDetaName: 'Lead_Details_Loan_Type' })
            .then(result => {
                var _tempVar = JSON.parse(result.data);
                for (var i = 0; i < _tempVar[0].fieldsContent.length; i++) {
                    console.log('_tempVar[0].fieldsContent[i].value ', _tempVar[0].fieldsContent[i].value);
                    if (_tempVar[0].fieldsContent[i].fieldAPIName === 'Tenure_Requested__c' && _tempVar[0].fieldsContent[i].value === '') {
                        const checkValidLoan = new CustomEvent("checkloantypeinfo", {
                            detail: false
                        });
                        this.dispatchEvent(checkValidLoan);
                        break;
                    } else if(_tempVar[0].fieldsContent[i].fieldAPIName === 'Tenure_Requested__c' && _tempVar[0].fieldsContent[i].value !== ''){
                        const checkValidLoan = new CustomEvent("checkloantypeinfo", {
                            detail: true
                        });
                        this.dispatchEvent(checkValidLoan);
                        break;
                    }
                }
            })
            .catch(error => {
                console.log(error);
            });
            return isRequiredFieldCompleted;
        //this.getSectionPageContent();
    }

    changedFromChild(event) {
        console.log('changedFromChild ### ', JSON.stringify(event.detail));
        var tempFieldsContent = event.detail;
        if (tempFieldsContent.CurrentFieldAPIName === 'Application__c-Take_Over__c') {
            var isTakeOver = tempFieldsContent.CurrentFieldValue == 'Yes' ? true : false;
            setTimeout(() => {
                this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setValues('Take_Over_Amount__c', isTakeOver)));
            }, 200);
            // setTimeout(() => {
            //     this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setValues('Take_Over__c', tempFieldsContent.CurrentFieldValue)));
            // }, 210);
        } else {
            let apiName = tempFieldsContent.CurrentFieldAPIName.split('-')[1];
            setTimeout(() => {
                this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setValues(apiName, tempFieldsContent.CurrentFieldValue )));
            }, 200);
        }
    }
    handleSave() {
        try {
            var data = this.template.querySelector("c-generic-edit-pages-l-w-c").handleOnSave();
            if (data.length > 0) {
                this.isSpinnerActive = true;
                for (var i = 0; i < data.length; i++) {
                    data[i].Id = this.recordId;
                    console.log('data 2## ', JSON.stringify(data));
                    saveRecord({ dataToInsert: JSON.stringify(data[i]) })
                        .then(result => {
                            this.showToastMessage('Success', 'Success', 'Record Updation Successfully.');
                            this.isSpinnerActive = false;
                        })
                        .catch(error => {
                            console.log(error);
                            this.showToastMessage('Error', 'Error', JSON.stringify(error));
                        });
                }
            } else {
                this.showToastMessage('Error', 'Error', 'Complete Required Field(s).');
            }
        } catch (error) {
            console.log(error);
        }
    }
    showToastMessage(title, variant, message) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(evt);
    }
    setValues(_fieldAPIName, _val) {
        var _tempVar = JSON.parse(this.fieldsContent);
        console.log(_tempVar);
        for (var i = 0; i < _tempVar[0].fieldsContent.length; i++) {
            if (_tempVar[0].fieldsContent[i].fieldAPIName === 'Take_Over_Amount__c' && _val === true) {
                _tempVar[0].fieldsContent[i].disabled = false;
                console.log('inside if');
            }
            else if (_tempVar[0].fieldsContent[i].fieldAPIName === 'Take_Over_Amount__c' && _val === false) {
                _tempVar[0].fieldsContent[i].value = undefined;
                console.log('inside if else');
                _tempVar[0].fieldsContent[i].disabled = true;
            } 
            else if(_tempVar[0].fieldsContent[i].fieldAPIName === _fieldAPIName){
                console.log('inside else= ',_tempVar[0].fieldsContent[i].fieldAPIName,' = ' ,_val);
                _tempVar[0].fieldsContent[i].value = _val;
            }
        }
        _tempVar = JSON.parse(JSON.stringify(_tempVar));
        console.log(_tempVar);
        this.fieldsContent = JSON.stringify(_tempVar);
        return _tempVar;
    }
}