import { LightningElement, api, track, wire} from 'lwc'; 
import getCharacterData from'@salesforce/apex/FSFivBLwcController.getCharacterData';
import { deleteRecord } from 'lightning/uiRecordApi';
import getAllApplicantMeta from '@salesforce/apex/FSFivBLwcController.getAllApplicantMeta';
import PROPERTY_OBJECT from '@salesforce/schema/Character__c';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import saveRecord from'@salesforce/apex/FSFivBLwcController.saveRecord';
import getSectionContent from '@salesforce/apex/FSFivBLwcController.getSectionContent';
export default class FsFiv_B_Character extends LightningElement {
    @api allLoanApplicant;
    @api rowAction;
    @api applicationId;
    @track isSpinnerActive = true;
    @track tableData;
    @track fieldsContent;
    @track objectIdMap = { 'Character__c': '' };
    @track recordIds;
    @track showDeleteModal = false;
    @track recordIdForDelete;
    @track isApplicantEdit = true;
    @track selectedApplicant;
    @api allApplicantData;
    @track propertyRecordTypeId;
    @track showDeletePopup = false;
    @api verificationStatus;
    @wire(getObjectInfo, { objectApiName: PROPERTY_OBJECT })
    getPropertyObjectData({data, error}){
        if(data){
            var recordTypeData = data.recordTypeInfos;
            this.propertyRecordTypeId = Object.keys(recordTypeData).find(rti => recordTypeData[rti].name === 'FIV-B Character');
        }
    }
    connectedCallback() {
        this.getCharacterData();
        this.verificationStatus == 'Completed' ? true : false;
    }

    getCharacterData() {
        getCharacterData({ allLoanApplicant: this.allLoanApplicant })
        .then(result => {
            console.log('result #### ',result);
            this.tableData = result;
            this.isApplicantEdit = true;
            this.isSpinnerActive = false;
        })
        .catch(error => {

        })
    }
    getSectionPageContent(recId) {
        this.isSpinnerActive = true;
        getSectionContent({ recordIds: recId, metaDetaName: 'Fs_FIV_B_Character' })
        .then(result => {
            this.fieldsContent = result.data;
            this.isSpinnerActive = false;
        })
        .catch(error => {
            console.log(error);
        });
    }

    handleSelectedApplication(event) {
        console.log('Edit called #### ', JSON.stringify(event.detail));
        this.isSpinnerActive = true;
        var recordData = event.detail.recordData;
        if (event.detail.ActionName === 'edit') {
            this.isApplicantEdit = false;
            this.recordIds = recordData.Id;
            this.objectIdMap['Character__c'] = this.recordIds
            this.getSectionPageContent(this.recordIds);
            this.isSpinnerActive = false;
        }
        if (event.detail.ActionName === 'delete') {
            this.recordIdForDelete = event.detail.recordData.Id;
            //this.showDeleteModal = true;
            console.log('Delete Called ');
            this.showDeletePopup = true;
        }
    }
    changedFromChild(event) {
        var tempFieldsContent = event.detail;
        console.log('tempFieldsContent ',JSON.stringify(tempFieldsContent));
    }
    handleSave() {
        var data = this.template.querySelector("c-generic-edit-pages-l-w-c").handleOnSave();
        console.log('data #### ', JSON.stringify(data));
        if (data.length > 0) {
            this.isSpinnerActive = true;
            for (var i = 0; i < data.length; i++) {
                if(this.selectedApplicant === undefined){
                    data[i].Id = this.objectIdMap[data[i].sobjectType];
                } else{
                    data[i].Customer_Information__c = this.selectedApplicant[0].Customer_Information__c;
                    data[i].Loan_Applicant__c = this.selectedApplicant[0].Id;
                    data[i].RecordTypeId = this.propertyRecordTypeId;
                }
                data[i].Is_Fiv_B_Completed__c = true;
                console.log('data 2## ', JSON.stringify(data));
                saveRecord({ dataToInsert: JSON.stringify(data[i]) })
                .then(result => {
                    this.fieldsContent = undefined;
                    this.showtoastmessage('Success', 'Success', result);
                    this.tableData = undefined;
                    this.selectedApplicant = undefined;
                    this.allApplicantData = undefined;
                    this.getCharacterData();
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
    handleDelete(event) {
        this.isSpinnerActive = true;
        let label = event.target.label;
        if (label == 'Yes') {
            this.showDeleteModal = false;
            deleteRecord(this.recordIdForDelete)
            .then(() => {
                this.tableData = undefined;
                this.getCharacterData();
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
    handlemodalactions(event){
        this.showDeletePopup = false;
        if(event.detail === true){
            this.tableData = undefined;
            this.getCharacterData();
        }
    }
    handleRadtioButton(event){
        this.getSectionPageContent();
        this.selectedApplicant = event.detail;
        console.log('event #### ',JSON.stringify(event.detail));
    }
    getAllApplicantMeta(){
        getAllApplicantMeta({ applicationId: this.applicationId })
        .then(result => {
            this.allApplicantData = result;
            this.isSpinnerActive = false;
        })
        .catch(error => {

        })
    }
    setValues(_fieldAPIName,_val){
        var _tempVar = JSON.parse(this.fieldsContent);
        for(var i=0; i<_tempVar[0].fieldsContent.length; i++){
            if(_tempVar[0].fieldsContent[i].fieldAPIName === _fieldAPIName){
                if(_tempVar[0].fieldsContent[i].isCheckbox){
                    _tempVar[0].fieldsContent[i].checkboxVal = Boolean(_val);
                }else{
                    _tempVar[0].fieldsContent[i].value = _val;
                }			
            }
        }
        console.log('_tempVar #### ',_tempVar);
        return _tempVar;
    }
}