/**
* @File Name          : FinalSanctionController.cls
* @Description        : This class is used in Final Sanction Stage by LWC
* @Author             : Mudit Saxena
* @Created On         : 10/08/2022
*==============================================================================
* Ver         Date                     Author                 Modification
*==============================================================================
* 1.0        10/08/2022              Mudit Saxena             Initial Version
*/
public class FinalSanctionController {    
    //Constant for Record Types
    public static final Set<String> PROPERTY_RECORD_TYPES = new Set<String>{
        Utility.AC_PROPERTY_RECORD_TYPE_ID,Utility.LA_PROPERTY_RECORD_TYPE_ID
    };
    
    //Method to create the validation Table
    @AuraEnabled
    public static List<SectionWrapper> getValidationTableData(String applicationId){
        List<SectionWrapper> returnList = new List<SectionWrapper>();
        Map<String,Property__c> acPropertyMap = new Map<String,Property__c>();
        Map<String,Property__c> laPropertyMap = new Map<String,Property__c>();

        List<Property__c> propertyList = new List<Property__c>();
        Map<String,Property__c> parentPropertyMap = getParentProperty(applicationId);
        propertyList = [SELECT Id, Name ,
                                        Title_Deed_Date__c,
                                        Title_Deed_Number__c,
                                        Title_Deed_Type__c,
                                        Property__c,
                                        RecordType.DeveloperName,
                                        Application__c,
                                        Land_Area_Sq_Ft__c,
                                        Extent_Sqft__c
                                        FROM Property__c
                                        WHERE
                                        Property__c IN : parentPropertyMap.keySet() AND
                                        Application__c =: applicationId AND
                                        RecordTypeId IN : PROPERTY_RECORD_TYPES];
        for(Property__c proObj : propertyList){
            if(proObj.RecordType.DeveloperName == 'AC_Property_Detail'){
                acPropertyMap.put(proObj.Property__c,proObj);
            }
            if(proObj.RecordType.DeveloperName == 'Legal_Approval'){
                laPropertyMap.put(proObj.Property__c,proObj);
            }
        }

        Map<String,Application__c> applicationData = getApplicationData(applicationId);
        Map<String,String> docColorACMap = new Map<String,String>{applicationId => applicationData.get(applicationId).Risk_Document__c};
        Map<String,String> docColorLAMap = new Map<String,String>{applicationId => applicationData.get(applicationId).Risk_Document_Color__c};
        Map<String,Decimal> sanctionAmountACMap = new Map<String,Decimal>{applicationId => applicationData.get(applicationId).Total_Amount_Recommended_PcAc__c};
        Map<String,Decimal> sanctionAmountLAMap = new Map<String,Decimal>{applicationId => applicationData.get(applicationId).Sanction_amount_restriction_upto__c};
        /*
        for(Property__c proObj : propertyList){
            SectionWrapper sw = new SectionWrapper();
            sw.sectionLabel = proObj.Name;
            if(acPropertyMap.containskey(proObj.Property__c) && laPropertyMap.containskey(proObj.Property__c)){                
                sw.sectionContentList.add(new SectionContent(1, 'Land Area Extent' ,acPropertyMap.get(proObj.Property__c).Land_Area_Sq_Ft__c, laPropertyMap.get(proObj.Property__c).Extent_Sqft__c));
                sw.sectionContentList.add(new SectionContent(2, 'Title Deed Number', String.valueOf(acPropertyMap.get(proObj.Property__c).Title_Deed_Number__c), String.valueOf(laPropertyMap.get(proObj.Property__c).Title_Deed_Number__c)));
                sw.sectionContentList.add(new SectionContent(3, 'Title Deed Date', String.valueOf(acPropertyMap.get(proObj.Property__c).Title_Deed_Date__c), String.valueOf(laPropertyMap.get(proObj.Property__c).Title_Deed_Date__c)));
                sw.sectionContentList.add(new SectionContent(4, 'Title Deed Type', String.valueOf(acPropertyMap.get(proObj.Property__c).Title_Deed_Type__c), String.valueOf(laPropertyMap.get(proObj.Property__c).Title_Deed_Type__c)));
                sw.sectionContentList.add(new SectionContent(5, 'Document Colour', docColorACMap.get(proObj.Application__c), docColorLAMap.get(proObj.Application__c)));
                sw.sectionContentList.add(new SectionContent(6, 'Approved Loan Amount' ,sanctionAmountACMap.get(proObj.Application__c), sanctionAmountLAMap.get(proObj.Application__c)));
            }else{
                sw.sectionContentList.add(new SectionContent(1, 'Land Area Extent', '', ''));
                sw.sectionContentList.add(new SectionContent(2, 'Title Deed Number', '', ''));
                sw.sectionContentList.add(new SectionContent(3, 'Title Deed Date', '', ''));
                sw.sectionContentList.add(new SectionContent(4, 'Title Deed Type', '', ''));
                sw.sectionContentList.add(new SectionContent(5, 'Document Colour', '', ''));
                sw.sectionContentList.add(new SectionContent(6, 'Approved Loan Amount', '', ''));
            }
            sw.sectionContentList.sort();
            returnList.add(sw);
        }
        */
        for(String str : parentPropertyMap.keySet()){
            SectionWrapper sw = new SectionWrapper();
            sw.sectionLabel = parentPropertyMap.get(str).Property__r.Name;
            if(acPropertyMap.containskey(str) && laPropertyMap.containskey(str)){
                sw.sectionContentList.add(new SectionContent(1, 'Land Area Extent' ,acPropertyMap.get(str).Land_Area_Sq_Ft__c, laPropertyMap.get(str).Extent_Sqft__c));
                sw.sectionContentList.add(new SectionContent(2, 'Title Deed Number', String.valueOf(acPropertyMap.get(str).Title_Deed_Number__c), String.valueOf(laPropertyMap.get(str).Title_Deed_Number__c)));
                sw.sectionContentList.add(new SectionContent(3, 'Title Deed Date', String.valueOf(acPropertyMap.get(str).Title_Deed_Date__c), String.valueOf(laPropertyMap.get(str).Title_Deed_Date__c)));
                sw.sectionContentList.add(new SectionContent(4, 'Title Deed Type', String.valueOf(acPropertyMap.get(str).Title_Deed_Type__c), String.valueOf(laPropertyMap.get(str).Title_Deed_Type__c)));
                sw.sectionContentList.add(new SectionContent(5, 'Document Colour', docColorACMap.get(parentPropertyMap.get(str).Application__c), docColorLAMap.get(parentPropertyMap.get(str).Application__c)));
                sw.sectionContentList.add(new SectionContent(6, 'Approved Loan Amount' ,sanctionAmountACMap.get(parentPropertyMap.get(str).Application__c), sanctionAmountLAMap.get(parentPropertyMap.get(str).Application__c)));
            }
            sw.sectionContentList.sort();
            returnList.add(sw);
        }
        return returnList;
    }

    //Method to check that Sendback is already created or not for validation purpose.
    @AuraEnabled
    public static Boolean checkSendBackVaidation(String applicationId){
        List<Verification__c> acList = new List<Verification__c>([SELECT Id FROM Verification__c WHERE Application__c =: applicationId AND recordTypeId =: Utility.VERIFICATION_AC_RECORD_TYPE_ID AND Status__c =: 'Pending']);
        List<Legal_Approval__c> laList = new List<Legal_Approval__c>([SELECT Id FROM Legal_Approval__c WHERE Application__c =: applicationId AND Status__c =: 'Pending']);
        if((!acList.isEmpty() && acList.size() > 0) || (!laList.isEmpty() && laList.size() > 0)){
            return false;
        }else{
            return true;
        }        
    }
    
    //This method is use to create send back record.
    @AuraEnabled
    public static void doSendBack(sobject objToInsert){
        try{
            insert objToInsert;
        }catch(Exception ex){
            throw new AuraHandledException(ex.getMessage());
        }
    }
    
    /*-----------------------------SendBack---------------------------------*/
    @AuraEnabled
    public static String sendBackLegalApproval(String applicationId){
        List<Legal_Approval__c> legalList = new List<Legal_Approval__c>([SELECT Id,Status__c,Application__c FROM Legal_Approval__c WHERE Application__c =: applicationId ORDER BY CreatedDate DESC LIMIT 1]);
        if(legalList.size() > 0){
            legalList.get(0).Status__c = 'Pending';
            Update legalList;
            return 'Success';   
        } 
        return 'Error'; 
    }
    
    @AuraEnabled
    public static String sendBackAprovalCredit(String applicationId){
        List<Verification__c> approvalList = new List<Verification__c>([SELECT Id,Status__c,Application__c FROM Verification__c WHERE Application__c =: applicationId ORDER BY CreatedDate DESC LIMIT 1]);
        if(approvalList.size() > 0){
            approvalList.get(0).Status__c = 'Pending';
            Update approvalList;
            return 'Success';
         }
        return 'error';
    }
/*--------------------------------------------------------------------------------------------------------*/

/*--------------------------------------Move Stage-------------------------------------------------------*/
    @AuraEnabled
    public static String moveStage(String applicationId){
        Application__c objApp = [SELECT Id,Stage__c FROM Application__c WHERE Id = :applicationId];
        objApp.Stage__c = 'Post Approval';
        UPDATE objApp;
        return objApp.Stage__c;
    }
    
/*--------------------------------------------------------------------------------------------------------*/       
    private static Map<String,Application__c> getApplicationData(String applicationId){
        Map<String,Application__c> applicationDataMap = new Map<String,Application__c>();
        applicationDataMap.put(applicationId,[SELECT Id, 
                                                Risk_Document__c,
                                                Risk_Document_Color__c,
                                                Total_Amount_Recommended_PcAc__c,
                                                Sanction_amount_restriction_upto__c
                                                FROM Application__c WHERE Id =: applicationId LIMIT 1]);
        return applicationDataMap;
    }

    private static Map<String,Property__c> getParentProperty(String applicationId){
        Map<String,Property__c> returnMap = new Map<String,Property__c>();
        for(Property__c prop : [SELECT Property__c,Application__c, Property__r.Name FROM Property__c WHERE Application__c =: applicationId AND RecordTypeId IN : PROPERTY_RECORD_TYPES]){
            returnMap.put(prop.Property__c,prop);
        }
        return returnMap;
    }
    
    public class SectionWrapper{
        @AuraEnabled public String sectionLabel;
        @AuraEnabled public List<SectionContent> sectionContentList;

        public SectionWrapper(){
            this.sectionContentList = new List<SectionContent>();
        }
    }

    public class SectionContent implements Comparable{
        @AuraEnabled public Decimal order;
        @AuraEnabled public String field;
        @AuraEnabled public String acVal;
        @AuraEnabled public String laVal;
        @AuraEnabled public String validation;

        public SectionContent(Decimal odr, String fld, String acv, String lav){
            this.order = odr;
            this.field = fld;
            this.acVal = acv;
            this.laVal = lav;
            if(String.isNotEmpty(acv) && String.isNotEmpty(lav)){
                this.validation = acv == lav ? 'Okay' : 'Not Okay';
            }else{
                this.validation = 'Not Okay';
            }            
        }

        //Sanction Amount AND Land Extent Area
        public SectionContent(Decimal odr, String fld ,Decimal acv, Decimal lav){
            this.order = odr;
            this.acVal = String.valueOf(acv);
            this.laVal = String.valueOf(lav);
            if(fld == 'Approved Loan Amount'){                
                this.field = fld;
                if(acv != null && lav != null){
                    this.validation = acv >= lav ? 'Okay' : 'Not Okay';
                }else{
                    this.validation = 'Not Okay';
                }
            }

            if(fld == 'Land Area Extent'){                
                this.field = fld;
                if(acv != null && lav != null){
                    Decimal percentVal = (lav * 5) / 100;
                    Decimal newLAV = lav + percentVal;
                    if(acv == lav){
                        this.validation = 'Okay';
                    }else if(acv <= newLAV){
                        this.validation = 'Okay';
                    }else{
                        this.validation = 'Not Okay';    
                    }
                }else{
                    this.validation = 'Not Okay';
                }
            }
        }

        public Integer compareTo(Object objToCompare) {
            return Integer.valueOf(order - ((SectionContent)objToCompare).order);               
        }
    }
}