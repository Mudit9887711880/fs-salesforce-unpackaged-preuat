import { LightningElement, api, track } from 'lwc';
import saveRecord from'@salesforce/apex/FsLeadDetailsController.saveRecord';
import getSectionContent from '@salesforce/apex/FsLeadDetailsController.getSectionContent';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
export default class FsLeadDetailsReferenceDetails extends LightningElement {
    
    @api recordId;
    @track fieldsContent;
    @track isSpinnerActive = false;
    
    connectedCallback(){
        console.log('ref detail ',this.recordId);
        this.getSectionPageContent('');
    }
    
    getSectionPageContent(recId){
        console.log('getsection called');
        this.fieldsContent = undefined;
        getSectionContent({recordIds : this.recordId, metaDetaName : 'Lead_Details_Reference_Details'})
        .then(result => {
            console.log('res reference ',result)
            this.fieldsContent = result.data;

            var _tempVar = JSON.parse(this.fieldsContent);
            console.log(_tempVar);
            for(var i=0; i<_tempVar[0].fieldsContent.length; i++){
                console.log('test #### ',_tempVar[0].fieldsContent[i].fieldAPIName);
                if(_tempVar[0].fieldsContent[i].fieldAPIName === 'Refered_By_Existing_Customer__c'){
                    console.log('test #### ',_tempVar[0].fieldsContent[i].fieldAPIName);
                    var isValYes = _tempVar[0].fieldsContent[i].value === 'Yes' ? true : false;
                    setTimeout(() => {
                        this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setValues('Application__c-Refered_By_Existing_Customer__c',isValYes)));
                    }, 200);
                }
            }
            this.isSpinnerActive = false;
        })
        .catch(error => {
            console.log('123 ',error);
        });
    }
    
    changedFromChild(event){
        console.log('changedFromChild ### ',JSON.stringify(event.detail));
        var tempFieldsContent = event.detail;
        if(tempFieldsContent.CurrentFieldAPIName === 'Application__c-Refered_By_Existing_Customer__c'){
            var isValYes = tempFieldsContent.CurrentFieldValue === 'Yes' ? true : false;
            this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setValues('Refered_By_Existing_Customer__c',isValYes)));
        }
    }
    setValues(_fieldAPIName,_val){
        try{
        var _tempVar = JSON.parse(this.fieldsContent);
        console.log(_tempVar);
        for(var i=0; i<_tempVar[0].fieldsContent.length; i++){
            if(_tempVar[0].fieldsContent[i].fieldAPIName === 'Refered_By_Customer_Loan_Account_No__c' && _val){
                _tempVar[0].fieldsContent[i].disabled = false;
                _tempVar[0].fieldsContent[i].value = '';
                _tempVar[0].fieldsContent[i].fieldAttribute.isRequired = true;
                _tempVar[0].fieldsContent[i].fieldAttribute.isRequired = true;
            } else if(_tempVar[0].fieldsContent[i].fieldAPIName === 'Refered_By_Customer_Loan_Account_No__c' && !_val){
                _tempVar[0].fieldsContent[i].value = '';
                _tempVar[0].fieldsContent[i].disabled = true;
                _tempVar[0].fieldsContent[i].fieldAttribute.isRequired = false;
            }

            if(_tempVar[0].fieldsContent[i].fieldAPIName === 'Refered_By_Introducer_Broker_Name__c' && !_val){
                _tempVar[0].fieldsContent[i].disabled = false;
                _tempVar[0].fieldsContent[i].value = '';
                _tempVar[0].fieldsContent[i].fieldAttribute.isRequired = true;
                _tempVar[0].fieldsContent[i].fieldAttribute.isRequired = true;
            } else if(_tempVar[0].fieldsContent[i].fieldAPIName === 'Refered_By_Introducer_Broker_Name__c' && _val){
                _tempVar[0].fieldsContent[i].value = '';
                _tempVar[0].fieldsContent[i].disabled = true;
                _tempVar[0].fieldsContent[i].fieldAttribute.isRequired = false;
            }
        }
        this.fieldsContent = JSON.stringify(_tempVar);
        }catch(error){console.log(error)}
        return _tempVar;
    }
    handleSave(){
        var data = this.template.querySelector("c-generic-edit-pages-l-w-c").handleOnSave();
        if(data.length > 0){   
            this.isSpinnerActive = true;
            for(var i=0; i<data.length; i++){
                data[i].Id = this.recordId
                console.log('data 2## ', JSON.stringify(data));
                saveRecord({dataToInsert : JSON.stringify(data[i])})
                .then(result => {
                    //this.fieldsContent = undefined;
                    this.showToastMessage('Success','Record Successfully Updated.','Success');
                    this.isSpinnerActive = false;
                })
                .catch(error => {
                    console.log(error);
                    this.showToastMessage('Error','Error',JSON.stringify(error));
                });
            }
        } else{
            this.showToastMessage('Error', 'Complete Required Field(s).', 'Error');
        }
    }  
    showToastMessage(title, message, variant){
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(evt);
    } 
}