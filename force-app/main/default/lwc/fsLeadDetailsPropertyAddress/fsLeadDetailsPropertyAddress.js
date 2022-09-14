import { LightningElement, api, track, wire } from 'lwc';
import saveRecord from'@salesforce/apex/FsLeadDetailsController.saveRecord';
import getSectionContent from '@salesforce/apex/FsLeadDetailsController.getSectionContent';
import getPropertyDetailsData from'@salesforce/apex/FsLeadDetailsControllerHelper.getPropertyDetailsData';
import { deleteRecord } from 'lightning/uiRecordApi';
import getAllApplicantMeta from '@salesforce/apex/FsLeadDetailsControllerHelper.getAllApplicantMeta';
import getPincodeDetails from '@salesforce/apex/DatabaseUtililty.getPincodeDetails';
import PROPERTY_OBJECT from '@salesforce/schema/Property__c';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
export default class FsLeadDetailsPropertyAddress extends LightningElement {
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
    @track tableData;
    @track isRecordEdited = false;
    @track recordIds;
    @track fieldsContent;
    @track objectIdMap = {'Property__c':''};
    @track isSpinnerActive = false;
    @track showDeleteModal = false;
    @track recordIdForDelete;
    @track isApplicantEdit = true;
    @track selectedApplicant;
    @api allApplicantData;
    @api applicationId;
    @track propertyRecordTypeId;
    @track city;
    @track state;
    @track district;
    @track taluka;

    @wire(getObjectInfo, { objectApiName: PROPERTY_OBJECT })
    getPropertyObjectData({data, error}){
        if(data){
            var recordTypeData = data.recordTypeInfos;
            this.propertyRecordTypeId = Object.keys(recordTypeData).find(rti => recordTypeData[rti].name === 'Lead Detail');
        }
    }
    connectedCallback(){
        this.getPropertyDetailsData();
    }
    @api
    refreshAddNewProperty(){
        this.tableData = undefined;
        this.getPropertyDetailsData();
    }
    getPropertyDetailsData(){
        getPropertyDetailsData({applicationId : this.applicationId})
        .then(result => { 
            this.tableData = result;    
            this.isApplicantEdit = true;
        })
        .catch(error => {
            
        })    
    }
    getSectionPageContent(recId){
        this.isSpinnerActive = true;
        getSectionContent({recordIds : recId, metaDetaName : 'Lead_Details_Property_Address'})
        .then(result => {
            this.fieldsContent = result.data;
            this.isSpinnerActive = false;
        })
        .catch(error => {
            console.log(error);
        });
    }
    

    handleSelectedApplication(event){
        console.log('Edit called #### ',JSON.stringify(event.detail));
        this.fieldsContent = undefined;
        var recordData = event.detail.recordData;
        if(event.detail.ActionName === 'edit'){
            this.isSpinnerActive = true;
            this.isRecordEdited = true;    
            this.isApplicantEdit = false;
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
    changedFromChild(event){
        console.log('changedFromChild ### ',JSON.stringify(event.detail));
         var tempFieldsContent = event.detail;
        var tempFieldsContent = event.detail;
        if (tempFieldsContent.CurrentFieldAPIName === 'Property__c-MS_Pincode__c') {
            console.log('tempFieldsContent.CurrentFieldAPIName ', tempFieldsContent.CurrentFieldValue);
            this.getAllPincodeDetails(tempFieldsContent.CurrentFieldValue);
        }

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
    handleSave(){
        this.isSpinnerActive = true;
        var data = this.template.querySelector("c-generic-edit-pages-l-w-c").handleOnSave();
        if(data.length > 0){   
            for(var i=0; i<data.length; i++){
                if(this.selectedApplicant === undefined){
                    data[i].Id = this.objectIdMap[data[i].sobjectType];
                }/* else{
                    data[i].Customer_Information__c = this.selectedApplicant[0].Customer_Information__c;
                    data[i].Loan_Applicant__c = this.selectedApplicant[0].Id;
                    data[i].RecordTypeId = this.propertyRecordTypeId;
                }*/
                saveRecord({dataToInsert : JSON.stringify(data[i])})
                .then(result => {
                    this.fieldsContent = undefined;
                    this.isSpinnerActive = false;
                    this.showtoastmessage('Success','Success',result);
                    this.tableData = undefined;
                    this.selectedApplicant = undefined;
                    this.allApplicantData = undefined;
                    this.getPropertyDetailsData();
                    this.getAllApplicantMeta();
                })
                .catch(error => {
                    console.log(error);
                    this.showtoastmessage('Error','Error',JSON.stringify(error));
                });
            }
        } else{
            this.showtoastmessage('Error','Error','Complete Required Field(s).');
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
    handleRadtioButton(event){
        this.getSectionPageContent();
        this.selectedApplicant = event.detail;
        console.log('event #### ',JSON.stringify(event.detail));
    }
    getAllApplicantMeta(){
        getAllApplicantMeta({ allLoanApplicant: this.allLoanApplicant })
        .then(result => {
            this.allApplicantData = result;
            this.isSpinnerActive = false;
        })
        .catch(error => {

        })
    }
}