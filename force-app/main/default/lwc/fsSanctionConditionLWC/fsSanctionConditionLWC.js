import { LightningElement, api, wire, track } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import { deleteRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import SANCTION_CONDITION_OBJECT from '@salesforce/schema/Sanction_Condition__c';
import { getObjectInfo, getPicklistValues } from 'lightning/uiObjectInfoApi';
import PRINT_IN_SANCTION_FIELD from "@salesforce/schema/Sanction_Condition__c.Print_In_Sanction_Letter__c";
import getSanctionConditionTableData from '@salesforce/apex/fsSanctionConditionLWCController.getSanctionConditionTableData';
import saveSanctionConditions from '@salesforce/apex/fsSanctionConditionLWCController.saveSanctionConditions';
export default class FsSanctionConditionLWC extends LightningElement {

    @api applicationId;
    @api source;

    @track sanctionConditionData;
    @track sanctionMap = new Map();
    @track sanctionSpinner = false;
    @track availableSanctionOptions;
    @track isACUser = false;
    @track isDisabled = true;
    @track sanctionMapNew = {};
    printInSanctionValues;
    sanctionOptions;
    _wiredResult;



    // importing the  fields from Sanction_Condition__c 
    @wire(getObjectInfo, { objectApiName: SANCTION_CONDITION_OBJECT })
    objectInfo;

    @wire(getPicklistValues, { recordTypeId: '$objectInfo.data.defaultRecordTypeId', fieldApiName: PRINT_IN_SANCTION_FIELD })
    considertype({ data, error }) {
        if (data) {
            this.printInSanctionValues = data.values;
        } else if (error) {
            console.log(error);
        }
    }

    connectedCallback() {
        console.log('applicationId', this.applicationId, 'SOurce name', this.source);
        if (this.source == 'Approval Credit')
            this.isACUser = true;
    }


    handleChange(event) {
        let Index = event.currentTarget.dataset.index;
        let value = event.target.value;


        console.log('value', value);
        console.log('Sanction Map', this.sanctionMap);
        if (event.target.name == 'Sanction Condition') {
            if (Object.keys(this.availableSanctionOptions).length == 0) {
                let temp = JSON.parse(JSON.stringify(this.sanctionMapNew))
                temp[Index] = event.target.value;
                this.sanctionMapNew = JSON.parse(JSON.stringify(temp));
                console.log('sanctionMapNew = ', JSON.parse(JSON.stringify(this.sanctionMapNew)));
                for (let keyValue of Object.keys(this.sanctionMapNew)) {
                    let cmp = this.template.querySelectorAll('.Sanction')[keyValue];
                    if (cmp) {
                        cmp.setCustomValidity('');
                        cmp.reportValidity();
                    }
                }
                for (let keyValue of Object.keys(this.sanctionMapNew)) {
                    for (let keyValueInner of Object.keys(this.sanctionMapNew)) {
                        if (keyValue != keyValueInner && this.sanctionMapNew[keyValue] == this.sanctionMapNew[keyValueInner]) {
                            console.log(keyValue, 'Data is matching with = ', keyValueInner);
                            let cmp = this.template.querySelectorAll('.Sanction')[keyValue];
                            console.log('Component = ', cmp);
                            if (cmp) {
                                cmp.setCustomValidity('This Value is dulplicate');
                                cmp.reportValidity();
                            }
                        }
                    }
                }
            }

            if (Object.keys(this.availableSanctionOptions).length > 0) {
                let temp = JSON.parse(JSON.stringify(this.availableSanctionOptions))
                temp[Index] = event.target.value;
                this.availableSanctionOptions = JSON.parse(JSON.stringify(temp));
                console.log('available sanction Options', this.availableSanctionOptions);
                for (let keyValue of Object.keys(this.availableSanctionOptions)) {
                    let cmp = this.template.querySelectorAll('.Sanction')[keyValue];
                    if (cmp) {
                        cmp.setCustomValidity('');
                        cmp.reportValidity();
                    }
                }
                for (let keyValue of Object.keys(this.availableSanctionOptions)) {
                    for (let keyValueInner of Object.keys(this.availableSanctionOptions)) {
                        if (keyValue != keyValueInner && this.availableSanctionOptions[keyValue] == this.availableSanctionOptions[keyValueInner]) {
                            console.log(keyValue, 'Data is matching with = ', keyValueInner);
                            let cmp = this.template.querySelectorAll('.Sanction')[keyValue];
                            console.log('Component = ', cmp);
                            if (cmp) {
                                cmp.setCustomValidity('This Value is dulplicate');
                                cmp.reportValidity();
                            }
                        }
                    }
                }
            }

            //if (!hasError) {
            if (this.sanctionMap.has(value)) {
                this.sanctionConditionData[Index].sanctionCondition = (this.sanctionMap.get(value).Sanction_condition_Description__c != null) ? this.sanctionMap.get(value).Sanction_condition_Description__c : '';
                this.sanctionConditionData[Index].otherCondition = (this.sanctionMap.get(value).Other_Condition__c != null) ? this.sanctionMap.get(value).Other_Condition__c : '';
            }
            //}
        }
        else if (event.target.name == 'Print_In_Sanction_Letter') {
            this.sanctionConditionData[Index].printInSanctionLetter = value;
        }
        else if (event.target.name == 'remarks') {
            this.sanctionConditionData[Index].remarks = value;
        }
        this.sanctionConditionData[Index].isChanged = true;
        console.log('changed Wrapper ###', this.sanctionConditionData);
        this.isDisabled = false;

    }

    // ALL Row Action Methods for Add ,Edit and Delete Row
    handleAddow(event) {
        let index;
        if (this.sanctionConditionData.length) {
            index = this.sanctionConditionData.length + 1;
        }
        else {
            index = 1;
        }
        let record = { SrNo: index, Id: '', sanctionCondition: '', otherCondition: '', printInSanctionLetter: '', remarks: '', source: this.source, isPCSanction: true, isChanged: false };
        let data = this.sanctionConditionData;
        data.push(record);
        this.sanctionConditionData = data;
        this.showToast('', 'success', 'Row Added Successfully');
    }

    handleDeleteRow(event) {
        this.sanctionSpinner = true;
        if (event.currentTarget.dataset.id) {
            let recordId = event.currentTarget.dataset.id;
            console.log('record ID to be Deleted', recordId);
            deleteRecord(recordId)
                .then(() => {
                    this.showToast('', 'success', 'Record Deleted Successfully');
                    refreshApex(this._wiredResult);
                    this.isDisabled = true;
                    this.sanctionSpinner = false;
                })
                .catch(error => {
                    this.showToast('Error deleting record', 'error', error.body.message);
                    this.sanctionSpinner = false;
                });
        }
        else {
            this.showToast('', 'success', 'Row Deleted Successfully');
        }

        console.log('Before Deletion ###', this.sanctionConditionData);
        let toBeDeletedRowIndex = event.currentTarget.dataset.srno;
        let tobeDeletedIndex = event.currentTarget.dataset.index;
        let listOfSanctions = [];
        for (let i = 0; i < this.sanctionConditionData.length; i++) {
            let tempRecord = Object.assign({}, this.sanctionConditionData[i]); //cloning object           
            if (tempRecord.SrNo != toBeDeletedRowIndex) {
                console.log('srNo', tempRecord.SrNo);
                console.log('toBeDeletedRowIndex :', toBeDeletedRowIndex);
                listOfSanctions.push(tempRecord);
            }
        }
        for (let i = 0; i < listOfSanctions.length; i++) {
            listOfSanctions[i].SrNo = i + 1;
        }
        this.sanctionConditionData = listOfSanctions;
        this.sanctionSpinner = false;
        console.log('to be deleted Index ###', tobeDeletedIndex);
        if (Object.keys(this.availableSanctionOptions).length > 0) {
            delete this.availableSanctionOptions[tobeDeletedIndex];
            console.log('available sanction Options', this.availableSanctionOptions);
            for (let keyValue of Object.keys(this.availableSanctionOptions)) {
                let cmp = this.template.querySelectorAll('.Sanction')[keyValue];
                if (cmp) {
                    cmp.setCustomValidity('');
                    cmp.reportValidity();
                }
            }
            for (let keyValue of Object.keys(this.availableSanctionOptions)) {
                for (let keyValueInner of Object.keys(this.availableSanctionOptions)) {
                    if (keyValue != keyValueInner && this.availableSanctionOptions[keyValue] == this.availableSanctionOptions[keyValueInner]) {
                        console.log(keyValue, 'Data is matching with = ', keyValueInner);
                        let cmp = this.template.querySelectorAll('.Sanction')[keyValue];
                        console.log('Component = ', cmp);
                        if (cmp) {
                            cmp.setCustomValidity('This Value is dulplicate');
                            cmp.reportValidity();
                        }
                    }
                }
            }
        }
        if (Object.keys(this.sanctionMapNew).length > 0) {
            delete this.sanctionMapNew[tobeDeletedIndex];
            console.log('sanctionMapNew = ', JSON.parse(JSON.stringify(this.sanctionMapNew)));
            for (let keyValue of Object.keys(this.sanctionMapNew)) {
                let cmp = this.template.querySelectorAll('.Sanction')[keyValue];
                if (cmp) {
                    cmp.setCustomValidity('');
                    cmp.reportValidity();
                }
            }
            for (let keyValue of Object.keys(this.sanctionMapNew)) {
                for (let keyValueInner of Object.keys(this.sanctionMapNew)) {
                    if (keyValue != keyValueInner && this.sanctionMapNew[keyValue] == this.sanctionMapNew[keyValueInner]) {
                        console.log(keyValue, 'Data is matching with = ', keyValueInner);
                        let cmp = this.template.querySelectorAll('.Sanction')[keyValue];
                        console.log('Component = ', cmp);
                        if (cmp) {
                            cmp.setCustomValidity('This Value is dulplicate');
                            cmp.reportValidity();
                        }
                    }
                }
            }
        }

        console.log('After delete Objects availableSanctionOptions', this.availableSanctionOptions, ' sanctionMapNew ', this.sanctionMapNew);
        refreshApex(this._wiredResult);
        console.log('After Deletion ###', this.sanctionConditionData);
    }


    @wire(getSanctionConditionTableData, { applicationId: '$applicationId', createdFrom: '$source' })
    wiredSanctionConditions(value) {
        this.sanctionSpinner = true;
        const { data, error } = value;
        this._wiredResult = value;
        if (data) {
            console.log('Sanction Condition In Wire', data);
            let options = [];
            let sancMap = new Map();
            if (data.msSanctionList) {
                let dataList = data.msSanctionList;
                for (var key in dataList) {
                    options.push({ label: dataList[key].Sanction_condition_Description__c, value: dataList[key].Sanction_condition_Description__c });
                    sancMap.set(dataList[key].Sanction_condition_Description__c, dataList[key]);
                }
                console.log('Sanction Map', this.sanctionMap);
            }
            this.sanctionMap = sancMap;
            this.sanctionOptions = options;
            console.log('Sanction Options ### ', this.sanctionOptions);
            let avSanctionOptions = {};
            if (data.sanctionWrapperList) {
                this.sanctionConditionData = JSON.parse(JSON.stringify(data.sanctionWrapperList));
                this.sanctionConditionData.forEach((item, index, arr) => {
                    let temp = JSON.parse(JSON.stringify(avSanctionOptions));
                    temp[index] = item.sanctionCondition;
                    avSanctionOptions = JSON.parse(JSON.stringify(temp));
                    //avSanctionOptions.push(item.sanctionCondition);
                });
            }
            this.availableSanctionOptions = avSanctionOptions;
            console.log('sanctionConditionData ###', this.sanctionConditionData);
            console.log('Available Sanction Options ###', this.availableSanctionOptions);
            this.sanctionSpinner = false;
        } else if (error) {
            console.error('Sanction Conditions error ###', JSON.stringify(error));
            this.sanctionSpinner = false;
        }
    }

    // Save Button Method
    handleSanction() {
        let isValid = this.handleCheckValidity();
        if (isValid) {
            // save method Called
            this.sanctionSpinner = true;
            console.log('data to be sent==>', this.sanctionConditionData);
            saveSanctionConditions({ applicationId: this.applicationId, sanctionData: JSON.stringify(this.sanctionConditionData) })
                .then(result => {
                    console.log('Response from Server--->', result);
                    if (result == 'success') {
                        this.showToast('Success', 'success', 'Records Saved Successfully');
                        refreshApex(this._wiredResult);
                    } else if (result == 'error') {
                        this.showToast('Error', 'error', 'Error occured while Saving Records');
                    }
                    this.sanctionSpinner = false;
                })
                .catch(err => {
                    console.log('error from Server----->', err);
                    this.sanctionSpinner = false;
                })
        }
        else if (!isValid) {
            this.showToast('', 'error', 'Complete all Required Validations');
            return;
        }
    }


    // method used to check Validation 
    handleCheckValidity() {
        const allValid1 = [
            ...this.template.querySelectorAll('lightning-combobox'),
        ].reduce((validSoFar, inputCmp) => {
            inputCmp.reportValidity();
            return validSoFar && inputCmp.checkValidity();
        }, true);
        const allValid2 = [
            ...this.template.querySelectorAll('lightning-textarea'),
        ].reduce((validSoFar, inputCmp) => {
            inputCmp.reportValidity();
            return validSoFar && inputCmp.checkValidity();
        }, true);
        // const allValid3 = [
        //     ...this.template.querySelectorAll('select'),
        // ].reduce((validSoFar, inputCmp) => {
        //     inputCmp.reportValidity();
        //     return validSoFar && inputCmp.checkValidity();
        // }, true);

        // const isValid = this.template.querySelectorAll('select');
        // console.log('selects list', isValid);
        // isValid.forEach(Element => {
        //     console.log('Name', Element.name, ' ### Element.value', Element.value);
        //     if (Element.name == 'Sanction Condition') {
        //         if (Element.value == "") {
        //             Element.setCustomValidity('Complete This Field');
        //         }
        //         else {
        //             Element.setCustomValidity('');
        //         }
        //     }
        //     Element.reportValidity();
        // })
        if (allValid1 && allValid2) {
            return true;
        }
        else {
            return false;
        }
    }


    // show toast Method
    showToast(title, variant, message) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                variant: variant,
                message: message,
            })
        );
    }

}