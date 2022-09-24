/**
* @File Name          : TRDeviationTrigger
* @Author             : Navin Soni
* @Created On         : 14 Sep 2022
*==============================================================================
* Ver         Date                     Author                 Modification
*==============================================================================
* 1.0       14 Sep 2022              Navin Soni             Initial Version
**/

trigger TRDeviationTrigger on TR_Deviation__c (After Insert, After Update) {
    if(trigger.isAfter && trigger.isInsert){
        TRDeviationTriggerHelper.sendDevitionNotifications(true, trigger.New, null);
    }
    
    if(trigger.isAfter && trigger.isUpdate){
        TRDeviationTriggerHelper.sendDevitionNotifications(false, trigger.New, trigger.oldMap);
    }
}