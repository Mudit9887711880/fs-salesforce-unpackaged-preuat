public class pcDeviationController {

    // to get the Deviation Table Records 
    @AuraEnabled
    public static GenericDataTableController.DataTableResponse getDeviationData(String appId ,String deviationType){
        
        GenericDataTableController genericDTObjCapabilty = new GenericDataTableController();
        genericDTObjCapabilty.METADATA_NAME = 'PC_Deviation_Grid' ;
        genericDTObjCapabilty.IDS_SET = new Set<String>();
        genericDTObjCapabilty.IDS_SET.add(appId);
        genericDTObjCapabilty.IDS_SET.add(deviationType);
        genericDTObjCapabilty.WHERE_CLAUSE =' Application__c IN : IDS_SET AND Deviation_Type__c IN :IDS_SET';
        return genericDTObjCapabilty.getTable();
    } 


    // to get all the codes from the MS Deviation Master to autopopulate in fields
    @AuraEnabled
    public static Map<String,MS_Deviation__c> getcodesfromDeviation()
    {

        Map<String,MS_Deviation__c> msMap = new Map<String,MS_Deviation__c>();
        for(MS_Deviation__c msObj:[SELECT Id,Code__c,Deviation_Description__c,Deviation_Level__c,Deviation_Type__c FROM MS_Deviation__c
        WHERE Deviation_Type__c = 'Manual'])
        {
            if(msObj.Code__c != null)
            msMap.put(msObj.Code__c,msObj);
        }
            return msMap;
    }

    
 


}