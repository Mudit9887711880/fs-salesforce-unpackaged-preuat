import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getDeviationData from '@salesforce/apex/pcDeviationController.getDeviationData';
import getcodesfromDeviation from '@salesforce/apex/pcDeviationController.getcodesfromDeviation';
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
}];


const pcrowAction = [{
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

export default class PcDeviation extends LightningElement {

    @api applicationId;
    @track systemdeviationTableData;
    @track userdeviationTableData;
    @track rowAction = rowAction;
    @track pcrowAction = pcrowAction;
    @track deviationSpinner = false;
    @track deviationId;
    @track showEditForm = false;
    @track showNewForm = false;
    @track editDeviation = false;
    @track showNewForm = false;
    @track showDeleteModal = false;
    @track recordIdtoDelete;
    @track codeMap = new Map();
    @track codeOptions = [];
    @track applicablefor;
    @track description;
    @track devCode;
  


    connectedCallback() {
        //code
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
        }
        else if(event.target.name == 'Remark__c'){
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
        if (!this.editDeviation && !this.showEditForm) {
            if (this.template.querySelector(".DevCode").value == null) {
                console.log('Deviation Code is null');
                let devcode = this.template.querySelector('.DevCode');
                devcode.reportValidity();
                event.preventDefault();

            }
        }
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
            appId = 'a029D00000HWEpMQAX';
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
    }



}