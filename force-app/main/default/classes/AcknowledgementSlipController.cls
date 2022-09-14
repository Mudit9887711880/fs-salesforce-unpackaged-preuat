public class AcknowledgementSlipController {
    public List<ListOfDocWrapper> wrapperList{get;set;}
    public String application {get;set;}
    public AcknowledgementSlipController(){
        String applicationId;
        String stage;
        applicationId = Apexpages.currentPage().getParameters().get('applicationId');
        stage = Apexpages.currentPage().getParameters().get('stage');
        List<ContentVersion> listOfContentVersion = new List<ContentVersion>();
        wrapperList = new List<ListOfDocWrapper>();
        Map<String,String> mapOfDocSetCode = new Map<String,String>();
        Set<String> docNames = new Set<String>();
        listOfContentVersion = [SELECT Id, CreatedDate, ContentDocumentId, Title, Uploaded_From__c, Document_Name__c, Parent_Id__c, Current_Record_Id__c,
                                	   Agreement_Document_Type__c, Document_Number__c, Document_Date__c, Number_of_Pages__c, Document_Condition__c
                                FROM ContentVersion 
                                WHERE Parent_Id__c =:applicationId AND Uploaded_From__c =:stage];
        application = [SELECT Name FROM Application__c WHERE Id = :applicationId].Name;
        System.debug(listOfContentVersion);
        for(ContentVersion cv : listOfContentVersion){
            if(String.isNotBlank(cv.Document_Name__c)){
                docNames.add(cv.Document_Name__c);
            }
        }
        
        if(!docNames.isEmpty()){
            for(Document_Set_Code__c docSetCode : [SELECT Id, Document_Set_Code__c FROM Document_Set_Code__c WHERE Id IN: docNames]){
                mapOfDocSetCode.put(docSetCode.Id, docSetCode.Document_Set_Code__c);
            }
            Integer i = 0;
            for(ContentVersion cv : listOfContentVersion){
                i = i+1;
                ListOfDocWrapper docWrapObj = new ListOfDocWrapper();
                docWrapObj.count = i;
                docWrapObj.cv = cv;
                if(String.isNotBlank(cv.Document_Name__c) && mapOfDocSetCode.containsKey(cv.Document_Name__c)){
                    docWrapObj.docNumber = mapOfDocSetCode.get(cv.Document_Name__c);
                }
                wrapperList.add(docWrapObj);
            }
        }
    }
    
    public class ListOfDocWrapper{
        @AuraEnabled public Integer count{get;set;}
        @AuraEnabled public ContentVersion cv{get;set;}
        @AuraEnabled public String docNumber{get;set;}
        
        public ListOfDocWrapper(){
            cv = new ContentVersion();
            docNumber = '';
            count = 0;
        }
    }
    
}