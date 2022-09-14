/*
* ──────────────────────────────────────────────────────────────────────────────────────────────────
* @author           Sangeeta Yadav  
* @modifiedBy       Sangeeta Yadav   
* @created          2022-07-21
* @modified         2022-07-21
* @Description      This component is build to display insurance details related to application in fee detail
                     in FiveStar.              
* ──────────────────────────────────────────────────────────────────────────────────────────────────
*/
import { LightningElement, wire, track, api } from 'lwc';
import getFeeTypeInsurance from '@salesforce/apex/FeeCreationTypeInsuranceNewController.getFeeTypeInsurance';
import createFeeCreationInsuranceRecords from '@salesforce/apex/FeeCreationTypeInsuranceNewController.createFeeCreationInsuranceRecords';
import getRepaymentPicklist from '@salesforce/apex/FeeCreationTypeInsuranceNewController.getRepaymentPicklist';
//import callKotakCalculateAPI from '@salesforce/apex/FeeCreationTypeInsuranceNewController.callKotakCalculateAPI';
import { refreshApex } from '@salesforce/apex';
import updateFeeCreationInsuranceRecordsSumAssured from '@salesforce/apex/FeeCreationTypeInsuranceNewController.updateFeeCreationInsuranceRecordsSumAssured';
//import updateRepaymentValue from '@salesforce/apex/FeeCreationTypeInsuranceNewController.updateRepaymentValue';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
export default class FeeCreationTypeInsuranceNew extends LightningElement {
    @api recordId;
    @api recordParenId;
    @track feeInsurance;
    @track errorMsgs;
    @track showSpinner = false;
    defaultSortDirection = 'asc';
    sortDirection = 'asc';
    @track isLoading = false
    @track sumAssured;
    @track data = [];
    @track sumAssured = [];
    @track premium = 300;
    @track arr = [];
    @track mapData = [];
    @track options = [];
    @track premiumValue;
    @track taxAmount;
    @track finalAmountValue;
    @track feeCode = []
    @track arrRepayment = [];
    optionsValue() {
        let feeCodePass = this.feeCode[0];
        console.log('fee code of result is '+feeCodePass);          
        getRepaymentPicklist({ feeCode: feeCodePass })
            .then(data => {
                //  console.log('data for repayment',JSON.stringify(data));
                for (let key in data) {
                    console.log('data for repayment',data, data[key])
                    var repayment = data[key];
                    console.log('repayment is' + repayment);
                    this.options = [... this.options, { key: repayment, value: repayment }];
                }
            })
            .catch(error=>{
                console.log('error in repayment',error);
            }
        )
    }

    refreshData() {
        console.log('data refreshed' + this.data);
        return refreshApex(this.data);
    }

    @wire(getFeeTypeInsurance, { applicationId: '$recordId' })
    wiredGetFeeCreation({ data, error }) {
        this.isLoading = true;
        if (data) {
            console.log('get fee creation');
            // commented this.optionValue for repayment option value based on master record.
            let result = JSON.parse(JSON.stringify(data));
            console.log('result==> ' + JSON.stringify(result));
            let feeCodeValue = [];
            for (var i = 0; i < result.length; i++) {
                result[i].rowNumber = i + 1;
                feeCodeValue.push(result[i].Fee_Code__c);
            }
            this.data = result;
            this.feeCode = feeCodeValue;
            console.log('fee code on get records'+ this.feeCode);
            this.optionsValue();
            if (data.length == 0) {
                console.log('grt record length' + data.length);
                
                createFeeCreationInsuranceRecords({ applicationId: this.recordId })
                .then(dataCr => {
                    console.log('data in creation' + dataCr.Fee_Code__c);
                    let feeCodeValueCr;
                    let resultCreated = JSON.parse(JSON.stringify(dataCr));
                    console.log('resultCreated==> ' + JSON.stringify(resultCreated));
                    // because single record returned from class
                    feeCodeValueCr = resultCreated.Fee_Code__c;
                    console.log('fee code on creation',resultCreated.Fee_Code__c);

                    for (var i = 0; i < resultCreated.length; i++) {
                        resultCreated[i].rowNumber = i + 1;
                    }
                    console.log('let feeCodeValueCr ',feeCodeValueCr);
                    this.data = resultCreated;
                    console.log('data in creation',this.data);
                    //  this.feeCode = feeCodeValueCr;
                   /* getRepaymentPicklist({ feeCode: feeCodeValueCr })
                        .then(data => {
                            //  console.log('data for repayment',JSON.stringify(data));
                            let assignRepayment = [];
                            for (let key in data) {
                                console.log('data for repayment',data, data[key]);                            
                                let repayment = JSON.stringify(data[key]);
                                console.log('repayment is' + repayment);
                                this.assignRepayment = [... this.assignRepayment, { key: repayment, value: repayment }];
                                console.log('assignRepayment'+assignRepayment);
                            }
                        })
                        .catch(error=>{
                            console.log('error in repayment',JSON.stringify(error));
                        })*/
                    })
                .catch(error => {
                    console.log('error' + error);
                })
            }
            console.log('finally data is' + this.data);
            this.refreshData();
            this.isLoading = false;
        }
        else if (error) {
            this.error = error;
            console.log('ERRRRRRRRRRRR  ', JSON.stringify(this.error));
            this.data = undefined;
        }
        let arr = [];
        for (var i = 0; i < this.data.length; i++) {
            console.log('arr added' + arr);
            if(this.data[i].Sum_Assured__c == null){
                arr.push(this.data[i].Application__r.Requested_Loan_Amount__c);
                this.data[i].Sum_Assured__c = this.data[i].Application__r.Requested_Loan_Amount__c;
                this.data[i].Tax_Amount__c = 0;
                this.data[i].Total_Fee__c = 0;
                this.data[i].Premium__c = 0;
            }
            else{
                arr.push(this.data[i].Sum_Assured__c);
                this.data[i].Sum_Assured__c = this.data[i].Sum_Assured__c;
                this.data[i].Tax_Amount__c = this.data[i].Tax_Amount__c;
                this.data[i].Total_Fee__c = this.data[i].Total_Fee__c;
                this.data[i].Premium__c = this.data[i].Premium__c;
            }
            console.log('repayment value in fee creation',this.data[i].Repayment_Type_2__c);
            if(this.data[i].Repayment_Type_2__c != null && this.data[i].Repayment_Type_2__c != undefined){
                this.arrRepayment[i] = this.data[i].Repayment_Type_2__c;
                console.log('repayment value in fee creation in array',this.arrRepayment[i]);
            }
        }
        this.arr = arr;
        console.log('initial arr' + this.arr);
    }

    handleChange(event) {
        console.log('handleChange called' + this.data);

        var value = event.target.value;
        this.sumAssured = value;
        console.log('value after change is' + value);
        //row number changed
        var element = event.target.getAttribute("data-row-index");
        console.log(element);
        let resultForChange = [];

        if (this.sumAssured <= 0 || this.sumAssured == null || this.sumAssured == '') {
            console.log('button error');
            event.target.classList.add('error');
            event.target.value = '';
            this.arr[element] = '';
            console.log('arr null'+ this.arr+ 'at element'+element+'changed'+this.arr[element]);
        }
        else {
            resultForChange = JSON.parse(JSON.stringify(this.data));
            console.log('resultForChange' + resultForChange);
            /*------------------------------------*/
            console.log('value changed at index' + element);
            this.arr[element] = value;
            console.log('and arr changed' + this.arr);
            /*----------------------------------*/
            event.target.classList.remove('error');
            let selectedRows = this.template.querySelectorAll('tr');
            console.log('target element');
            console.log(selectedRows.length + 'and' + this.data.length);
            console.log('target element');

            console.log(element + JSON.stringify(this.data[element]));
            console.log('id is' + JSON.stringify(this.data[element].Id));
            //this.template.querySelector("input").value = 200;
           // var dataId = JSON.parse(JSON.stringify(this.data[element].Id));
            
        }
    } 

    async handleClick(event) {
        console.log('data' + this.data + 'arr' + this.arr);
        console.log('handle click' + this.sumAssured);
        this.isLoading = true;
        let result = JSON.parse(JSON.stringify(this.data));
        console.log('   > ' + JSON.stringify(result));
        let rowDetail = JSON.stringify(event.target);
        //console.log('ROW NO >'+rowDetail);
        var element = event.target.getAttribute("data-row-index");
        console.log(element);
        
        /* let arr=[];
         for (var i = 0; i < result.length; i++) {
             
             console.log('arr added'+ arr);
             if (i == element) {
                 result[i].Sum_Assured__c = this.sumAssured;
             }
             arr.push(result[i].Sum_Assured__c);
         }*/
        console.log('selected rows');
        //let selectedRows = this.template.querySelector('.sum-insured-field');

        // console.log('sel'+selectedRows);
        console.log('arr changed to' + this.arr);
        var returnedValue = [];

        console.log('returned value' + returnedValue);

        for (var i = 0; i < result.length; i++) {

            console.log('arr  added on fetch button' + this.arr);
            if (i == element) {
                console.log('i and element');
                //  arr.splice(i,0,this.sumAssured);
                console.log('arr after slice' + 'arr' + this.arr[i] + 'result' + result[i].Sum_Assured__c);
                //  if (this.sumAssuredArr[i] == null || this.sumAssuredArr[i] == '' || result[i].Sum_Assured__c == null || this.sumAssuredArr[i] <= 0 || result[i].Sum_Assured__c == '') {
                //      alert(this.sumAssured);

                //  }
                // else {
                console.log('result is');
                if (this.arr[i] <= 0 || this.arr[i] == null || this.arr[i] == '') {
                    console.log('wrong value');
                    result[i].Sum_Assured__c = '';
                    console.log('make sum assured blank'+result[i].Sum_Assured__c);
                    result[i].Tax_Amount__c = 0;
                    console.log('tax amount', result[i].Tax_Amount__c);
                    result[i].Premium__c = 0;
                    console.log('result[i].Premium__c', result[i].Premium__c);
                    result[i].Total_Fee__c = 0;
                    this.template.querySelectorAll(".sum-insured-field").style = "border:solid 1px red "
                    //   result[i].Sum_Assured__c.classList.add('error');
                    //  this.handleChange();
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error',
                            message: 'Sum Assured can not be blank',
                            variant: 'error'
                        })
                    );
                }
                else {
                    //Premium Details is{"Id":"a0p0w000002rNV3AAM","Application__c":"a030w000008JDMfAAO",
                    //"Sum_Assured__c":200000,"Premium__c":1010,"Service_Tax__c":182,"Total_Premium__c":1192} 
                    console.log('value not null');
                    this.template.querySelectorAll(".sum-insured-field").style = "border:none"
                    result[i].Premium__c = 200;
                    result[i].Tax_Amount__c = 50;
                    result[i].Total_Fee__c = result[i].Premium__c + result[i].Tax_Amount__c;
                    console.log('arr'+this.arr[i]);
                    console.log('and sum assured changed to');
                    result[i].Sum_Assured__c = this.arr[i];
                    result[i].Repayment_Type_2__c = this.arrRepayment[i];
                    var dataId = JSON.parse(JSON.stringify(this.data[i].Id));
                   // console.log('premium is in button click' + this.premiumValue);
                    updateFeeCreationInsuranceRecordsSumAssured({ feeCreationId: dataId, sumAssured: result[i].Sum_Assured__c, premium: result[i].Premium__c, taxAmount: result[i].Tax_Amount__c, totalFee :result[i].Total_Fee__c, repayment :result[i].Repayment_Type_2__c})// do be defined in class
                        .then(data => {
                        console.log('update successful');
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Success',
                                message: 'Premium details fetched successfully',
                                variant: 'success'
                            })
                        );
                        window.location.reload();
                    })
                    .catch(error => {
                    // If the promise rejects, we enter this code block
                    console.log('error in update',error); // TestError
                    })

                  /*  await callKotakCalculateAPI({ applicationId: this.recordId })
                        .then(data => {
                            let premium;
                            console.log('Premium Details list ' + JSON.stringify(data));
                            for (let key in data) {
                                console.log('key' + key);
                                premium = JSON.parse(JSON.stringify(data[key]));
                                console.log('Premium Details is' + premium);
                                console.log('premium' + premium.Premium__c);
                                this.premiumValue = premium.Premium__c;
                                console.log('service tax' + premium.Service_Tax__c);
                                this.taxAmount = premium.Service_Tax__c;
                                console.log('tax amount' + this.taxAmount);
                                this.finalAmountValue = premium.Total_Premium__c;
                            }
                            console.log('tax amount outside' + typeof this.taxAmount);

                            //result[i].Tax_Amount__c = 50;
                            // console.log('result tax amount' + result[i].Tax_Amount__c);
                            // console.log('assign values in api');
                            // result[i].Premium__c = this.premiumValue;

                            // console.log('result[i].Premium__c' + result[i].Premium__c);
                            //  result[i].Tax_Amount__c = this.taxAmount;
                            console.log(result);

                        })
                        .catch(error => {
                            console.log('error in repayment', error);
                        })
                    console.log(result);
                    result[i].Tax_Amount__c = this.taxAmount;
                    console.log('tax amount', result[i].Tax_Amount__c);
                    result[i].Premium__c = this.premiumValue;
                    console.log('result[i].Premium__c', result[i].Premium__c);
                    result[i].Total_Fee__c = this.finalAmountValue;
                    // result[i].Sum_Assured__c = */
                }




                //   }

            }

        } this.data = result;
        this.isLoading = false;



    }
    handleGetSelectedValue(event){
        console.log('repayment value selected',event.target.value);
        let element = event.target.getAttribute("data-row-index");
        console.log('Row No ',element);
        console.log('Elements  ',JSON.stringify(event));
        console.log('element in mode ',JSON.stringify(this.template.querySelector('table').rows));
        var dataId = JSON.parse(JSON.stringify(this.data[element].Id));
        for (var i = 0; i < this.data.length; i++) {
            console.log('Repayment changed');
            if(i == element){
                console.log('this element changes');
                this.arrRepayment[i] = event.target.value;
                console.log(this.arrRepayment[i]);
            }
        }
        console.log('and repayment array is',JSON.stringify(this.arrRepayment));
            
      /*  updateRepaymentValue({feeCreationId : dataId, repaymentPick : event.target.value })
        .then(data=>{
            console.log('success in updated');
        })
        .catch(error=>{
            console.log('error in repayment',error);
        })*/
    }
    /* callKotakCalculateAPI(){
         console.log('api called');
         let valueArr = [];
         console.log('value array'+ valueArr);
         callKotakCalculateAPI({ applicationId: this.recordId })
                         .then(data=>{
                             let premium;
                             console.log('Premium Details list '+JSON.stringify(data));
                             for (let key in data) {
                                 console.log('key'+key);
                                 premium = JSON.parse(JSON.stringify(data[key]));
                                 console.log('Premium Details is'+premium);
                                 console.log('data[key]'+ JSON.stringify(data[key].Premium__c));
                                 console.log('premium'+ premium.Premium__c);
                                 this.premiumValue = JSON.stringify(data[key].Premium__c);
                                 console.log('service tax'+ premium.Service_Tax__c);
                                 console.log('premium is'+this.premiumValue);
                                 valueArr.push(this.premiumValue);
                               //  this.taxAmount = premium.Service_Tax__c;
                               //  system.debug('tax amount'+this.taxAmount);
                             }
                             console.log('valueArr changed'+valueArr);
                            // result[i].Tax_Amount__c = premium.Service_Tax__c;
                         })
                         .catch(error=>{
                             console.log('error in repayment'+JSON.stringify(error));
                         })
                         return valueArr
 
     }*/




}