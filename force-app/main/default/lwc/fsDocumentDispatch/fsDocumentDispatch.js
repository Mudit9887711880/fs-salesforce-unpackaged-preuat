import { LightningElement, track, api } from 'lwc';
import getBranch from '@salesforce/apex/FsDocumentDisptachCtrl.getBranch';
import createRecords from '@salesforce/apex/FsDocumentDisptachCtrl.createRecords';
import getLastLoginDate from '@salesforce/apex/DatabaseUtililty.getLastLoginDate';
import getApplicationsWithDate from '@salesforce/apex/FsDocumentDisptachCtrl.getApplicationsWithDate';
import getApplicationsWithoutDate from '@salesforce/apex/FsDocumentDisptachCtrl.getApplicationsWithoutDate';
import getExistingRecord from '@salesforce/apex/FsDocumentDisptachCtrl.getExistingRecord';
import updateCourierApplications from '@salesforce/apex/FsDocumentDisptachCtrl.updateCourierApplications';
import BusinessDate from '@salesforce/label/c.Business_Date';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
export default class FsApplicationBetweenDates extends NavigationMixin(LightningElement) {
    @api recordId;
    @track buttonLabel = 'Save';
    @track options = [];
    @track isButtonDisabled = false;
    @track isInputsCorrect = false;
    @track fromDate;
    @track toDate;
    @track applications;
    @track applicationName;
    @track totalRecommendadAmount;
    @track todaysDate = BusinessDate;
    @track lastLoginDate;
    @track isSpinner = true;
    @track showModel = false;
    @track count = 0;
    @track applicationId = [];
    @track selectedApplication = [];
    @track isRequired = false;
    @track courierAgencyAvailable = false;
    @track isShowSpinner = true;
    @track isRecordCreated = false;
    @track isGenerate = false;
    @track isChecked;
    @track currentDate;
    @track showModal = false;
    @track numberofSelecetdApplication;
    @track isSaveButtoDisable;
    @track selectedBranchInTable;
    @track icoName;
    @track selectedAgency=[];

    // This object is to track the updated value of the object
    @track temporaryObject = {
        Address__c: undefined,
        Courier_POD_No: undefined,
        Courier_Agency: undefined,
        NoOfApp: undefined,
    };

    @track wrpObj = {
        Id: undefined,
        Address__c: undefined,
        Branch__c: undefined,
        Courier_Agency__c: undefined,
        Courier_POD_No__c: undefined,
        From_Date__c: undefined,
        To_Date__c: undefined,
        Branch_Name__c: undefined
    };
    connectedCallback() {
        //window.location.reload();
        this.initiateData();
    }
    initiateData() {
        this.currentDate = new Date().toISOString();
        console.log('this.recordId= ', this.recordId);
        if (this.recordId) {
            this.getExistingRecordOnEdit();
        }
        this.handleGetLastLoginDate();
        this.getAllBranch();
    }
    getExistingRecordOnEdit() {
        this.isSaveButtoDisable = true;
        this.isInputsCorrect = true;
        this.buttonLabel = 'Update';
        this.selectedAgency = [];
        getExistingRecord({ recordId: this.recordId }).then((result) => {
            console.log('getExistingRecord= ', result);
            this.courierAgencyAvailable = true;
            if (result) {
                this.wrpObj = JSON.parse(JSON.stringify(result));
                this.selectedApplication = [];
                result.Courier_Applications__r.forEach(currentItem => {
                    this.selectedApplication.push(currentItem.Application__c);
                });
                this.handleClick();
                this.isGenerate = true;
                this.temporaryObject.NoOfApp = this.selectedApplication.length;
                this.temporaryObject.Address__c = this.wrpObj.Address__c;
                this.temporaryObject.Courier_Agency = this.wrpObj.Courier_Agency__c;
                this.temporaryObject.Courier_POD_No = this.wrpObj.Courier_POD_No__c;
                this.numberofSelecetdApplication = this.selectedApplication.length;
                this.isRecordCreated = true;
            }
        }).catch((err) => {
            console.log('Error in getExistingRecord= ', err);
        });
    }
    getAllBranch() {
        getBranch()
            .then(result => {
                if (result.length > 0) {
                    const option = {
                        label: 'All',
                        value: 'All'
                    };
                    this.options = [...this.options, option];
                }
                var i;
                for (i = 0; i < result.length; i++) {
                    const option = {
                        label: result[i].Name,
                        value: result[i].Id
                    };
                    this.options = [...this.options, option];
                    this.wrpObj.Address__c = result[i].HO_HUB__r.Branch_Address_Line_1__c;
                }
            })
            .catch(error => {
                this.error = error;
            });
    }
    handleFormValues(event) {
        if (event.target.name) {
            this.wrpObj[event.target.name] = event.target.value;
        }
        if (this.recordId) {
            if (this.temporaryObject.Courier_POD_No != this.wrpObj.Courier_POD_No__c || this.temporaryObject.Address__c != this.wrpObj.Address__c || this.temporaryObject.Courier_Agency != this.wrpObj.Courier_Agency__c || this.temporaryObject.NoOfApp != this.numberofSelecetdApplication) {
                this.isSaveButtoDisable = false;
                this.isButtonDisabled = true;
            }
            else {
                this.isSaveButtoDisable = true;
                this.isButtonDisabled = false;
            }
        }
    }
    handleClick() {
        this.showModel = false;
        this.isRecordCreated = false;
        this.isGenerate = false;
        if (!this.recordId) {
            this.checkValidity();
        }
        if (this.isInputsCorrect) {
            this.isSpinner = false;
            var today = new Date().toJSON().slice(0, 10);
            if (JSON.stringify(today) < JSON.stringify(this.wrpObj.To_Date__c) && this.wrpObj.To_Date__c && this.wrpObj.From_Date__c) {
                this.isSpinner = true;
                this.applications = null;
            }
            else {
                this.getApplications();
            }
        }
    }
    handleCourierSheet(event) {
        var chechBoxs = this.template.querySelectorAll('lightning-input');
        chechBoxs.forEach(item => {
            if (item.type == 'checkbox' && item.checked == true) {
                this.count++;
                this.applicationId.push(item.name);
            }
        });
        if (this.count > 0) {
            this.showModel = true;
        }
        else {
            this.showModel = false;
            this.showToast('Error', 'Select At  least One Application', 'Error');
        }
    }
    checkValidity() {
        this.isInputsCorrect = [...this.template.querySelectorAll('lightning-combobox')]
            .reduce((validSoFar, inputField) => {
                inputField.reportValidity();
                return validSoFar && inputField.checkValidity();
            }, true);
    }
    requiredFields() {
        this.isRequired = [...this.template.querySelectorAll('lightning-input')]
            .reduce((validSoFar, inputField) => {
                inputField.reportValidity();
                return validSoFar && inputField.checkValidity();
            }, true);
    }
    handleGetLastLoginDate() {
        getLastLoginDate().then((result) => {
            console.log('getLastLoginDate= ', result);
            this.lastLoginDate = result
        }).catch((err) => {
            console.log('Error in getLastLoginDate= ', err);
        });
    }
    handleSave() {
        this.requiredFields();
        if (this.isRequired) {
            if (this.wrpObj.Courier_Agency__c && this.courierAgencyAvailable) {
                this.applicationId = [];
                var chechBoxs = this.template.querySelectorAll('lightning-input');
                chechBoxs.forEach(item => {
                    if (item.type == 'checkbox' && item.checked == true) {
                        this.count++;
                        this.applicationId.push(item.name);
                    }
                });
                this.selectedApplication = this.applicationId;
                this.getSelectedBranchs();
                this.wrpObj.Branch_Name__c = [...this.selectedBranchInTable].join(',');
                this.isShowSpinner = false;
                var tempCourierObject = {
                    Id: this.wrpObj.Id,
                    Address__c: this.wrpObj.Address__c,
                    Branch__c: this.wrpObj.Branch__c,
                    Courier_Agency__c: this.wrpObj.Courier_Agency__c,
                    Courier_POD_No__c: this.wrpObj.Courier_POD_No__c,
                    From_Date__c: this.wrpObj.From_Date__c,
                    To_Date__c: this.wrpObj.To_Date__c,
                    Branch_Name__c: this.wrpObj.Branch_Name__c,
                };
                createRecords({ wrpObject: JSON.stringify(tempCourierObject), applicationIds: this.selectedApplication })
                    .then(result => {
                        this.buttonLabel = 'Update';
                        this.isGenerate = true;
                        this.showToast('Success', 'Records are saved successfully', 'success');
                        this.isShowSpinner = true;
                        this.recordId = result;
                        this.isButtonDisabled = false;
                        this.isSaveButtoDisable = true;
                        this.initiateData();
                        this.isRecordCreated = true;
                    })
                    .catch(error => {
                        this.showToast('Error', error, 'error');
                        console.log('Error', error);
                        this.isShowSpinner = true;
                    });
            }
            else {
                this.showToast('Error', 'please fill the Courier Agency', 'error');
            }
        }
    }
    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(event);
    }
    getApplications() {
        if (this.wrpObj.From_Date__c && this.wrpObj.To_Date__c) {
            getApplicationsWithDate({
                branchId: this.wrpObj.Branch__c,
                fromDate: this.wrpObj.From_Date__c,
                toDate: this.wrpObj.To_Date__c
            }).then(result => {
                this.applications = result;
                if (this.selectedApplication && this.selectedApplication.length) {
                    this.checkedAllTheBox();
                    this.handleCourierSheet();
                }
                this.isSpinner = true;
            }).catch(error => {
                this.isSpinner = true;
                this.showToast('Error', error.Body, 'error');
            });
        }
        else {
            getApplicationsWithoutDate({ branchId: this.wrpObj.Branch__c })
                .then(result => {
                    this.applications = result;
                    if (this.selectedApplication && this.selectedApplication.length) {
                        this.checkedAllTheBox();
                        this.handleCourierSheet();
                    }
                    this.isSpinner = true;
                })
                .catch(error => {
                    this.isSpinner = true;
                });
        }
    }

    generatePDF() {
        if (this.isRecordCreated == false) {
            this.showToast('Warning', 'First create record for Courier Control and Courier Application', 'Warning');
        }
        else {
            this[NavigationMixin.GenerateUrl]({
                type: 'standard__webPage',
                attributes: {
                    url: '/apex/courierControlSheetVf?recordId=' + this.recordId
                }
            }).then(generatedUrl => {
                window.open(generatedUrl);
            });
            updateCourierApplications({ courierControlId: this.recordId })
                .then(result => {
                    console.log('Updated');
                })
                .catch(error => {
                    console.log('Error', error);
                })
            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: this.recordId,
                    objectApiName: 'Courier_Control__c',
                    actionName: 'view'
                }
            });
        }
    }
    checkedAllTheBox() {
        let tempArr = JSON.parse(JSON.stringify(this.applications))
        tempArr.forEach(currentItem => {
            if (this.selectedApplication.includes(currentItem.Id)) {
                currentItem.checked = true;
                this.count++;
            } else {
                currentItem.checked = false;
            }
        });
        this.applications = JSON.parse(JSON.stringify(tempArr));
    }
    handleChnageonUpdate(event) {
        this.numberofSelecetdApplication = 0;
        if (this.recordId) {
            let selectedRow = this.template.querySelectorAll('lightning-input');
            selectedRow.forEach(currentItem => {
                if (currentItem.type == 'checkbox' && currentItem.checked) {
                    this.numberofSelecetdApplication++;
                }
            });
            if (this.temporaryObject.Courier_POD_No != this.wrpObj.Courier_POD_No__c || this.temporaryObject.Address__c != this.wrpObj.Address__c || this.temporaryObject.Courier_Agency != this.wrpObj.Courier_Agency__c || this.temporaryObject.NoOfApp != this.numberofSelecetdApplication) {
                this.isSaveButtoDisable = false;
                this.isButtonDisabled = true;
            }
            else {
                this.isSaveButtoDisable = true;
                this.isButtonDisabled = false;
            }
        }
    }

    handleClickNo() {
        this.showModal = undefined;
        this.showModal = false;
    }

    handleClickYes() {
        this.generatePDF();
    }

    showConfirmationModal() {
        console.log('showModal:', this.showModal);
        this.showModal = undefined;
        console.log('showModal:', this.showModal);
        this.showModal = true;
        console.log('showModal:', this.showModal);
    }

    getSelectedBranchs() {
        this.selectedBranchInTable = new Set();
        var selectedCheckBox = this.template.querySelectorAll('lightning-input');
        selectedCheckBox.forEach(currentItem => {
            if (currentItem.type == 'checkbox' && currentItem.checked) {
                this.selectedBranchInTable.add(this.applications[currentItem.dataset.index].sourcingBranch);
            }
        });
        console.log('SELECTED BRANCH NAME', this.selectedBranchInTable);
    }

    handleSelect(event) {
        if (event.detail.length>0) {
            this.wrpObj.Courier_Agency__c = event.detail[0].id;
            console.log('Courier Agency', this.wrpObj.Courier_Agency__c);
            if (this.wrpObj.Courier_Agency__c) {
                this.courierAgencyAvailable = true;
            }
            if (!this.wrpObj.Courier_Agency__c) {
                this.courierAgencyAvailable = false;
            }
        }
        else{
            this.wrpObj.Courier_Agency__c = undefined;
            this.courierAgencyAvailable = false;
        }
        if (this.recordId) {
            if (this.temporaryObject.Courier_POD_No != this.wrpObj.Courier_POD_No__c || this.temporaryObject.Address__c != this.wrpObj.Address__c || this.temporaryObject.Courier_Agency != this.wrpObj.Courier_Agency__c || this.temporaryObject.NoOfApp != this.numberofSelecetdApplication) {
                this.isSaveButtoDisable = false
                this.isButtonDisabled = true;
            }
            else {
                this.isSaveButtoDisable = true;
                this.isButtonDisabled = false;
            }
        }
    }
}