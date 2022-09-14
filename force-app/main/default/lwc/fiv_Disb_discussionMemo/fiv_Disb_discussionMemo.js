import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

import savePdf from '@salesforce/apex/FS_DisbursalMemoController.saveDisbursalMemoPDF';

export default class Fiv_Disb_discussionMemo extends NavigationMixin(LightningElement) {
    @api applicationId;
    @api stageName = '';

    _applicationId = '';
    _stageName = '';

    isModalOpen = false;
    showSpinner = false;
    siteURL = '';

    closeModal(){
        this.isModalOpen = false;
    }

    handleSavePdf() {
        this.showSpinner = true;
        if (!this.applicationId) {
            this.applicationId = 'a030w000008HwIQAA0';
        }
        this.siteURL = `/apex/fs_disbursalMemo?id=${this.applicationId}`;
        this._applicationId = this.applicationId;
        this._stageName = this.stageName;
        console.log('save pdf called ', this.applicationId);
        savePdf({ applicationId: this._applicationId, stageName: this._stageName }).then(result => {
            console.log('Search Result ', result);
            console.log('save df called successfully');
            this.isModalOpen = true;
            // this[NavigationMixin.Navigate]({
            //     type: 'standard__webPage',
            //     attributes: {
            //         url: `/apex/fs_disbursalMemo?id=${this.applicationId}`
            //     }
            // });

            this.showSpinner = false;
        }).catch(error => {
            console.log('error occured', error);
        });
    }
}