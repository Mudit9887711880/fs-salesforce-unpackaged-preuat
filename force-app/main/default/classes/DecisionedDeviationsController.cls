/**
* @File Name          : DecisionedDeviationsController.apxc
* @Author             : Umair Ahmad 
* @Description        : This is a controller for PcDecisionedDeviationTable LWC Component
* @Created On         : 25 August 2022
*==============================================================================
* Ver         Date                     Author                 Modification
*==============================================================================
* 1.0       16 August 2022            Umair Ahmad             Initial Version
**/
public class DecisionedDeviationsController {
    
    //Decisioned Deviations Method By Umair
    @AuraEnabled(cacheable=true)
    public static List<DecisionedDeviationsWrapper> getDecisionedRecords(String applicationId){
        
        String stageType;
        List<DecisionedDeviationsWrapper> wrapList = new List<DecisionedDeviationsWrapper>();
        integer index = 1;
        Application__c applicationObj = new  Application__c();
        
        
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
        
        for(TR_Deviation__c trDevObj : [SELECT Id, OwnerId, IsDeleted, Name, CreatedDate, CreatedById, LastModifiedDate, LastModifiedById, SystemModstamp, MS_Deviation__r.Deviation_Description__c,
                                        LastViewedDate, LastReferencedDate, Application__c, Is_Deviation_Raised__c, Applicable_for__c, Decistion__c, Remark__c, Loan_Applicant__r.Applicant_Name__c,
                                        Mitigants__c, Deviation_Type__c, Deviation_Code__c, Approval_Level__c, Loan_Applicant__c, Property__c, MS_Deviation__c, Property__r.Name, Approval_Authority__r.Name,
                                        Approval_Authority__c, Is_Deviation_Active__c, Deviation_Description__c 
                                        FROM TR_Deviation__c WHERE Application__c =: applicationId AND
                                        MS_Deviation__r.Stage__c =:stageType  AND  (Decistion__c = 'Not Approved' OR Decistion__c = 'Approved') 
                                        AND Is_Deviation_Active__c = true ORDER BY Approval_Level__c Asc]){
                                            
                                            DecisionedDeviationsWrapper wrapObj = new DecisionedDeviationsWrapper();
                                            wrapObj.srNo = index;
                                            wrapObj.msDeviationName = trDevObj.MS_Deviation__r.Deviation_Description__c;
                                            wrapObj.applicableFor = trDevObj.Applicable_for__c;
                                            wrapObj.applicant = trDevObj.Loan_Applicant__r.Applicant_Name__c;
                                            wrapObj.property = (trDevObj.Property__c != null ? trDevObj.Property__r.Name : '');
                                            wrapObj.approvalLevel = trDevObj.Approval_Level__c;
                                            wrapObj.approvalAuthority = trDevObj.Approval_Authority__r.Name;
                                            wrapObj.decision = trDevObj.Decistion__c;
                                            wrapObj.remarks = trDevObj.Remark__c;
                                            wrapObj.mitigants = trDevObj.Mitigants__c;
                                            wrapObj.decisionType = trDevObj.Deviation_Type__c;
                                            
                                            wrapList.add(wrapObj);
                                            index++;
                                        }
        return wrapList;
    }
    
    public class DecisionedDeviationsWrapper{
        @AuraEnabled
        public Integer srNo;
        @AuraEnabled
        public String msDeviationName;
        @AuraEnabled
        public String applicableFor;
        @AuraEnabled
        public String applicant;
        @AuraEnabled
        public String property;
        @AuraEnabled
        public String approvalLevel;
        @AuraEnabled
        public String approvalAuthority;
        @AuraEnabled
        public String decision;
        @AuraEnabled
        public String remarks;
        @AuraEnabled
        public String mitigants;
        @AuraEnabled
        public String decisionType;
        
    }
    
}