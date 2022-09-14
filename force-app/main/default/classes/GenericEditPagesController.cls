public virtual with sharing class GenericEditPagesController {
    public String METADATA_NAME{get;set;}
    public String WHERE_CLAUSE{get;set;}
    public String RECORD_LIMIT{get;set;}
    public Set<String> IDS_SET{get;set;}

    public static final String DATA_TABLE_QUERY_FIELDS = 'PageType__c';
    public static final String CHILD_QUERY_FIELDS = 'MasterLabel, Column_Width_desktop__c, Column_Width_mobile__c, Column_Width_tablet__c,DataType__c, Disabled__c,Field_API_Name__c,Field_Sequence__c,Object_API_Name__c,Required__c,Validation_Pattern__c,HelpText__c,URL_Target_Field_API_Name__c, Pattern_Mismatch_Message__c,Max_Length__c,Min_Length__c,Lookup_Object_API_Name__c';
    public static final String PARENT_METADATA_API_NAME = 'Generic_Detail_page__mdt';
    public static final String CHILD_RELATIONSHIP_NAME = 'Generic_Detail_Pages_Content__r';
    public static final String METADATA_QUERY = 'SELECT '+DATA_TABLE_QUERY_FIELDS +', (SELECT '+CHILD_QUERY_FIELDS+' FROM '+CHILD_RELATIONSHIP_NAME+' ORDER BY Field_Sequence__c ASC)  FROM '+PARENT_METADATA_API_NAME;  
    public static Map<String,List<sObject>> customMetadataRecordsMap = new Map<String,List<sObject>>();    

    
    
    public SectionWrapper getSectionContent(){
        SectionWrapper content = new SectionWrapper();
        //try{
            InitializeWrapper initData = initialize(METADATA_QUERY, METADATA_NAME);
            List<Generic_Detail_page__mdt> metadataRecord = initData.metadataRecords;
            if(!metadataRecord.isEmpty()){                
                for(Generic_Detail_Page_Content__mdt child : initData.cols){
                    SectionContentWrapper SCW = new SectionContentWrapper();
                    SCW.column_Width_Desktop = Integer.valueOf(child.Column_Width_desktop__c);
                    SCW.column_Width_Mobile = Integer.valueOf(child.Column_Width_mobile__c);
                    SCW.column_Width_Tablet = Integer.valueOf(child.Column_Width_tablet__c);
                    SCW.field_Sequence = child.Field_Sequence__c;
                    SCW.disabled = child.Disabled__c;
                    SCW.required = child.Required__c;
                    SCW.dataType = child.DataType__c;
                    SCW.fieldAPIName = child.Field_API_Name__c;
                    SCW.objectAPIName = child.Object_API_Name__c;
                    SCW.label = child.MasterLabel;
                    SCW.validationPattern = child.Validation_Pattern__c;
                    SCW.validationPatternMismatched = child.Pattern_Mismatch_Message__c;
                    SCW.maxLength = child.Max_Length__c;
                    SCW.minLength = child.Min_Length__c;
                    SCW.helpText = child.HelpText__c;
                    SCW.isHelpText = String.isNotEmpty(child.HelpText__c) ? true : false;
                    SCW.isTextArea = child.DataType__c == 'textarea' ? true : false;
                    SCW.isPicklist = child.DataType__c == 'picklist' ? true : false;
                    SCW.isMultiPicklist = child.DataType__c == 'multipicklist' ? true : false;  
                    SCW.minDate = '';
                    SCW.maxDate = '';
                    SCW.isCheckbox = child.DataType__c == 'checkbox' ? true : false; 
                    if(child.DataType__c == 'lookup') {
                        SCW.isLookup = true;
                        SCW.hrefTag = URL.getSalesforceBaseUrl().toExternalForm() +'/lightning/r/';
                        SCW.hrefValue = child.URL_Target_Field_API_Name__c;
                        SCW.lookupObjectName = child.Lookup_Object_API_Name__c ;
                    }
                    SCW.allOtherField = !SCW.isTextArea && !SCW.isPicklist && !SCW.isMultiPicklist && !SCW.isCheckbox && !scw.isLookup ? true : false;
                    //UPDATE CASE
                    if(!IDS_SET.isEmpty()){
                        List<sObject> records = new List<sObject>(Database.Query(String.escapeSingleQuotes(selector(child.Object_API_Name__c,initData.queryMap.get(child.Object_API_Name__c)))));
                        for(sObject record : records){
                            Map<String,String> fieldToValue = parseQuery(record, new List<String>(initData.queryMap.get(child.Object_API_Name__c)));
                            if(!SCW.isCheckbox){
                                SCW.value = fieldToValue.get(SCW.fieldAPIName).length() == 1 && fieldToValue.get(SCW.fieldAPIName).containsWhitespace() ? '' : fieldToValue.get(SCW.fieldAPIName);
                            }else{
                                if(fieldToValue.get(SCW.fieldAPIName) == 'false'){
                                    SCW.value = '';
                                    scw.checkboxVal = false;
                                }else{
                                    SCW.value = 'true';
                                    scw.checkboxVal = true;
                                }
                            }
                            
                        }
                    }                    
                    content.SectionContentWrapper.add(SCW);
                }                
            }
            system.debug('::content::' + content);
        //}catch(exception ex){}
        return content;
    }

    /*
    * This Helper method is use to get all Parent & Child metadata using the given metadata name.
    */
    public InitializeWrapper initialize(String metaQuery, String metaName){        
        InitializeWrapper initValue = new InitializeWrapper();
        string query = metaQuery+' WHERE DeveloperName =: metaName LIMIT 1';
        initValue.metadataRecords.addAll((List<Generic_Detail_page__mdt>)getCustomMetadataRecords(query,metaName));
        if(!initValue.metadataRecords.isEmpty()){            
            if(!initValue.metadataRecords[0].Generic_Detail_Pages_Content__r.isEmpty()){
                initValue.cols.addAll(initValue.metadataRecords[0].Generic_Detail_Pages_Content__r);
            }
            for(Generic_Detail_Page_Content__mdt content : initValue.metadataRecords[0].Generic_Detail_Pages_Content__r){
                system.debug('--'+content.Field_API_Name__c+'--');                
                if(initValue.queryMap.containsKey(content.Object_API_Name__c)){
                    initValue.queryMap.get(content.Object_API_Name__c).add(content.Field_API_Name__c);
                }else{
                    initValue.queryMap.put(content.Object_API_Name__c,new List<String>{content.Field_API_Name__c});
                }
            }
        }
        return initValue;
    }

    /*
    * This method is use to fetch metadata records.
    */
    private List<sObject> getCustomMetadataRecords(String query, String metaName){//NOSONAR
        if(!customMetadataRecordsMap.containsKey(query)){
            customMetadataRecordsMap.put(query,Database.query(String.escapeSingleQuotes(query)));
        }
        return customMetadataRecordsMap.get(query);
    }

    public class InitializeWrapper{
        public List<Generic_Detail_page__mdt> metadataRecords;
        public List<Generic_Detail_Page_Content__mdt> cols;
        public Map<String,List<String>> queryMap;
        public InitializeWrapper(){
            this.metadataRecords = new List<Generic_Detail_page__mdt>();
            this.cols = new List<Generic_Detail_Page_Content__mdt>();
            this.queryMap = new Map<String,List<String>>();
        }
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

    /*
    This method is use to parse the query result.
    */
    private Map<String,String> parseQuery(sObject record, List<String> fieldToQuery){
        Map<String,String> returnMap = new Map<String,String>();        
        for(String field : fieldToQuery){
            if(field.contains('.')){
                String relName = field.substringBefore('.');
                String fldName = field.substringAfter('.');
                sObject childObj = record.getSObject(relName);
                System.debug('***' + childObj);
                System.debug('***' + fldName);                
                
                if(childObj != null && String.isNotBlank(String.valueOf(childObj.get(fldName)))){
                    returnMap.put(field,String.valueOf(childObj.get(fldName)));
                }else{
                    returnMap.put(field,' ');
                }
            }else{
                if(String.isNotBlank(String.valueOf(record.get(field)))){
                    returnMap.put(field,String.valueOf(record.get(field)));
                }else{
                    returnMap.put(field,' ');
                }
            }
        }
        return returnMap;
    }
    public class SectionWrapper{
        @AuraEnabled public String sectionLabel;
        @AuraEnabled public List<SectionContentWrapper> SectionContentWrapper {get;set;}
        @AuraEnabled public Boolean isError{get;set;}
        @AuraEnabled public String errorMessage{get;set;}
        public SectionWrapper(){
            this.SectionContentWrapper = new List<SectionContentWrapper>();
        }
    }
    public class SectionContentWrapper{
        @AuraEnabled public Integer column_Width_Desktop;
        @AuraEnabled public Integer column_Width_Mobile;
        @AuraEnabled public Integer column_Width_Tablet;
        @AuraEnabled public Decimal field_Sequence;
        @AuraEnabled public Boolean disabled;
        @AuraEnabled public Boolean required;
        @AuraEnabled public String dataType;
        @AuraEnabled public String fieldAPIName;
        @AuraEnabled public String objectAPIName;
        @AuraEnabled public String label;
        @AuraEnabled public String value;
        @AuraEnabled public Boolean checkboxVal;
        @AuraEnabled public String validationPattern;
        @AuraEnabled public String validationPatternMismatched;
        @AuraEnabled public Decimal maxLength;
        @AuraEnabled public Decimal minLength;
        @AuraEnabled public Boolean isHelpText;
        @AuraEnabled public String helpText;
        @AuraEnabled public Boolean isTextArea = false;
        @AuraEnabled public Boolean isPicklist = false;
        @AuraEnabled public Boolean isMultiPicklist = false;
        @AuraEnabled public Boolean allOtherField;
        @AuraEnabled public Boolean isCheckbox = false;
        @AuraEnabled public Boolean isLookup = false;
        @AuraEnabled public String hrefTag;
        @AuraEnabled public String hrefValue;
        @AuraEnabled public String lookupObjectName;
        @AuraEnabled public String minDate;
        @AuraEnabled public String maxDate;
    }

    
}