/**
* @author            : Ajay kumar
* @group             : TechMatrix Consulting
* @description       : Service class of fsSanctionConditionLWC Component
* @created on        : 24-06-2022
* @last modified on  : 17-08-2022
* @last modified by  : Ajay kumar
**/

public with sharing class fsSanctionConditionLWCController {   
    
    @AuraEnabled(cacheable = true)
    public static MsSanctionConditionWrapper getSanctionConditionTableData(String applicationId,String createdFrom)
    {
        system.debug('app Id'+applicationId+'createdFrom'+createdFrom);
        MsSanctionConditionWrapper wrapperObj = new MsSanctionConditionWrapper();
        List<Ms_Sanction_Condition__c> sanctncondObjList = new  List<Ms_Sanction_Condition__c>();
        
        for(Ms_Sanction_Condition__c sanctncondObj: [select id,name,Is_Active__c,Sanction_condition_Description__c,Type__c,Status__c,Other_Condition__c from Ms_Sanction_Condition__c where Is_Active__c=true limit 50000])
        {            sanctncondObjList.add(sanctncondObj);           
        }
        
        if(sanctncondObjList.size()>0 && !sanctncondObjList.isEmpty())
            wrapperObj.msSanctionList = sanctncondObjList;
        
        List<SanctionConditionWrapper> sanctionWrapObjList = new  List<SanctionConditionWrapper>();
        Integer Index = 1;
        for(Sanction_Condition__c sanctionObj:[SELECT Id,MsSanctionCondition__c,Other_Condition__c,Print_In_Sanction_Letter__c,Remark__c,Created_From__c,Application__c FROM  Sanction_Condition__c WHERE Application__c =:applicationId])
        {
            SanctionConditionWrapper sanctionWrapObj = new SanctionConditionWrapper();
            sanctionWrapObj.SrNo = Index;
            sanctionWrapObj.Id = sanctionObj.Id;
            sanctionWrapObj.sanctionCondition = sanctionObj.MsSanctionCondition__c;
            sanctionWrapObj.otherCondition = sanctionObj.Other_Condition__c;
            sanctionWrapObj.printInSanctionLetter = sanctionObj.Print_In_Sanction_Letter__c;
            sanctionWrapObj.remarks = sanctionObj.Remark__c;
            sanctionWrapObj.source = sanctionObj.Created_From__c;
            sanctionWrapObj.isChanged = false;
            if(sanctionObj.Created_From__c == 'Process Credit')
                sanctionWrapObj.isPCSanction = true;
            else
                sanctionWrapObj.isPCSanction = false;
            
            sanctionWrapObjList.add(sanctionWrapObj);
            Index++;
        }
        
        wrapperObj.sanctionWrapperList = sanctionWrapObjList;
        system.debug('wrapperObj'+wrapperObj);
        return wrapperObj;
    }
    
    @AuraEnabled
    public static String saveSanctionConditions(String applicationId,String sanctionData)
    {
        system.debug('Data ####'+sanctionData);
        List<Sanction_Condition__c> SanctionConditionListtoCreate = new List<Sanction_Condition__c>();
        List<SanctionConditionWrapper> wrapperList = (List<SanctionConditionWrapper>)JSON.deserialize(sanctionData, List<SanctionConditionWrapper>.class);
        system.debug('Sanction Wrapper List'+ wrapperList);
        for(SanctionConditionWrapper sanctionWrapObj: wrapperList)
        {
            if(sanctionWrapObj.isChanged)
            {
                Sanction_Condition__c newSanction = new Sanction_Condition__c();
                newSanction.Id = (sanctionWrapObj.Id != '')?sanctionWrapObj.Id:null;
                if(sanctionWrapObj.Id == '' || sanctionWrapObj.Id == null)
                    newSanction.Application__c = applicationId;
                newSanction.Added_By__c = UserInfo.getUserId();
                newSanction.MsSanctionCondition__c = (sanctionWrapObj.sanctionCondition!= '')?sanctionWrapObj.sanctionCondition:null;
                newSanction.Other_Condition__c = (sanctionWrapObj.otherCondition != '')?sanctionWrapObj.otherCondition:null;
                newSanction.Print_In_Sanction_Letter__c = (sanctionWrapObj.printInSanctionLetter != null)?sanctionWrapObj.printInSanctionLetter:null;
                newSanction.Remark__c = (sanctionWrapObj.remarks != '')?sanctionWrapObj.remarks:null;
                newSanction.Created_From__c = (sanctionWrapObj.source != '')?sanctionWrapObj.source:null;
                SanctionConditionListtoCreate.add(newSanction); 
            }          
        }
        
        System.debug('SANCTION CONDITION LIST ###'+SanctionConditionListtoCreate);
        if(!SanctionConditionListtoCreate.isEmpty() && SanctionConditionListtoCreate.size()>0)
        {
            try {
                upsert SanctionConditionListtoCreate; 
                return 'success';
            } catch (DmlException e) {
                System.debug(e.getMessage());
                return 'error';
            }
        }
        return null;
        
    }    
    
    // Wrapper Class
    public class MsSanctionConditionWrapper
    {
        @AuraEnabled public List<Ms_Sanction_Condition__c> msSanctionList;
        @AuraEnabled public List<SanctionConditionWrapper> sanctionWrapperList;
    }
    
    public class SanctionConditionWrapper 
    {
        @AuraEnabled public Integer SrNo;
        @AuraEnabled public String Id;
        @AuraEnabled public Boolean isChanged;
        @AuraEnabled public String sanctionCondition;
        @AuraEnabled public String otherCondition;
        @AuraEnabled public String printInSanctionLetter;
        @AuraEnabled public String remarks;
        @AuraEnabled public String source;
        @AuraEnabled public Boolean isPCSanction;
    }   
    
}