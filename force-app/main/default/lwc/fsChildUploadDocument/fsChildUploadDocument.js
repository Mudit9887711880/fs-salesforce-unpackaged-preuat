import { api, LightningElement, track, wire } from 'lwc';
import USER_ID from '@salesforce/user/Id';
import NAME_FIELD from '@salesforce/schema/User.Name';
import { getRecord } from 'lightning/uiRecordApi';


import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';

import TYPE_FIELD from '@salesforce/schema/Document_Master__c.Type__c';
import FAMILY_FIELD from '@salesforce/schema/Document_Master__c.Family__c';
import AGREEMENT_DOCUMENT_TYPE_FIELD from '@salesforce/schema/ContentVersion.Agreement_Document_Type__c';
import DOCUMENT_CONDITION_FIELD from '@salesforce/schema/ContentVersion.Document_Condition__c';


import STATUS_FIELD from '@salesforce/schema/ContentVersion.Status__c';
import DEFERAL_STAGE_FIELD from '@salesforce/schema/ContentVersion.Deferal_Stage__c';

import getAllRequiredDocument from '@salesforce/apex/fsGenericUploadDocumentsController.getAllRequiredDocument';
import getAllApplicantData from '@salesforce/apex/fsGenericUploadDocumentsController.getAllApplicantData';
import getAllAssetData from '@salesforce/apex/fsGenericUploadDocumentsController.getAllAssetData';
import getUploadedRecords from '@salesforce/apex/fsGenericUploadDocumentsController.getUploadedRecords';
import uploadAddtionalDocument from '@salesforce/apex/fsGenericUploadDocumentsController.uploadAddtionalDocument';

import uploadFile from '@salesforce/apex/fsGenericUploadDocumentsController.uploadFile';
export default class FsChildUploadDocument extends LightningElement {
    @api stageName;
    @api applicationId;
    @api recordTypeId;
    @api isAgreementExecution;
    //Picklist Variables Start Here
    @track agreementDocumentTypePicklistOption;
    @track documentConditionPicklistOption
    @track typePicklistOption;
    @track applicantPicklistOption;
    @track assetPicklistOption;
    @track statusPicklistOption;
    @track deferalPicklistOption;
    @track familyPicklistOption;
    @track originalPicklistOption = [
        { label: 'Yes', value: 'Yes' },
        { label: 'No', value: 'No' }
    ]
    //Picklist Variables End Here

    //Flag Variables Start Here
    @track isSpinnerActive;
    @track isTypeApplication;
    @track isTypeApplicant;
    @track isTypeAsset;
    @track isAddtionalDocument;
    @track actualApplicationDocLength;
    @track actualApplicantDocLength;
    @track actualAssetDocLength;
    //Flag Variables End Here

    //Data Variables Start Here
    @track actualDocumentLength;
    @track documentType;
    @track documentRequiredData;
    @track docApplicationReq;
    @track docApplicantReq;
    @track docAssetReq;
    @track allApplicantData;
    @track allAssetData;
    @track objectRecords;
    @track uploadedDocData;
    @track assetId;
    @track applicantId
    @track newRowData = {
        serialNumber: '',
        noOfPages: '',
        applicantId : '',
        assetId : '',
        documentName: '',
        documentFamily: '',
        applicableFor: '',
        mandatory: 'No',
        original: '',
        status: '',
        deferalStage: '',
        upload: '',
        stage: this.stageName,
        waiverReason: '',
        remarks: '',
        receivedDate: '',
        deferalDate: '',
        documentType : '',
        type : '',
        deferredDateDisable: '',
        deferredStageDisable: '',
        waiverReasonDisable: '',
        receivedDateDisable: '',
        isAddVisible: true,
        isInputField: true
    };
    //Data Variables End Here
    //File Upload Variables
    fileData
    @track userName;
    @track userId;
    @track additionalDocumentData = [
        {
            serialNumber: 1,
            description: '',
            userName: '',
        }
    ];
    @track addtionalDocData = {}
    @wire(getRecord, { recordId: USER_ID, fields: [NAME_FIELD] })
    wireuser({ error, data }) {
        if (error) {
            this.error = error;
        } else if (data) {
            console.log('data :: ', JSON.stringify(data));
            this.userName = data.fields.Name.value;
            this.userId = data.id;
            this.additionalDocumentData[0].userName = this.userName;
        }
    }
    /**TEST */
    @wire(getPicklistValues, { recordTypeId: '012000000000000AAA', fieldApiName: AGREEMENT_DOCUMENT_TYPE_FIELD })
    picklistAgreementDocumentValues({ error, data }) {
        if (data) {
            console.log(data);
            this.agreementDocumentTypePicklistOption = data.values;
        } else if (error) {
            console.log(error);
        }
    }
    @wire(getPicklistValues, { recordTypeId: '012000000000000AAA', fieldApiName: DOCUMENT_CONDITION_FIELD })
    picklistDocumentConditionValues({ error, data }) {
        if (data) {
            console.log(data);
            this.documentConditionPicklistOption = data.values;
        } else if (error) {
            console.log(error);
        }
    }

    @wire(getPicklistValues, { recordTypeId: '012000000000000AAA', fieldApiName: STATUS_FIELD })
    picklistStatusValues({ error, data }) {
        if (data) {
            console.log(data);
            this.statusPicklistOption = data.values;
        } else if (error) {
            console.log(error);
        }
    }
    @wire(getPicklistValues, { recordTypeId: '012000000000000AAA', fieldApiName: DEFERAL_STAGE_FIELD })
    picklistDeferalValues({ error, data }) {
        if (data) {
            console.log(data);
            this.deferalPicklistOption = data.values;
        } else if (error) {
            console.log(error);
        }
    }

    @wire(getPicklistValues, { recordTypeId: '012000000000000AAA', fieldApiName: TYPE_FIELD })
    picklistTypeValues({ error, data }) {
        if (data) {
            console.log(data);
            this.typePicklistOption = data.values;
        } else if (error) {
            console.log(error);
        }
    }
    @wire(getPicklistValues, { recordTypeId: '012000000000000AAA', fieldApiName: FAMILY_FIELD })
    picklistFamilyValues({ error, data }) {
        if (data) {
            console.log(data);
            this.familyPicklistOption = data.values;
        } else if (error) {
            console.log(error);
        }
    }
    connectedCallback() {
        console.log('recordTypeId #### ', this.recordTypeId)
        this.getApplicationRequiredDoc('Application');
        this.getApplicantRequiredDoc('Applicant');
        this.getAssetRequiredDoc('Asset');
    }
    getUploadedRecords() {
        getUploadedRecords({ parentId: this.applicationId, stage: this.stageName })
            .then(result => {
                console.log('uploaded document :: ', JSON.stringify(result));
                this.uploadedDocData = result;
            })
            .catch(error => {

            })
    }
    previewFrontImage(event) {
        var contentDocumentId = event.target.dataset.index;
        console.log('contentDocumentId ### ', contentDocumentId);
        this[NavigationMixin.Navigate]({
            type: 'standard__namedPage',
            attributes: {
                pageName: 'filePreview'
            },
            state: {
                selectedRecordId: contentDocumentId
            }
        })
    }
    handleInputChange(event) {
        console.log('name :: ', event.target.name);
        console.log('value :: ', event.target.value);
        var name = event.target.name;
        var value = event.target.value;
        /**
         * Use For Type Picklist
         */
        if (name === 'type-picklist') {
            this.isTypeApplication = false;
            this.isTypeApplicant = false;
            this.isTypeAsset = false;
            this.documentRequiredData = [];
            this.objectRecords = undefined;
            if (value === 'Application') {
                this.documentType = 'Application Document';
                this.isTypeApplication = true;
                this.documentRequiredData = JSON.parse(JSON.stringify(this.docApplicationReq));
                this.actualApplicationDocLength = this.docApplicationReq.length;
            }
            if (value === 'Applicant') {
                this.documentType = 'Applicant Document';
                this.isTypeApplicant = true;
                console.log('documentRequiredData  picklist :: ', this.documentRequiredData);
                this.getAllApplicantData();
            }
            if (value === 'Asset') {
                this.documentType = 'Asset Document';
                this.isTypeAsset = true;
                this.getAllAssetData();
            }
        }
        /**
         * Use For Applicable Picklist
         */
        if (name === 'applicant-picklist') {
            this.isSpinnerActive = true;
            this.objectRecords = [];
            this.documentRequiredData = JSON.parse(JSON.stringify(this.docApplicantReq));
            this.actualApplicantDocLength = this.documentRequiredData.length;
            if (this.documentRequiredData.length > 0) {
                this.allApplicantData.forEach(element => {
                    var splitedData = value.split('-');
                    if (element.Id === splitedData[0]) {
                        this.applicantId = splitedData[1];
                        var data = { 'Id': splitedData[1], 'Name': element.Customer_Type__c + ' - ' + element.Customer_Information__r.Name }
                        this.objectRecords.push(data);
                    }
                });
                this.isSpinnerActive = false;
                console.log('objectRecords :: ', JSON.stringify(this.objectRecords));
                console.log('documentRequiredData :: ', JSON.stringify(this.documentRequiredData));
            } else {
                this.isSpinnerActive = false;
                this.toast('Warning', 'Warning', 'No Document Found.');
                this.documentType = '';
            }
            console.log(' #### objectRecords #### ', JSON.stringify(this.objectRecords));
        }
        /**
         * Use For Asset Picklist
         */

        if (name === 'asset-picklist') {
            this.isSpinnerActive = true;
            this.objectRecords = [];
            this.documentRequiredData = JSON.parse(JSON.stringify(this.docAssetReq));
            this.actualAssetDocLength = this.documentRequiredData.length;
            if (this.documentRequiredData.length > 0) {
                this.allAssetData.forEach(element => {
                    if (element.Id === value) {
                        this.assetId = element.Id;
                        var data = { 'Id': element.Id, 'Name': element.Name }
                        this.objectRecords.push(data);
                    }
                });
                this.isSpinnerActive = false;
            } else {
                this.isSpinnerActive = false;
                this.toast('Warning', 'Warning', 'No Document Found.');
                this.documentType = ''
            }
            console.log('property record :: :: ', JSON.stringify(this.objectRecords));
        }
    }

    getApplicationRequiredDoc(filter) {
        getAllRequiredDocument({ stageName: this.stageName, filter: filter })
            .then(result => {
                console.log('Result Application Required Doc :: ', JSON.stringify(result));
                this.docApplicationReq = result;
                this.isSpinnerActive = false;
            })
            .catch(error => {

            })
    }
    getApplicantRequiredDoc(filter) {
        getAllRequiredDocument({ stageName: this.stageName, filter: filter })
            .then(result => {
                console.log('Result Applicant Required Doc :: ', JSON.stringify(result));
                this.docApplicantReq = result;
                this.isSpinnerActive = false;
            })
            .catch(error => {

            })
    }
    getAssetRequiredDoc(filter) {
        getAllRequiredDocument({ stageName: this.stageName, filter: filter })
            .then(result => {
                console.log('Result Asset Required Doc :: ', JSON.stringify(result));
                this.docAssetReq = result;
                this.isSpinnerActive = false;
            })
            .catch(error => {

            })
    }

    getAllApplicantData() {
        getAllApplicantData({ applicationId: this.applicationId })
            .then(result => {
                console.log('Result All Applicant Data :: ', JSON.stringify(result));
                this.applicantPicklistOption = [];
                result.forEach(element => {
                    var applicantOptions = { label: element.Applicant_Name__c, value: element.Id + '-' + element.Customer_Information__c};
                    this.applicantPicklistOption.push(applicantOptions);
                })
                this.allApplicantData = result
                this.isSpinnerActive = false;
            })
            .catch(error => {

            })
    }
    getAllAssetData() {
        getAllAssetData({ applicationId: this.applicationId, recordTypeId: this.recordTypeId })
            .then(result => {
                this.assetPicklistOption = [];
                console.log('Result All Asset Document :: ', JSON.stringify(result));
                result.forEach(element => {
                    var assetOptions = { label: element.Name, value: element.Id };
                    this.assetPicklistOption.push(assetOptions);
                })

                this.allAssetData = result;
                this.isSpinnerActive = false;
            })
            .catch(error => {

            })
    }

    selectOptionChange(event) {
        var name = event.target.name;
        var value = event.target.value;
        var rowNo = event.target.getAttribute("data-row-index");

        console.log('name from select Option:: ', name);
        console.log('rowNo from select Option:: ', value);
        console.log('rowNo from select Option:: ', rowNo);
        console.log('documentRequiredData from select Option:: ', JSON.stringify(this.documentRequiredData));
        
        if ((name === 'application-status' || name === 'applicant-status' || name === 'asset-status') && value === 'Waived') {
            this.documentRequiredData[rowNo]['waiverReasonDisable'] = false;
        } else if ((name === 'application-status' || name === 'applicant-status' || name === 'asset-status') && value !== 'Waived') {
            this.documentRequiredData[rowNo]['waiverReason'] = '';
            this.documentRequiredData[rowNo]['waiverReasonDisable'] = true;
        }
        if ((name === 'application-status' || name === 'applicant-status' || name === 'asset-status') && value === 'Deferred') {
            this.documentRequiredData[rowNo]['deferredStageDisable'] = false;
            this.documentRequiredData[rowNo]['deferredDateDisable'] = false;
        } else if ((name === 'application-status' || name === 'applicant-status' || name === 'asset-status') && value !== 'Deferred') {
            this.documentRequiredData[rowNo]['deferalStage'] = '';
            this.documentRequiredData[rowNo]['deferalDate'] = null;
            this.documentRequiredData[rowNo]['deferredStageDisable'] = true;
            this.documentRequiredData[rowNo]['deferredDateDisable'] = true;
        }
        if ((name === 'application-status' || name === 'applicant-status' || name === 'asset-status') && value === 'Received') {
            this.documentRequiredData[rowNo]['receivedDateDisable'] = false;
            this.documentRequiredData[rowNo]['isReceivedDateRequired'] = true;
        } else if ((name === 'application-status' || name === 'applicant-status' || name === 'asset-status') && value !== 'Received') {
            this.documentRequiredData[rowNo]['receivedDateDisable'] = true;
            this.documentRequiredData[rowNo]['isReceivedDateRequired'] = false;
            this.documentRequiredData[rowNo]['receivedDate'] = null;
        }
        this.documentRequiredData[rowNo][name.split('-')[1]] = value;
        console.log('after from select Option:: ', JSON.stringify(this.documentRequiredData));


    }
    toast(title, variant, message) {
        const toastEvent = new ShowToastEvent({
            title,
            variant: variant,
            message: message
        })
        this.dispatchEvent(toastEvent)
    }

    openfileUpload(event) {
        var rowNo = event.target.getAttribute("data-row-index");
        console.log('name from file upload:: ', this.documentRequiredData[rowNo]);
        var sr = Number(rowNo) + Number(1);

        if (this.documentRequiredData[rowNo]['documentName'] === '' && this.documentRequiredData[rowNo]['isInputField'] === true) {
            this.toast('Warning', 'Warning', 'Enter Document Name On Serial No ' + sr + '.');
            return;
        } /*else if (this.documentRequiredData[rowNo]['documentFamily'] === '' && this.documentRequiredData[rowNo]['isInputField'] === true) {
            this.toast('Warning', 'Warning', 'Enter Document Family On Serial No ' + sr + '.');
            return;
        }*/

        else {
            const file = event.target.files[0]
            var reader = new FileReader()
            reader.onload = () => {
                var base64 = reader.result.split(',')[1]
                this.fileData = {
                    'filename': this.documentRequiredData[rowNo].documentName + '.' + file.name.substr(file.name.lastIndexOf('.') + 1),
                    'base64': base64,
                    'recordId': this.applicationId
                }
                this.documentRequiredData[rowNo].fileName = this.fileData.filename;
                this.documentRequiredData[rowNo].fileData = this.fileData;
                console.log('this.documentRequiredData[rowNo] ', this.documentRequiredData[rowNo])
            }
            reader.readAsDataURL(file)
        }
    }
    uploadFile(cvDocData) {
        console.log('cvDocData ::: ' + cvDocData)
        const { base64, filename, recordId } = this.fileData
        uploadFile({ base64, filename, recordId, cvDocData: JSON.stringify(cvDocData) }).then(result => {
            this.fileData = null
            let message = `${filename} uploaded successfully!!`
            this.toast('Success', 'Success', message);
        })
    }
    handleAddNewDocument(event) {
        if (event.target.name === 'addtionalDocument') {
            this.isAddtionalDocument = true;
        }
        /* Application Change */
        if (event.target.name === 'addNewDocument-application') {
            var docLength = this.documentRequiredData.length;
            var tempRow = JSON.parse(JSON.stringify(this.newRowData));
            tempRow.serialNumber = Number(docLength) + Number(1);
            this.documentRequiredData.push(tempRow);
        } else if (event.target.name === 'deleteDocument-application') {
            if (this.actualApplicationDocLength < this.documentRequiredData.length)
                this.documentRequiredData.pop();
            else
                this.toast('Warning', 'Warning', 'You don\'t have access to delete master record.');
        }

        /* Applicant Change */
        if (event.target.name === 'addNewDocument-applicant') {
            var docLength = this.documentRequiredData.length;
            var tempRow = JSON.parse(JSON.stringify(this.newRowData));
            tempRow.serialNumber = Number(docLength) + Number(1);
            tempRow.type = 'Applicant';
            tempRow.applicantId = this.applicantId;
            this.documentRequiredData.push(tempRow);
        } else if (event.target.name === 'deleteDocument-applicant') {
            if (this.actualApplicantDocLength < this.documentRequiredData.length)
                this.documentRequiredData.pop();
            else
                this.toast('Warning', 'Warning', 'You don\'t have access to delete master record.');
        }
        /* Asset Change */
        if (event.target.name === 'addNewDocument-asset') {
            var docLength = this.documentRequiredData.length;
            var tempRow = JSON.parse(JSON.stringify(this.newRowData));
            tempRow.serialNumber = Number(docLength) + Number(1);
            tempRow.type = 'Asset';
            tempRow.assetId = this.assetId;
            this.documentRequiredData.push(tempRow);
        } else if (event.target.name === 'deleteDocument-asset') {
            if (this.actualAssetDocLength < this.documentRequiredData.length)
                this.documentRequiredData.pop();
            else
                this.toast('Warning', 'Warning', 'You don\'t have access to delete master record.');
        }

    }
    handleAdditionalCancel() {
        this.isAddtionalDocument = false;
        this.fileData = null;
    }
    handleSaveAddNewDocument(event) {
        let isValid = true;
        let inputFields = this.template.querySelectorAll('.validate');
        inputFields.forEach(inputField => {
            if (!inputField.checkValidity()) {
                inputField.reportValidity();
                isValid = false;
            }
        });
        if (!isValid) {
            this.toast('Error', 'Error', 'Complete Required Field.');
        } else {
            this.isSpinnerActive = true;
            console.log('this.addtionalDocData ### ', JSON.stringify(this.addtionalDocData));
            var cvData = this.addtionalDocData.additionalDocument;
            uploadAddtionalDocument({ base64: cvData.base64, filename: cvData.filename, recordId: cvData.recordId, description: this.addtionalDocData.description })
                .then(result => {
                    this.fileData = null
                    this.isAddtionalDocument = false;
                    this.isSpinnerActive = false;
                    this.addtionalDocData = null;
                    this.toast('Success', 'Success', 'Document Uploaded Successfully');
                })
        }
    }
    handleAddtionalDocumentChange(event) {
        var name = event.target.name;
        if (name === 'Description') {
            this.addtionalDocData.description = event.target.value;
        }
        if (name === 'Addtional Document') {
            const file = event.target.files[0]
            var reader = new FileReader()
            reader.onload = () => {
                var base64 = reader.result.split(',')[1]
                this.fileData = {
                    'filename': file.name,
                    'base64': base64,
                    'recordId': this.applicationId
                }
                this.addtionalDocData.additionalDocument = this.fileData
                console.log(this.fileData)
            }
            reader.readAsDataURL(file)
        }
    }
    handleSaveApplicationDocument() {
        console.log('save result ### ', this.documentRequiredData);
        console.log('save result ### ', JSON.stringify(this.documentRequiredData));

        var isValidInputText = this.handleEditValidation();
        var isValidInputTextArea = this.handleTextAreaValidation();
        var isValidCombo = this.handleComboValidation();

        console.log('isValidInputText ### ', isValidInputText);
        console.log('isValidInputTextArea ### ', isValidInputTextArea);
        console.log('isValidCombo ### ', isValidCombo);

        if (!isValidInputText || !isValidInputTextArea || !isValidCombo) {
            this.toast('Error', 'Error', 'Complete Required Field.');
        } else {
            this.isSpinnerActive = true;
            this.documentRequiredData.forEach(element => {
                if(element.type === 'Asset'){
                    element['assetId'] = this.assetId;
                }
                if(element.type === 'Applicant'){
                    element['applicantId'] = this.applicantId;   
                }
                console.log('element ::: ',JSON.stringify(element));
                uploadFile({ cvDocData: JSON.stringify(element), recordId: this.applicationId })
                    .then(result => {
                        console.log('result #### ', JSON.stringify(result));
                        this.isSpinnerActive = false;
                        this.fileData = null
                        this.toast('Success', 'Success', 'Documents Uploaded Successfully.');
                        const selectEvent = new CustomEvent('requireddocument', {
                            detail: result,
                            bubbles: true,
                            composed: true
                        });
                        this.dispatchEvent(selectEvent);
                    })
            })

        }
    }

    handleEditValidation() {
        let isValid = true;
        let inputFields = this.template.querySelectorAll('lightning-input');
        inputFields.forEach(inputField => {
            if (!inputField.checkValidity()) {
                inputField.reportValidity();
                isValid = false;
            }
        });
        return isValid;
    }

    handleTextAreaValidation() {
        let isValid = true;
        let inputFields = this.template.querySelectorAll('lightning-textarea');
        inputFields.forEach(inputField => {
            if (!inputField.checkValidity()) {
                inputField.reportValidity();
                isValid = false;
            }
        });
        return isValid;
    }
    handleComboValidation() {
        let isValid = true;
        let inputFields = this.template.querySelectorAll('lightning-combobox');
        inputFields.forEach(inputField => {
            console.log('inputField #### ', inputField.disabled);
            if (!inputField.checkValidity()) {
                inputField.reportValidity();
                isValid = false;
            }
        });
        return isValid;
    }

}