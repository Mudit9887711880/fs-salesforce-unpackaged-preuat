import { LightningElement,api,track,wire } from 'lwc';
import SendOTP from '@salesforce/apex/MobileVerificationController.SendOTP';
import ValidateOTP from '@salesforce/apex/MobileVerificationController.ValidateOTP';
import loanAppMobileVerification from '@salesforce/apex/MobileVerificationController.loanAppMobileVerification';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { CloseActionScreenEvent } from 'lightning/actions';

export default class FsMobileVerificationLWC extends LightningElement {

    @track isModalOpen = false;
    @track requestId;
    @track otp;
    @track validate='Validate';
    @track loanAppId;

    connectedCallback(){
       // console.log('recordId ',this.recordId);
    }

    @api sendMobOTP(loanAppId,mobileNo) {
        this.loanAppId = loanAppId;
        console.log('SEND OTP CALLED Acc Id :: ', loanAppId + ' , Mobile :: ', mobileNo);
        SendOTP({ loanAppId: loanAppId, MobileNo: mobileNo })
            .then(result => {
                console.log('Result ', result);
                const wrapper = result;
                const description = wrapper.description;
                this.requestId = wrapper.requestId;
                const msg = wrapper.msg;
                console.log(wrapper + ' ' + description + ' ' + this.requestId);
                if (msg === '101') {
                    this.showToast('', 'Success', 'OTP Has Been Sent On Your Mobile Number!!');
                    this.closeAction();
                    this.isModalOpen = true;
                }
                else if (msg != '101') {
                    this.showToast('Error', 'Error', description);
                    this.closeAction();
                    this.isModalOpen = false;
                }

            })
            .catch(error => {
                console.log('error ', error);
                this.showToast('Error', 'Error', 'Mobile Verification Failed!!');
                this.closeAction();
                this.isModalOpen = false;
            })
    }

    handleOTP(event) {
        console.log('OTP ', event.detail.value);
        this.otp = event.detail.value;  
    }

    validateOTP(event) {
        console.log('this.otp ',this.otp);
        console.log('Validate!!');
        if (this.otp) {
            console.log('OTP ', this.otp);
            this.validate = 'Verifying';
            //this.showSpinner = true;
            console.log('loanAppId ', this.loanAppId);
            this.validateMobOtp(this.loanAppId, this.requestId, this.otp);
        }
        else{
            this.showToast('Error', 'Error', 'Please Enter OTP!!');
            this.closeAction();
        }
    }

    validateMobOtp(loanAppId, requestId, otp) {
        console.log('loanAppId :: ', loanAppId + ' Request id :: ', requestId + ' otp :: ', otp);
        ValidateOTP({ loanAppId: loanAppId, requestId: requestId, OTP: otp })
            .then(result => {
                console.log('OTP RESULT ', result);
                //this.showSpinner = false;
                const wrapper = result;
                const description = wrapper.description;
                const msg = wrapper.msg;
                console.log(wrapper + ' ' + description + ' ' + requestId);
                if (msg === '101') {
                    this.showToast('Success', 'Success', 'Mobile Number Verified Successfully');
                    this.closeAction();
                    console.log('loanAppId Id ', loanAppId);
                    loanAppMobileVerification({ loanAppId: loanAppId })
                        .then(result => {
                            console.log('Account Updated Result ', result);
                            const reloadTable = new CustomEvent("reloaddatatable", {
                                detail: result
                            });
                            console.log('dispatch event ', reloadTable);
                            this.dispatchEvent(reloadTable);
                        })
                        .catch(error =>{
                            this.showToast('Error', 'Error', 'Error :: ' + error);
                            this.closeAction();
                        })
                        this.isModalOpen = false;
                }
                else if (msg != '101') {
                    this.showToast('Error', 'Error', 'Error :: ' + description);
                    this.closeAction();
                }
                this.validate = 'Validate';
            })
            .catch(error => {
                console.log('Error ', error);
                this.showToast('Error', 'Validation Failed!!');
                this.closeAction();
                //this.showSpinner = false;
                this.isModalOpen = false;
            })
    }

    resendMobOTP(event) {
        console.log(this.loanAppId, this.mobileno)
        this.sendMobOTP(this.loanAppId, this.mobileno);
    }

    closeModal(){
        this.isModalOpen = false;
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