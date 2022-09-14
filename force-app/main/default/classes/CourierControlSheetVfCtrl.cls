/*
     Date : 19/08/2022
     Author : Mo Arslan
*/


public class CourierControlSheetVfCtrl {
    List<Courier_Control__c> courierControlList{get;set;}
    public WrpClass wrpObj{get;set;}
    Set<Id> applicationdId = new Set<Id>();
    List<Courier_Application__c> courierApplication{get;set;}
    List<Loan_Applicant__c> loanApplicant{get;set;}
    Map<Id, String> documentTypeMap = new Map<Id, String>();
    public CourierControlSheetVfCtrl(ApexPages.StandardController sc){
        wrpObj = new WrpClass();
        wrpObj.appDetails = new List<applicantDetails>();
        String currentRecordId  = ApexPages.CurrentPage().getparameters().get('recordId');
        System.debug('----Job ID ----- ' + currentRecordId);
        courierControlList = [SELECT Name, Address__c, Courier_Agency__r.Name, Branch_Name__c, Courier_POD_No__c FROM Courier_Control__c WHERE Id=:currentRecordId limit 1];
        System.debug('courierControlList '+courierControlList);
        courierApplication = [SELECT Application__c, Document_Type__c From Courier_Application__c WHERE Courier_Control__c In:courierControlList];
        System.debug('courierApplication '+courierApplication.size());
        for(Courier_Application__c couApp : courierApplication){
            if(couApp.Application__c!=null){
                applicationdId.add(couApp.Application__c);
                documentTypeMap.put(couApp.Application__c, couApp.Document_Type__c);
            }
        }
        if(!applicationdId.isEmpty()){
            loanApplicant = [SELECT Customer_Information__c, Customer_Information__r.Name, Application__c, Application__r.Name FROM Loan_Applicant__c WHERE Application__c In : applicationdId AND Customer_Type__c='Primary Applicant'];
            System.debug('loanApplicant '+loanApplicant);
        }
        if(loanApplicant.size()>0){
            Integer idx = 1;
            for(Loan_Applicant__c applicant : loanApplicant){
                applicantDetails appDetail = new applicantDetails();
                appDetail.applicationName = applicant.Application__r.Name;
                appDetail.applicantName = applicant.Customer_Information__r.Name;
                appDetail.documentType = documentTypeMap.get(applicant.Application__c);
                appDetail.index = idx;
                idx++;
                wrpObj.appDetails.add(appDetail);
            }
        }
        User usr = [SELECT EmployeeNumber, Name FROM User WHERE Id =:UserInfo.getUserId()];
        wrpObj.opsOfficerId = usr.EmployeeNumber;
        wrpObj.opsOfficerName = usr.Name;
        wrpObj.noOfApplication = courierApplication.size();
        wrpObj.businessDate = System.today().format();
        wrpObj.refNo = courierControlList.get(0).Name;
        wrpObj.courierAgency = courierControlList.get(0).Courier_Agency__r.Name;
        wrpObj.courierPodNo = courierControlList.get(0).Courier_POD_No__c;
        wrpObj.branchName = courierControlList.get(0).Branch_Name__c;
        wrpObj.address = courierControlList.get(0).Address__c;
        wrpObj.courierDispatchDate = System.today().format();
        wrpObj.currentDate = System.today().format();
        System.debug('Wrapper Object '+wrpObj);
        courierControlList.get(0).Document_Generated__c = true;
    }
    public class WrpClass{
        public String opsOfficerId{get;set;}
        public String opsOfficerName{get;set;}
        public List<applicantDetails> appDetails{get;set;}
        public Integer noOfApplication{get;set;}
        public String address{get;set;}
        public String branchName{get;set;}
        public String businessDate{get;set;}
        public String courierPodNo{get;set;}
        public String courierAgency{get;set;}
        public String refNo{get;set;}
        public String courierDispatchDate{get;set;}
        public String currentDate{get;set;}
    }
    public class applicantDetails{
        public Integer index{get;set;}
        public String applicationName{get;set;}
        public String applicantName{get;set;}
        public String documentType{get;set;}
    }
}