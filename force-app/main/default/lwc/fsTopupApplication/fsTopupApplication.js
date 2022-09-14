import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { CloseActionScreenEvent } from 'lightning/actions';
import searchApplication from '@salesforce/apex/FetchDataTableRecordsController.searchApplication';
import insertReloginOrTopup from '@salesforce/apex/ReloginTopupController.insertReloginOrTopup';

export default class FsTopupApplication extends LightningElement {

    @track appNumber;
    @track topupApp;
    @track topupKYC;
    @track kycNumber;
    @track loanAppNumber;
    @track isAppDataArrived = false;
    @track hasTopup = false;
    @track appResult;
    @track moveNext = true;
    @track isSpinnerActive = false;
    @track oldAppId;
    @track newAppId;

    handleTopupApp(event) {
        console.log('handlcReloginApp');
        console.log('appNo ', event.detail.value);
        this.appNumber = event.detail.value;
        this.topupApp = event.detail.value;
        this.topupKYC = '';
        this.kycNumber = '';
    }

    handleTopupKYC(event) {
        console.log('handleReloginKYC');
        console.log('KYC no ', event.detail.value);
        this.kycNumber = event.detail.value;
        this.topupKYC = event.detail.value;
        this.topupApp = '';
        this.appNumber = '';
    }

    handleLoanApp(event){

    }

    searchAllApplication() {
        this.isSpinnerActive = true;
        this.isAppDataArrived = false;
        this.appResult = undefined;
        console.log('Search Called ', this.appNumber + ' :: ', this.kycNumber);
        if ((this.appNumber != undefined && this.appNumber != null && this.appNumber != '') || (this.kycNumber != undefined && this.kycNumber != null && this.kycNumber != '')) {
            searchApplication({ appNumber: this.appNumber, kycNumber: this.kycNumber })
                .then(result => {
                    var temp = JSON.parse(result.strDataTableData);
                    console.log('temp', temp);
                    console.log('relogin length ', temp.length);
                    this.hasTopup = (temp.length == 0) ? false : true;
                    console.log('hasRelogin ', this.hasTopup);
                    this.appResult = JSON.parse(JSON.stringify(result));
                    this.isAppDataArrived = true;
                    console.log('json data ====> ' , JSON.parse(JSON.stringify(result)));
                    this.isSpinnerActive = false;
                    if(!this.hasTopup){
                        this.showToast('Error', 'Error', 'No Application Found!!');
                        this.closeAction();
                    }
                })
                .catch(error => {
                    console.log('Error In Get APP Data ', error);
                    this.showToast('Error', 'Error', 'No Application Found!!');
                    this.closeAction();
                    this.isSpinnerActive = false;
                })
        }
        else {
            this.showToast('Error', 'Error', 'Enter Application Number Or KYC Number!!');
            this.closeAction();
            this.isSpinnerActive = false;
        }
    }

    handleRadioButton(event){
        console.log('onselect ',event.detail);
        this.oldAppId = event.detail[0].Application__c;
        console.log('oldAppId ',this.oldAppId);
        if (event.detail[0]['Application__r.application_status__c'] === 'Active') {
            this.showToast('Error', 'Error', 'Application already active, proceed with existing application.');
            this.closeAction();
            return;
        }
        this.moveNext = false;
    }

    handleNext(){
        this.isSpinnerActive = true;
        console.log('Next Clicked ');
        insertReloginOrTopup({oldAppId : this.oldAppId, recTypeName : '3. Top-up loan'})
        .then(result =>{
            console.log('res ',result);
            if(result){
                this.newAppId = result.appId;
                var sendObj = { isNewLogin : '', newAppId : '', preloginId : '', oldAppName : '', newAppName : '' };
                sendObj.isNewLogin = true;
                sendObj.newAppId = result.appId;
                sendObj.preloginId = result.preloginId;
                sendObj.oldAppName = result.oldAppName;
                sendObj.newAppName = result.newAppName;
                const showNewLogin = new CustomEvent("shownewlogin", {
                    detail: sendObj
                });
                console.log('showNewLogin event  ', showNewLogin);
                this.dispatchEvent(showNewLogin);
                this.isSpinnerActive = false;
            }
        })
        .catch(error =>{
            console.log('error ',error);
        })

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