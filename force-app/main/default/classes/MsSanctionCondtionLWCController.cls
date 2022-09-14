/**
 * @author            : Ajay kumar
 * @group             : TechMatrix Consulting
 * @description       : Service class of MsSanctionConditionLWCController Component
 * @created on        : 24-06-2022
 * @last modified on  : 17-08-2022
 * @last modified by  : Ajay kumar
**/

public with sharing class MsSanctionCondtionLWCController {
    @AuraEnabled
    public static List<Ms_Sanction_Condition__c> getAllSanctionCondition(){
        system.debug('sanction condition called');
        List<Ms_Sanction_Condition__c> sanctncondObj = new  List<Ms_Sanction_Condition__c>();
        sanctncondObj = [select id,name,Is_Active__c,Sanction_condition_Description__c,Type__c,Status__c,Other_Condition__c from Ms_Sanction_Condition__c where Is_Active__c=true limit 50000];
        system.debug('sanction condition called=='+sanctncondObj);
        return sanctncondObj;
    }
    
    @AuraEnabled
    public static GenericDataTableController.DataTableResponse getSanctionConditionTableRecords(String appId){
        GenericDataTableController genericDTObj = new GenericDataTableController();
        genericDTObj.METADATA_NAME = 'PC_Sanction_Condition_Grid';
        genericDTObj.IDS_SET = new Set<String>();
        genericDTObj.IDS_SET.add(appId);
        genericDTObj.WHERE_CLAUSE = 'Application__c IN:IDS_SET';
        return genericDTObj.getTable();
    }
  
}