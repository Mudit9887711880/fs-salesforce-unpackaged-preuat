import { api, LightningElement, track, wire} from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import NAME from '@salesforce/schema/Application__c.Name';
export default class FsDeferalDocment extends LightningElement {
    @api isAgreementExecution;
    @api recordId;
    @track tabName;
    @track applicationName;
    
    @wire(getRecord, { recordId: '$recordId', fields: [NAME] })
    applicationDetails({ error, data }) {
        if (data) {
            this.applicationName = data.fields.Name.value;
        } else if (error) {
            console.log('error in getting applicationDetails = ', error);
        }
    }
    handleActive(event) {
        this.tabName = event.target.value;
    }
}