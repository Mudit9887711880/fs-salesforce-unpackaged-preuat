trigger ReceiptTrigger on Receipt__c (after update) {
  
    if(Trigger.Isupdate && Trigger.IsAfter)
    { 
      List<Receipt__c> recList=new List<Receipt__c>();
      for(String recId: Trigger.NewMap.keySet())
      {
          if(Trigger.NewMap.get(recId).Approval_Status__c!=Trigger.oldMap.get(recId).Approval_Status__c && Trigger.newMap.get(recId).Approval_Status__c=='Approved' && Trigger.newMap.get(recId).Pre_Login__c!=null)
          {
            recList.add(Trigger.NewMap.get(recId));
          }
      }
      if(recList.size()>0)
      {
         String jsonString = json.serialize(recList);
         ReceiptTriggerHelper.ReceiptMaker(jsonString);
    }    
}
    
    
/*
list<id> loginIDList=new list<id>();
list<Verification__c> VerificationList=new list<Verification__c>();
Id FIVBRecordTypeId = Schema.SObjectType.Verification__c.getRecordTypeInfosByName().get('FIV - B').getRecordTypeId();
Id FIVCRecordTypeId = Schema.SObjectType.Verification__c.getRecordTypeInfosByName().get('FIV - C').getRecordTypeId();

for(Receipt__c receipt:trigger.new){
if(receipt.status__C=='Approved')
loginIDList.add(receipt.Pre_Login__c);
}
list<Login__c> loginList=[select id,All_Reciept_Count__c,Approved_Reciept_Count__c from Login__c where IN:loginIDList];
list<user> logedInUser=[select id,branch from user where id=:UserInfo.getUserId() ];
list<branch> branchList=[select id,branchmanager,creditmanager from branch where branch=:logedInUser.branch ];

for(Login__c login:loginList){
if(login.All_Reciept_Count__c==login.Approved_Reciept_Count__c){
verificationFIVB__c verificationFIVB=new verificationFIVB__c();
verificationFIVB.RecordTypeId=FIVBRecordTypeId;
verificationFIVB.ownerid=branchList[0].branchmanager;
verificationFIVB.Application__c=
verificationFIVB.BM_Comments_for_Overall_Summary__c
verificationFIVB.BM_Recommended_Amount__c
verificationFIVB.Category__c
verificationFIVB.status__c='Pending';
verificationFIVB.Customer_Request_Amount__c
verificationFIVB.I_hereby_declare__c
verificationFIVB.Inspection_Date__c
verificationFIVB.Inspection_Time__c
verificationFIVB.Name__c
verificationFIVB.Purpose__c
verificationFIVB.Remarks__c
verificationFIVB.ROI__c
verificationFIVB.Sourcing_Officer__c
verificationFIVB.Status__c
verificationFIVB.Submission_Date__c
verificationFIVB.Tenor__c
verificationFIVB.Name
VerificationList.add(verificationFIVB);
verificationFIVC__c verificationFIVC=new verificationFIVC__c();
verificationFIVB.ownerid=branchList[0].creditmanager;
verificationFIVC.RecordTypeId=FIVCRecordTypeId;
verificationFIVC.Application__c=
verificationFIVC.BM_Comments_for_Overall_Summary__c
verificationFIVC.BM_Recommended_Amount__c
verificationFIVC.Category__c
verificationFIVC.Customer_Request_Amount__c
verificationFIVC.status__c='Pending';
verificationFIVC.I_hereby_declare__c
verificationFIVC.Inspection_Date__c
verificationFIVC.Inspection_Time__c
verificationFIVC.Name__c
verificationFIVC.Purpose__c
verificationFIVC.Remarks__c
verificationFIVC.ROI__c
verificationFIVC.Sourcing_Officer__c
verificationFIVC.Status__c
verificationFIVC.Submission_Date__c
verificationFIVC.Tenor__c
verificationFIVC.Name
VerificationList.add(verificationFIVC);
}
}

*/
}