/*
* ──────────────────────────────────────────────────────────────────────────────────────────────────
* @author           Arnav Chaudhary 
* @modifiedBy       Arnav Chaudhary  
* @created          2022-08-9
* @modified         2022-08-9
* @Description      This class is used to display underwriting grid table details.
* ──────────────────────────────────────────────────────────────────────────────────────────────────
*/
public class PostApprovalController {
    
    @AuraEnabled(cacheable=true)
    public static List<PostApprovalListWrapper> postApprovalData(String applicationId){
        List<PostApprovalListWrapper> postAppWrapperList = new List<PostApprovalListWrapper>();
        if(String.isNotBlank(applicationId)){
            Set<String> stages = new Set<String>();
            List<Verification__c> verList = [SELECT 
                                             Id, Application__c, Status__c, Application__r.Stage__c, Owner.Name, RecordType.Name,Submission_Date__c,
                                             Application__r.Total_Amount_Recommended_PcAc__c, LastModifiedDate,  Application__r.AC_Decision__c,  Application__r.PC_Decision__c, 
                                             Application__r.PC_Remarks__c, Application__r.AC_Remarks__c, Application__r.PC_Submisson_Date__c, Application__r.AC_Submission_Date__c
                                             FROM 
                                             Verification__c 
                                             WHERE Application__c =: applicationId 
                                             AND (RecordType.Name = 'AC' OR RecordType.Name = 'PC')
                                             ORDER BY CreatedDate DESC];
            for(Verification__c verObj : verList) {
                if(!stages.contains(verObj.RecordType.Name)){
                    stages.add(verObj.RecordType.Name);
                    PostApprovalListWrapper wrapper = new PostApprovalListWrapper();
                    wrapper.Id = verObj.ID;
                    wrapper.userName = verObj.Owner.Name;
                    
                    wrapper.recLoanAmnt = verObj.Application__r.Total_Amount_Recommended_PcAc__c;
                    
                    if(verObj.RecordType.Name == 'PC'){
                        wrapper.stage = 'Process Credit';
                        wrapper.decision = verObj.Application__r.PC_Decision__c;
                        wrapper.remarks = verObj.Application__r.PC_Remarks__c;
                        wrapper.recDate = verObj.Application__r.PC_Submisson_Date__c;
                    }else if(verObj.RecordType.Name == 'AC'){
                        wrapper.stage = 'Approval Credit';
                        wrapper.decision = verObj.Application__r.AC_Decision__c;
                        wrapper.remarks = verObj.Application__r.AC_Remarks__c;
                        wrapper.recDate = verObj.Application__r.AC_Submission_Date__c;
                    }
                    
                    postAppWrapperList.add(wrapper);
                    System.debug('post' + postAppWrapperList);
                }
                
            }
            
        }
        System.debug('post' + postAppWrapperList); 
        return postAppWrapperList;
        
    }
    
    @AuraEnabled 
    public static void generateFinalSanctionLetter(String applicationId){
        PageReference pdf = Page.LoanSanctionLetterVf;
        pdf.getParameters().put('id',applicationId);
        Blob body;
        
        if(Test.isRunningTest()) { 
            body = blob.valueOf('Unit.Test');
        } else {
            body = pdf.getContentAsPDF();
        }    
        ContentVersion cv = new ContentVersion(Title = 'Final Sanction Letter',Document_Type__c='Final Sanction Letter', PathOnClient ='Final Sanction Letter.PDF', VersionData = body, FirstPublishLocationId = applicationId);
        insert cv;
    }
    
    @AuraEnabled 
    public static Boolean checkFinalSanctionLetter(String applicationId){
        List<ContentVersion> cvList = [SELECT ID FROM ContentVersion WHERE FirstPublishLocationId =: applicationId AND Document_Type__c='Final Sanction Letter'];
        if(cvList != NULL && !cvList.isEmpty()){
            return true;
        }else {
            return false;
        }
    }
    
    @AuraEnabled
    public static String sendBackAprovalCredit(String applicationId){
        List<Verification__c> approvalList = new List<Verification__c>([SELECT Id,Status__c,Application__c FROM Verification__c WHERE Application__c =: applicationId ORDER BY CreatedDate DESC LIMIT 1]);
        if(approvalList.size() > 0){
            approvalList.get(0).Status__c = 'Pending';
            Update approvalList;
            return 'Success';
        }System.debug('Approval' + approvalList);
        return 'error';
    }
    
    public class PostApprovalListWrapper{
        @AuraEnabled public String Id;     
        @AuraEnabled public String userName;    
        @AuraEnabled public String stage;    
        @AuraEnabled public String decision; 
        @AuraEnabled public String remarks;
        @AuraEnabled public datetime recDate;
        @AuraEnabled public Decimal recLoanAmnt;
    }
}