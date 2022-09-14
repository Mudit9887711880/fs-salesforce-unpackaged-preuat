public class InitiatePCAuraController {
    
    @AuraEnabled
    public static String initiaize(String applicationId,String recordTypeName){
        system.debug('applicationId '+applicationId+'recordTypeName '+recordTypeName);
        List<Verification__c> verList = new List<Verification__c>([SELECT Id,Application__C FROM Verification__c WHERE Application__c =: applicationId AND RecordType.Name = :recordTypeName LIMIT 1]);
        if(verList.isEmpty()){
            return 'Error';
        }
        system.debug('verList '+verList[0].Id );
        return verList[0].Id;
    }
    
}