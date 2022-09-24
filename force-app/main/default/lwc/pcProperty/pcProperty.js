import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getRecordTypeId from '@salesforce/apex/fsPcAcController.getRecordTypeId';
import getACCollateralTabRecords from '@salesforce/apex/fsPcAcController.getACCollateralTabRecords';
import { getRecord, updateRecord } from "lightning/uiRecordApi";
import ID_FIELD from '@salesforce/schema/Property__c.Id';
import BUILDING_AGE from '@salesforce/schema/Property__c.Building_Age__c';
import BUILDING_TYPE from '@salesforce/schema/Property__c.Building_Type__c';
import BUILDING_C_REMARK from '@salesforce/schema/Property__c.Building_Constructed_with_Remarks__c';
import BUILDING_FLOOR from '@salesforce/schema/Property__c.Building_Floor__c';
import BUILDING_AREA from '@salesforce/schema/Property__c.Building_Area_Sq_Ft__c';
import BUILDING_VALUE from '@salesforce/schema/Property__c.Building_Value_per_Sq_ft__c';


const Property_FIELDS = [
    'Property__c.Building_Area_Sq_Ft__c',
    'Property__c.Building_Value_per_Sq_ft__c',
    'Property__c.Land_Area_Sq_Ft__c',
    'Property__c.Valuation_Market_Value_Per_SqFt__c',
    'Property__c.Month__c',
    'Property__c.Title_Deed_Year__c',
    'Property__c.Living_property_Distance_from_Branch__c',
    'Property__c.Mortgage_property_distance_from_branch__c',
    'Property__c.Mortgage_property_Living_property_are__c',
    'Property__c.Person_residing_at_Mortgage_property__c',
    'Property__c.Is_living_property_is_own_property__c',
    'Property__c.Living_property_Pincode__c',
    'Property__c.Pathway_Available__c',
    'Property__c.Boundaries_As_Per_Inspection_Are_Same__c'
]

export default class PcProperty extends LightningElement {

    @api objName;
    @api sectiontitle;
    @api propertyRecordId;
    @api isGeneralDetails;
    @api isLandAreaAndValuation;
    @api isBuildingAreaAndValuation;
    @api applicationId;
    @api loginId;
    @api parentPropertyId;
    @api recordId;
    @api relationshipId;
    @api typeofProperty;
    @track deedMonth;
    @track deedYear;
    @track distanceFromBranch;
    @track pathValue;
    @track showThis = false;
    @track showpathRemarks = false;
    @track showBoundaries = false;
    @track mortgageRemarks;
    @track finalLandValue;
    @track buildingValue;
    @track propertyRecordTypeId;
    @track pchasBuildingValue = false;
    @track pchasLandValue = false;
    @track propertyaccheck;
    @track landareaaccheck;
    @track buildingareaaccheck;
    @track isCollateralData = false;
    @track collateralTable = [];
    @track showCollateralForm = false;
    @track isAc = false;
    @track pcLandArea;
    @track pcLandValue;
    @track pcbuildingArea;
    @track pcbuildingValue;
    @track disabledAll = false;

    //track variables
    @api fivCAutoPopFields = {
        'mortgage_property_distance': '', 'mortagage_and_living_property': '', 'person_at_mortgage': '', 'living_property_distance': '',
        'living_pincode': '', 'is_living_is_own': ''
    };
    @track fivCAutoPopFieldsInternal = {
        'mortgage_property_distance': '', 'mortagage_and_living_property': '', 'person_at_mortgage': '', 'living_property_distance': '',
        'living_pincode': '', 'is_living_is_own': ''
    };
    @api landValues = { Land_Area: undefined, Market_Value: undefined };

    @api buildingValues = { Building_Area: undefined, Building_Value: undefined };

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
        }
    ];


    @wire(getRecord, { recordId: '$recordId', fields: Property_FIELDS })
    property({ error, data }) {
        if (data) {
            console.log('Data >>>', data);
            console.log('land values ', this.landValues);
            console.log('in if ', data.fields.Building_Area_Sq_Ft__c.value);
            this.pcbuildingArea = data.fields.Building_Area_Sq_Ft__c.value;
            this.pcbuildingValue = data.fields.Building_Value_per_Sq_ft__c.value;
            this.pcLandArea = data.fields.Land_Area_Sq_Ft__c.value;
            this.pcLandValue = data.fields.Valuation_Market_Value_Per_SqFt__c.value;
            console.log('pc land area  ', this.pcLandArea, 'pcLandValue  ', this.pcLandValue);
            console.log('land values ', this.landValues);

            if ((this.pcLandArea != null && this.pcLandArea != undefined && this.pcLandArea != '') && (this.pcLandValue != null &&
                this.pcLandValue != undefined && this.pcLandValue != '')) {
                this.pchasLandValue = true;
                console.log('pc has values');
                let tempObj = JSON.parse(JSON.stringify(this.landValues));
                this.landValues = JSON.parse(JSON.stringify(tempObj));
                this.landValues.Land_Area = this.pcLandArea;
                this.landValues.Market_Value = this.pcLandValue;
                this.finalLandValue = this.pcLandArea * this.pcLandValue;
            }

            if ((this.pcbuildingArea != null || this.pcbuildingArea != undefined || this.pcbuildingArea != '') && (this.pcbuildingValue != null ||
                this.pcbuildingValue != undefined || this.pcbuildingValue != '')) {
                this.pchasBuildingValue = true;
                let tempObj = JSON.parse(JSON.stringify(this.buildingValues));
                this.buildingValues = JSON.parse(JSON.stringify(tempObj));
                this.buildingValues.Building_Area = this.pcbuildingArea;
                this.buildingValues.Building_Value = this.pcbuildingValue;
                this.buildingValue = this.pcbuildingArea * this.pcbuildingValue;
                console.log('in building if');
            }


            console.log('data.fields.Month__c>>>>', data.fields.Month__c);
            console.log('mortgage distance ', data.fields.Mortgage_property_distance_from_branch__c.value);
            if (data.fields.Month__c.value != undefined && data.fields.Month__c.value != null)
                this.deedMonth = data.fields.Month__c.value;
            else
                this.deedMonth = null;
            if (data.fields.Title_Deed_Year__c.value != undefined && data.fields.Title_Deed_Year__c.value != null)
                this.deedYear = data.fields.Title_Deed_Year__c.value;
            else
                this.deedYear = null;
            if (data.fields.Living_property_Distance_from_Branch__c.value != undefined && data.fields.Living_property_Distance_from_Branch__c.value != null)
                this.distanceFromBranch = data.fields.Living_property_Distance_from_Branch__c.value;
            else
                this.distanceFromBranch = this.fivCAutoPopFields.living_property_distance;
            if (data.fields.Mortgage_property_distance_from_branch__c.value != undefined && data.fields.Mortgage_property_distance_from_branch__c.value != null)
                this.fivCAutoPopFieldsInternal.mortgage_property_distance = data.fields.Mortgage_property_distance_from_branch__c.value;
            else
                this.fivCAutoPopFieldsInternal.mortgage_property_distance = this.fivCAutoPopFields.mortgage_property_distance;

            if (data.fields.Mortgage_property_Living_property_are__c.value != undefined && data.fields.Mortgage_property_Living_property_are__c.value != null)
                this.fivCAutoPopFieldsInternal.mortagage_and_living_property = data.fields.Mortgage_property_Living_property_are__c.value;
            else
                this.fivCAutoPopFieldsInternal.mortagage_and_living_property = this.fivCAutoPopFields.mortagage_and_living_property

            if (data.fields.Person_residing_at_Mortgage_property__c.value != undefined && data.fields.Person_residing_at_Mortgage_property__c.value != null)
                this.fivCAutoPopFieldsInternal.person_at_mortgage = data.fields.Person_residing_at_Mortgage_property__c.value;
            else
                this.fivCAutoPopFieldsInternal.person_at_mortgage = this.fivCAutoPopFields.person_at_mortgage;

            if (data.fields.Is_living_property_is_own_property__c.value != undefined && data.fields.Is_living_property_is_own_property__c.value != null)
                this.fivCAutoPopFieldsInternal.is_living_is_own = data.fields.Is_living_property_is_own_property__c.value;
            else
                this.fivCAutoPopFieldsInternal.is_living_is_own = this.fivCAutoPopFields.is_living_is_own;

            if (data.fields.Living_property_Pincode__c.value != undefined && data.fields.Living_property_Pincode__c.value != null)
                this.fivCAutoPopFieldsInternal.living_pincode = data.fields.Living_property_Pincode__c.value;
            else
                this.fivCAutoPopFieldsInternal.living_pincode = this.fivCAutoPopFields.living_pincode;

            if (data.fields.Mortgage_property_Living_property_are__c.value != undefined && data.fields.Mortgage_property_Living_property_are__c.value != null) {
                if (data.fields.Mortgage_property_Living_property_are__c.value == 'No')
                    this.showThis = true;
                else
                    this.showThis = false;
            }
            if (data.fields.Pathway_Available__c.value != undefined && data.fields.Pathway_Available__c.value != null &&
                data.fields.Pathway_Available__c.value != '') {
                if (data.fields.Pathway_Available__c.value == 'No')
                    this.showpathRemarks = true;
                else
                    this.showpathRemarks = false;
            }
            if (data.fields.Boundaries_As_Per_Inspection_Are_Same__c.value != undefined && data.fields.Boundaries_As_Per_Inspection_Are_Same__c.value != null &&
                data.fields.Boundaries_As_Per_Inspection_Are_Same__c.value != '') {
                if (data.fields.Boundaries_As_Per_Inspection_Are_Same__c.value == 'No')
                    this.showBoundaries = true;
                else
                    this.showBoundaries = false;
            }

        } else if (error) {
            console.log('ERR IN WIRE Record Property');
        }
    }





    connectedCallback() {
        console.log('section>>>>>> ', this.sectiontitle);
        console.log('autopop_fields', JSON.stringify(this.fivCAutoPopFields));
        console.log('recordId>>>>>> ', this.recordId);
        console.log('parentPropertyId>>>>>> ', this.parentPropertyId);
        console.log('///////////////// Property Componenet////////////');
        console.log(this.applicationId);
        console.log(this.loginId);
        console.log('deed year', this.deedYear, 'deed Month', this.deedMonth);
        this.getpropertyRecordTypeId();

        if (this.fivCAutoPopFields.mortagage_and_living_property == 'No')
            this.showThis = true;
        else
            this.showThis = false;
        if (this.isLandAreaAndValuation) {
            if (!this.pchasLandValue) {
                if (this.landValues.Land_Area != undefined && this.landValues.Market_Value != undefined)
                    this.finalLandValue = this.landValues.Land_Area * this.landValues.Market_Value;
            }
        }
        else if (this.isBuildingAreaAndValuation && this.sectiontitle == 'PC') {
                this.updateBuildingValues(this.recordId);
            if (this.typeofProperty == 'Vacant Land') {
            
                this.disabledAll = true;
            }
            else
                this.disabledAll = false;
            if (!this.pchasBuildingValue) {
                if (this.buildingValues.Building_Area != undefined && this.buildingValues.Building_Value != undefined) {
                    this.buildingValue = this.buildingValues.Building_Area * this.buildingValues.Building_Value;
                }
            }
        }
        if (this.sectiontitle == 'AC') {
            this.isAc = true;
            this.getAllCollateralRecords();
        }
        else {
            this.showCollateralForm = true;
        }

    }
    renderedCallback() {
        console.log('section>>>>>> ', this.sectiontitle);
        console.log('autopop_fields', JSON.stringify(this.fivCAutoPopFields));
        console.log('recordId>>>>>> ', this.recordId);
        console.log('parentPropertyId>>>>>> ', this.parentPropertyId);
        console.log('applicationId>>>>>> ', this.applicationId);
        console.log('loginId>>>>>> ', this.loginId);
        console.log('lanValues in pc Property >>>>>> ', this.landValues);
        console.log('PC Has Land Values >>>>>> ', this.pchasLandValue);
        console.log('building values in child>>>>', this.buildingValues);
        console.log('in rendred pc building area', this.pcbuildingArea);
        console.log('in rendred pc building Value', this.pcbuildingValue);
        console.log('relationship id in child', this.relationshipId);
        console.log('deed year', this.deedYear, 'deed Month', this.deedMonth);
        console.log('Type of Property in rendered', this.typeofProperty);
        if (this.isBuildingAreaAndValuation && this.sectiontitle == 'PC') {
            if (this.typeofProperty == 'Vacant Land')
                this.disabledAll = true;
            else
                this.disabledAll = false;
        }
    }

    getAllCollateralRecords() {
        this.isCollateralData = false;
        this.collateralTable = [];
        getACCollateralTabRecords({ appId: this.applicationId }).then(result => {
            if (result) {
                this.collateralTable = result;
                this.isCollateralData = true;
            }
        })
            .catch(error => {
                console.log(error);
            })
    }

    handleSelectedPropertyRow(event) {
        var data = event.detail;
        this.recordId = data.recordData.Id;
        console.log('TYpe Of Property', data.recordData.Type_Of_Property__c);

        if (data && data.ActionName == 'edit') {
            console.log('data.recordData ', data.recordData);
            console.log('Id ', this.recordId);
            console.log('this.isBuildingAreaAndValuation ', this.isBuildingAreaAndValuation);
                if (this.isBuildingAreaAndValuation) {
                    console.log('Vacant Ac Property');
                    if (data.recordData.Type_Of_Property__c == 'Vacant Land') {
                        this.updateBuildingValues(this.recordId);
                          console.log('disabled all',this.disabledAll);   
                        this.disabledAll = true;
                    }
                    else
                        this.disabledAll = false;
                } 
            console.log('disabled all',this.disabledAll);           
            this.showCollateralForm = true;
        }
    }




    handlepropertySubmit(event) {
        console.log('property submit called', this.recordId);
        let allValid = this.handleCheckValidity();
        console.log('all valid', allValid, 'isgeneral details', this.isGeneralDetails);
        if (this.isGeneralDetails && !allValid) {
            event.preventDefault();
        }
        if (this.sectiontitle == 'AC' && this.isGeneralDetails) {
            this.propertyaccheck = true;
        }
        if (this.sectiontitle == 'AC' && this.isBuildingAreaAndValuation) {
            this.buildingareaaccheck = true;
        }
        if (this.sectiontitle == 'AC' && this.isLandAreaAndValuation) {
            this.landareaaccheck = true;
        }

    }




    handlepropertySuccess(event) {
        console.log('success property called', event.detail.id);
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                variant: 'success',
                message: 'Record Updated Successfully',
            })
        );

        if (this.isBuildingAreaAndValuation) {
            const selectEvent = new CustomEvent('changetotalvalue', {
                detail: true
            });
            this.dispatchEvent(selectEvent);
        }
        if (this.sectiontitle == 'PC' || this.sectiontitle == 'AC') {
            const checkEvent = new CustomEvent('checkpropertyvalidation', { detail: true });
            this.dispatchEvent(checkEvent);
        }
        if (this.isAc) {
            this.showCollateralForm = false;
            this.getAllCollateralRecords();
        }

    }


    handleerror(event) {
        console.log('errro>>>>>> ', JSON.stringify(event.detail));
    }

    handleFormValidation(evt) {

        console.log('chnage field>>>> ', evt.target.fieldName);
        console.log('changed value>>>>>> ', evt.target.value);
        if (this.isGeneralDetails) {
            if (evt.target.name == 'Month__c') {
                this.deedMonth = evt.target.value;
            }
            else if (evt.target.fieldName == 'Mortgage_property_Living_property_are__c') {
                if (evt.target.value == 'No')
                    this.showThis = true;
                else
                    this.showThis = false;
            }
            else if (evt.target.name == 'Title_Deed_Year__c') {
                this.deedYear = evt.target.value;
            } else if (evt.target.name == 'Living_property_Distance_from_Branch__c') {
                this.distanceFromBranch = evt.target.value;
            }
        }
        else if (this.isLandAreaAndValuation) {
            let land_value = this.landValues.Land_Area;
            let market_value = this.landValues.Market_Value;
            if (evt.target.fieldName == 'Pathway_Available__c') {
                if (evt.target.value == 'No')
                    this.showpathRemarks = true;
                else
                    this.showpathRemarks = false;
            }
            else if (evt.target.fieldName == 'Boundaries_As_Per_Inspection_Are_Same__c') {
                if (evt.target.value == 'No')
                    this.showBoundaries = true;
                else
                    this.showBoundaries = false;
            }
            else if (evt.target.fieldName == 'Mortgage_Property_Area__c') {
                if (evt.target.value == 'Negative')
                    this.mortgageRemarks = true;
                else
                    this.mortgageRemarks = false;
            }
            else if (evt.target.fieldName == 'Land_Area_Sq_Ft__c') {
                land_value = this.template.querySelector('[data-id="land_Area"]').value !== undefined ? this.template.querySelector('[data-id="land_Area"]').value : 0;

            }
            else if (evt.target.fieldName == 'Valuation_Market_Value_Per_SqFt__c') {
                market_value = this.template.querySelector('[data-id="market_Value"]').value !== undefined ? this.template.querySelector('[data-id="market_Value"]').value : 0;

                console.log('market_value>>> ', market_value);
            }

            this.finalLandValue = land_value * market_value;
            console.log(' this.finalLandValue>>> ', this.finalLandValue);

        }
        else if (this.isBuildingAreaAndValuation) {
            let buildingarea = this.buildingValues.Building_Area;
            let buildingvalue = this.buildingValues.Building_Value;
            if (evt.target.fieldName == 'Building_Area_Sq_Ft__c') {
                buildingarea = this.template.querySelector('[data-id="building-area"]').value !== undefined ? this.template.querySelector('[data-id="building-area"]').value : 0;

            }
            else if (evt.target.fieldName == 'Building_Value_per_Sq_ft__c') {
                buildingvalue = this.template.querySelector('[data-id="building-value"]').value !== undefined ? this.template.querySelector('[data-id="building-value"]').value : 0;
            }
            this.buildingValue = buildingarea * buildingvalue;

        }
    }



    // get the Property recordTypeId
    getpropertyRecordTypeId() {
        let rcType;
        if (this.sectiontitle == 'PC')
            rcType = 'PC Property Detail';
        else if (this.sectiontitle == 'AC')
            rcType = 'AC Property Detail';

        getRecordTypeId({ objName: 'Property__c', recordTypeName: rcType })
            .then(res => {
                if (res)
                    this.propertyRecordTypeId = res;
                console.log('Property record type id >>>> ', JSON.stringify(res));
            })
            .catch(err => {
                console.log('errr occured in getting record type id for property', err);
            })
    }


    handleCheckValidity() {
        const allValid1 = [
            ...this.template.querySelectorAll('lightning-input'),
        ].reduce((validSoFar, inputCmp) => {
            inputCmp.reportValidity();
            return validSoFar && inputCmp.checkValidity();
        }, true);
        return allValid1;
    }


    handleCancel() {
        this.showCollateralForm = false;
    }

    // update Building Values when property type is changed to Vacant Land
    updateBuildingValues(recordId) {
        if (recordId) {
            const fields = {};
            fields[ID_FIELD.fieldApiName] = recordId;
            fields[BUILDING_AGE.fieldApiName] = null;
            fields[BUILDING_TYPE.fieldApiName] = null;
            fields[BUILDING_C_REMARK.fieldApiName] = null;
            fields[BUILDING_FLOOR.fieldApiName] = null;
            fields[BUILDING_AREA.fieldApiName] = null;
            fields[BUILDING_VALUE.fieldApiName] = null;
            const recordInput = { fields };
            console.log('recordInput= ', recordInput);
            updateRecord(recordInput).then(() => {
                console.log('UPDATE DONE');
                this.buildingValues.Building_Area = undefined;
                this.buildingValues.Building_Value = undefined;
            }).catch(error => {
                console.log('Error in Bulding Update = ', error);
            });
        }
    }
}