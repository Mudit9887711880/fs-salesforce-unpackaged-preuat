public class FSRetriggerController {
    public static final String FIVBRecordTypeId = Schema.SObjectType.Verification__c.getRecordTypeInfosByName().get('FIV - B').getRecordTypeId();
    public static final String FIVCRecordTypeId = Schema.SObjectType.Verification__c.getRecordTypeInfosByName().get('FIV - C').getRecordTypeId();
    public static final String OnlineECRecordTypeId = Schema.SObjectType.Verification__c.getRecordTypeInfosByName().get('Online EC').getRecordTypeId();
    
    
    //StageFrom = Lead Details Or Process Credit
    //reTriggerStage = FIV_B / FIV_C / Online_EC
    @Auraenabled
    public static Boolean createVerification(String applicationId, String stageFrom, String reTriggerStage){
         system.debug('initiate from'+stageFrom +':::::retriggerstage'+reTriggerStage);
         String rectypeId = getRecordTypeId(reTriggerStage);
         AggregateResult[] arg =[SELECT count(Id) mycount,status__c FROM Verification__c WHERE Initiate_From__c =:stageFrom AND status__c ='Pending' AND RecordTypeId=:rectypeid AND Application__c=:applicationId GROUP BY status__c LIMIT 1];
         
         
            if(arg.size()>0)
            {  return false;}
        else
        { Verification__c verification = new Verification__c();
            verification.RecordTypeId = getRecordTypeId(reTriggerStage);
            verification.Application__c = applicationId;
            verification.OwnerId = getPreviousVerificationOwner(applicationId, reTriggerStage);
            verification.status__c = 'Pending';
            verification.Initiate_From__c = stageFrom;
            insert verification;
            String objectAPIName = 'Verification__c';
            
            /** 
				Need to check code 
				By: Yogendra Degra
			**/
            //String recTypeName = Schema.getGlobalDescribe().get(objectAPIName).getDescribe().getRecordTypeInfosById().get(Verification.RecordTypeId).getName();            
            //Utility.createTask(UserInfo.getName()+' has assigned you a task',null,Verification.id,Verification.OwnerId,null,'Initiate other process',true);    
            //Utility.sendNotification(UserInfo.getName()+' has assigned you a task',objApp.Name +' :: '+ recTypeName ,Verification.id,'Verification_Notification',Verification.OwnerId);
         return true;}
        
       
    }
    
    private static String getPreviousVerificationOwner(String applicationId, String reTriggerStage){
        return [SELECT id, OwnerId FROM Verification__c WHERE Record_Type_Name__c =: reTriggerStage AND Application__c =: applicationId].OwnerId;
    }
    
    private static String getRecordTypeId(String reTriggerStage){
        if(reTriggerStage == 'FIV_B')
            return FIVBRecordTypeId;
        if(reTriggerStage == 'FIV_C')
            return FIVCRecordTypeId;
        if(reTriggerStage == 'Online_EC')
            return OnlineECRecordTypeId;
        return '';
    }
}