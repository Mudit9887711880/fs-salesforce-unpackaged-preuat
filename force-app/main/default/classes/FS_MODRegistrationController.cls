/*
* ──────────────────────────────────────────────────────────────────────────────────────────────────
* @author           Kuldeep Sahu  
* @modifiedBy       Kuldeep Sahu   
* @created          2022-07-29
* @modified         2022-07-29
* @TestClassName    FS_MODRegistrationControllerTest
* @Description      This component is build to handle all the operations related to 
                    MOD Registration in FiveStar.              
* ──────────────────────────────────────────────────────────────────────────────────────────────────
*/

public without sharing class FS_MODRegistrationController {
    @AuraEnabled
    public static MOD_Registration__c getExistingMODRegistraton(String appId){
        List<MOD_Registration__c> modList = [SELECT Id, MOD_Commitment_Date__c, MOD_Date__c, MOD_Amount__c, MOD_Done__c,
                                            Sourcing_Officer__c, Sourcing_BM__c, Customer_for_Collection_A__c, 
                                            Mobile_Number_of_A__c, Customer_for_Collection_B__c, Mobile_Number_of_B__c                                    
                                            FROM MOD_Registration__c WHERE Application__c =: appId];
        if(modList != NULL && !modList.isEmpty()){
            return modList.get(0);
        }
        return null;
    }

    @AuraEnabled
    public static Map<String,Loan_Applicant__c> getLoanApplicantRecords(String appId){
        Map<String,Loan_Applicant__c> loanApplicantMap = new Map<String,Loan_Applicant__c>();
        for(Loan_Applicant__c loanApplicant : [SELECT Id, Application__c, Customer_Information__c, mobile__c, Customer_Information__r.Name FROM Loan_Applicant__c WHERE Application__c =: appId]){
            loanApplicantMap.put(loanApplicant.Customer_Information__r.Name, loanApplicant);
        }
        return loanApplicantMap;
    }
}