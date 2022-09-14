public class FeeReceiptController {
    @AuraEnabled
    public static GenericDataTableController.DataTableResponse getReceiptData(String applicationId, String stage){
        System.debug('applicationId=  '+applicationId + stage);
        Set<String> recIds = new Set<String>();
       if(stage == 'Lead Detail' || stage == 'Disbursal Maker' || stage == 'Disbursal Author'){
            for(Receipt__c rec : [SELECT Id, Approval_Status__c, Fee_Code__r.Repayment_Type_2__c,Fee_Code__r.Fee_Code__c FROM Receipt__c WHERE Application__c  =: applicationId]){
                recIds.add(rec.Id);
            }
        }
        else if(stage == 'Process Credit' || stage == 'Approval Credit'){
            for(Receipt__c rec : [SELECT Id, Approval_Status__c, Fee_Code__r.Repayment_Type_2__c,Fee_Code__r.Fee_Code__c FROM Receipt__c WHERE Application__c  =: applicationId AND Fee_Code__r.RecordType.DeveloperName = 'Insurance']){
                recIds.add(rec.Id);
            }
        }
        else if(stage == 'Pre Login'){
            for(Receipt__c rec : [SELECT Id,Approval_Status__c, Fee_Code__r.Repayment_Type_2__c,Fee_Code__r.Fee_Code__c FROM Receipt__c WHERE Application__c  =: applicationId AND Fee_Code__r.RecordType.DeveloperName = 'Fee']){
                recIds.add(rec.Id);
            }
        }
        System.debug('propIds=  '+recIds);
        GenericDataTableController genericDTObj = new GenericDataTableController();
        genericDTObj.METADATA_NAME = 'Receipt_Metadata';
        genericDTObj.IDS_SET = recIds;
        genericDTObj.WHERE_CLAUSE = ' ID IN : IDS_SET';
        return genericDTObj.getTable();  
    }
    @AuraEnabled
    public static Map<Id,String> getCashiers(){
        System.debug('Current User '+userinfo.getuserid());
        /* Account objAcc = [SELECT Id,Branch_Master__c,Branch_Master__r.Name
From Account
WHERE User__c = :userinfo.getuserid()];
List<Account> bmList=[SELECT id,User__c ,User__r.Designation__c,User__r.Name,Branch_Master__c,Branch_Master__r.name 
FROM Account 
WHERE Branch_Master__c=:objAcc.Branch_Master__c AND User__r.Designation__c='Cashier'];*/
        //List<User> bmList = [SELECT Id, Designation__c, Name FROM User WHERE Id = :userinfo.getuserid() AND Designation__c='Cashier'];
        List<User> bmList = [SELECT Id, Designation__c, Name FROM User WHERE Designation__c='Cashier'];
        Map<Id,String> cashierMap = new Map<Id,String>();
        
        if(bmList.size()>0){
            for(User usr : bmList){
                cashierMap.put(usr.Id,usr.Name);
            }
        }
        System.debug('Map '+cashierMap);
        if(cashierMap.size() > 0)
            return cashierMap;
        else
            return null;
    }
    //Receipt Submission For Approval
    @AuraEnabled
    public static String submitReceiptForApproval(String receiptId , String approverId){
        System.debug('Receipt Id :: '+receiptId);
        System.debug('ApproverId :: '+approverId);
        if(String.isNotBlank(receiptId) && String.isNotEmpty(receiptId) && String.isNotBlank(approverId) && String.isNotEmpty(approverId)){
            String AppId = [SELECT Application__r.Name FROM Receipt__c WHERE Id = : receiptId].Application__r.Name;
            System.debug('App '+AppId);
            List<Id> listApproverId = new List<Id>(); 
            //listApproverId.add(approverId);
            System.debug('user info'+UserInfo.getName());
            Utility.createTask(UserInfo.getName()+' is asking for approval',null, receiptId,approverId,null,'Please Approve this Receipt',true);
            Utility.sendNotification(UserInfo.getName()+' is asking approval for Receipt',AppId,receiptId,'Verification_Notification',approverId);
            return 'Success';
        }     
        else{
            return 'Failed';
        }
    }  
    
    /*
@Author : Navin Soni
@Date : 30 July 2022
@Description : This method is used to get all Fee Code from Fee Creation object basis on Application.  
*/
    @AuraEnabled
    public Static Map<String, Decimal> getExistingFeeCode(String applicationId){
        system.debug('get existing code'+applicationId);
        Map<String, Decimal> mapOfFeeCode = new Map<String, Decimal>();
        if(String.isNotBlank(applicationId)){
            for(Fee_Creation__c objFeeCreation : [SELECT Id, Type__c, Fee_Code__c, Fee_Collection__c, Total_Fee__c, RecordType.Name FROM Fee_Creation__c WHERE Application__c =: applicationId AND (Recordtype.DeveloperName = 'Fee' OR Recordtype.DeveloperName = 'Insurance') AND Repayment_Type_2__c = 'Direct Receipt']){
                if(String.IsNotBlank(objFeeCreation.Fee_Code__c)){
                    system.debug('fee code'+objFeeCreation.Fee_Code__c);
                    system.debug('fee collection'+objFeeCreation.Fee_Collection__c);
                    if(objFeeCreation.Fee_Collection__c == null){
                        objFeeCreation.Fee_Collection__c = 0;
                    }
                    if(objFeeCreation.Total_Fee__c == null){
                        objFeeCreation.Total_Fee__c = 0;
                    }
                    system.debug('fee collection'+objFeeCreation.Fee_Collection__c);
                    if(objFeeCreation.RecordType.Name == 'Fee'){
                        mapOfFeeCode.put(objFeeCreation.Fee_Code__c, objFeeCreation.Fee_Collection__c);
                    }
                    else if(objFeeCreation.RecordType.Name == 'Insurance'){
                        mapOfFeeCode.put(objFeeCreation.Fee_Code__c, objFeeCreation.Total_Fee__c);
                    }
                    
                }
                
            }
        }
        return mapOfFeeCode;
    }
    
    /*
@Author : Sanggeta Yadav
@Date : 03 August 2022
@Description : This method is used to get all Fee Code from Fee Creation object of type insurance basis on Application (for PC screen).  
*/
    @AuraEnabled
    public Static Map<String, Fee_Creation__c> getExistingFeeCodeIns(String applicationId){
        system.debug('get existing code'+applicationId);
        Map<String, Fee_Creation__c> mapOfFeeCode = new Map<String, Fee_Creation__c>();
        if(String.isNotBlank(applicationId)){
            for(Fee_Creation__c objFeeCreation : [SELECT Id, Type__c, Fee_Code__c, Fee_Collection__c, Total_Fee__c FROM Fee_Creation__c WHERE Application__c =: applicationId AND Recordtype.DeveloperName = 'Insurance' AND Repayment_Type_2__c = 'Direct Receipt']){
                if(String.IsNotBlank(objFeeCreation.Fee_Code__c)){
                    
                    if(objFeeCreation.Total_Fee__c == null){
                        objFeeCreation.Total_Fee__c = 0;
                    }
                    mapOfFeeCode.put(objFeeCreation.Id, objFeeCreation);
                    
                }
            }
        }
        system.debug('map'+mapOfFeeCode);
        return mapOfFeeCode;
    }
    
    
    // for multiple value for same fee code and checking their receipts
    @AuraEnabled
    public Static Map<String, Fee_Creation__c> getExistingFeeCodeRec(String applicationId, String stageName){
        system.debug('get existing code'+applicationId);
        Map<String, Fee_Creation__c> mapOfFeeCode = new Map<String, Fee_Creation__c>();
        List<Fee_Creation__c> fee = new List<Fee_Creation__c>();
        if(stageName == 'Process Credit' || stageName == 'Approval Credit'){
            // only insurance record
            System.debug('stageName'+stageName);
            fee = [SELECT Id, Type__c, Fee_Code__c, Fee_Collection__c, Total_Fee__c, RecordType.Name 
                   FROM Fee_Creation__c WHERE Application__c =: applicationId AND (Recordtype.DeveloperName = 'Insurance') AND Repayment_Type_2__c = 'Direct Receipt'];
        }
        else if(stageName == 'Pre Login'){
            //only fee type
            System.debug('stageName'+stageName);
            fee = [SELECT Id, Type__c, Fee_Code__c, Fee_Collection__c, Total_Fee__c, RecordType.Name 
                   FROM Fee_Creation__c WHERE Application__c =: applicationId AND (Recordtype.DeveloperName = 'Fee') AND Repayment_Type_2__c = 'Direct Receipt'];
            
        }
        else if(stageName == 'Lead Detail' || stageName == 'Disbursal Maker' || stageName == 'Disbursal Author'){
            // both insurance and fee
            System.debug('stageName'+stageName);
            fee = [SELECT Id, Type__c, Fee_Code__c, Fee_Collection__c, Total_Fee__c, RecordType.Name 
                   FROM Fee_Creation__c WHERE Application__c =: applicationId AND (Recordtype.DeveloperName = 'Fee' OR Recordtype.DeveloperName = 'Insurance') AND Repayment_Type_2__c = 'Direct Receipt'];
            
        }
        List<Receipt__c> receiptList = [SELECT Id, Fee_code__c FROM Receipt__c WHERE Application__c =:applicationId AND Fee_code__c IN : fee 
                                        AND (Approval_Status__c = 'Approved' OR Approval_Status__c = 'Pending' OR Approval_Status__c = 'Submitted')];
        System.debug('receiptList' + receiptList);
        if(String.isNotBlank(applicationId)){
            for(Fee_Creation__c objFeeCreation : fee){
                if(String.IsNotBlank(objFeeCreation.Fee_Code__c)){
                    system.debug('fee code'+objFeeCreation.Fee_Code__c);
                    system.debug('fee collection'+objFeeCreation.Fee_Collection__c);
                    if(objFeeCreation.Fee_Collection__c == null){
                        objFeeCreation.Fee_Collection__c = 0;
                    }
                    if(objFeeCreation.Total_Fee__c == null){
                        objFeeCreation.Total_Fee__c = 0;
                    }
                    system.debug('fee collection'+objFeeCreation.Fee_Collection__c);
                    // if(objFeeCreation.RecordType.Name == 'Fee'){
                    //    mapOfFeeCode.put(objFeeCreation.Id, objFeeCreation.Fee_Code__c);
                    //  }
                    //  else if(objFeeCreation.RecordType.Name == 'Insurance'){
                    //      mapOfFeeCode.put(objFeeCreation.Id, objFeeCreation.Fee_Code__c);
                    //  }
                    mapOfFeeCode.put(objFeeCreation.Id, objFeeCreation);
                    
                }
            }
        }
        if(receiptList.size() > 0){
            for(Receipt__c rec : receiptList){
                if(mapOfFeeCode.containsKey(rec.Fee_Code__c)){
                    mapOfFeeCode.remove(rec.Fee_Code__c);
                }
            }
        }
        System.debug('mapOfFeeCode' + mapOfFeeCode);
        return mapOfFeeCode;
    }
    //To update feecode in receipt
    @AuraEnabled
    public static String updateReceiptFee(String receiptId, String feeId){
        if(receiptId != null && feeId != null && receiptId != '' && feeId != ''){
            Receipt__c rec = [SELECT Id,Fee_Code__c FROM Receipt__c WHERE Id =:receiptId WITH SECURITY_ENFORCED LIMIT 1 ]; 
            rec.Fee_Code__c = feeId;
            if(rec != null){
                updateReceipt(rec);
            }
        }
        
        return 'yes';
    }
    
    public static void updateReceipt(Receipt__c rec){
        update rec;
    }
    @AuraEnabled
    public static String getRecFeeRepayment(String recId){
        System.debug('Receipt id to get repayment'+recId);
        String repayment = [SELECT Id, Fee_Code__r.Repayment_Type_2__c FROM Receipt__c WHERE Id =: recId AND Approval_Status__c = 'Rejected'].Fee_Code__r.Repayment_Type_2__c;
        System.debug('Receipt repayment'+repayment);
        return repayment;
    }
}