/**
* @File Name          : Pre_Login__c
* @Description        : This Class is used To call KYCOCR api create API Logger Records,
Fetch records from Data Table (Metadata)
Create/Delete/Update/Fetch Prelogin related records like Login,Account,Poperty,Application,Loan Applicant,Receipt 
and Send Receipt record for Approval.
* @Author             : Vinay Mishra
* @Created On         : 04/04/2022
*==============================================================================
* Ver         Date                     Author                 Modification
*==============================================================================
* 1.0         04/04/2022              Vinay Mishra             Initial Version
* 53.0        04/05/2022              Parag Goyal               
*/
public class FS_PreLoginController extends GenericDataTableController { 
    //getting application records
    @AuraEnabled
    public static ApplicationWrapper getApplicationId(String recordId){
        System.debug('prelogin Id '+recordId);
        if(String.isNotBlank(recordId) && String.isNotEmpty(recordId)){
            String appId = '';
            Application__c objApp = [SELECT Id,Name FROM Application__c WHERE Pre_Login__c  = : recordId AND Pre_Login__c  != null];
                appId = objApp.Id;
                ApplicationWrapper appWrap = new ApplicationWrapper();
                appWrap.appId = objApp.Id;
                appWrap.appName = objApp.Name;
                System.debug('Application Wrapper '+appWrap);
                return appWrap;  
        }
        else
            return null;
    }
    
    /*@AuraEnabled
    public static Application__c getApplicationRecord(String applicationId){
        System.debug('Application ID '+applicationId);
        Application__c objApp = [SELECT Id, Name, Geo_tagging_pin_for_the_user__c, Staff_Loan__c, Field_Officer_Employee_ID__c, Customer_Visit_date__c,
                                 Requested_Loan_Amount__c, Channel__c, Alternate_Channel_Mode__c, Employee_ID__c 
                                 FROM Application__c
                                 WHERE Id =: applicationId];
        System.debug(objApp);
        if(objApp != null)
            return objApp;
        else
            return null;
    }
    //Getting Property Records In Data Table
    @AuraEnabled
    public static GenericDataTableController.DataTableResponse getData(String applicationId){
        System.debug('applicationId=  '+applicationId); 
        Set<String> propIds = new Set<String>();
        for(Property__c prop : [SELECT Id FROM Property__c 
                                WHERE Application__c  =: applicationId AND Application__c != null]){
                                    propIds.add(prop.Id);
                                }
        
        System.debug('propIds=  '+propIds);
        GenericDataTableController genericDTObj = new GenericDataTableController();
        genericDTObj.METADATA_NAME = 'Pre_Login_Property';
        genericDTObj.IDS_SET = propIds;
        genericDTObj.WHERE_CLAUSE = ' ID IN : IDS_SET';
        return genericDTObj.getTable();     
    }
    
    @AuraEnabled
    public static GenericDataTableController.DataTableResponse getReceiptData(String applicationId){
        System.debug('applicationId=  '+applicationId);
        Set<String> recIds = new Set<String>();
        for(Receipt__c rec : [SELECT Id FROM Receipt__c WHERE Application__c  =: applicationId]){
            recIds.add(rec.Id);
        }
        
        System.debug('propIds=  '+recIds);
        GenericDataTableController genericDTObj = new GenericDataTableController();
        genericDTObj.METADATA_NAME = 'Receipt_Metadata';
        genericDTObj.IDS_SET = recIds;
        genericDTObj.WHERE_CLAUSE = ' ID IN : IDS_SET';
        return genericDTObj.getTable();  
    }
    
    //Getting Account Records In Data Table
    @AuraEnabled
    public static GenericDataTableController.DataTableResponse getAccData(String applicationId){
        System.debug('applicationId=  '+applicationId);
        Set<String> accIds = new Set<String>();
        for(Loan_Applicant__c acc : [SELECT Id FROM Loan_Applicant__c WHERE Application__c  =: applicationId AND Application__c  != null]){
            accIds.add(acc.Id); 
        }
        
        System.debug('accIds=  '+accIds);
        GenericDataTableController genericDTObj = new GenericDataTableController();
        genericDTObj.METADATA_NAME = 'Loan_Applicant'; 
        genericDTObj.IDS_SET = accIds;
        genericDTObj.WHERE_CLAUSE = ' ID IN : IDS_SET';
        return genericDTObj.getTable();     
    }
    
   // for getting the data with pending Verification
    @AuraEnabled
     public static GenericDataTableController.DataTableResponse getPendingAccounts(String applicationId){
        System.debug('applicationId=  '+applicationId);
        Set<String> accIds = new Set<String>();
        for(Loan_Applicant__c acc : [SELECT Id
                                     FROM Loan_Applicant__c 
                                     WHERE Application__c  =: applicationId 
                                           AND Customer_Information__r.Mobile_Verified__c=false
                                           AND Application__c  != null]){
            accIds.add(acc.Id); 
        }
        
        System.debug('accIds=  '+accIds);
        GenericDataTableController genericDTObj = new GenericDataTableController();
        genericDTObj.METADATA_NAME = 'Loan_Applicant'; 
        genericDTObj.IDS_SET = accIds;
        genericDTObj.WHERE_CLAUSE = ' ID IN : IDS_SET';
        return genericDTObj.getTable();     
    }
*/

    /*
    @auraEnabled
    Public static Wrapper SubmitForOCR(String kycType,String base64,string Documentside,string apiLogger,string ocrid){
        boolean test=true;
        System.debug(kycType);
        System.debug(base64);
        try{
            string base64str=base64;
            APICredentials__mdt kycOCR = APICredentials__mdt.getInstance('KYCOCR');
            string ocrRequest='{';
            ocrRequest+='"fileB64" : "'+base64str+'",'; 
            ocrRequest+='"maskAadhaar" : false,';
            ocrRequest+='"hideAadhaar" : false,';
            ocrRequest+='"conf" : true,';
            if(kycType=='Driving_License')
                ocrRequest+='"docType" : "dl",';
            else
                ocrRequest+='"docType" : "",';
            ocrRequest+='"checkBlur": false,';
            ocrRequest+='"checkBlackAndWhite": false,';
            ocrRequest+='"checkCutCard": false,';
            ocrRequest+='"checkBrightness": false';
            ocrRequest+='}';          
            //Wrapper wrpObj =new Wrapper();  
            string mockResponse='';
            if(kycType=='Aadhar_Card' && Documentside=='front')
                mockResponse='{ "requestId": "1e490118-4101-438e-a0a1-eef241eeda40", "result": [ { "details": { "aadhaar": { "value": "307934702923", "conf": 1.0, "isMasked": "no" }, "dob": { "value": "16/05/1986", "conf": 1.0 }, "father": { "value": "", "conf": 0 }, "gender": { "value": "MALE", "conf": 1.0 }, "mother": { "value": "", "conf": 0 }, "name": { "value": "Vinay Kumar Mishra", "conf": 1.0 }, "yob": { "value": "", "conf": 0 }, "imageUrl": { "value": "" }, "qr": { "value": "" } }, "type": "Aadhaar Front Bottom" } ], "statusCode": 101, "description": "Successful OCR" }';
            if(kycType=='Aadhar_Card' && Documentside=='back')
                mockResponse='{ "requestId": "9709dbd7-7d1e-4ce7-9a26-0812c4530181", "result": [ { "details": { "aadhaar": { "value": "307934702923", "conf": 1.0, "isMasked": "no" }, "address": { "value": "railway staion road, bhagwatiganj, Balrampur, Balrampur, Uttar Pradesh, 110002", "conf": 1.0 }, "pin": { "value": "110002", "conf": 1.0 }, "imageUrl": { "value": "" }, "qr": { "value": "" }, "father": { "value": "", "conf": 0 }, "husband": { "value": "", "conf": 0 }, "addressSplit": { "careOf": "", "houseNumber": "", "city": "Balrampur", "line1": "", "line2": "railway staion road bhagwatiganj", "street": "railway staion road", "locality": "bhagwatiganj", "landmark": "", "district": "Balrampur", "state": "Uttar Pradesh", "pin": "110002" } }, "type": "Aadhaar Back" } ], "statusCode": 101, "description": "Successful OCR" }';
            
            // if(kycType=='Pan Card')
            //     mockResponse='{ "requestId": "37578b97-7976-413b-96ae-786da69d0519", "result": [ { "details": { "date": { "value": "16/05/1986", "conf": 1.0 }, "dateOfIssue": { "value": "", "conf": 0 }, "father": { "value": "KRISHNA DAYAL MISHRA", "conf": 0.71 }, "name": { "value": "VINAY KUMAR", "conf": 1.0 }, "panNo": { "value": "DCKPK8902E", "conf": 1.0 } }, "type": "Pan" } ], "statusCode": 101, "description": "Successful OCR" }';
            if(kycType=='Voter_Id' && Documentside=='front') 
                mockResponse='{ "requestId": "0ae7713d-2c4f-46f5-ae29-fdbd7b4449a1", "result": [ { "details": { "voterid": { "value": "MZH2380426", "conf": 0.98 }, "address": { "value": "HNO. 153SECTOR NO.12 PANCHKULA TEHPANCHKULA, DISTT.PANCHKULA", "conf": 0.51 }, "pin": { "value": "", "conf": 0.51 }, "gender": { "value": "", "conf": 0 }, "date": { "value": "", "conf": 0 }, "age": { "value": "", "conf": 0 }, "dob": { "value": "", "conf": 0 }, "type": { "value": "", "conf": 0 }, "addressSplit": { "houseNumber": "HNO. 153SECTOR NO.12", "city": "PANCHKULA", "line1": "HNO. 153SECTOR NO.12 TEHPANCHKULA DISTT.PANCHKULA", "line2": "", "street": "", "locality": "", "landmark": "", "district": "Panchkula", "state": "", "pin": "134112" } }, "type": "Voterid Back" }, { "details": { "voterid": { "value": "MZH2380426", "conf": 1.0 }, "name": { "value": "SONIA GANDHI", "conf": 1.0 }, "gender": { "value": "FEMALE", "conf": 0.73 }, "relation": { "value": "BRIJ BHUSHAN", "conf": 0.99 }, "dob": { "value": "", "conf": 0.0 }, "doc": { "value": "", "conf": 0.0 }, "age": { "value": "", "conf": 0.0 } }, "type": "Voterid Front" } ], "statusCode": 101, "description": "Successful OCR" }';   
            if(kycType=='Voter_Id' && Documentside=='back') 
                mockResponse='{ "requestId": "0ae7713d-2c4f-46f5-ae29-fdbd7b4449a1", "result": [ { "details": { "voterid": { "value": "MZH2380426", "conf": 0.98 }, "address": { "value": "HNO. 153SECTOR NO.12 PANCHKULA TEHPANCHKULA, DISTT.PANCHKULA", "conf": 0.51 }, "pin": { "value": "", "conf": 0.51 }, "gender": { "value": "", "conf": 0 }, "date": { "value": "", "conf": 0 }, "age": { "value": "", "conf": 0 }, "dob": { "value": "", "conf": 0 }, "type": { "value": "", "conf": 0 }, "addressSplit": { "houseNumber": "HNO. 153SECTOR NO.12", "city": "PANCHKULA", "line1": "HNO. 153SECTOR NO.12 TEHPANCHKULA DISTT.PANCHKULA", "line2": "", "street": "", "locality": "", "landmark": "", "district": "Panchkula", "state": "", "pin": "134112" } }, "type": "Voterid Back" }, { "details": { "voterid": { "value": "MZH2380426", "conf": 1.0 }, "name": { "value": "SONIA GANDHI", "conf": 1.0 }, "gender": { "value": "FEMALE", "conf": 0.73 }, "relation": { "value": "BRIJ BHUSHAN", "conf": 0.99 }, "dob": { "value": "", "conf": 0.0 }, "doc": { "value": "", "conf": 0.0 }, "age": { "value": "", "conf": 0.0 } }, "type": "Voterid Front" } ], "statusCode": 101, "description": "Successful OCR" }';   
            
            Wrapper wrp=new Wrapper();
            system.debug(wrp);
            if(kycType == 'Aadhar_Card')
                wrp.kycType = 'Aadhaar Card';
            else if(kycType == 'Voter_Id')
                wrp.kycType = 'Voter ID';
            else if(kycType == 'Pan_Card')
                wrp.kycType = 'PAN';
            else if(kycType == 'Passport')
                wrp.kycType = 'Passport';
            else if(kycType == 'Driving License')
                wrp.kycType = 'Driving License';
            HttpRequest request = new HttpRequest();
            Http http = new Http();
            request.setBody(ocrRequest);
            request.setEndpoint(kycOCR.Endpoint__c);//
            request.setMethod(kycOCR.Method__c); 
            request.setHeader('Authorization', kycOCR.Authorization__c);
            request.setHeader('CORRELATION-ID',kycOCR.CORRELATION_ID__c);
            request.setHeader('CLIENT-ID',kycOCR.CLIENT_ID__c);
            request.setHeader('CLIENT-SECRET',kycOCR.CLIENT_SECRET__c);
            request.setHeader('Content-Type', kycOCR.Content_Type__c);
            request.setTimeout(120000);
           HttpResponse response = new HttpResponse();
           //HttpResponse response = http.send(request); 
            response.setStatusCode(200);
            response.setBody(mockResponse);
            //system.debug('resp'+response.getbody());
            string Status='';
            if(response.getStatusCode()==200 || test==True){
                System.debug('I am In');
                //FS_KYCOCRWrapper respWrap=FS_KYCOCRWrapper.parse(response.getBody());
                System.debug('DocumentSide '+Documentside);
                System.debug('mockResponse '+mockResponse);
                FS_KYCOCRWrapper respWrap=FS_KYCOCRWrapper.parse(mockResponse);
                
                System.debug('respWrap '+respWrap);
                if(respWrap.statusCode!=null)
                    wrp.statusCode=string.valueof(respWrap.statusCode);
                if(respWrap.description!=null)
                    wrp.description=respWrap.description;
                for(FS_KYCOCRWrapper.cls_result detail:respWrap.result){
                    if(Documentside=='front' && kycType=='Aadhar_Card'){
                        if(detail.details.name!=null){
                            if(string.isNotBlank(detail.details.name.value)){
                                if(detail.details.name.value.contains(' ')){
                                    wrp.firstName= detail.details.name.value.Substring(0,detail.details.name.value.lastindexof(' '));
                                    wrp.lastname = detail.details.name.value.Substring(detail.details.name.value.lastindexof(' '),detail.details.name.value.length());
                                }
                                else{
                                    wrp.firstName= detail.details.name.value;
                                }
                            }
                        }
                        if(detail.details.father!=null){
                            if(string.isNotBlank(detail.details.father.value) )  
                                wrp.FathersName =detail.details.father.value;
                        }
                        if(detail.details.gender!=null) {
                            if(string.isNotBlank(detail.details.gender.value))           
                                wrp.Gender=detail.details.gender.value;
                        }
                        if(detail.details.dob!=null){
                            if(string.isNotBlank(detail.details.dob.value)){ 
                                String str = detail.details.dob.value;
                                //Parag Change
                                System.debug('Date '+str);
                                if(kycType == 'Voter_Id'){
                                    string day=str.SubStringBefore('-');
                                    string month=str.SubStringafter('-');
                                    string year=month.SubStringafter('-');
                                    month=month.SubStringBefore('-');
                                    string strdate=year+'-'+month+'-'+day;
                                    wrp.DOB=date.valueof(strdate);   
                                }
                                else{
                                    string day=str.SubStringBefore('/');
                                    string month=str.SubStringafter('/');
                                    string year=month.SubStringafter('/');
                                    month=month.SubStringBefore('/');
                                    string strdate=year+'-'+month+'-'+day;
                                    wrp.DOB=date.valueof(strdate);   
                                }
                            }
                        }
                        
                        if(detail.details.mother!=null){
                            if(string.isNotBlank(detail.details.mother.value) )     
                                wrp.MothersName=detail.details.mother.value;
                        }
                        if(detail.details.aadhaar!=null){
                            if(string.isNotBlank(detail.details.aadhaar.value) )     
                                wrp.kycNo=detail.details.aadhaar.value;
                        }
                        
                    }
                    else if(Documentside=='back' && kycType=='Aadhar_Card'){
                        if(detail.details.addressSplit!=null){
                            if(string.isNotBlank(detail.details.addressSplit.city))
                                wrp.City=detail.details.addressSplit.city;
                            if(string.isNotBlank(detail.details.addressSplit.district))
                                wrp.district=detail.details.addressSplit.district;
                        }
                        if(detail.details.pin!=null){
                            if(string.isNotBlank(detail.details.pin.value) )
                                wrp.Pincode=detail.details.pin.value;
                        }
                        if(detail.details.husband!=null)  {
                            if(string.isNotBlank(detail.details.husband.value) )        
                                wrp.SpouceName=detail.details.husband.value;
                        }
                        else if(detail.details.wife!=null)  {
                            if(string.isNotBlank(detail.details.wife.value) )        
                                wrp.SpouceName=detail.details.wife.value;
                        }
                        else
                            wrp.SpouceName=''; 
                        
                        if(detail.details.address!=null) {
                            if(string.isNotBlank(detail.details.address.value))  
                                wrp.Address=detail.details.address.value;
                        }
                    }
                    else if(kycType=='Pan_Card'){
                        if(detail.details.panNo!=null){
                            if(string.isNotBlank(detail.details.panNo.value))
                                wrp.kycNo=detail.details.panNo.value;
                        }
                        
                        if(detail.details.name!=null){
                            if(string.isNotBlank(detail.details.name.value)){
                                if(detail.details.name.value.contains(' ')){
                                    wrp.firstName= detail.details.name.value.Substring(0,detail.details.name.value.lastindexof(' '));
                                    wrp.lastname = detail.details.name.value.Substring(detail.details.name.value.lastindexof(' '),detail.details.name.value.length());
                                }
                                else{
                                    wrp.firstName= detail.details.name.value;
                                }
                            }
                        }
                        if(detail.details.father!=null){
                            if(string.isNotBlank(detail.details.father.value) )  
                                wrp.FathersName =detail.details.father.value;
                        }
                        
                        if(detail.details.dob!=null){
                            if(string.isNotBlank(detail.details.dob.value)){ 
                                String str = detail.details.dob.value;
                                string day=str.SubStringBefore('/');
                                string month=str.SubStringafter('/');
                                string year=month.SubStringafter('/');
                                month=month.SubStringBefore('/');
                                string strdate=year+'-'+month+'-'+day;
                                wrp.DOB=date.valueof(strdate);   
                                
                            }
                        }
                        
                    }
                    else if( Documentside=='front' && kycType=='Voter_Id'){
                        if(detail.details.voterid!=null){
                            if(string.isNotBlank(detail.details.voterid.value) )     
                                wrp.kycNo=detail.details.voterid.value;
                        }
                        if(detail.details.name!=null){
                            if(string.isNotBlank(detail.details.name.value)){
                                if(detail.details.name.value.contains(' ')){
                                    wrp.firstName= detail.details.name.value.Substring(0,detail.details.name.value.lastindexof(' '));
                                    wrp.lastname = detail.details.name.value.Substring(detail.details.name.value.lastindexof(' '),detail.details.name.value.length());
                                }
                                else{
                                    wrp.firstName= detail.details.name.value;
                                }
                            }
                        }
                        if(detail.details.gender!=null) {
                            if(string.isNotBlank(detail.details.gender.value))           
                                wrp.Gender=detail.details.gender.value;
                        }
                        
                        if(detail.details.dob!=null){
                            if(string.isNotBlank(detail.details.dob.value)){ 
                                String str = detail.details.dob.value;
                                //Parag Change
                                System.debug('Date '+str);
                                if(kycType == 'Voter_Id'){
                                    string day=str.SubStringBefore('-');
                                    string month=str.SubStringafter('-');
                                    string year=month.SubStringafter('-');
                                    month=month.SubStringBefore('-');
                                    string strdate=year+'-'+month+'-'+day;
                                    wrp.DOB=date.valueof(strdate);   
                                }
                                else{
                                    string day=str.SubStringBefore('/');
                                    string month=str.SubStringafter('/');
                                    string year=month.SubStringafter('/');
                                    month=month.SubStringBefore('/');
                                    string strdate=year+'-'+month+'-'+day;
                                    wrp.DOB=date.valueof(strdate);   
                                }
                            }
                        }
                    }
                    else if( Documentside=='back' && kycType=='Voter_Id'){
                        if(detail.details.addressSplit!=null){
                            if(string.isNotBlank(detail.details.addressSplit.city))
                                wrp.City=detail.details.addressSplit.city;
                            if(string.isNotBlank(detail.details.addressSplit.district))
                                wrp.district=detail.details.addressSplit.district;
                        }
                        if(detail.details.pin!=null){
                            if(string.isNotBlank(detail.details.pin.value) )
                                wrp.Pincode=detail.details.pin.value;
                        }
                        if(detail.details.address!=null) {
                            if(string.isNotBlank(detail.details.address.value))  
                                wrp.Address=detail.details.address.value;
                        }
                        
                    }
                    else if(Documentside=='front' &&  kycType=='Passport'){
                        
                        system.debug('111');
                        if(detail.details.gender!=null) {
                            if(string.isNotBlank(detail.details.gender.value))           
                                wrp.Gender=detail.details.gender.value;
                        }
                        system.debug('1111');
                        if(detail.details.doe!=null){
                            if(string.isNotBlank(detail.details.doe.value)){ 
                                String str = detail.details.doe.value;
                                //Parag Change
                                System.debug('Date '+str);
                                string day=str.SubStringBefore('/');
                                string month=str.SubStringafter('/');
                                string year=month.SubStringafter('/');
                                month=month.SubStringBefore('/');
                                string strdate=year+'-'+month+'-'+day;
                                wrp.doe=date.valueof(strdate);   
                            }
                        }
                        system.debug('11111');
                        if(detail.details.doi!=null){
                            if(string.isNotBlank(detail.details.doi.value)){ 
                                String str = detail.details.doi.value;
                                //Parag Change
                                System.debug('Date '+str);
                                string day=str.SubStringBefore('/');
                                string month=str.SubStringafter('/');
                                string year=month.SubStringafter('/');
                                month=month.SubStringBefore('/');
                                string strdate=year+'-'+month+'-'+day;
                                wrp.doi=date.valueof(strdate);   
                            }
                        }
                        system.debug('111111');
                        if(detail.details.countryCode!=null){
                            if(string.isNotBlank(detail.details.countryCode.value) )
                                wrp.countryCode=detail.details.countryCode.value;
                        }
                        system.debug('1111111');
                        if(detail.details.givenName!=null){
                            if(string.isNotBlank(detail.details.givenName.value))
                                wrp.firstName=detail.details.givenName.value;
                        }
                        if(detail.details.surname!=null){
                            if(string.isNotBlank(detail.details.surname.value))
                                wrp.lastname=detail.details.surname.value;
                        }
                        system.debug('11111122');
                        if(detail.details.nationality!=null){
                            if(string.isNotBlank(detail.details.nationality.value) )
                                wrp.nationality=detail.details.nationality.value;
                        }
                        system.debug('111111222');
                        if(detail.details.passportNum!=null){
                            if(string.isNotBlank(detail.details.passportNum.value) )
                                wrp.passportNum=detail.details.passportNum.value;
                            wrp.kycNo=detail.details.passportNum.value;
                        }
                        system.debug('1111112223');
                        if(detail.details.placeOfBirth!=null) {
                            if(string.isNotBlank(detail.details.placeOfBirth.value))  
                                wrp.Address=detail.details.placeOfBirth.value;
                        }
                        if(detail.details.placeOfIssue!=null) {
                            if(string.isNotBlank(detail.details.placeOfIssue.value))  
                                wrp.placeOfIssue=detail.details.placeOfIssue.value;
                        }
                        system.debug('11111122255');
                        if(detail.details.type!=null) {
                            if(string.isNotBlank(detail.details.type.value))  
                                wrp.type=detail.details.type.value;
                        }
                        system.debug('11111122288');
                        if(detail.details.dob!=null){
                            if(string.isNotBlank(detail.details.dob.value)){ 
                                String str = detail.details.dob.value;
                                //Parag Change
                                System.debug('Date '+str);
                                if(kycType == 'Voter_Id'){
                                    string day=str.SubStringBefore('-');
                                    string month=str.SubStringafter('-');
                                    string year=month.SubStringafter('-');
                                    month=month.SubStringBefore('-');
                                    string strdate=year+'-'+month+'-'+day;
                                    wrp.DOB=date.valueof(strdate);   
                                }
                                else{
                                    string day=str.SubStringBefore('/');
                                    string month=str.SubStringafter('/');
                                    string year=month.SubStringafter('/');
                                    month=month.SubStringBefore('/');
                                    string strdate=year+'-'+month+'-'+day;
                                    wrp.DOB=date.valueof(strdate);   
                                }
                            }
                        }
                        
                    }
                    else if(Documentside=='back' &&  kycType=='Passport'){
                        if(detail.details.fileNum!=null) {
                            if(string.isNotBlank(detail.details.fileNum.value))           
                                wrp.fileNum=detail.details.fileNum.value;
                        }
                        if(detail.details.oldDoi!=null){
                            if(string.isNotBlank(detail.details.oldDoi.value)){ 
                                String str = detail.details.oldDoi.value;
                                //Parag Change
                                System.debug('Date '+str);
                                string day=str.SubStringBefore('/');
                                string month=str.SubStringafter('/');
                                string year=month.SubStringafter('/');
                                month=month.SubStringBefore('/');
                                string strdate=year+'-'+month+'-'+day;
                                wrp.oldDoi=date.valueof(strdate);   
                            }
                        }
                        if(detail.details.oldPassportNum!=null){
                            if(string.isNotBlank(detail.details.oldPassportNum.value) )
                                wrp.oldPassportNum=detail.details.oldPassportNum.value;
                        }
                        if(detail.details.oldPlaceOfIssue!=null){
                            if(string.isNotBlank(detail.details.oldPlaceOfIssue.value))
                                wrp.oldPlaceOfIssue=detail.details.oldPlaceOfIssue.value;
                        }
                        if(detail.details.father!=null){
                            if(string.isNotBlank(detail.details.father.value) )  
                                wrp.FathersName =detail.details.father.value;
                        }
                        if(detail.details.mother!=null){
                            if(string.isNotBlank(detail.details.mother.value) )     
                                wrp.MothersName=detail.details.mother.value;
                        }
                        if(detail.details.addressSplit!=null){
                            if(string.isNotBlank(detail.details.addressSplit.city))
                                wrp.City=detail.details.addressSplit.city;
                            if(string.isNotBlank(detail.details.addressSplit.district))
                                wrp.district=detail.details.addressSplit.district;
                            if(string.isNotBlank(detail.details.addressSplit.pin)){
                                wrp.Pincode=detail.details.addressSplit.pin;
                            }
                        }
                        if(detail.details.address!=null) {
                            if(string.isNotBlank(detail.details.address.value))  
                                wrp.Address=detail.details.address.value;
                        }
                        if(detail.details.husband!=null)  {
                            if(string.isNotBlank(detail.details.husband.value) )        
                                wrp.SpouceName=detail.details.husband.value;
                        }
                        else if(detail.details.wife!=null)  {
                            if(string.isNotBlank(detail.details.wife.value) )        
                                wrp.SpouceName=detail.details.wife.value;
                        }
                        else
                            wrp.SpouceName=''; 
                    }
                    else if( Documentside=='front' && kycType=='Driving_License'){
                        if(detail.details.dlNo!=null){
                            if(string.isNotBlank(detail.details.dlNo.value) )  
                                wrp.dlNo =detail.details.dlNo.value;
                            wrp.kycNo =detail.details.dlNo.value;
                        }
                    }
                    if(detail.details.phone!=null) {
                        if(string.isNotBlank(detail.details.phone.value))
                            wrp.MobileNo=detail.details.phone.value; 
                    }
                    //wrp.City=detail.details.address.value;
                } 
                if(Documentside == 'front'){
                    API_Logger__c al=new API_Logger__c();
                    al.Name='FS_PreLoginController';
                    al.API_Name__c='kycocr'; 
                    //al.Request__c= request.getBody(); 
                    if(wrp.statusCode=='101')  
                        al.Status__c='success';
                    else
                        al.Status__c='fail';   
                    al.Response__c= response.getBody();
                    al.EndPoint__c=request.getEndpoint();
                    al.ID__c=  wrp.kycNo;
                    insert al; 
                    wrp.apilogger=al.id;
                    if(wrp.statuscode!=null && wrp.statuscode=='101'){
                        KYC_OCR__c ocr=new KYC_OCR__c();
                        ocr.Name=kycType;
                        if(wrp.fileNum!=null)
                            ocr.Passport_FileNo__c=wrp.fileNum;
                        if(wrp.oldDoi!=null)
                            ocr.Old_Passport_DOI__c=wrp.oldDoi;
                        if(wrp.oldPlaceOfIssue!=null)
                            ocr.Old_Passport_Place_Of_Issue__c=wrp.oldPlaceOfIssue;
                        if(wrp.oldPassportNum!=null)
                            ocr.Old_Passport_No__c=wrp.oldPassportNum;
                        if(wrp.City!=null)
                            ocr.City__c=wrp.City;
                        if(wrp.Gender!=null)
                            ocr.Gender__c=wrp.Gender;
                        if(wrp.FathersName!=null)
                            ocr.Fathers_Name__c=wrp.FathersName;
                        if(wrp.DOB!=null)
                            ocr.DOB__c=wrp.DOB;
                        if(wrp.firstName!=null)
                            ocr.first_Name__c=wrp.firstName;
                        if(wrp.lastName!=null)
                            ocr.last_Name__c=wrp.lastname;
                        //ocr.Name='test';
                        ocr.API_Logger__c=al.id;
                        if(wrp.kycNo!=null)
                            ocr.ID__c=wrp.kycNo;
                        if(wrp.doi!=null)
                            ocr.DOI__c=wrp.doi;
                        if(wrp.description!=null)
                            ocr.Description__c=wrp.description;
                        if(wrp.MothersName!=null)
                            ocr.Mothers_Name__c=wrp.MothersName;
                        if(wrp.Pincode != null)
                            ocr.Pincode__c=integer.valueof(wrp.Pincode);
                        if(wrp.SpouceName!=null)
                            ocr.Spouce_Name__c=wrp.SpouceName;
                        insert ocr;
                        wrp.ocrid=ocr.id;
                    }
                }
                else{
                    API_Logger__c al=new API_Logger__c();
                    al.id=apiLogger;
                    al.Response_Back__c=response.getBody();
                    Update al;
                    wrp.apilogger=al.id;
                    if(wrp.statuscode!=null && wrp.statuscode=='101'){
                        KYC_OCR__c ocr=new KYC_OCR__c();
                        ocr.id=ocrid;
                        if(wrp.City!=null)
                            ocr.City__c=wrp.City;
                        if(wrp.fileNum!=null)
                            ocr.Passport_FileNo__c=wrp.fileNum;
                        if(wrp.Gender!=null)
                            ocr.Gender__c=wrp.Gender;
                        if(wrp.FathersName!=null)
                            ocr.Fathers_Name__c=wrp.FathersName;
                        if(wrp.DOB!=null)
                            ocr.DOB__c=wrp.DOB;
                        if(wrp.name!=null)
                            ocr.Name__c=wrp.name;
                        //ocr.Name='test';
                        if(wrp.doi!=null)
                            ocr.DOI__c=wrp.doi;
                        if(wrp.kycNo!=null)
                            ocr.ID__c=wrp.kycNo;
                        if(wrp.description!=null)
                            ocr.Description__c=wrp.description;
                        if(wrp.MothersName!=null)
                            ocr.Mothers_Name__c=wrp.MothersName;
                        if(wrp.Pincode != null)
                            ocr.Pincode__c=integer.valueof(wrp.Pincode);
                        if(wrp.SpouceName!=null)
                            ocr.Spouce_Name__c=wrp.SpouceName;
                        update ocr;
                        wrp.ocrid=ocr.id;
                    }
                }
                 if(Documentside=='front')
wrp.apifrontResponse=mockResponse;
if(Documentside=='back')
wrp.apibackResponse=mockResponse; 
                System.debug('Wrapper Result '+wrp);
                return wrp;
            }
            else {
                
                FS_KYCOCRWrapper respWrapp=FS_KYCOCRWrapper.parse(response.getBody());
                wrp.description=respWrapp.error.message;   
                API_Logger__c al=new API_Logger__c();
                al.Name='FS_PreLoginController';
                al.API_Name__c='kycocr'; 
                al.Status__c='fail';
                //al.Request__c= request.getBody();   
                al.Response__c= response.getBody();
                al.EndPoint__c=request.getEndpoint();
                insert al; 
                return wrp;
            } 
            
        }
        Catch(Exception e){
            system.debug('Main exception'+e.getLineNumber()+e.getMessage());
            Error_Logger__c el=new Error_Logger__c();
            el.Exception_Message__c=e.getMessage();
            el.Name='FS_PreLoginController';
            el.Line_Number__c=string.valueof(e.getLineNumber());
            insert el;
            Wrapper wrp=new Wrapper();
            wrp.description=e.getMessage();
            return wrp; 
        }
        
    } 
    */
    
    /*
    
    //Getting Record Type Id
    @AuraEnabled
    public static String getRecTypeId(){
        Id devRecordTypeId = Schema.SObjectType.Account.getRecordTypeInfosByName().get('Person Account').getRecordTypeId();
        return devRecordTypeId;
    }
    
    @AuraEnabled
    public static String getRecordTypeName(String recTypeId){
        return Schema.getGlobalDescribe().get('Pre_Login__c').getDescribe().getRecordTypeInfosById().get(recTypeId).getName();
    }
    //Customer Info Insertion
    @auraEnabled
    public static String insertAccount(String listOfApplicants,String preLogInId, List<String> kyclist,List<String> front64list,List<String> back64list,List<String> frontnmlist,List<String> backnmlist,List<String> kycIdValues,List<string> apiLoggerList,List<string> ocridList){
        System.debug('Hi i am called '+listOfApplicants);
        Set<String> apiLogIdSet = new Set<String>();
        for(String str : apiLoggerList){
            apiLogIdSet.add(str);   
        }
        
        Set<String> ocrIdSet = new Set<String>();
        for(String str : ocridList){
            ocrIdSet.add(str);   
        }
        System.debug('OCR ID SET '+ocrIdSet);
        //listOfApplicants = '{"staffLoan":false,"appType": "","incCon":"Yes","firstName":"Vinay Kumar","lastName":" Mishra","married":"No","SpouceName":"","mobile_1":"9634015817","City":"Balrampur","Pincode":"271201","verification":"OCR","Applicant_Type":"Primary Applicant","Address" : ""}';
        //listOfApplicants = '{"mobile_1":"9634015817","City":"Balrampur","district":"Balrampur","Pincode":"271201","Address":"","verification":"OCR","Applicant_Type":"Primary Applicant","kycId1":"","kycId2":""}';
        System.debug('apiLoggerList '+apiLoggerList); 
        System.debug('preLogInId '+preLogInId); 
        System.debug('KYC ID VALUES  '+kycIdValues);
        System.debug('kyclist'+kyclist);
        System.debug('front64list'+front64list);
        System.debug('back64list'+back64list);
        System.debug('frontnmlist'+frontnmlist);
        System.debug('backnmlist'+backnmlist);
        System.debug('kyclist size '+kycIdValues.size());
        System.debug('front64list size '+front64list.size());
        System.debug('back64list size '+back64list.size());
        System.debug('frontnmlist size '+frontnmlist.size());
        System.debug('backnmlist size '+backnmlist.size());
        
        Wrapper wrpObj =new Wrapper();
        wrpObj = (Wrapper)JSON.deserialize(listOfApplicants, Wrapper.class);
        System.debug('WRAPPER '+wrpObj); 
        Account objAcc = new Account();        
        Id devRecordTypeId = Schema.SObjectType.Account.getRecordTypeInfosByName().get('Person Account').getRecordTypeId();
        objAcc.RecordTypeId = devRecordTypeId; 
        objAcc.Pre_Login__c = preLogInId;
        //objAcc.Staff_Loan__c = wrpObj.staffLoan;
        objAcc.Income_Considered__c = wrpObj.incCon;
        if(String.isNotBlank(wrpObj.appType) && String.isNotEmpty(wrpObj.appType))
            objAcc.Applicant_Type__c = wrpObj.appType; 
        objAcc.Gender__c = wrpObj.Gender;
        objAcc.Salutation = wrpObj.Salutation;
        objAcc.FirstName = wrpObj.firstName;
        objAcc.LastName = wrpObj.lastName;
        objAcc.Father_s_Name__c = wrpObj.FathersName;
        objAcc.Mother_s_Name__c = wrpObj.MothersName;
        objAcc.Married__c = wrpObj.married;
        objAcc.Spouse_Name__c = wrpObj.SpouceName;
        objAcc.PersonBirthdate = wrpObj.DOB;
        objAcc.PersonMobilePhone = wrpObj.mobile_1;
        //objAcc.Customer_Type__c = wrpObj.Applicant_Type;
        objAcc.PersonMailingCity  = wrpObj.City;
        objAcc.PersonMailingPostalCode  = wrpObj.Pincode;
        objAcc.Verification_Type__c = wrpObj.verification;
        objAcc.KYC_Id_1__c = kycIdValues.get(0);
        if(kycIdValues.size() > 1)
            objAcc.KYC_Id_2__c = kycIdValues.get(1);
        objAcc.PersonMailingStreet = wrpObj.Address;
        if(String.isNotBlank(wrpObj.mobile_2) && String.isNotEmpty(wrpObj.mobile_2))
            objAcc.Phone = wrpObj.mobile_2;
        INSERT objAcc;
        
        if(objAcc != null){
            String appId = insertApplications(preLogInId,objAcc.id,wrpObj.Applicant_Type);
            insertLoanApplcants(objAcc.id,appId,wrpObj.Applicant_Type,wrpObj.constitution);
            System.debug('appId '+appId);
            if(ocrIdSet.size()>0){
                System.debug('Updating KYCOCR');
                list<KYC_OCR__c> kycocrListToUpdate=new list<KYC_OCR__c>();
                for(string ocrId:ocrIdSet){
                    KYC_OCR__c oc=new KYC_OCR__c();
                    oc.id=ocrId;
                    oc.Account__c=objAcc.Id;
                    kycocrListToUpdate.add(oc);
                }
                System.debug('KYC OCR SIZE '+kycocrListToUpdate.size());
                if(kycocrListToUpdate.size()>0)
                    update kycocrListToUpdate;
            }
            insertSelfDocuments(front64list,back64list,frontnmlist,backnmlist,objAcc.Id);
            if(apiLogIdSet.size()>0){
                list<API_Logger__c> apiloggerListToUpdate=new list<API_Logger__c>();
                for(string apiloggerId:apiLogIdSet){
                    API_Logger__c al=new API_Logger__c();
                    al.id=apiloggerId;
                    al.Customer_Information__c=objAcc.Id;
                    apiloggerListToUpdate.add(al);
                }
                
                if(apiloggerListToUpdate.size()>0)
                    update apiloggerListToUpdate;
                
            } 
            
            
            return appId;
        }
        else
            return null; 
    }
    
    @AuraEnabled
    public static String updateAccount(String listOfApplicants,String accId,String appId){
        System.debug('listOfApplicants '+listOfApplicants);
        Wrapper wrpObj =new Wrapper();
        wrpObj = (Wrapper)JSON.deserialize(listOfApplicants, Wrapper.class);
        System.debug('WRAPPER '+wrpObj); 
        String oldMobile = [SELECT PersonMobilePhone FROM Account WHERE Id = : accId].PersonMobilePhone;
        System.debug('oldMobile '+oldMobile);
        System.debug('newMobile '+wrpObj.mobile_1);
        
        Account accountObj = new Account();
        accountObj.Id = accId;
        accountObj.LastName = wrpObj.lastName;
        accountObj.FirstName = wrpObj.firstName;
        accountObj.PersonMailingCity = wrpObj.City;
        accountObj.PersonMailingPostalCode = wrpObj.Pincode;
        accountObj.PersonMobilePhone = wrpObj.mobile_1;
        accountObj.PersonBirthdate = wrpObj.DOB;
        accountObj.Income_Considered__c = wrpObj.incCon;
        accountObj.Married__c = wrpObj.married;
        if(oldMobile != wrpObj.mobile_1){
            accountObj.Mobile_Verified__c = false;
        }
        Database.SaveResult srList = Database.update(accountObj, false);
        if (srList.isSuccess()) {
            System.debug('Successfully Updated Record!!');
            System.debug(wrpObj.Applicant_Type);
            Loan_Applicant__c objLoan = [SELECT Id,Customer_Type__c,Customer_Information__c
                                         FROM Loan_Applicant__c 
                                         WHERE Customer_Information__c = :accId 
                                         AND Customer_Information__c != null AND Application__c =: appId];
            
            objLoan.Customer_Type__c = wrpObj.Applicant_Type;
            objLoan.Constitution__c = wrpObj.constitution;
            //objLoan.Customer_Information__c = accId;
            Database.SaveResult srLoan = Database.update(objLoan, false);
            System.debug('objLoan '+objLoan);
            if(srLoan.isSuccess())
                return 'Success';
            else
                return 'Failed';
        } else {
            System.debug('Updation Failed!!');
            return 'Failed';
        }
    }
    
    @AuraEnabled
    public static String updateLA(String fields){
        System.debug('fields '+fields);
        Loan_Applicant__c objLoan = (Loan_Applicant__c)JSON.deserialize(fields, Loan_Applicant__c.class);
        System.debug('objLoan '+objLoan);
        String accId = objLoan.Customer_Information__c;
        String appId = objLoan.Application__c;
        System.debug('accId '+accId);
        System.debug('appId '+appId);
        List<Loan_Applicant__c> listOfLoan = [SELECT Id,Customer_Type__c,Application__c,Customer_Information__c,Initiate_From__c,Constitution__c
                                            FROM Loan_Applicant__c 
                                            WHERE Customer_Information__c = :accId 
                                            AND Customer_Information__c != null AND Application__c =: appId AND Application__c != null];
         if(listOfLoan.size() == 0){
             Database.SaveResult srLoan = Database.INSERT(objLoan, false);
             if(srLoan.isSuccess())
                 return 'Success';
             else
                 return 'Failed'; 
         }
         else{
             //listOfLoan.get(0).Customer_Type__c = objLoan.Customer_Type__c;
             objLoan.Id = listOfLoan.get(0).Id;
             Database.SaveResult srLoan = Database.update(objLoan, false);
             if(srLoan.isSuccess())
                 return 'Success';
             else
                 return 'Failed';   
         }
    }
   
    @AuraEnabled
    public static void insertSelfDocuments(List<String> frontBase64,List<String> backBase64,List<String> frontNmList,
                                           List<String> backNmList,String accId){
        System.debug('frontBase64 '+frontBase64.size());
        System.debug('backBase64 '+backBase64.size());
        System.debug('frontNmList '+frontNmList);
        System.debug('backNmList '+backNmList);
        System.debug('accId '+accId);
        integer count = 0;
        if(frontBase64.size() > 0 && frontNmList.size() > 0 && frontBase64.size() == frontNmList.size()){
            for(String front : frontBase64){
                if(String.isNotBlank(front) && String.isNotEmpty(front)){
                    System.debug('front '+front);
                    String fileName = frontNmList.get(count);
                    System.debug('fileName '+fileName);
                    FileUploaderClass.uploadFile(front,fileName,accId);
                    count = count + 1;
                    System.debug('count front '+count);
                }                
            }
        }
        count = 0;
        if(backBase64.size() > 0 && backNmList.size() > 0 && backBase64.size() == backNmList.size()){
            for(String back : backBase64){
                if(String.isNotBlank(back) && String.isNotEmpty(back)){
                    System.debug('back '+back);
                    String fileName = backNmList.get(count);
                    System.debug('fileName '+fileName);
                    FileUploaderClass.uploadFile(back,fileName,accId);
                    count = count + 1;
                    System.debug('count back '+count);
                }                
            }
        }
        //FileUploaderClass.uploadFile(base64,fileName,accId);
    }
    
    @auraEnabled
    public static Boolean accMobileVerification(String accountId){
        System.debug('Account Id '+accountId);
        Account objAcc = [SELECT Id FROM Account WHERE Id = :accountId];
        if(objAcc!=null){
            System.debug('Acc '+objAcc);
            objAcc.Mobile_Verified__c = true; 
            UPDATE objAcc;
            if(objAcc.Mobile_Verified__c == true)
                return true;
            else
                return false;
        }
        else
            return false;
    }
    
    
    //Pre Login Insertion
    @auraEnabled
    public static String insertPreLogin(){     
        Id devRecordTypeId = Schema.SObjectType.Pre_Login__c.getRecordTypeInfosByName().get('1. New login').getRecordTypeId();
        Pre_Login__c preLog = new Pre_Login__c(RecordTypeId=devRecordTypeId,Status__c='Active');
        INSERT preLog; 
        System.debug(preLog.Id);
        return preLog.Id; 
    }  
    
    //Re Login Insertion
    //Insertion Of Relogin,CustomerInformation,Property,Application And Receipt
    @auraEnabled
    public static ReloginWrapper insertRelogin(String oldAppId){ 
        System.debug('OldAppId '+oldAppId);
        Id devRecordTypeId = Schema.SObjectType.Pre_Login__c.getRecordTypeInfosByName().get('2. Re-login').getRecordTypeId();
        Pre_Login__c preLog = new Pre_Login__c(RecordTypeId=devRecordTypeId,Status__c='Active');
        INSERT preLog; 
        System.debug('Relogin id '+preLog.Id);
        Application__c objApp = new Application__c(Pre_Login__c = preLog.Id,application_status__c='Active');
        INSERT objApp;
        System.debug('App id '+objApp.Id);
        List<Loan_Applicant__c> listOfLA = [SELECT Id,Customer_Information__c,Applicant_Name__c,Application__c,Customer_type__c
                                            FROM Loan_Applicant__c WHERE Application__c = :oldAppId];
        System.debug('listOfLA '+listOfLA);
        if(listOfLA.size() > 0){
            Set<String> setOfAcc = new Set<String>();
            Set<String> setOfLA = new Set<String>();
            Map<Id,Loan_Applicant__c> accIdLoanApplicantMap = new Map<Id,Loan_Applicant__c>(); // Loan APplicant Map Map<AccountId,Loan_Applicant__c>
            Map<Integer,Account> newAccountMap = new Map<Integer,Account>(); //New Account Map
            Map<Integer,Loan_Applicant__c> newLoanAppMap = new Map<Integer,Loan_Applicant__c>(); //New Loan Applicants
            Map<Integer,List<Property__c>> newPropMap = new Map<Integer,List<Property__c>>();
            Map<Id,List<Property__c>> oldPropMap = new Map<Id,List<Property__c>>(); //Loan_Applicant Id and Property Map
            
            for(Loan_Applicant__c objLA : listOfLA){
                System.debug('OBJLA '+objLA);
                setOfAcc.add(objLA.Customer_Information__c);
                setOfLA.add(objLA.Id);
                accIdLoanApplicantMap.put(objLA.Customer_Information__c,objLA);   
            }
            //Account List
            List<Account> accountList = [SELECT Type, Id, Name, LastName, FirstName, Salutation, RecordTypeId, 
                                         BillingStreet, BillingCity, BillingState, BillingPostalCode, BillingCountry,
                                         BillingLatitude, BillingLongitude, BillingGeocodeAccuracy, BillingAddress,
                                         ShippingStreet, ShippingCity, ShippingState, ShippingPostalCode, ShippingCountry,
                                         ShippingLatitude, ShippingLongitude, ShippingGeocodeAccuracy, ShippingAddress, Phone,
                                         PersonContactId,IsPersonAccount, PersonMailingStreet, PersonMailingCity, PersonMailingState, 
                                         PersonMailingPostalCode, PersonMailingCountry, PersonMailingLatitude, PersonMailingLongitude,
                                         PersonMailingGeocodeAccuracy, PersonMailingAddress, PersonMobilePhone, PersonEmail, 
                                         PersonTitle, PersonDepartment, PersonBirthdate, PersonLastCURequestDate, PersonLastCUUpdateDate,
                                         PersonEmailBouncedReason, PersonEmailBouncedDate, Jigsaw, JigsawCompanyId, AccountSource, 
                                         SicDesc, Applicant_Type__c, KYC_ID_Type_1__c, KYC_ID_Type_2__c, Staff_Loan__c, 
                                         Father_s_Name__c, Mother_s_Name__c, Spouse_Name__c, Income_Considered__c, Married__c, 
                                         Number_of_Dependents__c, Property_Holder__c, Highest_Income_Earner__c, Verification_Type__c,
                                         Mobile_Verified__c, KYC_Id_1__c, KYC_Id_2__c, User__c, Customer_Type__c, Branch_Master__c, 
                                         MS_Pincode__c, District__c, Gender__c, No_of_child_Dependents__c, Number_of_children__c, Age__c, 
                                         Place_Of_Birth__c, Marital_Status__c, Nationality__c, Resident_Type__c, Category__c, Religion__c,
                                         Person_With_Disability__c, Ownership_Status__c, Ownership_Type__c, Landmark__c,
                                         Duration_At_This_Address__c, Duration_At_This_City__c, Same_As_Address_Type__c,
                                         Communication_Address__c 
                                         FROM Account
                                         WHERE Id In : setOfAcc];
            for(Integer i=0; i< accountList.size();i=i+1){
                System.debug('accountList.get('+i+') '+accountList.get(i));
                Account oldAcc = accountList.get(i);
                System.debug('Old Acc '+oldAcc);
                Loan_Applicant__c oldLoanApp = accIdLoanApplicantMap.get(oldAcc.Id);
                System.debug('Old LA '+oldLoanApp);
                Account newAcc = oldAcc.clone(false, false, false, false);
                System.debug('New Acc '+newAcc);
                Loan_Applicant__c newLoanApp = oldLoanApp.clone(false, false, false, false);
                //newOldLoanAppMap.put(oldLoanApp.Id,newLoanApp.Id);
                System.debug('New LA '+newLoanApp);
                newAccountMap.put(i,newAcc);
                newLoanAppMap.put(i,newLoanApp);
            }

            if(!newAccountMap.isEmpty()){
                insert newAccountMap.values();
                for(Integer keyVal : newLoanAppMap.keySet()){
                    Loan_Applicant__c newLoanAppObj = newLoanAppMap.get(keyVal);
                    newLoanAppObj.Customer_Information__c= newAccountMap.get(keyVal).Id;
                    newLoanAppObj.Application__c = objApp.Id;
                }
                insert newLoanAppMap.values();
            }    
            
            System.debug('newAccountMap '+newAccountMap);
            System.debug('size '+newAccountMap.size());
            System.debug('newLoanAppObj '+newLoanAppMap);
            System.debug('size '+newLoanAppMap.size());
            
            List<Property__c> listOfProp = [SELECT Id, RecordTypeId, Property_Type__c, Title_Deed_Type__c, Title_Deed_Number__c,
                                            Title_Deed_Date__c, Property_Address__c, Application__c, Customer_Information__c, 
                                            Login__c, Title_Document_date__c, Building_Value_per_Sq_ft__c, MS_Pincode__c,
                                            Property__c, Risk_Document__c, Doc_Seen_Original_with__c,
                                            Customers_Residing__c, If_No_Reason__c, BM_Comments_for_Collateral__c,
                                            Land_Area_Sq_Ft__c, Value_per_sq_ft__c, Doc_No__c, Building_Area_Sq_Ft__c,
                                            Total_Value__c, Pathway_Available__c, Distance_from_Branch__c, Collateral_Type__c,
                                            Original_Mortgage_Document__c, Document_Type__c, Month__c, Title_Deed_Year__c,
                                            Mortgage_property_PINCODE__c, Person_residing_at_Mortgage_property__c,
                                            Living_property_Distance_from_Branch__c, Living_property_Pincode__c, landmark__c,
                                            Overall_Remarks__c, Remarks__c, North_by__c, South_by__c, East_by__c, West_by__c, 
                                            Boundaries_as_per_document_and_physical__c, Location_of_Mortgage_Property__c, 
                                            Mortgage_Property_Area__c, Enquiry_Name__c, North_by_land_measurements__c, 
                                            East_by_land_measurements__c, East_by_boundaries__c, North_by_boundaries__c,
                                            West_by_land_measurements__c, West_by_boundaries__c, South_by_land_measurements__c, 
                                            South_by_boundaries__c, Contact_Number__c,// Enquiry_Market_Value__c, 
                                            Valuation_Market_Value_Per_SqFt__c, Valuation_Remarks__c, Remarks_land_measurements__c, 
                                            Mortgage_Property_Remarks__c, Building_Constructed_with_Remarks__c, Building_Age__c, 
                                            Building_Type__c, floor__c, lengthSq_ft__c, widthSq_ft__c, Area_value_per_Sq_ft__c, 
                                            Enquiry_Contact_Number__c, Total_Area__c, Total_Area_land_measurementsTotal_Area__c, 
                                            Collateral_Sub_Type_Property_Details__c, Current__c, Mortgage_property_Living_property_are__c, 
                                            Boundries_Remarks__c, Is_living_property_is_own_property__c, Survey_Number__c, Plot_No__c,
                                            House_Door_No__c, Extent_Sqft__c, Link_Doc_Status__c, Link_Document_Type__c, 
                                            Link_Doc_Date__c, Link_Documents_in_Name_of__c, Supporting_Document_SD__c, SD_in_name_of__c,
                                            SD_Date__c, GuidelineValue_SqFt_asPer_LegalOpinion__c, Online_Guideline_Value_Search__c, 
                                            Online_Guidelive_Value__c, Existing_Encumberances__c, Property_Identified__c, 
                                            Property_Purchased_Type__c, Nature_Of_Property__c, Property_Location_Classification__c, 
                                            Carpet_Area__c, Proposed_Area__c, Registration_Status__c, Property_Ownership__c, 
                                            Age_Of_Property__c, Property_Purpose__c, Ownership_Status__c, Current_Owner_Name__c, 
                                            Co_Owner_Name__c, Percent_Share__c, Onwership_Date__c, Loan_Applicant__c, 
                                            Property_Owner__c, isPrimaryApplicant__c 
                                            FROM Property__c
                                            WHERE Application__c = :oldAppId AND Loan_Applicant__c In :setOfLA Order By Loan_Applicant__c];
            
            System.debug('Old Prop List '+listOfProp);
            System.debug('Old Prop List Size '+listOfProp.size()); 
            
            if(listOfProp.size() > 0){
                Integer propCount = -1;
                for(Property__c objProp : listOfProp){
                    Property__c newProp = objProp.clone(false,false,false,false);
                    if(oldPropMap.containsKey(objProp.Loan_Applicant__c)) {
                        List<Property__c> propList = oldPropMap.get(objProp.Loan_Applicant__c);
                        propList.add(objProp);
                        oldPropMap.put(objProp.Loan_Applicant__c, propList); 
                        List<Property__c> newPropListCount = newPropMap.get(propCount);
                        newPropListCount.add(newProp);
                        newPropMap.put(propCount,newPropListCount);
                    } else {
                        propCount = propCount + 1;
                        oldPropMap.put(objProp.Loan_Applicant__c, new List<Property__c> { objProp });
                        newPropMap.put(propCount,new List<Property__c> { newProp });
                    }
                }   
            }
            System.debug('Old Property Map '+oldPropMap);
            System.debug('oldPropMap Size '+oldPropMap.size());
            System.debug('newPropMap '+newPropMap);
            System.debug('newPropMap '+newPropMap.size());
            System.debug('newPropMap.keySet() '+newPropMap.keySet());
            List<Property__c> propertyToInsert =  new List<Property__c>();
            for(Integer keyVal : newPropMap.keySet()){
                Loan_Applicant__c newLoanAppObj = newLoanAppMap.get(keyVal);
                for(Property__C proObj : newPropMap.get(keyVal)){
                    System.debug(newLoanAppMap.get(keyVal));
                    proObj.Loan_Applicant__c = newLoanAppMap.get(keyVal).Id;
                    proObj.Application__c = objApp.Id;
                    propertyToInsert.add(proObj);
                }
                //propertyToInsert.addAll(newPropMap.get(keyVal));
            }
            insert propertyToInsert;
            System.debug('New Properties After Insert '+propertyToInsert);
            System.debug('New Properties After Insert size '+propertyToInsert.size());
            
            List<Receipt__c> newReceiptList = new List<Receipt__c>();
            List<Receipt__c> oldReceiptList = [SELECT Id, Receipt_Id__c, Receipt_Date__c, Amount__c, Pre_Login__c, Loan_Purpose__c,
                                               Branch_Number__c, Mode_of_payment__c, Approval_Status__c, Customer_name__c,
                                               Cashier__c, Loan_Reference_Number__c, Customer_Information__c, Receipt_Amount__c,
                                               Receipt_Details_Author__c, Application__c, Loan_Applicant__c
                                               FROM Receipt__c
                                               WHERE Application__c = :oldAppId];
            System.debug('oldReceiptList '+oldReceiptList);
            System.debug('oldReceiptList size '+oldReceiptList.size());
            if(oldReceiptList.size() > 0){
                for(Receipt__c objRec : oldReceiptList){
                    Receipt__c newRec = objRec.clone(false,false,false,false);
                    newRec.Application__c = objApp.Id;
                    newReceiptList.add(newRec);
                }
                System.debug('newReceiptList '+newReceiptList);
                System.debug('newReceiptList size '+newReceiptList.size());
                if(newReceiptList.size() > 0){
                    INSERT newReceiptList;
                }
            }   
        }
        String appName = [SELECT Name FROM Application__c WHERE ID = :oldAppId].Name;
        ReloginWrapper relWrap = new ReloginWrapper();
        relWrap.reloginId = preLog.Id;
        relWrap.appId = objApp.Id;
        relWrap.appName = appName;
        return relWrap;   
    } 
    
    //Cloning newly created property from pre-login for fivb,fivc,leaddetail,and legalapproval
    @AuraEnabled
    public static String cloneProperty(String appId){
        List<Property__c> newPropList = new List<Property__c>();
        List<Property__c> oldPropList = new List<Property__c>();
        List<Property__c> listOfProp = [SELECT Id, Name,Loan_Applicant__c,Login__c,hasRelatedRecords__c,Application__c,Property_Type__c ,Title_Deed_Type__c,Title_Deed_Number__c,Title_Deed_Date__c,Property_Address__c,MS_Pincode__c 
                                        FROM Property__c
                                        WHERE Application__c = :appId AND RecordType.Name = 'Pre Login Property Detail'];
        if(listOfProp.size() > 0){
            Id FIVBRecordTypeId = Schema.SObjectType.Property__c.getRecordTypeInfosByName().get('FIV-B Property Detail').getRecordTypeId();
            Id FIVCRecordTypeId = Schema.SObjectType.Property__c.getRecordTypeInfosByName().get('FIV-C Property Detail').getRecordTypeId();
            Id LegalApprovalRecTypeId = Schema.SObjectType.Property__c.getRecordTypeInfosByName().get('Legal Approval').getRecordTypeId();
            Id LeadDetailRecTypeId = Schema.SObjectType.Property__c.getRecordTypeInfosByName().get('Lead Detail').getRecordTypeId();
            for(Property__c objProp : listOfProp){
                if(!objProp.hasRelatedRecords__c){
                    Property__c fivB = objProp.clone(false,false,false,false);
                    fivB.RecordTypeId = FIVBRecordTypeId;
                    fivB.Application__c = objProp.Application__c;
                    fivB.Property__c = objProp.Id;
                    Property__c fivC = objProp.clone(false,false,false,false);
                    fivC.RecordTypeId = FIVCRecordTypeId;
                    fivB.Application__c = objProp.Application__c;
                    fivB.Property__c = objProp.Id;
                    Property__c legalApp = objProp.clone(false,false,false,false);
                    legalApp.RecordTypeId = LegalApprovalRecTypeId;
                    legalApp.Application__c = objProp.Application__c;
                    legalApp.Property__c = objProp.Id;
                    Property__c leadDetail = objProp.clone(false,false,false,false);
                    legalApp.RecordTypeId = LeadDetailRecTypeId;
                    leadDetail.Application__c = objProp.Application__c;
                    leadDetail.Property__c = objProp.Id;
                    newPropList.add(fivB);
                    newPropList.add(fivC);
                    newPropList.add(legalApp);
                    objProp.hasRelatedRecords__c = true;
                    oldPropList.add(objProp);   
                }
            }
            if(newPropList.size() > 0){
                INSERT newPropList; 
                UPDATE oldPropList;
                return 'Success';
            }
        }
        return 'Failed';
    }
   
    
    //Cloning newly created property from pre-login for fivb,fivc,leaddetail,and legalapproval
    @AuraEnabled
    public static String clonePropertyNew(String appId){
        String recordTypesToCreate = System.Label.Property_RecordTypes_To_Clone;
        List<String> recordTypeNames = recordTypesToCreate.split(',');

        List<Property__c> newPropList = new List<Property__c>();
        List<Property__c> oldPropList = new List<Property__c>();
        List<Property__c> listOfProp = [SELECT Id, Name,Loan_Applicant__c,Login__c,hasRelatedRecords__c,Application__c,Property_Type__c ,Title_Deed_Type__c,Title_Deed_Number__c,Title_Deed_Date__c,Property_Address__c,MS_Pincode__c 
                                        FROM Property__c
                                        WHERE Application__c = :appId AND RecordType.Name = 'Pre Login Property Detail'];
        if(listOfProp != NULL && !listOfProp.isEmpty()){
            for(Property__c objProp : listOfProp){
                if(!objProp.hasRelatedRecords__c){
                    for(String rcName : recordTypeNames){
                        Property__c newProperty = objProp.clone(false,false,false,false);
                        newProperty.RecordTypeId = Schema.SObjectType.Property__c.getRecordTypeInfosByName().get(rcName).getRecordTypeId();
                        newProperty.Application__c = objProp.Application__c;
                        newProperty.Property__c = objProp.Id;
                        newPropList.add(newProperty);
                    }
                    objProp.hasRelatedRecords__c = true;
                    oldPropList.add(objProp);  
                }
            }

            if(newPropList.size() > 0){
                INSERT newPropList; 
                UPDATE oldPropList;
                return 'Success';
            }
        }
        return 'Failed';
    }

   
     @auraEnabled
    public static ReloginWrapper insertTopup(String oldAppId){ 
        System.debug('OldAppId in topup '+oldAppId);
        Id devRecordTypeId = Schema.SObjectType.Pre_Login__c.getRecordTypeInfosByName().get('3. Top-up loan').getRecordTypeId();
        Pre_Login__c preLog = new Pre_Login__c(RecordTypeId=devRecordTypeId,Status__c='Active');
        INSERT preLog; 
        System.debug('Topup id '+preLog.Id);
        Application__c objApp = new Application__c(Pre_Login__c = preLog.Id,application_status__c='Active');
        INSERT objApp;
        System.debug('App id '+objApp.Id);
        List<Loan_Applicant__c> listOfLA = [SELECT Id,Customer_Information__c,Applicant_Name__c,Application__c,Customer_type__c
                                            FROM Loan_Applicant__c WHERE Application__c = :oldAppId];
        System.debug('listOfLA '+listOfLA);
        if(listOfLA.size() > 0){
            Set<String> setOfAcc = new Set<String>();
            Set<String> setOfLA = new Set<String>();
            Map<Id,Loan_Applicant__c> accIdLoanApplicantMap = new Map<Id,Loan_Applicant__c>(); // Loan APplicant Map Map<AccountId,Loan_Applicant__c>
            Map<Integer,Account> newAccountMap = new Map<Integer,Account>(); //New Account Map
            Map<Integer,Loan_Applicant__c> newLoanAppMap = new Map<Integer,Loan_Applicant__c>(); //New Loan Applicants
            Map<Integer,List<Property__c>> newPropMap = new Map<Integer,List<Property__c>>();
            Map<Id,List<Property__c>> oldPropMap = new Map<Id,List<Property__c>>(); //Loan_Applicant Id and Property Map
            
            for(Loan_Applicant__c objLA : listOfLA){
                System.debug('OBJLA '+objLA);
                setOfAcc.add(objLA.Customer_Information__c);
                setOfLA.add(objLA.Id);
                accIdLoanApplicantMap.put(objLA.Customer_Information__c,objLA);   
            }
            //Account List
            List<Account> accountList = [SELECT Type, Id, Name, LastName, FirstName, Salutation, RecordTypeId, 
                                         BillingStreet, BillingCity, BillingState, BillingPostalCode, BillingCountry,
                                         BillingLatitude, BillingLongitude, BillingGeocodeAccuracy, BillingAddress,
                                         ShippingStreet, ShippingCity, ShippingState, ShippingPostalCode, ShippingCountry,
                                         ShippingLatitude, ShippingLongitude, ShippingGeocodeAccuracy, ShippingAddress, Phone,
                                         PersonContactId,IsPersonAccount, PersonMailingStreet, PersonMailingCity, PersonMailingState, 
                                         PersonMailingPostalCode, PersonMailingCountry, PersonMailingLatitude, PersonMailingLongitude,
                                         PersonMailingGeocodeAccuracy, PersonMailingAddress, PersonMobilePhone, PersonEmail, 
                                         PersonTitle, PersonDepartment, PersonBirthdate, PersonLastCURequestDate, PersonLastCUUpdateDate,
                                         PersonEmailBouncedReason, PersonEmailBouncedDate, Jigsaw, JigsawCompanyId, AccountSource, 
                                         SicDesc, Applicant_Type__c, KYC_ID_Type_1__c, KYC_ID_Type_2__c, Staff_Loan__c, 
                                         Father_s_Name__c, Mother_s_Name__c, Spouse_Name__c, Income_Considered__c, Married__c, 
                                         Number_of_Dependents__c, Property_Holder__c, Highest_Income_Earner__c, Verification_Type__c,
                                         Mobile_Verified__c, KYC_Id_1__c, KYC_Id_2__c, User__c, Customer_Type__c, Branch_Master__c, 
                                         MS_Pincode__c, District__c, Gender__c, No_of_child_Dependents__c, Number_of_children__c, Age__c, 
                                         Place_Of_Birth__c, Marital_Status__c, Nationality__c, Resident_Type__c, Category__c, Religion__c,
                                         Person_With_Disability__c, Ownership_Status__c, Ownership_Type__c, Landmark__c,
                                         Duration_At_This_Address__c, Duration_At_This_City__c, Same_As_Address_Type__c,
                                         Communication_Address__c 
                                         FROM Account
                                         WHERE Id In : setOfAcc];
            for(Integer i=0; i< accountList.size();i=i+1){
                System.debug('accountList.get('+i+') '+accountList.get(i));
                Account oldAcc = accountList.get(i);
                System.debug('Old Acc '+oldAcc);
                Loan_Applicant__c oldLoanApp = accIdLoanApplicantMap.get(oldAcc.Id);
                System.debug('Old LA '+oldLoanApp);
                Account newAcc = oldAcc.clone(false, false, false, false);
                System.debug('New Acc '+newAcc);
                Loan_Applicant__c newLoanApp = oldLoanApp.clone(false, false, false, false);
                //newOldLoanAppMap.put(oldLoanApp.Id,newLoanApp.Id);
                System.debug('New LA '+newLoanApp);
                newAccountMap.put(i,newAcc);
                newLoanAppMap.put(i,newLoanApp);
            }

            if(!newAccountMap.isEmpty()){
                insert newAccountMap.values();
                for(Integer keyVal : newLoanAppMap.keySet()){
                    Loan_Applicant__c newLoanAppObj = newLoanAppMap.get(keyVal);
                    newLoanAppObj.Customer_Information__c= newAccountMap.get(keyVal).Id;
                    newLoanAppObj.Application__c = objApp.Id;
                }
                insert newLoanAppMap.values();
            }    
            
            System.debug('newAccountMap '+newAccountMap);
            System.debug('size '+newAccountMap.size());
            System.debug('newLoanAppObj '+newLoanAppMap);
            System.debug('size '+newLoanAppMap.size());
            
            List<Property__c> listOfProp = [SELECT Id, RecordTypeId, Property_Type__c, Title_Deed_Type__c, Title_Deed_Number__c,
                                            Title_Deed_Date__c, Property_Address__c, Application__c, Customer_Information__c, 
                                            Login__c, Title_Document_date__c, Building_Value_per_Sq_ft__c, MS_Pincode__c,
                                            Property__c, Risk_Document__c, Doc_Seen_Original_with__c,
                                            Customers_Residing__c, If_No_Reason__c, BM_Comments_for_Collateral__c,
                                            Land_Area_Sq_Ft__c, Value_per_sq_ft__c, Doc_No__c, Building_Area_Sq_Ft__c,
                                            Total_Value__c, Pathway_Available__c, Distance_from_Branch__c, Collateral_Type__c,
                                            Original_Mortgage_Document__c, Document_Type__c, Month__c, Title_Deed_Year__c,
                                            Mortgage_property_PINCODE__c, Person_residing_at_Mortgage_property__c,
                                            Living_property_Distance_from_Branch__c, Living_property_Pincode__c, landmark__c,
                                            Overall_Remarks__c, Remarks__c, North_by__c, South_by__c, East_by__c, West_by__c, 
                                            Boundaries_as_per_document_and_physical__c, Location_of_Mortgage_Property__c, 
                                            Mortgage_Property_Area__c, Enquiry_Name__c, North_by_land_measurements__c, 
                                            East_by_land_measurements__c, East_by_boundaries__c, North_by_boundaries__c,
                                            West_by_land_measurements__c, West_by_boundaries__c, South_by_land_measurements__c, 
                                            South_by_boundaries__c, Contact_Number__c,// Enquiry_Market_Value__c, 
                                            Valuation_Market_Value_Per_SqFt__c, Valuation_Remarks__c, Remarks_land_measurements__c, 
                                            Mortgage_Property_Remarks__c, Building_Constructed_with_Remarks__c, Building_Age__c, 
                                            Building_Type__c, floor__c, lengthSq_ft__c, widthSq_ft__c, Area_value_per_Sq_ft__c, 
                                            Enquiry_Contact_Number__c, Total_Area__c, Total_Area_land_measurementsTotal_Area__c, 
                                            Collateral_Sub_Type_Property_Details__c, Current__c, Mortgage_property_Living_property_are__c, 
                                            Boundries_Remarks__c, Is_living_property_is_own_property__c, Survey_Number__c, Plot_No__c,
                                            House_Door_No__c, Extent_Sqft__c, Link_Doc_Status__c, Link_Document_Type__c, 
                                            Link_Doc_Date__c, Link_Documents_in_Name_of__c, Supporting_Document_SD__c, SD_in_name_of__c,
                                            SD_Date__c, GuidelineValue_SqFt_asPer_LegalOpinion__c, Online_Guideline_Value_Search__c, 
                                            Online_Guidelive_Value__c, Existing_Encumberances__c, Property_Identified__c, 
                                            Property_Purchased_Type__c, Nature_Of_Property__c, Property_Location_Classification__c, 
                                            Carpet_Area__c, Proposed_Area__c, Registration_Status__c, Property_Ownership__c, 
                                            Age_Of_Property__c, Property_Purpose__c, Ownership_Status__c, Current_Owner_Name__c, 
                                            Co_Owner_Name__c, Percent_Share__c, Onwership_Date__c, Loan_Applicant__c, 
                                            Property_Owner__c, isPrimaryApplicant__c 
                                            FROM Property__c
                                            WHERE Application__c = :oldAppId AND Loan_Applicant__c In :setOfLA Order By Loan_Applicant__c];
            
            System.debug('Old Prop List '+listOfProp);
            System.debug('Old Prop List Size '+listOfProp.size()); 
            
            if(listOfProp.size() > 0){
                Integer propCount = -1;
                for(Property__c objProp : listOfProp){
                    Property__c newProp = objProp.clone(false,false,false,false);
                    if(oldPropMap.containsKey(objProp.Loan_Applicant__c)) {
                        List<Property__c> propList = oldPropMap.get(objProp.Loan_Applicant__c);
                        propList.add(objProp);
                        oldPropMap.put(objProp.Loan_Applicant__c, propList); 
                        List<Property__c> newPropListCount = newPropMap.get(propCount);
                        newPropListCount.add(newProp);
                        newPropMap.put(propCount,newPropListCount);
                    } else {
                        propCount = propCount + 1;
                        oldPropMap.put(objProp.Loan_Applicant__c, new List<Property__c> { objProp });
                        newPropMap.put(propCount,new List<Property__c> { newProp });
                    }
                }   
            }
            System.debug('Old Property Map '+oldPropMap);
            System.debug('oldPropMap Size '+oldPropMap.size());
            System.debug('newPropMap '+newPropMap);
            System.debug('newPropMap '+newPropMap.size());
            System.debug('newPropMap.keySet() '+newPropMap.keySet());
            List<Property__c> propertyToInsert =  new List<Property__c>();
            for(Integer keyVal : newPropMap.keySet()){
                Loan_Applicant__c newLoanAppObj = newLoanAppMap.get(keyVal);
                for(Property__C proObj : newPropMap.get(keyVal)){
                    System.debug(newLoanAppMap.get(keyVal));
                    proObj.Loan_Applicant__c = newLoanAppMap.get(keyVal).Id;
                    proObj.Application__c = objApp.Id;
                    propertyToInsert.add(proObj);
                }
                //propertyToInsert.addAll(newPropMap.get(keyVal));
            }
            insert propertyToInsert;
            System.debug('New Properties After Insert '+propertyToInsert);
            System.debug('New Properties After Insert size '+propertyToInsert.size());
            
            List<Receipt__c> newReceiptList = new List<Receipt__c>();
            List<Receipt__c> oldReceiptList = [SELECT Id, Receipt_Id__c, Receipt_Date__c, Amount__c, Pre_Login__c, Loan_Purpose__c,
                                               Branch_Number__c, Mode_of_payment__c, Approval_Status__c, Customer_name__c,
                                               Cashier__c, Loan_Reference_Number__c, Customer_Information__c, Receipt_Amount__c,
                                               Receipt_Details_Author__c, Application__c, Loan_Applicant__c
                                               FROM Receipt__c
                                               WHERE Application__c = :oldAppId];
            System.debug('oldReceiptList '+oldReceiptList);
            System.debug('oldReceiptList size '+oldReceiptList.size());
            if(oldReceiptList.size() > 0){
                for(Receipt__c objRec : oldReceiptList){
                    Receipt__c newRec = objRec.clone(false,false,false,false);
                    newRec.Application__c = objApp.Id;
                    newReceiptList.add(newRec);
                }
                System.debug('newReceiptList '+newReceiptList);
                System.debug('newReceiptList size '+newReceiptList.size());
                if(newReceiptList.size() > 0){
                    INSERT newReceiptList;
                }
            }   
        }
       // String appName = [SELECT Name FROM Application__c WHERE ID = :oldAppId].Name;
        ReloginWrapper relWrap = new ReloginWrapper();
        relWrap.reloginId = preLog.Id;
        relWrap.appId = objApp.Id;
        //relWrap.appName = appName;
        return relWrap;   
    } 
    
    //Application Insertion For Pre Login
    @auraEnabled
    public static String insertApplications(String preLogInId,Id accId,String customerType){
        System.debug('Prelogin Id '+preLogInId);
        List<Application__c> appId = [SELECT Id FROM Application__c WHERE Pre_Login__c = :preLogInId AND Pre_Login__c != null 
                                     ];
        if(appId.size() > 0){
            System.debug('Yes');
            return appId.get(0).Id;
        }
        else{
            Application__c objApp = new Application__c(Pre_Login__c = preLogInId,application_status__c = 'Active');
            INSERT objApp;
            return objApp.id;    
        } 
    }
    
    //Loan Applicants Insertion For Application
    @auraEnabled
    public static void insertLoanApplcants(String accId,String appId,String customerType,String constitution){
        System.debug('Insert LOAN APP '+appId+' '+accId+' '+customerType);
        //List<Account> listOfAcc = [Select Id,Name FROM Account WHERE Pre_Login__c = : preLogInId];
        //System.debug('listOfAcc '+listOfAcc);
        Loan_Applicant__c objLoan = new Loan_Applicant__c(
            Application__c = appId,
            Customer_Information__c = accId,
            Customer_Type__c  = customerType,
            Constitution__c = constitution
        );
        INSERT objLoan;
    }
    
    //get Property Related To Account
    @AuraEnabled
    public static GenericDataTableController.DataTableResponse getProperty(String accountId){
        System.debug('accountId=  '+accountId);
        Set<String> propIds = new Set<String>();
        for(Property__c prop : [SELECT Id FROM Property__c WHERE Customer_Information__c  =: accountId AND Customer_Information__c != null]){
            propIds.add(prop.Id);
        }
        System.debug('propIds=  '+propIds);
        GenericDataTableController genericDTObj = new GenericDataTableController();
        genericDTObj.METADATA_NAME = 'Pre_Login_Property';
        genericDTObj.IDS_SET = propIds;
        genericDTObj.WHERE_CLAUSE = ' ID IN : IDS_SET';
        return genericDTObj.getTable();   
    }
    
    @AuraEnabled
    public static boolean deleteProperty(String propId){
        System.debug('Property Id '+propId);
        Property__c objProp = [SELECT Id FROM Property__c WHERE Id  =: propId];
        System.debug('Property :: '+objProp);
        if(objProp != null){
            DELETE objProp;
            return true;
        }
        else{
            return false;
        }
    }
    
    // delete Properties
    @AuraEnabled
    public static Boolean delProperty(String accountId){
        System.debug('accountId=  '+accountId);
        List<Property__c> propObj = new List<Property__c>();
        for(Property__c prop : [SELECT Id FROM Property__c WHERE Customer_Information__c  =: accountId AND Customer_Information__c != null]){
            propObj.add(prop);
        }
        System.debug('propObj=  '+propObj);
        if(propObj.size()>0){
            System.debug('Yes');
            DELETE propObj;
            return true;
        }
        else{
            System.debug('No');
            return false;
        }
        //return false;
    }
    
    //Delete Account
    @AuraEnabled
    public static String delAccount(String accountId, String customerType, String preloginId, String appId){
        System.debug('Account Id '+accountId);
        System.debug('customerType '+customerType);
        System.debug('preloginId '+preloginId);
        System.debug('appId '+appId);
        boolean delAcc = false;
        if(customerType == 'Primary Applicant'){
            List<Receipt__c> listReceipt = [SELECT Id FROM Receipt__c WHERE Pre_Login__c =: preLoginId AND Pre_Login__c != null];
            if(listReceipt.size() > 0){
                delAcc = false;
                return 'Receipt';
            }
            else{
                delAcc = true;
            }
        }
        else{
            delAcc = true;
        }
        if(delAcc == true){
            boolean result = delProperty(accountId);
            System.debug('Property Delete Result '+result);
            Loan_Applicant__c objAcc = [Select Id From Loan_Applicant__c Where Customer_Information__c = : accountId AND Application__c = : appId];
            System.debug('result '+objAcc);
            if(objAcc != null){
                DELETE objAcc;
                return 'Deleted';
            }
            else{
                return null;
            }   
        }
        else{
            return null;
        }
        
    }
    
    @AuraEnabled
    public static Map<Id,String> getCashiers(){
        System.debug('Current User '+userinfo.getuserid());
        Account objAcc = [SELECT Id,Branch_Master__c,Branch_Master__r.Name
                          From Account
                          WHERE User__c = :userinfo.getuserid()];
        List<Account> bmList=[SELECT id,User__c ,User__r.Designation__c,User__r.Name,Branch_Master__c,Branch_Master__r.name 
                              FROM Account 
                              WHERE Branch_Master__c=:objAcc.Branch_Master__c AND User__r.Designation__c='Cashier'];
        Map<Id,String> cashierMap = new Map<Id,String>();
        
        if(bmList.size()>0){
            for(Account acc : bmList){
                cashierMap.put(acc.User__c,acc.User__r.Name);
            }
        }
        System.debug('Map '+cashierMap);
        if(cashierMap.size() > 0)
            return cashierMap;
        else
            return null;
    }*/
    /*
    //Receipt Submission For Approval
    @AuraEnabled
    public static String submitReceiptForApproval(String receiptId , String approverId){
        System.debug('Receipt Id :: '+receiptId);
        System.debug('ApproverId :: '+approverId);
        if(String.isNotBlank(receiptId) && String.isNotEmpty(receiptId) && String.isNotBlank(approverId) && String.isNotEmpty(approverId)){
            String AppId = [SELECT Application__r.Name FROM Receipt__c WHERE Id = : receiptId].Application__r.Name;
            System.debug('App '+AppId);
            List<Id> listApproverId = new List<Id>(); 
            //listApproverId.add(approverId);
           Utility.createTask(UserInfo.getName()+' is asking for approval',null, receiptId,approverId,null,'Please Approve this Receipt',true);
            Utility.sendNotification(UserInfo.getName()+' is asking approval for Receipt',AppId,receiptId,'Verification_Notification',approverId);
            return 'Success';
        }     
        else{
            return 'Failed';
        }
    }  
    
    @future
    public static void sendNotification(String receiptId , String approverId)
    {
        Utility.createTask(UserInfo.getName()+' is asking for approval',null, receiptId,approverId,null,'Please Approve this Receipt',true);
    }
    
    @AuraEnabled
    public static PincodeWrapper getPincode(String pincode){
        System.debug('PIN ID '+pincode);
        if(String.isNotBlank(pincode) && String.isNotEmpty(pincode)){
            try{
                MS_Pincode__c objPin = [SELECT Id,Name,DistrictName__c,City__c, StateName__c FROM MS_Pincode__c WHERE Name = : pincode];
                if(objPin != null){
                    System.debug('objPin '+objPin);
                    PincodeWrapper pinWrap = new PincodeWrapper();
                    pinWrap.pinId = objPin.Id;
                    pinWrap.city = objPin.City__c;
                    pinWrap.state = objPin.StateName__c;
                    pinWrap.district = objPin.DistrictName__c;
                    return pinWrap;
                }
                else{
                    return null;
                }
            }
            catch(exception e){
                return null;
            }
        }
        else{
            return null;
        }
    }
    //Retreive Pincode
    @AuraEnabled
    public static PincodeWrapper getPincodeDetails(String pinId){
        System.debug('PIN ID '+pinId);
        if(String.isNotBlank(pinId) && String.isNotEmpty(pinId)){
            MS_Pincode__c objPin = [SELECT Id, Name, DistrictName__c, StateName__c FROM MS_Pincode__c WHERE Id = : pinId];
            if(objPin != null){
                PincodeWrapper pinWrap = new PincodeWrapper();
                pinWrap.pinCode = objPin.Name;
                pinWrap.city = objPin.DistrictName__c;
                pinWrap.state = objPin.StateName__c;
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
    //Retreive Application
    @AuraEnabled
    public static GenericDataTableController.DataTableResponse searchApplication(String appNumber,String kycNumber){ 
        if(String.isNotBlank(appNumber) && String.isNotEmpty(appNumber)){
            Set<String> appIds = new Set<String>();
            for(Loan_Applicant__c app : [SELECT Id FROM Loan_Applicant__c 
                                         WHERE Application__r.Name = : appNumber 
                                         AND Application__r.Name != null 
                                         AND (Application__r.Pre_Login__r.Status__c = 'Rejected'
                                              OR Application__r.Pre_Login__r.Status__c = 'Cancelled' 
                                              OR Application__r.Pre_Login__r.Status__c = 'Active')
                                         AND Customer_Type__c = 'Primary Applicant'
                                        ]){
                                            appIds.add(app.Id);
                                        }
            
            System.debug('appIds=  '+appIds);
            GenericDataTableController genericDTObj = new GenericDataTableController();
            genericDTObj.METADATA_NAME = 'ReloginApplication';
            genericDTObj.IDS_SET = appIds;
            genericDTObj.WHERE_CLAUSE = ' ID IN : IDS_SET';
            return genericDTObj.getTable();       
        }
        else if(String.isNotBlank(kycNumber) && String.isNotEmpty(kycNumber)){
            System.debug('kycNumber '+kycNumber);
            Set<String> appIds = new Set<String>();
            List<Account> listAcc = [SELECT Id FROM Account WHERE (KYC_Id_1__c = : kycNumber OR KYC_Id_2__c = : kycNumber) 
                                     AND (KYC_Id_1__c != null AND KYC_Id_2__c != null)];
            for(Loan_Applicant__c app : [SELECT Id FROM Loan_Applicant__c 
                                         WHERE Customer_Information__c In : listAcc AND Customer_Information__c != null
                                         AND (Application__r.Pre_Login__r.Status__c = 'Rejected'
                                              OR Application__r.Pre_Login__r.Status__c = 'Cancelled'
                                              OR Application__r.Pre_Login__r.Status__c = 'Active')
                                        ]){
                                            appIds.add(app.Id);
                                        } 
            
            System.debug('appIds=  '+appIds);
            GenericDataTableController genericDTObj = new GenericDataTableController();
            genericDTObj.METADATA_NAME = 'ReloginApplication';
            genericDTObj.IDS_SET = appIds;
            genericDTObj.WHERE_CLAUSE = ' ID IN : IDS_SET';
            return genericDTObj.getTable();    
        }
        else{
            return null;
        }
        
    }  
    
    @AuraEnabled
    public static GenericDataTableController.DataTableResponse searchTopupApplication(String appNumber,String kycNumber,String lanNumber){ 
        System.debug('In TOpup');
        System.debug(appNumber + kycNumber + lanNumber);
        if(String.isNotBlank(appNumber) && String.isNotEmpty(appNumber)){
            Set<String> appIds = new Set<String>();
            for(Loan_Applicant__c app : [SELECT Id FROM Loan_Applicant__c 
                                         WHERE Application__r.Name = : appNumber 
                                         AND Application__r.Name != null 
                                         AND (Application__r.Pre_Login__r.Status__c = 'Done' 
                                              OR Application__r.Pre_Login__r.Status__c = 'Active')
                                         AND Customer_Type__c = 'Primary Applicant'
                                        ]){
                                            appIds.add(app.Id);
                                        }
            
            System.debug('appIds=  '+appIds);
            GenericDataTableController genericDTObj = new GenericDataTableController();
            genericDTObj.METADATA_NAME = 'ReloginApplication';
            genericDTObj.IDS_SET = appIds;
            genericDTObj.WHERE_CLAUSE = ' ID IN : IDS_SET';
            return genericDTObj.getTable();       
        }
        else if(String.isNotBlank(kycNumber) && String.isNotEmpty(kycNumber)){
            System.debug('kycNumber '+kycNumber);
            Set<String> appIds = new Set<String>();
            List<Account> listAcc = [SELECT Id FROM Account WHERE (KYC_Id_1__c = : kycNumber OR KYC_Id_2__c = : kycNumber) 
                                     AND (KYC_Id_1__c != null AND KYC_Id_2__c != null)];
            for(Loan_Applicant__c app : [SELECT Id FROM Loan_Applicant__c 
                                         WHERE Customer_Information__c In : listAcc AND Customer_Information__c != null
                                         AND (Application__r.Pre_Login__r.Status__c = 'Done'
                                              OR Application__r.Pre_Login__r.Status__c = 'Active')
                                        ]){
                                            appIds.add(app.Id);
                                        } 
            
            System.debug('appIds=  '+appIds);
            GenericDataTableController genericDTObj = new GenericDataTableController();
            genericDTObj.METADATA_NAME = 'ReloginApplication';
            genericDTObj.IDS_SET = appIds;
            genericDTObj.WHERE_CLAUSE = ' ID IN : IDS_SET';
            return genericDTObj.getTable();    
        }
        else{
            return null;
        }
        
    }  
    
    @AuraEnabled
    public static List<KYC_OCR__c> checkAPILogger(String accountId){
        if(String.isNotBlank(accountId) && String.isNotEmpty(accountId)){
            List<KYC_OCR__c> listLogger = [SELECT Id, Description__c, City__c, Name__c, ID__c, Fathers_Name__c, Spouce_Name__c,
                                           Gender__c, Phone__c,
                                           DOB__c, Pincode__c, Mothers_Name__c, API_Logger__c, Account__c,
                                           First_Name__c, Last_Name__c
                                           FROM KYC_OCR__c 
                                           WHERE Account__c = :accountId AND Description__c = 'Successful OCR'];
            if(listLogger.size() > 0)
                return listLogger;
            else 
                return null;
        }
        return null;
    }
     @AuraEnabled
    public static String getBranchName(){
        //System.debug('Current User '+userinfo.getuserid());
        Account objAccount = [SELECT Branch_Master__r.Name
                          From Account
                          WHERE User__c = :userinfo.getuserid()];
        System.debug('ObjAcc '+objAccount);
        System.debug('branch '+objAccount.Branch_Master__r.Name);
        return objAccount.Branch_Master__r.Name;
    }*/
    
    //Customer Information Wrapper
    public class Wrapper{
        @auraEnabled public String kycId {get;set;}
        @auraEnabled public String Name {get;set;}
        //@auraEnabled public Boolean staffLoan;
        @auraEnabled public String constitution {get;set;}
        @auraEnabled public String incCon{get;set;}
        @auraEnabled public String appType{get;set;}
        @auraEnabled public String Gender{get;set;}
        @auraEnabled public String Salutation{get;set;}
        @auraEnabled public String firstName{get;set;}
        @auraEnabled public String lastName{get;set;}
        @auraEnabled public String FathersName{get;set;}
        @auraEnabled public String  MothersName{get;set;}
        @auraEnabled public String married{get;set;}
        @auraEnabled public String SpouceName{get;set;}
        @auraEnabled public Date DOB{get;set;}
        @auraEnabled public String mobile_1{get;set;} 
        @auraEnabled public String mobile_2{get;set;}
        @auraEnabled public String City{get;set;}
        @auraEnabled public String district{get;set;}  
        @auraEnabled public String Pincode{get;set;}
        @auraEnabled public String Address{get;set;}
        @auraEnabled public String verification{get;set;}
        @auraEnabled public String Applicant_Type{get;set;}
        @auraEnabled public String kycNo{get;set;}
        
        // @auraEnabled public String wife{get;set;}
        @auraEnabled public String description{get;set;}
        @auraEnabled public String requestId{get;set;}
        @auraEnabled public String msg{get;set;}
        @auraEnabled public String statusCode{get;set;}
        @auraEnabled public String MobileNo{get;set;}
        @auraEnabled public String dlNo{get;set;}
        @auraEnabled public String countryCode{get;set;}
        @auraEnabled public Date doe{get;set;}
        @auraEnabled public Date doi{get;set;}
        @auraEnabled public String nationality{get;set;}
        @auraEnabled public String passportNum{get;set;}
        @auraEnabled public String placeOfBirth{get;set;}
        @auraEnabled public String placeOfIssue{get;set;}
        @auraEnabled public String type{get;set;}
        @auraEnabled public String mrz{get;set;}
        @auraEnabled public String apifrontResponse{get;set;} 
        @auraEnabled public String apibackResponse{get;set;}
        @auraEnabled public String apilogger{get;set;}
        @auraEnabled public String ocrId{get;set;}
        @auraEnabled public String fileNum{get;set;}
        @auraEnabled public date oldDoi{get;set;}
        @auraEnabled public String oldPassportNum{get;set;}
        @auraEnabled public String oldPlaceOfIssue{get;set;}
        @auraEnabled public String kycType{get;set;}
    }
    
    public class PincodeWrapper{
        @auraEnabled public String pinCode;
        @auraEnabled public String city;
        @auraEnabled public String state;
        @auraEnabled public String district;
        @auraEnabled public String pinId;
    }
    
    public class ApplicationWrapper{
        @auraEnabled public String appId;
        @auraEnabled public String appName;
    }
    public class ReloginWrapper{
        @auraEnabled public String reloginId;
        @auraEnabled public String appId;
        @auraEnabled public String appName;
    }
}