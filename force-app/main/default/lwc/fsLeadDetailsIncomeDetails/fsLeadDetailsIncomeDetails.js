import { LightningElement, api, track } from 'lwc';
import saveRecord from'@salesforce/apex/FsLeadDetailsController.saveRecord';
import getSectionContent from '@salesforce/apex/FsLeadDetailsController.getSectionContent';
import getIncomeDetailsData from'@salesforce/apex/FsLeadDetailsControllerHelper.getIncomeDetailsData';
import { deleteRecord } from 'lightning/uiRecordApi';
import getAllApplicantMeta from '@salesforce/apex/FsLeadDetailsControllerHelper.getAllApplicantMeta';
export default class FsLeadDetailsIncomeDetails extends LightningElement {
    @api rowAction;
    @api applicationId;
    @api allLoanApplicant;
    @track tableData;
    @track isRecordEdited = false;
    @track recordIds;
    @track fieldsContent;
    @track objectIdMap = {'Income__c':''};
    @track isSpinnerActive = false;
    @track showDeleteModal = false;
    @track recordIdForDelete;
    @track isApplicantEdit = true;
    @track selectedApplicant;
    @api allApplicantData;
    @track labelSave='Save';
    connectedCallback(){
        this.getIncomeDetailsData();
    }
    getSectionPageContent(recId){
        try{
            getSectionContent({recordIds : recId, metaDetaName : 'Lead_Details_Income_Details'})
            .then(result => {
                this.fieldsContent = result.data;
                this.isSpinnerActive = false;
            })
            .catch(error => {
                console.log(error);
            });
        }catch(error){
            console.log(error);
        }
    }
    getIncomeDetailsData(){
        getIncomeDetailsData({allLoanApplicant : this.allLoanApplicant})
        .then(result => { 
            this.tableData = result;    
            this.isApplicantEdit = true;
        })
        .catch(error => {
            
        })    
    }

    handleSelectedApplication(event){
        console.log('Edit called #### ',JSON.stringify(event.detail));
        this.fieldsContent = undefined;
        var recordData = event.detail.recordData;
        if(event.detail.ActionName === 'edit'){
            this.isSpinnerActive = true;
            this.labelSave= 'Update';
            this.isRecordEdited = true;    
            this.recordIds = recordData.Id;
            this.objectIdMap['Income__c'] = recordData.Id;
            this.getSectionPageContent(this.recordIds);
            this.isSpinnerActive = false;
        }
        if (event.detail.ActionName === 'delete') {
            this.recordIdForDelete = event.detail.recordData.Id;
            this.showDeleteModal = true;
        }
    }
    changedFromChild(event){
        console.log('changedFromChild ### ',JSON.stringify(event));
    }
    handleSave(){
        var isDuplicateFamilyRecord = false
        var incomeId = '';
        var incomeData = JSON.parse(this.tableData.strDataTableData);
        incomeData.forEach(element =>{
            if(this.selectedApplicant !== undefined && this.selectedApplicant[0].Customer_Information__c === element.Loan_Applicant__r_Customer_Information__c_VALUE.replace('/lightning/_classic/', '') && this.selectedApplicant[0].Id === element.Loan_Applicant_VALUE.replace('/lightning/_classic/', '')){
                isDuplicateFamilyRecord = true;
                incomeId = element.Id;
            }
        });
        var data = this.template.querySelector("c-generic-edit-pages-l-w-c").handleOnSave();
        if(data.length > 0){   
            this.isSpinnerActive = true;
            for(var i=0; i<data.length; i++){
                if(this.selectedApplicant !== undefined && isDuplicateFamilyRecord){
                    data[i].Id = incomeId;
                }
                else if(this.selectedApplicant !== undefined && !isDuplicateFamilyRecord){
                    data[i].Customer_Information__c = this.selectedApplicant[0].Customer_Information__c;
                    data[i].Loan_Applicant__c = this.selectedApplicant[0].Id;
                    data[i].Application = this.applicationId;
                } else{
                    data[i].Id = this.objectIdMap[data[i].sobjectType];
                }
                console.log('data 2## ', JSON.stringify(data));
                saveRecord({dataToInsert : JSON.stringify(data[i])})
                .then(result => {
                    this.fieldsContent = undefined;
                    this.isSpinnerActive = false;
                    this.showtoastmessage('Success','Success',result);
                    this.tableData = undefined;
                    this.allApplicantData = undefined;
                    this.getIncomeDetailsData();
                    this.getAllApplicantMeta();
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
    handleCancel(){
        this.fieldsContent = undefined;
        this.isApplicantEdit = true;
        this.allApplicantData = undefined;
        this.getAllApplicantMeta();
    }
    handleDelete(event) {
        this.isSpinnerActive = true;
        let label = event.target.label;
        if (label == 'Yes') {
            this.showDeleteModal = false;
            deleteRecord(this.recordIdForDelete)
            .then(() => {
                this.tableData = undefined;
                this.getIncomeDetailsData();
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
        this.labelSave='Save';
        this.getSectionPageContent();
        this.selectedApplicant = event.detail;
        console.log('event #### ',JSON.stringify(event.detail));
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
    showtoastmessage(title, variant, message) {
        var selectedEvent = new CustomEvent('showtoastmessage', {
            detail: {
                'title': title,
                'variant': variant,
                'message': message,
            }
        });
        this.dispatchEvent(selectedEvent);
    }
    handlemodalactions(event){
        this.showDeleteModal = false;
        if(event.detail === true){
            this.tableData = undefined;
            this.getIncomeDetailsData();
        }
    }
}