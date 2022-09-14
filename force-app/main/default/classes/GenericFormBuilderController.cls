/*
 * CH01 : Karan Singh : 15/07/2022 : Added logic for the Generic Detail Page Content : Extra_Large_Label__c as if the if label is more than 40 character then used this variable for UI.
*/
public virtual with sharing class GenericFormBuilderController {    
    public String METADATA_NAME{get;set;}
    public String WHERE_CLAUSE{get;set;}
    public String RECORD_LIMIT{get;set;}    
    public Set<String> IDS_SET{get;set;}

    @TestVisible private static final String METADATA_QUERY = 'SELECT Id, DeveloperName, MasterLabel,Extra_Large_Label__c, Column_Width_desktop__c, Column_Width_mobile__c, Column_Width_tablet__c, DataType__c, Disabled__c, Field_API_Name__c, Field_Sequence__c, Generic_Detail_page__c, HelpText__c, Lookup_Object_API_Name__c, Max_Length__c, Min_Length__c, Object_API_Name__c, Pattern_Mismatch_Message__c, Required__c, Section_Label__c, Section_Order__c, Show_On_UI__c, URL_Target_Field_API_Name__c, Validation_Pattern__c FROM Generic_Detail_Page_Content__mdt';
    public static Map<String,List<sObject>> customMetadataRecordsMap = new Map<String,List<sObject>>();
    
    
    public InitWrapper initialize(){
        InitWrapper returnWrapper = new InitWrapper();
        String finalQuery = METADATA_QUERY + ' WHERE Generic_Detail_page__r.DeveloperName =: METADATA_NAME ORDER BY Section_Order__c, Field_Sequence__c ASC';
        List<Generic_Detail_Page_Content__mdt> pageMdt = getCustomMetadataRecords(finalQuery, METADATA_NAME);
        Map<String,GenericFormBuilderHelper.FieldToWorkWrapper> objectAndToWorkON = GenericFormBuilderHelper.getFieldsToWork(pageMdt);
        system.debug(':::objectAndToWorkON:::' + objectAndToWorkON);
        Map<String,Map<String,String>> fieldValueMap = new Map<String,Map<String,String>>();
        for(String obj : objectAndToWorkON.keySet()){
            Set<String> lookupFields = objectAndToWorkON.get(obj).lookupFields;
            Set<String> nonLookupFields = objectAndToWorkON.get(obj).nonLookupFields;
            nonLookupFields.addAll(lookupFields);
            nonLookupFields.addAll(nonLookupFields);
            if(!IDS_SET.isEmpty()){
                //UPDATE CASE
                String queryForRecData = selector(obj, new List<String>(nonLookupFields));
                SObject recData = Database.query(String.escapeSingleQuotes(queryForRecData));
                Map<String,String> fieldToValue = GenericFormBuilderHelper.parseQuery(recData, new List<String>(nonLookupFields));
                fieldValueMap.put(obj,fieldToValue);
            }            
        }
        system.debug('::::fieldValueMap::::' + fieldValueMap);
        Map<string, SectionWrapper> dataMap = new Map<string, SectionWrapper>();
        Integer UQ = 1;
        for (Generic_Detail_Page_Content__mdt mdt : pageMdt) {
            if(GenericFormBuilderHelper.getFieldsDetail(mdt.Object_API_Name__c).get(mdt.Field_API_Name__c.toLowercase()).getDescribe().isAccessible()){
                if (dataMap.containsKey(mdt.Section_Label__c)) {
                    dataMap.get(mdt.Section_Label__c).fieldsContent.add(fillContentWrapper(mdt, fieldValueMap.get(mdt.Object_API_Name__c)));
                }else {
                    SectionWrapper SW = new SectionWrapper();
                    SW.sectionLabel = String.isNotBlank( mdt.Section_Label__c) ? mdt.Section_Label__c : 'Details';
                    SW.uniqueKey = UQ;
                    sw.fieldsContent.add(fillContentWrapper(mdt, fieldValueMap.get(mdt.Object_API_Name__c)));
                    dataMap.put(mdt.Section_Label__c, SW);
                    UQ++;
                }
            }            
            returnWrapper.data = json.serialize(dataMap.values());
            //returnWrapper.queryMap = GenericDetailPageHelper.arrangeLookupQuery(recordId, lookupFields, objAPIName, 'Id =: recordId ');
            //returnWrapper.queryCount = returnWrapper.queryMap.size();
        }
        return returnWrapper;
    }
    

    public static SectionContentWrapper fillContentWrapper( Generic_Detail_Page_Content__mdt mdt, Map<String,String> fieldToValue ){
        SectionContentWrapper scw = new SectionContentWrapper();
        scw.fieldAttribute = populateFieldAttributes(mdt.Required__c, mdt.Show_On_UI__c,GenericFormBuilderHelper.getFieldNameForLookup(mdt.Field_API_Name__c), GenericFormBuilderHelper.getFieldsDetail(mdt.Object_API_Name__c));
        SCW.column_Width_Desktop = Integer.valueOf(mdt.Column_Width_desktop__c);
        SCW.column_Width_Mobile = Integer.valueOf(mdt.Column_Width_mobile__c);
        SCW.column_Width_Tablet = Integer.valueOf(mdt.Column_Width_tablet__c);
        SCW.objectAPIName = mdt.Object_API_Name__c;
        SCW.validationPattern = mdt.Validation_Pattern__c;
        SCW.validationPatternMismatched = mdt.Pattern_Mismatch_Message__c;
        SCW.maxLength = mdt.Max_Length__c;
        SCW.minLength = mdt.Min_Length__c;
        SCW.disabled = mdt.Disabled__c;
        
        if (mdt.DataType__c == 'Lookup') {
            scw.isLookup = true;
            scw.isOtherDataType = false;
            scw.label = String.isNotBlank(mdt.Extra_Large_Label__c ) ? mdt.Extra_Large_Label__c : mdt.MasterLabel; //CH01
            scw.value = fieldToValue != null && fieldToValue.containsKey(mdt.Field_API_Name__c) ? fieldToValue.get(mdt.Field_API_Name__c) : '';
            scw.lookupVal = fieldToValue != null && fieldToValue.containsKey(mdt.Field_API_Name__c) ? fieldToValue.get(mdt.Field_API_Name__c) : '';
            scw.hrefTag = URL.getSalesforceBaseUrl().toExternalForm() +'/lightning/r/';
            scw.fieldAPIName = mdt.Field_API_Name__c;
            scw.hrefValue = mdt.URL_Target_Field_API_Name__c;
        }
        else if ((mdt.DataType__c == 'CheckBox')) {
            scw.isCheckbox = true;
            scw.isOtherDataType = false;
            scw.label = String.isNotBlank(mdt.Extra_Large_Label__c ) ? mdt.Extra_Large_Label__c : mdt.MasterLabel; //CH01            
            //scw.value =  fieldToValue != null && fieldToValue.containsKey(mdt.Field_API_Name__c) && fieldToValue.get(mdt.Field_API_Name__c) == 'false' ? '' : 'true';
            if(fieldToValue != null && fieldToValue.containsKey(mdt.Field_API_Name__c)){
                if(fieldToValue.get(mdt.Field_API_Name__c) == 'false'){
                    scw.value = 'false';
                    scw.checkboxVal = false;
                }else{
                    scw.value = 'true';
                    scw.checkboxVal = true;
                }
            }else{
                scw.value = 'false';
                scw.checkboxVal = false;
            }
            

            scw.fieldAPIName = mdt.Field_API_Name__c;
            scw.fieldAttribute.allOtherField = false;
        }
        else if((mdt.DataType__c == 'date')){
            system.debug(':::mdt.MasterLabel:::' + mdt.MasterLabel);
            system.debug(':::mdt.Field_API_Name__c:::' + mdt.Field_API_Name__c);
            system.debug(':::fieldToValue:::' + fieldToValue);
            scw.label = String.isNotBlank(mdt.Extra_Large_Label__c ) ? mdt.Extra_Large_Label__c : mdt.MasterLabel; //CH01// 00:00:00
            String tempFieldToValue = fieldToValue != null && fieldToValue.containsKey(mdt.Field_API_Name__c) && String.isNotBlank(fieldToValue.get(mdt.Field_API_Name__c))  ? fieldToValue.get(mdt.Field_API_Name__c) : '';
            scw.value = tempFieldToValue.split(' ')[0];
            scw.value = (scw.value.length() == 1 && scw.value.containsWhitespace()) ? scw.value.trim() : scw.value;
            scw.fieldAPIName = mdt.Field_API_Name__c;
        }
        else {
            system.debug(':::mdt.MasterLabel:::' + mdt.MasterLabel);
            system.debug(':::mdt.Field_API_Name__c:::' + mdt.Field_API_Name__c);
            system.debug(':::fieldToValue:::' + fieldToValue);
            scw.label = String.isNotBlank(mdt.Extra_Large_Label__c ) ? mdt.Extra_Large_Label__c : mdt.MasterLabel; //CH01
            scw.value = fieldToValue != null  && fieldToValue.containsKey(mdt.Field_API_Name__c) ? fieldToValue.get(mdt.Field_API_Name__c) : '';
            scw.value = (scw.value.length() == 1 && scw.value.containsWhitespace()) ? scw.value.trim() : scw.value;
            scw.fieldAPIName = mdt.Field_API_Name__c;
        }
        if (String.isNotEmpty(mdt.HelpText__c)) {
            scw.isHelpText = true;
            scw.helpMsg = mdt.HelpText__c;
        }
        return scw;
    }

    public static FieldAttributes populateFieldAttributes(Boolean isRequiredFrmMD, Boolean showField,String fieldAPIName, Map<String, Schema.SObjectField>schemaMap){
        FieldAttributes FA = new FieldAttributes();        
        String DT = String.valueOf(schemaMap.get(fieldAPIName).getDescribe().getType()).toLowercase();
        FA.dataType = DT == 'boolean' ? 'checkbox' : DT;
        FA.isRequired = isRequiredFrmMD;
        FA.isShowField = showField;
        FA.isRichTextArea = FA.dataType == 'textarea' && Boolean.valueOf(schemaMap.get(fieldAPIName).getDescribe().isHtmlFormatted()) ? true : false;
        FA = fieldTypeFinder(FA.dataType,FA);
        

        for(Schema.SObjectType reference : schemaMap.get(fieldAPIName).getDescribe().getReferenceTo()) {
            FA.lookupObjectName = reference.getDescribe().getName();
            FA.lookupFieldName = fieldAPIName;
        }
        FA.allOtherField = !FA.isTextArea && !FA.isRichTextArea && !FA.isPicklist && !FA.isMultiPicklist && String.isBlank(FA.lookupObjectName) ? true : false;
        FA.maxlength = FA.isTextArea ? schemaMap.get(fieldAPIName).getDescribe().getLength() : 0;
        return FA;
    }

    private static FieldAttributes fieldTypeFinder(String dataType,FieldAttributes FA){
        if(dataType == 'textarea'){
            FA.isTextArea = true;
        }
        if(dataType == 'picklist'){
            FA.isPicklist = true;
        }
        if(dataType == 'multipicklist'){
            FA.isMultiPicklist = true;
        }
        return FA;      
    }

    /*
    * This method is use to fetch metadata records.
    * No Sornar use case : Sonar is throwing an error saying that remove unused parametres.
    * We are using above parametrs because those are referencing inside the query. If we dont pass recTypeName and objAPIName
    * as parameter query will return exception.
    */
    public static List<sObject> getCustomMetadataRecords(String query, String METADATA_NAME){
        system.debug('===query===' + query);
        if (!customMetadataRecordsMap.containsKey(query)) {            
            customMetadataRecordsMap.put(query,Database.query(String.escapeSingleQuotes(query)));
        }
        return customMetadataRecordsMap.get(query);
    }

    /*
    This method is use to create the query string.
    */
    private String selector(String objectName, List<String> fieldToQuery){
        String simpleQuery = 'select {0} FROM {1}';
        String queryWithConditional = 'select {0} FROM {1} WHERE {2}';
        String fields = String.join(new List<String>(fieldToQuery),',');
        String query;
        if(String.isNotBlank(WHERE_CLAUSE)){
            query = String.format(queryWithConditional, new List<Object>{fields, objectName, WHERE_CLAUSE});
        }else{
            query = String.format(simpleQuery, new List<Object>{fields, objectName});
        }
        if(String.isNotBlank(RECORD_LIMIT)){
            query += ' LIMIT ' + RECORD_LIMIT;
        }
        System.debug('query @@@@@@ '+query);
        return query;
    }

    public class InitWrapper{
        @AuraEnabled
        public String data;
        @AuraEnabled
        public Map<Integer,String> queryMap;
        @AuraEnabled
        public Integer queryCount;

        public InitWrapper(){
            this.queryMap = new Map<Integer,String>();
        }
    }

    public class SectionWrapper{
        @AuraEnabled
        public Integer uniqueKey;
        @AuraEnabled
        public String sectionLabel;
        @AuraEnabled
        public List<SectionContentWrapper> fieldsContent;
        public SectionWrapper(){
           fieldsContent = new List<SectionContentWrapper>();
        }
    }

    public class SectionContentWrapper{
        @AuraEnabled public Integer column_Width_Desktop;
        @AuraEnabled public Integer column_Width_Mobile;
        @AuraEnabled public Integer column_Width_Tablet;
        @AuraEnabled public String objectAPIName;
        @AuraEnabled public String validationPattern;

        @AuraEnabled public String validationPatternMismatched;
        @AuraEnabled public Decimal maxLength;
        @AuraEnabled public Decimal minLength;        
        @AuraEnabled public Boolean disabled;

        @AuraEnabled
        public String label;
        @AuraEnabled
        public String value;
        @AuraEnabled
        public Boolean checkboxVal;
        @AuraEnabled
        public Boolean isCheckbox;
        @AuraEnabled
        public Boolean isLookup;
        @AuraEnabled
        public Boolean isOtherDataType;
        @AuraEnabled
        public String hrefTag;
        @AuraEnabled
        public Boolean isHelpText;
        @AuraEnabled
        public String helpMsg;
        @AuraEnabled
        public String fieldAPIName;
        @AuraEnabled
        public String hrefValue;
        @AuraEnabled
        public String lookupVal;
        @AuraEnabled
        public FieldAttributes fieldAttribute;

        public SectionContentWrapper(){
            this.isCheckbox = false;
            this.isLookup = false;
            this.isOtherDataType = true;
            this.fieldAttribute = new FieldAttributes();
            this.lookupVal = '';
        }
    }

    public class FieldAttributes{
        @AuraEnabled
        public Boolean isShowField;
        @AuraEnabled
        public String dataType;        
        @AuraEnabled
        public Boolean isRequired = false;
        @AuraEnabled
        public Boolean isTextArea = false;
        @AuraEnabled
        public Boolean isRichTextArea = false;
        @AuraEnabled
        public Boolean isPicklist = false;
        @AuraEnabled
        public Boolean isMultiPicklist = false;        
        @AuraEnabled
        public String lookupObjectName;
        @AuraEnabled
        public String selectedLookupVal;
        @AuraEnabled
        public Boolean allOtherField;
        @AuraEnabled
        public Integer maxlength;
        @AuraEnabled
        public String lookupFieldName;
    }
}