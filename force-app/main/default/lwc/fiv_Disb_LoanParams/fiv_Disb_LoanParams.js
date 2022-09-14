import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
//------------------------------------------------------------------------------
import getMetaDataFields from '@salesforce/apex/Fiv_Disb_LwcController.getMetaDataFields';
import saveDisbursalCompData from '@salesforce/apex/Fiv_Disb_LwcController.saveDisbursalCompData';
//------------------------------------------------------------------------------

export default class Fiv_Disb_LoanParams extends LightningElement {
    @api obj_parent_appt_wrapper_data;
    @track objLoanParameters;
    showLoader = false;
    @track mapAutoPopulateFieldMapping = new Map();
    //--------------------------------------------------------------------------
    connectedCallback() {

        this.setFieldNameForAutoPopulate();
        this.getLoanParameters();
    }

    //--------------------------------------------------------------------------
    getLoanParameters() {

        this.objLoanParameters = undefined;
        this.showLoader = true;
        //this.obj_parent_appt_wrapper_data.disbMetaPrefix will define the component will open for disbursal author or maker ex DISBM_Loan_Parameters
        getMetaDataFields({ recordIds: this.checkExistingDisbursalId(), metaDetaName: this.obj_parent_appt_wrapper_data.disbMetaPrefix + 'Loan_Parameters' }).then((result) => {
            console.log('Fiv_Disb_Lwc objLoanParameters = ', result);
            this.objLoanParameters = result.data;
            this.showLoader = false;

            this.autoPopulateLoanParameters();
        }).catch((err) => {
            //incase if any Salesforce exception happened it will show notification
            console.log('Error in Fiv_Disb_Lwc getLoanParameters = ', err);
            this.showNotification('ERROR', err.message, 'error');
            this.showLoader = false;
        });
    }
    setFieldNameForAutoPopulate() {

        this.mapAutoPopulateFieldMapping.set('Interest_Rate_Type_Fixed_Floating__c', 'Fixed');

        if (this.obj_parent_appt_wrapper_data.objAppt.hasOwnProperty('LMS_Response_Reference__c')) {

            this.mapAutoPopulateFieldMapping.set('Loan_No__c', this.obj_parent_appt_wrapper_data.objAppt.LMS_Response_Reference__c);
        }
        if (this.obj_parent_appt_wrapper_data.objAppt.hasOwnProperty('Total_Amount_Recommended_PcAc__c')) {

            this.mapAutoPopulateFieldMapping.set('Loan_Amount_Sanctioned__c', this.obj_parent_appt_wrapper_data.objAppt.Total_Amount_Recommended_PcAc__c);
        }
        if (this.obj_parent_appt_wrapper_data.objAppt.hasOwnProperty('Customer_Communicated__c')) {

            this.mapAutoPopulateFieldMapping.set('ROI_including_advance_EMI__c', this.obj_parent_appt_wrapper_data.objAppt.Customer_Communicated__c);
            this.mapAutoPopulateFieldMapping.set('Fnl_annu_ROI_incl_adv_EMI__c', this.obj_parent_appt_wrapper_data.objAppt.Customer_Communicated__c);
            this.mapAutoPopulateFieldMapping.set('Policy_Rate__c', this.obj_parent_appt_wrapper_data.objAppt.Customer_Communicated__c);

        }
        if (this.obj_parent_appt_wrapper_data.objAppt.hasOwnProperty('Margin_ROI__c')) {

            this.mapAutoPopulateFieldMapping.set('Additional_Rate_of_Interest_if_app__c', this.obj_parent_appt_wrapper_data.objAppt.Margin_ROI__c);

            //Karan : 25/08/2022 : BA will confirm if any changes for mapping
            this.mapAutoPopulateFieldMapping.set('Spread__c', this.obj_parent_appt_wrapper_data.objAppt.Margin_ROI__c);
        }
        if (this.obj_parent_appt_wrapper_data.objAppt.hasOwnProperty('Tenor_In_Months__c')) {

            this.mapAutoPopulateFieldMapping.set('Repayment_Tenure__c', this.obj_parent_appt_wrapper_data.objAppt.Tenor_In_Months__c);
        }
        if (this.obj_parent_appt_wrapper_data.objAppt.hasOwnProperty('Tranche_Disbursal__c')) {

            this.mapAutoPopulateFieldMapping.set('Tranche_1_2_Normal__c', this.obj_parent_appt_wrapper_data.objAppt.Tranche_Disbursal__c);
        }
        if (this.obj_parent_appt_wrapper_data.objAppt.hasOwnProperty('AC_Submission_Date__c')) {

            this.mapAutoPopulateFieldMapping.set('Sanction_Date__c', this.obj_parent_appt_wrapper_data.objAppt.AC_Submission_Date__c);
        }
    }
    //First initial Auto-Populated fields
    autoPopulateLoanParameters() {

        var _tempVar = JSON.parse(this.objLoanParameters);
        console.log(this.mapAutoPopulateFieldMapping)

        for (var i = 0; i < _tempVar[0].fieldsContent.length; i++) {
            //if (_tempVar[0].fieldsContent[i].fieldAPIName === _fieldAPIName) {


            if (!_tempVar[0].fieldsContent[i].value
                && this.mapAutoPopulateFieldMapping.has(_tempVar[0].fieldsContent[i].fieldAPIName)) {
                console.log(this.mapAutoPopulateFieldMapping.get(_tempVar[0].fieldsContent[i].fieldAPIName))
                _tempVar[0].fieldsContent[i].value = this.mapAutoPopulateFieldMapping.get(_tempVar[0].fieldsContent[i].fieldAPIName);
            }
        }
        this.objLoanParameters = JSON.stringify(_tempVar);
    }
    handleFieldChanges(event) {
        console.log('handleFieldChanges= ', event.detail.CurrentFieldAPIName);
        //this.handleFormValueChange(event);
    }
    showNotification(title, msg, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title: title,
            message: msg,
            variant: variant
        }));
    }
    checkExistingDisbursalId() {

        if (this.obj_parent_appt_wrapper_data.objAppt.hasOwnProperty('Disbursals__r')) {
            console.log('this.obj_parent_appt_wrapper_data.Disbursals__r[0].Id ' + this.obj_parent_appt_wrapper_data.objAppt.Disbursals__r[0].Id);
            return this.obj_parent_appt_wrapper_data.objAppt.Disbursals__r[0].Id;
        }
        return null;
    }
    @api
    checkBeforeSubmit() {
        console.log('checkBeforeSubmit loan Param');
        var sfObjJSON = this.template.querySelector("c-generic-edit-pages-l-w-c").handleOnSave();
        var custEvt;

        console.log('checkBeforeSubmit called');
        console.log('checkBeforeSubmit sfObjJSON ', JSON.stringify(sfObjJSON));
        console.log(typeof sfObjJSON);
        console.log(typeof sfObjJSON === 'object');
        console.log(Object.keys(sfObjJSON).length == 0);
        //as it might come object as  [] or  object  which is not like this { 0 : {sobjectType: 'Disbursal__c','Field Name' : value}}
        if ((typeof sfObjJSON === 'object' && (Object.keys(sfObjJSON).length == 0 || (sfObjJSON.hasOwnProperty('0') && !sfObjJSON[0].hasOwnProperty('sobjectType')))
        )) {

            console.log('checkBeforeSubmit 2 called');
            custEvt = new CustomEvent("checkbeforesubmit", {
                detail: { isValid: false, msg: 'Please fill the required fields in Disbursal Parameters', fieldName: 'loanParam' }
            });

        } else {
            console.log('checkBeforeSubmit 21 called');
            custEvt = new CustomEvent("checkbeforesubmit", {
                detail: { isValid: true, msg: '', fieldName: 'loanParam' }
            });
        }
        this.dispatchEvent(custEvt);
    }
    handleSave() {
        this.showLoader = true;
        //var sfObjJSON = this.template.querySelector("c-generic-edit-pages-l-w-c").handleOnSave();
        var sfObjJSON = this.template.querySelector("c-generic-edit-pages-l-w-c").handleOnSaveWithoutOnChange();
        console.log(JSON.stringify(sfObjJSON));
        if (sfObjJSON.length > 0
            && sfObjJSON[0].hasOwnProperty('sobjectType')
            && sfObjJSON[0].sobjectType == 'Disbursal__c') {

            //since it is coming in array. SO we need only first iteration
            sfObjJSON[0].Application__c = this.obj_parent_appt_wrapper_data.objAppt.Id;
            sfObjJSON[0].Id = this.checkExistingDisbursalId(); //this is done to upsert existing disbursal record

            saveDisbursalCompData({
                objDisbursal: sfObjJSON[0]
            }).then((result) => {

                console.log('Fiv_Disb_Lwc Saved sfObjJSON = ', JSON.stringify(result));

                if (result.statusCode !== 200
                    && result.statusCode !== 201) {

                    this.showNotification('ERROR', result.message, 'error'); //incase if any apex exception happened it will show notification
                } else {
                    this.showNotification('SUCCESS', result.message, 'success');

                    var custEvt = new CustomEvent("reloadapplicationdata", {
                        detail: {}
                    });
                    this.dispatchEvent(custEvt);
                }
                this.showLoader = false;
                //this.showLoader = false; //this is removed as loader will be  false once data is load
            }).catch((err) => {

                //incase if any Salesforce exception happened it will show notification
                console.log('Error in Fiv_Disb_Lwc handleSave = ', err);
                this.showNotification('ERROR', err.message, 'error');
                this.showLoader = false;
            });
        } else if (sfObjJSON.length == 0) {//incase no object is return due to validation check
            this.showLoader = false;
        } else {
            this.showNotification('ERROR', 'Something wrong might happened.', 'error');
            this.showLoader = false;
        }
    }
}