import { api, LightningElement, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getUploadedRecords from '@salesforce/apex/fsGenericUploadDocumentsController.getUploadedRecords';
import getAdditionalRecords from '@salesforce/apex/fsGenericUploadDocumentsController.getAdditionalRecords';
export default class FsGenericUploadDocuments extends NavigationMixin(LightningElement) {
    @api recordTypeId;
    @api applicationId;
    @api isAgreementExecution;
    @api stageName;
    @track tabName = "Upload";
    @track uploadedDocData;
    @track addtionalDocuments;
    @track isSpinnerActive;
    connectedCallback() {
        this.getUploadedRecords();
    }
    handleActive(event) {
        this.tabName = event.target.value;
        if (this.tabName === 'View Documents') {
            this.getUploadedRecords();
            this.getAdditionalRecords();
        }
    }
    getUploadedRecords() {
        this.isSpinnerActive = true;
        getUploadedRecords({ parentId: this.applicationId, stage: this.stageName })
            .then(result => {
                console.log('uploaded document :: ', JSON.stringify(result));
                this.uploadedDocData = result;
                this.isSpinnerActive = false;
            })
            .catch(error => {

            })
    }
    getAdditionalRecords() {
        getAdditionalRecords({ parentId: this.applicationId })
            .then(result => {
                console.log('uploaded document :: ', JSON.stringify(result));
                this.addtionalDocuments = result;
            })
            .catch(error => {

            })
    }
    viewDocument(event) {
        var contentDocumentId = event.target.dataset.index;
        console.log('contentDocumentId ### ', contentDocumentId);
        this[NavigationMixin.Navigate]({
            type: 'standard__namedPage',
            attributes: {
                pageName: 'filePreview'
            },
            state: {
                selectedRecordId: contentDocumentId
            }
        })
    }
}