public class FileUtility {
    @AuraEnabled
    public String fileName;
    @AuraEnabled
    public String contentType;
    @AuraEnabled
    public String Description;
    @AuraEnabled
    public Blob Body;
    @AuraEnabled
    public Id recordId;
    @AuraEnabled
    public Id parentId;
    @AuraEnabled
    public Datetime createdDate;
    @AuraEnabled
    public String category;

    public FileUtility(ContentVersion objCV, Boolean isContentRequired) {
        this.fileName = objCV.Title;
        this.contentType = objCV.FileExtension;
        this.category = objCV.FileExtension;
        if(isContentRequired) {
            this.Body = objCV.VersionData;
        }
        this.recordId = objCV.Id;
        this.parentId = objCV.ContentDocumentId;
        
        
        if(objCV.Description != NULL) {
            this.Description = objCV.Description;
        }
        
        if(objCV.Category__c != NULL) {
            this.category = objCV.Category__c;
        }
        this.createdDate = objCV.CreatedDate;
    }

    public static list<FileUtility> fetchFiles(Set<String> setParentIds, String uploadedFrom){
        list<id> lstConDocs = new list<id>();
        list<FileUtility> lstDocs = new list<FileUtility>();
        for(ContentDocumentLink cntLink : [Select Id, ContentDocumentId From ContentDocumentLink Where LinkedEntityId IN:setParentIds]) {
            lstConDocs.add(cntLink.ContentDocumentId);    
        }
        if(!lstConDocs.isEmpty()) {
            List<ContentVersion> lstCV;
            if(String.isNotBlank(uploadedFrom)){
                lstCV = [SELECT Id, Title, FileExtension, Category__c, ContentDocumentId,Description,CreatedDate     
                         FROM ContentVersion WHERE ContentDocumentId IN :lstConDocs AND Uploaded_From__c =: uploadedFrom ORDER BY CREATEDDATE DESC];
            } else{
                lstCV = [SELECT Id, Title, FileExtension, Category__c, ContentDocumentId,Description,CreatedDate     
                                          FROM ContentVersion WHERE ContentDocumentId IN :lstConDocs ORDER BY CREATEDDATE DESC];
            }
            
            if(lstCV != null && !lstCV.isEmpty()) {
                for(ContentVersion objCV : lstCV) {
                    lstDocs.add(new FileUtility(objCV,false)); 
                }
            }
        }
        return lstDocs;
    }















/*        public FileUtility(Attachment objAttach, Boolean isContentRequired) {
        this.fileName = objAttach.Name;
        this.contentType = objAttach.ContentType;
        this.Description = objAttach.Description;
        if(isContentRequired) {
           this.Body = objAttach.body; 
        }
        this.recordId = objAttach.Id;
        this.parentId = objAttach.ParentId;
        this.accountName = objAttach.parent.Name;   
        this.isAttachment = True;
        this.status = Constant_Class.STATUS_NEW;
        this.createdDate = objAttach.CreatedDate;
        if(String.isBlank(objAttach.ContentType) && objAttach.Name.contains('.')) {
            List<String> lstFileName = objAttach.Name.split('\\.');
            if(lstFileName != null && !lstFileName.isEmpty()) {
                this.fileName = lstFileName[0];
                this.contentType = lstFileName[1];
                this.category = lstFileName[1];
            }
        }
    }
    public FileUtility(ContentVersion objCV, Boolean isContentRequired) {
        this.fileName = objCV.Title;
        this.contentType = objCV.FileExtension;
        this.category = objCV.FileExtension;
        if(isContentRequired) {
            this.Body = objCV.VersionData;
        }
        this.recordId = objCV.Id;
        this.parentId = objCV.ContentDocumentId;
        this.isAttachment = False;
        this.status = Constant_Class.STATUS_NEW;
        if(objCV.Status__c != NULL) {
            this.status = objCV.Status__c;
        }
        if(objCV.remarks__c != NULL) {
            this.remarks = objCV.remarks__c;
        }
        if(objCV.Description != NULL) {
            this.Description = objCV.Description;
        }
        if(objCV.API_Status__c != NULL) {
            this.API_Status = objCV.API_Status__c;
        }
        if(objCV.Category__c != NULL) {
            this.category = objCV.Category__c;
        }
        if(objCV.Account__c != NULL && objCV.Account__r.Name != NULL) {
            this.accountName = objCV.Account__r.Name;
        }
        this.createdDate = objCV.CreatedDate;
    }
     //To fetch files and attachments
    public static list<FileUtility> fetchFiles(Set<String> setParentIds,Set<String> skipStatusVals){
        list<id> lstConDocs = new list<id>();
        list<FileUtility> lstDocs = new list<FileUtility>();
        for(ContentDocumentLink cntLink : [Select Id, ContentDocumentId From ContentDocumentLink Where LinkedEntityId IN:setParentIds]) {
            lstConDocs.add(cntLink.ContentDocumentId);    
        }
        if(!lstConDocs.isEmpty()) {
            List<ContentVersion> lstCV = [SELECT Id, Title, FileExtension, Category__c, ContentDocumentId, Status__c,remarks__c,Description,API_Status__c,Account__c,Account__r.Name,CreatedDate     
                                          FROM ContentVersion WHERE ContentDocumentId IN :lstConDocs AND Status__c NOT IN: skipStatusVals AND IsLatest = true ORDER BY CREATEDDATE DESC];
            if(lstCV != null && !lstCV.isEmpty()) {
                for(ContentVersion objCV : lstCV) {
                    lstDocs.add(new FileUtility(objCV,false)); 
                }
            }
        }
        system.debug('87 lstDocs --> '+lstDocs.size());
        List<Attachment> lstAttachments = [SELECT Id,ContentType,Name,Body,Description,ParentId,Parent.Name,CreatedDate FROM Attachment WHERE parentId IN: setParentIds ORDER BY CREATEDDATE DESC];
        system.debug('lstAttachments --> '+lstAttachments);
        if(lstAttachments != null && !lstAttachments.isEmpty()) {
            for(Attachment objAttach : lstAttachments) {
                lstDocs.add(new FileUtility(objAttach,false));  
            }          
        }
         system.debug('lstDocs --> '+lstDocs.size());
        return lstDocs;
    }*/

}