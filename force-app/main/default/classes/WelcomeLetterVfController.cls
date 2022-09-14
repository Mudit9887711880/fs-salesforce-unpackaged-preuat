public without sharing class WelcomeLetterVfController {
    public String applicationId{get;set;}
    public String applicantName{get;set;}
    public String pinCode{get;set;}
    public String mobile{get;set;}
    public String State{get;set;}
    public String district{get;set;}
    public String plotno{get;set;}
    public String address{get;set;}
    public String loanAccNo{get;set;}
    public String branchName{get;set;}
    public String tenureofloan{get;set;}
    public Decimal emi{get;set;}
    public String dueDate{get;set;}
    public String ckycNo{get;set;}
    public String typeOfIntrest{get;set;}
    public String fnlAnnlROI{get;set;}
    public String loanAMt{get;set;}
    public String legalCharges{get;set;}
    public String procFee{get;set;}
    public String insurancePrem{get;set;}
    public String firstEmiDate{get;set;}
    public String disbursalAmt{get;set;}
    public String advanceEmiAmt{get;set;}
    public String totalCharges{get;set;}
    public String directReceiptCharges{get;set;}
    public String totalothercharges{get;set;}
    public Decimal retainedAmt{get;set;}
    public Decimal totalfinalcharge{get;set;}

    public WrpClass wrpObj{get;set;}

    public WelcomeLetterVfController() {
        wrpObj = new WrpClass();
        wrpObj.feeDirectReceipt = new List<DirectReceipt>();
        wrpObj.feeDeductfromDisbursement = new List<DeductfromDisbursement>();
        wrpObj.listOfLoanApp = new List<LoanApp>();
        wrpObj.proccamtdisbList = new List<disbProcssAmt>();
        wrpObj.legalamtdisbList = new List<disbLegalAmt>();
        wrpObj.storageamtdisbList = new List<disbstorageAmt>();
        wrpObj.rtgsamtdisbList = new List<disbrtgsAmt>();
        wrpObj.docamtdisbList = new List<disbdocAmt>();


        Decimal otherCharges=0;
        Decimal totalSumCharges=0;
        Decimal directrecSum=0;
        boolean istrue=false;
        Decimal amtRetained=0;
        Decimal finalsancamt=0;
        boolean ischeck=false;

        retainedAmt=amtRetained;
        applicationId = Apexpages.currentPage().getParameters().get('id');

        for(Loan_Applicant__c obj : [select Id,Residence_Pincode__r.Pincode__c,Application__r.Number_of_advance_EMI__c,CKYC_ID_Number__c,Application__r.Loan_Amount__c,Application__r.EMI__c,Application__r.Tenor_In_Months__c,Application__r.Sourcing_Branch__r.Name,Application__r.LMS_Response_Reference__c,Mobile__c,Residence_Address_Line_1__c,Residence_District__c,Residence_State__c,Residence_Pincode__c,Residence_Flat_Plot_Number__c,Application__c,Customer_Type__c,Applicant_Name__c from  Loan_Applicant__c where Application__c=:applicationId]){  
            if(obj.Customer_Type__c =='Primary Applicant'){
                applicantName=obj.Applicant_Name__c;
                pinCode=obj.Residence_Pincode__r.Pincode__c;
                address=obj.Residence_Address_Line_1__c;
                plotno=obj.Residence_Flat_Plot_Number__c;
                mobile=obj.Mobile__c;
                State=obj.Residence_State__c;
                district=obj.Residence_District__c;
                loanAccNo=obj.Application__r.LMS_Response_Reference__c;
                branchName=obj.Application__r.Sourcing_Branch__r.Name;
                tenureofloan=obj.Application__r.Tenor_In_Months__c;
                emi=obj.Application__r.EMI__c;
                ckycNo=obj.CKYC_ID_Number__c;
                //disbursalAmt=String.valueOf(obj.Application__r.Loan_Amount__c);
            }else{
                LoanApp loanObj = new LoanApp();
                loanObj.applicantName = String.valueOf(obj.Applicant_Name__c);
                loanObj.ckycNo = String.valueOf(obj.CKYC_ID_Number__c);
                wrpObj.listOfLoanApp.add(loanObj);
            }

            if(obj.Application__r.Number_of_advance_EMI__c!=null && obj.Application__r.EMI__c!=null && istrue==false){
                advanceEmiAmt = String.valueOf((Decimal.valueOf(obj.Application__r.Number_of_advance_EMI__c)) *(obj.Application__r.EMI__c));
                totalSumCharges+=Decimal.valueOf(advanceEmiAmt);
                istrue=true;
            }


        }
      


        for(Disbursal__c disbObj : [select Id,Final_Disbursal_Amount__c,First_Installment_Date__c,Loan_Amount_Sanctioned__c,Due_Date__c,Fnl_annu_ROI_incl_adv_EMI__c,Application__c from Disbursal__c where Application__c=:applicationId]){
            dueDate=String.valueOf(disbObj.Due_Date__c).removeEnd(' 00:00:00');
            fnlAnnlROI=String.valueOf(disbObj.Fnl_annu_ROI_incl_adv_EMI__c);
            loanAMt=String.valueOf(disbObj.Loan_Amount_Sanctioned__c);
            firstEmiDate=String.valueOf(disbObj.First_Installment_Date__c);
            disbursalAmt=String.valueOf(disbObj.Final_Disbursal_Amount__c);
            if(disbObj.Loan_Amount_Sanctioned__c!=null && ischeck==false){
                finalsancamt=disbObj.Loan_Amount_Sanctioned__c;
                ischeck=true;
            }
            
        }


     /*   for(MS_Scheme__c msObj : [select Id,Type_Of_Interest__c from MS_Scheme__c LIMIT 1]){
            typeOfIntrest=msObj.Type_Of_Interest__c;
        }*/

        for(Fee_Creation__c feeObj : [select Id,Repayment_Type_2__c,Fee_Code__c,Total_Fee__c from Fee_Creation__c where Application__c=:applicationId]){
            if((feeObj.Fee_Code__c=='LegaL' && (feeObj.Repayment_Type_2__c=='Direct Receipt'))){
                if(feeObj.Total_Fee__c!=null){
                    directrecSum+=feeObj.Total_Fee__c;
                    DirectReceipt fdrObj = new DirectReceipt();
                    fdrObj.Legalamt = String.valueOf(feeObj.Total_Fee__c);
                    wrpObj.feeDirectReceipt.add(fdrObj);
                }

            }else if((feeObj.Fee_Code__c=='PRC_FEE_Type') && (feeObj.Repayment_Type_2__c=='Direct Receipt')){
                if(feeObj.Total_Fee__c!=null){
                    directrecSum+=feeObj.Total_Fee__c;
                    DeductfromDisbursement dfdObj = new DeductfromDisbursement();
                    dfdObj.processFee = String.valueOf(feeObj.Total_Fee__c);
                    wrpObj.feeDeductfromDisbursement.add(dfdObj);
                }
            }

            

            if((feeObj.Fee_Code__c=='LegaL' && (feeObj.Repayment_Type_2__c=='Deduct from Disbursement'))){
                if(feeObj.Total_Fee__c!=null){
                    totalSumCharges+=feeObj.Total_Fee__c;
                    disbLegalAmt dislegalObj = new disbLegalAmt();
                    dislegalObj.legalamtdisb = String.valueOf(feeObj.Total_Fee__c);
                    wrpObj.legalamtdisbList.add(dislegalObj);                    
                }
                
            }else if((feeObj.Fee_Code__c=='PRC_FEE_Type') && (feeObj.Repayment_Type_2__c=='Deduct from Disbursement')){
                if(feeObj.Total_Fee__c!=null){
                    totalSumCharges+=feeObj.Total_Fee__c;
                    disbProcssAmt disObj = new disbProcssAmt();
                    disObj.proccamtdisb = String.valueOf(feeObj.Total_Fee__c);
                    wrpObj.proccamtdisbList.add(disObj);
                }
            }else if((feeObj.Fee_Code__c=='Cersai') && (feeObj.Repayment_Type_2__c=='Deduct from Disbursement')){
                if(feeObj.Total_Fee__c!=null){
                    totalSumCharges+=feeObj.Total_Fee__c; 
                    disbstorageAmt storageObj = new disbstorageAmt();
                    storageObj.storageamtdisb = String.valueOf(feeObj.Total_Fee__c);
                    wrpObj.storageamtdisbList.add(storageObj);
                }
            }else if((feeObj.Fee_Code__c=='Technical') && (feeObj.Repayment_Type_2__c=='Deduct from Disbursement')){
                if(feeObj.Total_Fee__c!=null){
                    totalSumCharges+=feeObj.Total_Fee__c;
                    disbrtgsAmt rtgsObj = new disbrtgsAmt();
                    rtgsObj.rtgsamtdisb = String.valueOf(feeObj.Total_Fee__c);
                    wrpObj.rtgsamtdisbList.add(rtgsObj);
                }
            }else if((feeObj.Repayment_Type_2__c=='Deduct from Disbursement')){
                if(feeObj.Total_Fee__c!=null){
                    otherCharges+=feeObj.Total_Fee__c;
                    totalSumCharges+=otherCharges;
                   // disbdocAmt docObj = new disbdocAmt();
                   // docObj.docamtdisb = String.valueOf(otherCharges);
                   // wrpObj.docamtdisbList.add(docObj);
                }
            }
        }
        totalothercharges=String.valueOf(otherCharges);
        directReceiptCharges=String.valueOf(directrecSum);

        for(Receipt__c recbj : [select Id,Amount__c,Application__c from Receipt__c where Application__c=:applicationId]){
            if(recbj.Amount__c!=null){
                insurancePrem=String.valueOf(recbj.Amount__c);
                totalSumCharges+=recbj.Amount__c;
            }   
        }

        totalCharges=String.valueOf(totalSumCharges);
        Decimal finalcharge=0;
        finalcharge=finalsancamt-Decimal.valueOf(totalCharges)-amtRetained;
        totalfinalcharge=finalcharge;

    }

    public class WrpClass{
        public List<DirectReceipt> feeDirectReceipt{get;set;}
        public List<DeductfromDisbursement> feeDeductfromDisbursement{get;set;}
        public List<LoanApp> listOfLoanApp{get;set;}
        public List<disbProcssAmt> proccamtdisbList{get;set;}
        public List<disbLegalAmt> legalamtdisbList{get;set;}
        public List<disbstorageAmt> storageamtdisbList{get;set;}
        public List<disbrtgsAmt> rtgsamtdisbList{get;set;}
        public List<disbdocAmt> docamtdisbList{get;set;}
    }

    public class disbProcssAmt{
        public String proccamtdisb{get;set;}
    }
    public class disbLegalAmt{
        public String legalamtdisb{get;set;}
    }
    public class disbstorageAmt{
        public String storageamtdisb{get;set;}
    }
    public class disbrtgsAmt{
        public String rtgsamtdisb{get;set;}
    }
    public class disbdocAmt{
        public String docamtdisb{get;set;}
    }
    public class DirectReceipt{
        public String Legalamt{get;set;}
    }
    public class DeductfromDisbursement{
        public String processFee{get;set;}
    }
    public class LoanApp{
        public String applicantName{get;set;}
        public String ckycNo{get;set;}
    }

}