import { LightningElement, api, track } from 'lwc';
import saveRecord from'@salesforce/apex/FsLeadDetailsController.saveRecord';
import getSectionContent from '@salesforce/apex/FsLeadDetailsController.getSectionContent';
import getFamilyData from'@salesforce/apex/FsLeadDetailsControllerHelper.getFamilyData';
import getAllApplicantMeta from '@salesforce/apex/FsLeadDetailsControllerHelper.getAllApplicantMeta';
import { deleteRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
export default class FsLeadDetailsFamily extends LightningElement {
    @api rowAction;
    @api allLoanApplicant;
    @api allApplicantData;
    @track tableData;
    @track isRecordEdited = false;
    @track recordIds;
    @track fieldsContent;
    @track objectIdMap = {'Family_Detail__c':''};
    @track isSpinnerActive = false;
    @track showDeleteModal = false;
    @track recordIdForDelete;
    @track isApplicantEdit = true;
    @track selectedApplicant;
    @track labelSave='Save';
    connectedCallback(){
        console.log('##### ',JSON.stringify(this.tableData));
        this.getFamilyData();
    }
    getFamilyData(){
        getFamilyData({allLoanApplicant : this.allLoanApplicant})
        .then(result => { 
            this.tableData = result;  
            this.isApplicantEdit = true;
        })
        .catch(error => {
            
        })    
    }
    getSectionPageContent(recId){
        this.isSpinnerActive = true;
        getSectionContent({recordIds : recId, metaDetaName : 'Lead_Details_Family'})
        .then(result => {
            this.fieldsContent = result.data;
            this.isSpinnerActive = false;
        })
        .catch(error => {
            console.log(error);
        });
    }
    

    handleSelectedApplication(event){
        console.log('Edit called #### ',JSON.stringify(event.detail));
        this.fieldsContent = undefined;
        var recordData = event.detail.recordData;
        if(event.detail.ActionName === 'edit'){
            this.labelSave='Update';
            this.isSpinnerActive = true;
            this.isApplicantEdit = false;
            this.isRecordEdited = true;    
            this.recordIds = recordData.Id;
            this.objectIdMap['Family_Detail__c'] = recordData.Id;
            this.getSectionPageContent(this.recordIds);
            this.isSpinnerActive = false;
        }
        if (event.detail.ActionName === 'delete') {
            this.recordIdForDelete = event.detail.recordData.Id;
            this.showDeleteModal = true;
        }
    }
    changedFromChild(event){
        console.log('changedFromChild ### ',JSON.stringify(event.detail));
        var tempFieldsContent = event.detail;
        var noOfDep = Number(tempFieldsContent.previousData['Family_Detail__c-Number_Of_Children__c']) + Number(tempFieldsContent.previousData['Family_Detail__c-No_Of_Adult_Dependents__c']);
        this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setValues('Number_Of_Dependents__c',noOfDep)));
    }
    handleSave(){
        var isDuplicateFamilyRecord = false
        var familyData = JSON.parse(this.tableData.strDataTableData);
        familyData.forEach(element =>{
            if(this.selectedApplicant !== undefined && this.selectedApplicant[0].Customer_Information__c === element.Loan_Applicant__r_Customer_Information__c_VALUE.replace('/lightning/_classic/', '') && this.selectedApplicant[0].Id === element.Loan_Applicant_VALUE.replace('/lightning/_classic/', '')){
                isDuplicateFamilyRecord = true;
                this.showtoastmessage('Error','Error','Multiple Records Can’t Be Created For Same Applicant');
                this.fieldsContent = undefined;
                this.isApplicantEdit = true;
                this.allApplicantData = undefined;
                this.selectedApplicant = undefined;
                this.getAllApplicantMeta();
            }
        });
        if(isDuplicateFamilyRecord){
            return;
        }else{
            var data = this.template.querySelector("c-generic-edit-pages-l-w-c").handleOnSave();
            if(data.length > 0){   
                this.isSpinnerActive = true;
                for(var i=0; i<data.length; i++){
                    if(this.selectedApplicant !== undefined && !isDuplicateFamilyRecord){
                        data[i].Customer_Information__c = this.selectedApplicant[0].Customer_Information__c;
                        data[i].Loan_Applicant__c = this.selectedApplicant[0].Id;
                    }else{
                        data[i].Id = this.objectIdMap[data[i].sobjectType];
                    }
                    saveRecord({dataToInsert : JSON.stringify(data[i])})
                    .then(result => {
                        this.fieldsContent = undefined;
                        this.tableData = undefined;
                        this.allApplicantData = undefined;
                        this.selectedApplicant = undefined;
                        this.getAllApplicantMeta();
                        this.getFamilyData();
                        this.showtoastmessage('Success','Success',result);
                    })
                    .catch(error => {
                        console.log(error);
                        this.showtoastmessage('Error','Error',JSON.stringify(error));
                    });
                }
            } else{
                this.showtoastmessage('Error','Error','Complete Required Field(s).');
            }
        }
    }   
    handleCancel() {
        this.fieldsContent = undefined;
        this.isApplicantEdit = true;
        this.allApplicantData = undefined;
        this.getAllApplicantMeta();
    }
    showtoastmessage(title, variant, message) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(evt);
    }
    handleRadtioButton(event){
        this.labelSave='Save';
        this.getSectionPageContent();
        this.selectedApplicant = event.detail;
    }
    getAllApplicantMeta(){
        getAllApplicantMeta({ allLoanApplicant: this.allLoanApplicant })
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
            if(_tempVar[0].fieldsContent[i].fieldAPIName === _fieldAPIName){
                if(_tempVar[0].fieldsContent[i].isCheckbox){
                    _tempVar[0].fieldsContent[i].checkboxVal = Boolean(_val);
                }else{
                    _tempVar[0].fieldsContent[i].value = _val;
                }			
            }
        }
        return _tempVar;
    }
    handlemodalactions(event){
        this.showDeleteModal = false;
        if(event.detail === true){
            this.tableData = undefined;
            this.getFamilyData();
        }
    }
}