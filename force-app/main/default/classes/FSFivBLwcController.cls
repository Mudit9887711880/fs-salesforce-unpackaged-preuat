/**
* @File Name          : FSFivBLwcController.cls
* @Description        : Service Class For FIV-B Lightning Web Component
* @Author             : Yogendra Degra
* @Created On         : 13/04/2022
*==============================================================================
* Ver         Date                     Author                 Modification
*==============================================================================
* 1.0         13/04/2022              Yogendra Degra       Initial Version
*/
public class FSFivBLwcController extends GenericDataTableController {
    @AuraEnabled
    public static string saveRecord(sobject dataToInsert){
        try{
            system.debug('dataToInsert=' + dataToInsert);
            upsert dataToInsert;
        } catch(Exception ex){
            System.debug('exception ::: '+ex);
            return JSON.serialize(ex);
        }
        return 'Operation Completed Successfully.';  
    }
    @AuraEnabled
    public static GenericFormBuilderController.InitWrapper getSectionContent(String recordIds, String metaDetaName){
        GenericFormBuilderController obj = new GenericFormBuilderController();
        obj.METADATA_NAME = metaDetaName;
        obj.IDS_SET = new Set<String>();
        if(String.isNotEmpty(recordIds)){
            obj.IDS_SET = new Set<String>();
            obj.IDS_SET.addAll(recordIds.split('_'));
            obj.WHERE_CLAUSE = ' Id IN : IDS_SET';
            obj.RECORD_LIMIT = '1';    
        }
        return obj.initialize();
    }   
    @AuraEnabled
    public static GenericDataTableController.DataTableResponse getAllApplicantMeta(String applicationId){
        GenericDataTableController genericDTObj = new GenericDataTableController();
        genericDTObj.METADATA_NAME = 'FS_All_Applicant';
        genericDTObj.IDS_SET = new Set<String>();
        genericDTObj.IDS_SET.add(applicationId);
        genericDTObj.WHERE_CLAUSE='Application__c IN : IDS_SET';
        return genericDTObj.getTable(); 
    }
    @AuraEnabled
    public static Verification__c getVerificationRecord(String verificationId){
        return [SELECT Id, BM_Recommended_Amount__c FROM Verification__c WHERE Id =: verificationId];    
    }
    @AuraEnabled
    public static List<Loan_Applicant__c> getApplicantData(String applicationId){
        List<Loan_Applicant__c> listOfApplicant = new List<Loan_Applicant__c>();
        System.debug('appId'+applicationId);
        if(String.isNotBlank(applicationId)){
            createVerificationRecord(applicationId, 'FIV_B_Table_Caseflow');
            String recordTypeId = Schema.getGlobalDescribe().get('Property__c').getDescribe().getRecordTypeInfosByName().get('FIV-B Property Detail').getRecordTypeId();
            listOfApplicant = [SELECT Id, Name, Application__r.Name, Application__r.Requested_Loan_Amount__c, Application__r.Staff_Loan__c, Application__r.Pre_Login__c, Application__r.Pre_Login__r.Owner.Name, Application__c, Customer_Information__c, Customer_Information__r.Name, Customer_Type__c,
                               (SELECT Id, Name FROM Properties__r WHERE RecordType.Name = 'FIV-B Property Detail')
                               FROM Loan_Applicant__c WHERE Application__c =: applicationId];
        }
        return listOfApplicant;
    }
    
    @AuraEnabled
    public static GenericDataTableController.DataTableResponse getCashflowData(List<String> allLoanApplicant){
        System.debug('allLoanApplicant >>>> '+allLoanApplicant);
        /* fetch data from cashflow */ 
        GenericDataTableController genericDTObj = new GenericDataTableController();
        genericDTObj.METADATA_NAME = 'FIV_B_Table_Caseflow';
        genericDTObj.IDS_SET = new Set<String>();
        genericDTObj.IDS_SET = new Set<String>(allLoanApplicant);
        genericDTObj.WHERE_CLAUSE=' Loan_Applicant__c IN : IDS_SET';
        return genericDTObj.getTable(); 
    }
    @AuraEnabled
    public static GenericDataTableController.DataTableResponse getPropertyData(String applicationId){
        System.debug('appId #### '+applicationId);
        /* fetch data from collateral */ 
        GenericDataTableController genericDTObj = new GenericDataTableController();
        genericDTObj.METADATA_NAME = 'FIV_B_Table_Property';
        genericDTObj.IDS_SET = new Set<String>();
        genericDTObj.IDS_SET.add(applicationId);
        String rcId = Schema.getGlobalDescribe().get('Property__c').getDescribe().getRecordTypeInfosByName().get('FIV-B Property Detail').getRecordTypeId();
        genericDTObj.IDS_SET.add(rcId);
        genericDTObj.WHERE_CLAUSE = ' Application__c IN : IDS_SET AND RecordTypeId IN : IDS_SET';
        //genericDTObj.WHERE_CLAUSE='Id IN : IDS_SET'; 
        System.debug('result >>>>> '+genericDTObj.getTable());
        return genericDTObj.getTable();
    }
    
    @AuraEnabled
    public static GenericDataTableController.DataTableResponse getCharacterData(List<String> allLoanApplicant){
        /* fetch data from character */ 
        GenericDataTableController genericDTObj = new GenericDataTableController();
        genericDTObj.METADATA_NAME = 'FIV_B_Table_Character';
        genericDTObj.IDS_SET = new Set<String>();
        genericDTObj.IDS_SET = new Set<String>(allLoanApplicant);
        String rcId = Schema.getGlobalDescribe().get('Character__c').getDescribe().getRecordTypeInfosByName().get('FIV-B Character').getRecordTypeId();
        genericDTObj.IDS_SET.add(rcId);
        genericDTObj.WHERE_CLAUSE=' Loan_Applicant__c IN : IDS_SET AND RecordTypeId IN : IDS_SET';
        return genericDTObj.getTable();
    }
    @AuraEnabled
    public static List<ROI_Master__c> getROIRecord(String applicationId, Boolean isStaffLoan){
        String riskDocument = 'Green';
        String propertyType = 'Flat';
        Set<String> propertyTypeSet = new Set<String>();
        Set<String> riskDocumentSet = new Set<String>();
        for(Property__c objPro :[SELECT Id, Property_Type__c, Risk_Document__c FROM Property__c WHERE Application__c =: applicationId AND RecordType.Name = 'FIV-B Property Detail' Order by Risk_Document__c ASC]){
            propertyTypeSet.add(objPro.Property_Type__c);
            riskDocumentSet.add(objPro.Risk_Document__c);
        }
        if(propertyTypeSet.contains('Vacant')){
            propertyType = 'Vacant';
        }
        if(riskDocumentSet.contains('Red')){
            riskDocument = 'Red';
        } 
        if(!riskDocumentSet.contains('Red') && riskDocumentSet.contains('Orange')){
            riskDocument = 'Orange';
        }
        System.debug('propertyType #### '+propertyType);
        List<ROI_Master__c> roiRecords = [SELECT Id, Is_Staff_Loan__c, Property_Type__c, 
                                          Risk_Document__c, Tenure__c, ROI__c FROM ROI_Master__c WHERE Is_Staff_Loan__c =: isStaffLoan AND 
                                          Property_Type__c =: propertyType AND Risk_Document__c =: riskDocument 
                                         ];  
        return roiRecords;
    }
    @AuraEnabled
    public static WrapperCalculation getAllCalculationRecords(String applicationId){
        WrapperCalculation wrapper = new WrapperCalculation();
        Set<String> setOfLoanApplicantId = new Set<String>();
        
        if(String.isNotBlank(applicationId)){
            for(Loan_Applicant__c objLoan : [SELECT Id, Name, Application__c FROM Loan_Applicant__c WHERE Application__c =: applicationId]){
                setOfLoanApplicantId.add(objLoan.Id);	    
            }    
        } 
        System.debug('setOfLoanApplicantId ### '+setOfLoanApplicantId);
        if(setOfLoanApplicantId != null && setOfLoanApplicantId.size() > 0){
            for(Cashflow__c objCash : [SELECT Net_Income__c, Loan_Applicant__c FROM Cashflow__c WHERE Loan_Applicant__c IN: setOfLoanApplicantId]){
                if(objCash.Net_Income__c != null){            
                    wrapper.TNI += objCash.Net_Income__c;
                }    
            }
        }
        for(Property__c objPro : [SELECT Id, Total_Value__c FROM Property__c WHERE Application__c =: applicationId]){
            if(objPro.Total_Value__c != null){
            	wrapper.TPV += objPro.Total_Value__c;
            }    
        }
        return wrapper;
    }
    @AuraEnabled
    public static Verification__c getVerificationData(String applicationId){
        String recordTypeId = Schema.getGlobalDescribe().get('Verification__c').getDescribe().getRecordTypeInfosByName().get('FIV - B').getRecordTypeId();
        return [SELECT Id, FIV_B_Position__c, Customer_Request_Amount__c, BM_Recommended_Amount__c, Application__c, Purpose__c, Category__c, ROI__c, Tenor__c, Inspection_Time__c, Submission_Date__c, Name__c, Remarks__c, Inspection_Date__c, Sourcing_Officer__c, BM_Comments_for_Overall_Summary__c FROM Verification__c WHERE Application__c =: applicationId AND RecordTypeId =: recordTypeId LIMIT 1];
        
    }
    @AuraEnabled
    public static void createVerificationRecord(String applicationId, String fivBPosition){
        String recordTypeId = Schema.getGlobalDescribe().get('Verification__c').getDescribe().getRecordTypeInfosByName().get('FIV - B').getRecordTypeId();
        List<Verification__c> listOfVerification = [SELECT Id, Application__c, RecordTypeId, FIV_B_Position__c FROM Verification__c WHERE Application__c =: applicationId AND RecordTypeId =: recordTypeId LIMIT 1];
        if(listOfVerification != null && listOfVerification.size() > 0){
            listOfVerification[0].FIV_B_Position__c = fivBPosition;
            update listOfVerification;
        } else{
            Verification__c objVer = new Verification__c();
            objVer.Application__c = applicationId;
            objVer.RecordTypeId = recordTypeId;
            objVer.FIV_B_Position__c = fivBPosition;
            insert objVer;
        }
    }
    @AuraEnabled
    public static string generatePublicLink(String contentVersionId){
        try{
            ContentVersion cv = [SELECT Id, ContentDocumentId, Title, FileType, FileExtension, ContentSize FROM ContentVersion WHERE Id =:contentVersionId AND FileExtension IN ('jpg','jpeg','png','tiff','tif') LIMIT 1];
            cv.Uploaded_From__c = 'FIV-B';
            update cv;
            System.debug('cv'+cv);
            ContentDistribution cd = new ContentDistribution();
            cd.Name = cv.Title;
            cd.ContentVersionId = cv.id;
            cd.PreferencesAllowViewInBrowser= true;
            cd.PreferencesLinkLatestVersion=true;
            cd.PreferencesNotifyOnVisit=false;
            cd.PreferencesPasswordRequired=false;
            cd.PreferencesAllowOriginalDownload= true;
            insert cd;
            return 'success';
        }catch(Exception ex){
            throw new AuraHandledException(ex.getMessage());
        }
    }
    public class Wrapper{
        @AuraEnabled
        public Map<String,List<Property__c>> mapOfProperty;
        @AuraEnabled
        public List<Account> listOfApplicant;
        @AuraEnabled
        public String preLoginId;
        @AuraEnabled
        public String preLoginOwnerName;
        
        public Wrapper(){
            mapOfProperty = new Map<String,List<Property__c>>();
            listOfApplicant = new List<Account>();
            preLoginId = '';
            preLoginOwnerName = '';
        }
    }
    public class WrapperCalculation{
        @AuraEnabled
        public Decimal TNI;
        @AuraEnabled
        public Decimal TPV;
        public WrapperCalculation(){
        	TNI = 0;
            TPV = 0;
        }
    }
}