public class GenericEditPagesControllerHelper extends GenericEditPagesController{
    @AuraEnabled(Cacheable=true)
    public static GenericEditPagesController.SectionWrapper getSectionContent(String recordId, String metaDetaName){
        GenericEditPagesControllerHelper obj = new GenericEditPagesControllerHelper();
        obj.METADATA_NAME = metaDetaName;
        obj.IDS_SET = new Set<String>();
        if(String.isNotEmpty(recordId)){
            obj.IDS_SET = new Set<String>{recordId};
                obj.WHERE_CLAUSE = ' Id IN : IDS_SET';
            obj.RECORD_LIMIT = '1';    
        }
        System.debug('obj.getSectionContent() $$$$$ '+obj.getSectionContent());
        return obj.getSectionContent();
    }  
    
    @AuraEnabled
    public static String saveRecord(sobject dataToInsert){
        try{
            system.debug(':::dataToInsert:::' + dataToInsert);
            upsert dataToInsert;
            //Database.SaveResult sr = Database.upsert(dataToInsert);
            //database.insert(fieldlist);
            //Bank_Detail__c objLoan = (Bank_Detail__c)JSON.deserialize(fieldlist, Bank_Detail__c.class);
            //System.debug('objLoan '+objLoan);
            //insert objLoan;
            //return objLoan.id;
            
        } catch(Exception ex){
        	System.debug('exception ::: '+ex);
            return JSON.serialize(ex);
        }
        return 'Operation Completed Successfully.';
    }
}