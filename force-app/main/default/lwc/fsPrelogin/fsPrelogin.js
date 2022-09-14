import { api, LightningElement, track, wire} from 'lwc';
import clonePropertyNew from '@salesforce/apex/FsPreloginController.clonePropertyNew';
import createVerificationRecords from '@salesforce/apex/VerificationRecordCreator.createVerificationRecords';
import getRecordTypeName from '@salesforce/apex/FsPreloginController.getRecordTypeName';
import doHighmarkCallout from '@salesforce/apex/BureauHighmartAPICalloutController.doHighmarkCallout';
import getRecordTypeId from '@salesforce/apex/DatabaseUtililty.getRecordTypeId';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { CloseActionScreenEvent } from 'lightning/actions';
import { CurrentPageReference } from 'lightning/navigation';
import SystemModstamp from '@salesforce/schema/Account.SystemModstamp';

export default class FsPreLogin extends NavigationMixin(LightningElement) {

    @api applicationId;
    @api preloginId;
    @api recordId;
    @api recordTypeId;
    @api preAppId;
    @api preAppName;
    @api loanAppIdList = [];
    @api hasPrimaryApplicant = false;
    @api hasPrimaryOwner = false;
    @api isMobileVerified = false;
    @api isKYCVerified = false;
    @api isIncomeConsidered = false;

    @track showErrorTab = false;
    @track errorMsgs = [];
    @track activeError = 'step-1';
    @track mobDefList;
    @track kycDefList;
    @track hasAllFields = false;
    @track recTypeName;
    @track isRelogin = false;
    @track isTopup = false;
    @track isTranche = false;
    @track isNewlogin = true;
    @track ownerOptions = [];
    @track primaryAppName;
    @track isReceiptPending = false;
    @track receiptWrapper = {hasReceipt : false, allApproved : false, pendingReceiptList : [], lengthOfDirectRec : 0, existingFeeCodeOption: []};
    @track isLoading = false;
    @track buttonClick = false;
    @track propRecTypeId;
    loadAll = false;

    @wire(CurrentPageReference)
    getStateParameters(currentPageReference) {
        if (currentPageReference) {
            console.log('pageReferenece @@ ',currentPageReference.state.recordTypeId);
            getRecordTypeName({recTypeId : currentPageReference.state.recordTypeId})
            .then(result =>{
                if(result){
                    this.recTypeName = result;
                    console.log('recName ',this.recTypeName);
                    if(result === '2. Re-login'){
                        this.isRelogin = true;
                        this.isNewlogin = false;
                    }
                    else if(result === '3. Top-up loan'){
                        this.isTopup = true;
                        this.isNewlogin = false;
                    }
                    else if(result === '1. New login')
                        this.isNewlogin = true;
                    else
                        this.isTranche = true;
                }
            })
            .catch(error =>{
                console.log('error getting recTypeName ',error);
            })
        }
    }

    connectedCallback() {
        getRecordTypeId({sObjectName : 'Property__c',recordTypeName : 'Pre Login Property Detail'})
        .then(result =>{
            if(result)
            this.propRecTypeId = result;
        })
        .catch(error=>{
            console.log(error);
        })
        console.log('Values ', this.applicationId, this.recordId, this.recordTypeId, this.preAppId, this.preAppName);
        this.applicationId = this.preAppId;
        if(this.recordId)
            this.preloginId = this.recordId;
    }

    renderedCallback(){
        if (this.loadAll == false) {
            console.log('i am in check validity');
            let currentTab = this.activeError;
            console.log('currentTab= ', currentTab);
            let tabs = this.template.querySelectorAll('lightning-tab');
            console.log('tabs ', tabs);
            tabs.forEach(element => {
                element.loadContent();
            });
            console.log('currentTab= ', currentTab);
            this.activeError = currentTab;
            if(tabs && tabs.length == 5){
                this.loadAll = true;
            }
        }
    }

    showNewLogin(event){
        console.log('shownewlogin ',event.detail);
        this.isNewlogin = event.detail.isNewLogin;
        this.applicationId = event.detail.newAppId;
        this.preloginId = event.detail.preloginId;
        this.preAppName = event.detail.newAppName;
        setTimeout(() => {
         this.template.querySelector('c-fs-customer-details').getAccountData(this.applicationId);
        }, 300);
        this.showToast('Success', 'Success', 'Application Initiated Successfully!!');
        this.closeAction();
        let ref = this;
        setTimeout(() => {
            ref.activeError = 'step-1';
        }, 300);
    }

    handleActive(event){
        const tab = event.target.value;
        console.log('tab ',tab);
        if(tab === 'step-2'){
            setTimeout(() => {
                if (this.template.querySelector('c-fs-property-details')){
                    console.log('loanaPPlist ',this.loanAppIdList);
                    this.template.querySelector('c-fs-property-details').getApplicationId(this.applicationId);
                    this.template.querySelector('c-fs-property-details').getLoanAppList(this.loanAppIdList);
                    this.template.querySelector('c-fs-property-details').getPropertyOwnersName(this.applicationId);
                    this.template.querySelector('c-fs-property-details').getPropertyOwnersList(this.ownerOptions);
                }
            }, 300);
        }
        if(tab === 'step-3'){
            console.log('step 3');
            setTimeout(() => {
                if (this.template.querySelector('c-fs-pre-login-application-detail')){
                    console.log('appid step 3 ',this.applicationId);
                    //this.template.querySelector('c-fs-pre-login-application-detail').getBranchNameOfSalesUser();
                    //if(this.applicationId){
                    this.template.querySelector('c-fs-pre-login-application-detail').getApplicationId(this.applicationId);
                    //this.template.querySelector('c-fs-pre-login-application-detail').getUpdatedApplicationRecords();
                    //}
                    // console.log('hasAllFields ',this.hasAllFields);
                    // if(this.hasAllFields && this.applicationId){
                    //     console.log('yes ',this.applicationId);
                    //     this.template.querySelector('c-fs-pre-login-application-detail').getSectionPageContent(this.applicationId);
                    // }
                    // else
                    //     this.template.querySelector('c-fs-pre-login-application-detail').getSectionPageContent('');
                }
            }, 300);
        }
    }

    handleApplicationId(event) {
        console.log('appid event called ', event.detail);
        this.applicationId = event.detail;
        setTimeout(() => {
            if (this.template.querySelector('c-fs-pre-login-application-detail'))
                this.template.querySelector('c-fs-pre-login-application-detail').getApplicationId(this.applicationId);
        }, 300);
    }

    handleAppName(event){
        console.log('getAppName 6 ',event.detail);
        this.preAppName = event.detail;
    }

    handlePreloginId(event) {
        this.preloginId = event.detail;
    }

    getPropertyOwners(event) {
        console.log('owner event called ', event.detail);
        this.loanAppIdList = event.detail;
        console.log('laList ', this.loanAppIdList);
    }

    getPrimaryApplicantName(event){
        console.log('getPrimaryApplicantName ',event.detail);
        this.primaryAppName = event.detail;
    }
    fillOwner(event){
        console.log('fillownerlist ',event.detail);
        this.ownerOptions = event.detail;
    }

    checkAllRequired(event){
        this.hasAllFields = event.detail;
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

    checkProperty(event){
        this.hasPrimaryOwner = event.detail;
        console.log('check property running',this.hasPrimaryOwner);
    }

    getReceiptPendingList(event){
        console.log('Receipt data approved ', event.detail);
        this.receiptWrapper.hasReceipt = event.detail.hasReceipt;
        this.receiptWrapper.allApproved = event.detail.allApproved;
        this.receiptWrapper.pendingReceiptList = event.detail.pendingReceiptList;
        this.receiptWrapper.lengthOfDirectRec = event.detail.lengthOfDirectRec;
        this.receiptWrapper.existingFeeCodeOption = event.detail.existingFeeCodeOption;
    }

    redirectApplication() {
        console.log('app Id ', this.applicationId);
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this.applicationId,
                actionName: 'view'
            }
        });
    }

     async handlePreloginSubmit() {
        if(this.buttonClick){
            return;
        }
        this.buttonClick = true;
        let reference = this;
        reference.errorMsgs = [];
        console.log('this.hasPrimaryApplicant', reference.hasPrimaryApplicant, reference.hasPrimaryOwner, reference.isMobileVerified, reference.isKYCVerified, reference.isIncomeConsidered, reference.applicationId && reference.hasAllFields);
        console.log('this.receiptWrapper.lengthOfDirectRec',this.receiptWrapper.lengthOfDirectRec);
        if (reference.hasPrimaryApplicant && reference.hasPrimaryOwner && reference.isMobileVerified && reference.isKYCVerified && reference.isIncomeConsidered && reference.applicationId && (this.receiptWrapper.pendingReceiptList.length == 0 && (this.receiptWrapper.hasReceipt == true || this.receiptWrapper.lengthOfDirectRec == 0)) && this.receiptWrapper.existingFeeCodeOption.length == 0) {
            reference.showErrorTab = false;
            this.isLoading = true;
            await doHighmarkCallout({listOfLoanApp : this.loanAppIdList}).then(result =>{
                console.log('Bureau Verfied Successfully!!');
            })
            .catch(error=>{
                this.isLoading = false;
                console.log('Bureau Verification failed ',error);
            })
            await clonePropertyNew({ appId: reference.applicationId })
                .then(result => {
                    console.log('result ', result);
                })
                .catch(error => {
                    this.isLoading = false;
                    console.log('result ', error);
                })
            await createVerificationRecords({ applicationId: reference.applicationId })
                .then(result => {
                    this.isLoading = false;
                    console.log(result + 'from verification');
                })
                .catch(error => {
                    this.isLoading = false;
                    console.log(error + 'from verification');
                })
            reference.showToast('Success', 'Success', 'Loan Submitted Successfully from Pre-Login to Verification Stage!!');
            reference.closeAction();
            reference.redirectApplication();
        } 
        else {
            this.buttonClick = false;
            console.log('error tab occur');
            if (!reference.applicationId) {
                reference.errorMsgs.push('Application ID does not exist, Add Customer in "Customer Detail" tab');
            }
            else{
                if (!reference.hasPrimaryApplicant) {
                    reference.errorMsgs.push('Add An Primary Applicant In Customer Details Tab');
                }
                if (!reference.hasPrimaryOwner) {
                    reference.errorMsgs.push('Add Atleast One Property Of Primary Applicant');
                }
                if (!reference.isMobileVerified) {
                    reference.errorMsgs.push('Verify Mobile Of ' + reference.mobDefList + ' In Customer Details Tab');
                }
                if (!reference.isKYCVerified) {
                    reference.errorMsgs.push('Verify KYC Of ' + reference.kycDefList + ' In Customer Details Tab');
                }
                if (!reference.isIncomeConsidered) {
                    reference.errorMsgs.push('Add Atleast One Income Considered Applicant In Customer Details Tab');
                } 
                if(!reference.hasAllFields){
                    reference.errorMsgs.push('Fill All Required Fields In Application Details Tab');
                }
                if(reference.receiptWrapper.lengthOfDirectRec > 0 && reference.receiptWrapper.hasReceipt == false){
                    reference.errorMsgs.push('Please Add Receipt in Fee Details Tab');
                }  
                else{
                    console.log('Receipt Defaulter List ',reference.receiptWrapper.pendingReceiptList.length);
                    if(reference.receiptWrapper.pendingReceiptList.length > 0){
                        reference.receiptWrapper.pendingReceiptList.forEach(element => {
                            if(element.RecStatus != 'Rejected'){
                          //  reference.errorMsgs.push('Approve Receipts ' + reference.receiptWrapper.pendingReceiptList.join() + ' In Fee Details Tab');
                          reference.errorMsgs.push('Get Approve ' + element.RecStatus + ' Receipts ' +  element.name + ' In Fee Details Tab');
                            }
                    });
                        
                    }
                }
                if(reference.receiptWrapper.existingFeeCodeOption.length > 0){
                    
                    reference.receiptWrapper.existingFeeCodeOption.forEach(element => {
                        reference.errorMsgs.push('Please Add Receipt in Fee Details Tab for Fee Code: '+ element.value);
                        console.log('reference.receiptWrapper.existingFeeCodeOption',element.value);
                    }); 
                }
            }
            reference.showErrorTab = true;
            let ref = this;
            setTimeout(() => {
                ref.activeError = 'Error';
            }, 300);
        }
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