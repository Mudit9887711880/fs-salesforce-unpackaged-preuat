import { LightningElement, track, api, wire } from 'lwc';
import getPropertyData from '@salesforce/apex/FetchDataTableRecordsController.getPropertyData';
import getPropertyOwners from '@salesforce/apex/FsPreloginController.getPropertyOwners';

export default class FspcAddandModifyProperty extends LightningElement {


    @api recordTypeName;
    @api applicationId;
    @api loanAppIdList;
    @api stageName;
    @track newpropIds;

    @track isPropDataArrived = false;
    @track propData = [];
    @track loanAppId;
    @track showPropForm = false;
    @track propWrapper = { loanAppId: '', applicationId: '', propId: '' };
    @track recordId;
    @track showDeletePopup = false;
    @track hasPrimaryOwner = false;
    @track propOwners = {};
    @track ownerTypeOption;
    @track propRowAction = [
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
    ];

    connectedCallback() {
        if (!this.recordTypeName)
            this.recordTypeName = 'Pre Login Property Detail';
        if (this.recordTypeName && this.applicationId)
            this.getAllPropertyData();
        console.log('appId ', this.applicationId);
        if (this.applicationId) {
            console.log('i am in');
        }
    }

    @api getApplicationId(appId) {
        this.applicationId = appId;
        console.log('prop tab ', this.applicationId);
    }

    @api getLoanAppList(list) {
        this.loanAppIdList = list;
        if (this.template.querySelector('c-fs-pre-login-property-detail'))
            this.template.querySelector('c-fs-pre-login-property-detail').getAllOwners(this.loanAppIdList);
    }

    @api getPropertyOwnersName(appId) {
        console.log('appId ', appId)
        getPropertyOwners({ applicationId: appId }).then(result => {
            console.log('returnMAp ', result);
            this.propOwners = result;
            console.log('propOwners return ', this.propOwners);
        })
            .catch(error => {
                console.log('error ', error);
            })
    }

    @api getPropertyOwnersList(ownerList) {
        console.log('ownerList ', ownerList);
        this.ownerTypeOption = ownerList;
        if (this.template.querySelector('c-fs-pre-login-property-detail'))
            this.template.querySelector('c-fs-pre-login-property-detail').getSectionPageContent('');
    }

    //get Property related to current application
    @api async getAllPropertyData() {
        console.log('get property data called!!', this.applicationId);
        this.isPropDataArrived = false;
        this.getPropertyOwnersName(this.applicationId);
        await getPropertyData({ applicationId: this.applicationId, recTypeName: this.recordTypeName })
            .then(result => {
                this.propData = [];
                result.strDataTableData = JSON.stringify(this.populatePropOwner(JSON.parse(result.strDataTableData)));
                this.propData = result;
                this.hasPrimaryOwner = false;
                //this.propData.strDataTableData = 
                console.log('prop ', this.propData);
                var temp = JSON.parse(this.propData.strDataTableData); //this.populatePropOwner(JSON.parse(result.strDataTableData));
                //console.log('result ',temp);
                temp.forEach(element => {
                    console.log('element ', JSON.stringify(element));
                    var dataResult = element;
                    if (dataResult.isPrimaryOwner__c === 'true') {
                        this.hasPrimaryOwner = true;
                    }
                });
                console.log('primaryOwner @@ ', this.hasPrimaryOwner);
                setTimeout(() => {
                    this.isPropDataArrived = true;
                }, 200);
                const propertyEvent = new CustomEvent("checkproperty", {
                    detail: this.hasPrimaryOwner
                });
                console.log('dispatch event property ', JSON.stringify(propertyEvent));
                this.dispatchEvent(propertyEvent);
            })
            .catch(error => {
                console.log('error in getpropdata ', error);
            })
    }

    handleSelectedProperty(event) {
        console.log('on selected property ', event);
        console.log('Edit called #### ', JSON.stringify(event.detail));
        var recordData = event.detail.recordData;
        this.loanAppId = recordData.Loan_Applicant__c;
        this.applicationId = recordData.Application__c;
        this.recordId = recordData.Id;
        if (event.detail.ActionName === 'edit') {
            this.showPropForm = true;
            setTimeout(() => {
                console.log('prop query ', this.template.querySelector("c-fs-pre-login-property-detail"));
                if (this.template.querySelector("c-fs-pre-login-property-detail")) {
                    console.log('in child functions');
                    const propId = recordData.Id;
                    console.log('recId ', propId);
                    this.recordId = propId;
                    this.customerTypeValue = recordData.Customer_Type__c;
                    this.propWrapper.loanAppId = recordData.Loan_Applicant__c;
                    this.propWrapper.applicationId = recordData.Application__c;
                    this.propWrapper.propId = recordData.Id;
                    this.template.querySelector("c-fs-pre-login-property-detail").getIdsOnEdit(this.propWrapper);
                    this.template.querySelector("c-fs-pre-login-property-detail").getSectionPageContent(propId);
                }
            }, 200);
        }
        else if (event.detail.ActionName === 'delete') {
            console.log('Delete Called ');
            this.showDeletePopup = true;
        }
    }

    callGetPropertyData(event) {
        console.log('call get property data', event.detail);
        if (event.detail) {
            this.applicationId = event.detail;
        }
        this.getAllPropertyData();
    }

    handlemodalactions(event) {
        this.showDeletePopup = false;
        if (event.detail === true)
            this.getAllPropertyData();
    }

    populatePropOwner(data) {
        console.log('populate called')
        data.forEach(element => {
            console.log('element while populating ', JSON.stringify(element));
            console.log('element.Id ', element.Id, this.propOwners[element.Id]);
            if (this.propOwners.hasOwnProperty(element.Id)) {
                console.log('inside if');
                console.log('propidsss ', this.propOwners[element.Id]);
                element['Loan_Applicant__r.Applicant_Name__c'] = this.propOwners[element.Id];
                element['Loan_Applicant__r.Applicant_Name__c'] = element['Loan_Applicant__r.Applicant_Name__c'].join();
            }
            else {
                console.log('else running');
            }
        });
        console.log('datapop ', data);
        return data;
    }
    handleCancel() {
        const propertycheckevent = new CustomEvent('checkpropertyvalidation',{detail:true});
        this.dispatchEvent(propertycheckevent);
        const propertyevent = new CustomEvent('closepropertymodal');
        this.dispatchEvent(propertyevent);
    }

    handlenewpropertyData(event) {
        console.log('new prop Ids', event.detail);
        this.newpropIds = event.detail;
        if (this.newpropIds != undefined) {
            const propertysendevent = new CustomEvent('getnewproperty', { detail: this.newpropIds });
            this.dispatchEvent(propertysendevent);
        }
    }

}