import { LightningElement, track, api, wire } from 'lwc';
import { deleteRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import { getObjectInfo,getPicklistValues } from 'lightning/uiObjectInfoApi';
import CONSIDER_FIELD from "@salesforce/schema/Loan_Details__c.To_be_considerd_for_DBR__c";
import LOAN_DETAIL_OBJECT from '@salesforce/schema/Loan_Details__c';
import getHighmarkObligations from '@salesforce/apex/fsHighmarkObligationsScreenController.getHighmarkObligations';
import saveObligations from '@salesforce/apex/fsHighmarkObligationsScreenController.saveObligations';
import getRecordTypeId from '@salesforce/apex/fsHighmarkObligationsScreenController.getRecordTypeId';
import getcharacterRepayment from '@salesforce/apex/fsHighmarkObligationsScreenController.getcharacterRepayment';
export default class FsHighmarkObligationsScreen extends LightningElement {

    @api applicationId;
    @api customerOptions;
    @api stageName;
    @api verificationId;

    @track index;
    @track record = {};
    @track highmarkpcTableData;
    @track highmarkSpinner = false;
    @track considertypeoptions;
    @track highmarkMap = new Map();
    @track isDisabled = true;
    @track buttonLabel = 'Save';
    @track isSingleRecord = false;
    @track recordId;
    @track repaymentRecordId;
    @track characterRecordTypeId;
    _wiredResult;



    connectedCallback() {
        console.log('in repayment ', this.customerOptions);
        if (this.stageName == 'PC' || this.stageName == 'AC') {
            console.log('verfId', this.verificationId);
            this.getcharacterRepaymentDetail();
            this.getcharcterRecordTypeId();
            this.showoverallRemarks = true;
        }

    }

    


    @wire(getHighmarkObligations, { appId: '$applicationId' })
    wiredObligations(value) {
        //this.handleBureauCreation();
        this.highmarkSpinner = true;
        //this.wiredActivities = value;
        const { data, error } = value;
        this._wiredResult = value;
        if (data) {
            console.log('highmark in wire', data);
            this.highmarkpcTableData = JSON.parse(JSON.stringify(data));
            console.log('this.highmarkmap from apex', this.highmarkpcTableData[0].HighmarkMap);
            if (this.highmarkpcTableData[0].HighmarkMap)
                for (var key in this.highmarkpcTableData[0].HighmarkMap) {
                    this.highmarkMap.set(key, this.highmarkpcTableData[0].HighmarkMap[key]);
                }
            console.log('this.highmarkmap', this.highmarkMap);

            if (this.highmarkpcTableData.length == 1) {
                this.isSingleRecord = true;
            }
            this.highmarkSpinner = false;

        } else if (error) {
            console.error('wiredObligations error => ', JSON.stringify(error));
            this.highmarkSpinner = false;
        }

    }







    // importing the id type field from Loan_detail__C 
    @wire(getObjectInfo, { objectApiName: LOAN_DETAIL_OBJECT })
    objectInfo;

    @wire(getPicklistValues, { recordTypeId: '$objectInfo.data.defaultRecordTypeId', fieldApiName: CONSIDER_FIELD })
    considertype({ data, error }) {
        if (data) {
            this.considertypeoptions = data.values;
        } else if (error) {
            console.log(error);
        }
    }

    // method used to Perform add Row Action
    handleaddRow(event) {
        let index = event.currentTarget.dataset.index;
        console.log('index', event.currentTarget.dataset.index);
        index = parseInt(index) + 1;
        console.log('index', event.currentTarget.dataset.index++);
        let record = {
            srNo: index, id: '', applicantName: '', typeofloan: '', ownership: '', currentDPD: '', remarks: '', tobeconsiderValue: '', maxdpd: '',
            overdueAmount: 0, osAmt: 0, obligations: 0, loanAmt: 0, type: 'Self', IsSelfType: true, highmarkScore: '', bureauId: '', isChanged: false
        };
        let data = this.highmarkpcTableData;
        console.log('data', data);
        data.push(record);
        this.highmarkpcTableData = data;
        this.showToast('Success', 'success', 'Row Added Successfully');
        if (this.highmarkpcTableData.length == 1) {
            this.isSingleRecord = true;
        }
        else {
            this.isSingleRecord = false;
        }
    }

    // method used to perform delete Row Action
    handledeleteRow(event) {
        this.highmarkSpinner = true;
        console.log('this.highmarkpcTableData', this.highmarkpcTableData);

        if (event.currentTarget.dataset.id) {
            let recordId = event.currentTarget.dataset.id;
            console.log('record ID to be Deleted', recordId);
            deleteRecord(recordId)
                .then(() => {
                    this.showToast('Success', 'success', 'Record Deleted Successfully');
                    this.highmarkSpinner = false;
                    refreshApex(this._wiredResult);
                })
                .catch(error => {
                    this.showToast('Error deleting record', 'error', error.body.message);
                    this.highmarkSpinner = false;
                });
        }
        else {
            this.showToast('Success', 'success', 'Row Deleted Successfully');
        }

        let toBeDeletedRowIndex = event.currentTarget.dataset.index;
        console.log('toBeDeletedRowIndex :', toBeDeletedRowIndex);
        let listOfObligations = [];
        for (let i = 0; i < this.highmarkpcTableData.length; i++) {
            let tempRecord = Object.assign({}, this.highmarkpcTableData[i]); //cloning object
            if (tempRecord.srNo != toBeDeletedRowIndex) {

                listOfObligations.push(tempRecord);
            }
        }
        for (let i = 0; i < listOfObligations.length; i++) {
            listOfObligations[i].srNo = i + 1;
        }

        this.highmarkpcTableData = listOfObligations;

        this.highmarkSpinner = false;
        console.log('after pop this.highmarkpcTableData', this.highmarkpcTableData);

    }

    // handle change method to capture changed values of Grid Fields
    handleChange(evt) {
        this.isDisabled = false;
        console.log('this.highmarkmap in customer change', this.highmarkMap);
        console.log('value', evt.target.value);
        if (evt.target.name === 'Applicant Name') {
            this.highmarkpcTableData[evt.currentTarget.dataset.index].loanApplicantId = evt.target.value;
            this.highmarkpcTableData[evt.currentTarget.dataset.index].applicantName = evt.target.value;
            if (this.highmarkMap.has(evt.target.value)) {
                console.log('highmark score', this.highmarkMap.get(evt.target.value));

                this.highmarkpcTableData[evt.currentTarget.dataset.index].highmarkScore = (this.highmarkMap.get(evt.target.value).Highmark_Score__c != null) ? this.highmarkMap.get(evt.target.value).Highmark_Score__c : null;
                this.highmarkpcTableData[evt.currentTarget.dataset.index].bureauId = (this.highmarkMap.get(evt.target.value).Id != null) ? this.highmarkMap.get(evt.target.value).Id : null;
                console.log(this.highmarkpcTableData[evt.currentTarget.dataset.index]);
            }
        }
        else if (evt.target.name === 'typeOfloan') {
            this.highmarkpcTableData[evt.currentTarget.dataset.index].typeofloan = evt.target.value;
        }
        else if (evt.target.name === 'Ownership__c') {
            this.highmarkpcTableData[evt.currentTarget.dataset.index].ownership = evt.target.value;
        }
        else if (evt.target.name === 'loanAmt') {
            this.highmarkpcTableData[evt.currentTarget.dataset.index].loanAmt = evt.target.value;
        }
        else if (evt.target.name === 'osAmt') {
            this.highmarkpcTableData[evt.currentTarget.dataset.index].osAmt = evt.target.value;
        }
        else if (evt.target.name === 'overdueAmt') {
            this.highmarkpcTableData[evt.currentTarget.dataset.index].overdueAmount = evt.target.value;
        }
        else if (evt.target.name === 'obligation') {
            this.highmarkpcTableData[evt.currentTarget.dataset.index].obligations = evt.target.value;
        }
        else if (evt.target.name === 'currentDPD') {
            this.highmarkpcTableData[evt.currentTarget.dataset.index].currentDPD = evt.target.value;
        }
        else if (evt.target.name === 'maxDPD') {
            this.highmarkpcTableData[evt.currentTarget.dataset.index].maxdpd = evt.target.value;
        }
        else if (evt.target.name === 'consider-Type') {
            this.highmarkpcTableData[evt.currentTarget.dataset.index].tobeconsiderValue = evt.target.value;
        }
        else if (evt.target.name === 'remarks') {
            this.highmarkpcTableData[evt.currentTarget.dataset.index].remarks = evt.target.value;
        }

        this.highmarkpcTableData[evt.currentTarget.dataset.index].isChanged = true;
        console.log('changed row', this.highmarkpcTableData[evt.currentTarget.dataset.index]);
        console.log('changed wrapper', this.highmarkpcTableData);
    }

    // submit button to save the Highmark Obligations
    handleHighmark(event) {
        let checkValidity = this.handleCheckValidity();
        let checkerror = true;
        let ref = this.template.querySelectorAll('.consider');
        console.log('refs', ref);
        ref.forEach(element => {
            if (element.value == 'No') {
                console.log('element index', element.dataset.index);
                let req = this.template.querySelectorAll(`[data-index="${element.dataset.index}"]`);
                req.forEach((item, index, arr) => {
                    console.log('index', item.dataset.index);
                    console.log('index', item.name);
                    console.log('item.required', item.required)
                    if (item.name == 'remarks') {
                        console.log('item.required', item.required)
                        arr[index].setAttribute("required", "true")

                        arr[index].required = 'true';
                        console.log('item.required', item.required)
                        if (item.value == null || item.value == undefined || item.value == '') {
                            checkerror = false;
                            arr[index].setCustomValidity('Complete this field.');
                        } else {
                            checkerror = true;
                            arr[index].setCustomValidity('');
                        }
                        arr[index].reportValidity();
                    }
                });
            }
        })

        console.log('Handle Highmark Called=', checkValidity, checkerror);
        if (!checkValidity || !checkerror) {
            this.showToast('', 'error', 'Complete all Required Validations');
            return;
        }
        if (checkValidity && checkerror) {
            this.highmarkSpinner = true;
            this.highmarkpcTableData[0].HighmarkMap = null
            
            console.log('hello data',this.highmarkpcTableData );

            saveObligations({ dataWrapper: JSON.stringify(this.highmarkpcTableData) })
                .then(res => {
                    console.log('saveObligations', res);
                    if (res == 'success') {
                        this.showToast('Success', 'success', 'Records Saved Successfully');
                        refreshApex(this._wiredResult);
                        console.log('refersh Apex', this.highmarkpcTableData);
                        this.isDisabled = true;
                    }
                    else if (res == 'error') {
                        this.showToast('Error', 'error', 'Error in Saving Records');
                    }
                    this.highmarkSpinner = false;
                })
                .catch(err => {
                    console.log('err in saveObligations', err);
                    this.showToast('Error', 'error', 'Error in Saving Records');
                    this.highmarkSpinner = false;
                })
        }
    }


    // method used to check Validation 
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
            ...this.template.querySelectorAll('lightning-text-area'),
        ].reduce((validSoFar, inputCmp) => {
            inputCmp.reportValidity();
            return validSoFar && inputCmp.checkValidity();
        }, true);
        if (allValid1 && allValid2 && allValid3) {
            return true;
        }
        else {
            return false;
        }
    }


    // method used to get the Reayment PC Record
    getcharacterRepaymentDetail() {
        let rcType;
        if (this.stageName == 'PC')
            rcType = 'PC Character';
        else if (this.stageName == 'AC')
            rcType = 'AC Character';
        console.log('verfId', this.verificationId);
        getcharacterRepayment({ verfId: this.verificationId, recTypeName: rcType }).then(res => {
            console.log('repaymentId >>>> ', res);
            if (res) {
                this.repaymentRecordId = res;
                this.buttonLabel = 'Update';
            }
        }).catch(err => {
            console.log('repaymentId error>>>> ', err);
        })
    }


    // on success and on submit method for the PC Repayment Overall Remarks Form
    handlecharacterSubmit(event) {
        console.log('character submit Called', event.detail);
    }


    handleCharacterSuccess(event) {
        this.repaymentRecordId = event.detail.id;
        console.log('handle Sucesss detailId',this.repaymentRecordId);
        if (this.buttonLabel == 'Save')
            this.showToast('Success', 'success', 'Record Created Successfully');
        if (this.buttonLabel == 'Update')
            this.showToast('Success', 'success', 'Record Updated Successfully');
        if (this.repaymentRecordId != null)
            this.buttonLabel = 'Update';

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

    // get the character recordTypeId
    getcharcterRecordTypeId() {
        let rectypeName;
        if (this.stageName == 'AC')
            rectypeName = 'AC Character';
        if (this.stageName == 'PC')
            rectypeName = 'PC Character';
        getRecordTypeId({ objName: 'Character__c', recordTypeName: rectypeName })
            .then(res => {
                if (res)
                    this.characterRecordTypeId = res;
                console.log('character record type id >>>> ', JSON.stringify(res));
            })
            .catch(err => {
                console.log('errr occured in getting record type id for character', err);
            })
    }




}