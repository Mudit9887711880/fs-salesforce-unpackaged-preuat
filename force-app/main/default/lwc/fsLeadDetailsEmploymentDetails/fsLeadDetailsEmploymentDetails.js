import { api, track, LightningElement } from 'lwc';
import saveRecord from'@salesforce/apex/FsLeadDetailsController.saveRecord';
import getSectionContent from '@salesforce/apex/FsLeadDetailsController.getSectionContent';
import getEmploymentDetailsData from'@salesforce/apex/FsLeadDetailsControllerHelper.getEmploymentDetailsData';
import { deleteRecord } from 'lightning/uiRecordApi';
import getAllApplicantMeta from '@salesforce/apex/FsLeadDetailsControllerHelper.getAllApplicantMeta';
export default class FsLeadDetailsEmploymentDetails extends LightningElement {
    @api rowAction;
    @api allLoanApplicant;
    @track tableData;
    @track isRecordEdited = false;
    @track recordIds;
    @track fieldsContent;
    @track objectIdMap = {'Employment_Details__c':''};
    @track isSpinnerActive = false;
    @track recordIdForDelete;
    @track isApplicantEdit = true;
    @track selectedApplicant;
    @api allApplicantData;
    @track empCheck = false;
    @track labelSave = 'Save';
    @track showDeleteModal;
    connectedCallback(){
        this.getEmploymentDetailsAllData();
    }
    getSectionPageContent(recId){
        getSectionContent({recordIds : recId, metaDetaName : 'Lead_Details_Employment_Details'})
        .then(result => {
            this.fieldsContent = result.data;
            this.isSpinnerActive = false;
            var _tempVar = JSON.parse(this.fieldsContent);
            for(var i=0; i<_tempVar[0].fieldsContent.length; i++){
                if(_tempVar[0].fieldsContent[i].fieldAPIName === 'Occupation__c'){    
                    var isSelfEmployed = _tempVar[0].fieldsContent[i].value === 'Self Employed Non Professional' || _tempVar[0].fieldsContent[i].value === 'Self Employed Professional' ? true : false;
                    var isSalaried = _tempVar[0].fieldsContent[i].value === 'Salaried' ? true : false;
                    setTimeout(() => {
                        this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setValues('isSelfEmployed',isSelfEmployed)));
                        this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setValues('isSalaried',isSalaried)));
                    }, 200);
                }
            }
        })
        .catch(error => {
            console.log(error);
        });
    }
    setValues(_fieldAPIName,_val){
        console.log('_fieldAPIName #### ',_fieldAPIName);
        console.log('_val #### ',_val);
        try{
        var _tempVar = JSON.parse(this.fieldsContent);
        console.log(_tempVar);
        for(var i=0; i<_tempVar[0].fieldsContent.length; i++){
            if(_fieldAPIName === 'isSelfEmployed' && _tempVar[0].fieldsContent[i].fieldAPIName === 'Name_of_Business__c' && _val){
                _tempVar[0].fieldsContent[i].disabled = false;
                _tempVar[0].fieldsContent[i].fieldAttribute.isRequired = true;
            }
            else if(_fieldAPIName === 'isSelfEmployed' &&  _tempVar[0].fieldsContent[i].fieldAPIName === 'Name_of_Business__c' && !_val){
                _tempVar[0].fieldsContent[i].value = '';
                _tempVar[0].fieldsContent[i].disabled = true;
                _tempVar[0].fieldsContent[i].fieldAttribute.isRequired = false;
            }

            if(_fieldAPIName === 'isSalaried' && _tempVar[0].fieldsContent[i].fieldAPIName === 'Name_of_Employer__c' && _val){
                _tempVar[0].fieldsContent[i].disabled = false;
                _tempVar[0].fieldsContent[i].fieldAttribute.isRequired = true;
            }
            else if(_fieldAPIName === 'isSalaried' && _tempVar[0].fieldsContent[i].fieldAPIName === 'Name_of_Employer__c' && !_val){
                _tempVar[0].fieldsContent[i].value = '';
                _tempVar[0].fieldsContent[i].disabled = true;
                _tempVar[0].fieldsContent[i].fieldAttribute.isRequired = false;
            }
        }
        this.fieldsContent = JSON.stringify(_tempVar);
        }catch(error){console.log(error)}
        return _tempVar;
    }
    changedFromChild(event){
        console.log('changedFromChild ### ',JSON.stringify(event.detail));
        var tempFieldsContent = event.detail;
        if(tempFieldsContent.CurrentFieldAPIName === 'Employment_Details__c-Occupation__c'){
            //if(tempFieldsContent.CurrentFieldValue === 'Self Employed Non Professional' || tempFieldsContent.CurrentFieldValue === 'Self Employed Professional'){
                var isSelfEmployed = tempFieldsContent.CurrentFieldValue === 'Self Employed Non Professional' || tempFieldsContent.CurrentFieldValue === 'Self Employed Professional' ? true : false
                this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setValues('isSelfEmployed',isSelfEmployed)));
            //}
            //if(tempFieldsContent.CurrentFieldValue === 'Salaried'){
                var isSalaried = tempFieldsContent.CurrentFieldValue === 'Salaried' ? true : false;
                this.template.querySelector('c-generic-edit-pages-l-w-c').refreshData(JSON.stringify(this.setValues('isSalaried',isSalaried)));    
            //}
        }
    }
    @api getEmploymentDetailsAllData(){
        getEmploymentDetailsData({allLoanApplicant : this.allLoanApplicant})
        .then(result => { 
            this.tableData = result;    
            this.isApplicantEdit = true;
            this.empCheck = false;
            var temp = JSON.parse(result.strDataTableData);
            if(temp.length == 0)
                this.empCheck  = false;
            else
                this.empCheck  = true;
             const checkValidEmp = new CustomEvent("checkempdetailinfo", {
                    detail: this.empCheck 
                });
                console.log('empevent ',checkValidEmp);
                this.dispatchEvent(checkValidEmp);
        })
        .catch(error => {
            console.log('error in empdetail ',error);
        })    
    }

    handleSelectedApplication(event){
        console.log('Edit called #### ',JSON.stringify(event.detail));
        var recordData = event.detail.recordData;
        this.fieldsContent = undefined;
        if(event.detail.ActionName === 'edit'){
            this.isSpinnerActive = true;
            this.labelSave= 'Update';
            this.isRecordEdited = true;    
            this.recordIds = recordData.Id;
            this.objectIdMap['Employment_Details__c'] = recordData.Id;
            this.getSectionPageContent(this.recordIds);
            this.isSpinnerActive = false;
            this.isApplicantEdit = false;
        }
        if (event.detail.ActionName === 'delete') {
            this.recordIdForDelete = event.detail.recordData.Id;
            this.showDeleteModal = true;
        }
    }
    
    handleSave(){
        var data = this.template.querySelector("c-generic-edit-pages-l-w-c").handleOnSave();
        if(data.length > 0){   
            this.isSpinnerActive = true;
            for(var i=0; i<data.length; i++){
                if(this.selectedApplicant === undefined){
                    data[i].Id = this.objectIdMap[data[i].sobjectType];
                } else{
                    data[i].Customer_Information__c = this.selectedApplicant[0].Customer_Information__c;
                    data[i].Loan_Applicant__c = this.selectedApplicant[0].Id;
                }
                console.log('data',JSON.stringify(data));
                saveRecord({dataToInsert : JSON.stringify(data[i])})
                .then(result => {
                    this.fieldsContent = undefined;
                    this.isSpinnerActive = false;
                    this.showtoastmessage('Success','Success',result);
                    this.tableData = undefined;
                    this.allApplicantData = undefined;
                    this.getEmploymentDetailsAllData();
                    this.getAllApplicantMeta();
                })
                .catch(error => {
                    console.log(error);
                    this.showtoastmessage('Error','Error',JSON.stringify(error));
                });
            }
        } else{
            this.showtoastmessage('Error','Error','Complete Required Field(s).');
        }
    }   
    handleCancel(){
        this.fieldsContent = undefined;
        this.isApplicantEdit = true;
        this.allApplicantData = undefined;
        this.getAllApplicantMeta();
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
    handleDelete(event) {
        this.isSpinnerActive = true;
        let label = event.target.label;
        if (label == 'Yes') {
            this.showDeleteModal = false;
            deleteRecord(this.recordIdForDelete)
            .then(() => {
                this.tableData = undefined;
                this.getEmploymentDetailsAllData();
                this.isSpinnerActive = false;
            })
            .catch(error => {
                console.log(error);
            });  
        } else if (label == 'No') {
            this.showDeleteModal = false;
            this.isSpinnerActive = false;    
        }
    }
    handleRadtioButton(event){
        this.labelSave='Save';
        this.getSectionPageContent();
        this.selectedApplicant = event.detail;
        console.log('event #### ',JSON.stringify(event.detail));
    }
    getAllApplicantMeta(){
        getAllApplicantMeta({ allLoanApplicant: this.allLoanApplicant })
        .then(result => {
            this.allApplicantData = result;
            this.isSpinnerActive = false;
        })
        .catch(error => {

        })
    }
    handlemodalactions(event){
        this.showDeleteModal = false;
        if(event.detail === true){
            this.tableData = undefined;
            this.getEmploymentDetailsAllData();
        }
    }
}