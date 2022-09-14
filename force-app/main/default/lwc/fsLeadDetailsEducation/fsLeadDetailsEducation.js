import { LightningElement, api, track } from 'lwc';
import saveRecord from '@salesforce/apex/FsLeadDetailsController.saveRecord';
import getEducationData from '@salesforce/apex/FsLeadDetailsControllerHelper.getEducationData';
import getSectionContent from '@salesforce/apex/FsLeadDetailsController.getSectionContent';
import { deleteRecord } from 'lightning/uiRecordApi';
import getAllApplicantMeta from '@salesforce/apex/FsLeadDetailsControllerHelper.getAllApplicantMeta';
export default class FsLeadDetailsEducation extends LightningElement {
    @api allLoanApplicant;
    @api rowAction;
    @api allApplicantData;
    @track isSpinnerActive;
    @track tableData;
    @track fieldsContent;
    @track objectIdMap = { 'Education__c': '' };
    @track isRecordEdited;
    @track recordIds;
    @track showDeleteModal = false;
    @track recordIdForDelete;
    @track isApplicantEdit = true;
    @track selectedApplicant;
     @track labelSave = 'Save';
    connectedCallback() {
        this.getEducationData();
        console.log('allApplicantData ## ',JSON.stringify(this.allApplicantData));
    }

    getEducationData() {
        getEducationData({ allLoanApplicant: this.allLoanApplicant })
        .then(result => {
            this.tableData = result;
            this.isApplicantEdit = true;
        })
        .catch(error => {

        })
    }
    getSectionPageContent(recId) {
        this.isSpinnerActive = true;
        getSectionContent({ recordIds: recId, metaDetaName: 'Lead_Details_Education' })
        .then(result => {
            console.log('field result #### ', JSON.stringify(result));
            this.fieldsContent = result.data;
            this.isSpinnerActive = false;
        })
        .catch(error => {
            console.log(error);
        });
    }

    handleSelectedApplication(event) {
        console.log('Edit called #### ', JSON.stringify(event.detail));
        this.fieldsContent = undefined;
        var recordData = event.detail.recordData;
        if (event.detail.ActionName === 'edit') {
             this.labelSave = 'Update';
            this.isSpinnerActive = true;
            this.isApplicantEdit = false;
            this.isRecordEdited = true;
            this.recordIds = recordData.Id;
            this.objectIdMap['Education__c'] = this.recordIds
            this.getSectionPageContent(this.recordIds);
            this.isSpinnerActive = false;
        }
        if (event.detail.ActionName === 'delete') {
            this.recordIdForDelete = event.detail.recordData.Id;
            this.showDeleteModal = true;
        }
    }
    changedFromChild(event) {
        console.log('changedFromChild ### ', JSON.stringify(event.detail));
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
                }
                console.log('data 2## ', JSON.stringify(data));
                saveRecord({ dataToInsert: JSON.stringify(data[i]) })
                .then(result => {
                    this.fieldsContent = undefined;
                    this.selectedApplicant = undefined;
                    this.showtoastmessage('Success', 'Success', result);
                    this.tableData = undefined;
                    this.allApplicantData = undefined;
                    this.getEducationData();
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
        var selectedEvent = new CustomEvent('showtoastmessage', {
            detail: {
                'title': title,
                'variant': variant,
                'message': message,
            }
        });
        this.dispatchEvent(selectedEvent);
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
    handlemodalactions(event){
        this.showDeleteModal = false;
        if(event.detail === true){
            this.tableData = undefined;
            this.getEducationData();
        }
    }
}