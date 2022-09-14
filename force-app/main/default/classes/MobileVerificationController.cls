public class MobileVerificationController {
    
    @AuraEnabled
    public static Wrapper SendOTP(String loanAppId,String MobileNo){
        System.debug('loanAppId '+loanAppId+' : MobileNo '+MobileNo);
        try{
            APICredentials__mdt MobileOTP = APICredentials__mdt.getInstance('MobileOTP');
            HttpRequest request = new HttpRequest();
            string MobileOTPRequest='{"mobile": "'+MobileNo+'","consent": "y"}';
            Http http = new Http();
            request.setBody(MobileOTPRequest);
            request.setEndpoint(MobileOTP.Endpoint__c);
            request.setMethod(MobileOTP.Method__c); 
            request.setHeader('Authorization', MobileOTP.Authorization__c);
            request.setHeader('CORRELATION-ID',MobileOTP.CORRELATION_ID__c);
            request.setHeader('CLIENT-ID',MobileOTP.CLIENT_ID__c);
            request.setHeader('CLIENT-SECRET',MobileOTP.CLIENT_SECRET__c);
            request.setHeader('Content-Type', MobileOTP.Content_Type__c);
            request.setTimeout(120000); 
            Wrapper wrp=new Wrapper();
            HttpResponse response = http.send(request); 
            System.debug('Response '+response);
            API_Logger__c al=new API_Logger__c();
            al.Name='FS_PreLoginController';
            al.API_Name__c='mobileotp'; 
            al.Request__c= request.getBody();   
            al.Response__c= response.getBody();
            al.EndPoint__c=request.getEndpoint();
            al.Loan_Applicant__c =loanAppId;
            insert al;
            if(response.getStatusCode()==200){
                MobileOTPWrapper respWrap=MobileOTPWrapper.parse(response.getBody());
                System.debug(response.getBody());
                wrp.msg=respWrap.statusCode;
                wrp.description=respWrap.description;
                wrp.requestId=respWrap.requestId;
                return wrp;
            }
            else{
                
                MobileOTPWrapper respWrap=MobileOTPWrapper.parse(response.getBody());
                wrp.msg=respWrap.error.message;
                wrp.description=respWrap.error.description;
                return wrp; 
            } 
            //return null;
        }
        catch(Exception e){
            Error_Logger__c el=new Error_Logger__c();
            el.Exception_Message__c=e.getMessage();
            el.Name='FS_PreLoginController';
            el.Line_Number__c=string.valueof(e.getLineNumber());
            el.Loan_Applicant__c = loanAppId;
            insert el;
            Wrapper wrp=new Wrapper();
            wrp.description=e.getMessage();
            return wrp;  
        }
    }
    
    @AuraEnabled
    public static Wrapper ValidateOTP(String loanAppId,String requestId,String OTP){
        System.debug('requestId '+requestId+' : OTP '+OTP);
        try{ 
            APICredentials__mdt validateOTP = APICredentials__mdt.getInstance('ValidateOTP');
            HttpRequest request = new HttpRequest();
            //string MobileOTPRequest='{"mobile": "'+MobileNo+'","consent": "y"}';
            string validateOTPRequest='{"requestId": "'+requestId+'","otp": "'+OTP+'"}';
            system.debug('validateOTPRequest'+validateOTPRequest);
            Http http = new Http();
            request.setBody(validateOTPRequest);
            request.setEndpoint(validateOTP.Endpoint__c);//
            request.setMethod(validateOTP.Method__c); 
            request.setHeader('Authorization', validateOTP.Authorization__c);
            request.setHeader('CORRELATION-ID',validateOTP.CORRELATION_ID__c);
            request.setHeader('CLIENT-ID',validateOTP.CLIENT_ID__c);
            request.setHeader('CLIENT-SECRET',validateOTP.CLIENT_SECRET__c);
            request.setHeader('Content-Type', validateOTP.Content_Type__c);
            request.setTimeout(120000); 
            //string mockResponse='{ "requestId": "d9a3e9d1-4050-45d5-be56-0f570b304d09", "result": { "contact": { "address": "Railway staion road, Bhagwatiganj, Balrampur, Balrampur, Up-271201", "altContact": "8860211008", "emailId": null, "workEmail": null }, "device": { "3gSupport": null, "deviceActivationDate": null, "imei": null, "model": "SamsungSM-A505 Galaxy A50 Dual Sim" }, "history": null, "identity": { "dateOfBirth": "16-05-1986", "gender": null, "name": "Vinay Kumar Mishra" }, "profile": { "education": null, "language": null, "maritalStatus": null, "occupation": null, "relationships": null, "workplace": null }, "simDetails": { "activationDate": null, "lastActivityDate": null, "otpValidated": true, "provider": "Reliance Jio", "type": "PREPAID" } }, "statusCode": "101", "description": "Valid Authentication" }';
            //   string mockResponse='{ "error": { "source": "Portal", "target": "Kyc system Api", "errorCode": "400", "message": "Bad Request", "description": "Request structure need to be analyzed", "timestamp": "2022-04-12 10:21:35+0000" } }';
            //string mockResponse ='{"status": "The OTP is invaild"}';
            Wrapper wrp=new Wrapper();
            
            //   system.debug(respWrap.error.message);
            HttpResponse response = http.send(request); 
            
            API_Logger__c al=new API_Logger__c();
            al.Name='FS_PreLoginController';
            al.API_Name__c='mobiledetails'; 
            al.Request__c= request.getBody();   
            al.Response__c= response.getBody();
            al.EndPoint__c=request.getEndpoint();
            al.Loan_Applicant__c = loanAppId;
            insert al;   
            system.debug(response.getBody());
            
            if(response.getStatusCode()==200){
                system.debug('statuscode'+response.getStatusCode());
                ValidateOTPWrapper respWrap=ValidateOTPWrapper.parse(response.getBody());
                system.debug('statuscodeee'+response.getStatusCode());
                if(respWrap.description!=null)
                    wrp.description=respWrap.description; 
                if(respWrap.status!=null)
                    wrp.description=respWrap.status; 
                wrp.msg=respWrap.statusCode;
                system.debug('return');
                return wrp;
            }
            else{
                
                ValidateOTPWrapper respWrap=ValidateOTPWrapper.parse(response.getBody());
                wrp.description=respWrap.error.message;
                return wrp; 
            } 
            // return null;
        }
        catch(Exception e){
            
            Error_Logger__c el=new Error_Logger__c();
            el.Exception_Message__c=e.getMessage();
            el.Name='FS_PreLoginController';
            el.Line_Number__c=string.valueof(e.getLineNumber());
            el.Loan_Applicant__c = loanAppId;
            insert el;
            Wrapper wrp=new Wrapper();
            wrp.description=e.getMessage();
            return wrp; 
            
        }
    }
    
    @AuraEnabled
    public static Boolean loanAppMobileVerification(String loanAppId){
        System.debug('loanAppId Id '+loanAppId);
        Loan_Applicant__c objLoan = [SELECT Id FROM Loan_Applicant__c WHERE Id = :loanAppId];
        if(objLoan!=null){
            System.debug('objLoan '+objLoan);
            objLoan.Mobile_Verified__c = true; 
            UPDATE objLoan;
            if(objLoan.Mobile_Verified__c == true)
                return true;
            else
                return false;
        }
        else
            return false;
    }
    
    
    public class Wrapper{
        @auraEnabled public String description;
        @auraEnabled public String requestId;
        @auraEnabled public String msg;
    }
    
}