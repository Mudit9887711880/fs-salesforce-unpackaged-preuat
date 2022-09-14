/*
* ──────────────────────────────────────────────────────────────────────────────────────────────────
* @author           Arnav Chaudhary 
* @modifiedBy       Arnav Chaudhary  
* @created          2022-08-12
* @modified         2022-08-12
* @Description      This class is used to map fields to LoanSanctionVf page.
* ──────────────────────────────────────────────────────────────────────────────────────────────────
*/
public without sharing class LoanSanctionLetterVfController {
    public String applicationId{get;set;}
    
    public String primaryAppName{get;set;}
    public String coAppName{get;set;}
    public String address{get;set;}
    public String gurantorName{get;set;}
    public String relationCoApp{get;set;}
    public String relationGurantor{get;set;}
    public String reasonROI{get;set;}
    public String applicantName{get;set;}
    public String insuranceReq{get;set;}
    public String remarks{get;set;}
    public Account objAcc{get;set;}
    public Application__c objApp{get;set;}
    public Decimal loanAmount{get;set;}
    public Decimal addROI{get;set;}
    public Decimal roiAdvEmi{get;set;}
    public Decimal finalAdvEmi{get;set;}
    public Decimal repaymentTenure{get;set;}
    public Decimal monthlyEMI{get;set;}
    public Decimal insured{get;set;}
    public Decimal legalFee{get;set;}
    public Decimal processingFee{get;set;}
    public Decimal checqueCharges{get;set;}
    public Decimal collectionCharges{get;set;}    
        
    public LoanSanctionLetterVfController(){
        applicationId = Apexpages.currentPage().getParameters().get('id');
        System.debug('ID ' + applicationId);
        try{
            if(String.isNotBlank(applicationId)){
                objApp = [SELECT Id,Name,Emi_PcAc__c,Customer_Communicated__c,Effective_IRR__c,Number_of_advance_EMI__c,Loan_Purpose_1__c,Nach_Party__c,Total_Amount_Recommended_PcAc__c,Tenor_In_Months__c,
                          (SELECT Loan_Amount_Sanctioned__c,Additional_Rate_of_Interest_if_app__c, ROI_including_advance_EMI__c, Fnl_annu_ROI_incl_adv_EMI__c,
                           Reason_for_add_l_ROI_if_appl__c,Repayment_Tenure__c,Monthly_Installment_EMI_Rs__c FROM Disbursals__r),Tenure_Requested__c,Legal_Sanction_Condition__c
                           FROM 
                           Application__c 
                           WHERE 
                           Id=: applicationId];
                System.debug('App' + objApp);
                System.debug('opp' + objApp.Disbursals__r);
                if(objApp.Disbursals__r.size() == 0){
                    //    loanAmount = 0;
                    addRoi = 0;
                    roiAdvEmi = 0;
                    finalAdvEmi = 0;
                    reasonROI ='';
                    repaymentTenure=0;
                    monthlyEMI = 0;
                    System.debug('loan1'+ loanAmount);
                }else{
                    //   loanAmount = objApp.Disbursals__r[0].Loan_Amount_Sanctioned__c;
                    addRoi = objApp.Disbursals__r[0].Additional_Rate_of_Interest_if_app__c;
                    roiAdvEmi = objApp.Disbursals__r[0].ROI_including_advance_EMI__c;
                    finalAdvEmi = objApp.Disbursals__r[0].Fnl_annu_ROI_incl_adv_EMI__c;
                    reasonROI = objApp.Disbursals__r[0].Reason_for_add_l_ROI_if_appl__c;
                    repaymentTenure = objApp.Disbursals__r[0].Repayment_Tenure__c;
                    monthlyEMI = objApp.Disbursals__r[0].Monthly_Installment_EMI_Rs__c;
                    //     System.debug('loan2'+ loanAmount);
                }
                
                List <Loan_Applicant__c> loanList =[SELECT Id,Application__c,Customer_Information__r.Name,Customer_Type__c,Residence_Address_Line_1__c 
                                                    FROM 
                                                    Loan_Applicant__c Where Application__c=: applicationId 
                                                    AND
                                                    Customer_Type__c = 'Primary Applicant'];
                System.debug('Loan List'+ loanList);
                if(loanList.size() == 0){
                    address = '';
                    primaryAppName = '';
                    System.debug('primary' + primaryAppName);
                }else {
                    if(loanList[0].Customer_Information__r.Name != null && loanList[0].Customer_Information__r.Name != ''){
                        primaryAppName = loanList[0].Customer_Information__r.Name;
                    }
                    if(loanList[0].Residence_Address_Line_1__c != null && loanList[0].Residence_Address_Line_1__c != ''){
                        address = loanList[0].Residence_Address_Line_1__c ;
                        System.debug('name' + primaryAppName);
                    }
                }
                List <Loan_Applicant__c> loanList2 =[SELECT Id,Application__c,Customer_Information__r.Name,Customer_Type__c,
                                                     (SELECT Relationship__c, RecordType.DeveloperName, Section_Type__c 
                                                      FROM Characters__r WHERE (RecordType.DeveloperName = 'AC_Character' OR RecordType.DeveloperName = 'PC_Character') 
                                                      AND Section_Type__c = 'Family Detail') 
                                                      FROM 
                                                      Loan_Applicant__c Where Application__c=: applicationId 
                                                      AND 
                                                      Customer_Type__c = 'Co-Applicant'];
                System.debug('Loan List2'+ loanList2);
                if(loanList2.size() == 0){
                    coAppName = '';
                    relationCoApp ='';
                    
                }
                else { 
                    coAppName = '';
                    for(Loan_Applicant__c loan : loanList2){
                        coAppName += loan.Customer_Information__r.Name;
                        coAppName += ',';
                        System.debug('coAppname ' + coAppName);
                    }
                    coAppName = coAppName.removeEnd(',');
                    relationCoApp ='';
                    for(Loan_Applicant__c loan : loanList2){
                        for(Character__c charact : loan.Characters__r){
                            relationCoApp += charact.Relationship__c;
                            relationCoApp += ','; 
                            System.debug('charrelation' + relationCoApp);
                        } 
                    }
                    relationCoApp += relationCoApp.removeEnd(',');
                }
                System.debug('coName'+ coAppName); 
                System.debug('charrelation' + relationCoApp);
                
                List <Loan_Applicant__c> loanList3 =[SELECT Id,Application__c,Customer_Information__r.Name,Customer_Type__c,
                                                     (SELECT Relationship__c, RecordType.DeveloperName, Section_Type__c 
                                                      FROM Characters__r WHERE (RecordType.DeveloperName = 'AC_Character' OR RecordType.DeveloperName = 'PC_Character')
                                                      AND Section_Type__c = 'Family Detail')  
                                                      FROM Loan_Applicant__c Where Application__c=: applicationId
                                                      AND Customer_Type__c = 'Guarantor'];
                System.debug('Loan List3' + loanList3);
                if(loanList3.size() == 0){
                    gurantorName = '';
                    relationGurantor ='';
                }
                else {
                    gurantorName = '';
                    for(Loan_Applicant__c loan : loanList3){
                        gurantorName += loan.Customer_Information__r.Name;
                        gurantorName += ',';
                    }
                    gurantorName = gurantorName.removeEnd(',');
                    System.debug('gurantor name' + gurantorName);
                    
                    relationGurantor ='';
                    for(Loan_Applicant__c loan1 : loanList3){
                        System.debug('loan1' + loan1.Characters__r);
                        for(Character__c charac : loan1.Characters__r){
                            if(charac.Relationship__c != null){
                                relationGurantor += charac.Relationship__c; 
                                relationGurantor += ',';
                                System.debug('char' + charac.Relationship__c);
                                System.debug('charrelation' + relationGurantor);
                            }
                        }
                        
                        //     relationGurantor += loan1.Characters__r[0].Relationship__c;
                    }
                    relationGurantor = relationGurantor.removeEnd(',');
                    
                }
                System.debug('gurantorName'+ gurantorName);
                
                List<Receipt__c> receiptList =[SELECT Id,Amount__c,Application__c FROM Receipt__c WHERE Application__c =: applicationId];
                System.debug('Receipt List'+ receiptList);
                if(receiptList.size() == 0){
                    insured = 0;
                } else if(receiptList[0].Amount__c != null){
                    insured = receiptList[0].Amount__c;
                    System.debug('insured'+ insured);
                }
                List<Disbursal__c> insuranceList = [SELECT Id, Name, Application__c, (SELECT Insurance_Requirement__c FROM Insurance_Details__r) 
                                                    FROM Disbursal__c 
                                                    WHERE Application__c=: applicationId];
                System.debug('Insurance List' + insuranceList);
                if(insuranceList.size() == 0){
                    insuranceReq = '';
                }else if(insuranceList[0].Insurance_Details__r.size() != 0){
                    if(insuranceList[0].Insurance_Details__r[0].Insurance_Requirement__c != null && insuranceList[0].Insurance_Details__r[0].Insurance_Requirement__c != '')
                        insuranceReq = insuranceList[0].Insurance_Details__r[0].Insurance_Requirement__c;
                    System.debug('Insurancereq'+ insuranceReq);
                }
                
                List<Sanction_Condition__c> sanctionConditionList = [SELECT Id, Application__c, Other_Condition__c, Print_In_Sanction_Letter__c, Remark__c, MsSanctionCondition__c
                                                                     FROM Sanction_Condition__c 
                                                                     WHERE Application__c = : applicationId];
                if(sanctionConditionList.size() == 0){
                    remarks = '';
                }else{
                    remarks = '';
                    for(Sanction_Condition__c sanction : sanctionConditionList){
                        if(sanction.Other_Condition__c == 'Yes' && sanction.Print_In_Sanction_Letter__c == 'Yes'){
                            remarks += sanction.Remark__c;
                            remarks += ',';
                            System.debug('remark1' + remarks);
                        }else {
                            if(sanction.Other_Condition__c == 'No' && sanction.Print_In_Sanction_Letter__c == 'Yes'){
                                remarks += sanction.MsSanctionCondition__c;
                                remarks += ',';
                                System.debug('remark2' + remarks);
                            }
                            
                        }
                    }remarks = remarks.removeEnd(',');
                }
                
                List<Fee_Creation__c> feeCreationList = [SELECT Id, Name, Premium__c, Sum_Assured__c, Type__c, Fee_Amount__c, Total_Fee__c, Stage_Due__c, Fee_Collection__c, Application__c, Fee_Code__c, Tax_Amount__c
                                                         FROM Fee_Creation__c 
                                                         WHERE Application__c =: applicationId 
                                                         AND Stage_Due__c = 'PC'];
    //            List<Fee_Value_Master__c> feeValueList = [SELECT Id, Name, Fee_Type_Master__c, Fee_Type_Code__c, Amount__c FROM Fee_Value_Master__c WHERE Fee_Type_Code__c =: feeCreationList.Fee_Code__c];
                if(feeCreationList.size() == 0){
                    legalFee = 0;
                    processingFee = 0;
                    checqueCharges = 0;
                    collectionCharges = 0;
                }else{
                    legalFee = 0;
                    processingFee = 0;
                    checqueCharges = 0;
             //       collectionCharges = 0;
                    for(Fee_Creation__c fee : feeCreationList){
                        if(fee.Fee_Code__c == 'LegaL'){
                            legalFee = fee.Total_Fee__c;
                        }else if(fee.Fee_Code__c == 'PRC_FEE_Type'){
                            processingFee = fee.Total_Fee__c;
                        }else if(fee.Fee_Code__c == 'Cersai'){
                            checqueCharges = fee.Total_Fee__c;
                        }
                    }
                    collectionCharges = feeCreationList[0].Fee_Collection__c;
                    System.debug('collection '+ collectionCharges);
                }
            }
        }catch(Exception e){
            System.debug('Error msg 1'+e.getMessage()+'----->'+e.getLineNumber());
        }
    }
}