import {LightningElement, api} from 'lwc';
import getPickListFieldData from '@salesforce/apex/CustomPicklistLWCController.getPickListFieldData';
export default class CustomPicklistLWC extends LightningElement {
    options;
    error;
    fieldLabel;
    @api objectName;
    @api fieldName;
    @api isMultiSelect;
    @api recordId;
    @api isRequired;
    @api selectedValue;
    @api selectedValuesMulti = [];
    @api isDisabled = false;

    connectedCallback() {
        console.log('===>',this.isRequired);
        getPickListFieldData({recordId: this.recordId, objApiName: this.objectName, fieldName: this.fieldName})
            .then(data => {
                let noneValue = [{label: "--None--", value: ""}];
                //Required picklist
                if (this.isRequired & !this.isMultiSelect) {
                    this.options = data.picklistValues;
                    this.selectedValue = (this.selectedValue !== null || this.selectedValue !== undefined || this.selectedValue !== '') ? this.selectedValue : data.defaultValue;
                    this.fieldLabel = data.fieldLabel;
                    this.error = undefined;
                }
                //Picklist
                else if(!this.isMultiSelect) {
                    this.options = noneValue.concat(data.picklistValues);
                    this.selectedValue = (this.selectedValue !== null || this.selectedValue !== undefined || this.selectedValue !== '') ? this.selectedValue : data.defaultValue;
                    this.fieldLabel = data.fieldLabel;
                    this.error = undefined;
                }
                //Required Multi-select picklist
                else if(this.isRequired & this.isMultiSelect) {
                    this.options = data.picklistValues;
                    this.selectedValue = (this.selectedValue !== null || this.selectedValue !== undefined || this.selectedValue !== '') ? this.selectedValue : data.defaultValue;
                    this.selectedValuesMulti = data.defaultValue != null ? data.defaultValue.split(";") : [];
                    this.fieldLabel = data.fieldLabel;
                    this.error = undefined;
                }
                //Multi-select picklist
                else if(this.isMultiSelect) {
                    this.options = data.picklistValues;
                    this.selectedValue = (this.selectedValue !== null || this.selectedValue !== undefined || this.selectedValue !== '') ? this.selectedValue : data.defaultValue;
                    this.selectedValuesMulti = data.defaultValue != null ? data.defaultValue.split(";") : [];
                    this.fieldLabel = data.fieldLabel;
                    this.error = undefined;
                }
            })
            .catch(error => {
                this.error = error;
                this.options = undefined;
                console.log('::PICKLIST LWC ERROR::' + JSON.stringify(error));
            });
    }

    selectionChangeHandler(event) {
        if(!this.isMultiSelect) {
            this.selectedValue = event.target.value;
        } else {
            this.selectedValuesMulti = event.target.value;
            this.selectedValue = event.target.value.join(";");
        }
    }

    @api validate() {
        const allValid = [...this.template.querySelectorAll('.inp')]
            .reduce((validSoFar, inputCmp) => {
                        inputCmp.reportValidity();
                        return validSoFar && inputCmp.checkValidity();
            }, true);
        return allValid;
    }
}