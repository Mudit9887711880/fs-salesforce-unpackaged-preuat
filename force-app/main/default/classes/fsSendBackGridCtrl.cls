/*
		Date : 22/08/2022
		Author : Mo Arslan
		Description : This class is used to get all the Notes of an Application
*/

public class fsSendBackGridCtrl {
    @AuraEnabled
    public static List<Note> getNotes(String appId){
        return [SELECT Id, ParentId, Title, Body, CreatedDate FROM NOTE WHERE ParentId =:appId ORDER BY CreatedDate DESC];
    }
}