import { LightningElement, track, wire, api } from 'lwc';
import getAccounts from '@salesforce/apex/fsPcAcController.getAccounts';
import getCharacterTabRecords from '@salesforce/apex/FIV_C_Controller.getCharacterTabRecords';
import getData from '@salesforce/apex/fsPcAcController.getData';
import getCollateralTableRecords from '@salesforce/apex/fsPcAcController.getCollateralTableRecords';
import getCapabiltyData from '@salesforce/apex/fsPcAcController.getCapabiltyData';
import checkPCValidation from '@salesforce/apex/fsPcAcController.checkPCValidation';
import getCapabilitySummary from '@salesforce/apex/fsPcAcController.getCapabilitySummary';
import ComparePropertyValues from '@salesforce/apex/fsPcAcController.ComparePropertyValues';
import CompareBuildingValues from '@salesforce/apex/fsPcAcController.CompareBuildingValues';
import GetCollateralSummary from '@salesforce/apex/fsPcAcController.getCollateralSummary';
import { CurrentPageReference } from 'lightning/navigation';
import getLastLoginDate from '@salesforce/apex/DatabaseUtililty.getLastLoginDate';
import Business_Date from '@salesforce/label/c.Business_Date';
import gettotalBuildingValue from '@salesforce/apex/fsPcAcController.GetBuildingTotalValue';
import clonePropertyNew from '@salesforce/apex/FsPreloginController.clonePropertyNew';
import getRecordTypeId from '@salesforce/apex/DatabaseUtililty.getRecordTypeId';
import handleFinish from '@salesforce/apex/fsPcAcController.handleFinish';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import ID_FIELD from '@salesforce/schema/Application__c.Id';
import STAGE_FIELD from '@salesforce/schema/Application__c.Stage__c';
import SUBMISSION_DATE_FIELD from '@salesforce/schema/Application__c.PC_Submisson_Date__c';
import { updateRecord } from 'lightning/uiRecordApi';
import PROPERTY_OBJECT from '@salesforce/schema/Property__c';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import getACUsers from '@salesforce/apex/fsPcAcController.getACUsers';
import getRequiredDocuments from '@salesforce/apex/fsGenericUploadDocumentsController.getRequiredDocuments';

export default class FsProcessCreditScreen extends NavigationMixin(LightningElement) {

    // buttons for add property/applicant and retrigger verifications
    @track btns = [
        {
            name: 'AddApplicant',
            label: 'Add/Modify Applicant',
            variant: 'brand',
            class: 'slds-m-left_x-small'
        },
        {
            name: 'AddProperty',
            label: 'Add/Modify Property',
            variant: 'brand',
            class: 'slds-m-left_x-small'
        },
        {
            name: 'InitiateRetrigger',
            label: 'Initiate Retrigger',
            variant: 'brand',
            class: 'slds-m-left_x-small'
        },
        {
            name: 'OwnerValidation',
            label: 'Owner Validation',
            variant: 'brand',
            class: 'slds-m-left_x-small'
        }
    ];
    @track applicanttobeCheck = false;
    @track propertytobeCheck = false;
    @track isAddApplicant = false;
    @track isAddProperty = false;
    @track initiateRetrigger = false;
    @track openOwnerValidation = false;
    @track loanApplicantList = [];
    @track ownerOptions = [];
    @track propIdList;
    @track newappIdList;
    @track hasPrimaryApplicant = false;
    @track hasPrimaryOwner = false;
    @track isMobileVerified = false;
    @track isKYCVerified = false;
    @track isIncomeConsidered = false;
    @track mobDefList;
    @track kycDefList;
    @track bureauPendingList;
    @track sourcingBranch;
    @track usersList;
    @track selectedACUser;
    @track requiredDocuments;
    @track decisionValue;
    @track dedupeDetails;


    @track recordId;
    @track currentPageReference;
    @track applicationId;
    @track loginId;
    @track appName;
    @track showThis = true;
    @track businessDate = Business_Date;
    @track lastLoginDate;

    @track CustomerOptions = [];
    @track PCSubOptions = [];

    @track callOnce = false;
    @track showPCSubCombo1 = false;
    @track pcSpinner = false;

    @track PCCombo = true;
    @track PropertyCombo = false;
    @track CapibilityCombo = false;
    @track CharacterCombo = false;
    @track customerCombo = false;
    @track pcsubcombovalue;

    @track showCapability = false;
    @track showIncomeSubSegment = false;
    @track IncomeSegmentValue;
    @track SubpcSelectedValue;
    @track segmentValue;
    @track subSegmentValue;
    @track CustomerName;
    @track dayorMarginBasis;


    //for Capability
    @track isSalaried = false;
    @track isRentalMortgage = false;
    @track isRentalOther = false;
    @track isDailyWages = false;
    @track isPension = false;
    @track isAbroadIncome = false;
    @track isOther = false;
    @track isSelfEmployedOrBusiness = false;
    @track isEateriesAndOthers = false;
    @track isDayBasis = false;
    @track isMarginBasis = false;
    @track capabilityRecordTypeId;
    @track capabilityTableData;
    @track capabilitySpinner = false;
    @track SecondcapabilitySpinner = false;
    @track loanAppId;
    @track IncomeSummary;
    @track capRelationshipId;
    @track Other_Confirmations;
    @track natureofdocumentProof;
    @track Other_Confirmations_Daily_Wages;
    @track proofRemarks;
    @track ownershipProof;
    @track fcEnquiry;

    // for character
    @track isFamilyDetails = false;
    @track isNeighbour = false;
    @track isAffiliation = false;
    @track isLivingStandard = false;
    @track isRepaymentBehaviour = false;
    @track showCharacter = false;
    @track characterRecordTypeId;
    @track familyTableData;
    @track sectionType;
    @track showFivCCharacterTable = false;
    @track characterSpinner = false;
    @track loanAmount;
    //


    // for property
    @track typeofProperty;
    @track showProperty = false;
    @track showPropertyForm = false;
    @track isGeneralDetails = false;
    @track isLandAreaAndValuation = false;
    @track isBuildingAreaAndValuation = false;
    @track isCollateralSummary = false;
    @track propertyRecordTypeId;
    @track propertyRecordId;
    @track isFIVBProperty = false;
    @track parentProperty;
    @track propertyTableData;
    @track propertySpinner;
    @track preloginproperty;
    @track propsubValue;
    @track pcfivcRelationId;
    @track fivCAutoPopFields = {
        'mortgage_property_distance': '', 'mortagage_and_living_property': '', 'person_at_mortgage': '', 'living_property_distance': '',
        'living_pincode': '', 'is_living_is_own': ''
    };
    @track landAreaValues = { 'Land_Area': '', 'Market_Value': '' };
    @track buildingAreaValues = { Building_Area: undefined, Building_Value: undefined };
    @track totalBuildingValue;
    @track propertySummaryObj = {
        propertyList: undefined,
        collateralGrandValue: undefined
    };
    ////////////////////////////////

    // for financial
    @track isFinancial = false;
    @track finSpinner = false;

    // for Validation
    @track validationObj;
    @track errorMsg;
    @track showErrorTab = false;
    @track tabName = 'Dedupe_Check';
    @track primaryAppName;
    @track receiptWrapper = { hasReceipt: false, allApproved: false, pendingReceiptList: [], lengthOfDirectRec: 0, existingFeeCodeOption: [] };
    @track loadAll = false;



    @wire(getObjectInfo, { objectApiName: PROPERTY_OBJECT })
    getRecordType({ data, error }) {
        if (data) {
            console.log(':: data :: ', JSON.stringify(data));
            const rtis = data.recordTypeInfos;
            this.propertyRecordTypeId = Object.keys(rtis).find(rti => rtis[rti].name === 'PC Property Detail');
            console.log('property record type Id', this.propertyRecordTypeId);
        } else if (error) {

        }
    }


    connectedCallback() {
        this.getRequiredDocuments();
    }


    @wire(CurrentPageReference)
    getPageReferenceParameters(currentPageReference) {
        this.pcSpinner = true;
        if (currentPageReference) {
            console.log(currentPageReference);
            this.recordId = currentPageReference.attributes.recordId || null;
            console.log('this.recordId' + this.recordId);
        }
        this.handlegetData(true);
    }


    handlegetData(param) {
        getData({ CustomerId: this.recordId, ObjName: 'Verification__c' })
            .then(result => {
                console.log('result>>>>' + JSON.stringify(result[0]));
                result.forEach(element => {
                    this.applicationId = element.Application__c;
                    console.log('this applicationid in parent >>>>', this.applicationId);
                    this.loginId = element.Application__r.Pre_Login__c;
                    this.preLoginRecordType = element.Application__r.Pre_Login__r.RecordType.Name;
                    this.appName = element.Application__r.Name;
                    this.loanAmount = element.Application__r.Requested_Loan_Amount__c;
                    this.sourcingBranch = element.Application__r.Sourcing_Branch__c;
                    this.selectedACUser = element.Application__r.Recommended_AC_User__c;
                    this.decisionValue = element.Application__r.PC_Decision__c;
                });
                if (param == true)
                    this.fetchLastLoginDate();
            })
            .catch(error => {
                console.log('errror', error);
            });
    }


    get showCharacterForm() {
        return (this.isRepaymentBehaviour || this.isFamilyDetails || this.isAffiliation || this.isLivingStandard || this.isNeighbour) ? true : false;
    }

    // get the dedupe Details
    getdedupedetails(event) {
        let dedupeDetails = event.detail;
        console.log('Dedupe Details', dedupeDetails);
    }


    handleCapabilityTabActivation(event) {
        if (event.target.value == 'Capability_Detail') {
            this.template.querySelectorAll('.customerBox').forEach(each => {
                each.value = null;
            });
            this.showCapability = false;
            this.capabilityTableData = undefined;
            this.showIncomeSubSegment = false;
            getRecordTypeId({ sObjectName: 'Capability__c', recordTypeName: 'PC Capability' })
                .then(result => {
                    console.log('result ids ', result);
                    if (result)
                        this.capabilityRecordTypeId = result;
                })
                .catch(error => {
                    console.log(error);
                })
        }
        else if (event.target.value == 'Capability_Summary') {
            this.capabilitySpinner = true;
            getCapabilitySummary({ applicationId: this.applicationId })
                .then(res => {
                    console.log('CAp Summary>>> ', res);
                    this.IncomeSummary = JSON.parse(JSON.stringify(res));
                    console.log('IncomeSummary>> ', this.IncomeSummary);
                    this.capabilitySpinner = false;
                })
                .catch(
                    err => {
                        console.log('CAp Summary error >>> ', err);
                        this.capabilitySpinner = false;
                    }
                )
        }
    }

    // handle tab Activations
    handleTabActivation(event) {
        this.tabName = event.target.value;
        this.PCSubOptions = undefined;
        this.template.querySelectorAll('.mycombobox').forEach(each => { each.value = null; });
        if (event.target.value == 'Character_Screen') {
            this.PCSubOptions = [{ label: 'Family Details', value: 'Family Detail' },
            { label: 'Neighbour Check-Living & Mortgage Property', value: 'Neighbour Detail' },
            { label: 'Affiliations', value: 'Affiliation Detail' },
            { label: 'Living Standard', value: 'Living Standard Detail' },
            { label: 'Repayment Behaviour', value: 'Repayment Behaviour Detail' }
            ];
            this.showPCSubCombo1 = true;
        } else if (event.target.value == 'Collateral_Screen') {
            console.log('collateral screen callled');
            this.showProperty = false;
            this.showPropertyForm = false;
            this.PCSubOptions = [{ label: 'Property Details', value: 'General_Details' },
            { label: 'Land Area And Valuation', value: 'Land_Area_And_Valuation' },
            { label: 'Building Extent & Valuation', value: 'Building_Area_Valuation' },
            { label: 'Collateral Summary', value: 'Collateral_Summary' }
            ];
            this.showPCSubCombo1 = true;
            this.isCollateralSummary = false;
        } else if (event.target.value == 'Financial_screen') {
            this.finSpinner = true;
            this.getcollateralSummaryTable();
            this.isFinancial = true;
        } else if (event.target.value == 'Capability_screen') {


        } else if (event.target.value == 'Insurance_Fee') {
            setTimeout(() => {
                this.template.querySelector('c-fee-insurance-parent-p-c-screen').getReceipt();
            }, 3000);



        } else if (event.target.value == 'Sanction_Condition') {

        }
    }


    getReceiptPendingList(event) {
        console.log('Receipt data approved ', event.detail);
        this.receiptWrapper.hasReceipt = event.detail.hasReceipt;
        this.receiptWrapper.allApproved = event.detail.allApproved;
        this.receiptWrapper.pendingReceiptList = event.detail.pendingReceiptList;
        this.receiptWrapper.lengthOfDirectRec = event.detail.lengthOfDirectRec;
        this.receiptWrapper.existingFeeCodeOption = event.detail.existingFeeCodeOption;
    }

    renderedCallback() {
        if (!this.callOnce) {
            const style = document.createElement('style');
            style.innerText = `.slds-form-element__label{
            font-weight: bold;}`;
            this.template.querySelector('[data-id="pcTest"]').appendChild(style);
            const label = this.template.querySelectorAll('label');
            label.forEach(element => {
                element.classList.add('bold');
            });
            console.log('renderedCallback()');
            this.callOnce = true;
        }
        if (this.loadAll == false) {
            console.log('i am in check validity');
            let currentTab = this.tabName;
            console.log('currentTab= ', currentTab);
            let tabs = this.template.querySelectorAll('lightning-tab');
            console.log('tabs ', tabs);
            tabs.forEach(element => {
                if (element.value == 'Insurance_Fee')
                    element.loadContent();
            });
            console.log('currentTab= ', currentTab);
            this.tabName = currentTab;
            if (tabs && tabs.length) {
                this.loadAll = true;
            }

        }

    }

    handleclose(event) {
        this.openOwnerValidation = event.detail;
    }

    // to get all applicant names of Application
    getAllApplicants() {
        getAccounts({ appId: this.applicationId }).then(result => {
            this.loanApplicantList = [];
            this.CustomerOptions = [];
            this.ownerOptions = [];
            let data = [];
            let laList = [];
            let owneroptions = [];
            result.forEach(app => {
                data.push({ label: app.Customer_Information__r.Name, value: app.Id });
                laList.push(app.Id);
                owneroptions.push({ label: app.Customer_Information__r.Name, value: app.Id + '_' + app.Customer_Type__c });

                if (app.Customer_Type__c == 'Primary Applicant')
                    this.primaryAppName = app.Customer_Information__r.Name;
            });
            this.CustomerOptions = data;
            this.loanApplicantList = laList;
            this.ownerOptions = owneroptions;
            console.log('this.CustomerOptions>>>>' + JSON.stringify(this.loanApplicantList));
            this.checkAllValidation();
        })
            .catch(error => {
                console.log('error in getting all Applicants', error);
                this.checkAllValidation();
            });
    }

    // to fetch the last Login Date of Logged In User
    fetchLastLoginDate() {
        getLastLoginDate().then(result => {
            console.log('login date ', result);
            this.lastLoginDate = result;
            this.getAllApplicants();
        })
            .catch(error => {
                console.log('error', error);
                this.getAllApplicants();
            })
    }

    // connected callback
    connectedCallback() {
        //code

    }


    // header buttons selection Event-------------------
    rowselectionevent(event) {
        var detail = event.detail;
        console.log('detail ### ', JSON.stringify(detail));
        if (detail === 'AddApplicant') {
            this.applicanttobeCheck = true;
            this.isAddApplicant = true;
            //this.allLoanApplicant.push();
        }
        if (detail === 'AddProperty') {
            this.getAllApplicants();
            this.isAddProperty = true;
            this.propertytobeCheck = true;
            let ref = this.template.querySelector('c-fspc-addand-modify-property');
            console.log('property child called', ref);
            setTimeout(() => {
                if (this.template.querySelector('c-fspc-addand-modify-property')) {
                    console.log('loanaPPlist ', this.loanApplicantList);
                    console.log('application Id', this.applicationId);
                    this.template.querySelector('c-fspc-addand-modify-property').getApplicationId(this.applicationId);
                    this.template.querySelector('c-fspc-addand-modify-property').getLoanAppList(this.loanApplicantList);
                    this.template.querySelector('c-fspc-addand-modify-property').getPropertyOwnersName(this.applicationId);
                    this.template.querySelector('c-fspc-addand-modify-property').getPropertyOwnersList(this.ownerOptions);
                }
            }, 300);

        }
        if (detail === 'InitiateRetrigger') {
            this.initiateRetrigger = true;
        }
        if (detail === 'OwnerValidation') {
            this.openOwnerValidation = true;
        }
    }

    // add applicant close Event--------

    handleApplicantModal() {
        this.isAddApplicant = false;
        this.getAllApplicants();
    }

    checkSubmit(event) {
        console.log('check ', event.detail);
        this.hasPrimaryApplicant = event.detail.hasPrimaryApplicant;
        this.mobDefList = event.detail.mobDefList;
        this.isMobileVerified = event.detail.isMobileVerified;
        this.isIncomeConsidered = event.detail.isIncomeConsidered;
        this.isKYCVerified = event.detail.isKYCVerified;
        this.kycDefList = event.detail.kycDefList;
    }

    checkBureau(event) {
        console.log('check Bureau Verified List', event.detail);
        this.bureauPendingList = event.detail;
    }

    handlenewlyaddedApplicant(event) {
        console.log('new app id List>>>>>> ', this.newappIdList);
        if (event.detail != undefined)
            this.newappIdList = event.detail;

    }

    // add Property close Event-----

    addpropertyclose() {
        this.isAddProperty = false;
        this.handlecloneNewPropety();
    }

    handlenewlyaddedProperty(event) {
        console.log('newly created property', event.detail);
        if (event.detail != undefined)
            this.propIdList = event.detail;
        this.handlecloneNewPropety();

    }


    checkProperty(event) {
        this.hasPrimaryOwner = event.detail;
        console.log('check property running', this.hasPrimaryOwner);
    }

    // retrigger close Event---------

    handleRetriggerClose() {
        this.initiateRetrigger = false;
        this.checkAllValidation();
    }




    // on change method for PC Combobox
    handlePCSubChange(event) {
        console.log('pc sub change called>>>> ' + event.target.value);
        let value = event.target.value;
        this.showCharacter = true;
        this.isFamilyDetails = false;
        this.isNeighbour = false;
        this.isAffiliation = false;
        this.isLivingStandard = false;
        this.isRepaymentBehaviour = false;
        this.isGeneralDetails = false;
        this.isLandAreaAndValuation = false;
        this.isBuildingAreaAndValuation = false;
        this.isCollateralSummary = false;

        if (value == 'Family Detail') {
            console.log('before this.isFamilyDetails', this.isFamilyDetails);
            this.characterSpinner = true;
            this.showCharacter = true;
            this.getCharacterTableRecords('PC_Family_Details', value);
            this.isFamilyDetails = true;
            this.showFivCCharacterTable = true;
            console.log('after this.isFamilyDetails', this.isFamilyDetails);
        }
        else if (value == 'Neighbour Detail') {
            this.characterSpinner = true;
            this.showCharacter = true;
            this.getCharacterTableRecords('PC_Neighbour', value);
            this.isNeighbour = true;
            this.showFivCCharacterTable = true;
        }
        else if (value == 'Affiliation Detail') {
            this.characterSpinner = true;
            this.showCharacter = true;
            this.getCharacterTableRecords('PC_Affiliation', value);
            this.isAffiliation = true;
            this.showFivCCharacterTable = true;
        }
        else if (value == 'Living Standard Detail') {
            this.characterSpinner = true;
            this.showCharacter = true;
            this.getCharacterTableRecords('PC_LivingStandard', value);
            this.isLivingStandard = true;
            this.showFivCCharacterTable = true;
        }
        else if (value == 'Repayment Behaviour Detail') {
            this.isRepaymentBehaviour = true;
        }
        else if (value == 'General_Details') {
            this.propsubValue = value;
            this.propertySpinner = true;
            this.handleGetCollateralGeneralDetails('PC_Col_GenDetails');
            this.showProperty = true;
        }
        else if (value == 'Land_Area_And_Valuation') {
            this.propsubValue = value;
            this.propertySpinner = true;
            this.handleGetCollateralGeneralDetails('PC_Col_LandArea');
            this.showProperty = true;
        }
        else if (value == 'Building_Area_Valuation') {
            this.propsubValue = value;
            this.propertySpinner = true;
            this.handleGetCollateralGeneralDetails('PC_Col_BuildAreaVal');
            this.showProperty = true;
        }
        else if (value == 'Collateral_Summary') {
            this.propertySpinner = true;
            this.showProperty = false;
            this.getcollateralSummaryTable();
            this.isCollateralSummary = true;


        }
    }


    // row selection method for Capability Table
    handleSelectedRow(event) {
        console.log('selected row>>>>> ', JSON.stringify(event.detail));
        this.capabilitySpinner = true;
        let row = event.detail[0];
        this.capRelationshipId = row.Id;
        this.CustomerName = row.Loan_Applicant__c;
        this.segmentValue = row.Income_segment__c;
        this.subSegmentValue = row.Subsegment__c;
        this.dayorMarginBasis = row.Day_Margin_Basis__c;
        this.fivCrecordId = row.Id;
        this.Other_Confirmations = row.Other_Confirmations__c != null ? row.Other_Confirmations__c : null;
        this.natureofdocumentProof = row.Nature_of_Document_Proof__c != null ? row.Nature_of_Document_Proof__c : null;
        this.Other_Confirmations_Daily_Wages = row.Other_Confirmations_Daily_Wages__c != null ? row.Other_Confirmations_Daily_Wages__c : null;
        this.proofRemarks = row.Proof_Remarks__c != null ? row.Proof_Remarks__c : null;
        this.fcEnquiry = row.FC_Enquiry_with__c != null ? row.FC_Enquiry_with__c : null;
        this.ownershipProof = row.Proof_of_Ownership__c != null ? row.Proof_of_Ownership__c : null;
        console.log(this.segmentValue + '<>>>>>>>' + this.subSegmentValue + '<><<<<<' + this.dayorMarginBasis + '>>>>>>>><<<<<<' + this.fivCrecordId);
        if (this.segmentValue != null || this.segmentValue != undefined) {
            this.isSalaried = false;
            this.isDailyWages = false;
            this.isPension = false;
            this.isAbroadIncome = false;
            this.isOther = false;
            this.isSelfEmployedOrBusiness = false;
            this.isEateriesAndOthers = false;
            if (this.segmentValue == 'Salaried') {
                this.isSalaried = true;
            } else if (this.segmentValue == 'Pension') {
                this.isPension = true;
            } else if (this.segmentValue == 'Daily wages') {
                this.isDailyWages = true;
            } else if (this.segmentValue == 'Income from Abroad') {
                this.isAbroadIncome = true;
            } else if (this.segmentValue == 'Eateries' || this.segmentValue == 'Food business' ||
                this.segmentValue == 'Manufacturing' || this.segmentValue == 'Shop owner' ||
                this.segmentValue == 'Milk business' || this.segmentValue == 'General shops' ||
                this.segmentValue == 'Vegetables/Fruits/Flower/Vendor') {
                this.isEateriesAndOthers = true;
            } else if (this.segmentValue == 'Self Employed') {
                this.isSelfEmployedOrBusiness = true;
            } else if (this.segmentValue == 'Housewife' || this.segmentValue == 'Retired' ||
                this.segmentValue == 'Unemployed' || this.segmentValue == 'Others') {
                this.isOther = true;
            }
        }
        if (this.subSegmentValue != null || this.subSegmentValue != undefined) {
            this.isRentalMortgage = false;
            this.isRentalOther = false;
            if (this.subSegmentValue == 'Commercial - mortgage proeprty' || this.subSegmentValue == 'Residential - Mortgage property') {
                this.isRentalMortgage = true;
            } else if (this.subSegmentValue == 'Commercial - Other property' || this.subSegmentValue == 'Residential - Other proeprty') {
                this.isRentalOther = true;
            }
        }
        if (this.dayorMarginBasis != null || this.dayorMarginBasis != undefined) {

            if (this.dayorMarginBasis == 'Day Basis') {
                this.isDayBasis = true;
                this.isMarginBasis = false;
            } else if (this.dayorMarginBasis == 'Margin Basis') {
                this.isMarginBasis = true;
                this.isDayBasis = false;
            }
        }

        this.showCapability = true;
        this.capabilitySpinner = false;

    }

    handlegetValue(event) {
        if (event.detail == true)
            this.gettotalValue();

    }


    @api gettotalValue() {
        gettotalBuildingValue({ appId: this.applicationId, recordTypeName: 'PC Property Detail' })
            .then(result => {
                console.log(' total building Values', result);
                if (result)
                    this.totalBuildingValue = result;
            })
            .catch(error => {
                console.log('Error in getting total building Values', error);
            });
    }


    handleSelectedPropertyRow(event) {
        this.propertySpinner = true;
        this.showPropertyForm = false;
        this.fivCAutoPopFields = {};
        this.propertyRecordId = undefined;
        console.log(' this.fivCAutoPopFields>>>>> ', JSON.stringify(this.fivCAutoPopFields));
        console.log('selected property row>>>>> ', event.detail);
        let record = JSON.parse(JSON.stringify(event.detail));
        this.preloginproperty = record[0].Property__c;
        console.log('pre login property', this.preloginproperty);
        getData({ CustomerId: record[0].Property__c, ObjName: 'Property__c' })
            .then(result => {
                console.log('Property result>>>>' + JSON.stringify(result[0]));
                if (result && result.length) {
                    this.propertyRecordId = result[0].Id;
                    this.typeofProperty = result[0].Type_Of_Property__c;
                    console.log('Type Of Property in parent', this.typeofProperty);
                }
            })
            .catch(error => {
                console.log('errror', error);
            });

        if (this.propsubValue == 'General_Details') {
            if (record[0].Mortgage_property_Living_property_are__c == ' ') {
                console.log('inside if');
                //this.fivCAutoPopFields.mortagage_and_living_property = '--None--';
            }
            else {
                console.log('inside else');
                this.fivCAutoPopFields.mortagage_and_living_property = record[0].Mortgage_property_Living_property_are__c;
            }
            if (record[0].Mortgage_property_distance_from_branch__c == ' ') {
                console.log('inside if');
                this.fivCAutoPopFields.mortgage_property_distance = null;
            }
            else {
                console.log('inside else');
                this.fivCAutoPopFields.mortgage_property_distance = record[0].Mortgage_property_distance_from_branch__c;
            }
            if (record[0].Person_residing_at_Mortgage_property__c == ' ') {
                console.log('inside if');
                //this.fivCAutoPopFields.person_at_mortgage = '--None--';
            }
            else {
                console.log('inside else');
                this.fivCAutoPopFields.person_at_mortgage = record[0].Person_residing_at_Mortgage_property__c;
            }
            if (record[0].Living_property_Distance_from_Branch__c == ' ') {
                console.log('inside if');
                this.fivCAutoPopFields.living_property_distance = null;
            }
            else {
                console.log('inside else');
                this.fivCAutoPopFields.living_property_distance = record[0].Living_property_Distance_from_Branch__c;
            }
            if (record[0].Living_property_Pincode__c == ' ') {
                console.log('inside if');
                this.fivCAutoPopFields.living_pincode = null;
            }
            else {
                console.log('inside else');
                this.fivCAutoPopFields.living_pincode = record[0].Living_property_Pincode__c;
            }
            if (record[0].Is_living_property_is_own_property__c == ' ') {
                console.log('inside if');
                //this.fivCAutoPopFields.is_living_is_own = '--None--';
            }
            else {
                console.log('inside else');
                this.fivCAutoPopFields.is_living_is_own = record[0].Is_living_property_is_own_property__c;
            }
            this.showPropertyForm = true;
            this.isGeneralDetails = true;
        }
        else if (this.propsubValue == 'Land_Area_And_Valuation') {
            ComparePropertyValues({ parentPropertyId: record[0].Property__c })
                .then(result => {
                    console.log('ComparePropertyValues= ', result);
                    if (result && result.length) {
                        this.landAreaValues = JSON.parse(result);
                    } console.log('result land values', this.landAreaValues);
                    this.showPropertyForm = true;
                    this.propertySpinner = false;
                })
                .catch(error => {
                    this.showPropertyForm = true;
                    this.propertySpinner = false;
                    console.log('Error in getting land Values', error);
                });
            this.isLandAreaAndValuation = true;
        }
        else if (this.propsubValue == 'Building_Area_Valuation') {
            CompareBuildingValues({ parentPropertyId: record[0].Property__c })
                .then(result => {
                    console.log('CompareBuildingValues= ', result);
                    if (result && result.length) {
                        this.buildingAreaValues = JSON.parse(result);
                    } console.log('result Building values', this.buildingAreaValues);
                    this.showPropertyForm = true;
                    this.propertySpinner = false;
                })
                .catch(error => {
                    this.showPropertyForm = true;
                    this.propertySpinner = false;
                    console.log('Error in getting land Values', error);
                });
            this.gettotalValue();
            this.isBuildingAreaAndValuation = true;

        }
        console.log('autopop_fields', JSON.stringify(this.fivCAutoPopFields));
        this.propertySpinner = false;
    }


    handleCustomerChange(event) {
        console.log('LAId' + event.target.value);
        this.capabilitySpinner = true;
        this.showCapability = false;
        this.showCapability = false;
        this.isSalaried = false;
        this.isDailyWages = false;
        this.isPension = false;
        this.isAbroadIncome = false;
        this.isOther = false;
        this.isSelfEmployedOrBusiness = false;
        this.isEateriesAndOthers = false;
        this.isRentalMortgage = false;
        this.isRentalOther = false;
        this.isDayBasis = true;
        this.isMarginBasis = false;
        this.loanAppId = event.target.value;
        this.getCapabilityTableRecords();
        console.log('cap data', this.capabilityTableData);
    }


    // onsubmit and Onsuccess Method for PC Decision Form
    handleDecisionSubmit(event) {
        console.log('PC Decision Submit Called');
    }

    handleDecisionSuccess(event) {
        console.log('PC Decision Success Called', event.detail.Id);
        this.showToast('', 'success', 'Decision Submitted Successfully');
        this.handlegetData(false);
    }

    // get All Ac Users for Recommend
    handlegetAcUsers() {
        console.log('Sourcing Branch', this.sourcingBranch);
        this.usersList = [];
        getACUsers({ SourcingBranch: this.sourcingBranch })
            .then(result => {
                console.log('users list', result);
                if (result) {
                    let tempList = [];
                    result.forEach(element => {
                        tempList.push({ value: element.User__r.Id, label: element.User__r.Name });
                    })
                    this.usersList = JSON.parse(JSON.stringify(tempList));
                    console.log('after user list', JSON.stringify(this.usersList));
                }
                this.pcSpinner = false;
            })
            .catch(err => {
                console.log('error in users list', err);
                this.pcSpinner = false;
            })
    }


    // handle change method for Decision Tab
    handleChange(event) {
        let value = event.target.value;
        console.log('value in handle change', value);

        if (event.target.name == 'Select_User') {
            this.selectedACUser = value;
        }
        console.log('this selected AC  User', this.selectedACUser);
    }

    // get the dedupe Details
    getdedupedetails(event) {
        let result = event.detail;
        this.dedupeDetails = JSON.parse(result);
        console.log('Dedupe Details', this.dedupeDetails);
        if (this.dedupeDetails.errorFlag)
            this.errorMsg.push(this.dedupeDetails.message);
    }


    // for getting the character table records------
    getCharacterTableRecords(metadataName, secName) {
        this.familyTableData = undefined;
        getCharacterTabRecords({ appId: this.applicationId, metadataName: metadataName, sectionName: secName }).then((result) => {
            console.log('getFamilyDetailTableRecords= ', JSON.parse(JSON.stringify(result)));
            this.familyTableData = JSON.parse(JSON.stringify(result));
            this.familyTableData.showCheckboxes = true;
            this.familyTableData.treatCheckboxesAsRadio = true;
            this.characterSpinner = false;
        }).catch((err) => {
            this.familyTableData = undefined;
            console.log('getFamilyDetailTableRecords Error= ', err);
            this.characterSpinner = false;
        });
    }


    // for getting the property table records-------
    handleGetCollateralGeneralDetails(metaName) {
        this.propertyTableData = undefined;
        getCollateralTableRecords({ appId: this.applicationId, metadataName: metaName }).then((result) => {
            console.log('handleGetCollateralGeneralDetails= ', JSON.parse(JSON.stringify(result)));
            this.propertyTableData = JSON.parse(JSON.stringify(result));
            this.propertySpinner = false;
        }).catch((err) => {
            console.log('Error in handleGetCollateralGeneralDetails= ', err);
            this.propertySpinner = false;
        });
    }


    // to get the Capability Table Records-----
    getCapabilityTableRecords() {
        this.capabilityTableData = undefined;
        getCapabiltyData({ appId: this.applicationId, loanAppId: this.loanAppId, recTypeName: 'FIV - C', metadataName: 'PC_Capabilty', caprecordTypeName: 'FIV-C Capability' }).then((result) => {
            console.log('getCapabilityTableRecords= ', result);
            this.capabilityTableData = result;
            console.log('cap data', JSON.parse(JSON.stringify(result)));
            this.capabilitySpinner = false;
        }).catch((err) => {
            this.capabilityTableData = undefined;
            console.log('getCapabilityTableRecords Error= ', err);
            this.capabilitySpinner = false;
        });
    }



    // get collateral summary Table
    getcollateralSummaryTable() {
        GetCollateralSummary({ applicationId: this.applicationId, recTypeName: 'PC Property Detail' })
            .then(result => {
                console.log('in collateral summary result', result);
                if (result && result.length) {
                    let grandcollateralvalue = 0;
                    this.propertySummaryObj = JSON.parse(JSON.stringify(this.propertySummaryObj));
                    this.propertySummaryObj.propertyList = [];
                    result.forEach(element => {
                        this.propertySummaryObj.propertyList.push({
                            Name: element.Name,
                            Land_Area_Sq_Ft__c: element.Land_Area_Sq_Ft__c,
                            Valuation_Market_Value_Per_SqFt__c: element.Valuation_Market_Value_Per_SqFt__c,
                            Building_Area_Sq_Ft__c: element.Building_Area_Sq_Ft__c,
                            Building_Value_per_Sq_ft__c: element.Building_Value_per_Sq_ft__c,
                            Total_Collateral_Value: element.Final_Land_Value__c + element.Building_Value__c
                        });
                        grandcollateralvalue += (element.Final_Land_Value__c + element.Building_Value__c);
                    });
                    this.propertySummaryObj.collateralGrandValue = grandcollateralvalue;
                }
                this.propertySpinner = false;
                this.finSpinner = false;
            })
            .catch(error => {
                this.propertySpinner = false;
                this.finSpinner = false;
                console.log('in collateral summary error', error);
            })
    }

    // re check all the Validation since there are some change occured on child components
    handleValidation(event) {
        console.log('check validation pc character', event.detail);
        if (event.detail == true)
            this.checkAllValidation();
    }



    //check PC Validation
    @api checkAllValidation() {
        console.log('verfId ', this.recordId);
        checkPCValidation({ verfId: this.recordId, appId: this.applicationId })
            .then(result => {
                console.log(' Validation result', result);
                this.validationObj = result;
                this.handlegetAcUsers();
                this.pcSpinner = false;
            })
            .catch(err => {
                console.log('error in validation', err);
                this.pcSpinner = false;
            })
    }

    handlePCSubmit(event) {
        let myCmp = this.template.querySelector('c-fee-insurance-parent-p-c-screen');
        console.log('submit called myCmp', myCmp);
        if (myCmp)
            myCmp.getReceipt();
        console.log('submit called', this.validationObj);
        // let dedupeResult = this.template.querySelector('c-fsdedupe-details-lwc');
        // console.log('dedupeResult ###', dedupeResult);
        // if (dedupeResult)
        //     dedupeResult.submitDedupeData();

        console.log('Decision Value', this.decisionValue);
        this.errorMsg = [];
        /* Character Validation Check */
        if (this.validationObj.charWrap.familyDetail) {
            this.errorMsg.push('Please Complete Entry In Family Details Sub Section In Character Section');
        }
        if (this.validationObj.charWrap.NeighbourDetail) {
            this.errorMsg.push('Please Complete Entry In Neighbour Check Sub Section In Character Section');
        }
        if (this.validationObj.charWrap.AffiliationDetail) {
            this.errorMsg.push('Please Complete Entry In Affiliation Detail Sub Section In Character Section');
        }
        if (this.validationObj.charWrap.LivingStandardDetail) {
            this.errorMsg.push('Please Complete Entry In Living Standard Detail Sub Section In Character Section');
        }

        /* Collateral Validation Check */
        if (this.validationObj.colWrap.PropertyDetails) {
            this.errorMsg.push('Please Complete Entry In Property Details Sub Section In Collateral Section');
        }
        if (this.validationObj.colWrap.LandArea) {
            this.errorMsg.push('Please Complete Entry In Land Area And Valuation Sub Section In Collateral Section');
        }
        if (this.validationObj.colWrap.BuildingValuation) {
            this.errorMsg.push('Please Complete Entry In Building Area And Extent Sub Section In Collateral Section');
        }

        /* Capability Validation Check */
        if (!this.validationObj.capabilityValidation) {
            this.errorMsg.push('Please Complete Entry In Capability Section');
        }

        /* Financial Validation Check */
        if (this.validationObj.finWrap.ApplicationDetail) {
            this.errorMsg.push('Please Complete Entry In Application Detail Sub Section In Financial Section');
        }
        if (this.validationObj.finWrap.LoanDetail) {
            this.errorMsg.push('Please Complete Entry In Loan Detail Sub Section In Financial Section');
        }
        if (this.validationObj.finWrap.InsuranceDetail) {
            this.errorMsg.push('Please Complete Entry In Insurance Party Sub Section In Financial Section');
        }
        if (this.validationObj.finWrap.DisbursementDetail) {
            this.errorMsg.push('Please Complete Entry In Disbursement/Repayment detail Sub Section In Financial Section');
        }
        if (this.validationObj.finWrap.LoanAmtDetail) {
            this.errorMsg.push('Please Complete Entry In Loan Amount Sub Section In Financial Section');
        }
        if (this.validationObj.finWrap.EligibilityDetail) {
            this.errorMsg.push('Please Complete Entry In Eligibility Detail Sub Section In Financial Section');
        }
        if (this.validationObj.finWrap.RiskDetail) {
            this.errorMsg.push('Please Complete Entry In Risk Rating Sub Section In Financial Section');
        }
        if (this.validationObj.finWrap.OtherDetail) {
            this.errorMsg.push('Please Complete Entry In Other Detail Sub Section In Financial Section');
        }
        if (this.validationObj.finWrap.ExecutiveDetail) {
            this.errorMsg.push('Please Complete Entry In Executive Summary Sub Section In Financial Section');
        }


        if (!this.validationObj.isPrimaryOwner) {
            this.errorMsg.push('Add Atleast One Property Of Primary Applicant from Add/Modify Property Button');
        }



        // property Validation
        if (!this.validationObj.isonlineECinitiated && this.validationObj.isPropertyAdded) {
            if (!this.errorMsg.includes('Initiating Online EC is Mandatory'))
                this.errorMsg.push('Initiating Online EC is Mandatory');
        }
        if (!this.validationObj.isfivcInitiated && this.validationObj.isPropertyAdded) {
            if (!this.errorMsg.includes('Initiating FIV-C is Mandatory'))
                this.errorMsg.push('Initiating FIV-C is Mandatory');
        }

        if (this.validationObj.kycVerificationList != null && this.validationObj.kycVerificationList.length > 0) {
            this.errorMsg.push('Verify KYC Of ' + this.validationObj.kycVerificationList.join() + ' from Add/Modify Applicant Button');
        }
        if (this.validationObj.mobileverificationList != null && this.validationObj.mobileverificationList.length > 0) {
            this.errorMsg.push('Verify Mobile Of ' + this.validationObj.mobileverificationList.join() + ' from Add/Modify Applicant Button');
        }


        // applicant Validation

        if (this.validationObj.isLoanApplicantAdded) {
            if (!this.validationObj.kycVerificationList.length && !this.validationObj.mobileverificationList.length && !this.validationObj.isfivcInitiated) {
                if (!this.errorMsg.includes('Initiating FIV-C is Mandatory'))
                    this.errorMsg.push('Initiating FIV-C is Mandatory');
            }
        }


        if (this.applicanttobeCheck) {
            if (!this.hasPrimaryApplicant) {
                this.errorMsg.push('Add An Primary Applicant from Add/Modify Applicant Button');
            }
            // if (!this.isMobileVerified) {
            //     this.errorMsg.push('Verify Mobile Of ' + this.mobDefList + ' from Add/Modify Applicant Button');
            // }
            // if (!this.isKYCVerified) {
            //     this.errorMsg.push('Verify KYC Of ' + this.kycDefList + ' from Add/Modify Applicant Button');
            // }
            if (!this.isIncomeConsidered) {
                this.errorMsg.push('Add Atleast One Income Considered Applicant from Add/Modify Applicant Button');
            }
            if (this.bureauPendingList.length > 0) {
                this.errorMsg.push('Verify Bureau of ' + this.bureauPendingList.join() + ' from Add/Modify Applicant Button');
            }

        }

        if (!this.validationObj.isfivbCompleted && this.validationObj.isfivbInitiated) {
            if (!this.errorMsg.includes('FIV-B Verification is pending'))
                this.errorMsg.push('FIV-B Verification is pending');
        }
        if (!this.validationObj.isfivcCompleted && this.validationObj.isfivcInitiated) {
            if (!this.errorMsg.includes('FIV-C Verification is pending'))
                this.errorMsg.push('FIV-C Verification is pending');
        }
        if (!this.validationObj.isonlineECCompleted && this.validationObj.isonlineECinitiated) {
            if (!this.errorMsg.includes('Online EC Verification is pending'))
                this.errorMsg.push('Online EC Verification is pending');
        }



        console.log('receipt wrapper in PC Submit', this.receiptWrapper);
        // Fee and Insurance Validations
        if (this.receiptWrapper.lengthOfDirectRec > 0 && this.receiptWrapper.hasReceipt == false) {
            this.errorMsg.push('Please Add Receipt in Insurance/Fee Details Tab');
        }
        else {
            console.log('Receipt Defaulter List ', this.receiptWrapper.pendingReceiptList.length);
            if (this.receiptWrapper.pendingReceiptList.length > 0) {
                this.receiptWrapper.pendingReceiptList.forEach(element => {
                    if (element.RecStatus != 'Rejected') {
                        //  this.errorMsgs.push('Approve Receipts ' + this.receiptWrapper.pendingReceiptList.join() + ' In Fee Details Tab');
                        this.errorMsg.push('Get Approve ' + element.RecStatus + ' Receipts ' + element.name + ' In Insurance/Fee Details Tab');
                    }
                });

            }
        }
        if (this.receiptWrapper.existingFeeCodeOption.length > 0) {

            this.receiptWrapper.existingFeeCodeOption.forEach(element => {
                this.errorMsg.push('Please Add Receipt in Fee Details Tab for Fee Code: ' + element.value);
                console.log('this.receiptWrapper.existingFeeCodeOption', element.value);
            });
        }

        // decision Validation Error Message
        if (this.decisionValue == null && this.decisionValue == undefined) {
            this.errorMsg.push('Please Complete Entry In Decision Section');
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
            this.handlepcSubmission();
        }
    }

    // cloning newly Added Property
    handlecloneNewPropety() {
        clonePropertyNew({ appId: this.applicationId })
            .then(result => {
                console.log('result in clone property ', result);
            })
            .catch(error => {
                console.log('error in clone property ', error);
            });
    }

    // pc submission to next stage
    handlepcSubmission() {
        handleFinish({ appId: this.applicationId, stage: 'PC', verfId: this.recordId }).then(result => {
            console.log('pc finish successfully called', result);
            var today = new Date().toISOString().slice(0, 10);
            console.log('today date', today);
            const fields = {};
            fields[ID_FIELD.fieldApiName] = this.applicationId;
            fields[STAGE_FIELD.fieldApiName] = 'Approval Credit';
            fields[SUBMISSION_DATE_FIELD.fieldApiName] = today;
            const recordInput = { fields };
            updateRecord(recordInput)
                .then(() => {
                    console.log('pc finish successfully called', result);
                    this.showToast('Success', 'success', 'Process Credit Completed Successfully');
                    this.navigateToApplication();
                })
                .catch(error => {
                    console.log(error);
                });
        })
            .catch(err => {
                console.log('pc finish error called', err);
            })
    }

    // navigate to Application Record Page
    navigateToApplication() {
        console.log('navigate called' + this.applicationId);
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this.applicationId,
                actionName: 'view',
            }
        });
    }


    // show toast Method
    showToast(title, variant, message) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                variant: variant,
                message: message,
            })
        );
    }

    // document upload Validation Methods
    handleRequiredDocument(event) {
        console.log('required doc list :: ', JSON.stringify(event.detail));
        this.requiredDocuments = event.detail;
    }


    getRequiredDocuments() {
        this.requiredDocuments = [];
        getRequiredDocuments({ stage: 'Process Credit', parentId: this.applicationId })
            .then(result => {
                console.log('::: result ::: ', JSON.stringify(result));
                this.requiredDocuments = result;
            })
            .catch(error => {
                console.log('error doc upload ', error);
            })
    }


    requiredDocumentValidation() {
        if (this.requiredDocuments.length > 0) {
            this.requiredDocuments.forEach(element => {
                this.errorMsgs.push('Upload Required Document ' + element + ' In Document Upload Tab');
            });
        }
    }

}