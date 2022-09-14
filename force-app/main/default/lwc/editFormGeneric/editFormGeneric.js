import { LightningElement, track } from 'lwc';
import getSectionContent2 from '@salesforce/apex/DummyApexClass.getSectionContent';
import saveSobject from '@salesforce/apex/DummyApexClass.saveSobject';

export default class EditFormGeneric extends LightningElement {
    @track formObj;
    @track  dataToGet = [];
    @track dataValues;

    connectedCallback() {
        this.handleFormMetadata();
    }

    handleFormValueChange(event) {
        this.dataValues = event;
        // console.log('handleFormValueChange ', JSON.parse(JSON.stringify(event.detail)));
    
        // let eventData = JSON.parse(JSON.stringify(event.detail));
        // let tempObj = JSON.parse(JSON.stringify(this.formObj));
        // if (eventData && eventData.CurrentFieldAPIName) {
        //     // let fieldAPIName = eventData.CurrentFieldAPIName.split('-')[1];

        //     // let MortgageDetails;
        //     // tempObj.SectionContentWrapper.forEach(element => {
        //     //     // if (element.fieldAPIName == fieldAPIName) {
        //     //         if (element.fieldAPIName == 'Revisit_date__c') {
        //     //             element.value = 'yes it changed';
        //     //         }
        //     //     // }
        //     // });

        //     // this.formObj = JSON.parse(JSON.stringify(tempObj))
        //}
    }

    // handleObjectValues(eventData) {
    //     let tempObj = {};
    //     if(eventData && eventData.previousData && eventData.previousData.length){
    //         eventData.previousData.forEach(element => {
                
    //         });
    //     }
    // }

    handleFormMetadata() {
        // getSectionContent2({ metadataName: 'FIV_C_Revisit' }).then((result) => {
        getSectionContent2().then((result) => {
            console.log('getSectionContent2= ', result);
            this.formObj = result;
        }).catch((err) => {
            console.log('Error in getSectionContent2= ', err);
        });
    }

    handleSave(){
        console.log('Handle Save Running!!');
        // const saveMethod = this.template.querySelector('c-generic-edit-pages-l-w-c');
        // console.log('saveMethod ',saveMethod);
        this.dataToGet = this.handleFormJSON(this.dataValues);
        console.log('dataToGet ',this.dataToGet);

        saveSobject({objectAPIName : 'Revisit__c',fieldlist : JSON.stringify(this.dataToGet['Revisit__c'])})
        .then(result => {
            console.log('saveresult ',result);
        })
        .catch(error => {
            console.log('saverror ',error);
        })
    }

    handleFormJSON(event) {
        let temp1 = JSON.parse(JSON.stringify(event.detail));
        let tempArr = {};
        for (let keyValue of Object.keys(temp1.previousData)) {
            let objectAPIName = keyValue.split('-')[0];
            let fieldAPIName = keyValue.split('-')[1];
            let currentFieldValue = temp1.previousData[keyValue];
            let tempObjl;
            if(tempArr[objectAPIName]){
                tempObjl = JSON.parse(JSON.stringify(tempArr[objectAPIName]));
                tempObjl[fieldAPIName] = currentFieldValue;
                tempArr[objectAPIName] = tempObjl;
            }else{
                tempArr = {[objectAPIName] : { [fieldAPIName] : currentFieldValue }}
            }
            //console.log('last step= ',tempArr);
        }
        //console.log(tempArr);// Object[Account][Name] : value
        return tempArr;
    }
}