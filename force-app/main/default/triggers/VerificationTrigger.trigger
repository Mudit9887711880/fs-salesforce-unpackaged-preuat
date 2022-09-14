/**
* @File Name          : VerificationTrigger.cls
* @Author             : Yogendra Degra
* @Created On         : 18/05/2022
*==============================================================================
* Ver         Date                     Author                 Modification
*==============================================================================
* 1.0         18/05/2022              Yogendra Degra       Initial Version
*/
trigger VerificationTrigger on Verification__c (before insert, before update, before delete, after insert, after update, after delete, after undelete) {
	System.debug('Trigger run');
    TriggerDispatcher.enterFromTrigger();
}