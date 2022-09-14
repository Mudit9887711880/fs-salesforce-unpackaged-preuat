import { LightningElement, track, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getSanctionConditionTableRecords from '@salesforce/apex/MsSanctionCondtionLWCController.getSanctionConditionTableRecords';
import getAllmsSanctionCondition from '@salesforce/apex/MsSanctionCondtionLWCController.getAllSanctionCondition';

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
}, {
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
export default class MsSanctionCondtionLWC extends LightningElement {

    @api recordId;
    @api calledFrom;

    @track btnsAction = rowAction;
    @track sanctionOptions;
    @track sanctionSpinner = false;
    @track sanctionTableData;
    @track sanctionId;
    @track showDeleteModal = false;
    @track recordIdtoDelete;
    @track value;
    @track msSanctionCondition;
    @track currentSanctionConditions = [];
    @track othercondition;


    connectedCallback() {
        this.sanctionSpinner = true;
        this.getAllMsSanctionConditions();
        this.getSanctionConditionTabRecords();
    }


    handleChange(event) {
        let value = event.detail.value.split('+');
        console.log('value', value);
        if (event.target.label == 'Sanction Condition') {
            this.msSanctionCondition = value[0];
            this.othercondition = value[1];
            console.log('this.MsSanctionCondition=', this.msSanctionCondition);
            console.log('this.othercondition=', this.othercondition);
        }
    }

    handleReset() {
        this.resetLogic();
    }

    handleSanctionSubmit(event) {
        if (this.currentSanctionConditions.includes(this.msSanctionCondition)) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    variant: 'error',
                    message: 'Duplicate Sanction condition Found!!'
                })
            );
            event.preventDefault();
        }
    }

    handleSanctionSuccess(event) {
        console.log('handleDanctionSuccess called');
        console.log(event.detail.value);
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Record created',
                variant: 'success',
                message: 'Record ID: ' + event.detail.id
            })
        );
        this.resetLogic();
        this.sanctionSpinner = true;
        this.getSanctionConditionTabRecords();
    }

    // method used to perform delete modal popup Actions
    handlemodalactions(event) {
        this.showDeleteModal = false;
        console.log('event.detail>>>>> ', event.detail);
        if (event.detail === true) {
            this.sanctionSpinner = true;
            this.getSanctionConditionTabRecords();
        }
    }


    // method used to perform delete and update operations on Table
    handleSelectedSanction(event) {
        console.log('handleSelectedSanction called>>>>>> ', event.detail);
        var data = event.detail;
        if (data && data.ActionName == 'edit') {
            this.sanctionId = data.recordData.Id;
            this.value = data.recordData.MsSanctionCondition__c;
            this.sanctionSpinner = true;
            this.getSanctionConditionTabRecords();
        }
        else if (data && data.ActionName == 'delete') {
            if (data.recordData.Created_From__c == 'Approval Credit' && this.calledFrom == 'Process Credit') {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        variant: 'error',
                        message: 'Added by AC User can not be deleted!!'
                    })
                );
            }
            else {
                this.recordIdtoDelete = data.recordData.Id;
                console.log('sanction id to be delete', this.recordIdtoDelete);
                this.showDeleteModal = true;
            }
        }
    }

    // to resert the form fields;
    resetLogic() {
        this.sanctionId = null;
        this.value = null;
        const inputFields = this.template.querySelectorAll('.Sanction');
        if (inputFields) {
            inputFields.forEach(field => {
                field.reset();
            });
        }
        this.template.querySelector('[data-id="sanction"]').value = null;
    }


    // method used to get all ms sanction conditions
    getAllMsSanctionConditions() {
        getAllmsSanctionCondition().then((result) => {
            console.log('Sanction Conditions', result);
            let options = [];
            for (var key in result) {
                console.log('snctn', result[key].Sanction_condition_Description__c);
                console.log('snctnID', result[key].Id);
                // Here key will have index of list of records starting from 0,1,2,....
                options.push({ label: result[key].Sanction_condition_Description__c, value: result[key].Sanction_condition_Description__c + '+' + result[key].Other_Condition__c });
            }
            this.sanctionOptions = options;
            console.log('sanction options', this.sanctionOptions);

        })
            .catch((error) => {
                console.log('fls', error);
                this.error = error;
            });
    }


    // method used to get sanction condition Table Records
    getSanctionConditionTabRecords() {
        this.sanctionTableData = undefined;
        getSanctionConditionTableRecords({ appId: this.recordId }).then((result) => {
            console.log('getsanction table records in child= ', JSON.parse(JSON.stringify(result)));
            this.sanctionTableData = JSON.parse(JSON.stringify(result));
            let dataList = [];
            JSON.parse(this.sanctionTableData.strDataTableData).forEach(data => {
                dataList.push(data.MsSanctionCondition__c);
            })
            this.currentSanctionConditions = dataList;
            console.log('created sanctions', this.currentSanctionConditions);
            this.sanctionSpinner = false;
        }).catch((err) => {
            this.sanctionTableData = undefined;
            console.log('getsanction table records in child Error= ', err);
            this.sanctionSpinner = false;
        });
    }

}