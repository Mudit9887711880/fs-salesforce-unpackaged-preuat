import { LightningElement, wire, track, api } from 'lwc';
import generateRepaymentSchedule from '@salesforce/apex/FsRepaymentScheduleController.generateRepaymentSchedule';
export default class FsRepaymentSchedule extends LightningElement {

    @api applicationId;
    @track loanEmiData;
    @track message;
    @track error;
    @track isLoading = false;

    connectedCallback() {
        console.log('applicationId ',this.applicationId);
        this.generateRepaymentSceduleReport();
    }

    generateRepaymentSceduleReport(){
        this.isLoading = true;
        generateRepaymentSchedule({ applicationId : this.applicationId})
            .then((result) => {
                console.log('result ',result);
                if (result) {
                    console.log('inside if');
                    this.loanEmiData = JSON.parse(result);
                    let isAdvEMI = this.loanEmiData[0].isAdvEMI;
                    if(isAdvEMI){
                        this.loanEmiData.splice(0,1);
                    }
                    console.log('result', result);
                    console.log('emi data', this.loanEmiData);
                    this.error = undefined;
                    this.message = undefined;
                    this.isLoading = false;
                }
                else{
                    console.log('inside else');
                    this.message = 'No Repayment Schedule Found!!';
                    this.isLoading = false;
                }
            })
            .catch((error) => {
                console.log('inside catch');
                this.message = 'No Repayment Schedule Found!!';
                this.error = error;
                this.isLoading = false;
            });
    }
}