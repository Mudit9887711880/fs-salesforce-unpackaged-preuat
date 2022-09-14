import { LightningElement, track, wire, api } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import getData from '@salesforce/apex/fsPcAcController.getData';
import sendBackUpdate from '@salesforce/apex/fsPcAcController.sendBackUpdate';
import getCollateralTableRecords from '@salesforce/apex/fsPcAcController.getCollateralTableRecords';
import getAccounts from '@salesforce/apex/fsPcAcController.getAccounts';
import getLastLoginDate from '@salesforce/apex/DatabaseUtililty.getLastLoginDate';
import checkACValidation from '@salesforce/apex/fsPcAcController.checkACValidation';
import getCharacterTabRecords from '@salesforce/apex/FIV_C_Controller.getCharacterTabRecords';
import GetCollateralSummary from '@salesforce/apex/fsPcAcController.getCollateralSummary';
import getpcpropertyId from '@salesforce/apex/fsPcAcController.getpcpropertyId';
import Business_Date from '@salesforce/label/c.Business_Date';
import gettotalBuildingValue from '@salesforce/apex/fsPcAcController.GetBuildingTotalValue';
import getRecordTypeId from '@salesforce/apex/DatabaseUtililty.getRecordTypeId';
import getCapabiltyData from '@salesforce/apex/fsPcAcController.getCapabiltyData';
import getpccapabilityId from '@salesforce/apex/fsPcAcController.getpccapabilityId';
import getacCapabilitySummary from '@salesforce/apex/fsPcAcController.getacCapabilitySummary';
import clonePropertyNew from '@salesforce/apex/FsPreloginController.clonePropertyNew';
import handleFinish from '@salesforce/apex/fsPcAcController.handleFinish';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import ID_FIELD from '@salesforce/schema/Application__c.Id';
import STAGE_FIELD from '@salesforce/schema/Application__c.Stage__c';
import SUBMISSION_DATE_FIELD from '@salesforce/schema/Application__c.AC_Submission_Date__c';
import { updateRecord } from 'lightning/uiRecordApi';
import getACUsers from '@salesforce/apex/fsPcAcController.getACUsers';

export default class AC_LWC extends NavigationMixin(LightningElement) {

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
        },
        {
            name: 'SendBack',
            label: 'Send Back',
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
    @track opensendback = false;
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
    @track primaryAppName;
    @track recordId;
    @track applicationId;
    @track loginId;
    @track fivCrecordId;
    @track fivBrecordId;
    @track pcrecordId;
    @track customerOptions = [];
    @track pCCombo = false;
    @track showPCSubCombo1 = false;
    @track PCSubOptions = [];
    @track preLoginRecordType;
    @track lastLoginDate;
    @track appName;
    @track businessDate = Business_Date;
    @track acspinner = false;
    @track selectedACUser;
    @track usersList;
    @track isRecommend = false;
    @track sourcingBranch;
    @track decisionValue;


    //for template Rendering and layout classes
    @track acClass = 'slds-size_3-of-12';
    @track pcClass = 'slds-size_3-of-12';
    @track fivCClass = 'slds-size_3-of-12';
    @track fivBClass = 'slds-size_3-of-12';
    @track hideAC = true;
    @track hidePC = true;
    @track hideFIVC = true;
    @track hideFIVB = true;


    // objects 
    @track ObjectNameC;
    @track loanApplicantId;
    @track customerName;


    // for Character Section
    @track isFamilyDetails = false;
    @track isNeighbour = false;
    @track isAffiliation = false;
    @track isLivingStandard = false;
    @track isRepaymentBehaviour = false;
    @track showCharacter = false;
    @track showpcCharacterTable = false;
    @track familyTableData;
    @track characterSpinner = false;
    @track loanAmount;
    ///////////////////////////////////


    // for property
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
    @track fivcpropertyId;
    @track propsubValue;
    @track preloginproperty;
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
    //////////////////////////

    // for financial
    @track isFinancial = false;
    @track finSpinner = false;
    ///////////////////////////


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
    @track capabilityRecordId;
    @track Other_Confirmations;
    @track natureofdocumentProof;
    @track Other_Confirmations_Daily_Wages;
    @track proofRemarks;
    @track ownershipProof;
    @track fcEnquiry;
    /////////////////////////////////

    // for Validation
    @track validationObj;
    @track errorMsg;
    @track showErrorTab = false;
    @track tabName = 'Dedupe_Check';
    @track receiptWrapper = { hasReceipt: false, allApproved: false, pendingReceiptList: [], lengthOfDirectRec: 0, existingFeeCodeOption: [] };
    @track loadAll = false;

    // for Decision Tab
    @track isRemarkRequired = false;


    ///// connected Callback------------------------
    connectedCallback() {


    }

    ///// rendered callback--------------------------
    renderedCallback() {
        if (!this.callOnce) {
            const style = document.createElement('style');
            style.innerText = `.slds-form-element__label{
        font-weight: bold;
    }`;
            this.template.querySelector('[data-id="acTest"]').appendChild(style);
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

    //check PC Validation
    @api checkAllValidation() {
        console.log('verfId ', this.recordId);
        checkACValidation({ verfId: this.recordId, appId: this.applicationId })
            .then(result => {
                console.log(' Validation result', result);
                this.validationObj = result;
                this.handlegetAcUsers();
                this.acspinner = false;
            })
            .catch(err => {
                console.log('error in validation', err);
                this.acspinner = false;
            })
    }


    // handle Tab Activation --------------------------------
    handleTabActivation(event) {
        this.tabName = event.target.value;
        this.PCSubOptions = undefined;
        this.template.querySelectorAll('.mycombobox').forEach(each => { each.value = null; });
        if (event.target.value == 'Character_Screen') {
            this.showCharacter = false;
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


        } else if (event.target.value == 'Carousal_View') {



        } else if (event.target.value == 'Sanction_Condition') {

        }
    }

    // handle Tab activation for Capability Section Tabset
    handleCapabilityTabActivation(event) {
        if (event.target.value == 'Capability_Detail') {
            this.template.querySelectorAll('.customerBox').forEach(each => {
                each.value = null;
            });
            this.showCapability = false;
            this.capabilityTableData = undefined;
            this.showIncomeSubSegment = false;
            getRecordTypeId({ sObjectName: 'Capability__c', recordTypeName: 'AC Capability' })
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
            getacCapabilitySummary({ applicationId: this.applicationId })
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




    @wire(CurrentPageReference)
    getPageReferenceParameters(currentPageReference) {
        this.acspinner = true;
        if (currentPageReference) {
            console.log(currentPageReference);
            this.recordId = currentPageReference.attributes.recordId || null;
            console.log('this.recordId' + this.recordId);
        }
        this.handlegetData(true);
    }

    // method used to get Verification Data
    handlegetData(param) {
        getData({ CustomerId: this.recordId, ObjName: 'Verification__c' })
            .then(result => {
                console.log('result>>>>' + JSON.stringify(result[0]));
                result.forEach(element => {
                    this.applicationId = element.Application__c;
                    this.loginId = element.Application__r.Pre_Login__c;
                    this.preLoginRecordType = element.Application__r.Pre_Login__r.RecordType.Name;
                    this.appName = element.Application__r.Name;
                    this.loanAmount = element.Application__r.Requested_Loan_Amount__c;
                    this.sourcingBranch = element.Application__r.Sourcing_Branch__c;
                    this.selectedACUser = element.AC_User__c;
                    this.decisionValue = element.Application__r.AC_Decision__c;
                    if (this.decisionValue == 'Reject')
                        this.isRemarkRequired = true;
                    else
                        this.isRemarkRequired = false;
                });
                if (param == true)
                    this.fetchLastLoginDate();
            })
            .catch(error => {
                console.log('errror', error);

            });
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
        if (detail === 'SendBack') {
            this.opensendback = true;
        }
    }

    handlesendbackclose(event) {
        if (event.detail == true)
            this.opensendback = false;
    }

    handlenewlyaddedApplicant(event) {
        console.log('new app id List>>>>>> ', this.newappIdList);
        if (event.detail != undefined)
            this.newappIdList = event.detail;

    }

    checkBureau(event) {
        console.log('check Bureau Verified List', event.detail);
        this.bureauPendingList = event.detail;
    }

    // re check all the Validation since there are some change occured on child components
    handleValidation(event) {
        console.log('check validation pc character', event.detail);
        if (event.detail == true)
            this.checkAllValidation();
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


    // add Property close Event-----

    addpropertyclose() {
        this.isAddProperty = false;
        //this.handlecloneNewPropety();
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
    }

    // ownerValidation close event-----------
    handleclose(event) {
        this.openOwnerValidation = event.detail;
    }

    // handleSendBack Method
    handleSendBack(event) {
        let value = event.detail;
        console.log('value from send Back component');
        if (value != null) {
            this.handlesendBackUpdate();
            const fields = {};
            fields[ID_FIELD.fieldApiName] = this.applicationId;
            fields[STAGE_FIELD.fieldApiName] = 'Process Credit';
            const recordInput = { fields };
            updateRecord(recordInput)
                .then(() => {
                    console.log('Send Back Called');
                    this.opensendback = false;
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            variant: 'success',
                            message: 'Application has been Send Back to Process Credit Successfully'
                        })
                    );
                    this.navigateToApplication();
                })
                .catch(error => {
                    console.log(error);
                });
        }
    }

    handlesendBackUpdate() {
        sendBackUpdate({ appId: this.applicationId })
            .then(result => {
                console.log('pc verification status has been changed to pending');
            })
            .catch(error => {
                console.log('Error while doing pc verification status has been changed to pending');
            })
    }



    // event method to get the Total Building Value
    handlegetValue(event) {
        if (event.detail == true)
            this.gettotalValue();

    }

    @api gettotalValue() {
        console.log('total value called!!');
        gettotalBuildingValue({ appId: this.applicationId, recordTypeName: 'AC Property Detail' })
            .then(result => {
                console.log(' total building Values', result);
                if (result)
                    this.totalBuildingValue = result;
            })
            .catch(error => {
                console.log('Error in getting total building Values', error);
            });
    }



    handleChangePC(event) {
        console.log('event.target.name>>> ', event.target.value);
    }


    handlePCSubChange(event) {
        console.log('pc sub change called>>>> ' + event.target.value);
        let value = event.target.value;
        this.showCharacter = false;
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
            this.isGeneralDetails = true;
        }
        else if (value == 'Land_Area_And_Valuation') {
            this.propsubValue = value;
            this.propertySpinner = true;
            this.handleGetCollateralGeneralDetails('PC_Col_LandArea');
            this.showProperty = true;
            this.isLandAreaAndValuation = true;
        }
        else if (value == 'Building_Area_Valuation') {
            this.propsubValue = value;
            this.propertySpinner = true;
            this.handleGetCollateralGeneralDetails('PC_Col_BuildAreaVal');
            this.showProperty = true;
            this.isBuildingAreaAndValuation = true;
            this.gettotalValue();
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
        // get ac capability Record 
        getpccapabilityId({ recordId: row.Id }).then(result => {
            console.log('Capability Record Id', result);
            if (result)
                this.capabilityRecordId = result;
            this.capabilitySpinner = false;
        })
            .catch(err => {
                console.log('error in getting property Id for Ac', err)
                this.capabilitySpinner = false;

            })

        this.showCapability = true;
        this.capabilitySpinner = false;
    }

    // row seletion event Method for Property Table 
    handleSelectedPropertyRow(event) {
        this.propertySpinner = true;
        this.showPropertyForm = false;
        let record = JSON.parse(JSON.stringify(event.detail));
        console.log('Property Row Data>>>>>> ', record);
        this.preloginproperty = record[0].Property__c;
        this.fivcpropertyId = record[0].Id;
        getpcpropertyId({ recordId: this.fivcpropertyId }).then(result => {
            console.log('Property Record Id', result);
            if (result)
                this.propertyRecordId = result;
            this.propertySpinner = false;
        })
            .catch(err => {
                console.log('error in getting property Id for Ac', err)
                this.propertySpinner = false;

            })
        if (this.propsubValue == 'General_Details') {
            this.showPropertyForm = true;
            this.isGeneralDetails = true;

        }
        else if (this.propsubValue == 'Land_Area_And_Valuation') {
            this.showPropertyForm = true;
            this.isLandAreaAndValuation = true;
        }
        else if (this.propsubValue == 'Building_Area_Valuation') {
            this.showPropertyForm = true;
            this.isBuildingAreaAndValuation = true;
            this.gettotalValue();
        }
    }



    handleCustomerChange(event) {
        console.log('LAId' + event.target.value);
        if (event.target.name == 'Customer Info') {
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

    }

    // get collateral summary Table
    getcollateralSummaryTable() {
        GetCollateralSummary({ applicationId: this.applicationId, recTypeName: 'AC Property Detail' })
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




    // for getting the character table records------
    getCharacterTableRecords(metadataName, secName) {
        this.familyTableData = undefined;
        getCharacterTabRecords({ appId: this.applicationId, metadataName: metadataName, sectionName: secName }).then((result) => {
            console.log('getFamilyDetailTableRecords= ', JSON.parse(JSON.stringify(result)));
            this.familyTableData = JSON.parse(JSON.stringify(result));
            this.familyTableData.showCheckboxes = false;
            this.familyTableData.treatCheckboxesAsRadio = false;
            this.characterSpinner = false;
        }).catch((err) => {
            this.familyTableData = undefined;
            console.log('getFamilyDetailTableRecords Error= ', err);
            this.characterSpinner = false;
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



    // to get all applicant names of Application
    getAllApplicants() {
        getAccounts({ appId: this.applicationId }).then(result => {
            this.loanApplicantList = [];
            this.customerOptions = [];
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
            this.customerOptions = data;
            this.loanApplicantList = laList;
            this.ownerOptions = owneroptions;
            console.log('this.CustomerOptions>>>>' + JSON.stringify(this.loanApplicantList));
            console.log('priary App Name', this.primaryAppName);
            this.checkAllValidation();
        })
            .catch(error => {
                console.log('error in getting all Applicants', error);
                this.checkAllValidation();
            });
    }

    // for getting the property table records-------
    handleGetCollateralGeneralDetails(metaName) {
        this.propertyTableData = undefined;
        getCollateralTableRecords({ appId: this.applicationId, metadataName: metaName }).then((result) => {
            console.log('handleGetCollateralGeneralDetails= ', JSON.parse(JSON.stringify(result)));
            this.propertyTableData = JSON.parse(JSON.stringify(result));
            this.propertyTableData.showCheckboxes = false;
            this.propertyTableData.treatCheckboxesAsRadio = false;
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
            // if (result && result.strDataTableData && JSON.parse(result.strDataTableData).length) {
            this.capabilityTableData = result

            // }
            console.log('cap data', JSON.parse(JSON.stringify(result)));
            this.capabilitySpinner = false;
        }).catch((err) => {
            this.capabilityTableData = undefined;
            console.log('getCapabilityTableRecords Error= ', err);
            this.capabilitySpinner = false;
        });
    }

    // handle change method for Decision Tab
    handleChange(event) {
        let value = event.target.value;
        console.log('value in handle change', value);
        if (event.target.fieldName == 'AC_Decision__c') {
            if (value == 'Approve') {
                this.isRemarkRequired = false;
                this.isRecommend = false;
            }
            else if (value == 'Recommend to Another AC') {
                this.isRemarkRequired = false;
                this.isRecommend = true;
            }
            else if (value == 'Reject') {
                this.isRemarkRequired = true;
                this.isRecommend = false;
            }
            else {
                this.isRemarkRequired = false;
                this.isRecommend = false;
            }
        }
        if (event.target.name == 'Select_User') {
            this.selectedACUser = value;
            console.log('this selected AC  User', this.selectedACUser);
        }

    }

    // onsubmit and Onsuccess Method for PC Decision Form
    handleDecisionSubmit(event) {
        console.log('AC Decision Submit Called');
    }

    handleDecisionSuccess(event) {
        console.log('AC Decision Success Called', event.detail.Id);
        this.showToast('', 'success', 'Decision Submitted Successfully');
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
                this.acspinner = false;
            })
            .catch(err => {
                console.log('error in users list', err);
                this.acspinner = false;
            })
    }

    handleACSubmit(event) {
        let myCmp = this.template.querySelector('c-fee-insurance-parent-p-c-screen');
        console.log('submit called myCmp', myCmp);
        if (myCmp)
            myCmp.getReceipt();

        console.log('submit called', this.validationObj);
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

        // if (!this.validationObj.isLegalApprovalCompleted) {
        //     if (!this.errorMsg.includes('Legal Approval is pending'))
        //         this.errorMsg.push('Legal Approval is pending');
        // }




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

        console.log('showErrorTab errorMsg = ', this.errorMsg);

        if (this.errorMsg && this.errorMsg.length) {
            this.showErrorTab = true;
            let ref = this;
            setTimeout(() => {
                ref.tabName = 'Error';
            }, 300);
        } else {
            this.showErrorTab = false;
            this.handleacSubmission();
            this.navigateToApplication();
        }
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


    // ac submission to next stage
    handleacSubmission() {
        var today = new Date().toISOString().slice(0, 10);
        console.log('today date', today);
        this.handlegetData(false);
        console.log('Decision Value', this.decisionValue)
        if (this.decisionValue == 'Approve' || this.decisionValue == 'Recommend to Another AC') {
            handleFinish({ appId: this.applicationId, stage: 'AC', verfId: this.recordId, DecisionValue: this.decisionValue }).then(result => {
                console.log('ac finish successfully called', result);
                if (this.validationObj.isLegalApprovalCompleted) {
                    const fields = {};
                    fields[ID_FIELD.fieldApiName] = this.applicationId;
                    fields[STAGE_FIELD.fieldApiName] = 'Final Sanction';
                    fields[SUBMISSION_DATE_FIELD.fieldApiName] = today;
                    const recordInput = { fields };
                    updateRecord(recordInput)
                        .then(() => {
                            console.log('ac finish successfully called', result);
                            this.showToast('Success', 'success', 'Approval Credit Completed Successfully');
                            this.navigateToApplication();
                        })
                        .catch(error => {
                            console.log(error);
                        });
                }
                else {
                    console.log('ac finish successfully called', result);
                    this.showToast('Success', 'success', 'Approval Credit Completed Successfully');
                    this.navigateToApplication();
                }
            })
                .catch(err => {
                    console.log('ac finish error called', err);
                })
        }
        else {
            const fields = {};
            fields[ID_FIELD.fieldApiName] = this.applicationId;
            fields[STAGE_FIELD.fieldApiName] = 'Approval Credit';
            fields[SUBMISSION_DATE_FIELD.fieldApiName] = today;
            const recordInput = { fields };
            updateRecord(recordInput)
                .then(() => {
                    console.log('ac Reject successfully called');
                    this.showToast('', 'error', 'Application has been Rejected');
                    this.navigateToApplication();
                })
                .catch(error => {
                    console.log(error);
                });
        }
    }

    // details from INsurance/ Fee Component
    getReceiptPendingList(event) {
        console.log('Receipt data approved ', event.detail);
        this.receiptWrapper.hasReceipt = event.detail.hasReceipt;
        this.receiptWrapper.allApproved = event.detail.allApproved;
        this.receiptWrapper.pendingReceiptList = event.detail.pendingReceiptList;
        this.receiptWrapper.lengthOfDirectRec = event.detail.lengthOfDirectRec;
        this.receiptWrapper.existingFeeCodeOption = event.detail.existingFeeCodeOption;
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



}