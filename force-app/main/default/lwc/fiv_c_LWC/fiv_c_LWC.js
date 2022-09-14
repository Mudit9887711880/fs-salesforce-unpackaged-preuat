/*
* ──────────────────────────────────────────────────────────────────────────────────────────────────
* @author           Kuldeep Sahu  
* @modifiedBy       Kuldeep Sahu   
* @created          2022-04-05
* @modified         2022-07-21
* @Description      This component is build to handle all the operations related to 
                    Verification-C in FiveStar.              
* ──────────────────────────────────────────────────────────────────────────────────────────────────
*/
import { LightningElement, api, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import PROPERTY_OBJECT from '@salesforce/schema/Property__c';
import getVerification from '@salesforce/apex/FIV_C_Controller.getVerification';
import generateFIVCPdf from '@salesforce/apex/FIVCReportVfController.generateFIVCPdf';
import generatePublicLink from '@salesforce/apex/FIV_C_Controller.generatePublicLink';
import getIncomeSummary from '@salesforce/apex/FIV_C_Controller.getIncomeSummary';
import getCollateralSummary from '@salesforce/apex/FIV_C_Controller.getCollateralSummary';
import getLastLoginDate from '@salesforce/apex/DatabaseUtililty.getLastLoginDate';
import checkFIVCReport from '@salesforce/apex/FIV_C_Controller.checkFIVCReport';
import getRequiredDocuments from '@salesforce/apex/fsGenericUploadDocumentsController.getRequiredDocuments';
import BusinessDate from '@salesforce/label/c.Business_Date';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class Fiv_c_LWC extends NavigationMixin(LightningElement) {
    @api recordId;
    @api applicationId;
    @track recordTypeName;
    @track verficationObj;
    @track recordTypeId;
    @track loanAmount;
    @track loginId;
    @track preLoginRecordType;
    @track lastLoginDate;
    @track todaysDate = BusinessDate;
    @track incomeSummaryObj;
    @track propertySummaryObj = {
        propertyList: undefined,
        buildingGrandValue: undefined,
        landGrandValue: undefined,
        collateralGrandValue: undefined
    };

    @track showConfirmationModal = false;
    @track callOnce = false;
    @track showSpinner = false;

    @track showErrorTab = false;
    @track errorMsg;
    @track tabName = 'Character';
    @track fivcValidationObj = {
        character: {
            familyDetail: false,
            neighbourInfo: false,
            affiliationDetail: false,
            livingStandardInfo: false,
            repaymentInfo: false
        },
        collateral: {
            generalDetail: false,
            landAreaVal: false,
            docBoundries: false,
            enquiry: false,
            buildingAreaVal: false,
            landMeasurement: false,
            valuation: false
        },
        capability: false,
        revisit: false,
        seniorRevisit: false,
        docUpload: true,
        reportGenerated: false,
        decision: false
    };

    @track isRelatedToFCO;
    @track isRelatedToFS;
    @track verificationResult;

    @track requiredDocuments;

    @track btns = [
        {
            name: 'submit',
            label: 'Submit',
            variant: 'brand',
            class: 'slds-m-left_x-small'
        },
        {
            name: 'report',
            label: 'Generate Report',
            variant: 'brand',
            class: 'slds-m-left_x-small'
        }
    ]


    @wire(getObjectInfo, { objectApiName: PROPERTY_OBJECT })
    getRecordType({ data, error }) {
        if (data) {
            console.log(':: data :: ', JSON.parse(JSON.stringify(data)));
            const rtis = data.recordTypeInfos;
            this.recordTypeName = Object.keys(rtis).find(rti => rtis[rti].name === 'FIV-C Property Detail');
        } else if (error) {

        }
    }

    get isDecRemarkRequired() {
        return (this.isRelatedToFCO == 'Yes' || this.isRelatedToFS == 'Yes');
    }

    get isRemarkRequired() {
        return (this.verificationResult == 'Negative' || this.verificationResult == 'Neutral');
    }

    // This Method Is Used To Get All Data At Initial Level(Loading)
    connectedCallback() {
        this.disablePullToRefresh();
        this.handleGetLastLoginDate();
        this.getVerificationObject();
    }

    disablePullToRefresh() {
        const disableRefresh = new CustomEvent("updateScrollSettings", {
            detail: {
                isPullToRefreshEnabled: false
            },
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(disableRefresh);
    }

    // This Method Is Used To Set All Labels As Bold
    renderedCallback() {
        /*
        if (!this.callOnce) {
            const style = document.createElement('style');
            style.innerText = `.slds-form-element__label{
            font-weight: bold;
        }`;
            this.template.querySelector('[data-id="fivC"]').appendChild(style);
            const label = this.template.querySelectorAll('label');
            label.forEach(element => {
                element.classList.add('bold');
            });
            console.log('renderedCallback()');
        }
        */
    }

    // This Method Is Used To Handle Tab Activation Event
    handleActive(event) {
        this.tabName = event.target.value;
        if (this.tabName == 'CapSummary') {
            this.showTemporaryLoader();
            this.handleGetIncomeSummary();
        } else if (this.tabName == 'ColSummary') {
            this.showTemporaryLoader();
            this.handleGetCollateralSummary();
        }
    }

    // This Method Is Used To Handle Form Values
    handleFormValues(event) {
        if (event.target.fieldName == 'Is_applic_co_applic_related__c') {
            this.isRelatedToFS = event.target.value;
        } else if (event.target.fieldName == 'Is_applicant_co_applicant_related_kn__c') {
            this.isRelatedToFCO = event.target.value;
        } else if (event.target.fieldName == 'Result__c') {
            this.verificationResult = event.target.value;
        }
    }

    handleRequiredDocument(event) {
        console.log('required doc list :: ', event.detail);
        this.requiredDocuments = event.detail;
    }

    requiredDocumentValidation() {
        if (this.requiredDocuments.length > 0) {
            this.requiredDocuments.forEach(element => {
                this.errorMsg.push('Upload Required Document ' + element + ' In Document Upload Tab');
            });
        }
    }

    // This Method Is Used To Check All Validation On FIV-C Submit.
    handleFIVCSubmit() {
        console.log('handleFIVCSubmit = ', JSON.parse(JSON.stringify(this.fivcValidationObj)));
        this.errorMsg = [];
        this.requiredDocumentValidation();
        /* Character Validation Check */
        if (!this.fivcValidationObj.character.familyDetail) {
            this.errorMsg.push('Please Complete Entry In Family Details Sub Section In Character Section');
        }
        if (!this.fivcValidationObj.character.neighbourInfo) {
            this.errorMsg.push('Please Complete Entry In Neighbour Check Sub Section In Character Section');
        }
        if (!this.fivcValidationObj.character.affiliationDetail) {
            this.errorMsg.push('Please Complete Entry In Affiliation Sub Section In Character Section');
        }
        if (!this.fivcValidationObj.character.livingStandardInfo) {
            this.errorMsg.push('Please Complete Entry In Living Standard Sub Section In Character Section');
        }
        if (!this.fivcValidationObj.character.repaymentInfo) {
            this.errorMsg.push('Please Complete Entry In Repayment Behavior Sub Section In Character Section');
        }
        /* Collateral Validation Check */
        if (!this.fivcValidationObj.collateral.generalDetail) {
            this.errorMsg.push('Please Complete Entry In Property Details Sub Section In Collateral Section');
        }
        if (!this.fivcValidationObj.collateral.landAreaVal) {
            this.errorMsg.push('Please Complete Entry In Land Area And Valuation Sub Section In Collateral Section');
        }
        if (!this.fivcValidationObj.collateral.docBoundries) {
            this.errorMsg.push('Please Complete Entry In As Per Document Boundries Sub Section In Collateral Section');
        }
        if (!this.fivcValidationObj.collateral.enquiry) {
            this.errorMsg.push('Minimum 3 Entries Are Required In Enquiry Sub Section In Collateral Section');
        }
        if (!this.fivcValidationObj.collateral.buildingAreaVal) {
            this.errorMsg.push('Please Complete Entry In Building Area And Valuation Sub Section In Collateral Section');
        }
        if (!this.fivcValidationObj.collateral.landMeasurement) {
            this.errorMsg.push('Please Complete Entry In Land Measurement Sub Section In Collateral Section');
        }
        if (!this.fivcValidationObj.collateral.valuation) {
            this.errorMsg.push('Please Complete Entry In Valuation Sub Section In Collateral Section');
        }
        /* Capability Validation Check */
        if (this.fivcValidationObj.capability && this.fivcValidationObj.capability.length) {
            console.log('this.fivcValidationObj.capability= ', this.fivcValidationObj.capability)
            this.fivcValidationObj.capability.forEach(element => {
                this.errorMsg.push(element);
            });
            this.errorMsg.push('Please Complete Entry In Capability Section');
        }
        /* Revisit Validation Check */
        if (!this.fivcValidationObj.revisit) {
            this.errorMsg.push('Please Complete Entry In Revisit Section');
        }
        /* Senior Revisit Validation Check */
        if (!this.fivcValidationObj.seniorRevisit) {
            this.errorMsg.push('Please Complete Entry In Senior/Auditor Confirmation Visit Section');
        }
        /* Capability Validation Check */
        if (!this.fivcValidationObj.docUpload) {
            this.errorMsg.push('Please Upload All Required Documents in Document Upload Section');
        }
        /* Capability Validation Check */
        if (!this.fivcValidationObj.decision) {
            this.errorMsg.push('Please Complete Entry In Decision Section');
        }
        /* FIV-C Report Generation Check */
        if (!this.fivcValidationObj.reportGenerated) {
            this.errorMsg.push('FIV-C Report Is Not Generated Yet.');
        }

        console.log('showErrorTab errorMsg = ', this.errorMsg)

        if (this.errorMsg && this.errorMsg.length) {
            this.showErrorTab = true;
            let ref = this;
            setTimeout(() => {
                ref.tabName = 'Error';
            }, 300);
        } else {
            this.showErrorTab = false;
            //this.handleFinish();
            this.showNotifications('', 'FIV-C Verification Is Done Successfully.', 'success');
            let ref = this;
            this.showSpinner = true;
            setTimeout(() => {
                this[NavigationMixin.Navigate]({
                    type: 'standard__recordPage',
                    attributes: {
                        recordId: this.recordId,
                        objectApiName: 'Verification__c',
                        actionName: 'view'
                    }
                });
            }, 400);
        }
    }

    headerBtnClick(event) {
        if (event.detail === 'submit') {
            this.handleFIVCSubmit();
        }
        if (event.detail === 'report') {
            this.handleFinish();
        }
    }
    /*
    generateReport() {
        this.handleFinish();
    }
    */
    // This Method Is Used To Show Loader For Short Time.
    showTemporaryLoader() {
        this.showSpinner = true;
        let ref = this;
        setTimeout(function () {
            ref.showSpinner = false;
        }, 500);
    }

    // This Method Is Used To Show Modal On Submit Button
    handleFinish() {
        this.showConfirmationModal = true;
    }

    // This Method Is Used To Handle Modal Action On Submit Button
    handleConfirmation(event) {
        if (event.target.label === 'Yes') {
            this.showConfirmationModal = false;
            this.showSpinner = true;
            generateFIVCPdf({ verificationId: this.recordId, applicationId: this.applicationId })
                .then(result => {
                    this.showSpinner = false;
                    this.fivcValidationObj.reportGenerated = true;
                    this.showNotifications('', 'FIV-C Report Generated Successfully.', 'success');
                })
                .catch(error => {
                    this.showSpinner = false;
                })
        } else {
            this.showConfirmationModal = false;
        }
    }

    // This Method Is Used To Handle Character Tab Validation
    checkCharacterValidation(event) {
        console.log('checkCharacterValidation= ', event.detail)
        this.fivcValidationObj.character = event.detail;
    }

    // This Method Is Used To Handle Collateral Tab Validation
    checkCollateralValidation(event) {
        console.log('checkCollateralValidation= ', event.detail)
        this.fivcValidationObj.collateral = event.detail;
    }

    // This Method Is Used To Handle Capability Tab Validation
    checkCapabilityValidation(event) {
        console.log('checkCapabilityValidation= ', event.detail)
        this.fivcValidationObj.capability = event.detail;
    }

    // This Method Is Used To Handle Revisit Tab Validation
    handleRevisitValidation(event) {
        console.log('handleRevisitValidation= ', event.detail)
        this.fivcValidationObj.revisit = event.detail;
    }

    // This Method Is Used To Handle Senior Revisit Tab Validation
    handleSeniorRevisitValidation(event) {
        console.log('handleRevisitValidation= ', event.detail)
        this.fivcValidationObj.seniorRevisit = event.detail;
    }

    // This Method Is Used To Show Toast Notifications
    showNotifications(title, msg, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title: title,
            message: msg,
            variant: variant
        }));
    }

    /*=================  All submit methods  ====================*/

    // This Method Is Used To Handle Post Submit Actions Of Decition Tab.
    handleDecisionSubmit(event) {
        console.log('handleDecisionSubmit called');
        this.showTemporaryLoader();
    }

    /*=================  All success methods  ====================*/

    // This Method Is Used To Handle Post Success Actions Of Decition Tab.
    handleDecisionSuccess() {
        console.log('handleDecisionSuccess= ');
        this.showNotifications('', 'Verification is completed successfully', 'success');
        this.fivcValidationObj.decision = true;
    }

    /*=================  All server methods  ====================*/

    // This Method Is Used To Verification Object Details From Server Side.
    getVerificationObject() {
        getVerification({ recordId: this.recordId }).then((result) => {
            console.log('GetVerificationObject Result= ', result);
            if (result && result.length) {
                this.verficationObj = JSON.parse(JSON.stringify(result))[0];
                this.applicationId = this.verficationObj.Application__c;
                this.handleRequiredDocuments();
                this.handleCheckFIVCReport();
                this.recordTypeId = this.verficationObj.RecordTypeId;
                this.loanAmount = this.verficationObj.Application__r.Requested_Loan_Amount__c;
                this.preLoginRecordType = this.verficationObj.Application__r.Pre_Login__r.RecordTypeId;
                this.loginId = this.verficationObj.Application__r.Pre_Login__c;
                this.isRelatedToFS = this.verficationObj.Is_applic_co_applic_related__c;
                this.isRelatedToFCO = this.verficationObj.Is_applicant_co_applicant_related_kn__c;
                this.verificationResult = this.verficationObj.Result__c;
                if (this.verficationObj.Status__c && this.verficationObj.Status__c == 'Completed') {
                    this.fivcValidationObj.decision = true;
                }
            }
        }).catch((err) => {
            console.log('Error getVerificationObject= ', err);
        });
    }

    // This Method Is Used To Generate Public Link Of Uploaded File On File Upload Section.
    handleFileUplaod(event) {
        console.log('handleFileUplaod= ', event.detail);

        generatePublicLink({ contentVersionId: event.detail[0].contentVersionId }).then((result) => {
            console.log('handleFileUplaod= ', result);
            this.template.querySelector('c-generic-view-documents').getDocuments();
        }).catch((err) => {
            console.log('Error in handle File upload= ', err);
        });
    }

    // This Method Is Used To Get Capabilty Summary From Server Side.
    handleGetIncomeSummary() {
        getIncomeSummary({
            applicationId: this.applicationId,
            verificationId: this.recordId
        }).then((result) => {
            console.log('handleGetIncomeSummary= ', result);
            this.incomeSummaryObj = JSON.parse(JSON.stringify(result));
        }).catch((err) => {
            console.log('Error in handleGetIncomeSummary= ', err);
        });
    }

    // This Method Is Used To Get Collateral Summary From Server Side.
    handleGetCollateralSummary() {
        getCollateralSummary({ applicationId: this.applicationId }).then((result) => {
            console.log('getCollateralSummary= ', result);
            if (result && result.length) {
                let totalBuildingValue = 0;
                let totalLandValue = 0;
                let collateralGrandValue = 0;
                result.forEach(element => {
                    if (element.Valuation_Final_land_value__c) {
                        totalLandValue += element.Valuation_Final_land_value__c;
                    }
                    if (element.Building_area_total_value__c) {
                        totalBuildingValue += element.Building_area_total_value__c;
                    }
                    if (element.Total_Collateral_Value__c) {
                        collateralGrandValue += element.Total_Collateral_Value__c;
                    }
                });

                this.propertySummaryObj = JSON.parse(JSON.stringify(this.propertySummaryObj));
                this.propertySummaryObj.propertyList = JSON.parse(JSON.stringify(result));
                this.propertySummaryObj.buildingGrandValue = totalBuildingValue;
                this.propertySummaryObj.landGrandValue = totalLandValue;
                this.propertySummaryObj.collateralGrandValue = collateralGrandValue;
            }
        }).catch((err) => {
            console.log('Error in getCollateralSummary= ', err);
        });
    }

    // This Method Is Used To Get User's Last Login Date From Server Side.
    handleGetLastLoginDate() {
        getLastLoginDate().then((result) => {
            console.log('getLastLoginDate= ', result);
            this.lastLoginDate = result;
            let currentTab = this.tabName;
            console.log('currentTab= ', currentTab);
            let tabs = this.template.querySelectorAll('lightning-tab');
            tabs.forEach(element => {
                element.loadContent();
            });

            console.log('currentTab= ', currentTab);
            this.tabName = currentTab;
        }).catch((err) => {
            console.log('Error in getLastLoginDate= ', err);
        });
    }

    // This Method Is Used To Check That FIV-C Report IS Generated Or Not.
    handleCheckFIVCReport() {
        checkFIVCReport({ appId: this.applicationId }).then((result) => {
            console.log('checkFIVCReport= ', result);
            this.fivcValidationObj.reportGenerated = result;
        }).catch((err) => {
            console.log('Error in checkFIVCReport= ', err);
        });
    }

    handleRequiredDocuments() {
        this.requiredDocuments = [];
        getRequiredDocuments({ stage: 'FIV - C', parentId: this.applicationId }).then((result) => {
            console.log('::: handleRequiredDocuments ::: ', result);
            this.requiredDocuments = result;
        }).catch((err) => {
            console.log('Error in getRequiredDocuments= ', err);
        });
    }
}