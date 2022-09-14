import { LightningElement, api, track, wire } from 'lwc';
import getMetadtaInfoForm from '@salesforce/apex/FsPreloginController.getMetadtaInfoForm';
import saveRecord from '@salesforce/apex/FsPreloginController.saveRecord';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import PROPERTY_OBJECT from '@salesforce/schema/Property__c';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getPincodeDetails from '@salesforce/apex/DatabaseUtililty.getPincodeDetails';
import createPropertyOwners from '@salesforce/apex/FsPreloginController.createPropertyOwners';
export default class FsAddNewProperty extends LightningElement {
    @api recordTypeName;
    @api applicationId
    @api propertyAllData;
    @track propOwnerList = [];
    @track fieldsContent;
    @track showPropEditForm;
    @track isEditFormActive = true;
    @track isSpinnerActive = false;
    @track isPrimaryApplicant = false;
    @track propertyRecordTypeId;
    @wire(getObjectInfo, { objectApiName: PROPERTY_OBJECT })
    getPropertyObjectData({ data, error }) {
        if (data) {
            var recordTypeData = data.recordTypeInfos;
            this.propertyRecordTypeId = Object.keys(recordTypeData).find(rti => recordTypeData[rti].name === 'Lead Detail');
        }
    }

    connectedCallback() {
        this.recordTypeName = 'Lead Detail';
        console.log('called ', this.propertyAllData);
    }
    handleSelectedApplicant(event) {
        console.log('on selected applicant ', event.detail);
        this.isSpinnerActive = true;
        var proOwners = JSON.parse(JSON.stringify(event.detail));
        this.propOwnerList = [];
        proOwners.forEach(element => {
            this.propOwnerList.push(element.Id)
            if (element.Customer_Type__c === 'Primary Applicant')
                this.isPrimaryApplicant = true;
        });
        console.log(this.propOwnerList, 'this.propOwnerList ');
        this.getSectionPageContent('');
    }
    getSectionPageContent(recId) {
        this.showPropEditForm = false;
        try {
            getMetadtaInfoForm({ recordIds: recId, metaDetaName: 'fs_Prelogin_Property_Details' })
                .then(result => {
                    this.fieldsContent = result.data;
                    console.log('field result #### ', JSON.stringify(this.fieldsContent));
                    if (this.fieldsContent)
                        this.showPropEditForm = true;
                        this.isSpinnerActive = false;
                        this.isEditFormActive = false;
                })
                .catch(error => {
                    console.log(error);
                });
        } catch (error) {
            console.log(error);
        }
    }
    async handleSave() {
        if (this.propOwnerList.length == 0) {
            this.showtoastmessage('Error', 'Error', 'Please Add One Applicant First!!');
            return;
        }
        var data = this.template.querySelector("c-generic-edit-pages-l-w-c").handleOnSave();
        console.log('data #### ', data);
        if (data.length > 0) {
            console.log('Data entry start');
            this.isSpinnerActive = true;
            for (var i = 0; i < data.length; i++) {
                data[i].RecordTypeId = this.propertyRecordTypeId;
                data[i].Application__c = this.applicationId;
                data[i].isPrimaryOwner__c = this.isPrimaryApplicant;
                await saveRecord({ dataToInsert: JSON.stringify(data[i]) })
                    .then(result => {
                        console.log('result ', result);
                        if (result) {
                            if (!this.isRecordEdit) {
                                createPropertyOwners({ propertyId: result, loanAppList: this.propOwnerList })
                                    .then(dataresult => {
                                        this.showPropEditForm = false;
                                        this.isSpinnerActive = false;
                                        this.showtoastmessage('Success', 'Success', 'Property Added Successfully.');
                                        this.dispatchEvent(new CustomEvent('getpropertydata'));
                                    })
                                    .catch(error => {
                                        console.log(error);
                                    })
                            }
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
    handleFormValueChange(event) {
        console.log(event.detail);
        var tempFieldsContent = event.detail;
        if(tempFieldsContent.CurrentFieldAPIName === 'Property__c-Title_Deed_Date__c'){
            var d1 = new Date();
            var d2 = new Date(tempFieldsContent.CurrentFieldValue);
            console.log('date1 ',d1+' :: '+d2);
            if (d2.getTime() > d1.getTime()) {
                console.log('date2 ',d2);
                this.showToast('Error', 'error', 'Invalid Date, Future Dates Are Not Allowed!!');
                //this.closeAction();
                this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setValues('Title_Deed_Date__c',null)));   
            }
        }
        else if(tempFieldsContent.CurrentFieldAPIName === 'Property__c-Pincode__c'){
            console.log('tempFieldsContent.CurrentFieldAPIName ',tempFieldsContent.CurrentFieldValue);
            if(tempFieldsContent.CurrentFieldValue != true)
                this.getAllPincodeDetails(tempFieldsContent.CurrentFieldValue);
            else{
                let genericedit = this.template.querySelector('c-generic-edit-pages-l-w-c');
                this.fieldsContent = (JSON.stringify(this.setValues('City__c',null)));
                this.fieldsContent = (JSON.stringify(this.setValues('District__c',null)));
                this.fieldsContent = (JSON.stringify(this.setValues('State__c',null)));
                this.fieldsContent = (JSON.stringify(this.setValues('Taluka__c',null)));
                genericedit.refreshData((this.fieldsContent));  
            }
        }
    }
    getAllPincodeDetails(pinId){
        getPincodeDetails({ pinId: pinId })
            .then(result => {
                console.log(result);
                this.city = result.city;
                this.state = result.state;
                this.district = result.district;
                this.taluka = result.taluka;
                let genericedit = this.template.querySelector('c-generic-edit-pages-l-w-c');
                console.log('field ',this.fieldsContent);
                console.log('check ',this.setValues('City__c',this.city));
                this.fieldsContent = (JSON.stringify(this.setValues('City__c',this.city)));
                this.fieldsContent = (JSON.stringify(this.setValues('District__c',this.district)));
                this.fieldsContent = (JSON.stringify(this.setValues('State__c',this.state)));
                this.fieldsContent = (JSON.stringify(this.setValues('Taluka__c',this.taluka)));
                genericedit.refreshData((this.fieldsContent));    
            })
            .catch(error => {
                console.log(error);
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
        return _tempVar;
    }
    handleCancel() {
        this.dispatchEvent(new CustomEvent('addpropertyclose'));
    }
    showtoastmessage(title, variant, message){
        var selectedEvent = new CustomEvent('showtoastmessage', { 
            detail : {
                'title':title,
                'variant':variant,
                'message':message,
            }
        });    
        this.dispatchEvent(selectedEvent);
    }
}