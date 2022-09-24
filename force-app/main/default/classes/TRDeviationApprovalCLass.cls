/**
* @File Name          : TRDeviationApprovalCLass.apxc
* @Author             : Umair Ahmad	
* @Description		  : This is a controller for deviationApprovalScreen LWC Component
* @Created On         : 25 August 2022
*==============================================================================
* Ver         Date                     Author                 Modification
*==============================================================================
* 1.0       27 August 2022            Umair Ahmad             Initial Version
**/

public with sharing class TRDeviationApprovalCLass {
    
    //This method fetch TR Deviation Approval records and TR Deviation And MS Master fields and send it to Component in JS. 
    @AuraEnabled(cacheable=true)
    public static List<deviationApprovalWrapper> getTRDeviationRecord(String applicationId){
        
        try {
            
            String stageType ;
            String loggedInUser = UserInfo.getUserId();
            List<deviationApprovalWrapper> dvWrapList = new List<deviationApprovalWrapper>();
            Application__c applicationObj = new  Application__c();
            integer index = 1;
            
            if(applicationId != null){
                applicationObj = [Select Id, Stage__c from Application__c where Id =:applicationId Limit 1];
            }
            
            if(applicationObj.Stage__c == 'Process Credit' || applicationObj.Stage__c == 'Approval Credit')
            {
                stageType = 'Credit';
            }
            else
                if(applicationObj.Stage__c == 'Disbursal Maker' || applicationObj.Stage__c == 'Disbursal Author')
            {
                stageType = 'Operations';
                
            }
            
            if(applicationId != null){
                for(TR_Deviation__c trDevObj : [Select Id, Deviation_Description__c , MS_Deviation__c, Applicable_For__c,
                                                Loan_Applicant__r.Applicant_Name__c, Property__r.Name, Decistion__c, Remark__c,
                                                Mitigants__c, Deviation_Type__c, Is_Deviation_Raised__c, Approval_Level__c,MS_Deviation__r.Deviation_Description__c
                                                From TR_Deviation__c
                                                where Application__c =: applicationId AND Approval_Authority__c=: loggedInUser AND 
                                                Decistion__c ='Approval for Pending'  AND
                                                MS_Deviation__r.Stage__c =:stageType AND is_Deviation_Active__c = True AND Is_Deviation_Raised__c=true]){
                                                    
                                                    List<ConditionallyDecisionWrapper> wrapDecisionList = new List<ConditionallyDecisionWrapper>();
                                                    deviationApprovalWrapper wrapObj = new deviationApprovalWrapper();
                                                    
                                                    wrapObj.srNo = index;
                                                    // wrapObj.msDeviationName = trDevObj.MS_Deviation__r.Name;
                                                    wrapObj.applicableFor = trDevObj.Applicable_for__c;
                                                    wrapObj.applicant = trDevObj.Loan_Applicant__r.Applicant_Name__c;
                                                    wrapObj.property = trDevObj.Property__r.Name;
                                                    wrapObj.approvalLevel = trDevObj.Approval_Level__c; 
                                                    wrapObj.decision = trDevObj.Decistion__c;  
                                                    
                                                    ConditionallyDecisionWrapper wrapDecision1 = new ConditionallyDecisionWrapper();
                                                    wrapDecision1.label = 'Approved';
                                                    wrapDecision1.value = 'Approved';
                                                    wrapDecisionList.add(wrapDecision1);
                                                    ConditionallyDecisionWrapper wrapDecision2 = new ConditionallyDecisionWrapper();
                                                    wrapDecision2.label = 'Rejected';
                                                    wrapDecision2.value = 'Rejected';
                                                    wrapDecisionList.add(wrapDecision2);
                                                    wrapObj.ConditionallyDecisionWrapList = wrapDecisionList;
                                                    wrapObj.applicationId = applicationId;
                                                    wrapObj.deviationType = trDevObj.Deviation_Type__c;
                                                    wrapObj.deviationDescriptionName = trDevObj.Deviation_Description__c;
                                                    wrapObj.devId = trDevObj.Id;
                                                    dvWrapList.add(wrapObj);
                                                    
                                                    index++;
                                                    
                                                }
            }
            
            system.debug('dvWrapList '+dvWrapList);
            return dvWrapList;
        } catch (Exception e) {
            system.debug('Exception'+e.getLineNumber()+' meassage '+e.getMessage());
            throw new AuraHandledException(e.getMessage());
        }
        
    }
    //@Author : Sangeeta
    /*Description : This method fetch TR Deviation records to send notification to user based on lowest approval level pending deviation 
by setting raised deviation checkbox to true */
    @AuraEnabled
    public static void getLowestLevPendingTRDev(String applicationId){
        
        try {
            
            Map<String, List<TR_Deviation__c>> levelBasedTrMap = new  Map<String, List<TR_Deviation__c>>();
            Map<String, List<TR_Deviation__c>> levelBasedRejectedTrMap = new  Map<String, List<TR_Deviation__c>>();
            String stageType ;
            
            
            List<String> mapKeySet = new List<String>();
            Application__c applicationObj = new  Application__c();
            integer index = 1;
            
            set<String> levelSet = new Set<String>();
            //   levelList.sort();
            //   System.debug('Sorted level List::'+   levelList);
            
            if(applicationId != null){
                applicationObj = [Select Id, Stage__c from Application__c where Id =:applicationId Limit 1];
            }
            if(applicationObj.Stage__c != null || applicationObj.Stage__c != ''){
                if(applicationObj.Stage__c == 'Process Credit' || applicationObj.Stage__c == 'Approval Credit')
                {
                    stageType = 'Credit';
                }
                else
                    if(applicationObj.Stage__c == 'Disbursal Maker' || applicationObj.Stage__c == 'Disbursal Author')
                {
                    stageType = 'Operations';
                    
                }
            }
            if(applicationId != null){
                for(TR_Deviation__c trDevObj : [Select Id, Deviation_Description__c , MS_Deviation__c, Applicable_For__c,Approval_Level__c,
                                                Loan_Applicant__r.Applicant_Name__c, Property__r.Name, Decistion__c, Remark__c,
                                                Mitigants__c, Deviation_Type__c From TR_Deviation__c where Application__c =: applicationId]){
                                                    
                                                    levelSet.add(trDevObj.Approval_Level__c);
                                                    
                                                    
                                                }
            }
            
            
            if(applicationId != null){
                for(TR_Deviation__c trDevObj : [Select Id, Deviation_Description__c , MS_Deviation__c, Applicable_For__c,
                                                Loan_Applicant__r.Applicant_Name__c, Property__r.Name, Decistion__c, Remark__c,
                                                Mitigants__c, Deviation_Type__c, Is_Deviation_Raised__c, Approval_Level__c From TR_Deviation__c
                                                where Application__c =: applicationId AND
                                                MS_Deviation__r.Stage__c =:stageType AND is_Deviation_Active__c = True ]){
                                                    for(String level : levelSet){
                                                        
                                                        if(trDevObj.Approval_Level__c != null){
                                                            if(level == trDevObj.Approval_Level__c && (trDevObj.Decistion__c == 'Approval for Pending' || trDevObj.Decistion__c == 'Not Approved')){
                                                                // trDevObj.Is_Deviation_Raised__c = True;
                                                                if(!mapKeySet.contains(level)){
                                                                    mapKeySet.add(level);
                                                                }
                                                                if(levelBasedTrMap.containsKey(level)){
                                                                    levelBasedTrMap.get(level).add(trDevObj);
                                                                }
                                                                else{
                                                                    levelBasedTrMap.put(level, new List<TR_Deviation__c>{trDevObj});
                                                                }
                                                            }      
                                                        }
                                                    }
                                                }
                
                System.debug('Level and tr deviation map'+levelBasedTrMap);
                mapKeySet.sort();
                List<TR_Deviation__c> raiseDeviationList = new List<TR_Deviation__c>();
                for(String level : mapKeySet){
                    System.debug('Lvel from level map'+ level + levelBasedTrMap.get(level));
                    if(levelBasedTrMap.get(level).size() > 0 ){
                        for(TR_Deviation__c trBasedOnLevel : levelBasedTrMap.get(level)){
                            if(trBasedOnLevel.Decistion__c == 'Approval for Pending'){
                                trBasedOnLevel.Is_Deviation_Raised__c = True;
                                raiseDeviationList.add(trBasedOnLevel);
                            }
                            else if(trBasedOnLevel.Decistion__c == 'Not Approved'){
                                break;
                            }
                        }
                        break;
                    }
                    else{
                        System.debug(levelBasedTrMap.get(level).size());
                    }
                }
                if(raiseDeviationList.size() > 0){
                    update raiseDeviationList;
                }
            }
        } catch (Exception e) {
            system.debug('Exception'+e.getLineNumber()+' meassage '+e.getMessage());
            throw new AuraHandledException(e.getMessage());
        }
        
    }
    
    @AuraEnabled
    public static void updateDecisions(String deviationList){
        List<deviationApprovalWrapper> dvWrapList =  (List<deviationApprovalWrapper>) JSON.deserialize(deviationList, List<deviationApprovalWrapper>.class);
        List<String> trDevIdList = new List<string>();
        List<TR_Deviation__c> trDevList = new  List<TR_Deviation__c>();
        
        
        
        //To updat TR devaition record
        for(deviationApprovalWrapper wrpData : dvWrapList){
            if(wrpData.isChanged && wrpData.approvalStatus == 'Approved'  ){
                system.debug('dvWrapListttt>> '+dvWrapList);
                TR_Deviation__c trDevObj = new TR_Deviation__c();
                trDevObj.Id  = wrpData.devId;
                trDevObj.Decistion__c = 'Approved';
                trDevObj.Remark__c = wrpData.remarks;
                trDevObj.Mitigants__c = wrpData.mitigants;
                trDevObj.Is_Deviation_Raised__c = True;
                trDevList.add(trDevObj);
                
            }
            else
                if(wrpData.isChanged && wrpData.approvalStatus == 'Rejected'){
                    TR_Deviation__c trDevObj = new TR_Deviation__c();
                    trDevObj.Id  = wrpData.devId;
                    trDevObj.Decistion__c = 'Not Approved';
                    trDevList.add(trDevObj);
                }
        }
        
        if(!trDevList.isEmpty()){
            update trDevList;
        }
        if(!dvWrapList.isEmpty()){
            getLowestLevPendingTRDev(dvWrapList[0].applicationId);
        }
    }
    
    
    public class deviationApprovalWrapper{
        
        @AuraEnabled
        public Integer srNo;
        @AuraEnabled
        public String applicationId;
        @AuraEnabled
        public String deviationDescriptionName;
        @AuraEnabled
        public String applicableFor;
        @AuraEnabled
        public String applicant;
        @AuraEnabled
        public String property;
        @AuraEnabled
        public String approvalLevel;
        
        @AuraEnabled
        public List<ConditionallyDecisionWrapper> ConditionallyDecisionWrapList; 
        @AuraEnabled
        public Boolean isDisabled;
        @AuraEnabled
        public String remarks;
        @AuraEnabled
        public String mitigants;
        @AuraEnabled
        public String deviationType;
        @AuraEnabled
        public String decision;
        @AuraEnabled
        public String devId;
        @AuraEnabled
        public String applicationName;
        @AuraEnabled
        public String nextapprovallevel;        
        @AuraEnabled
        public String nextapprovalUser;        
        @AuraEnabled
        public String approvalStatus;       
        @AuraEnabled
        public Boolean isChanged;
        
        public  deviationApprovalWrapper(){
            isChanged = false;
            isDisabled = false;
            nextapprovallevel ='';
            nextapprovalUser ='';
            approvalStatus ='';
        }
    }
    
    public class ConditionallyDecisionWrapper {
        @AuraEnabled
        public String label;
        @AuraEnabled
        public String value;
    }
    
    
}