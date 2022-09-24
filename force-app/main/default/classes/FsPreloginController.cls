public class FsPreloginController extends GenericFormBuilderController{
    
    @AuraEnabled
    public static String getRecordTypeName(String recTypeId){
        return Schema.getGlobalDescribe().get('Pre_Login__c').getDescribe().getRecordTypeInfosById().get(recTypeId).getName();
    }
   
    //Getting Input Fields From Metadata
    @AuraEnabled
    public static GenericFormBuilderController.InitWrapper getMetadtaInfoForm(String recordIds, String metaDetaName){
        System.debug('recIds & mdt '+recordIds+' :: '+metaDetaName);
        FsPreloginController obj = new FsPreloginController();
        obj.METADATA_NAME = metaDetaName;
        obj.IDS_SET = new Set<String>();
        if(String.isNotEmpty(recordIds)){
            //obj.IDS_SET = new Set<String>();
            obj.IDS_SET.addAll(recordIds.split('_'));
                obj.WHERE_CLAUSE = ' Id IN : IDS_SET';
            obj.RECORD_LIMIT = '1';    
        }
        return obj.initialize();
    }  
   
    //Save Account and Loan Applicant
    @AuraEnabled
    public static String saveRecord(sobject dataToInsert){
        System.debug(dataToInsert);
        System.debug(dataToInsert.getSObjectType());
        try{
            system.debug(':::dataToInsert:::' + dataToInsert);
            upsert dataToInsert; 
            return  dataToInsert.Id;
        } catch(Exception ex){
            System.debug('exception ::: '+ex);
            System.debug('exception ::: '+ex.getMessage());
            System.debug('exception ::: '+ex.getLineNumber());
            return null;
        }
    }
    
     //Pre Login Insertion
    @auraEnabled
    public static String insertPreLogin(){     
        Id devRecordTypeId = Schema.SObjectType.Pre_Login__c.getRecordTypeInfosByName().get('1. New login').getRecordTypeId();
        Pre_Login__c preLog = new Pre_Login__c(RecordTypeId=devRecordTypeId,Status__c='Active');
        INSERT preLog; 
        System.debug(preLog.Id);
        return preLog.Id; 
    }  
    
    //Application Insertion For Pre Login
    @auraEnabled
    public static AppWrapper insertApplications(String preLogInId){
        System.debug('Prelogin Id '+preLogInId);
        AppWrapper appWrap = new AppWrapper();
        List<Application__c> appId = [SELECT Id,Name FROM Application__c WHERE Pre_Login__c = :preLogInId AND Pre_Login__c != null];
        if(appId.size() > 0){
            System.debug('Yes');
            appWrap.appId = appId.get(0).Id;
            appWrap.appName = appId.get(0).Name;
        }
        else{
            Application__c objApp = new Application__c(Pre_Login__c = preLogInId,application_status__c = 'Active');
            INSERT objApp;
            Application__c app = [SELECT Id,Name FROM Application__c WHERE Id = :objApp.Id];
            appWrap.appId = app.Id;
            appWrap.appName = app.Name; 
        } 
        System.debug('appWrap '+appWrap);
        return appWrap;
    }
    
    @AuraEnabled
    public static List<String> insertKYCDocuments(List<String> base64,List<String> fileName,String appId){
        System.debug('Base64 '+ base64.size());
        System.debug('fileName '+fileName);
        System.debug('appId '+appId);
        integer count = 0;
        List<String> contentId = new List<String>();
        if(base64.size() > 0 && fileName.size() > 0 && base64.size() == fileName.size()){
            for(String img : base64){
                if(String.isNotBlank(img) && String.isNotEmpty(img)){
                    System.debug('img '+img);
                    String kycFileName = fileName.get(count);
                    System.debug('fileName '+kycFileName);
                    contentId.add(FileUploaderClass.uploadFile(img,kycFileName,appId));
                    count = count + 1;
                    System.debug('count front '+count);
                }                
            }
        }
        return contentId;
    }
    
    //Update KYCOCR
    @AuraEnabled
    public static String updateKYCOR(String loanAppId, String recId){
        if(String.isNotEmpty(loanAppId) && String.isNotBlank(loanAppId) && String.isNotEmpty(recId) && String.isNotBlank(recId)){
            KYC__c objKYC = [SELECT Id,Loan_Applicant__c FROM KYC__c WHERE Id = :recId];
            objKYC.Loan_Applicant__c = loanAppId;
            UPDATE objKYC;
            return 'Success';
        }
        return 'Error';
    }
    
    
    //Getting All Fields Of Application Tab
    @AuraEnabled
    public static Application__c getApplicationRecord(String applicationId){
        System.debug('Application ID '+applicationId);
        Application__c objApp = [SELECT Id, Name, Geo_tagging_pin_for_the_user__c, Staff_Loan__c, Field_Officer_Emp_Id__c, Customer_Visit_date__c,
                                 Requested_Loan_Amount__c, Channel__c, Alternate_Channel_Mode__c, Employee_ID__c 
                                 FROM Application__c
                                 WHERE Id =: applicationId];
        System.debug(objApp);
        if(objApp != null)
            return objApp;
        else
            return null;
    }
    
     //Getting Branch Name Of Sales User
    @AuraEnabled
    public static String getBranchName(){
        Account objAccount = new Account();
        try{
        objAccount = [SELECT Branch_Master__r.Name
                      From Account
                      WHERE User__c = :userinfo.getuserid()];
        System.debug('ObjAcc '+objAccount);
        System.debug('branch '+objAccount.Branch_Master__r.Name);
        }
        catch(Exception e){
            return null;
        }
        return objAccount.Branch_Master__r.Name;
    }
    
    // Creating Property Owners
    @AuraEnabled
    public static String createPropertyOwners(String propertyId,List<String> loanAppList){
        if(String.isNotEmpty(propertyId) && !loanAppList.isEmpty()){
            List<Property_Owners__c> listPropOwner = new List<Property_Owners__c>();
            for(String loanAppId : loanAppList){
				Property_Owners__c objPropOwner = new Property_Owners__c();
				objPropOwner.Property__c = propertyId;
				objPropOwner.Loan_Applicant__c = loanAppId;
				listPropOwner.add(objPropOwner);               
            }
            if(!listPropOwner.isEmpty()){
                INSERT listPropOwner;
                return 'Success '+listPropOwner.size();
            }
        }
        return 'Fail';
    }
    
     //Cloning newly created property from pre-login for Property_RecordTypes_To_Clone Custom Label
    @AuraEnabled
    public static String clonePropertyNew(String appId){
        String recordTypesToCreate = System.Label.Property_RecordTypes_To_Clone;
        List<String> recordTypeNames = recordTypesToCreate.split(',');

        List<Property__c> newPropList = new List<Property__c>();
        List<Property__c> oldPropList = new List<Property__c>();
        List<Property__c> listOfProp = [SELECT Id, Name,Loan_Applicant__c,Login__c,hasRelatedRecords__c,Application__c,Property_Type__c ,Title_Deed_Type__c,Title_Deed_Number__c,Title_Deed_Date__c,Property_Address__c,Pincode__c 
                                        FROM Property__c
                                        WHERE Application__c = :appId AND RecordType.Name = 'Pre Login Property Detail'];
        if(listOfProp != NULL && !listOfProp.isEmpty()){
            for(Property__c objProp : listOfProp){
                if(!objProp.hasRelatedRecords__c){
                    for(String rcName : recordTypeNames){
                        Property__c newProperty = objProp.clone(false,false,false,false);
                        newProperty.RecordTypeId = Schema.SObjectType.Property__c.getRecordTypeInfosByName().get(rcName).getRecordTypeId();
                        newProperty.Application__c = objProp.Application__c;
                        newProperty.Property__c = objProp.Id;
                        if(rcName == 'FIV-B Property Detail' || rcName == 'Online EC Property Detail'){
                            newProperty.Title_Deed_Number__c = null;
                            newProperty.Title_Deed_Date__c = null;
                            newProperty.Title_Deed_Type__c = null;
                            if(rcName == 'FIV-B Property Detail')
                            	newProperty.Property_Type__c = null;
                            newProperty.Property_Address__c = null;
                        }
                        newPropList.add(newProperty);
                    }
                    objProp.hasRelatedRecords__c = true;
                    oldPropList.add(objProp);  
                }
            }

            if(newPropList.size() > 0){
                INSERT newPropList; 
                UPDATE oldPropList;
                return 'Success';
            }
        }
        return 'Failed';
    }

    @AuraEnabled
    public static Map<String,List<String>> getPropertyOwners(String applicationId){
        Map<String,List<String>> returnMap = new Map<String,List<String>>();
        for(Property_Owners__c prop : [SELECT Id,Property__c,Loan_Applicant__r.Customer_Information__r.Name FROM Property_Owners__c WHERE Property__r.Application__c = : applicationId AND Property__r.RecordType.Name = 'Pre Login Property Detail']){
            if(returnMap.containsKey(prop.Property__c)){
                System.debug(prop.Property__c);
                returnMap.get(prop.Property__c).add(prop.Loan_Applicant__r.Customer_Information__r.Name);
            }
            else{
                 System.debug(prop.Loan_Applicant__r.Customer_Information__r.Name);
             	 returnMap.put(prop.Property__c,new List<String>{prop.Loan_Applicant__r.Customer_Information__r.Name});   
            }
        }
        System.debug('returnMAp '+returnMap);
        return returnMap;
    }
    
    @AuraEnabled
    public static String getPinId(String pin){
        String pinId = '';
        pinId = [SELECT Id FROM Ms_Pincode__c WHERE Name =: pin OR Pincode__c =: pin LIMIT 1].Id;
        return pinId;
    }
    
    @AuraEnabled
    public static String getApplicationName(String applicationId){
        return [SELECT Name FROM Application__c WHERE Id = :applicationId].Name;
    }
    
    @AuraEnabled
    public static Boolean checkTitleDeedNumber(String applicationId,String titleDeedNo){
        System.debug('titleDeedNo '+titleDeedNo);
        List<Property__c> listProp = [SELECT Id,Title_Deed_Number__c
                                      FROM Property__c
                                      WHERE Application__c = :applicationId
                                      	    AND Title_Deed_Number__c = :titleDeedNo
                                            AND RecordType.Name = 'Pre Login Property Detail' 
                                            AND Application__c != NULL ];
        System.debug(listProp);
        System.debug(listProp.size());
        if(listProp.size() > 0)
            return true;
        else
            return false;
    }
    
    public class AppWrapper{
        @AuraEnabled public String appId;
        @AuraEnabled public String appName;
    }
    
}