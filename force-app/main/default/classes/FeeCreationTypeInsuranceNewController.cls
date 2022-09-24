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
             	// if records to disply in insurance of fee detail of type system only
                /*   listOfExistingInsFeeCreation = [SELECT Id,Type__c,Fee_Code__c,Stage_Due__c,Premium__c,Tax_Amount__c,
                                  Total_Fee__c,Sum_Assured__c,Repayment_Type_2__c, Application__r.Requested_Loan_Amount__c
                                  FROM Fee_Creation__c WHERE Application__c =: applicationId AND Type__c = 'System' AND RecordType.DeveloperName = 'Insurance' WITH SECURITY_ENFORCED];   
            */
                // list of insurance for type system and user
             listOfExistingInsFeeCreation = [SELECT Id,Type__c,Fee_Code__c,Stage_Due__c,Premium__c,Tax_Amount__c,External_Agency_Master__r.Name,
                                  Total_Fee__c,Sum_Assured__c,Repayment_Type_2__c, Application__r.Requested_Loan_Amount__c, Fee_Collected__c, Applicable_For__c, Property__c, Loan_Applicant__c,Loan_Applicant__r.Applicant_Name__c, Property__r.Name
                                  FROM Fee_Creation__c WHERE Application__c =: applicationId AND RecordType.DeveloperName = 'Insurance' Order by Fee_Code__c Asc];   

            }
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
        return listOfExistingInsFeeCreation;
    }

    /* 
    @Author : Sangeeta
    @Description : This method is used to create fee creation record for given application id if it does not already contains fee creation records
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
        List<Fee_Value_Master__c> feeValueMasterList = [SELECT Id, Fee_Type_Code__c, Fee_Type__c, Description__c, Fee_Type_Master__r.Stage_Due__c, Fee_Type_Master__r.Repayment_of_Fee__c, Fee_Type_Master__r.Type__c FROM Fee_Value_Master__c WHERE Fee_Type__c = 'User' AND Fee_Type_Master__r.Type__c = 'Insurance' AND Fee_Type_Master__r.Active__c = 'Yes'];
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

                if(!(existingFeeCreationInsuranceMap.containsKey(applicationId + '-' + feeValue.Fee_Type_Code__c)) && String.IsNotBlank(feeValue.Fee_Type__c) && feeValue.Fee_Type__c == 'User') {
                    Fee_Creation__c feeCreation = new Fee_Creation__c();
                    feeCreation.Application__c = applicationId;
                    feeCreation.Fee_Code__c = feeValue.Fee_Type_Code__c;
                    feeCreation.Type__c = feeValue.Fee_Type__c;
                    feeCreation.Description__c = feeValue.Description__c;
                    feeCreation.Stage_Due__c = feeValue.Fee_Type_Master__r.Stage_Due__c;
                    feeCreation.Fee_Type_Master__c = feeValue.Fee_Type_Master__r.Id;
                    if(reqLoanAmount != null){
                        feeCreation.Sum_Assured__c = reqLoanAmount;}
                    else{feeCreation.Sum_Assured__c = 0;}
                    feeCreation.Repayment_Type_2__c = 'Deduct from Disbursement';
                    // fetch record type Id for insurance to create records for insurance.
                    feeCreation.Applicable_For__c = null;
                    feeCreation.External_Agency_Master__c = null;
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
            System.debug('id created'+ feeCreationList[0].Id);
        }
    }

    /*
    @Author : Sangeeta
    @Description : This method is used to update user entered sum insured on value change in sum insured column
    */
    @AuraEnabled(cacheable = true)
    Public static String updateFeeCreationInsuranceRecordsSumAssured(String feeCreationId, Decimal sumAssured, Decimal premium, Decimal taxAmount, Decimal totalFee, String repayment, String applicableForValue, String applicableForSelect, String agencyName){
        system.debug('update fee creation' + feeCreationId + sumAssured + applicableForValue + applicableForSelect + agencyName);
        Fee_Creation__c feeCreationUpdate = [SELECT Id, Sum_Assured__c, Fee_Code__c, Premium__c,Repayment_Type_2__c, Applicable_For__c, Loan_Applicant__r.Applicant_Name__c From Fee_Creation__c WHERE Id =: feeCreationId LIMIT 1];// limit to be add
        system.debug(feeCreationUpdate);
      //  feeCreationUpdate.Fee_Code__c = feeCreationUpdate.Fee_Code__c + rowNo;
      //  String agencyId = [SELECT Id, Name FROM External_Agency_Master__c WHERE Name =: agencyName].Id;
        System.debug('Agency Id'+agencyName);
        System.debug(feeCreationUpdate.Fee_Code__c);
        feeCreationUpdate.Sum_Assured__c = sumAssured;
        feeCreationUpdate.Premium__c = premium;
        feeCreationUpdate.Tax_Amount__c = taxAmount;
        feeCreationUpdate.Total_Fee__c = totalFee;
        feeCreationUpdate.Repayment_Type_2__c = repayment;
        System.debug('applicable for'+applicableForValue);
        feeCreationUpdate.Applicable_For__c = applicableForValue;
        if(feeCreationUpdate.Applicable_For__c == 'Applicant'){
            feeCreationUpdate.Loan_Applicant__c = applicableForSelect;
            feeCreationUpdate.Property__c = null;
        }
        else if(feeCreationUpdate.Applicable_For__c == 'Asset'){
            feeCreationUpdate.Property__c = applicableForSelect;
            feeCreationUpdate.Loan_Applicant__c = null;
        }
        else if(feeCreationUpdate.Applicable_For__c == 'Application'){
            feeCreationUpdate.Property__c = null;
            feeCreationUpdate.Loan_Applicant__c = null;
        }
        
           //feeCreationUpdate.External_Agency_Master__c = agencyId;
           feeCreationUpdate.External_Agency_Master__c = agencyName;
           
           System.debug('Fee creation Agency'+ feeCreationUpdate.External_Agency_Master__c);
       
        
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
    /*@Author : Sangeeta
    @Description : This method is used to add new row to insurance details */
    @AuraEnabled
    public static Fee_Creation__c addRow(String applicationId, String feeCode, String rowNo, String stageName){
     //   List<Fee_Creation__c> wrapperFeeCreationList = (List<Fee_Creation__c>)JSON.deserialize(feeExist,List<Fee_Creation__c>.class);
     //   system.debug('wrapper'+ wrapperFeeCreationList);
        system.debug(feecode + 'stageNAme'+stageName);
        Fee_Creation__c feeCreated = new Fee_Creation__c();
        Decimal requestLoanAmount = [SELECT Id, Requested_Loan_Amount__c FROM Application__c WHERE Id =:applicationId].Requested_Loan_Amount__c;
        feeCreated.Fee_Code__c = feeCode + rowNo;
        feeCreated.Total_Fee__c = 0;
        feeCreated.Type__c = 'User';
        if(stageNAme != null || stageName != ''){
            feeCreated.Stage_Due__c = stageName;
        }
        else{
            feeCreated.Stage_Due__c = 'Pre Login';
        }
        
        feeCreated.Tax_Amount__c = 0;
        feeCreated.Premium__c = 0;
        feeCreated.Repayment_Type_2__c = 'Deduct from Disbursement';  
        feeCreated.Applicable_For__c = '';
        feeCreated.External_Agency_Master__c = null;
      //  feeCreated.Applicable_For__c = 'Application';
      //  feeCreated.Loan_Applicant__c = null;
      //  feeCreated.Property__c = null;
        feeCreated.RecordTypeId = Schema.SObjectType.Fee_Creation__c.getRecordTypeInfosByDeveloperName().get('Insurance').getRecordTypeId();
        if(requestLoanAmount != null){
            feeCreated.Sum_Assured__c = requestLoanAmount;}
        else{
            feeCreated.Sum_Assured__c = 0;}
        feeCreated.Application__c = applicationId; 
        
        system.debug('list is'+ feeCreated);
        return feeCreated;
    }
    /*@Author : Sangeeta
      @Description : this method is used to create new record of insurance added by user from fee detail screen*/
   
    @AuraEnabled
    public static void createNewFee(Fee_Creation__c feeCreate, String appId, String agencyName, String applicableTo, String applicableForValue){
        system.debug('feeCreate'+feeCreate + agencyName + applicableTo + applicableForValue);
        List<Fee_creation__c> craeteFee = new List<Fee_creation__c>();
       
  
        if(feeCreate != null && appId != null && appId != ''){
         //   Application__c requestLoanAmount = [SELECT Id, Requested_Loan_Amount__c FROM Application__c WHERE Id =:appId];
         /*   feeCreate.Sum_Assured__c = requestLoanAmount.Requested_Loan_Amount__c;
			system.debug('feeCreate'+feeCreate);*/
            feeCreate.External_Agency_Master__c = agencyName;
            if(applicableForValue == 'Applicant'){
                feeCreate.Loan_Applicant__c = applicableTo;
            }
            else if(applicableForValue == 'Asset'){
                feeCreate.Property__c = applicableTo;
            }
            craeteFee.add(feeCreate);
          //	createFeeCreationRecord( JSON.serialize(feeCreate) ); 
                 
        }
        if(craeteFee.size() == 1){
            createNewFeeCreationNewRowRecord(JSON.serialize(craeteFee)); 
        }
    }
    public static void createNewFeeCreationNewRowRecord (String feeCreation)  {
        System.debug('feeCreation ' +feeCreation);
        if(String.isNotBlank(feeCreation)){
            List<Fee_Creation__c> feeCreationList = (List<Fee_Creation__c>)JSON.deserialize(feeCreation,List<Fee_Creation__c>.class);
            System.debug('VVVVVVVVVVVv ' +feeCreationList[0].External_Agency_Master__c);
          //  String agencyId = [SELECT Id, Name FROM External_Agency_Master__c WHERE Name =: feeCreationList[0].External_Agency_Master__c].Id;
           // feeCreationList[0].External_Agency_Master__c = agencyId;
            insert feeCreationList;
            System.debug('id created'+ feeCreationList[0].Id);
         //   updateFeeCreationInsuranceRecordsSumAssured(feeCreationList[0].Id, feeCreationList[0].Sum_Assured__c, feeCreationList[0].Premium__c, feeCreationList[0].Tax_Amount__c, feeCreationList[0].Total_Fee__c, feeCreationList[0].Repayment_Type_2__c, '', '');

        }
    }
    /*Description: To get picklist values from Fee type master for applicable for*/
    @AuraEnabled
    public static Map<String, String> picklistValues(String objectName, String fieldName) {
        Map<String, String> values = new Map<String, String>{};

        List<Schema.DescribeSobjectResult> results = Schema.describeSObjects(new List<String>{objectName});
        
        for(Schema.DescribeSobjectResult res : results) {
            for (Schema.PicklistEntry entry : res.fields.getMap().get(fieldName).getDescribe().getPicklistValues()) {
                if (entry.isActive()) {
                    values.put(entry.getValue(), entry.getLabel());
                }
            }
        }

        return values;
    }
    // to get list of applicant and property based on applicable on selection
    @AuraEnabled
    public static Map<String, String> getLoanApplicant(String applicationId, String applicableFor){
        Map<String, String> applicableString = new Map<String, String>();
        system.debug('applicableFor'+applicableFor);
        if(ApplicationId != null && ApplicationId != ''){
            if(applicableFor == 'Applicant'){
                List<Loan_Applicant__c> applicantDetails = [SELECT Id, Applicant_Name__c FROM Loan_Applicant__c 
                                                            WHERE Application__c =:applicationId];
                for(Loan_Applicant__c appName : applicantDetails){
                    applicableString.put(appName.Id, appName.Applicant_Name__c);
                }
            }
            else if(applicableFor == 'Asset'){
                List<Property__c> propertyDetails = [SELECT Id, Name FROM Property__c 
                                                            WHERE Application__c =:applicationId];
                for(Property__c propName : propertyDetails){
                    applicableString.put(propName.Id, propName.Name);
                }
            }
            else{
                
            }
        }
        system.debug('applicable for:'+applicableString);
        return applicableString;
    }
    //Method to show Agency Name from agency master
    @AuraEnabled
    Public static Map<String, String> getAgencyPicklist(){
        List<External_Agency_Master__c> agencyList = [SELECT Id, Name FROM External_Agency_Master__c];
        Map<String, String> agencyName = new Map<String, String>();
        for(External_Agency_Master__c agency : agencyList){
            agencyName.put(agency.Id, agency.Name);
        }
        System.debug('Agency Map'+agencyName);
        return  agencyName;       
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