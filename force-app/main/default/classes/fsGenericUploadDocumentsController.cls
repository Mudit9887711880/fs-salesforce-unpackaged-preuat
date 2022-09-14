/**
* @File Name          : fsGenericUploadDocumentsController.cls
* @Description        : Service Class For fsGenericUploadDocuments Lightning Component
* @Author             : Yogendra Degra
* @Created On         : 20/07/2022
*==============================================================================
* Ver         Date                     Author                 Modification
*==============================================================================
* 1.0         20/07/2022              Yogendra Degra       Initial Version
*/
public class fsGenericUploadDocumentsController {
    
    @AuraEnabled
    public static List<WrapperRequiredDocument> getAllRequiredDocument(String stageName, String filter){
        System.debug('stageName :: '+stageName);
        List<WrapperRequiredDocument> wrapperList = new List<WrapperRequiredDocument>();
        Integer serialNumber = 1;
        String query = 'SELECT Id, Name, Mandatory__c, Applicable_For__c, Document_Master__r.Name, Document_Master__r.Type__c, Document_Master__r.Active__c, Document_Master__r.Family__c FROM Document_Set_Code__c WHERE Stage__c =: stageName AND Document_Master__r.Active__c = \'Yes\'';
        if(String.isNotBlank(filter)){
            query += ' AND Document_Master__r.Type__c =: filter';
        }
        System.debug('query #### '+query);
        for(Document_Set_Code__c setCode : Database.query(query)){
            WrapperRequiredDocument objWrapper = new WrapperRequiredDocument();
            objWrapper.docSetCodeId = setCode.Id;
            objWrapper.applicantId = '';
            objWrapper.assetId = '';
            objWrapper.serialNumber = serialNumber;
            objWrapper.noOfPages = null;
            objWrapper.fileName = '';
            objWrapper.documentName = setCode.Name;
            objWrapper.documentNumber = setCode.Document_Master__r.Name;
            objWrapper.documentFamily = setCode.Document_Master__r.Family__c;
            objWrapper.applicableFor = setCode.Applicable_For__c;
            objWrapper.mandatory = setCode.Mandatory__c;
            objWrapper.original = '';
            objWrapper.status = '';
            objWrapper.deferalStage = '';
            objWrapper.upload = '';
            objWrapper.stage = stageName;
            objWrapper.waiverReason = '';
            objWrapper.remarks = '';
            objWrapper.documentType = '';
            objWrapper.type = setCode.Document_Master__r.Type__c;
            objWrapper.documentCondition = '';
            objWrapper.receivedDate = null;
            objWrapper.isReceivedDateRequired = false;
            objWrapper.receivedDateDisable = true;
            objWrapper.deferalDate = null;
            objWrapper.deferredDateDisable = true;
            objWrapper.deferredStageDisable = true;
            objWrapper.waiverReasonDisable = true;
            objWrapper.isAddVisible = false;
            objWrapper.isInputField = false;
            wrapperList.add(objWrapper);
            serialNumber += 1;
        }
        return wrapperList;
    }
    @AuraEnabled
    public static List<Loan_Applicant__c> getAllApplicantData(String applicationId){
        return [SELECT Id, Customer_Information__c, Customer_Type__c, Applicant_Name__c, Customer_Information__r.Name FROM Loan_Applicant__c WHERE Application__c =: applicationId];
    }
    @AuraEnabled
    public static List<Property__c> getAllAssetData(String applicationId, String recordTypeId){
        return [SELECT Id, Name, Property_Type__c FROM Property__c WHERE Application__c =: applicationId AND RecordTypeId =: recordTypeId];    
    }
    public class WrapperRequiredDocument{
        @AuraEnabled public String docSetCodeId;
        @AuraEnabled public String type;
        @AuraEnabled public String applicantId;
        @AuraEnabled public String assetId;
        @AuraEnabled public Integer serialNumber;
        @AuraEnabled public String noOfPages;
        @AuraEnabled public String documentName;
        @AuraEnabled public String documentNumber;
        @AuraEnabled public String fileName;
        @AuraEnabled public String documentFamily;
        @AuraEnabled public String applicableFor;
        @AuraEnabled public String mandatory;
        @AuraEnabled public String original;
        @AuraEnabled public String status;
        @AuraEnabled public String deferalStage;
        @AuraEnabled public String upload;
        @AuraEnabled public String stage;
        @AuraEnabled public String waiverReason;
        @AuraEnabled public String remarks;
        @AuraEnabled public String documentType;
        @AuraEnabled public String documentCondition;
        @AuraEnabled public Date receivedDate;
        @AuraEnabled public Date deferalDate;
        @AuraEnabled public Boolean deferredDateDisable;
        @AuraEnabled public Boolean receivedDateDisable;
        @AuraEnabled public Boolean deferredStageDisable;
        @AuraEnabled public Boolean waiverReasonDisable;
        @AuraEnabled public Boolean isAddVisible;
        @AuraEnabled public Boolean isInputField;
        @AuraEnabled public Boolean isReceivedDateRequired;
        
        @AuraEnabled
        public fileData fileData;
    }
    public class fileData {
        @AuraEnabled
        public String filename; 
        @AuraEnabled
        public String base64;   
        @AuraEnabled
        public String recordId;
    }
    @AuraEnabled
    public static List<String> uploadFile(String cvDocData, String recordId) {
        System.debug('cvDocData :: '+cvDocData);
        WrapperRequiredDocument jsonWrapper = (WrapperRequiredDocument)JSON.deserialize(cvDocData, WrapperRequiredDocument.class);
        System.debug('cvDocData :: '+jsonWrapper);
        List<String> listOfRequiredDocument = createContentVersion(jsonWrapper, recordId);
        System.debug('listOfRequiredDocument #### '+listOfRequiredDocument);
        return listOfRequiredDocument;
    }
    /*public static String createContentLink(List<ContentVersion> listOfCV, String recordId) {
        if (listOfCV == null || recordId == null) { return null; }
        Set<String> setOfCV = new Set<String>();
        for(ContentVersion cv : listOfCV){
            setOfCV.add(cv.Id);
        }
        List<ContentDocumentLink> listOfCDL = new List<ContentDocumentLink>();
        for(ContentVersion cv : [SELECT ContentDocumentId FROM ContentVersion WHERE Id IN: setOfCV]){
            ContentDocumentLink cdl = new ContentDocumentLink();
            cdl.ContentDocumentId = cv.ContentDocumentId;
            cdl.LinkedEntityId = recordId;  
            cdl.ShareType = 'V';
            listOfCDL.add(cdl);
        }
        
        try {
            insert listOfCDL;
            return 'Success';
        } catch(DMLException e) {
            System.debug(e);
            return null;
        }
    }*/
    private static List<String> createContentVersion(WrapperRequiredDocument cvdata, String recordId) {
        List<ContentVersion> listOfCV = new List<ContentVersion>();
        ContentVersion cv = new ContentVersion();
        cv.VersionData = EncodingUtil.base64Decode(cvdata.fileData.base64);
        cv.Title = cvdata.filename;
        cv.PathOnClient = cvdata.filename;
        cv.Document_Name__c = cvdata.documentName;
        if(String.isNotBlank(cvdata.documentNumber)){
            cv.Document_Number__c = cvdata.documentNumber;
        } else{
            cv.Document_Number__c = 'Additional Document - ' + Integer.valueof((Math.random() * 10));
        }
        if(String.isNotBlank(cvdata.docSetCodeId)){
            cv.Document_Set_Code_Id__c = cvdata.docSetCodeId;
        } else{
            cv.Document_Set_Code_Id__c = 'additional document';
        }
        cv.Document_Family__c = cvdata.documentFamily;
        cv.Mandatory__c = cvdata.mandatory;
        cv.Original__c = cvdata.original;
        cv.Status__c = cvdata.status;
        cv.Uploaded_From__c = cvdata.stage;
        cv.Waiver_Reason__c = cvdata.waiverReason;
        cv.Remarks__c = cvdata.remarks;
        cv.Deferal_Stage__c = cvdata.deferalStage;
        if(String.isNotBlank(cvdata.type) && cvdata.type == 'Applicant')
            cv.Current_Record_Id__c = cvdata.applicantId;
        if(String.isNotBlank(cvdata.type) && cvdata.type == 'Asset')
            cv.Current_Record_Id__c = cvdata.assetId;
        if(String.isNotBlank(cvdata.deferalStage))
            cv.Is_Deferal_Document__c = true;
        if(cvdata.deferalDate != null)
            cv.Deferal_Date__c = cvdata.deferalDate;
        cv.Received_Date__c = cvdata.receivedDate;
        cv.Parent_Id__c = recordId;
        cv.OwnerId = UserInfo.getUserId();
        cv.Agreement_Document_Type__c = cvdata.documentType;
        cv.Document_Condition__c = cvdata.documentCondition;
        cv.Number_of_Pages__c = cvdata.noOfPages;
        List<String> requiredDocs = new List<String>();
        
        insert cv;
        ContentDocumentLink cdl = createContentLink(cv.Id, recordId);
        requiredDocs = getRequiredDocuments(cvdata.stage, recordId);
        return requiredDocs;
    }
    @AuraEnabled
    public static void uploadAddtionalDocument(String base64, String filename, String recordId, String description) {
        ContentVersion cv = new ContentVersion();
        cv.VersionData = EncodingUtil.base64Decode(base64);
        cv.Title = filename;
        cv.PathOnClient = filename;
        cv.Document_Name__c = filename;
        cv.Remarks__c = description;
        cv.Parent_Id__c = recordId;
        cv.OwnerId = UserInfo.getUserId();
        cv.Is_Additional_Document__c = true;
        insert cv;
        ContentDocumentLink cdl = createContentLink(cv.Id, recordId);
    }
    
    private static ContentDocumentLink createContentLink(String contentVersionId, String recordId) {
        if (contentVersionId == null || recordId == null) { return null; }
        ContentDocumentLink cdl = new ContentDocumentLink();
        cdl.ContentDocumentId = [
            SELECT ContentDocumentId 
            FROM ContentVersion 
            WHERE Id =: contentVersionId
        ].ContentDocumentId;
        cdl.LinkedEntityId = recordId;
        cdl.ShareType = 'V';
        try {
            insert cdl;
            return cdl;
        } catch(DMLException e) {
            System.debug(e);
            return null;
        }
    }
    
    @AuraEnabled
    public static List<ContentVersion> getUploadedRecords(String parentId, String stage){
        return [SELECT Id, Title, Document_Name__c, ContentDocumentId, Owner.Name, Number_of_Pages__c, Uploaded_From__c, Remarks__c FROM ContentVersion WHERE Parent_Id__c =:parentId AND Is_Additional_Document__c = false];
    }
    @AuraEnabled
    public static List<ContentVersion> getAdditionalRecords(String parentId, String stage){
        return [SELECT Id, ContentDocumentId, Title, Remarks__c, Owner.Name FROM ContentVersion WHERE Parent_Id__c =:parentId AND Is_Additional_Document__c = true];
    }
    @AuraEnabled
    public static List<String> getRequiredDocuments(String stage, String parentId){
        List<String> requiredDocName = new List<String>();
        Set<String> setCodeIds = new Set<String>();
        Set<String> currentStageDefDoc = new Set<String>();
        Set<String> otherStageDefDoc = new Set<String>();

        for(ContentVersion cv : [SELECT Id, Document_Set_Code_Id__c, Deferal_Stage__c, Is_Deferal_Document__c, Uploaded_From__c FROM ContentVersion WHERE Parent_Id__c =:parentId]){
            if(String.isNotBlank(cv.Document_Set_Code_Id__c) && cv.Deferal_Stage__c == stage && cv.Is_Deferal_Document__c){
                currentStageDefDoc.add(cv.Document_Set_Code_Id__c);    
            }              
            if(String.isNotBlank(cv.Document_Set_Code_Id__c) && cv.Deferal_Stage__c != stage && cv.Is_Deferal_Document__c){
                otherStageDefDoc.add(cv.Document_Set_Code_Id__c);    
            }              
            if(String.isNotBlank(cv.Document_Set_Code_Id__c) && !cv.Is_Deferal_Document__c && cv.Uploaded_From__c == stage){
                setCodeIds.add(cv.Document_Set_Code_Id__c);    
            }              
        }
        
        System.debug('currentStageDefDoc #### '+currentStageDefDoc);
        System.debug('setCodeIds #### '+setCodeIds);
        for(Document_Set_Code__c code : [SELECT Id, Name, Mandatory__c FROM Document_Set_Code__c WHERE Stage__c =: stage AND Document_Master__r.Active__c = 'Yes' AND Mandatory__c = 'Yes']){
            if(!currentStageDefDoc.contains(code.Id) && !setCodeIds.contains(code.Id) && !otherStageDefDoc.contains(code.Id)){
                requiredDocName.add(code.Name);                
            } else if(currentStageDefDoc.contains(code.Id) && !setCodeIds.contains(code.Id) && !otherStageDefDoc.contains(code.Id)){
                requiredDocName.add(code.Name);                
            } 
        }
        System.debug('listOfSetCode #### '+requiredDocName);
        return requiredDocName;
    }
}