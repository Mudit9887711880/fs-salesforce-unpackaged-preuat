import { LightningElement, api, wire, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import getHighmarkData from '@salesforce/apex/fsHighmarkObligationsScreenController.getHighmarkData';
import getRecordTypeId from '@salesforce/apex/fsHighmarkObligationsScreenController.getRecordTypeId';
import getcharacterRepayment from '@salesforce/apex/fsHighmarkObligationsScreenController.getcharacterRepayment';
const rowAction = [{
    //label: 'Edit',
    type: 'button-icon',
    fixedWidth: 50,
    typeAttributes: {
        iconName: 'utility:edit',
        title: 'Edit',
        variant: 'border-filled',
        alternativeText: 'Edit',
        name: 'edit'
    }
},
{
    //label: 'Delete',
    type: 'button-icon',
    fixedWidth: 50,
    typeAttributes: {
        iconName: 'utility:delete',
        title: 'Delete',
        variant: 'border-filled',
        alternativeText: 'Delete',
        name: 'delete'
    }
}];

 

export default class CharacterRecordCreate extends NavigationMixin(LightningElement) {

    @api applicationId;
    @api customerOptions;
    @api stageName;
    @track highmarkTableData;
    @track highmarkSpinner = false;
    @track repaymentId;
    @api  verificationId;
    
    @track rowAction = rowAction;
    @track editHighmark = false;
    @track highmarkpcTableData;
    @track bureauHighmarkId;
    @track considerValue;
    @track loanApplicantId;
    @track customerName;
    @track showDeleteModal = false;
    @track recordIdtoDelete;
    @track showForm = false;
    @track characterRecordTypeId;
    @track recordId;
    @track showoverallRemarks = false;
    @track isBureau = false;


    connectedCallback() {
        if(this.stageName == 'PC'|| this.stageName == 'AC')
        {
           console.log('verfId', this.verificationId);
            this.getcharacterRepaymentDetail();
            this.getcharcterRecordTypeId();
              this.showoverallRemarks = true;
            
        }

        console.log('app id in highmark', this.applicationId);
        this.highmarkSpinner = true;
        console.log('character record type Id',this.characterRecordTypeId);
        this.getHighmarkTableRecords();

    }

    getcharacterRepaymentDetail()
    {
        let rcType;
        if(this.stageName == 'PC')
          rcType = 'PC Character';
        else if(this.stageName == 'AC')
          rcType = 'AC Character';
         console.log('verfId', this.verificationId);
        getcharacterRepayment({verfId:this.verificationId,recTypeName:rcType}).then(res=>{
            console.log('repaymentId >>>> ',res);
            if(res )
            this.recordId = res;

        }).catch(err=>{
             console.log('repaymentId error>>>> ',err);
        })
    }

    get isRequired() {
        return (this.considerValue == 'No') ? true : false;
    }


    handleSelectedHighmark(event) {
        console.log('event.detail called>>>>>> ', event.detail);
        var data = event.detail;
        if (data && data.ActionName == 'edit') {
            let type = data.recordData.Type__c;
             if(type == 'Bureau')
             this.isBureau = true;
             else 
             this.isBureau = false;
            this.repaymentId = data.recordData.Id;
            this.customerName = data.recordData.Loan_Applicant__c;
            this.loanApplicantId = data.recordData.Loan_Applicant__c;
            this.editHighmark = true;
            this.showForm = true;
        }
        else if (data && data.ActionName == 'delete') {
            let type = data.recordData.Type__c;
            if(type == 'Self')
            {
            this.recordIdtoDelete = data.recordData.Id;
            console.log('char id', this.recordIdtoDelete);
            this.showDeleteModal = true;
            }
            else if(type == 'Bureau')
            {
                 this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    variant: 'error',
                    message: 'Can\'t Delete Bureau Record'
                })
            );
            }
        }
    }

    handleFormValues(event) {

        if (event.target.fieldName == "To_be_considerd_for_DBR__c") {
            this.considerValue = event.target.value;
        }
        else if (event.target.name == "Customer Info") {
            this.loanApplicantId = event.target.value;

        }
    }
    handleBureauSuccess(event) {
        console.log('handle success called', event.detail.Id);
        this.repaymentId = undefined;

        if (this.editHighmark) {
            this.resetLogic();
            this.highmarkSpinner = true;
            this.getHighmarkTableRecords();
            this.editHighmark = false;
            this.showForm = false;
        }
        else {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Record created',
                    variant: 'success',
                    message: 'Record ID: ' + event.detail.id
                })
            );
            this.resetLogic();
            this.highmarkSpinner = true;
            this.getHighmarkTableRecords();
            this.showForm = false;
        }

    }

    handleBureauSubmit(evt) {
        console.log('handle submit called', evt.detail.Id);
    }

    onCancel() {
        // this.resetLogic();
        // if (this.editHighmark)
        //     this.repaymentId = undefined;
        // this.customerName = undefined;
        this.showForm = false;
        this.considerValue = null;
    }

    handlehighmarkObligations(event)
    {
        this.isBureau = false;
        this.showForm = true;

    }

    handleCustomerChange(event) {
        console.log('customer change callled', event.target.value);
        this.loanApplicantId = event.target.value;

    }

    handlemodalactions(event) {
        this.showDeleteModal = false;
        console.log('event.detail>>>>> ', event.detail);
        if (event.detail === true) {
            this.highmarkSpinner = true;
            this.getHighmarkTableRecords( );
        }
    }

    resetLogic() {
        const inputFields = this.template.querySelectorAll('.highmark');
        if (inputFields) {
            inputFields.forEach(field => {
                field.reset();
            });
        }
        this.template.querySelector('.highmarkCustomer').value = undefined;
        this.loanApplicantId = undefined;
        this.customerName = undefined;
        this.considerValue = undefined;
    }


    // to get the loan details Table Records-----
    getHighmarkTableRecords() {
        this.highmarkpcTableData = undefined;
        getHighmarkData({ appId: 'a029D00000Hb4YvQAJ', metadataName: 'Repayment_Behaviour_Table' }).then((result) => {
            console.log('highmarkTableData = ', result);
           
                let temp = JSON.parse(result.strDataTableData);
                console.log('highmarkBureau Id = ', temp[0].Bureau_Highmark__c);
                this.bureauHighmarkId = temp[0].Bureau_Highmark__c;
                console.log('bureu id',this.bureauHighmarkId);
            
            this.highmarkpcTableData = result;
            this.highmarkSpinner = false;
        }).catch((err) => {
            this.highmarkpcTableData = undefined;
            console.log('highmarkTableData err = ', err);
            this.highmarkSpinner = false;

        });
    }

     // get the character recordTypeId
    getcharcterRecordTypeId() {
        let rectypeName;
        if (this.stageName == 'AC')
            rectypeName = 'AC Character';
        if (this.stageName == 'PC')
            rectypeName = 'PC Character';
        getRecordTypeId({ objName: 'Character__c', recordTypeName: rectypeName })
            .then(res => {
                if (res)
                    this.characterRecordTypeId = res;
                console.log('character record type id >>>> ', JSON.stringify(res));
            })
            .catch(err => {
                console.log('errr occured in getting record type id for character', err);
            })
    }

    handlecharacterSubmit(event)
    {
        console.log('character submit Called',event.detail);
    }


    handleCharacterSuccess(event)
    {
        this.recordId = event.detail.id;
        this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    variant: 'success',
                    message: 'Record Created Successfully'
                })
            );
    }
}