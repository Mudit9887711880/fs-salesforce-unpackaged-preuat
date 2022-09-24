/**
* @File Name          : FS_DisbursalMemoController.apxc
* @Author             : Neeraj Soni
* @Created On         : 25 August 2022
*==============================================================================
* Ver         Date                     Author                 Modification
*==============================================================================
* 1.0       25 August 2022            Neeraj Soni             Initial Version
*           05/09/2022                Karan Singh             Modification : CH01
**/

public without sharing class FS_DisbursalMemoController {
    
    public Application__c applicationRecord{get;set;}
    public String purpose{get;set;}
    public Decimal grossMonthlyIncome{get;set;}
    public String creditScore{get;set;}
    public String natureOfJob{get;set;}
    public Property__c branchLandDetails{get;set;}
    public Property__c fieldLandDetails{get;set;}
    public Property__c processLandDetails{get;set;}
    public Decimal totalBranchValue{get;set;}
    public Decimal totalFieldValue{get;set;}
    public Decimal totalProcessValue{get;set;}
    public Loan_Applicant__c primaryApplicant{get;set;}
    public Verification__c FIVCverificationRecord{get;set;}
    public Verification__c FIVBverificationRecord{get;set;}
    public Decimal totalIncome{get;set;}
    public Decimal obliations{get;set;}
    public Decimal totalNetIncome{get;set;}
    public String strAllPropertyDistance{get;set;}//CH01
    
    public FS_DisbursalMemoController(){
        Id applicationId = apexpages.currentpage().getparameters().get('id');
        natureOfJob = '';
        totalIncome = 0;
        obliations = 0;
        totalNetIncome = 0;
        strAllPropertyDistance = 'Nil'; //CH01
        List<String> listPropAddrs = new List<String>();//CH01
        applicationRecord = [Select Id, Name, Applicant_Name__c, Branch__c, Loan_Purpose_1__c,LTV_PC__c,DBR_PC__c,AC_Remarks__c,
                             Loan_Purpose_2__c , Legal_Sanction_Condition__c, Emi_PcAc__c,
                             Borrower_s_Risk_Rating__c, LTV__c, DBR__c, Amount_Recommended__c,
                             BM_Recommended_Amount__c, Requested_Loan_Amount__c, Total_Amount_Recommended_PcAc__c,
                             (select id, Customer_Type__c, Applicant_Type__c, Applicant_Name__c from Loan_Applicants__r),
                             (select Id, DBR__c, LTV__c, Total_Income__c, recordtype.name ,BM_Recommended_Amount__c from Verifications__r where recordtype.name IN('FIV - B', 'FIV - C', 'AC')),
                             (select id, Name, Land_Area_Sq_Ft__c, Building_Area_Sq_Ft__c, Final_Land_Value__c, Building_Value__c, recordtype.name,Living_property_Distance_from_Branch__c, Mortgage_property_distance_from_branch__c
                              from Properties__r where recordtype.name IN ('PC Property Detail', 'FIV-C Property Detail', 'FIV-B Property Detail'))
                             from Application__c where id =:applicationId LIMIT 1];
        
        if(applicationRecord != null){
            
            if(applicationRecord.Properties__r != null && applicationRecord.Properties__r.size() > 0){
                
                for(Property__c propertyRec: applicationRecord.Properties__r){
                    if(propertyRec.recordtype.name == 'PC Property Detail'){
                        processLandDetails = propertyRec;
                        totalProcessValue = processLandDetails.Final_Land_Value__c;
                        totalProcessValue += processLandDetails.Building_Value__c;
                    } else if(propertyRec.recordtype.name == 'FIV-C Property Detail'){
                        fieldLandDetails = propertyRec;
                        totalFieldValue = fieldLandDetails.Final_Land_Value__c;
                        totalFieldValue += fieldLandDetails.Building_Value__c;
                        
                        //CH01
                        
                        if(propertyRec.Mortgage_property_distance_from_branch__c <> Null ){
                            
                            listPropAddrs.add( 'Branch to MOD Property ( ' + propertyRec.Name + ' ) : ' + propertyRec.Mortgage_property_distance_from_branch__c );
                        }
                        if(propertyRec.Living_property_Distance_from_Branch__c <> Null ){
                            
                            listPropAddrs.add( 'Branch to Living Property ( ' + propertyRec.Name + ' ) : ' + propertyRec.Living_property_Distance_from_Branch__c );
                        }
                        //CH01 END
                    } else if(propertyRec.recordtype.name == 'FIV-B Property Detail'){
                        branchLandDetails = propertyRec;
                        totalBranchValue = branchLandDetails.Final_Land_Value__c;
                        totalBranchValue += branchLandDetails.Building_Value__c;
                    }
                    
                }
            }
            
            //CH01
            if( !listPropAddrs.isEmpty() ){
                strAllPropertyDistance = String.join( listPropAddrs,'\n' );
            }
            //CH01 END
            if(applicationRecord.Loan_Applicants__r != null && applicationRecord.Loan_Applicants__r.size() > 0 ){
                
                //logic to create map of loan applicant and its capabilities to populate nature of job start
                Set<Id> loanApplicantIds = new Set<Id>();
                Map<Id, List<Capability__c>> applicantCapabilityMap = new Map<Id, List<Capability__c>>();
                for(Loan_Applicant__c applicantRec: applicationRecord.Loan_Applicants__r){
                    loanApplicantIds.add(applicantRec.Id);
                    applicantCapabilityMap.put(applicantRec.Id, new List<Capability__c>());
                }
                List<Capability__c> capabilityRecords = [Select id, Loan_Applicant__c, Loan_Applicant__r.id, Nature_of_Job__c, Gross_Monthly_Income__c, Verification__r.id, Verification__c
                                                         from Capability__c where Loan_Applicant__c IN :loanApplicantIds  ];
                System.debug('capabilityRecords for nature of job '+ capabilityRecords);
                for(Capability__c capabilityRecord: capabilityRecords){
                    if(applicantCapabilityMap.containsKey(capabilityRecord.Loan_Applicant__r.id)){
                        applicantCapabilityMap.get(capabilityRecord.Loan_Applicant__r.id).add(capabilityRecord);
                    }
                }
                //logic to create map of loan applicant and its capabilities to populate nature of job end
                
                Set<String> loanApplicantIdSet = new Set<String>();
                Set<String> bureauHighmarkIdSet = new Set<String>();
                for(Loan_Applicant__c applicantRec: applicationRecord.Loan_Applicants__r){
                    loanApplicantIdSet.add(applicantRec.Id);
                    List<Capability__c> capabilityList = applicantCapabilityMap.get(applicantRec.id);
                    if(natureOfJob != ''){
                        natureOfJob += ', ';
                    }
                    natureOfJob += applicantRec.Applicant_Type__c + ' / ' + applicantRec.Applicant_Name__c;
                    if(capabilityList.size() > 0){
                        natureOfJob += ' / ' + capabilityList.get(0).Nature_of_Job__c + ' / ' + capabilityList.get(0).Gross_Monthly_Income__c;
                    }
                    if(applicantRec.Customer_Type__c == 'Primary Applicant'){
                        primaryApplicant = applicantRec;
                    }
                }
                if(!loanApplicantIdSet.isEmpty()){
                    for(Bureau_Highmark__c highmarkRecord : [SELECT Id,Highmark_Score__c, Loan_Applicant__c, Loan_Applicant__r.id FROM Bureau_Highmark__c WHERE Loan_Applicant__c IN : loanApplicantIdSet]) {
                        bureauHighmarkIdSet.add(highmarkRecord.Id);
                        if(highmarkRecord.Loan_Applicant__r.id == primaryApplicant.id){
                            creditScore = highmarkRecord.Highmark_Score__c;
                        }
                    }
                }
                for(Loan_details__c loanObj:[SELECT Id,Obligations__c,To_be_considerd_for_DBR__c FROM Loan_Details__c WHERE Bureau_Highmark__c IN:bureauHighmarkIdSet])
                {
                    if(loanObj.To_be_considerd_for_DBR__c == 'Yes'){
                        obliations += (loanObj.Obligations__c!=null?loanObj.Obligations__c:0);
                    }
                }
                /*if(primaryApplicant != null){
List<Bureau_Highmark__c> bureau_HighmarkRecords = [select id, Highmark_Score__c, Loan_Applicant__c, Loan_Applicant__r.id from Bureau_Highmark__c where
Loan_Applicant__r.id =:primaryApplicant.id];
//System.debug('capabilityRecord '+ bureau_HighmarkRecord);
if(bureau_HighmarkRecords.size() > 0){
creditScore = bureau_HighmarkRecords.get(0).Highmark_Score__c;
}
}*/
            }
            System.debug('applicationRecord.Verifications__r '+ applicationRecord.Verifications__r.size());
            if(applicationRecord.Verifications__r != null && applicationRecord.Verifications__r.size() > 0 ){
                for(Verification__c verificationRecord: applicationRecord.Verifications__r){
                    System.debug('verificationRecord.recordtype.name '+ verificationRecord.recordtype.name);
                    
                    if(verificationRecord.recordtype.name == 'AC'){
                        
                        List<Capability__c> capabilityRecords = [Select id, Gross_Monthly_Income__c, Verification__r.id, Verification__c
                                                                 from Capability__c where Verification__r.id =:verificationRecord.id LIMIT 1 ];
                        System.debug('capabilityRecord 123 '+ verificationRecord.id + capabilityRecords);
                        if(capabilityRecords.size() > 0){
                            for(Capability__c capabilityRecord: capabilityRecords){
                                totalIncome +=  capabilityRecord.Gross_Monthly_Income__c;
                            }
                            grossMonthlyIncome = capabilityRecords.get(0).Gross_Monthly_Income__c;
                        }
                        
                        //CH01
                        //CH01 END
                    } else if(verificationRecord.recordtype.name == 'FIV - C'){
                        System.debug('verificationRecord total amount '+ verificationRecord.Total_Income__c);
                        FIVCverificationRecord = verificationRecord;
                    } else if(verificationRecord.recordtype.name == 'FIV - B'){
                        FIVBverificationRecord = verificationRecord;
                    }
                }
            }
        }
        if(applicationRecord.Loan_Purpose_1__c != null && applicationRecord.Loan_Purpose_2__c != null){
            purpose = applicationRecord.Loan_Purpose_1__c + ', ' + applicationRecord.Loan_Purpose_2__c;
        } else if(applicationRecord.Loan_Purpose_1__c != null){
            purpose = applicationRecord.Loan_Purpose_1__c;
        } else if(applicationRecord.Loan_Purpose_2__c != null){
            purpose = applicationRecord.Loan_Purpose_2__c;
        } else {
            purpose = '';
        }
    }
    
    @auraEnabled
    public static void saveDisbursalMemoPDF(String applicationId, String stageName){
        System.debug('saveDisbursalMemoPDF called '+ applicationId);
        
        /*PageReference pdfPage = new PageReference('/apex/fs_disbursalMemo');
pdfPage.getParameters().put('id', applicationId);
Blob pdfContent = pdfPage.getContent();

Attachment attach1= new Attachment();
attach1.ParentId = applicationId;
attach1.Name = 'Disbursal Memo';
attach1.Body = pdfContent;
attach1.contentType = 'application/pdf';
insert attach1;
System.debug('attach1 insertred ' + attach1);
*/
        PageReference PDf =  Page.fs_disbursalMemo;//Replace attachmentPDf with the page you have rendered as PDF
        PDf.getParameters().put('id',applicationId);
        PDf.setRedirect(true);
        Attachment attach = new Attachment();
        Blob b ;
        if( Test.isRunningTest() ){
            b = Blob.valueOf('o');
        }else{
            b = PDf.getContent();    
        }
        
        attach.Body = b;
        attach.Name = stageName + '_Disbursal Memo';
        attach.IsPrivate = false;
        attach.ParentId = applicationId;
        insert attach;
    }
}