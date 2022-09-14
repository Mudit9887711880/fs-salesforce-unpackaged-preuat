import { LightningElement, api, track, wire } from 'lwc';
import saveRecord from '@salesforce/apex/FSFivBLwcController.saveRecord';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getEditPageContent from '@salesforce/apex/FSFivBLwcController.getSectionContent';
import getROIRecord from '@salesforce/apex/FSFivBLwcController.getROIRecord';
import getAllCalculationRecords from '@salesforce/apex/FSFivBLwcController.getAllCalculationRecords';
import { getRecord } from 'lightning/uiRecordApi';
import USER_ID from '@salesforce/user/Id';
import NAME_FIELD from '@salesforce/schema/User.Name';

export default class fsFiv_B_Collateral extends LightningElement {
    @api recordId;
    @api applicationId;
    @api staffLoan;
    @api riskDocument;
    @api preLoginOwnerName;
    @api verificationStatus;
    @api tni;
    @api tpv;
    @api dbr;
    @track fieldsContent;
    @track isSpinnerActive = true;
    @track ROIRecord = [];
    @track tenor;
    @track roiRate;
    @track employeeId;
    @track LTV = 0;
    @track requestLoanAmonut; 
    @track bmRecommendedAmount;
    connectedCallback() {
        this.getSectionPageContent(this.recordId + '_' + this.applicationId);
        console.log('preLoginOwnerName ### ', this.preLoginOwnerName);
        this.verificationStatus == 'Completed' ? true : false;
    }
    renderedCallback() {
        this.getROIRecord();
    }
    @wire(getRecord, {
        recordId: USER_ID,
        fields: [NAME_FIELD]
    }) wireuser({ error, data }) {
        if (error) {
            this.error = error;
        } else if (data) {
            console.log('data ####',data)
            this.employeeId = data.fields.Name.value;
        }
    }
    getSectionPageContent(recId) {
        getEditPageContent({ recordIds: recId, metaDetaName: 'Fs_FIV_B_Summary' })
            .then(result => {
                console.log('result.data ### ', result.data);
                this.fieldsContent = result.data;
                var _tempVar = JSON.parse(this.fieldsContent);
                for (var i = 0; i < _tempVar[0].fieldsContent.length; i++) {
                    if (_tempVar[0].fieldsContent[i].fieldAPIName === 'Requested_Loan_Amount__c') {
                        this.requestLoanAmonut = _tempVar[0].fieldsContent[i].value;
                    }
                    if (_tempVar[0].fieldsContent[i].fieldAPIName === 'BM_Recommended_Amount__c') {
                        this.bmRecommendedAmount = _tempVar[0].fieldsContent[i].value;
                    }
                    if (_tempVar[0].fieldsContent[i].fieldAPIName === 'Name__c' && _tempVar[0].fieldsContent[i].value == '') {
                        _tempVar[0].fieldsContent[i].value = this.preLoginOwnerName;
                        this.fieldsContent = JSON.stringify(_tempVar);
                    }
                    if (_tempVar[0].fieldsContent[i].fieldAPIName === 'Sourcing_Officer__c' && _tempVar[0].fieldsContent[i].value == '') {
                        _tempVar[0].fieldsContent[i].value = this.employeeId;
                        this.fieldsContent = JSON.stringify(_tempVar);
                    }
                    if (_tempVar[0].fieldsContent[i].fieldAPIName === 'DBR__c') {
                        _tempVar[0].fieldsContent[i].value = this.dbr;
                        this.fieldsContent = JSON.stringify(_tempVar);
                    }
                }
                this.isSpinnerActive = false;
            })
            .catch(error => {
                console.log('1', error);
            });
    }

    async handleSave() {
        var data = this.template.querySelector("c-generic-edit-pages-l-w-c").handleOnSave();
        var today = new Date().toJSON().slice(0, 10);
        if (data.length > 0) {
            console.log('data @@@@ ', JSON.stringify(data));
            /*var requestLoanAmonut;
            var bmRecommendedAmount;*/
            for (var i = 0; i < data.length; i++) {
                if (data[i].sobjectType == 'Application__c' && data[i].Requested_Loan_Amount__c !== undefined) {
                    this.requestLoanAmonut = parseFloat(data[i].Requested_Loan_Amount__c);
                }
                if (data[i].sobjectType != 'Application__c' && data[i].BM_Recommended_Amount__c !== undefined) {
                    this.bmRecommendedAmount = parseFloat(data[i].BM_Recommended_Amount__c);
                }
            }
            console.log('requestLoanAmonut ### ', this.requestLoanAmonut);
            console.log('bmRecommendedAmount ### ', this.bmRecommendedAmount);
            console.log('this.DBR ::  ',this.dbr);
            console.log('this.LTV ::  ',this.LTV);
            if (this.requestLoanAmonut >= this.bmRecommendedAmount) {
                this.isSpinnerActive = true;
                for (var i = 0; i < data.length; i++) {
                    if (data[i].sobjectType != 'Application__c') {
                        data[i].Id = this.recordId;
                        data[i].DBR__c = this.dbr;
                        data[i].LTV__c = this.LTV === 'Infinity' ? null : this.LTV;
                        console.log('data ### 2 ', data);
                        if(JSON.stringify(data[i].Submission_Date__c)<=JSON.stringify(today) && data[i].Submission_Date__c>=data[i].Inspection_Date__c){
                            saveRecord({ dataToInsert: JSON.stringify(data[i]) })
                            .then(result => {
                                this.fieldsContent = '';
                                this.isSpinnerActive = false;
                                this.showtoastmessage('Success', 'Success', 'FIV-B Verification Record Successfully Updated');
                                this.getSectionPageContent(this.recordId + '_' + this.applicationId);
                            })
                            .catch(error => {
                                console.log(error);
                                this.showtoastmessage('Error', 'Error', JSON.stringify(error));
                            });
                        }
                        else{
                            if(JSON.stringify(data[i].Submission_Date__c)>JSON.stringify(today)){
                                this.showtoastmessage('Error', 'Error', 'Submission Date can not be greater than today date');
                                this.isSpinnerActive = false;
                            }
                            else{
                                this.showtoastmessage('Error', 'Error', 'Inspection Date can not be greater than Submission Date');
                                this.isSpinnerActive = false;
                            }
                        }
                    }
                }
            } else {
                this.showtoastmessage('Error', 'Error', 'Recommended amount can not be greater than Customer requested loan amount');
            }
        } else {
            this.showtoastmessage('Error', 'Error', 'Complete Required Field(s).');
        }
    }
    handleCancel() {
        console.log('handle cancel called ###');
        this.fieldsContent = undefined;
    }
    showtoastmessage(title, variant, message) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(evt);
    }
    getROIRecord() {
        console.log('staffLoan ### ', this.staffLoan);
        console.log('riskDocument ### ', this.riskDocument);
        getROIRecord({ applicationId: this.applicationId, isStaffLoan: this.staffLoan })
            .then(result => {
                this.ROIRecord = [];
                this.ROIRecord = result;
                console.log('roi ', result);
                this.ROIRecord.forEach(element => {
                    if (this.isStaffLoan && element.Tenure__c === '84') {
                        this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setValues('ROI__c', element.ROI__c)));
                        this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setValues('Tenor__c', element.Tenure__c)));
                    }
                })
            })
            .catch(error => {

            })
    }
    setValues(_fieldAPIName, _val) {
        var _tempVar = JSON.parse(this.fieldsContent);
        this.fieldsContent = undefined;
        for (var i = 0; i < _tempVar[0].fieldsContent.length; i++) {
            if (_tempVar[0].fieldsContent[i].fieldAPIName === _fieldAPIName) {
                if (_tempVar[0].fieldsContent[i].isCheckbox) {
                    _tempVar[0].fieldsContent[i].checkboxVal = Boolean(_val);
                } else {
                    _tempVar[0].fieldsContent[i].value = _val;
                }
            }
        }
        this.fieldsContent = JSON.stringify(_tempVar);
        return _tempVar;
    }
    changedFromChild(event) {
        console.log('event details #### ', JSON.stringify(event.detail));
        console.log('on summary page #### ', JSON.stringify(this.tni));
        var tempFieldsContent = event.detail;
        if (tempFieldsContent.CurrentFieldAPIName === 'Verification__c-Tenor__c' || tempFieldsContent.CurrentFieldAPIName === 'Verification__c-BM_Recommended_Amount__c' ) {
            console.log(JSON.stringify(this.ROIRecord))
            this.ROIRecord.forEach(element => {
                if (element.Tenure__c == tempFieldsContent.CurrentFieldValue || tempFieldsContent.CurrentFieldAPIName === 'Verification__c-BM_Recommended_Amount__c') {
                    this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setValues('ROI__c', element.ROI__c)));
                    /**
                    * DBR Calculation
                    */
                    //this.DBR = ((this.getEMICalculation(tempFieldsContent.previousData['Verification__c-BM_Recommended_Amount__c'], element.ROI__c, tempFieldsContent.previousData['Verification__c-Tenor__c']) * 100) / this.tni).toFixed(2);
                    //this.dbr = this.tni*this.tobligation/100;
                    console.log('---- DBR ---- ', this.dbr);
                    this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setValues('DBR__c', this.dbr)));

                    /**
                    * LTV Calculation
                    */
                    this.LTV = ((Number(tempFieldsContent.previousData['Verification__c-BM_Recommended_Amount__c']) / this.tpv)*100).toFixed(2)+'%';
                    console.log('---- LTV ---- ', this.LTV);
                    this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setValues('LTV__c', this.LTV)));
                        
                }
            })
        }
    }
    getEMICalculation(bra, ROI, tenor) {
        var emiValue = ((bra * ROI) * (Math.pow((1 + ROI), tenor) / ((Math.pow((1 + ROI), tenor) - 1))));
        console.log('emiValue ### ', emiValue);
        return Number(emiValue);
    }
}