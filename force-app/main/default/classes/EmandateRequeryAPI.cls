/**
* @File Name          : EmandateRequeryAPI.apxc
* @Author             : Navin Soni
* @Created On         : 10 July 2022
*==============================================================================
* Ver         Date                     Author                 Modification
*==============================================================================
* 1.0       10 July 2022              Navin Soni             Initial Version
**/

public class EmandateRequeryAPI { 

    /*
    @Author : Navin Soni
    @Description : This method is use to call Emandate Requey API.
    */
    @AuraEnabled
    public static string callEmandateRequeyAPI(String BankDetailId){
        system.debug('@@## BankDetailIdBankDetailId '+BankDetailId);
        List<API_Logger__c> listOfAPILogger = new List<API_Logger__c>();
       // List<Application__c> listOfApplication = [SELECT ID, Name, Mandate_Req_ID__c FROM Application__c WHERE Id =: applicationId LIMIT 1];
                List<Bank_Detail__c> listOfBankDetail = [SELECT ID, Name, Account_Type__c, Account_Number__c, Application__c,Application__r.Mandate_Req_ID__c, Application__r.Name, Application__r.Total_Amount_Recommended_PcAc__c, Loan_Applicant__r.Applicant_Name__c, Loan_Applicant__r.Mobile__c FROM Bank_Detail__c WHERE ID =: BankDetailId];

        System.debug('@@## listOfBankDetail -> '+listOfBankDetail);
        if(listOfBankDetail != null && listOfBankDetail.size() > 0){
            try{
                API_Handler__mdt EmandateAPI = API_Handler__mdt.getInstance('Emandate_Requery');
                if(EmandateAPI.isActive__c){
                    RequestHeader objRequestHeader = parseRequestHeader(EmandateAPI.HeaderParameters__c);

                    Http http = new Http();
                    HttpRequest request = new HttpRequest();
                    request.setEndpoint(EmandateAPI.Endpoint__c);
                    request.setMethod(EmandateAPI.Method__c); 
                    request.setHeader('Authorization', objRequestHeader.Authorization);
                    request.setHeader('CORRELATION-ID', objRequestHeader.CORRELATIONID);
                    request.setHeader('CLIENT-ID', objRequestHeader.CLIENTID);
                    request.setHeader('CLIENT-SECRET', objRequestHeader.CLIENTSECRET);
                    request.setHeader('Content-Type', objRequestHeader.ContentType);
                    request.setHeader('mandateReqId', CryptoClass.perfromEncrypt(listOfBankDetail[0].Application__r.Mandate_Req_ID__c));
                    request.setTimeout(120000);

                    HttpResponse objResponse = http.send(request); 
                    
                    system.debug('@@## response '+objResponse.getbody());

                    if (objResponse != null && objResponse.getStatusCode() == 200) {
                        ResponseJSON objRegResponse = parse(objResponse.getbody());
                        system.debug('@@## objRegResponse '+objRegResponse);

                        API_Logger__c objAPILogger = new API_Logger__c();
                        objAPILogger.Name = 'EmandateRequeryAPI';
                        objAPILogger.API_Name__c = 'EmandateRequeryAPI'; 
                        objAPILogger.Status__c = 'Success';
                        objAPILogger.Request__c = request.getBody();   
                        objAPILogger.Response__c = objResponse.getBody().length() > 130068 ? objResponse.getBody().substring(0, 130068) : objResponse.getBody();
                        objAPILogger.EndPoint__c = request.getEndpoint();
                        listOfAPILogger.add(objAPILogger);

                        if(objRegResponse != null && objRegResponse.raw != null){
                            Application__c objApp = new Application__c();
                            objApp.Id = listOfBankDetail[0].Application__c;
                            system.debug('@@## objApp '+objApp);
                            update objApp;
                        }
                    }else{
                        system.debug('API exception '+objResponse);
                        system.debug('API exception getStatusCode '+objResponse.getStatusCode());
                        Error_Logger__c objErrorLog = new Error_Logger__c();
                        objErrorLog.Exception_Message__c = objResponse.getbody();
                        objErrorLog.Name = 'EmandateRequeryAPI';
                        insert objErrorLog;
                    }
                }
            }
            catch(System.CalloutException e) {
                system.debug('Main exception '+ e.getLineNumber() + ' - ' + e.getMessage());
                Error_Logger__c objErrorLog = new Error_Logger__c();
                objErrorLog.Exception_Message__c = e.getMessage();
                objErrorLog.Name = 'EmandateRequeryAPI';
                objErrorLog.Line_Number__c = string.valueof(e.getLineNumber());
                insert objErrorLog;
            }
            catch(Exception e){
                system.debug('Main exception '+ e.getLineNumber() + ' - ' + e.getMessage());
                Error_Logger__c objErrorLog = new Error_Logger__c();
                objErrorLog.Exception_Message__c = e.getMessage();
                objErrorLog.Name = 'EmandateRequeryAPI';
                objErrorLog.Line_Number__c = string.valueof(e.getLineNumber());
                insert objErrorLog;
            }
        }
        return '';
    }

    public class ResponseJSON{
        public String mode; //raw
        public cls_raw raw;
    }
    public class cls_raw {
        public String loanNumber;   //FSAPLALONS000005197194
        public String transactionDateTime;  //2022-02-15
        public String valueDate;    //2022-02-15
        public String transactionAmount;    //5000
        public String paymentId;    //1234567
        public String refId;    //dab899d9-8f0e-4f75-9e10-094ca565b18a
        public String mobileNo; //8886891356
        public String customerName; //Test
        public String paymentApp;   //phonepe
        public String status;   //Success
        public String issuerBank;   //HDFC
        public String upiId;    //1234567
        public String bbpsId;   //1324567890
        public String intermediaryId;   //143256784
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