import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import createSendBackHistory from '@salesforce/apex/Utility.createSendBackHistory';
export default class FsSendBack extends LightningElement {
    @api showModal;
    @api stageFrom;
    @api applicationId;

    @track remarks;

    get stageOptions() {
        console.log('Stage is= ', this.stageFrom)
        if (this.stageFrom === 'Approval Credit') {
            return [
                { label: 'Process Credit', value: 'Process Credit' }
            ];
        }
        if (this.stageFrom === 'Final Sanction') {
            return [
                { label: 'Approval Credit', value: 'Approval Credit' },
                { label: 'Legal Approval', value: 'Legal Approval' }
            ];
        }
        if (this.stageFrom === 'Post Approval') {
            return [
                { label: 'Approval Credit', value: 'Approval Credit' }
            ];
        }
        if (this.stageFrom === 'Agreement Execution') {
            return [
                { label: 'Approval Credit', value: 'Approval Credit' },
                { label: 'Legal Approval', value: 'Legal Approval' }
            ];
        }
        if (this.stageFrom === 'Document Receipt') {
            return [
                { label: 'Agreement Execution', value: 'Agreement Execution' }
            ];
        }
        if (this.stageFrom === 'Disbursal Maker') {
            console.log('Stage is= ', this.stageFrom)
            return [
                { label: 'Approval Credit', value: 'Approval Credit' }
            ];
        }
        if (this.stageFrom === 'Disbursal Author') {
            console.log('Stage is= ', this.stageFrom)
            return [
                { label: 'Disbursal Maker', value: 'Disbursal Maker' }
            ];
        }
    }

    handleCancelClick(event) {
        const selectedEvent = new CustomEvent('closeclick', { detail: true });
        this.dispatchEvent(selectedEvent);
    }

    handleSubmitClick(event) {
        var remarksValue = this.template.querySelector('lightning-textarea').value;
        var selectedValue = this.template.querySelector('lightning-combobox').value;
        if (remarksValue && selectedValue) {
            createSendBackHistory({
                parentId: this.applicationId,
                title: this.stageFrom + ' - ' + selectedValue,
                body: remarksValue
            }).then((result) => {
                console.log('createSendBackHistory result =', result);
                if (result == 'success') {
                    const selectedEvent = new CustomEvent('submitclick', { detail: selectedValue });
                    this.dispatchEvent(selectedEvent);
                }
            }).catch((err) => {
                console.log('error in createSendBackHistory= ', err);
            });
        } else if (!selectedValue) {
            this.showNotification('', 'Please select stage before submitting', 'error');
        } else if (!remarksValue) {
            this.showNotification('', 'Please fill remarks before submitting', 'error');
        }
    }

    showNotification(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        }));
    }
}