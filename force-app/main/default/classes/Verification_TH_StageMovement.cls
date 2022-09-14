public without sharing class Verification_TH_StageMovement extends AbstractTriggerContext {
    public override void afterUpdate(List<sobject> newList, List<sobject> oldList, Map<Id,sObject> newMap, Map<Id,sObject> oldMap){
        System.debug('Stage Movement');
        updateStage((List<Verification__c>)newList, (Map<Id,Verification__c>) oldMap);
    }
    
    public static void updateStage(List<Verification__c> newList, Map<Id,Verification__c> oldMap){
        System.debug('updateStage Method Called');
        Set<String> applicationIds = new Set<String>();
        for(Verification__c verObj : newList){
            Verification__c oldObj = oldMap.get(verObj.Id);
            if(String.isNotBlank(verObj.Status__c) && verObj.Status__c.equalsIgnoreCase('Completed') && verObj.Status__c != oldObj.Status__c
                && String.isNotBlank(verObj.Initiate_From__c) && verObj.Initiate_From__c.equalsIgnoreCase('Pre Login'))
            {
                applicationIds.add(verObj.Application__c);
            }
        }
		System.debug('applicationIds= '+applicationIds);
        if(!applicationIds.isEmpty()){
            List<Application__c> applicationsToUpdate = new List<Application__c>();
            for(Application__c appObj : [SELECT Id, Stage__c, (SELECT Id, Status__c FROM Verifications__r WHERE Status__c = 'Completed' AND Initiate_From__c = 'Pre Login' ) FROM Application__c WHERE Id IN : applicationIds]){
                System.debug('appObj= '+appObj);
                if(appObj.Verifications__r != NULL && appObj.Verifications__r.size() == 3){
                    appObj.Stage__c = 'In Principle Sanction';
                    applicationsToUpdate.add(appObj);
                }
            }
			System.debug('applicationsToUpdate= '+applicationsToUpdate);
            if(!applicationsToUpdate.isEmpty()){
                update applicationsToUpdate;
            }
        }
    }
}