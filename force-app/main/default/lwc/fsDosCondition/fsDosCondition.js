import { LightningElement, wire, track, api } from 'lwc';
import dosConditionData from '@salesforce/apex/DosConditionController.dosConditionData';
import checkDOSCondition from '@salesforce/apex/DosConditionController.checkDOSCondition';
import NAME from '@salesforce/schema/Application__c.Name';
import BusinessDate from '@salesforce/label/c.Business_Date';
import { getRecord } from 'lightning/uiRecordApi';
import getLastLoginDate from '@salesforce/apex/DatabaseUtililty.getLastLoginDate';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
export default class FsDosCondition extends NavigationMixin(LightningElement) {
    @api recordId;
    @track DosData;
    @track todaysDate = BusinessDate;
    @track lastLoginDate;
    @track applicationName;
    @track showLoader = false;

    @wire(dosConditionData, { recordId: '$recordId' })
    applicationDetails({ error, data }) {
        console.log('applicationDetails= ', data);
        if (data) {
            this.DosData = data;
            console.log('Data', data);
        } else if (error) {
            console.log('Error', error);
        }
    }

    @wire(getRecord, { recordId: '$recordId', fields: [NAME] })
    applicationInfo({ error, data }) {
        console.log('applicationDetails= ', data);
        if (data) {
            this.applicationName = data.fields.Name.value;
        } else if (error) {
            console.log('error in getting applicationDetails = ', error);
        }
    }

    connectedCallback() {
        this.handleGetLastLoginDate();
    }

    // This Method Is Used To Show Toast Notification
    showNotifications(title, msg, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title: title,
            message: msg,
            variant: variant
        }));
    }

    handleGetLastLoginDate() {
        getLastLoginDate().then((result) => {
            console.log('getLastLoginDate= ', result);
            this.lastLoginDate = result
        }).catch((err) => {
            console.log('Error in getLastLoginDate= ', err);
        });
    }

    handleCheckDOSCondition() {
        this.showLoader = true;
        checkDOSCondition({ recordId: this.recordId }).then((result) => {
            console.log('handleCheckDOSCondition= ', result);
            if (result) {
                this.showNotifications('','DOS stage is mandatory for this application!','info');
            } else {
                this.showNotifications('','DOS stage is not mandatory for this application!','info');
            }
            this.showLoader = false;

            setTimeout(() => {
                this[NavigationMixin.Navigate]({
                    type: 'standard__recordPage',
                    attributes: {
                        recordId: this.recordId,
                        objectApiName: 'Application__c',
                        actionName: 'view'
                    }
                });
            }, 500);
        }).catch((err) => {
            this.showLoader = false;
            console.log('Error in handleCheckDOSCondition= ', err);
        });
    }
}