public class DosConditionController {
  @AuraEnabled(cacheable=true)
    public static List<DosListWrapper> dosConditionData(String recordId){
        List<DosListWrapper> dosWrapperList = new List<DosListWrapper>();
        if(String.IsNotBlank(recordId)){
            List<Application__c> appList = [SELECT 
                                            ID, Name, Group_Total_Exposure__c, Loan_Amount__c, Sourcing_Branch__r.State__c 
                                            FROM Application__c
                                            WHERE ID =:  recordId];
                if(!appList.isEmpty()){
                    for(Application__c appObj : appList) {
                        DosListWrapper wrapper = new DosListWrapper();
                        wrapper.Id = appObj.ID;
                        wrapper.ApplicationName = appObj.Name;
                        wrapper.Loanamount = appObj.Group_Total_Exposure__c;
                        wrapper.State = appObj.Sourcing_Branch__r.State__c;
                        wrapper.Totalexposure = appObj.Group_Total_Exposure__c;
                        if(wrapper.State == 'TN' || wrapper.State == 'AP' || wrapper.State == 'TS' || wrapper.State == 'KA'){
                            if(appObj.Group_Total_Exposure__c <= 400000)
                                wrapper.DOSrequirement = 'No';
                            if(appObj.Group_Total_Exposure__c > 400000)
                                wrapper.DOSrequirement = 'Yes';
                        }
                        if(wrapper.State == 'MP' || wrapper.State == 'MH' || wrapper.State == 'CG' || wrapper.State == 'UP' ){
                            if(appObj.Group_Total_Exposure__c <= 300000)
                                    wrapper.DOSrequirement = 'No';
                            if(appObj.Group_Total_Exposure__c > 300000)
                                    wrapper.DOSrequirement = 'Yes';
                        } 
                    dosWrapperList.add(wrapper);
                }
            }system.debug('post'+ dosWrapperList);
        } return dosWrapperList;
    }
  
    @AuraEnabled
    public static Boolean checkDOSCondition(String recordId){
        Boolean decision = true;
        if(String.IsNotBlank(recordId)){
            List<Application__c> appList = [SELECT 
                                            ID, Name, Group_Total_Exposure__c, Loan_Amount__c, Sourcing_Branch__r.State__c 
                                            FROM Application__c
                                            WHERE ID =:  recordId];
            String branch = appList.get(0).Sourcing_Branch__r.State__c;           
            Decimal amount = appList.get(0).Group_Total_Exposure__c;                      
            if(branch == 'TN' || branch == 'AP' || branch == 'TS' || branch == 'KA'){
                if(amount <= 400000){
                    decision = false;
                }
            }else if(branch == 'MP' || branch == 'MH' || branch == 'CG' || branch == 'UP'){
                if(amount <= 300000){
                    decision = false;
                }
            }
            appList.get(0).DOS_Required__c = decision;
            update appList;
        }
        return decision;
    }

    public class DosListWrapper{
        @AuraEnabled public String ApplicationName;
        @AuraEnabled public String Id;
        @AuraEnabled public String State;        
        @AuraEnabled public Decimal Loanamount ;        
        @AuraEnabled public Decimal Totalexposure;        
        @AuraEnabled public String DOSrequirement;                  
    }
}