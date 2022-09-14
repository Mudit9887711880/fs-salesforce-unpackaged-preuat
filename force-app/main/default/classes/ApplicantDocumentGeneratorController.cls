public class ApplicantDocumentGeneratorController {
    public String recordId{get;set;}
    public String docType{get;set;}
    public ApplicantWrapper applicants{get;set;}
    public WitnessWrapper witness{get;set;}
    public Loan_Applicant__c objLoan{get;set;}
    public ApplicantDocumentGeneratorController(){
        objLoan = new Loan_Applicant__c(); 
        recordId = ApexPages.currentPage().getParameters().get('recordId');
        applicants = new ApplicantWrapper();
        witness = new WitnessWrapper();
        if(ApexPages.currentPage().getParameters().get('borrowerName') != null)
       	 System.debug(ApexPages.currentPage().getParameters().get('borrowerName'));
        if(ApexPages.currentPage().getParameters().get('witnessName') != null)
       	 System.debug(ApexPages.currentPage().getParameters().get('witnessName'));
        if(ApexPages.currentPage().getParameters().get('witnessAddress') != null)
       	 System.debug(ApexPages.currentPage().getParameters().get('witnessAddress'));
        if(ApexPages.currentPage().getParameters().get('witnessMonthsKnown') != null)
       	 System.debug(ApexPages.currentPage().getParameters().get('witnessMonthsKnown'));
        if(ApexPages.currentPage().getParameters().get('witnessRelation') != null)
       	 System.debug(ApexPages.currentPage().getParameters().get('witnessRelation'));
        if(ApexPages.currentPage().getParameters().get('borrowerName') != null && ApexPages.currentPage().getParameters().get('witnessName') != null 
           && ApexPages.currentPage().getParameters().get('witnessAddress') != null && ApexPages.currentPage().getParameters().get('witnessMonthsKnown') != null
           && ApexPages.currentPage().getParameters().get('witnessRelation') != null){
               witness.borrowerName = ApexPages.currentPage().getParameters().get('borrowerName');
               witness.witnessName = ApexPages.currentPage().getParameters().get('witnessName');
               witness.witnessAddress = ApexPages.currentPage().getParameters().get('witnessAddress');
               witness.witnessMonthsKnown = ApexPages.currentPage().getParameters().get('witnessMonthsKnown');
               witness.witnessRelation = ApexPages.currentPage().getParameters().get('witnessRelation');
           }
        if(ApexPages.currentPage().getParameters().get('docType') != null){
            docType = ApexPages.currentPage().getParameters().get('docType');
        }
        objLoan = [SELECT Id, Customer_Information__c, Customer_Information__r.Name, Customer_Information__r.PersonBirthdate, Application__r.Name, Application__r.Sourcing_Branch__r.Name,Application__r.Emi_PcAc__c,
						  Residence_Address_Line_1__c, Residence_City__c, Residence_State__c, Residence_Country__c, Residence_Pincode__r.Name,Customer_Type__c, Application__c, Application__r.Total_Amount_Recommended_PcAc__c
                   FROM Loan_Applicant__c
                   WHERE Id = :recordId];
        applicants.applicationName = objLoan.Application__r.Name;
        applicants.applicantName = objLoan.Customer_Information__r.Name;
        applicants.applicantAge = calculateAge(objLoan.Customer_Information__r.PersonBirthdate);
        if(String.isNotEmpty(objLoan.Residence_Address_Line_1__c) && String.isNotBlank(objLoan.Residence_Address_Line_1__c))
            applicants.applicantAddress = objLoan.Residence_Address_Line_1__c+', ';
        if(String.isNotEmpty(objLoan.Residence_City__c) && String.isNotBlank(objLoan.Residence_City__c))
            applicants.applicantAddress += objLoan.Residence_City__c+', ';
        if(String.isNotEmpty(objLoan.Residence_State__c) && String.isNotBlank(objLoan.Residence_State__c))
            applicants.applicantAddress += objLoan.Residence_State__c+', ';
        if(String.isNotEmpty(objLoan.Residence_Pincode__r.Name) && String.isNotBlank(objLoan.Residence_Pincode__r.Name))
            applicants.applicantAddress += objLoan.Residence_Pincode__r.Name;
        applicants.applicantAddress.removeEnd(',');
        applicants.applicationDOB = objLoan.Customer_Information__r.PersonBirthdate;
        //witness = getWitness(objLoan.Application__c);
    }
    
    public Integer calculateAge(Date dob){
        Integer days = dob.daysBetween(Date.Today());
        Integer age = Integer.valueOf(days/365);
        return age;
    }
    
    @AuraEnabled    
    public static void generateApplicantAgreementExecutionDocs(String recordId){
        List<String> vfPageName = new List<String>{'SignatureMismatchLetterVf','AadharConsentVF','VernacularVF','Form60'};
        List<ContentVersion> cvList = new List<ContentVersion>();
        List<Loan_Applicant__c> loanAppList = [SELECT Id,Customer_Information__r.Name FROM Loan_Applicant__c WHERE Application__c = :recordId];
        for(Loan_Applicant__c objLoan : loanAppList){
            for(String vfName : vfPageName){
                PageReference pdf;
                if(vfName == 'SignatureMismatchLetterVf')
                    pdf = Page.SignatureMismatchLetterVf; 
                if(vfName == 'AadharConsentVF')
                    pdf = Page.AadharConsentVF; 
                if(vfName == 'VernacularVF')
                    pdf = Page.VernacularVF; 
                if(vfName == 'Form60')
               	 	pdf = Page.Form60;
                pdf.getParameters().put('recordId',objLoan.Id);
                Blob body;   
                if(Test.isRunningTest()) { 
                    body = blob.valueOf('Unit.Test');
                } else {
                    body = pdf.getContentAsPDF();
                }    
                ContentVersion cv = new ContentVersion(Title = objLoan.Customer_Information__r.Name+'-'+vfName, PathOnClient =vfName+'.PDF', VersionData = body, FirstPublishLocationId = recordId);
                cvList.add(cv); 
            }   
        }
        System.debug('cvList '+cvList);
        if(cvList.size() > 0)
        	INSERT cvList; 
    }
    
    public WitnessWrapper getWitness(String applicationId){
        Agreement_Execution_Document_Generation__c objAE = new Agreement_Execution_Document_Generation__c();
        objAE = [SELECT Id,  Borrower__c, Witness__c, Witness_Name__c, Witness_Address__c , Application__c, Relationship_Between_Borrower_And_Witnes__c, No_of_years_known__c 
                 FROM Agreement_Execution_Document_Generation__c
                 WHERE Application__c = : applicationId AND RecordType.Name = 'Vernacular / LTI Declaration'];  
        WitnessWrapper objWrap = new WitnessWrapper();
        objWrap.witnessName = objAE.Witness_Name__c;
        objWrap.witnessAddress = objAE.Witness_Address__c;
        objWrap.witnessRelation = objAE.Relationship_Between_Borrower_And_Witnes__c;
        objWrap.witnessMonthsKnown = String.valueOf(objAE.No_of_years_known__c);
        return objWrap;
    }
    
    public class ApplicantWrapper{
        public String applicantName{get;set;}
        public String applicantAddress{get;set;}
        public String applicationName{get;set;}
        public Date applicationDOB{get;set;}
        public Integer applicantAge{get;set;}
    }
    
    public class WitnessWrapper{
        public String borrowerName{get;set;}
        public String witnessName{get;set;}
        public String witnessAddress{get;set;}
        public String witnessRelation{get;set;}
        public String witnessMonthsKnown{get;set;}
    }
}