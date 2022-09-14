import { LightningElement ,api,wire} from 'lwc';
import {CurrentPageReference } from 'lightning/navigation';
import SavePdfAsFile from '@salesforce/apex/InPrincipleSanctionVfController.SavePdfAsFile';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { CloseActionScreenEvent } from 'lightning/actions';
export default class InPrincipleSanctionComp extends LightningElement {

    siteURL;
    @api recordId;

    connectedCallback() {
          console.log('recordId>>>'+this.recordId);
        this.siteURL = '/apex/InPrincipleSanctionVf?recId=' + this.recordId;
      
    }
 

      @wire(CurrentPageReference)
    getStateParameters(currentPageReference) {
        if (currentPageReference) {
            this.recordId = currentPageReference.state.recordId;}}



    closeQuickAction() {
        this.dispatchEvent(new CloseActionScreenEvent());
    }

    SaveFile(){
        SavePdfAsFile({parentId:this.recordId})
        .then(result => {
           if(!result.includes('Error'))  
           {this.showToast('Success', 'Success', 'Pdf Saved as File Successfully!!!');
            this.dispatchEvent(new CloseActionScreenEvent());
           }
           else
           this.showToast('Error', 'Error', 'An Error has Occured!!!!');
        })
        .catch(error => {
            this.showToast('Error', 'Error', 'An Error has Occured!!!!');
        });
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