import { LightningElement, track, wire, api } from 'lwc';
import insertPreLogin from '@salesforce/apex/FsPreloginController.insertPreLogin';
import insertApplications from '@salesforce/apex/FsPreloginController.insertApplications';
import saveRecord from '@salesforce/apex/FsPreloginController.saveRecord';
import getMetadtaInfoForm from '@salesforce/apex/FsPreloginController.getMetadtaInfoForm';
import getPincodeDetails from '@salesforce/apex/DatabaseUtililty.getPincodeDetails';
import insertKYCDocuments from '@salesforce/apex/FsPreloginController.insertKYCDocuments';
import updateKYCOR from '@salesforce/apex/FsPreloginController.updateKYCOR';
import getPinId from '@salesforce/apex/FsPreloginController.getPinId';
import getApplicationName from '@salesforce/apex/FsPreloginController.getApplicationName';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { CloseActionScreenEvent } from 'lightning/actions';

export default class FsLoanApplicantInformation extends LightningElement {

    @api preloginId;
    @api applicationId;
    @api accountId;
    @api loanAppId;
    @api customerTypeValue;
    @api verificationTypeValue;
    @api ocrTable;
    @api loanData;
    @api isButtonsHide;
    @api stageName;

    @track fieldsContent;
    @track isSpinnerActive = false;
    @track objectIdMap = { 'Account': '', 'Loan_Applicant__c': '' };
    @track dataValues;
    @track isRecordEdit = false;
    @track hasPrimaryApplicant = false;
    @track accData = [];
    @track city;
    @track state;
    @track district;
    @track oldCusType = '';
    @track isMobileEdited = false;
    @track base64List = [];
    @track fileNameList = [];
    @track labelSave = 'Save';
    @track appName;
    @track kycOCRId;
    @track isKYCChanged = false;
    @track pincode;

    connectedCallback() {
        this.isSpinnerActive = true;
        this.accData = this.loanData;
    }

    maxDate(){
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth() + 1;
        var yyyy = today.getFullYear() - 1;
        var todayDate = yyyy + '-' + mm + '-' + dd;
        return todayDate;
    }


    @api getIdsOnEdit(loanAppWrapper) {
        console.log('get id event called ', loanAppWrapper);
        this.objectIdMap['Account'] = loanAppWrapper.accountId;
        this.objectIdMap['Loan_Applicant__c'] = loanAppWrapper.loanAppId;
        this.isRecordEdit = true;
        this.labelSave = 'Update';
    }

    @api getPrimaryApplicantInfo(hasPrimaryApplicant) {
        //this.hasPrimaryApplicant = hasPrimaryApplicant;
    }

    @api getDataTableInfo(accData) {
        console.log('getDataTableInfo ', accData);
        this.accData = accData;
    }

    @api getOCRTableInfo(ocrTable) {
        this.isSpinnerActive = false;
        console.log('getOCRTableInfo ', ocrTable);
        this.ocrTable = ocrTable;
        this.kycOCRId = ocrTable[0]['Id'];
        console.log('kycOCrId ', this.kycOCRId);
        const pin = this.ocrTable[0].pin__c;
        console.log('PINCODE = ', pin)
        if (pin) {
            getPinId({ pin: pin })
                .then(result => {
                    console.log('pinId result ', result);
                    if (result) {
                        this.pincode = result;
                        if (this.pincode) {
                            getPincodeDetails({ pinId: this.pincode })
                                .then(result => {
                                    console.log(result);
                                    this.city = result.city;
                                    this.state = result.state;
                                    this.district = result.district;
                                    this.getSectionPageContent('');
                                })
                                .catch(error => {
                                    console.log(error);
                                    this.getSectionPageContent('');
                                })
                        }
                    } else {
                        this.getSectionPageContent('');
                    }
                })
                .catch(error => {
                    console.log('Error while getting pincode id from ocr ', error);
                    this.getSectionPageContent('');
                })
        }
        else {
            this.getSectionPageContent('');
        }

    }

    @api getCustomerTypeOndit(cus) {
        console.log('getCustomerTypeOndit ', cus);
        this.oldCusType = cus;
    }

    @api getOCRDocs(fileWrapper) {
        this.base64List = [];
        this.fileNameList = [];
        console.log('fileWrapper ', fileWrapper);
        var file = JSON.parse(JSON.stringify(fileWrapper));
        console.log('file ', file);
        for (var i = 0; i < file.kycDoc.length; i++) {
            console.log(i + ' ' + file.kycDoc[i]);
            this.base64List.push(file.kycDoc[i].base64);
            this.fileNameList.push(file.kycDoc[i].filename);
        }
        console.log(this.base64List);
        console.log(this.fileNameList);
    }

    @api async getSectionPageContent(recId) {
        try {
            await getMetadtaInfoForm({ recordIds: recId, metaDetaName: 'fs_Prelogin_Customer_Details' })
                .then(result => {
                    // this.fieldsContent = undefined;
                    console.log('1 ', result.data)
                    var rs = JSON.parse(result.data);
                    if (this.ocrTable && !this.isRecordEdit) {
                        rs[0].fieldsContent.forEach(element => {
                            console.log('this.ocrTable[0] ', this.ocrTable[0]);
                            if (element.fieldAPIName === 'Customer_Type__c') {
                                element.value = this.customerTypeValue;
                            }
                            if (element.fieldAPIName === 'FirstName') {
                                element.value = this.ocrTable[0].First_Name__c;
                            }
                            if (element.fieldAPIName === 'LastName') {
                                element.value = this.ocrTable[0].Last_Name__c;
                            }
                            if (element.fieldAPIName === 'KYC_Id_1__c') {
                                element.value = this.ocrTable[0].Id__c;
                            }
                            if (element.fieldAPIName === 'KYC_ID_Type_1__c') {
                                element.value = this.ocrTable[0].Name;
                            }
                            if (element.fieldAPIName === 'Father_s_Name__c') {
                                element.value = this.ocrTable[0].Fathers_Name__c;
                            }
                            if (element.fieldAPIName === 'PersonBirthdate') {
                                console.log('this.ocrTable[0].DOB__c ', this.ocrTable[0].DOB__c);
                                //console.log('this.ocrTable[0].DOB__c ', this.ocrTable[0].DOB__c.substring(0,10));
                                if (this.ocrTable[0].DOB__c)
                                    element.value = this.ocrTable[0].DOB__c.substring(0, 10);
                            }
                            if (element.fieldAPIName === 'Residence_Pincode__c') {
                                if (this.pincode){
                                    element.lookupVal = this.pincode;
                                    element.value = this.pincode;
                                }  
                            }
                            if (element.fieldAPIName === 'Residence_City__c') {
                                if (this.pincode){
                                    element.value = this.city;
                                }  
                            }
                            if (element.fieldAPIName === 'Residence_State__c') {
                                if (this.pincode){
                                    element.value = this.state;
                                }  
                            }
                            if (element.fieldAPIName === 'Residence_District__c') {
                                if (this.pincode){
                                    element.value = this.district;
                                }  
                            }
                            if (element.fieldAPIName === 'Residence_Address_Line_1__c') {
                                if (this.pincode){
                                    element.value = this.ocrTable[0].address__c;
                                }  
                            }

                        });
                        setTimeout(() => {
                            this.setKYCPattern(this.fieldsContent, this.ocrTable[0].Name, 'KYC_Id_1__c','');
                        }, 200);
                    }
                    console.log('yes= ', rs);
                    this.fieldsContent = JSON.stringify(rs);
                    if (this.isRecordEdit) {
                        var kycValue1;
                        var kycValue2;
                        var constitution;
                        rs[0].fieldsContent.forEach(element => {
                            if (element.fieldAPIName === 'KYC_ID_Type_1__c') {
                                kycValue1 = element.value;
                            }
                            if (element.fieldAPIName === 'KYC_ID_Type_2__c') {
                                kycValue2 = element.value;
                            }
                            if (element.fieldAPIName === 'Constitution__c') {
                                constitution = element.value;
                            }
                        });
                        setTimeout(() => {
                            this.setKYCPattern(this.fieldsContent, kycValue1, 'KYC_Id_1__c', constitution);
                            if (kycValue2) {
                                this.setKYCPattern(this.fieldsContent, kycValue2, 'KYC_Id_2__c', constitution);
                            }
                        }, 200);
                    }
                    console.log('fieldContent ', this.fieldsContent);
                    this.isSpinnerActive = false;
                    setTimeout(() => {
                        this.toggleSpouseField(this.fieldsContent, true, false);
                    }, 200);
                })
                .catch(error => {
                    console.log('1', error);
                });
        } catch (error) {
            console.log('2', error);
        }
    }

    handleFormValueChange(event) {
        console.log(event.detail);
        this.dataValues = event;
        console.log(this.dataValues);
        var tempFieldsContent = event.detail;
        console.log(this.fieldsContent);

        // FOR PC/AC
        if (this.isRecordEdit) {
            if (tempFieldsContent.CurrentFieldAPIName === 'Loan_Applicant__c-KYC_Id_1__c' || tempFieldsContent.CurrentFieldAPIName === 'Loan_Applicant__c-KYC_ID_Type_2__c' ||
                tempFieldsContent.CurrentFieldAPIName === 'Loan_Applicant__c-KYC_Id_1__c' || tempFieldsContent.CurrentFieldAPIName === 'Loan_Applicant__c-KYC_Id_2__c') {
                this.isKYCChanged = true;
            }
        }

        if (tempFieldsContent.CurrentFieldAPIName === 'Account-PersonBirthdate') {
            var d1 = new Date();
            var d2 = new Date(tempFieldsContent.CurrentFieldValue);
            var age = d1.getFullYear() - d2.getFullYear();
            console.log('age ', age);
            if (d2.getTime() > d1.getTime() || age < 1) {
                console.log('date ', d2);
                this.showToast('Error', 'error', 'Invalid DOB, Age should be minimum 1 year, Future Dates Are Not Allowed!!');
                this.closeAction();
                var _val = tempFieldsContent.CurrentFieldValue;
                console.log(' _val #### ',_val);
                this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setValues('PersonBirthdate',_val)));
                // var dateVal = null;
                // let genericedit = this.template.querySelector('c-generic-edit-pages-l-w-c');
                // this.fieldsContent = (JSON.stringify(this.setValues('PersonBirthdate', dateVal)));
                // genericedit.refreshData((this.fieldsContent));
                //this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setValues('PersonBirthdate', dateVal)));
            }
        }
        else if (tempFieldsContent.CurrentFieldAPIName === 'Loan_Applicant__c-Constitution__c') {
            this.setKYCPattern(this.fieldsContent, tempFieldsContent.previousData['Loan_Applicant__c-KYC_ID_Type_1__c'], 'KYC_Id_1__c', tempFieldsContent.CurrentFieldValue);
            this.setKYCPattern(this.fieldsContent, tempFieldsContent.previousData['Loan_Applicant__c-KYC_ID_Type_2__c'], 'KYC_Id_2__c', tempFieldsContent.CurrentFieldValue);
        }
        else if (tempFieldsContent.CurrentFieldAPIName === 'Loan_Applicant__c-Residence_Pincode__c') {
            console.log('tempFieldsContent.CurrentFieldAPIName ', tempFieldsContent.CurrentFieldValue);
            if (tempFieldsContent.CurrentFieldValue != true)
                this.getAllPincodeDetails(tempFieldsContent.CurrentFieldValue);
            else {
                let genericedit = this.template.querySelector('c-generic-edit-pages-l-w-c');
                this.fieldsContent = (JSON.stringify(this.setValues('Residence_City__c', null)));
                this.fieldsContent = (JSON.stringify(this.setValues('Residence_District__c', null)));
                this.fieldsContent = (JSON.stringify(this.setValues('Residence_State__c', null)));
                genericedit.refreshData((this.fieldsContent));
            }
        }
        else if (tempFieldsContent.CurrentFieldAPIName === 'Loan_Applicant__c-Married__c') {
            if (tempFieldsContent.CurrentFieldValue === 'Yes') {
                this.toggleSpouseField(this.fieldsContent, false, true);
            }
            else if (tempFieldsContent.CurrentFieldValue === 'No') {
                this.toggleSpouseField(this.fieldsContent, true, false);
                let genericedit = this.template.querySelector('c-generic-edit-pages-l-w-c');
                this.fieldsContent = (JSON.stringify(this.setValues('Husband_Wife_s_Name__c', null)));
                genericedit.refreshData((this.fieldsContent));
            }
        }
        else if (tempFieldsContent.CurrentFieldAPIName === 'Loan_Applicant__c-KYC_ID_Type_1__c') {
            console.log('tempFieldsContent.CurrentFieldAPIName ', tempFieldsContent.CurrentFieldValue);
            this.setKYCPattern(this.fieldsContent, tempFieldsContent.CurrentFieldValue, 'KYC_Id_1__c', tempFieldsContent.previousData['Loan_Applicant__c-Constitution__c']);
        }
        else if (tempFieldsContent.CurrentFieldAPIName === 'Loan_Applicant__c-KYC_ID_Type_2__c') {
            console.log('tempFieldsContent.CurrentFieldAPIName ', tempFieldsContent.CurrentFieldValue);
            this.setKYCPattern(this.fieldsContent, tempFieldsContent.CurrentFieldValue, 'KYC_Id_2__c', tempFieldsContent.previousData['Loan_Applicant__c-Constitution__c']);
        }
        else if (tempFieldsContent.CurrentFieldAPIName === 'Loan_Applicant__c-Mobile__c') {
            if (this.isRecordEdit) {
                console.log('tempFieldsContent.CurrentFieldAPIName ', tempFieldsContent.CurrentFieldValue);
                this.isMobileEdited = true;
            }
        }
        else if (tempFieldsContent.CurrentFieldAPIName === 'Loan_Applicant__c-KYC_Id_1__c') {
            if (tempFieldsContent.previousData['Loan_Applicant__c-KYC_ID_Type_1__c'] === 'Driving License' && tempFieldsContent.CurrentFieldValue.length == 15) {
                var year = parseInt(tempFieldsContent.CurrentFieldValue.substr(4, 4));
                var dYear = parseInt(new Date().getFullYear());
                console.log(year + ' :: ' + dYear);
                if (year > dYear) {
                    this.showToast('Error', 'error', 'Invalid DL Number, Future Year Not Allowed!!');
                    this.closeAction();
                }
            }
            let genericedit = this.template.querySelector('c-generic-edit-pages-l-w-c');
            this.fieldsContent = (JSON.stringify(this.setValues('KYC_Id_1__c', tempFieldsContent.CurrentFieldValue.toUpperCase())));
            genericedit.refreshData((this.fieldsContent));
            //this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setValues('KYC_Id_1__c', tempFieldsContent.CurrentFieldValue.toUpperCase())));
        }
        else if (tempFieldsContent.CurrentFieldAPIName === 'Loan_Applicant__c-KYC_Id_2__c') {
            console.log('i changed');
            if (tempFieldsContent.previousData['Loan_Applicant__c-KYC_ID_Type_2__c'] === 'Driving License' && tempFieldsContent.CurrentFieldValue.length == 15) {
                var year = parseInt(tempFieldsContent.CurrentFieldValue.substr(4, 4));
                var dYear = parseInt(new Date().getFullYear());
                console.log(year + ' :: ' + dYear);
                if (year > dYear) {
                    this.showToast('Error', 'error', 'Invalid DL Number, Future Year Not Allowed!!');
                    this.closeAction();
                }
            }
            let genericedit = this.template.querySelector('c-generic-edit-pages-l-w-c');
            this.fieldsContent = (JSON.stringify(this.setValues('KYC_Id_2__c', tempFieldsContent.CurrentFieldValue.toUpperCase())));
            genericedit.refreshData((this.fieldsContent));




            //this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setValues('KYC_Id_2__c', tempFieldsContent.CurrentFieldValue.toUpperCase())));
        }
    }

    setKYCPattern(fieldcontent, kycType, fieldAPIName, constitution) {
        var field = JSON.parse(fieldcontent);
        for (var i = 0; i < field[0].fieldsContent.length; i++) {
            if (field[0].fieldsContent[i].fieldAPIName === fieldAPIName) {
                var regEx;
                var helpText = 'for eg : ';
                var maxLength;
                if (kycType === 'Aadhaar Card') {
                    regEx = '[2-9]{1}[0-9]{3}[0-9]{4}[0-9]{4}';
                    helpText += '234567890123';
                    maxLength = 12;
                }
                if (kycType === 'Voter Id') {
                    regEx = '([a-zA-Z]){3}([0-9]){7}';
                    helpText += 'abc1234567'
                    maxLength = 10;
                }
                if (kycType === 'Pan Card') {
                    console.log('constitution ', constitution);
                    maxLength = 10;
                    if (constitution === 'Non-Individual') {
                        regEx = '[A-Z]{3}[C|G|L|F|T]{1}[A-Z]{1}[0-9]{4}[A-Z]{1}';
                        helpText += 'ABCDE1234Z'
                    }
                    else if (constitution === 'Individual') {
                        regEx = '[A-Z]{3}[P|H|A|B|J]{1}[A-Z]{1}[0-9]{4}[A-Z]{1}';
                        helpText += 'ABCDE1234Z'
                    }
                }
                if (kycType === 'Passport') {
                    //regEx = '[A-Z]{1}[0-9]{7}';
                    regEx = '[A-PR-WYa-pr-wy][1-9]\\d\\s?\\d{4}[1-9]';
                    helpText += 'A1234567'
                    maxLength = 8;
                }
                if (kycType === 'Driving License') {
                    //regEx = '(([A-Z]{2}[0-9]{2}))((19|20)[0-9][0-9])[0-9]{7}';
                    regEx = '(([A-Z]{2}[0-9]{2}))((19|20)[0-9][0-9])[0-9]{7}';
                    helpText += 'RJ1320120123456'
                    maxLength = 15;
                }
                field[0].fieldsContent[i].validationPattern = regEx;
                field[0].fieldsContent[i].validationPatternMismatched = 'Invalid KYC ID';
                field[0].fieldsContent[i].isHelpText = true;
                field[0].fieldsContent[i].helpMsg = helpText;
                field[0].fieldsContent[i].maxLength = maxLength;
            }
        }
        this.fieldsContent = JSON.stringify(field);
        let genericedit = this.template.querySelector('c-generic-edit-pages-l-w-c');
        genericedit.refreshData((this.fieldsContent));
    }

    toggleSpouseField(fieldcontent, disabled, required) {
        var field = JSON.parse(fieldcontent);
        for (var i = 0; i < field[0].fieldsContent.length; i++) {
            if (field[0].fieldsContent[i].fieldAPIName === 'Husband_Wife_s_Name__c') {
                field[0].fieldsContent[i].disabled = disabled;
                field[0].fieldsContent[i].isRequired = required;
                // if(disabled == true){
                //     alert(field[0].fieldsContent[i].value);
                //     field[0].fieldsContent[i].value = '';
                // }
            }
        }
        this.fieldsContent = JSON.stringify(field);
        let genericedit = this.template.querySelector('c-generic-edit-pages-l-w-c');
        genericedit.refreshData((this.fieldsContent));
    }

    getAllPincodeDetails(pinId) {
        getPincodeDetails({ pinId: pinId })
            .then(result => {
                console.log(result);
                this.city = result.city;
                this.state = result.state;
                this.district = result.district;
                let genericedit = this.template.querySelector('c-generic-edit-pages-l-w-c');
                console.log('field ', this.fieldsContent);
                console.log('check ', this.setValues('Residence_City__c', this.city));
                this.fieldsContent = (JSON.stringify(this.setValues('Residence_City__c', this.city)));
                this.fieldsContent = (JSON.stringify(this.setValues('Residence_District__c', this.district)));
                this.fieldsContent = (JSON.stringify(this.setValues('Residence_State__c', this.state)));
                genericedit.refreshData((this.fieldsContent));
            })
            .catch(error => {
                console.log(error);
            })
    }

    setValues(_fieldAPIName, _val) {
        var _tempVar = JSON.parse(this.fieldsContent);
        for (var i = 0; i < _tempVar[0].fieldsContent.length; i++) {
            if (_tempVar[0].fieldsContent[i].fieldAPIName === _fieldAPIName) {
                if (_tempVar[0].fieldsContent[i].isCheckbox) {
                    _tempVar[0].fieldsContent[i].checkboxVal = Boolean(_val);
                } else {
                     if (_tempVar[0].fieldsContent[i].fieldAPIName === 'PersonBirthdate') {
                        _tempVar[0].fieldsContent[i].maxDate = this.maxDate();
                    }
                    _tempVar[0].fieldsContent[i].value = _val;
                }
            }
        }
        return _tempVar;
    }

    checkValidations(accData) {
        console.log('checkValidations ', accData);
        this.hasPrimaryApplicant = false;
        for (var i in accData) {
            var dataResult = accData[i];
            console.log('Loan App Id ', dataResult['Id']);
            if (dataResult['Customer_Type__c'] === 'Primary Applicant') {
                console.log('Primary Applicant');
                this.hasPrimaryApplicant = true;
            }
        }
        return this.hasPrimaryApplicant;
    }

    @api async handleSave() {
        try {
            console.log('Ids ', this.preloginId, this.applicationId)
            if (this.customerTypeValue === 'Primary Applicant' && this.applicationId && this.accData.length > 0 && this.oldCusType != 'Primary Applicant') {
                var res = this.checkValidations(this.accData);
                console.log('res ', res);
                if (res === true) {
                    this.showToast('Error', 'error', 'Primary Applicant Already Exist!!');
                    this.closeAction();
                    return;
                }
            }
            this.isSpinnerActive = true;
            if (this.applicationId) {
                getApplicationName({ applicationId: this.applicationId }).then(result => {
                    this.appName = result;
                })
                    .catch(error => {
                        console.log(error);
                    })
            }
            if (!this.preloginId && !this.isRecordEdit) {
                console.log('fresh app');
                await insertPreLogin()
                    .then(result => {
                        console.log('preloginId ', result);
                        if (result)
                            this.preloginId = result;
                    })
                    .catch(error => {
                        console.log('error in inserting prelogin ', error);
                    })
                await insertApplications({ preLogInId: this.preloginId })
                    .then(result => {
                        console.log('applicationId after insertion ', result);
                        if (result) {
                            this.applicationId = result.appId;
                            this.appName = result.appName;
                        }
                    })
                    .catch(error => {
                        console.log('error in inserting application ', error);
                    })
            }
            var data1 = this.template.querySelector("c-generic-edit-pages-l-w-c").handleOnSave();
            var data = data1.reverse();
            console.log('data #### ', data);
            if (data.length > 0) {
                console.log('Data entry start', this.customerTypeValue);
                for (var i = 0; i < data.length; i++) {
                    console.log('i am in', data[i]);
                    if (this.isRecordEdit) {
                        data[i].Id = this.objectIdMap[data[i].sobjectType];
                        if (this.isMobileEdited)
                            data[i].Mobile_Verified__c = false;
                        if (this.isKYCChanged && data[i].sobjectType == "Loan_Applicant__c") {
                            data[i].Is_Bureau_Verified__c = false;
                        }
                    }
                    if (data[i].sobjectType == "Loan_Applicant__c") {
                        data[i].Customer_Type__c = this.customerTypeValue;
                        data[i].Application__c = this.applicationId;
                        data[i].Customer_Information__c = this.accountId;
                        data[i].Verification_Type__c = this.verificationTypeValue;
                        data[i].Residence_City__c = this.city;
                        data[i].Residence_State__c = this.state;
                        data[i].Residence_District__c = this.district;
                        data[i].Created_From__c = this.stageName;
                    }
                    await saveRecord({ dataToInsert: JSON.stringify(data[i]) })
                        .then(result => {
                            console.log('result ', result);
                            if (result) {
                                if (data[i].sobjectType == "Account") {
                                    this.accountId = result;
                                    console.log('account Id ', this.accountId);
                                }
                                else if (this.accountId && data[i].sobjectType == "Loan_Applicant__c") {
                                    console.log('result ', result);
                                    if (result) {
                                        this.loanAppId = result;
                                        var loanAppListIds = [];
                                        if (!this.isRecordEdit) {
                                            loanAppListIds.push(this.loanAppId);
                                            updateKYCOR({ loanAppId: this.loanAppId, recId: this.kycOCRId })
                                                .then(result => {
                                                    console.log('res ', result);
                                                })
                                                .catch(error => {
                                                    console.error('error ', error)
                                                })
                                        }
                                    }
                                    const getLoanApplicantId = new CustomEvent("getapplicantid", {
                                        detail: this.loanAppId,
                                        bubbles: true,
                                        composed: true
                                    });
                                    this.dispatchEvent(getLoanApplicantId);
                                    const getloanapplistid = new CustomEvent("getloanappidlist", {
                                        detail: loanAppListIds,
                                        bubbles: true,
                                        composed: true
                                    });
                                    this.dispatchEvent(getloanapplistid);
                                    console.log('loan app id ', this.loanAppId);
                                    this.fieldsContent = undefined;
                                    this.isSpinnerActive = false;
                                    this.isMobileEdited = false;
                                    if (this.applicationId) {
                                        if (!this.isRecordEdit) {
                                            insertKYCDocuments({
                                                base64: this.base64List,
                                                fileName: this.fileNameList,
                                                appId: this.applicationId
                                            })
                                                .then(result => {
                                                    console.log('docupload ', result);
                                                })
                                                .catch(error => {
                                                    console.log('docupload error ', error);
                                                })
                                            const getAppName = new CustomEvent("appname", {
                                                detail: this.appName,
                                                bubbles: true,
                                                composed: true
                                            });
                                            console.log('dispatch event 4 ', getAppName);
                                            this.dispatchEvent(getAppName);
                                        }
                                        const getAppIdEvent = new CustomEvent("getapplicationid", {
                                            detail: this.applicationId
                                        });
                                        console.log('dispatch event 1 ', getAppIdEvent);
                                        this.dispatchEvent(getAppIdEvent);
                                        const getPreloginIdEvent = new CustomEvent("getpreloginid", {
                                            detail: this.preloginId
                                        });
                                        console.log('dispatch event 2 ', getPreloginIdEvent);
                                        this.dispatchEvent(getPreloginIdEvent);
                                        const hideOCRTable = new CustomEvent("hideocrtable", {
                                            detail: false
                                        });
                                        console.log('dispatch event 3 ', hideOCRTable);
                                        this.dispatchEvent(hideOCRTable);
                                        this.base64List = [];
                                        this.fileNameList = [];
                                        this.isKYCChanged = false;
                                        if (!this.isRecordEdit) {
                                            this.showToast('Success', 'Success', 'Record Saved Successfully!!');
                                            this.closeAction();
                                        }
                                        if (this.isRecordEdit) {
                                            this.showToast('Success', 'Success', 'Record Updated Successfully!!');
                                            this.closeAction();
                                        }
                                        this.isRecordEdit = false;
                                        this.labelSave = 'Save';
                                    }
                                }
                            }
                        })
                        .catch(error => {
                            console.log(error);
                            this.isSpinnerActive = false;
                            this.showToast('Error', 'Error', JSON.stringify(error));
                        });
                }
            } else {
                this.isSpinnerActive = false;
                this.showToast('Error', 'Error', 'Complete Required Field(s).');
            }
        }
        catch (exe) {
            console.error(exe);
        }
    }

    handleSelectedLoanApplicant(event) {
        console.log('Edit called #### ', JSON.stringify(event.detail));
        this.isSpinnerActive = true;
        var recordData = event.detail.recordData;
        if (event.detail.ActionName === 'edit') {
            this.isRecordEdit = true;
            this.recordIds = recordData.Customer_Information_VALUE.replaceAll('/lightning/_classic/', '') + '_' + recordData.Id;
            console.log('recIDS  ', this.recordIds);
            this.objectIdMap['Account'] = recordData.Customer_Information_VALUE.replaceAll('/lightning/_classic/', '');
            this.objectIdMap['Loan_Applicant__c'] = recordData.Id;
            this.getSectionPageContent(this.recordIds);
            this.isSpinnerActive = false;
        }

    }

    handleCancel() {
        console.log('handle cancel called ###', this.isRecordEdit);
        this.fieldsContent = undefined;
        this.base64List = [];
        this.fileNameList = [];
        this.labelSave = 'Save';
        if (!this.isRecordEdit) {
            const callocrtable = new CustomEvent("callocrtable", {
                detail: true
            });
            console.log('callocrtable on cancel ', callocrtable);
            this.dispatchEvent(callocrtable);
        }
        this.isRecordEdit = false;
        this.isKYCChanged = false;
    }

    showtoastmessage(title, variant, message) {
        var selectedEvent = new CustomEvent('showtoastmessage', {
            detail: {
                'title': title,
                'variant': variant,
                'message': message,
            }
        });
        this.dispatchEvent(selectedEvent);
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
        //this.dispatchEvent(new CloseActionScreenEvent());
    }

}