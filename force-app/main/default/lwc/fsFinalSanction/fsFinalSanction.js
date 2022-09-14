import { LightningElement, api, wire, track } from 'lwc';
import { getRecord,getFieldValue,updateRecord,createRecord } from 'lightning/uiRecordApi';
import getPropertyRecords from '@salesforce/apex/FinalSanctionController.getValidationTableData';
import APPLICATION_OBJECT from "@salesforce/schema/Application__c";
import ID_FIELD from "@salesforce/schema/Application__c.Id";
import NAME_FIELD from '@salesforce/schema/Application__c.Name';
import STAGE_FIELD from "@salesforce/schema/Application__c.Stage__c";
import SUB_STAGE_FIELD from "@salesforce/schema/Application__c.Sub_Stage__c";
import checkSendBackVaidation from '@salesforce/apex/FinalSanctionController.checkSendBackVaidation';
import sendBackLegalApproval from '@salesforce/apex/FinalSanctionController.sendBackLegalApproval';
import sendBackAprovalCredit from '@salesforce/apex/FinalSanctionController.sendBackAprovalCredit';
import moveStage from '@salesforce/apex/FinalSanctionController.moveStage';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import Verification from '@salesforce/schema/Verification__c';


export default class FsFinalSanction extends NavigationMixin(LightningElement) {
    @api recordId;
    @track _activeTab = 'Final_Sanction';
    @track _dataToDisplay = [];
    @track _btns = [
        {
            name: 'SendBack',
            label: 'Send Back',
            variant: 'brand',
            class: 'slds-m-left_x-small'
        }
    ];
    @track _isSendBack = false;
    @track _showErrorTab = false;
    @track _errorMessages = [];
    @track _acRecordTypeId;
    @track _allPreviousStageDone = false;

    @wire(getRecord, { recordId: '$recordId', fields: [NAME_FIELD]})
    application;

    get name() {
        return getFieldValue(this.application.data, NAME_FIELD);
    }

    @wire(getObjectInfo, { objectApiName: Verification })
    getPropertydata({data,error}){
        if(data){            
            for(var key in data.recordTypeInfos){                
                if(data.recordTypeInfos[key].name === 'AC'){
                    this._acRecordTypeId = data.recordTypeInfos[key].recordTypeId;
                }
            }
        }
    }

    connectedCallback() {
        getPropertyRecords({ applicationId: this.recordId })
        .then(result => {            
            this._dataToDisplay = result;
            this.checkSendBack();
        })
        .catch(error => {
            this.showToast('Error', 'error', error.body.message);
        });
    }
    
    rowselectionevent(event) {
        var detail = event.detail;        
        if (detail === 'SendBack') {
            this._isSendBack = true;
        }
    }    

    handleSendbackClose(event){        
        this._isSendBack = event.detail ? false : true;
    }    

    handleSendbackSubmit(event){
        let value = event.detail;
        console.log('value' + value);
        if (value != null) {
            if (value == "Approval Credit") {
                sendBackAprovalCredit({ applicationId: this.recordId })
                    .then(result => {
                        console.log('result' + result);
                        this.updateApplication(value);
                    })
                    .catch(error => {
                console.log('Error', error)
            })
            }
            if (value == 'Legal Approval') {
                sendBackLegalApproval({ applicationId: this.recordId })
                    .then(result => {
                        this.updateApplication(value);
                    })
                    .catch(error => {
                console.log('Error', error)
            })
            }

        }
    }

    getAllOkay(){
        var result = [];
        for (var i = 0; i < this._dataToDisplay.length; i++) {
            for (var j = 0; j < this._dataToDisplay[i].sectionContentList.length; j++) {                
                result.push(this._dataToDisplay[i].sectionContentList[j].validation);
            }
        }
        return !result.includes("Not Okay");
    }

    checkSendBack(){
        checkSendBackVaidation({ applicationId: this.recordId })
        .then(result => {
            console.log('checkSendBack==',result);
            this._allPreviousStageDone = result;
        })
        .catch(error => {
            this.showToast('Error', 'error', error.body.message);
        });
    }

    handleSubmit(){
        this._errorMessages = new Array();
        var _allOkay = this.getAllOkay();
        //var _allPreviousStageDone = this.checkSendBack();
        this.checkSendBack();
        console.log('==_allOkay==',_allOkay);
        console.log('==_allPreviousStageDone==',this._allPreviousStageDone);
        if(this._allPreviousStageDone && _allOkay){
         //   this.updateApplication('Post Approval');
         this.showToast('success','success','Final Sanction stage is completed successfully!');
         moveStage({ applicationId: this.recordId }).then(result => {
            console.log('res ', result);
            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: this.recordId,
                    actionName: 'view'
                }
            });
        })
        }else{
            this._showErrorTab = true;
            this._activeTab = 'Error'
            if(!_allOkay){
                this._errorMessages.push('Found Not Okay in validation table. Inititate Send Back and Try again Later.');
            }            
            if(!this._allPreviousStageDone){
                this._errorMessages.push('Approval Credit Or Legal Approval is pending.');
            }
        }        
    }

    showToast(title, variant, message) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                variant: variant,
                message: message,
            })
        );
    }

    navigateToApplication() {        
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this.recordId,
                actionName: 'view',
            }
        });
    }

    updateApplication(stageValue){
        const fields = {};
        fields[ID_FIELD.fieldApiName] = this.recordId;
        if (stageValue === 'Legal Approval') {
            fields[SUB_STAGE_FIELD.fieldApiName] = stageValue;
        } else {
            if (stageValue === 'Approval Credit') {
                fields[STAGE_FIELD.fieldApiName] = stageValue;
                console.log('fields' + fields[STAGE_FIELD.fieldApiName]);
            }
        }
        const recordInput = {
            fields: fields
        };

        console.log('fields To Upddate ',recordInput);
        updateRecord(recordInput)
            .then((record) => {
                this.showToast('Success', 'success', 'Final Sanction moved to ' + stageValue + ' successfully.');
                this.navigateToApplication();
            })
            .catch(error => {
                this.showToast('Error', 'error', error.body.message);
            });
    }
}