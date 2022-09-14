import { LightningElement, track, api } from 'lwc';
import getAccData from '@salesforce/apex/FetchDataTableRecordsController.getAccData';
export default class FsAddNewApplicant extends LightningElement {
    @api applicationId;
    @api preloginId;
    @track customerTypeValue;
    @track verificationTypeValue;
    @track ocrTable;
    @track showCustomerInfoForm = false;
    @track isSpinnerActive = false;
    @track loanData;
    @track isCustomerForm = true;
    @track isSpinnerActive;
    connectedCallback(){
        getAccData({ applicationId: this.applicationId })
            .then(result => {
                var temp = JSON.parse(result.strDataTableData);
                this.loanData = temp;
                
            })
            .catch(error => {
                console.log('Error In Get ACC Data ', error);
            })
    }
    handleOCREvent(event){
        console.log('OCR EVENT ',event.detail);
        this.showCustomerInfoForm = event.detail;  
        this.isCustomerForm = this.showCustomerInfoForm == true ? false : true;  
    }
    handleCustomerType(event){
        console.log('Cus EVENT ',event.detail);
        this.customerTypeValue = event.detail;
    }
    handleVerificationValue(event){
        console.log('Verification EVENT ',event.detail);
        this.verificationTypeValue = event.detail;
        if(this.verificationTypeValue === 'Self'){
            this.isSpinnerActive = false;
            setTimeout(() => {
                this.template.querySelector("c-fs-loan-applicant-information").getSectionPageContent('');
            }, 200);
        }
    }
    handleOCRTable(event){
        console.log('OCR Table EVENT ',event.detail);
        this.ocrTable = event.detail;
        console.log('queryselector ',this.template.querySelector('c-fs-loan-applicant-information'));
        if(this.showCustomerInfoForm){
            console.log('call child method');
            setTimeout(() => {
                this.template.querySelector("c-fs-loan-applicant-information").getOCRTableInfo(this.ocrTable);
            }, 200);
        }
    }
    getOCRDocs(event){
        console.log('ocr docs ',event.detail);
        setTimeout(() => {
            this.template.querySelector("c-fs-loan-applicant-information").getOCRDocs(event.detail);
        }, 200);
    }

    handleCancel(event){
        this.dispatchEvent(new CustomEvent('addapplicantclose'));
    }
    handleSave(){
        //this.isSpinnerActive = true
        console.log('handle save called');
        try{
            this.template.querySelector("c-fs-loan-applicant-information").handleSave();
        }catch(error){
            console.log(error);
        }
    }
    testmethod(){

    }
}