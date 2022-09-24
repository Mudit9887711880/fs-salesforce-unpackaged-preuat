/**
* @File Name          : FSFIVBReportVfController.cls
* @Description        : Report For FIV-B Component
* @Author             : Yogendra Degra
* @Created On         : 26/04/2022
*==============================================================================
* Ver         Date                     Author                 Modification
*==============================================================================
* 1.0         26/04/2022              Yogendra Degra       Initial Version
*/
public class FSFIVBReportVfController {
    public String applicationId{get;set;}
    public String verificationId{get;set;}
    public String applicantName{get;set;}
    public Application__c applicationRecord{get;set;}
    public Verification__c verificationRecord{get;set;}
    public List<Property__c> propertyRecords{get;set;}
    public List<Cashflow__c> cashflowRecords{get;set;}
    public List<Character__c> characterRecords{get;set;}
    public List<AddressWrapper> addressWrapper{get;set;}
    public List<Wrapper> wrapperProperty{get;set;}
    
    public Decimal grandTotal{get;set;}
    public Decimal totalObligations{get;set;}
    public Decimal totalNetIncome{get;set;}
    
    Public FSFIVBReportVfController(){
        applicationRecord = new Application__c();
        Set<String> loanApplicantIds = new Set<String>();
        verificationRecord = new Verification__c();
        propertyRecords = new List<Property__c>();
        cashflowRecords = new List<Cashflow__c>();
        characterRecords = new List<Character__c>();
        addressWrapper = new List<AddressWrapper>();
        wrapperProperty = new List<Wrapper>();
        
        grandTotal = 0;
        totalObligations = 0;
        totalNetIncome = 0;
        
        applicationId = ApexPages.currentPage().getParameters().get('applicationId');
        verificationId = ApexPages.currentPage().getParameters().get('verificationId');
        
        applicationRecord = [SELECT Id, Name, Pre_Login__c, (SELECT Id, Customer_Information__c, Customer_Type__c, Applicant_Name__c FROM Loan_Applicants__r) FROM Application__c WHERE Id =: applicationId];
        for(Loan_Applicant__c objApplicant : applicationRecord.Loan_Applicants__r){
            loanApplicantIds.add(objApplicant.Id);
            if(objApplicant.Customer_Type__c == 'Primary Applicant'){
                applicantName = objApplicant.Applicant_Name__c;
            }
        } 
        System.debug('loanApplicantIds ### '+loanApplicantIds); 
        verificationRecord = [SELECT Id, Application__r.Requested_Loan_Amount__c,Application__r.Branch__c,Application__r.Name, BM_Recommended_Amount__c, Tenor__c, Purpose__c, Application__c, Inspection_Date__c FROM Verification__c WHERE Id =: verificationId];
        propertyRecords = [SELECT Id, Name, Distance_from_Branch__c, Risk_Document__c, Title_Deed_Type__c, Title_Deed_Number__c, Title_Deed_Date__c FROM Property__c WHERE Application__c =: applicationId AND RecordType.Name = 'FIV-B Property Detail'];
        cashflowRecords = [SELECT Id, Loan_Applicant__r.Customer_Type__c, Loan_Applicant__r.Applicant_Name__c, HM_Score__c, Profile__c, Gross_Income__c, BM_Comments_for_Cashflow__c, Obligations__c, Net_Income__c FROM Cashflow__c WHERE Loan_Applicant__c IN: loanApplicantIds];
        characterRecords = [SELECT Id, Reference_check_done_with__c, Customer_Information__c FROM Character__c WHERE Loan_Applicant__c IN: loanApplicantIds];
        
        System.debug('propertyRecords '+propertyRecords);
        for(Cashflow__c objCash : cashflowRecords){
            if(objCash.Gross_Income__c != null){
                grandTotal += objCash.Gross_Income__c;
            }
            if(objCash.Obligations__c != null){
                totalObligations += objCash.Obligations__c;
            }
            if(objCash.Net_Income__c != null){
                totalNetIncome += objCash.Net_Income__c;
            }
        }
        String address = '';
        for(Property__c objPro : [SELECT Id, Name, Property_Address__c, Land_Area_Sq_Ft__c,Total_Value__c, Building_Area_Sq_Ft__c, Total_Area__c, Value_per_sq_ft__c  FROM Property__c WHERE RecordType.Name = 'FIV-B Property Detail' AND Application__c =: applicationId]){
            
            
            AddressWrapper wrapper = new AddressWrapper();
            wrapper.propertyName = objPro.Name;
            wrapper.customerAddress = address;  
            wrapper.propertyAddress = objPro.Property_Address__c;
            addressWrapper.add(wrapper);
            
            Wrapper objWrapper = new Wrapper();
            objWrapper.customerName = objPro.Name;
            objWrapper.totalAreasqft = objPro.Land_Area_Sq_Ft__c;
            objWrapper.totalAreaBuilding = objPro.Building_Area_Sq_Ft__c;
            objWrapper.adoptedValuePersqft =  String.valueOf(objPro.Total_Value__c);
            objWrapper.totalAmount = objPro.Land_Area_Sq_Ft__c != null && objPro.Total_Value__c != null ? String.valueOf(objPro.Land_Area_Sq_Ft__c * objPro.Total_Value__c) : ''; 
            wrapperProperty.add(objWrapper);
            
        }
        /*for(Loan_Applicant__c objApplicant : [SELECT Id, Residence_Flat_Plot_Number__c, Residence_Address_Line_1__c, Residence_Address_Line_2__c, Residence_Village__c, Residence_Taluka__c, Residence_City__c, Residence_District__c, Residence_State__c, Residence_Country__c, Residence_Pincode__c, (SELECT Id, Name, Property_Address__c, Land_Area_Sq_Ft__c, Building_Area_Sq_Ft__c, Total_Area__c, Value_per_sq_ft__c  FROM Properties__r  WHERE RecordType.Name = 'FIV-B Property Detail') FROM Loan_Applicant__c WHERE Application__c =: applicationId]){
address = '';
if(String.isNotBlank(objApplicant.Residence_Flat_Plot_Number__c)){
address += objApplicant.Residence_Flat_Plot_Number__c + ', ';
}
if(String.isNotBlank(objApplicant.Residence_Address_Line_1__c)){
address += objApplicant.Residence_Address_Line_1__c + ', ';
}
if(String.isNotBlank(objApplicant.Residence_Address_Line_2__c)){
address += objApplicant.Residence_Address_Line_2__c + ', ';
}
if(String.isNotBlank(objApplicant.Residence_Village__c)){
address += objApplicant.Residence_Village__c + ', ';
}
if(String.isNotBlank(objApplicant.Residence_Taluka__c)){
address += objApplicant.Residence_Taluka__c + ', ';
}
if(String.isNotBlank(objApplicant.Residence_City__c)){
address += objApplicant.Residence_City__c + ', ';
}
if(String.isNotBlank(objApplicant.Residence_District__c)){
address += objApplicant.Residence_District__c + ', ';
}
if(String.isNotBlank(objApplicant.Residence_State__c)){
address += objApplicant.Residence_State__c + ', ';
}
if(String.isNotBlank(objApplicant.Residence_Country__c)){
address += objApplicant.Residence_Country__c + ', ';
}
address = address.removeEnd(', ');
for(Property__c objPro : objApplicant.Properties__r){

AddressWrapper wrapper = new AddressWrapper();
wrapper.propertyName = objPro.Name;
wrapper.customerAddress = address;  
wrapper.propertyAddress = objPro.Property_Address__c;
addressWrapper.add(wrapper);

Wrapper objWrapper = new Wrapper();
objWrapper.customerName = objPro.Name;
objWrapper.totalAreasqft = objPro.Land_Area_Sq_Ft__c;
objWrapper.totalAreaBuilding = objPro.Building_Area_Sq_Ft__c;
objWrapper.forceSalesValue =  String.valueOf(objPro.Value_per_sq_ft__c);
objWrapper.totalAmount = String.valueOf(objPro.Land_Area_Sq_Ft__c * objPro.Value_per_sq_ft__c); 
wrapperProperty.add(objWrapper);
}      
}*/
    }
    @AuraEnabled    
    public static String generateFIVBPdf(String verificationId, String applicationId){
        System.debug('verif Id'+verificationId);
        System.debug('applicationId'+applicationId); 
        List<Verification__c> listOfVerification = [SELECT Id, Status__c,If_FIVB_Report_Generated__c FROM Verification__c WHERE Id =: verificationId];
        System.debug('listOfVerification'+listOfVerification);
        
        if(listOfVerification != null && listOfVerification.size() > 0){
            //listOfVerification[0].Status__c = 'Completed';
            listOfVerification[0].If_FIVB_Report_Generated__c = true;
            update listOfVerification;
        }
        PageReference pdf = Page.FIVBReportVf;
        pdf.getParameters().put('applicationId',applicationId);
        pdf.getParameters().put('verificationId',verificationId);
        Blob body;
        
        if(Test.isRunningTest()) { 
            body = blob.valueOf('Unit.Test');
        } else {
            body = pdf.getContentAsPDF();
        }    
        ContentVersion cv = new ContentVersion(Title = 'FIV-B Report', PathOnClient ='FIV-B Report.PDF', VersionData = body, FirstPublishLocationId = applicationId);
        insert cv;
        System.debug('cv'+cv);
        if(cv.id!= null)
            return 'Successfully report generated';
        return ' ';
        
    }
    public class Wrapper{
        public Decimal totalAreasqft{get;set;}
        public Decimal totalAreaBuilding{get;set;}
        public String customerName{get;set;}
        public String landLabel{get;set;}
        public String buildingLabel{get;set;}
        public String adoptedValuePersqft{get;set;}
        public String totalAmount{get;set;}
        
        
        public Wrapper(){
            totalAreasqft = 0;
            totalAreaBuilding = 0;
            customerName = '';
            landLabel = 'Land – (E)';
            buildingLabel = 'Building GF -(F)';
            adoptedValuePersqft = '';
            totalAmount = '';
        }    
    }
    public class AddressWrapper{
        public String customerAddress{get;set;}
        public String propertyAddress{get;set;}
        public String propertyName{get;set;}
        public AddressWrapper(){
            customerAddress = '';  
            propertyAddress = '';  
            propertyName = '';
        }
    }
}