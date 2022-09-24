/**
* @File Name          : TRDeviationTriggerHelper
* @Author             : Navin Soni
* @Created On         : 14 Sep 2022
*==============================================================================
* Ver         Date                     Author                 Modification
*==============================================================================
* 1.0       14 Sep 2022              Navin Soni             Initial Version
**/
public class TRDeviationTriggerHelper{
    // This method is use to send Notifications to the Application Davition Approval User.
    public static void sendDevitionNotifications(Boolean isInsert, List<TR_Deviation__c> listOfTRDeviation, Map<Id,TR_Deviation__c> oldMap ){
        Map<String, TR_Deviation__c> mapOfApplications = new Map<String, TR_Deviation__c>();
        Set<String> approvalAuthorityUsers = new Set<String>();
        Set<Application__c> setOfApplication = new Set<Application__c>();
        Set<String> decistionChangedApplications = new Set<String>();

        // Create a new custom notification
        Messaging.CustomNotification currNotification = new Messaging.CustomNotification();
        
        if(listOfTRDeviation != null && listOfTRDeviation.size() > 0){
            
            for(TR_Deviation__c objTRDev : listOfTRDeviation){
                if(isInsert){
                    if(objTRDev.Is_Deviation_Active__c && objTRDev.Is_Deviation_Raised__c && objTRDev.Approval_Authority__c != null){
                        mapOfApplications.put(objTRDev.Application__c, objTRDev);
                    }
                }else{
                    if(objTRDev.Is_Deviation_Active__c && objTRDev.Is_Deviation_Raised__c != oldMap.get(objTRDev.id).Is_Deviation_Raised__c && objTRDev.Is_Deviation_Raised__c && objTRDev.Approval_Authority__c != null){
                        mapOfApplications.put(objTRDev.Application__c, objTRDev);
                    }
                    if(objTRDev.Is_Deviation_Active__c && objTRDev.Is_Deviation_Raised__c && objTRDev.Decistion__c != oldMap.get(objTRDev.id).Decistion__c && objTRDev.Approval_Authority__c != null){
                        decistionChangedApplications.add(objTRDev.Application__c);
                    }
                }
            }
            
            try{
                System.debug('@@##  mapOfApplications' + mapOfApplications.keySet());
                System.debug('@@##  mapOfApplications' + mapOfApplications.size());
                if(mapOfApplications != null && mapOfApplications.size() > 0){
                    // Get the custom Notification type.
                    List<CustomNotificationType > ListOfTemplateInfoDetail = [SELECT Id, DeveloperName FROM CustomNotificationType WHERE DeveloperName = 'Deviation_Notification'];
                    List<Messaging.CustomNotification> LiscurrNotification = new List<Messaging.CustomNotification>();
                    
                    for(String objStr : mapOfApplications.keySet()){
                        // Set the contents for the delinking notification
                        currNotification.setTitle('Deviation has Raised for the Application!');
                        currNotification.setBody(mapOfApplications.get(objStr).Application_Name__c);

                        // Set the notification type and target
                        currNotification.setNotificationTypeId(ListOfTemplateInfoDetail[0].Id);
                        currNotification.setTargetId(objStr);

                        // Send the notification
                        currNotification.send(new Set<String> {mapOfApplications.get(objStr).Approval_Authority__c});
                        
                        Application__c objApp = new Application__c();
                        objApp.id = objStr;
                        objApp.Current_Deviation_Approval__c = mapOfApplications.get(objStr).Approval_Authority__c;
                        objApp.Is_Deviation_Raised__c = TRUE;
                        setOfApplication.add(objApp);
                    }
                    // Update Application.
                    if(setOfApplication != null && setOfApplication.size() > 0){
                        List<Application__c> listOfApplications = new List<Application__c>();
                        listOfApplications.addAll(setOfApplication);
                        Update listOfApplications;
                    }
                }

                if(decistionChangedApplications != null && decistionChangedApplications.size() > 0){
                    removeCurrentApproval(decistionChangedApplications);
                }
            }
            catch (Exception ex) {
                System.debug('Notification Failed: ' + ex.getMessage());
            }
        }
    }

    // This method is used to remove Current Approval user and Davition Raise option.
    public static void removeCurrentApproval(Set<String> setOfApplicationIds){
        List<Application__c> listOfApplications = new List<Application__c>();
        Set<String> setOfNotApprovedApplication = new Set<String>();
        if(setOfApplicationIds != null && setOfApplicationIds.size() > 0){
            for(TR_Deviation__c objTR : [SELECT ID, Application__c, Decistion__c FROM TR_Deviation__c WHERE Application__c IN : setOfApplicationIds AND Is_Deviation_Active__c = TRUE AND Is_Deviation_Raised__c = TRUE ]){
                if(objTR.Decistion__c != 'Approved'){
                    setOfNotApprovedApplication.add(objTR.Application__c);
                }
            }

            for(String applicationId : setOfApplicationIds){
                if(!setOfNotApprovedApplication.contains(applicationId)){
                    Application__c objApp = new Application__c();
                    objApp.id = applicationId;
                    objApp.Current_Deviation_Approval__c = null;
                    objApp.Is_Deviation_Raised__c = FALSE;
                    listOfApplications.add(objApp);
                }
            }

            if(listOfApplications != null && listOfApplications.size() > 0){
                Update listOfApplications;
            }
        }
    }
}