/**
* @File Name          : PennyDropAPI.apxc
* @Author             : Navin Soni
* @Created On         : 04 August 2022
*==============================================================================
* Ver         Date                     Author                 Modification
*==============================================================================
* 1.0       04 August 2022            Navin Soni             Initial Version
**/

public class PennyDropAPI { 
    
    /*
@Author : Navin Soni
@Description : This method is use to call Penny Drop API.
*/
    @AuraEnabled
    public static string callPennyDropAPI(String BankDetailId){
        system.debug('@@## BankDetailId'+BankDetailId);
        
        try{
            API_Handler__mdt EmandateAPI = API_Handler__mdt.getInstance('Penny_Drop');
            if(EmandateAPI.isActive__c){
                RequestHeader objRequestHeader = parseRequestHeader(EmandateAPI.HeaderParameters__c);
                
                Http http = new Http();
                HttpRequest request = new HttpRequest();
                request.setEndpoint(EmandateAPI.Endpoint__c);
                request.setMethod(EmandateAPI.Method__c); 
                request.setBody(generateRequestBody(BankDetailId));
                request.setHeader('Authorization', objRequestHeader.Authorization);
                request.setHeader('CORRELATION-ID',objRequestHeader.CORRELATIONID);
                request.setHeader('CLIENT-ID',objRequestHeader.CLIENTID);
                request.setHeader('CLIENT-SECRET',objRequestHeader.CLIENTSECRET);
                request.setHeader('Content-Type', objRequestHeader.ContentType);
                request.setTimeout(120000);
                
                /*HttpResponse objResponse = http.send(request); 

system.debug('@@## response '+objResponse.getbody());

if (objResponse != null && objResponse.getStatusCode() == 200) {
//ResponseJSON objPennyDropResponse = parse(objResponse.getbody());
ResponseJSON objPennyDropResponse = parse(EmandateAPI.Mock_Response__c);
system.debug('@@## objPennyDropResponse '+objPennyDropResponse);


Bank_Detail__c objBankDetail = new Bank_Detail__c();
objBankDetail.Id = BankDetailId;
objBankDetail.Is_Account_Verified__c = TRUE;
Update objBankDetail;

}else{
system.debug('API exception '+objResponse);
system.debug('API exception getStatusCode '+objResponse.getStatusCode());
Error_Logger__c objErrorLog = new Error_Logger__c();
objErrorLog.Exception_Message__c = objResponse.getbody();
objErrorLog.Name = 'PennyDropAPI';
insert objErrorLog;
}*/
                
                //ResponseJSON objPennyDropResponse = parse(EmandateAPI.Mock_Response__c);
                if(BankDetailId != null){
                    Id recordId = BankDetailId;
                    if(String.valueOf(recordId.getSobjectType()) == 'Bank_Detail__c'){
                        Bank_Detail__c objBankDetail = new Bank_Detail__c();
                        objBankDetail.Id = BankDetailId;
                        objBankDetail.Is_Account_Verified__c = TRUE;
                        Update objBankDetail;
                    }
                    else if(String.valueOf(recordId.getSobjectType()) == 'Disbursal_Payee__c'){
                        Disbursal_Payee__c objDisbursalPayee = new Disbursal_Payee__c();
                        objDisbursalPayee.Id = BankDetailId;
                        objDisbursalPayee.Is_Verified__c = TRUE;
                        update objDisbursalPayee;
                    }
                }
            }
        }
        catch(System.CalloutException e) {
            system.debug('Main exception '+ e.getLineNumber() + ' - ' + e.getMessage());
            Error_Logger__c objErrorLog = new Error_Logger__c();
            objErrorLog.Exception_Message__c = e.getMessage();
            objErrorLog.Name = 'PennyDropAPI';
            objErrorLog.Line_Number__c = string.valueof(e.getLineNumber());
            insert objErrorLog;
        }
        catch(Exception e){
            system.debug('Main exception '+ e.getLineNumber() + ' - ' + e.getMessage());
            Error_Logger__c objErrorLog = new Error_Logger__c();
            objErrorLog.Exception_Message__c = e.getMessage();
            objErrorLog.Name = 'PennyDropAPI';
            objErrorLog.Line_Number__c = string.valueof(e.getLineNumber());
            insert objErrorLog;
        }
        return '';
    }
    
    
    /*
@Author : Navin Soni
@Description : This method is use to create request body for Penny Drop API.
*/
    private static String generateRequestBody(String BankDetailId){
        
        List<Bank_Detail__c> listOfBankDetail = [SELECT ID, Account_Number__c, Bank_Account_Holder_Name__c, MS_IFSC_Code__c, MS_IFSC_Code__r.Name, Loan_Applicant__c, Loan_Applicant__r.Mobile__c FROM Bank_Detail__c WHERE ID =: BankDetailId];
        
        API_Handler__mdt objPennyAPI = [SELECT Id, Body__c FROM API_Handler__mdt WHERE DeveloperName = 'Penny_Drop'];
        
        cls_request objPennyReq = new cls_request();
        System.debug('@@## request Body -> '+objPennyAPI.Body__c);
        objPennyReq = requestParse(objPennyAPI.Body__c);
        System.debug('@@## objKotakReq -> '+objPennyReq);
        
        String requestJson = '';
        if(listOfBankDetail != null && listOfBankDetail.size() > 0){
            Bank_Detail__c bandDetailObj = listOfBankDetail[0];
            
            requestJson += '{';
            requestJson += '"beneficiaryAccountValidationRequest":{';
            requestJson += '"header":{';
            requestJson += '"transId":"'+objPennyReq.transId+'",';
            requestJson += '"corpId":"'+objPennyReq.corpId+'",';
            requestJson += '"makerId":"'+objPennyReq.makerId+'",';
            requestJson += '"checkerId":"'+objPennyReq.checkerId+'",';
            requestJson += '"approverId":"'+objPennyReq.approverId+'"';
            requestJson += '},';
            requestJson += '"body":{';
            requestJson += '"beneficiaryName":"'+bandDetailObj.Bank_Account_Holder_Name__c.replaceAll( '\\s+', '')+'",';
            requestJson += '"beneficiaryMobileNumber":"'+bandDetailObj.Loan_Applicant__r.Mobile__c+'",';
            requestJson += '"accountNumber":"'+bandDetailObj.Account_Number__c+'",';
            requestJson += '"ifscCode":"'+bandDetailObj.MS_IFSC_Code__r.Name+'"';
            requestJson += '},';
            requestJson += '"signature":{';
            requestJson += '"signature":"'+objPennyReq.signature+'"';
            requestJson += '}';
            requestJson += '}';
            requestJson += '}';
        }
        
        System.debug('@@## requestJson for Kotak Calculate API -> '+requestJson);
        return requestJson;
    }
    
    public class ResponseJSON{
        public cls_beneficiaryAccountValidationResponse beneficiaryAccountValidationResponse;
    }
    
    class cls_beneficiaryAccountValidationResponse {
        public cls_header header;
        public cls_body body;
        public cls_signature signature;
    }
    class cls_header {
        public String transId;	//20017
        public String corpId;	//MC001
        public String makerId;	//M001
        public String checkerId;	//C001
        public String approverId;	//A001
    }
    
    
    
    class cls_body {
        public String status;	//Success
        public String accountNumber;	//109566016496
        public String ifscCode;	//DNSB0000021
        public String beneficiaryName;	//VARSHA
        public String remarks;	//Transaction is successful and customer is successfully validated
        public String bankRefNo;	//629114449955
        public String npciResponseCode;	//00
    }
    
    class cls_request {
        public String transId;
        public String corpId;
        public String makerId;
        public String checkerId;
        public String  approverId;
        public String signature;
    }
    public static cls_request requestParse(String json){
        return (cls_request) System.JSON.deserialize(json, cls_request.class);
    }
    
    
    class cls_signature {
        public String signature;	//Signature
    }
    public static ResponseJSON parse(String json){
        return (ResponseJSON) System.JSON.deserialize(json, ResponseJSON.class);
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