import { LightningElement, api, track,wire } from 'lwc';
import getPropertyData from'@salesforce/apex/FSFivBLwcController.getPropertyData';
import { deleteRecord } from 'lightning/uiRecordApi';
import getAllApplicantMeta from '@salesforce/apex/FSFivBLwcController.getAllApplicantMeta';
import PROPERTY_OBJECT from '@salesforce/schema/Property__c';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import saveRecord from'@salesforce/apex/FSFivBLwcController.saveRecord';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getSectionContent from '@salesforce/apex/FSFivBLwcController.getSectionContent';
export default class fsFiv_B_Collateral extends LightningElement {
    @api allLoanApplicant;
    @track rowAction = [
        {
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
    ]
    @api applicationId;
    @track isSpinnerActive = true;;
    @track tableData;
    @track fieldsContent;
    @track objectIdMap = { 'Property__c': '' };
    @track recordIds;
    @track showDeleteModal = false;
    @track recordIdForDelete;
    @track isApplicantEdit = true;
    @track selectedApplicant;
    @api allApplicantData;
    @api verificationStatus;
    @track propertyRecordTypeId;
    @wire(getObjectInfo, { objectApiName: PROPERTY_OBJECT })
    getPropertyObjectData({data, error}){
        if(data){
            var recordTypeData = data.recordTypeInfos;
            this.propertyRecordTypeId = Object.keys(recordTypeData).find(rti => recordTypeData[rti].name === 'FIV-B Property Detail');
        }
    }
    connectedCallback() {
        this.getPropertyData();
        console.log('allApplicantData ## ',JSON.stringify(this.allApplicantData));
        this.verificationStatus == 'Completed' ? true : false;
        
    }
    
    todayDate(){
        var today = new Date();
        var dd = today.getDate() - 1;
        var mm = today.getMonth() + 1;
        var yyyy = today.getFullYear();
        var todayDate = yyyy + '-' + mm + '-' + dd;
        return todayDate;
    }

    getPropertyData() {
        getPropertyData({ applicationId: this.applicationId })
        .then(result => {
            console.log('api called from property',result);
            this.isApplicantEdit = true;
            this.tableData = result;
            this.isSpinnerActive = false;
        })
        .catch(error => {

        })
    }
    getSectionPageContent(recId) {
        var todayDate = this.todayDate();
        this.isSpinnerActive = true;
        getSectionContent({ recordIds: recId, metaDetaName: 'Fs_FIV_B_Collateral' })
        .then(result => {
            this.fieldsContent = result.data;
            console.log('this.fieldsContent #### ',this.fieldsContent);
            setTimeout(() => {
                var _tempVar = JSON.parse(this.fieldsContent);
                for (var i = 0; i < _tempVar[0].fieldsContent.length; i++) {
                    if (_tempVar[0].fieldsContent[i].fieldAPIName === 'Title_Deed_Date__c') {
                        this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setValues('Title_Deed_Date__c',todayDate))); 
                    }
                }    
            }, 500);
            
            this.isSpinnerActive = false;
        })
        .catch(error => {
            console.log(error);
        });
    }

    handleSelectedApplication(event) {
        console.log('Edit called #### ', JSON.stringify(event.detail));
        this.isSpinnerActive = true;
        var recordData = event.detail.recordData;
        if (event.detail.ActionName === 'edit') {
            this.isApplicantEdit = false;
            this.recordIds = recordData.Id;
            this.objectIdMap['Property__c'] = this.recordIds
            this.getSectionPageContent(this.recordIds);
            this.isSpinnerActive = false;
        }
        if (event.detail.ActionName === 'delete') {
            this.recordIdForDelete = event.detail.recordData.Id;
            this.showDeleteModal = true;
        }
    }
    changedFromChild(event) {
        console.log('event details #### ',JSON.stringify(event.detail));
        var tempFieldsContent = event.detail;
        if(tempFieldsContent.CurrentFieldAPIName === 'Property__c-Customers_Residing__c'){
            var isRequired = (tempFieldsContent.previousData['Property__c-Customers_Residing__c'] == 'Yes' || tempFieldsContent.previousData['Property__c-Customers_Residing__c'] == '')  ? 'isRequired-Yes' : 'isRequired-No';
            this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setValues('If_No_Reason__c',isRequired))); 
        }
        if(tempFieldsContent.CurrentFieldAPIName === 'Property__c-Land_Area_Sq_Ft__c' || tempFieldsContent.CurrentFieldAPIName === 'Property__c-Building_Area_Sq_Ft__c' || tempFieldsContent.CurrentFieldAPIName === 'Property__c-Value_per_sq_ft__c' || tempFieldsContent.CurrentFieldAPIName === 'Property__c-Building_Value_per_Sq_ft__c'){
            var totalArea = Number(tempFieldsContent.previousData['Property__c-Land_Area_Sq_Ft__c']) + Number(tempFieldsContent.previousData['Property__c-Building_Area_Sq_Ft__c']);
            this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setValues('Total_Area__c',totalArea)));
            var totalAreaValuation = (Number(tempFieldsContent.previousData['Property__c-Land_Area_Sq_Ft__c']) * Number(tempFieldsContent.previousData['Property__c-Value_per_sq_ft__c'])) + (Number(tempFieldsContent.previousData['Property__c-Building_Area_Sq_Ft__c']) * Number(tempFieldsContent.previousData['Property__c-Building_Value_per_Sq_ft__c']));
            this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setValues('Total_Value__c',totalAreaValuation)));
        }
        /*if(tempFieldsContent.CurrentFieldAPIName === 'Property__c-Title_Deed_Date__c'){
            var todayDate = new Date();
            var titleDeedDate = new Date(tempFieldsContent.previousData['Property__c-Title_Deed_Date__c']);
            console.log('titleDeedDate.getTime() ',titleDeedDate.getTime());
            console.log('todayDate.getTime() ',todayDate.getTime());
            var isValidDate = titleDeedDate.getTime() > todayDate.getTime() ? false : true;
            console.log('isValidDate ',isValidDate);
            this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setValues('Title_Deed_Date__c',(isValidDate == true ? tempFieldsContent.previousData['Property__c-Title_Deed_Date__c'] : null)))); 
        }*/
    }
    handleSave() {
        var data = this.template.querySelector("c-generic-edit-pages-l-w-c").handleOnSave();
        console.log('data #### ', JSON.stringify(data));
        if (data.length > 0) {
            this.isSpinnerActive = true;
            for (var i = 0; i < data.length; i++) {
                if(this.selectedApplicant === undefined){
                    data[i].Id = this.objectIdMap[data[i].sobjectType];
                } else{
                    data[i].Customer_Information__c = this.selectedApplicant[0].Customer_Information__c;
                    data[i].Loan_Applicant__c = this.selectedApplicant[0].Id;
                    data[i].RecordTypeId = this.propertyRecordTypeId;
                }
                data[i].Is_Fiv_B_Completed__c = true;
                //delete data[i].Total_Area__c;
                //delete data[i].Total_Value__c;
                delete data[i].Title_Deed_Date__c;
                
                console.log('data #### ', JSON.stringify(data[i]));
                saveRecord({ dataToInsert: data[i]})
                .then(result => {
                    this.fieldsContent = undefined;
                    this.showtoastmessage('Success', 'Success', result);
                    this.tableData = undefined;
                    this.selectedApplicant = undefined;
                    this.allApplicantData = undefined;
                    this.getPropertyData();
                    this.getAllApplicantMeta();
                })
                .catch(error => {
                    console.log(error);
                    this.showtoastmessage('Error', 'Error', JSON.stringify(error));
                });
            }
        } else {
            this.showtoastmessage('Error', 'Error', 'Complete Required Field(s).');
        }
    }
    handleCancel() {
        console.log('handle cancel called ###');
        this.fieldsContent = undefined;
        this.isApplicantEdit = true;
        this.allApplicantData = undefined;
        this.getAllApplicantMeta();
    }
    showtoastmessage(title, variant, message) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(event);
    }
    handleDelete(event) {
        this.isSpinnerActive = true;
        let label = event.target.label;
        if (label == 'Yes') {
            this.showDeleteModal = false;
            deleteRecord(this.recordIdForDelete)
            .then(() => {
                this.tableData = undefined;
                this.getPropertyData();
                this.isSpinnerActive = false;
            })
            .catch(error => {
                console.log(error);
            });  
        } else if (label == 'No') {
            this.showDeleteModal = false;
            this.isSpinnerActive = false;    
        }
    }
    handleRadtioButton(event){
        this.getSectionPageContent();
        this.selectedApplicant = event.detail;
        console.log('event #### ',JSON.stringify(event.detail));
    }
    getAllApplicantMeta(){
        getAllApplicantMeta({ applicationId: this.applicationId })
        .then(result => {
            this.allApplicantData = result;
            this.isSpinnerActive = false;
        })
        .catch(error => {

        })
    }
    setValues(_fieldAPIName,_val){
        var _tempVar = JSON.parse(this.fieldsContent);
        for(var i=0; i<_tempVar[0].fieldsContent.length; i++){
            if(_tempVar[0].fieldsContent[i].fieldAPIName === 'Title_Deed_Date__c'){
                _tempVar[0].fieldsContent[i].maxDate = _val;
            }
            else if(_tempVar[0].fieldsContent[i].fieldAPIName === _fieldAPIName){
                if(_val == 'isRequired-Yes' || _val == 'isRequired-No'){
                    _tempVar[0].fieldsContent[i].fieldAttribute.isRequired = _val == 'isRequired-No' ? true : false;    
                }else{
                    if(_tempVar[0].fieldsContent[i].isCheckbox){
                        _tempVar[0].fieldsContent[i].checkboxVal = Boolean(_val);
                    }else{
                        _tempVar[0].fieldsContent[i].value = _val;
                    }	    
                }
                        
            }
        }
        console.log('_tempVar #### ',_tempVar);
        this.fieldsContent = JSON.stringify(_tempVar);
        return _tempVar;
    }
    
}