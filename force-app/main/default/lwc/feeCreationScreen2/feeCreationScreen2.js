/*
* ──────────────────────────────────────────────────────────────────────────────────────────────────
* @author           Arnav Chaudhary 
* @modifiedBy       Arnav Chaudhary  
* @created          2022-07-15
* @modified         2022-07-15
* @Description      This component is build to display fee details related to application 
                     in FiveStar.              
* ──────────────────────────────────────────────────────────────────────────────────────────────────
*/
import { LightningElement, api, wire, track } from 'lwc';
import { CloseActionScreenEvent } from 'lightning/actions';
import createFeeCreationData from '@salesforce/apex/FeeCreationComponentHelper.createFeeCreationRecords';
import getFeeCreationData from '@salesforce/apex/FeeCreationComponentHelper.getFeeCreationRecords';
import addRow from '@salesforce/apex/FeeCreationComponentHelper.addRow';
import saveRecords from '@salesforce/apex/FeeCreationComponentHelper.saveRecords';
import { getPicklistValues, getObjectInfo } from 'lightning/uiObjectInfoApi';
import FEE_CREATION_OBJECT from '@salesforce/schema/Fee_Creation__c';
import REPAYMENT_TYPE_FIELD from '@salesforce/schema/Fee_Creation__c.Repayment_Type_2__c';
import APPLICABLE_ON_FIELD from '@salesforce/schema/Fee_Creation__c.Applicable_on_Loan_Amount_Asset_Value__c';
import FEE_CODE_FIELD from '@salesforce/schema/Fee_Creation__c.Fee_Code__c';
//import STAGE_DUE_FIELD from '@salesforce/schema/Fee_Creation__c.Stage_Due__c';
import getRepaymentPicklist_2 from '@salesforce/apex/FeeCreationComponentHelper.getRepaymentPicklist_2';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import {getRecordNotifyChange} from 'lightning/uiRecordApi';
import getFeeCodeFromMaster from '@salesforce/apex/FeeCreationComponentHelper.getFeeCodeFromMaster';
export default class FeeCreationScreen extends LightningElement {

    @api recordId;
    @track feeCreation = [];
    @track lstOptions = [];
    @api allValues = [];
    @api allValues1 = [];
    @api options = [];
    @api feeCodeOptions = [];
    @api existingFeeCodeOption = [];
    @track removeRow;
    @track pickValue;
    @track stageDue;
    @track applicableOn;
    @track accountList = [];
    @track index = 0;
    @track repaymentChange = false;
    @track size;
    @track data = [];
    @track feeCode = [];
    @track saveRecordsBtn = true;
    @track rowNoChanged;
    @track feeType = 'none';
    @track feeAmount;
    @track taxAmount;
    @track removeFeeCode = [];
    @track isSave = false;
    @track isAmount = false;
    @track feeList = true;
    @track isLoaded = false;
    taxPercent = 18;

    optionsValue() {
        let feeCodePass;
        let resultCreated = JSON.parse(JSON.stringify(this.data));

        for (let key in this.feeCode) {
            feeCodePass = this.feeCode[key];
            feeCodePass = resultCreated[i].Fee_Code__c;
            console.log('fee code of result is ' + feeCodePass);
            this.lstOptions = [];
            getRepaymentPicklist_2({ feeCode: feeCodePass })
                .then(data => {
                    var repayment = data.values;
                    console.log('repayment list' + JSON.stringify(data));
                    for (let key in data) {
                        console.log('key' + key + data[key]);
                        repayment = data[key];
                        console.log('repayment is' + repayment);
                        this.lstOptions.push({ label: repayment, value: repayment });
                        this.lstOptions = [... this.lstOptions, { key: repayment, value: repayment }];
                        console.log('map data' + JSON.stringify(this.lstOptions));
                    }
                    //  addressArray = [... addressArray, {key : this.feeCreation[key].repaymentType[data] , value : this.feeCreation[key].repaymentType[data]}];

                })
                .catch(error => {
                    console.log('error in repayment' + JSON.stringify(error));
                })
        }
    }
   /* renderedCallback(){
        getRecordNotifyChange([{recordId: this.recordId}]);
                getFeeCreationData({ applicationId: this.recordId })
                .then(dataGet => {
                    console.log('get fee from creation',dataGet);
                    this.feeCreation = JSON.parse(dataGet);
                    //  console.log('data##' + data);
                    // this.refreshData();

                })
                .catch(error => {
                    this.error = error;
                    console.log('ERRRRRRRRRRRR  ', this.error);
                    this.feeCreation = undefined;
                })
           // }
            console.log('feecreation records are',this.feeCreation);
        this.refreshData();
    }*/


    // Get Fee creration Object Info.
    @wire(getObjectInfo, { objectApiName: FEE_CREATION_OBJECT })
    feecreationObjectInfo;

    // Get Repayment Type  Picklist values.
    @wire(getPicklistValues, { recordTypeId: '$feecreationObjectInfo.data.defaultRecordTypeId', fieldApiName: REPAYMENT_TYPE_FIELD })
    prepaymentMultiPicklist({ error, data }) {
        if (data) {
            this.lstOptions = data.values;
        } else if (error) {
            console.log('ERROR IN PICKLIST  ', error);
        }
    };

    @wire(getPicklistValues, { recordTypeId: '$feecreationObjectInfo.data.defaultRecordTypeId', fieldApiName: APPLICABLE_ON_FIELD })
    setPicklistOptions({ error, data }) {
        if (data) {
            this.options = data.values;
        } else if (error) {
            console.log(error);
        }
    }

 /*   @wire(getPicklistValues, { recordTypeId: '$feecreationObjectInfo.data.defaultRecordTypeId', fieldApiName: FEE_CODE_FIELD })
    setFeeCodePicklistOptions({ error, data }) {
        if (data) {
            this.feeCodeOptions = data.values;
            console.log('FEE CODE  ', this.feeCodeOptions);
        } else if (error) {
            console.log(error);
        }
    }*/

    // @wire(getPicklistValues, { recordTypeId: '$feecreationObjectInfo.data.defaultRecordTypeId', fieldApiName: STAGE_DUE_FIELD })
    //  setStageDuePicklistOptions({error, data}) {
    //    if (data) {
    //      this.stageDueOptions = data.values;
    //      console.log('FEE CODE  ',this.feeCodeOptions);
    //    } else if (error) {
    //      console.log(error);
    //    }
    // }

    handlechange(event) {
        let updatedFeeCreation = [];
        updatedFeeCreation = this.feeCreation;
        for (let key in updatedFeeCreation) {
            var reyPaymentPicklist = [];
            var addressArray = [];
            if (updatedFeeCreation[key].sRNumnber == event.target.id.split('-')[0]) {
                try {
                    for (let index in updatedFeeCreation[key].repaymentType) {
                        reyPaymentPicklist.push(updatedFeeCreation[key].repaymentType[index].value);
                    }
                    if (!reyPaymentPicklist.includes(event.target.value)) {
                        reyPaymentPicklist.push(event.target.value);
                    }
                    if (reyPaymentPicklist.length > 0) {
                        for (let data in reyPaymentPicklist) {
                            addressArray = [...addressArray, { key: reyPaymentPicklist[data], value: reyPaymentPicklist[data] }];
                        }
                    }
                }
                catch (error) {
                    console.log('ERRRORRRRR  ', error);
                }
                updatedFeeCreation[key].repaymentType = addressArray;
            }
            this.feeCreation = [...updatedFeeCreation];
            console.log('FINAL  111111  ', this.feeCreation);
        }
    }

    handleRemove(event) {
    }

    @wire(createFeeCreationData, { applicationId: '$recordId' })
    wiredFeeCreation({ data, error }) {
        if (data) {
            this.isLoaded = true;
            //console.log('DATA11111   ',data);
            console.log('create fee from creation',data);
            this.feeCodeValuesAre();
           // let result = JSON.parse(JSON.stringify(data));
            this.feeCreation = data;
            console.log('this.feeCreation updated to',this.feeCreation);
            //     this.optionsValue();
            console.log('and records get lenght is',data.length, this.feeCreation);
           // if(data.length == 0){
            getRecordNotifyChange([{recordId: this.recordId}]);
                getFeeCreationData({ applicationId: this.recordId })
                .then(dataGet => {
                    console.log('get fee from creation',dataGet);
                    this.feeCreation = JSON.parse(dataGet);
                    //  console.log('data##' + data);
                    // this.refreshData();

                })
                .catch(error => {
                    this.error = error;
                    console.log('ERRRRRRRRRRRR  ', this.error);
                    this.feeCreation = undefined;
                })
           // }
            console.log('feecreation records are',this.feeCreation);
        this.refreshData();
        this.isLoaded = false;
        }
        else if (error) {
            this.error = error;
            console.log('ERRRRRRRRRRRR  ', this.error);
        }
        
      //  this.feeCreation = this.data;
      
    }

    feeCodeValuesAre(){
        console.log('this.existingFeeCodeOption',this.existingFeeCodeOption);
        this.existingFeeCodeOption = [];
        getFeeCodeFromMaster({applicationId : this.recordId})
        .then(resultCode=>{
            console.log('fee code result is', resultCode);
            for (let key in resultCode) {
                console.log('Key', key);
                console.log('resultCode', resultCode[key]);
                const feeCodeList = {
                    label: resultCode[key],
                    value: resultCode[key]
                };
                this.existingFeeCodeOption = [...this.existingFeeCodeOption, feeCodeList];
            }
        })
        .catch(error=>{
            console.log('error in fee code',error);
        })
    }

    // this.isLoaded = true;
    // window.setTimeout(() => { this.isLoaded = false;}, 1300);



    /*   @wire(getFeeCreationData, {applicationId:'$recordId'})
       wiredGetFeeCreation({ data, error }){
           if(data){
               this.feeCreation = JSON.parse(data);
               console.log('data##' + data)
               this.refreshData();
          //     this.optionsValue();
           //     for(let key in this.feeCreation) {
           //         let addressArray = []
           //         for(let data in this.feeCreation[key].repaymentType) {
                      
           //             addressArray = [... addressArray, {key : this.feeCreation[key].repaymentType[data] , value : this.feeCreation[key].repaymentType[data]}];
           //         }
           //         this.feeCreation[key].repaymentType =addressArray ;
           //     }            
           }
           else if (error) {
               this.error = error;
               console.log('ERRRRRRRRRRRR  ',this.error);
               this.feeCreation = undefined;
           }
           
       }*/
    refreshData() {
        console.log('data refreshed',JSON.stringify(this.feeCreation));
        return refreshApex(this.feeCreation);
    }

    actionClose() {
        this.dispatchEvent(new CloseActionScreenEvent());
    }
    saveRecords(){
        saveRecords({
                wrapperData: JSON.stringify(this.feeCreation),
                applicationId: this.recordId
            })
                .then(result => {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'Record  Created/Update  Sucessfully.',
                            variant: 'success'
                        })
                    );
                   // window.location.reload();
                   this.feeCodeValuesAre();
                   getFeeCreationData({ applicationId: this.recordId })
                .then(dataGet => {
                    console.log('get fee from creation',dataGet);
                    this.feeCreation = JSON.parse(dataGet);
                    //  console.log('data##' + data);
                    // this.refreshData();

                })
                .catch(error => {
                    this.error = error;
                    console.log('ERRRRRRRRRRRR  ', this.error);
                    this.feeCreation = undefined;
                })
                   this.feeList = true;
                   console.log('before dispatch event');
                   var feeEvent = new CustomEvent("getfeechangeevent", {
                    detail: 'this.feeList',
                    bubbles: true,
                    composed: true
                });
                console.log('dispatch receiptEvent ', JSON.stringify(feeEvent));
                this.dispatchEvent(feeEvent);
                }).catch(error => {
                    this.error = error;
                    console.log('ERRRRRRRRRRRR  ', this.error);
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error',
                            message: this.error.body,
                            variant: 'error'
                        })
                    );
                });
    }

    handleSave() {
        this.feeList = false;
        this.repaymentChange = false;

        // console.log('testtttttttttt');
        // for(let index in this.feeCreation) {
        //     let  prePaymentArray = [];
        //      for(let key in  this.feeCreation[index].repaymentType) {
        //          prePaymentArray.push(this.feeCreation[index].repaymentType[key].key);
        //      }
        //      this.feeCreation[index].repaymentType = prePaymentArray;
        //      console.log('OBJECTTTTTT  ', this.feeCreation[index].repaymentType);
        //  }
        //  for (let i = 0; i < this.feeCreation.length; i++) {
        //      console.log('srNumber######' + this.feeCreation[i].sRNumnber + 'and fee code'+this.feeCreation[i].feeCode);
        console.log('handle save called');
        this.isSave = false;
        if(this.isAmount == true){
            console.log('this.isAmount in save',this.isAmount);
            this.saveRecords();
        }
        //console.log(this.template.querySelector('.td-currency-fee').getAttribute('selected') ) ;
        if (this.feeType != 'none' && this.feeType == 'System') {
            console.log('in fee repayment changed save',this.feetype);
            console.log('in fee repayment changed save',this.feetype);
            if(this.feeCreation[this.feeCreation.length - 1].feeCode == null || this.feeCreation[this.feeCreation.length - 1].feeCode == ''){
                console.log('fill fee code');
                this.saveRecordsBtn = false;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: 'Please select Fee Code in new row.',
                        variant: 'error'
                    })
                );
                this.feeList = true;
            }
            else {
                this.saveRecords();
            }
            
        }
        else if(this.feeType == 'none' && this.feeType != 'System'){
            let combobox = this.template.querySelector("[data-id='Controlling Picklist Type']");
            console.log('fee code combobox is' + combobox.value);
            if (combobox.value == null) {
                console.log('fee code is null' + this.saveRecordsBtn);
                this.saveRecordsBtn = false;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: 'Please select Fee Code.',
                        variant: 'error'
                    })
                );
                // this.template.querySelector('.td-currency-fee').className = ('.td-currency-fee.error');
                // combobox.className = ('td-currency-fee error');
                // console.log('class name',combobox.className);
                this.feeList = true;
            }

            //  }

            
            else if (combobox.value != null) {
                console.log('save record', this.saveRecordsBtn);
                this.saveRecords();
                
            }
        }
        
        this.isAmount = false;
        this.template.querySelector('.feeCreationFooter').className = ('feeCreationFooter visible');
        console.log('EXITTTTTTTTTTT++++++');

    }
    updateAmount(event){
        console.log('update amount');
        var sRNumber = event.target.id.split('-')[0];
        
        var value = event.target.value;
        console.log(value);
        var name = event.target.name;
        console.log(name);
        if (name == 'feeAmount'){
            this.feeAmount = parseFloat(value);
            this.feeCreation[sRNumber-1].feeAmount = this.feeAmount;
            console.log('feeamount',this.feeAmount);
            //To make tax amount non editable
            this.taxAmount = parseFloat(this.feeAmount * this.taxPercent * .01);
        }
      /*  else if(name == 'taxAmount'){
            this.taxAmount = parseFloat(value);
            this.feeCreation[sRNumber-1].taxAmount = this.taxAmount;
            console.log('taxamount',this.taxAmount);
        }*/
        else if(name == 'feeAmountGet') {
            this.isAmount = true;
            this.feeAmount = parseFloat(value);
            this.feeCreation[sRNumber-1].feeAmount = this.feeAmount;
            console.log('feeamount',this.feeAmount);
            this.taxAmount = this.feeCreation[sRNumber-1].taxAmount;
            this.handleValueChange();
        }           
        console.log(this.feeAmount,this.taxAmount );
        if(this.feeAmount != null && this.taxAmount != null){
            console.log(this.feeAmount,this.taxAmount );
            //To make tax non editable
            this.feeCreation[sRNumber-1].taxAmount = this.taxAmount;
            this.feeCreation[sRNumber-1].totalFee = this.feeAmount + this.taxAmount;
            console.log('this.feeCreation[sRNumber-1].totalFee',this.feeCreation[sRNumber-1].totalFee, this.feeType);
          //  this.feeCreation[sRNumber-1].feeCollection = this.feeCreation[sRNumber-1].totalFee;
          this.feeCreation[sRNumber-1].feeCollection = 0;
        }
        for (let record in this.feeCreation) {
            for (let key in this.feeCreation[record]) {
                if (key == name && this.feeCreation[record].sRNumnber == sRNumber) {
                    this.feeCreation[record][key] = value;
                }
            }
        }
      //  this.refreshData();
    }
    updateFeeValue(event){
        let sRNumber = event.target.id.split('-')[0];
        console.log('SR NUM ###' + sRNumber);
        let value = event.target.value;
        console.log('Value##' + value);
        let name = event.target.name;
        this.feeCreation[sRNumber-1].feeCode = event.target.value;
        this.updateValue(event);
    }

    updateValue(event) {
        //    this.isLoaded = true;
        let sRNumber = event.target.id.split('-')[0];
        console.log('SR NUM ###' + sRNumber);
        let value = event.target.value;
        console.log('Value##' + value);
        let name = event.target.name;
        
        console.log('Name##' + name);
        for (let i = 0; i < this.feeCreation.length; i++) {
            console.log('srNumber######' + this.feeCreation[i].sRNumnber);
            if (this.feeCreation[i].sRNumnber == sRNumber) {
                
                if (name == 'feeCode' && value == 'Usr-Cersai') {
                    this.feeCreation[i].applicableOn = 'Loan Amount';
                    //  this.feeCreation[i].repaymentType = 'Direct Receipt';
                } else if (name == 'feeCode' && value == 'Usr-Technical') {
                    this.feeCreation[i].applicableOn = 'EMI';
                    //  this.feeCreation[i].repaymentType = 'Deduct from Disbursement';
                } else if (name == 'feeCode' && value == 'Usr-LegaL') {
                    this.feeCreation[i].applicableOn = 'Asset Value';
                    //  this.feeCreation[i].repaymentType = 'Add to Loan Amount';
                } else if (name == 'feeCode' && value == 'Usr-IMD') {
                    this.feeCreation[i].applicableOn = 'Asset Value';
                    //  this.feeCreation[i].repaymentType = 'Direct Receipt';
                } else if (name == 'feeCode' && value == 'Usr-PRC_FEE_Type') {
                    this.feeCreation[i].applicableOn = 'EMI';
                    // this.feeCreation[i].repaymentType = 'Add to Loan Amount';
                }
                

            }

        }

        for (let record in this.feeCreation) {
            for (let key in this.feeCreation[record]) {
                if (key == name && this.feeCreation[record].sRNumnber == sRNumber) {
                    this.feeCreation[record][key] = value;
                }
            }
        }
        console.log('FINAL  0000  ', JSON.stringify(this.feeCreation));
        //     this.isLoaded = false;
        //     window.setTimeout(() => { this.isLoaded = false;}, 1000);
        this.removeFeeCode.push(event.target.value);
        console.log(this.removeFeeCode);
    }

    createFeeCreationRecordRow(event) {
        this.isSave = true;
        console.log('target is',event.target.name);
        if (event.target.name === 'add') {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'New row added sucessfully.',
                    variant: 'success'
                })
            );

        }      
        this.handleValueChange();
        console.log('YES CALL   ', JSON.stringify(this.feeCreation));
        if (event.target.name === 'remove' && this.repaymentChange === false) {
            console.log('on delete', event.target.name, this.repaymentChange);
            console.log('class name of save',this.template.querySelector('.feeCreationFooter').className);
            this.template.querySelector('.feeCreationFooter').className = ('feeCreationFooter');
            console.log('class name of save',this.template.querySelector('.feeCreationFooter').className);
        }
        // for(let index in this.feeCreation) {
        //    let  prePaymentArray = [];
        //     for(let key in  this.feeCreation[index].repaymentType) {
        //         prePaymentArray.push(this.feeCreation[index].repaymentType[key].key);
        //     }
        //     this.feeCreation[index].repaymentType = prePaymentArray;
        //     console.log('OBJECTTTTTT  ', this.feeCreation[index].repaymentType);
        // }
        addRow({
            wrapperData: JSON.stringify(this.feeCreation),
            typeOf: event.target.name,
            valuesOf: event.currentTarget.dataset.id
        })
            .then(result => {
                this.feeCreation = JSON.parse(result);
                console.log('add row fee creation' + JSON.stringify(this.feeCreation));
                if (this.feeCreation.feeCode == null || this.feeCreation.feecode == '') {
                    this.saveRecordsBtn = false;
                }
                else {
                    this.saveRecordsBtn = true;
                }
                // for(let key in this.feeCreation) {
                //     let addressArray = []
                //     for(let data in this.feeCreation[key].repaymentType) {

                //         addressArray = [... addressArray, {key : this.feeCreation[key].repaymentType[data] , value : this.feeCreation[key].repaymentType[data]}];
                //     }
                //     this.feeCreation[key].repaymentType =addressArray ;
                // }

                console.log("RESULTTTTTTTT", this.feeCreation);
                


            }).catch(error => {
                this.error = error;
                console.log('ERRRRRRRRRRRR  ', this.error);
            });

    }
    /*@ Author: changes done by Sangeeta*/
    /*@ Description: To show save button on repayment change*/
    handleValueChange() {
        // event.target.classList.add('visible');

        const adobeButton = this.template.querySelector('.feeCreationFooter').className;
        console.log('adobeButton', JSON.stringify(adobeButton));
        this.template.querySelector('.feeCreationFooter').className = ('feeCreationFooter visible');


    }
    handleRepaymentValueChange(event) {
        // event.target.classList.add('visible');
        this.repaymentChange = true;
        console.log('handle change', event.target.getAttribute("id").split('-')[0]);
        this.rowNoChanged = event.target.getAttribute("id").split('-')[0];
        this.feeType = this.feeCreation[this.rowNoChanged - 1].type;
        console.log('this.feeType', this.feeType);
        if (this.feeType = 'System') {
            this.feeCreation[this.rowNoChanged - 1].repaymentType = event.target.value;
            console.log('this.feeCreation[this.rowNoChanged - 1].repaymentType', this.feeCreation[this.rowNoChanged - 1].repaymentType);
        }

        this.handleValueChange();


    }
}