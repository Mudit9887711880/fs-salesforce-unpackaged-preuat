/**
* @File Name          : EmandateBankListAPI.apxc
* @Author             : Navin Soni
* @Created On         : 10 July 2022
*==============================================================================
* Ver         Date                     Author                 Modification
*==============================================================================
* 1.0       10 July 2022              Navin Soni             Initial Version
**/

public class EmandateBankListAPI{ 

    /*
    @Author : Navin Soni
    @Description : This method is use to call Emandate Bank API.
    */
    @AuraEnabled
    Public Static Boolean callEmandateBankListAPI(String BankDetailId){
        system.debug('@@## BankDetailId'+BankDetailId);
        List<Bank_Detail__c> listOfBankDetail = [SELECT ID, Name FROM Bank_Detail__c WHERE ID =: BankDetailId];
        try{

            if(listOfBankDetail != null && listOfBankDetail.size() > 0){
                Map<String, String> mapOfBank = getBankList();
                if(mapOfBank != null && mapOfBank.size() > 0){
                    if(!mapOfBank.containsKey(listOfBankDetail[0].Name)){
                        callEmandateBankListAPI();
                    }
                }else{
                    callEmandateBankListAPI();
                }
                mapOfBank = getBankList();
                if(mapOfBank != null && mapOfBank.containsKey(listOfBankDetail[0].Name)){
                    listOfBankDetail[0].Is_Bank_Exist__c = true;
                    update listOfBankDetail;
                    return true;

                }else{
                    listOfBankDetail[0].Is_Bank_Exist__c = false;
                    update listOfBankDetail;
                    return false;
                }
            }
        }
        catch(System.CalloutException e) {
            system.debug('Main exception '+ e.getLineNumber() + ' - ' + e.getMessage());
            Error_Logger__c objErrorLog = new Error_Logger__c();
            objErrorLog.Exception_Message__c = e.getMessage();
            objErrorLog.Name = 'EmandateBankListAPI';
            objErrorLog.Line_Number__c = string.valueof(e.getLineNumber());
            insert objErrorLog;
        }
        catch(Exception e){
            system.debug('Main exception '+ e.getLineNumber() + ' - ' + e.getMessage());
            Error_Logger__c objErrorLog = new Error_Logger__c();
            objErrorLog.Exception_Message__c = e.getMessage();
            objErrorLog.Name = 'EmandateBankListAPI';
            objErrorLog.Line_Number__c = string.valueof(e.getLineNumber());
            insert objErrorLog;
        }
        return false;
    }

    public static Map<String, String> getBankList(){
        Map<String, String> mapOfBank = new Map<String, String>();
        for(Bank_List__c objBank : [SELECT ID, Name, Bank_Id__c FROM Bank_List__c LIMIT 10000]){
            mapOfBank.put(objBank.Bank_Id__c, objBank.Name);
        }
        return mapOfBank;
    }

    public static void callEmandateBankListAPI(){
        API_Handler__mdt EmandateAPI = API_Handler__mdt.getInstance('Emandate_BankList');
        if(EmandateAPI.isActive__c){
            RequestHeader objRequestHeader = parseRequestHeader(EmandateAPI.HeaderParameters__c);

            Http http = new Http();
            HttpRequest request = new HttpRequest();
            request.setEndpoint(EmandateAPI.Endpoint__c);
            request.setMethod(EmandateAPI.Method__c); 
            request.setHeader('Authorization', objRequestHeader.Authorization);
            request.setHeader('CORRELATION-ID',objRequestHeader.CORRELATIONID);
            request.setHeader('CLIENT-ID',objRequestHeader.CLIENTID);
            request.setHeader('CLIENT-SECRET',objRequestHeader.CLIENTSECRET);
            request.setHeader('Content-Type', objRequestHeader.ContentType);
            request.setTimeout(120000);

            HttpResponse objResponse = http.send(request); 
            
            system.debug('@@## response '+objResponse.getbody());

            if (objResponse != null && objResponse.getStatusCode() == 200) {
                cls_response objBankListResponse = parse(objResponse.getbody());
                system.debug('@@## Bank List '+objBankListResponse.liveBankListRes.bankList.bankdata);

                if(objBankListResponse != null && objBankListResponse.liveBankListRes != null && 
                    objBankListResponse.liveBankListRes.bankList != null && 
                    objBankListResponse.liveBankListRes.bankList.bankdata != null && objBankListResponse.liveBankListRes.bankList.bankdata.size() > 0){
                        
                    List<Bank_List__c> listOfBankList = new List<Bank_List__c>();
                    for(cls_bankdata objBankData : objBankListResponse.liveBankListRes.bankList.bankdata){
                        if(String.isNotBlank(objBankData.bankName) && String.isNotBlank(objBankData.bankId)){
                            Bank_List__c objBank = new Bank_List__c();
                            objBank.Name = objBankData.bankName;
                            objBank.Bank_Id__c = objBankData.bankId;
                            listOfBankList.add(objBank);
                        }
                    }
                    System.debug('@@## listOfBankList '+listOfBankList);
                    if(listOfBankList != null && listOfBankList.size() > 0){
                        Database.Insert(listOfBankList, false);
                    }
                }
            }else{
                system.debug('API exception '+objResponse);
                system.debug('API exception getStatusCode '+objResponse.getStatusCode());
                Error_Logger__c objErrorLog = new Error_Logger__c();
                objErrorLog.Exception_Message__c = objResponse.getbody();
                objErrorLog.Name = 'EmandateBankListAPI';
                insert objErrorLog;
            }
        }
    }

    public class cls_response{
        public cls_liveBankListRes liveBankListRes;
    }
	class cls_liveBankListRes {
		public String status;	//1
		public cls_bankList bankList;
	}
	class cls_bankList {
		public cls_bankdata[] bankdata;
	}
	class cls_bankdata {
		public String bankId;	//ANDB
		public String bankName;	//ANDHRA BANK
	}
	public static cls_response parse(String json){
		return (cls_response) System.JSON.deserialize(json, cls_response.class);
	}

    public class RequestHeader{
        public String Authorization;    //Basic YWRtaW46YWRtaW4=
        public String CORRELATIONID;    //123456789
        public String CLIENTID; //78g659ed2a0dfa2b
        public String CLIENTSECRET; //f56f68b65739bd8a
        public String ContentType;  //application/json
    }
    public static RequestHeader parseRequestHeader(String json){
        return (RequestHeader) System.JSON.deserialize(json, RequestHeader.class);
    }

}