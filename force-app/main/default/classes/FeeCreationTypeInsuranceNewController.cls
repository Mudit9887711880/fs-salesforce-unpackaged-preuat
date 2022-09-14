/**
* @Class Name         : FeeCreationTypeInsuranceNewController.apxc
* @Description        : Class to fetch details from Fee_Creation__c, Fee_Type_Master__c and Fee_Value_Master__c for insurance child component
						on Pre-Login Screen/Fee Details.
* @Author             : Sangeeta Yadv
* @Created On         : 25/07/2022
*========================================================================================
* Ver         Date                     Author                       Modification
*========================================================================================
* 1.0      25/07/2022               Sangeeta Yadav                  Initial Version
**/
public with sharing class FeeCreationTypeInsuranceNewController {

    /*
    @Author : Sangeeta
    @Description : This method is used to fetch fee creation records for given application id.
    */
    @AuraEnabled(cacheable = true)
    public static List<Fee_Creation__c> getFeeTypeInsurance(String applicationId){
        List<Fee_Creation__c> listOfExistingInsFeeCreation = new List<Fee_Creation__c>();
        try {
            if(String.isNotBlank(applicationId)){
                // Get fee creation records of type system and record type insurance with limit 1 to show only one record on UI
                listOfExistingInsFeeCreation = [SELECT Id,Type__c,Fee_Code__c,Stage_Due__c,Premium__c,Tax_Amount__c,
                                  Total_Fee__c,Sum_Assured__c,Repayment_Type_2__c, Application__r.Requested_Loan_Amount__c
                                  FROM Fee_Creation__c WHERE Application__c =: applicationId AND Type__c = 'System' AND RecordType.DeveloperName = 'Insurance' WITH SECURITY_ENFORCED];   
            }
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
        return listOfExistingInsFeeCreation;
    }

    /* 
    @Author : Sangeeta
    @Description : This method is used to creat fee creation record for given application id if it does not already contains fee creation records
                      based on fee type master records of type insurance and return single record to display on UI.
    */
    @AuraEnabled(cacheable = true)
    public static List<Fee_Creation__c> createFeeCreationInsuranceRecords (String applicationId){
        System.debug('@@## applicationId   '+applicationId);
        List<Fee_Creation__c> createFeeCreationInsuranceList = new List<Fee_Creation__c>();
        // Map of repayment and fee creation id for Repayment multi picklist from Fee_Type_Master__c object to pass to Rrpayment_Type_2__c picklist of Fee creation
        Map<String, String> mapFeeToRepayment = new Map<String,String>(); 
        // Map for fee creation Id and fee value master id for calculation
        Map<String, String> mapFeeToRepaymentmapFeeToValueMaster = new Map<String,String>(); 
        // fetch fee value of type system
        List<Fee_Value_Master__c> feeValueMasterList = [SELECT Id, Fee_Type_Code__c, Fee_Type__c, Description__c, Fee_Type_Master__r.Stage_Due__c, Fee_Type_Master__r.Repayment_of_Fee__c, Fee_Type_Master__r.Type__c FROM Fee_Value_Master__c WHERE Fee_Type__c = 'System' AND Fee_Type_Master__r.Type__c = 'Insurance'];
        // map to store existing records of type insurancefor given application 
        Map<String,Fee_Creation__c> existingFeeCreationInsuranceMap = new Map<String,Fee_Creation__c>();
		List<Fee_Creation__c> feeCreationInsList = [SELECT Id,Application__c,Application__r.Requested_Loan_Amount__c,Fee_Code__c, RecordType.Name FROM Fee_Creation__c WHERE Application__c =: applicationId AND RecordType.DeveloperName = 'Insurance'];
        for(Fee_Creation__c feeCreationIns : feeCreationInsList) {
            if(feeCreationIns.Application__c != null && feeCreationIns.Fee_Code__c != null && feeCreationIns.RecordType.Name == 'Insurance') {
                existingFeeCreationInsuranceMap.put(feeCreationIns.Application__c + '-' +feeCreationIns.Fee_Code__c, feeCreationIns );
            }
        }
        System.debug('EXISTING MAPPPPP   '+existingFeeCreationInsuranceMap);
        Decimal reqLoanAmount = [SELECT Id, Requested_Loan_Amount__c From Application__c WHERE Id =:applicationId].Requested_Loan_Amount__c;
        if(!feeValueMasterList.isEmpty()) {
            // create fee creation records based on master records
            for(Fee_Value_Master__c  feeValue : feeValueMasterList) {
                //System.debug('VALUEEEEE   '+ existingFeeCreationInsuranceMap.get(applicationId + '-' + feeValue.Fee_Type_Code__c));
                System.debug('Type   '+ feeValue.Fee_Type__c);
                System.debug('CODEEEEE   '+ feeValue.Fee_Type_Code__c);

                if(!(existingFeeCreationInsuranceMap.containsKey(applicationId + '-' + feeValue.Fee_Type_Code__c)) && String.IsNotBlank(feeValue.Fee_Type__c) && feeValue.Fee_Type__c == 'System') {
                    Fee_Creation__c feeCreation = new Fee_Creation__c();
                    feeCreation.Application__c = applicationId;
                    feeCreation.Fee_Code__c = feeValue.Fee_Type_Code__c;
                    feeCreation.Type__c = feeValue.Fee_Type__c;
                    feeCreation.Description__c = feeValue.Description__c;
                    feeCreation.Stage_Due__c = feeValue.Fee_Type_Master__r.Stage_Due__c;
                    feeCreation.Repayment_Type_2__c = 'Deduct from Disbursement';
                    //feeCreation.Sum_Assured__c = feeCreationInsList.Application__r.Requested_Loan_Amount__c;
                    // fetch record type Id for insurance to create records for insurance.
                    if(reqLoanAmount != null){
                        feeCreation.Sum_Assured__c = reqLoanAmount;}
                    else{feeCreation.Sum_Assured__c = 0;}
                    feeCreation.RecordTypeId = Schema.SObjectType.Fee_Creation__c.getRecordTypeInfosByDeveloperName().get('Insurance').getRecordTypeId();
                    createFeeCreationInsuranceList.add(feeCreation);
                }
            }
            System.debug('SIZEEEEEEEEEEEE   CREATE LIST  '+ createFeeCreationInsuranceList);
            if(!createFeeCreationInsuranceList.isEmpty()) {
                createFeeCreationRecord( JSON.serialize(createFeeCreationInsuranceList) );                
            }
        }
        return createFeeCreationInsuranceList;
    }

    /*
    @Author : Sangeeta
    @Description : This method is used to insert new created records as method called in lwc can not insert records directly  
    */
    @AuraEnabled(cacheable = true)
    @future
    public static void createFeeCreationRecord (String feeCreation)  {
        System.debug('feeCreation ' +feeCreation);
        if(String.isNotBlank(feeCreation)){
            List<Fee_Creation__c> feeCreationList = (List<Fee_Creation__c>)JSON.deserialize(feeCreation,List<Fee_Creation__c>.class);
            System.debug('VVVVVVVVVVVv ' +feeCreationList);
            insert feeCreationList;
        }
    }

    /*
    @Author : Sangeeta
    @Description : This method is used to update user entered sum insured on value change in sum insured column
    */
    @AuraEnabled(cacheable = true)
    Public static String updateFeeCreationInsuranceRecordsSumAssured(String feeCreationId, Decimal sumAssured, Decimal premium, Decimal taxAmount, Decimal totalFee, String repayment){
        system.debug('update fee creation' + feeCreationId + sumAssured);
        Fee_Creation__c feeCreationUpdate = [SELECT Id, Sum_Assured__c, Premium__c,Repayment_Type_2__c From Fee_Creation__c WHERE Id =: feeCreationId LIMIT 1];// limit to be add
        system.debug(feeCreationUpdate);
        feeCreationUpdate.Sum_Assured__c = sumAssured;
        feeCreationUpdate.Premium__c = premium;
        feeCreationUpdate.Tax_Amount__c = taxAmount;
        feeCreationUpdate.Total_Fee__c = totalFee;
        feeCreationUpdate.Repayment_Type_2__c = repayment;
        system.debug(feeCreationUpdate);
        if(feeCreationUpdate != null) {
            updateCallFeeCreationRecord( JSON.serialize(feeCreationUpdate) );
        }
        
        return 'feeCreationUpdate';
        
    }

    @AuraEnabled(cacheable=true)
    @future
    public static void updateCallFeeCreationRecord (String feeCreation)  {
        System.debug('update feecreation '+ feeCreation);
        Fee_Creation__c feeCreationUpdate = (Fee_Creation__c)JSON.deserialize(feeCreation,Fee_Creation__c.class);
        update(feeCreationUpdate);
        
    }

    /*
    @Author : Sangeeta
    @Description : To get picklist values based on fee value master.
    */
    @AuraEnabled(cacheable = true)
    public static Map<String, String> getRepaymentPicklist(String feeCode) {
        Map<String, String> values = new Map<String, String>{};
        if(String.isNotBlank(feeCode)){
            List<Fee_Type_Master__c> listOfFeeTypeMaster = [SELECT Id, Fee_Type_Code__c, Repayment_of_Fee__c FROM Fee_Type_Master__c
                                                        WHERE Fee_Type_Code__c =: feeCode];
            system.debug('listOfFeeTypeMaster '+ listOfFeeTypeMaster);
            if(listOfFeeTypeMaster != null && listOfFeeTypeMaster.size() > 0){
                List<String> repaymentList = new List<String>();
                if(String.IsNotBlank(listOfFeeTypeMaster[0].Repayment_of_Fee__c)){
                    if(listOfFeeTypeMaster[0].Repayment_of_Fee__c.contains(';')){
                        repaymentList = listOfFeeTypeMaster[0].Repayment_of_Fee__c.split(';');
                    }else{
                        repaymentList.add(listOfFeeTypeMaster[0].Repayment_of_Fee__c);
                    }
                }
                system.debug('repaymentList '+repaymentList);
                String objectName = 'Fee_Creation__c';
                String fieldName = 'Repayment_Type_2__c';
                
                List<Schema.DescribeSobjectResult> results = Schema.describeSObjects(new List<String>{objectName});
                String feeValue = '';
                for(Schema.DescribeSobjectResult res : results) {
                    for (Schema.PicklistEntry entry : res.fields.getMap().get(fieldName).getDescribe().getPicklistValues()) {
                        if (entry.isActive()) {
                            feeValue = entry.getLabel();
                            if(repaymentList.contains(feeValue)){
                                values.put(entry.getValue(), entry.getLabel());
                            }
                            system.debug('entry'+ feeValue);
                        }
                    }system.debug('map'+ values);
                }
            }
        }
        return values;
    }
    
    /*
@Author : Navin Soni
@Description : This method is use to call Kotak Calculate API.
*/
    /*  @AuraEnabled
public static List<Premium_Details__c> callKotakCalculateAPI(String applicationId){
KotakCalculateAPI.callKotakCalculateAPI(applicationId);
List<Premium_Details__c> listOfPremiumDetails = [SELECT Id, Application__c, Sum_Assured__c, Premium__c, Service_Tax__c, Total_Premium__c FROM Premium_Details__c where Application__c =: applicationId ORDER BY ID DESC LIMIT 1 ];
if(listOfPremiumDetails != null && listOfPremiumDetails.size() > 0){
return listOfPremiumDetails;
}
return null;
}*/


}