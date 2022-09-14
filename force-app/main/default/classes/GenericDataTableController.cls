/*
This is a extendable class use to create data table.
This class consume Data_Table__mdt & Data_Table_Content__mdt.

* Required Parameters - Metadata
* METADATA_NAME - Holds the developer name of custom metadata.

* Required Parameters - Fieldset
* IS_FIELDSET - Should be true in fieldset case.
* FIELD_SET_NAME - Fieldset API name.
* OBJECT_API_NAME - Object's API name.

* Optional Parameters - Fieldset/Metadata
* WHERE_CLAUSE - Holds the Where Condition for query.
* RECORD_LIMIT - Holds the Record Limit to be fetched from query.
* IDS_SET - Set of string holds values to be checked in query.
* LINK_NAMES_SET (For Fieldset only) - holds the API name of field which we habe to make as link.
*/
public virtual with sharing class GenericDataTableController{
    
    @TestVisible private static final String METADATA_QUERY = 'SELECT '+GenericDataTableControllerHelper.DATA_TABLE_QUERY_FIELDS +', (SELECT '+GenericDataTableControllerHelper.CHILD_QUERY_FIELDS+' FROM '+GenericDataTableControllerHelper.CHILD_RELATIONSHIP_NAME+' ORDER BY Sequence__c ASC)  FROM '+GenericDataTableControllerHelper.PARENT_METADATA_API_NAME;  
    
    private GenericDataTableControllerHelper.DataParserWrapper identifiers;
    private String objectName;
    
    public String METADATA_NAME{get;set;}
    public String WHERE_CLAUSE{get;set;}
    public String RECORD_LIMIT{get;set;}
    public Set<String> IDS_SET{get;set;}
    
    /*
    This method is use to get all the properties from metadata and return them.
    This method is use for metadata approach. 
    */
    public DataTableResponse getTable(){
        DataTableResponse table = new DataTableResponse();
        table.isError = false;
        try{
            GenericDataTableControllerHelper helper = new GenericDataTableControllerHelper();
            GenericDataTableControllerHelper.InitializeWrapper initData = helper.initialize(METADATA_QUERY, METADATA_NAME);
            List<Data_Table__mdt> metadataRecord = initData.metadataRecords;
            if(!metadataRecord.isEmpty()){
                table.keyField = metadataRecord[0].Table_Key_Field_API_Name__c;
                table.isShowPagination = metadataRecord[0].Show_Pagination__c;
                table.numberOfRecords = metadataRecord[0].Default_Page_Size__c;
                table.showPagingPicklist = metadataRecord[0].Show_Paging_Picklist__c;
                table.showCheckboxes = metadataRecord[0].Show_Checkboxes__c;
                table.treatCheckboxesAsRadio = metadataRecord[0].Treat_Checkboxes_As_Radio__c;
                if(String.isNotEmpty(metadataRecord[0].Paging_Picklist_Values__c)){
                    table.pagingPicklistValues = new List<String>(metadataRecord[0].Paging_Picklist_Values__c.split(','));
                }
                table.showSearch = metadataRecord[0].Show_Search__c;
                objectName = metadataRecord[0].Object_API_Name__c;
                table.lstDataTableColumns = getHeaders(initData.cols);
                identifiers = helper.dataParser(initData.cols, initData.dataParse);
                table.defaultSortBy = identifiers.actualToDummyHyperLink.containsKey(metadataRecord[0].Sort_By__c) ? identifiers.actualToDummyHyperLink.get(metadataRecord[0].Sort_By__c) : metadataRecord[0].Sort_By__c;
                table.defaultSortDirection = metadataRecord[0].Sort_Direction__c;
                String query = selector();  
                System.debug('query @@@@@ '+query);
                table.strDataTableData = '[' + String.join(parseInnerJson(query),',') + ']';
                table.sortMap = identifiers.sortMapInner;
            }
        }catch(exception ex){
            table.isError = true;
            table.errorMessage = ex.getMessage();
            System.debug('::::' + ex.getStackTraceString());
        }
        return table;
    }
    
    /*
    This method is use to get headers for the table.
    */
    private List<Header> getHeaders(List<Data_Table_Content__mdt>cols){
        List<Header> headers = new List<Header>();
        List<RowAction> rowActionsList = new List<RowAction>();
        if(!cols.isEmpty()){
            for(Data_Table_Content__mdt col : cols){
                if(col.DataType__c == 'date-local'){                    
                    TypeAttributes typeAttribute = new TypeAttributes('numeric', 'numeric', 'numeric');
                    headers.add(new Header(col.Sequence__c, col.MasterLabel, col.Field_API_Name__c, true, col.DataType__c, typeAttribute, col.Column_Width__c));
                }else if(col.DataType__c == 'url'){                    
                    TypeAttributes typeAttribute = new TypeAttributes();
                    String dummyValue = GenericDataTableControllerHelper.arrangeDummies(col.URL_Target_Field_API_Name__c, false);
                    String dummyLabel = GenericDataTableControllerHelper.arrangeDummies(col.URL_Label_Field_API_Name__c, true);
                    typeAttribute.label = new label(dummyLabel);
                    headers.add(new Header(col.Sequence__c, col.MasterLabel, dummyValue, true, col.DataType__c, typeAttribute, col.Column_Width__c));
                }else if(col.DataType__c == 'action'){
                    rowActionsList.add(new RowAction(col));
                }else{
                    headers.add(new Header(col.Sequence__c, col.MasterLabel, col.Field_API_Name__c, true, col.DataType__c, null, col.Column_Width__c));
                }
            }
            if (!rowActionsList.isEmpty()) {
                TypeAttributes ta = new TypeAttributes();
                ta.rowActions = rowActionsList;
                headers.add(new Header(null, null, null, null, 'action', ta , 5));
                
            }
        }
        return headers;
    }

    /*
    This method is use to create records Json.
    */
    private List<String> parseInnerJson(String query){
        List<String> jsonList = new List<String>();
        List<sObject> records = new List<sObject>(Database.Query(String.escapeSingleQuotes(query)));
        System.debug('::records::' + records);        
        for(sObject record : records){
            List<String> innerJsonList = new List<String>();            
            Map<String,String> fieldToValue = parseQuery(record, new List<String>(identifiers.fieldToQuery));
            System.debug('==' + fieldToValue);
            for(String field : fieldToValue.KeySet()){
                System.debug('vboolean '+identifiers.booleanIdentifier);
                System.debug('field '+field);
                if(field.equalsIgnoreCase('ID')){
                    innerJsonList.add('"' + field + '" : "' + fieldToValue.get(field).replaceAll('[\r\n]',' ') + '"');
                }
                if(identifiers.actualToDummyHyperLink.containsKey(field)){
                    if(identifiers.urlIdentifier.contains(identifiers.actualToDummyHyperLink.get(field))){
                        innerJsonList.add('"' + identifiers.actualToDummyHyperLink.get(field) + '" : "/lightning/_classic/' + fieldToValue.get(field).replaceAll('[\r\n]',' ') + '"');
                    }else{
                        innerJsonList.add('"' + identifiers.actualToDummyHyperLink.get(field) + '" : "' + fieldToValue.get(field).replaceAll('[\r\n]',' ') + '"');
                    }
                }
                else if (identifiers.dateIdentifier.contains(field)){
                    String parsedDate = (String.isNotBlank(fieldToValue.get(field)) ? String.valueOf(Date.valueOf(fieldToValue.get(field))) : '');
                    innerJsonList.add('"' + field + '" : "' + parsedDate + '"');
                }
                else if(identifiers.booleanIdentifier.contains(field)){
                    innerJsonList.add('"' + field + '" : ' + fieldToValue.get(field).replaceAll('[\r\n]',' ') + '');
                }
                else{
                    innerJsonList.add('"' + field + '" : "' + fieldToValue.get(field).replaceAll('[\r\n]','') + '"');
                }               
            }
            String json = '{' + String.join(innerJsonList, ',') + '}';
            jsonList.add(json);
        }
        return jsonList;
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

    /*
    This method is use to create the query string.
    */
    private String selector(){
        String simpleQuery = 'select {0} FROM {1}';
        String queryWithConditional = 'select {0} FROM {1} WHERE {2}';
        String fields = String.join(new List<String>(identifiers.fieldToQuery),',');
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
    
    public class DataTableResponse{
        @AuraEnabled
        public String keyField{get;set;}
        @AuraEnabled
        public Boolean isShowPagination{get;set;}
        @AuraEnabled
        public Boolean showSearch{get;set;}
        @AuraEnabled
        public Boolean showPagingPicklist{get;set;}
        @AuraEnabled
        public List<String> pagingPicklistValues{get;set;}
        @AuraEnabled
        public Decimal numberOfRecords{get;set;}
        @AuraEnabled
        public String defaultSortBy{get;set;}
        @AuraEnabled
        public String defaultSortDirection{get;set;}
        @AuraEnabled
        public List<Header> lstDataTableColumns{get;set;}
        @AuraEnabled
        public String strDataTableData{get;set;}
        @AuraEnabled
        public Map<String,String> sortMap{get;set;}
        @AuraEnabled
        public List<Object> fieldSetResult{get;set;}
        @AuraEnabled
        public Boolean isError{get;set;}
        @AuraEnabled
        public String errorMessage{get;set;}
        @AuraEnabled
        public Boolean showCheckboxes{get;set;}
        @AuraEnabled
        public Boolean treatCheckboxesAsRadio{get;set;}
    }
    
    public class Header{
        public Decimal order;
        @AuraEnabled
        public String label {get;set;}
        @AuraEnabled
        public String fieldName {get;set;}
        @AuraEnabled
        public Decimal initialWidth {get;set;}
        @AuraEnabled
        public Boolean sortable {get;set;}
        @AuraEnabled
        public String type {get;set;}
        @AuraEnabled
        public TypeAttributes typeAttributes;
        @AuraEnabled
        public Boolean wrapText {get;set;}
        @AuraEnabled
        public cellAttributes cellAttributes{get;set;}
        
        
        public Header(Decimal o, String l, String fn, boolean s, String t, TypeAttributes ta, Decimal iw){
            this.order = o;
            this.label = l;
            this.fieldName = fn;
            this.sortable = s;
            this.type = t;
            this.wrapText = true;
            if(type == 'url' || type == 'date-local' || type == 'action'){
                this.typeAttributes = ta;
            }
            if(type == 'currency'){
                this.cellAttributes = new cellAttributes();
            }
            this.initialWidth = iw != null ? iw : 250;
        }
    }
    
    public class TypeAttributes {
        @AuraEnabled
        public Label label{get;set;}
        @AuraEnabled
        public String day{get;set;}
        @AuraEnabled
        public String month{get;set;}
        @AuraEnabled
        public String year{get;set;}
        @AuraEnabled
        public List<RowAction> rowActions {get;set;}
        
        // Default Constructor
        public TypeAttributes(){}
        
        public TypeAttributes(String d, String m, String y){
            this.day = d;
            this.month = m;
            this.year = y;
        }
    }
    
    public class Label{
        @AuraEnabled
        public String fieldName{get;set;}
        
        public Label(String fn){
            this.fieldName = fn;
        }
    }

    public class RowAction {
        @AuraEnabled
        public String label {get;set;}
        @AuraEnabled
        public String name {get;set;}

        public RowAction(Data_Table_Content__mdt col) {
            this.label = col.MasterLabel;
            this.name = col.Field_API_Name__c;
        }
    }

    public class cellAttributes{
        @AuraEnabled
        public String alignment = 'left';
    }
}