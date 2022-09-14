public abstract class AbstractTriggerContext {

    public static void run(String objectName, System.TriggerOperation operationType, List<sobject> newList, List<sObject> oldList, Map<Id,sObject> newMap, Map<Id, sObject> oldMap){
        
         for(Trigger_Handler__mdt record : getMetaData(objectName,operationType)){
            AbstractTriggerContext instance = (AbstractTriggerContext)Type.forName(record.HandlerClassName__c).newInstance();

            if(operationType == System.TriggerOperation.BEFORE_INSERT){
                instance.beforeInsert(newList);
            }else if(operationType == System.TriggerOperation.BEFORE_UPDATE){
                instance.beforeUpdate(newList, oldList, newMap, oldMap);
            }else if(operationType == System.TriggerOperation.BEFORE_DELETE){
                instance.beforeDelete(oldList, oldMap);
            }else if(operationType == System.TriggerOperation.AFTER_INSERT){
                instance.afterInsert(newList, newMap);
            }else if(operationType == System.TriggerOperation.AFTER_UPDATE){
                instance.afterUpdate(newList, oldList, newMap, oldMap);
            }else if(operationType == System.TriggerOperation.AFTER_UNDELETE){
                instance.afterUndelete(newList, newMap);
            }
         }
    }
    
    public virtual void beforeInsert(List<sobject> newList){
        //override for before insert logic
    }
    
    public virtual void beforeUpdate(List<sobject> newList, List<sObject> oldList, Map<Id,sObject> newMap, Map<Id, sObject> oldMap){
        //override for before update logic
    }
    
    public virtual void afterInsert(List<sobject> newList, Map<Id,sObject> newMap){
        //override for after insert logic
    }
    
    public virtual void afterUpdate(List<sobject> newList, List<sObject> oldList, Map<Id,sObject> newMap, Map<Id, sObject> oldMap){
        //override for after update logic
    }
    
    public virtual void beforeDelete(List<sObject> oldList, Map<Id, sObject> oldMap){
        //override for before delete logic
    }
    
    public virtual void afterUndelete(List<sObject> newList, Map<Id, sObject> newMap){
        //override for after undelete logic
    }
    
    
    public static List<Trigger_Handler__mdt> getMetaData(String objectName, System.TriggerOperation operationType){
        
        String query = 'Select HandlerClassName__c from Trigger_Handler__mdt where HandlerClassName__c !=null And isActive__c = true AND sObject_API_Name__c = :objectName';
        String context = '';
        if(operationType == System.TriggerOperation.BEFORE_INSERT){
            context = ' AND BEFORE_INSERT__c = true ';
        }else if(operationType == System.TriggerOperation.BEFORE_UPDATE){
            context = ' AND BEFORE_UPDATE__c = true ';
        }else if(operationType == System.TriggerOperation.BEFORE_DELETE){
            context = ' AND BEFORE_DELETE__c = true ';
        }else if(operationType == System.TriggerOperation.AFTER_INSERT){
            context = ' AND AFTER_INSERT__c = true';
        }else if(operationType == System.TriggerOperation.AFTER_UPDATE){
            context = ' AND AFTER_UPDATE__c = true';
        }else if(operationType == System.TriggerOperation.AFTER_UNDELETE){
            context = ' AND AFTER_UNDELETE__c = true';
        }
        query +=context;
        return (List<Trigger_Handler__mdt>)Database.query(query);
    }
    
    public static String getTiming(Boolean isBefore, Boolean isAfter) {
        String timing = '';

        if (isBefore) {
            timing = 'Before';
        }
        else if (isAfter) {
            timing = 'After';
        }

        return timing;
    }
    
    public static String getAction(Boolean isInsert, Boolean isUpdate, Boolean isDelete, Boolean isUndelete) {
        String action = '';
        
        if (isInsert) {
            action = 'Insert';
        }
        else if (isUpdate) {
            action = 'Update';
        }
        else if (isDelete) {
            action = 'Delete';
        }
        else if (isUndelete) {
            action = 'Undelete';
        }
        
        return action;
    }   
    
}