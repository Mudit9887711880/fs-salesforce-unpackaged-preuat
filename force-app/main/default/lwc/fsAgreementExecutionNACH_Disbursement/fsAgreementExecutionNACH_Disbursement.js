import { LightningElement, api, track } from 'lwc';
import getApplicants from '@salesforce/apex/AgreementExecutionController.getApplicants';
import getBankDataTable from '@salesforce/apex/AgreementExecutionController.getAgDataTable';
import getEditPageContent from '@salesforce/apex/AgreementExecutionController.getEditPageContent';
import getNACHApplicants from '@salesforce/apex/AgreementExecutionController.getNACHApplicants';
import getBankIFSCDetails from '@salesforce/apex/DatabaseUtililty.getBankIFSCDetails';
import saveRecord from '@salesforce/apex/AgreementExecutionController.saveRecord';
import callPennyDropAPI from '@salesforce/apex/PennyDropAPI.callPennyDropAPI';
import callEmandateBankListAPI from '@salesforce/apex/EmandateBankListAPI.callEmandateBankListAPI';
import callEmandateRegistrationAPI from '@salesforce/apex/EmandateRegistrationAPI.callEmandateRegistrationAPI';
import callEmandateStatusAPI from '@salesforce/apex/EmandateStatusAPI.callEmandateStatusAPI';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class FsAgreementExecutionNACH_Disbursement extends NavigationMixin(LightningElement) {

    @api applicationId;
    @api initiateFrom;

    @track applicantValue;
    @track applicantOptions = [];
    @track fieldsContent;
    @track showNach = false;
    @track isSpinnerActive = false;
    @track isNachDataArrived = false;
    @track loanAppId;
    @track tableData = [];
    @track IFSCData;
    @track isNachVerification = false;
    @track nachData = [];
    @track objectIdMap = { 'Bank_Detail': '' };
    @track bankDetailId;
    @track isRecordEdit = false;
    @track mapData = [];
    @track isBankDetailChanged = false;
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
                iconName: 'utility:cases',
                title: 'Verify Account',
                variant: 'border-filled',
                alternativeText: 'Verify Account',
                name: 'verify'
            }
        }
    ];
    @track eNachRowAction = [
        {
            type: 'button-icon',
            fixedWidth: 50,
            typeAttributes: {
                iconName: 'utility:help_doc_ext',
                title: 'Verify Bank',
                variant: 'border-filled',
                alternativeText: 'Verify Bank',
                name: 'verify_bank'
            }
        },
        {
            type: 'button-icon',
            fixedWidth: 50,
            typeAttributes: {
                iconName: 'utility:offline_cached',
                title: 'Offline NACH',
                variant: 'border-filled',
                alternativeText: 'Verify Account',
                name: 'offline'
            }
        },
    ];

    connectedCallback() {
        console.log('initiateFrom ', this.initiateFrom);
        if (this.initiateFrom != 'Agreement_Execution') {
            setTimeout(() => {
                this.eNachRowAction.splice(0, 0, {
                    //label: 'Edit',
                    type: 'button-icon',
                    fixedWidth: 50,
                    typeAttributes: {
                        iconName: 'utility:contract_alt',
                        title: 'Repayment',
                        variant: 'border-filled',
                        alternativeText: 'Repayment',
                        name: 'repayment'
                    }
                })
                //this.rowAction.push()
            }, 200);
        }
        this.getAllApplicant();
    }

    @api getAllApplicant() {
        getNACHApplicants({ applicationId: this.applicationId })
            .then(result => {
                console.log('resultData ', result);
                if (result) {
                    for (let key in result) {
                        this.mapData = [...this.mapData, { value: key, label: result[key] }]
                    }
                } else if (error) {
                    console.log(error);
                }
                console.log('mapData ', this.mapData);
            })
    }

    handleSelectedApplicant(event) {
        console.log('label ', event.target.options.find(opt => opt.value === event.detail.value).label);
        console.log('selected applicant ', event.detail.value);
        this.loanAppId = event.detail.value;
        this.isNachDataArrived = true;
        this.getBankRecordDetails();
        this.isNachVerification = false;
        //For Disbursal Screen
        var appWrap = { label: '', value: '' };
        appWrap.label = event.target.options.find(opt => opt.value === event.detail.value).label;
        appWrap.value = event.detail.value;
        const getSelectedApplicant = new CustomEvent("getselectedapplicant", {
            detail: appWrap,
            bubbles: true,
            composed: true
        });
        console.log(getSelectedApplicant);
        this.dispatchEvent(getSelectedApplicant);
    }

    getBankRecordDetails() {
        this.isSpinnerActive = true;
        this.isNachDataArrived = false;
        this.tableData = [];
        console.log('::: allLoanApplicant ::: ', JSON.stringify(this.loanAppId));
        getBankDataTable({ recordId: this.loanAppId, metaDataName: 'Agreement_Nach_Disbursement', tabName: 'NACH' })
            .then(result => {
                console.log('##res', result);
                console.log((JSON.parse(result.strDataTableData)).length);
                if ((JSON.parse(result.strDataTableData)).length > 0) {
                    this.tableData = result;
                    this.isNachDataArrived = true;
                    console.log('Tabledata', JSON.stringify(this.tableData));
                    this.isSpinnerActive = false;
                    this.showNach = false;
                }
                else {
                    this.isSpinnerActive = false;
                    this.showNach = true;
                    this.getSectionPageContent('');
                }
            })
            .catch(error => {
                console.log('Error', error);
                this.isSpinnerActive = false;
            })
    }

    //For Table 1 Action Buttons
    handleSelectedBank(event) {
        console.log('on selected applicant ', event);
        var recordData = event.detail.recordData;
        console.log('recordData ', recordData);
        console.log('acNo ', recordData.Account_Number__c.length);
        this.bankDetailId = recordData.Id;
        if (event.detail.ActionName === 'edit') {
            this.isRecordEdit = true;
            this.getSectionPageContent(recordData.Id);
        }
        if (event.detail.ActionName === 'verify') {
            console.log('Inside acNo', recordData.Is_Account_Verified__c);
            if (recordData.Account_Number__c.length === 0) {
                this.showToast('Error', 'Error', 'Account Number Does Not Exist!!');
                return;
            }
            else if (recordData.Is_Account_Verified__c === true) {
                this.showToast('Error', 'Error', 'Account Already Verified!!');
                return;
            }
            callPennyDropAPI({ BankDetailId: this.bankDetailId }).then(result => {
                this.getBankRecordDetails();
                this.showToast('Success', 'Success', 'Account Verified Successfully!!');
            })

        }
    }

    //For Radio Button Selection
    handleSelectedNach(event) {
        console.log('row selected ', event.detail);
        if (event.detail[0].Is_Account_Verified__c === false) {
            this.showToast('Error', 'Error', 'Account Not Verified!!');
            return;
        }
        this.nachData = this.tableData;
        this.nachData.showCheckboxes = false;
        this.nachData.treatCheckboxesAsRadio = false;
        this.nachData.showSearch = false;
        let tempArray = [event.detail[0]];
        this.nachData.strDataTableData = JSON.stringify(tempArray);
        console.log('nachData ', this.nachData);
        this.isNachVerification = true;
    }

    //For Table 2 Action Buttons
    handleSelectedNACHReg(event) {
        var bankId = event.detail.recordData.Id;
        if (event.detail.ActionName === 'verify_bank') {
            callEmandateBankListAPI({ BankDetailId: bankId })
                .then(result => {
                    console.log('res ', result);
                    if (result == true) {
                        this.isSpinnerActive = true;
                        this.isNachVerification = false;
                        console.log('Inside bank verification');
                        setTimeout(() => {
                            if (this.eNachRowAction.length == 2) {
                                this.eNachRowAction.splice(1, 0, {
                                    type: 'button-icon',
                                    fixedWidth: 50,
                                    typeAttributes: {
                                        iconName: 'utility:omni_channel',
                                        title: 'Online NACH',
                                        variant: 'border-filled',
                                        alternativeText: 'Online NACH',
                                        name: 'online'
                                    }
                                });
                            }
                            this.isNachVerification = true;
                            this.isSpinnerActive = false;
                            this.showToast('Success', 'Success', 'Bank Verified For E-Mandate!!');
                        }, 200);
                    }
                    else {
                        this.showToast('Error', 'Error', 'Bank Does Not Supports E-Mandate!!');
                    }
                })
                .catch(error => {
                    this.showToast('Error', 'Error', 'Bank Verification Failed For E-Mandate!!');
                    console.log('verify bank failed ', error);
                })
        }
        if (event.detail.ActionName === 'online') {
            callEmandateRegistrationAPI({  BankDetailId: bankId})
                .then(result => {
                    console.log('url res ', result);
                    if (result) {
                        this[NavigationMixin.Navigate]({
                            "type": "standard__webPage",
                            "attributes": {
                                "url": result
                            }
                        });
                        this.isSpinnerActive = true;
                        this.isNachVerification = false;
                        setTimeout(() => {
                            if (this.eNachRowAction.length == 3) {
                                this.eNachRowAction.splice(3, 0, {
                                    type: 'button-icon',
                                    fixedWidth: 50,
                                    typeAttributes: {
                                        iconName: 'utility:help',
                                        title: 'Check NACH Status',
                                        variant: 'border-filled',
                                        alternativeText: 'Check NACH Status',
                                        name: 'nach_status'
                                    }
                                });
                            }
                            this.isNachVerification = true;
                            this.isSpinnerActive = false;
                        },300);
                    }
                })
                .catch(error => {
                    console.log('url error ', error);
                })
        }
        if (event.detail.ActionName === 'offline') {
            this[NavigationMixin.GenerateUrl]({
                type: 'standard__webPage',
                attributes: {
                    url: '/apex/OfflineNachFormVf?id=' + bankId
                }
            }).then(generatedUrl => {
                window.open(generatedUrl);
            });
        }
        if (event.detail.ActionName === 'nach_status') {
            callEmandateStatusAPI({BankDetailId: bankId})
            .then(result =>{
                console.log('status ',result);
                this.showToast('Status','Success',result);
            })
            .catch(error =>{
                console.log('getstatus error ',error);
            })
        }
        //For Disbursal Screen
        if (event.detail.ActionName === 'repayment') {
            const getNachBankRow = new CustomEvent("getnachbankdetails", {
                detail: event.detail,
                bubbles: true,
                composed: true
            });
            console.log(getNachBankRow);
            this.dispatchEvent(getNachBankRow);
        }
    }

    getSectionPageContent(recId) {
        this.isSpinnerActive = true;
        this.showNach = false;
        try {
            getEditPageContent({ recordIds: recId, metaDetaName: 'Agreement_Bank_Detail' })
                .then(result => {
                    console.log('data ### ', JSON.parse(result.data));
                    this.fieldsContent = result.data;
                    this.isSpinnerActive = false;
                    this.showNach = true;
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

    async handleValueChange(event) {
        console.log('changedFromChild ### ', JSON.stringify(event.detail));
        var details = event.detail;
        //this.IFSCData = {};
        if (this.isRecordEdit) {
            if (details.CurrentFieldAPIName === 'Bank_Detail__c-MS_IFSC_Code__c' || details.CurrentFieldAPIName === 'Bank_Detail__c-Account_Number__c') {
                this.isBankDetailChanged = true;
            }
        }
        if (details.CurrentFieldAPIName === 'Bank_Detail__c-MS_IFSC_Code__c' && details.CurrentFieldValue !== true) {
            await getBankIFSCDetails({ masterId: details.CurrentFieldValue })
                .then(result => {
                    console.log('### result ### ', result);
                    this.IFSCData = result;
                    this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setIFSCDetails('Name', result.Bank_Name__c)));
                    this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setIFSCDetails('Branch_Name__c', result.Bank_Branch_Name__c)));
                })
                .catch(error => {

                })
        } else if (details.CurrentFieldAPIName === 'Bank_Detail__c-MS_IFSC_Code__c') {
            this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setIFSCDetails('Name', '')));
            this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setIFSCDetails('Branch_Name__c', '')));
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

    async handleSave() {
        this.isSpinnerActive = true;
        var data = this.template.querySelector("c-generic-edit-pages-l-w-c").handleOnSave();
        console.log('data #### ', JSON.stringify(data));
        if (data.length > 0) {
            for (var i = 0; i < data.length; i++) {
                if (this.isRecordEdit){
                    console.log('isEdit ',this.isRecordEdit+' && ',this.isBankDetailChanged);
                    data[i].Id = this.bankDetailId;
                    if(this.isBankDetailChanged)
                    data[i].Is_Account_Verified__c = false;
                }
                else {
                    data[i].Is_Account_Verified__c = false;
                    data[i].Loan_Applicant__c = this.loanAppId;
                    data[i].Application__c = this.applicationId;
                }
                console.log('IFSC DATA ',this.IFSCData);
                data[i].Application__c = this.applicationId;
                if(this.IFSCData){
                    data[i].Name = this.IFSCData.Bank_Name__c;
                data[i].Branch_Name__c = this.IFSCData.Bank_Branch_Name__c;
                }
                await saveRecord({ dataToInsert: JSON.stringify(data[i])})
                    .then(result => {
                        console.log('result ', result);
                        this.fieldsContent = {};
                        this.isSpinnerActive = false;
                        this.showToast('Success', 'Success', 'Record Saved Successfully!!');
                        this.showNach = false;
                        this.isNachDataArrived = false;
                        this.isNachVerification = false;
                        this.getBankRecordDetails();
                        this.isRecordEdit = false;
                        this.isBankDetailChanged = false;
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

    handleCancel(event) {
        this.showNach = false;
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