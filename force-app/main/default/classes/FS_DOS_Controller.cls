/*
* ──────────────────────────────────────────────────────────────────────────────────────────────────
* @author           Kuldeep Sahu  
* @modifiedBy       Kuldeep Sahu   
* @created          2022-07-19
* @modified         2022-07-21
* @TestClassName    FS_DOS_ControllerTest
* @Description      This component is build to handle all the server operations related to 
                    DOS Stage in FiveStar.        
* ──────────────────────────────────────────────────────────────────────────────────────────────────
*/
public without sharing class FS_DOS_Controller {
    
    // This Method Is Used To Save DOS Data Coming From fsDOSLWC Component 
    @AuraEnabled
    public static String saveDOSData(String applicationId, String strData){
        System.debug('strData= '+ strData);
        List<DOSParentWrapper> masterList = new List<DOSParentWrapper>();
        try{
            masterList = (List<DOSParentWrapper>) System.JSON.deserialize(strData, List<DOSParentWrapper>.class);
            System.debug('masterList= '+ masterList);
            List<DOS__c> dmList = new List<DOS__c>();
            for(DOSParentWrapper masterObj : masterList) {
                for(DOSWrapper dosObj : masterObj.dosList) {
                    DOS__c dmObj = new DOS__c();
                    if(String.isNotBlank(dosObj.answerId)){
                        dmObj.Id = dosObj.answerId;
                    }
                    if(String.isNotBlank(dosObj.verification) || String.isNotBlank(dosObj.status) || String.isNotBlank(dosObj.remark)){
                        dmObj.Document_Checklist_Value_Master__c = dosObj.masterId;
                        dmObj.Application__c = applicationId;
                        dmObj.Verification__c = dosObj.verification;
                        dmObj.Status__c = dosObj.status;
                        dmObj.Verification_Remarks_Observations__c = dosObj.remark;
                        dmList.add(dmObj);
                    }
                }
            }

            if(!dmList.isEmpty()){
                System.debug('dmList= '+ dmList);
                upsert dmList;
                return 'success';
            }
        }catch(Exception ex){
            System.debug('Error in saveDOSData= '+ex.getMessage());
        }
        return 'failed';
    }   

    // This Method Is Used To Query All DOS Data And Arrange In Wrapper For fsDOSLWC Component 
    @AuraEnabled
    public static List<DOSParentWrapper> getDOSDataNew(String applicationId){
        List<DOSParentWrapper> masterList = new List<DOSParentWrapper>();
        Map<String,List<DOSWrapper>> wrapperMap = new Map<String,List<DOSWrapper>>();
        List<Document_Checklist_Value_Master__c> dmList = new List<Document_Checklist_Value_Master__c>();
        dmList = [SELECT 
                Id, Document_Type__c, Check_Point__c, Guidance__c, Sequence__c,
                (SELECT 
                Id, Status__c, Verification__c, Verification_Remarks_Observations__c 
                FROM DOS__r WHERE Application__c =: applicationId) 
                FROM Document_Checklist_Value_Master__c 
                WHERE Active__c = true 
                ORDER BY Sequence__c ASC];
        
        for(Document_Checklist_Value_Master__c dm : dmList) {
            DOSWrapper dosObj = new DOSWrapper();
            dosObj.masterId = dm.Id;
            dosObj.checkPoint = dm.Check_Point__c;
            dosObj.guidance = dm.Guidance__c;
            dosObj.sequance = Integer.valueOf(dm.Sequence__c);
            if(dm.DOS__r != NULL && !dm.DOS__r.isEmpty()){
                dosObj.answerId = dm.DOS__r.get(0).Id;
                dosObj.status = dm.DOS__r.get(0).Status__c;
                dosObj.verification = dm.DOS__r.get(0).Verification__c;
                dosObj.remark = dm.DOS__r.get(0).Verification_Remarks_Observations__c;
            }
            dosObj.documentType = dm.Document_Type__c;
            if(wrapperMap.containsKey(dm.Document_Type__c)){
                wrapperMap.get(dm.Document_Type__c).add(dosObj);
            }else{
                wrapperMap.put(dm.Document_Type__c,new List<DOSWrapper>{dosObj});
            }
        }

        for(String docType : wrapperMap.keyset()){
            DOSParentWrapper parentObj = new DOSParentWrapper();
            parentObj.documentType = docType;
            parentObj.dosList = wrapperMap.get(docType);
            parentObj.rowspanval = wrapperMap.get(docType).size() +1;
            masterList.add(parentObj);
        }
        return masterList;
    }


    /* ---------------------------Wrapper Classes Below----------------------------- */
    public class DOSParentWrapper{
        @AuraEnabled public String documentType;
        @AuraEnabled public List<DOSWrapper> dosList;
        @AuraEnabled public Integer rowspanval;
        public DOSParentWrapper(){
            documentType = '';
            dosList = new List<DOSWrapper>();
        }
    }

    public class DOSWrapper{
        @AuraEnabled public String masterId;
        @AuraEnabled public String documentType;
        @AuraEnabled public String checkPoint;
        @AuraEnabled public String guidance;
        @AuraEnabled public Integer sequance;
        @AuraEnabled public String answerId;
        @AuraEnabled public String status;
        @AuraEnabled public String verification;
        @AuraEnabled public String remark;
        public DOSWrapper(){
            masterId = '';
            documentType = '';
            checkPoint = '';
            guidance = '';
            sequance = 0;
            answerId = '';
            status = '';
            verification = '';
            remark = '';
        }
    }
}