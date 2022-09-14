public without sharing class TriggerDispatcher {    
    private static Boolean IS_ENABLED = true;
    
    public static void enterFromTrigger(){
        if(IS_ENABLED == false){
            return;
        }
        TriggerDispatcher dispatcher = new TriggerDispatcher(Trigger.old,Trigger.new,Trigger.oldMap,Trigger.newMap);
    }
    
    public static void disableAllTriggers(){
        IS_ENABLED = false;
    }

    
    public static void enableAllTriggers(){
        IS_ENABLED = true;
    }
    
    public TriggerDispatcher(List<SObject> oldList, List<SObject> newList, Map<Id, SObject> oldMap, Map<Id, SObject> newMap){
        String triggerObject = getSObjectTypeName((oldList != null && oldList.size() > 0) ? oldList[0] : newList[0]);
        AbstractTriggerContext.run(triggerObject, Trigger.operationType, newList, oldList, newMap, oldMap);
    }
    
    @TestVisible
    private static String getSObjectTypeName(SObject so) {
        return so.getSObjectType().getDescribe().getName();
    }
    
}