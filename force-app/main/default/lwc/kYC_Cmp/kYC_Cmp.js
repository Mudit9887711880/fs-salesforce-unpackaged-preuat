import { api, LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { CloseActionScreenEvent } from 'lightning/actions';
import callOwnersAPIs from '@salesforce/apex/OwnerValidationsController.callOwnersAPIs';

export default class KYC_Cmp extends LightningElement {

    @api recordId;
    @api selectrecordId;

    @track activeTab = 'Vehicle_RC';
    @track isSpinnerActive = false;

    //Fields
    @track EngineNo;
    @track chassisNo;
    @track State;
    @track StateName;
    @track City;
    @track PropertyNo;
    @track District;
    @track CosumerId;
    @track ServiceProvider;
    @track ulb;
    @track RegistrationNo;

    //CheckRequiredFields
    @track valid = false;
    @track checkProperty = false;
    @track required = false;
    @track checked = false;
    @track callOwnerAPI = false;

    //Extra
    @track KycRcBool = false;
    @track KycPropertyBool = false;
    @track KycElectricityBillBool = false;
    @track KycVehiclercBool = false;
    @track isSubmit = false;


    closeModal(event) {
        const selectedEvent = new CustomEvent('closemodal', { detail: false });
        this.dispatchEvent(selectedEvent);
    }

    handleTabActivation(event) {
        console.log('handleTabActivation= ', event.target.value);
        this.activeTab = event.target.value;
        // this.KycRcBool = false;
        // this.KycPropertyBool = false;
        // this.KycElectricityBillBool = false;
        // this.KycVehiclercBool = false;

        // if (event.target.value == 'KYC_Vehicle_RC') {
        //     this.KycRcBool = true;
        // } else if (event.target.value == 'KYC_Property_Tax') {
        //     this.KycPropertyBool = true;
        // } else if (event.target.value == 'KYC_Electricity_Bill') {
        //     this.KycElectricityBillBool = true;
        // } else if (event.target.value == 'KYC_Vehicle_RC_Adv') {
        //     this.KycVehiclercBool = true;
        // }
    }


    // handleClick1(event) {
    //     this.KycRcBool = true;
    //     this.KycPropertyBool = false;
    //     this.KycElectricityBillBool = false;
    //     this.KycVehiclercBool = false;
    //     this.isSubmit = true;
    // }
    // handleClick2(event) {
    //     this.KycRcBool = false;
    //     this.KycPropertyBool = true;
    //     this.KycElectricityBillBool = false;
    //     this.KycVehiclercBool = false;
    //     this.isSubmit = true;
    // }
    // handleClick3(event) {
    //     this.KycRcBool = false;
    //     this.KycPropertyBool = false;
    //     this.KycElectricityBillBool = true;
    //     this.KycVehiclercBool = false;
    //     this.isSubmit = true;
    // }
    // handleClick4(event) {
    //     this.KycRcBool = false;
    //     this.KycPropertyBool = false;
    //     this.KycElectricityBillBool = false;
    //     this.KycVehiclercBool = true;
    //     this.isSubmit = true;
    // }


    handleEngineNo(event) {
        this.EngineNo = event.target.value;
    }
    handlechassisNo(event) {
        this.chassisNo = event.target.value;
    }
    handleState(event) {
        this.State = event.target.value;
    }
    handleState2(event) {
        this.StateName = event.target.value;
    }
    handleCity(event) {
        this.City = event.target.value;
    }
    handlePropertyNo(event) {
        this.PropertyNo = event.target.value;
    }
    handleDistrict(event) {
        this.District = event.target.value;
    }
    handleCosumerId(event) {
        this.CosumerId = event.target.value;
    }
    handleServiceProvider(event) {
        this.ServiceProvider = event.target.value;
    }
    handleRegistrationNo(event) {
        this.RegistrationNo = event.target.value;
    }

    checkAllRequiredFields(){
        this.callOwnerAPI = false;
        if(this.activeTab === 'Vehicle_RC')
            this.callOwnerAPI = this.allVehicleValid();
        else if(this.activeTab === 'Property_Tax')
            this.callOwnerAPI = this.allPropertyCheck();
        else if(this.activeTab === 'Electricity_Bill')
            this.callOwnerAPI = this.allBillRequired();
        else if(this.activeTab === 'Vehicle_RC_Advance')
            this.callOwnerAPI = this.allAdanceValidate();
        return this.callOwnerAPI;
    }

    //Vehicle_RC
    allVehicleValid() {
        this.valid = false;
        if (this.EngineNo == null || this.EngineNo == '') {
            let input1 = this.template.querySelector(".RC1");
            input1.setCustomValidity("This field is required");
            input1.reportValidity();
            this.valid = true;
        } if (this.chassisNo == null || this.chassisNo == '') {
            let input2 = this.template.querySelector(".RC2");
            input2.setCustomValidity("This field is required");
            input2.reportValidity();
            this.valid = true;
        }
        if (this.State == null || this.State == '') {
            let input3 = this.template.querySelector(".RC3");
            input3.setCustomValidity("This field is required");
            input3.reportValidity();
            this.valid = true;
        }
        return this.valid;
    }

    //Property_Tax
    allPropertyCheck() {
        this.checkProperty = false;
        if (this.StateName == null || this.StateName == '') {
            let input4 = this.template.querySelector(".RC4");
            input4.setCustomValidity("This field is required");
            input4.reportValidity();
            this.checkProperty = true;
        }
        if (this.City == null || this.City == '') {
            let input5 = this.template.querySelector(".RC5");
            input5.setCustomValidity("This field is required");
            input5.reportValidity();
            this.checkProperty = true;
        }
        if (this.PropertyNo == null || this.PropertyNo == '') {
            let input6 = this.template.querySelector(".RC6");
            input6.setCustomValidity("This field is required");
            input6.reportValidity();
            this.checkProperty = true;
        }
        if (this.District == null || this.District == '') {
            let input = this.template.querySelector(".RC");
            input.setCustomValidity("This field is required");
            input.reportValidity();
            this.checkProperty = true;
        }
        return this.checkProperty;
    }

    //Electricity_Bill
    allBillRequired() {
        this.required = false;
        if (this.CosumerId == null || this.CosumerId == '') {
            let input7 = this.template.querySelector(".RC7");
            input7.setCustomValidity("This field is required");
            input7.reportValidity();
            this.required = true;
        }
        if (this.ServiceProvider == null || this.ServiceProvider == '') {
            let input8 = this.template.querySelector(".RC8");
            input8.setCustomValidity("This field is required");
            input8.reportValidity();
            this.required = true;
        }
        return this.required;
    }

    //Vehicle_RC_Advance
    allAdanceValidate() {
        this.checked = false;
        if (this.RegistrationNo == null || this.RegistrationNo == '') {
            let input9 = this.template.querySelector(".RC9");
            input9.setCustomValidity("This field is required");
            input9.reportValidity();
            this.checked = true;
        }
        return this.checked;
    }

    onSubmit(event) {
        this.isSpinnerActive = true;
        var callApi = this.checkAllRequiredFields();
        if (!callApi) {
            var params = {};
            params['consumerId'] = this.CosumerId;
            params['serviceProvider'] = this.ServiceProvider;
            params['engineNo'] = this.EngineNo;
            params['chassisNo'] = this.chassisNo;
            params['state'] = this.State;
            params['stateName'] = this.StateName;
            params['city'] = this.City;
            params['propertyNo'] = this.PropertyNo;
            params['registrationNumber'] = this.RegistrationNo;
            callOwnersAPIs({ recordId: this.recordId, mdtName: this.activeTab, params: params})
                .then(result => {
                    if(result){
                        this.showToast('Success','Success',this.activeTab+' '+result);
                        this.CosumerId = '';
                        this.ServiceProvider = '';
                        this.EngineNo = '';
                        this.chassisNo = '';
                        this.State = '';
                        this.StateName = '';
                        this.City = '';
                        this.PropertyNo = '';
                        this.RegistrationNo = '';
                        this.isSpinnerActive = false;
                    }
                    else
                        this.showToast('Error','Error',this.activeTab+' Validation Failed');
                        this.isSpinnerActive = false;
                })
                .catch(error => {
                    this.showToast('Error','Error',this.activeTab+' Validation Failed');
                    this.isSpinnerActive = false;
                })
        }
        else
            this.showToast('Error','Error','Fill All Required Fields');
            this.isSpinnerActive = false;
        // if (this.KycElectricityBillBool == true) {
        //     //  alert('recBoll')
        //     this.allRequired();
        //     // alert('2',this.required);
        //     if (this.required == false) {

        //         getKYCReportManualElectricityBill({ recordId: '$recordId', consumerID: this.CosumerId, serviceProvider: this.serviceProvider })
        //             .then(result => {
        //                 //    alert(result);
        //                 console.log('1', result);
        //                 if (result == 'KYC done successfully') {
        //                     this.showToast(result, 'success');
        //                     this.CosumerId = '';
        //                     this.serviceProvider = '';
        //                     // this.selectedInvoiceObj = result;
        //                     // alert(JSON.stringify(this.selectedInvoiceObj));
        //                 }
        //                 else {
        //                     this.showToast(result, 'error');
        //                 }

        //             })
        //             .catch(error => {
        //                 this.error = error;
        //             });
        //     }
        // }


        // if (this.KycPropertyBool == true) {
        //     //  alert('test');
        //     this.allCheck();
        //     //  alert('1'+this.checkProperty);
        //     if (this.checkProperty == false) {
        //         // alert('3');
        //         getKYCReportManualPropertyTax({ recordId: '$recordId', state: this.StateName, city: this.City, propertyNo: this.PropertyNo, district: this.District, ulb: this.ulb })
        //             .then(result => {
        //                 console.log('2' + result);
        //                 // alert(result);
        //                 if (result == 'KYC done successfully') {
        //                     this.showToast(result, 'success');
        //                     this.StateName = '';
        //                     this.City = '';
        //                     this.PropertyNo = '';
        //                     this.District = '';
        //                     this.ulb = '';
        //                     // this.selectedInvoiceObj = result;
        //                     // alert(JSON.stringify(this.selectedInvoiceObj));
        //                 }
        //                 else {
        //                     this.showToast(result, 'error');
        //                 }
        //             })
        //             .catch(error => {
        //                 this.error = error;
        //             });

        //     }
        // }

        // if (this.KycRcBool == true) {
        //     //  alert('Kyc')
        //     this.allValid();
        //     if (this.valid == false) {


        //         getKYCReportManualVehicleRC({ recordId: '$recordId', engineNo: this.EngineNo, chassisNo: this.chassisNo, state: this.State })
        //             .then(result => {
        //                 console.log('3', result);
        //                 if (result == 'KYC done successfully') {
        //                     //this.selectedInvoiceObj = result;
        //                     this.showToast(result, 'success');
        //                     this.EngineNo = '';
        //                     this.chassisNo = '';
        //                     this.State = '';
        //                     // alert(JSON.stringify(this.selectedInvoiceObj));
        //                 }
        //                 else {
        //                     this.showToast(result, 'error');
        //                 }
        //             })
        //             .catch(error => {
        //                 this.error = error;
        //             });

        //     }
        // }
        // if (this.KycVehiclercBool == true) {
        //     //  alert('vehivle');
        //     this.allvalidate();
        //     if (this.checked == false) {

        //         getKYCReportManualVehiclercAdv({ recordId: '$recordId', registrationNumber: this.RegistrationNo })
        //             .then(result => {
        //                 console.log('4', result);
        //                 if (result == 'KYC done successfully') {
        //                     this.showToast(result, 'success');
        //                     this.RegistrationNo = '';
        //                     //this.selectedInvoiceObj = result;
        //                     // alert(JSON.stringify(this.selectedInvoiceObj));
        //                 }
        //                 else {
        //                     this.showToast(result, 'error');
        //                 }
        //             })
        //             .catch(error => {
        //                 this.error = error;
        //             });

        //     }

        // }
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