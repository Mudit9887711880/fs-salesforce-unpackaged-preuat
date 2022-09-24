import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
//------------------------------------------------------------------------------
import BusinessDate from '@salesforce/label/c.Business_Date';
import getLastLoginDate from '@salesforce/apex/DatabaseUtililty.getLastLoginDate';
//------------------------------------------------------------------------------
import getParentAndRelatedData from '@salesforce/apex/Fiv_Disb_LwcController.getParentAndRelatedData';
import allocateUser from '@salesforce/apex/Fiv_Disb_LwcController.allocateUser';
import updateApptStageFromDA from '@salesforce/apex/Fiv_Disb_LwcController.updateApptStageFromDA';
import chechExistDeviaitons from '@salesforce/apex/Fiv_Disb_LwcController.chechExistDeviaitons';
//import getRequiredDocuments from '@salesforce/apex/fsGenericUploadDocumentsController.getRequiredDocuments'; CH01
//------------------------------------------------------------------------------
import ID_FIELD from '@salesforce/schema/Application__c.Id';
import STAGE_FIELD from '@salesforce/schema/Application__c.Stage__c';
import Disbursal_Author_Decision_FIELD from '@salesforce/schema/Application__c.Disbursal_Author_Decision__c';
import Disbursal_Author_Decision_Remarks_FIELD from '@salesforce/schema/Application__c.Disbursal_Author_Decision_Remarks__c';
import { updateRecord } from 'lightning/uiRecordApi';
import { NavigationMixin } from 'lightning/navigation';
//------------------------------------------------------------------------------
//CH01 : Karan : 12-09-2022 : Commented as this comp is not ready as per Yogendra
export default class Fiv_Disb_Lwc extends NavigationMixin(LightningElement) {

    @api recordId;
    todaysDate = BusinessDate;
    lastLoginDate;
    @track objApptWrapperData;
    showLoader = false;
    stageName = '';
    loadAll = false;
    apptPrimaryApplicantName = '';
    @track objValidateChildComps = {};
    @track arrValidateErrorMsgs = [];
    showErrorTab = false;
    isDmScreen = false;
    activeTabName = 'Loan Parameters';
    disableSubmit = false;
    sendback = false;
    showApprovalmodal = false;
    @track approvalOptions = [{ label: "Approve", value: "Approve" }, { label: "Reject", value: "Reject" }];
    slcdApprvalOpt = '';
    approvalRemarks = '';
    showapprovalRemarks = false;
    @track btns = [];
    @track arrReqDocNames = [];
    acRecordId = '';
    //--------------------------------------------------------------------------
    connectedCallback() {

        this.init();
    }

    //this method is used to re-initialize track variable with data after save or load functionality
    init() {
        this.slcdApprvalOpt = '';
        this.approvalRemarks = '';
        this.arrReqDocNames = [];
        this.acRecordId = '';
        this.showapprovalRemarks = false;
        this.getParentAndRelatedData(true);
        this.handleGetLastLoginDate();
        this.disableSubmit = true;
    }
    //application  data refreshed to get latest dibursal record
    reloadApplicationData() {

        console.log('Fiv_Disb_Lwc reload Appt Data ');
        this.disableSubmit = true;
        this.getParentAndRelatedData(false);
    }
    //once the data is fetched then load the other tabs,reloadTab willtrue for first time only
    getParentAndRelatedData(reloadTab) {

        //if (!isTabFuncInvoke) { //for first time it should be null else if will re-render the whole screen html line 13 : template if:true={objApptWrapperData}
        //  this.objApptWrapperData = undefined;
        //}
        this.showLoader = true;
        console.log(this.recordId);
        getParentAndRelatedData({
            recordId: this.recordId
        }).then((result) => {

            console.log('Fiv_Disb_Lwc objApptWrapperData = ', JSON.stringify(result));

            if (result.statusCode !== 200) {

                this.showNotification('ERROR', result.message, 'error'); //incase if any apex exception happened it will show notification
                this.showLoader = false;
            } else {

                this.objApptWrapperData = result;
                console.log(typeof this.objApptWrapperData.mapExtraParams);

                if (this.objApptWrapperData.mapExtraParams.hasOwnProperty('apptPrimaryApplicantName')) {
                    this.apptPrimaryApplicantName = this.objApptWrapperData.mapExtraParams.apptPrimaryApplicantName;
                }

                if (this.objApptWrapperData.mapExtraParams.hasOwnProperty('acRecordId')) {

                    this.acRecordId = this.objApptWrapperData.mapExtraParams.acRecordId;
                }

                //this.apptPrimaryApplicantName = this.objApptWrapperData.
                //if (isTabFuncInvoke) { //once the data is load it should reload current data 
                //  this['get' + this.currentTabName]();//this will call method dynamically as per tabName
                //} else {
                //  this.showLoader = false; //this is done so that once reloading of all data done then only it will false, else spinner handle in above if
                //}
                //----------------------------------------------------------------------------------
                //this is done so that all the tabs been loaded so that we can invoke their methods for Submit validations
                try {
                    if (reloadTab && this.showTabsData) {
                        setTimeout(() => {
                            this.showLoader = true;
                            let tabs = this.template.querySelectorAll('lightning-tab');
                            console.log('tabs ', tabs);
                            console.log('tabs ', tabs.length);
                            tabs.forEach(element => {
                                console.log('element -> ' + JSON.stringify(element));
                                element.loadContent();
                            });
                            setTimeout(() => {
                                this.disableSubmit = false;
                                this.showLoader = false;
                            }, 5000);//load when all tabs been loaded
                        }, 2000);
                    } else {
                        this.disableSubmit = false;
                        this.showLoader = false;
                    }
                } catch (error) {
                    console.log('Error in lwc tab load', error.message);
                    this.disableSubmit = false;
                    this.showLoader = false;
                }
                //this.getRequiredDocuments(); CH01
            }

        }).catch((err) => {

            //incase if any Salesforce exception happened it will show notification
            console.log('Error in Fiv_Disb_Lwc getParentAndRelatedData = ', err);
            this.showNotification('ERROR', err.message, 'error');
            this.showLoader = false;
        });
    }

    //--------------------------------------------------------------------------
    //only show Tabs if the stage is Disbursal Maker/Author
    get showTabsData() {

        if (this.objApptWrapperData && this.objApptWrapperData.disbMetaPrefix) {
            this.stageName = this.objApptWrapperData.disbMetaPrefix == 'DISBM_' ? 'Disbursal Maker' : 'Disbursal Author';
            this.isDmScreen = this.objApptWrapperData.disbMetaPrefix.includes('DISB') ? true : false;

            if (this.isDmScreen && this.btns.length == 0) {
                this.btns.push({
                    name: 'Send Back',
                    label: 'Send Back',
                    variant: 'brand',
                    class: 'slds-m-left_x-small'
                })
            }
            return true;
        } else {

            return false;
        }

    }
    //--------------------------------------------------------------------------
    handleHeaderButton(event) {
        var detail = event.detail;
        console.log('detail ### ', JSON.stringify(detail));
        this.sendback = true;

    }
    handleTabActivation(event) {
        console.log('handleTabActivation= ', event.target.value);
    }
    showNotification(title, msg, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title: title,
            message: msg,
            variant: variant
        }));
    }
    handleChangeInFeeInsurance(event) {
        console.log('New record added in Fee Insurance. Refresh Application Data');
        this.init();
    }

    //--------------------------------------------------------------------------

    getReceiptPendingList(event) {
        console.log('Receipt data approved ', JSON.stringify(event.detail));
        //this.receiptWrapper.hasReceipt = event.detail.hasReceipt;
        //this.receiptWrapper.allApproved = event.detail.allApproved;
        //this.receiptWrapper.pendingReceiptList = event.detail.pendingReceiptList;
    }
    //--------------------------------------------------------------------------
    handleGetLastLoginDate() {
        getLastLoginDate().then((result) => {
            console.log('getLastLoginDate= ', result);
            this.lastLoginDate = result;
        }).catch((err) => {
            console.log('Error in getLastLoginDate= ', err);
        });
    }
    handleBeforeSubmitCustmEvt(event) {

        console.log('handleBeforeSubmitCustmEvt ', JSON.stringify(event.detail));
        if (this.objValidateChildComps.hasOwnProperty(event.detail.fieldName)) {

            this.objValidateChildComps[event.detail.fieldName] = event.detail.isValid
            if (event.detail.msg) {
                this.arrValidateErrorMsgs.push(event.detail.msg);
            }


        } else if (event.detail.hasOwnProperty('hasReceipt')
            && this.objValidateChildComps.hasOwnProperty('feeInsDetails')) {
            console.log('hasReceipt ');
            var errorFound = false;
            //sangeet feereciept logic below
            //example event.detail :  {"hasReceipt":true,"allApproved":true,"pendingReceiptList":[],"lengthOfDirectRec":1}
            if (!event.detail.hasReceipt && event.detail.lengthOfDirectRec > 0) {
                console.log('1');
                errorFound = true;
                this.objValidateChildComps['feeInsDetails'] = false;

                for (var element in event.detail.existingFeeCodeOption) {
                    //@Author : Sangeeta 
                    //@ Description : using element.value was giving undefined so changed to event.detail.existingFeeCodeOption[element].value
                    this.arrValidateErrorMsgs.push('Please Add Receipt in Fee Details Tab for Fee Code : ' + event.detail.existingFeeCodeOption[element].value);
                }
            }
            if (!event.detail.allApproved && event.detail.hasReceipt) {
                console.log('2');
                errorFound = true;
                this.objValidateChildComps['feeInsDetails'] = false;
                this.arrValidateErrorMsgs.push('Please check if all receipts are approved');
            }
            if (event.detail.pendingReceiptList.length > 0 && event.detail.hasReceipt) {
                console.log('3');
                errorFound = true;
                this.objValidateChildComps['feeInsDetails'] = false;
                this.arrValidateErrorMsgs.push('Please check if there are any pending receipts');
            }
            console.log('errorFound ', errorFound);
            //if all above conditions are false then 
            if (!errorFound) {
                this.objValidateChildComps['feeInsDetails'] = true;
            }

        }
    }
    //============================================================================
    //By : Suresh
    //Date : 19/08/ 2022

    handleSubmitClick(event) {

        console.log('handleSubmitClick ', JSON.stringify(event.detail));

        const fields = {};
        fields[ID_FIELD.fieldApiName] = this.objApptWrapperData.objAppt.Id;
        fields[STAGE_FIELD.fieldApiName] = event.detail;
        const recordInput = { fields };
        updateRecord(recordInput)
            .then(() => {

                this.showNotification('Success', 'Send Back Successful..', 'success');
                // this.showLoader = false;
                // this.disableSubmit = false;
                this[NavigationMixin.Navigate]({
                    type: 'standard__recordPage',
                    attributes: {
                        recordId: this.objApptWrapperData.objAppt.Id,
                        objectApiName: 'Application__c',
                        actionName: 'view'
                    }
                });
            })
            .catch(error => {

                this.showNotification('Error', error.body.message, 'error');

                console.log('error on stage save -> ' + error.body.message);
                // this.showLoader = false;
                // this.disableSubmit = false;
            });
    }
    handlesendbackclose(event) {
        this.sendback = false;
    }
    //===========================================================================================================
    getRequiredDocuments() {
        this.arrReqDocNames = [];
        getRequiredDocuments({ stage: this.stageName, parentId: this.objApptWrapperData.objAppt.Id })
            .then(result => {
                console.log('::: result ::: ', JSON.stringify(result));
                this.arrReqDocNames = result;
            })
            .catch(error => {
                console.log('error doc upload ', error);
            })
    }

    /*handleCheckRequiredDocs() {
        if (this.arrReqDocNames.length > 0) {
            this.arrReqDocNames.forEach(element => {
                this.arrValidateErrorMsgs.push('Upload Required Document ' + element + ' In Document Upload Tab');
            });
        }
    }*/

    requiredDocumentValidation() {
        console.log('arrReqDocNames', JSON.stringify(this.arrReqDocNames));
        if (this.arrReqDocNames.length > 0) {
            this.arrReqDocNames.forEach(element => {
                console.log('element #### ', JSON.stringify(element));
                if (element.documentType === 'Application') {
                    this.arrValidateErrorMsgs.push('Upload Application Document ' + element.documentName + ' In Document Upload Tab');
                }
                if (element.documentType === 'Applicant') {
                    this.arrValidateErrorMsgs.push('Upload Document ' + element.documentName + ' For ' + element.customerName + ' In Document Upload Tab');
                }
                if (element.documentType === 'Asset') {
                    this.arrValidateErrorMsgs.push('Upload Document ' + element.documentName + ' For ' + element.propertyName + ' In Document Upload Tab');
                }
            });
        }
    }
    //Karan Singh : Added : 17-09-2022 : Deviation validation only for DA
    checkExistDeviation() {

        if (this.stageName !== 'Disbursal Author') {
            return;
        }
        console.log('chechExistDeviaitons Stage - this.stageName ' + this.objApptWrapperData.objAppt.Id);
        chechExistDeviaitons({ apptId: this.objApptWrapperData.objAppt.Id })
            .then(result => {
                console.log('::: chechExistDeviaitons result ::: ', JSON.stringify(result));

                if (result.statusCode !== 200) {

                    this.objValidateChildComps['allApprvDeviaiton'] = false;
                    this.arrValidateErrorMsgs.push(result.message);
                }
            })
            .catch(error => {
                this.showNotification('Error', error.body.message, 'error');
                console.log('error on checkExistDeviation save -> ' + JSON.stringify(error.body.message));
            })

    }
    handleRequiredDocument(event) {
        console.log('required doc list :: ', JSON.stringify(event.detail));
        this.arrReqDocNames = event.detail;
    }
    //==============================================================================================
    handleDisbSubmit(event) {
        this.showLoader = true;
        this.showErrorTab = false;
        this.arrValidateErrorMsgs = [];
        this.disableSubmit = true;
        this.objValidateChildComps = { 'loanParam': null, 'disbParam': null, 'disbPayee': null, 'ckycDetails': null, 'userDetails': null, 'feeInsDetails': null, 'insuranceDetails': null, 'repayDetails': null };
        setTimeout(() => {
            try {
                //this.handleCheckRequiredDocs(); will implement later
                this.template.querySelector('c-fiv_-disb_-loan-Params').checkBeforeSubmit();
                this.template.querySelector('c-fee-creation-parent').getReceipt();
                this.template.querySelector('c-fiv_-disb_-disbursal-params').checkBeforeSubmit();
                this.template.querySelector('c-fiv_-disb_-disbursal-payee').checkBeforeSubmit();
                this.template.querySelector('c-fiv_-disb_-insurance-details').checkBeforeSubmit();
                this.template.querySelector('c-fiv_-disb_-repayment-details').checkBeforeSubmit();
                this.template.querySelector('c-fiv_-disb_-ckyc-details').checkBeforeSubmit();
                this.template.querySelector('c-fiv_-disb_-user-details').checkBeforeSubmit();
                //this.handleCheckRequiredDocs(); //for the Document Tab 'documents': null,

                //checking for required document
                if (this.arrReqDocNames.length > 0) {

                    //this.objValidateChildComps['reqDocs'] = false; //CH01
                    //this.handleCheckRequiredDocs(); //CH01

                }
                try {
                    this.template.querySelector('c-fs-generic-upload-documents').checkAllRequiredDocument();
                    this.checkExistDeviation();
                } catch (error) {
                    console.log(error)
                }
                setTimeout(() => {
                    this.requiredDocumentValidation();
                }, 3000);
            } catch (error) {

                console.log('error handleDisbSubmit - > ', error);
                //this.showNotification('ERROR', error.message, 'error');
            }
            //this is done so that all the events can be captured from childs
            setTimeout(() => {

                console.log('Handle Submit checked');
                console.log('Handle Submit objValidateChildComps ', JSON.stringify(this.objValidateChildComps));

                var allDataFilled = true;
                //check if all data have been filled
                for (const key in this.objValidateChildComps) {

                    console.log('this.objValidateChildComps ' + key + '  ' + this.objValidateChildComps[key]);
                    if (!this.objValidateChildComps[key]) {
                        allDataFilled = false;
                        break;
                    }
                }
                if (!allDataFilled) {

                    console.log('all data not filed ');
                    this.showErrorTab = true;
                    //this is done as as it take some time to render the error tab so immediatly it will not focus on error tabs
                    let thisRef = this;
                    setTimeout(() => {
                        thisRef.template.querySelector('lightning-tabset').activeTabValue = 'Error';
                        thisRef.showLoader = false;
                        thisRef.disableSubmit = false;
                    }, 300);
                } else {

                    console.log('all data filed ');
                    if (this.objApptWrapperData.disbMetaPrefix == 'DISBM_') {
                        //move to disbursal author update the stage of application

                        console.log('all data filed DM');

                        const fields = {};
                        fields[ID_FIELD.fieldApiName] = this.objApptWrapperData.objAppt.Id;
                        fields[STAGE_FIELD.fieldApiName] = 'Disbursal Author';
                        const recordInput = { fields };
                        updateRecord(recordInput)
                            .then(() => {

                                this.showNotification('Success', 'Moved to Disbursal Author.', 'success');
                                this.allocateUser('Disbursal Author', this.objApptWrapperData.objAppt.Id);
                                this.showLoader = false;
                                this.disableSubmit = false;
                                this.navigateApptList();

                            })
                            .catch(error => {

                                this.showNotification('Error', error.body.message, 'error');

                                console.log('error on stage save -> ' + error.body.message);
                                this.showLoader = false;
                                this.disableSubmit = false;
                            });
                    } else {
                        this.showApprovalmodal = true;

                    }
                }
            }, 3000);
        }, 3000);
    }
    handleInputChange(event) {
        this.approvalRemarks = event.detail.value;
    }
    handleComboBoxChange(event) {
        this.slcdApprvalOpt = event.target.value;
        if (this.slcdApprvalOpt == 'Reject') {
            this.showapprovalRemarks = true;
        } else {
            this.showapprovalRemarks = false;
            this.approvalRemarks = '';
        }
    }
    handleApprovalBtnClk() {
        this.handleDASave();
    }
    handleDASave() {

        console.log('all data filed DA');
        console.log('Save ' + this.slcdApprvalOpt);
        if (!this.slcdApprvalOpt || this.slcdApprvalOpt == '') {
            this.showNotification('Error', 'Please select an option.', 'error');
            return;
        }
        this.showLoader = false;
        this.disableSubmit = false;
        var fields = {};
        fields[ID_FIELD.fieldApiName] = this.objApptWrapperData.objAppt.Id;
        if (this.slcdApprvalOpt != 'Approve') {

            fields[STAGE_FIELD.fieldApiName] = 'Disbursal Maker';
            var stage = fields[STAGE_FIELD.fieldApiName];
            fields[Disbursal_Author_Decision_FIELD.fieldApiName] = this.slcdApprvalOpt;
            fields[Disbursal_Author_Decision_Remarks_FIELD.fieldApiName] = this.approvalRemarks;
            var recordInput = { fields };
            updateRecord(recordInput)
                .then(() => {
                    this.allocateUser(stage, this.objApptWrapperData.objAppt.Id);
                    this.showNotification('Success', 'Disbursal Author completed.', 'success');
                    this.navigateApptList();
                })
                .catch(error => {

                    this.showNotification('Error', error.body.message, 'error');
                    console.log('error on stage save -> ' + JSON.stringify(error.body.message));
                    this.showLoader = false;
                    this.disableSubmit = false;
                });
        }
        //Incase of Approve will check the document defferal conditions
        else {

            this.showLoader = true;
            updateApptStageFromDA({
                apptId: this.objApptWrapperData.objAppt.Id
            }).then((result) => {

                console.log('Fiv_Disb_Lwc Saved sfObjJSON = ', JSON.stringify(result));

                if (result !== 'Success') {

                    this.showNotification('ERROR', result, 'error'); //incase if any apex exception happened it will show notification
                } else {
                    this.navigateApptList();
                    this.showNotification('Success', 'Disbursal Author completed.', 'success');
                }
                this.showLoader = false;
                //this.showLoader = false; //this is removed as loader will be  false once data is load
            }).catch((err) => {

                //incase if any Salesforce exception happened it will show notification
                console.log('Error in Fiv_Disb_Lwc handleSave = ', err);
                this.showNotification('ERROR', err.message, 'error');
                this.showLoader = false;
            });
        }

    }
    //this is used till the allocation master is not implemented
    allocateUser(stageName, apptId) {
        allocateUser({
            stageName: stageName,
            apptId: apptId
        }).then((result) => {

            console.log('Fiv_Disb_Lwc Saved sfObjJSON = ', JSON.stringify(result));
            //this.showLoader = false; //this is removed as loader will be  false once data is load
        }).catch((err) => {

            //incase if any Salesforce exception happened it will show notification
            console.log('Error in Fiv_Disb_Lwc handleSave = ', err);
            //this.showNotification('ERROR', err.message, 'error');
            //this.showLoader = false;
        });
    }
    navigateApptList() {
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',// type: 'standard__recordPage',
            attributes: {
                //recordId: this.objApptWrapperData.objAppt.Id,
                objectApiName: 'Application__c',
                //actionName: 'view'
                actionName: 'list'
            }
        });
    }
}