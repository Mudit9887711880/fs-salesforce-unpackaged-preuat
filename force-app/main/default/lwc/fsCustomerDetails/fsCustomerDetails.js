import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getAccData from '@salesforce/apex/FetchDataTableRecordsController.getAccData';
import kycAPICallout from '@salesforce/apex/KYCAPIController.kycAPICallout';
import { CloseActionScreenEvent } from 'lightning/actions';

export default class FsCustomerDetails extends LightningElement {

    @api customerTypeValue;
    @api verificationTypeValue;
    @api ocrTable;
    @api applicationId;
    @api preloginId;
    @api ownerTypeOption = [];
    @api loanAppWrapper = { accountId: '', loanAppId: '' };
    @api recordIds;
    @api loanAppId;
    @api accountId;
    @api loanAppIdList = [];
    @api loanData = [];
    @api recTypeName;

    @track submitWrapper = { hasPrimaryApplicant: '', isMobileVerified: '', isKYCVerified: '', isIncomeConsidered: '', mobDefList: '', kycDefList: '' }
    @track isAccDataArrived = false;
    @track showCustomerInfoForm = false;
    @track accData = [];
    @track showDeletePopup = false;
    @track showMobileVerification = false;
    @track hasPrimaryApplicant = false;
    @track isIncomeConsidered = false;
    @track countTrue = 0;
    @track countKYCTrue = 0;
    @track mobVerificationList = [];
    @track kycVerificationList = [];
    @track validMobile = false;
    @track validKYC = false;
    @track isSpinnerActive = false;
    @track accRowAction = [
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
        },
        {
            type: 'button-icon',
            fixedWidth: 50,
            typeAttributes: {
                iconName: 'utility:live_message',
                title: 'Verify Mobile',
                variant: 'border-filled',
                alternativeText: 'Verify Mobile',
                name: 'verify'
            }
        },
        {
            type: 'button-icon',
            fixedWidth: 50,
            typeAttributes: {
                iconName: 'utility:asset_audit',
                title: 'Validate KYC',
                variant: 'border-filled',
                alternativeText: 'Validate KYC',
                name: 'validate'
            }
        }
    ];

    connectedCallback() {
        console.log('fsCustomerDetailsCalled!!', this.applicationId);
        if (this.applicationId)
            this.getAccountData(this.applicationId);
    }

    @api getRecordType(recType){
        this.recTypeName = recType;
    }

    @api getAccountData(applicationId) {
        console.log('get Acc data called!!', applicationId);
        this.isAccDataArrived = false;
       
        getAccData({ applicationId: applicationId })
            .then(result => {
                var primaryAppName = '';
                this.ownerTypeOption = [];
                this.hasPrimaryApplicant = false;
                this.isIncomeConsidered = false;
                this.countTrue = 0;
                this.countKYCTrue = 0;
                this.mobVerificationList = [];
                this.kycVerificationList = [];
                this.validMobile = false;
                this.validKYC = false;
                console.log('getacc data in customer screen');
                console.log('json data ====> ' + JSON.stringify(result));
                this.accData = [];
                this.accData = result;
                this.isAccDataArrived = true;
                var temp = JSON.parse(result.strDataTableData);
                this.loanData = temp;
                if (this.template.querySelector('c-fs-loan-applicant-information'))
                    this.template.querySelector('c-fs-loan-applicant-information').getDataTableInfo(JSON.parse(result.strDataTableData));
                for (var i in temp) {
                    var dataResult = temp[i];
                    console.log('Loan App Id ', dataResult['Id']);
                    if (!this.loanAppIdList.includes(dataResult['Id'])) {
                        this.loanAppIdList.push(dataResult['Id']);
                    }
                    if (dataResult['Customer_Type__c'] === 'Primary Applicant') {
                        this.hasPrimaryApplicant = true;
                        primaryAppName = dataResult['Customer_Information__r_FirstName_LABEL'] + ' ' + dataResult['Customer_Information__r.LastName'];
                    }
                    if (dataResult['Income_Considered__c'] === 'Yes') {
                        this.isIncomeConsidered = true;
                    }
                    if (dataResult['Mobile_Verified__c'] === true) {
                        this.countTrue = this.countTrue + 1;
                    }
                    else {
                        var defName = dataResult['Customer_Information__r_FirstName_LABEL'] + ' ' + dataResult['Customer_Information__r.LastName'];
                        console.log('defName ', defName);
                        this.mobVerificationList.push(defName);
                    }
                    if (dataResult['Is_KYC_Verified__c'] === true) {
                        this.countKYCTrue = this.countKYCTrue + 1;
                    }
                    else {
                        var defKYCName = dataResult['Customer_Information__r_FirstName_LABEL'] + ' ' + dataResult['Customer_Information__r.LastName'];
                        console.log('defKYCName ', defKYCName);
                        this.kycVerificationList.push(defKYCName);
                    }
                    const applicants = {
                        label: dataResult['Customer_Information__r_FirstName_LABEL'] + ' ' + dataResult['Customer_Information__r.LastName'],
                        value: dataResult['Id'] + '_' + dataResult['Customer_Type__c']
                    };
                    this.ownerTypeOption = [...this.ownerTypeOption, applicants];
                    console.log('Applicant Values ', this.ownerTypeOption);
                }
                if (this.countTrue == temp.length) {
                    this.validMobile = true;
                }
                if (this.countKYCTrue == temp.length) {
                    this.validKYC = true;
                }
                var defList = this.mobVerificationList.join();
                var defKYCList = this.kycVerificationList.join();
                this.submitWrapper.hasPrimaryApplicant = this.hasPrimaryApplicant;
                this.submitWrapper.isMobileVerified = this.validMobile;
                this.submitWrapper.mobDefList = defList;
                this.submitWrapper.isIncomeConsidered = this.isIncomeConsidered;
                this.submitWrapper.isKYCVerified = this.validKYC;
                this.submitWrapper.kycDefList = defKYCList;
                const getprimaryappname = new CustomEvent("getprimaryapplicantname", {
                    detail: primaryAppName
                });
                console.log('dispatch event getprimaryappname ', getprimaryappname);
                this.dispatchEvent(getprimaryappname);
                const checkSubmit = new CustomEvent("checksubmit", {
                    detail: this.submitWrapper
                });
                console.log('dispatch event checkSubmit ', checkSubmit);
                this.dispatchEvent(checkSubmit);
                const ownerFillEvent = new CustomEvent("getowners", {
                    detail: this.loanAppIdList
                });
                console.log('dispatch event ownerFillEvent ', ownerFillEvent);
                this.dispatchEvent(ownerFillEvent);
                const propOwn = new CustomEvent("getownerstype", {
                    detail: this.ownerTypeOption
                });
                console.log('dispatch event ownerFillEvent ', propOwn);
                this.dispatchEvent(propOwn);
            })
            .catch(error => {
                console.log('Error In Get ACC Data ', error);
            })
    }

    handleSelectedApplicant(event) {
        console.log('on selected applicant ', event);
        console.log('Edit called #### ', JSON.stringify(event.detail));
        var recordData = event.detail.recordData;
        console.log('recordData ', recordData);
        this.loanAppId = recordData.Id;
        console.log('loanAppId ', this.loanAppId);
        this.accountId = recordData.Customer_Information__c;
        const isMobVerified = recordData.Mobile_Verified__c;
        const isKYCVerified = recordData.Is_KYC_Verified__c;
        if (event.detail.ActionName === 'edit') {
            this.showCustomerInfoForm = true;
            console.log('loan ', this.template.querySelector("c-fs-loan-applicant-information"));
            setTimeout(() => {
                if (this.template.querySelector("c-fs-loan-applicant-information")) {
                    console.log('in child functions');
                    this.recordIds = recordData.Customer_Information__c + '_' + recordData.Id;
                    console.log('recId ', this.recordIds);
                    this.customerTypeValue = recordData.Customer_Type__c;
                    this.loanAppWrapper.accountId = recordData.Customer_Information__c;
                    this.loanAppWrapper.loanAppId = recordData.Id;
                    this.template.querySelector("c-fs-loan-applicant-information").getRecordType(this.recTypeName);
                    this.template.querySelector("c-fs-loan-applicant-information").getSectionPageContent(this.recordIds);
                    this.template.querySelector("c-fs-loan-applicant-information").getIdsOnEdit(this.loanAppWrapper);
                    this.template.querySelector("c-fs-loan-applicant-information").getCustomerTypeOndit(recordData.Customer_Type__c);
                }
            }, 200);
        }
        else if (event.detail.ActionName === 'delete') {
            console.log('Delete Called ');
            this.showDeletePopup = true;
        }
        else if (event.detail.ActionName === 'verify') {
            console.log('Mob Verified :: ', isMobVerified);
            if (!isMobVerified) {
                this.isSpinnerActive = true;
                console.log('Verify Called ', recordData.Mobile__c);
                this.showMobileVerification = true;
                setTimeout(() => {
                    this.template.querySelector("c-fs-mobile-verification-l-w-c").sendMobOTP(this.loanAppId, recordData.Mobile__c);
                }, 200);
                this.isSpinnerActive = false;
            }
            else {
                this.showToast('Error', 'Error', 'Mobile Already Verified!!');
                //this.closee
            }
        }
        else if (event.detail.ActionName === 'validate') {
            if (isKYCVerified == false) {
                this.isSpinnerActive = true;
                kycAPICallout({ loanAppId: this.loanAppId })
                    .then(result => {
                        if (result != undefined && result != '' && result != null) {
                            if (result === 'Success') {
                                this.showToast('Success', 'Success', 'KYC Validate Sucessfully!!');
                                this.getAccountData(this.applicationId);
                            }
                            else {
                                this.showToast('Error', 'Error', 'KYC Validate Failed!!');
                            }
                        }
                        else {
                            this.showToast('Error', 'Error', 'KYC Validate Failed!!');
                        }
                        this.isSpinnerActive = false;
                    })
                    .catch(error => {
                        this.showToast('Error', 'Error', 'KYC Validate Failed!!');
                        this.isSpinnerActive = false;
                    })
            }
            else {
                this.showToast('Error', 'Error', 'KYC Already Verified!!');
            }
        }
    }


    handlemodalactions(event) {
        this.showDeletePopup = false;
        if (event.detail === true)
            this.getAccountData(this.applicationId);
    }

    /* Child Custom Event Handler */

    getAppName(event) {
        console.log('getAppName 5 ', event.detail);
        var sendAppName = new CustomEvent('getappname', {
            detail: event.detail
        });
        this.dispatchEvent(sendAppName);
    }

    handleApplicationId(event) {
        console.log('App Id Get EVENT ', event.detail);
        this.applicationId = event.detail;
        this.getAccountData(this.applicationId);
        var sendAppId = new CustomEvent('getapplicationid', {
            detail: this.applicationId
        });
        this.dispatchEvent(sendAppId);
    }

    handlePreloginId(event) {
        console.log('Prelogin Id Get EVENT ', event.detail);
        var sendPreloginId = new CustomEvent('getpreloginid', {
            detail: event.detail
        });
        this.dispatchEvent(sendPreloginId);
    }

    handleOCREvent(event) {
        console.log('OCR EVENT ', event.detail);
        this.showCustomerInfoForm = event.detail;
    }

    handleCustomerType(event) {
        console.log('Cus EVENT ', event.detail);
        this.customerTypeValue = event.detail;
    }

    handleVerificationValue(event) {
        console.log('Verification EVENT ', event.detail);
        this.verificationTypeValue = event.detail;
        if (this.verificationTypeValue === 'Self') {
            this.isSpinnerActive = false;
            setTimeout(() => {
                this.template.querySelector("c-fs-loan-applicant-information").getSectionPageContent('');
            }, 200);
        }
    }

    handleOCRTable(event) {
        console.log('OCR Table EVENT ', event.detail);
        this.ocrTable = event.detail;
        console.log('queryselector ', this.template.querySelector('c-fs-loan-applicant-information'));
        if (this.showCustomerInfoForm) {
            console.log('call child method');
            setTimeout(() => {
                this.template.querySelector("c-fs-loan-applicant-information").getOCRTableInfo(this.ocrTable);
            }, 200);
        }
    }

    getOCRDocs(event) {
        console.log('ocr docs ', event.detail);
        setTimeout(() => {
            this.template.querySelector("c-fs-loan-applicant-information").getOCRDocs(event.detail);
        }, 200);
    }

    hideOCRTable(event) {
        this.template.querySelector('c-fs-o-c-r').hideOcrTable(event.detail);
    }

    reloadDataTable(event) {
        if (event.detail) {
            this.isSpinnerActive = false;
            this.getAccountData(this.applicationId);
        }
    }

    refreshOCR(event) {
        if (event.detail) {
            this.template.querySelector('c-fs-o-c-r').handleRefreshOCR();
        }
    }

    showToastMessage(event) {
        console.log('event #### ', event.detail)
        const evt = new ShowToastEvent({
            title: event.detail.title,
            message: event.detail.message,
            variant: event.detail.variant
        });
        this.dispatchEvent(evt);
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