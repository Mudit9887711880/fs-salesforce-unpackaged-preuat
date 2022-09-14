import { LightningElement, track, wire, api } from 'lwc';
import getEditPageContent from '@salesforce/apex/AgreementExecutionController.getEditPageContent';
import getApplicants from '@salesforce/apex/AgreementExecutionController.getApplicants';
import saveRecord from '@salesforce/apex/AgreementExecutionController.saveRecord';
import getRecordTypeId from '@salesforce/apex/DatabaseUtililty.getRecordTypeId'
import getAgDataTable from '@salesforce/apex/AgreementExecutionController.getAgDataTable';
import getPrimaryApplicant from '@salesforce/apex/AgreementExecutionController.getPrimaryApplicant';
import getApplicantAddress from '@salesforce/apex/AgreementExecutionController.getApplicantAddress';
import getProperties from '@salesforce/apex/AgreementExecutionController.getProperties';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class FsAgreementExecutionDG extends NavigationMixin(LightningElement) {

    @api applicationId;
    @api appName;

    @track tabName = 'Agreement_DG_Schedule_A';
    @track objectIdMap = {'Agreement_Execution_Document_Generation__c' : ''};
    @track fieldsContent;
    @track recordIds;
    @track showEditPage = false;
    @track isSpinnerActive = false;
    @track showApplicants = false;
    @track applicantOptions = [];
    @track witnessOption = [];
    @track loanAppId;
    @track showDocGeneration = false;
    @track loanApplicantName;
    @track recTypeId;
    @track isDataArrived = false;
    @track showDeletePopup = false;
    @track witnessValue;
    @track dgId;
    @track tableData = [];
    @track propertyOptions = [];
    @track witnessName;
    @track propId;
    @track primaryApplicant = {Name : '', Id : ''};
    @track vernacularWrapper = {borrowerName  : '', witnessName : '', witnessAddress  : '', witnessMonthsKnown : '', witnessRelation : ''}
    @track docType;
    @track documentWrapper = {
        Agreement_DG_Schedule_A : 'Schedule_A',
        Agreement_DG_DPN : 'DPN',
        Agreement_DG_Form_60 : 'Form60',
        Agreement_DG_Vernacular_LTI_Declaratio : 'VernacularVF',
        Agreement_DG_Aadhar_Consent_Form : 'AadharConsentVF',
        Agreement_DG_MSME_Letter : 'MSMELetter',
        Agreement_DG_Insurance_Undertaking_Lette : 'InsuranceUndertakingLetterVF',
        Agreement_DG_Original_Title_Deed_BM_OO : 'OriginalTitleDeedVF',
        Agreement_DG_Signature_Mismatch_Letter : 'SignatureMismatchLetterVf',
        Agreement_DG_MOD_amount_difference_lette : 'MODAmountVf',
        Agreement_DG_Property_Schedule_mismatch : 'PropertySchedulemismatchletter',
    };
    @track showDocWrapper = {
        Agreement_DG_Schedule_A : 'Application',
        Agreement_DG_DPN : 'Application',
        Agreement_DG_Form_60 : 'Applicant',
        Agreement_DG_Vernacular_LTI_Declaratio : 'Applicant',
        Agreement_DG_Aadhar_Consent_Form : 'Applicant',
        Agreement_DG_MSME_Letter : 'Application',
        Agreement_DG_Insurance_Undertaking_Lette : 'Application',
        Agreement_DG_Original_Title_Deed_BM_OO : 'Application',
        Agreement_DG_Signature_Mismatch_Letter : 'Applicant',
        Agreement_DG_MOD_amount_difference_lette : 'Application',
        Agreement_DG_Property_Schedule_mismatch : 'Asset',
    };
    @track rowAction = [
        /* {
        type: 'button-icon',
        fixedWidth: 50,
        typeAttributes: {
            iconName: 'utility:edit',
            title: 'Edit',
            variant: 'border-filled',
            alternativeText: 'Edit',
            name: 'edit'
        }
        },*/
        {
            type: 'button-icon',
            fixedWidth: 50,
            typeAttributes: {
                iconName: 'utility:delete',
                title: 'Delete',
                variant: 'border-filled',
                alternativeText: 'Delete',
                name: 'delete'
            }
        }
    ]


    connectedCallback() {
        this.getAllApplicant();
        this.getAllAgRecordDetails();
        this.getPrimaryApplicantOfApp();
        this.getAllProperties();
    }

    @api getAllApplicant() {
        this.applicantOptions = [];
        this.showApplicants = false;
        getApplicants({ applicationId: this.applicationId })
            .then(result => {
                const witnessName = {
                    label: 'Others',
                    value: 'Others'
                };
                this.witnessOption = [...this.witnessOption, witnessName];
                if (result) {
                    result.forEach(element => {
                        if (element.Applicant_Name__c) {
                            const applicantName = {
                                label: element.Applicant_Name__c,
                                value: element.Id
                            };
                            this.applicantOptions = [...this.applicantOptions, applicantName];
                            this.witnessOption = [...this.witnessOption, applicantName];
                            console.log('appopt ', this.applicantOptions);
                            this.showApplicants = true;
                        }
                    });
                }
            })
            .catch(error => {
                this.isSpinnerActive = false;
                console.log('Error in getting applicant name ', error)
            })
    }

    getAllAgRecordDetails() {
        this.isDataArrived = false;
        console.log('::: allLoanApplicant ::: ', JSON.stringify(this.applicationId));
        getAgDataTable({ recordId: this.applicationId, metaDataName: 'Agreement_Document_Generation', tabName : 'Doc_Gen' })
            .then(result => {
                console.log('##res', result);
                this.tableData = result;
                this.isDataArrived = true;
                console.log('Tabledata', JSON.stringify(this.tableData));
            })
            .catch(error => {
                console.log('Error', error);
            })
    }

    getPrimaryApplicantOfApp(){
        getPrimaryApplicant({applicationId : this.applicationId}).then(result =>{
            console.log('primary applicant details ',result);
            if(result){
                this.primaryApplicant.Id = result.Id;
                this.primaryApplicant.Name = result.Applicant_Name__c;
                console.log('primary applicant details ',this.primaryApplicant);
            }
        })
        .catch(error =>{
            console.log('error ',error);
        })
    }

    getAllProperties(){
        console.log('appID ',this.applicationId);
        getProperties({applicationId : this.applicationId}).then(result =>{
            if(result){
                result.forEach(element => {
                    if (element.Name) {
                        const propName = {
                            label: element.Name,
                            value: element.Id+'_'+element.Title_Deed_Number__c
                        };
                        this.propertyOptions = [...this.propertyOptions, propName];
                        console.log('appopt ', this.propertyOptions);
                    }
                });
            }
        })
        .catch(error =>{
            console.log('Error getting properties ',error);
        })
    }


    handleSelectedApplicant(event) {
        console.log('selected applicant ', event.detail.value);
        console.log('selected applicant ', event.target.options.find(opt => opt.value === event.detail.value).label);
        this.loanApplicantName = event.target.options.find(opt => opt.value === event.detail.value).label;
        this.loanAppId = event.detail.value;
        this.vernacularWrapper.borrowerName = this.loanApplicantName;
        //this.showDocGeneration = true;
    }

    handleSelectedWitness(event){
        try{
            console.log('selected applicant ', event.detail.value);
            console.log('selected applicant ', event.target.options.find(opt => opt.value === event.detail.value).label);
            this.witnessName = event.target.options.find(opt => opt.value === event.detail.value).label;
            let witnessId = event.detail.value;
            if(witnessId === 'Others'){
                this.setFieldRequired(this.fieldsContent,false);
                var className = '.'+this.tabName;
                let genericedit = this.template.querySelector(className);
                this.fieldsContent = (JSON.stringify(this.setValues('Witness_Name__c', '')));
                genericedit.refreshData((this.fieldsContent));
                this.fieldsContent = (JSON.stringify(this.setValues('Witness_Address__c', '')));
                genericedit.refreshData((this.fieldsContent));
            }
            else{
                getApplicantAddress({loanAppId : witnessId}).then(result =>{
                    this.vernacularWrapper.witnessName = this.witnessName;
                    this.vernacularWrapper.witnessAddress = result;
                    this.setFieldRequired(this.fieldsContent,true);
                    var className = '.'+this.tabName;
                    let genericedit = this.template.querySelector(className);
                    this.fieldsContent = (JSON.stringify(this.setValues('Witness_Name__c', this.witnessName)));
                    genericedit.refreshData((this.fieldsContent));
                    this.fieldsContent = (JSON.stringify(this.setValues('Witness_Address__c', result)));
                    genericedit.refreshData((this.fieldsContent));
                })
                .catch(error =>{
                    console.log('Error ',error);
                })
            }
        }
        catch(exe){
            console.log('Exception ',exe);
        }
    }

    handleSelectedProperty(event){
        console.log('selected applicant ', event.detail.value);
        console.log('selected applicant ', event.target.options.find(opt => opt.value === event.detail.value).label);
        let titleDeedNumber = event.detail.value.split('_')[1];
        this.propId = event.detail.value.split('_')[0];
        console.log(titleDeedNumber);
        var className = '.'+this.tabName;
        let genericedit = this.template.querySelector(className);
        this.fieldsContent = (JSON.stringify(this.setValues('Title_Deed_Number__c', titleDeedNumber)));
        genericedit.refreshData((this.fieldsContent));
        this.setFieldRequired(this.fieldsContent,true);
    }

    setFieldRequired(fieldcontent,disabled) {
        console.log('Inside ',fieldcontent);
        var field = JSON.parse(fieldcontent);
        for (var i = 0; i < field[0].fieldsContent.length; i++) {
            if (field[0].fieldsContent[i].fieldAPIName === 'Witness_Name__c') {
                field[0].fieldsContent[i].disabled = disabled;
                console.log('field[0].fieldsContent[i] ',field[0].fieldsContent[i]);
            }
            if(field[0].fieldsContent[i].fieldAPIName === 'Witness_Address__c'){
                field[0].fieldsContent[i].disabled = disabled;
                console.log('field[0].fieldsContent[i] ',field[0].fieldsContent[i]);
            }
            if(field[0].fieldsContent[i].fieldAPIName === 'Title_Deed_Number__c'){
                field[0].fieldsContent[i].disabled = disabled;
                console.log('field[0].fieldsContent[i] ',field[0].fieldsContent[i]);
            }
        }
        this.fieldsContent = JSON.stringify(field);
        var className = '.'+this.tabName;
        let genericedit = this.template.querySelector(className);
        genericedit.refreshData((this.fieldsContent));
        console.log('Outside ',fieldcontent);
    }

    setValues(_fieldAPIName, _val) {
        var _tempVar = JSON.parse(this.fieldsContent);
        for (var i = 0; i < _tempVar[0].fieldsContent.length; i++) {
            if (_tempVar[0].fieldsContent[i].fieldAPIName === _fieldAPIName) {
                    _tempVar[0].fieldsContent[i].value = _val;
            }
        }
        return _tempVar;
    }

    getSectionPageContent(recId) {
        this.showEditPage = false;
        try {
            getEditPageContent({ recordIds: recId, metaDetaName: this.tabName })
                .then(result => {
                    console.log('data ### ', JSON.parse(result.data));
                    this.fieldsContent = result.data;
                    this.showEditPage = true;
                    this.isSpinnerActive = false;
                })
                .catch(error => {
                    console.log(error);
                });
        } catch (error) {
            console.log(error);
        }
    }

    handleActiveTab(event) {
        this.tabName = event.target.value;
        this.loanAppId = '';
        this.loanApplicantName = '';
        console.log('Tab :: ', event.target.label);
        getRecordTypeId({sObjectName : 'Agreement_Execution_Document_Generation__c',recordTypeName :  event.target.label })
        .then(result =>{
            if(result)
                this.recTypeId = result;
        })
        .catch(error =>{
            console.log(error);
        })
        this.isSpinnerActive = true;
        this.getSectionPageContent('');
    }

    handleFormValueChange(event) {
        console.log(event.detail);
        var tempFieldsContent = event.detail;
        if (tempFieldsContent.CurrentFieldAPIName === 'Agreement_Execution_Document_Generation__c-No_of_years_known__c') {
            this.vernacularWrapper.witnessMonthsKnown = tempFieldsContent.CurrentFieldValue;
        }
        if (tempFieldsContent.CurrentFieldAPIName === 'Agreement_Execution_Document_Generation__c-Relationship_Between_Borrower_And_Witnes__c') {
            this.vernacularWrapper.witnessRelation = tempFieldsContent.CurrentFieldValue;
        }
        if (tempFieldsContent.CurrentFieldAPIName === 'Agreement_Execution_Document_Generation__c-Witness_Name__c') {
            console.log('Name');
            this.vernacularWrapper.witnessName = tempFieldsContent.CurrentFieldValue;
        }
        if (tempFieldsContent.CurrentFieldAPIName === 'Agreement_Execution_Document_Generation__c-Witness_Address__c') {
            console.log('Address');
            this.vernacularWrapper.witnessAddress = tempFieldsContent.CurrentFieldValue;
        }
        if (tempFieldsContent.CurrentFieldAPIName === 'Agreement_Execution_Document_Generation__c-Document_Type__c') {
            console.log('Document_Type__c');
            this.docType = tempFieldsContent.CurrentFieldValue;
        }
    }

    generateDocument(){
        console.log('generateDocument called from ',this.tabName);
        console.log('generateDocument vf ',this.documentWrapper[this.tabName]);
        console.log('Application/Applicant ',this.showDocWrapper[this.tabName]);
        if(this.showDocWrapper[this.tabName] === 'Applicant' && !this.loanAppId){
            this.showToast('Error','Error','Select Applicant First');
            return;
        }
        if(this.showDocWrapper[this.tabName] === 'Asset' && !this.propId){
            this.showToast('Error','Error','Select Property First');
            return;
        }
        var recordId = this.showDocWrapper[this.tabName] === 'Application' ? this.applicationId : this.showDocWrapper[this.tabName] === 'Applicant' ? this.loanAppId : this.propId;
        var vfPageURL = '/apex/' + this.documentWrapper[this.tabName]  + '?recordId=' + recordId ;
        if(this.tabName == 'Agreement_DG_Vernacular_LTI_Declaratio'){
            vfPageURL += '&borrowerName=' + this.vernacularWrapper.borrowerName
                       + '&witnessName=' + this.vernacularWrapper.witnessName
                       + '&witnessAddress=' + this.vernacularWrapper.witnessAddress
                       + '&witnessMonthsKnown=' + this.vernacularWrapper.witnessMonthsKnown
                       + '&witnessRelation=' + this.vernacularWrapper.witnessRelation;
        }
        else if(this.tabName == 'Agreement_DG_Signature_Mismatch_Letter'){
            vfPageURL += '&docType=' + this.docType;
        }
        this[NavigationMixin.GenerateUrl]({
            type: 'standard__webPage',
            attributes: {
                url: vfPageURL
            }
        }).then(generatedUrl => {
            window.open(generatedUrl);
        });
    }

    async handleSave() {
        console.log('handle Save called from ',this.tabName);
        var className = '.'+this.tabName;
        console.log('querySelector ',this.template.querySelector(className));
        var data = this.template.querySelector(className).handleOnSave();
        console.log('data #### ', data);
        if (data.length > 0) {
            console.log('Data entry start');
            this.isSpinnerActive = true;
            for (var i = 0; i < data.length; i++) {
                console.log('i am in', data[i]);
                data[i].RecordTypeId = this.recTypeId;
                data[i].Application__c = this.applicationId;
                if(this.tabName === 'Agreement_DG_Insurance_Undertaking_Lette'){
                    data[i].Insured_Person__c = this.primaryApplicant.Name;
                    data[i].Loan_Applicant__c = this.primaryApplicant.Id;
                }
                if(this.tabName === 'Agreement_DG_Vernacular_LTI_Declaratio'){
                    if(!this.loanAppId){
                        this.showToast('Error','Error','Select Applicant First');
                        this.isSpinnerActive = false;
                        return;
                    }
                    data[i].Borrower__c = this.loanApplicantName;
                    data[i].Loan_Applicant__c = this.loanAppId;
                }
                await saveRecord({ dataToInsert: JSON.stringify(data[i])})
                    .then(result => {
                        console.log('result ', result);
                        if (result) {
                            console.log(result);
                        }
                        this.fieldsContent = undefined;
                        this.isSpinnerActive = false;
                        this.showToast('Success', 'Success', 'Record Saved Successfully!!');
                        this.getSectionPageContent(result);
                        this.getAllAgRecordDetails();
                    })
                    .catch(error => {
                        console.log(error);
                        this.showToast('Error', 'Error', JSON.stringify(error));
                    });
            }
        } else {
            this.showToast('Error', 'Error', 'Complete Required Field(s).');
        }
    }

    handleSelectedDoc(event){
        var recordData = event.detail.recordData;
        console.log('recordData ', recordData);
        this.dgId = recordData.Id;
        if (event.detail.ActionName === 'delete') {
            console.log('Delete Called ');
            this.showDeletePopup = true;
        }
    }

    handlemodalactions(event){
        this.showDeletePopup = false;
        if (event.detail === true)
            this.getAllAgRecordDetails();
    }

    handleCancel() {
        console.log('handle cancel called ###');
        this.getSectionPageContent('');
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