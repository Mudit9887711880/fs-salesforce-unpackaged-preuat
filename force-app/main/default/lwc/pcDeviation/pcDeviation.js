import { LightningElement, api, track } from 'lwc';
import getAllPendingDeviatons from '@salesforce/apex/pcDeviationController.getAllPendingDeviatons';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';



export default class PcDeviation extends LightningElement {

    @api applicationId;
    @api stageName;

    @track recordID;

    connectedCallback() {
        console.log('application id in pc deviation', this.applicationId);
       // this.recordID = this.applicationId;
        
        console.log('stagename in pc deviation', this.stageName);
    }

    handleRefreshDeviations(event) {
        console.log('refresh event value', event.detail);
        if (event.detail) {
            if (this.template.querySelector('c-pc-decisioned-deviation-table')) {
                console.log('method is ready to call', event.detail);
                this.template.querySelector('c-pc-decisioned-deviation-table').refreshDecisionedDeviationTable();
            }
        }
    }

    /***Added by Ajay Kumar */
    @api checkPendingDeviations() {
        let stage;
        if (this.stageName == 'Process Credit' || this.stageName == 'Approval Credit')
            stage = 'Credit';
        else if (this.stageName == 'Disbursal Maker' || this.stageName == 'Disbursal Author')
            stage = 'Operations';
        getAllPendingDeviatons({ applicationId: this.applicationId, stage: stage })
            .then(result => {
                console.log('Pending Deviations Validation ####', result);
                if (result) {
                    const deviationEvent = new CustomEvent("checkpendingdevaition", { detail: result });
                    this.dispatchEvent(deviationEvent);
                }
            })
            .catch(error => {
                console.log('Pending Deviations Error ####', error);
            })
    }

    /*   connectedCallback() {
           //code
           setTimeout(() => {
               console.log('this.application ID ', this.applicationId);
               
           }, 300);
           console.log('this.application ID ', this.applicationId);
           this.deviationSpinner = true;
           this.handleMsCodes();
           this.getDeviationTableRecords('System');
           this.getDeviationTableRecords('Manual');
       }
   
       handleChange(event) {
           let value = event.detail.value;
           if (event.target.name == 'Deviation Codes') {
               this.devCode = value;
               this.description = this.codeMap.has(value) ? this.codeMap.get(value).Deviation_Description__c : null;
               this.applicablefor = this.codeMap.has(value) ? this.codeMap.get(value).Deviation_Level__c : null;
               this.approvalLevel = this.codeMap.has(value) ? this.codeMap.get(value).Approval_Authority__c : null;
           }
           else if (event.target.name == 'Remark__c') {
               this.remarkValue = value;
           }
       }
   
       handleraiseDeviation(event) {
           this.showEditForm = false;
           this.showNewForm = true;
       }
   
   
       handleDeviationSuccess(event) {
           this.deviationId = undefined;
   
   
           if (this.editDeviation) {
               console.log('hello edit called', this.showEditForm);
               this.dispatchEvent(
                   new ShowToastEvent({
                       title: 'Success',
                       variant: 'success',
                       message: 'Record Updated Successfully'
                   })
               );
               this.resetLogic();
               this.deviationSpinner = true;
               this.getDeviationTableRecords('System');
               this.editDeviation = false;
               this.showEditForm = false;
           }
           else {
               console.log('hello new called', this.showNewForm);
               this.dispatchEvent(
                   new ShowToastEvent({
                       title: 'Success',
                       variant: 'success',
                       message: 'Record Created Successfully'
                   })
               );
               this.resetLogic();
               this.deviationSpinner = true;
               this.getDeviationTableRecords('Manual');
               this.showNewForm = false;
               console.log('hello sab called', this.showNewForm);
   
           }
   
       }
   
       handleDeviationSubmit(event) {
   
           console.log('this.editdeviation>>>>>', this.editDeviation, 'this.showeditform>>>>>>', this.showEditForm);
           if (this.showNewForm) {
               if (this.template.querySelector(".DevCode").value == null) {
                   console.log('Deviation Code is null');
                   let devcode = this.template.querySelector('.DevCode');
                   devcode.reportValidity();
                   event.preventDefault();
               }
           }
           // if (this.template.querySelectorAll('[data-id ="reamrks"]') != null) {
           //     console.log('remarks validation checked');
           //     const remarkRegex = "[a-zA-Z0-9]{250}";
           //     let remark = this.template.querySelector('[data-id ="reamrks"]');
           //     let reamrkvalue = remark.value;
           //     if (reamrkvalue.match(remarkRegex)) {
           //         remark.setCustomValidity("");
   
           //     } else {
           //         remark.setCustomValidity("Please enter alphanumeric characters not more 250");
           //     }
           //     remark.reportValidity();
           // }
   
       }
   
       onCancel(event) {
           console.log('event', event.currentTarget.dataset.id);
           if (event.currentTarget.dataset.id == 'cancel-btn-edit')
               this.showEditForm = false;
           else if (event.currentTarget.dataset.id == 'cancel-btn-new')
               this.showNewForm = false;
       }
   
       handleSelectedDeviation(event) {
           console.log('event.detail called>>>>>> ', event.detail);
           var data = event.detail;
           if (data && data.ActionName == 'edit') {
               this.showNewForm = false;
               this.deviationId = data.recordData.Id;
   
               this.editDeviation = true;
               this.showEditForm = true;
           }
           else if (data && data.ActionName == 'delete') {
               this.recordIdtoDelete = data.recordData.Id;
               console.log('char id', this.recordIdtoDelete);
               this.showDeleteModal = true;
           }
       }
   
       handlemodalactions(event) {
           this.showDeleteModal = false;
           console.log('event.detail>>>>> ', event.detail);
           if (event.detail === true) {
               this.deviationSpinner = true;
               this.getDeviationTableRecords('Manual');
           }
       }
   
       resetLogic() {
           const inputFields = this.template.querySelectorAll('.deviation');
           if (inputFields) {
               inputFields.forEach(field => {
                   field.reset();
               });
           }
           this.description = undefined;
           this.applicablefor = undefined;
   
       }
   
       // to get the Deviation Table Records-----
       getDeviationTableRecords(deviationType) {
           let appId;
           if (deviationType == 'System') {
               this.systemdeviationTableData = undefined;
               appId = 'a030w000008HwIQAA0';
           }
           else if (deviationType == 'Manual') {
               this.userdeviationTableData = undefined;
               appId = this.applicationId;
           }
   
           getDeviationData({ appId: appId, deviationType: deviationType }).then((result) => {
               console.log('deviationTableData = ', result);
   
               if (deviationType == 'System')
                   this.systemdeviationTableData = result;
               else if (deviationType == 'Manual')
                   this.userdeviationTableData = result;
               this.deviationSpinner = false;
   
           }).catch((err) => {
   
               if (deviationType == 'System')
                   this.systemdeviationTableData = undefined;
               else if (deviationType == 'Manual')
                   this.userdeviationTableData = undefined;
               console.log('deviationTableData error = ', err);
               this.deviationSpinner = false;
   
           });
       }
   
       /// GET deviation Codes
   
       handleMsCodes() {
           getcodesfromDeviation().then(result => {
               console.log('codes list>>>> ', result);
               let options = [];
               if (result) {
                   result = JSON.parse(JSON.stringify(result));
                   for (var key in result) {
                       this.codeMap.set(key, result[key]);
                       options.push({ label: key, value: key });
                   }
               }
               this.codeOptions = options;
               console.log('codes options>>>> ', this.codeOptions);
               this.deviationSpinner = false;
           })
               .catch(error => {
                   console.log('codes error>>>> ', error);
                   this.deviationSpinner = false;
               })
       }*/



}