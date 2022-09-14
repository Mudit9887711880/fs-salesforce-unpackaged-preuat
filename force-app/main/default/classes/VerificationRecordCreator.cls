public class VerificationRecordCreator {
    @AuraEnabled
    public static void createVerificationRecords(String applicationId){
        
        Boolean allCreated = false;
        Application__c objApp = [SELECT Id, Name, Pre_Login__c,Stage__c, hasVerificationRecords__c
                                 FROM Application__c 
                                 WHERE Id =:applicationId];
        if(!objApp.hasVerificationRecords__c){
            list<Verification__c> VerificationList=new list<Verification__c>();
            list<id> bmID=new list<id>();
            list<id> cmID=new list<id>();
            Id FIVBRecordTypeId = Utility.VERIFICATION_FIV_B_RECORD_TYPE_ID;
            Id FIVCRecordTypeId = Utility.VERIFICATION_FIV_C_RECORD_TYPE_ID;
            Id OnlineECRecordTypeId = Utility.VERIFICATION_FIV_EC_RECORD_TYPE_ID;
            //list<account> acclist=[select id ,Branch_Master__c,Branch_Master__r.Name from account where User__c=:userinfo.getuserid()];
            //System.debug('acclist size'+acclist[0].Branch_Master__r.Name);
            /*if(acclist.size()>0)    {
                list<account> bmlist=[select id,user__c ,User__r.Designation__c,Branch_Master__c,Branch_Master__r.name from account where Branch_Master__c=:acclist[0].Branch_Master__c AND (User__r.Designation__c='Branch Manager' OR User__r.Designation__c='Credit Officer')];
                System.debug('bmlist>>>>'+bmlist);
                if(bmlist.size()>0)  {  
                    for(account acclst:bmlist){
                        if(acclst.User__r.Designation__c!=null && acclst.User__r.Designation__c=='Branch Manager')
                            bmID.add(acclst.User__c);
                        if(acclst.User__r.Designation__c!=null && acclst.User__r.Designation__c=='Credit Officer')
                            cmID.add(acclst.User__c);
                    }
                }
            }*/
            bmId.add(userinfo.getuserid());
            cmId.add(userinfo.getuserid());
            if(bmID!=null && cmID!=null){
                
                Verification__c verificationFIVB=new Verification__c();
                verificationFIVB.RecordTypeId=FIVBRecordTypeId;
                verificationFIVB.Application__c=applicationId;
                verificationFIVB.OwnerId= userinfo.getuserid();
                verificationFIVB.status__c='Pending';
                verificationFIVB.Initiate_From__c = 'Pre Login';
                VerificationList.add(verificationFIVB);
                
                Verification__c OnlineEC=new Verification__c();
                OnlineEC.Application__c=applicationId;
                OnlineEC.OwnerId= userinfo.getuserid();
                OnlineEC.RecordTypeId=OnlineECRecordTypeId;
                OnlineEC.Status__c='Pending';
                OnlineEC.Initiate_From__c = 'Pre Login';
                System.debug('OnlineECRecordTypeId :: '+OnlineECRecordTypeId);
                VerificationList.add(OnlineEC);
                
                
                Verification__c verificationFIVC=new Verification__c();
                verificationFIVC.Application__c=applicationId;
                verificationFIVC.OwnerId= userinfo.getuserid();
                verificationFIVC.RecordTypeId=FIVCRecordTypeId;
                System.debug('OnlineECRecordTypeId :: '+OnlineECRecordTypeId);
                verificationFIVC.Status__c='Pending';
                verificationFIVC.Initiate_From__c = 'Pre Login';
                VerificationList.add(verificationFIVC);
                objApp.hasVerificationRecords__c=true;
                objApp.Stage__c = 'Verification';
                if(VerificationList.size()>0){
                    insert VerificationList;
                    update objApp;    
                    for(Verification__c Verification:VerificationList){
                        system.debug(Verification.RecordTypeId+'recirdtype'+FIVCRecordTypeId);
                        /*if(Verification.RecordTypeId==FIVCRecordTypeId){
set<id> idSet=new set<id>();
idSet.add(Verification.id);
RoundRobinAssignment.assignVerificationRoundRobin(idSet);
idSet.clear();

}*/                    //createTask(Verification.id,Verification.OwnerId);
                        String objectAPIName = 'Verification__c';
                        String recTypeName = Schema.getGlobalDescribe().get(objectAPIName).getDescribe().getRecordTypeInfosById().get(Verification.RecordTypeId).getName();            
                        Utility.createTask(UserInfo.getName()+' has assigned you a task',null,Verification.id,Verification.OwnerId,null,'Initiate other process',true);    
                        Utility.sendNotification(UserInfo.getName()+' has assigned you a task',objApp.Name +' :: '+ recTypeName ,Verification.id,'Verification_Notification',Verification.OwnerId);
                        
                    }
                }
            }      
        }
    }

}