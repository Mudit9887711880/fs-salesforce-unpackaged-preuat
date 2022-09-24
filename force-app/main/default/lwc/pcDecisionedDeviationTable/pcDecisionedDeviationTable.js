import { LightningElement, api, track, wire } from 'lwc';
import getDecisionedDeviationsData from '@salesforce/apex/DecisionedDeviationsController.getDecisionedRecords';
import { refreshApex } from '@salesforce/apex';

export default class PcDecisionedDeviationTable extends LightningElement {

    @api applicationId;
     decisionedDeviation;
    @track deviationSpinner = false;
    empty = false;
    _wiredResult;

    connectedCallback() {
        console.log('connected applicationId applicationId Tr connect', this.applicationId);

        this.deviationSpinner = true;
        //this.getDecisionedRecords();
    }

   
 @wire(getDecisionedDeviationsData, { applicationId: '$applicationId' })
    wiredDecisionedDev(value) {
            console.log('applicationId applicationId Tr data error is', this.applicationId);
            
            const { data, error } = value;
            this._wiredResult = value;

            if (data) {
                console.log('this.decisionedDeviation>> ',data);
                this.decisionedDeviation = JSON.parse(JSON.stringify(data));;
                if (this.decisionedDeviation.length == 0) {
                    this.empty = true;
                }
                this.deviationSpinner = false;
            }
            else if (error) {
                console.error('wiredDeviations error => ', JSON.stringify(error));
                this.deviationSpinner = false;
            }

        }

        @api refreshDecisionedDeviationTable()
        {
            refreshApex(this._wiredResult);
        }
        //     this.decisionedDeviation = result;
        //     if (result.length == 0) {
        //         this.empty = true;
        //         this.deviationSpinner = false;

        //     }
        //     this.deviationSpinner = false;
        // })
        //     .catch(error => {
        //         console.log('get decisionedDeviation Tr data error is', error);
        //     })
    }