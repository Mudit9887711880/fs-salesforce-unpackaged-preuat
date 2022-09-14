import { LightningElement, api, track, wire } from 'lwc';
import saveRecord from '@salesforce/apex/FsLeadDetailsController.saveRecord';
import getSectionContent from '@salesforce/apex/FsLeadDetailsController.getSectionContent';
import getPropertyDetailsData from '@salesforce/apex/FsLeadDetailsControllerHelper.getPropertyDetailsData';
import { deleteRecord } from 'lightning/uiRecordApi';
import getAllApplicantMeta from '@salesforce/apex/FsLeadDetailsControllerHelper.getAllApplicantMeta';
import PROPERTY_OBJECT from '@salesforce/schema/Property__c';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { CloseActionScreenEvent } from 'lightning/actions';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';


export default class FsLeadDetailsPropertyDetails extends LightningElement {
    @track rowAction = [
        {
            //label: 'Edit',
            type: 'button-icon',
            fixedWidth: 50,
            typeAttributes: {
                iconName: 'utility:edit',
                title: 'Edit',
                variant: 'border-filled',
                alternativeText: 'Edit',
                name: 'edit'
            }
        }
    ]
    @api allLoanApplicant;
    @api applicationId;
    @track tableData;
    @track isRecordEdited = false;
    @track recordIds;
    @track fieldsContent;
    @track objectIdMap = { 'Property__c': '' };
    @track isSpinnerActive = false;
    @track showDeleteModal = false;
    @track recordIdForDelete;
    @track isApplicantEdit = true;
    @track selectedApplicant;
    @api allApplicantData;
    @track propertyRecordTypeId;
    @wire(getObjectInfo, { objectApiName: PROPERTY_OBJECT })
    getPropertyObjectData({ data, error }) {
        if (data) {
            var recordTypeData = data.recordTypeInfos;
            this.propertyRecordTypeId = Object.keys(recordTypeData).find(rti => recordTypeData[rti].name === 'Lead Detail');
        }
    }
    connectedCallback() {
        this.getPropertyDetailsData();
    }
    @api 
    getPropertyVal(){
        console.log('test ### '+this.tableData);
        var checkLoanType = true;
        var temp = JSON.parse(this.tableData.strDataTableData);
        if (temp.length == 0){
            checkLoanType = false;
        }
        const checkValidEmp = new CustomEvent("checkpropertyvalidation", {
            detail: checkLoanType
        });
        this.dispatchEvent(checkValidEmp);
    }
    @api
    refreshAddNewProperty(){
        this.tableData = undefined;
        this.getPropertyDetailsData();
    }
    getPropertyDetailsData() {
        console.log('called ####');
        getPropertyDetailsData({ applicationId: this.applicationId })
            .then(result => {
                console.log('called #### result ',result);
                this.tableData = result;
                this.isApplicantEdit = true;
            })
            .catch(error => {

            })
    }
    todayDate(){
        var today = new Date();
        var dd = today.getDate() - 1;
        var mm = today.getMonth() + 1;
        var yyyy = today.getFullYear();
        var todayDate = yyyy + '-' + mm + '-' + dd;
        return todayDate;
    }
    getSectionPageContent(recId) {
        var todayDate = this.todayDate();
        this.isSpinnerActive = true;
        getSectionContent({ recordIds: recId, metaDetaName: 'Lead_Details_Property_Details' })
            .then(result => {
                this.fieldsContent = result.data;
                this.isSpinnerActive = false;
                setTimeout(() => {
                    var _tempVar = JSON.parse(this.fieldsContent);
                    for (var i = 0; i < _tempVar[0].fieldsContent.length; i++) {
                        if (_tempVar[0].fieldsContent[i].fieldAPIName === 'Title_Deed_Date__c') {
                            _tempVar[0].fieldsContent[i].maxDate = todayDate;
                            break;
                        }
                    }  
                    this.fieldsContent = _tempVar;  
                    this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.fieldsContent)); 
                }, 500);    
            })
            .catch(error => {
                console.log(error);
            });
    }

    
    handleSelectedApplication(event) {
        console.log('Edit called #### ', JSON.stringify(event.detail));
        this.fieldsContent = undefined;
        var recordData = event.detail.recordData;
        if (event.detail.ActionName === 'edit') {
            this.isSpinnerActive = true;
            this.isApplicantEdit = false;
            this.isRecordEdited = true;
            this.recordIds = recordData.Id;
            this.objectIdMap['Property__c'] = recordData.Id;
            this.getSectionPageContent(this.recordIds);
            this.isSpinnerActive = false;
        }
        if (event.detail.ActionName === 'delete') {
            this.recordIdForDelete = event.detail.recordData.Id;
            this.showDeleteModal = true;
        }
    }
    changedFromChild(event) {
        /*console.log('changedFromChild ### ', JSON.stringify(event.detail));
        this.dataValues = event;
        console.log(this.dataValues);
        var tempFieldsContent = event.detail;
        if (tempFieldsContent.CurrentFieldAPIName === 'Property__c-Title_Deed_Date__c') {
            var d1 = new Date().toISOString().substr(0, 10)
            var d2 = new Date(tempFieldsContent.CurrentFieldValue).toISOString().substr(0, 10);
            console.log('date1 ', d1 + ' :: ' + d2);
            if (d2 >= d1) {
                console.log('date2 ', d2);
                this.showToast('Error', 'error', 'Invalid Date, Future Dates Are Not Allowed!!');
                this.closeAction();
                //var dateVal = null;
                let genericedit = this.template.querySelector('c-generic-edit-pages-l-w-c');
                this.fieldsContent = (JSON.stringify(this.setValues('Title_Deed_Date__c', undefined)));
                console.log('this.fieldsContent  ', JSON.parse(this.fieldsContent));
                genericedit.refreshData((this.fieldsContent));
                //this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setValues('Title_Deed_Date__c',null)));   
            }
        }*/
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
    closeAction() {
        this.dispatchEvent(new CloseActionScreenEvent());
    }
    handleSave() {
        var data = this.template.querySelector("c-generic-edit-pages-l-w-c").handleOnSave();
        if (data.length > 0) {
            this.isSpinnerActive = true;
            for (var i = 0; i < data.length; i++) {
                if (this.selectedApplicant === undefined) {
                    data[i].Id = this.objectIdMap[data[i].sobjectType];
                } /*else{
                data[i].Customer_Information__c = this.selectedApplicant[0].Customer_Information__c;
                data[i].Loan_Applicant__c = this.selectedApplicant[0].Id;
                data[i].RecordTypeId = this.propertyRecordTypeId;
            }*/
                saveRecord({ dataToInsert: JSON.stringify(data[i]) })
                    .then(result => {
                        this.fieldsContent = undefined;
                        this.isSpinnerActive = false;
                        this.showtoastmessage('Success', 'Success', result);
                        this.tableData = undefined;
                        this.selectedApplicant = undefined;
                        this.allApplicantData = undefined;
                        this.getPropertyDetailsData();
                        this.getAllApplicantMeta();
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
        this.isApplicantEdit = true;
        this.allApplicantData = undefined;
        this.getAllApplicantMeta();
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
    handleDelete(event) {
        this.isSpinnerActive = true;
        let label = event.target.label;
        if (label == 'Yes') {
            this.showDeleteModal = false;
            deleteRecord(this.recordIdForDelete)
                .then(() => {
                    this.tableData = undefined;
                    this.getPropertyDetailsData();
                    this.isSpinnerActive = false;
                })
                .catch(error => {
                    console.log(error);
                });
        } else if (label == 'No') {
            this.showDeleteModal = false;
            this.isSpinnerActive = false;
        }
    }
    handleRadtioButton(event) {
        this.getSectionPageContent();
        this.selectedApplicant = event.detail;
        console.log('event #### ', JSON.stringify(event.detail));
    }
    getAllApplicantMeta() {
        getAllApplicantMeta({ applicationId: this.applicationId })
            .then(result => {
                this.allApplicantData = result;
                this.isSpinnerActive = false;
            })
            .catch(error => {

            })
    }
}