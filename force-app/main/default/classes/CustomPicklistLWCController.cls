public with sharing class CustomPicklistLWCController {
   
    
    @AuraEnabled(cacheable = true)
    public static FieldWrapper getPickListFieldData(String recordId, String objApiName, String fieldName) {
        FieldWrapper fieldWrap = new FieldWrapper();

        //Get all values for the specified picklist field
        Schema.SObjectType objType = Schema.getGlobalDescribe().get(objApiName);
        if (objType == null) {
            return fieldWrap;
        }
        Schema.DescribeSObjectResult sobjectDescribe = objType.getDescribe();
        Map<String, Schema.SObjectField> fieldMap = sobjectDescribe.fields.getMap();
        if (fieldMap.get(fieldName) == null) {
            return fieldWrap;
        }
        List<Schema.PicklistEntry> pickListValues = fieldMap.get(fieldName).getDescribe().getPickListValues();
        for (Schema.PicklistEntry f: pickListValues) {
            Map<String, String> values = new Map<String, String> {
                'label' => f.getLabel(),
                'value' => f.getValue()
            };
            fieldWrap.picklistValues.add(values);
            if(String.isNotEmpty(fieldWrap.defaultValue)){
                fieldWrap.defaultValue = f.getValue();
            }
        }

        //Get the label of specified picklist field
        fieldWrap.fieldLabel = fieldMap.get(fieldName).getDescribe().getLabel();
        //Get the value of specified picklist field for the specified record and set as default
        /*String objectName = String.escapeSingleQuotes(objApiName);
        String fieldAPI = String.escapeSingleQuotes(fieldName);
        String recId = String.escapeSingleQuotes(recordId);
        if (recId == null) {
            return fieldWrap;
        }
        String query = 'SELECT '+ fieldAPI + ' FROM '+ objectName + ' WHERE ID =:recId LIMIT 1';
        SObject obj = Database.query(String.escapeSingleQuotes(query));
        fieldWrap.defaultValue = (String)obj.get(fieldName);
        */
        return fieldWrap;
    }
    
    public class FieldWrapper {
        @AuraEnabled
        public List<Map<String, String>> picklistValues {get; set;}
        @AuraEnabled
        public String fieldLabel {get; set;}
        @AuraEnabled
        public String defaultValue {get; set;}
        
        public FieldWrapper() {
            picklistValues = new List<Map<String, String>>();
        }
    }
}