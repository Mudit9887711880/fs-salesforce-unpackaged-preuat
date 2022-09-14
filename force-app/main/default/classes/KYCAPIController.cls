public class KYCAPIController  {
    
    @AuraEnabled
    public static String kycAPICallout(String loanAppId){
        Boolean isKYCVerified = false;
        Loan_Applicant__c objLoan = [SELECT Id, KYC_ID_Type_1__c, KYC_ID_Type_2__c, KYC_Id_1__c, KYC_Id_2__c,Is_KYC_Verified__c	, Customer_Information__r.PersonBirthDate,Applicant_Name__c 
                                     FROM Loan_Applicant__c
                                     WHERE Id = : loanAppId];
        if(objLoan.KYC_ID_Type_1__c == 'Pan Card' || objLoan.KYC_ID_Type_2__c == 'Pan Card'){
            isKYCVerified = true;
        }
        Map<String,String> kycTypeMap = new Map<String,String>{objLoan.KYC_ID_Type_1__c => objLoan.KYC_ID_1__c};            
        if(String.isNotBlank(objLoan.KYC_ID_Type_2__c) && String.isNotBlank(objLoan.KYC_Id_2__c)){
                kycTypeMap.put(objLoan.KYC_ID_Type_2__c,objLoan.KYC_Id_2__c);
        }
        System.debug('kycTypeMap '+kycTypeMap);
        List<API_Handler__mdt> listAPI = [SELECT DeveloperName,Sub_Type__c FROM API_Handler__mdt WHERE API_Type__r.DeveloperName = 'KYCAPIs'];
        
        Map<String,String> mdtNameMap = new Map<String,String>();
        for(API_Handler__mdt api : listAPI){
            mdtNameMap.put(api.Sub_Type__c,api.DeveloperName);
        }
        System.debug('mdtNameMap '+mdtNameMap);
        for(String str : kycTypeMap.keySet()){
            if(str != 'Pan Card')
            	isKYCVerified = false;
            System.debug('Str '+str);
            System.debug('kycMapStr '+kycTypeMap.get(str));
            if(str != null && str != 'Pan Card'){ /*str != 'Aadhaar Card' && */ /*str != 'Pan Card'*/
                HttpCalloutHelper http = new HttpCalloutHelper(mdtNameMap.get(str),null,getRequest(str,loanAppId,objLoan.Customer_Information__r.PersonBirthDate,kycTypeMap.get(str),objLoan.Applicant_Name__c));
                http.className = 'KYCAPIController';
                HttpCalloutHelper.ResponseWrapper resWrap = http.doCallout();
                System.debug('KYC RESPWRAP '+resWrap.response.getBody());
                if(str == 'Aadhaar Card'){
                    DLWrapper dlWrap = DLWrapper.parse(resWrap.response.getBody());
                    if(string.valueof(dlWrap.statusCode) == '101'){
                       isKYCVerified = true;
                    }  
                }
                if(str == 'Driving License'){
                    DLWrapper dlWrap = DLWrapper.parse(resWrap.response.getBody());
                    if(string.valueof(dlWrap.statusCode) == '101'){
                       isKYCVerified = true;
                    }  
                }
                if(str == 'Voter Id'){
                    VoterIdWrapper voterWrap = VoterIdWrapper.parse(resWrap.response.getBody());
                    if(voterWrap.statusCode!=null && string.valueof(voterWrap.statusCode)=='101'){
                        isKYCVerified = true;
                    }  
                }
                if(str == 'Passport'){
                    PassportWrapper paspWrap = PassportWrapper.parse(resWrap.response.getBody());
                    if(paspWrap.statusCode!=null && string.valueof(paspWrap.statusCode) == '101'){
                        isKYCVerified = true;
                    }  
                }
            }
        }
        if(isKYCVerified){
            objLoan.Is_KYC_Verified__c = isKYCVerified;
            UPDATE objLoan;
            return 'Success';
        }
        else
           return 'Fail';

    }
    
    
    private static String getRequest(String kycType , String loanAppId, Date dob, String kycId, String applicantFullName){
        String ocrRequest = '';
        if(kycType=='Aadhaar Card'){
            ocrRequest = '{ "aadhaarNo": "'+kycId+'", "accessKey": "f63c7f8f-1443-4be0-9aa0-c05e24719ddc", "consent": "Y", "clientData": {"caseId": "123456"} }';
        }
        if(kycType=='Driving License'){
            ocrRequest = '{ "dlNo": "'+kycId+'", "dob": "'+converDate(dob,'-')+'", "consent": "Y" }';
        }
        if(kycType=='Voter Id'){
            ocrRequest ='{ "epicNo": "'+kycId+'", "consent": "Y" }';
        }
        if(kycType=='Passport'){
            KYC__c objKYC = [SELECT Id,Passport_FileNo__c,DOB__c,DateOfIssue__c
                                 FROM KYC__c
                                 WHERE Loan_Applicant__c =:loanAppId AND Name!='Aadhar_Card' AND Name!='Pan_Card'];
            ocrRequest = '{ "consent": "y", "fileNo": "'+objKYC.Passport_FileNo__c+'", "dob": "'+converDate(dob,'/')+'", "passportNo": "'+kycId+'", "doi": "'+converDate(objKYC.DateOfIssue__c,'/')+'", "name": "'+applicantFullName+'" }'; 
        }
        return ocrRequest;
    }
    
    private static String converDate(Date dob,String delimeter){
        String str = string.valueof(dob);
        string day=str.SubStringBefore('-');
        string month=str.SubStringafter('-');
        string year=month.SubStringafter('-');
        month=month.SubStringBefore('-');
        return year+delimeter+month+delimeter+day; 
    }
    
    
    
/*@AuraEnabled
Public static Wrapper getKYCReport(string recordId ){
try{
system.debug('recordId'+recordId);            
//list<KYC_OCR__c> ocrlist=[select id,Loan_Applicant__c,First_Name__c,Passport_FileNo__c,last_Name__c ,name,DOB__c,ID__c,doi__c,name__C from KYC_OCR__c where Loan_Applicant__c =:recordId AND name__c!='Aadhar_Card' AND name__c!='Pan_Card'  ];
list<KYC__c> kycListToInsert=new list<KYC__c>();
string isAccountVerified='';
list<API_Logger__c> apiLoggerToInsert=new list<API_Logger__c> ();
Loan_Applicant__c acc=new Loan_Applicant__c();
acc.id=recordid;
if(ocrlist.size()>0){
Wrapper wrp=new Wrapper();
APICredentials__mdt kycOCR = APICredentials__mdt.getInstance('KYCOCR');
for(KYC_OCR__c ocr:ocrlist){
string ocrRequest;
system.debug('ocr.name'+ocr.name);
Http http = new Http();
HttpRequest request = new HttpRequest();
if(ocr.name=='Driving_License'){
if(ocr.DOB__c!=null){
String str = string.valueof(ocr.DOB__c);
string day=str.SubStringBefore('-');
string month=str.SubStringafter('-');
string year=month.SubStringafter('-');
month=month.SubStringBefore('-');
string strdate=year+'-'+month+'-'+day;  
ocrRequest='{ "dlNo": "'+ocr.ID__c+'", "dob": "'+strdate+'", "consent": "Y" }';
}
request.setEndpoint(kycOCR.Endpoint_DLKYC__c);
}
if(ocr.name=='Voter_Id'){
system.debug('testtt');
ocrRequest ='{ "epicNo": "'+ocr.ID__c+'", "consent": "Y" }';
request.setEndpoint(kycOCR.Endpoint_VoterIDKYC__c); 
}
system.debug('ocr.name'+ocr.name);
system.debug('ocrRequest'+ocrRequest);
if(ocr.name=='Passport'){
if(ocr.DOB__c!=null){
String str = string.valueof(ocr.DOB__c);
string day=str.SubStringBefore('-');
string month=str.SubStringafter('-');
string year=month.SubStringafter('-');
month=month.SubStringBefore('-');
string strdate=year+'/'+month+'/'+day;  
String doi = string.valueof(ocr.DOI__c);
string dayy=doi.SubStringBefore('-');
string monthh=doi.SubStringafter('-');
string yearr=monthh.SubStringafter('-');
monthh=monthh.SubStringBefore('-');
string doii=yearr+'/'+monthh+'/'+dayy;    
string ocrname;
if(ocr.First_Name__c!=null)
ocrname+=ocr.First_Name__c;
if(ocr.last_Name__c!=null)
ocrname+=' '+ocr.last_Name__c;
ocrRequest='{ "consent": "y", "fileNo": "'+ocr.Passport_FileNo__c+'", "dob": "'+strdate+'", "passportNo": "'+ocr.ID__c+'", "doi": "'+doii+'", "name": "'+ocrname+'" }';
}
request.setEndpoint(kycOCR.Endpoint_PassportKYC__c); 
}   
request.setMethod(kycOCR.Method__c); 
request.setBody(ocrRequest);
request.setHeader('Authorization', kycOCR.Authorization__c);
request.setHeader('CORRELATION-ID',kycOCR.CORRELATION_ID__c);
request.setHeader('CLIENT-ID',kycOCR.CLIENT_ID__c);
request.setHeader('CLIENT-SECRET',kycOCR.CLIENT_SECRET__c);
request.setHeader('Content-Type', kycOCR.Content_Type__c);
request.setTimeout(120000);
HttpResponse response = http.send(request); 
system.debug('response'+response.getBody() );
if(response.getStatusCode()==200 ){


if(ocr.name=='Driving_License'){
DLWrapper respWrap=DLWrapper.parse(response.getBody());
if(respWrap.statusCode!=null && string.valueof(respWrap.statusCode)=='101'){
if(respWrap.result!=null){
if(isAccountVerified!='No'){    
isAccountVerified='Yes';
}
KYC__c kyc=new KYC__c();
kyc.Account__c=ocr.Account__c;
kyc.Type__c='Driving License';
if(respWrap.result.validity!=null){
if(string.isNotBlank(respWrap.result.validity.nonTransport)){

kyc.nonTransport__c=respWrap.result.validity.nonTransport;
}
if(string.isNotBlank(respWrap.result.validity.transport)){
String dob = string.valueof(respWrap.result.validity.transport);
string dayy=dob.SubStringBefore('-');
string monthh=dob.SubStringafter('-');
string yearr=monthh.SubStringafter('-');
monthh=monthh.SubStringBefore('-');
string dobb=yearr+'-'+monthh+'-'+dayy; 
kyc.Transport__c=date.valueof(dobb);
} 
}
if(respWrap.result.address!=null){
if(string.isNotBlank(respWrap.result.address[0].country)){
kyc.Country__c=respWrap.result.address[0].country;
}
if(string.isNotBlank(string.valueof(respWrap.result.address[0].pin))){
kyc.pin__c=string.valueof(respWrap.result.address[0].pin);
}
if(string.isNotBlank(respWrap.result.address[0].district)){
kyc.district__c=respWrap.result.address[0].district;
}
if(string.isNotBlank(respWrap.result.address[0].completeAddress)){
kyc.CompleteAddress__c=respWrap.result.address[0].completeAddress;
}
if(string.isNotBlank(respWrap.result.address[0].state)){
kyc.State__c=respWrap.result.address[0].state;
}
if(string.isNotBlank(respWrap.result.address[0].addressLine1)){
kyc.addressLine1__c=respWrap.result.address[0].addressLine1;
}
if(string.isNotBlank(respWrap.result.address[0].type)){
kyc.Address_Type__c=respWrap.result.address[0].type;
}
}  
if(respWrap.result.covDetails!=null){
if(string.isNotBlank(respWrap.result.covDetails[0].issueDate)){
kyc.issueDate__c=respWrap.result.covDetails[0].issueDate;
}
if(string.isNotBlank(respWrap.result.covDetails[0].cov)){
kyc.cov__c=respWrap.result.covDetails[0].cov;
}
}
if(string.isNotBlank(respWrap.result.dlNumber)){
kyc.dlNumber__c=respWrap.result.dlNumber;
}
if(string.isNotBlank(respWrap.result.bloodGroup)){
kyc.bloodGroup__c=respWrap.result.bloodGroup;
}
if(string.isNotBlank(respWrap.result.name)){
kyc.name__c=respWrap.result.name;
}
if(string.isNotBlank(respWrap.result.dob)){
String dob = string.valueof(respWrap.result.dob);
string dayy=dob.SubStringBefore('-');
string monthh=dob.SubStringafter('-');
string yearr=monthh.SubStringafter('-');
monthh=monthh.SubStringBefore('-');
string dobb=yearr+'-'+monthh+'-'+dayy;  
kyc.dob__c=date.valueof(dobb);
}       
kycListToInsert.add(kyc); 
wrp.successMSG+=' Driving License KYC done.';    
//API_Logger__c al=new API_Logger__c();
//al.Name='KYCAPI';
// al.API_Name__c='KYCAPI'; 
// al.Status__c='success';
// al.Request__c= request.getBody();   
//al.Response__c= response.getBody().length() > 130068 ? response.getBody().substring(0, 130068) : response.getBody();
//al.EndPoint__c=request.getEndpoint();
// insert al; 


}
}
else{
isAccountVerified='No';
wrp.errorMSG+=' Error in Driving License KYC';
}
}
if(ocr.name=='Passport'){
PassportWrapper respWrap=PassportWrapper.parse(response.getBody());
if(respWrap.statusCode!=null && string.valueof(respWrap.statusCode)=='101'){
if(respWrap.result!=null){
if(isAccountVerified!='No'){    
isAccountVerified='Yes';
}
KYC__c kyc=new KYC__c();
kyc.Account__c=ocr.Account__c;
kyc.Type__c='Passport';
if(respWrap.result.passportNumber!=null){
if(string.isNotBlank(respWrap.result.passportNumber.passportNumberFromSource)){
kyc.passportNumberFromSource__c=respWrap.result.passportNumber.passportNumberFromSource;
}
if(respWrap.result.passportNumber.passportNumberMatch!=null){
kyc.passportNumberMatch__c=respWrap.result.passportNumber.passportNumberMatch;
}
} 
if(string.isNotBlank(respWrap.result.applicationDate)){
String dob = string.valueof(respWrap.result.applicationDate);
string dayy=dob.SubStringBefore('-');
string monthh=dob.SubStringafter('-');
string yearr=monthh.SubStringafter('-');
monthh=monthh.SubStringBefore('-');
string dobb=yearr+'-'+monthh+'-'+dayy; 
kyc.applicationDate__c=date.valueof(dobb);

}
if(string.isNotBlank(respWrap.result.typeOfApplication)){
kyc.typeOfApplication__c=respWrap.result.typeOfApplication;

}
if(respWrap.result.dateOfIssue!=null){
if(string.isNotBlank(respWrap.result.dateOfIssue.dispatchedOnFromSource)){
kyc.dispatchedOnFromSource__c=date.valueof(respWrap.result.dateOfIssue.dispatchedOnFromSource);
}
if(respWrap.result.dateOfIssue.dateOfIssueMatch!=null){
kyc.dateOfIssueMatch__c=respWrap.result.dateOfIssue.dateOfIssueMatch;
}
}
if(respWrap.result.name!=null){
if(respWrap.result.name.nameMatch!=null){
kyc.nameMatch__c=respWrap.result.name.nameMatch;
}
if(string.isNotBlank(string.valueof(respWrap.result.name.nameScore))){
kyc.nameScore__c=respWrap.result.name.nameScore;
}
if(string.isNotBlank(respWrap.result.name.surnameFromPassport)){
kyc.surnameFromPassport__c=respWrap.result.name.surnameFromPassport;
}
if(string.isNotBlank(respWrap.result.name.nameFromPassport)){
kyc.name__c=respWrap.result.name.nameFromPassport;
}
}
kycListToInsert.add(kyc);
wrp.successMSG+=' Passport KYC done.';     
}

}
else{
isAccountVerified='No';
wrp.errorMSG+=' Error in Passport KYC';
}
}
if(ocr.name=='Voter_Id'){
VoterIdWrapper respWrap=VoterIdWrapper.parse(response.getBody());
if(respWrap.statusCode!=null && string.valueof(respWrap.statusCode)=='101'){
if(respWrap.result!=null){
if(isAccountVerified!='No'){    
isAccountVerified='Yes';
}
KYC__c kyc=new KYC__c();
kyc.Account__c=ocr.Account__c;
kyc.Type__c='Voter Id';
if(string.isNotBlank(respWrap.result.partNo)){
kyc.partNo__c=decimal.valueof(respWrap.result.partNo);
} 
if(string.isNotBlank(respWrap.result.rlnType)){
// kyc.Type__c=respWrap.result.rlnType;
} 
if(string.isNotBlank(respWrap.result.sectionNo)){
kyc.sectionNo__c=integer.valueof(respWrap.result.sectionNo);
} 
if(string.isNotBlank(respWrap.result.id)){
kyc.id__c=string.valueof(respWrap.result.id);
} 
if(string.isNotBlank(respWrap.result.epicNo)){
kyc.epicNo__c=respWrap.result.partNo;
} 
if(string.isNotBlank(respWrap.result.rlnName)){
kyc.rlnName__c=respWrap.result.rlnName;
} 
if(string.isNotBlank(respWrap.result.district)){
kyc.district__c=respWrap.result.district;
} 
if(respWrap.result.lastUpdate!=null){
String str = respWrap.result.lastUpdate;
string day=str.SubStringBefore('-');
string month=str.SubStringafter('-');
string year=month.SubStringafter('-');
month=month.SubStringBefore('-');
string strdate=year+'-'+month+'-'+day;
kyc.lastUpdate__c=date.valueof(strdate);
} 
if(string.isNotBlank(respWrap.result.state)){
kyc.State__c=respWrap.result.state;
} 
if(string.isNotBlank(respWrap.result.acNo)){
kyc.acNo__c=integer.valueof(respWrap.result.acNo);
} 
if(string.isNotBlank(respWrap.result.slnoInpart)){
kyc.slnoInpart__c=decimal.valueof(respWrap.result.slnoInpart);
} 
if(string.isNotBlank(respWrap.result.psName)){
kyc.psname__C=respWrap.result.psName;
} 
if(string.isNotBlank(respWrap.result.pcName)){
kyc.pcname__C=respWrap.result.pcName;
} 
if(string.isNotBlank(respWrap.result.houseNo)){
kyc.houseNo__c=integer.valueof(respWrap.result.houseNo);
} 
if(string.isNotBlank(respWrap.result.name)){
kyc.name__c=respWrap.result.name;
} 
if(string.isNotBlank(respWrap.result.partName)){
kyc.partName__c=respWrap.result.partName;
} 
if(string.isNotBlank(respWrap.result.stCode)){
kyc.stCode__c=respWrap.result.stCode;
}
if(string.isNotBlank(respWrap.result.gender)){
kyc.gender__c=respWrap.result.gender;
}
if(string.isNotBlank(string.valueof(respWrap.result.age))){
kyc.age__c=respWrap.result.age;
}
if(string.isNotBlank(respWrap.result.acName)){
kyc.acName__c=respWrap.result.acName;
}
if(string.isNotBlank(respWrap.result.dob)){

String str = respWrap.result.dob;
string day=str.SubStringBefore('-');
string month=str.SubStringafter('-');
string year=month.SubStringafter('-');
month=month.SubStringBefore('-');
string strdate=year+'-'+month+'-'+day;

kyc.dob__c=date.valueof(strdate);
}

kycListToInsert.add(kyc);
wrp.successMSG+=' Voter id KYC done';     
}

}
else{
isAccountVerified='No';
wrp.errorMSG+=' Error in voterID KYC';
}
}


API_Logger__c al=new API_Logger__c();
al.Name='KYCAPI';
al.API_Name__c='KYCAPI'; 
al.Status__c='success';
al.Request__c= request.getBody();   
al.Response__c= response.getBody().length() > 130068 ? response.getBody().substring(0, 130068) : response.getBody();
al.EndPoint__c=request.getEndpoint();
apiLoggerToInsert.add(al);

}
else{
wrp.errorMSG+=' Getting error at karza end';
API_Logger__c al=new API_Logger__c();
al.Name='KYCAPI';
al.API_Name__c='KYCAPI'; 
al.Status__c='fail';
al.Request__c= request.getBody();   
al.Response__c= response.getBody().length() > 130068 ? response.getBody().substring(0, 130068) : response.getBody();
al.EndPoint__c=request.getEndpoint();
apiLoggerToInsert.add(al);

}

}    

if(kycListToInsert.size()>0)
insert kycListToInsert;
if(apiLoggerToInsert.size()>0)
insert apiLoggerToInsert;
if(isAccountVerified!='Yes'){
// acc.Is_KYC_Verified__c=true;
//    update acc;    
}
return wrp;
}  

return null; 
}
catch(exception e){ 
system.debug('error'+e.getLineNumber()+e.getMessage());
Error_Logger__c objErrorLog=New Error_Logger__c();
objErrorLog.Name='KYCAPI';
objErrorLog.Exception_Message__c=string.valueOf(e.getMessage());
objErrorLog.Exception_Type__c=string.valueOf(e.getCause());
objErrorLog.Line_Number__c=string.valueOf(e.getLineNumber());
insert objErrorLog; 
wrapper wrp=new wrapper();
wrp.errorMSG=string.valueOf(e.getMessage());
return wrp;
} 

}*/
    
    /* @AuraEnabled
Public static string getKYCReportManualElectricityBill(string recordId ,string consumerID,string serviceProvider){
system.debug('getKYCReportManualElectricityBill called');
APICredentials__mdt kycOCR = APICredentials__mdt.getInstance('KYCOCR');
string  kycRequest='{ "consumerId": "'+consumerID+'", "serviceProvider": "'+serviceProvider+'", "consent": "Y" } ';
Http http = new Http();
HttpRequest request = new HttpRequest();
request.setEndpoint(kycOCR.End_Point_All__c+'electricitybill');
request.setMethod(kycOCR.Method__c); 
request.setBody(kycRequest);
request.setHeader('Authorization', kycOCR.Authorization__c);
request.setHeader('CORRELATION-ID',kycOCR.CORRELATION_ID__c);
request.setHeader('CLIENT-ID',kycOCR.CLIENT_ID__c);
request.setHeader('CLIENT-SECRET',kycOCR.CLIENT_SECRET__c);
request.setHeader('Content-Type', kycOCR.Content_Type__c);
request.setTimeout(120000);

HttpResponse response = http.send(request);
system.debug(response.getBody());
if( response.getStatusCode()==200){
KYCWrapper respWrap=KYCWrapper.parse(response.getBody());
if(respWrap.statusCode!=null && respWrap.statusCode==101){
if(respWrap.result!=null){
KYC__c kyc=new KYC__c();
if(string.isNotBlank(respWrap.result.billNo))  
kyc.Bill_No__c=respWrap.result.billNo;
if(respWrap.result.billDueDate!=null)   {
String str = respWrap.result.billDueDate;
string day=str.SubStringBefore('-');
string month=str.SubStringafter('-');
string year=month.SubStringafter('-');
month=month.SubStringBefore('-');
string strdate=year+'-'+month+'-'+day;
kyc.Bill_Due_Date__c=date.valueof(strdate);
}
if(string.isNotBlank(respWrap.result.consumerNumber))    
kyc.Consumer_Number__c=respWrap.result.consumerNumber;
if(string.isNotBlank(respWrap.result.billAmount))    
kyc.Bill_Amount__c=decimal.valueof(respWrap.result.billAmount);
if(string.isNotBlank(respWrap.result.billIssueDate)){    
String str = respWrap.result.billIssueDate;
string day=str.SubStringBefore('-');
string month=str.SubStringafter('-');
string year=month.SubStringafter('-');
month=month.SubStringBefore('-');
string strdate=year+'-'+month+'-'+day;
kyc.Bill_Issue_Date__c=date.valueof(strdate); 
}
if(string.isNotBlank(respWrap.result.mobileNumber))    
kyc.Mobile_Number__c=respWrap.result.mobileNumber;
if(string.isNotBlank(respWrap.result.amountPayable))    
kyc.Amount_Payable__c=decimal.valueof(respWrap.result.amountPayable);
if(string.isNotBlank(respWrap.result.totalAmount))    
kyc.Total_Amount__c=decimal.valueof(respWrap.result.totalAmount);
if(string.isNotBlank(respWrap.result.address))    
kyc.address__c=respWrap.result.address; 
if(string.isNotBlank(respWrap.result.consumerName))    
kyc.Consumer_Name__c=respWrap.result.consumerName; 
if(string.isNotBlank(respWrap.result.emailAddress))    
kyc.Email_Address__c=respWrap.result.emailAddress; 
if(string.isNotBlank(respWrap.result.billDate))  {  
String str = respWrap.result.billDate;
string day=str.SubStringBefore('-');
string month=str.SubStringafter('-');
string year=month.SubStringafter('-');
month=month.SubStringBefore('-');
string strdate=year+'-'+month+'-'+day;
kyc.Bill_Date__c=date.valueof(strdate); 
}
insert kyc;    
API_Logger__c al=new API_Logger__c();
al.Name='KYCAPI';
al.API_Name__c='KYCAPI'; 
//al.Request__c= request.getBody(); 
al.Status__c='success';
al.Response__c= response.getBody();
al.EndPoint__c=request.getEndpoint();
// al.ID__c=  wrp.kycNo;
insert al; 
return 'KYC done successfully';
}
}
else{
return 'error while doing the KYC';
}

}
return 'error while doing the KYC';
} 
@AuraEnabled
Public static string getKYCReportManualPropertyTax(string recordId,string state,string city,string propertyNo,string district,string ulb ){
System.debug('call');
APICredentials__mdt kycOCR = APICredentials__mdt.getInstance('KYCOCR');
list<Tax_Calculations__c> listtaxcalculationToInsert=new list<Tax_Calculations__c>();
list<Owner_Details__c> listownerDetailsToInsert=new list<Owner_Details__c>();
list<Payment_Details__c> listPaymentDetailsToInsert=new list<Payment_Details__c>();
list<Floor_Details__c> listFloorDetailsToInsert=new list<Floor_Details__c>();
string  kycRequest='{ "state": "'+state+'", "city": "'+city+'", "propertyNo": "'+propertyNo+'", "district": "", "ulb": "", "consent": "y" }  ';
Http http = new Http();
HttpRequest request = new HttpRequest();
request.setEndpoint(kycOCR.End_Point_All__c+'propertytax');
request.setMethod(kycOCR.Method__c); 
request.setBody(kycRequest);
request.setHeader('Authorization', kycOCR.Authorization__c);
request.setHeader('CORRELATION-ID',kycOCR.CORRELATION_ID__c);
request.setHeader('CLIENT-ID',kycOCR.CLIENT_ID__c);
request.setHeader('CLIENT-SECRET',kycOCR.CLIENT_SECRET__c);
request.setHeader('Content-Type', kycOCR.Content_Type__c);
request.setTimeout(120000);
HttpResponse response = http.send(request); 
if( response.getStatusCode()==200){
KYCWrapper respWrap=KYCWrapper.parse(response.getBody());
if(respWrap.statusCode!=null && respWrap.statusCode==101){
if(respWrap.result!=null){
KYC__c kyc=new KYC__c();
insert kyc;
if(respWrap.result.propertyDetails!=null){
Property_Details__c pd=new Property_Details__c();
pd.KYC__c=kyc.id;
if(string.isNotBlank(respWrap.result.propertyDetails.propertyId)) 
pd.Property_Id__c=respWrap.result.propertyDetails.propertyId;
if(string.isNotBlank(respWrap.result.propertyDetails.propertyAddress)) 
pd.Property_Address__c=respWrap.result.propertyDetails.propertyAddress;
if(respWrap.result.propertyDetails.plotAreaInSqYrd!=null) 
pd.Plot_Area_In_Sq_Yrd__c=string.valueof(respWrap.result.propertyDetails.plotAreaInSqYrd);
if(respWrap.result.propertyDetails.plotAreaInSqMtrs!=null) 
pd.Plot_Area_In_Sq_Mtrs__c=string.valueof(respWrap.result.propertyDetails.plotAreaInSqMtrs);
if(respWrap.result.propertyDetails.vacantAreaInSqYrd!=null) 
pd.Vacant_Area_In_Sq_Yrd__c=string.valueof(respWrap.result.propertyDetails.vacantAreaInSqYrd);
if(respWrap.result.propertyDetails.constructedArea!=null) 
pd.Constructed_Area__c=string.valueof(respWrap.result.propertyDetails.constructedArea);
if(respWrap.result.propertyDetails.exemptionCategory!=null) 
pd.Exemption_Category__c=string.valueof(respWrap.result.propertyDetails.exemptionCategory);
if(respWrap.result.propertyDetails.multipurposeOwnership!=null) 
pd.Multipurpose_Ownership__c=string.valueof(respWrap.result.propertyDetails.multipurposeOwnership);
if(respWrap.result.propertyDetails.ownershipType!=null) 
pd.Ownership_Type__c=string.valueof(respWrap.result.propertyDetails.ownershipType);
if(respWrap.result.propertyDetails.registrationDocNo!=null) 
pd.Registration_Doc_No__c=string.valueof(respWrap.result.propertyDetails.registrationDocNo);
if(respWrap.result.propertyDetails.registrationDocDate!=null) 
pd.Registration_Doc_Date__c=string.valueof(respWrap.result.propertyDetails.registrationDocDate);
if(respWrap.result.propertyDetails.billingName!=null) 
pd.Name=string.valueof(respWrap.result.propertyDetails.billingName);
if(respWrap.result.propertyDetails.billingAddress!=null) 
pd.Billing_Address__c=string.valueof(respWrap.result.propertyDetails.billingAddress);
insert pd;
if(respWrap.result.propertyDetails.floorDetails!=null){
for(KYCWrapper.cls_floorDetails detail:respWrap.result.propertyDetails.floorDetails){
Floor_Details__c FloorDetails=new Floor_Details__c();
if(detail.floor!=null)
FloorDetails.name=  string.valueof(detail.floor);
if(detail.areaInSqft!=null)
FloorDetails.Area_In_Sqft__c=  string.valueof(detail.areaInSqft);
if(detail.firmName!=null)
FloorDetails.Firm_Name__c=  string.valueof(detail.firmName);
if(detail.occupancy!=null)
FloorDetails.Occupancy__c=  string.valueof(detail.occupancy);
if(detail.occupantName!=null)
FloorDetails.Occupant_Name__c=  string.valueof(detail.occupantName);
//if(detail.constructionDate!=null)
// FloorDetails.Construction_Date__c=  date.valueof(detail.constructionDate);
if(detail.effectiveFromDate!=null)
FloorDetails.Effective_From_Date__c=  date.valueof(detail.effectiveFromDate);
//if(detail.length!=null)
// FloorDetails.Length__c=  string.valueof(detail.length);
if(detail.breadth!=null)
FloorDetails.Breadth__c=  string.valueof(detail.breadth); 
FloorDetails.Property_Details__c=pd.id;
listFloorDetailsToInsert.add(FloorDetails);
}
}
}
if(respWrap.result.taxCalculations!=null){
for(KYCWrapper.cls_taxCalculations detail:respWrap.result.taxCalculations){
Tax_Calculations__c tc=new Tax_Calculations__c();
tc.KYC__c=kyc.id;
if(detail.taxType!=null) 
tc.Tax_Type__c=string.valueof(detail.taxType);
if(detail.totalTax!=null) 
tc.Total_Tax__c=decimal.valueof(detail.totalTax); 
if(detail.totalTaxDue!=null) 
tc.Total_Tax_Due__c=decimal.valueof(detail.totalTaxDue); 
if(detail.totalamountPaidRs!=null) 
tc.Total_Amount_Paid_Rs__c=decimal.valueof(detail.totalamountPaidRs);
if(detail.paymentStatus!=null) 
tc.Payment_Status__c=string.valueof(detail.paymentStatus);
listtaxcalculationToInsert.add(tc);
}
}
if(respWrap.result.penalty!=null){
Penalty__c Penalty=new Penalty__c();
Penalty.KYC__c=kyc.id;
//if(respWrap.result.penalty.debitAmount!=null)
//Penalty.Debit_Amount__c=decimal.valueof(respWrap.result.penalty.debitAmount);
//   if(respWrap.result.penalty.creditAmount!=null)
//   Penalty.Credit_Amount__c=decimal.valueof(respWrap.result.penalty.creditAmount);    
//  if(respWrap.result.penalty.balanceTaxAmount!=null)
//    Penalty.Balance_Tax_Amount__c=decimal.valueof(respWrap.result.penalty.balanceTaxAmount); 
insert   Penalty;
}  
if(respWrap.result.ownerDetails!=null){
for(KYCWrapper.cls_ownerDetails detail:respWrap.result.ownerDetails){
Owner_Details__c OwnerDetail=new Owner_Details__c();
OwnerDetail.KYC__c=kyc.id;
if(detail.mobileNo!=null)
OwnerDetail.Mobile_No__c=detail.mobileNo;
if(detail.ownerName!=null)
OwnerDetail.name=detail.ownerName;
// if(detail.gender!=null)
//  OwnerDetail.Gender__c=detail.gender;
if(detail.email!=null && string.isNotBlank(detail.email))
OwnerDetail.Email__c=detail.email;
//if(detail.age!=null )
//  OwnerDetail.Age__c=decimal.valueof(detail.age);
if(detail.panNo!=null )
OwnerDetail.Pan_No__c=string.valueof(detail.panNo);
if(detail.bankAccountNo!=null  )
OwnerDetail.Bank_Account_No__c=string.valueof(detail.bankAccountNo);
listownerDetailsToInsert.add(OwnerDetail);

}

}
if(respWrap.result.paymentDetails!=null){
for(KYCWrapper.cls_paymentDetails detail:respWrap.result.paymentDetails){
Payment_Details__c payment=new Payment_Details__c();
payment.KYC__c=kyc.id;
if(detail.receiptNo!=null)
payment.Receipt_No__c=string.valueof(detail.receiptNo);
// if(detail.dateOfPayment!=null)
// payment.Date_Of_Payment__c=date.valueof(detail.dateOfPayment);
if(detail.amountPaidRs!=null)
payment.Amount_Paid_Rs__c=string.valueof(detail.amountPaidRs);
if(detail.paymentMode!=null)
payment.Payment_Mode__c=string.valueof(detail.paymentMode);
if(detail.valid!=null)
payment.Valid__c=string.valueof(detail.valid);
if(detail.serialNo!=null)
payment.Serial_No__c=string.valueof(detail.serialNo);
listPaymentDetailsToInsert.add(payment);
}
}

if(listtaxcalculationToInsert.size()>0)
insert listtaxcalculationToInsert;
if(listownerDetailsToInsert.size()>0)
insert listownerDetailsToInsert;
if(listFloorDetailsToInsert.size()>0)
insert listFloorDetailsToInsert;
if(listPaymentDetailsToInsert.size()>0)
insert listPaymentDetailsToInsert; 

API_Logger__c al=new API_Logger__c();
al.Name='KYCAPI';
al.API_Name__c='KYCAPI'; 
al.Request__c= request.getBody(); 
al.Status__c='success';
al.Response__c=response.getBody().length() > 130068 ? response.getBody().substring(0, 130068) : response.getBody();
al.EndPoint__c=request.getEndpoint();
// al.ID__c=  wrp.kycNo;
insert al; 
return 'KYC done successfully';
}
return 'error while doing the KYC';
}
else{
return 'error while doing the KYC';
}
}
return 'error while doing the KYC';
} 

@AuraEnabled
Public static string getKYCReportManualVehicleRC(string recordId,string engineNo,string chassisNo,string state  ){
system.debug('rc method called');
APICredentials__mdt kycOCR = APICredentials__mdt.getInstance('KYCOCR');
string  kycRequest='{ "consent": "Y", "engineNo": "'+engineNo+'", "chassisNo": "'+chassisNo+'", "state": "'+state+'" }  ';
Http http = new Http();
HttpRequest request = new HttpRequest();
request.setEndpoint(kycOCR.End_Point_All__c+'vehiclerc');
request.setMethod(kycOCR.Method__c); 
request.setBody(kycRequest);
request.setHeader('Authorization', kycOCR.Authorization__c);
request.setHeader('CORRELATION-ID',kycOCR.CORRELATION_ID__c);
request.setHeader('CLIENT-ID',kycOCR.CLIENT_ID__c);
request.setHeader('CLIENT-SECRET',kycOCR.CLIENT_SECRET__c);
request.setHeader('Content-Type', kycOCR.Content_Type__c);
request.setTimeout(120000);
HttpResponse response = http.send(request); 
system.debug('response'+response.getbody());
if( response.getStatusCode()==200){
KYCWrapper respWrap=KYCWrapper.parse(response.getBody());
if(respWrap.statusCode!=null && respWrap.statusCode==101){

if(respWrap.result!=null){
KYC__c kyc=new KYC__c();
if(string.isNotBlank(respWrap.result.rcManuMonthYr))  
kyc.RC_ManuMonthYear__c=respWrap.result.rcManuMonthYr;
if(respWrap.result.rcMakerModel!=null)   
kyc.RC_Maker_Model__c=respWrap.result.rcMakerModel;
if(string.isNotBlank(respWrap.result.rcEngNo))    
kyc.RC_Eng_No__c=respWrap.result.rcEngNo;
if(string.isNotBlank(respWrap.result.rcOwnerName))    
kyc.RC_Owner_Name__c=respWrap.result.rcOwnerName;
if(string.isNotBlank(respWrap.result.rcVhClassDesc))    
kyc.RC_Vh_Class_Desc__c=respWrap.result.rcVhClassDesc; 
if(string.isNotBlank(respWrap.result.rcPresentAddress))    
kyc.RC_Present_Address__c=respWrap.result.rcPresentAddress;
if(string.isNotBlank(respWrap.result.rcColor))    
kyc.RC_Color__c=respWrap.result.rcColor;
if(string.isNotBlank(respWrap.result.rcRegnNo))    
kyc.RC_Eng_No__c=respWrap.result.rcRegnNo;
if(string.isNotBlank(respWrap.result.taxPaidUpto))    
kyc.Tax_Paid_Upto__c=respWrap.result.taxPaidUpto; 
if(string.isNotBlank(respWrap.result.rcMakerDesc))    
kyc.RC_Maker_Desc__c=respWrap.result.rcMakerDesc; 
if(string.isNotBlank(respWrap.result.rcChasiNo))    
kyc.RC_ChasiNo__c=respWrap.result.rcChasiNo; 
if(string.isNotBlank(respWrap.result.rcMobileNo))    
kyc.Mobile_Number__c=respWrap.result.rcMobileNo;
if(string.isNotBlank(respWrap.result.rcRegisteredAt))    
kyc.RC_Registered_At__c=respWrap.result.rcRegisteredAt;
if(string.isNotBlank(respWrap.result.rcRegnDt)) {  
String str = respWrap.result.rcRegnDt;
string day=str.SubStringBefore('-');
string month=str.SubStringafter('-');
string year=month.SubStringafter('-');
month=month.SubStringBefore('-');
string strdate=year+'-'+month+'-'+day;
kyc.RC_Regn_Date__c=date.valueof(strdate);
}
if(string.isNotBlank(respWrap.result.rcFinancer))    
kyc.RC_Financer__c=respWrap.result.rcFinancer;
if(string.isNotBlank(respWrap.result.rcPermanentAddress))    
kyc.RC_Permanent_Address__c=respWrap.result.rcPermanentAddress; 
if(string.isNotBlank(respWrap.result.rcPermanentAddress))    
kyc.RC_Permanent_Address__c=respWrap.result.rcPermanentAddress; 
if(string.isNotBlank(respWrap.result.rcValidUpto)) { 
String str = respWrap.result.rcValidUpto;
string day=str.SubStringBefore('-');
string month=str.SubStringafter('-');
string year=month.SubStringafter('-');
month=month.SubStringBefore('-');
string strdate=year+'-'+month+'-'+day;
kyc.RC_Valid_Upto__c=date.valueof(strdate);
}
insert kyc;    
API_Logger__c al=new API_Logger__c();
al.Name='KYCAPI';
al.API_Name__c='KYCAPI'; 
//al.Request__c= request.getBody(); 
al.Status__c='success';
al.Response__c= response.getBody();
al.EndPoint__c=request.getEndpoint();
// al.ID__c=  wrp.kycNo;
insert al; 
return 'KYC done successfully';
}

}
else{
return 'error while doing the KYC';
}

}
return 'error while doing the KYC';
} 

@AuraEnabled
Public static string getKYCReportManualVehiclercAdv(string recordId,string registrationNumber  ){
system.debug('registrationNumber'+registrationNumber);
APICredentials__mdt kycOCR = APICredentials__mdt.getInstance('KYCOCR');
string  kycRequest='{ "registrationNumber": "'+registrationNumber+'", "consent": "Y", "version": 3.1 } ';
Http http = new Http();
HttpRequest request = new HttpRequest();
request.setEndpoint(kycOCR.End_Point_All__c+'vehiclercadv');
request.setMethod(kycOCR.Method__c); 
request.setBody(kycRequest);
request.setHeader('Authorization', kycOCR.Authorization__c);
request.setHeader('CORRELATION-ID',kycOCR.CORRELATION_ID__c);
request.setHeader('CLIENT-ID',kycOCR.CLIENT_ID__c);
request.setHeader('CLIENT-SECRET',kycOCR.CLIENT_SECRET__c);
request.setHeader('Content-Type', kycOCR.Content_Type__c);
request.setTimeout(120000);
HttpResponse response = http.send(request); 
system.debug('testt'+response.getBody());
if( response.getStatusCode()==200){
KYCWrapper respWrap=KYCWrapper.parse(response.getBody());
if(respWrap.statusCode!=null && respWrap.statusCode==101){
if(respWrap.result!=null){
KYC__c kyc=new KYC__c();
// if(respWrap.result.blackListStatus!=null)  
// kyc.Black_List_Status__c=respWrap.result.blackListStatus; 
if(string.isNotBlank(respWrap.result.bodyTypeDescription))  
kyc.Body_Type_Description__c=respWrap.result.bodyTypeDescription; 
if(string.isNotBlank(respWrap.result.fatherName))  
kyc.father_husband__c=respWrap.result.fatherName;
// if(string.isNotBlank(respWrap.result.financier))  
//  kyc.RC_Financer__c=respWrap.result.financier;
if(string.isNotBlank(respWrap.result.fitnessUpto))  {
String str = respWrap.result.fitnessUpto;
string day=str.SubStringBefore('-');
string month=str.SubStringafter('-');
string year=month.SubStringafter('-');
month=month.SubStringBefore('-');
string strdate=year+'-'+month+'-'+day;
kyc.Fitness_Upto__c=date.valueof(strdate);
}
if(string.isNotBlank(respWrap.result.fuelDescription))  
kyc.Fuel_Description__c=respWrap.result.fuelDescription;
if(string.isNotBlank(respWrap.result.grossVehicleWeight))  
kyc.Gross_Vehicle_Weight__c=decimal.valueof(respWrap.result.grossVehicleWeight);
if(string.isNotBlank(respWrap.result.insuranceCompany))  
kyc.Insurance_Company__c=respWrap.result.insuranceCompany;
if(string.isNotBlank(respWrap.result.insurancePolicyNumber))  
kyc.Insurance_Policy_Number__c=respWrap.result.insurancePolicyNumber;
if(string.isNotBlank(respWrap.result.insuranceUpto))  
kyc.Insurance_Upto__c=respWrap.result.insuranceUpto;
if(string.isNotBlank(respWrap.result.makerDescription))  
kyc.RC_Maker_Desc__c=respWrap.result.makerDescription;
if(string.isNotBlank(respWrap.result.makerModel))  
kyc.RC_Maker_Model__c=respWrap.result.makerModel;
if(string.isNotBlank(respWrap.result.nationalPermitIssuedBy)){ 
String str = respWrap.result.nationalPermitIssuedBy;
string day=str.SubStringBefore('-');
string month=str.SubStringafter('-');
string year=month.SubStringafter('-');
month=month.SubStringBefore('-');
string strdate=day+'-'+month+'-'+year;
kyc.National_Permit_Issued_By__c=date.valueof(strdate);
}
if(string.isNotBlank(respWrap.result.nationalPermitNumber))  
kyc.National_Permit_Number__c=respWrap.result.nationalPermitNumber;
if(string.isNotBlank(respWrap.result.ownerName))  
kyc.RC_Owner_Name__c=respWrap.result.ownerName;
if(string.isNotBlank(respWrap.result.ownerSerialNumber))  
kyc.Owner_Serial_Number__c=respWrap.result.ownerSerialNumber;
if(string.isNotBlank(respWrap.result.makerDescription))  
kyc.RC_Maker_Desc__c=respWrap.result.makerDescription;
if(string.isNotBlank(respWrap.result.manufacturedMonthYear))  
kyc.RC_ManuMonthYear__c=respWrap.result.manufacturedMonthYear;
if(string.isNotBlank(respWrap.result.engineNumber))    
kyc.RC_Eng_No__c=respWrap.result.engineNumber;
if(string.isNotBlank(respWrap.result.cubicCapacity))    
kyc.Cubic_Capacity__c=decimal.valueof(respWrap.result.cubicCapacity); 
if(string.isNotBlank(respWrap.result.presentAddress))    
kyc.RC_Present_Address__c=respWrap.result.presentAddress;
if(string.isNotBlank(respWrap.result.permanentAddress))    
kyc.RC_Permanent_Address__c=respWrap.result.permanentAddress;                    
if(string.isNotBlank(respWrap.result.color))    
kyc.RC_Color__c=respWrap.result.color;
if(string.isNotBlank(respWrap.result.pucExpiryDate)) { 
String str = respWrap.result.pucExpiryDate;
string day=str.SubStringBefore('-');
string month=str.SubStringafter('-');
string year=month.SubStringafter('-');
month=month.SubStringBefore('-');
string strdate=year+'-'+month+'-'+day;
kyc.PUC_Expiry_Date__c=date.valueof(strdate);
}
if(string.isNotBlank(respWrap.result.registeredAt))    
kyc.RC_Registered_At__c=respWrap.result.registeredAt;                    
if(string.isNotBlank(respWrap.result.taxPaidUpto)) {   
kyc.Tax_Paid_Upto__c=respWrap.result.taxPaidUpto;  
}
if(string.isNotBlank(respWrap.result.chassisNumber))    
kyc.RC_ChasiNo__c=respWrap.result.chassisNumber; 
if(string.isNotBlank(respWrap.result.registrationDate)){    
String str = respWrap.result.registrationDate;
string day=str.SubStringBefore('-');
string month=str.SubStringafter('-');
string year=month.SubStringafter('-');
month=month.SubStringBefore('-');
string strdate=year+'-'+month+'-'+day;
kyc.Registration_Date__c=date.valueof(strdate);
}
if(string.isNotBlank(respWrap.result.registrationNumber))    
kyc.Registration_Number__c=respWrap.result.registrationNumber;
if(string.isNotBlank(respWrap.result.seatingCapacity))    
kyc.Seating_Capacity__c=decimal.valueof(respWrap.result.seatingCapacity);

if(string.isNotBlank(respWrap.result.unladenWeight))    
kyc.Unladen_Weight__c=decimal.valueof(respWrap.result.unladenWeight); 
if(string.isNotBlank(respWrap.result.vehicleCatgory))    
kyc.Vehicle_Catgory__c=respWrap.result.vehicleCatgory; 
if(string.isNotBlank(respWrap.result.vehicleClassDescription))    
kyc.Vehicle_Class_Description__c=respWrap.result.vehicleClassDescription;
insert kyc;    
API_Logger__c al=new API_Logger__c();
al.Name='KYCAPI';
al.API_Name__c='KYCAPI'; 
//al.Request__c= request.getBody(); 
al.Status__c='success';
al.Response__c= response.getBody();
al.EndPoint__c=request.getEndpoint();
// al.ID__c=  wrp.kycNo;
insert al; 
return 'KYC done successfully';
}
return 'we have recieved blank response';
}
else{
system.debug('error');
return 'error while doing the KYC';
}
}
system.debug('error');
return 'error while doing the KYC';
} 
*/    
    /*public class Wrapper{
@auraEnabled public String errorMSG;
@auraEnabled public String successMSG;
}*/
    
}