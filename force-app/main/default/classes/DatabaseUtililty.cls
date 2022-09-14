public without sharing class DatabaseUtililty {
    
    @AuraEnabled
    public static String getRecordTypeId(String sObjectName, String recordTypeName){
        return Schema.getGlobalDescribe().get(sObjectName).getDescribe().getRecordTypeInfosByName().get(recordTypeName).getRecordTypeId();
    }
    
    @AuraEnabled
    public static List<Application__c> getApplicationDetails(String appId){
        return [SELECT Id, Name, Pre_Login__c FROM Application__c WHERE Id =: appId LIMIT 1];
    }
    
    @AuraEnabled
    public static List<Verification__c> getVerification(String recordId){
        return [SELECT Id, Application__c FROM Verification__c WHERE Id =: recordId AND RecordType.Name = 'FIV - C'];
    }
    
    @AuraEnabled
    public static Map<Id,Account> getApplicantRecords(String appId){
        Set<String> applicantIds = new Set<String>();
        for(Loan_Applicant__c loanApplicant : [SELECT Id, Customer_Information__c FROM Loan_Applicant__c WHERE Application__c =: appId]){
            applicantIds.add(loanApplicant.Customer_Information__c);
        }
        return new Map<Id,Account>([SELECT Id, Name FROM Account WHERE Id IN : applicantIds]);
    }
    
    @AuraEnabled
    public static Map<Id,Loan_Applicant__c> getLoanApplicantRecords(String appId){
        Map<Id,Loan_Applicant__c> loanApplicantMap = new Map<Id,Loan_Applicant__c>();
        for(Loan_Applicant__c loanApplicant : [SELECT Id, Application__c, Customer_Information__c, mobile__c, Customer_Information__r.Name FROM Loan_Applicant__c WHERE Application__c =: appId]){
            loanApplicantMap.put(loanApplicant.Customer_Information__c, loanApplicant);
        }
        return loanApplicantMap;
    }
    
    @AuraEnabled
    public static Map<Id, Property__c> getPropertyRecords(String appId, String loanApplicationId){
        return new Map<Id, Property__c>([SELECT Id, Name, Login__c FROM Property__c WHERE Application__c =: appId AND Loan_Applicant__c =: loanApplicationId AND RecordType.Name = 'Pre Login Property Detail']);
    }
    
    @AuraEnabled
    public static string generatePublicLink(String contentVersionId, String uploadedFrom){
        try{
            ContentVersion cv = [SELECT Id, ContentDocumentId, Title, FileType, FileExtension, ContentSize FROM ContentVersion WHERE Id =:contentVersionId AND FileExtension IN ('jpg','jpeg','png','tiff','tif') LIMIT 1];
            cv.Uploaded_From__c = uploadedFrom;
            update cv;
            ContentDistribution cd = new ContentDistribution();
            cd.Name = cv.Title;
            cd.ContentVersionId = cv.id;
            cd.PreferencesAllowViewInBrowser= true;
            cd.PreferencesLinkLatestVersion=true;
            cd.PreferencesNotifyOnVisit=false;
            cd.PreferencesPasswordRequired=false;
            cd.PreferencesAllowOriginalDownload= true;
            insert cd;
            return 'success';
        }catch(Exception ex){
            throw new AuraHandledException(ex.getMessage());
        }
    }
    
    @AuraEnabled
    public static Map<String,Boolean> checkRequiredDocs(String appId, List<String> docList){
        list<id> lstConDocs = new list<id>();
        System.debug('appId= '+appId);
        for(ContentDocumentLink cntLink : [Select Id, ContentDocumentId From ContentDocumentLink Where LinkedEntityId =: appId]) {
            lstConDocs.add(cntLink.ContentDocumentId);    
        }
        Map<String,Boolean> docExistanceMap = new Map<String,Boolean>();
        System.debug('docList= '+docList);
        System.debug('lstConDocs= '+lstConDocs);
        if(!lstConDocs.isEmpty()) {
            List<ContentVersion> lstCV = [SELECT Id, Title, FileExtension, Category__c, ContentDocumentId,Description,CreatedDate     
                                          FROM ContentVersion WHERE ContentDocumentId IN :lstConDocs ORDER BY CREATEDDATE DESC];
            System.debug('lstCV= '+lstCV);
            for(ContentVersion cv : lstCV){
                if(String.isNotBlank(cv.Category__c) && !docExistanceMap.containsKey(cv.Category__c)){
                    docExistanceMap.put(cv.Category__c, docList.contains(cv.Category__c));
                }
            }
        }
        
        return docExistanceMap;
    }
    
    //To get lastlogindate of current user
    @AuraEnabled
    public static String getLastLoginDate(){
        DateTime loginDate = [SELECT LoginTime 
                              FROM LoginHistory
                              WHERE UserId = :UserInfo.getUserId()
                              ORDER BY LoginTime DESC   
                              LIMIT 1 
                              OFFSET 1].LoginTime;
        System.debug(loginDate);
        Date lastLoginDate = date.newinstance(loginDate.year(), loginDate.month(), loginDate.day());
        System.debug(lastLoginDate.format());
        return lastLoginDate.format();
    }
    //Retreive Pincode
    @AuraEnabled
    public static PincodeWrapper getPincodeDetails(String pinId){
        System.debug('PIN ID '+pinId);
        if(String.isNotBlank(pinId) && String.isNotEmpty(pinId)){
            MS_Pincode__c objPin = [SELECT Id, Name, DistrictName__c, StateName__c,City__c,Village_Locality_Name__c FROM MS_Pincode__c WHERE Id = : pinId];
            if(objPin != null){
                PincodeWrapper pinWrap = new PincodeWrapper();
                pinWrap.pinCode = objPin.Name;
                pinWrap.city = objPin.City__c;
                pinWrap.state = objPin.StateName__c;
                pinwrap.taluka = objPin.Village_Locality_Name__c; 
                pinWrap.district = objPin.DistrictName__c;
                return pinWrap;
            }
            else{
                return null;
            }
        }
        else{
            return null;
        }
    }
    
    //getting Field API Names Of Objects
    @AuraEnabled
    public static String getFields(String selectedObject){
        SObjectType objType = Schema.getGlobalDescribe().get(selectedObject);
        Map<String,Schema.SObjectField> MapofField = objType.getDescribe().fields.getMap();
        List<String> reqFields = new List<String>();
        String fieldNames = '';
        for(String fieldName : MapofField.keySet()) {
            Schema.SObjectField field = MapofField.get(fieldName);
            Schema.DescribeFieldResult F = field.getDescribe();
            if(F.isCustom()){
                fieldNames = fieldNames + field +',';
            }
            
        }
        System.debug(fieldNames);
        return fieldNames;
    }
    
    @AuraEnabled
    public static IFSC_Code_Master__c getBankIFSCDetails(String masterId){
        return [SELECT Id, Name, Bank_Name__c, Bank_Branch_Name__c FROM IFSC_Code_Master__c WHERE Id =: masterId];
    }   
    
    public static String amountInWords(Decimal num) {
        System.debug('Inside amountInWords');
        if(num == null){
            return '';
        }
        Decimal junkVal = num;
        Decimal junkValPaisa = junkVal - Math.floor(junkVal);
        junkVal = Math.floor(junkVal);
        
        String obStr = junkVal.toPlainString();
        String[] numReversed = obStr.split('');
        String[] actnumber = reverse(numReversed);
        String firstHalf = convertInWords(numReversed, actnumber);
        
        Integer tmp = Math.round(junkValPaisa * 100);
        junkValPaisa = (Decimal)tmp / 100; System.debug('jj :' + junkValPaisa);
        String paisaStr = junkValPaisa.toPlainString();
        String secondHalf;
        if (paisaStr == '0') {
            secondHalf = '';
        } else if (paisaStr.length() != 4) {
            paisaStr = paisaStr + '0';
            paisaStr = paisaStr.substring(2);
            String [] numReversedPaisa = paisaStr.split('');
            String[] actnumberPaisa = reverse(numReversedPaisa);
            secondHalf = convertInWords(numReversedPaisa, actnumberPaisa);
        } else {
            paisaStr = paisaStr.substring(2);
            String [] numReversedPaisa = paisaStr.split('');
            String[] actnumberPaisa = reverse(numReversedPaisa);
            secondHalf = convertInWords(numReversedPaisa, actnumberPaisa);
        }
        
        String SumOFHalves = '';
        
        if (secondHalf.length() > 4) {
            firstHalf = firstHalf.replace('Only', 'Rupees And ');
            secondHalf = secondHalf.replace('Only', 'Paisa Only');
            SumOFHalves = firstHalf + secondHalf;
        } else {
            firstHalf = firstHalf.replace('Only', 'Rupees Only');
            SumOFHalves = firstHalf;
        }
        
        // IF amount has any value
        if (SumOFHalves.length() > 5) {
            return SumOFHalves;
        } else {
            return '';
        }
    }
    // Method reverse the number
    public static List<String> reverse(List<String> strToRev) {
        List<String> revList = new List<String>();
        for (Integer i = strToRev.size() - 1; i >= 0; i--) {
            revList.add(strToRev.get(i));
        }
        revList.add('');
        return revList;
    }
    
    public static String convertInWords(String[] numRev, String[] actnum) {
        List<String> iWords = new List<String> {'Zero', ' One', ' Two', ' Three', ' Four', ' Five', ' Six', ' Seven', ' Eight', ' Nine'};
            List<String> ePlace = new List<String> {' Ten', ' Eleven', ' Twelve', ' Thirteen', ' Fourteen', ' Fifteen', ' Sixteen', ' Seventeen', ' Eighteen', ' Nineteen'};
                List<String> tensPlace = new List<String> {'dummy', ' Ten', ' Twenty', ' Thirty', ' Forty', ' Fifty', ' Sixty', ' Seventy', ' Eighty', ' Ninety' };
                    
                    Integer iWordsLength = numRev.size();
        String totalWords = '';
        List<String> inWords = new List<String>();
        for (Integer k = 0; k < iWordsLength; k++) {
            inWords.add('');
        }
        String finalWord = '';
        Integer j = 0;
        
        // Main For loop
        for (Integer i = 0; i < iWordsLength; i++) {
            
            if (i == 0) {
                if (actnum[i] == '0' || actnum[i + 1] == '1') {
                    inWords[j] = '';
                } else {
                    inWords[j] = iWords[Integer.valueof(actnum[i])];
                }
                inWords[j] = inWords[j] + ' Only';
            } else if (i == 1) {
                
                if (actnum[i] == '0') {
                    inWords[j] = '';
                } else if (actnum[i] == '1') {
                    inWords[j] = ePlace[Integer.valueof(actnum[i - 1])];
                } else {
                    inWords[j] = tensPlace[Integer.valueof(actnum[i])];
                }
            } else if (i == 2) {
                if (actnum[i] == '0') {
                    inWords[j] = '';
                } else if (actnum[i - 1] != '0' && actnum[i - 2] != '0') {
                    inWords[j] = iWords[Integer.valueof(actnum[i])] + ' Hundred and';
                } else {
                    inWords[j] = iWords[Integer.valueof(actnum[i])] + ' Hundred';
                }
            } else if (i == 3) {
                if (actnum[i] == '0' || actnum[i + 1] == '1') {
                    inWords[j] = '';
                } else {
                    inWords[j] = iWords[Integer.valueof(actnum[i])];
                }
                if (actnum[i + 1] != '0' || Integer.valueof(actnum[i]) > 0) {
                    inWords[j] = inWords[j] + ' Thousand';
                }
            } else if (i == 4) {
                
                if (actnum[i] == '0') {
                    inWords[j] = '';
                } else if (actnum[i] == '1') {
                    inWords[j] = ePlace[Integer.valueof(actnum[i - 1])];
                } else {
                    inWords[j] = tensPlace[Integer.valueof(actnum[i])];
                }
                
            } else if (i == 5) {
                if (actnum[i] == '0' || actnum[i + 1] == '1') {
                    inWords[j] = '';
                } else {
                    inWords[j] = iWords[Integer.valueof(actnum[i])];
                }
                if (actnum[i + 1] != '0' || Integer.valueof(actnum[i]) > 0) {
                    inWords[j] = inWords[j] + ' Lakh';
                }
            } else if (i == 6) {
                
                if (actnum[i] == '0') {
                    inWords[j] = '';
                } else if (actnum[i] == '1') {
                    inWords[j] = ePlace[Integer.valueof(actnum[i - 1])];
                } else {
                    inWords[j] = tensPlace[Integer.valueof(actnum[i])];
                }
                
            } else if (i == 7) {
                if (actnum[i] == '0' || actnum[i + 1] == '1' ) {
                    inWords[j] = '';
                } else {
                    inWords[j] = iWords[Integer.valueof(actnum[i])];
                }
                inWords[j] = inWords[j] + ' Crore';
            } else if (i == 8) {
                
                if (actnum[i] == '0') {
                    inWords[j] = '';
                } else if (actnum[i] == '1') {
                    inWords[j] = ePlace[Integer.valueof(actnum[i - 1])];
                } else {
                    inWords[j] = tensPlace[Integer.valueof(actnum[i])];
                }
                
            }
            
            j++;
        }
        // End of For loop
        
        // Reverse the List
        inWords = reverse(inWords);
        
        for (Integer i = 0; i < inWords.size(); i++) {
            finalWord += inWords[i];
        }
        
        return finalWord;
    }
    
    public class PincodeWrapper{
        @auraEnabled public String pinCode;
        @auraEnabled public String district;
        @auraEnabled public String city;
        @auraEnabled public String state;
        @auraEnabled public String taluka;
        public PincodeWrapper(){
            district = '';   
            city = '';
            state = '';
            taluka = '';
        }
    }    
}