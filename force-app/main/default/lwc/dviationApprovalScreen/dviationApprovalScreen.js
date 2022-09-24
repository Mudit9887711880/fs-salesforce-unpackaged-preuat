import { LightningElement, api, track, wire } from 'lwc';
import getTRDeviationRecord from '@salesforce/apex/TRDeviationApprovalCLass.getTRDeviationRecord';
//import createDependentPicklistForUSer from '@salesforce/apex/TRDeviationApprovalCLass.createDependentPicklistForUSer';
//import { getObjectInfo, getPicklistValues } from 'lightning/uiObjectInfoApi';
//import ApprovalField from "@salesforce/schema/TR_Deviation_Approval__c.Approval__c";
//import TR_Deviation_Approval_Object from '@salesforce/schema/TR_Deviation_Approval__c';
//import createDviationApprovalHistoryRecord from '@salesforce/apex/TRDeviationApprovalCLass.createDviationApprovalHistoryRecord';
import updateDecisions from '@salesforce/apex/TRDeviationApprovalCLass.updateDecisions';
import { refreshApex } from '@salesforce/apex';

import { ShowToastEvent } from 'lightning/platformShowToastEvent';


export default class DviationApprovalScreen extends LightningElement {
    @api applicationId;
    @track deviationSpinner = false;
    @track approvalStatusOptions;
    @track recordId;
    @track useroptions = [];
    @track userDesignationMap = new Map();
    @track isDisabled = true;
    @track isDisabledField = false;
    _wiredResult;
    trdeviationList;
    empty = false;
    disableOnReject = false;


    connectedCallback() {
        console.log('appIDdd>>> ',this.applicationId);
        this.deviationSpinner = true;
        //this.handlegetTRDeviationRecord();
        // this.hanldecreateDependentPicklistForUSer();
    }

    // // importing the Id type field from TR_Deviation_Approval__c 
    // @wire(getObjectInfo, { objectApiName: TR_Deviation_Approval_Object })
    // objectInfo;

    // @wire(getPicklistValues, { recordTypeId: '$objectInfo.data.defaultRecordTypeId', fieldApiName: ApprovalField })
    // considertype({ data, error }) {
    //     if (data) {
    //         this.approvalStatusOptions = data.values;
    //     } else if (error) {
    //         console.log(error);
    //     }
    // }


 @wire(getTRDeviationRecord, { applicationId: '$applicationId' })
    wiredDeviations(value) {
        
        this.deviationSpinner = true;
        
        const { data, error } = value;
        this._wiredResult = value;
        if (data) {
            console.log('ressssulttt umair >>>>>  ',data);
            //data = JSON.parse(JSON.stringify(data));
            //  if (data.length == 0) {
                // this.empty = true;
            //     this.deviationSpinner = false;

            // }
                this.trdeviationList = JSON.parse(JSON.stringify(data));
                if(this.trdeviationList.length == 0){
                    this.empty = true;
                }
           
            console.log(' this.trdeviationList >>  ', this.trdeviationList);
            this.deviationSpinner = false;

        } else if (error) {
            console.error('wiredDeviations error => ', JSON.stringify(error));
            this.deviationSpinner = false;
        }

    }
    // handlegetTRDeviationRecord() {
    //     getTRDeviationRecord({ applicationId: this.applicationId }).then(res => {
    //         if (res.length == 0) {
    //             this.empty = true;
    //             this.deviationSpinner = false;

    //         }
    //         if (res) {
    //             this.trdeviationList = res;
    //             this.deviationSpinner = false;
    //         }
    //         console.log(' this.trdeviationList >>  ', this.trdeviationList);


    //     }).catch(err => {
    //         console.log('getTRDeviationRecord error>>>> ', err);
    //     })
   // }
    handleChange(event) {
        let index = event.currentTarget.dataset.index;

        if (event.target.name == 'level') {
            this.trdeviationList[index].nextapprovallevel = event.target.value;
            let req = this.template.querySelectorAll(`[data-index ="${index}"]`);
            console.log('req', req);
            req.forEach(item => {
                if (item.name == 'usercombo') {
                    if (this.userDesignationMap.has(event.target.value))
                        item.options = this.userDesignationMap.get(event.target.value);
                }
            });
        }
        if (event.target.name == 'usercombo') {
            this.trdeviationList[index].nextapprovalUser = event.target.value;
        }
        if (event.target.name == 'approvalStatuscombo') {
            this.trdeviationList[index].approvalStatus = event.target.value;
            let req = this.template.querySelectorAll(`[data-index ="${index}"]`);

            req.forEach(item => {
                console.log('item', item);
                if (item.name == 'level') {
                    if (event.target.value == 'Rejected') {
                        item.disabled = true;
                    }
                    else
                        if (event.target.value != 'Rejected') {
                            item.disabled = false;
                        }

                }
            });
            req.forEach(item => {
                console.log('item', item);
                if (event.target.value == 'Rejected') {
                    item.setAttribute("required", "true");
                    item.required = true;
                    // if (item.name == 'remarksInput' && item.value == '') {
                    //     item.setCustomValidity('complete this field');
                    // }
                    // else {
                    //     item.setCustomValidity('');
                    // }
                    // item.reportValidity();
                }
                else {
                    item.setAttribute("required", "false");
                    item.required = false;
                }
            });



        }
        if (event.target.name == 'remarksInput') {
            this.trdeviationList[index].remarks = event.target.value;
            // let req = this.template.querySelectorAll(`[data-index ="${index}"]`);
            // req.forEach(item => {
            //     if (item.name == 'remarksInput' && item.value == '') {
            //         item.setCustomValidity('Complete this Field');
            //     }
            //     else {
            //         item.setCustomValidity('');
            //     }
            //     item.reportValidity();
            // });
        }
        if (event.target.name == 'mitigantsInput') {
            this.trdeviationList[index].mitigants = event.target.value;
        }
        this.trdeviationList[index].isChanged = true;
        this.trdeviationList[index].applicationId = this.applicationId;
        this.isDisabled = false;
    }

    handleSave(event) {


        let isValid = this.handleCheckValidity();
        if (isValid) {
            updateDecisions({ deviationList: JSON.stringify(this.trdeviationList) }).then(res => {
                console.log(' this.trdeviationList>> ', this.trdeviationList);

                console.log(' JSON.stringify(this.trdeviationList)>> ', JSON.stringify(this.trdeviationList));
                console.log('ressss ', res);
                if (this.trdeviationList.length != 0){
                    this.showSuccessToast();
                    const refreshevent = new CustomEvent("refreshdecisiondeviations",{detail:true});
                    this.dispatchEvent(refreshevent);
                //     this.dispatchEvent ("$A.get('e.force:refreshView').fire();");
                  //refreshApex(this._wiredResult);
                  window.location.reload();
                }
                else if (this.trdeviationList.length == 0) {
                    this.noRecordToast();
                }
                this.isDisabled = true;
                this.isDisabledField = true;
                this.deviationSpinner = false;

                if (res) {
                    //RES IS NULLL???
                    this.trdeviationList = res;
                }
                this.showmodal = false;

            }).catch(err => {
                this.isDisabled = true;
                this.isDisabledField = true;
                this.showErrorToast();

            })
        }
        else {
            this.fillAllDetailsToast();
        }

    }

    handleCancel(event) {
        var url = window.location.href;
        var value = url.substr(0, url.lastIndexOf('/') + 1);
        window.history.back();
        return false;
    }


    // hanldecreateDependentPicklistForUSer() {
    //     createDependentPicklistForUSer().then(res => {
    //         this.deviationSpinner = false;

    //         if (res) {
    //             for (let key in res) {
    //                 this.userDesignationMap.set(key, res[key]);
    //             }
    //         }
    //     }).catch(err => {
    //     })
    // }

    handleCheckValidity() {
        const allValid1 = [
            ...this.template.querySelectorAll('.remarkValidation'),
        ].reduce((validSoFar, inputCmp) => {
            inputCmp.reportValidity();
            return validSoFar && inputCmp.checkValidity();
        }, true);
        const allValid2 = [
            ...this.template.querySelectorAll('.decision'),
        ].reduce((validSoFar, inputCmp) => {
            inputCmp.reportValidity();
            return validSoFar && inputCmp.checkValidity();
        }, true);

        if (allValid1 && allValid2) {
            return true;
        }
        else {
            return false;
        }
    }
    showSuccessToast() {
        const evt = new ShowToastEvent({
            title: 'Success',
            message: 'Records Submitted Successfully',
            variant: 'success',
            mode: 'dismissable'
        });
        this.dispatchEvent(evt);
    }

    noRecordToast() {
        const evt = new ShowToastEvent({
            title: 'Error',
            message: 'No records found.',
            variant: 'error',
            mode: 'dismissable'
        });
        this.dispatchEvent(evt);
    }

    showErrorToast() {
        const evt = new ShowToastEvent({
            title: 'Error',
            message: 'Some unexpected error',
            variant: 'error',
            mode: 'dismissable'
        });
        this.dispatchEvent(evt);
    }

    fillAllDetailsToast() {
        const evt = new ShowToastEvent({
            title: 'Error',
            message: 'Please provide the required details.',
            variant: 'error',
            mode: 'dismissable'
        });
        this.dispatchEvent(evt);
    }

    mySuccessMethod() {
        this.showSuccessToast();
        this.showmodal = false;
    }



}