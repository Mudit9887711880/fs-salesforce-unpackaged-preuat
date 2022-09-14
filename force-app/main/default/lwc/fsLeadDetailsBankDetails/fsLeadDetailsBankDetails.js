import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import saveRecord from '@salesforce/apex/FsLeadDetailsController.saveRecord';
import getSectionContent from '@salesforce/apex/FsLeadDetailsController.getSectionContent';
import getBankDetailsData from '@salesforce/apex/FsLeadDetailsControllerHelper.getBankDetailsData';
import { deleteRecord } from 'lightning/uiRecordApi';
import getAllApplicantMeta from '@salesforce/apex/FsLeadDetailsControllerHelper.getAllApplicantMeta';
import getBankIFSCDetails from '@salesforce/apex/FsLeadDetailsControllerHelper.getBankIFSCDetails';

export default class FsLeadDetailsBankDetails extends LightningElement {
    @api rowAction;
    @api allLoanApplicant;
    @track tableData;
    @track isRecordEdited = false;
    @track recordIds;
    @track fieldsContent;
    @track objectIdMap = { 'Bank_Detail__c': '' };
    @track isSpinnerActive = false;
    @track showDeleteModal = false;
    @track recordIdForDelete;
    @track isApplicantEdit = true;
    @track selectedApplicant;
    @api allApplicantData;
    @track bankCheck = false;
    @track labelSave = 'Save';
    @track IFSCData;
    connectedCallback() {
        this.getBankDetailsData();
    }
    @api getBankDetailsData() {
        getBankDetailsData({ allLoanApplicant: this.allLoanApplicant })
            .then(result => {
                this.tableData = result;
                this.isApplicantEdit = true;
                this.bankCheck = false;
                var temp = JSON.parse(result.strDataTableData);
                if (temp.length == 0)
                    this.bankCheck = false;
                else
                    this.bankCheck = true;
                const checkValidBank = new CustomEvent("checkbankdetailinfo", {
                    detail: this.bankCheck
                });
                console.log('bankCheck ', checkValidBank);
                this.dispatchEvent(checkValidBank);
            })
            .catch(error => {

            })
    }
    todayDate() {
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth() + 1;
        var yyyy = today.getFullYear();
        var todayDate = yyyy + '-' + mm + '-' + dd;
        return todayDate;
    }
    getSectionPageContent(recId) {
        var todayDate = this.todayDate();
        getSectionContent({ recordIds: recId, metaDetaName: 'Lead_Details_Bank_Details' })
            .then(result => {
                console.log('result.data #### ', result.data);
                this.fieldsContent = result.data;
                this.isSpinnerActive = false;
                this.setValues(todayDate);
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
            this.isSpinnerActive = true;
            this.labelSave = 'Update';
            this.isApplicantEdit = false;
            this.isRecordEdited = true;
            this.recordIds = recordData.Id;
            this.objectIdMap['Bank_Detail__c'] = recordData.Id;
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
        var details = event.detail;
        
        if (details.CurrentFieldAPIName === 'Bank_Detail__c-MS_IFSC_Code__c' && details.CurrentFieldValue !== true) {
            getBankIFSCDetails({ masterId: details.CurrentFieldValue })
                .then(result => {
                    console.log('### result ### ', result);
                    this.IFSCData = {};
                    this.IFSCData = result;
                    this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setIFSCDetails('Name',result.Bank_Name__c)));
                    this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setIFSCDetails('Branch_Name__c',result.Bank_Branch_Name__c)));
                })
                .catch(error => {

                })
        } else if(details.CurrentFieldAPIName === 'Bank_Detail__c-MS_IFSC_Code__c'){
            this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setIFSCDetails('Name', '')));
            this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setIFSCDetails('Branch_Name__c','')));
        }
    }
    setIFSCDetails(_fieldAPIName, _val) {
        var _tempVar = JSON.parse(this.fieldsContent);
        for (var i = 0; i < _tempVar[0].fieldsContent.length; i++) {
            if (_tempVar[0].fieldsContent[i].fieldAPIName === _fieldAPIName) {
                _tempVar[0].fieldsContent[i].value = _val
            }
        }
        this.fieldsContent = JSON.stringify(_tempVar);
        return _tempVar;
    }
    handleSave() {
        try{
        var data = this.template.querySelector("c-generic-edit-pages-l-w-c").handleOnSave();
        if (data.length > 0) {
            this.isSpinnerActive = true;
            for (var i = 0; i < data.length; i++) {
                console.log('data #### ',JSON.stringify(data[i]));
                if (data[i].Account_Number__c != data[i].Account_Number_with_masking_digits__c) {
                    this.showtoastmessage('Error', 'Error', 'Account No Should Be Equal With Re-Account No');
                    this.isSpinnerActive = false;
                    return;
                }
                else if (this.selectedApplicant === undefined) {
                    data[i].Id = this.objectIdMap[data[i].sobjectType];
                } else {
                    data[i].Customer_Information__c = this.selectedApplicant[0].Customer_Information__c;
                    data[i].Loan_Applicant__c = this.selectedApplicant[0].Id;
                }
                data[i].Name = this.IFSCData.Bank_Name__c;
                data[i].Branch_Name__c = this.IFSCData.Bank_Branch_Name__c;
                console.log('data 2## ', JSON.stringify(data));
                saveRecord({ dataToInsert: JSON.stringify(data[i]) })
                    .then(result => {
                        this.fieldsContent = undefined;
                        this.isSpinnerActive = false;
                        this.showtoastmessage('Success', 'Success', 'Bank Details Saved Successfully.');
                        this.tableData = undefined;
                        this.selectedApplicant = undefined;
                        this.allApplicantData = undefined;
                        this.getBankDetailsData();
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
        }catch(error){
            console.log(error);
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
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(evt);
    }
    handleDelete(event) {
        this.isSpinnerActive = true;
        let label = event.target.label;
        if (label == 'Yes') {
            this.showDeleteModal = false;
            deleteRecord(this.recordIdForDelete)
                .then(() => {
                    this.tableData = undefined;
                    this.getBankDetailsData();
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
    handleRadtioButton(event) {
        this.labelSave = 'Save';
        this.getSectionPageContent();
        this.selectedApplicant = event.detail;
        console.log('event #### ', JSON.stringify(event.detail));
    }
    getAllApplicantMeta() {
        getAllApplicantMeta({ allLoanApplicant: this.allLoanApplicant })
            .then(result => {
                this.allApplicantData = result;
                this.isSpinnerActive = false;
            })
            .catch(error => {

            })
    }
    handlemodalactions(event) {
        this.showDeleteModal = false;
        if (event.detail === true) {
            this.tableData = undefined;
            this.getBankDetailsData();
        }
    }
    setValues(_val) {
        var _tempVar = JSON.parse(this.fieldsContent);
        for (var i = 0; i < _tempVar[0].fieldsContent.length; i++) {
            if(_tempVar[0].fieldsContent[i].fieldAPIName === 'Account_Opening_Date__c') {
                _tempVar[0].fieldsContent[i].maxDate = _val;
            }
            if(_tempVar[0].fieldsContent[i].fieldAPIName === 'Account_Number_with_masking_digits__c') {
                _tempVar[0].fieldsContent[i].fieldAttribute.dataType = 'password';
            }
        }
        this.fieldsContent = JSON.stringify(_tempVar);
        return _tempVar;
    }
}