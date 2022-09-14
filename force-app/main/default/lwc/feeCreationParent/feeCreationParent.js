import { LightningElement,api,track } from 'lwc';

export default class FeeCreationParent extends LightningElement {
    @api recordId;
    @api preLogInId;
    @api appName;
    @api primaryApplicantName;
    @api stageName;
    @track stage = false;
    @track showReceipt = false;
    connectedCallback(){
        console.log('Stage name',this.stageName);
        if(this.stageName == 'Pre Login'){
            this.stage = true;
        }
    }
    @api getReceipt(){
        this.template.querySelector('c-prelogin-receipt-screen').getAllReceiptData();
    }
    getRecFeeCodeChange(event){
        console.log('fee code change parent',this.template.querySelector('c-prelogin-receipt-screen'));
        this.template.querySelector('c-prelogin-receipt-screen').getFeeCodeChange();
    }
}