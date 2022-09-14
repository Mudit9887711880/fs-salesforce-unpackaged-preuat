import { LightningElement, api, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
//------------------------------------------------------------------------------
import getLoanAplicantNames from "@salesforce/apex/Fiv_Disb_LwcController.getLoanApplicantnames";
import getInsuranceDetailRecords from "@salesforce/apex/Fiv_Disb_LwcController.getInsuranceDetailRecords";
import getMetaDataFields from '@salesforce/apex/Fiv_Disb_LwcController.getMetaDataFields';
import getRelatedRecords from '@salesforce/apex/Fiv_Disb_LwcController.getRelatedRecords';
import saveInsuranceDetailData from '@salesforce/apex/Fiv_Disb_LwcController.saveDisbursalCompData';
import getParentAndRelatedData from '@salesforce/apex/Fiv_Disb_LwcController.getParentAndRelatedData';
import getDocumentId from '@salesforce/apex/Fiv_Disb_LwcController.getDocumentId';

//------------------------------------------------------------------------------
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import INSURANCE_DETAIL_OBJECT from '@salesforce/schema/Insurance_Details__c';
import INSURANCE_WAIVER from '@salesforce/schema/Insurance_Details__c.Insurance_Waiver__c';
import NOMINEE_RELATION_TYPE from '@salesforce/schema/Insurance_Details__c.Nominee_Relationship_Type__c';
import NOMINEE_KYC_ID_TYPE from '@salesforce/schema/Insurance_Details__c.Nominee_KYC_ID_Type__c';
import INSURANCE_REQUIREMENT from '@salesforce/schema/Insurance_Details__c.Insurance_Requirement__c';
import INSURNCE_MEDICAL_TEST_RESULT from '@salesforce/schema/Insurance_Details__c.Insurance_Medical_Test_Result__c';

export default class Fiv_Disb_InsuranceDetails extends NavigationMixin(LightningElement) {

    @api obj_parent_appt_wrapper_data;
    @track listExistInsuranceDetails;
    @track objInsuranceDetails;
    @track insuranceDetailRecord = {
        'Nominee_Relationship_Type__c': '',
        'Nominee_Relationship_with_Insured_Person__c': ''
    }
    @track mapDisbPayeeIdWithDocumentId;
    @track relationWithInsuredPersonPicklistVal;
    @track loanApplicantNames = [];
    showLoader = false;
    currentEditInsuranceDetailId = null; //this will store current editing Insurance Details Id
    @track acceptedFormats = ['.png', '.jpg', '.pdf'];
    @track fileData = {};

    @track nomineeTypeValue = [];

    get options() {
        return [
            { label: 'Part of Loan', value: 'Part of Loan' },
            { label: 'Not part of loan', value: 'Not part of loan' },
        ];
    }

    disableSaveEditBtn = false;
    personNameErr = '';
    personDobErr = '';
    nomineeTypeErr = '';
    nomineeNameErr = '';
    nomineeRelTypeErr = '';
    relWithInsuredPersonErr = '';
    kycIdTypeErr = '';
    kycIdNoErr = '';
    nomineeDobErr = '';
    insuranceReqErr = '';
    testResultErr = '';
    fileErrMsg = '';
    timeId = '';

    @wire(getObjectInfo, { objectApiName: INSURANCE_DETAIL_OBJECT })
    insuranceDetailMetadata;

    // now retriving the StageName picklist values of Opportunity

    @wire(getPicklistValues, {
        recordTypeId: '$insuranceDetailMetadata.data.defaultRecordTypeId',
        fieldApiName: INSURANCE_WAIVER
    }) insuranceWaiverPicklistVal;

    @wire(getPicklistValues, {
        recordTypeId: '$insuranceDetailMetadata.data.defaultRecordTypeId',
        fieldApiName: NOMINEE_RELATION_TYPE
    }) nomineeRelationTypePicklistVal;

    @wire(getPicklistValues, {
        recordTypeId: '$insuranceDetailMetadata.data.defaultRecordTypeId',
        fieldApiName: NOMINEE_KYC_ID_TYPE
    }) nomineeKycIdTypePicklistVal;

    @wire(getPicklistValues, {
        recordTypeId: '$insuranceDetailMetadata.data.defaultRecordTypeId',
        fieldApiName: INSURANCE_REQUIREMENT
    }) insuranceReqPicklistVal;

    @wire(getPicklistValues, {
        recordTypeId: '$insuranceDetailMetadata.data.defaultRecordTypeId',
        fieldApiName: INSURNCE_MEDICAL_TEST_RESULT
    }) medicalTestResultPicklistVal;


    bloodRelatives = [
        { label: 'Husband', value: 'Husband' },
        { label: 'Wife', value: 'Wife' },
        { label: 'Son', value: 'Son' },
        { label: 'Daughter', value: 'Daughter' },
        { label: 'Father', value: 'Father' },
        { label: 'Mother', value: 'Mother' },
        { label: 'Brother', value: 'Brother' },
        { label: 'Sister', value: 'Sister' },
        { label: 'Grandfather', value: 'Grandfather' },
        { label: 'Grandmother', value: 'Grandmother' },
    ];

    nonBloodRelatives = [
        { label: 'Uncle', value: 'Uncle ' },
        { label: 'Aunty', value: 'Aunty ' },
        { label: 'In laws', value: 'In laws ' },
        { label: 'Cousin', value: 'Cousin ' },
        { label: 'Nephew', value: 'Nephew' },
        { label: 'Neice', value: 'Neice' },
    ];

    applicationId = '';
    isExistInsuranceDetails = false;
    //--------------------------------------------------------------------------
    connectedCallback() {
        this.doInit();
    }
    //02/09/2022 : added By karan to reinit the datable 
    doInit() {
        this.nomineeTypeValue = [];
        this.loanApplicantNames = [];
        this.timeId = '';
        console.log('    ', JSON.stringify(this.obj_parent_appt_wrapper_data));
        this.applicationId = this.obj_parent_appt_wrapper_data.objAppt.Id;
        this.disbursalId = this.checkExistingDisbursalId();
        console.log('application id this.disbursalId ', this.applicationId, this.disbursalId);
        this.reInitInsuranceDetail();
        this.checkExistInsuranceDetailRecords();
        this.mapDisbPayeeIdWithDocumentId = new Map();
        this.disableSaveEditBtn = false;

        getInsuranceDetailRecords({ applicationId: this.applicationId }).then(result => {

            console.log('existing records of insurance details ', JSON.stringify(result), result.length);
            this.listExistInsuranceDetails = [];

            for (let index in result) {
                console.log('name ', index, result[index]);
                result[index].nomineeType = '';
                if (result[index].Part_of_Loan__c) {
                    result[index].nomineeType = 'Part of Loan';
                }
                if (result[index].Not_Part_of_Loan__c) {
                    if (result[index].nomineeType != '') {
                        result[index].nomineeType += ', ';
                    }
                    result[index].nomineeType += 'Not part of loan';
                }
                this.listExistInsuranceDetails.push(result[index]);

            }
            console.log('Doinit this.listExistInsuranceDetails ', JSON.stringify(this.listExistInsuranceDetails));

            this.getLoanApptNames();
        }).catch(error => {
            console.log('error occured', error);
        });


    }
    getLoanApptNames() {

        getLoanAplicantNames({ applicationId: this.applicationId }).then(result => {
            console.log('Search Result ', JSON.stringify(result), result);
            try {


                for (let index in result) {
                    console.log('name ', index, result[index]);
                    this.loanApplicantNames.push({
                        label: '' + result[index], value: '' + result[index]
                    });
                }
            } catch (error) {
                console.log('error ', error.message);
            }
        }).catch(error => {
            console.log('error occured', error);
        });
    }
    get existingInsuranceLength() {
        return this.listExistInsuranceDetails && this.listExistInsuranceDetails.length > 0 ? true : false;
    }

    checkExistingDisbursalId() {

        if (this.obj_parent_appt_wrapper_data.objAppt.hasOwnProperty('Disbursals__r')) {
            return this.obj_parent_appt_wrapper_data.objAppt.Disbursals__r[0].Id;
        }
        return null;
    }


    renderedCallback() {
        this.enableDisableFields();
    }

    get uploadedfileName() {
        return this.fileData.hasOwnProperty('filename') ? this.fileData.filename : 'Nominee KYC Uploaded';
    }

    reInitInsuranceDetail() {
        this.insuranceDetailRecord = { 'sobjectType': 'Insurance_Details__c', 'Nominee_Relationship_Type__c': '' };
    }

    handleInputChange(event) {
        console.log('event.detail.value 123 ', event.target.dataset.field + ' ' + event.detail.value);
        this.insuranceDetailRecord[event.target.dataset.field] = event.detail.value;

        if (event.target.dataset.field == 'Nominee_Type__c') {
            if (event.detail.value.includes('Part of Loan')) {
                this.nomineeTypeValue.push('Part of Loan');
            }

            if (event.detail.value.includes('Not part of loan')) {
                this.nomineeTypeValue.push('Not part of loan');
            }
        }

        if (event.target.dataset.field == 'Insurance_Waiver__c' && event.detail.value == 'Yes' && this.insuranceDetailRecord.Id) {
            let tempInsuranceDetailId = this.insuranceDetailRecord.Id;
            if (this.insuranceDetailRecord.Insurance_Waiver__c == 'Yes') {
                this.insuranceDetailRecord = {};
                this.insuranceDetailRecord.Insurance_Waiver__c = 'Yes';
                this.insuranceDetailRecord.Id = tempInsuranceDetailId;
                this.nomineeTypeValue = [];
            }
        }

        let nomineeRelationType = this.template.querySelector("lightning-combobox[data-field=Nominee_Relationship_Type__c]").value;
        console.log('nomineeRelationType ', nomineeRelationType, this.insuranceDetailRecord.Nominee_Relationship_with_Insured_Person__c);
        // if (this.insuranceDetailRecord.Nominee_Relationship_with_Insured_Person__c && this.insuranceDetailRecord.Nominee_Relationship_with_Insured_Person__c != '') {
        if (nomineeRelationType == 'Blood Relative') {
            console.log('inside if ', this.bloodRelatives);
            this.relationWithInsuredPersonPicklistVal = this.bloodRelatives;
        } else if (nomineeRelationType == 'Not a Blood Relative') {
            console.log('inside else  ', this.nonBloodRelatives);
            this.relationWithInsuredPersonPicklistVal = this.nonBloodRelatives;
        }
        // }
        // console.log('this.relationWithInsuredPersonPicklistVal ', this.relationWithInsuredPersonPicklistVal);
        // if (event.target.dataset.field == 'Beneficiary_Amount__c') {
        //     this.objDisbursalPayee[event.target.dataset.field] = Math.round(this.objDisbursalPayee[event.target.dataset.field] * 100) / 100;
        // }
        console.log('this.insuranceDetailRecord.id inside rendered callback ', this.insuranceDetailRecord, this.insuranceDetailRecord.id);
        this.enableDisableFields();
    }

    enableDisableFields() {
        // console.log('enableDisableFields ');
        let insuredPersonName = this.template.querySelector("lightning-combobox[data-field=Insured_Person_Name__c]")?.value;
        let nomineeName = this.template.querySelector("lightning-combobox[data-field=Nominee_Name__c]")?.value;

        // console.log('enableDisableFields 123 ', insuredPersonName, nomineeName);

        if (insuredPersonName && nomineeName) {
            if (insuredPersonName && insuredPersonName != '' && nomineeName && nomineeName != '' && insuredPersonName == nomineeName) {
                // alert('Insured Person Name and Nominee Name cannot be same');
                this.showNotification('ERROR', 'Insured Person Name and Nominee Name cannot be same', 'error');
                this.template.querySelector("lightning-combobox[data-field=Nominee_Name__c]").value = '';
                this.template.querySelector("lightning-combobox[data-field=Insured_Person_Name__c]").value = '';

            }
        }
        console.log('this.template.querySelector("lightning-combobox[data-field=Insurance_Waiver__c]")?.value ', this.template.querySelector("lightning-combobox[data-field=Insurance_Waiver__c]")?.value, this.insuranceDetailRecord.Insurance_Waiver__c);
        if (this.insuranceDetailRecord.Insurance_Waiver__c == 'Yes') {
            this.template.querySelector("lightning-combobox[data-field=Insurance_Waiver__c]").value = 'Yes';
        }
        let insuranceWaiver = this.template.querySelector("lightning-combobox[data-field=Insurance_Waiver__c]")?.value;
        // console.log('insuranceWaiverinsuranceWaiverinsuranceWaiver  ', insuranceWaiver);

        if (insuranceWaiver == 'Yes' || this.insuranceDetailRecord.Insurance_Waiver__c == 'Yes') {
            console.log('inside insurance waiver if condition ');
            this.template.querySelectorAll("lightning-input").forEach(element => {
                element.required = false;
                element.disabled = true;
            });
            this.template.querySelectorAll("lightning-combobox").forEach(element => {
                if (element.label != 'Insurance Waiver') {
                    element.required = false;
                    element.disabled = true;
                }
            });
            this.template.querySelectorAll("lightning-checkbox-group").forEach(element => {
                element.required = false;
                element.disabled = true;
            });
        } else if (insuranceWaiver == 'No') {
            this.template.querySelectorAll("lightning-input").forEach(element => {
                element.required = true;
                element.disabled = false;
            });
            this.template.querySelectorAll("lightning-checkbox-group").forEach(element => {
                element.required = true;
                element.disabled = false;
            });
            this.template.querySelectorAll("lightning-combobox").forEach(element => {
                if (element.label != 'Insurance Waiver') {
                    element.required = true;
                    element.disabled = false;
                }
            });
        }

        console.log('neeraj here 1', this.currentEditInsuranceDetailId, this.insuranceDetailRecord.id);
        if (this.currentEditInsuranceDetailId && this.currentEditInsuranceDetailId != '') {
            this.template.querySelectorAll("lightning-input").forEach(element => {
                console.log('neeraj here 2');
                if (element.label == 'Nominee KYC Uploaded') {
                    console.log('neeraj here 3 ', element.required);
                    element.required = false;
                }
            });
        }

    }
    //--------------------------------------------------------------------------c/aC_LWC
    checkExistInsuranceDetailRecords() {

        // this.listExistInsuranceDetails = null;
        this.objInsuranceDetails = null;
        this.isExistInsuranceDetails = false;
        //if we have disbursal id then check if we have any existing Insurance records
        if (this.checkExistingDisbursalId()) {

            getParentAndRelatedData({
                recordId: this.checkExistingDisbursalId(),
                childObjectName: 'Insurance_Details__r',
                parentObjectName: 'Disbursal__c'
            }).then((result) => {

                console.log('Fiv_Disb_Lwc checkExistInsuranceDetailRecords = ', JSON.stringify(result));

                if (result.statusCode !== 200) {

                    this.showNotification('ERROR', result.message, 'error'); //incase if any apex exception happened it will show notification
                    this.showLoader = false;
                } else {

                    //if any existing record found
                    if (result.objSobject.hasOwnProperty('Insurance_Details__r')) {

                        var arrInsuranceDetailsIds = [];
                        console.log(result.objSobject.Insurance_Details__r);
                        for (var key in result.objSobject.Insurance_Details__r) {

                            arrInsuranceDetailsIds.push(result.objSobject.Insurance_Details__r[key].Id);
                        }
                        this.isExistInsuranceDetails = true;
                        this.getExistInsuranceDetailRecords(arrInsuranceDetailsIds);
                    } else {

                        //create a new record
                        this.getInsuranceDetails(null);
                    }
                }

            }).catch((err) => {

                //incase if any Salesforce exception happened it will show notification
                console.log('Error in Fiv_Disb_Lwc checkExistInsuranceDetailRecords = ', err);
                this.showNotification('ERROR', err.message, 'error');
                this.showLoader = false;
            });
        } else {
            //if any disbursal record does not exist that means there are no records of insurance
            this.getInsuranceDetails(null);
        }

    }
    //--------------------------------------------------------------------------
    //used to create/ edit single Insurace Detail Record
    //recordIds - Null means new record, Not Null means existing record 
    getInsuranceDetails(recordIds) {
        this.objInsuranceDetails = undefined;
        this.showLoader = true;
        //this.obj_parent_appt_wrapper_data.disbMetaPrefix will define the component will open for disbursal author or maker ex DISBM_Loan_Parameters
        getMetaDataFields({ recordIds: recordIds, metaDetaName: this.obj_parent_appt_wrapper_data.disbMetaPrefix + 'Insurance_Details' }).then((result) => {
            console.log('Fiv_Disb_Lwc objInsuranceDetails = ', result);
            this.objInsuranceDetails = result.data;
            this.showLoader = false;
        }).catch((err) => {
            //incase if any Salesforce exception happened it will show notification
            console.log('Error in Fiv_Disb_Lwc getInsuranceDetails = ', err);
            this.showNotification('ERROR', err.message, 'error');
            this.showLoader = false;
        });
    }
    //this method will call exisitng records for the data table
    getExistInsuranceDetailRecords(arrInsuranceDetailsIds) {

        //this.listExistInsuranceDetails = [];
        this.showLoader = true;
        //this.obj_parent_appt_wrapper_data.disbMetaPrefix will define the component will open for disbursal author or maker ex DISBM_Loan_Parameters
        getRelatedRecords({ setRecordIds: arrInsuranceDetailsIds, metadataName: this.obj_parent_appt_wrapper_data.disbMetaPrefix + 'Insurance_Details' }).then((result) => {
            console.log('Fiv_Disb_Lwc getInsuranceDetails = ', result);
            // this.listExistInsuranceDetails = result;
            // this.listExistInsuranceDetails = JSON.parse(this.listExistInsuranceDetails.strDataTableData);
            // console.log('listExistInsuranceDetails ', JSON.stringify(this.listExistInsuranceDetails));
            this.showLoader = false;
        }).catch((err) => {
            //incase if any Salesforce exception happened it will show notification
            console.log('Error in Fiv_Disb_Lwc getInsuranceDetails = ', err);
            this.showNotification('ERROR', err.message, 'error');
            this.showLoader = false;
        });
    }
    //--------------------------------------------------------------------------
    handleFieldChanges(event) {
        console.log('handleFieldChanges= ', event.detail.CurrentFieldAPIName);
        //this.handleFormValueChange(event);
    }
    handleSelectedRecord(event) {
        console.log('event.detail called>>>>>> ', event.detail);
        console.log('Edit called #### ', JSON.stringify(event.detail));
        this.fileData = {};
        this.fileErrMsg = '';
        this.currentEditInsuranceDetailId = event.detail.recordData.Id;
        this.getInsuranceDetails(this.currentEditInsuranceDetailId);

    }
    addRow() {
        this.insuranceDetailRecord = {};
        this.reInitInsuranceDetail();
        this.currentEditInsuranceDetailId = null;
        this.getInsuranceDetails(null);
        this.fileErrMsg = '';
    }
    handleCancel() {
        this.objInsuranceDetails = null;
        this.currentEditInsuranceDetailId = null;
    }
    //--------------------------------------------------------------------------
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
                    'filename': this.obj_parent_appt_wrapper_data.disbMetaPrefix + 'NomineeKYCUpload- ' + file.name,
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
    showNotification(title, msg, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title: title,
            message: msg,
            variant: variant
        }));
    }
    checkExistingDisbursalId() {

        if (this.obj_parent_appt_wrapper_data.objAppt.hasOwnProperty('Disbursals__r')) {
            console.log('this.obj_parent_appt_wrapper_data.Disbursals__r[0].Id ' + this.obj_parent_appt_wrapper_data.objAppt.Disbursals__r[0].Id);
            return this.obj_parent_appt_wrapper_data.objAppt.Disbursals__r[0].Id;
        }
        return null;
    }

    //--------------------------------------------------------------------------
    //02/09/2022 : added By karan to check for the validation if atleast one record is
    @api
    checkBeforeSubmit() {

        var custEvt;
        if (!this.listExistInsuranceDetails || this.listExistInsuranceDetails.length == 0) {
            custEvt = new CustomEvent("checkbeforesubmit", {
                detail: { isValid: false, msg: 'Atleast add one insurance detail record.', fieldName: 'insuranceDetails' }
            });
        } else {
            custEvt = new CustomEvent("checkbeforesubmit", {
                detail: { isValid: true, msg: '', fieldName: 'insuranceDetails' }
            });
        }

        this.dispatchEvent(custEvt);
    }


    validateFields() {
        let isDataValid = true;

        console.log('nomineeTypeValuenomineeTypeValue ', this.template.querySelector("lightning-checkbox-group").value, this.nomineeTypeValue);

        let nomineeType = this.template.querySelector("lightning-checkbox-group");

        this.nomineeTypeValue.forEach(function (entry) {
            console.log('value of nominee type ', entry);
        });


        this.template.querySelectorAll("lightning-input").forEach(element => {
            console.log('element Input Name neeraj 123' + element.label + ' Value : ' + element.value);
            if (element.label == 'Insured Person Date of Birth' && element.disabled == false) {
                if (!element.value) {
                    // this.personDobErr = 'Complete this field.';
                    isDataValid = false;
                    return isDataValid;
                } else {
                    // this.personDobErr = '';
                    // element.style = '';
                }
            } else if (element.label == 'Nominee Relationship with Insured Person' && element.disabled == false) {
                if (!element.value) {
                    // this.relWithInsuredPersonErr = 'Complete this field.';
                    isDataValid = false;
                    return isDataValid;
                } else {
                    // this.relWithInsuredPersonErr = '';
                    // element.style = '';
                }
            } else if (element.label == 'Nominee KYC ID No' && element.disabled == false) {
                if (!element.value) {
                    // this.kycIdNoErr = 'Complete this field.';
                    isDataValid = false;
                    return isDataValid;
                } else {
                    // this.kycIdNoErr = '';
                    // element.style = '';
                }
            } else if (element.label == 'Nominee KYC Uploaded' && element.disabled == false && element.required == true) {
                if (!this.fileData.hasOwnProperty('filename')) {
                    // this.kycIdNoErr = 'Complete this field.';
                    isDataValid = false;
                    return isDataValid;
                } else {
                    // this.kycIdNoErr = '';
                    // element.style = '';
                }
            }
        });

        this.template.querySelectorAll("lightning-combobox").forEach(element => {
            console.log('element Input Name neeraj 123' + element.label + ' Value : ' + element.value);
            if (element.label == 'Insurance Waiver' && element.disabled == false) {
                if (!element.value) {
                    // this.personDobErr = 'Complete this field.';
                    isDataValid = false;
                    return isDataValid;
                } else {
                    // this.personDobErr = '';
                    // element.style = '';
                }
            } else if (element.label == 'Insured Person Name' && element.disabled == false) {
                if (!element.value) {
                    // this.relWithInsuredPersonErr = 'Complete this field.';
                    isDataValid = false;
                    return isDataValid;
                } else {
                    // this.relWithInsuredPersonErr = '';
                    // element.style = '';
                }
            } else if (element.label == 'Nominee Name' && element.disabled == false) {
                if (!element.value) {
                    // this.kycIdNoErr = 'Complete this field.';
                    isDataValid = false;
                    return isDataValid;
                } else {
                    // this.kycIdNoErr = '';
                    // element.style = '';
                }
            } else if (element.label == 'Nominee Relationship Type' && element.disabled == false) {
                if (!element.value) {
                    // this.kycIdNoErr = 'Complete this field.';
                    isDataValid = false;
                    return isDataValid;
                } else {
                    // this.kycIdNoErr = '';
                    // element.style = '';
                }
            } else if (element.label == 'Nominee Relationship with Insured Person' && element.disabled == false) {
                if (!element.value) {
                    // this.kycIdNoErr = 'Complete this field.';
                    isDataValid = false;
                    return isDataValid;
                } else {
                    // this.kycIdNoErr = '';
                    // element.style = '';
                }
            } else if (element.label == 'Nominee KYC ID Type' && element.disabled == false) {
                if (!element.value) {
                    // this.kycIdNoErr = 'Complete this field.';
                    isDataValid = false;
                    return isDataValid;
                } else {
                    // this.kycIdNoErr = '';
                    // element.style = '';
                }
            } else if (element.label == 'Insurance Requirement' && element.disabled == false) {
                if (!element.value) {
                    // this.kycIdNoErr = 'Complete this field.';
                    isDataValid = false;
                    return isDataValid;
                } else {
                    // this.kycIdNoErr = '';
                    // element.style = '';
                }
            } else if (element.label == 'Insurance Medical Test Result' && element.disabled == false) {
                if (!element.value) {
                    // this.kycIdNoErr = 'Complete this field.';
                    isDataValid = false;
                    return isDataValid;
                } else {
                    // this.kycIdNoErr = '';
                    // element.style = '';
                }
            }
        });

        if (this.nomineeTypeValue.length <= 0 && nomineeType.disabled == false) {
            isDataValid = false;
        }

        return isDataValid;
    }


    handleSave() {

        this.showLoader = true;
        this.disableSaveEditBtn = true;
        let isDataValid = this.validateFields();

        console.log('isDataValidisDataValid ', isDataValid, typeof isDataValid, this.insuranceDetailRecord.Insurance_Waiver__c);
        //only for new record validation and if insurance waiver is yes
        if (!this.fileData.hasOwnProperty('filename') && !this.currentEditInsuranceDetailId && this.insuranceDetailRecord.Insurance_Waiver__c != 'Yes' && (this.currentEditInsuranceDetailId || this.currentEditInsuranceDetailId != '')) {
            console.log('throwing file error ', this.currentEditInsuranceDetailId);
            //that means the file is not uploaded
            this.fileErrMsg = 'Please upload Nominee KYC.';
            this.delayAction(false, false);
            return;
        }
        // == true || isDataValid == 'true'
        if (isDataValid) {
            this.showLoader = true;

            // console.log('this.insuranceDetailRecord ', this.objDisbursalPayee.Id, this.insuranceDetailRecord);

            if (this.nomineeTypeValue.includes('Part of Loan')) {
                this.insuranceDetailRecord.Part_of_Loan__c = true;
            } else {
                this.insuranceDetailRecord.Part_of_Loan__c = false;
            }
            if (this.nomineeTypeValue.includes('Not part of loan')) {
                this.insuranceDetailRecord.Not_Part_of_Loan__c = true;
            } else {
                this.insuranceDetailRecord.Not_Part_of_Loan__c = false;
            }
            //=========== calling save method ===================//

            delete this.insuranceDetailRecord.Nominee_Type__c;

            this.insuranceDetailRecord.Application__c = this.applicationId;
            this.insuranceDetailRecord.Disbursal__c = this.disbursalId;
            console.log('this.insuranceDetailRecord Before' + JSON.stringify(this.insuranceDetailRecord));
            //Added By Karan 03/09/2022
            if (this.insuranceDetailRecord.hasOwnProperty('Application__r')) {
                delete this.insuranceDetailRecord.Application__r;
            }
            if (this.insuranceDetailRecord.hasOwnProperty('nomineeType')) {
                delete this.insuranceDetailRecord.nomineeType;
            }
            if (this.insuranceDetailRecord.hasOwnProperty('Id')
                && this.insuranceDetailRecord.Id) {
                delete this.insuranceDetailRecord.Application__c;
                delete this.insuranceDetailRecord.Disbursal__c;
            }
            console.log('this.insuranceDetailRecord after' + JSON.stringify(this.insuranceDetailRecord));

            if (this.insuranceDetailRecord.Insurance_Waiver__c == 'Yes') {

                this.insuranceDetailRecord.Insured_Person_Name__c = null;
                this.insuranceDetailRecord.Insured_Person_Date_of_Birth__c = null;
                this.insuranceDetailRecord.Not_Part_of_Loan__c = null;
                this.insuranceDetailRecord.Part_of_Loan__c = null;
                this.insuranceDetailRecord.Nominee_Name__c = null;
                this.insuranceDetailRecord.Nominee_Relationship_Type__c = null;
                this.insuranceDetailRecord.Nominee_Relationship_with_Insured_Person__c = null;
                this.insuranceDetailRecord.Nominee_KYC_ID_Type__c = null;
                this.insuranceDetailRecord.Nominee_KYC_ID_No__c = null;
                this.insuranceDetailRecord.Nominee_DOB_as_per_KYC__c = null;
                this.insuranceDetailRecord.Insurance_Requirement__c = null;
                this.insuranceDetailRecord.Insurance_Medical_Test_Result__c = null;
            }
            //END 03/09/2022
            saveInsuranceDetailData({
                objDisbursal: this.insuranceDetailRecord,
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

                    // below code should display the table only
                    //this.addRow();
                    this.insuranceDetailRecord = {};
                    this.currentEditInsuranceDetailId = null;
                    this.delayAction(false, false);
                    this.doInit();//02/09/2022 : added By karan to fetch the data again
                }

                //this.showLoader = false; //this is removed as loader will be  false once data is load
            }).catch((err) => {

                //incase if any Salesforce exception happened it will show notification
                console.log('Error in Fiv_Disb_Lwc handleSave = ', err);
                this.showNotification('ERROR', err.message, 'error');
                this.delayAction(false, false);
            });

            //=================================  Saving Method END ===============================
        } else {
            this.showNotification('ERROR', 'Please complete fields', 'error');
            this.delayAction(false, false);
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
    handleEditRecord(event) {
        try {

            this.addRow();
            this.nomineeTypeValue = [];
            console.log('index', event.target.dataset.index, JSON.parse(JSON.stringify(this.listExistInsuranceDetails[event.target.dataset.index])));
            if (this.listExistInsuranceDetails[event.target.dataset.index]) {
                this.enableDisableFields();
                this.insuranceDetailRecord = JSON.parse(JSON.stringify(this.listExistInsuranceDetails[event.target.dataset.index]))
                this.currentEditInsuranceDetailId = this.insuranceDetailRecord.Id;
                console.log('this.insuranceDetailRecord ', this.insuranceDetailRecord);
                let nomineeRelationType = this.insuranceDetailRecord.Nominee_Relationship_Type__c;
                if (nomineeRelationType == 'Blood Relative') {
                    console.log('inside if ', this.bloodRelatives);
                    this.relationWithInsuredPersonPicklistVal = this.bloodRelatives;
                } else if (nomineeRelationType == 'Not a Blood Relative') {
                    console.log('inside else  ', this.nonBloodRelatives);
                    this.relationWithInsuredPersonPicklistVal = this.nonBloodRelatives;
                }


                if (this.insuranceDetailRecord.Part_of_Loan__c) {
                    this.nomineeTypeValue.push('Part of Loan');
                }
                if (this.insuranceDetailRecord.Not_Part_of_Loan__c) {
                    this.nomineeTypeValue.push('Not part of loan');
                }
                // this.enableDisableFields();
            }
            // this.enableDisableFields();
        } catch (error) {
            console.log('error ', error.message);
        }


    }

    viewDocument(event) {
        console.log('inside view document neeraj ', event.target.dataset.index, this.listExistInsuranceDetails.length, this.listExistInsuranceDetails);
        console.log('inside view document neeraj', this.listExistInsuranceDetails[event.target.dataset.index].Id);
        console.log('this.mapDisbPayeeIdWithDocumentId', this.mapDisbPayeeIdWithDocumentId);
        var disbPayeeId = this.listExistInsuranceDetails[event.target.dataset.index].Id;
        if (this.mapDisbPayeeIdWithDocumentId.has(disbPayeeId)) {

            this.navigateDocument(this.mapDisbPayeeIdWithDocumentId.get(disbPayeeId));
        } else {

            this.showLoader = true;
            getDocumentId({
                parentId: disbPayeeId,
                documentPrefix: this.obj_parent_appt_wrapper_data.disbMetaPrefix + 'NomineeKYCUpload- '
            }).then((result) => {

                console.log('getDocumentId neeraj  = ', JSON.stringify(result));
                if (result.length > 0) {
                    this.navigateDocument(result[0].ContentDocumentId);
                    this.mapDisbPayeeIdWithDocumentId.set(disbPayeeId, result[0].ContentDocumentId);
                }
                else {
                    this.showNotification('', 'No document found.', 'warning');
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
}