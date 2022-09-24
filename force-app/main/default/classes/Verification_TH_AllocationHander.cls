/*
* ──────────────────────────────────────────────────────────────────────────────────────────────────
* @author           Kuldeep Sahu  
* @modifiedBy       Kuldeep Sahu   
* @created          2022-08-03
* @modified         2022-08-03
* @TestClassName    
* @Description      This class is used to handle Verification User Allocation.             
* ──────────────────────────────────────────────────────────────────────────────────────────────────
*/
public without sharing class Verification_TH_AllocationHander extends AbstractTriggerContext{
    public override void afterInsert(List<sobject> newList, Map<Id,sObject> newMap){
        System.debug('Verification_TH_AllocationHander');
        getVerificationUserAllocation((List<Verification__c>)newList);
    }
    
    public static final String UNASSIGNED_QUEUE_ID = Utility.getUnAssignedQueueId();    
    public static void getVerificationUserAllocation(List<Verification__c> newList){
        
        Set<String> applicationIds = new Set<String>();
        Set<String> stages = new Set<String>();
        Map<String,String> verificationUserMapCapacity = new Map<String,String>();
        Map<String,String> verificationUserMapRR = new Map<String,String>();
        Map<String,String> returnMap = new Map<String,String>();
        
        Map<Id,String> recordTypeIdNameMap = new Map<Id,String>();
        for(String RTName : Schema.SObjectType.Verification__c.getRecordTypeInfosByName().keyset()){            
            Id recTypeId = Schema.SObjectType.Verification__c.getRecordTypeInfosByName().get(RTName).getRecordTypeId();
            recordTypeIdNameMap.put(recTypeId,RTName);
        }  
        
        for(Verification__c verObj : newList){
            if(verObj.Application__c != NULL && recordTypeIdNameMap.containsKey(verObj.RecordTypeId) &&
              (recordTypeIdNameMap.get(verObj.RecordTypeId) == 'FIV - B' || recordTypeIdNameMap.get(verObj.RecordTypeId) == 'FIV - C' || recordTypeIdNameMap.get(verObj.RecordTypeId) == 'Online EC')){
                applicationIds.add(verObj.Application__c);
                stages.add(recordTypeIdNameMap.get(verObj.RecordTypeId));
            }   
        }
        
        System.debug('applicationIds = '+applicationIds);
        if(!applicationIds.isEmpty()){     
            Map<Id, Map<Id,Verification__c>> applicationStageVerificationMap = new Map<Id, Map<Id,Verification__c>>();
            for(Verification__c verObj : [SELECT 
                                          Id, RecordTypeId, OwnerId, Application__c 
                                          FROM Verification__c 
                                          WHERE Application__c IN : applicationIds
                                          AND Id NOT IN : newList])
            {
                if(applicationStageVerificationMap.containsKey(verObj.Application__c)){
                    applicationStageVerificationMap.get(verObj.Application__c).put(verObj.RecordTypeId ,verObj);
                }else{
                    applicationStageVerificationMap.put(verObj.Application__c,new Map<Id, Verification__c>{verObj.RecordTypeId => verObj});
                }
            }
            
            Map<Id,Application__c> applicationMap = new Map<Id,Application__c>([SELECT Id, Sourcing_Branch__c, Sourcing_Branch__r.Name FROM Application__c WHERE Id IN : applicationIds]);
        	Map<String,Allocation__c> allocationMap = getAllocations(stages); 
            Map<String, String> verificationStageMapCapacity = new Map<String, String>();
            Map<String, String> verificationBranchMapCapacity = new Map<String, String>();
            Map<String, String> verificationStageMapRR = new Map<String, String>();
            Map<String, String> verificationBranchMapRR = new Map<String, String>();
            Set<String> verificationAccessSet = new Set<String>();
            Set<String> verificationStageSet = new Set<String>();
            Set<String> verificationOwnerSet = new Set<String>();
            Set<String> verificationBranchSet = new Set<String>();
            for(Verification__c verObj : newList){
                String stageName = recordTypeIdNameMap.get(verObj.RecordTypeId);
                if(applicationMap.containsKey(verObj.Application__c) && allocationMap.containsKey(stageName)){
                    Allocation__c ac = allocationMap.get(stageName);
                    String branch = applicationMap.get(verObj.Application__c).Sourcing_Branch__r.Name;
                    if(applicationStageVerificationMap.containsKey(verObj.Application__c) && applicationStageVerificationMap.get(verObj.Application__c).containsKey(verObj.RecordTypeId)){
                        String ownerId = applicationStageVerificationMap.get(verObj.Application__c).get(verObj.RecordTypeId).OwnerId;
                        returnMap.put(verObj.Id, ownerId);
                    	verificationStageSet.add(stageName);
                        verificationOwnerSet.add(ownerId);
                        verificationBranchSet.add(branch);
                        verificationAccessSet.add(ownerId+'-'+stageName+'-'+branch);
                    } else {
                        if(ac.Mechanism__c == 'Round Robin') {
                            verificationStageMapRR.put(verObj.Id, stageName);
                            verificationBranchMapRR.put(verObj.Id, branch);
                        } else {
                            verificationStageMapCapacity.put(verObj.Id, stageName);
                            verificationBranchMapCapacity.put(verObj.Id, branch);
                        } 
                    }                 
                } else {
                    returnMap.put(verObj.Id ,UNASSIGNED_QUEUE_ID);
                }
            }
            
            if(!verificationOwnerSet.isEmpty()){
                List<Access_Branch_Allocation__c> accessOnBranch = new List<Access_Branch_Allocation__c>();
                accessOnBranch = [SELECT 
                                  Id, Access_Master__c, Branch_Master__c, Branch_Master__r.Name, Access_Master__r.Access_For__c, 
                                  Access_Master__r.User__c, Access_Master__r.Capacity__c, Access_Master__r.Capacity_Used__c, 
                                  Access_Master__r.Level__c, Access_Master__r.Sequence__c, Access_Master__r.Next_Assignment__c
                                  FROM Access_Branch_Allocation__c 
                                  WHERE 
                                  Access_Master__r.User__c IN : verificationOwnerSet
                                  AND Branch_Master__r.Name IN : verificationBranchSet
                                  AND Access_Master__r.Access_For__c IN : verificationStageSet
                                  ORDER BY Access_Master__r.Sequence__c ASC];
                List<Access_Master__c> accessMasterToUpdate = new List<Access_Master__c>();
                
                for(Access_Branch_Allocation__c abaObj : accessOnBranch){
                    String key = abaObj.Access_Master__r.User__c+'-'+abaObj.Access_Master__r.Access_For__c+'-'+abaObj.Branch_Master__r.Name;
                    if(verificationAccessSet.contains(key)){
                        Access_Master__c accessObj = new Access_Master__c();
                        accessObj.Id = abaObj.Access_Master__c;
                        accessObj.Capacity_Used__c = abaObj.Access_Master__r.Capacity_Used__c+1;
                        accessMasterToUpdate.add(accessObj);
                    }
                }
                if(!accessMasterToUpdate.isEmpty()){
                    update accessMasterToUpdate;
                }
            }
            
            verificationUserMapRR = AllocationHandlerHelper.getUsersNew(verificationBranchMapRR, verificationStageMapRR, 'Round Robin');
            verificationUserMapCapacity = AllocationHandlerHelper.getUsersNew(verificationBranchMapCapacity, verificationStageMapCapacity, 'Capacity');
            returnMap.putAll(verificationUserMapRR);
            returnMap.putAll(verificationUserMapCapacity);
            if(returnMap != NULL && !returnMap.isEmpty()){
                List<Verification__c> verificationToUpdate = new List<Verification__c>();
                for(Verification__c verObj : newList){
                    if(returnMap.containsKey(verObj.Id)){
                        verificationToUpdate.add(new Verification__c(Id = verObj.Id, OwnerId = returnMap.get(verObj.Id)));
                    }
                }
                System.debug('verificationToUpdate= '+verificationToUpdate);
                if(!verificationToUpdate.isEmpty()){
                    update verificationToUpdate;
                }
            }
        }
    }

    private static Map<String,Allocation__c> getAllocations(Set<String> stages){
        Map<String,Allocation__c> stageWiseAllocationMap = new Map<String,Allocation__c>();      
        for(Allocation__c all : [SELECT Allocation_Type__c, Mechanism__c, Stage__c FROM Allocation__c WHERE Stage__c IN : stages]){
            stageWiseAllocationMap.put(all.Stage__c, all);
        }
        return stageWiseAllocationMap;
    }    
}