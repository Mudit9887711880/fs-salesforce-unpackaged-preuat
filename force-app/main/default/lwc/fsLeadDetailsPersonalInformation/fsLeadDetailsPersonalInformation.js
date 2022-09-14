import { LightningElement, api, track } from 'lwc';
import saveRecord from '@salesforce/apex/FsLeadDetailsController.saveRecord';
import getSectionContent from '@salesforce/apex/FsLeadDetailsController.getSectionContent';
import getPersonalInformationData from '@salesforce/apex/FsLeadDetailsControllerHelper.getPersonalInformationData';
import kycAPICallout from '@salesforce/apex/KYCAPIController.kycAPICallout';
import getPincodeDetails from '@salesforce/apex/DatabaseUtililty.getPincodeDetails';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
export default class FsLeadDetailsPersonalInformation extends LightningElement {
    @api rowAction;
    @api allLoanApplicant;
    @api tableData;
    @track isRecordEdited = false;
    @track recordIds;
    @track fieldsContent;
    @track objectIdMap = { 'Account': '', 'Loan_Applicant__c': '' };
    @track isSpinnerActive = false;
    @track isFieldDisplay = false;
    @track showDeletePopup = false;
    @track showMobileVerification = false;
    @track isMobileEdited = false;
    @track isVerified = true;
    @track loanAppId;
    @track loanRowActions = [
        {
            type: 'button-icon',
            fixedWidth: 50,
            typeAttributes: {
                iconName: 'utility:edit',
                title: 'Edit',
                variant: 'border-filled',
                alternativeText: 'Edit',
                name: 'edit'
            }
        },
        {
            type: 'button-icon',
            fixedWidth: 50,
            typeAttributes: {
                iconName: 'utility:delete',
                title: 'Delete',
                variant: 'border-filled',
                alternativeText: 'Delete',
                name: 'delete'
            }
        },
        {
            type: 'button-icon',
            fixedWidth: 50,
            typeAttributes: {
                iconName: 'utility:live_message',
                title: 'Verify Mobile',
                variant: 'border-filled',
                alternativeText: 'Verify Mobile',
                name: 'verify'
            }
        },
        {
            type: 'button-icon',
            fixedWidth: 50,
            typeAttributes: {
                iconName: 'utility:asset_audit',
                title: 'Validate KYC',
                variant: 'border-filled',
                alternativeText: 'Validate KYC',
                name: 'validate'
            }
        }
    ];
    //checkValidity
    @track defLoanAppList = [];


    connectedCallback() {
        this.getPersonalInformationData();
    }

    getSectionPageContent(recId) {
        this.isSpinnerActive = true;
        getSectionContent({ recordIds: recId, metaDetaName: 'Lead_Details_Personal_Information' })
            .then(result => {
                this.fieldsContent = result.data;
                this.isSpinnerActive = false;
                setTimeout(() => {
                    this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setValues('Nationality__c', 'Indian')));
                }, 200);
            })
            .catch(error => {
                console.log(error);
                this.isSpinnerActive = false;
            });
    }

    handleSelectedApplication(event) {
        console.log('Edit called #### ', JSON.stringify(event.detail));
        this.fieldsContent = undefined;
        var recordData = event.detail.recordData;
        this.loanAppId = recordData.Id;
        const isMobVerified = recordData.Mobile_Verified__c;
        const isKYCVerified = recordData.Is_KYC_Verified__c;
        if (event.detail.ActionName === 'edit') {
            this.isRecordEdited = true;
            this.recordIds = recordData.Customer_Information_VALUE.replaceAll('/lightning/_classic/', '') + '_' + recordData.Id;
            this.objectIdMap['Account'] = recordData.Customer_Information_VALUE.replaceAll('/lightning/_classic/', '');
            this.objectIdMap['Loan_Applicant__c'] = recordData.Id;
            this.getSectionPageContent(this.recordIds);
        }
        else if (event.detail.ActionName === 'delete') {
            console.log('Delete Called ');
            this.showDeletePopup = true;
        }
        else if (event.detail.ActionName === 'verify') {
            console.log('Mob Verified :: ', isMobVerified);
            if (!isMobVerified) {
                this.isSpinnerActive = true;
                console.log('Verify Called ', recordData.Mobile__c);
                this.showMobileVerification = true;
                setTimeout(() => {
                    this.template.querySelector("c-fs-mobile-verification-l-w-c").sendMobOTP(this.loanAppId, recordData.Mobile__c);
                }, 200);
                this.isSpinnerActive = false;
            }
            else {
                this.showtoastmessage('Error', 'Error', 'Mobile Already Verified!!');
            }
        }
        else if (event.detail.ActionName === 'validate') {
            if (isKYCVerified == 'false') {
                kycAPICallout({ loanAppId: this.loanAppId })
                    .then(result => {
                        if (result != undefined && result != '' && result != null) {
                            if (result === 'Success') {
                                this.showtoastmessage('Success', 'Success', 'KYC Validate Sucessfully!!');
                            }
                            else {
                                this.showtoastmessage('Error', 'Error', 'KYC Validate Failed!!');
                            }
                        }
                        else {
                            this.showtoastmessage('Error', 'Error', 'KYC Validate Failed!!');
                        }
                    })
                    .catch(error => {
                        this.showtoastmessage('Error', 'Error', 'KYC Validate Failed!!');
                    })
            }
            else {
                this.showtoastmessage('Error', 'Error', 'KYC Already Verified!!');
            }
        }
    }

    setAddressValues(tempFieldsContent) {
        var addressValues = {
            flat: '',
            address1: '',
            address2: '',
            landmark: '',
            village: '',
            city: '',
            taluka: '',
            district: '',
            state: ''
        }
        if (tempFieldsContent.CurrentFieldAPIName === 'Loan_Applicant__c-Same_As_Address_Pernament__c') {
            if (tempFieldsContent.CurrentFieldValue === 'Residence Address') {
                addressValues.flat = tempFieldsContent.previousData['Loan_Applicant__c-Residence_Flat_Plot_Number__c'];
                addressValues.address1 = tempFieldsContent.previousData['Loan_Applicant__c-Residence_Address_Line_1__c'];
                addressValues.address2 = tempFieldsContent.previousData['Loan_Applicant__c-Residence_Address_Line_2__c'];
                addressValues.landmark = tempFieldsContent.previousData['Loan_Applicant__c-Residence_Landmark__c'];
                addressValues.village = tempFieldsContent.previousData['Loan_Applicant__c-Residence_Village__c'];
                addressValues.city = tempFieldsContent.previousData['Loan_Applicant__c-Residence_City__c'];
                addressValues.taluka = tempFieldsContent.previousData['Loan_Applicant__c-Residence_Taluka__c'];
                addressValues.district = tempFieldsContent.previousData['Loan_Applicant__c-Residence_District__c'];
                addressValues.state = tempFieldsContent.previousData['Loan_Applicant__c-Residence_State__c'];
                this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setValues('Is_Permanent_Address', addressValues, true)));
            }
            else if (tempFieldsContent.CurrentFieldValue === 'Business Address') {
                addressValues.flat = tempFieldsContent.previousData['Loan_Applicant__c-Business_Flat_Plot_Number__c'];
                addressValues.address1 = tempFieldsContent.previousData['Loan_Applicant__c-Business_Address_Line_1__c'];
                addressValues.address2 = tempFieldsContent.previousData['Loan_Applicant__c-Business_Address_Line_2__c'];
                addressValues.landmark = tempFieldsContent.previousData['Loan_Applicant__c-Business_Landmark__c'];
                addressValues.village = tempFieldsContent.previousData['Loan_Applicant__c-Business_Village__c'];
                addressValues.city = tempFieldsContent.previousData['Loan_Applicant__c-Business_City__c'];
                addressValues.taluka = tempFieldsContent.previousData['Loan_Applicant__c-Business_Taluka__c'];
                addressValues.district = tempFieldsContent.previousData['Loan_Applicant__c-Business_District__c'];
                addressValues.state = tempFieldsContent.previousData['Loan_Applicant__c-Business_State__c'];
                this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setValues('Is_Permanent_Address', addressValues, true)));
            } else {
                this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setValues('Is_Permanent_Address', addressValues, true)));
            }
        }

        if (tempFieldsContent.CurrentFieldAPIName === 'Loan_Applicant__c-Same_As_Address_Business__c') {
            if (tempFieldsContent.CurrentFieldValue === 'Residence Address') {
                addressValues.flat = tempFieldsContent.previousData['Loan_Applicant__c-Residence_Flat_Plot_Number__c'];
                addressValues.address1 = tempFieldsContent.previousData['Loan_Applicant__c-Residence_Address_Line_1__c'];
                addressValues.address2 = tempFieldsContent.previousData['Loan_Applicant__c-Residence_Address_Line_2__c'];
                addressValues.landmark = tempFieldsContent.previousData['Loan_Applicant__c-Residence_Landmark__c'];
                addressValues.village = tempFieldsContent.previousData['Loan_Applicant__c-Residence_Village__c'];
                addressValues.city = tempFieldsContent.previousData['Loan_Applicant__c-Residence_City__c'];
                addressValues.taluka = tempFieldsContent.previousData['Loan_Applicant__c-Residence_Taluka__c'];
                addressValues.district = tempFieldsContent.previousData['Loan_Applicant__c-Residence_District__c'];
                addressValues.state = tempFieldsContent.previousData['Loan_Applicant__c-Residence_State__c'];
                this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setValues('Is_Permanent_Address', addressValues, true)));
            }
            if (tempFieldsContent.CurrentFieldValue === 'Permanent Address') {
                addressValues.flat = tempFieldsContent.previousData['Loan_Applicant__c-Residence_Flat_Plot_Number__c'];
                addressValues.address1 = tempFieldsContent.previousData['Loan_Applicant__c-Residence_Address_Line_1__c'];
                addressValues.address2 = tempFieldsContent.previousData['Loan_Applicant__c-Residence_Address_Line_2__c'];
                addressValues.landmark = tempFieldsContent.previousData['Loan_Applicant__c-Residence_Landmark__c'];
                addressValues.village = tempFieldsContent.previousData['Loan_Applicant__c-Residence_Village__c'];
                addressValues.city = tempFieldsContent.previousData['Loan_Applicant__c-Residence_City__c'];
                addressValues.taluka = tempFieldsContent.previousData['Loan_Applicant__c-Residence_Taluka__c'];
                addressValues.district = tempFieldsContent.previousData['Loan_Applicant__c-Residence_District__c'];
                addressValues.state = tempFieldsContent.previousData['Loan_Applicant__c-Residence_State__c'];
                this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setValues('Is_Business_Address', addressValues, true)));
            } else {
                this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setValues('Is_Business_Address', addressValues, true)));
            }
        }
    }
    changedFromChild(event) {
        console.log('event details #### ', JSON.stringify(event.detail));
        var tempFieldsContent = event.detail;

        if (tempFieldsContent.CurrentFieldAPIName === 'Account-FirstName' || tempFieldsContent.CurrentFieldAPIName === 'Account-LastName') {
            var nameVal = tempFieldsContent.previousData['Account-FirstName'] + ' ' + tempFieldsContent.previousData['Account-LastName'];
            this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setValues('Name', nameVal)));
        }
        if (tempFieldsContent.CurrentFieldAPIName === 'Account-PersonBirthdate') {
            var dob = this.getAge(tempFieldsContent.previousData['Account-PersonBirthdate']);
            this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setValues('Age__c', dob)));
        }
        if (tempFieldsContent.CurrentFieldAPIName === 'Loan_Applicant__c-Same_As_Address_Pernament__c' || tempFieldsContent.CurrentFieldAPIName === 'Loan_Applicant__c-Same_As_Address_Business__c') {
            this.setAddressValues(tempFieldsContent);
        }

        if (tempFieldsContent.CurrentFieldAPIName === 'Loan_Applicant__c-Residence_Pincode__c' && tempFieldsContent.CurrentFieldValue != true) {
            console.log('inside resi');
            getPincodeDetails({ pinId: tempFieldsContent.previousData['Loan_Applicant__c-Residence_Pincode__c'] })
                .then(resi => {
                    console.log(resi);
                    this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setValues('Is_Residence_Address', resi)));
                })
                .catch(error => {
                    console.log(error);
                })
        } else if (tempFieldsContent.CurrentFieldAPIName === 'Loan_Applicant__c-Residence_Pincode__c') {
            this.resetAllPincodeFields('Is_Residence_Address');
        }

        if (tempFieldsContent.CurrentFieldAPIName === 'Loan_Applicant__c-Permanent_Pincode__c' && tempFieldsContent.CurrentFieldValue != true) {
            console.log('inside permanent');
            getPincodeDetails({ pinId: tempFieldsContent.previousData['Loan_Applicant__c-Permanent_Pincode__c'] })
                .then(perm => {
                    console.log(perm);
                    this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setValues('Is_Permanent_Address', perm)));
                })
                .catch(error => {
                    console.log(error);
                })
        } else if (tempFieldsContent.CurrentFieldAPIName === 'Loan_Applicant__c-Permanent_Pincode__c') {
            this.resetAllPincodeFields('Is_Permanent_Address');
        }

        if (tempFieldsContent.CurrentFieldAPIName === 'Loan_Applicant__c-Business_Pincode__c' && tempFieldsContent.CurrentFieldValue != true) {
            console.log('inside business');
            getPincodeDetails({ pinId: tempFieldsContent.previousData['Loan_Applicant__c-Business_Pincode__c'] })
                .then(busi => {
                    console.log(busi);
                    this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setValues('Is_Business_Address', busi)));
                })
                .catch(error => {
                    console.log(error);
                })
        } else if (tempFieldsContent.CurrentFieldAPIName === 'Loan_Applicant__c-Business_Pincode__c') {
            this.resetAllPincodeFields('Is_Business_Address');
        }
        if (tempFieldsContent.CurrentFieldAPIName === 'Loan_Applicant__c-Mobile__c') {
            if (this.isRecordEdited) {
                console.log('tempFieldsContent.CurrentFieldAPIName ', tempFieldsContent.CurrentFieldValue);
                this.isMobileEdited = true;
            }
        }
    }
    resetAllPincodeFields(type) {
        var resi = {
            city: '',
            taluka: '',
            district: '',
            state: '',
            pinCode: ''
        }
        this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setValues(type, resi)));
    }
    getAge(dateString) {
        var today = new Date();
        var birthDate = new Date(dateString);
        var age = today.getFullYear() - birthDate.getFullYear();
        var m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        console.log('age ### ', age);
        return age;
    }
    handleSave() {
        var data = this.template.querySelector("c-generic-edit-pages-l-w-c").handleOnSave();
        if (data.length > 0) {
            var addressFromDate;
            var addressToDate;

            var cityFromDate;
            var cityToDate;

            for (var i = 0; i < data.length; i++) {
                if (data[i].sobjectType == 'Loan_Applicant__c' && data[i].Duration_At_This_Address_From__c != '' && data[i].Duration_At_This_Address_To__c != '') {
                    console.log('@@@@ data ', data[i]);
                    addressFromDate = Date.parse(data[i].Duration_At_This_Address_From__c);
                    addressToDate = Date.parse(data[i].Duration_At_This_Address_To__c);
                }
                if (data[i].sobjectType == 'Loan_Applicant__c' && data[i].Duration_At_This_City_From__c != '' && data[i].Duration_At_This_City_To__c != '') {
                    console.log('@@@@ data ', data[i]);
                    cityFromDate = Date.parse(data[i].Duration_At_This_City_From__c);
                    cityToDate = Date.parse(data[i].Duration_At_This_City_To__c);
                }
            }
            if (addressFromDate > addressToDate) {
                this.showtoastmessage('Error', 'Error', 'Duration At This Address From Should Not be Greater Than Duration At This Address To');
                return;
            } else if (cityFromDate > cityToDate) {
                this.showtoastmessage('Error', 'Error', 'Duration At This City From Should Not be Greater Than Duration At This City To');
                return;
            } else {
                this.isSpinnerActive = true;
                for (var i = 0; i < data.length; i++) {
                    console.log(data[i].sobjectType);
                    if (this.isRecordEdited) {
                        data[i].Id = this.objectIdMap[data[i].sobjectType];
                        if (this.isMobileEdited)
                            data[i].Mobile_Verified__c = false;
                    }
                    data[i].Id = this.objectIdMap[data[i].sobjectType];
                    data[i].Is_Lead_Detail_Done__c = true;
                    if (data[i].sobjectType == 'Account') {
                        delete data[i].Name;
                    }
                    console.log('======= data ========')
                    console.log(JSON.stringify(data[i]));
                    console.log('======= data ========')
                    saveRecord({ dataToInsert: JSON.stringify(data[i]) })
                        .then(result => {
                            this.fieldsContent = '';
                            this.isSpinnerActive = false;
                            this.showtoastmessage('Success', 'Success', 'Information Updated Successfully.');
                            this.getPersonalInformationData(true);
                        })
                        .catch(error => {
                            console.log(error);
                            this.showtoastmessage('Error', 'Error', JSON.stringify(error));
                        });
                }
            }
        } else {
            this.showtoastmessage('Error', 'Error', 'Complete Required Field(s).');
        }
    }
    handleCancel() {
        console.log('handle cancel called ###');
        this.fieldsContent = undefined;
    }
    showtoastmessage(title, variant, message) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(evt);
    }
    @api getPersonalInformationData(isRefresh) {
        console.log('::: allLoanApplicant ::: ', JSON.stringify(this.allLoanApplicant));
        getPersonalInformationData({ allLoanApplicant: this.allLoanApplicant })
            .then(result => {
                if (isRefresh)
                    this.template.querySelector('c-generic-data-table-l-w-c').init(result);
                this.tableData = result;
                //checkValidity
                this.defLoanAppList = [];
                var temp = JSON.parse(result.strDataTableData);
                console.log('temp #### ', JSON.stringify(temp));

                var validationList = {
                    'IsAllRecordEdit': '',
                    'IsCoApplicant': false,
                    'IsGuarantor': false,
                    'IsMobileVerified': true
                };
                var customerType = ['Guarantor', 'Co-Applicant'];
                for (var i in temp) {
                    var dataResult = temp[i];
                    if (dataResult['Customer_Type__c'] === 'Co-Applicant' && customerType.includes(dataResult['Customer_Type__c'])) {
                        validationList.IsCoApplicant = true;
                    }
                    if (dataResult['Customer_Type__c'] === 'Guarantor' && customerType.includes(dataResult['Customer_Type__c'])) {
                        validationList.IsGuarantor = true;
                    }
                    if(dataResult['Mobile_Verified__c'] === false){
                        validationList.IsMobileVerified = false;
                        console.log('validationList.IsMobileVerified==',validationList.IsMobileVerified);
                    }
                    /*else{
                        validationList.IsMobileVerified = false;
                        this.isVerified = false;
                    }*/
                    if (dataResult['Is_Lead_Detail_Done__c'] === 'false') {
                        this.defLoanAppList.push(dataResult['Name_LABEL']);
                    }
                }
                //validationList.IsMobileVerified = this.isVerified;
                validationList.IsAllRecordEdit = this.defLoanAppList;
                const checkValidLoan = new CustomEvent("checkpersonalinfo", {
                    detail: validationList
                });
                this.dispatchEvent(checkValidLoan);
            })
            .catch(error => {

            })
    }
    setValues(_fieldAPIName, _val, isAddressCopied) {
        var _tempVar = JSON.parse(this.fieldsContent);
        var index;
        if (_fieldAPIName == 'Is_Residence_Address') {
            index = 1;
        }
        if (_fieldAPIName == 'Is_Permanent_Address') {
            index = 2;
        }
        if (_fieldAPIName == 'Is_Business_Address') {
            index = 3;
        }

        if (_fieldAPIName == 'Is_Residence_Address' || _fieldAPIName == 'Is_Business_Address' || _fieldAPIName == 'Is_Permanent_Address') {
            for (var i = 0; i < _tempVar[index].fieldsContent.length; i++) {
                if (_fieldAPIName === 'Is_Residence_Address') {
                    console.log('resi ### ', _tempVar[index].fieldsContent[i].fieldAPIName);
                    if (_tempVar[index].fieldsContent[i].fieldAPIName === 'Residence_City__c') {
                        _tempVar[index].fieldsContent[i].value = _val.city;
                    }
                    if (_tempVar[index].fieldsContent[i].fieldAPIName === 'Residence_Taluka__c') {
                        _tempVar[index].fieldsContent[i].value = _val.taluka;
                    }
                    if (_tempVar[index].fieldsContent[i].fieldAPIName === 'Residence_District__c') {
                        _tempVar[index].fieldsContent[i].value = _val.district;
                    }
                    if (_tempVar[index].fieldsContent[i].fieldAPIName === 'Residence_State__c') {
                        _tempVar[index].fieldsContent[i].value = _val.state;
                    }
                }
                if (_fieldAPIName === 'Is_Permanent_Address') {

                    if (_tempVar[index].fieldsContent[i].fieldAPIName === 'Permanent_Flat_Plot_Number__c' && isAddressCopied) {
                        _tempVar[index].fieldsContent[i].value = _val.flat;
                    }
                    if (_tempVar[index].fieldsContent[i].fieldAPIName === 'Permanent_Address_Line_1__c' && isAddressCopied) {
                        _tempVar[index].fieldsContent[i].value = _val.address1;
                    }
                    if (_tempVar[index].fieldsContent[i].fieldAPIName === 'Permanent_Address_Line_2__c' && isAddressCopied) {
                        _tempVar[index].fieldsContent[i].value = _val.address2;
                    }
                    if (_tempVar[index].fieldsContent[i].fieldAPIName === 'Permanent_Landmark__c' && isAddressCopied) {
                        _tempVar[index].fieldsContent[i].value = _val.landmark;
                    }
                    if (_tempVar[index].fieldsContent[i].fieldAPIName === 'Permanent_Village__c' && isAddressCopied) {
                        _tempVar[index].fieldsContent[i].value = _val.village;
                    }

                    if (_tempVar[index].fieldsContent[i].fieldAPIName === 'Permanent_City__c') {
                        _tempVar[index].fieldsContent[i].value = _val.city;
                    }
                    if (_tempVar[index].fieldsContent[i].fieldAPIName === 'Permanent_Taluka__c') {
                        _tempVar[index].fieldsContent[i].value = _val.taluka;
                    }
                    if (_tempVar[index].fieldsContent[i].fieldAPIName === 'Permanent_District__c') {
                        _tempVar[index].fieldsContent[i].value = _val.district;
                    }
                    if (_tempVar[index].fieldsContent[i].fieldAPIName === 'Permanent_State__c') {
                        _tempVar[index].fieldsContent[i].value = _val.state;
                    }
                }
                if (_fieldAPIName === 'Is_Business_Address') {
                    if (_tempVar[index].fieldsContent[i].fieldAPIName === 'Business_Flat_Plot_Number__c' && isAddressCopied) {
                        _tempVar[index].fieldsContent[i].value = _val.flat;
                    }
                    if (_tempVar[index].fieldsContent[i].fieldAPIName === 'Business_Address_Line_1__c' && isAddressCopied) {
                        _tempVar[index].fieldsContent[i].value = _val.address1;
                    }
                    if (_tempVar[index].fieldsContent[i].fieldAPIName === 'Business_Address_Line_2__c' && isAddressCopied) {
                        _tempVar[index].fieldsContent[i].value = _val.address2;
                    }
                    if (_tempVar[index].fieldsContent[i].fieldAPIName === 'Business_Landmark__c' && isAddressCopied) {
                        _tempVar[index].fieldsContent[i].value = _val.landmark;
                    }
                    if (_tempVar[index].fieldsContent[i].fieldAPIName === 'Business_Village__c' && isAddressCopied) {
                        _tempVar[index].fieldsContent[i].value = _val.village;
                    }

                    if (_tempVar[index].fieldsContent[i].fieldAPIName === 'Business_City__c') {
                        _tempVar[index].fieldsContent[i].value = _val.city;
                    }
                    if (_tempVar[index].fieldsContent[i].fieldAPIName === 'Business_Taluka__c') {
                        _tempVar[index].fieldsContent[i].value = _val.taluka;
                    }
                    if (_tempVar[index].fieldsContent[i].fieldAPIName === 'Business_District__c') {
                        _tempVar[index].fieldsContent[i].value = _val.district;
                    }
                    if (_tempVar[index].fieldsContent[i].fieldAPIName === 'Business_State__c') {
                        _tempVar[index].fieldsContent[i].value = _val.state;
                    }
                }
            }
        } else {
            for (var i = 0; i < _tempVar[0].fieldsContent.length; i++) {
                if (_tempVar[0].fieldsContent[i].fieldAPIName === 'PersonBirthdate') {
                    _tempVar[0].fieldsContent[i].maxDate = this.todayDate();
                }
                if (_tempVar[0].fieldsContent[i].fieldAPIName === _fieldAPIName) {
                    if (_tempVar[0].fieldsContent[i].isCheckbox) {
                        _tempVar[0].fieldsContent[i].checkboxVal = Boolean(_val);
                    } else {
                        _tempVar[0].fieldsContent[i].value = _val;
                    }
                }
            }
        }
        this.fieldsContent = JSON.stringify(_tempVar);
        return _tempVar;
    }

    handlemodalactions(event) {
        this.showDeletePopup = false;
        if (event.detail === true)
            this.getPersonalInformationData(true);
    }

    reloadDataTable(event) {
        if (event.detail) {
            this.isSpinnerActive = false;
            this.getPersonalInformationData(true);
        }
    }
    todayDate() {
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth() + 1;
        var yyyy = today.getFullYear() - 1;
        var todayDate = yyyy + '-' + mm + '-' + dd;
        console.log('todayDate ### ', todayDate);
        return todayDate;
    }
}