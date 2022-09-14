public class OnlineEcReportController {
    public String applicationId{get;set;}
    public Application__c applicationRecord{get;set;}
    Public OnlineEcReportController(){
        Set<String> applicantIds = new Set<String>();
        applicationRecord = new Application__c();
        applicationId = ApexPages.currentPage().getParameters().get('applicationId');
        applicationRecord = [SELECT Id, Name, Pre_Login__c, 
                             (SELECT Id, Name, Customer_Information__c, Customer_Information__r.Name,Title_Document_date__c,Risk_Document__c,Title_Deed_Type__c,Title_Deed_Number__c FROM Properties__r WHERE Customer_Information__c != NULL),
                             (SELECT Id, Customer_Information__c, Customer_Information__r.Customer_Type__c FROM Loan_Applicants__r WHERE Customer_Information__c != NULL),
                             (SELECT Id, Application__c, Application__r.Name, Inspection_Time__c,Status__c, Result__c, Owner__c 
                              FROM Verifications__r WHERE recordType.Name = 'Online Ec' ORDER BY CreatedDate DESC LIMIT 1)
                             FROM Application__c WHERE Id =: applicationId];
        for(Loan_Applicant__c objApplicant : applicationRecord.Loan_Applicants__r){
            applicantIds.add(objApplicant.Customer_Information__c); 
        }    
     
    }
    @AuraEnabled    
    public static void generateOnlineEcPdf(String verificationId, String applicationId){
        List<Verification__c> listOfVerification = [SELECT Id, Status__c FROM Verification__c WHERE Id =: verificationId];
        if(listOfVerification != null && listOfVerification.size() > 0){
            listOfVerification[0].Status__c = 'Completed';
            update listOfVerification;
        }
        PageReference pdf = Page.FIVBReportVf;
        pdf.getParameters().put('applicationId',applicationId);
        Blob body;
        
        if(Test.isRunningTest()) { 
            body = blob.valueOf('Unit.Test');
        } else {
            body = pdf.getContentAsPDF();
        }    
        ContentVersion cv = new ContentVersion(Title = 'Online Ec Report', PathOnClient ='Online Ec Report.PDF', VersionData = body, FirstPublishLocationId = applicationId);
        insert cv;
    }
  
}