public class FsOnlineEc_ControllerHelper extends GenericFormBuilderController {
    @AuraEnabled
    public static GenericFormBuilderController.InitWrapper getEditPageContent(String recordIds, String metaDetaName){
        FsOnlineEc_ControllerHelper genericObj = new FsOnlineEc_ControllerHelper();
        genericObj.METADATA_NAME = metaDetaName;
        genericObj.IDS_SET = new Set<String>();
        if(String.isNotEmpty(recordIds)){
            genericObj.IDS_SET = new Set<String>();
             genericObj.IDS_SET.addAll(recordIds.split('_'));
        /*    String rcId = Schema.getGlobalDescribe().get('Property__c').getDescribe().getRecordTypeInfosByName().get('Online EC Property Detail').getRecordTypeId();
             genericObj.IDS_SET.add(rcId);*/
                genericObj.WHERE_CLAUSE = ' Id IN : IDS_SET';
            genericObj.RECORD_LIMIT = '1'; 
        }
       System.debug('genericObj.initialize() $$$$$ '+genericObj.initialize());
       return genericObj.initialize();
    }  
	@AuraEnabled
    public static string saveRecord(sobject dataToInsert){
        try{
            system.debug('dataToInsert=' + dataToInsert);
            upsert dataToInsert;
             } catch(Exception ex){
        	System.debug('exception ::: '+ex);
            return JSON.serialize(ex);
        }
        return 'Operation Completed Successfully.';
       
       
    }

}