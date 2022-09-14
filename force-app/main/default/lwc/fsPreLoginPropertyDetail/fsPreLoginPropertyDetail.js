import { LightningElement, api, track } from 'lwc';
import saveRecord from '@salesforce/apex/FsPreloginController.saveRecord';
import getMetadtaInfoForm from '@salesforce/apex/FsPreloginController.getMetadtaInfoForm';
import checkTitleDeedNumber from '@salesforce/apex/FsPreloginController.checkTitleDeedNumber';
import getRecordTypeId from '@salesforce/apex/DatabaseUtililty.getRecordTypeId';
import getPropertyOwners from '@salesforce/apex/FetchDataTableRecordsController.getPropertyOwners';
import getPincodeDetails from '@salesforce/apex/DatabaseUtililty.getPincodeDetails';
import createPropertyOwners from '@salesforce/apex/FsPreloginController.createPropertyOwners';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { CloseActionScreenEvent } from 'lightning/actions';

export default class FsPreLoginPropertyDetail extends LightningElement {

    @api applicationId;
    @api recordTypeName;
    @api ownerTypeOption;
    @api loanAppIdList;
    @api stageName;

    @track isSpinnerActive = false;
    @track fieldsContent;
    @track recTypeId;
    @track objectIdMap = { 'Property__c': '' };
    @track propIds = [];
    @track ownerValue;
    @track ownerId;
    @track isOwnerArrived = false;
    @track loanOwner = [];
    @track showPropEditForm = false;
    @track city;
    @track state;
    @track district;
    @track taluka;
    @track isRecordEdit = false;
    @track recordId;
    @track propertyId;
    @track labelSave = 'Save';
    @track isPrimaryApplicant = false;
    @track propOwnerList = [];
    @track titleDeedNumber;
    @track titleDeedNumberEdit;

    connectedCallback() {
        console.log('Application Id ',this.applicationId);
        console.log('loanAppIdList', this.loanAppIdList);
        if (this.recordTypeName)
            this.getRecTypeId();
    }

    todayDate() {
        var today = new Date();
        var dd = today.getDate() - 1;
        var mm = today.getMonth() + 1;
        var yyyy = today.getFullYear();
        var todayDate = yyyy + '-' + mm + '-' + dd;
        return todayDate;
    }

    @api getSectionPageContent(recId) {
        this.isSpinnerActive = true;
        this.showPropEditForm = false;
        try {
            getMetadtaInfoForm({ recordIds: recId, metaDetaName: 'fs_Prelogin_Property_Details' })
                .then(result => {
                    this.fieldsContent = result.data;
                    console.log('field result #### ', JSON.stringify(this.fieldsContent));
                    if (this.fieldsContent)
                        this.showPropEditForm = true;
                    this.isSpinnerActive = false;
                })
                .catch(error => {
                    console.log(error);
                });
        } catch (error) {
            console.log(error);
        }
    }

    @api getIdsOnEdit(propWrap) {
        console.log('get id in prop ', propWrap);
        //this.ownerId = propWrap.loanAppId;
        this.applicationId = propWrap.applicationId;
        this.recordId = propWrap.propId;
        this.isOwnerArrived = false;
        this.isRecordEdit = true;
        this.labelSave = 'Update';
    }

    @api getTitleDeedNumberOnEdit(titleNumber) {
        console.log('titleDeedNumberEdit ' + titleNumber);
        this.titleDeedNumberEdit = titleNumber;
    }

    @api getAllOwners(loanAppIds) {
        console.log('get property owners called!!', loanAppIds);
        this.isOwnerArrived = false;
        getPropertyOwners({ applicantId: loanAppIds }).then(result => {
            console.log('datatable result ', result);
            this.loanOwner = [];
            this.loanOwner = result;
            this.isOwnerArrived = true;
        })
            .catch(error => {
                console.log('error in getpropownersdata ', error);
            })
    }

    handleSelectedApplicant(event) {
        console.log('on selected applicant ', event.detail);
        var proOwners = JSON.parse(JSON.stringify(event.detail));
        this.propOwnerList = [];
        //this.ownerId = '';
        proOwners.forEach(element => {
            this.propOwnerList.push(element.Id)
            if (element.Customer_Type__c === 'Primary Applicant')
                this.isPrimaryApplicant = true;
        });
        //console.log('owner Id ',this.ownerId);
        console.log(this.propOwnerList, 'this.propOwnerList ');
        this.showPropEditForm = false;
        this.getSectionPageContent('');
    }

    handleOwnerChange(event) {
        this.propOwnerList = [];
        event.detail.forEach(element => {
            if (element.split('_').includes('Primary Applicant'))
                this.isPrimaryApplicant = true;
            const str = '_' + element.split('_')[1];
            var id = element.replaceAll(str, '');
            this.propOwnerList.push(id);
        });
        console.log('ownerselect ', this.propOwnerList);
        console.log(this.isPrimaryApplicant);
    }

    getRecTypeId() {
        getRecordTypeId({ sObjectName: 'Property__c', recordTypeName: this.recordTypeName })
            .then(result => {
                if (result) {
                    this.recTypeId = result;
                    console.log('recTypeId ', this.recTypeId);
                }
            })
            .catch(error => {
                console.log('error ', error);
            })
    }

    handleFormValueChange(event) {
        console.log(event.detail);
        this.dataValues = event;
        console.log(this.dataValues);
        var tempFieldsContent = event.detail;
        if (tempFieldsContent.CurrentFieldAPIName === 'Property__c-Title_Deed_Date__c') {
            var _val = tempFieldsContent.CurrentFieldValue;
            console.log(' _val #### ', _val);
            this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setValues('Title_Deed_Date__c', _val)));
        }
        else if (tempFieldsContent.CurrentFieldAPIName === 'Property__c-Pincode__c') {
            console.log('tempFieldsContent.CurrentFieldAPIName ', tempFieldsContent.CurrentFieldValue);
            if (tempFieldsContent.CurrentFieldValue != true)
                this.getAllPincodeDetails(tempFieldsContent.CurrentFieldValue);
            else {
                let genericedit = this.template.querySelector('c-generic-edit-pages-l-w-c');
                this.setValues('City__c', null);
                this.setValues('District__c', null);
                this.setValues('State__c', null);
                this.setValues('Taluka__c', null);
                genericedit.refreshData((this.fieldsContent));
            }
        }
        else if (tempFieldsContent.CurrentFieldAPIName === 'Property__c-Title_Deed_Number__c') {
            this.titleDeedNumber = tempFieldsContent.CurrentFieldValue;
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
                this.setValues('City__c', this.city);
                this.setValues('District__c', this.district);
                this.setValues('State__c', this.state);
                this.setValues('Taluka__c', this.taluka);
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
                    // alert('yes');
                    _tempVar[0].fieldsContent[i].checkboxVal = Boolean(_val);
                } else {
                    if (_tempVar[0].fieldsContent[i].fieldAPIName === 'Title_Deed_Date__c') {
                        // alert('Title_Deed_Date__c');
                        _tempVar[0].fieldsContent[i].maxDate = this.todayDate();
                        _tempVar[0].fieldsContent[i].value = _val;
                    }
                    if (_tempVar[0].fieldsContent[i].fieldAPIName === 'City__c') {
                        // alert('City__c');
                        _tempVar[0].fieldsContent[i].value = _val;
                    }
                    if (_tempVar[0].fieldsContent[i].fieldAPIName === 'District__c') {
                        // alert('District__c');
                        _tempVar[0].fieldsContent[i].value = _val;
                    }
                    if (_tempVar[0].fieldsContent[i].fieldAPIName === 'State__c') {
                        // alert('State__c');
                        _tempVar[0].fieldsContent[i].value = _val;
                    }
                    if (_tempVar[0].fieldsContent[i].fieldAPIName === 'Taluka__c') {
                        // alert('Taluka__c');
                        _tempVar[0].fieldsContent[i].value = _val;
                    }
                }
            }
        }
        this.fieldsContent = JSON.stringify(_tempVar);
        return _tempVar;
    }

    async handleSave() {
        if (this.propOwnerList.length == 0) {
            this.showToast('Error', 'Error', 'Please Add One Owner First!!');
            return;
        }
        var titleDeedExist = false;
        console.log(this.titleDeedNumber + ':: ' + this.titleDeedNumberEdit+' :: '+this.applicationId);
        if (!this.isRecordEdit || (this.isRecordEdit && this.titleDeedNumber != this.titleDeedNumberEdit && this.titleDeedNumber)) {
            await checkTitleDeedNumber({ applicationId: this.applicationId, titleDeedNo: this.titleDeedNumber }).then(result => {
                console.log('checkTitleDeedNumber ', result);
                if (result) {
                    this.showToast('Error', 'Error', 'Duplicate Title Deed Number Found!!');
                    titleDeedExist = true;
                }
                else {
                    titleDeedExist = false;
                }
            })
                .catch(error => {
                    console.log('Error in checkTitleDeedNumber ', error);
                })
            if (titleDeedExist) return;
        }
        if (!titleDeedExist) {
            var data = this.template.querySelector("c-generic-edit-pages-l-w-c").handleOnSave();
            console.log('data #### ', data);
            if (data.length > 0) {
                console.log('Data entry start');
                this.isSpinnerActive = true;
                for (var i = 0; i < data.length; i++) {
                    console.log('i am in', data[i]);
                    if (this.isRecordEdit)
                        data[i].Id = this.recordId;
                    else{
                        data[i].RecordTypeId = this.recTypeId;
                        data[i].Application__c = this.applicationId;
                        data[i].Created_From__c = this.stageName;
                    }
                    data[i].isPrimaryOwner__c = this.isPrimaryApplicant;
                    await saveRecord({ dataToInsert: JSON.stringify(data[i]) })
                        .then(result => {
                            console.log('result ', result);
                            if (result) {
                                this.propIds.push(result);
                                this.propertyId = result;
                                if (!this.isRecordEdit) {
                                    createPropertyOwners({ propertyId: this.propertyId, loanAppList: this.propOwnerList })
                                        .then(dataresult => {
                                            console.log('insert propowner ', dataresult);
                                            this.getAllOwners(this.loanAppIdList)
                                            const getPropData = new CustomEvent('getpropertydata', {
                                                detail: this.applicationId
                                            });
                                            this.dispatchEvent(getPropData);
                                            const getnewpropertyData = new CustomEvent('getnewcreatedpropertydata', {
                                                detail: this.propIds
                                            });
                                            this.dispatchEvent(getnewpropertyData);
                                        })
                                        .catch(error => {
                                            console.log(error);
                                        })
                                }
                            }
                            this.fieldsContent = {};
                            this.propOwnerList = [];
                            this.isOwnerArrived = true;
                            this.isSpinnerActive = false;
                            if (!this.isRecordEdit) {
                                this.showToast('Success', 'Success', 'Record Saved Successfully!!');
                                this.closeAction();
                            }
                            if (this.isRecordEdit) {
                                if(this.applicationId){
                                const getPropData = new CustomEvent('getpropertydata', {
                                    detail: this.applicationId
                                });
                                this.dispatchEvent(getPropData);}
                                this.showToast('Success', 'Success', 'Record Updated Successfully!!');
                                this.closeAction();
                            }
                            this.isRecordEdit = false;
                            this.labelSave = 'Save';
                            this.getSectionPageContent('');
                        })
                        .catch(error => {
                            console.log(error);
                            this.showToast('Error', 'Error', JSON.stringify(error));
                        });
                }
            } else {
                this.showToast('Error', 'Error', 'Complete Required Field(s).');
            }
        }
    }

    handleCancel() {
        console.log('handle cancel called ###');
        this.isOwnerArrived = true;
        this.getSectionPageContent('');
        this.labelSave = 'Save';
        this.isRecordEdit = false;
    }

    showtoastmessage(title, variant, message) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                variant: variant,
                message: message,
            })
        );
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