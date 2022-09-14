import { LightningElement, api, track, wire } from 'lwc';
import getNotes from '@salesforce/apex/fsSendBackGridCtrl.getNotes';
export default class FsSendBackGrid extends LightningElement {
    @api applicationId;
    @track isNotesAvailable;
    @track isSendBackAvailable = false;
    @track notes = [{
        Id: undefined,
        ParentId: undefined,
        Title: undefined,
        Body : undefined,
        CreatedDate: undefined,
    }]

    connectedCallback() {
        this.getAllNotes();
    }
    
    getAllNotes(){
        getNotes({appId: this.applicationId})
        .then(result => {
            this.notes = JSON.parse(JSON.stringify(result));
            console.log('Notes', this.notes);
            if(this.notes.length>0){
                this.isSendBackAvailable = true;
                this.isNotesAvailable = 'Yes';
            }
            else{
                this.isSendBackAvailable = false;
                this.isNotesAvailable = 'No';
            }
        })
        .catch(error => {
            console.log('Error', error);
        });
        const notesAvailable = new CustomEvent('dataavailable', {detail:  this.isNotesAvailable});
        this.dispatchEvent(notesAvailable);
    }
}