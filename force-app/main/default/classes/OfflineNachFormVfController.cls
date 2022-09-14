public without sharing class OfflineNachFormVfController {
    public String bankId {get;set;}
    public Bank_Detail__c objBank{get;set;}
    public String amountInWords{get;set;}  
    public String toDate{get;set;}  
	public String sponsorCode{get;set;}  
    public String utilityCode{get;set;}  

    public OfflineNachFormVfController(){
        bankId = Apexpages.currentPage().getParameters().get('id');
        System.debug('id' + bankId);
        try{
            if(String.isNotBlank(bankId)){
                objBank = [SELECT Id, Application__c, Name, MS_IFSC_Code__r.Name, Account_Number__c, Branch_Name__c,Loan_Applicant__r.Email__c,
                           Bank_Account_Holder_Name__c,Loan_Applicant__r.Mobile__c,Application__r.Requested_Loan_Amount__c,Application__r.Emi_PcAc__c FROM Bank_Detail__c 
                           WHERE Id=: bankId];
                if(objBank.Application__r.Emi_PcAc__c<>null){
                    amountInWords = amountInWords(objBank.Application__r.Emi_PcAc__c); 
                }

                // This is use to mapped dynamic values in request.
                API_Handler__mdt objEmandateAPI = [SELECT Id, Body__c FROM API_Handler__mdt WHERE DeveloperName = 'Emandate_Registration'];
                cls_request objEmandateReq = new cls_request();
                //System.debug('@@## request Body -> '+objKotakAPI.Body__c);
 				System.debug('obj' + objEmandateReq);
                objEmandateReq = requestParse(objEmandateAPI.Body__c);
                System.debug('objreq' + objEmandateReq);
                //System.debug('@@## objKotakReq -> '+objKotakReq);
                if(objEmandateReq.endDate<>null){
                    toDate = objEmandateReq.endDate;
                }
                if(objEmandateReq.destinationBank<>null){
                    sponsorCode = objEmandateReq.destinationBank;
                }
                 if(objEmandateReq.utilityCode<>null){
                    utilityCode = objEmandateReq.utilityCode;
                }
            }
        }Catch(Exception e){
            System.debug('Error msg 1'+e.getMessage()+'----->'+e.getLineNumber());
        }
    }
    public String amountInWords(Decimal num) {
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
    public List<String> reverse(List<String> strToRev) {
        List<String> revList = new List<String>();
        for (Integer i = strToRev.size() - 1; i >= 0; i--) {
            revList.add(strToRev.get(i));
        }
        revList.add('');
        return revList;
    }
    
    public String convertInWords(String[] numRev, String[] actnum) {
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

    public class cls_request{
        public String startDate;	//05-08-2022
        public String endDate;	//07-08-2023
        public String destinationBank;	//UTIB
        public String utilityCode;	//RATN00005000010550
    }

	public static cls_request requestParse(String json){
		return (cls_request) System.JSON.deserialize(json, cls_request.class);
	}
}