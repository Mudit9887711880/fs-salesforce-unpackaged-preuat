import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getCapabiltyData from '@salesforce/apex/fsPcAcController.getCapabiltyData';
export default class PcCapability extends LightningElement {
    @api isSalaried = false;
    @api isRentalMortgage = false;
    @api isRentalOther = false;
    @api isDailyWages = false;
    @api isPension = false;
    @api isAbroadIncome = false;
    @api isOther = false;
    @api isSelfEmployedOrBusiness = false;
    @api isEateriesAndOthers = false;
    @api isDayBasis = false;
    @api isMarginBasis = false;
    @api isDisabled = false;
    @api sectiontitle;
    @api capabilityRecordId;
    @api loanApplicantId;
    @api segMentValue;
    @api subSegMentValue;
    @api dayOrMaginValue;
    @api verificationId;
    @api capabilityRecordTypeId;
    @api applicationId;
    @api relationshipId;
    @api otherConfirmation;
    @api natureofdocumentProof;
    @api proofRemarks;
    @api otherConfirmationsDailyWages;
    @api ownershipProof;
    @api fcEnquiry;
    @track salesPerMonth;
    @track marginInAmount;
    @track grossMonthlyIncome;
    @track capabilitychildSpinner = false;
    @track capabilitypcTableData;
    @api appId;
    @track showDeleteModal = false;
    @track capRecordId;
    @track capaccheck;
    @track showAcCharacterForm = false;
    @track labelSave = 'Save';
    @track isAc = false;

    @track rowAction = [
        {
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
                } ,
        {
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
        }
        
    ];


    connectedCallback() {
        console.log('loan applicant id>>>>> ', this.loanApplicantId);
        console.log('loan applicant id>>>>> ', this.verificationId);
        console.log('track loan applicant id>>>>> ', this.laId);
        console.log('Capability Record Type Id', this.capabilityRecordTypeId);
        console.log('Capability relationship Id', this.relationshipId);
        console.log('Capability Id for AC', this.capabilityRecordId);
        this.capabilitychildSpinner = true;
        if (this.sectiontitle != 'AC') {
            this.showAcCharacterForm = true;
        }
        else {
           
            this.isAc = true;
            setTimeout(() => {
                this.rowAction.splice(1, 1/*,{
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
                } */)
                //this.rowAction.push()
            }, 200);
        }
        this.getCapabilityTableRecords();
    }

    handleCapabiltySubmit(event) {
        console.log('capability submit called');
        if (this.sectiontitle == 'AC') {
            this.capaccheck = true;
        }
    }


    handleCapabiltySuccess(event) {
        console.log('handleCapabilitySubmit called');
        console.log(event.detail.id);
        if (this.labelSave == 'Save') {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    variant: 'success',
                    message: 'Record Created Successfully',
                })
            );
        }
        if (this.labelSave == 'Update') {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    variant: 'success',
                    message: 'Record Updated Successfully',
                })
            );
        }

        if (this.sectiontitle == 'AC' || this.sectiontitle == 'PC') {
            this.capabilityRecordId = undefined;
        }
        const changeEvent = new CustomEvent('checkcapabilityvalidation', {
            detail: true
        });
        this.dispatchEvent(changeEvent);
        const inputFields = this.template.querySelectorAll(
            '.capable'
        );
        if (inputFields) {
            inputFields.forEach(field => {
                field.reset();
            });
        }
        this.salesPerMonth = null;
        this.marginInAmount = null;
        this.grossMonthlyIncome = null;

        this.capabilitychildSpinner = true;
        if(this.sectiontitle == 'PC')
        this.labelSave = 'Save'
        if(this.sectiontitle == 'AC')
        this.showAcCharacterForm = false;
        this.getCapabilityTableRecords();
    }





    handleCalculations() {
        let incomeSegment = this.segMentValue;
        this.grossMonthlyIncome = undefined;
        this.salesPerMonth = undefined;
        this.marginInAmount = undefined;
        if (incomeSegment == 'Daily wages') {
            let incomePerDay = this.template.querySelector('[data-id="Income_per_day__c"]').value !== undefined ? this.template.querySelector('[data-id="Income_per_day__c"]').value : 0;
            let noOfDays = this.template.querySelector('[data-id="Number_of_days__c"]').value !== undefined ? this.template.querySelector('[data-id="Number_of_days__c"]').value : 0;
            incomePerDay = parseFloat(incomePerDay);
            noOfDays = parseFloat(noOfDays);
            this.grossMonthlyIncome = incomePerDay * noOfDays;
        } else if (incomeSegment == 'Eateries' || incomeSegment == 'Food business' ||
            incomeSegment == 'Manufacturing' || incomeSegment == 'Shop owner' ||
            incomeSegment == 'Milk business' || incomeSegment == 'General shops' ||
            incomeSegment == 'Vegetables/Fruits/Flower/Vendor' || incomeSegment == 'Self Employed') {
            let dayMarginBasis = this.dayOrMaginValue;
            if (dayMarginBasis == 'Day Basis') {
                let incomePerDay = this.template.querySelector('[data-id="Income_per_day__c"]').value !== undefined ? this.template.querySelector('[data-id="Income_per_day__c"]').value : 0;
                let noOfDays = this.template.querySelector('[data-id="Number_of_days__c"]').value !== undefined ? this.template.querySelector('[data-id="Number_of_days__c"]').value : 0;
                incomePerDay = parseFloat(incomePerDay);
                noOfDays = parseFloat(noOfDays);
                this.grossMonthlyIncome = incomePerDay * noOfDays;
            } else if (dayMarginBasis == 'Margin Basis') {
                let salesPerDay = this.template.querySelector('[data-id="Sales_per_day__c"]').value !== undefined ? this.template.querySelector('[data-id="Sales_per_day__c"]').value : 0;
                let noOfDays = this.template.querySelector('[data-id="Number_of_days__c"]').value !== undefined ? this.template.querySelector('[data-id="Number_of_days__c"]').value : 0;
                let margin = this.template.querySelector('[data-id="Margin__c"]').value !== undefined ? this.template.querySelector('[data-id="Margin__c"]').value : 0;
                let electricity = this.template.querySelector('[data-id="Electricity__c"]').value !== undefined ? this.template.querySelector('[data-id="Electricity__c"]').value : 0;
                let salary = this.template.querySelector('[data-id="Salary__c"]').value !== undefined ? this.template.querySelector('[data-id="Salary__c"]').value : 0;
                let rent = this.template.querySelector('[data-id="Rent__c"]').value !== undefined ? this.template.querySelector('[data-id="Rent__c"]').value : 0;
                let others = this.template.querySelector('[data-id="Others__c"]').value !== undefined ? this.template.querySelector('[data-id="Others__c"]').value : 0;
                salesPerDay = parseFloat(salesPerDay);
                noOfDays = parseFloat(noOfDays);
                electricity = parseFloat(electricity);
                salary = parseFloat(salary);
                rent = parseFloat(rent);
                others = parseFloat(others);

                this.salesPerMonth = salesPerDay * noOfDays;
                this.marginInAmount = this.salesPerMonth / 100 * margin;
                this.grossMonthlyIncome = (this.marginInAmount - (electricity + salary + rent + others));
            }
        }
    }

    handleReset(event) {
        if(this.sectiontitle == 'AC')
        this.showAcCharacterForm = false;
        if(this.sectiontitle == 'PC')
       {
            this.capabilityRecordId = undefined;
            this.labelSave = 'Save';
       } 
        this.resetLogic();
    }


    handleSelectedCapabilityMember(event) {
        var data = event.detail;
        this.capRecordId = data.recordData.Id;
        if (data && data.ActionName == 'delete') {
            console.log('char id', data.recordData.Id);
            this.showDeleteModal = true;
        }
        if (data && data.ActionName == 'edit') {
             this.labelSave = 'Update';
            this.showAcCharacterForm = true;
            console.log('char id', data.recordData.Id);
            this.capabilityRecordId = this.capRecordId
        }
    }

    handlemodalactions(event) {
        this.showDeleteModal = false;
        console.log('event.detail>>>>> ', event.detail);
        if (event.detail === true) {
            this.capabilitychildSpinner = true;
            this.getCapabilityTableRecords();
        }
    }

    // to reset the form fields;
    resetLogic() {
        const inputFields = this.template.querySelectorAll('.capable');
        if (inputFields) {
            inputFields.forEach(field => {
                field.reset();
            });
        }

    }


    // to get the Capability Table Records for PC -----
    getCapabilityTableRecords() {
        console.log('loan applicant data in pc capanbility>>>> ', this.loanApplicantId);
        let vefType, capType;
        if (this.sectiontitle == 'PC') {
            vefType = 'PC';
            capType = 'PC Capability';
        }
        else if (this.sectiontitle == 'AC') {
            vefType = 'AC';
            capType = 'AC Capability';

        }
        console.log('vef type',vefType,'capType',capType);
        this.capabilitypcTableData = undefined;
        getCapabiltyData({ appId: this.appId, loanAppId: this.loanApplicantId, recTypeName: vefType, metadataName: 'PC_Capabilty_Table', caprecordTypeName: capType }).then((result) => {
            console.log('getCapabilityTableRecords in pc= ', result);
            // if (result && result.strDataTableData && JSON.parse(result.strDataTableData).length) {
            this.capabilitypcTableData = result

            // }
            console.log('cap data', JSON.parse(JSON.stringify(result)));
            const changeEvent = new CustomEvent('checkcapabilityvalidation', {
                detail: true
            });
            this.dispatchEvent(changeEvent);
            this.capabilitychildSpinner = false;
        }).catch((err) => {
            this.capabilitypcTableData = undefined;
            console.log('getCapabilityTableRecords in pc Error= ', err);
            this.capabilitychildSpinner = false;
        });
    }





}