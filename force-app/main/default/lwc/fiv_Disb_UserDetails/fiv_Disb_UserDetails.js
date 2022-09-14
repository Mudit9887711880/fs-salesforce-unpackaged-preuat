import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
//------------------------------------------------------------------------------
import getMetaDataFields from '@salesforce/apex/Fiv_Disb_LwcController.getMetaDataFields';
import saveDisbursalCompData from '@salesforce/apex/Fiv_Disb_LwcController.saveDisbursalCompData';
//------------------------------------------------------------------------------

export default class Fiv_Disb_UserDetails extends LightningElement {

    @api obj_parent_appt_wrapper_data;
    @track objUserDetails;
    showLoader = false;
    @track mapAutoPopulateFieldMapping = new Map();
    //--------------------------------------------------------------------------
    connectedCallback() {

        this.setFieldNameForAutoPopulate();
        this.getUserDetails();
    }
    //--------------------------------------------------------------------------
    getUserDetails() {
        this.objUserDetails = undefined;
        this.showLoader = true;
        //this.obj_parent_appt_wrapper_data.disbMetaPrefix will define the component will open for disbursal author or maker ex DISBM_Loan_Parameters
        getMetaDataFields({ recordIds: this.checkExistingDisbursalId(), metaDetaName: this.obj_parent_appt_wrapper_data.disbMetaPrefix + 'User_Details' }).then((result) => {
            console.log('Fiv_Disb_Lwc objUserDetails = ', result);
            this.objUserDetails = result.data;
            this.autoPopulateParameters();
            this.showLoader = false;
        }).catch((err) => {
            //incase if any Salesforce exception happened it will show notification
            console.log('Error in Fiv_Disb_Lwc getUserDetails = ', err);
            this.showNotification('ERROR', err.message, 'error');
            this.showLoader = false;
        });
    }

    setFieldNameForAutoPopulate() {

        //For autopopulate other then application record : checking if incase map is not coming empty 
        if (Object.keys(this.obj_parent_appt_wrapper_data.mapExtraParams).length) {

            //converting object to map for setting auto populate
            this.mapAutoPopulateFieldMapping = new Map(Object.entries(this.obj_parent_appt_wrapper_data.mapExtraParams));
        }

    }
    //--------------------------------------------------------------------------
    //First initial Auto-Populated fields
    autoPopulateParameters() {

        var _tempVar = JSON.parse(this.objUserDetails);
        console.log(this.mapAutoPopulateFieldMapping)

        for (var i = 0; i < _tempVar[0].fieldsContent.length; i++) {

            if (!_tempVar[0].fieldsContent[i].value
                && this.mapAutoPopulateFieldMapping.has(_tempVar[0].fieldsContent[i].fieldAPIName)) {

                console.log(this.mapAutoPopulateFieldMapping.get(_tempVar[0].fieldsContent[i].fieldAPIName))
                _tempVar[0].fieldsContent[i].value = this.mapAutoPopulateFieldMapping.get(_tempVar[0].fieldsContent[i].fieldAPIName);
            }
        }
        this.objUserDetails = JSON.stringify(_tempVar);
    }
    //-------------------------------------------------------------------------
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
        console.log('checkBeforeSubmit userDetails');
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
                detail: { isValid: false, msg: 'Please fill the required fields in user details', fieldName: 'userDetails' }
            });

        } else {
            console.log('checkBeforeSubmit 21 called');
            custEvt = new CustomEvent("checkbeforesubmit", {
                detail: { isValid: true, msg: '', fieldName: 'userDetails' }
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