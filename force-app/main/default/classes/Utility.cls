/**
* @File Name          : Utility.cls
* @Description        : Utitlity Class
* @Author             : Ajay Kumar
* @Created On         : 25/04/2022
*==============================================================================
* Ver         Date                     Author                 Modification
*==============================================================================
* 1.0        25/04/2022              Ajay Kumar             Initial Version
*/

public class Utility {

    //RECORD TYPES
    public static final Id VERIFICATION_FIV_B_RECORD_TYPE_ID = Schema.SObjectType.Verification__c.getRecordTypeInfosByName().get('FIV - B').getRecordTypeId();
    public static final Id VERIFICATION_FIV_C_RECORD_TYPE_ID = Schema.SObjectType.Verification__c.getRecordTypeInfosByName().get('FIV - C').getRecordTypeId();
    public static final Id VERIFICATION_FIV_EC_RECORD_TYPE_ID = Schema.SObjectType.Verification__c.getRecordTypeInfosByName().get('Online EC').getRecordTypeId();
    public static final Id VERIFICATION_AC_RECORD_TYPE_ID = Schema.SObjectType.Verification__c.getRecordTypeInfosByName().get('AC').getRecordTypeId();
    
    public static final Id PC_CHARACTER_RECORD_TYPE_ID = Schema.SObjectType.Character__c.getRecordTypeInfosByName().get('PC Character').getRecordTypeId();
    public static final Id AC_CHARACTER_RECORD_TYPE_ID = Schema.SObjectType.Character__c.getRecordTypeInfosByName().get('AC Character').getRecordTypeId();
    public static final Id AC_PROPERTY_RECORD_TYPE_ID = Schema.SObjectType.Property__c.getRecordTypeInfosByName().get('AC Property Detail').getRecordTypeId();
    public static final Id LA_PROPERTY_RECORD_TYPE_ID = Schema.SObjectType.Property__c.getRecordTypeInfosByName().get('Legal Approval').getRecordTypeId();
    public static final Id PC_PROPERTY_RECORD_TYPE_ID = Schema.SObjectType.Property__c.getRecordTypeInfosByName().get('PC Property Detail').getRecordTypeId();
    public static final Id PC_CAPABILITY_RECORD_TYPE_ID = Schema.SObjectType.Capability__C.getRecordTypeInfosByName().get('PC Capability').getRecordTypeId();
    public static final Id AC_CAPABILITY_RECORD_TYPE_ID = Schema.SObjectType.Capability__C.getRecordTypeInfosByName().get('AC Capability').getRecordTypeId();
    
    public static final Id TASK_NOTIFICATION_RECORD_TYPE_ID = Schema.SObjectType.Task.getRecordTypeInfosByDeveloperName().get('Notification').getRecordTypeId();
    public static final Id TASK_QUERY_RECORD_TYPE_ID = Schema.SObjectType.Task.getRecordTypeInfosByDeveloperName().get('Query').getRecordTypeId();

    /*
    * This method is use to Create Task.
    */
    public static Task createTask(String taskSubject,String whoId, String whatId,string taskOwner,Date taskDueDate,String taskComments,Boolean isInsert){
        Task taskObj = new Task();
        taskObj.recordTypeId = TASK_NOTIFICATION_RECORD_TYPE_ID;
 		taskObj.OwnerId = taskOwner;
        taskObj.WhatId = whatId;
        taskObj.WhoId = whoId;
        taskObj.Subject = taskSubject;
        taskObj.ActivityDate = taskDueDate;
        taskObj.Description = taskComments;
        taskObj.IsReminderSet = false;
       
        if( isInsert==TRUE ){
            Database.DMLOptions options = new Database.DMLOptions();
            options.EmailHeader.triggerUserEmail = false;
            Database.SaveResult tobj=Database.insert(taskObj,options);
        }
        return taskObj;
    }
    
    /*
    * This method is use to Send push Notification.
    */
    public static void sendNotification(String title,String body,String targetId,String notificationName,String recipientId){   
        CustomNotificationType TemplateInfoDetail = new CustomNotificationType();
        if(notificationName != null)
            TemplateInfoDetail = [SELECT Id, DeveloperName FROM CustomNotificationType WHERE DeveloperName =: notificationName];
        
        if(recipientId != null && targetId != null){
            Messaging.CustomNotification currNotification = new Messaging.CustomNotification();
            currNotification.setTitle(title);
            currNotification.setBody(body);
            currNotification.setTargetId(targetId);
            currNotification.setNotificationTypeId(TemplateInfoDetail.Id);
            currNotification.send(new Set<String>{recipientId});
        }
    }
    
    /*
    * This method is use to delete Records.
    * Parms : 
        * String recordId - Holds The recordId to delete
    */
    @AuraEnabled
    public static String deleteRecord(String recordId){
        try{
            if(String.isBlank(recordId)){
                throw new AuraHandledException('Record Id is not valid');
            }
            Database.delete(recordId);
            return 'success';
        }catch(Exception exp){
            throw new AuraHandledException(exp.getMessage());
        }
    }

    /*
    * This method is use to log the error in Error Logger Object.
    * Parms : 
        * Exception ex - Holds the Exception happen in the class.
        * String className - Holds The class name
    */
    public static void createErrorLogger(Exception ex,String className){
        Error_Logger__c el = new Error_Logger__c();
        el.Description__c = ex.getMessage() +'\n'+ string.valueof(ex.getLineNumber()) +'\n'+ ex.getTypeName();
        el.Exception_Message__c = ex.getMessage();
        el.Exception_Type__c = ex.getTypeName();
        el.Name = className;
        el.Line_Number__c = string.valueof(ex.getLineNumber());
        insert el;
    }

    /*
    * This method is use to log the error in Error Logger Object.
    * Parms : 
        * Exception ex - Holds the Exception happen in the class.
        * String className - Holds The class name
        * String applicationId - Holds The Application name
    */
    public static void createErrorLoggerApplicationWise(Exception ex,String className, String applicationId){
        Error_Logger__c el = new Error_Logger__c();
        el.Description__c = ex.getMessage() +'\n'+ string.valueof(ex.getLineNumber()) +'\n'+ ex.getTypeName();
        el.Exception_Message__c = ex.getMessage();
        el.Exception_Type__c = ex.getTypeName();
        el.Name = className;
        el.Line_Number__c = string.valueof(ex.getLineNumber());
        el.Application__c = applicationId;
        insert el;
    }

    /*
    * This method is use to get Queue Id - Work_to_Pull.
    */
    public static String getUnAssignedQueueId(){
        return [SELECT Id FROM Group WHERE Type = 'Queue' AND DeveloperName = 'Work_to_Pull'].Id;
    }

    /*
    * This method is use to get Queue Id - Reject_Case_Queue.
    */
    public static String getRejectQueueId(){
        return [SELECT Id FROM Group WHERE Type = 'Queue' AND DeveloperName = 'Reject_Case_Queue'].Id;
    }
    
    
    /*
    * This method is use to get cloned record.
    * Added By Yogendra Degra
    */
    public static List<SObject> doClone(Set<String> recordIds, String objectApiName, Boolean hasRecordType){
        //objectApiName = 'Application__c';
        Map<String, Schema.SObjectType> schemaMap = Schema.getGlobalDescribe();
        Map<String, Schema.SObjectField> fieldMap = schemaMap.get(objectApiName).getDescribe().fields.getMap();
        List<String> objectFields = new List<String>();
		objectFields.add('Id');
        objectFields.add('Name');
        if(hasRecordType){
        	objectFields.add('RecordTypeId');
        }
        for(String fieldName : fieldMap.keyset()){
            if(fieldName.contains('__c')){
                objectFields.add(fieldName);    
            }
        }
        String query = 'SELECT ' + String.join(objectFields, ',') + ' FROM ' + objectAPIName + ' WHERE Id IN: recordIds';
        System.debug('query ### '+query);
        return Database.query(query);
    }

    @AuraEnabled
    public static string createSendBackHistory(String parentId, String title, String body){
        try {
            insert new Note(parentId = parentId, title = title, body = body);
            return 'success';
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}