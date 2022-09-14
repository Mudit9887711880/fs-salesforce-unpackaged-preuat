/**
* @File Name          : DedupeAPI.apxc
* @Author             : Umair Ahmad
* @Created On         : 16 August 2022
*==============================================================================
* Ver         Date                     Author                 Modification
*==============================================================================
* 1.0       16 August 2022            Umair Ahmad             Initial Version
* 2.0       18 August 2022			Suraj Kumar -- Karan Singh Soni
* 3.0       23 August 2022			Zafaruddin
**/

public  with sharing class DedupeAPI {

    /*
        @Author : Umair Ahmad/ Zafaruddin
        @Description : This method is use to call Dedupe API.
    */
    @AuraEnabled
    public static string callDedupeAPI(String applicationId, String source, String button,List<Loan_Applicant__c>loanApplicantList){
        if(!checkDedupeCriteria(applicationId)) {
            DedupeDetailsController.DedupeWrapper objDedupeWrapper = new DedupeDetailsController.DedupeWrapper();
            objDedupeWrapper.dedupeCriteria = false;
            objDedupeWrapper.statusCode = 503;
            return JSON.serialize(objDedupeWrapper);
        }
        else {
            try{
                API_Handler__mdt EmandateAPI = [SELECT ID, isActive__c, HeaderParameters__c, Endpoint__c, Method__c, Mock_Response__c FROM API_Handler__mdt WHERE DeveloperName = 'Dedupe_API'];
                if(EmandateAPI.isActive__c){
                    RequestHeader objRequestHeader = parseRequestHeader(EmandateAPI.HeaderParameters__c);
                    Http http = new Http();
                    HttpRequest request = new HttpRequest();
                    request.setEndpoint(EmandateAPI.Endpoint__c);
                    request.setMethod(EmandateAPI.Method__c);
           //System.debug('BODYYYYYYYYYYYY    '+generateRequestBody(applicationId));
                    // Method to get Api Body.
                    System.debug('loanApplicantList is>>'+loanApplicantList);
                    request.setBody(generateRequestBody(applicationId,loanApplicantList));
                    request.setHeader('Authorization', objRequestHeader.Authorization);
                    request.setHeader('CORRELATION-ID',objRequestHeader.CORRELATIONID);
                    request.setHeader('CLIENT-ID',objRequestHeader.CLIENTID);
                    request.setHeader('CLIENT-SECRET',objRequestHeader.CLIENTSECRET);
                    request.setHeader('Content-Type', objRequestHeader.ContentType);
                    request.setHeader('token', objRequestHeader.TOKEN);
                    request.setTimeout(120000);
                    system.debug('request URL '+request.getEndpoint());
                    system.debug('request body '+request.getBody());
                    HttpResponse objResponse = http.send(request);
                    system.debug('Response  '+objResponse);
                    system.debug('@@## response '+objResponse.getbody());
                    // Method to perform create record operation on Api response.

                    API_Logger__c objAPILogger = new API_Logger__c();
                        objAPILogger.Name = 'Dedupe API';
                        objAPILogger.API_Name__c = 'Dedupe API - ' + applicationId ;
                        objAPILogger.Status__c = objResponse.getStatus();
                        objAPILogger.Request__c = request.getBody();
                        objAPILogger.Response__c = objResponse.getBody().length() > 130068 ? objResponse.getBody().substring(0, 130068) : objResponse.getBody();
                        objAPILogger.EndPoint__c = request.getEndpoint();
                        insert objAPILogger;

                    String response =  parseDedupeAPI(objResponse.getbody(), source, button , applicationId);
                    return response;
                }
            }
            catch(System.CalloutException e) {
                system.debug('Main exception '+ e.getLineNumber() + ' - ' + e.getMessage());
                Error_Logger__c objErrorLog = new Error_Logger__c();
                objErrorLog.Exception_Message__c = e.getMessage();
                objErrorLog.Name = 'DedupeAPI';
                objErrorLog.Line_Number__c = string.valueof(e.getLineNumber());
                insert objErrorLog;
            }
            catch(Exception e){
                system.debug('Main exception '+ e.getLineNumber() + ' - ' + e.getMessage());
                Error_Logger__c objErrorLog = new Error_Logger__c();
                objErrorLog.Exception_Message__c = e.getMessage();
                objErrorLog.Name = 'DedupeAPI';
                objErrorLog.Line_Number__c = string.valueof(e.getLineNumber());
                insert objErrorLog;
            }
            return '';
        }
    }


/*
@Author : Zafaruddin
@Description : This method is use to check Applicant for Dedupe Criteria.
*/
@AuraEnabled
public static Boolean checkDedupeCriteria(String applicationId) {
    Set<Id> ApplicantIds = new Set<Id>();
    Set<Id> applicantInDedupoCriteria = new Set<Id>();
    List<Dedupe_Detail__c> existingDedupeList = new List<Dedupe_Detail__c>();
    for(Loan_Applicant__c  applicant : [Select Id, LMS_Customer_Info_File_Number__c, Application__c, cifId__c from Loan_Applicant__c where Application__c  = :applicationId AND LMS_Customer_Info_File_Number__c  = NULL AND cifId__c = NULL]) {
        ApplicantIds.add(applicant.Id);
    }
    if(!ApplicantIds.isEmpty()) {
        List<Dedupe_Detail__c> dedupeObjList=[Select Id, Loan_Applicant__c, owner.Name, Archive__c  From Dedupe_Detail__c Where  Loan_Applicant__c IN : ApplicantIds AND   owner.Name != 'Dedupe Exception User' AND Archive__c = false];
        List<Dedupe_Detail__c> dedupeUserObjList=[Select Id, Loan_Applicant__c, owner.Name, Archive__c  From Dedupe_Detail__c Where  Loan_Applicant__c IN : ApplicantIds AND   owner.Name = 'Dedupe Exception User' AND Archive__c = false];

        if((dedupeObjList.size()>0)){
            for(Dedupe_Detail__c dedupe : dedupeObjList){
                applicantInDedupoCriteria.add(dedupe.Loan_Applicant__c);
            }
        }else if(dedupeUserObjList.size()>0){
            for(Dedupe_Detail__c dedupe : dedupeUserObjList){
                applicantInDedupoCriteria.add(dedupe.Loan_Applicant__c);
            }
        }

        
    }


    if(!applicantInDedupoCriteria.isEmpty()) {
        return true ;
    }
    if(!ApplicantIds.isEmpty() && applicantInDedupoCriteria.isEmpty() /*||*/ && [Select Id, Loan_Applicant__c, owner.Name, Archive__c  From Dedupe_Detail__c Where  Loan_Applicant__c IN : ApplicantIds ].isEmpty()) {
        return true ;
    }
    return false;
}

    /*
    @Author : Zafaruddin/Umair Ahmed
    @Description : This method is use to create request body for Dedupe API.
    */
    @AuraEnabled
    public static String generateRequestBody(String applicationId,List<Loan_Applicant__c>loanApplicantList){

        Set<Id> ApplicantIds = new Set<Id>();
        Set<Id> applicantInDedupoCriteria = new Set<Id>();
        for(Loan_Applicant__c  applicant : [Select Id, LMS_Customer_Info_File_Number__c, Application__c, cifId__c  from Loan_Applicant__c where Id IN :loanApplicantList AND  Application__c  = :applicationId AND LMS_Customer_Info_File_Number__c  = NULL AND cifId__c = NULL]) {
            ApplicantIds.add(applicant.Id);
        }
       /* if(!ApplicantIds.isEmpty()) {
            for(Dedupe_Detail__c dedupe : [Select Id, Loan_Applicant__c, owner.Name, Archive__c  From Dedupe_Detail__c Where  Loan_Applicant__c IN : ApplicantIds AND   owner.Name != 'Dedupe Exception User' AND Archive__c = false ]){
                applicantInDedupoCriteria.add(dedupe.Loan_Applicant__c);
            }
        }*/
        if( /*applicantInDedupoCriteria.isEmpty() &&*/ !ApplicantIds.isEmpty()) {
            applicantInDedupoCriteria = ApplicantIds;
        }
        System.debug('applicantInDedupoCriteria++++++++++++++  '+applicantInDedupoCriteria);
        DedupeBodyWrapper wrapper = new DedupeBodyWrapper();
        List<Applicants> applicants = new List<Applicants> ();
        for(Loan_Applicant__C fieldsToMap : [SELECT ID, Applicant_Type__c, Customer_Information__r.PersonBirthdate, Application__r.Sourcing_Branch__c,
        Permanent_Pincode__r.Name, KYC_ID_Type_1__c, KYC_ID_Type_2__c, KYC_Id_2__c,  KYC_Id_1__c FROM Loan_Applicant__C WHERE Id IN : applicantInDedupoCriteria]){

                                          Applicants  applicantsRecord = new Applicants ();
                                          Applicant applicantRecord = new Applicant();
                                          applicantRecord.applicantType =  fieldsToMap.Applicant_Type__c != null ? String.valueOf(fieldsToMap.Applicant_Type__c) : '';
                                          applicantRecord.applicantId = fieldsToMap.ID;
                                          applicantRecord.dob = fieldsToMap.Customer_Information__r.PersonBirthdate != null ? String.valueOf(fieldsToMap.Customer_Information__r.PersonBirthdate) : '' ;
                                          applicantRecord.branch =  fieldsToMap.Application__r.Sourcing_Branch__c != null ? String.valueOf(fieldsToMap.Application__r.Sourcing_Branch__c) : '' ;
                                          applicantRecord.pincode = fieldsToMap.Permanent_Pincode__r.Name != null ? String.valueOf(fieldsToMap.Permanent_Pincode__r.Name) : '';
                                          KYC kyc = new KYC();
                                          kyc.pan = '';
                                          kyc.passport = '';
                                          kyc.aadhaar = '';
                                          kyc.voterId = '';
                                          kyc.drivingLicense = '';
                                          if(fieldsToMap.KYC_ID_Type_1__c != null) {
                                            switch on fieldsToMap.KYC_ID_Type_1__c {
                                                when 'Aadhaar Card' {
                                                    kyc.aadhaar = fieldsToMap.KYC_Id_1__c;
                                                }
                                                when 'Voter Id' {
                                                    kyc.voterId = fieldsToMap.KYC_Id_1__c;
                                                }
                                                when 'Pan Card' {
                                                    kyc.pan = fieldsToMap.KYC_Id_1__c;
                                                }
                                                when 'Driving License' {
                                                    kyc.drivingLicense = fieldsToMap.KYC_Id_1__c;
                                                }
                                                when 'Passport' {
                                                    kyc.passport = fieldsToMap.KYC_Id_1__c;
                                                }
                                             }
                                          }
                                          if(fieldsToMap.KYC_ID_Type_2__c != null) {
                                            switch on fieldsToMap.KYC_ID_Type_2__c {
                                                when 'Aadhaar Card' {
                                                    kyc.aadhaar = fieldsToMap.KYC_Id_2__c;
                                                }
                                                when 'Voter Id' {
                                                    kyc.voterId = fieldsToMap.KYC_Id_2__c;
                                                }
                                                when 'Pan Card' {
                                                    kyc.pan = fieldsToMap.KYC_Id_2__c;
                                                }
                                                when 'Driving License' {
                                                    kyc.drivingLicense = fieldsToMap.KYC_Id_2__c;
                                                }
                                                when 'Passport' {
                                                    kyc.passport = fieldsToMap.KYC_Id_2__c;
                                                }
                                             }
                                          }
                                          System.debug('KYCCCCCCCCC   '+kyc);
                                          applicantRecord.kycIds = kyc ;
                                          applicantsRecord.applicant = applicantRecord;
                                          applicants.add(applicantsRecord);
         }
        wrapper.applicants = applicants;
        System.debug('DDDDDDDDDDDDDDDD    '+ Json.serialize(wrapper));
        return Json.serialize(wrapper);
    }

    /*
    @Author : Suraj kumar -- Karan Singh Soni / Zafaruddin
    @Description : 1) Method to parse response JSON for Dedupe API.
    */
    @AuraEnabled
    public static String parseDedupeAPI(String responseJson, String source, String button, String applicationId){
        Set<Id> archiveDedupeApplicantIds = new Set<Id>();
        List<Dedupe_Detail__c> archiveDedupeList = new List<Dedupe_Detail__c>();
        List<Dedupe_Loan_Detail__c> loanDetailList = new List<Dedupe_Loan_Detail__c>();
        List<Dedupe_Detail__c> dedupeDetailList = new List<Dedupe_Detail__c>();
        Map<String,Dedupe_Detail__c> dedupeMap = new  Map<String,Dedupe_Detail__c>();
        DedupeResponseWrapper wrapper = new DedupeResponseWrapper();
        wrapper = (DedupeResponseWrapper) System.JSON.deserialize(responseJson, DedupeResponseWrapper.class);
        System.debug('RESPONSE WRAPPERRRRR  '+wrapper);
        for(DedupeResponseWrapper.Applicant app : wrapper.applicant) {
            if(app.applicant.applicantId != null && app.applicant.matches != null) {
                archiveDedupeApplicantIds.add(app.applicant.applicantId);
            }
        }
        if(!archiveDedupeApplicantIds.isEmpty()) {
            for(Dedupe_Detail__c dedupe : [Select Id, Loan_Applicant__c,  Archive__c From Dedupe_Detail__c where Loan_Applicant__c IN : archiveDedupeApplicantIds ]) {
                dedupe.Archive__c = true;
                archiveDedupeList.add(dedupe);
            }
        }
        // update Existing Dedupe record as Archive
        if(!archiveDedupeList.isEmpty()) {
            try{
update archiveDedupeList;
            }catch(Exception e){
                System.debug('line no and msg'+e.getLineNumber()+'msgis >>'+e.getmessage());
            }
           
        }
        for(DedupeResponseWrapper.Applicant app : wrapper.applicant) {
            Dedupe_Detail__c objDedupeDetail = new Dedupe_Detail__c();
            if(app.applicant.matches != null) {
                objDedupeDetail.Applicant_Id__c = app.applicant.applicantId;
                objDedupeDetail.Loan_Applicant__c = app.applicant.applicantId;
                objDedupeDetail.Button_Name__c = button;
                objDedupeDetail.Dedupe_Invoke_From__c = source;
                for(DedupeResponseWrapper.Matches matchData : app.applicant.matches){
                    System.debug('matchData   '+matchData);
                    objDedupeDetail.Customer_Rel_Id__c = matchData.match.customerRelId;
                    objDedupeDetail.CIF_Id__c = matchData.match.cifId;
                    objDedupeDetail.Source__c = matchData.match.source;
                    objDedupeDetail.First_Name__c = matchData.match.firstName;
                    objDedupeDetail.Last_Name__c = matchData.match.lastName;
                    objDedupeDetail.Date_Of_Birth__c = matchData.match.dob;
                    objDedupeDetail.Mobile_Number__c = matchData.match.mobileNo;
                    objDedupeDetail.Address_Line_1__c = matchData.match.residenceAddress.addressLine1;
                    objDedupeDetail.Address_Line_2__c = matchData.match.residenceAddress.addressLine2;
                    objDedupeDetail.Address_Line_3__c = matchData.match.residenceAddress.addressLine3;
                    objDedupeDetail.City__c = matchData.match.residenceAddress.city;
                    objDedupeDetail.District__c = matchData.match.residenceAddress.district;
                    objDedupeDetail.State__c = matchData.match.residenceAddress.state;
                    objDedupeDetail.Pincode__c = matchData.match.residenceAddress.pincode;
                    objDedupeDetail.Pan_Number__c = matchData.match.kycIds.pan;
                    objDedupeDetail.Passport__c = matchData.match.kycIds.passport;
                    objDedupeDetail.Aadhaar_Number__c = matchData.match.kycIds.aadhaar;
                    objDedupeDetail.Voter_Id__c = matchData.match.kycIds.voterId;
                    objDedupeDetail.Driving_License__c = matchData.match.kycIds.drivingLicense;
                }
                dedupeMap.put(app.applicant.applicantId, objDedupeDetail);
            }
        }
        System.debug('DDDDDDDDDDDDDMap ++++++++++++ '+ dedupeMap);
        if( !dedupeMap.keySet().isEmpty() && !dedupeMap.values().isEmpty()) {
            insert dedupeMap.values();
            for(DedupeResponseWrapper.Applicant app : wrapper.applicant) {
                if(app.applicant.matches != null) {
                    for(DedupeResponseWrapper.Matches matchData : app.applicant.matches){
                        if(matchData.match.loans != null) {
                            for(DedupeResponseWrapper.Loans loanData : matchData.match.loans ){
                                Dedupe_Loan_Detail__c objDedupeLoanDetail = new Dedupe_Loan_Detail__c();
                                objDedupeLoanDetail.Lan__c = loanData.loan.lan;
                                objDedupeLoanDetail.Dedupe_Detail__c = dedupeMap.get(app.applicant.applicantId).Id;
                                objDedupeLoanDetail.Lan_Status__c = loanData.loan.lanstatus;
                                objDedupeLoanDetail.Application_Number__c = loanData.loan.applicationNo;
                                objDedupeLoanDetail.Application_Status__c = loanData.loan.applicationStatus;
                                objDedupeLoanDetail.Branch_Code__c = loanData.loan.branchCode;
                                loanDetailList.add(objDedupeLoanDetail);
                            }
                        }
                    }
                }
            }
            System.debug('loanDetailListloanDetailList   '+loanDetailList);
            if( !loanDetailList.isEmpty()){
                insert loanDetailList;
            }
            // code to return mewly created dedupe records from API.
            if(!dedupeMap.values().isEmpty()) {
                String json = DedupeDetailsController.initDedupeData(applicationId);
                return json;
            }
        }
        // code when No matching found againts Loan Applicant.
        DedupeDetailsController.DedupeWrapper objDedupeWrapper = new DedupeDetailsController.DedupeWrapper();
        objDedupeWrapper.statusCode = 200;
        objDedupeWrapper.noDedupeMatch = true;
        return JSON.serialize(objDedupeWrapper);
    }


    public class RequestHeader{
        public String Authorization;
        public String CORRELATIONID;
        public String CLIENTID;
        public String CLIENTSECRET ;
        public String ContentType ;
        public String TOKEN ;
    }


    public static RequestHeader parseRequestHeader(String json){
        return (RequestHeader) System.JSON.deserialize(json, RequestHeader.class);
    }


    public class DedupeBodyWrapper{

        public List<Applicants> applicants;

    }


 	public class Applicants {
            public Applicant applicant;
    }


    public class Applicant {
        public String applicantType;
        public String applicantId;
        public String dob;
        public String branch;
        public String pincode;
        public KYC kycIds;
    }


    public class KYC {
        public String pan;
        public String passport;
        public String aadhaar;
        public String voterId;
        public String drivingLicense;
    }

}