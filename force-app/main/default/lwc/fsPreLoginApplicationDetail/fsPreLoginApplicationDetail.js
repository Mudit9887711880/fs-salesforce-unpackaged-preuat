import { LightningElement, api, track, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import Id from '@salesforce/user/Id';
import saveRecord from'@salesforce/apex/FsPreloginController.saveRecord';
import getMetadtaInfoForm from '@salesforce/apex/FsPreloginController.getMetadtaInfoForm';
import getApplicationRecord from '@salesforce/apex/FsPreloginController.getApplicationRecord';
import getBranchName from '@salesforce/apex/FsPreloginController.getBranchName'; 
import NAME_FIELD from '@salesforce/schema/User.Name';
import EMP_FIELD from '@salesforce/schema/User.EmployeeNumber';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { CloseActionScreenEvent } from 'lightning/actions';

export default class FsPreLoginApplicationDetail extends LightningElement {

    @api applicationId;
    @api preloginId;

    @track isSpinnerActive;
    @track fieldsContent;
    @track objectIdMap = {'Application__c':''};
    @track labelSave = 'Save';
    @track isStaffLoan = false;
    @track hasAllFields = false;
    @track branchName;
    @track empName;
    @track empId;
    @track fieldOfficerId;
    @track fieldOfficerEMPId;

    @wire(getRecord, { recordId: Id, fields: [NAME_FIELD, EMP_FIELD] })
    userDetails({ error, data }) {
        if (data) {
            this.empName = data.fields.Name.value;
            this.empId = data.fields.EmployeeNumber.value;
            this.fieldOfficerId = this.empName + '-' + this.empId;
        } else if (error) {
            console.error(error);
            //this.error = error;
        }
    }

    connectedCallback(){
        console.log('icalled');
        this.getBranchNameOfSalesUser();
        this.getUpdatedApplicationRecords();
    }

    todayDate(){
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth() + 1;
        var yyyy = today.getFullYear();
        var todayDate = yyyy + '-' + mm + '-' + dd;
        return todayDate;
    }

    handleSelectedEMPId(event){
        console.log('fieldOfficerEMPId ',event);
         if (event.detail.length > 0) {
            this.fieldOfficerEMPId = event.detail[0].id;
        } else {
            this.fieldOfficerEMPId = undefined;
        }
    }

    @api getApplicationId(appId){
        console.log('getApplicationId ',appId);
        this.applicationId = appId;
        this.getSectionPageContent(this.applicationId);
    }

    @api getBranchNameOfSalesUser(){
        getBranchName().then(result=>{
            console.log('result'+result);
            this.branchName= result;
        })
        .catch(error =>{
            console.log('error in branch master ',error);
        })
    }

    @api getSectionPageContent(recId){
        console.log('app form called ',recId);
        try{
            getMetadtaInfoForm({recordIds : recId, metaDetaName : 'fs_Prelogin_Application_Details'})
            .then(result => {
                this.fieldsContent = result.data;
                var rs = JSON.parse(result.data);
                rs[0].fieldsContent.forEach(element => {
                    console.log('element.fieldAPIName ',element.fieldAPIName+' :: element.value ',element.value);
                    if (element.fieldAPIName === 'Field_Officer_Emp_Id__c') {
                        if (element.value && element.value != ' ')
                            this.fieldOfficerEMPId = element.value;
                    }
                });
                console.log('field result #### ',this.fieldsContent);
            })
            .catch(error => {
                console.log(error);
            });
        }catch(error){
            console.log(error);
        }
    }

    @api getUpdatedApplicationRecords(){
        getApplicationRecord({ applicationId: this.applicationId })
        .then(result => {
            console.log('getApplicationRecord Result ', result);
            if (result != null && result != undefined && result != '') {
                this.hasAllFields = false;
                console.log('Staff Loan App ', result.Staff_Loan__c);
                if (result.Alternate_Channel_Mode__c && result.Channel__c && result.Customer_Visit_date__c && result.Field_Officer_Emp_Id__c
                    && result.Requested_Loan_Amount__c) {
                        this.labelSave = 'Update';
                        this.hasAllFields = true;
                    // if (result.Staff_Loan__c === true) {
                    //     this.isStaffLoan = true;
                    //     if (result.Employee_ID__c) {  
                    //         this.hasAllFields = true;
                    //     }
                    //     else {
                    //         this.hasAllFields = false;
                    //     }
                    // }
                    // else{
                    //     this.hasAllFields = true;
                    //     this.isStaffLoan = false;
                    // }
                }
                else {
                    this.labelSave = 'Save';
                    this.hasAllFields = false;
                }
            }
            console.log('this.hasAllFields ', this.hasAllFields);
            this.checkAllRequiredFields(this.hasAllFields);
        })
        .catch(error => {
            console.log('Catched error in getApplicationRecords ',error);
        })
    }

    handleFormValueChange(event) {
        this.dataValues = event;
        console.log('event onchange ',this.dataValues);
        console.log(this.dataValues);
        var tempFieldsContent = event.detail;
        console.log('before saving ',this.fieldsContent);
        if(tempFieldsContent.CurrentFieldAPIName === 'Application__c-Customer_Visit_date__c'){
            var _val = tempFieldsContent.CurrentFieldValue;
            console.log(' _val #### ',_val);
            this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setValues('Customer_Visit_date__c',_val))); 
            // var d1 = new Date();
            // var d2 = new Date(tempFieldsContent.CurrentFieldValue);
            // var age = d1.getFullYear() - d2.getFullYear();
            // if (d2.getTime() > d1.getTime()) {
            //     console.log('date ',d2);
            //     this.showToast('Error', 'error', 'Invalid Date, Future Dates Are Not Allowed!!');
            //     this.closeAction();
            //     var dateVal = null;
            //     this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setValues('Customer_Visit_date__c',dateVal)));   
            // }
        }
        else if(tempFieldsContent.CurrentFieldAPIName === 'Application__c-Staff_Loan__c'){
            if(tempFieldsContent.CurrentFieldValue){
                this.toggleSpouseField(this.fieldsContent,false,true);
            }
            else if(!tempFieldsContent.CurrentFieldValue){
                this.toggleSpouseField(this.fieldsContent,true,false);
            }
        }
        console.log('before saving sourcing branch  ',this.fieldsContent);
    }

    toggleSpouseField(fieldcontent,disabled,required){
        var field = JSON.parse(fieldcontent);
        for (var i = 0; i < field[0].fieldsContent.length; i++) {
            if (field[0].fieldsContent[i].fieldAPIName === 'Employee_ID__c') {
                field[0].fieldsContent[i].disabled = disabled;
                field[0].fieldsContent[i].isRequired = required;
            }
        }
        this.fieldsContent = JSON.stringify(field);
        let genericedit = this.template.querySelector('c-generic-edit-pages-l-w-c');
        genericedit.refreshData((this.fieldsContent));
    }


    setValues(_fieldAPIName,_val){
        var _tempVar = JSON.parse(this.fieldsContent);
        for(var i=0; i<_tempVar[0].fieldsContent.length; i++){
            if(_tempVar[0].fieldsContent[i].fieldAPIName === _fieldAPIName){
                if(_tempVar[0].fieldsContent[i].isCheckbox){
                    _tempVar[0].fieldsContent[i].checkboxVal = Boolean(_val);
                }else{
                    if (_tempVar[0].fieldsContent[i].fieldAPIName === 'Customer_Visit_date__c') {
                        _tempVar[0].fieldsContent[i].maxDate = this.todayDate();
                    }
                    _tempVar[0].fieldsContent[i].value = _val;
                }           
            }
        }
        return _tempVar;
    }

    async handleSave(){
        if(!this.applicationId){
            this.showToast('Error','Error','No Application Exist,Please add atleast one primary applicant first!!');
            return;
        }
        if(!this.fieldOfficerEMPId){
            this.showToast('Error','Error','Missing Field Officer Employee Id!!');
            return;
        }
        var data = this.template.querySelector("c-generic-edit-pages-l-w-c").handleOnSave();
        console.log('data #### ',data);
        if(data.length > 0){ 
            console.log('Data entry start');  
            this.isSpinnerActive = true;
            for(var i=0; i<data.length; i++){
                console.log('i am in',data[i]);
                if(this.applicationId && this.preloginId){
                    data[i].Id = this.applicationId;
                    data[i].Pre_Login__c = this.preloginId;
                }
                console.log('d ',data[i]);
                if(this.fieldOfficerEMPId)
                    data[i].Field_Officer_Emp_Id__c = this.fieldOfficerEMPId;
                await saveRecord({dataToInsert : JSON.stringify(data[i])})
                .then(result => {
                    console.log('result ',result);
                    this.fieldsContent = undefined;
                    this.isSpinnerActive = false;
                    //this.showToast('Success','Success',result);
                    this.getSectionPageContent(this.applicationId);
                    this.labelSave = 'Update'
                    this.checkAllRequiredFields(true);
                    this.showToast('Success','Success','Record Updated Successfully!!');
                    this.closeAction();
                })
                .catch(error => {
                    console.log(error);
                    this.showToast('Error','Error',JSON.stringify(error));
                });
            }
        } else{
            this.showToast('Error','Error','Complete Required Field(s).');
        }
    }   

    checkAllRequiredFields(hasAllFields){
        const checkAllRequired = new CustomEvent("checkrequired", {
            detail: hasAllFields
        });
        console.log('dispatch event ', checkAllRequired);
        this.dispatchEvent(checkAllRequired);
    }

    showtoastmessage(title, variant, message){
        var selectedEvent = new CustomEvent('showtoastmessage', { 
            detail : {
                'title':title,
                'variant':variant,
                'message':message,
            }
        });    
        this.dispatchEvent(selectedEvent);
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

    closeAction() {
        this.dispatchEvent(new CloseActionScreenEvent());
    }

}