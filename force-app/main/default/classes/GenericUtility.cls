/**
* @File Name          : GenericUtility.cls
* @Description        : GenericUtility Class
* @Author             : Ajay Kumar
* @Created On         : 22/06/2022
*==============================================================================
* Ver         Date                     Author                 Modification
*==============================================================================
* 1.0        22/06/2022              Ajay Kumar             Initial Version
*                                                           Created One method for Generic Deletion
*/

public class GenericUtility {
    @AuraEnabled
    public static String deleteSelectedRecord(String deletedFrom, String recordId, String objApiName){
        System.debug('delete callled'+deletedFrom+' :::: '+recordId+'  ::::: '+objApiName);
        List<Id> recordsToDelete = new List<Id>();
        if(deletedFrom != null && recordId != null && objApiName !=null){     
            if(deletedFrom=='Prelogin'){  
                if(objApiName=='Property__c'){   
                    recordsToDelete.add(recordId);
                    for(Property__c proObj : [SELECT Id FROM Property__c WHERE Property__c=:recordId]){ 
                        recordsToDelete.add(proObj.Id);
                    }  
                    for(Property_Owners__c proOwn : [SELECT Id FROM Property_Owners__c WHERE Property__c=:recordId]){
                        recordsToDelete.add(proOwn.Id);
                    }
                }
                else {  
                    recordsToDelete.add(recordId);  
                }
            }
            else{  
                recordsToDelete.add(recordId);
            }
            system.debug('property List>>>> '+recordsToDelete);
        }
        Database.DeleteResult[] drList;
        if(recordsToDelete.size()>0)
        {  
            drList = Database.delete(recordsToDelete, false);}
        for(Database.DeleteResult dr : drList) {
            if (dr.isSuccess()) {
                // Operation was successful, so get the ID of the record that was processed
                System.debug('Successfully deleted account with ID: ' + dr.getId());
                return 'success';
            }
            else 
            {     // Operation failed, so get all errors                
                for(Database.Error err : dr.getErrors()) {
                    System.debug('The following error has occurred.');                    
                    System.debug(err.getStatusCode() + ': ' + err.getMessage());
                    System.debug('Account fields that affected this error: ' + err.getFields());
                    return 'error';
                } }}
        return null;
    }
}