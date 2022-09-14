import { LightningElement, track, api, wire } from 'lwc';
import getLastLoginDate from '@salesforce/apex/DatabaseUtililty.getLastLoginDate';
import CUSTODY_OBJECT from '@salesforce/schema/Custody__c';
import FILEINWARDSTATUS from '@salesforce/schema/Custody__c.File_Inward_Status__c';
import STORAGEVENDORNAME from '@salesforce/schema/Custody__c.Storage_Vendor_Name__c';
import FILESTATUS from '@salesforce/schema/Custody__c.File_Status__c';
import NAME from '@salesforce/schema/Application__c.Name';
import { getRecord } from 'lightning/uiRecordApi';
import createRecords from '@salesforce/apex/FsCustodyController.createRecords';
import getUsers from '@salesforce/apex/FsCustodyController.getUsers';
import getRepaymentDoc from '@salesforce/apex/FsCustodyController.getRepaymentDoc';
import getSource from '@salesforce/apex/FsCustodyController.getSource';
import getExistingRecord from '@salesforce/apex/FsCustodyController.getExistingRecord';
import getAccess from '@salesforce/apex/FsCustodyController.getAccess';
import BusinessDate from '@salesforce/label/c.Business_Date';
import DocChecker from '@salesforce/label/c.Custody_Document_Checker_Required';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';





export default class FsCustodyLWC extends NavigationMixin(LightningElement) {
    @api recordId;
    @track lastLoginDate;
    @track todaysDate = BusinessDate;
    @track documentChecker = DocChecker;
    @api applicationNo = 'App-101';
    @track fileinwardPicklistValues = [];
    @track sourcepik = [];
    @track applicationName;
    @track createCustody = true;
    @track storageVendorPicklistValues = [];
    @track fileStatusPicklistValues = [];
    @track showfooter = false;
    @track tabName;
    @track isSpinner = true;
    @api custId;
    @track isloaded = false;
    @track sourceName;
    @track showerrorcustomer = false;
    @track showerrorApp = false;
    @track showerrorBranch = false;
    @track showerrorMakerId = false;
    @track showerrorCheckrId = false;
    @track fileInwardUser = false;
    @track custodyStorageUser = false;
    @track checkerUser = false;
    @track makerUser = false;
    @track docId;
    @track loanAppName;
    @track disval = false;
    

    @track wrpObj = {
        Id: undefined,
        Loan_Account_Number__c: undefined,
        State__c: undefined,
        Old_Application_Number__c: undefined,
        File_Inward_Status__c: undefined,
        Disbursement_Date__c: undefined,
        Stage_in_Date__c: undefined,
        Application_Type__c: undefined,
        Remarks__c: undefined,
        Maker__c: undefined,                 //maker remarks
        Checker_Remarks__c: undefined,
        Handoff_Date__c: undefined,
        File__c: undefined,                  //file bar code
        Box_Bar_Code__c: undefined,
        Storage_Vendor_Name__c: undefined,
        File_Status__c: undefined,
        Application_Number__c: undefined,
        Branch_Name__c: undefined,
        Customer_Name__c: undefined,
        Checker_Id__c: undefined,
        Maker_Id__c: undefined,
    };

    @track currentDate;

    connectedCallback() {
        this.currentDate = new Date().toISOString();
        this.wrpObj.Application_Number__c = this.recordId;
        this.wrpObj.Old_Application_Number__c=this.recordId;


        if (this.recordId) {
            getExistingRecord({ recordId: this.recordId }).then((result) => {
                console.log('record id >>' + this.recordId);
                console.log('inside record')
                console.log('getExistingRecord>>> ', result);
                if (result) {
                    this.wrpObj = JSON.parse(JSON.stringify(result));
                    console.log('WrpObj', this.wrpObj);
                    console.log('customer_NAME', this.wrpObj.Customer_Name__c);
                    this.isloaded = true;
                } else {
                    this.isloaded = true;
                    if (!this.wrpObj.Old_Application_Number__c) {
                        this.showerrorOldApp = true;
                    }
                }
            }).catch((err) => {
                this.isloaded = true;
                console.log('Error in getExistingRecord= ', err);
            });
        } else {
            this.isloaded = true;
        }



        getSource({ recordId: this.recordId }).then((result) => {

            if (result) {
                const appSource = result.split("#");

                if (!this.wrpObj.Branch_Name__c) {
                    if (appSource[0] !== 'null') {
                        this.wrpObj.Branch_Name__c = appSource[0];
                    } else {
                        this.showerrorBranch = true;
                    }
                }

                if (!this.wrpObj.State__c) {
                    if (appSource[1] !== 'null') {
                        this.wrpObj.State__c = appSource[1];
                    }
                }
                if (!this.wrpObj.Application_Type__c) {
                    this.wrpObj.Application_Type__c = appSource[2];
                }

                if (!this.wrpObj.Customer_Name__c) {
                    if (appSource[3] !== 'null' && appSource[3] != "") {
                        this.wrpObj.Customer_Name__c = appSource[3];
                        this.custId = appSource[3];
                    } else {
                        this.showerrorcustomer = true;
                    }

                } else {
                    this.custId = this.wrpObj.Customer_Name__c;
                }
            }
        }).catch((err) => {
            console.log('Error in getExistingRecord= ', err);
        });

        getUsers().then((result) => {
            if (result) {
                const myArray = result.split("#");

                if (!this.wrpObj.Checker_Id__c) {
                    this.wrpObj.Checker_Id__c = myArray[0];
                }
                if (!this.wrpObj.Maker_Id__c) {
                    this.wrpObj.Maker_Id__c = myArray[1];
                }
            }
        }).catch((err) => {
            console.log('Error in getExistingRecord= ', err);
        });



        


        getAccess().then((result) => {
            if (result != '') {
                var checkUser = result;
                if(checkUser === 'admin'){
                    this.tabName = 'FileInward';
                    this.fileInwardUser = true;
                    this.checkerUser = true;
                    this.makerUser = true;
                    this.custodyStorageUser = true;
                }
                else if (checkUser === 'fileInward') {
                    this.tabName = 'FileInward';
                    this.fileInwardUser = true;
                } else if (typeof this.wrpObj.Id != 'undefined' && this.wrpObj.Id != "" && this.wrpObj.Id != null) {
                    if (checkUser === 'custodyStorage') {
                        if (typeof this.wrpObj.Checker_Remarks__c != 'undefined' && this.wrpObj.Checker_Remarks__c != "") {
                            this.tabName = 'VendorHandoff';
                            this.custodyStorageUser = true;
                        }
                    } else if (checkUser === 'vdc') {
                        
                        if (this.documentChecker ==='true') {
                            this.tabName = 'VDC';
                            this.checkerUser = true;
                            this.makerUser = true;
                        }
                    } else if (checkUser === 'doc') {
                        this.tabName = 'VDC';
                        this.makerUser = true;
                        this.checkerUser = true;
                    }
                }
            }

        }).catch((err) => {
            console.log('Error in getExistingRecord= ', err);
        });

        this.handleGetLastLoginDate();
    }

    // This Method Is Used To Get User's Last Login Date From Server Side.
    handleGetLastLoginDate() {
        getLastLoginDate().then((result) => {
            console.log('getLastLoginDate= ', result);
            this.lastLoginDate = result
        }).catch((err) => {
            console.log('Error in getLastLoginDate= ', err);
        });
    }
    @wire(getObjectInfo, { objectApiName: CUSTODY_OBJECT })
    objectInfo;

    @wire(getPicklistValues, {
        recordTypeId: '$objectInfo.data.defaultRecordTypeId',
        fieldApiName: FILEINWARDSTATUS
    })
    wiredFILEINWARDSTATUSPickListValues({ error, data }) {
        if (data) {
            console.log('gender' + JSON.stringify(data));
            this.fileinwardPicklistValues = [{ label: 'None', value: '' }, ...data.values];
        } else if (error) {
            this.fileinwardPicklistValues = undefined;
            console.log('Picklist values are ${error}');
        }
    }

    @wire(getPicklistValues, {
        recordTypeId: '$objectInfo.data.defaultRecordTypeId',
        fieldApiName: STORAGEVENDORNAME
    })
    wiredSTORAGEVENDORNAMEPickListValues({ error, data }) {
        if (data) {
            console.log('gender' + JSON.stringify(data));
            this.storageVendorPicklistValues = [{ label: 'None', value: '' }, ...data.values];
        } else if (error) {
            this.storageVendorPicklistValues = undefined;
            console.log('Picklist values are ${error}');
        }
    }

    @wire(getPicklistValues, {
        recordTypeId: '$objectInfo.data.defaultRecordTypeId',
        fieldApiName: FILESTATUS
    })
    wiredFILESTATUSPickListValues({ error, data }) {
        if (data) {
            console.log('gender' + JSON.stringify(data));
            this.fileStatusPicklistValues = [{ label: 'None', value: '' }, ...data.values];
        } else if (error) {
            this.fileStatusPicklistValues = undefined;
            console.log('Picklist values are ${error}');
        }
    }

    @wire(getRecord, { recordId: '$recordId', fields: [NAME] })
    applicationDetails({ error, data }) {
        console.log('applicationDetails= ', data);
        if (data) {
            this.applicationName = data.fields.Name.value;
        } else if (error) {
            console.log('error in getting applicationDetails = ', error);
        }
    }








    handleActive(event) {
        this.tabName = event.target.value;
        if (this.tabName === 'VendorHandoff') {
            this.showfooter = true;
        } else {
            this.showfooter = false;
        }
    }

    handleFormValues(event) {
        this.wrpObj[event.target.name] = event.target.value;
        this.createCustody = true;
    }

    handleOnChangeApp(event) {
        this.wrpObj.Application_Number__c = event.detail;
        this.createCustody = true;
        this.showerrorApp = false;
        console.log('this.wrpObj >>>' + JSON.stringify(this.wrpObj));

    }

    handleOnChangeOldApp(event) {

        try {
            //console.log('detail is >>'+event.detail);
            this.wrpObj.Old_Application_Number__c = event.detail;
            this.createCustody = true;
            console.log('this.wrpObj >>>' + JSON.stringify(this.wrpObj));
        } catch (err) {

            console.log('err is>>' + err.message);
            console.log('detail is >>' + event.detail);
        }

    }


    handleOnChangeBranch(event) {
        this.wrpObj.Branch_Name__c = event.detail;
        this.createCustody = true;
        this.showerrorBranch = false;
        console.log('this.wrpObj >>>' + JSON.stringify(this.wrpObj));

    }
    handleOnChangeCustomerName(event) {
        this.wrpObj.Customer_Name__c = event.detail;
        this.createCustody = true;
        this.showerrorcustomer = false;
        console.log('this.wrpObj >>>' + JSON.stringify(this.wrpObj));

    }
    handleOnChangeChecker(event) {
        this.wrpObj.Checker_Id__c = event.detail;
        this.createCustody = true;
        this.showerrorCheckrId = false;
        console.log('this.wrpObj >>>' + JSON.stringify(this.wrpObj));

    }
    handleOnChangeMaker(event) {
        this.wrpObj.Maker_Id__c = event.detail;
        this.showerrorMakerId = false;
        this.createCustody = true;
        console.log('this.wrpObj >>>' + JSON.stringify(this.wrpObj));

    }
    removehandleOnChangeCust() {
        this.showerrorcustomer = true;
    }
    removehandleOnChangeOldApp() {
        this.showerrorOldApp = true;
    }

    removehandleOnChangeApp() {
        this.showerrorApp = true;
    }

    removehandleOnChangeMaker() {
        this.showerrorMakerId = true;
    }

    removehandleOnChangeChecker() {
        this.showerrorCheckrId = true;
    }

    removehandleOnChangeBranch() {
        this.showerrorBranch = true;
    }

    handleCheckValidity() {
        const allValid1 = [
            ...this.template.querySelectorAll('lightning-input'),
        ].reduce((validSoFar, inputCmp) => {
            inputCmp.reportValidity();
            return validSoFar && inputCmp.checkValidity();
        }, true);
        const allValid2 = [
            ...this.template.querySelectorAll('lightning-combobox'),
        ].reduce((validSoFar, inputCmp) => {
            inputCmp.reportValidity();
            return validSoFar && inputCmp.checkValidity();
        }, true);
        const allValid3 = [
            ...this.template.querySelectorAll('lightning-dual-listbox'),
        ].reduce((validSoFar, inputCmp) => {
            inputCmp.reportValidity();
            return validSoFar && inputCmp.checkValidity();
        }, true);
        const allValid4 = [
            ...this.template.querySelectorAll('lightning-textarea'),
        ].reduce((validSoFar, inputCmp) => {
            inputCmp.reportValidity();
            return validSoFar && inputCmp.checkValidity();
        }, true);
        return (allValid1 && allValid2 && allValid3 && allValid4);
    }

    handleletterpdf() {
        this[NavigationMixin.GenerateUrl]({
            type: 'standard__webPage',
            attributes: {
                url: '/apex/Welcome_Letter?id=' + this.recordId
            }
        }).then(generatedUrl => {
            window.open(generatedUrl);
        });
    }

    handlerepaymentpdf() {

        getRepaymentDoc({ recordId: this.recordId }).then((result) => {
           
            this.docId = result;
            
            if (this.docId) {
                this[NavigationMixin.Navigate]({
                    type: 'standard__namedPage',
                    attributes: {
                        pageName: 'filePreview'
                    },
                    state: {
                        recordIds: this.docId
                    }
                });

            } else {

                this.showToast('Error', 'FILE not found', 'error');
            }
        }).catch((err) => {
            console.log('Error in getExistingRecord= ', err);
        });
    }





    handleSave() {
        this.isShowSpinner = false;
        let allValid = this.handleCheckValidity();
        if (!allValid) {
            return;
        }
        console.log('app' + this.showerrorApp);
        console.log('app' + this.showerrorcustomer);
        console.log('app' + this.showerrorBranch);
        if ((this.tabName === 'VendorHandoff') || (this.tabName === 'VDC' && this.showerrorCheckrId == false && this.showerrorMakerId == false) || (this.tabName === 'FileInward' && this.showerrorcustomer == false && this.showerrorApp == false && this.showerrorBranch == false)) {

            this.isSpinner = false;
            console.log('id wrap is >>' + this.wrpObj.Id);
            var tempCourierObject = {
                Id: this.wrpObj.Id,
                Loan_Account_Number__c: this.wrpObj.Loan_Account_Number__c,
                State__c: this.wrpObj.State__c,
                Old_Application_Number__c: this.wrpObj.Old_Application_Number__c,
                File_Inward_Status__c: this.wrpObj.File_Inward_Status__c,
                Disbursement_Date__c: this.wrpObj.Disbursement_Date__c,
                Stage_in_Date__c: this.wrpObj.Stage_in_Date__c,
                Application_Type__c: this.wrpObj.Application_Type__c,
                Remarks__c: this.wrpObj.Remarks__c,
                Maker__c: this.wrpObj.Maker__c,
                Checker_Remarks__c: this.wrpObj.Checker_Remarks__c,
                Handoff_Date__c: this.wrpObj.Handoff_Date__c,
                File__c: this.wrpObj.File__c,
                Box_Bar_Code__c: this.wrpObj.Box_Bar_Code__c,
                Storage_Vendor_Name__c: this.wrpObj.Storage_Vendor_Name__c,
                File_Status__c: this.wrpObj.File_Status__c,
                Application_Number__c: this.wrpObj.Application_Number__c,
                Branch_Name__c: this.wrpObj.Branch_Name__c,
                Customer_Name__c: this.wrpObj.Customer_Name__c,
                Checker_Id__c: this.wrpObj.Checker_Id__c,
                Maker_Id__c: this.wrpObj.Maker_Id__c,
            };
            createRecords({ wrpObject: JSON.stringify(tempCourierObject) })
                .then(result => {
                    console.log('result', result);
                    this.isSpinner = true;
                    this.wrpObj.Id = result;
                    this.showToast('Success', 'Record saved successfully', 'success');
                    console.log('this.recordId', this.recordId);
                    setTimeout(() => {
                        eval("$A.get('e.force:refreshView').fire();");
                    }, 1);

                })
                .catch(error => {
                    this.showToast('Error', error, 'error');
                    console.log('Error', error);
                    this.isSpinner = true;
                });
        }
    }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(event);

    }
}