/*
* ──────────────────────────────────────────────────────────────────────────────────────────────────
* @author           Arnav Chaudhary 
* @modifiedBy       Arnav Chaudhary  
* @created          2022-07-15
* @modified         2022-07-15
* @Description      This class is useddisplay fee details related to application .
* ──────────────────────────────────────────────────────────────────────────────────────────────────
*/
public with sharing class FeeCreationComponentHelper {
    public static Decimal tax = 18;
    
    /*
@Author : Arnav
@Description : This method is used to fetch fee value master records for given application id.
*/
    @AuraEnabled(cacheable = true)
    public static List<Fee_Creation__c> createFeeCreationRecords (String applicationId) {
        List<Fee_Creation__c> createFeeCreationList = new List<Fee_Creation__c>();
        System.debug('applicationId   '+applicationId);
        if(String.IsNotBlank(applicationId)){
            List<Fee_Value_Master__c> feeValueMasterList = [SELECT Id, Fee_Type_Code__c, Fee_Type__c, Description__c, Fee_Type_Master__r.Stage_Due__c, Fee_Type_Master__r.Modifiable_at_run_Time__c, Fee_Type_Master__r.Id, Fee_Type_Master__r.Repayment_of_Fee__c, Fee_Type_Master__r.Type__c FROM Fee_Value_Master__c WHERE Fee_Type_Master__r.Active__c = 'Yes' AND Fee_Type__c = 'System' AND Fee_Type_Master__r.Type__c = 'Fee'];
            Map<String, Fee_Creation__c> existingFeeCreationMap = new Map<String, Fee_Creation__c>();
            for(Fee_Creation__c feeCreation : [SELECT Id,Application__c,Fee_Code__c, RecordType.DeveloperName FROM Fee_Creation__c WHERE Application__c = :applicationId AND RecordType.DeveloperName = 'Fee']) {
                if(feeCreation.Application__c != null && String.IsNotBlank(feeCreation.Fee_Code__c)) {
                    existingFeeCreationMap.put(feeCreation.Application__c + '-' +feeCreation.Fee_Code__c, feeCreation );
                }
            }
            System.debug('EXISTING MAPPPPP   '+existingFeeCreationMap);
            Map<String,Decimal> mapFeeAmount = new Map<String,Decimal>();
            if(!feeValueMasterList.isEmpty()) {
                for(Fee_Value_Master__c  feeValue : feeValueMasterList) {
                    //System.debug('VALUEEEEE   '+ existingFeeCreationMap.get(applicationId + '-' + feeValue.Fee_Type_Code__c));
                    System.debug('Type   '+ feeValue.Fee_Type__c);
                    System.debug('CODEEEEE   '+ feeValue.Fee_Type_Code__c);
                    if((!existingFeeCreationMap.containsKey(applicationId + '-' + feeValue.Fee_Type_Code__c)) && feeValue.Fee_Type__c == 'System') {
                        Fee_Creation__c feeCreation = new Fee_Creation__c();
                        feeCreation.Application__c = applicationId;
                        feeCreation.Fee_Code__c = feeValue.Fee_Type_Code__c;
                        feeCreation.Type__c = feeValue.Fee_Type__c;
                        feeCreation.Description__c = feeValue.Description__c;
                        feeCreation.Stage_Due__c = feeValue.Fee_Type_Master__r.Stage_Due__c;
                        feeCreation.Repayment_Type_2__c = 'Deduct from Disbursement';
                        //feeCreation.Repayment_Type_2__c = feeValue.Fee_Type_Master__r.Repayment_of_Fee__c;
                        feeCreation.Fee_Type_Master__c = feeValue.Fee_Type_Master__r.Id;
                        /*      if(String.IsNotBlank(feeValue.Fee_Type_Master__r.Repayment_of_Fee__c)){
if(feeValue.Fee_Type_Master__r.Repayment_of_Fee__c.contains(';')){
feeCreation.Repayment_Type_2__c = feeValue.Fee_Type_Master__r.Repayment_of_Fee__c.split(';')[0];
}else{
feeCreation.Repayment_Type_2__c = feeValue.Fee_Type_Master__r.Repayment_of_Fee__c;
}
}*/
                        feeCreation.RecordTypeId = Schema.SObjectType.Fee_Creation__c.getRecordTypeInfosByDeveloperName().get('Fee').getRecordTypeId();
                        
                        if(feeCreation.Fee_Code__c == 'Cersai'){
                            feeCreation.Applicable_on_Loan_Amount_Asset_Value__c = 'Loan Amount';
                        }else if(feeCreation.Fee_Code__c == 'Technical'){
                            feeCreation.Applicable_on_Loan_Amount_Asset_Value__c = 'EMI';
                        }else if(feeCreation.Fee_Code__c == 'LegaL'){
                            feeCreation.Applicable_on_Loan_Amount_Asset_Value__c = 'Asset Value';
                        }else if(feeCreation.Fee_Code__c == 'IMD'){
                            feeCreation.Applicable_on_Loan_Amount_Asset_Value__c = 'Asset Value';
                        }else if(feeCreation.Fee_Code__c == 'PRC_FEE_Type'){
                            feeCreation.Applicable_on_Loan_Amount_Asset_Value__c = 'EMI';
                        }
                        //@Sangeeta
                        
                        mapFeeAmount = calculation(applicationId, feeCreation.Fee_Code__c);
                        system.debug('amount return'+mapFeeAmount);
                        system.debug('get from map'+mapFeeAmount.get('feeAmount'));
                        if(!mapFeeAmount.isEmpty()){
                            feeCreation.Fee_Amount__c = mapFeeAmount.get('feeAmount'). setscale(2);
                            feeCreation.Tax_Amount__c = mapFeeAmount.get('taxAmount'). setscale(2);
                            feeCreation.Total_Fee__c = mapFeeAmount.get('totalFee'). setscale(2);
                            //  feeCreation.Fee_Collection__c = mapFeeAmount.get('totalFee'). setscale(2); 
                            feeCreation.Fee_Collection__c = 0;                          
                        }                       
                        createFeeCreationList.add(feeCreation);
                    }
                }
                System.debug('SIZEEEEEEEEEEEE   CREATE LIST  '+ createFeeCreationList.Size());
                if(!createFeeCreationList.isEmpty()) {
                    createFeeCreationRecord( JSON.serialize(createFeeCreationList) );
                }
            }
        }
        return createFeeCreationList;
    }
    
    /*
@Author : Arnav
@Description : This method is used to create fee Creation records for given application id.
*/
    @AuraEnabled
    @future
    public static void createFeeCreationRecord (String feeCreation)  {
        System.debug('YESSSSSSSSSS   '+feeCreation);
        if(String.isNotBlank(feeCreation)){
            List<Fee_Creation__c> feeCreationList = (List<Fee_Creation__c>)JSON.deserialize(feeCreation,List<Fee_Creation__c>.class);
            System.debug('VVVVVVVVVVVv ' +feeCreationList);
            Insert feeCreationList;
        }
    }
    
    /*
@Author : Arnav
@Description : This method is used to get existing fee Creation records for given application id.
*/
    @AuraEnabled
    public static String getFeeCreationRecords (String applicationId) {
        System.debug('GET CALLED   '+applicationId);
        List<FeeCreationWrapper> createFeeWrapperList = new List<FeeCreationWrapper>();
        //list added by sangeeta to update system generated records
        List<String> systemFeeCreationId = new List<String>();
        if(String.isNotBlank(applicationId)){
            List<Fee_Creation__c> feeCreationList = [Select Id,Applicable_on_Loan_Amount_Asset_Value__c,Application__c,Fee_Code__c,Type__c,Fee_Type_Master__r.Modifiable_at_run_Time__c,
                                                     Description__c,Stage_Due__c,Repayment_Type_2__c,Fee_Amount__c, Tax_Amount__c,Total_Fee__c, 
                                                     Fee_Collection__c, Fee_Collected__c FROM Fee_Creation__c WHERE Application__c =: applicationId AND RecordType.DeveloperName = 'Fee' Order BY Id];
            System.debug('feeCreationList  '+feeCreationList);
            Integer totalRecords = 0;
            List<String> feeCrea = new List<String>();
            Map<String,Decimal> mapFeeAmount = new Map<String,Decimal>();
            if(!feeCreationList.isEmpty()) {
                Integer count = 1;
                totalRecords  = feeCreationList.size();
                for(Fee_Creation__c feeCreationObj : feeCreationList ) {
                    /*@ Changes done by Sangeeta for calculation*/
                    /* @Method call for calculation based on fee code in fee creation*/              
                    
                    FeeCreationWrapper wrapper = new FeeCreationWrapper();
                    wrapper.Id = feeCreationObj.Id;
                    wrapper.sRNumnber = count;
                    wrapper.feeCode = feeCreationObj.Fee_Code__c;
                    wrapper.type = feeCreationObj.Type__c;
                    wrapper.description = feeCreationObj.Description__c;
                    wrapper.stageDue = feeCreationObj.Stage_Due__c;
                    wrapper.isFeeCollected = feeCreationObj.Fee_Collected__c;
                    List<String> repaymentList = new List<String>();
                    if(String.IsNotBlank(feeCreationObj.Repayment_Type_2__c)){
                        if(feeCreationObj.Repayment_Type_2__c.contains(';')){
                            repaymentList = feeCreationObj.Repayment_Type_2__c.split(';');
                        }else{
                            repaymentList.add(feeCreationObj.Repayment_Type_2__c);
                        }
                    }
                    wrapper.repaymentType = feeCreationObj.Repayment_Type_2__c;
                    
                    if(String.isNotBlank(feeCreationObj.Type__c) && feeCreationObj.Type__c == 'System'){
                        mapFeeAmount = calculation(applicationId, feeCreationObj.Fee_Code__c);
                        system.debug('amount return'+mapFeeAmount);
                        system.debug('get from map'+mapFeeAmount.get('feeAmount'));
                        if(!mapFeeAmount.isEmpty()){
                            wrapper.feeAmount = mapFeeAmount.get('feeAmount'). setscale(2);
                            wrapper.taxAmount = mapFeeAmount.get('taxAmount'). setscale(2);
                            wrapper.totalFee = mapFeeAmount.get('totalFee'). setscale(2);
                            //  wrapper.feeCollection = mapFeeAmount.get('totalFee'). setscale(2);
                            //done by sangeeta if master records created first time and amounts not updated
                            if(feeCreationObj.Fee_Collection__c == null ){
                                feeCreationObj.Fee_Amount__c = wrapper.feeAmount;
                                //   feeCreationObj.Fee_Collection__c = wrapper.feeCollection;
                                feeCreationObj.Fee_Collection__c = 0;
                                systemFeeCreationId.add(feeCreationObj.Id);
                            }
                            else{
                                wrapper.feeCollection = feeCreationObj.Fee_Collection__c;
                            }
                            
                        }
                        else{
                            wrapper.feeAmount = 0;
                            wrapper.taxAmount = 0;
                            wrapper.totalFee = 0;
                            wrapper.feeCollection = 0;
                        }
                    }
                    else if(String.isNotBlank(feeCreationObj.Type__c) && feeCreationObj.Type__c == 'User'){
                        if(feeCreationObj.Fee_Amount__c == null){
                            feeCreationObj.Fee_Amount__c = 0;
                        }
                        if(feeCreationObj.Tax_Amount__c == null){
                            feeCreationObj.Tax_Amount__c = 0;
                        }
                        wrapper.feeAmount = feeCreationObj.Fee_Amount__c;
                        wrapper.taxAmount = feeCreationObj.Tax_Amount__c;
                        System.debug('fee amount'+ wrapper.feeAmount);
                        System.debug('tax amount'+ wrapper.taxAmount);
                        wrapper.totalFee = wrapper.feeAmount + wrapper.taxAmount;
                        //   wrapper.feeCollection = wrapper.totalFee;
                        wrapper.feeCollection = feeCreationObj.Fee_Collection__c;
                    }
                    
                    wrapper.applicableOn = feeCreationObj.Applicable_on_Loan_Amount_Asset_Value__c;
                    wrapper.totalRecord = feeCreationList.size();
                    if(count == totalRecords) {
                        wrapper.buttonFlag =  true;
                    }
                    if(feeCreationList.size() == count){
                        wrapper.showAdd = true;
                    }else{
                        wrapper.showAdd = false;
                    }
                    if(feeCreationObj.Fee_Type_Master__r.Modifiable_at_run_Time__c == 'Yes' && feeCreationObj.Type__c == 'User'){
                        wrapper.modifiable = true;
                    }
                    else {
                        wrapper.modifiable = false;
                    }
                    count += 1;
                    createFeeWrapperList.add(wrapper);
                }
            }
        }
        if(systemFeeCreationId.size() >0){
            updateMasterRecords(systemFeeCreationId);
        }
        return JSON.serialize(createFeeWrapperList);
    }
    public static void updateMasterRecords(List<String> idList){
        List<Fee_Creation__c> feeCreationList = [Select Id,Applicable_on_Loan_Amount_Asset_Value__c,Application__c,Fee_Code__c,Type__c,
                                                 Description__c,Stage_Due__c,Repayment_Type_2__c,Fee_Amount__c, Tax_Amount__c,Total_Fee__c, 
                                                 Fee_Collection__c FROM Fee_Creation__c WHERE Application__c IN :idList AND RecordType.DeveloperName = 'Fee' Order BY Id];
        if(feeCreationList.size()>0){
            update feeCreationList;
        }
    }
    
    /*
@Author : Arnav
@Description : This method is used to add a new row.
*/
    @AuraEnabled(cacheable = true)
    public static String addRow(String wrapperData, String typeOf, String valuesOf) {
        System.debug('Value#####' + valuesOf);
        System.debug('YES CALL APEXXX   '+wrapperData);
        List<FeeCreationWrapper> wrapperFeeCreationList = (List<FeeCreationWrapper>)JSON.deserialize(wrapperData,List<FeeCreationWrapper>.class);
        System.debug('size of list ######' + wrapperFeeCreationList.size());
        integer sizeOfList = wrapperFeeCreationList.size();
        System.debug('dsadsad  '+ wrapperFeeCreationList);
        if(typeOf == 'add'){
            for(integer i =0;i<wrapperFeeCreationList.size();i++){
                wrapperFeeCreationList[i].showAdd = false;
            }
            FeeCreationWrapper wrapperObj = new FeeCreationWrapper();
            wrapperObj.type = 'User';
            wrapperObj.isnewRow = true;
            wrapperObj.sRNumnber = wrapperFeeCreationList.size() + 1;
            wrapperObj.showAdd = true;  
            wrapperObj.stageDue = 'Pre Login';
            wrapperObj.repaymentType = 'Deduct from Disbursement';
            wrapperObj.feeCollection = 0;
            wrapperFeeCreationList.add(wrapperObj);
            system.debug('Size after add #####'+wrapperFeeCreationList.size());
            return JSON.serialize(wrapperFeeCreationList); 
        }  
        else {
            for(integer x = 0 ; x<wrapperFeeCreationList.size();x++){
                if(wrapperFeeCreationList[x].sRNumnber == Integer.valueOf(valuesOf)){
                    wrapperFeeCreationList.remove(x);
                    for(integer i =0;i<wrapperFeeCreationList.size();i++){
                        wrapperFeeCreationList[i].sRNumnber = i+1;
                        if(wrapperFeeCreationList.size() == i+1){ 
                            wrapperFeeCreationList[i].showAdd = true;
                        }
                    }
                }
                
            }
            return JSON.serialize(wrapperFeeCreationList);
        }  
    }
    
    /*
@Author : Arnav
@Description : This method is used to Save a new Fee_Creation__c record.
*/
    @AuraEnabled
    public static void saveRecords(String wrapperData, String applicationId) {
        System.debug('YES CALL APEXXX   ');
        try {
            List<Fee_Creation__c> updateFeeCreationList = new List<Fee_Creation__c>();
            List<FeeCreationWrapper> wrapperFeeCreationList = (List<FeeCreationWrapper>)JSON.deserialize(wrapperData,List<FeeCreationWrapper>.class);
            System.debug('SIZE    ' +wrapperFeeCreationList.size());
            System.debug('DATAAAAAAA   '+wrapperFeeCreationList);
            List<String> wrapFeeCode = new List<String>();
            for(FeeCreationWrapper wrapper : wrapperFeeCreationList) {
                if(wrapper.type == 'User'){
                    wrapFeeCode.add(wrapper.feeCode);
                }
            }
            Map<String, String> masterWithFee = new Map<String, String>();
            List<Fee_Type_Master__C> feeMasterCode = [SELECT Id, Fee_Type_Code__c FROM Fee_Type_Master__c 
                                                      WHERE Fee_Type__c = 'User' AND Type__c ='Fee' AND Active__c = 'Yes' 
                                                      AND Fee_Type_Code__c IN :wrapFeeCode];
            for(Fee_Type_Master__c feeMaster : feeMasterCode){
                masterWithFee.put(feeMaster.Fee_Type_Code__c, feeMaster.Id);
            }
            for(FeeCreationWrapper wrapper : wrapperFeeCreationList) {
                Fee_Creation__c feeObj = new Fee_Creation__c();
                if(wrapper.Id != null && String.isNotBlank(wrapper.Id) ) {
                    feeObj.Id = wrapper.Id;
                }
                feeObj.Applicable_on_Loan_Amount_Asset_Value__c = wrapper.applicableOn;
                feeObj.Description__c = wrapper.description;
                feeObj.Fee_Amount__c = wrapper.feeAmount;
                feeObj.Fee_Code__c = wrapper.feeCode;
                feeObj.Fee_Collection__c = wrapper.feeCollection;
                System.debug('feeObj.Repayment_Type_2__c'+wrapper.repaymentType + feeObj.Fee_Code__c);
                feeObj.Repayment_Type_2__c =  wrapper.repaymentType;
                feeObj.Stage_Due__c = wrapper.stageDue;
                feeObj.Total_Fee__c = wrapper.totalFee;
                feeObj.Type__c = wrapper.type;
                feeObj.Tax_Amount__c = wrapper.taxAmount;
                feeObj.Application__c = applicationId;
                if(masterWithFee.containsKey(feeObj.Fee_Code__c)){
                    system.debug('fee master add'+feeObj.Fee_Code__c);
                    feeObj.Fee_Type_Master__c = masterWithFee.get(feeObj.Fee_Code__c);
                }
                
                updateFeeCreationList.add(feeObj);
            }
            if(!updateFeeCreationList.isEmpty()) {
                upsert updateFeeCreationList;
            }
        }
        catch(Exception e) {
            System.debug('ERROR     '+e.getMessage() + ' Line   ' + e.getLineNumber());
        }
    }
    /* @Method for calculation
@Author Sangeeta */ 
    public static Map<String,Decimal> calculation(String applicationId, String feeCode){
        Decimal feeAmount;
        Decimal totalFee;
        Decimal taxAmount;
        Decimal percentageAmount;
        Decimal loanAmount;
        Map<String, Decimal> mapAmountToFee = new Map<String, Decimal>();
        try{  
            //AND Fee_Type_Master__r.Value__c = 'Loan Amount' removed from this query for all values
            List<Fee_Value_Master__c> feeValueMasterList = [SELECT Id,Fee_Type_Code__c, Amount__c, Cap__c, Floor__c, 
                                                            Fee_Type_Master__r.Amount__c, Fee_Type_Master__r.Calculation_Basis__c,
                                                            Fee_Type_Master__r.Tax__c,Fee_Type_Master__r.Value__c,Fee_Type_Master__r.Type__c,Fee_Type_Master__r.Event__c,Fee_Type_Master__r.Applicable_For__c  
                                                            FROM Fee_Value_Master__c WHERE Fee_Type_Code__c = :feeCode AND Fee_Type_Master__r.Stage_Due__c = 'Pre Login' AND Fee_Type_Master__r.Type__c = 'Fee'
                                                            AND Fee_Type_Master__r.Event__c = 'Application Login' LIMIT 1];
            List<Range_Value_Master__c> rangeValues = [SELECT Id, To__c, From__c, Value__c FROM Range_Value_Master__c];
            //  System.debug('feeValueMasterList'+feeValueMasterList+feeValueMasterList[0].Fee_Type_Master__r.Amount__c + feeValueMasterList[0].Fee_Type_Master__r.Value__c);
            System.debug(feeValueMasterList[0].Fee_Type_Master__r.Calculation_Basis__c +feeValueMasterList[0].Fee_Type_Master__r.Tax__c);
            Application__c appRecord = [SELECT Id, Requested_Loan_Amount__c, Loan_Amount__c FROM Application__c WHERE Id =:applicationId];
            Decimal requestedAmount;
            if(feeValueMasterList[0].Fee_Type_Master__r.Value__c == 'Loan Amount'){
                if(appRecord.Loan_Amount__c != null){
                    System.debug('Loan Amount'+ appRecord.Loan_Amount__c);
                    requestedAmount = appRecord.Loan_Amount__c;
                }
                else{
                    requestedAmount = 0;
                }
            }
            if(feeValueMasterList[0].Fee_Type_Master__r.Value__c == 'Installment Amount'){
                // Installment amount is not defined in application
                System.debug('Installment Amount'+ appRecord.Requested_Loan_Amount__c);
                if(appRecord.Requested_Loan_Amount__c != null){
                    System.debug('Requested_Loan_Amount__c'+ appRecord.Requested_Loan_Amount__c);
                    requestedAmount = appRecord.Requested_Loan_Amount__c;
                }
                else{
                    requestedAmount = 0;
                }
                
            }
            if(feeValueMasterList[0].Fee_Type_Master__r.Value__c == 'Asset Cost'){
                // Asset Cost is not defined in application
                System.debug('Asset Cost'+ appRecord.Requested_Loan_Amount__c);
                if(appRecord.Requested_Loan_Amount__c != null){
                    System.debug('Requested_Loan_Amount__c'+ appRecord.Requested_Loan_Amount__c);
                    requestedAmount = appRecord.Requested_Loan_Amount__c;
                }
                else{
                    requestedAmount = 0;
                }
                
            }
            if(feeValueMasterList <> null && feeValueMasterList.size() > 0 ){
                // removed from below if for range feeValueMasterList[0].Fee_Type_Master__r.Calculation_Basis__c == 'Flat' && 
                if(feeValueMasterList[0].Fee_Type_Master__r.Tax__c == 'Inclusive'){
                    System.debug('feeValueMasterList'+feeValueMasterList+feeValueMasterList[0].Fee_Type_Master__r.Amount__c);
                    if(feeValueMasterList[0].Fee_Type_Master__r.Amount__c == 'Amount'){
                        totalFee = feeValueMasterList[0].Amount__c; // total fee amount for fee creation for 18% tax
                        system.debug(totalFee);
                        mapAmountToFee.put('totalFee',totalFee);
                        feeAmount = totalFee/1.18;//fee amount without tax for fee collection
                        system.debug('feeamount'+feeAmount);
                        mapAmountToFee.put('feeAmount',feeAmount);
                        taxAmount = totalFee - feeAmount;//Tax_Amount__c in fee creation
                        system.debug('tax amount'+ taxAmount);
                        mapAmountToFee.put('taxAmount',taxAmount);
                        System.debug('map of amount'+mapAmountToFee);
                    }
                }
                //feeValueMasterList[0].Fee_Type_Master__r.Calculation_Basis__c == 'Flat' && from below if for range
                else if(feeValueMasterList[0].Fee_Type_Master__r.Tax__c == 'Exclusive'){
                    if(feeValueMasterList[0].Fee_Type_Master__r.Amount__c == 'Amount'){
                        feeAmount = feeValueMasterList[0].Amount__c; // total fee amount for fee creation for 18% tax
                        system.debug('feeamount'+feeAmount);
                        mapAmountToFee.put('feeAmount',feeAmount);
                        taxAmount = feeAmount*tax*.01;//Tax_Amount__c in fee creation
                        system.debug('tax amount'+ taxAmount);
                        mapAmountToFee.put('taxAmount',taxAmount);
                        
                        totalFee = feeAmount+taxAmount; // total fee amount for fee creation for 18% tax
                        system.debug(totalFee);
                        mapAmountToFee.put('totalFee',totalFee);
                        System.debug('map of amount'+mapAmountToFee);
                    }
                }
                // feeValueMasterList[0].Fee_Type_Master__r.Calculation_Basis__c == 'Flat' && from below if for range
                if(feeValueMasterList[0].Fee_Type_Master__r.Calculation_Basis__c <> null && feeValueMasterList[0].Fee_Type_Master__r.Calculation_Basis__c <> '' && feeValueMasterList[0].Fee_Type_Master__r.Amount__c == 'Percentage'){
                    system.debug('feeValueMasterList[0].Fee_Type_Master__r.Amount__c'+feeValueMasterList[0].Fee_Type_Master__r.Amount__c);
                    //Percentage amount from fee value master as percentage of loan amount from application
                    percentageAmount = feeValueMasterList[0].Amount__c; // total fee amount for fee creation for 18% tax
                    system.debug(percentageAmount);
                    // Application__c appRecord = [SELECT Id, Requested_Loan_Amount__c FROM Application__c WHERE Id =:applicationId];
                    System.debug('application loan amount'+ appRecord.Requested_Loan_Amount__c);
                    
                    if(feeValueMasterList[0].Fee_Type_Master__r.Tax__c <> null && feeValueMasterList[0].Fee_Type_Master__r.Tax__c <> '' && feeValueMasterList[0].Fee_Type_Master__r.Tax__c == 'Inclusive' && appRecord.Requested_Loan_Amount__c <> null){
                        // System.debug('application loan amount'+ appRecord.Requested_Loan_Amount__c);
                        System.debug('requestedAmount'+requestedAmount);
                        totalFee = requestedAmount * .01 * percentageAmount;
                        system.debug('totalFee'+totalFee);                     
                        
                        feeAmount = totalFee/1.18;//fee amount without tax for fee collection
                        system.debug('feeamount'+feeAmount);
                        // mapAmountToFee.put('feeAmount',feeAmount);
                        // if cap and floor for fee amount
                        if(feeValueMasterList[0].Floor__c <> null && feeAmount < feeValueMasterList[0].Floor__c){
                            feeAmount = feeValueMasterList[0].Floor__c;
                            mapAmountToFee.put('feeAmount',feeAmount);
                            totalFee = feeAmount + feeAmount * .01 * tax;
                            mapAmountToFee.put('totalFee',totalFee);
                        }
                        else if(feeValueMasterList[0].Cap__c <> null && feeAmount > feeValueMasterList[0].Cap__c){
                            feeAmount = feeValueMasterList[0].Cap__c;
                            mapAmountToFee.put('feeAmount',feeAmount);
                            totalFee = feeAmount + feeAmount * .01 * tax;
                            mapAmountToFee.put('totalFee',feeValueMasterList[0].Cap__c);
                        }
                        else{                          
                            mapAmountToFee.put('totalFee',totalFee);
                            mapAmountToFee.put('feeAmount',feeAmount);
                        }
                        taxAmount = totalFee - feeAmount;//Tax_Amount__c in fee creation
                        system.debug('tax amount'+ taxAmount);
                        mapAmountToFee.put('taxAmount',taxAmount);
                        System.debug('map of amount'+mapAmountToFee);
                        
                    }
                    else if(feeValueMasterList[0].Fee_Type_Master__r.Tax__c <> null && feeValueMasterList[0].Fee_Type_Master__r.Tax__c <> '' && feeValueMasterList[0].Fee_Type_Master__r.Tax__c == 'Exclusive' && appRecord.Requested_Loan_Amount__c <> null){
                        System.debug('application loan amount'+ requestedAmount);
                        feeAmount = requestedAmount * .01 * percentageAmount; // total fee amount for fee creation for 18% tax
                        system.debug('feeamount'+feeAmount);
                        // mapAmountToFee.put('feeAmount',feeAmount);
                        // if cap and floor to be on fee amount
                        if(feeValueMasterList[0].Floor__c <> null && feeAmount < feeValueMasterList[0].Floor__c){
                            feeAmount = feeValueMasterList[0].Floor__c;
                            mapAmountToFee.put('feeAmount',feeAmount);
                        }
                        else if(feeValueMasterList[0].Cap__c <> null && feeAmount > feeValueMasterList[0].Cap__c){
                            feeAmount = feeValueMasterList[0].Cap__c;
                            mapAmountToFee.put('feeAmount',feeAmount);
                        }
                        else{                          
                            mapAmountToFee.put('feeAmount',feeAmount);
                        }
                        taxAmount = feeAmount*tax*.01;//Tax_Amount__c in fee creation
                        system.debug('tax amount'+ taxAmount);
                        mapAmountToFee.put('taxAmount',taxAmount);
                        
                        totalFee = feeAmount+taxAmount; // total fee amount for fee creation for 18% tax
                        system.debug(totalFee);
                        mapAmountToFee.put('totalFee',totalFee);
                        System.debug('map of amount'+mapAmountToFee);
                    }
                }
                // For Range Calculation
                if(feeValueMasterList[0].Fee_Type_Master__r.Calculation_Basis__c == 'Flat' ){
                    System.debug('Calculation Basis'+ feeValueMasterList[0].Fee_Type_Master__r.Calculation_Basis__c);
                }
                else if(feeValueMasterList[0].Fee_Type_Master__r.Calculation_Basis__c == 'Range (Floor + Cap)' ){
                    System.debug('Calculation Basis'+ feeValueMasterList[0].Fee_Type_Master__r.Calculation_Basis__c + rangeValues);
                    if(rangeValues.size() > 0){
                        for(Range_Value_Master__c range : rangeValues){
                            System.debug('range'+ range);
                            if(range.To__c <> null && range.From__c <> null){
                                if(range.To__c > mapAmountToFee.get('totalFee') && range.From__c <= mapAmountToFee.get('totalFee')){
                                    System.debug(mapAmountToFee.get('totalFee'));
                                    if(range.Value__c <> null){
                                        mapAmountToFee.put('totalFee', range.Value__c);
                                        Decimal rangeFee = range.Value__c/1.18;
                                        Decimal rangeTax = mapAmountToFee.get('totalFee') - rangeFee;
                                        mapAmountToFee.put('feeAmount', rangeFee);
                                        mapAmountToFee.put('taxAmount', rangeTax);
                                    }
                                }
                            }
                        }
                    }
                }
                
                //Range calculation end here
            }        
            System.debug('mapAmountToFee'+mapAmountToFee);
        }
        catch(exception e){
            System.debug('Message: ' + e.getMessage() + e.getLineNumber()); 
        }
        return mapAmountToFee;
        
    }
    
    @AuraEnabled
    public static Map<String, String> getRepaymentPicklist_2(String feeCode) {
        Map<String, String> values = new Map<String, String>{};
            List<Fee_Type_Master__c> repaymentString = [SELECT Id, Fee_Type_Code__c, Repayment_of_Fee__c FROM Fee_Type_Master__c
                                                        WHERE Fee_Type_Code__c =: feeCode];
        system.debug('repaymentString'+repaymentString);
        List<String> repaymentList = repaymentString[0].Repayment_of_Fee__c.split(';');
        system.debug('repaymentList'+repaymentList[0]);
        String objectName = 'Fee_Creation__c';
        String fieldName = 'Repayment_Type_2__c';
        
        List<Schema.DescribeSobjectResult> results = Schema.describeSObjects(new List<String>{objectName});
        String feeValue;
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
        return values;
    }
    @AuraEnabled
    public Static Map<String, String> getFeeCodeFromMaster(String applicationId){
        Map<String, String> feeCode = new Map<String, String>();
        System.debug('get fee code from master');
        List<Fee_Creation__c> fee = [SELECT Id, Type__c, Fee_Code__c, Fee_Collection__c, Fee_Type_Master__r.Fee_Type_Code__c,Fee_Type_Master__r.Id, Total_Fee__c FROM Fee_Creation__c WHERE Type__c = 'User' AND RecordType.DeveloperName = 'Fee' AND Application__c =:applicationId];
        List<Fee_Type_Master__C> feeMasterCode = [SELECT Id, Fee_Type_Code__c FROM Fee_Type_Master__c WHERE Fee_Type__c = 'User' AND Type__c ='Fee' AND Active__c = 'Yes'];
        if(feeMasterCode.size() > 0){
            for(Fee_Type_Master__C masterMap : feeMasterCode){
                feeCode.put(masterMap.Id, masterMap.Fee_Type_Code__c);
            }
        }
        system.debug('feeCode before remove'+feeCode);
        if(fee.size() > 0){
            for(Fee_Creation__c feeRemove : fee){
                String masterId = feeRemove.Fee_Type_Master__r.Id;
                if(feeCode.containsKey(masterId)){
                    feeCode.remove(masterId);
                }
                
            }
        }
        System.debug('feeMasterCode'+feeCode);
        return feeCode;
    }
    
    public class FeeCreationWrapper {
        
        public String Id;
        public Integer sRNumnber;
        public String feeCode;
        public String type;
        public String description;
        public String stageDue;
        //public List<SelectOption> repaymentTypeOption;
        public String repaymentType;
        public Decimal feeAmount;
        public Decimal taxAmount;
        public Decimal totalFee;
        public Decimal feeCollection;
        public String applicableOn ;
        public Integer totalRecord ;
        public Boolean buttonFlag = false;
        public Boolean isnewRow = false;
        public Boolean showAdd = false;
        public String masterId = '';
        Public Boolean isFeeCollected = false;
        Public Boolean modifiable = false;
    }
    
}