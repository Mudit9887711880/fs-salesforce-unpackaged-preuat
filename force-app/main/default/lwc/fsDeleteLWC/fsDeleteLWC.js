import { LightningElement, api, track } from 'lwc';
import deleteSelectedRecord from '@salesforce/apex/GenericUtility.deleteSelectedRecord';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
export default class FsDeleteLWC extends LightningElement {

    @api deleteFrom;
    @api objectApiName;
    @api recId;
    @api showModal;
    @track isSpinnerActive = false;


    connectedCallback() {
        //parameters from parent 
        console.log('connecetd callback called');
        console.log('delteFRom>>>> ', this.deleteFrom);
        console.log('objectApiName>>>> ', this.objectApiName);
        console.log('recId>>>> ', this.recId);
        console.log('this.showmoadl>>>> ', this.showModal);
    }




    ondelete(event) {
        this.isSpinnerActive = true;
        console.log('delete logic call', event);
        console.log('delteFRom>>>> ', this.deleteFrom);
        console.log('objectApiName>>>> ', this.objectApiName);
        console.log('recId>>>> ', this.recId);
        if (this.deleteFrom != undefined && this.objectApiName != undefined && this.recId != undefined) {
            deleteSelectedRecord({
                deletedFrom: this.deleteFrom, recordId: this.recId, objApiName: this.objectApiName
            }).then(result => {
                console.log('result', result);
                if (result && result.length) {
                    if (result == 'success')
                        this.showToast('Success', 'success', 'Record Deleted Successfully');
                    else if (result == 'error')
                        this.showToast('Error', 'error', 'An error has Occured');
                    this.isSpinnerActive = false;

                    var handleDelete = new CustomEvent('modaldelete', {
                        detail: true
                    });
                    this.dispatchEvent(handleDelete);
                }
            }).catch(error => {
                console.log('error in deletion logic', error);
            });
        }
    }


    closeModal(event) {
        var handleDelete = new CustomEvent('modalcancel', {
            detail: true
        });
        this.dispatchEvent(handleDelete);

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
}