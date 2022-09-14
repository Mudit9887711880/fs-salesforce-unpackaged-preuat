import { LightningElement, api, wire, track } from 'lwc';

export default class FsPageContainerLWC extends LightningElement {
    @api headericon = 'standard:channel_program_members';
    @api stagename = 'Login';
    @api appno = 'APP-001';
    @api businessdate = '30/06/2022'
    @api lastlogindate = '6/16/2022';
    @track helpText;
    @api btns = [];

    @track actualBtn = [];
    @track showoverflowmenu = false;
    @track overflowmenulist = [];

    connectedCallback() {
        var tempBtns = JSON.parse(JSON.stringify(this.btns));
        if(tempBtns.length > 3){
            this.showoverflowmenu = true;
            this.actualBtn = tempBtns.splice(0, 3);
            this.overflowmenulist = tempBtns;
        }else{
            this.showoverflowmenu = false;   
            this.actualBtn = tempBtns;         
        }
        this.helpText = 'Business Date : ' + this.businessdate +' | Last Login Date : '+ this.lastlogindate;
    }

    handleOnselect(event){
        this.dispatchEvent(new CustomEvent('rowselectionevent', { detail: event.detail.value }));
    }

    handleBtnClick(event){
        this.dispatchEvent(new CustomEvent('rowselectionevent', { detail: event.target.value }));
    }
}