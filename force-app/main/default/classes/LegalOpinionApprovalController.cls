public without sharing class LegalOpinionApprovalController {
    @AuraEnabled
    public static GenericDataTableController.DataTableResponse getPropertyTableData(String appId){      
        GenericDataTableController genericDTObj = new GenericDataTableController();
        genericDTObj.METADATA_NAME = 'Legal_Approval_Property';
        genericDTObj.IDS_SET = new Set<String>();
        genericDTObj.IDS_SET.add(appId);
        String rcId = Schema.getGlobalDescribe().get('Property__c').getDescribe().getRecordTypeInfosByName().get('Legal Approval').getRecordTypeId();
        genericDTObj.IDS_SET.add(rcId);
        genericDTObj.WHERE_CLAUSE = ' Application__c IN : IDS_SET AND RecordTypeId IN : IDS_SET';
        return genericDTObj.getTable();
    }

    @AuraEnabled
    public static GenericDataTableController.DataTableResponse getExternalLawyerTableData(){      
        GenericDataTableController genericDTObj = new GenericDataTableController();
        genericDTObj.METADATA_NAME = 'Legal_Opinion_External_Lawyer';
        genericDTObj.IDS_SET = new Set<String>();
        String rcId = Schema.getGlobalDescribe().get('Account').getDescribe().getRecordTypeInfosByName().get('External Lawyer').getRecordTypeId();
        genericDTObj.IDS_SET.add(rcId);
        genericDTObj.WHERE_CLAUSE = ' RecordTypeId IN : IDS_SET';
        return genericDTObj.getTable();
    }

    @AuraEnabled
    public static String moveToNextStage(String appId){
        try{
            Application__c appObj = [SELECT Id, Name, Sub_Stage__c FROM Application__c WHERE Id =: appId LIMIT 1];
            appObj.Sub_Stage__c = 'Legal Approval';
            update appObj;
            
            List<Legal_Approval__c> legalApprovals = [SELECT Id, Status__c, Application__c FROM Legal_Approval__c WHERE Application__c =: appId];
            
            Legal_Approval__c legalApprovalObj;
            if(legalApprovals != NULL && !legalApprovals.isEmpty()){
                legalApprovalObj = legalApprovals.get(0);
            } else {
                legalApprovalObj = new Legal_Approval__c();
                legalApprovalObj.Application__c = appId;
                legalApprovalObj.Status__c = 'Pending';
                insert legalApprovalObj;
            }

            String title = 'Application is pending for Legal Approval';
            String body = appObj.Name + ' is done with Legal Opinion stage and now pending for Legal Approval';
            //title = 'Application '+ appObj.Name +' is assign for Legal Approval';
            Utility.sendNotification(title,body,legalApprovalObj.Id,'Verification_Notification',UserInfo.getUserId());
            //Utility.createTask(String taskSubject,String whoId, String whatId,string taskOwner,Date taskDueDate,String taskComments,Boolean isInsert)
            return 'success';
        }catch(Exception ex){
            System.debug('Error in moveToNextStage '+ex);
            throw new AuraHandledException(ex.getMessage());
        }
    }

    @AuraEnabled
    public static Property__c getPropertyDetails(String propertyId){
        List<Property__c> legalApprovalProperty = [SELECT 
                                                Id, Is_Legal_Updated__c, Title_Document_in_Name_of__c, Title_Deed_Number__c,
                                                Title_Deed_Date__c, Document_Type__c, Survey_Number__c, Plot_No__c, Property__c,
                                                House_Door_No__c, Village__c, District__c, MS_Pincode__c, Extent_Sqft__c,
                                                Supporting_Document_SD__c, SD_in_name_of__c, SD_Date__c, Link_Doc_Status__c,
                                                Link_Document_Type__c, Link_Doc_Date__c, Link_Documents_in_Name_of__c, Login_EC_Type__c,
                                                Login_EC_Number__c, Login_EC_Date_From__c, Login_EC_Date_Till__c, Online_EC_Status__c,
                                                Online_EC_Date_From__c, Online_EC_Date_Till__c, GuidelineValue_SqFt_asPer_LegalOpinion__c, 
                                                Online_Guideline_Value_Search__c, Online_Guidelive_Value__c, Existing_Encumberances__c
                                                FROM Property__c 
                                                WHERE Id =: propertyId];

        if(legalApprovalProperty != NULL && !legalApprovalProperty.isEmpty()){
            List<Property__c> otherChildProperties = [SELECT 
                                                    Id, RecordType.Name, Title_Deed_Number__c, Document_Type__c,
                                                    Survey_Number__c, Plot_No__c, Property_Number__c, Village__c,
                                                    District__c, MS_Pincode__c, Land_Measurement_total_area__c
                                                    FROM Property__c 
                                                    WHERE Property__c =: legalApprovalProperty.get(0).Property__c
                                                    AND RecordType.Name IN ('Online EC Property Detail','FIV-C Property Detail')];
            if(otherChildProperties != NULL && !otherChildProperties.isEmpty() && !legalApprovalProperty.get(0).Is_Legal_Updated__c){
                for(Property__c property : otherChildProperties){
                    if(property.RecordType.Name == 'Online EC Property Detail'){
                        legalApprovalProperty.get(0).Survey_Number__c = property.Survey_Number__c;
                        legalApprovalProperty.get(0).Plot_No__c = property.Plot_No__c;
                        legalApprovalProperty.get(0).Property_Number__c = property.Property_Number__c;
                        legalApprovalProperty.get(0).Village__c = property.Village__c;
                        legalApprovalProperty.get(0).District__c = property.District__c;
                    } else if(property.RecordType.Name == 'FIV-C Property Detail'){
                        legalApprovalProperty.get(0).Title_Deed_Number__c = property.Title_Deed_Number__c;
                        legalApprovalProperty.get(0).Document_Type__c = property.Document_Type__c;
                        legalApprovalProperty.get(0).MS_Pincode__c = property.MS_Pincode__c;
                        legalApprovalProperty.get(0).Extent_Sqft__c = property.Land_Measurement_total_area__c;
                    }
                }
            }
            return legalApprovalProperty.get(0);
        }
        return null;
    }

    @AuraEnabled
    public static String saveLegalApprovalProperty(String legalApprovalSt){
        try{
            Property__c lA_Property = (Property__c) System.JSON.deserialize(legalApprovalSt, Property__c.class);
            lA_Property.Is_Legal_Updated__c = true;
            update lA_Property;
            return 'success';
        }catch(Exception ex){
            System.debug('Error in saveLegalApprovalProperty= '+ex.getMessage());
        }
        return 'failed';
    }
    @AuraEnabled
    public static List<Property__c> getProperties(String appId){
        return [SELECT Id, Name, Title_Deed_Date__c, Title_Deed_Number__c, External_Lawyer__c FROM Property__c WHERE Application__c=:appId AND RecordType.Name = 'Pre Login Property Detail'];
    }
    @AuraEnabled
    public static List<Account> getExternalLawyer(){
        return [SELECT Id, Name FROM Account WHERE RecordType.Name = 'External Lawyer'];
    }
    @AuraEnabled
    public static void updateProperties(String propertyList){
        Map<Id, Property__c> propertyMap = new Map<Id, Property__c>();
        List<Property__c> childPropertyList = new List<Property__c>();
        List<Property__c> lstOfUpdatedProperty = (List<Property__c>)JSON.deserialize(propertyList, List<Property__c>.class);
        if(lstOfUpdatedProperty.size()>0){
            for(Property__c pro : lstOfUpdatedProperty){
                propertyMap.put(pro.Id, pro);
            }
            update lstOfUpdatedProperty;

            childPropertyList = [SELECT Id, Property__c, External_Lawyer__c FROM Property__c WHERE Property__c In : lstOfUpdatedProperty];
        }
        if(childPropertyList.size()>0){
            for(Property__c property : childPropertyList){
                if(property.Property__c!=null){
                    property.External_Lawyer__c = propertyMap.get(property.Property__c).External_Lawyer__c;
                }
            }
            update childPropertyList;
        }
    }

    @AuraEnabled
    public static string handleLegalApprovalSubmit(String applicationId, String legalApId){
        try {
            update new Legal_Approval__c(Id=legalApId, Status__c='Completed');
            List<Verification__c> acRecord = [SELECT Id, Status__c FROM Verification__c WHERE RecordType.Name = 'AC' AND Application__c =: applicationId ORDER BY CreatedDate DESC LIMIT 1];
            Application__c appObj = new Application__c(Id = applicationId);
            appObj.Sub_Stage__c = '';
            if(acRecord != NULL && !acRecord.isEmpty() && acRecord.get(0).Status__c == 'Completed'){
                appObj.Stage__c = 'Final Sanction';
            }
            update appObj;
            return 'success';
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}