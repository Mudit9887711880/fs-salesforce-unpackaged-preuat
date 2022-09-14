public with sharing class DummyApexClass extends GenericEditPagesController{
    
    @AuraEnabled(Cacheable=true)
    public static GenericEditPagesController.SectionWrapper getSectionContent(){
        DummyApexClass obj = new DummyApexClass();
        obj.METADATA_NAME = 'FIV_C_Revisit';
        obj.IDS_SET = new Set<String>();
        //obj.IDS_SET = new Set<String>{'a030w000008IDapAAG','0010w00000xGng4AAC'};
        obj.IDS_SET = new Set<String>{'a0S0w000001lPQ3EAM'};
        obj.WHERE_CLAUSE = ' Id IN : IDS_SET';
        obj.RECORD_LIMIT = '1';
        return obj.getSectionContent();
    }
    
    @AuraEnabled
    public static String saveSobject(String objectAPIName , String fieldlist){
        System.debug(objectAPIName+' :: '+fieldlist);
        Revisit__c objLoan = (Revisit__c)JSON.deserialize(fieldlist, Revisit__c.class);
        System.debug('objLoan '+objLoan);
        INSERT objLoan;
        return objLoan.id;
    }
}