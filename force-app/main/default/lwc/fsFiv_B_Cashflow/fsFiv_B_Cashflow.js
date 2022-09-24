import { LightningElement, api, track } from 'lwc';
import saveRecord from '@salesforce/apex/FSFivBLwcController.saveRecord';
import getCashflowData from '@salesforce/apex/FSFivBLwcController.getCashflowData';
import { deleteRecord } from 'lightning/uiRecordApi';
import getAllApplicantMeta from '@salesforce/apex/FSFivBLwcController.getAllApplicantMeta';
import getSectionContent from '@salesforce/apex/FSFivBLwcController.getSectionContent';
export default class fsFiv_B_Cashflow extends LightningElement {
    @api allLoanApplicant;
    @api rowAction;
    @api applicationId;
    @track isSpinnerActive = true;
    @track tableData;
    @track fieldsContent;
    @track objectIdMap = { 'Cashflow__c': '' };
    @track recordIds;
    @track showDeleteModal = false;
    @track recordIdForDelete;
    @track isApplicantEdit = true;
    @track selectedApplicant;
    @api allApplicantData;
    @track showDeletePopup = false;
    @api verificationStatus;
    connectedCallback() {
        this.getCashflowData();
        this.verificationStatus == 'Completed' ? true : false;
    }

    getCashflowData() {
        console.log('called ##### ', JSON.stringify(this.allLoanApplicant));
        getCashflowData({ allLoanApplicant: this.allLoanApplicant })
            .then(result => {
                console.log('result ##### ', JSON.stringify(result));
                this.isApplicantEdit = true;
                this.tableData = result;
                this.isSpinnerActive = false;
            })
            .catch(error => {

            })
    }
    getSectionPageContent(recId) {
        this.isSpinnerActive = true;
        getSectionContent({ recordIds: recId, metaDetaName: 'Fs_FIV_B_Cashflow' })
            .then(result => {
                this.fieldsContent = result.data;
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
            this.objectIdMap['Cashflow__c'] = this.recordIds
            this.getSectionPageContent(this.recordIds);
            this.isSpinnerActive = false;
        }
        if (event.detail.ActionName === 'delete') {
            this.recordIdForDelete = event.detail.recordData.Id;
            //this.showDeleteModal = true;
            console.log('Delete Called ');
            this.showDeletePopup = true;
        }
    }
    changedFromChild(event) {
        var tempFieldsContent = event.detail;
        if (tempFieldsContent.CurrentFieldAPIName == 'Cashflow__c-Gross_Income__c' || tempFieldsContent.CurrentFieldAPIName == 'Cashflow__c-Obligations__c') {
            var totalNetIncome = Number(tempFieldsContent.previousData['Cashflow__c-Gross_Income__c']) - Number(tempFieldsContent.previousData['Cashflow__c-Obligations__c']);
            console.log('totalNetIncome ### ', totalNetIncome);
            this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setValues('Net_Income__c', totalNetIncome)));
        }
    }
    handleSave() {
        var data = this.template.querySelector("c-generic-edit-pages-l-w-c").handleOnSave();
        console.log('data #### ', JSON.stringify(data));
        if (data.length > 0) {
            this.isSpinnerActive = true;
            for (var i = 0; i < data.length; i++) {
                if (this.selectedApplicant === undefined) {
                    data[i].Id = this.objectIdMap[data[i].sobjectType];
                } else {
                    data[i].Customer_Information__c = this.selectedApplicant[0].Customer_Information__c;
                    data[i].Loan_Applicant__c = this.selectedApplicant[0].Id;
                    data[i].Application__c = this.applicationId;
                }
                data[i].Is_Fiv_B_Completed__c = true;
                console.log('data 2## ', JSON.stringify(data));
                saveRecord({ dataToInsert: JSON.stringify(data[i]) })
                    .then(result => {
                        this.fieldsContent = undefined;
                        this.showtoastmessage('Success', 'Success', result);
                        this.tableData = undefined;
                        this.selectedApplicant = undefined;
                        this.allApplicantData = undefined;
                        this.getCashflowData();
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
    handleDelete(event) {
        this.isSpinnerActive = true;
        let label = event.target.label;
        if (label == 'Yes') {
            this.showDeleteModal = false;
            deleteRecord(this.recordIdForDelete)
                .then(() => {
                    this.tableData = undefined;
                    this.getCashflowData();
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
    handlemodalactions(event) {
        this.showDeletePopup = false;
        if (event.detail === true) {
            this.tableData = undefined;
            this.getCashflowData();
        }
    }
    handleRadtioButton(event) {
        this.getSectionPageContent();
        this.selectedApplicant = event.detail;
        console.log('event #### ', JSON.stringify(event.detail));
    }
    getAllApplicantMeta() {
        getAllApplicantMeta({ applicationId: this.applicationId })
            .then(result => {
                this.allApplicantData = result;
                this.isSpinnerActive = false;
            })
            .catch(error => {

            })
    }
    setValues(_fieldAPIName, _val) {
        var _tempVar = JSON.parse(this.fieldsContent);
        for (var i = 0; i < _tempVar[0].fieldsContent.length; i++) {
            if (_tempVar[0].fieldsContent[i].fieldAPIName === _fieldAPIName) {
                if (_tempVar[0].fieldsContent[i].isCheckbox) {
                    _tempVar[0].fieldsContent[i].checkboxVal = Boolean(_val);
                } else {
                    _tempVar[0].fieldsContent[i].value = _val;
                }
            }
        }
        console.log('_tempVar #### ', _tempVar);
        //this.fieldsContent[0].fieldsContent = _tempVar;
        return _tempVar;
    }

    @api
    getTotalIncome() {
        var TNI = 0;
        if (this.tableData && this.tableData.strDataTableData) {
            var data = JSON.parse(this.tableData.strDataTableData);
            data.forEach(element => {
                if (element.Net_Income__c !== undefined) {
                    TNI += Number(element.Net_Income__c);
                }
            });
            console.log('TNI #### ', TNI);
        }
        return TNI;
    }
    @api
    getDBR() {
        var obligation = 0;
        var totalNetIncome = 0;
        if (this.tableData && this.tableData.strDataTableData) {
            var data = JSON.parse(this.tableData.strDataTableData);
            data.forEach(currentItem => {
                if (currentItem.Obligations__c != undefined) {
                    obligation += Number(currentItem.Obligations__c);
                }
                if (currentItem.Gross_Income__c != undefined) {
                    totalNetIncome += Number(currentItem.Gross_Income__c);
                }
                console.log('Current Item ', currentItem);
            });
        }
        return totalNetIncome > 0 && obligation > 0 ? ((obligation / totalNetIncome) * 100).toFixed(2) + '%' : 0;
    }
}