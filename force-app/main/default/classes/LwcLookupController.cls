public with sharing class LwcLookupController {

    private static final Map<String,String> WHERE_CLAUSE_MAP = new Map<String,String>{
           'User'=>'IsActive',
           'User__x'=>'IsActive__c'
    };
 
    @AuraEnabled(cacheable=true)  
    public static List<sobject> getAllRecords(String objectName, String column, String keyFieldAPI, String selectedRecordId) {  
           String query = 'SELECT ' + column + ',' + keyFieldAPI + ' FROM ' + objectName;
           if(String.isNotBlank(selectedRecordId)){
                query += ' WHERE Id =: selectedRecordId';
           }
           if(WHERE_CLAUSE_MAP.containsKey(objectName)){
               if(String.isNotBlank(selectedRecordId)){
                      query += ' AND ' + WHERE_CLAUSE_MAP.get(objectName) + ' = true';
               }else{
                      query += ' WHERE ' + WHERE_CLAUSE_MAP.get(objectName) + ' = true';
               }
           }
           query += ' LIMIT 100';
           return Database.query(String.escapeSingleQuotes(query));
    }
 
    @AuraEnabled(cacheable=true)  
    public static List<sobject> getFilterRecords(String objectName, String column, String keyFieldAPI, String searchKey) {  
           String searchText = '%'+searchKey+'%'; //NOSONAR
           String query = 'SELECT ' + column + ',' + keyFieldAPI + ' FROM ' + objectName + ' WHERE '+ column +' LIKE : searchText';  
           if(WHERE_CLAUSE_MAP.containsKey(objectName)){
              query += ' AND ' + WHERE_CLAUSE_MAP.get(objectName) + ' = true';
           }
           query += ' LIMIT 1000';
           return Database.query(String.escapeSingleQuotes(query));
    }
 }