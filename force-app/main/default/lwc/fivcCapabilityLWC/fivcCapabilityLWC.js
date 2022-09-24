/*
* ──────────────────────────────────────────────────────────────────────────────────────────────────
* @author           Kuldeep Sahu  
* @modifiedBy       Kuldeep Sahu   
* @created          2022-05-03
* @modified         2022-07-21
* @Description      This component is build to handle all the operations related to 
                    Capability Tab In Verification-C in FiveStar.              
* ──────────────────────────────────────────────────────────────────────────────────────────────────
*/
import { LightningElement, api, track } from 'lwc';
import getCapabiltyData from '@salesforce/apex/FIV_C_Controller.getCapabiltyData';
import getApplicantList from '@salesforce/apex/FIV_C_Controller.getApplicantList';
import deleteRecord from '@salesforce/apex/Utility.deleteRecord';
import getRecordTypeId from '@salesforce/apex/DatabaseUtililty.getRecordTypeId';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
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
},
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
}];

export default class FivcCapabilityLWC extends LightningElement {
    @api applicationId;
    @api verificationId;

    @track rowAction = rowAction;

    @track capabilityRecordId;
    @track capabilityTableData;
    @track customerList;
    @track customerMap;
    @track loanApplicantId;
    @track customerLoanApplicantMap;

    @track isSalaried = false;
    @track isRentalMortgage = false;
    @track isRentalOther = false;
    @track isDailyWages = false;
    @track isPension = false;
    @track isAbroadIncome = false;
    @track isOther = false;
    @track isSelfEmployedOrBusiness = false;
    @track isEateriesAndOthers = false;
    @track isDayBasis = false;
    @track isMarginBasis = false;
    @track showLoader = false;
    @track showForm = true;

    @track salesPerMonth;
    @track marginInAmount;
    @track grossMonthlyIncome;
    @track shwoDeleteModal = false;
    @track fivCRecordType;

    @track empDocProof;
    @track percentageOfIncome; // done
    @track yearOfBusiness; // done
    @track totalExpInBusiness; // done
    @track yearOfServiceWidEmp; // done
    @track totalWorkExp; // done
    @track monthlySalary; // done
    @track yearOfOccupation; // done
    @track incomePerDayVal; // done
    @track numberOfDays; // done
    @track incomePerMonth; // done
    @track numberOfUnits; // done
    @track rentalIncome; // done
    @track employerName; // done

    get DocProofRequired() {
        return (this.empDocProof == 'Yes');
    }

    // This Method Is Used To Get All Data At Initial Level(Loading)
    connectedCallback() {
        this.handleGetApplicantList();
        this.handleGetFIVCRecordType();
    }

    // This Method Is Used To Handle Form Values
    handleFormValue(evt) {
        if (evt.target.fieldName == 'Income_segment__c') {
            this.isSalaried = false;
            this.isDailyWages = false;
            this.isPension = false;
            this.isAbroadIncome = false;
            this.isOther = false;
            this.isSelfEmployedOrBusiness = false;
            this.isEateriesAndOthers = false;
            this.isDayBasis = false;
            this.isMarginBasis = false;
            let dayMarginBasis = this.template.querySelector('[data-id="Day_Margin_Basis__c"]');
            if (dayMarginBasis) {
                dayMarginBasis.value = '';
            }
            if (evt.target.value == 'Salaried') {
                this.isSalaried = true;
            } else if (evt.target.value == 'Pension') {
                this.isPension = true;
            } else if (evt.target.value == 'Daily wages') {
                this.isDailyWages = true;
            } else if (evt.target.value == 'Income from Abroad') {
                this.isAbroadIncome = true;
            } else if (evt.target.value == 'Eateries' || evt.target.value == 'Food business' ||
                evt.target.value == 'Manufacturing' || evt.target.value == 'Shop owner' ||
                evt.target.value == 'Milk business' || evt.target.value == 'General shops' ||
                evt.target.value == 'Vegetables/Fruits/Flower/Vendor'
            ) {
                this.isEateriesAndOthers = true;
            } else if (evt.target.value == 'Self Employed') {
                this.isSelfEmployedOrBusiness = true;
            } else if (evt.target.value == 'Housewife' || evt.target.value == 'Retired' ||
                evt.target.value == 'Unemployed' || evt.target.value == 'Others') {
                this.isOther = true;
            }
        } else if (evt.target.fieldName == 'Subsegment__c') {
            this.isRentalMortgage = false;
            this.isRentalOther = false;
            if (evt.target.value == 'Commercial - mortgage proeprty' || evt.target.value == 'Residential - Mortgage property') {
                this.isRentalMortgage = true;
            } else if (evt.target.value == 'Commercial - Other property' || evt.target.value == 'Residential - Other proeprty') {
                this.isRentalOther = true;
            }
        } else if (evt.target.fieldName == 'Day_Margin_Basis__c') {
            if (evt.target.value == 'Day Basis') {
                this.isDayBasis = true;
                this.isMarginBasis = false;
            } else if (evt.target.value == 'Margin Basis') {
                this.isMarginBasis = true;
                this.isDayBasis = false;
            }
        } else if (evt.target.fieldName == 'Employment_Document_Proof__c') {
            this.empDocProof = evt.target.value;
        } else if (evt.target.name == 'of_income_transacted_through_bank_acco__c') {
            this.percentageOfIncome = evt.target.value;
        } else if (evt.target.name == 'Monthly_Salary__c') {
            this.monthlySalary = evt.target.value;
        } else if (evt.target.name == 'Year_of_Business__c') {
            this.yearOfBusiness = evt.target.value;
        } else if (evt.target.name == 'Total_experience_in_this_business_yrs__c') {
            this.totalExpInBusiness = evt.target.value;
        } else if (evt.target.name == 'Year_of_Service_With_Employer__c') {
            this.yearOfServiceWidEmp = evt.target.value;
        } else if (evt.target.name == 'Total_Work_Experience__c') {
            this.totalWorkExp = evt.target.value;
        } else if (evt.target.name == 'Year_of_Occupation__c') {
            this.yearOfOccupation = evt.target.value;
        } else if (evt.target.name == 'Income_per_month__c') {
            this.incomePerMonth = evt.target.value;
        } else if (evt.target.name == 'No_of_Units__c') {
            this.numberOfUnits = evt.target.value;
        } else if (evt.target.name == 'Rental_Income__c') {
            this.rentalIncome = evt.target.value;
        } else if (evt.target.name == 'Name_of_the_Employer__c') {
            this.employerName = evt.target.value;
        }
    }

    // This Method Is Used To Handle All Calculations
    handleCalculations(evt) {
        let incomeSegment = this.template.querySelector('[data-id="Income_segment__c"]').value;

        this.grossMonthlyIncome = undefined;
        this.salesPerMonth = undefined;
        this.marginInAmount = undefined;
        if (incomeSegment == 'Daily wages') {
            this.incomePerDayVal = (evt.target.name == 'Income_per_day__c') ? (evt.target.value ? evt.target.value : 0) : this.incomePerDayVal;
            this.numberOfDays = (evt.target.name == 'Number_of_days__c') ? (evt.target.value ? evt.target.value : 0) : this.numberOfDays;
            this.incomePerDayVal = parseFloat(this.incomePerDayVal);
            this.numberOfDays = parseFloat(this.numberOfDays);
            this.grossMonthlyIncome = this.incomePerDayVal * this.numberOfDays;
        } else if (incomeSegment == 'Eateries' || incomeSegment == 'Food business' ||
            incomeSegment == 'Manufacturing' || incomeSegment == 'Shop owner' ||
            incomeSegment == 'Milk business' || incomeSegment == 'General shops' ||
            incomeSegment == 'Vegetables/Fruits/Flower/Vendor' || incomeSegment == 'Self Employed') {
            let dayMarginBasis = this.template.querySelector('[data-id="Day_Margin_Basis__c"]').value;
            if (dayMarginBasis == 'Day Basis') {
                this.incomePerDayVal = (evt.target.name == 'Income_per_day__c') ? (evt.target.value ? evt.target.value : 0) : this.incomePerDayVal;
                this.numberOfDays = (evt.target.name == 'Number_of_days__c') ? (evt.target.value ? evt.target.value : 0) : this.numberOfDays;
                this.incomePerDayVal = parseFloat(this.incomePerDayVal);
                this.numberOfDays = parseFloat(this.numberOfDays);
                this.grossMonthlyIncome = this.incomePerDayVal * this.numberOfDays;
            } else if (dayMarginBasis == 'Margin Basis') {
                let salesPerDay = this.template.querySelector('[data-id="Sales_per_day__c"]').value !== undefined ? this.template.querySelector('[data-id="Sales_per_day__c"]').value : 0;
                this.numberOfDays = (evt.target.name == 'Number_of_days__c') ? (evt.target.value ? evt.target.value : 0) : this.numberOfDays;
                let margin = this.template.querySelector('[data-id="Margin__c"]').value !== undefined ? this.template.querySelector('[data-id="Margin__c"]').value : 0;
                let electricity = this.template.querySelector('[data-id="Electricity__c"]').value !== undefined ? this.template.querySelector('[data-id="Electricity__c"]').value : 0;
                let salary = this.template.querySelector('[data-id="Salary__c"]').value !== undefined ? this.template.querySelector('[data-id="Salary__c"]').value : 0;
                let rent = this.template.querySelector('[data-id="Rent__c"]').value !== undefined ? this.template.querySelector('[data-id="Rent__c"]').value : 0;
                let others = this.template.querySelector('[data-id="Others__c"]').value !== undefined ? this.template.querySelector('[data-id="Others__c"]').value : 0;
                salesPerDay = parseFloat(salesPerDay);
                this.numberOfDays = parseFloat(this.numberOfDays);
                electricity = parseFloat(electricity);
                salary = parseFloat(salary);
                rent = parseFloat(rent);
                others = parseFloat(others);

                this.salesPerMonth = salesPerDay * this.numberOfDays;
                this.marginInAmount = this.salesPerMonth / 100 * margin;
                this.grossMonthlyIncome = (this.marginInAmount - (electricity + salary + rent + others));
            }
        }
    }

    // This Method Is Used To Handle Customer Selection
    handleCustomerSelection(evt) {
        console.log('handleCustomer Selection =', evt.target.value)
        this.loanApplicantId = evt.target.value;
    }

    // This Method Is Used To Check Capability Validation
    @api
    checkCapabilityValidation() {
        let allValid = true;
        let tempMap = {};
        let tempListError = [];
        this.customerList.forEach(currentItem => {
            console.log('validation loop= ', this.customerMap[currentItem.value])
            if (this.customerMap[currentItem.value] && this.customerMap[currentItem.value].Income_Considered__c == 'Yes') {
                tempMap[currentItem.value] = 'Not Exist';
            }
        });

        console.log('incomeConsideredLength= ', tempMap);
        if ((this.capabilityTableData && this.capabilityTableData.strDataTableData && JSON.parse(this.capabilityTableData.strDataTableData).length > 0)) {
            JSON.parse(this.capabilityTableData.strDataTableData).forEach(element => {
                if (tempMap[element.Loan_Applicant__c] == 'Not Exist') {
                    tempMap[element.Loan_Applicant__c] = 'Exist';
                }
            });

            for (let keyValue of Object.keys(tempMap)) {
                let element = JSON.parse(JSON.stringify(tempMap[keyValue]))
                if (element == 'Not Exist') {
                    let msg = this.customerMap[keyValue].Customer_Information__r.Name + "'s Capability Record Is Missing."
                    tempListError.push(msg);
                }
            }
        } else if (JSON.stringify(tempMap) != {}) {
            tempListError.push('Add Capabilities For Applicants Whose Income Are Considered');
            console.log('2');
        }

        console.log('tempListError = ', tempListError);

        this.dispatchEvent(new CustomEvent('capabilityvalidation', {
            detail: tempListError
        }));
    }

    // This Method Is Used To Handle Capability Table Selection Event
    handleSelectedCapability(evt) {
        console.log('handleSelectedCapability= ', JSON.stringify(evt.detail));
        var data = evt.detail;

        if (data && data.ActionName == 'edit') {
            this.capabilityRecordId = data.recordData.Id;
            this.loanApplicantId = data.recordData.Loan_Applicant__c;
            this.empDocProof = data.recordData.Employment_Document_Proof__c;
            this.percentageOfIncome = data.recordData.of_income_transacted_through_bank_acco__c;
            this.monthlySalary = data.recordData.Monthly_Salary__c;
            this.yearOfBusiness = data.recordData.Year_of_Business__c;
            this.totalExpInBusiness = data.recordData.Total_experience_in_this_business_yrs__c;
            this.yearOfServiceWidEmp = data.recordData.Year_of_Service_With_Employer__c;
            this.totalWorkExp = data.recordData.Total_Work_Experience__c;
            this.yearOfOccupation = data.recordData.Year_of_Occupation__c;
            this.incomePerDayVal = data.recordData.Income_per_day__c;
            this.numberOfDays = data.recordData.Number_of_days__c;
            this.incomePerMonth = data.recordData.Income_per_month__c;
            this.numberOfUnits = data.recordData.No_of_Units__c;
            this.rentalIncome = data.recordData.Rental_Income__c;
            this.employerName = data.recordData.Name_of_the_Employer__c; 

            this.makeAllFalse();

            if (data.recordData.Income_segment__c == 'Salaried') {
                this.isSalaried = true;
            } else if (data.recordData.Income_segment__c == 'Pension') {
                this.isPension = true;
            } else if (data.recordData.Income_segment__c == 'Daily wages') {
                this.isDailyWages = true;
            } else if (data.recordData.Income_segment__c == 'Income from Abroad') {
                this.isAbroadIncome = true;
            } else if (data.recordData.Income_segment__c == 'Eateries' || data.recordData.Income_segment__c == 'Food business' ||
                data.recordData.Income_segment__c == 'Manufacturing' || data.recordData.Income_segment__c == 'Shop owner' ||
                data.recordData.Income_segment__c == 'Milk business' || data.recordData.Income_segment__c == 'General shops' ||
                data.recordData.Income_segment__c == 'Vegetables/Fruits/Flower/Vendor'
            ) {
                this.isEateriesAndOthers = true;
            } else if (data.recordData.Income_segment__c == 'Self Employed') {
                this.isSelfEmployedOrBusiness = true;
            } else if (data.recordData.Income_segment__c == 'Housewife' || data.recordData.Income_segment__c == 'Retired' ||
                data.recordData.Income_segment__c == 'Unemployed' || data.recordData.Income_segment__c == 'Others') {
                this.isOther = true;
            }

            if (data.recordData.Subsegment__c == 'Commercial - mortgage proeprty' || data.recordData.Subsegment__c == 'Residential - Mortgage property') {
                this.isRentalMortgage = true;
            } else if (data.recordData.Subsegment__c == 'Commercial - Other property' || data.recordData.Subsegment__c == 'Residential - Other proeprty') {
                this.isRentalOther = true;
            }

            if (data.recordData.Day_Margin_Basis__c == 'Day Basis') {
                this.isDayBasis = true;
            } else if (data.recordData.Day_Margin_Basis__c == 'Margin Basis') {
                this.isMarginBasis = true;
            }
        } else if (data && data.ActionName == 'delete') {
            this.makeAllFalse();
            this.showDeleteModal = true;
            this.capabilityRecordId = data.recordData.Id;
        }
    }

    // This Method Is Used To Handle Cancel Action On Form
    onCancel() {
        this.capabilityRecordId = undefined;
        this.loanApplicantId = undefined;
        this.empDocProof = undefined;
        this.percentageOfIncome = undefined;
        this.monthlySalary = undefined;
        this.yearOfBusiness = undefined;
        this.totalExpInBusiness = undefined;
        this.yearOfServiceWidEmp = undefined;
        this.totalWorkExp = undefined;
        this.yearOfOccupation = undefined;
        this.incomePerDayVal = undefined;
        this.numberOfDays = undefined;
        this.incomePerMonth = undefined;
        this.numberOfUnits = undefined;
        this.rentalIncome = undefined;
        this.makeAllFalse();
    }

    // This Method Is Used To Make All Falgs False.
    makeAllFalse() {
        this.isSalaried = false;
        this.isRentalMortgage = false;
        this.isRentalOther = false;
        this.isDailyWages = false;
        this.isPension = false;
        this.isAbroadIncome = false;
        this.isOther = false;
        this.isSelfEmployedOrBusiness = false;
        this.isEateriesAndOthers = false;
        this.isMarginBasis = false;
        this.isDayBasis = false;
    }

    // This Method Is Used To Show Loader For Short Time
    showTemporaryLoader() {
        this.showLoader = true;
        let ref = this;
        setTimeout(function () {
            ref.showLoader = false;
        }, 500);
    }

    checkRecordValidity() {
        const allValid = [
            ...this.template.querySelectorAll('lightning-input'),
        ].reduce((validSoFar, inputCmp) => {
            inputCmp.reportValidity();
            return validSoFar && inputCmp.checkValidity();
        }, true);

        return allValid;
    }

    // This Method Is Used To Handle Actions Post Submit
    handleCapabiltySubmit(event) {
        console.log('handleCapabiltySubmit called');
        let validInputs = this.checkRecordValidity();
        if (!this.loanApplicantId) {
            event.preventDefault();
            this.showNotifications('Missing values', 'You haven\'t selected any customer', 'error');
        } else if (!validInputs) {
            event.preventDefault();
            this.showNotifications('Invalid Values', 'Please enter correct values', 'error');
        } else {
            this.showTemporaryLoader();
        }
    }

    // This Method Is Used To Handle Actions Post Success
    handleCapabiltySuccess() {
        console.log('handleCapabiltySuccess= ');
        this.onCancel();
        this.grossMonthlyIncome = undefined;
        this.salesPerMonth = undefined;
        this.marginInAmount = undefined;
        this.capabilityRecordId = undefined;
        this.showForm = false;
        this.capabilityTableData = undefined;
        let ref = this;
        setTimeout(() => {
            ref.showForm = true;
            ref.capabilityRecordId = undefined;
        }, 200);
        this.getCapabilityTableRecords();
    }

    // This Method Is Used To Handle Delete Actions
    handleDelete(event) {
        console.log('handleDelete= ', event.target.label)
        let label = event.target.label;
        if (label == 'Yes') {
            this.showDeleteModal = false;
            this.handleDeleteRecord(this.capabilityRecordId);
        } else if (label == 'No') {
            this.showDeleteModal = false;
            this.makeAllFalse();
            this.capabilityRecordId = undefined;
        }
    }

    // This Method Is Used To Show Toast Notificatin
    showNotifications(title, msg, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title: title,
            message: msg,
            variant: variant
        }));
    }

    /*=================  All server methods  ====================*/

    // This Method Is Used To Get All The Capability Table Records
    getCapabilityTableRecords() {
        this.capabilityTableData = undefined;
        getCapabiltyData({ recordId: this.applicationId }).then((result) => {
            console.log('getCapabilityTableRecords= ', result);
            this.capabilityTableData = JSON.parse(JSON.stringify(result));
            this.checkCapabilityValidation();
        }).catch((err) => {
            this.capabilityTableData = undefined;
            console.log('getCapabilityTableRecords Error= ', err);
            this.checkCapabilityValidation();
        });
    }

    // This Method Is Used To Get Account List
    handleGetApplicantList() {
        getApplicantList({ appId: this.applicationId }).then((result) => {
            console.log('handleGetApplicantList = ', result);
            if (result) {
                let tempList = [];
                this.customerMap = JSON.parse(JSON.stringify(result));

                for (let keyValue of Object.keys(this.customerMap)) {
                    let element = JSON.parse(JSON.stringify(this.customerMap[keyValue]))
                    tempList.push({ label: element.Customer_Information__r.Name, value: element.Id });
                }
                this.customerList = JSON.parse(JSON.stringify(tempList));
                this.getCapabilityTableRecords();
            }
        }).catch((err) => {
            console.log('Error in handleGetApplicantList = ', err);
            this.getCapabilityTableRecords();
        });
    }

    // This Method Is Used To Delete Capability Record
    handleDeleteRecord(recordIdToDelete) {
        this.showTemporaryLoader();
        deleteRecord({ recordId: recordIdToDelete }).then((result) => {
            console.log('handleDeleteRecord = ', result);
            if (result == 'success') {
                this.showNotifications('', 'Record deleted successfully', 'success');
                this.capabilityRecordId = undefined;
                this.capabilityTableData = undefined;
                let ref = this;
                setTimeout(() => {
                    ref.getCapabilityTableRecords();
                }, 400);
            }
        }).catch((err) => {
            console.log('Error in handleDeleteRecord = ', err);
        });
    }

    // This Method Is Used To Get FIV-C RecordTypeId For Capability Object
    handleGetFIVCRecordType() {
        getRecordTypeId({
            sObjectName: 'Capability__c',
            recordTypeName: 'FIV-C Capability'
        }).then((result) => {
            console.log('handleGetFIVCRecordType = ', result);
            this.fivCRecordType = result
        }).catch((err) => {
            console.log('Error in handleGetFIVCRecordType = ', err);
        });
    }
}