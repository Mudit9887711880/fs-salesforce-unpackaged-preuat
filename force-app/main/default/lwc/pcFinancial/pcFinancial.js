import { LightningElement, track, api, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getRecord } from "lightning/uiRecordApi";
import getData from '@salesforce/apex/fsPcAcController.getData';
import getTopupData from '@salesforce/apex/fsPcAcController.getTopupTableRecords';
import getIncomeSummary from '@salesforce/apex/fsPcAcController.getIncomeSummary';
import getAccounts from '@salesforce/apex/fsPcAcController.getAccounts';
import geteffectiveIrr from '@salesforce/apex/fsPcAcController.getEffectiveIRR';
import getHighmarkLoanAmount from '@salesforce/apex/fsPcAcController.getHighmarkLoanAmount';
import getHMScore from '@salesforce/apex/fsPcAcController.getHMScore';
import getInsurancePremium from '@salesforce/apex/fsPcAcController.getInsurancePremium';

const APPLICATION_FIELDS = [
    'Application__c.Total_net_income_after_2nd_tranche__c',
    'Application__c.Tranche_Disbursal__c',
    'Application__c.Final_Collateral_value_for_Tranche_2__c',
    'Application__c.Amount_Recommended__c',
    'Application__c.Total_Amount_Recommended_PcAc__c',
    'Application__c.Insurance_Premium__c',
    'Application__c.Total_ROI__c',
    'Application__c.Tenor_In_Months__c',
    'Application__c.Tranche_1__c',
    'Application__c.Tranche_2__c',
    'Application__c.Nominee__c',
    'Application__c.Name__c',
    'Application__c.Nominee_Party__c',
    'Application__c.Customer_Communicated__c',
    'Application__c.Margin_ROI__c',
    'Application__c.Insurance_Premium__c',
    'Application__c.Amount_Recommended__c',
    'Application__c.Group_Valuation__c',
    'Application__c.Transaction_LTV__c',
    'Application__c.NACH_Party_2_ID__c',
    'Application__c.NACH_Party_1_ID__c',
    'Application__c.Staff_Loan__c',
    'Application__c.Effective_IRR__c',
    'Application__c.Emi_PcAc__c',
    'Application__c.Disbursement_party__c',
    'Application__c.Disbursement_party_Id__c',
    'Application__c.Combined_LTV__c'
];
export default class PcFinancial extends LightningElement {

    @track customerValue;
    @track customerType;
    @track TrancheValue;
    @track loanType;
    @track loanPuropse;
    @track isTopupDetails = false;
    @track isCollateraldetails = false;
    @track isOldloandetails = false;
    @track isApplicationdetails = false;
    @track isLoandetails = false;
    @track isTranche = false;
    @track isInsuranceparty = false;
    @track isDisbursementdetail = false;
    @track isLoanAmount = false;
    @track isEligibilityCalculations = false;
    @track isRiskRating = false;
    @track isOthers = false;
    @track isExecutiveSummary = false;
    @track financialSpinner = false;
    @track topupTableData;
    @api sectiontitle;
    @api applicationId;
    @api applicationName;
    @api verfId;
    @api loginId;
    @track RecordType;
    @track error;
    @track record;
    @api recordTypeName;
    @track topUpSection = false;

    @api customerOptions;
    @track disbursementpartyvalue;
    @track disbursementpartyId;
    @track nachpartyvalue2;
    @track nachpartyvalue;
    @track nachpartyId1;
    @track nachpartyId2;
    @track incomeSummaryObj;
    @track beneficiarytypeOption;
    @track showdisbursement = false;
    @track showThirdPartyName = false;
    @api propertySummary;

    // loan detail Section
    @track hasRoiValue = false;
    @track hasTenorValue = false;
    @track tenorValue;
    @track roiRate;
    @track totalROI;
    @track marginROI;
    @track effIrr;
    @track iseffIrrDisabled = false;
    @track isRoiDisabled = false;
    @track showModal = false;
    @track advanceEmi = 1;
    @track tenorRoiMap = new Map();

    ////////////// Tranche Section
    @track isTrancheI = false;
    @track totalIncome;
    @track netIncomeRemarks = false;
    @track netIncomePresent = false;
    @track finalcolPresent = false;
    @track finalCollateralValue;
    @track colRequired = false;
    @track totalTranche;
    @track tranche1;
    @track tranche2;
    @track netIncomeLabel;
    @track colValueLabel;
    @track showEmi = false;
    @track emiTrancheValue;
    @track emiValue;

    /////////////////////////////loan Amount Section

    @track trancheAmt;
    @track grpValuation;
    @track totalamountValue;
    @track amountrecomended;
    @track insuranceamount;
    @track amountDisabled = false;
    @track groupValuationValue;
    @track loanTypeValue;
    @track hasEmi = false;


    /////////////////// Insurance Party
    @track isInsuranceValid = true;
    @track nomineeOptions;
    @track shownominee = false;
    @track nomineedata;
    @track fakeNominee = false;
    @track nomineeValue;
    @track insuredName;


    //////////// eligibility Tab
    @track netIncome;
    @track tranchecollateralValue;
    @track tranchenetIncome;
    @track collateralValue;
    @track tarnscLTV;
    @track combinedLTV;
    @track transcDBR;
    @track combinedDBR;
    @track highmarkEmiAmount;

    /// Risk Rating 
    @track lTVScore;
    @track dbrScore;
    @track hmScore;


    @wire(getRecord, { recordId: '$applicationId', fields: APPLICATION_FIELDS })
    applicationData({ error, data }) {
        if (data) {
            console.log('data>>>>>>', data);
            console.log('tranche disbursal callled', data.fields.Tranche_Disbursal__c.value);

            if (data.fields.Total_net_income_after_2nd_tranche__c.value != null && data.fields.Total_net_income_after_2nd_tranche__c.value != ''
                && data.fields.Total_net_income_after_2nd_tranche__c.value != undefined) {
                this.netIncomePresent = true;
                this.totalIncome = data.fields.Total_net_income_after_2nd_tranche__c.value;
            }
            if (data.fields.Tranche_Disbursal__c.value != null && data.fields.Tranche_Disbursal__c.value != '' &&
                data.fields.Tranche_Disbursal__c.value != undefined) {
                console.log('tranche disbursal callled');
                if (data.fields.Tranche_Disbursal__c.value == 'I') {
                    console.log('tranche disbursal callled');
                    this.netIncomeLabel = 'Total net income after Ist tranche(₹)';
                    this.colValueLabel = 'Final Collateral value for Tranche 1';
                    this.isTrancheI = true;
                    this.showEmi = false;
                    if (data.fields.Tranche_1__c.value != null) {
                        this.trancheAmt = data.fields.Tranche_1__c.value;
                        this.amountDisabled = true;
                    }
                }
                else if (data.fields.Tranche_Disbursal__c.value == 'II') {
                    this.netIncomeLabel = 'Total net income after 2nd tranche(₹)';
                    this.colValueLabel = 'Final Collateral value for Tranche 2';
                    this.isTrancheI = true;
                    this.showEmi = true;
                    if (data.fields.Tranche_2__c.value != null) {
                        this.trancheAmt = data.fields.Tranche_2__c.value;
                        this.amountDisabled = true;
                    }
                }
                else {
                    this.isTrancheI = false;
                    this.amountDisabled = false;
                }
            }
            if (data.fields.Final_Collateral_value_for_Tranche_2__c.value != null && data.fields.Final_Collateral_value_for_Tranche_2__c.value != '' &&
                data.fields.Final_Collateral_value_for_Tranche_2__c.value != undefined) {
                this.finalcolPresent = true;
                this.finalCollateralValue = data.fields.Final_Collateral_value_for_Tranche_2__c.value;
            }


            if (data.fields.Tenor_In_Months__c.value != null && data.fields.Tenor_In_Months__c.value != undefined) {
                this.hasTenorValue = true;
                this.tenorValue = data.fields.Tenor_In_Months__c.value;
            }
            if (data.fields.Tranche_1__c.value != null && data.fields.Tranche_1__c.value != undefined) {
                this.tranche1 = data.fields.Tranche_1__c.value;
            }
            if (data.fields.Tranche_2__c.value != null && data.fields.Tranche_2__c.value != undefined) {
                this.tranche2 = data.fields.Tranche_2__c.value;
            }
            if (data.fields.Nominee__c.value != null && data.fields.Nominee__c.value != undefined) {
                if (data.fields.Nominee__c.value == 'No') {
                    this.nomineeValue = '';
                    this.shownominee = true;
                    this.fakeNominee = false;
                }
                else if (data.fields.Nominee__c.value == 'Yes') {
                    this.shownominee = false;
                    this.fakeNominee = true;

                }
                else {
                    this.shownominee = false;
                    this.fakeNominee = false;
                }
            }
            if (data.fields.Nominee_Party__c.value != null && data.fields.Nominee_Party__c.value != undefined)
                this.nomineeValue = data.fields.Nominee_Party__c.value;
            if (data.fields.Name__c.value != null && data.fields.Name__c.value != undefined)
                this.insuredName = data.fields.Name__c.value;
            if (data.fields.Customer_Communicated__c.value != null && data.fields.Customer_Communicated__c.value != undefined) {
                this.hasRoiValue = true;
                this.roiRate = data.fields.Customer_Communicated__c.value;
                this.isRoiDisabled = true;
            }
            if (data.fields.Emi_PcAc__c.value != null && data.fields.Emi_PcAc__c.value != undefined) {
                this.hasEmi = true;
                this.emiValue = data.fields.Emi_PcAc__c.value;
            }

            if (data.fields.Margin_ROI__c.value != null && data.fields.Margin_ROI__c.value != undefined)
                this.marginROI = data.fields.Margin_ROI__c.value;
            if (data.fields.Amount_Recommended__c.value != null && data.fields.Amount_Recommended__c.value != undefined)
                this.amountrecomended = data.fields.Amount_Recommended__c.value;
            // if (data.fields.Insurance_Premium__c.value != null && data.fields.Insurance_Premium__c.value != undefined)
            //     this.insuranceamount = data.fields.Insurance_Premium__c.value;
            // else
            //     this.insuranceamount = 0;
            if (data.fields.Group_Valuation__c.value != null && data.fields.Group_Valuation__c.value != undefined)
                this.groupValuationValue = data.fields.Group_Valuation__c.value;
            if (data.fields.Transaction_LTV__c.value != null && data.fields.Transaction_LTV__c.value != undefined)
                this.tarnscLTV = data.fields.Transaction_LTV__c.value;
            if (data.fields.Combined_LTV__c.value != null && data.fields.Combined_LTV__c.value != undefined)
                this.combinedLTV = data.fields.Combined_LTV__c.value;
            if (data.fields.NACH_Party_1_ID__c.value != null && data.fields.NACH_Party_1_ID__c.value != undefined)
                this.nachpartyId1 = data.fields.NACH_Party_1_ID__c.value;
            if (data.fields.NACH_Party_2_ID__c.value != null && data.fields.NACH_Party_2_ID__c.value != undefined)
                this.nachpartyId2 = data.fields.NACH_Party_2_ID__c.value;
            if (data.fields.Staff_Loan__c.value != null && data.fields.Staff_Loan__c.value != undefined) {
                if (data.fields.Staff_Loan__c.value == true)
                    this.loanTypeValue = '5S employee';
                else if (data.fields.Staff_Loan__c.value == false)
                    this.loanTypeValue = 'Normal';
            }
            if (data.fields.Effective_IRR__c.value != null && data.fields.Effective_IRR__c.value != undefined) {
                this.iseffIrrDisabled = true;
            }
            if (data.fields.Disbursement_party_Id__c.value != null && data.fields.Disbursement_party_Id__c.value != undefined) {
                this.disbursementpartyId = data.fields.Disbursement_party_Id__c.value;
            }
            if (data.fields.Disbursement_party__c.value != null && data.fields.Disbursement_party__c.value != undefined) {
                if (data.fields.Disbursement_party__c.value == 'Disbursement Party Name') {
                    this.showdisbursement = true;
                    this.showThirdPartyName = false;
                }
                else if (data.fields.Disbursement_party__c.value == 'Third Party') {
                    this.showdisbursement = false;
                    this.showThirdPartyName = true;
                }
            }

            if (data.fields.Amount_Recommended__c.value != null && data.fields.Insurance_Premium__c.value != null)
                this.totalamountValue = data.fields.Amount_Recommended__c.value + data.fields.Insurance_Premium__c.value;

            if (this.amountrecomended && this.groupValuationValue) {
                this.tarnscLTV = ((this.amountrecomended / this.groupValuationValue) * 100).toFixed(2);
                this.combinedLTV = ((this.amountrecomended / this.groupValuationValue) * 100).toFixed(2);
            }
            if (this.amountrecomended && this.insuranceamount)
                this.totalamountValue = this.amountrecomended + Math.ceil(this.insuranceamount/10000)*10000;
            console.log('roi value', this.roiRate);
            console.log('combinedLTV value', this.combinedLTV);
            console.log('totalamountValue value', this.totalamountValue);
            console.log('amountrecomended in wire', this.amountrecomended, 'insurance premium value', this.insuranceamount);
            console.log('nach party 1', this.nachpartyId1);
            console.log('nach party 2', this.nachpartyId2);
            console.log('disbursement party id', this.disbursementpartyId);
            console.log('this.customer options in wire', this.customerOptions);

            console.log('tenor Value', this.tenorValue, 'loan type value', this.loanTypeValue, 'advance emi', this.advanceEmi);
            if (this.tenorValue != null && this.loanTypeValue != null && this.advanceEmi != null) {
                geteffectiveIrr({ appId: this.applicationId, Tenure: parseInt(this.tenorValue), loanType: this.loanTypeValue, numofEmi: this.advanceEmi })
                    .then(result => {
                        console.log('eff Irr', result);
                        if (result) {
                            if (result.isSamePropertyType == true) {
                                this.iseffIrrDisabled = true;
                                this.isRoiDisabled = true;
                                this.effIrr = result.EffIrr;
                                this.roiRate = result.Rate;
                            }
                            else if (result.isSamePropertyType == false) {
                                this.iseffIrrDisabled = false;
                                this.isRoiDisabled = false;
                                this.effIrr = result.EffIrr;
                                this.roiRate = result.Rate;
                            }
                        }
                    })
                    .catch(err => {
                        console.log('erro', err);
                    })
            }

            // if (this.tarnscLTV && this.combinedLTV)
            //     this.lTVScore = Math.max(this.tarnscLTV, this.combinedLTV);
            // if (this.transcDBR && this.combinedDBR)
            //     this.dbrScore = Math.max(this.transcDBR, this.combinedDBR);
        }
        else if (error) {
            this.error = error;
            console.log('error n wire ', error);
        }
    }




    connectedCallback() {
        console.log('listOptions :' + JSON.stringify(this.listOptions));
        console.log('customerOptions :' + JSON.stringify(this.customerOptions));
        if (this.recordTypeName == '3. Top-up loan') {
            this.topUpSection = true;
        }
        else {
            this.topUpSection = false;
        }
        this.getAllApplicants();
        this.handlegetHighmarkEmiAmount();
        this.handleInsurancePremium();

        console.log('value>>>> ', this.TrancheValue);
        console.log('Property Summary>>>>> ', this.propertySummary);

    }

    handleInsurancePremium()
    {
        getInsurancePremium({applicationId:this.applicationId})
        .then(result=>{
          console.log('Insurance Premium result ###',result);
          if(result)
            this.insuranceamount = Math.round(result);
            console.log('Insurance Amount',this.insuranceamount);
        })
        .catch(err=>{
          console.log('Error in Insurance Premium ###',err);
        })
    }

    handlegetHMScore() {
        let loanParam;
        if (this.incomeSummaryObj.incomeList.length) {
            let loanAppList = this.incomeSummaryObj.incomeList;
            console.log(loanAppList);
            let highestIncome = { index: undefined, income: 0 };

            loanAppList.forEach((Element, index, arr) => {
                if (parseFloat(Element.incomePerMonth) > highestIncome.income) {
                    highestIncome.income = parseFloat(Element.incomePerMonth);
                    highestIncome.index = index;
                }
            })
            console.log('highestIncome', highestIncome);
            if (highestIncome.index)
                loanAppList.forEach((Element, index, arr) => {
                    loanParam = (arr[highestIncome.index].applicantId != undefined)?arr[highestIncome.index].applicantId:null;
                })
            console.log('loan app Id', loanParam);


        }
        if(loanParam)
        {
            getHMScore({ loanAppId: loanParam })
            .then(res => {
                console.log('HM Score', res);
                if(res)
                this.hmScore = res;
            })
            .catch(err => {
                console.log('err in HM Score', err);
            })
        }
    }


    handlegetHighmarkEmiAmount() {
        getHighmarkLoanAmount({ applicationId: this.applicationId })
            .then(result => {
                console.log('total emi amount from highmark', result);
                this.highmarkEmiAmount = result;
                console.log('emi from bureau', this.highmarkEmiAmount);
            })
            .catch(err => {
                console.log('ERRor in total emi amount from highmark', err);
            })
    }



    handleTabActivation(event) {
        console.log('handleTabActivation= ', event.target.value);
        this.isTopupDetails = false;
        this.isCollateraldetails = false;
        this.isOldloandetails = false;
        this.isApplicationdetails = false;
        this.isLoandetails = false;
        this.isTranche = false;
        this.isInsuranceparty = false;
        this.isDisbursementdetail = false;
        this.isLoanAmount = false;
        this.isEligibilityCalculations = false;
        this.isRiskRating = false;
        this.isOthers = false;
        this.isExecutiveSummary = false;

        if (event.target.value == 'Topup Details') {
            this.isTopupDetails = true;
            this.getTopupTableRecords();
        } else if (event.target.value == 'Collateral details') {
            this.isCollateraldetails = true;
        } else if (event.target.value == 'Old loan details') {
            this.isOldloandetails = true;
        } else if (event.target.value == 'Application details') {
            this.financialSpinner = true;
            let capType, verfType;
            if (this.sectiontitle == 'PC') {
                capType = 'PC Capability';
                verfType = 'PC';
            }
            else if (this.sectiontitle == 'AC') {
                capType = 'AC Capability';
                verfType = 'AC';
            }

            getIncomeSummary({ applicationId: this.applicationId, caprecordtypeName: capType, VerfRecordTypeName: verfType }).then((result) => {
                console.log('handleGetIncomeSummary= ', result);
                this.incomeSummaryObj = JSON.parse(JSON.stringify(result));
                ///////////////////////////////////////////
                if (this.recordTypeName == '3. Top-up loan') {
                    this.isTopupDetails = true;
                    let value = this.template.querySelectorAll('.consider');
                    console.log('conisder>>>> ', value);
                    if (value == 'Yes') {
                        this.customerType = 'Existing';
                        this.loanType = 'topup related scheme';
                    }
                    else if (value == 'No') {
                        this.customerType = 'Repeat';
                    }
                }
                else {
                    this.customerType = 'New';
                    if (this.incomeSummaryObj.totalbusMonthlyIncome != null && this.incomeSummaryObj.totalMonthlyIncome != null) {
                        if (parseInt(this.incomeSummaryObj.totalbusMonthlyIncome) > (parseInt(this.incomeSummaryObj.totalMonthlyIncome) * (25 / 100)))
                            this.loanType = 'business related scheme';
                        else
                            this.loanType = 'mortgage related scheme';

                        if (this.loanType == 'business related scheme')
                            this.loanPuropse = 'Business loan';
                        else
                            this.loanPuropse = 'Personal use';
                    }
                }
                //////////////////////////////////////////////////////////////////////
                this.financialSpinner = false;
            }).catch((err) => {
                console.log('Error in handleGetIncomeSummary= ', err);
                this.financialSpinner = false;
            });
            this.isApplicationdetails = true;

        } else if (event.target.value == 'Loan details') {
            this.isLoandetails = true;
            /// to get ROI
            getData({ CustomerId: this.applicationId, ObjName: 'Financial' })
                .then(result => {
                    console.log('ROI result>>>>' + result[0]);
                    let res = JSON.parse(JSON.stringify(result));
                    console.log('ROI result>>>>' + JSON.stringify(res[0]));
                    if (res.length > 0) {
                        if (!this.hasRoiValue)
                            this.roiRate = res[0].ROI__c;
                        if (!this.hasTenorValue)
                            this.tenorValue = res[0].Tenor__C;
                    }
                })
                .catch(error => {
                    console.log('errror in ROI', error);
                });



        } else if (event.target.value == 'Tranche') {
            this.financialSpinner = true;
            if (!this.netIncomePresent)
                this.totalIncome = this.incomeSummaryObj.totalMonthlyIncome;
            if (!this.finalcolPresent && (this.propertySummary.collateralGrandValue != undefined || this.propertySummary.collateralGrandValue != null)) {
                console.log('inside this');
                this.finalCollateralValue = this.propertySummary.collateralGrandValue;
            }
            console.log(parseFloat(this.tranche2), '<><>', parseFloat(this.tenorValue), '<><>', this.roiRate);
            if (this.tranche2 && this.roiRate && this.tenorValue) { this.emiTrancheValue = Math.round((parseFloat(this.tranche2) * parseFloat(this.roiRate / 1200)) * ((Math.pow((1 + parseFloat(this.roiRate / 1200)), parseFloat(this.tenorValue)) / (Math.pow((1 + parseFloat(this.roiRate / 1200)), parseFloat(this.tenorValue)) - 1)))); }
            console.log('emi tranche 2 value', this.emiTrancheValue);

            this.isTranche = true;
            this.financialSpinner = false;
            console.log('roi value ', this.roiRate, ' Tenor >>>> ');
        } else if (event.target.value == 'Insurance party') {
            this.isInsuranceparty = true;
        } else if (event.target.value == 'Disbursement/Repayment detail') {
            this.isDisbursementdetail = true;
        } else if (event.target.value == 'Loan Amount') {
            this.isLoanAmount = true;
            console.log(parseFloat(this.totalamountValue), '<><>', parseFloat(this.tenorValue), '<><>', this.roiRate);

            if (this.totalamountValue && this.roiRate && this.tenorValue) { this.emiValue = Math.round((parseFloat(this.totalamountValue) * parseFloat(this.roiRate / 1200)) * ((Math.pow((1 + parseFloat(this.roiRate / 1200)), parseFloat(this.tenorValue)) / (Math.pow((1 + parseFloat(this.roiRate / 1200)), parseFloat(this.tenorValue)) - 1)))); }
            console.log('emi value in loan amount', this.emiValue);

            if (this.propertySummary.collateralGrandValue != null && this.propertySummary.collateralGrandValue != '' && this.propertySummary.collateralGrandValue != undefined) { this.grpValuation = this.propertySummary.collateralGrandValue; }

        } else if (event.target.value == 'Eligibility Calculations') {
            console.log('Eligibility Calculations>>> ', this.isEligibilityCalculations);
            if (this.incomeSummaryObj.netMonthlyIncomeConsidered != null && this.incomeSummaryObj.netMonthlyIncomeConsidered != undefined && this.incomeSummaryObj.netMonthlyIncomeConsidered != '') {
                console.log('Emi Value', this.emiValue, 'this.incomeSummaryObj.netMonthlyIncomeConsidered', this.incomeSummaryObj.netMonthlyIncomeConsidered, 'highmarkemiamt', this.highmarkEmiAmount);

                if (this.emiValue && this.incomeSummaryObj.netMonthlyIncomeConsidered) {
                    this.transcDBR = (this.emiValue / (this.incomeSummaryObj.totalMonthlyIncome < 0)?this.incomeSummaryObj.totalMonthlyIncome *-1:this.incomeSummaryObj.totalMonthlyIncome).toFixed(2);
                    if (this.highmarkEmiAmount != null) {
                        this.combinedDBR = ((this.emiValue + parseFloat(this.highmarkEmiAmount)) /(this.incomeSummaryObj.totalMonthlyIncome < 0)?this.incomeSummaryObj.totalMonthlyIncome *-1:this.incomeSummaryObj.totalMonthlyIncome).toFixed(2);
                    }
                }
                console.log('this.transcDBR ', this.transcDBR);
                console.log('this.combinedDBR ', this.combinedDBR);
            }
            if (this.incomeSummaryObj.totalMonthlyIncome != null && this.incomeSummaryObj.totalMonthlyIncome != undefined && this.incomeSummaryObj.totalMonthlyIncome != '')
                this.netIncome = (this.incomeSummaryObj.totalMonthlyIncome < 0)?this.incomeSummaryObj.totalMonthlyIncome *-1:this.incomeSummaryObj.totalMonthlyIncome;
            if (this.propertySummary.collateralGrandValue != null && this.propertySummary.collateralGrandValue != undefined && this.propertySummary.collateralGrandValue != '')
                this.collateralValue = this.propertySummary.collateralGrandValue;
            if (this.showEmi) {
                if (this.incomeSummaryObj.totalMonthlyIncome != null && this.incomeSummaryObj.totalMonthlyIncome != undefined && this.incomeSummaryObj.totalMonthlyIncome != '')
                    this.tranchenetIncome = this.incomeSummaryObj.totalMonthlyIncome;
                if (this.propertySummary.collateralGrandValue != null && this.propertySummary.collateralGrandValue != undefined && this.propertySummary.collateralGrandValue != '')
                    this.tranchecollateralValue = this.propertySummary.collateralGrandValue;
            }
            this.isEligibilityCalculations = true;
            console.log('Eligibility Calculations>>> ', this.isEligibilityCalculations);
        } else if (event.target.value == 'Risk Rating') {
            if (this.tarnscLTV && this.combinedLTV)
                this.lTVScore = Math.max(this.tarnscLTV, this.combinedLTV);
            if (this.transcDBR && this.combinedDBR)
                this.dbrScore = Math.max(this.transcDBR, this.combinedDBR);
            this.handlegetHMScore();
            this.isRiskRating = true;
        } else if (event.target.value == 'Others') {
            this.isOthers = true;
        } else if (event.target.value == 'Executive Summary') {
            this.isExecutiveSummary = true;
        }
    }

    checkCustomValidation(className) {
        let inputFields = this.template.querySelectorAll(className);
        inputFields.forEach(inputField => {
            if (!inputField.checkValidity()) {
                inputField.reportValidity();
                if (className == '.insurance')
                    this.isInsuranceValid = false;
            }
        });
    }

    handleInsuranceSubmit(event) {

        if (this.isInsuranceparty) {
            this.checkCustomValidation('.insurance');
            if (this.isInsuranceValid == false)
                event.preventDefault();

            const fields = event.detail.fields;
            this.template.querySelector('lightning-record-edit-form').submit(fields);
        }
        console.log('application submit called', event.target.value);


    }
    handleApplicationSubmit(event) {

        console.log('application submit called', this.applicationId);
        if (this.isDisbursementdetail) {
            const allValid = [
                ...this.template.querySelectorAll('lightning-combobox'),
            ].reduce((validSoFar, inputCmp) => {
                inputCmp.reportValidity();
                return validSoFar && inputCmp.checkValidity();
            }, true);
            if (!allValid) {
                event.preventDefault();
            }
            else {
                console.log('application submit called', this.applicationId);
            }

        }


    }

    handleApplicationSuccess(event) {
        console.log('handle success called' + event.detail.id);
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Sucess',
                variant: 'success',
                message: 'Record Created Successfully'
            })
        );
        const validationEvent = new CustomEvent('checkfinancialvalidation', {
            detail: true
        });
        this.dispatchEvent(validationEvent);



    }

    handleChange(evt) {
        console.log('handleFormValue= ', evt.target.value);
        console.log('handleFormValue= ', evt.target);
        console.log('handleFormValue= ', evt.target.fieldName);


        if (evt.target.fieldName == 'Nominee__c') {
            if (evt.target.value == 'No') {
                this.nomineeValue = '';
                this.shownominee = true;
                this.fakeNominee = false;

                console.log('nominee data from No>>> ', this.nomineedata);
            }
            else if (evt.target.value == 'Yes') {
                this.shownominee = false;
                this.fakeNominee = true;
                console.log('nominee data from yes>>> ', this.nomineedata);
            }
            else {
                this.shownominee = false;
                this.fakeNominee = false;
            }
        }
        else if (evt.target.fieldName == 'Margin_ROI__c') {
            this.marginROI = evt.target.value;
        }
        else if (evt.target.fieldName == 'Customer_Communicated__c') {
            this.roiRate = evt.target.value;
        }
        else if (evt.target.fieldName == 'Total_net_income_after_2nd_tranche__c') {
            if ((evt.target.value != null || evt.target.value != '') && this.totalIncome != null) {
                if (evt.target.value != this.totalIncome) {
                    this.netIncomeRemarks = true;
                }
            }

        }

        else if (evt.target.fieldName == 'Final_Collateral_value_for_Tranche_2__c') {
            console.log('hello col');
            if ((evt.target.value != null || evt.target.value != '') && this.finalCollateralValue != null) {
                if (evt.target.value != this.finalCollateralValue) {
                    console.log('hello col');
                    this.colRequired = true;
                }
            }

        }

        else if (evt.target.fieldName == 'Tranche_1__c') {
            this.tranche1 = parseFloat(this.template.querySelector('[data-id="t1"]').value) !== undefined ? parseFloat(this.template.querySelector('[data-id="t1"]').value) : 0;
            this.trancheAmt = evt.target.value;
            this.amountrecomended = this.trancheAmt;
        }
        else if (evt.target.fieldName == 'Tranche_2__c') {
            this.tranche2 = parseFloat(this.template.querySelector('[data-id="t2"]').value) !== undefined ? parseFloat(this.template.querySelector('[data-id="t2"]').value) : 0;
            this.trancheAmt = evt.target.value;
            this.tranche2 = this.trancheAmt;
            this.amountrecomended = this.trancheAmt;
        }
        else if (evt.target.fieldName == 'Tenor_In_Months__c') {
            this.tenorValue = evt.target.value;
        }
        else if (evt.target.fieldName == 'Amount_Recommended__c') {
            this.amountrecomended = evt.target.value;
        }
        else if (evt.target.fieldName == 'Insurance_Premium__c') {
            this.insuranceamount = evt.target.value;
        }
        else if (evt.target.fieldName == 'Group_Valuation__c') {
            this.groupValuationValue = evt.target.value;
        }
        else if (evt.target.fieldName == 'Tranche_Disbursal__c') {
            if (evt.target.value == 'I') {
                this.netIncomeLabel = 'Total net income after Ist tranche(₹)';
                this.colValueLabel = 'Final Collateral value for Tranche 1';
                this.showEmi = false;
                this.amountDisabled = true;
            }
            else if (evt.target.value == 'II') {
                this.netIncomeLabel = 'Total net income after 2nd tranche(₹)';
                this.colValueLabel = 'Final Collateral value for Tranche 2';
                this.showEmi = true;
                this.amountDisabled = true;
            }

        }
        else if (evt.target.name == 'Nominee_Party') {
            this.nomineeValue = evt.target.value;
        }
        else if (evt.target.fieldName == 'Number_of_advance_EMI__c') {
            this.advanceEmi = evt.target.value;
            if (evt.target.value != '1') {
                this.showModal = true;
            }
        }

        console.log('amt recommended', this.amountrecomended, 'insurance amt >>>>>', this.insuranceamount);

        this.totalamountValue = parseFloat(this.amountrecomended) + Math.ceil(this.insuranceamount/10000)*10000;
        console.log('total amount recommended', this.totalamountValue);
        console.log('in handlechange', this.totalamountValue);
        if (this.totalamountValue && this.roiRate && this.tenorValue)
            this.emiValue = Math.round((parseFloat(this.totalamountValue) * (this.roiRate / 1200)) * ((Math.pow((1 + (this.roiRate / 1200)), this.tenorValue) / (Math.pow((1 + (this.roiRate / 1200)), this.tenorValue) - 1))));
        console.log('emi value in handle3 change', this.emiValue);

        this.totalTranche = this.tranche1 + this.tranche2;

        this.totalROI = this.roiRate - this.marginROI;




        if (this.tranche2 && this.roiRate && this.tenorValue) {
            console.log('calculation done for emi');
            this.emiTrancheValue = Math.round((parseFloat(this.tranche2) * parseFloat(this.roiRate / 1200)) * ((Math.pow((1 + parseFloat(this.roiRate / 1200)), parseFloat(this.tenorValue)) / (Math.pow((1 + parseFloat(this.roiRate / 1200)), parseFloat(this.tenorValue)) - 1))));

        }
        console.log('emi tranche value in handle3 change', this.emiTrancheValue);



        if (this.amountrecomended && this.groupValuationValue) {
            this.tarnscLTV = ((this.amountrecomended / this.groupValuationValue) * 100).toFixed(2);
            this.combinedLTV = ((this.amountrecomended / this.groupValuationValue) * 100).toFixed(2);
        }

        if (this.isLoandetails) {
            if (this.tenorValue != null && this.loanTypeValue != null && this.advanceEmi != null) {
                geteffectiveIrr({ appId: this.applicationId, Tenure: parseInt(this.tenorValue), loanType: this.loanTypeValue, numofEmi: this.advanceEmi })
                    .then(result => {
                        console.log('eff Irr', result);
                        if (result) {
                            if (result.isSamePropertyType == true) {
                                this.iseffIrrDisabled = true;
                                this.isRoiDisabled = true;
                                this.effIrr = result.EffIrr;
                                this.roiRate = result.Rate;
                            }
                            else if (result.isSamePropertyType == false) {
                                this.iseffIrrDisabled = false;
                                this.isRoiDisabled = false;
                                this.effIrr = result.EffIrr;
                                this.roiRate = result.Rate;
                            }
                        }
                    })
                    .catch(err => {
                        console.log('erro', err);
                    })
            }
        }
    }


    handleCustomerSelection(event) {
        console.log('handleFormValue= ', event.target.value);
        console.log('handleFormValue= ', event.target);
        console.log('handleFormValue= ', event.target.name);
        if (event.target.name == 'Customer List') { this.customerValue = event.detail.value; }
        else if (event.target.name == 'Nominee list') { this.nomineeValue = event.detail.value; }
        else if (event.target.name == 'Nach Party') {
            console.log('hello nach');
            this.nachpartyvalue = event.target.options.find(opt => opt.value === event.detail.value).label;
            this.nachpartyId1 = event.target.value;

        }
        else if (event.target.name == 'Nach Party2') {
            console.log('hello nach2');
            this.nachpartyvalue2 = event.target.options.find(opt => opt.value === event.detail.value).label;
            this.nachpartyId2 = event.target.value;
        }
        else if (event.target.fieldName === 'Disbursement_party__c') {
            console.log('hello disbursement');
            if (event.target.value == 'Disbursement Party Name') {
                this.showdisbursement = true;
                this.showThirdPartyName = false;
            }
            else if (event.target.value == 'Third Party') {
                this.showdisbursement = false;
                this.showThirdPartyName = true;
            }
            console.log('show disbursement', this.showdisbursement, 'show third party name', this.showThirdPartyName);
        }
        else if (event.target.name == 'Disbursement_Party_Name__c') {
            this.disbursementpartyvalue = event.target.options.find(opt => opt.value === event.detail.value).label;
            this.disbursementpartyId = event.target.value;
        }
        // check Validation for Nach 1 and Nach 2 
        if (this.isDisbursementdetail) {
            let ref1 = this.template.querySelector('.nach1');
            if (this.nachpartyId1 == this.nachpartyId2) {
                ref1.setCustomValidity('Nach Party 1 and Nach party 2 Can not be same');
            }
            else {
                ref1.setCustomValidity('');
            }
            ref1.reportValidity();

            let ref2 = this.template.querySelector('.nach2');
            if (this.nachpartyId1 == this.nachpartyId2) {
                ref2.setCustomValidity('Nach Party 1 and Nach party 2 Can not be same');
            }
            else {
                ref2.setCustomValidity('');
            }
            ref2.reportValidity();
        }

        ///////////////////////////////////////////
        console.log(this.nachpartyvalue + '>>>>>>' + this.nachpartyvalue2 + '<<<<<<>>>>>>>>' + this.disbursementpartyvalue);
        console.log(this.customerValue);
        console.log(this.nomineedata);
    }


    handleTopupSubmit(event) {
        console.log('Topup submit called', event.target.value);

    }

    handleTopupSuccess(event) {
        console.log('Topup Success called', event.target.value);
        console.log(event.detail.value);
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Record created',
                variant: 'success',
                message: 'Record ID: ' + event.detail.id
            })
        );
        this.resetLogic();
        this.financialSpinner = true;
        this.getTopupTableRecords();


    }

    handleReset(event) {
        this.resetLogic();
    }

    // to resert the form fields;
    resetLogic() {
        const inputFields = this.template.querySelectorAll('.topup');
        if (inputFields) {
            inputFields.forEach(field => {
                field.reset();
            });
        }
    }

    // method to get the topup Table Records
    getTopupTableRecords() {
        this.topupTableData = undefined;
        getTopupData({ appId: this.applicationId, metadataName: 'PC_Topup_Table' })
            .then(result => {
                console.log('Topup Table Data>>>>>> ', JSON.parse(JSON.stringify(result)));
                this.topupTableData = JSON.parse(JSON.stringify(result));
                this.financialSpinner = false;
            })
            .catch(err => {
                console.log('Error in Topup Table Data>>>>>> ', err);
                this.topupTableData = undefined;
                this.financialSpinner = false;

            })
    }

    // to get all applicant names of Application
    getAllApplicants() {
        getAccounts({ appId: this.applicationId }).then(result => {
            let data = [];
            result.forEach(app => {
                data.push({ label: app.Customer_Information__r.Name, value: app.Customer_Information__r.Name });
            });
            this.nomineeOptions = data;
        })
            .catch(error => {
                console.log('error in getting all Applicants', error);
            });
    }

}