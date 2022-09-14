import { LightningElement, api, track } from 'lwc';
import saveRecord from '@salesforce/apex/FsOnlineEc_ControllerHelper.saveRecord';
import getEditPageContent from '@salesforce/apex/FsOnlineEc_ControllerHelper.getEditPageContent';
import getCollateralDetails from '@salesforce/apex/FsOnlineECController.getCollateralDetails';
import getRecordTypeId from '@salesforce/apex/DatabaseUtililty.getRecordTypeId';
import getAllApplicantMeta from '@salesforce/apex/FsOnlineECController.getAllApplicantMeta';
import getPincodeDetails from '@salesforce/apex/DatabaseUtililty.getPincodeDetails';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { CloseActionScreenEvent } from 'lightning/actions';
export default class FsOnlineEcCollateralLWC extends LightningElement {

    @api rowAction;
    @api applicationId;
    @track tableData;
    @track isRecordEdited = false;
    @api recordIds;
    @track sObjectName;
    @track fieldsContent;
    @track recordTypeName;
    @track recordTypeId;
    @track objectIdMap = { 'Property': '' };
    @track isSpinnerActive = false;
    @track showDeletePopup = false;
    @track allApplicantData = [];
    @track selectedApplicant;
    @track showEditPage = false;
    @track isApplicantDataArrived = false;
    @track isPropDataArrived = false;
    @track accountId;
    @track loanApplicant;
    @track city;
    @track state;
    @track district;
    @track taluka;

    connectedCallback() {
        getRecordTypeId({ sObjectName: 'Property__c', recordTypeName: 'Online EC Property Detail' })
            .then(result => {
                this.recordTypeId = result;
                console.log('---recordtypeId---' + this.recordTypeId);
            })
        if (this.applicationId) {
            this.getAllApplicantMetaData();
        }
        this.getCollateralDetails();
    }

    handleRadtioButton(event) {
        this.isSpinnerActive = true;
        this.selectedApplicant = event.detail;
        this.getSectionPageContent('');
        console.log('event #### ', event.detail);
        this.accountId = this.selectedApplicant[0].Customer_Information__c;
        this.applicationId = this.selectedApplicant[0].Application__c;
        this.loanApplicant = this.selectedApplicant[0].Id;
        console.log('id on selection ', this.accountId, this.applicationId, this.loanApplicant);
    }

    getAllApplicantMetaData() {
        this.isApplicantDataArrived = false;
        this.isSpinnerActive = true;
        console.log('appId ', this.applicationId);
        getAllApplicantMeta({ applicationId: this.applicationId })
            .then(result => {
                console.log('metadata ', result);
                this.allApplicantData = result;
                this.isSpinnerActive = false;
                this.isApplicantDataArrived = true;
            })
            .catch(error => {
                this.isApplicantDataArrived = false;
                console.log('error ', error);
            })
    }

    getSectionPageContent(recId) {
        this.showEditPage = false;
        console.log('Called Edit Pages', recId);
        try {
            getEditPageContent({ recordIds: recId, metaDetaName: 'Online_EC_Customer_Information' })
                .then(result => {
                    this.fieldsContent = result.data;
                    this.showEditPage = true;
                    this.isSpinnerActive = false;
                    console.log('field Result ', this.fieldsContent);
                })
                .catch(error => {
                    console.log(error);
                });
        } catch (error) {
            console.log(error);
        }

    }

    handleSelectedApplication(event) {
        this.isApplicantDataArrived = false;
        console.log('Edit called #### ', JSON.stringify(event.detail));
        this.isSpinnerActive = true;
        var recordData = event.detail.recordData;
        this.recordIds = recordData.Id;
        if (event.detail.ActionName === 'edit') {
            this.isSpinnerActive = true;
            this.isRecordEdited = true;
            this.recordIds = recordData.Id;
            this.objectIdMap['Property'] = this.recordIds;
            console.log('Selectedapplicant', this.recordIds);
            this.fieldsContent = undefined;
            this.getSectionPageContent(this.recordIds);
        }
        else if (event.detail.ActionName === 'delete') {
            console.log('Delete Called ');
            this.showDeletePopup = true;
        }
    }

   changedFromChild(event) {
        console.log('event details #### ', JSON.stringify(event.detail));
        var tempFieldsContent = event.detail;
        if (tempFieldsContent.CurrentFieldAPIName === 'Property__c-Title_Deed_Date__c') {
            this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setTitleDeedDateValues('Title_Deed_Date__c')));   
        
        }
        else if (tempFieldsContent.CurrentFieldAPIName === 'Property__c-MS_Pincode__c') {
            console.log('tempFieldsContent.CurrentFieldAPIName ', tempFieldsContent.CurrentFieldValue);
            if (tempFieldsContent.CurrentFieldValue != true)
                this.getAllPincodeDetails(tempFieldsContent.CurrentFieldValue);
            else {
                let genericedit = this.template.querySelector('c-generic-edit-pages-l-w-c');
                this.fieldsContent = (JSON.stringify(this.setValues('City__c', null)));
                this.fieldsContent = (JSON.stringify(this.setValues('District__c', null)));
                this.fieldsContent = (JSON.stringify(this.setValues('State__c', null)));
                this.fieldsContent = (JSON.stringify(this.setValues('Taluka__c', null)));
                genericedit.refreshData((this.fieldsContent));
            }
        }

    }


    async handleSave() {
        var data = this.template.querySelector("c-generic-edit-pages-l-w-c").handleOnSave();
        console.log('data ', data);
        if (data.length > 0) {
            this.isSpinnerActive = true;
            for (var i = 0; i < data.length; i++) {
                console.log('in ', data[i]);
                // if (this.recordIds == null)
                //     data[i].Id = this.objectIdMap[data[i].sobjectType];
                if (this.recordIds)
                    data[i].Id = this.recordIds;
                data[i].Application__c = this.applicationId;
                data[i].RecordTypeId = this.recordTypeId;

                console.log('data[i].RecordTypeId', data[i].RecordTypeId);
                console.log('recorddataid', data[i].RecordTypeId + ' :: ', this.recordTypeId);
                data[i].Customer_Information__c = this.accountId;
                data[i].Loan_Applicant__c = this.loanApplicant;
                data[i].Is_Online_Ec_Completed__c = true;
                console.log('--------RecordTypeId--------', this.recordTypeId);
                console.log('dataaa', data[i].Id + ' :: ', this.recordIds);
                console.log('dataaa', data[i].Id + ' :: ', this.objectIdMap[data[i].sobjectType]);
                saveRecord({ dataToInsert: JSON.stringify(data[i]) })
                    .then(result => {
                        console.log('save online ec ', result);
                        this.fieldsContent = '';
                        this.isSpinnerActive = false;
                        if (result == 'Operation Completed Successfully.') {
                            this.dispatchEvent(
                                new ShowToastEvent({
                                    title: 'Success',
                                    message: 'Record successfully Updated',
                                    variant: 'success',
                                }),
                            );
                            this.showEditPage = false;
                            this.getAllApplicantMetaData();
                            this.getCollateralDetails();
                        }
                    })

                    .catch(error => {
                        console.log(error);
                        this.showtoastmessage('Error', 'Error', JSON.stringify(error));
                    });
            }
        } else {
            this.showtoastmessage('Error', 'Error', 'Complete Required Field(s).');
        }
    }

    handleCancel() {
        console.log('handle cancel called ###');
        this.fieldsContent = undefined;
        this.showEditPage = false;
        this.isApplicantDataArrived = true;
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
        this.dispatchEvent(new CloseActionScreenEvent());
    }

    getCollateralDetails() {
        this.isPropDataArrived = false;
        console.log('::: allLoanApplicant ::: ', JSON.stringify(this.applicationId));
        getCollateralDetails({ applicationId: this.applicationId })
            .then(result => {
                this.tableData = result;
                this.isPropDataArrived = true;
                console.log('Tabledata', JSON.stringify(this.tableData));
            })
            .catch(error => {
                console.log('Error');
            })
    }

    getAllPincodeDetails(pinId) {
        getPincodeDetails({ pinId: pinId })
            .then(result => {
                console.log(result);
                this.city = result.city;
                this.state = result.state;
                this.district = result.district;
                this.taluka = result.taluka;
                let genericedit = this.template.querySelector('c-generic-edit-pages-l-w-c');
                console.log('field ', this.fieldsContent);
                console.log('check ', this.setValues('City__c', this.city));
                this.fieldsContent = (JSON.stringify(this.setValues('City__c', this.city)));
                this.fieldsContent = (JSON.stringify(this.setValues('District__c', this.district)));
                this.fieldsContent = (JSON.stringify(this.setValues('State__c', this.state)));
                this.fieldsContent = (JSON.stringify(this.setValues('Taluka__c', this.taluka)));

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
                    _tempVar[0].fieldsContent[i].value = _val;
                }
            }
        }
        return _tempVar;
    }
    todayDate() {
        var today = new Date();
        var dd = today.getDate() - 1;
        var mm = today.getMonth() + 1;
        var yyyy = today.getFullYear();
        var todayDate = yyyy + '-' + mm + '-' + dd;
        console.log('todayDate ### ', todayDate);
        return todayDate;
    }
     setTitleDeedDateValues(_fieldAPIName) {
        var _tempVar = JSON.parse(this.fieldsContent);
        for (var i = 0; i < _tempVar[0].fieldsContent.length; i++) {
            if (_tempVar[0].fieldsContent[i].fieldAPIName === 'Title_Deed_Date__c') {
                _tempVar[0].fieldsContent[i].maxDate = this.todayDate();

            }
        }
        return _tempVar;
    }
}