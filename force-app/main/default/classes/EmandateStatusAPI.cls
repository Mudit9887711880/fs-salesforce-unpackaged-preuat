/**
* @File Name          : EmandateStatusAPI.apxc
* @Author             : Navin Soni
* @Created On         : 10 July 2022
*==============================================================================
* Ver         Date                     Author                 Modification
*==============================================================================
* 1.0       10 July 2022              Navin Soni             Initial Version
**/

public class EmandateStatusAPI { 

    /*
    @Author : Navin Soni
    @Description : This method is use to call Emandate Status API.
    */
    @AuraEnabled
    public static string callEmandateStatusAPI(String BankDetailId){
        system.debug('@@## BankDetailId '+BankDetailId);
        List<API_Logger__c> listOfAPILogger = new List<API_Logger__c>();
        List<Bank_Detail__c> listOfBankDetail = [SELECT ID, Name, Application__c, Application__r.Mandate_Req_ID__c FROM Bank_Detail__c WHERE ID =: BankDetailId];
        System.debug('@@## listOfApplication -> '+listOfBankDetail);
        if(listOfBankDetail != null && listOfBankDetail.size() > 0){
            try{
                API_Handler__mdt EmandateAPI = [SELECT ID, isActive__c, HeaderParameters__c, Endpoint__c, Method__c, Mock_Response__c FROM API_Handler__mdt WHERE DeveloperName = 'Emandate_Status'];
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
                    request.setHeader('mandateReqId',  CryptoClass.perfromEncrypt(listOfBankDetail[0].Application__r.Mandate_Req_ID__c));
                    request.setTimeout(120000);

                   // system.debug('EmandateAPI '+ EmandateAPI.Mock_Response__c);
                   // cls_response objStatusResponse = parseStatusResponse(EmandateAPI.Mock_Response__c);
                   // system.debug('objStatusResponse '+ objStatusResponse);
                    HttpResponse objResponse = http.send(request); 
                    
                    system.debug('@@## response '+objResponse.getbody());
					cls_response objStatusResponse;
                    if (objResponse != null && objResponse.getStatusCode() == 200) {
                         objStatusResponse = parseStatusResponse(objResponse.getbody());
                        system.debug('@@## objStatusResponse '+objStatusResponse);
                    }else{
                        system.debug('API exception '+objResponse);
                        system.debug('API exception getStatusCode '+objResponse.getStatusCode());
                        Error_Logger__c objErrorLog = new Error_Logger__c();
                        objErrorLog.Exception_Message__c = objResponse.getbody();
                        objErrorLog.Name = 'EmandateStatusAPI';
                        insert objErrorLog;
                    }
                    
                  //  system.debug('mandateStatus '+ objStatusResponse.mandateStatusApiRes.mandateStatus);
                  //  system.debug('umrnNo '+ objStatusResponse.mandateStatusApiRes.umrnNo);
                    
                    if(objStatusResponse != null && objStatusResponse.mandateStatusApiRes != null){
                        listOfBankDetail[0].Mandate_Status__c = objStatusResponse.mandateStatusApiRes.mandateStatus;
                        listOfBankDetail[0].UMRN_Number__c = objStatusResponse.mandateStatusApiRes.umrnNo;
                        Update listOfBankDetail;
                        return objStatusResponse.mandateStatusApiRes.mandateStatus;
                    }
                }
            }
            catch(System.CalloutException e) {
                system.debug('Main exception '+ e.getLineNumber() + ' - ' + e.getMessage());
                Error_Logger__c objErrorLog = new Error_Logger__c();
                objErrorLog.Exception_Message__c = e.getMessage();
                objErrorLog.Name = 'EmandateStatusAPI';
                objErrorLog.Line_Number__c = string.valueof(e.getLineNumber());
                insert objErrorLog;
                return e.getMessage();
            }
            catch(Exception e){
                system.debug('Main exception '+ e.getLineNumber() + ' - ' + e.getMessage());
                Error_Logger__c objErrorLog = new Error_Logger__c();
                objErrorLog.Exception_Message__c = e.getMessage();
                objErrorLog.Name = 'EmandateStatusAPI';
                objErrorLog.Line_Number__c = string.valueof(e.getLineNumber());
                insert objErrorLog;
                return e.getMessage();
            }
        }
        return '';
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

    public class cls_response{
        public cls_mandateStatusApiRes mandateStatusApiRes;
    }
    class cls_mandateStatusApiRes {
		public String status;	//1
		public String mandateReqId;	//APItest34128678901123457891014015
		public String name;	//veeta nair
		public String mobileNumber;	//+91-9773801229
		public String telephoneNumber;	//+91-022-11234543
		public String emailId;	//veneetia@gmail.com
		public String panNo;	//PPAZM1234M
		public String accountType;	//savings
		public String accountNumber;	//11111
		public String amount;	//128.00
		public String amountType;	//Fixed Amount
		public String startDate;	//22-07-2021
		public String endDate;	//25-07-2022
		public String untilCancel;	//False
		public String fequency;	//BIMN%Bi-Monthly
		public String purpose;	//Bill Payment Credit card
		public String corpName;	//nita pvt ltd
		public String catCode;	//B001
		public String catDesc;	//Bill Payment Credit card
		public Integer umrnNo;
		public String rejectReson;	//No Details available for Requested NpciRefId
		public String rejBy;
		public String npciRefMsgId;
		public String mandateStatus;	//Process incomplete
		public String requestDateTime;	//7/22/2021 18:44:59
		public String responsedDateTime;	//9/5/2021 00:24:31
		public String bankName;	//Axis Bank
		public String authenticationMode;	//NetBanking
		public String utilityCode;	//RATN00005000010550
	}

    public static cls_response parseStatusResponse(String json){
		return (cls_response) System.JSON.deserialize(json, cls_response.class);
	}
}