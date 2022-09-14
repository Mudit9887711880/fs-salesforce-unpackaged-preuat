public with sharing class GenericFormBuilderHelper {
    private GenericFormBuilderHelper() {}
    @TestVisible static private Map<String,List<sObject>> customMetadataRecordsMap = new Map<String,List<sObject>>();

    /*
    * This method is use to describe fields.
    */
    public static Map<String, Schema.SObjectField> getFieldsDetail(String objAPIName){
        Schema.SObjectType objType = Schema.getGlobalDescribe().get(objAPIName);
        Schema.DescribeSObjectResult sobjectDescribe = objType.getDescribe();
        return sobjectDescribe.fields.getMap();
    }

    /*
    * This method is use to distinguish between non-lookup & lookup fields and return 2 set respectively.
    */
    public static Map<String,FieldToWorkWrapper> getFieldsToWork(List<Generic_Detail_Page_Content__mdt> detailPageMdt){
        Map<String,FieldToWorkWrapper> returnWrapper = new Map<String,FieldToWorkWrapper>();
        Map<String,List<Generic_Detail_Page_Content__mdt>> objMap = new Map<String,List<Generic_Detail_Page_Content__mdt>>();
        for (Generic_Detail_Page_Content__mdt mdt : detailPageMdt) {
            if(!objMap.containsKey(mdt.Object_API_Name__c)){
                objMap.put(mdt.Object_API_Name__c,new List<Generic_Detail_Page_Content__mdt>{mdt});
            }
            objMap.get(mdt.Object_API_Name__c).add(mdt);
        }

        for(String obj : objMap.keySet()){
            FieldToWorkWrapper FW = new FieldToWorkWrapper();
            Map<String, Schema.SObjectField> fieldMap = getFieldsDetail(obj);
            for (Generic_Detail_Page_Content__mdt mdt : objMap.get(obj)) {
                String fieldAPIName = getFieldNameForLookup(mdt.Field_API_Name__c);
                System.debug('fieldAPIName #### '+fieldAPIName);
                if (String.isNotEmpty(fieldAPIName) && fieldMap.get(fieldAPIName.toLowercase()).getDescribe().isAccessible()) {
                    if (mdt.DataType__c == 'Lookup') {
                        FW.lookupFields.add(mdt.Field_API_Name__c);
                        if (String.isNotEmpty(mdt.URL_Target_Field_API_Name__c) && fieldMap.get(mdt.URL_Target_Field_API_Name__c.toLowercase()).getDescribe().isAccessible()) {
                            FW.lookupFields.add(mdt.URL_Target_Field_API_Name__c);
                        }
                    }else{
                        FW.nonLookupFields.add(mdt.Field_API_Name__c);
                    }
                }
            }
            returnWrapper.put(obj,FW);
        }
        return returnWrapper;
    }

    /*
    * This method is use to get actual fieldname.
    */
    public static String getFieldNameForLookup(String fieldName){
        if (String.isBlank(fieldName)) {
            return '';
        }
        if (!fieldName.contains('__r')) {
            return fieldName;
        }
        return fieldName.substringBefore('__r')+'__c';
    }

    /*
    * This method is use to parse the query result.
    */
    public static Map<String, String> parseQuery(sObject record, List<String> fieldToQuery){
        Map<String, String> returnMap = new Map<String, String>();
        for (String field : fieldToQuery) {
            String val = String.valueOf(getRelationshipData(record,field.deleteWhitespace()));
            if (String.isNotBlank(val)) {
                returnMap.put(field.deleteWhitespace(),val);
            }
            else {
                returnMap.put(field.deleteWhitespace(),' ');
            }
        }
        return returnMap;
    }

    /*
    * This method is use to get data from query.
    * This method returns both relationship and non-relationship data.
    */
    public static Object getRelationshipData(SObject record, String field){
        if (record == null) {
            return null;
        }
        if (!field.contains('.')) {
            return record.get(field);
        }
        return getRelationshipData(
            record.getSObject(field.substringBefore('.')),
            field.substringAfter('.')
        );
    }

    public class FieldToWorkWrapper{        
        public Set<String> lookupFields;
        public Set<String> nonLookupFields;

        public FieldToWorkWrapper(){
            this.lookupFields = new Set<String>();
            this.nonLookupFields = new Set<String>();
        }
    }

    
}