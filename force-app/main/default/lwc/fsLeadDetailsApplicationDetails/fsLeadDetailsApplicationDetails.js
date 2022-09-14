import { LightningElement, api, track } from 'lwc';
import saveRecord from'@salesforce/apex/FsLeadDetailsController.saveRecord';
import getSectionContent from '@salesforce/apex/FsLeadDetailsController.getSectionContent';
export default class FsLeadDetailsApplicationDetails extends LightningElement {
    @api allLoanApplicant;
    @api applicationId
    @track tableData;
    @track isRecordEdited = false;
    @track recordIds;
    @track fieldsContent;
    @track objectIdMap = {'Application__c':''};
    @track isSpinnerActive = false;
    
    connectedCallback(){
        this.getSectionPageContent(this.applicationId);
    }
    getSectionPageContent(recId){
        try{
            getSectionContent({recordIds : recId, metaDetaName : 'Lead_Details_Application_Details'})
            .then(result => {
                console.log('data ### ',JSON.parse(result.data));
                this.fieldsContent = result.data;
            })
            .catch(error => {
                console.log(error);
            });
        }catch(error){
            console.log(error);
        }
    }
    

    
    changedFromChild(event){
        console.log('changedFromChild ### ',JSON.stringify(event.detail));
    }
    handleSave(){
        var data = this.template.querySelector("c-generic-edit-pages-l-w-c").handleOnSave();
        console.log('data #### ',JSON.stringify(data));
        if(data.length > 0){
            this.isSpinnerActive = true;
            data[0].Id = this.applicationId;   
            saveRecord({dataToInsert : JSON.stringify(data[0])})
            .then(result => {
                this.fieldsContent = {};
                this.isSpinnerActive = false;
                this.showtoastmessage('Success','Success','Record Saved Successfully.');
            })
            .catch(error => {
                console.log(error);
                this.showtoastmessage('Error','Error',JSON.stringify(error));
            });
        } else{
            this.showtoastmessage('Error','Error','Complete Required Field(s).');
        }
    }   
    handleCancel(){
        console.log('handle cancel called ###');
        this.fieldsContent = {};
    }
    showtoastmessage(title, variant, message){
        var selectedEvent = new CustomEvent('showtoastmessage', { 
            detail : {
                'title':title,
                'variant':variant,
                'message':message,
            }
        });    
        this.dispatchEvent(selectedEvent);
    }
}