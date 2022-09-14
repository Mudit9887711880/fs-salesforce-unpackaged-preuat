/*
		Date : 18/08/2022
		Author : Mo Arslan
*/
public class FsDocumentDisptachCtrl{
    @AuraEnabled
    public static List<Branch_Master__c> getBranch(){
        Set<Id> branchIdSet = FsDocumentDisptachCtrl.getBranchIdsFromBranchUserAllocation();
        List<Branch_Master__c> Branchs = new List<Branch_Master__c>();
        if(!branchIdSet.isEmpty()){
            Branchs = [SELECT Id, Name, HO_HUB__r.Branch_Address_Line_1__c FROM Branch_Master__c WHERE Id IN:branchIdSet];
        }
        return Branchs;
    }
    @AuraEnabled
    public static List<DocumentDispatchWrapper> getApplicationsWithDate(String branchId, Date fromDate, Date toDate){
        Integer sNo = 1;
        List<DocumentDispatchWrapper> documentDispatchList = new List<DocumentDispatchWrapper>();
        Set<Id> branchIdSet = new Set<Id>();
        Set<String> stages = new Set<String>{'Dispatch Pending', 'Document Receipt', 'Disbursal Maker', 'Disbursal Author', 'Document Deferral'};
        if(branchId == 'All'){
            branchIdSet = FsDocumentDisptachCtrl.getBranchIdsFromBranchUserAllocation();
        }
        else{
            branchIdSet.add(branchId);
        }
        List<Application__c> applicationList = new List<Application__c>();
        applicationList =  [SELECT Id, Sourcing_Branch__r.Name, Name, (SELECT Id, Customer_Information__r.Name FROM Loan_Applicants__r) FROM Application__c WHERE Sourcing_Branch__c In : branchIdSet AND CreatedDate>=:fromDate AND CreatedDate<=:toDate AND Stage__c In:stages ORDER BY CreatedDate DESC];
        for(Application__c app : applicationList){
            DocumentDispatchWrapper docDispatch = new DocumentDispatchWrapper();
            docDispatch.Id = app.Id;
            docDispatch.serialNumber = sNo;
            docDispatch.applicationNo = app.Name;
            docDispatch.customerName = app.Loan_Applicants__r[0].Customer_Information__r.Name;
            docDispatch.sourcingBranch = app.Sourcing_Branch__r.Name;
            documentDispatchList.add(docDispatch);
            sNo++;
        }
        return documentDispatchList;
    }

    @AuraEnabled
    public static List<DocumentDispatchWrapper> getApplicationsWithoutDate(String branchId){
        Integer sNo = 1;
        List<DocumentDispatchWrapper> documentDispatchList = new List<DocumentDispatchWrapper>();
        Set<Id> branchIdSet = new Set<Id>();
        Set<String> stages = new Set<String>{'Dispatch Pending', 'Document Receipt', 'Disbursal Maker', 'Disbursal Author', 'Document Deferral'};
        if(branchId == 'All'){
            branchIdSet = FsDocumentDisptachCtrl.getBranchIdsFromBranchUserAllocation();
        }
        else{
            branchIdSet.add(branchId);
        }
        List<Application__c> applicationList = new List<Application__c>();
        Map<Id, Loan_Applicant__c> loanApplicantMap = new Map<Id, Loan_Applicant__c>();
        applicationList =  [SELECT Id, Sourcing_Branch__r.Name, Name, (SELECT Id, Customer_Information__r.Name FROM Loan_Applicants__r WHERE Customer_Type__c = 'Primary Applicant' limit 1) FROM Application__c WHERE Sourcing_Branch__c In:branchIdSet AND Stage__c In:stages ORDER BY CreatedDate DESC];
        for(Application__c app : applicationList){
            DocumentDispatchWrapper docDispatch = new DocumentDispatchWrapper();
            docDispatch.Id = app.Id;
            docDispatch.serialNumber = sNo;
            docDispatch.applicationNo = app.Name;
            docDispatch.customerName = app.Loan_Applicants__r[0].Customer_Information__r.Name;
            docDispatch.sourcingBranch = app.Sourcing_Branch__r.Name;
            documentDispatchList.add(docDispatch);
            sNo++;
        }
        return documentDispatchList;
    }

    @AuraEnabled
    public static Courier_Control__c getExistingRecord(String recordId){
        return [SELECT Id ,Address__c ,Branch_Name__c, Branch__c ,Courier_Agency__c ,Courier_POD_No__c, From_Date__c, To_Date__c, (SELECT Application__c FROM Courier_Applications__r) FROM Courier_Control__c WHERE Id =:recordId LIMIT 1 ];
    }

    @AuraEnabled
    public static String createRecords(String wrpObject, List<String> applicationIds){
        Map<Id, Application__c> applicationMap;
        Courier_Control__c courierControl = new Courier_Control__c();
        courierControl = (Courier_Control__c)JSON.deserialize(wrpObject, Courier_Control__c.class);
        upsert courierControl;
        
        List<Courier_Application__c> couAppLst = [SELECT Id FROM Courier_Application__c WHERE Courier_Control__c =:courierControl.Id];
        if(couAppLst.size()>0){
            delete couAppLst;
        }
        applicationMap = new Map<Id, Application__c>([SELECT Id, Stage__c FROM Application__c WHERE Id In: applicationIds]);
        if(applicationIds != NULL && !applicationIds.isEmpty()){
            List<Courier_Application__c> courierApplicationList = new List<Courier_Application__c>();
            for(String str : applicationIds){
                Courier_Application__c courierApplication = new Courier_Application__c();
                courierApplication.Application__c = str;
                courierApplication.Status__c = 'Dispatch';
                courierApplication.Courier_Control__c = courierControl.Id;
                if((applicationMap.get(str).Stage__c == 'Dispatch Pending' || applicationMap.get(str).Stage__c == 'Document Receipt' || applicationMap.get(str).Stage__c == 'Disbursal Maker' || applicationMap.get(str).Stage__c == 'Disbursal Author' || applicationMap.get(str).Stage__c == 'Document Deferral') && applicationMap.get(str).Stage__c!='Custody'){
                    courierApplication.Document_Type__c = 'Disbursement File';
                }
                if((applicationMap.get(str).Stage__c == 'Dispatch Pending' || applicationMap.get(str).Stage__c == 'Document Receipt' || applicationMap.get(str).Stage__c == 'Disbursal Maker') && applicationMap.get(str).Stage__c!='Disbursal Author'){
                    courierApplication.Document_Type__c = 'Pending Document';
                }
                if((applicationMap.get(str).Stage__c == 'Disbursal Author' || applicationMap.get(str).Stage__c == 'Document Deferral') && applicationMap.get(str).Stage__c!='Custody'){
                   courierApplication.Document_Type__c = 'Deferral Documents';
                }
                courierApplicationList.add(courierApplication);
            }
            insert courierApplicationList; 
        }
        return courierControl.Id;
    }

    @AuraEnabled
    public static void updateCourierApplications(String courierControlId){
        List<Application__c> applicationList = new List<Application__c>();
        Courier_Control__c courierControl = [SELECT Document_Generated__c, (SELECT Status__c, Application__r.Stage__c FROM Courier_Applications__r) FROM Courier_Control__c WHERE Id=:courierControlId];
        courierControl.Document_Generated__c = true;
        List<Courier_Application__c> couAppLst = new List<Courier_Application__c>();
        for(Courier_Application__c courierApp : courierControl.Courier_Applications__r){
            courierApp.Status__c = 'File In Transit';
            courierApp.Application__r.Stage__c = 'Document Receipt';
            couAppLst.add(courierApp);
            applicationList.add(courierApp.Application__r);
        }
        update courierControl;
        if(couAppLst.size()>0){
            update couAppLst;
        }
        if(applicationList.size()>0){
            System.debug('applicationList '+applicationList);
            update applicationList;
        }
    }
    public static Set<Id> getBranchIdsFromBranchUserAllocation(){
        String usrId = UserInfo.getUserId();
        Set<Id> branchIdSet = new Set<Id>();
        List<User_Branch_Allocation__c> usrBranchAllo = [SELECT Id, Branch_Master__c FROM User_Branch_Allocation__c WHERE User__c =:usrId];
        for(User_Branch_Allocation__c uba : usrBranchAllo){
            if(uba.Branch_Master__c!=null){
                branchIdSet.add(uba.Branch_Master__c);
            }
        }
        return branchIdSet;
    }
    public class DocumentDispatchWrapper{
        @AuraEnabled
        public String Id;
        @AuraEnabled
        public Integer serialNumber;
        @AuraEnabled
        public String applicationNo;
        @AuraEnabled
        public String customerName;
        @AuraEnabled
        public String sourcingBranch;
    }
}