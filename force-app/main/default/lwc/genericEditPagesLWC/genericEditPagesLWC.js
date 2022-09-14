import { LightningElement, api, track } from 'lwc';
export default class GenericEditPagesLWC extends LightningElement {
    @api fieldsContent = {};
    @track objects = new Set();
    @track dataToSend = {};
    @track dataToDisplay = [];

    /*
    get dataToDisplay(){
        return this.fieldsContent;
    }
    */


    @api refreshData(refreshData) {
        this.dataToDisplay = undefined;
        this.dataToDisplay = JSON.parse(refreshData);
    }

    connectedCallback() {
        //this.dataToDisplay = JSON.parse(this.fieldsContent); 

        var _tempVar = JSON.parse(this.fieldsContent);
        for (var i = 0; i < _tempVar[0].fieldsContent.length; i++) {
            this.objects.add(_tempVar[0].fieldsContent[i].objectAPIName);
        }
        this.dataToDisplay = _tempVar;

    }

    handleOnChange(event) {
        try {
            //var finalData = {'Id':this.recordId};
            var currentData = {};
            if (event.target.dataset.datatype === 'picklist' || event.target.dataset.datatype === 'multipicklist') {
                //finalData[event.target.dataset.objectname+'-'+event.target.name] = event.target.selectedValue;
                //Creating Current Data
                currentData['CurrentFieldAPIName'] = event.target.dataset.objectname + '-' + event.target.name;
                currentData['CurrentFieldValue'] = event.target.selectedValue;
            } else if (event.target.dataset.datatype === 'checkbox') {
                //finalData[event.target.dataset.objectname+'-'+event.target.name] = event.target.checked;
                //Creating Current Data
                currentData['CurrentFieldAPIName'] = event.target.dataset.objectname + '-' + event.target.name;
                currentData['CurrentFieldValue'] = event.target.checked;
            } else if (event.target.dataset.datatype === 'lookup' || event.target.dataset.datatype === 'reference') {
                currentData['CurrentFieldAPIName'] = event.target.dataset.objectname + '-' + event.target.name;
                currentData['CurrentFieldValue'] = event.detail;
            }

            else if ((event.target.dataset.datatype === 'lookup' || event.target.dataset.datatype === 'reference') && event.detail) {
                currentData['CurrentFieldAPIName'] = event.target.dataset.objectname + '-' + event.target.name;
                currentData['CurrentFieldValue'] = '';
            }

            else {
                //finalData[event.target.dataset.objectname+'-'+event.target.name] = event.target.value;
                //Creating Current Data
                currentData['CurrentFieldAPIName'] = event.target.dataset.objectname + '-' + event.target.name;
                currentData['CurrentFieldValue'] = event.target.value;
            }

            //Making data to send on event
            var eventData = {};
            Object.assign(eventData, currentData);
            var previousData = { 'previousData': this.arrangePreviousData() };
            Object.assign(eventData, previousData);

            Object.assign(this.dataToSend, this.arrangePreviousData());

            //Creating Event        
            const selectedEvent = new CustomEvent('changed', { detail: eventData });
            // Dispatches the event.
            this.dispatchEvent(selectedEvent);



        } catch (error) {
            console.log(error);
        }

    }


    @api handleOnSave() {
        console.log('saved called ####');
        console.log(this.fieldsContent);
        var dataToReturn = [];
        var arr = this.dataToSend;
        var isValidData = this.handleEditValidation();
        var isValidPicklist = this.handleCustomPickListValidation();
        var isValidLookup = this.handleCustomLookupValidation();
        var isValidTextArea = this.handleTextAreaValidation();
        console.log('isValidData :: ', isValidData)
        console.log('isValidPicklist :: ', isValidPicklist)
        console.log('isValidLookup :: ', isValidLookup)
        if (isValidData && isValidPicklist && isValidLookup && isValidTextArea) {
            console.log('#####');
            console.log(this.objects);
            console.log('#####');
            this.objects.forEach(function (value) {
                console.log('##### value ');
                console.log(value);
                console.log('##### value ');
                var addObjectNameInData = { 'sobjectType': value };
                console.log('##### arr ');
                console.log(arr);
                console.log('##### arr ');
                for (var key in arr) {
                    var splitedKey = key.split('-');
                    if (splitedKey[0] === value) {
                        addObjectNameInData[splitedKey[1]] = arr[key];
                    }
                }
                dataToReturn.push(addObjectNameInData);
            });
            console.log('#####');
            console.log(dataToReturn);
            console.log('#####');
            return dataToReturn;
        }
        return dataToReturn;
        /**********WORKING CODE
        var dataToReturn = [];
        var arr = this.dataToSend;
        this.objects.forEach (function(value) {
            var addObjectNameInData = {'sobjectType': value};
            for(var key in arr){                
                var splitedKey = key.split('-');
                if(splitedKey[0] === value){
                    addObjectNameInData[splitedKey[1]] = arr[key];
                }            
            }
            dataToReturn.push(addObjectNameInData);
        })
        return dataToReturn;
        **********/
    }
    //handle for scenerio when user directly try to ssave record without any edit / saving autopopulate fields
    //Karan Singh : 02/09/2022
    @api
    handleOnSaveWithoutOnChange() {
        try {
            console.log('hello');
            var jsonObj = this.iterateJsonData();
            console.log('hello 2 ' + jsonObj);
            var eventData = {};
            Object.assign(eventData, jsonObj);
            var previousData = { 'previousData': this.arrangePreviousData() };
            Object.assign(eventData, previousData);

            Object.assign(this.dataToSend, this.arrangePreviousData());
        } catch (error) {
            console.log('error - ' + error.message);
        }
        return this.handleOnSave();
    }
    //Karan Singh : 02/09/2022 : for iterating and creating JSON object
    iterateJsonData() {
        var _tempVar = this.dataToDisplay;
        var jsonObj = {};
        for (var i = 0; i < _tempVar[0].fieldsContent.length; i++) {

            console.log(_tempVar[0].fieldsContent[i].fieldAPIName + '  ' + _tempVar[0].fieldsContent[i].value);
            jsonObj[_tempVar[0].fieldsContent[i].fieldAPIName] = _tempVar[0].fieldsContent[i].value;

        }
        console.log('jsonObj - ' + jsonObj);
        return jsonObj;
    }

    handleCustomPickListValidation() {
        var picklistValid = this.template.querySelectorAll('c-custom-picklist-l-w-c');
        var allValidPicklist = [];
        picklistValid.forEach(function (element) {
            var validPicklist = element.validate();
            allValidPicklist.push(validPicklist);
        });
        return !allValidPicklist.includes(false);
    }

    handleCustomLookupValidation() {
        var lookupValid = this.template.querySelectorAll('c-generic-custom-lookup-l-w-c');
        var allValidLookup = [];
        lookupValid.forEach(function (element) {
            var validLookup = element.validate();
            allValidLookup.push(validLookup.isValid);
        });
        return !allValidLookup.includes(false);
    }

    handleEditValidation() {
        let isValid = true;
        let inputFields = this.template.querySelectorAll('lightning-input');
        inputFields.forEach(inputField => {
            if (!inputField.checkValidity()) {
                inputField.reportValidity();
                isValid = false;
            }
        });
        return isValid;
    }

    handleTextAreaValidation() {
        let isValid = true;
        let inputFields = this.template.querySelectorAll('lightning-textarea');
        inputFields.forEach(inputField => {
            if (!inputField.checkValidity()) {
                inputField.reportValidity();
                isValid = false;
            }
        });
        return isValid;
    }

    arrangePreviousData() {
        var dataToReturn = {};
        //Getting Textarea Data
        this.template.querySelectorAll('lightning-textarea').forEach(element => {
            dataToReturn[element.dataset.objectname + '-' + element.name] = element.value;
        });

        //Getting picklist Data
        this.template.querySelectorAll('c-custom-picklist-l-w-c').forEach(element => {
            dataToReturn[element.dataset.objectname + '-' + element.name] = element.selectedValue;
        });
        //Getting Input Data
        this.template.querySelectorAll('lightning-input').forEach(element => {
            if (element.dataset.datatype === 'checkbox') {
                dataToReturn[element.dataset.objectname + '-' + element.name] = element.checked;
            } else {
                dataToReturn[element.dataset.objectname + '-' + element.name] = element.value;
            }
        });
        //Getting Lookup Data
        this.template.querySelectorAll('c-generic-custom-lookup-l-w-c').forEach(element => {
            dataToReturn[element.dataset.objectname + '-' + element.name] = element.selectedRecordId;
        });
        return dataToReturn;
    }

    isValueNullOrBlank(value) {
        if (value !== null && value !== undefined && value.trim().length > 0) {
            return false;
        } else {
            return true;
        }
    }
}