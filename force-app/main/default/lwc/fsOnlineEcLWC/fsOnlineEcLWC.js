import { api, LightningElement, track, wire } from 'lwc';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import PROPERTY_OBJECT from '@salesforce/schema/Property__c';
import { getRecord } from 'lightning/uiRecordApi';
import BusinessDate from '@salesforce/label/c.Business_Date';
import NAME from '@salesforce/schema/Application__c.Name';
import ID_FIELD from '@salesforce/schema/Verification__c.Id';
import STATUS_FIELD from '@salesforce/schema/Verification__c.Status__c';
import getLastLoginDate from '@salesforce/apex/DatabaseUtililty.getLastLoginDate';
import getCollateralDetails from '@salesforce/apex/FsOnlineECController.getCollateralDetails';
// import getRequiredDocuments from '@salesforce/apex/fsGenericUploadDocumentsController.getRequiredDocuments';
import getVerification from '@salesforce/apex/FsOnlineECController.getVerification';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { updateRecord } from 'lightning/uiRecordApi';
import { NavigationMixin } from 'lightning/navigation';
import { CurrentPageReference } from 'lightning/navigation';

export default class fsOnlineEcLWC extends NavigationMixin(LightningElement) {

@api applicationId;
@api recordId;
@track recordTypeId;
@track VericationStatus;
@track tabName = "Collateral";
@track errorMsgs = [];
@track isSpinnerActive;
@track showErrorTab = false;
@track todaysDate = BusinessDate;
@track applicationName;
@track lastLoginDate;
@track checkRequiredField = false;
@track rowAction = [
    {
        type: 'button-icon',
        fixedWidth: 50,
        typeAttributes: {
            iconName: 'utility:edit',
            title: 'Edit',
            variant: 'border-filled',
            alternativeText: 'Edit',
            name: 'edit'
        }
    },
    
]

@wire(getObjectInfo, { objectApiName: PROPERTY_OBJECT })
    getRecordType({ data, error }) {
        if (data) {
            console.log(':: data :: ',JSON.stringify(data));
            const rtis = data.recordTypeInfos;
            this.recordTypeId = Object.keys(rtis).find(rti => rtis[rti].name === 'Online EC Property Detail');
        } else if (error) {
            
        }
    }
@wire(CurrentPageReference)
getStateParameters(currentPageReference) {

    if (currentPageReference) {
        console.log('page', currentPageReference);
        this.recordId = currentPageReference.attributes.recordId;
        console.log('id', this.recordId);
    }
}

@wire(getRecord, { recordId: '$applicationId', fields: [NAME] })
applicationDetails({ error, data }) {
    console.log('applicationDetails= ', data);
    if (data) {
        this.applicationName = data.fields.Name.value;
    } else if (error) {
        console.log('error in getting applicationDetails = ', error);
    }
}

connectedCallback() {
    console.log('applicationId ##### ' + JSON.stringify(this.applicationId));
    console.log('recordId ##### ' + JSON.stringify(this.recordId));
    this.handleGetLastLoginDate();
  //  this.handleCheckRequiredDocs();
    getVerification({ recordId: this.recordId })
        .then((result) => {
            this.VericationStatus = result;
        })
        .catch((error) => {
        });
}

handleGetLastLoginDate() {
    getLastLoginDate().then((result) => {
        this.lastLoginDate = result
    }).catch((err) => {
        console.log('Error in getLastLoginDate= ', err);
    });
}


getPropertyData() {
    getCollateralDetails({ applicationId: this.applicationId })
.then(result => {
    console.log('result ### ', JSON.stringify(JSON.parse(result.strDataTableData)));
        var data = JSON.parse(result.strDataTableData);
            data.forEach(element =>{
                if (element.Is_Online_Ec_Completed__c === 'false') {
                    this.errorMsgs.push('* Fill Required Data On ' + element.Name_LABEL + ' In Collateral Tab');
                }
            });
        })
        .catch(error => {
                console.error('getprpdata ', error)
        })
        
}

/*handleCheckRequiredDocs() {
    console.log('call check required');
    // getRequiredDocuments({ stageName: 'Online EC', parentId: this.applicationId }).then((result) => {
    //     if (result) {
    //         result.forEach(element => {
    //             this.errorMsgs.push('* Upload Required Document :: ' + element.Name + ' In Document Upload Tab');
    //         });

    //     }

    // })
    //     .catch((err) => {
    //         console.log('Error in handleCheckRequiredDocs= ', err);
    //     });
}*/

handleCancel() {
    console.log('cancel call');
    this[NavigationMixin.Navigate]({
        type: 'standard__recordPage',
        attributes: {
            recordId: this.recordId,
            objectApiName: 'Verification__c',
            actionName: 'view'
        }
    })
}

handleSubmit() {
    this.isSpinnerActive = true;
    this.errorMsgs = [];
    this.getPropertyData();
 //   this.handleCheckRequiredDocs();
    setTimeout(() => {
        if (this.VericationStatus == 'Completed') {
            console.log('#11', STATUS_FIELD.fieldApiName);
            this.toastMessage('Error', 'Online Ec is already Completed .', 'Error');
            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: this.recordId,
                    objectApiName: 'Application__c',
                    actionName: 'view'
                }
            });
        }
        else {
            console.log('this.errorMsgs. #### ', JSON.stringify(this.errorMsgs));
            if (this.errorMsgs.length > 0) {
                this.toastMessage('Error', 'Remove All Error', 'Error');
                this.isSpinnerActive = false;
                let ref = this;
                setTimeout(() => {
                    this.showErrorTab = true;
                    ref.tabName = 'Error';
                }, 2000);
            } else {
                const fields = {};
                try {
                    fields[ID_FIELD.fieldApiName] = this.recordId;
                    fields[STATUS_FIELD.fieldApiName] = 'Completed'
                    const recordInput = { fields };
                    console.log('fiield ', fields);
                    updateRecord(recordInput)
                        .then(() => {
                            console.log('inside updateRecord');
                            this.toastMessage('Success', 'Verification Submitted Successfully.', 'Success');
                            this[NavigationMixin.Navigate]({
                                type: 'standard__recordPage',
                                attributes: {
                                    recordId: this.recordId,
                                    objectApiName: 'Application__c',
                                    actionName: 'view'
                                }
                            });
                        })
                        .catch(error => {
                            console.log('upd ', error);
                        });
                }
                catch (exe) {
                    console.error(exe);
                }

            }
        }
    }, 1000);
}

toastMessage(title, message, variant) {
    const event = new ShowToastEvent({
        title: title,
        message: message,
        variant: variant,
    });
    this.dispatchEvent(event);
}
handleActive(event) {
    this.tabName = event.target.value;
}
}