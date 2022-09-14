public class LWCLookupCtrl {
    @AuraEnabled
    public static List<LookupSearchResult> searchLookupRecords(String searchTerm, List<String> selectedIds,String sObjectName, String field, String subField,Integer maxResults, String criteria) {
        List<LookupSearchResult> results = new List<LookupSearchResult>();
        
        String strQuery = 'SELECT Id, '+field + (String.isNotBlank(subField) ? ' ,'+subField : '')+' FROM '+sObjectName;
        
        
        if(criteria == 'Account-CourierAgency'){
            String rcName = 'Courier Agency';
            strQuery += ' WHERE '+field+' LIKE \'' + searchTerm + '%\' AND RecordType.Name =: rcName AND';  
        } 
        else if(criteria == 'NAME_EMP'){
            strQuery += ' WHERE ('+field+' LIKE \'%' + searchTerm + '%\' OR '+subField+' LIKE \'%' + searchTerm + '%\') AND ';   
        } 
        else {
            strQuery += ' WHERE '+field+' LIKE \'%' + searchTerm + '%\' AND ';  
        }
        strQuery += ' Id NOT IN :selectedIds ORDER BY '+field+' LIMIT :maxResults';

        List<sObject> searchResults = Database.query(strQuery);   
        if(searchResults != NUll && !searchResults.isEmpty()){
            for(sObject sObj : searchResults){
                LookupSearchResult res = new LookupSearchResult();
                res.Id = sObj.Id;
                res.title = String.valueOf(sObj.get(field));
                if(String.isNotBlank(subField) && sObj.get(subField) != NULL){
                    res.subtitle = String.valueOf(sObj.get(subField));
                }else{
                    res.subtitle = sObjectName;
                }
                results.add(res);
            } 
        }
        return results;        
    }

    @AuraEnabled
    public static LookupSearchResult getSelectedRecord(String sObjectName, String field, String subField,Integer maxResults, String selectedRecordId) {
        List<LookupSearchResult> results = new List<LookupSearchResult>();
        String strQuery = 'SELECT Id, '+field + (String.isNotBlank(subField) ? ' ,'+subField : '')+' FROM '+sObjectName;
        strQuery += ' WHERE Id =:selectedRecordId ORDER BY '+field+' LIMIT :maxResults'; 
        List<sObject> searchResults = Database.query(strQuery);   
        if(searchResults != NUll && !searchResults.isEmpty()){
            for(sObject sObj : searchResults){
                LookupSearchResult res = new LookupSearchResult();
                res.Id = sObj.Id;
                res.title = String.valueOf(sObj.get(field));
                if(String.isNotBlank(subField) && sObj.get(subField) != NULL){
                    res.subtitle = String.valueOf(sObj.get(subField));
                }else{
                    res.subtitle = sObjectName;
                }
                results.add(res);
            } 
        }
        return results.get(0);        
    }
    
    @AuraEnabled
    public static LookupSearchResult getRecentlyCreatedRecord(String sObjectName, String recordId, String field, String subField) {
        LookupSearchResult result = new LookupSearchResult();
        String strQuery = 'SELECT Id, '+field + (String.isNotBlank(subField) ? ' ,'+subField : '')+' FROM '+sObjectName +' WHERE Id =:recordId LIMIT 1';
        List<sObject> searchResults = Database.query(strQuery);   
        if(searchResults != NUll && !searchResults.isEmpty()){
            sObject sObj = searchResults.get(0);
            LookupSearchResult res = new LookupSearchResult();
            result.Id = sObj.Id;
            result.title = String.valueOf(sObj.get(field));
            if(String.isNotBlank(subField) && sObj.get(subField) != NULL){
                result.subtitle = String.valueOf(sObj.get(subField));
            }else{
                result.subtitle = sObjectName;
            }
        }
        return result;        
    }
    
    public class LookupSearchResult {
        @AuraEnabled public Id id{get;set;}
        @AuraEnabled public String title{get;set;}
        @AuraEnabled public String subtitle{get;set;}
    }
}