import { LightningElement, api, track } from 'lwc';

export default class FeeInsuranceParentPCScreen extends LightningElement {
    @api recordId;
    @api preLogInId;
    @api appName;
    @api primaryApplicantName;
    @api stageName;
    @track receiptWrapper = { hasReceipt: false, allApproved: false, pendingReceiptList: [], lengthOfDirectRec: 0, existingFeeCodeOption: [] };

    @api getReceipt() {
        this.template.querySelector('c-prelogin-receipt-screen').getAllReceiptData();
    }

    getReceiptPendingList(event) {
        this.receiptWrapper.hasReceipt = event.detail.hasReceipt;
        this.receiptWrapper.allApproved = event.detail.allApproved;
        this.receiptWrapper.pendingReceiptList = event.detail.pendingReceiptList;
        this.receiptWrapper.lengthOfDirectRec = event.detail.lengthOfDirectRec;
        this.receiptWrapper.existingFeeCodeOption = event.detail.existingFeeCodeOption;
           const receiptEvent = new CustomEvent("getreceiptevent", {
                    detail: this.receiptWrapper,
                    bubbles: true,
                    composed: true
                });
                console.log('dispatch receiptEvent ', JSON.stringify(receiptEvent));
                this.dispatchEvent(receiptEvent);
    }
}