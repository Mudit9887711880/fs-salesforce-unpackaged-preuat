public class FsCourierApplicationGrid {
    
    @AuraEnabled
    public static List<Courier_Application__c> getCourierApplications(String courierControlId){
        System.debug('Courier Application => '+[SELECT Application__r.Name, Courier_Control__r.Name, Status__c, Document_Type__c FROM Courier_Application__c WHERE Courier_Control__c =:courierControlId]);
        return [SELECT Id,Status__c, Application__c, Application__r.Name, Courier_Control__r.Name, Document_Type__c FROM Courier_Application__c WHERE Courier_Control__c =:courierControlId];
    }
    
    @AuraEnabled
    public static Map<String, String> getStatusValues(){
        Map<String, String> statusValuesMap = new Map<String, String>();
        Map<String, String> mapPickListValues = new Map<String, String>();
        Schema.SObjectType objSobjectType = Schema.getGlobalDescribe().get('Courier_Application__c');
        Schema.DescribeSObjectResult objDescribeSobject = objSobjectType.getDescribe();
        Map<String, Schema.SObjectField> mapFields = objDescribeSobject.fields.getMap();
        List<Schema.PicklistEntry> lstPickListValues = mapFields.get('Status__c').getDescribe().getPickListValues();
        for (Schema.PicklistEntry objPickList : lstPickListValues) {
            statusValuesMap.put(objPickList.getLabel(), objPickList.getValue());
        }
        System.debug('statusValuesMap '+statusValuesMap);
        return statusValuesMap;
    }
    
    @AuraEnabled
    public static String updatedCourierApplications(String updatedObjects){
        try {
            List<Application__c> applicationList = new List<Application__c>();
            List<Courier_Application__c> courierApplications = (List<Courier_Application__c>)JSON.deserialize(updatedObjects, List<Courier_Application__c>.class);
            update courierApplications;
            for(Courier_Application__c courierApp : courierApplications){
                Application__c app = new Application__c(Id=courierApp.Application__c);
                if(courierApp.Status__c == 'Received'){
                    app.Stage__c = 'Disbursal Maker';
                }
                else if(courierApp.Status__c == 'Not Received'){
                    app.Stage__c = 'Dispatch Pending';
                }
                applicationList.add(app);
            }
            if(applicationList.size()>0){
                update applicationList;
            }
            return 'success';
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    
    @AuraEnabled
    public static String getIconName(String sObjectName){
        String icon;
        List<Schema.DescribeTabSetResult> tabSetDesc = Schema.describeTabs();
        List<Schema.DescribeTabResult> tabDesc = new List<Schema.DescribeTabResult>();
        List<Schema.DescribeIconResult> iconDesc = new List<Schema.DescribeIconResult>();

        for(Schema.DescribeTabSetResult tsr : tabSetDesc) { tabDesc.addAll(tsr.getTabs()); }
        for(Schema.DescribeTabResult tr : tabDesc) {
            if( sObjectName == tr.getSobjectName() ) {
                if( tr.isCustom() == true ) {
                    iconDesc.addAll(tr.getIcons());
                } else {
                    icon = 'standard:' + sObjectName.toLowerCase();
                }
            }
        }
        for (Schema.DescribeIconResult ir : iconDesc) {
            if (ir.getContentType() == 'image/svg+xml'){
                icon = 'custom:' + ir.getUrl().substringBetween('custom/','.svg').substringBefore('_');
                break;
            }
        }
        return icon;
    }
}