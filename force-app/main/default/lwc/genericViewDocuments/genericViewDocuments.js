import { LightningElement, api, track } from 'lwc';
import loadInitialData from '@salesforce/apex/genericFileViewerController.loadInitialData';
import { NavigationMixin } from 'lightning/navigation';

export default class GenericViewDocuments extends NavigationMixin(LightningElement) {
    @api recordId;
    @api uploadedFrom;
    @track files = [];

    connectedCallback() {
        this.getDocuments();
    }

    @api
    getDocuments(){
        let uploadedStage = this.uploadedFrom ? this.uploadedFrom : '';
        loadInitialData({ recordId: this.recordId, uploadedFrom: uploadedStage }).then((result) => {
            console.log('getFIV_CRecordTypeId= ', result);
            this.files = result;
        }).catch((err) => {
            console.log('Error in getFIV_CRecordTypeId= ', err);
        });
    }

    navigateToFiles(event) {
        this[NavigationMixin.Navigate]({
            type: 'standard__namedPage',
            attributes: {
                pageName: 'filePreview'
            },
            state: {
                //recordIds: event.target.dataset.id
                selectedRecordId: event.currentTarget.dataset.id
            }
        })
    }
}