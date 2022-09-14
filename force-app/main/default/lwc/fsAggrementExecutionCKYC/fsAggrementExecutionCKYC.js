import { LightningElement, track, wire, api } from 'lwc';
import getApplicants from '@salesforce/apex/AgreementExecutionController.getApplicants';
import getEditPageContent from '@salesforce/apex/AgreementExecutionController.getEditPageContent';
import getCkycDataTable from '@salesforce/apex/AgreementExecutionController.getAgDataTable';
import saveRecord from '@salesforce/apex/AgreementExecutionController.saveRecord';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class FsAggrementExecutionCKYC extends LightningElement {

    @api applicationId;
    @api recordIds;

    @track applicantValue;
    @track applicantOptions = [];
    @track showEditPage = false;
    @track fieldsContent;
    @track isSpinnerActive = false;
    @track objectIdMap = { 'Loan_Applicant__c': '', 'Account': '' };
    @track tableData;
    @track showCKYCSubsection = false;
    @track showCkyc = false;
    @track accountId;
    @track loanAppId;
    @track isCkycDataArrived = false;
    @track showDeletePopup = false;
    @track showApplicants = false;
    @track rowAction = [
         {
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
        {
            type: 'button-icon',
            fixedWidth: 50,
            typeAttributes: {
                iconName: 'utility:delete',
                title: 'Delete',
                variant: 'border-filled',
                alternativeText: 'Delete',
                name: 'delete'
            }
        }
    ]


    connectedCallback() {
        console.log('appId', this.applicationId);
        this.getCkycRecordDetails();
    }

    @api getAllApplicant() {
        this.applicantOptions = [];
        this.showApplicants = false;
        getApplicants({ applicationId: this.applicationId })
            .then(result => {
                if (result) {
                    result.forEach(element => {
                        if (element.Applicant_Name__c) {
                            const applicantName = {
                                label: element.Applicant_Name__c,
                                value: element.Customer_Information__c + '_' + element.Id
                            };
                            this.applicantOptions = [...this.applicantOptions, applicantName];
                            console.log('appopt ', this.applicantOptions);
                            this.showApplicants = true;
                        }
                    });
                }
            })
            .catch(error => {
                this.isSpinnerActive = false;
                console.log('Error in getting applicant name ', error)
            })
    }

    getSectionPageContent(recId) {
        this.isSpinnerActive = true;
        this.showCkyc = false;
        try {
            getEditPageContent({ recordIds: recId, metaDetaName: 'Fs_Agreement_Execution_CKYC' })
                .then(result => {
                    console.log('data ### ', JSON.parse(result.data));
                    this.fieldsContent = result.data;
                    this.isSpinnerActive = false;
                    this.showCkyc = true;
                })
                .catch(error => {
                    this.isSpinnerActive = false;
                    console.log(error);
                });
        } catch (error) {
            this.isSpinnerActive = false;
            console.log(error);
        }
    }

    handleSelectedApplicant(event) {
        console.log('selected applicant ', event.detail.value);
        this.accountId = event.detail.value.split('_')[0];
        this.loanAppId = event.detail.value.split('_')[1];
        this.getSectionPageContent(event.detail.value);
    }

    handleValueChange(event) {
        console.log('changedFromChild ### ', JSON.stringify(event.detail));
    }

    getCkycRecordDetails() {
        this.isCkycDataArrived = false;
        console.log('::: allLoanApplicant ::: ', JSON.stringify(this.applicationId));
        getCkycDataTable({ recordId: this.applicationId, metaDataName: 'Agreement_CKYC', tabName : 'CKYC' })
            .then(result => {
                console.log('##res', result);
                this.tableData = result;
                this.isCkycDataArrived = true;
                console.log('Tabledata', JSON.stringify(this.tableData));
            })
            .catch(error => {
                console.log('Error', error);
            })
    }

    handleSave() {
        this.isSpinnerActive = true;
        var data = this.template.querySelector("c-generic-edit-pages-l-w-c").handleOnSave();
        console.log('data #### ', JSON.stringify(data));
        if (data.length > 0) {
            for (var i = 0; i < data.length; i++) {
                if (data[i].sobjectType == "Loan_Applicant__c") {
                    data[i].Id = this.loanAppId;
                }
                else
                    data[i].Id = this.accountId;
                saveRecord({ dataToInsert: JSON.stringify(data[i]) })
                    .then(result => {
                        console.log('result ', result);
                        this.fieldsContent = {};
                        this.isSpinnerActive = false;
                        this.showToast('Success', 'Success', 'Record Saved Successfully!!');
                        this.showCkyc = false;
                        this.getCkycRecordDetails();
                        const checkCKYC = new CustomEvent("checkckyc", {
                            detail: true
                        });
                        console.log('dispatch checkCKYC  ', checkCKYC);
                        this.dispatchEvent(checkCKYC);
                    })
                    .catch(error => {
                        this.isSpinnerActive = false;
                        console.log(error);
                        this.showToast('Error', 'Error', JSON.stringify(error));
                    });
            }
        } else {
            this.isSpinnerActive = false;
            this.showToast('Error', 'Error', 'Complete Required Field(s).');
        }
    }

    handleSelectedLoanApplicant(event){
        console.log('on selected applicant ', event);
        var recordData = event.detail.recordData;
        console.log('recordData ', recordData);
        this.loanAppId = recordData.Id;
        this.accountId = recordData.Customer_Information__c;
        if (event.detail.ActionName === 'delete') {
            console.log('Delete Called ');
            this.showDeletePopup = true;
        }
        if (event.detail.ActionName === 'edit') {
            console.log('Edit Called ');
            this.getSectionPageContent(this.accountId+'_'+this.loanAppId);
        }
    }

    handleCancel() {
        this.showCkyc = false;
        console.log('handle cancel called ###');
        this.fieldsContent = {};
        this.getAllApplicant();
    }

    handlemodalactions(event) {
        this.showDeletePopup = false;
        if (event.detail === true){
             this.getCkycRecordDetails();
             this.getAllApplicant();
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

}