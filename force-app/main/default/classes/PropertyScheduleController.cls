public class PropertyScheduleController {
    public String recordId{get;set;}
    public List<ApplicantWrapper> applicants{get;set;}
    public Loan_Applicant__c loanApp{get;set;}
    public Property__c objProp{get;set;}
    public PropertyScheduleController(){
        recordId = ApexPages.currentPage().getParameters().get('recordId');
        applicants = new List<ApplicantWrapper>();
        objProp = new Property__c();
        objProp = getTitleDeedNumber(recordId);
        List<Loan_Applicant__c> loanAppList = new List<Loan_Applicant__c>();
        loanAppList = [SELECT Id, Customer_Information__c, Customer_Information__r.Name, Customer_Information__r.PersonBirthdate, Application__r.Name, Application__r.Sourcing_Branch__r.Name,
                       Residence_Address_Line_1__c, Residence_City__c, Residence_State__c, Residence_Country__c, Residence_Pincode__r.Name,Customer_Type__c 
                       FROM Loan_Applicant__c
                       WHERE Application__c = :objProp.Application__c
                       ORDER BY Customer_Type__c];
        Integer count = 0;
        for(Loan_Applicant__c objLoan : loanAppList){
            count = count+1;
            ApplicantWrapper objWrap = new ApplicantWrapper();
            objWrap.applicantName = objLoan.Customer_Information__r.Name;
            applicants.add(objWrap);
        } 
        loanApp = getPrimaryApplicant(objProp.Application__c);
    }
    
    public Loan_Applicant__c getPrimaryApplicant(String applicationId){
        Loan_Applicant__c objLoan = [SELECT Id, Customer_Information__c, Customer_Information__r.Name, Customer_Information__r.PersonBirthdate, Application__r.Name,
                                            Application__r.Sourcing_Branch__r.Name,Residence_Address_Line_1__c, Residence_City__c, Residence_State__c, Residence_Country__c,
                                            Residence_Pincode__r.Name,Customer_Type__c,Application__r.Loan_Amount__c,Application__r.Emi_PcAc__c,Application__r.Total_Amount_Recommended_PcAc__c
                                     FROM Loan_Applicant__c
                                     WHERE Application__c = :applicationId AND Customer_Type__c = 'Primary Applicant'];
        return objLoan;
    }
    
    public Property__c getTitleDeedNumber(String recordId){
        return [SELECT Id,Title_Deed_Number__c,Application__c FROM Property__c WHERE Id = :recordId];
    }
    
    public class ApplicantWrapper{
        public String applicantName{get;set;}
    }
   
}