/**
* @File Name          : FsLeadDetailsController.cls
* @Description        : Service Class For FS Lead Details Lightning Web Component
* @Author             : Yogendra Degra
* @Created On         : 22/06/2022
*==============================================================================
* Ver         Date                     Author                 Modification
*==============================================================================
* 1.0         22/06/2022              Yogendra Degra       Initial Version
*/
public class FsLeadDetailsController extends GenericFormBuilderController{
    @AuraEnabled
    public static List<Application__c> getAllLoanApplicant(String applicationId){
        String VERIFICATION_PC_RECORD_TYPE_ID = Schema.SObjectType.Verification__c.getRecordTypeInfosByName().get('PC').getRecordTypeId();
        List<Application__c> listOfApplication = new List<Application__c>(); 
        if(String.isNotBlank(applicationId)){
            listOfApplication = [SELECT Id, Name, Pre_Login__c, Pre_Login__r.RecordType.Name,
                                 (SELECT Id, Name, RecordTypeId, RecordType.Name FROM Verifications__r WHERE RecordTypeId =: VERIFICATION_PC_RECORD_TYPE_ID LIMIT 1),
                                 (SELECT Id, Application__r.Requested_Loan_Amount__c, Name, Customer_Type__c, 
                                  Customer_Information__r.FirstName, Customer_Information__r.LastName, Customer_Information__c,
                                  Customer_Information__r.Name, Customer_Information__r.Customer_Type__c FROM Loan_Applicants__r) FROM Application__c WHERE Id =:applicationId];    
        }
        return listOfApplication;
    }
    @AuraEnabled
    public static GenericFormBuilderController.InitWrapper getSectionContent(String recordIds, String metaDetaName){
        FsLeadDetailsController obj = new FsLeadDetailsController();
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
    public static String saveRecord(sobject dataToInsert){
        try{
            system.debug(':::dataToInsert:::' + dataToInsert);
            upsert dataToInsert;
            //Database.SaveResult sr = Database.upsert(dataToInsert);
            //database.insert(fieldlist);
            //Bank_Detail__c objLoan = (Bank_Detail__c)JSON.deserialize(fieldlist, Bank_Detail__c.class);
            //System.debug('objLoan '+objLoan);
            //insert objLoan;
            //return objLoan.id;
            
        } catch(Exception ex){
        	System.debug('exception ::: '+ex);
            return JSON.serialize(ex);
        }
        return 'Data Saved Successfully.';
    }
}