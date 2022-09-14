/*
* ──────────────────────────────────────────────────────────────────────────────────────────────────
* @author           Kuldeep Sahu  
* @modifiedBy       Kuldeep Sahu   
* @created          2022-05-02
* @modified         2022-07-21
* @Description      This component is build to handle all the operations related to 
                    Collateral Tab In Verification-C in FiveStar.              
* ──────────────────────────────────────────────────────────────────────────────────────────────────
*/
import { LightningElement, api, track } from 'lwc';
import getCollateralTabRecords from '@salesforce/apex/FIV_C_Controller.getCollateralTabRecords';
import getCollateralEnquiryRecords from '@salesforce/apex/FIV_C_Controller.getCollateralEnquiryRecords';
import getFIV_CRecordTypeId from '@salesforce/apex/FIV_C_Controller.getFIV_CRecordTypeId';
import getEnquiryMap from '@salesforce/apex/FIV_C_Controller.getEnquiryMap';
import deleteRecord from '@salesforce/apex/Utility.deleteRecord';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { updateRecord } from 'lightning/uiRecordApi';
import ID_FIELD from '@salesforce/schema/Property__c.Id';
import BUILDING_AGE from '@salesforce/schema/Property__c.Building_Age__c';
import BUILDING_TYPE from '@salesforce/schema/Property__c.Building_Type__c';
import BUILDING_C_REMARK from '@salesforce/schema/Property__c.Building_Constructed_with_Remarks__c';
import BUILDING_FLOOR from '@salesforce/schema/Property__c.Floor__c';
import BUILDING_LENGTH from '@salesforce/schema/Property__c.LengthSq_ft__c';
import BUILDING_WIDTH from '@salesforce/schema/Property__c.WidthSq_ft__c';
import BUILDING_VALUE_SQ_FT from '@salesforce/schema/Property__c.Value_per_sq_ft__c';
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
export default class FivcCollateralLWC extends LightningElement {
    @api applicationId;
    @api verificationId;
    @api loginId;

    @track rowAction = rowAction;

    @track propertyIdFIVC;
    @track recordTypeId;
    @track propertyData;

    @track enquiryMap;
    @track enquiryData;
    @track enquiryId;
    @track highestMarketValue;

    @track isGeneralDetail = false;
    @track isLandarea = false;
    @track isDocBoundries = false;
    @track isMeasurement = false;
    @track isEnquiry = false;
    @track isValuation = false;
    @track isBuildingArea = false;

    @track totalArea;
    @track totalValue;
    @track landMeasurementArea;
    @track finalLandValue;
    @track pathwayVal;
    @track mortgagePropertyLivingProperty;

    @track showLoader = false;

    @track deedMonth;
    @track deedYear;
    @track distanceFromBranch;
    @track showAddProperty = false;
    @track showDeleteModal = false;
    @track collateralValidation = {
        generalDetail: false,
        landAreaVal: false,
        docBoundries: false,
        enquiry: false,
        buildingAreaVal: false,
        landMeasurement: false,
        valuation: false
    };
    @track propertyType;

    @track docNorth;
    @track docSouth;
    @track docEast;
    @track docWest;
    @track landNorth;
    @track landSouth;
    @track landEast;
    @track landWest;
    @track mortgagePropertyArea;

    @track buildingAge;
    @track floorVal;
    @track buildingLength;
    @track buildingWidth;
    @track buildingValSqFt;

    get showForm() {
        return (this.propertyIdFIVC || this.showAddProperty);
    }

    get isVacantProperty() {
        console.log('Check propertyType= ', this.propertyType)
        return this.propertyType == 'Vacant Land' ? true : false;
    }

    get showPathwayRemark() {
        return this.pathwayVal == 'No' ? true : false;
    }

    get showMortgageLivingPropertyFields() {
        return this.mortgagePropertyLivingProperty == 'No' ? true : false;
    }

    get selectedRow() {
        let rows = [];
        if (this.propertyIdFIVC) {
            rows.push(this.propertyIdFIVC);
        }
        return rows;
    }

    get landMeaRemarkRequired() {
        return this.mortgagePropertyArea == 'Negative' ? true : false;
    }

    // This Method Is Used To Get All Data At Initial Level(Loading).
    connectedCallback() {
        this.showLoader = true;
        this.handleGetFIVProperty();
        this.handleGetEnquiryMap();
        getFIV_CRecordTypeId().then((result) => {
            this.recordTypeId = result;
        }).catch((err) => {
            console.log('Error in getFIV_CRecordTypeId= ', err);
        });
    }

    // This Method Is Used To Handle Tab Activation Event.
    handleTabActivation(event) {
        this.isGeneralDetail = false;
        this.isLandarea = false;
        this.isDocBoundries = false;
        this.isEnquiry = false;
        this.isValuation = false;
        this.isBuildingArea = false;
        this.isMeasurement = false;

        if (event.target.value == 'general') {
            this.isGeneralDetail = true;
        } else if (event.target.value == 'landarea') {
            this.isLandarea = true;
        } else if (event.target.value == 'boundries') {
            this.isDocBoundries = true;
        } else if (event.target.value == 'measurement') {
            this.isMeasurement = true;
        } else if (event.target.value == 'enquiry') {
            this.isEnquiry = true;
        } else if (event.target.value == 'valuation') {
            this.isValuation = true;
        } else if (event.target.value == 'buildingarea') {
            this.isBuildingArea = true;
        }
    }

    // This Method Is Used To Handle Property Selection From Table.
    handleRadioButton(evt) {
        console.log('handleRadioButton= ', evt.detail);
        this.propertyIdFIVC = JSON.parse(JSON.stringify(evt.detail))[0].Id;
        this.handleGetEnquiryRecord();
        let row = JSON.parse(JSON.stringify(evt.detail))[0];
        this.propertyType = (row.Type_Of_Property__c ? row.Type_Of_Property__c.trim() : undefined);
        console.log('isVacant= ', this.isVacantProperty)
        this.pathwayVal = (row.Pathway_Available__c ? row.Pathway_Available__c.trim() : undefined);
        this.mortgagePropertyLivingProperty = (row.Mortgage_property_Living_property_are__c ? row.Mortgage_property_Living_property_are__c.trim() : undefined);
        this.docNorth = JSON.parse(evt.detail[0].North_By_Same_As_Document__c);
        this.docSouth = JSON.parse(evt.detail[0].South_By_Same_As_Document__c);
        this.docEast = JSON.parse(evt.detail[0].East_By_Same_As_Document__c);
        this.docWest = JSON.parse(evt.detail[0].West_By_Same_As_Document__c);
        this.landNorth = JSON.parse(evt.detail[0].North_By_Land_Same_As_Document__c);
        this.landSouth = JSON.parse(evt.detail[0].South_By_Land_Same_As_Document__c);
        this.landEast = JSON.parse(evt.detail[0].East_By_Land_Same_As_Document__c);
        this.landWest = JSON.parse(evt.detail[0].West_By_Land_Same_As_Document__c);
        this.mortgagePropertyArea = (row.Mortgage_Property_Area__c ? row.Mortgage_Property_Area__c.trim() : undefined);

        this.buildingAge = (row.Building_Age__c ? row.Building_Age__c.trim() : undefined);
        this.floorVal = (row.Floor__c ? row.Floor__c.trim() : undefined);
        this.buildingLength = (row.LengthSq_ft__c ? row.LengthSq_ft__c.trim() : undefined);
        this.buildingWidth = (row.WidthSq_ft__c ? row.WidthSq_ft__c.trim() : undefined);
        this.buildingValSqFt = (row.Value_per_sq_ft__c ? row.Value_per_sq_ft__c.trim() : undefined);

        if (this.isGeneralDetail) {
            let data = JSON.parse(JSON.stringify(evt.detail))[0];
            if (data.Month__c) {
                this.deedMonth = data.Month__c.trim();
            }
            if (data.Title_Deed_Year__c) {
                this.deedYear = data.Title_Deed_Year__c.trim();
            }
            if (data.Living_property_Distance_from_Branch__c) {
                this.distanceFromBranch = data.Living_property_Distance_from_Branch__c.trim();
            }
        }
    }

    updateBuildingValues(recordId) {
        this.showLoader = true;
        const fields = {};
        fields[ID_FIELD.fieldApiName] = recordId;
        fields[BUILDING_AGE.fieldApiName] = null;
        fields[BUILDING_TYPE.fieldApiName] = null;
        fields[BUILDING_C_REMARK.fieldApiName] = null;
        fields[BUILDING_FLOOR.fieldApiName] = null;
        fields[BUILDING_LENGTH.fieldApiName] = null;
        fields[BUILDING_WIDTH.fieldApiName] = null;
        fields[BUILDING_VALUE_SQ_FT.fieldApiName] = null;
        const recordInput = { fields };
        console.log('recordInput= ', recordInput);
        updateRecord(recordInput).then(() => {
            console.log('UPDATE DONE');
            this.showLoader = false;
            this.totalArea = undefined;
            this.buildingAge = undefined;
            this.floorVal = undefined;
            this.buildingLength = undefined;
            this.buildingWidth = undefined;
            this.buildingValSqFt = undefined;
            this.totalValue = undefined;
        }).catch(error => {
            this.showLoader = false;
            console.log('Error in Bulding Update = ', error);
        });
    }

    // This Method Is Used To Handle Enquiry Selection From Enquiry Table In Enquiry Tab.
    handleSelectedEnquiry(evt) {
        var data = evt.detail;
        if (data && data.ActionName == 'edit') {
            this.enquiryId = data.recordData.Id;
        } else if (data && data.ActionName == 'delete') {
            this.enquiryId = data.recordData.Id;
            this.showDeleteModal = true;
        }
    }

    // This Method Is Used To Handle Form Values.
    handleFormValidation(evt) {
        if (this.isGeneralDetail) {
            if (evt.target.name == 'Month__c') {
                this.deedMonth = evt.target.value;
            } else if (evt.target.name == 'Title_Deed_Year__c') {
                this.deedYear = evt.target.value;
            } else if (evt.target.name == 'Living_property_Distance_from_Branch__c') {
                this.distanceFromBranch = evt.target.value;
            } else if (evt.target.fieldName == 'Mortgage_property_Living_property_are__c') {
                this.mortgagePropertyLivingProperty = evt.target.value;
            } else if (evt.target.fieldName == 'Type_Of_Property__c') {
                this.propertyType = evt.target.value;
            }
        } else if (this.isLandarea) {
            if (evt.target.fieldName == 'Pathway_Available__c') {
                this.pathwayVal = evt.target.value;
            }
        } else if (this.isMeasurement) {
            let fieldName = evt.target.fieldName;
            let fieldVal = evt.target.value;
            if (fieldName == 'North_By_Land_Same_As_Document__c') {
                this.landNorth = fieldVal;
                if (fieldVal) {
                    this.template.querySelector('[data-id="North_By_Land_Physical__c"]').value = this.template.querySelector('[data-id="North_by_land_measurements__c"]').value;
                }
            } else if (fieldName == 'South_By_Land_Same_As_Document__c') {
                this.landSouth = fieldVal;
                if (fieldVal) {
                    this.template.querySelector('[data-id="South_By_Land_Physical__c"]').value = this.template.querySelector('[data-id="South_by_land_measurements__c"]').value;
                }
            } else if (fieldName == 'East_By_Land_Same_As_Document__c') {
                this.landEast = fieldVal;
                if (fieldVal) {
                    this.template.querySelector('[data-id="East_By_Land_Physical__c"]').value = this.template.querySelector('[data-id="East_by_land_measurements__c"]').value;
                }
            } else if (fieldName == 'West_By_Land_Same_As_Document__c') {
                this.landWest = fieldVal;
                if (fieldVal) {
                    this.template.querySelector('[data-id="West_By_Land_Physical__c"]').value = this.template.querySelector('[data-id="West_by_land_measurements__c"]').value;
                }
            } else if (fieldName == 'North_by_land_measurements__c') {
                let checkBoxValue = this.template.querySelector('[data-id="North_By_Land_Same_As_Document__c"]').value;
                if (checkBoxValue) {
                    this.template.querySelector('[data-id="North_By_Land_Physical__c"]').value = fieldVal;
                }
            } else if (fieldName == 'South_by_land_measurements__c') {
                let checkBoxValue = this.template.querySelector('[data-id="South_By_Land_Same_As_Document__c"]').value;
                if (checkBoxValue) {
                    this.template.querySelector('[data-id="South_By_Land_Physical__c"]').value = fieldVal;
                }
            } else if (fieldName == 'East_by_land_measurements__c') {
                let checkBoxValue = this.template.querySelector('[data-id="East_By_Land_Same_As_Document__c"]').value;
                if (checkBoxValue) {
                    this.template.querySelector('[data-id="East_By_Land_Physical__c"]').value = fieldVal;
                }
            } else if (fieldName == 'West_by_land_measurements__c') {
                let checkBoxValue = this.template.querySelector('[data-id="West_By_Land_Same_As_Document__c"]').value;
                if (checkBoxValue) {
                    this.template.querySelector('[data-id="West_By_Land_Physical__c"]').value = fieldVal;
                }
            } else if (fieldName == 'Mortgage_Property_Area__c') {
                this.mortgagePropertyArea = fieldVal
            }
        } else if (this.isDocBoundries) {
            let fieldName = evt.target.fieldName;
            let fieldVal = evt.target.value;
            console.log(fieldName, ' -> ', fieldVal)
            if (fieldName == 'North_By_Same_As_Document__c') {
                this.docNorth = fieldVal;
                if (fieldVal) {
                    this.template.querySelector('[data-id="North_By_Boundaries_Physical__c"]').value = this.template.querySelector('[data-id="North_by_boundaries__c"]').value;
                }
            } else if (fieldName == 'South_By_Same_As_Document__c') {
                this.docSouth = fieldVal;
                if (fieldVal) {
                    this.template.querySelector('[data-id="South_By_Boundaries_Physical__c"]').value = this.template.querySelector('[data-id="South_by_boundaries__c"]').value;
                }
            } else if (fieldName == 'East_By_Same_As_Document__c') {
                this.docEast = fieldVal;
                if (fieldVal) {
                    this.template.querySelector('[data-id="East_By_Boundaries_Physical__c"]').value = this.template.querySelector('[data-id="East_by_boundaries__c"]').value;
                }
            } else if (fieldName == 'West_By_Same_As_Document__c') {
                this.docWest = fieldVal;
                if (fieldVal) {
                    this.template.querySelector('[data-id="West_By_Boundaries_Physical__c"]').value = this.template.querySelector('[data-id="West_by_boundaries__c"]').value;
                }
            } else if (fieldName == 'North_by_boundaries__c') {
                let checkBoxValue = this.template.querySelector('[data-id="North_By_Same_As_Document__c"]').value;
                if (checkBoxValue) {
                    this.template.querySelector('[data-id="North_By_Boundaries_Physical__c"]').value = fieldVal;
                }
            } else if (fieldName == 'South_by_boundaries__c') {
                let checkBoxValue = this.template.querySelector('[data-id="South_By_Same_As_Document__c"]').value;
                if (checkBoxValue) {
                    this.template.querySelector('[data-id="South_By_Boundaries_Physical__c"]').value = fieldVal;
                }
            } else if (fieldName == 'East_by_boundaries__c') {
                let checkBoxValue = this.template.querySelector('[data-id="East_By_Same_As_Document__c"]').value;
                if (checkBoxValue) {
                    this.template.querySelector('[data-id="East_By_Boundaries_Physical__c"]').value = fieldVal;
                }
            } else if (fieldName == 'West_by_boundaries__c') {
                let checkBoxValue = this.template.querySelector('[data-id="West_By_Same_As_Document__c"]').value;
                if (checkBoxValue) {
                    this.template.querySelector('[data-id="West_By_Boundaries_Physical__c"]').value = fieldVal;
                }
            }
        }
    }

    // This Method Is Used To Handle Form Calculations.
    handleFormCalculation(evt) {
        if (evt.target.name == 'LengthSq_ft__c' || evt.target.name == 'WidthSq_ft__c' || evt.target.name == 'Value_per_sq_ft__c') {
            this.buildingLength = (evt.target.name == 'LengthSq_ft__c' ? evt.target.value : this.buildingLength);
            this.buildingWidth = (evt.target.name == 'WidthSq_ft__c' ? evt.target.value : this.buildingWidth);
            this.buildingValSqFt = (evt.target.name == 'Value_per_sq_ft__c' ? evt.target.value : this.buildingValSqFt);
            this.totalValue = this.buildingLength * this.buildingWidth * this.buildingValSqFt;
            this.totalArea = this.buildingLength * this.buildingWidth;
        } else if (evt.target.fieldName == 'Land_Measurement_Length_Sq_ft__c' || evt.target.fieldName == 'Land_Measurement_Width_Sq_ft__c') {
            let lengthSqFt = this.template.querySelector('[data-id="Land_Measurement_Length_Sq_ft__c"]').value !== undefined ? this.template.querySelector('[data-id="Land_Measurement_Length_Sq_ft__c"]').value : 0;
            let widthSqFt = this.template.querySelector('[data-id="Land_Measurement_Width_Sq_ft__c"]').value !== undefined ? this.template.querySelector('[data-id="Land_Measurement_Width_Sq_ft__c"]').value : 0;
            this.landMeasurementArea = lengthSqFt * widthSqFt;
        } else if (evt.target.fieldName == 'Adopted_Value_Per_SqFt__c') {
            let highestAdoptedValue = (this.highestMarketValue >= 0 ? (this.highestMarketValue / 100 * 80) : 0);
            let inputBox = this.template.querySelector('[data-id="Adopted_Value_Per_SqFt__c"]');
            let adoptedMarketValPerSqFt = inputBox.value !== undefined ? inputBox.value : 0;
            if (highestAdoptedValue < adoptedMarketValPerSqFt) {
                this.showNotifications('', 'Adopted Value can not be greater than 80% of Market Value', 'error');
                inputBox.reset();
                return;
            }

            let totalAreaValuation = 0;
            if (this.propertyData && this.propertyData.strDataTableData && JSON.parse(this.propertyData.strDataTableData).length) {
                JSON.parse(this.propertyData.strDataTableData).forEach(element => {
                    if (element.Id == this.propertyIdFIVC) {
                        totalAreaValuation = element.Land_Measurement_total_area__c;
                    }
                });
            }
            this.finalLandValue = totalAreaValuation * adoptedMarketValPerSqFt;
        } else if (evt.target.name == 'Building_Age__c') {
            this.buildingAge = evt.target.value;
        } else if (evt.target.name == 'Floor__c') {
            this.floorVal = evt.target.value;
            console.log('floor change= ', evt.target.value);
        }
    }

    makeAllBlank() {
        this.propertyType = undefined;
        this.pathwayVal = undefined;
        this.mortgagePropertyLivingProperty = undefined;
        this.docNorth = undefined;
        this.docSouth = undefined;
        this.docEast = undefined;
        this.docWest = undefined;
        this.landNorth = undefined;
        this.landSouth = undefined;
        this.landEast = undefined;
        this.landWest = undefined;
        this.mortgagePropertyArea = undefined;
        this.buildingAge = undefined;
        this.floorVal = undefined;
        this.buildingLength = undefined;
        this.buildingWidth = undefined;
        this.buildingValSqFt = undefined;
    }

    // This Method Is Used To Show Toast Notification.
    showNotifications(title, msg, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title: title,
            message: msg,
            variant: variant
        }));
    }

    // This Method Is Used To Check Collateral Validation.
    @api
    checkCollateralValidation() {
        console.log('Check Collateral Validation= ', this.propertyData);
        this.collateralValidation = {
            generalDetail: true,
            landAreaVal: true,
            docBoundries: true,
            enquiry: true,
            buildingAreaVal: true,
            landMeasurement: true,
            valuation: true
        };

        if ((this.propertyData && this.propertyData.strDataTableData && JSON.parse(this.propertyData.strDataTableData).length)) {
            JSON.parse(this.propertyData.strDataTableData).forEach(element => {
                if (!element.Document_Type__c) {
                    this.collateralValidation.generalDetail = false;
                    console.log('1');
                }
                else if (element.Document_Type__c && !element.Document_Type__c.trim()) {
                    this.collateralValidation.generalDetail = false;
                    console.log('1.5');
                }
                if (!element.Pathway_Available__c) {
                    this.collateralValidation.landAreaVal = false;
                    console.log('2');
                } else if (element.Pathway_Available__c && !element.Pathway_Available__c.trim()) {
                    this.collateralValidation.landAreaVal = false;
                    console.log('2.5');
                }
                if (element.Boundaries_As_Per_Inspection_Are_Same__c == null || element.Boundaries_As_Per_Inspection_Are_Same__c == undefined ||
                    element.Boundaries_As_Per_Inspection_Are_Same__c == '' || element.Boundaries_As_Per_Inspection_Are_Same__c.trim() == '') {
                    this.collateralValidation.docBoundries = false;
                    console.log('3');
                }
                if (element.Type_Of_Property__c != 'Vacant Land') {
                    if (!element.Building_Age__c) {
                        this.collateralValidation.buildingAreaVal = false;
                        console.log('4');
                    } else if (element.Building_Age__c && !element.Building_Age__c.trim()) {
                        this.collateralValidation.buildingAreaVal = false;
                        console.log('4.5');
                    }
                }
                if (element.North_by_land_measurements__c == null || element.North_by_land_measurements__c == undefined || element.North_by_land_measurements__c == '' || element.North_by_land_measurements__c.trim() == '') {
                    this.collateralValidation.landMeasurement = false;
                    console.log('5');
                }
                if (element.Valuation_Market_Value_Per_SqFt__c == null || element.Valuation_Market_Value_Per_SqFt__c == undefined || element.Valuation_Market_Value_Per_SqFt__c == '' || element.Valuation_Market_Value_Per_SqFt__c.trim() == '') {
                    this.collateralValidation.valuation = false;
                    console.log('6');
                }

                if (!(this.enquiryMap && this.enquiryMap[element.Id] && this.enquiryMap[element.Id].length >= 3)) {
                    this.collateralValidation.enquiry = false;
                    console.log('7');
                }
            });
        }

        // if (!(this.enquiryData && this.enquiryData.strDataTableData && JSON.parse(this.enquiryData.strDataTableData).length >= 3)) {

        //     this.collateralValidation.enquiry = false;
        // }

        console.log('checkCollateralValidation = ', this.collateralValidation);
        this.dispatchEvent(new CustomEvent('collateralvalidation', {
            detail: this.collateralValidation
        }));
    }

    // This Method Is Used To Handle Cancel Action On Table.
    onCancel() {
        if (this.isEnquiry) {
            this.enquiryId = undefined;
        } else {
            this.propertyIdFIVC = undefined;
            this.handleGetFIVProperty();
            this.deedMonth = undefined;
            this.deedYear = undefined;
            this.distanceFromBranch = undefined;
        }
    }

    // This Method Is Used To Check Valid Inputs On Form.
    checkInputValidity() {
        const allValid = [
            ...this.template.querySelectorAll('lightning-input'),
        ].reduce((validSoFar, inputCmp) => {
            inputCmp.reportValidity();
            return validSoFar && inputCmp.checkValidity();
        }, true);
        return allValid;
    }

    // This Method Is Used To Show Loader For Short Time.
    showTemporaryLoader() {
        this.showLoader = true;
        let ref = this;
        setTimeout(function () {
            ref.showLoader = false;
        }, 500);
    }

    // This Method Is Used To Handle Post Submit Actions.
    handleSubmit(event) {
        console.log('handleSubmit called');
        let checkValidation = this.checkInputValidity();

        if (!checkValidation) {
            event.preventDefault();
            this.showNotifications('Invalid input', 'You haven\'t entered correct data', 'error');
        } else {
            this.showTemporaryLoader();
            if (this.isGeneralDetail) {
                if (this.isVacantProperty) {
                    this.updateBuildingValues(this.propertyIdFIVC);
                }
            }
        }
    }

    // This Method Is Used To Handle Post Success Actions.
    handleSuccess(event) {
        console.log('handleSuccess called');
        this.showNotifications('','Collateral Updated Successfully.','success')
        this.propertyData = undefined;
        this.handleGetFIVProperty();
    }

    // This Method Is Used To Handle Post Enquiry Submit Actions.
    handleEnquirySubmit() {
        console.log('handleEnquirySubmit called');
    }

    // This Method Is Used To Handle Post Enquiry Success Actions.
    handleEnquirySuccess() {
        console.log('handleEnquirySuccess called');
        this.isEnquiry = false;
        this.enquiryId = undefined;
        this.handleGetEnquiryRecord();
        this.handleGetEnquiryMap();
        let ref = this;
        setTimeout(() => {
            ref.isEnquiry = true;
        }, 100);
    }

    // This Method Is Used To Handle Delete Action On Enquiry Table.
    handleDelete(event) {
        console.log('handleDelete= ', event.target.label)
        let label = event.target.label;
        this.showDeleteModal = false;
        if (label == 'Yes') {
            this.handleDeleteRecord(this.enquiryId);
        } else if (label == 'No') {
            this.enquiryId = undefined;
        }
    }

    /* --------------------All Server Methods------------------- */

    // This Method Is Used To Get Property Table Records From Server Side.
    handleGetFIVProperty() {
        this.showLoader = true;
        this.propertyData = undefined;
        getCollateralTabRecords({ appId: this.applicationId, metadataName: 'FIV_C_Property' }).then((result) => {
            console.log('handleGetFIVProperty= ', result);
            this.propertyData = JSON.parse(JSON.stringify(result));
            this.checkCollateralValidation();
            this.showLoader = false;
        }).catch((err) => {
            console.log('Error in handleGetFIVProperty= ', err);
            this.checkCollateralValidation();
            this.showLoader = false;
        });
    }

    // This Method Is Used To Get Table Records For Enquiry Tab.
    handleGetEnquiryRecord() {
        this.showLoader = true;
        this.enquiryData = undefined;
        getCollateralEnquiryRecords({ appId: this.applicationId, propertyId: this.propertyIdFIVC }).then((result) => {
            console.log('handleGetEnquiryRecord= ', result);
            this.showLoader = false;
            this.enquiryData = JSON.parse(JSON.stringify(result));;
            if (this.enquiryData && this.enquiryData.strDataTableData && JSON.parse(this.enquiryData.strDataTableData).length) {
                this.highestMarketValue = 0;
                JSON.parse(this.enquiryData.strDataTableData).forEach(currentItem => {
                    if (this.highestMarketValue < parseFloat(currentItem.Enquiry_Market_Value__c)) {
                        this.highestMarketValue = parseFloat(currentItem.Enquiry_Market_Value__c);
                    }
                });
            }
        }).catch((err) => {
            console.log('Error in handleGetEnquiryRecord= ', err);
            this.showLoader = false;
        });
    }

    // This Method Is Used TO delete Records.
    handleDeleteRecord(recordIdToDelete) {
        this.showTemporaryLoader();
        deleteRecord({ recordId: recordIdToDelete }).then((result) => {
            console.log('handleDeleteRecord = ', result);
            if (result == 'success') {
                this.showNotifications('', 'Record deleted successfully', 'success');
                let ref = this;
                setTimeout(() => {
                    ref.handleEnquirySuccess();
                }, 400);
            }
        }).catch((err) => {
            console.log('Error in handleDeleteRecord = ', err);
        });
    }

    handleGetEnquiryMap() {
        this.enquiryMap = undefined;
        getEnquiryMap({ appId: this.applicationId }).then((result) => {
            console.log('GetEnquiryMap = ', result);
            this.enquiryMap = JSON.parse(JSON.stringify(result));
            this.checkCollateralValidation();
        }).catch((err) => {
            this.checkCollateralValidation();
            console.log('Error in GetEnquiryMap = ', err)
        });
    }
}