import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
//------------------------------------------------------------------------------
import getMetaDataFields from '@salesforce/apex/Fiv_Disb_LwcController.getMetaDataFields';
import getDataTableRecords from '@salesforce/apex/Fiv_Disb_LwcController.getRelatedRecords';
import saveDisbursalCompData from '@salesforce/apex/Fiv_Disb_LwcController.saveDisbursalCompData';
import getParentAndRelatedData from '@salesforce/apex/Fiv_Disb_LwcController.getParentAndRelatedData';
import getIfscDetails from '@salesforce/apex/Fiv_Disb_LwcController.getIfscDetails';
//------------------------------------------------------------------------------

export default class Fiv_Disb_RepaymentDetails extends LightningElement {

    @api obj_parent_appt_wrapper_data;
    @track objExistRepayRecords;
    @track objRepaymentDetails;
    addNewRecordFromBankList = false;
    showLoader = false;
    currentEditRepayDetailId = null; //this will store current editing Repay Details Id
    existDisbursalId;
    maxNumOfRepaymentrecs = 2;
    @track mapRepayTypeWithId = new Map();
    @track rowAction = [{
        type: 'button-icon', fixedWidth: 50,
        typeAttributes: { iconName: 'utility:edit', title: 'Edit', variant: 'border-filled', alternativeText: 'Edit', name: 'edit' }
    }];
    isExistRepaymentDetails = false;
    @track slcdNachPerson = {};

    connectedCallback() {

        this.existDisbursalId = this.obj_parent_appt_wrapper_data.objAppt.hasOwnProperty('Disbursals__r') ? this.obj_parent_appt_wrapper_data.objAppt.Disbursals__r[0].Id : null;
        console.log(' this.existDisbursalId ', this.existDisbursalId);
    }


    handleAppntSlct(event) {

        console.log(JSON.stringify(event.detail));
        console.log(JSON.stringify(event.detail.label));

        this.objExistRepayRecords = undefined;

        if (!event.detail.hasOwnProperty('label') || !event.detail.label) {

            console.log(' handleAppntSlct value not found ');
        } else {

            this.slcdNachPerson.Name = event.detail.label;
            this.slcdNachPerson.Id = event.detail.value;
            this.getExistRepayRecords(this.slcdNachPerson.Name);
        }


    }
    handleChildSlcdBankDetail(event) {
        console.log(JSON.stringify(event.detail));
        console.log(' this.slcdNachPerson ', this.slcdNachPerson);
        console.log(' this.mapRepayTypeWithId.size ', this.mapRepayTypeWithId.size);
        if (this.mapRepayTypeWithId.size < this.maxNumOfRepaymentrecs) {

            try {

                var emptyRepayFieldName = '';
                //create repayment record
                var objRepayment = { "sobjectType": "Disbursal_Repayment_Detail__c" };
                objRepayment.Disbursal__c = this.existDisbursalId;
                objRepayment.NACH_Account_Number__c = event.detail.recordData.Account_Number__c;
                objRepayment.NACH_Bank_Account_Holder_Name__c = event.detail.recordData.Bank_Account_Holder_Name__c;
                objRepayment.NACH_Bank_Name__c = event.detail.recordData.Name;
                objRepayment.NACH_Branch_Name__c = event.detail.recordData.Branch_Name__c;
                objRepayment.NACH_IFSC_Code__c = event.detail.recordData['MS_IFSC_Code__r.Name'];

                var newMask = '';
                if (event.detail.recordData.Account_Number__c.length > 4) {

                    var accntNumSuff = event.detail.recordData.Account_Number__c.slice(-4);
                    var maskNumber = event.detail.recordData.Account_Number__c.slice(0, event.detail.recordData.Account_Number__c.length - 4);

                    for (var i = 0; i < maskNumber.length; i++) {
                        newMask += 'X';
                    }
                    newMask += accntNumSuff;
                } else {

                    var accntNumSuff = event.detail.recordData.Account_Number__c.slice(-2);
                    var maskNumber = event.detail.recordData.Account_Number__c.slice(0, event.detail.recordData.Account_Number__c.length - 2);

                    for (var i = 0; i < maskNumber.length; i++) {
                        newMask += 'X';
                    }
                    newMask += accntNumSuff;
                }
                console.log(newMask);
                if (newMask) {
                    objRepayment.NACH_Mask_Account_Number__c = newMask;
                } else {
                    objRepayment.NACH_Mask_Account_Number__c = event.detail.recordData.Account_Number_with_masking_digits__c;
                }

                objRepayment.NACH_Party_Name__c = this.slcdNachPerson.Name;

                if (!this.mapRepayTypeWithId.has('First')) {

                    objRepayment.NACH_Party_Type__c = 'First';

                } else if (!this.mapRepayTypeWithId.has('Second')) {

                    objRepayment.NACH_Party_Type__c = 'Second';
                }
                console.log(' objRepayment ', JSON.stringify(objRepayment));

                //if any field is empty or not check 
                for (var keyField in objRepayment) {

                    if (objRepayment[keyField] === null || objRepayment[keyField] === undefined || objRepayment[keyField] === '') {

                        if (emptyRepayFieldName == '') {
                            emptyRepayFieldName += ' ' + keyField.replace("__c", "").replaceAll("_", " ");
                        } else {
                            emptyRepayFieldName += ', ' + (keyField.replace("__c", "").replaceAll("_", " "));
                        }

                    }
                }
                console.log(' emptyRepayFieldName ', JSON.stringify(emptyRepayFieldName));
                if (!emptyRepayFieldName && emptyRepayFieldName == '') {
                    this.handleSave(objRepayment);
                } else {
                    this.showNotification('Error', 'Required field data is missing while creating repayment record - ' + emptyRepayFieldName, 'error'); //incase if any apex exception happened it will show 
                }
            } catch (error) {

                console.log('handleChildSlcdBankDetail error ', error.message);
                this.showNotification('Error', 'Something went wrong.', 'error'); //incase if any apex exception happened it will show 
            }
        } else {

            this.showNotification('', 'Only two NACH records allowed per applicant.', 'warning'); //incase if any apex exception happened it will show notification
        }

        //addNewRecordFromBankList
    }
    //this will get the exisitng repayment records of the selected applicant (Account Name)
    getExistRepayRecords(slcdApplicantName) {

        console.log('slcdApplicantName ' + slcdApplicantName);
        this.mapRepayTypeWithId = new Map();

        getParentAndRelatedData({
            recordId: this.existDisbursalId,
            childObjectName: 'Disbursal_Repayment_Details__r',
            parentObjectName: 'Disbursal__c',
            listChildConditions: ["NACH_Party_Name__c--" + slcdApplicantName]

        }).then((result) => {

            console.log('Fiv_Disb_Lwc getExistRecords  = ', JSON.stringify(result));

            if (result.statusCode !== 200) {

                this.showNotification('ERROR', result.message, 'error'); //incase if any apex exception happened it will show notification
                this.showLoader = false;
            } else {

                //if any existing record found
                if (result.objSobject.hasOwnProperty('Disbursal_Repayment_Details__r')) {

                    console.log(result.objSobject.Disbursal_Repayment_Details__r);
                    var arrRepayIds = [];
                    for (var key in result.objSobject.Disbursal_Repayment_Details__r) {

                        this.mapRepayTypeWithId.set(result.objSobject.Disbursal_Repayment_Details__r[key].NACH_Party_Type__c, result.objSobject.Disbursal_Repayment_Details__r[key].Id);
                        arrRepayIds.push(result.objSobject.Disbursal_Repayment_Details__r[key].Id);
                    }
                    console.log('this.mapRepayTypeWithId ', this.mapRepayTypeWithId);
                    console.log('arrRepayIds ', arrRepayIds);
                    this.showExistrepaymentRecords = true;
                    this.isExistRepaymentDetails = true;
                    //now will get the exisitng repayment records 
                    this.getDataTableRecords(arrRepayIds, 'objExistRepayRecords', 'Disbursal_Repayment_Details');
                } else {

                }
            }

        }).catch((err) => {

            //incase if any Salesforce exception happened it will show notification
            console.log('Error in Fiv_Disb_Lwc getExistRecords = ', err);
            this.showNotification('ERROR', err.message, 'error');
            this.showLoader = false;
        });
    }
    getDataTableRecords(arrTableRecIds, variableName, metadataTableName) {

        console.log(' this[variableName] ' + this[variableName]);
        this[variableName] = null;//this is done for the cache issue
        this.showLoader = true;
        //this.obj_parent_appt_wrapper_data.disbMetaPrefix will define the component will open for disbursal author or maker ex DISBM_Loan_Parameters
        getDataTableRecords({ setRecordIds: arrTableRecIds, metadataName: this.obj_parent_appt_wrapper_data.disbMetaPrefix + metadataTableName }).then((result) => {
            try {

                console.log('Fiv_Disb_Lwc getDataTableRecords result = ', result);
                this[variableName] = result;
                console.log(variableName + ' --> ' + JSON.stringify(this[variableName]));

                this.showLoader = false;
                console.log('end');
            } catch (err) {
                console.log('Error in Fiv_Disb_Lwc getDataTableRecords result= ', err.message);
                this.showNotification('ERROR', err.message, 'error');
                this.showLoader = false;
                console.log('end 2');
            }

        }).catch((err) => {
            //incase if any Salesforce exception happened it will show notification
            console.log('Error in Fiv_Disb_Lwc getDataTableRecords = ', err.message);
            this.showNotification('ERROR', err.message, 'error');
            this.showLoader = false;
        });
    }
    //--------------------------------------------------------------------------
    @api
    checkBeforeSubmit() {

        console.log('checkBeforeSubmit Repayment Details');
        var custEvt;
        //check if any exist record found
        if (this.isExistRepaymentDetails) {

            //check if any record is in edit phase and have any blank value in required fields
            if (this.template.querySelector("c-generic-edit-pages-l-w-c")) {

                var sfObjJSON = this.template.querySelector("c-generic-edit-pages-l-w-c").handleOnSave();
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
                        detail: { isValid: false, msg: 'Please fill the required fields in repayment details record', fieldName: 'repayDetails' }
                    });

                } else {

                    custEvt = new CustomEvent("checkbeforesubmit", {
                        detail: { isValid: true, msg: '', fieldName: 'repayDetails' }
                    });

                }
            } else {
                console.log('checkBeforeSubmit No exist record edit');
                custEvt = new CustomEvent("checkbeforesubmit", {
                    detail: { isValid: true, msg: '', fieldName: 'repayDetails' }
                });
            }
            //incase no disbursal record is created
        } else if (!this.existDisbursalId) {
            custEvt = new CustomEvent("checkbeforesubmit", {
                detail: { isValid: false, msg: 'Please create atleast one repayment details record', fieldName: 'repayDetails' }
            });
        }
        else {

            //incase if no applicant is selected then check if any record is creeated irrespective of applicant

            getParentAndRelatedData({
                recordId: this.existDisbursalId,
                childObjectName: 'Disbursal_Repayment_Details__r',
                parentObjectName: 'Disbursal__c',

            }).then((result) => {

                console.log('Fiv_Disb_Lwc handle submit getExistRecords  = ', JSON.stringify(result));

                if (result.statusCode !== 200) {


                    console.log('Error in Fiv_Disb_Lwc error = ', result.message);
                    custEvt = new CustomEvent("checkbeforesubmit", {
                        detail: { isValid: false, msg: 'Error in Repayement details -> ' + result.message, fieldName: 'repayDetails' }
                    });
                } else {

                    //if any existing record found
                    if (result.objSobject.hasOwnProperty('Disbursal_Repayment_Details__r')) {

                        console.log('checkBeforeSubmit exist record found + ' + JSON.stringify(result.objSobject.Disbursal_Repayment_Details__r));
                        custEvt = new CustomEvent("checkbeforesubmit", {
                            detail: { isValid: true, msg: '', fieldName: 'repayDetails' }
                        });

                    } else {

                        console.log('checkBeforeSubmit No exist record');
                        custEvt = new CustomEvent("checkbeforesubmit", {
                            detail: { isValid: false, msg: 'Please create atleast one repayment details record', fieldName: 'repayDetails' }
                        });
                    }
                }
                this.dispatchEvent(custEvt);

            }).catch((err) => {

                //incase if any Salesforce exception happened it will show notification
                console.log('Error in Fiv_Disb_Lwc getExistRecords = ', err);
                custEvt = new CustomEvent("checkbeforesubmit", {
                    detail: { isValid: false, msg: 'Error in Repayement details -> ' + err.message, fieldName: 'repayDetails' }
                });

            });

        }

        if (custEvt != undefined && custEvt != null) {
            this.dispatchEvent(custEvt);
        }

    }

    //--------------------------------------------------------------------------
    handleSave(sfObjJSON) {

        this.showLoader = true;
        //--------------------------------------------------------------

        saveDisbursalCompData({
            objDisbursal: sfObjJSON
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
                this.getExistRepayRecords(this.slcdNachPerson.Name);

            }
            this.showLoader = false;
            //this.showLoader = false; //this is removed as loader will be  false once data is load
        }).catch((err) => {

            //incase if any Salesforce exception happened it will show notification
            console.log('Error in Fiv_Disb_Lwc handleSave = ', err);
            this.showNotification('ERROR', err.message, 'error');
            this.showLoader = false;
        });

    }
    //--------------------------------------------------------------------------
    showNotification(title, msg, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title: title,
            message: msg,
            variant: variant
        }));
    }
}