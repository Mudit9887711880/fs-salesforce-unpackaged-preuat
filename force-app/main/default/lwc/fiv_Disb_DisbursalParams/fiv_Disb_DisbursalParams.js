import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
//------------------------------------------------------------------------------
import getMetaDataFields from '@salesforce/apex/Fiv_Disb_LwcController.getMetaDataFields';
import saveDisbursalCompData from '@salesforce/apex/Fiv_Disb_LwcController.saveDisbursalCompData';
//------------------------------------------------------------------------------

export default class Fiv_Disb_DisbursalParams extends LightningElement {

    @api obj_parent_appt_wrapper_data;
    @track objDisbursalParamaters;
    showLoader = false;
    @track mapAutoPopulateFieldMapping = new Map();
    sanctionLoanAmt = 0;
    totalDeduction = 0;
    finalDisbAmount = 0;
    //--------------------------------------------------------------------------
    connectedCallback() {

        this.setFieldNameForAutoPopulate();
        this.getDisbursalParamaters();
    }
    //--------------------------------------------------------------------------
    setFieldNameForAutoPopulate() {

        //For autopopulate other then application record : checking if incase map is not coming empty 
        if (Object.keys(this.obj_parent_appt_wrapper_data.mapExtraParams).length) {

            //converting object to map for setting auto populate
            this.mapAutoPopulateFieldMapping = new Map(Object.entries(this.obj_parent_appt_wrapper_data.mapExtraParams));
        }
        //----------------------------------------------------------------------
        //var finalDisbAmnt = 0; //sanction loan amount - total  deduction
        //For autopopulate other then application record
        if (this.obj_parent_appt_wrapper_data.objAppt.hasOwnProperty('Emi_PcAc__c')
            && this.obj_parent_appt_wrapper_data.objAppt.Emi_PcAc__c) {

            this.mapAutoPopulateFieldMapping.set('Monthly_Installment_EMI_Rs__c', this.obj_parent_appt_wrapper_data.objAppt.Emi_PcAc__c);
        } else {
            this.mapAutoPopulateFieldMapping.set('Monthly_Installment_EMI_Rs__c', 0);
        }

        if (this.obj_parent_appt_wrapper_data.objAppt.hasOwnProperty('Total_Amount_Recommended_PcAc__c')
            && this.obj_parent_appt_wrapper_data.objAppt.Total_Amount_Recommended_PcAc__c) {

            this.mapAutoPopulateFieldMapping.set('Sanctioned_Loan_Amount__c', this.obj_parent_appt_wrapper_data.objAppt.Total_Amount_Recommended_PcAc__c);
            //finalDisbAmnt = this.obj_parent_appt_wrapper_data.objAppt.Total_Amount_Recommended_PcAc__c;

        } else {
            this.mapAutoPopulateFieldMapping.set('Sanctioned_Loan_Amount__c', 0);
        }

        /*
        if (this.obj_parent_appt_wrapper_data.objAppt.hasOwnProperty('Total_Deductions__c')
            && this.obj_parent_appt_wrapper_data.objAppt.Total_Deductions__c) {


            this.mapAutoPopulateFieldMapping.set('Total_Deductions__c', this.obj_parent_appt_wrapper_data.objAppt.Total_Deductions__c);
            finalDisbAmnt = finalDisbAmnt - this.obj_parent_appt_wrapper_data.objAppt.Total_Deductions__c;
            console.log('finalDisbAmnt 2 ' + finalDisbAmnt);
        } else {
            this.mapAutoPopulateFieldMapping.set('Total_Deductions__c', 0);
        }*/

        //console.log(finalDisbAmnt);
        //this.mapAutoPopulateFieldMapping.set('Final_Disbursal_Amount__c', finalDisbAmnt);

        console.log(this.mapAutoPopulateFieldMapping);
    }

    //--------------------------------------------------------------------------
    getDisbursalParamaters() {
        this.objDisbursalParamaters = undefined;
        this.showLoader = true;
        //this.obj_parent_appt_wrapper_data.disbMetaPrefix will define the component will open for disbursal author or maker ex DISBM_Loan_Parameters
        getMetaDataFields({ recordIds: this.checkExistingDisbursalId(), metaDetaName: this.obj_parent_appt_wrapper_data.disbMetaPrefix + 'Disbursal_Parameters' }).then((result) => {

            console.log('Fiv_Disb_Lwc objDisbursalParamaters = ', result);
            this.objDisbursalParamaters = result.data;
            this.autoPopulateDisbParameters();
            this.showLoader = false;
        }).catch((err) => {
            //incase if any Salesforce exception happened it will show notification
            console.log('Error in Fiv_Disb_Lwc getDisbursalParamaters = ', err);
            this.showNotification('ERROR', err.message, 'error');
            this.showLoader = false;
        });
    }

    //--------------------------------------------------------------------------
    //First initial Auto-Populated fields
    autoPopulateDisbParameters() {

        var _tempVar = JSON.parse(this.objDisbursalParamaters);
        console.log(this.mapAutoPopulateFieldMapping)

        for (var i = 0; i < _tempVar[0].fieldsContent.length; i++) {

            if (!_tempVar[0].fieldsContent[i].value
                && this.mapAutoPopulateFieldMapping.has(_tempVar[0].fieldsContent[i].fieldAPIName)) {

                console.log(this.mapAutoPopulateFieldMapping.get(_tempVar[0].fieldsContent[i].fieldAPIName))
                _tempVar[0].fieldsContent[i].value = this.mapAutoPopulateFieldMapping.get(_tempVar[0].fieldsContent[i].fieldAPIName);

            }
            if (_tempVar[0].fieldsContent[i].fieldAPIName == 'Sanctioned_Loan_Amount__c') {
                this.sanctionLoanAmt = _tempVar[0].fieldsContent[i].value;
            }
            if (_tempVar[0].fieldsContent[i].fieldAPIName == 'Total_Deductions__c') {
                this.totalDeduction = _tempVar[0].fieldsContent[i].value;
            }
            if ((!_tempVar[0].fieldsContent[i].value || _tempVar[0].fieldsContent[i].value == 0)
                && _tempVar[0].fieldsContent[i].fieldAPIName == 'Final_Disbursal_Amount__c') {

                _tempVar[0].fieldsContent[i].value = this.sanctionLoanAmt - this.totalDeduction;
            }

        }
        console.log('this.sanctionLoanAmt Init' + this.sanctionLoanAmt);
        console.log('this.totalDeduction Init' + this.totalDeduction);
        this.objDisbursalParamaters = JSON.stringify(_tempVar);
    }
    //--------------------------------------------------------------------------
    handleFieldChanges(event) {
        try {


            console.log('handleFieldChanges= ', JSON.stringify(event.detail));
            console.log('handleFieldChanges= ', JSON.stringify(event.detail.CurrentFieldValue));
            var _tempVar = JSON.parse(this.objDisbursalParamaters);

            if (event.detail.CurrentFieldAPIName == 'Disbursal__c-Sanctioned_Loan_Amount__c') {
                this.sanctionLoanAmt = event.detail.CurrentFieldValue ? parseFloat(event.detail.CurrentFieldValue) : 0;
            }
            if (event.detail.CurrentFieldAPIName == 'Disbursal__c-Total_Deductions__c') {
                this.totalDeduction = event.detail.CurrentFieldValue ? parseFloat(event.detail.CurrentFieldValue) : 0;
            }

            this.calculateFinalDisbAmt(event.detail.CurrentFieldAPIName, event.detail.CurrentFieldValue);
        } catch (error) {
            console.log(error.message);
        }
        //console.log( _tempVar. )
        //this.handleFormValueChange(event);
    }
    calculateFinalDisbAmt(fieldName, value) {
        console.log('this.sanctionLoanAmt ' + this.sanctionLoanAmt);
        console.log('this.totalDeduction ' + this.totalDeduction);
        this.finalDisbAmount = this.sanctionLoanAmt - this.totalDeduction;
        this.finalDisbAmount = this.finalDisbAmount ? this.finalDisbAmount : 0;
        console.log('finalDisbAmount ' + this.finalDisbAmount);
        var _tempVar = JSON.parse(this.objDisbursalParamaters);

        for (var i = 0; i < _tempVar[0].fieldsContent.length; i++) {

            if (_tempVar[0].fieldsContent[i].fieldAPIName == 'Final_Disbursal_Amount__c') {

                _tempVar[0].fieldsContent[i].value = this.finalDisbAmount;
            }
            else if (_tempVar[0].fieldsContent[i].fieldAPIName == fieldName) {

                _tempVar[0].fieldsContent[i].value = value;
            }
        }

        this.objDisbursalParamaters = JSON.stringify(_tempVar);
        this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(this.objDisbursalParamaters);
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

        console.log('checkBeforeSubmit Disbursal Param');
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
                detail: { isValid: false, msg: 'Please fill the required fields in Disbursal Parameters', fieldName: 'disbParam' }
            });

        } else {
            custEvt = new CustomEvent("checkbeforesubmit", {
                detail: { isValid: true, msg: '', fieldName: 'disbParam' }
            });
        }

        this.dispatchEvent(custEvt);
    }

    handleSave() {
        this.showLoader = true;

        var sfObjJSON = this.template.querySelector("c-generic-edit-pages-l-w-c").handleOnSaveWithoutOnChange();
        console.log(JSON.stringify(sfObjJSON));
        if (sfObjJSON.length > 0
            && sfObjJSON[0].hasOwnProperty('sobjectType')
            && sfObjJSON[0].sobjectType == 'Disbursal__c') {

            //since it is coming in array. SO we need only first iteration
            sfObjJSON[0].Application__c = this.obj_parent_appt_wrapper_data.objAppt.Id;
            sfObjJSON[0].Id = this.checkExistingDisbursalId(); //this is done to upsert existing disbursal record

            //doing this again for recalculation
            sfObjJSON[0].Final_Disbursal_Amount__c = parseFloat(sfObjJSON[0].Sanctioned_Loan_Amount__c) - parseFloat(sfObjJSON[0].Total_Deductions__c);
            sfObjJSON[0].Final_Disbursal_Amount__c = '' + sfObjJSON[0].Final_Disbursal_Amount__c;

            console.log('@@@ ' + JSON.stringify(sfObjJSON));

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