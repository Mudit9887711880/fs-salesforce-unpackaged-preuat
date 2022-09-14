import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
//------------------------------------------------------------------------------
import BusinessDate from '@salesforce/label/c.Business_Date';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import USER_ID from '@salesforce/user/Id'; //this is how you will retreive the USER ID of current in user.
import { updateRecord } from 'lightning/uiRecordApi';
import USER_NAME_FIELD from '@salesforce/schema/User.Name';
import { NavigationMixin } from 'lightning/navigation';
import APPT_STAGE_FIELD from '@salesforce/schema/Application__c.Stage__c';
import APPT_NAME_FIELD from '@salesforce/schema/Application__c.Name';
//-----------------------------------------------------------------------------
import getLastLoginDate from '@salesforce/apex/DatabaseUtililty.getLastLoginDate';
import callDedupeAPI from '@salesforce/apex/DedupeAPI.callDedupeAPI';
import checkDedupeCriteria from '@salesforce/apex/DedupeAPI.checkDedupeCriteria';
//--------------------------------------------------------------------------------
import cifId from '@salesforce/schema/Loan_Applicant__c.cifId__c';
import ID_FIELD from '@salesforce/schema/Loan_Applicant__c.Id';
import DedupeExceptionUser from '@salesforce/apex/DedupeDetailsController.assignDedupeExceptionUser';
//import createCustomerAPI from '@salesforce/apex/FS_LMS_CreateCustomerAPI.createCustomer';
import activeDedupeData from '@salesforce/apex/DedupeDetailsController.saveDedupeData';
import checkSubmitDedupeValidation from '@salesforce/apex/DedupeDetailsController.checkDedupeValidation';
import getLoanDedupeData from '@salesforce/apex/DedupeDetailsController.getLoanDedupeData';
import getCurrentUserId from '@salesforce/apex/DedupeDetailsController.getCurrentUserId';
import getExceptionUserDedupe from '@salesforce/apex/DedupeDetailsController.getExceptionUserDedupe';
import updateLoanApp from '@salesforce/apex/DedupeDetailsController.updateLoanApp';
import getLoanApplicants from '@salesforce/apex/DedupeDetailsController.getLoanApplicants';
import getButtonStatus from '@salesforce/apex/DedupeDetailsController.getButtonStatus';
import lmsLoanAppt from '@salesforce/apex/DedupeDetailsController.lmsLoanAppt';
import getLan from '@salesforce/apex/DedupeDetailsController.getLan';
import getExceptionLoanApplicants from '@salesforce/apex/DedupeDetailsController.getExceptionLoanApplicants';
import getDedupeUserData from '@salesforce/apex/DedupeDetailsController.getDedupeUserData';
import getApplicantsStatus from '@salesforce/apex/DedupeDetailsController.getApplicantsStatus';
import getDoneDedupeData from '@salesforce/apex/DedupeDetailsController.getDoneDedupeData';
import checkDedupeButton from '@salesforce/apex/DedupeDetailsController.checkDedupeButton';




export default class fsdedupeDetailsLwc extends NavigationMixin(LightningElement) {
    @api recordId;
    @api source;
    lastLoginDate;
    todaysDate = BusinessDate;
    @track activeTab = false;
    @track apptStageName='Exception Stage';
    @track cifId;
    @track tempvar;
    @track cifDedupeData = [];
    @track nondedupechildloanval = [];
    //@track listLoanApptName = [];
    @track listLoanApptName;
    @track listExceptionUserDedupe = [];
    @track exceptionUserDedupe;
    @track exceptionUserDedupeMap = new Map();
    @track exceptionUserapplicantMap = new Map();
    @track mapLoanApptDedupe = new Map();
    @track disableSubmit=false;
    slcdLoanApptName = '';
    exceptionUserLoanApptName = '';
    isActiveType = '';
    @track arrSlcdLoanApptDedupe;
    @track onchangeExceptionDedupe;
    @track exceptionUserDedupeLoans;
    @track arrSlcdLoanApptDedupeLoans;
    @track arrSlcdLoanApptFieldComparison;
    @track myDedupeRecords = [];
    @track disablededupeButton = false;
    @track showDedupeButton = true;
    @track loanApptName;
    @track hasDedupeRecord = false;
    @track showDedupeResult = true;
    voterId='';
    pasport='';
    driving='';
    pan='';
    adhar='';
    lanId='';
    showData = false;
    showLoader = false;
    showLoanDetailModal = false;
    showFieldComparisonTable = false;
    @track btns = [
        {
            name: 'Re-trigger Dedupe',
            label: 'Re-trigger Dedupe',
            variant: 'brand',
            class: 'slds-m-left_x-small'
        }];
    @track dedupeDetailList;
    @track showExceptionUser = false;
    @track isApplicantFlag = false;
    @track nonDedupeExecutionUserFlag = false;
    //@track nonDedupeExecutionUserFlag = true;
    @track dedupeCriteriaFlag = false;
    @track showtext=false;
    @track dedupeListSizeFlag = false;
    @track saveDedupeDetailList;
    @track isOptionDisable = false;
    @track isYesNoDisable = true;
    @track isdedupeDone = false;
    @track showModal = false;
    @track LoanDedupeWrapper;
    @track getPickVal;
    @track loanappIdExpnUser;
    @track cifIdExpnUser;
    @track dedupeNonExpnApptId;
    @track isload = false;
    showButtonLabel = '';
    @track isSpinner = false;
    @track showdropdown=false;
    @track showSaveData=false;
    branchName='';
    yesNoVal='';


    // metgid to getlogin username
    @wire(getRecord, {
        recordId: USER_ID,
        fields: [USER_NAME_FIELD]
    }) wireuser({
        error, data
    }) {
        if (error) {
            dis.error = error;
        } else if (data) {
            console.log(' LOGIN   USER NAMEEE   ', data.fields.Name.value);
            if (data.fields.Name.value != 'Dedupe Exception User')
                this.nonDedupeExecutionUserFlag = true;
        }
    }

    //--------------------------------------------------------------------------
    @wire(getRecord, { recordId: '$recordId', fields: [APPT_STAGE_FIELD, APPT_NAME_FIELD] })
    objAppt;
    get apptName() {
        return getFieldValue(this.objAppt.data, APPT_NAME_FIELD);
    }
   /* get apptStageName() {
        return getFieldValue(this.objAppt.data, APPT_STAGE_FIELD);
    }*/
    get dedupeAnswerOpts() {
        return [{ label: 'Yes', value: 'Yes' }, { label: 'No', value: 'No' }];
    }

    //--------------------------------------------------------------------------
    connectedCallback() {
      //  this.getCurrentAppsLoanApp();
        console.log('connected id is >>>',this.recordId);
        this.handleGetLastLoginDate();
        this.checkUser();
       // this.initData();
       // this.checkExceptionUserData();
        
    }



    initData() {
                checkDedupeButton({
                    "applicationId": this.recordId
                }).then((result) => {
                        if(result){
                            this.dedupeCriteriaFlag=true;
                        }else{
                            this.dedupeCriteriaFlag=false;
                        }
                    
        }).catch((err) => {
            console.log('Error in Criteriaaa = ', err);

        });
    }

    getCurrentAppsLoanApp() {

        console.log('record id is >>', this.recordId);
    if(!this.showExceptionUser){
        try {
            console.log('applicatrionId is >>>', this.recordId);
            getLoanApplicants({ applicationId: this.recordId }).then((result) => {
                this.listLoanApptName = result;
                console.log('apploanapplicant is >>', this.listLoanApptName);
                // this.loanApptName = this.listLoanApptName[0].Applicant_Name__c;
                this.exceptionUserLoanApptName = this.listLoanApptName[0].Applicant_Name__c;
                console.log('exception var is >>>', this.exceptionUserLoanApptName);
                this.activeTab = true;
                console.log('my val is >>', this.loanApptName);
                // this.checkExceptionUserData();
            }).catch((err) => {
                console.log('Error in getExistingRecord= ', err);
            });
        } catch (e) {
            console.log('error is >>', e.message);
        }
    }else if(this.showExceptionUser){
        try {
            console.log('applicatrionId is >>>', this.recordId);
            getExceptionLoanApplicants({ applicationId: this.recordId }).then((result) => {
                this.listLoanApptName = result;
                console.log('apploanapplicant is >>', this.listLoanApptName);
                // this.loanApptName = this.listLoanApptName[0].Applicant_Name__c;
                this.exceptionUserLoanApptName = this.listLoanApptName[0].Applicant_Name__c;
                console.log('exception var is >>>', this.exceptionUserLoanApptName);
                this.activeTab = true;
               // console.log('my val is >>', this.loanApptName);
                // this.checkExceptionUserData();
            }).catch((err) => {
                console.log('Error in getExistingRecord= ', err);
            });
        } catch (e) {
            console.log('error is >>', e.message);
        }
    }

    }


    checkUser() {

        getCurrentUserId().then((result) => {
            console.log('result val is >>',result);
            if (result) {
               
                this.showData = true;
                this.showExceptionUser = true;
                this.getCurrentAppsLoanApp();
            }else{
                this.initData();
                this.getCurrentAppsLoanApp();
            }
        }).catch((err) => {
            console.log('Error in getExistingRecord= ', err);
        });
    }


    checkExceptionUserData() {
       
        this.exceptionUserDedupeMap.clear();
        console.log('app iddjs >>',this.recordId);

        if((!(this.showExceptionUser))){
           
            getDoneDedupeData({ applicationId: this.recordId, applicantName: this.exceptionUserLoanApptName }).then((result) => {
            this.exceptionUserDedupe = result;
            console.log('data hsd>>',this.exceptionUserDedupe);
            console.log('data hsd>>',this.exceptionUserDedupe.length);
            if(this.exceptionUserDedupe.length==1){

               
                console.log('this.exceptionUserDedupe >>>',this.exceptionUserDedupe);

                    this.hasDedupeRecord=false;
                     this.isYesNoDisable = false;
                        this.dedupeListSizeFlag = false;
                        this.showSaveData=true;
                       this.showtext=true;
                        this.yesNoVal=this.exceptionUserDedupe[0].Active__c;
                        this.showdropdown=false;


                         this.listExceptionUserDedupe = [];

                    this.exceptionUserDedupe.forEach(element => {
                        if (!this.exceptionUserDedupeMap.has(element.Loan_Applicant__r.Applicant_Name__c)) {
                            this.listExceptionUserDedupe.push({ label: element.Loan_Applicant__r.Applicant_Name__c, value: element.Loan_Applicant__r.Applicant_Name__c });
                            this.exceptionUserDedupeMap.set(element.Loan_Applicant__r.Applicant_Name__c, []);
                        }
                        this.exceptionUserDedupeMap.get(element.Loan_Applicant__r.Applicant_Name__c).push(element);
                        this.isload = true;
                        if (!this.isYesNoDisable) {


                            this.dedupeNonExpnApptId = element.Id;
                            console.log('this.dedupeNonExpnApptId val >>', this.dedupeNonExpnApptId);

                            this.loanappIdExpnUser = element.Loan_Applicant__c;
                            console.log('this.loan val >>', this.loanappIdExpnUser);

                            this.cifIdExpnUser = element.CIF_Id__c;
                            console.log('this.loan val >>', this.cifIdExpnUser);

                        }

                    });
                    this.isSpinner = false;

                    if (this.isload) {
                        this.getApptDedupeData();
                    }

                    

            }else{
               
                        this.checkExceptionUserDataLog();
                    
            }


        }).catch((err) => {
            console.log('Error in getExistingRecord= ', err);
        });


        }else{
                        this.checkExceptionUserDataLog();
            }
    }

checkExceptionUserDataLog() {

        if((!(this.showExceptionUser))){
        getButtonStatus({ applicationId: this.recordId, applicantName: this.exceptionUserLoanApptName }).then((result) => {
            if (result) {
                console.log('result is button >>', result);
                this.showButtonLabel = result;
                this.hasDedupeRecord = true;
                this.isSpinner = false;
            }
        }).catch((err) => {
            console.log('Error in getExistingRecord= ', err);
        });
        }

        if (this.showButtonLabel.length == 0 && ((!(this.showExceptionUser)))) {
            
            lmsLoanAppt({ applicationId: this.recordId, applicantName: this.exceptionUserLoanApptName }).then((result) => {
                if (result) {

                    this.showButtonLabel = result;
                    this.hasDedupeRecord = true;
                    console.log('result is awee >>', this.showButtonLabel);
                    this.isSpinner = false;
                }
            }).catch((err) => {
                console.log('Error in getExistingRecord= ', err);
            });
        }


        if ((this.showButtonLabel.length == 0) && (!(this.showExceptionUser))) {
           
            getExceptionUserDedupe({ applicationId: this.recordId, applicantName: this.exceptionUserLoanApptName }).then((result) => {
                if (result) {
                  
                    this.exceptionUserDedupe = result;

                    console.log('result of thsu>>>',this.exceptionUserDedupe);
                   // this.hasDedupeRecord = false;
                    console.log('length of list is >>',this.exceptionUserDedupe.length);
                   /* if(this.exceptionUserDedupe.length==0){
                      this.hasDedupeRecord = true;
                    }else{
                   /     this.hasDedupeRecord = false;
                    }*/
                    
                    console.log('exceptionUserDedupe >>>', this.exceptionUserDedupe);
                    if (this.exceptionUserDedupe.length == 1 && this.exceptionUserDedupe[0].Active__c==='Yes') {
                        
                        this.isYesNoDisable = false;
                        this.dedupeListSizeFlag = false;
                       this.showtext=true;
                        this.yesNoVal=this.exceptionUserDedupe[0].Active__c;
                        this.showdropdown=false;
                    }else if(this.exceptionUserDedupe.length == 1 && this.exceptionUserDedupe[0].Active__c!='Yes' && this.exceptionUserDedupe[0].Active__c!='No'){
                        this.isYesNoDisable = false;
                        this.showdropdown=true;
                         this.showtext=false;
                         this.dedupeListSizeFlag = true;

                    }else{
                        this.isYesNoDisable = true;
                        this.dedupeListSizeFlag = false;
                        this.showtext=false;
                        this.showdropdown=true;
                        
                    }


                    this.listExceptionUserDedupe = [];

                    this.exceptionUserDedupe.forEach(element => {
                        if (!this.exceptionUserDedupeMap.has(element.Loan_Applicant__r.Applicant_Name__c)) {
                            this.listExceptionUserDedupe.push({ label: element.Loan_Applicant__r.Applicant_Name__c, value: element.Loan_Applicant__r.Applicant_Name__c });
                            this.exceptionUserDedupeMap.set(element.Loan_Applicant__r.Applicant_Name__c, []);
                        }
                        this.exceptionUserDedupeMap.get(element.Loan_Applicant__r.Applicant_Name__c).push(element);
                        this.isload = true;
                        if (!this.isYesNoDisable) {


                            this.dedupeNonExpnApptId = element.Id;
                            console.log('this.dedupeNonExpnApptId val >>', this.dedupeNonExpnApptId);

                            this.loanappIdExpnUser = element.Loan_Applicant__c;
                            console.log('this.loan val >>', this.loanappIdExpnUser);

                            this.cifIdExpnUser = element.CIF_Id__c;
                            console.log('this.loan val >>', this.cifIdExpnUser);

                        }

                    });


                    if (this.isload) {
                        this.getApptDedupeData();
                    }

                    console.log('exception user list is >>' + JSON.stringify(this.listExceptionUserDedupe));
                    console.log('exception map is >>' + this.exceptionUserDedupeMap);
                }
            }).catch((err) => {
                console.log('Error in getExistingRecord= ', err);
            });
        }else if(this.showExceptionUser){
            
             getDedupeUserData({ applicationId: this.recordId, applicantName: this.exceptionUserLoanApptName }).then((result) => {
                if (result) {
               
                    this.exceptionUserDedupe = result;

                    console.log('result of thsu>>>',this.exceptionUserDedupe);
                   // this.hasDedupeRecord = false;
                    console.log('length of list is >>',this.exceptionUserDedupe.length);
                   /* if(this.exceptionUserDedupe.length==0){
                      this.hasDedupeRecord = true;
                    }else{
                   /     this.hasDedupeRecord = false;
                    }*/
                    
                    console.log('exceptionUserDedupe >>>', this.exceptionUserDedupe);
                    if (this.exceptionUserDedupe.length == 1 && (this.exceptionUserDedupe[0].Active__c==='Yes')) {
                        
                        this.isYesNoDisable = false;
                        this.dedupeListSizeFlag = false;
                       this.showtext=true;
                        this.yesNoVal=this.exceptionUserDedupe[0].Active__c;
                        this.showdropdown=false;
                    }else if((this.exceptionUserDedupe[0].Active__c==='No') && this.exceptionUserDedupe.length == 1){

                            this.isYesNoDisable = false;
                            this.showdropdown=true;
                            this.showtext=false;
                            this.dedupeListSizeFlag = false;

                        }else if(this.exceptionUserDedupe.length == 1 && this.exceptionUserDedupe[0].Active__c!='Yes' && this.exceptionUserDedupe[0].Active__c!='No'){
                        this.isYesNoDisable = false;
                        this.showdropdown=true;
                         this.showtext=false;
                         this.dedupeListSizeFlag = true;

                    }else{
                        
                        this.isYesNoDisable = true;
                        this.dedupeListSizeFlag = false;
                        this.showtext=false;
                        this.showdropdown=true;
                        
                    }


                    this.listExceptionUserDedupe = [];

                    this.exceptionUserDedupe.forEach(element => {
                        if (!this.exceptionUserDedupeMap.has(element.Loan_Applicant__r.Applicant_Name__c)) {
                            this.listExceptionUserDedupe.push({ label: element.Loan_Applicant__r.Applicant_Name__c, value: element.Loan_Applicant__r.Applicant_Name__c });
                            this.exceptionUserDedupeMap.set(element.Loan_Applicant__r.Applicant_Name__c, []);
                        }
                        this.exceptionUserDedupeMap.get(element.Loan_Applicant__r.Applicant_Name__c).push(element);
                        this.isload = true;
                        if (!this.isYesNoDisable) {


                            this.dedupeNonExpnApptId = element.Id;
                            console.log('this.dedupeNonExpnApptId val >>', this.dedupeNonExpnApptId);

                            this.loanappIdExpnUser = element.Loan_Applicant__c;
                            console.log('this.loan val >>', this.loanappIdExpnUser);

                            this.cifIdExpnUser = element.CIF_Id__c;
                            console.log('this.loan val >>', this.cifIdExpnUser);

                        }

                    });


                    if (this.isload) {
                        this.getApptDedupeData();
                    }

                    console.log('exception user list is >>' + JSON.stringify(this.listExceptionUserDedupe));
                    console.log('exception map is >>' + this.exceptionUserDedupeMap);
                }
            }).catch((err) => {
                console.log('Error in getExistingRecord= ', err);
            });
        }





    }


    callDedupeApiBtnClick() {
        this.isSpinner = true;
        this.dedupeCriteriaFlag = true;
        this.showDedupeResult = false;
        //invoke Dedupe API
        console.log('Application Id   ', this.recordId);
        console.log('Source Invoke  ', this.source);
        try {
            callDedupeAPI({ applicationId: this.recordId, source: this.source, button: 'Check Dedupe',loanApplicantList : this.listLoanApptName })
                .then((result) => {
                    this.dedupeDetailList = JSON.parse(result);
                    console.log('dedupe is >>>' + JSON.stringify(this.dedupeDetailList))
                    console.log('Resulttttt   = ', this.dedupeDetailList);
                    console.log('CRITERIAS   ', this.dedupeDetailList.dedupeCriteria);
                    console.log('MATCHING     ', this.dedupeDetailList.noDedupeMatch);
                    console.log('msg is >>>   = ', this.dedupeDetailList.message);
                    this.showDedupeResult = true;
                    if (this.dedupeDetailList.noDedupeMatch == true) {
                        // code to call Customer Create API
                        /*
                        createCustomerAPI({
                            "loanApptId" : this.recordId
                        }).then((result) => {
                            this.showNotification('Success', 'Create Customer Api call successfully.', 'success'); 
                            console.log('createCustomerAPI   ',result);
                        }).catch((err) => {
                            console.log('Error in createCustomerAPI = ', err);     
                        });
                        */
                       //window.location.reload();
                        this.showNotification('WARNING', 'No Matching Rule found', 'warning');
                        
                        this.isSpinner = false;
                        this.showLoader = false;
                    }
                    else if (this.dedupeDetailList.dedupeCriteria == false) {
                        //window.location.reload();
                        this.showNotification('ERROR', 'Matching Criteria of Dedupe not found', 'error');
                        this.showLoader = false;
                       
                         this.isSpinner = false;
                    }
                    else if (this.dedupeDetailList.statusCode !== 200) {
                        
                        //window.location.reload();

                        this.showNotification('ERROR', this.dedupeDetailList.message, 'error');
                        this.showLoader = false;
                        
                         this.isSpinner = false;
                    }
                    else if (this.dedupeDetailList.statusCode == 200 && (this.dedupeDetailList.noDedupeMatch == false || this.dedupeDetailList.noDedupeMatch == null)) {
                        console.log('RESULT   ', this.dedupeDetailList);
                        this.showData = true;
                        // this.listLoanApptName = [];
                        this.isApplicantFlag = true;
                        //window.location.reload();
                        this.showNotification('SUCCESS', 'Dedupe API Call Successfully.', 'success'); //incase if any apex exception happened it will show notification
                        
                        
                        
                        this.dedupeDetailList.listSObject.forEach(element => {
                            if (!this.mapLoanApptDedupe.has(element.Loan_Applicant__r.Customer_Information__r.Name)) {
                                //this.listLoanApptName.push({ label: element.Loan_Applicant__r.Customer_Information__r.Name, value: element.Loan_Applicant__r.Customer_Information__r.Name });
                                // this.listLoanApptName.push({Name:element.Loan_Applicant__r.Customer_Information__r.Name});
                                this.mapLoanApptDedupe.set(element.Loan_Applicant__r.Customer_Information__r.Name, []);
                            }
                            this.mapLoanApptDedupe.get(element.Loan_Applicant__r.Customer_Information__r.Name).push(element);
                        });

                        console.log('Applicant  ', JSON.stringify(this.listLoanApptName));
                        console.log('this.mapLoanApptDedupe ', this.mapLoanApptDedupe);
                        if (this.listLoanApptName.length > 0) {
                            this.showData = true;
                        }
                        
                    }
                }).catch((err) => {
                    console.log('Error in callDedupeAPI Calling  = ', err);
                    //window.location.reload();
                     this.showDedupeResult = true;
                    this.showNotification('ERROR', err.message, 'error');
                    this.showLoader = false;
                    
                     this.isSpinner = false;
                });
        }
        catch (err) {
             this.showDedupeResult = true;
            console.log('ERROOOOOOOO  ', err);
        }
    }

    handleHeaderButton(event) {
        this.isSpinner=true;
        //invoke Dedupe API
        console.log('calling dedupe apu on button click ', this.recordId);
        callDedupeAPI({ applicationId: this.recordId, source: this.source, button: 'Re-Trigger Dedupe',loanApplicantList : this.listLoanApptName })
            .then((result) => {
                     this.dedupeDetailList = JSON.parse(result);
                console.log('Fs_dedupeDetails_Lwc init result = ', JSON.stringify(result));
                console.log('status code is >>',this.dedupeDetailList.statusCode);
                if (this.dedupeDetailList.statusCode !== 200) {

                    this.showNotification('ERROR', this.dedupeDetailList.message, 'error'); //incase if any apex exception happened it will show notification
                   window.location.reload();
                    this.showLoader = false;
                    this.isSpinner=false;
                } else if(this.dedupeDetailList.statusCode == 200) {
                        this.showNotification('SUCCESS', 'Dedupe API Call Successfully.', 'success'); //incase if any apex exception happened it will show notification
                        window.location.reload();
                        this.isSpinner=false;
                }
                this.showLoader = false;
            }).catch((err) => {

                //incase if any Salesforce exception happened it will show notification
                console.log('Error in Fiv_Disb_Lwc getParentAndRelatedData = ', err);
                this.showNotification('ERROR', err.message, 'error');
                this.showLoader = false;
                this.isSpinner=false;
            });
        
    }



    handleComboBoxChange(event) {
        if (this.dedupeDetailList.listSObject.length == 1) {
            this.dedupeListSizeFlag = true
        }
        else {
            this.isOptionDisable = true
        }
        this.slcdLoanApptName = event.target.value;
        this.showLoader = true;
        if (this.mapLoanApptDedupe.has(this.slcdLoanApptName)) {
            this.arrSlcdLoanApptDedupe = [];
            this.mapLoanApptDedupe.get(this.slcdLoanApptName).forEach(element => {
                console.log(JSON.stringify(element));
                this.arrSlcdLoanApptDedupe.push({ Id: element.Id, CustomerNumber: element.CIF_Id__c, Source: 'LMS', YesNo: '' });
            });
        } else {
            this.arrSlcdLoanApptDedupe = undefined;
            this.arrSlcdLoanApptDedupeLoans = undefined;
            this.showNotification('', 'No Dedupe record found.', 'warning');
        }
        console.log(this.arrSlcdLoanApptDedupe);
        this.showLoader = false;
    }

    handleExcptionComboBoxChange(event) {
        this.exceptionUserLoanApptName = event.target.value;
        this.getApptDedupeData();
    }

    handleActive(event) {
        this.isSpinner = true;
        this.showButtonLabel = '';
        this.cifDedupeData = [];
        this.exceptionUserLoanApptName = event.target.value;
        this.checkExceptionUserData();
        this.activeTab = true;
    }


    getApptDedupeData() {

        console.log('this.exceptionUserDedupeMap is >>', this.exceptionUserDedupeMap);
        this.showLoader = true;
        if (this.exceptionUserDedupeMap.has(this.exceptionUserLoanApptName)) {
            this.onchangeExceptionDedupe = [];
            this.hasDedupeRecord = false;
            this.exceptionUserDedupeMap.get(this.exceptionUserLoanApptName).forEach(element => {
                console.log(JSON.stringify(element));
                this.onchangeExceptionDedupe.push({ Id: element.Id, CustomerNumber: element.CIF_Id__c, Source: 'LMS', YesNo: '' });
            });

            console.log('onchangeExceptionDedupe >>>' + this.onchangeExceptionDedupe);
            console.log('onchangeExceptionDedupe >>>' + JSON.stringify(this.onchangeExceptionDedupe));
            this.isSpinner = false;
        } else {
            this.onchangeExceptionDedupe = undefined;
            this.hasDedupeRecord = true;
            this.isSpinner = false;
            //this.showNotification('', 'No Dedupe record found.', 'warning');
        }
        console.log(this.onchangeExceptionDedupe);
        this.showLoader = false;
    }


    handleDedupeComboBoxChange(event) {
        // Update select option value in JSon Array.

        // if(this.showExceptionUser && this.dedupeListSizeFlag){
        this.getPickVal = event.target.value;
        if (this.getPickVal == 'Yes') {
            //this.dedupeListSizeFlag=false;
            this.dedupeListSizeFlag = true;
        } else {
            this.dedupeListSizeFlag = false;
        }

        //}/*else if(this.dedupeListSizeFlag && !this.showExceptionUser) {
        // this.dedupeDetailList.listSObject[0]['option'] = event.target.value;
        // }*/
    }

    saveDedupeData() {

        this.isSpinner = true;
        this.showDedupeResult=false;

        if (this.showExceptionUser) {
            if (this.getPickVal === 'Yes') {
                updateLoanApp({ loanAppId: this.loanappIdExpnUser, cifId: this.cifIdExpnUser })
                    .then((result) => {
                        if (result) {
                            console.log('Resulttttt   = ', result);
                            this.showNotification('Success', ' Loan Applicant/ Dedupe  record updated ', 'success');
                            /*setTimeout(() => {
                                eval("$A.get('e.force:refreshView').fire();");
                            }, 1);*/
                            this.showDedupeResult=true;
                            this.isSpinner = false;
                        }

                    }).catch((err) => {
                        console.log('ERRROR in DedupeExceptionUser ' + err);
                        this.showNotification('Error', 'Error in  Loan Applicant/ Dedupe record ', 'error');
                        this.showDedupeResult=true;
                        /*setTimeout(() => {
                                eval("$A.get('e.force:refreshView').fire();");
                            }, 1);*/
                         this.isSpinner = false;
                    });

                // code to update Loan Applicant record


            } else if (this.getPickVal === 'No') {
                //this.dedupeListSizeFlag = false;
                this.showDedupeResult=true;
                this.isSpinner = false;
            } else {
                this.showNotification('WARNING', 'Select Yes/No value from Table ', 'warning');
                this.showDedupeResult=true;
                 this.isSpinner = false;
            }
        } else if (this.getPickVal === 'Yes'/*this.dedupeDetailList.listSObject[0].option == 'Yes'*/) {
            /*const fields = {};
            fields[ID_FIELD.fieldApiName] = this.loanappIdExpnUser;
            fields[cifId.fieldApiName] = this.cifIdExpnUser;
            const recordInput = { fields };*/

            // code to update Loan Applicant record
            updateLoanApp({ loanAppId: this.loanappIdExpnUser, cifId: this.cifIdExpnUser })
                .then((result) => {
                    if (result) {
                        console.log('Resulttttt   = ', result);
                        //this.showNotification('Success', ' Loan Applicant/ Dedupe  record updated ', 'success');
                        // this.isSpinner=false;
                    }

                }).catch((err) => {
                    console.log('ERRROR in DedupeExceptionUser ' + err);
                    this.showNotification('Error', 'Error in  Loan Applicant/ Dedupe record ', 'error');
                    this.showDedupeResult=true;
                    this.isSpinner = false;
                });

            this.isActiveType = 'Yes';
            DedupeExceptionUser({ dedupeId: this.dedupeNonExpnApptId, loanApplicantId: this.loanappIdExpnUser, activeType: this.isActiveType })
                .then((result) => {
                    console.log('Resulttttt   = ', result);
                    this.showNotification('Success', ' Loan Applicant/ Dedupe  record updated ', 'success');
                    this.showDedupeResult=true;
                    // window.location.reload();
                    this.isSpinner = false;

                }).catch((err) => {
                    console.log('ERRROR in DedupeExceptionUser ' + err);
                    this.showNotification('Error', 'Error in  Loan Applicant/ Dedupe record ', 'error');
                    this.showDedupeResult=true;
                    //  window.location.reload();
                    this.isSpinner = false;
                });

            // component will refresh after 7 second
            this.updateRecordView();
        }
        else if (this.getPickVal === 'No'/*this.dedupeDetailList.listSObject[0].option == 'No'*/) {
            this.isActiveType = 'No';
            console.log('inside elseif no');
            console.log('dedupe id is >>>', this.dedupeNonExpnApptId);
            console.log('dedupe id is >>>', this.loanappIdExpnUser);
            console.log('dedupe id is >>>', this.isActiveType);




            //console.log('DEDUPE ID   ', this.dedupeDetailList.listSObject[0].Id);
            DedupeExceptionUser({ dedupeId: this.dedupeNonExpnApptId, loanApplicantId: this.loanappIdExpnUser, activeType: this.isActiveType })
                .then((result) => {
                    console.log('Resulttttt   = ', result);
                    this.showNotification('Success', ' Loan Applicant/ Dedupe record updated ', 'success');
                    this.showDedupeResult=true;
                    //window.location.reload();
                    this.isSpinner = false;

                }).catch((err) => {
                    console.log('ERRROR in DedupeExceptionUser ' + err.message);
                    this.showNotification('Error', 'Error in  Loan Applicant/ Dedupe record ', 'error');
                    this.showDedupeResult=true;
                    this.isSpinner = false;
                });
            // component will refresh after 7 second
            this.updateRecordView();
        } else /*if (/*this.dedupeDetailList.listSObject[0].option == undefined)*/ {
            this.showNotification('WARNING', 'Select Yes/No value from Table ', 'warning');
            this.showDedupeResult=true;
            this.isSpinner = false;
        }
    }

    // code to reload component when save button functionality is done.
    updateRecordView() {
       /* setTimeout(() => {
            eval("$A.get('e.force:refreshView').fire();");
        }, 7000);*/
    }

    // this method will check dedupe record validation before proceeding to next stage
    @api submitDedupeData() {
        console.log('submit dedupe id is >>',this.recordId);

        checkSubmitDedupeValidation({ applicationId: this.recordId })
            .then((result) => {
                console.log('Resulttttt  VALIDATION     = ', result);
                if (result) {
                    const dedupeDetailsEvent = new CustomEvent("fetchdedupedetails", { detail: result });
                    this.dispatchEvent(dedupeDetailsEvent);
                }
            }).catch((err) => {
                console.log('ERRROR in checkSubmitDedupeValidation ' + err);
                this.showNotification('Error', 'Error in  Loan Applicant record ', 'error');
            });
    }

    handleDedupeChild(event) {

        console.log('name is >>' + event.target.name);

        if (event.target.name == 'DedupeloanDetails') {
            try {

                console.log('object >>', event.target.dataset);
                console.log('object >>', event.target.dataset.id);
                let index = event.target.dataset.id;
                console.log('object >>', JSON.parse(JSON.stringify(this.onchangeExceptionDedupe[index])));
                let selectedObj = JSON.parse(JSON.stringify(this.onchangeExceptionDedupe[index]));
                console.log('this.exceptionUserDedupeMap= ', JSON.parse(JSON.stringify(this.exceptionUserDedupe)));
                let myDedupeRecords1 = [];
                this.exceptionUserDedupe.forEach(currentItem => {
                    if (selectedObj.CustomerNumber == currentItem.CIF_Id__c) {
                        this.myDedupeRecords = JSON.parse(JSON.stringify(currentItem.Dedupe_Loan_Details__r));
                    }
                });
                console.log('myDedupeRecords >>', JSON.stringify(this.myDedupeRecords));
                this.nondedupechildloanval = JSON.parse(JSON.stringify(this.myDedupeRecords));

                console.log('none dedupe is is >>', this.nondedupechildloanval);
                myDedupeRecords1 = JSON.stringify(this.myDedupeRecords);
                console.log('dfdf', myDedupeRecords1);


                if (this.nondedupechildloanval.length > 0) {
                    this.showLoanDetailModal = true;
                }
                else {
                    this.this.myDedupeRecords = undefined;
                    this.showLoanDetailModal = false;
                }
            } catch (e) {
                console.log('error is exception >>', e.message);
            }
        }

    }







    handleLoandDetailBtnClick(event) {

        this.arrSlcdLoanApptFieldComparison = undefined;
        if (event.target.name == 'loanDetails') {
            if (this.mapLoanApptDedupe.get(this.slcdLoanApptName)[event.target.dataset.targetId].hasOwnProperty('Dedupe_Loan_Details__r')) {
                this.arrSlcdLoanApptDedupeLoans = [];
                this.mapLoanApptDedupe.get(this.slcdLoanApptName)[event.target.dataset.targetId].Dedupe_Loan_Details__r.records.forEach(element => {
                    try {
                        this.arrSlcdLoanApptDedupeLoans.push({
                            Id: element.Id, ApplicationNumber: element.Application_Number__c,
                            ApplicationStatus: element.Application_Status__c, LanStatus: element.Lan_Status__c, Lan: element.Lan__c
                        });
                    }
                    catch (err) {
                        console.log('ERROOOOOOOO  ', err);
                    }
                });
                if (this.arrSlcdLoanApptDedupeLoans.length > 0) {
                    this.showLoanDetailModal = true;
                }
            } else {
                this.arrSlcdLoanApptDedupeLoans = undefined;
                this.showLoanDetailModal = false;
            }
            //now we will get loan details of dedupe
        }
        else if (event.target.name == 'CustomerNumber') {
            try {
                this.showModal = true;
                this.exceptionUserapplicantMap.clear();
                this.showFieldComparisonTable = true;
                this.arrSlcdLoanApptFieldComparison = [];
                this.cifDedupeData = [];
                this.cifId = event.target.label;
                getLoanDedupeData({ applicationId: this.recordId, CustomerNumber: this.cifId }).then((result) => {
                    this.tempvar = JSON.parse(result).listSObject;
                    this.LoanDedupeWrapper = (this.tempvar);

                    ///////

                    this.LoanDedupeWrapper.forEach(element => {
                        if (!this.exceptionUserapplicantMap.has(element.CIF_Id__c)) {
                            this.exceptionUserapplicantMap.set(element.CIF_Id__c, []);
                        }
                        this.exceptionUserapplicantMap.get(element.CIF_Id__c).push(element);
                    });



                    this.exceptionUserapplicantMap.get(this.cifId).forEach(element => {
                        this.cifDedupeData.push({dedupeId:element.Id,
                            appName: element.Loan_Applicant__r.Applicant_Name__c, Name: element.First_Name__c,
                            lastName: element.Last_Name__c, dob: element.Date_Of_Birth__c, adhar: element.Aadhaar_Number__c,
                            pan: element.Pan_Number__c, dl: element.Pan_Number__c, voterId: element.Voter_Id__c,
                            passport: element.Passport__c, resaddr: element.Address_Line_1__c, mobile: element.Mobile_Number__c,
                            resAddrss: element.Loan_Applicant__r.Residence_Address_Line_1__c, pincode: element.Pincode__c,
                            loanapptName:element.Loan_Applicant__r.Application__r.Name,
                            apptMobile:element.Loan_Applicant__r.Mobile__c,source:element.Source__c,kycId1:element.Loan_Applicant__r.KYC_ID_Type_1__c,
                            kycId2:element.Loan_Applicant__r.KYC_ID_Type_2__c,kyctype1:element.Loan_Applicant__r.KYC_Id_1__c,kyctype2:element.Loan_Applicant__r.KYC_Id_2__c
                        });
                    });

                    console.log('cifDedupeData>>',this.cifDedupeData);
                    
                    

                    if(this.cifDedupeData[0].kycId1 ==='Voter Id'){
                            this.apptvoterId=this.cifDedupeData[0].kyctype1;
                    }else if(this.cifDedupeData[0].kycId1 ==='Passport'){
                            this.apptpasport=this.cifDedupeData[0].kyctype1;
                    }else if(this.cifDedupeData[0].kycId1 ==='Driving License'){
                            this.apptdriving=this.cifDedupeData[0].kyctype1;
                    }else if(this.cifDedupeData[0].kycId1 ==='Pan Card'){
                            this.apptpan=this.cifDedupeData[0].kyctype1;
                    }else if(this.cifDedupeData[0].kycId1 ==='Aadhaar Card'){
                            this.apptadhar=this.cifDedupeData[0].kyctype1;
                    }

                    if(this.cifDedupeData[0].kycId2 ==='Voter Id'){
                            this.apptvoterId=this.cifDedupeData[0].kyctype2;
                    }else if(this.cifDedupeData[0].kycId2 ==='Passport'){
                            this.apptpasport=this.cifDedupeData[0].kyctype2;
                    }else if(this.cifDedupeData[0].kycId2 ==='Driving License'){
                            this.apptdriving=this.cifDedupeData[0].kyctype2;
                    }else if(this.cifDedupeData[0].kycId2 ==='Pan Card'){
                            this.apptpan=this.cifDedupeData[0].kyctype2;
                    }else if(this.cifDedupeData[0].kycId2 ==='Aadhaar Card'){
                            this.apptadhar=this.cifDedupeData[0].kyctype2;
                    }
                    
                    var dedupesId=this.cifDedupeData[0].dedupeId;
                    console.log('dedupe id sjd>>',dedupesId);
                     getLan({ dpId: dedupesId })
                        .then((result) => {
                            console.log('result sdjd>>',result);
                            this.lanId=result;
                        }).catch((err) => {
                            console.log('ERRROR in checkSubmitDedupeValidation ' + err.message);
                        });

                    //////
                    Console.log('lan id iss >>',this.lanId);

                    if(this.cifDedupeData[0].Loan_Applicant__r.Application__r.Sourcing_Branch__r.Name !="" && this.cifDedupeData[0].Loan_Applicant__r.Application__r.Sourcing_Branch__r.Name !='undefined'){
                        this.branchName=this.cifDedupeData[0].Loan_Applicant__r.Application__r.Sourcing_Branch__r.Name;
                    }


                }).catch((err) => {
                   
                    console.log('Error in getLastLoginDate= ', err);
                    console.log('cifDedupeData',this.cifDedupeData);
                });
            } catch (e) {
                console.log('exception is >>' + e.message);
            }
        }
    }

    dedupeUserSubmit(event){
         this.isSpinner = true;
         console.log('this.listLoanApptName is >>',this.listLoanApptName);
        getApplicantsStatus({ apptList: this.listLoanApptName }).then((result) => {
            if(result){
                this.showNotification('WARNING', 'Please resolve dedupe first before submitting. ', 'warning');
                this.disableSubmit=true;
                this.isSpinner = false;
            }else{
                this.showNotification('Success', ' Dedupe Resolved Successfully ', 'success');
                 this.disableSubmit=true;
                 this.isSpinner = false;
            }
        }).catch((err) => {
            console.log('Error in getLastLoginDate= ', err);
             this.isSpinner = false;
        });


    }






    closeModal(event) {
        this.showLoanDetailModal = false;
        this.showModal = false;
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
    //-------------------------------------------------------------------------
    showNotification(title, msg, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title: title,
            message: msg,
            variant: variant
        }));
    }
}