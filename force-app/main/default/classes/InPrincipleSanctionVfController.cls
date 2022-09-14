/**
* @File Name          : InPrincipleSanctionVfController.cls
* @Description        : Apex Controller of InPrinciple Sanction letter Vf & Component
* @Author             : Ajay Kumar
* @Created On         : 12/04/2022
*==============================================================================
* Ver         Date                     Author                 Modification
*==============================================================================
* 1.0         12/04/2022              Ajay Kumar             Initial Version
*             10/05/2022              Ajay Kumar             Make modification in the Mapping of fields with Salesforce Data
*             21/07/2022              Parag Goyal            Added EMI Calculation
*             27/07/2022			  Parag Goyal			 Credit Sanction Loan Amount Calculation
*/

public class InPrincipleSanctionVfController {
    public Verification__c appObj {get;set;} 
    public String CustomerName{get;set;}
    public String GuarantorName{get;set;}
    public String Tenor {get;set;}
    public Decimal ROI {get;set;}
    public String BranchName{get;set;}
    public Decimal EMICalculation{get;set;}
    public Decimal Credit_Sanction_Loan_Amount{get;set;}
    public Decimal Final_Sanction_Amount{get;set;}
    public InPrincipleSanctionVfController(){   
        try{   
            GuarantorName='';
            appObj=[Select Tenor__c,RecordTypeId,ROI__c,Application__r.Pre_Login__c,Application__c,
                    Application__r.Name,BM_Recommended_Amount__c 
                    FROM Verification__c 
                    WHERE RecordTypeId=:Schema.SObjectType.Verification__c.getRecordTypeInfosByName().get('FIV - B').getRecordTypeId()  
                    AND Application__c=:ApexPages.currentPage().getParameters().get('recId')];
            List<Loan_Applicant__c> applicantList=[SELECT Name, Customer_Information__r.Name,Customer_Type__c FROM Loan_Applicant__c Where Application__c=:appObj.Application__c];
            List<Id> loanAppIds = new List<Id>();
            for(Loan_Applicant__c loanObj:applicantList){
                loanAppIds.add(loanObj.Id);
                if(loanObj.Customer_Type__c=='Primary Applicant')
                    CustomerName=loanObj.Customer_Information__r.Name;
                if(loanObj.Customer_Type__c=='Guarantor'){   
                    GuarantorName+=loanObj.Customer_Information__r.Name+',';
                }
            }
            GuarantorName=GuarantorName.removeEnd(',');
            system.debug('>>>Record id>> '+ApexPages.currentPage().getParameters().get('recId'));
            String applicationId = ApexPages.currentPage().getParameters().get('recId');
            BranchName = [SELECT Sourcing_Branch__r.Name FROM Application__c WHERE Id =:applicationId].Sourcing_Branch__r.Name;
            //[SELECT Branch_Master__r.Name FROM Account Where User__c IN(SELECT OwnerId FROM Pre_Login__c WHERE Id=:appObj.Application__r.Pre_Login__c)].Branch_Master__r.Name;

            /**************** Calculation Part Added By Parag Goyal ********************/

            //Formula For EMICalculation (G7*G8)((1+G8)^G9)/(((1+G8)^G9)-1) "G7=Loan Amount G8=ROI G9=Tenure"
            EMICalculation = (appObj.BM_Recommended_Amount__c * (appObj.ROI__c/1200))*(Math.pow(Double.valueOf(1+(appObj.ROI__c/1200)), Integer.valueOf(appObj.Tenor__c)))/(Math.pow(Double.valueOf(1+(appObj.ROI__c/1200)), Integer.valueOf(appObj.Tenor__c))-1);
			System.debug('BFR EMICalculation '+EMICalculation);
            Decimal roundOfEMI = EMICalculation;
            EMICalculation = roundOfEMI.round(System.RoundingMode.CEILING);
			System.debug('EMICalculation '+EMICalculation);
            
            MS_Scheme__c objMS = [SELECT Id,Applicable_LTV__c,Applicable_FOIR__c FROM MS_Scheme__c LIMIT 1];
           
            //Formula For LTV Eligible Loan Amount (Total Collateral Value (FIVC)* Applicable LTV)
            String appId = ApexPages.currentPage().getParameters().get('recId');
            String fivcPropRecTypeId = Schema.SObjectType.Property__c.getRecordTypeInfosByName().get('FIV-C Property Detail').getRecordTypeId();
            Decimal total_Collateral_Value = 0.0;
            List<Property__c> listProp = [SELECT Id,Total_Collateral_Value__c 
                                          FROM Property__c
                                          WHERE RecordTypeId=:fivcPropRecTypeId AND Application__c = :appId];
            for(Property__c objProp : listProp){
                System.debug('objProp.Total_Collateral_Value__c'+objProp.Total_Collateral_Value__c);
                total_Collateral_Value += objProp.Total_Collateral_Value__c;
            }
            System.debug('total_Collateral_Value '+total_Collateral_Value);
            Decimal LTV_Eligible_Loan_Amount = 0.0;
            LTV_Eligible_Loan_Amount = (total_Collateral_Value * (objMS.Applicable_LTV__c/100));
			System.debug('LTV_Eligible_Loan_Amount '+LTV_Eligible_Loan_Amount);
            
            //Formula For Elegible Loan Amount ((((Total Income)*Applicable FOIR)-Other EMI)/Per Lakh EMI)*100000
            String fivcVerRecTypeId = Schema.SObjectType.Verification__c.getRecordTypeInfosByName().get('FIV - C').getRecordTypeId();
            Decimal total_Income = 0.0;
            List<Verification__c> fivc = [SELECT Id,Total_Income__c
                                          FROM Verification__c 
                                          WHERE RecordTypeId=:fivcVerRecTypeId AND Application__c=:appId];
            
            for(Verification__c objVer : fivc){
                System.debug('objVer.Total_Income__c '+objVer.Total_Income__c);
                if(objVer.Total_Income__c != null)
                	total_Income += objVer.Total_Income__c;
            }
            System.debug('total_Income '+total_Income);
            Decimal totalFOIR = (total_Income * (objMS.Applicable_FOIR__c/100));
            System.debug('totalFOIR '+totalFOIR);
            
            List<Loan_Details__c> loanDetailList = [SELECT Id, Obligations__c, Bureau_Highmark__c 
                                                	FROM Loan_Details__c
                                                	WHERE Bureau_Highmark__c IN (SELECT Id
                                                                             FROM Bureau_Highmark__c
                                                                             WHERE Loan_Applicant__c IN :loanAppIds)];
            Decimal totalObligation = 0.0;
            for(Loan_Details__c objLd : loanDetailList){
                totalObligation += objLd.Obligations__c;
            }
            System.debug('totalObligation '+totalObligation);
            Decimal perLakhEMI = (100000 * (appObj.ROI__c/1200))*(Math.pow(Double.valueOf(1+(appObj.ROI__c/1200)), Integer.valueOf(appObj.Tenor__c)))/(Math.pow(Double.valueOf(1+(appObj.ROI__c/1200)), Integer.valueOf(appObj.Tenor__c))-1);
            System.debug('perLakhEMI '+perLakhEMI);
            Decimal totalPart1 = totalFOIR - totalObligation;
            System.debug('totalPart1 '+totalPart1);
            Decimal totalPart2 = totalPart1 == 0 ? 0 : (totalPart1/perLakhEMI);
            System.debug('totalPart2 '+totalPart2);
            Decimal totalPart3 = totalPart2*100000;
            System.debug('totalPart3 '+totalPart3);
            Decimal Elegible_Loan_Amount = 0.0;
            Elegible_Loan_Amount = totalPart3; //(((totalFOIR - totalObligation)/perLakhEMI)*100000); 
            System.debug('Elegible_Loan_Amount '+Elegible_Loan_Amount);
            //Minimum Credit Sanction Loan Amount
            Credit_Sanction_Loan_Amount = 0.0;
            Credit_Sanction_Loan_Amount = (appObj.BM_Recommended_Amount__c<LTV_Eligible_Loan_Amount)?(appObj.BM_Recommended_Amount__c<Elegible_Loan_Amount?appObj.BM_Recommended_Amount__c:Elegible_Loan_Amount):(LTV_Eligible_Loan_Amount<Elegible_Loan_Amount?LTV_Eligible_Loan_Amount:Elegible_Loan_Amount);
            System.debug('Credit_Sanction_Loan_Amount '+Credit_Sanction_Loan_Amount);
            Final_Sanction_Amount = Credit_Sanction_Loan_Amount.round(System.RoundingMode.CEILING);
            System.debug('Final_Sanction_Amount '+Final_Sanction_Amount);
        }
        catch(Exception e){
            System.debug('Exception>>>>>'+e);
            System.debug('Exception>>>>>'+e.getMessage());
            System.debug('Exception>>>>>'+e.getLineNumber());
        }
    }
    
    @AuraEnabled
    public static string SavePdfAsFile(String parentId){
        PageReference pdf = Page.InPrincipleSanctionVf;
        pdf.getParameters().put('recId',parentId);
        Blob body;
        body = pdf.getContentAsPdf();
        ContentVersion cont = new ContentVersion();
        cont.Title = 'InPrincipalSanctionReport.pdf';
        cont.PathOnClient = 'InPrincipalSanctionReport.pdf';
        cont.VersionData = pdf.getContentAsPdf();
        
        insert cont;
        system.debug('contid>>>>'+cont.Id);
        Id contentId=[SELECT ContentDocumentId FROM ContentVersion WHERE Id=:cont.Id].ContentDocumentId;
        ContentDocumentLink conDocLink = New ContentDocumentLink();
        conDocLink.LinkedEntityId =parentId;  
        conDocLink.ContentDocumentId = contentId; 
        conDocLink.shareType = 'V';
        insert conDocLink;
        
        // Commented by Navin Soni on 22-July-2022 as discussed with Atul.
        /*Application__c appObj=new Application__c();
        appObj.Id=parentId;
        appObj.Stage__c='Lead Detail';
        update appObj;*/
        
        
        return 'Pdf Saved Successfully!';
        
    }
}