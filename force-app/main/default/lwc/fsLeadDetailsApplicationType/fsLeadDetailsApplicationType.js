import { api, LightningElement, track, wire } from 'lwc';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import CONSTITUTION_FIELD from '@salesforce/schema/Loan_Applicant__c.Constitution__c';
import USER_ID from '@salesforce/user/Id'; 
import { getRecord } from 'lightning/uiRecordApi'; 
import EMPLOYEE_FIELD from '@salesforce/schema/User.EmployeeNumber';
import getPrimaryApplicantData from'@salesforce/apex/FsLeadDetailsControllerHelper.getPrimaryApplicantData';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
export default class FsLeadDetailsApplicationType extends LightningElement {
    @api applicationId;
    @track isSpinnerActive = false;
    @track constitutionOption;
    @api fullName;
    @track data = {
        'applicationType' : '',
        'oldApplicationNo' : '',
        'employeeId' : '',
        'customerType' : '',
        'applicantFirstName' : '',
        'applicantLastName' : '',
        'constitution' : ''
    }
    @track employeeNumber;
    @wire(getRecord, {
        recordId: USER_ID,
        fields: [EMPLOYEE_FIELD]
    }) wireuser({error,data}) {
        if (error) {
            this.error = error ; 
        } else if (data) {
            this.employeeNumber = data.fields.EmployeeNumber.value;
        }
    }

    @wire(getPicklistValues, { recordTypeId: '012000000000000AAA', fieldApiName: CONSTITUTION_FIELD })
    propertyOrFunction({error, data}) {
        if (data) {
            this.constitutionOption = data.values;
        }
    };
    connectedCallback(){
        getPrimaryApplicantData({applicationId : this.applicationId})
        .then(result => { 
            this.data.applicationType = result[0].Pre_Login__r.RecordType.Name;  
            this.data.oldApplicationNo = result[0].Old_Application_Number__c;
            this.data.employeeId = '';
            this.data.customerType = result[0].Loan_Applicants__r[0].Customer_Type__c;
            this.data.applicantFirstName = result[0].Loan_Applicants__r[0].Customer_Information__r.FirstName;
            this.data.applicantLastName = result[0].Loan_Applicants__r[0].Customer_Information__r.LastName;
            this.data.constitution = result[0].Loan_Applicants__r[0].Constitution__c;

            //Used For Fee Detail Component//
            this.fullName = this.data.applicantFirstName + ' ' + this.data.applicantLastName;
            console.log('application type full name #### ',this.fullName);
        })
        .catch(error => {
            
        })    
    }
    @api 
    primaryApplicantData(){
        return this.fullName;
    }
    handleSave(){
        console.log('data ### ',JSON.stringify(this.data));
        let isValid = true;
        let inputFields = this.template.querySelectorAll('.validate');
        inputFields.forEach(inputField => {
            if(!inputField.checkValidity()) {
                inputField.reportValidity();
                isValid = false;
            }
        });
        if(isValid){
            console.log('#### ',isValid);
        } else{
            this.showToastMessage();
        }
    }
    handleChange(event){
        this.data[event.target.name] = event.target.value;
    }
    showToastMessage(){
        const evt = new ShowToastEvent({
            title: 'Error',
            message: 'Complete Required Field(s)',
            variant: 'Error'
        });
        this.dispatchEvent(evt);
    }
}