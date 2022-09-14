import { LightningElement, api, wire, track } from 'lwc';
import Business_Date from '@salesforce/label/c.Business_Date';
import getLastLoginDate from '@salesforce/apex/DatabaseUtililty.getLastLoginDate';

export default class FsPageHeader extends LightningElement {
    @api headericon = 'standard:channel_program_members';
    @api stagename = 'Login';
    @api appno = 'APP-001';
    @api businessdate = 'Business Date : ' + Business_Date;
    @api lastlogindate;
    @track helpText;
    @api btns = [];

    @track actualBtn = [];
    @track showoverflowmenu = false;
    @track overflowmenulist = [];

    connectedCallback() {
        this.fetchLastLoginDate();
        var tempBtns = JSON.parse(JSON.stringify(this.btns));
        if (tempBtns.length > 3) {
            this.showoverflowmenu = true;
            this.actualBtn = tempBtns.splice(0, 3);
            this.overflowmenulist = tempBtns;
        } else {
            this.showoverflowmenu = false;
        }
    }

    fetchLastLoginDate(){
        getLastLoginDate().then(result =>{
            console.log('login date ',result);
            this.lastlogindate = 'Last Login Date : ' + result;
            this.helpText = this.businessdate +' | '+ this.lastlogindate;
        })
        .catch(error =>{
            console.log('error',error);
        })
    }

    handleOnselect(event) {
        this.dispatchEvent(new CustomEvent('rowselectionevent', { detail: event.detail.value }));
    }

    handleBtnClick(event) {
        this.dispatchEvent(new CustomEvent('rowselectionevent', { detail: event.target.value }));
    }
}