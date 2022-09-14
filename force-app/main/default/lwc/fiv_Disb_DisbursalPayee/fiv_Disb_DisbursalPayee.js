import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import { NavigationMixin } from 'lightning/navigation';
import PAYMENT_TYPE from '@salesforce/schema/Disbursal_Payee__c.Payment_Type__c';
import DISBURSAL_PAYEE_OBJECT from '@salesforce/schema/Disbursal_Payee__c';
//------------------------------------------------------------------------------
import saveDisbursalCompData from '@salesforce/apex/Fiv_Disb_LwcController.saveDisbursalCompData';
import initData from '@salesforce/apex/Fiv_Disb_LwcController.initDisbursalPayee';
import getIfscDetails from '@salesforce/apex/Fiv_Disb_LwcController.getIfscDetails';
import getDocumentId from '@salesforce/apex/Fiv_Disb_LwcController.getDocumentId';
import callPennyDropAPI from '@salesforce/apex/Fiv_Disb_LwcController.callPennyDropAPI';
//------------------------------------------------------------------------------
export default class Fiv_Disb_DisbursalPayee extends NavigationMixin(LightningElement) {

    @api obj_parent_appt_wrapper_data;
    @track listExistDisbursalPayees = [];
    @track objDisbursalPayee = {};
    showLoader = false;
    currentEditDisbPayeeId = null; //this will store current editing disbursal payee detail Id
    @track rowAction = [{
        type: 'button-icon', fixedWidth: 50,
        typeAttributes: { iconName: 'utility:edit', title: 'Edit', variant: 'border-filled', alternativeText: 'Edit', name: 'edit' }
    }];
    @track acceptedFormats = ['.png', '.jpg', '.pdf'];
    @track fileData = {};
    fileErrMsg = '';
    isExistDisbPayee = false;
    @track listBenificiaryType = [];
    showUI = false;
    @track mapAppltTypeName = new Map();
    enableDisbPayeeEdit = false;
    tempAccntNumber = '';
    reEnterAccntNumber = '';
    accMisMatchMsg1 = '';
    accMisMatchMsg2 = ''; //border : 2px solid red
    disbErrorMsg1 = '';
    disbErrorMsg2 = '';
    isfcCodeMissErr = '';
    existBenificiaryAmt = 0;
    finalDIsbAmount = 0;
    isAccntEntered = false;
    addNewBeneficiary = false; //incase all loan applicant have been added
    @track mapDisbPayeeIdWithDocumentId;
    tempAddedBenificiaryType = '';
    sanctionLoanAmt = 0;
    insurancePremium = 0;
    insuranceTotalFee = 0;
    enableSaveAmtBtn = false;
    isBennifAmtMatchDisbAmt = false; //checking error for amount greater
    @track disableSaveEditBtn = true;
    timeId = '';
    //--------------------------------------------------------------------------
    @wire(getObjectInfo, { objectApiName: DISBURSAL_PAYEE_OBJECT })

    disbPayeeMetadata;

    // now retriving the StageName picklist values of Opportunity

    @wire(getPicklistValues, {
        recordTypeId: '$disbPayeeMetadata.data.defaultRecordTypeId',
        fieldApiName: PAYMENT_TYPE
    }
    ) disbPayeePayTypePickVal;
    //--------------------------------------------------------------------------
    get uploadedfileName() {
        return this.fileData.hasOwnProperty('filename') ? this.fileData.filename : 'Bank Proof Image Upload';
    }
    get isExistPayeeExists() {
        return this.listExistDisbursalPayees.length > 0 ? true : false;
    }
    //--------------------------------------------------------------------------
    connectedCallback() {
        console.log('Fiv_Disb_Lwc Fiv_Disb_DisbursalPayee init');

        this.initData();

    }

    reInitDisbPayee() {
        this.objDisbursalPayee = { 'sobjectType': 'Disbursal_Payee__c', "Id": '', 'Beneficiary_Amount__c': 0, 'Beneficiary_Bank_Account_Number__c': '', 'Beneficiary_Bank_Name__c': '', 'Beneficiary_Branch_Name__c': '', 'Beneficiary_IFSC_Code__c': '', 'Beneficiary_Name__c': '', 'Beneficiary_Type__c': '', 'Disbursal__c': this.checkExistingDisbursalId(), 'Payment_Type__c': '', 'Beneficiary_IFSC_Code__c': '' };
    }
    initData() {
        this.enableSaveAmtBtn = false;
        this.mapDisbPayeeIdWithDocumentId = new Map();
        this.showUI = false;
        this.showLoader = true;
        this.listExistDisbursalPayees = [];
        this.enableDisbPayeeEdit = false;
        this.disableSaveEditBtn = true;
        this.existBenificiaryAmt = 0;
        this.sanctionLoanAmt = 0;
        this.isBennifAmtMatchDisbAmt = false;
        this.insurancePremium = 0;
        this.insuranceTotalFee = 0;
        this.reInitDisbPayee();
        this.listBenificiaryType = [];
        this.timeId = '';
        //======================================================================

        var jsonParam = { apptId: this.obj_parent_appt_wrapper_data.objAppt.Id };

        if (this.checkExistingDisbursalId()) {
            jsonParam.existDisbId = this.checkExistingDisbursalId();
        }
        console.log('Fiv_Disb_Lwc Fiv_Disb_DisbursalPayee jsonParam ' + JSON.stringify(jsonParam));
        initData({
            jsonParamData: JSON.stringify(jsonParam)
        }).then((result) => {

            console.log('Fiv_Disb_Lwc Fiv_Disb_DisbursalPayee = ', JSON.stringify(result));

            if (result.statusCode !== 200) {

                this.showNotification('ERROR', result.message, 'error'); //incase if any apex exception happened it will show notification
                this.showLoader = false;
            } else {

                try {
                    console.log(result.mapExtraParams.hasOwnProperty('listApptNameType'));

                    if (result.mapExtraParams.hasOwnProperty('Final_Disbursal_Amount')) {
                        this.finalDIsbAmount = parseFloat(result.mapExtraParams.Final_Disbursal_Amount);
                    }
                    if (result.mapExtraParams.hasOwnProperty('sanctionLoanAmt')) {
                        this.sanctionLoanAmt = parseFloat(result.mapExtraParams.sanctionLoanAmt);
                    }
                    if (result.mapExtraParams.hasOwnProperty('insuranceCalc')) {
                        console.log('Fiv_Disb_DisbursalPayee insuranceCalc ' + result.mapExtraParams.insuranceCalc);
                        console.log('Fiv_Disb_DisbursalPayee insuranceCalc premium ' + result.mapExtraParams.insuranceCalc.premium);
                        this.insurancePremium = JSON.parse(result.mapExtraParams.insuranceCalc).premium;
                        this.insuranceTotalFee = JSON.parse(result.mapExtraParams.insuranceCalc).fee;
                    }
                    var setExistApptType = new Set();

                    console.log('Fiv_Disb_DisbursalPayee Init Data exist lenght ' + result.listSObject.length)
                    //Showing exisitng records
                    if (result.listSObject.length > 0) {

                        result.listSObject.forEach(element => {

                            if (element.Beneficiary_Type__c == 'BT Bank') {
                                this.listExistDisbursalPayees.push({ sobject: element, isChecked: false, isVisible: false, isDisable: false });
                            } else {
                                this.listExistDisbursalPayees.push({ sobject: element, isChecked: false, isVisible: true, isDisable: false });
                            }

                            this.existBenificiaryAmt += element.Beneficiary_Amount__c ? (Math.round(parseFloat(element.Beneficiary_Amount__c) * 100) / 100) : 0;
                            setExistApptType.add(element.Beneficiary_Type__c);
                        });
                        console.log('listExistDisbursalPayees - ' + JSON.stringify(this.listExistDisbursalPayees));
                        this.showUI = true;
                        //this.listExistDisbursalPayees = result.listSObject;
                    } else {
                        this.enableDisbPayeeEdit = true;
                        this.disableSaveEditBtn = false;
                        this.reInitDisbPayee();

                        /*if (this.isBeneficaryAmntGreaterThanLoanAmt) {

                            this.showNotification('ERROR', 'Total beneficiary amount is greater than sanction loan amount. Please select a record to adjust', 'error');
                        }*/
                        //this.objDisbursalPayee.Beneficiary_Amount__c = this.finalDIsbAmount - this.existBenificiaryAmt;
                    }
                    console.log('this.existBenificiaryAmt ', this.existBenificiaryAmt);
                    console.log('this.sanctionLoanAmt ', this.sanctionLoanAmt);
                    console.log('this.insurancePremium ', this.insurancePremium);
                    console.log('this.insuranceTotalFee ', this.insuranceTotalFee);
                    //=========================================================
                    this.finalDIsbAmount = this.sanctionLoanAmt - this.insurancePremium - this.insuranceTotalFee;
                    console.log('this.this.finalDIsbAmount ' + this.finalDIsbAmount);
                    console.log('this.this.finalDIsbAmount type of ' + typeof this.finalDIsbAmount);

                    this.isBennifAmtMatchDisbAmt = this.existBenificiaryAmt === this.finalDIsbAmount ? true : false;

                    console.log('this.isBennifAmtMatchDisbAmt' + this.isBennifAmtMatchDisbAmt);
                    console.log(' setExistApptType ' + setExistApptType);
                    //for populating Loan Applicant Names
                    if (result.mapExtraParams.hasOwnProperty('listApptNameType')) {

                        //incase more than  one match
                        if (result.mapExtraParams.listApptNameType.includes(',')) {

                            result.mapExtraParams.listApptNameType.split(',').forEach(element => {

                                if (!setExistApptType.has(element.split('---')[0])) {
                                    this.listBenificiaryType.push({ label: element.split('---')[0], value: element.split('---')[0] });
                                    this.mapAppltTypeName.set(element.split('---')[0], element.split('---')[1])
                                }

                            });

                        } else {
                            if (!setExistApptType.has(element.split('---')[0])) {
                                this.mapAppltTypeName.set(result.mapExtraParams.listApptNameType.split('---')[0], result.mapExtraParams.listApptNameType.split('---')[1])
                                this.listBenificiaryType.push({ label: result.mapExtraParams.listApptNameType.split('---')[0], value: result.mapExtraParams.listApptNameType.split('---')[0] });
                            }
                        }
                        if (this.listBenificiaryType.length > 0) {
                            this.showUI = true;
                            this.addNewBeneficiary = true;
                        } else {
                            this.addNewBeneficiary = false;
                        }
                    }

                    console.log('existBenificiaryAmt ' + this.existBenificiaryAmt);
                    console.log('finalDIsbAmount' + this.finalDIsbAmount);
                    console.log('listExistDisbursalPayees' + this.listExistDisbursalPayees);
                    if (this.listExistDisbursalPayees.length == 0) {
                        this.isBennifAmtMatchDisbAmt = true;
                    }
                    console.log('isBennifAmtMatchDisbAmt' + this.isBennifAmtMatchDisbAmt);
                    this.showLoader = false;
                } catch (error) {
                    console.log('Error in Fiv_Disb_DisbursalPayee Init Data result= ', error);
                    this.showNotification('ERROR', error.message, 'error');
                    this.showLoader = false;
                }
            }

        }).catch((err) => {

            //incase if any Salesforce exception happened it will show notification
            console.log('Error in Fiv_Disb_DisbursalPayee Init Data = ', err);
            this.showNotification('ERROR', err.message, 'error');
            this.showLoader = false;
        });
    }

    checkExistingDisbursalId() {

        if (this.obj_parent_appt_wrapper_data.objAppt.hasOwnProperty('Disbursals__r')) {
            console.log('this.obj_parent_appt_wrapper_data.Disbursals__r[0].Id ' + this.obj_parent_appt_wrapper_data.objAppt.Disbursals__r[0].Id);
            return this.obj_parent_appt_wrapper_data.objAppt.Disbursals__r[0].Id;
        }
        return null;
    }

    fetchIfscDetails(ifscCodeId) {

        this.showLoader = true;
        getIfscDetails({
            ifscCodeId: ifscCodeId
        }).then((result) => {

            console.log('getIfscDetails  = ', JSON.stringify(result));

            if (result.statusCode !== 200
                && result.statusCode !== 201) {

                this.showNotification('', result.message, 'warning'); //incase if any apex exception happened it will show notification
            } else {

                console.log(result.mapExtraParams);

                this.objDisbursalPayee.Beneficiary_Bank_Name__c = result.mapExtraParams.Beneficiary_Bank_Name__c;
                this.objDisbursalPayee.Beneficiary_Branch_Name__c = result.mapExtraParams.Beneficiary_Branch_Name__c;
                this.disbErrorMsg1 = '';
                this.disbErrorMsg2 = '';
            }
            this.showLoader = false;

        }).catch((err) => {

            //incase if any Salesforce exception happened it will show notification
            console.log('Error in getIfscDetails = ', err);
            this.showNotification('ERROR', err.message, 'error');
            this.showLoader = false;
        });
    }
    onOpenfileUpload(event) {
        this.fileErrMsg = '';
        //console.log(this.obj_parent_appt_wrapper_data.disbMetaPrefix);
        try {

            const file = event.target.files[0];

            var reader = new FileReader()
            reader.onload = () => {
                var base64 = reader.result.split(',')[1]
                //console.log('data' + JSON.stringify(reader.result));
                this.fileData = {
                    'filename': this.obj_parent_appt_wrapper_data.disbMetaPrefix + 'BankProof- ' + file.name,
                    'base64': base64,
                }
                console.log('File name - ' + this.fileData.filename);
                //this.uploadedfileName = this.fileData.filename;
            }
            reader.readAsDataURL(file)
        } catch (error) {
            console.log('error -' + error.message);
            this.fileErrMsg = error.message;
            this.fileData = {};
        }

    }
    //--------------------------------------------------------------------------
    handleComboBoxChange(event) {

        console.log(event.detail.value);
        console.log(event.target.dataset.id);
        console.log(this.mapAppltTypeName);
        this.objDisbursalPayee[event.target.dataset.field] = event.detail.value;

        if (event.target.dataset.id == 'BeneficiaryType') {
            if (this.mapAppltTypeName.has(event.detail.value)) {
                this.objDisbursalPayee.Beneficiary_Name__c = this.mapAppltTypeName.get(event.detail.value);
                if (!this.objDisbursalPayee.Beneficiary_Name__c) {
                    this.template.querySelector(`[data-field="Beneficiary_Name__c"]`).setCustomValidity('');
                    this.template.querySelector(`[data-field="Beneficiary_Name__c"]`).reportValidity();
                }

            }

        }
    }
    handleInputChange(event) {

        console.log('Input Change');
        this.objDisbursalPayee[event.target.dataset.field] = event.detail.value;

        if (event.target.dataset.field == 'Beneficiary_Amount__c') {

            this.objDisbursalPayee[event.target.dataset.field] = Math.round(this.objDisbursalPayee[event.target.dataset.field] * 100) / 100;
        }
    }
    handleBtnClick(event) {

        console.log('checkbox index' + event.target.dataset.index);
        console.log('checkbox name' + event.target.dataset.name);
        console.log('checkbox checked' + event.target.dataset.checked);
        if (event.target.dataset.name == 'enableDisbPayeeEdit') {

            this.enableDisbPayeeEdit = true;
            this.disableSaveEditBtn = false;
            this.reInitDisbPayee();

        } else if (event.target.dataset.name == 'checkboxBtn') {

            console.log('checkbox index' + event.target.dataset.index);
            this.listExistDisbursalPayees[event.target.dataset.index].isChecked = !this.listExistDisbursalPayees[event.target.dataset.index].isChecked;

            if (this.listExistDisbursalPayees[event.target.dataset.index].isChecked) {
                this.enableSaveAmtBtn = true;
            } else {
                this.enableSaveAmtBtn = false;
            }


            this.listExistDisbursalPayees.forEach(element => {
                console.log(element);
                if (element.sobject.Id != this.listExistDisbursalPayees[event.target.dataset.index].sobject.Id) {
                    element.isChecked = false;
                }
            });
        } else if (event.target.dataset.name == 'pennydrop') {

            this.showLoader = true;
            callPennyDropAPI({
                disbPayee: this.listExistDisbursalPayees[event.target.dataset.index].sobject.Id
            }).then((result) => {

                console.log('callPennyDropAPI  = ', JSON.stringify(result));

                this.showLoader = false;
                this.initData();

            }).catch((err) => {

                //incase if any Salesforce exception happened it will show notification
                console.log('Error in getIfscDetails = ', err);
                this.showNotification('ERROR', err.message, 'error');
                this.showLoader = false;
            });

        }
    }
    handleBlurChange(event) {

        console.log('Blur Change');
        console.log(event.target.dataset.label);
        console.log(event.target.dataset.field)
        this.isAccntEntered = true;
        if (event.target.dataset.label == 'BeneficiaryBankAccountNumber') {

            var value = this.template.querySelector(`[data-label="BeneficiaryBankAccountNumber"]`).value;
            console.log('BeneficiaryBankAccountNumber Value ' + value);
            this.objDisbursalPayee[event.target.dataset.field] = value;
            this.tempAccntNumber = value;
            this.reEnterAccntNumber = undefined;
            if (this.tempAccntNumber) {
                this.template.querySelector(`[data-label="BeneficiaryBankAccountNumber"]`).value = 'xxxxxxxxxxxxxxxx';

                setTimeout(() => {
                    this.template.querySelector(`[data-label="BeneficiaryBankAccountNumberCheck"]`).focus();
                }, 500);
                this.accMisMatchMsg1 = '';
                this.template.querySelector(`[data-label="BeneficiaryBankAccountNumber"]`).style = '';
            } else {
                this.accMisMatchMsg1 = 'Complete this field.';
            }
        }
        if (event.target.dataset.label == 'BeneficiaryBankAccountNumberCheck') {
            var value = this.template.querySelector(`[data-label="BeneficiaryBankAccountNumberCheck"]`).value;
            console.log('BeneficiaryBankAccountNumberCheck Value ' + value);
            this.reEnterAccntNumber = value;
            if (this.reEnterAccntNumber) {
                this.accMisMatchMsg2 = '';
                this.template.querySelector(`[data-label="BeneficiaryBankAccountNumberCheck"]`).style = ''
            } else {
                this.accMisMatchMsg1 = 'Complete this field.';
            }

        }
    }
    handleLookupChange(event) {

        console.log(event.detail);
        console.log(typeof event.detail);
        if (event.detail && typeof event.detail == typeof '') {
            this.fetchIfscDetails(event.detail);
            this.objDisbursalPayee.Beneficiary_IFSC_Code__c = event.detail;
            this.isfcCodeMissErr = '';
        } else {
            this.objDisbursalPayee.Beneficiary_Bank_Name__c = undefined;
            this.objDisbursalPayee.Beneficiary_Branch_Name__c = undefined;
            this.objDisbursalPayee.Beneficiary_IFSC_Code__c = undefined;
            this.isfcCodeMissErr = 'Complete this field.';
        }

    }
    handleEditRecord(event) {
        this.showLoader = true;
        console.log(event.target.dataset.index);
        console.log(JSON.stringify(this.listExistDisbursalPayees[event.target.dataset.index]));
        this.reInitDisbPayee();
        for (const key in this.objDisbursalPayee) {

            if (this.listExistDisbursalPayees[event.target.dataset.index].sobject.hasOwnProperty(key)) {
                this.objDisbursalPayee[key] = this.listExistDisbursalPayees[event.target.dataset.index].sobject[key];
            }
        }
        this.tempAccntNumber = '';
        this.reEnterAccntNumber = '';
        this.accMisMatchMsg1 = '';
        this.accMisMatchMsg2 = ''; //border : 2px solid red
        this.disbErrorMsg1 = '';
        this.disbErrorMsg2 = '';
        this.isfcCodeMissErr = '';
        this.isAccntEntered = false;
        this.currentEditDisbPayeeId = this.objDisbursalPayee.Id;
        this.enableDisbPayeeEdit = true;
        this.disableSaveEditBtn = false;
        this.tempAddedBenificiaryType = this.objDisbursalPayee.Beneficiary_Type__c;
        this.listBenificiaryType.push({ label: this.objDisbursalPayee.Beneficiary_Type__c, value: this.objDisbursalPayee.Beneficiary_Type__c });

        setTimeout(() => {
            this.template.querySelector(`[data-label="BeneficiaryBankAccountNumber"]`).value = this.objDisbursalPayee.Beneficiary_Bank_Account_Number__c;
            this.reEnterAccntNumber = this.objDisbursalPayee.Beneficiary_Bank_Account_Number__c;
            this.isAccntEntered = false;
            console.log('After  ' + JSON.stringify(this.objDisbursalPayee));

            console.log('this.addNewBeneficiary - ' + this.addNewBeneficiary);
            console.log('this.listBenificiaryType - ' + JSON.stringify(this.listBenificiaryType));

            //incase if all beneficary is added ,so give current record option of beneficary type
            //if (!this.addNewBeneficiary) {
            //this.listBenificiaryType = [];
            //}
            console.log('this.listBenificiaryType After - ' + JSON.stringify(this.listBenificiaryType));
            this.showLoader = false;
        }, 500);
    }
    handleCancel() {

        var index = 0;
        var benifIndex = null;
        this.listBenificiaryType.forEach(element => {
            if (element.label == this.tempAddedBenificiaryType) {
                benifIndex = index;
            }
            index++;
        });
        if (benifIndex) {
            this.listBenificiaryType.splice(benifIndex, 1);
        }
        this.objDisbursalPayee = null;
        this.currentEditDisbPayeeId = null;
        this.enableDisbPayeeEdit = false;
        this.disableSaveEditBtn = true;
    }
    handleAmtAdjust(event) {

        var disbPayeId = undefined;
        var benifAmt = undefined;
        this.listExistDisbursalPayees.forEach(element => {
            console.log(element);
            if (element.isChecked) {
                disbPayeId = element.sobject.Id;
                benifAmt = element.sobject.Beneficiary_Amount__c;
            }
        });

        if (disbPayeId) {

            console.log('Before benifAmt ' + benifAmt);
            console.log('this.finalDIsbAmount ' + this.finalDIsbAmount);
            console.log('this.existBenificiaryAmt ' + this.existBenificiaryAmt);
            benifAmt = benifAmt + (this.finalDIsbAmount - this.existBenificiaryAmt);
            console.log('After benifAmt ' + benifAmt);
            var objJsonDisbPayee = { 'sobjectType': 'Disbursal_Payee__c', "Id": disbPayeId, 'Beneficiary_Amount__c': benifAmt };
            console.log('objJsonDisbPayee ' + JSON.stringify(objJsonDisbPayee));
            this.objDisbursalPayee = objJsonDisbPayee;
            this.showLoader = true;
            this.enableSaveAmtBtn = true;
            this.listExistDisbursalPayees = [];
            this.saveApex();
        }

    }
    //--------------------------------------------------------------------------
    viewDocument(event) {

        console.log(this.listExistDisbursalPayees[event.target.dataset.index].sobject.Id);
        var disbPayeeId = this.listExistDisbursalPayees[event.target.dataset.index].sobject.Id;
        if (this.mapDisbPayeeIdWithDocumentId.has(disbPayeeId)) {

            this.navigateDocument(this.mapDisbPayeeIdWithDocumentId.get(disbPayeeId));
        } else {

            this.showLoader = true;
            getDocumentId({
                parentId: this.mapDisbPayeeIdWithDocumentId.get(disbPayeeId),
                documentPrefix: this.obj_parent_appt_wrapper_data.disbMetaPrefix
            }).then((result) => {

                console.log('getDocumentId  = ', JSON.stringify(result));
                if (result.length > 0) {
                    this.navigateDocument(result[0].ContentDocumentId);
                    this.mapDisbPayeeIdWithDocumentId.set(disbPayeeId, result[0].ContentDocumentId);
                }
                this.showLoader = false;

            }).catch((err) => {

                //incase if any Salesforce exception happened it will show notification
                console.log('Error in getDocumentId = ', err);
                this.showNotification('ERROR', err.message, 'error');
                this.showLoader = false;
            });
        }

    }
    navigateDocument(contentDocId) {

        this[NavigationMixin.Navigate]({
            type: 'standard__namedPage',
            attributes: {
                pageName: 'filePreview'
            },
            state: {
                selectedRecordId: contentDocId
            }
        })

    }
    @api
    checkBeforeSubmit() {
        var custEvt;
        if (!this.isBennifAmtMatchDisbAmt) {

            custEvt = new CustomEvent("checkbeforesubmit", {
                detail: { isValid: false, msg: 'Disbursal Payee : Total beneficiary amount is not matching with disbursement amount.Please select a record to adjust.', fieldName: 'disbPayee' }
            });
        } else if (this.listExistDisbursalPayees.length = 0) {
            custEvt = new CustomEvent("checkbeforesubmit", {
                detail: { isValid: false, msg: 'Disbursal Payee : Please add atleast one beneficiary.', fieldName: 'disbPayee' }
            });
        } else {
            custEvt = new CustomEvent("checkbeforesubmit", {
                detail: { isValid: true, msg: '', fieldName: 'disbPayee' }
            });
        }

        this.dispatchEvent(custEvt);
    }
    handleSave() {

        this.showLoader = true;
        this.disableSaveEditBtn = true;
        this.fileErrMsg = '';
        try {

            var allDataChecked = this.validateDisbData();
            var validAccntNum = this.validateAccntNumber();
            //now checking the disbursal record
            console.log(' allDataChecked - ' + allDataChecked);
            console.log(' validAccntNum - ' + validAccntNum);

            if (!this.fileData.hasOwnProperty('filename') && !this.currentEditDisbPayeeId) {

                //that means the file is not uploaded
                this.fileErrMsg = 'Please upload Bank Proof.';
                this.delayAction(false, false);
                return;
            }

            if (allDataChecked && validAccntNum) {

                var htmlElement = this.template.querySelector(`[data-field="Beneficiary_Amount__c"]`);

                if (this.objDisbursalPayee.Beneficiary_Amount__c <= 0) {

                    htmlElement.setCustomValidity('Beneficiary Amount cannot be 0.');
                    htmlElement.reportValidity();
                    this.delayAction(false, false);
                    return;
                }
                else {
                    htmlElement.setCustomValidity('');
                    htmlElement.reportValidity();

                }

                //this is done so that penny drop should be done again
                this.objDisbursalPayee.Is_Verified__c = false;
                //only for new Disbursal Payee record 
                if (!this.objDisbursalPayee.Id) {
                    this.objDisbursalPayee.Disbursal__c = this.checkExistingDisbursalId();
                    delete this.objDisbursalPayee['Id'];
                }
                //for edit scenario
                if (this.currentEditDisbPayeeId) {
                    this.objDisbursalPayee.Id = this.currentEditDisbPayeeId;
                }
                this.objDisbursalPayee.Beneficiary_Bank_Account_Number__c = this.reEnterAccntNumber;
                console.log(JSON.stringify(this.objDisbursalPayee));
                this.saveApex();


            }
            else {
                this.delayAction(false, false);
            }
        } catch (error) {
            console.log('Error disbPayee - ' + error);
            this.delayAction(false, true);
        }

    }
    //this is done so that user cannot hit multiple save button 
    delayAction(showLoader, disableSaveEditBtn) {
        setTimeout(() => {
            //this is done so that user cannot hit multiple save button 
            this.showLoader = showLoader;
            this.disableSaveEditBtn = disableSaveEditBtn;
        }, 500);
    }
    saveApex() {
        //================================= Calling Saving Method ===============================
        saveDisbursalCompData({
            objDisbursal: this.objDisbursalPayee,
            base64: this.fileData.hasOwnProperty('base64') ? this.fileData.base64 : '',
            filename: this.fileData.hasOwnProperty('filename') ? this.fileData.filename : '',
            prntRecordId: ''

        }).then((result) => {

            console.log('Fiv_Disb_Lwc Saved sfObjJSON = ', JSON.stringify(result));

            if (result.statusCode !== 200
                && result.statusCode !== 201) {

                this.showNotification('ERROR', result.message, 'error'); //incase if any apex exception happened it will show notification
                this.delayAction(false, false);
            } else {
                this.showNotification('SUCCESS', result.message, 'success');
                var custEvt = new CustomEvent("reloadapplicationdata", {
                    detail: {}
                });
                this.dispatchEvent(custEvt);
                this.listExistDisbursalPayees = [];
                this.initData();//this will show the data table;

            }
            //this.showLoader = false; //this is removed as loader will be  false once data is load
        }).catch((err) => {

            //incase if any Salesforce exception happened it will show notification
            console.log('Error in Fiv_Disb_Lwc handleSave = ', err);
            this.showNotification('ERROR', err.message, 'error');
            this.delayAction(false, false);
        });

        //=================================  Saving Method END ===============================
    }
    validateDisbData() {
        var isValidData = true;
        this.disbErrorMsg1 = '';
        this.disbErrorMsg2 = '';
        this.accMisMatchMsg1 = '';
        this.accMisMatchMsg2 = ''; //border : 2px solid red
        this.isfcCodeMissErr = '';
        //checking input fields 
        this.template.querySelectorAll("lightning-input").forEach(element => {
            console.log('element Input Name ' + element.label + ' Value : ' + element.value);
            if (element.label == 'Beneficiary Bank Name') {

                if (!element.value) {
                    this.disbErrorMsg1 = 'Complete this field.';
                    //element.style = 'border : 2px solid red;';
                } else {
                    this.disbErrorMsg1 = '';
                    element.style = '';
                }

            } else if (element.label == 'Beneficiary Branch Name') {

                if (!element.value) {
                    this.disbErrorMsg2 = 'Complete this field.';
                    //element.style = 'border : 2px solid red;';
                } else {
                    this.disbErrorMsg2 = '';
                    element.style = '';
                }
            } else if (element.label &&
                (element.label == 'Bank Proof Image Upload' || element.label.includes('DISBM_BankProof'))) {

                //element.setCustomValidity('Please upload Bank Proof.');
                //Tells the lightning-input to show the error right away without needing interaction 
                //element.reportValidity();
            }
            else if (!element.value && element.label) {
                element.reportValidity();
                console.log(element.label + ' false.');
                isValidData = false;

            }
        });
        //checking combobox
        this.template.querySelectorAll("lightning-combobox").forEach(element => {
            console.log('element Combo Name ' + element.label + ' Value : ' + element.value);
            if (!element.value) {
                element.reportValidity();
                isValidData = false;
            }
        });
        this.template.querySelectorAll("input").forEach(element => {
            console.log('element html input Name ' + element.label + ' Value : ' + element.value);
            if (!element.value) {
                this[element.dataset.errormsg] = 'Complete this field.';
                element.style = "border : 2px solid red;";
                isValidData = false;
            } else {
                element.style = "";
            }
        });
        console.log('ISFC Id ' + this.objDisbursalPayee.Beneficiary_IFSC_Code__c);
        if (!this.objDisbursalPayee.Beneficiary_IFSC_Code__c) {

            this.isfcCodeMissErr = 'Complete this field.';
            isValidData = false;
        } else {
            this.isfcCodeMissErr = '';
        }
        return isValidData;
    }

    validateAccntNumber() {

        console.log(this.isAccntEntered);
        if (!this.isAccntEntered) {//incase of edit, user didnot re-entered accnt number so bypass it
            return true;
        }
        else if (this.tempAccntNumber == this.reEnterAccntNumber) {
            console.log('valid accnt number');
            this.objDisbursalPayee.Beneficiary_Bank_Account_Number__c = this.reEnterAccntNumber;
            return true;
        } else {
            this.reEnterAccntNumber = undefined;
            this.accMisMatchMsg2 = 'Entered account number does not matched';
            console.log('invalid accnt number');
            return false;
        }
    }
    //skipId : this id amount will be skipped. Mainly for edt case as exist record is choose to edit to it will have new Beneficiary value
    calcTotalBenificiaryAmt(skipId) {
        console.log('skipId ' + skipId);
        this.existBenificiaryAmt = 0;
        if (this.listExistDisbursalPayees.length > 0) {

            this.listExistDisbursalPayees.forEach(element => {

                if (skipId && element.sobject.Id == skipId) {
                    //for future code purpose
                } else {
                    this.existBenificiaryAmt += element.sobject.Beneficiary_Amount__c ? (Math.round(parseFloat(element.sobject.Beneficiary_Amount__c) * 100) / 100) : 0;
                }
            });
        } else {
            this.existBenificiaryAmt = 0;
        }
        console.log(' Recalulated existBenificiaryAmt ' + this.existBenificiaryAmt);
    }
    //--------------------------------------------------------------------------
    showNotification(title, msg, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title: title,
            message: msg,
            variant: variant
        }));
    }
}