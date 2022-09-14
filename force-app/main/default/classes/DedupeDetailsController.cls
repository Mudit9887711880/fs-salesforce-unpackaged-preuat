/**
 * @author            : Karan Singh Soni / Zafaruddin
 * @group             : TechMatrix Consulting
 * @description       : Controller of Fs_dedupeDetails_Lwc
 * @created on        : 21-08-2022
 * @last modified on  : 10-09-2022
 * @last modified by  : Sandeep Kumar
**/
public with sharing class DedupeDetailsController {

    /*
    @Author : Karan Singh Soni / Zafaruddin
    @Description : Method will return  Dedupe record wrapper .
    */  
    @AuraEnabled
    public static String initDedupeData( String applicationId ){
        DedupeWrapper objDedupeWrapper = new DedupeWrapper();
        if( String.isBlank(applicationId) ){
            objDedupeWrapper.statusCode = 400;
            objDedupeWrapper.message = 'Invalid parameters passed while initialization.';
            objDedupeWrapper.dedupeCriteria = true;
            return JSON.serialize(objDedupeWrapper);
        }
        try{
            objDedupeWrapper.listSObject = [ SELECT Id, Name, Applicant_Id__c, Customer_Rel_Id__c, CIF_Id__c, Source__c, First_Name__c, Last_Name__c,
                                                Date_Of_Birth__c, Mobile_Number__c, Address_Line_1__c, Address_Line_3__c, City__c, District__c, State__c,
                                                Pincode__c, Pan_Number__c, Passport__c, Aadhaar_Number__c, Voter_Id__c, Driving_License__c, Active__c,
                                                Dedupe_Invoke_From__c, Archive__c, Loan_Applicant__c,Loan_Applicant__r.Customer_Information__r.Name,
                                                ( SELECT Application_Number__c, Application_Status__c, Branch_Code__c, Dedupe_Detail__c, Id, Lan_Status__c, Lan__c, Name FROM Dedupe_Loan_Details__r )
                                                FROM Dedupe_Detail__c
                                                WHERE Loan_Applicant__r.Application__c =: applicationId
                                                AND Archive__c  = False];
            objDedupeWrapper.sObjectListType = 'Dedupe_Detail__c';
            objDedupeWrapper.statusCode = 200;
            objDedupeWrapper.dedupeCriteria = true;
        }catch (Exception e) {
            objDedupeWrapper.statusCode = 503;
            objDedupeWrapper.message = e.getMessage();
            objDedupeWrapper.dedupeCriteria = true;
        }
        System.debug('JSON DEDUPE TO JS  '+objDedupeWrapper);
        return JSON.serialize(objDedupeWrapper);
    }

    /*
        @Author : Zafaruddin
        @Description : Method will return  Dedupe Exception user Id.
         and update Applicant cifId.
    */
    @AuraEnabled  
    public static String getDedupeUserId() {
        List<User> userRecord = [Select Id, Name from User where Name = 'Dedupe Exception User'];
        if( userRecord != null && userRecord[0].Id != null) {
            return userRecord[0].Id ; 
        }
        return '';
    }

    /*
        @Author : Zafaruddin
        @Description : Method will Assign Dedupe Exception user to Dedupe record
         and update Applicant cifId.
    */ 
    @AuraEnabled
    public static String assignDedupeExceptionUser(Id dedupeId, Id loanApplicantId, String activeType ) {
        
            Dedupe_Detail__c dedupe = new Dedupe_Detail__c();
            if(activeType == 'No') {
                Loan_Applicant__c applicant = new Loan_Applicant__c();
                applicant.Id = loanApplicantId;
                applicant.cifId__c =  null;
                update applicant;
                dedupe.Id = dedupeId;
                dedupe.Active__c = 'No' ;
                // code to assign Dedupe record to  Dedupe Exception User
                if(String.isNotBlank( getDedupeUserId() )) {
                    dedupe.ownerId = getDedupeUserId() ;
                } 
            }
            else if(activeType == 'Yes') {
                dedupe.Id = dedupeId;
                dedupe.Active__c = 'Yes' ;
            }
            update dedupe;

            return dedupe.Id;
        
    }


    @AuraEnabled
    public static List<Dedupe_Detail__c> getDoneDedupeData(String applicationId,String applicantName){
        List<Dedupe_Detail__c> dedupeList = new List<Dedupe_Detail__c>();
        dedupeList = [select Id,Owner.Name,Archive__c,Active__c,Loan_Applicant__c,Loan_Applicant__r.Applicant_Name__c,Loan_Applicant__r.Application__c,
        CIF_Id__c,(select Id,Lan__c,Lan_Status__c,Application_Number__c,Application_Status__c from Dedupe_Loan_Details__r) from Dedupe_Detail__c where Loan_Applicant__r.Application__c=:applicationId AND Loan_Applicant__r.Applicant_Name__c=:applicantName
        AND  Loan_Applicant__r.cifId__c!=NULL  AND Archive__c=false AND Active__c!=NULL];
        if(dedupeList.size()>0){
            return dedupeList;
        }

        return dedupeList;
    }


    /*
        @Author : Zafaruddin
        @Description : Method will return Dedupe Records details which is assign to Dedupe exception User.
    */
    @AuraEnabled
    public static String saveDedupeData( String applicationId ){
        DedupeWrapper objDedupeWrapper = new DedupeWrapper();
        try{
            objDedupeWrapper.listSObject = [ SELECT Id, Name, owner.Name,Applicant_Id__c, Customer_Rel_Id__c, CIF_Id__c, Source__c, First_Name__c, Last_Name__c,
                                                Date_Of_Birth__c, Mobile_Number__c, Address_Line_1__c, Address_Line_3__c, City__c, District__c, State__c,
                                                Pincode__c, Pan_Number__c, Passport__c, Aadhaar_Number__c, Voter_Id__c, Driving_License__c, Active__c
                                                FROM Dedupe_Detail__c
                                                WHERE Loan_Applicant__r.Application__c =: applicationId
                                                AND Archive__c  = False AND   owner.Name != 'Dedupe Exception User'
                                                AND Loan_Applicant__r.LMS_Customer_Info_File_Number__c  = NULL
                                                 ];
            objDedupeWrapper.sObjectListType = 'Dedupe_Detail__c';
            objDedupeWrapper.statusCode = 200;
        }catch (Exception e) {

            objDedupeWrapper.statusCode = 503;
            objDedupeWrapper.message = e.getMessage();
        }
        System.debug('SAVE DEDUPE RECORDDDD  '+objDedupeWrapper);
        return JSON.serialize(objDedupeWrapper);
    }

    /*
        @Author : Zafaruddin
        @Description : Method to check Dedupe records validation.
    */
    @AuraEnabled
    public static String  checkDedupeValidation (String applicationId) {
        system.debug('APPLICATION ID  '+applicationId);
        DedupeSubmitValidationWrapper messageWrapper = new DedupeSubmitValidationWrapper();
        List<Dedupe_Detail__c> DedupeDetailList = new List<Dedupe_Detail__c>();
        Boolean isdedupeDone = false; 
        Integer count=0;
        // code to check  calling dedupe api
       /* for( Loan_Applicant__c applicant : [ SELECT Id, Application__c, LMS_Customer_Info_File_Number__c, cifId__c FROM Loan_Applicant__c
            WHERE Application__c =: applicationId AND  (LMS_Customer_Info_File_Number__c  != NULL OR  cifId__c  != NULL ) ]) {
                isdedupeDone = true ;
        }
        isdedupeDone = [Select Id, Loan_Applicant__r.Application__c from  Dedupe_Detail__c where Loan_Applicant__r.Application__c =: applicationId ].isEmpty() ? false : true ;
        
        */
        List<Loan_Applicant__c> loanappList=[ SELECT Id, Application__c, LMS_Customer_Info_File_Number__c, cifId__c,(Select Id from  Dedupe_Details__r) FROM Loan_Applicant__c
            WHERE Application__c =: applicationId AND  (LMS_Customer_Info_File_Number__c  = NULL AND  cifId__c  = NULL )];
       
        if(loanappList.size()>0){

            for(Loan_Applicant__c loanObj : loanappList){
                if(loanObj.Dedupe_Details__r.size()>0){
                    ++count;
                }
            }

        }

        if(count==loanappList.size()){
            isdedupeDone=true;
        }
       
        if(!isdedupeDone) {
            messageWrapper.errorFlag = true ;
            messageWrapper.message = 'Please invoke Dedupe API' ;
        }
        // code to check applicant have more than 1 dedupe records with criteria then assign them to Dedupe Exception User.
        for( Loan_Applicant__c applicant : [ SELECT Id, Application__c, LMS_Customer_Info_File_Number__c, cifId__c, (select Id, Archive__c from Dedupe_Details__r where Archive__c  = false) FROM Loan_Applicant__c
            WHERE Application__c =: applicationId  AND cifId__c=NULL]) {
                // assign dedupe records to Dedupe Exception User
                if(applicant.Dedupe_Details__r.size() > 1) {
                    for(Dedupe_Detail__c dedupe : applicant.Dedupe_Details__r) {
                        dedupe.Id = dedupe.Id ;
                        if(String.isNotBlank( getDedupeUserId() )) {
                            dedupe.ownerId = getDedupeUserId() ;
                        }
                        DedupeDetailList.add(dedupe);
                    }
                }
        }
        if(! DedupeDetailList.isEmpty()) {
            update DedupeDetailList;
            messageWrapper.errorFlag = true ;
            messageWrapper.message = 'Dedupe found and transfer to Dedupe Execution User' ;
            // code to send Notification to Dedupe Exception User.
            Utility.sendNotification('Dedupe Owner  Change ',' Update Dedupe record owner with Dedupe User Exception user.', applicationId, 'Verification_Notification', getDedupeUserId());            // Create an approval request for  Opportunity        

        }
        // code to submit button validation wrapper .
        return JSON.serialize(messageWrapper);
    }


    @AuraEnabled
    public static Boolean checkDedupeButton(String applicationId){
        Integer count=0;
        List<Loan_Applicant__c> loanAppList = [select Id,LMS_Customer_Info_File_Number__c,cifId__c,Application__c,(select Id,Archive__c from Dedupe_Details__r where  Archive__c=false and Owner.Name='Dedupe Exception User') from Loan_Applicant__c where Application__c=:applicationId];
        
        for(Loan_Applicant__c loanObj : loanAppList){
            if(loanObj.LMS_Customer_Info_File_Number__c!=NULL && loanObj.cifId__c!=null && loanObj.Dedupe_Details__r.size()>0){
                ++count;
            }
            
        }

        if(count==loanAppList.size()){
            return true;
        }
return false;
    }



    /*
        @Author : Sandeep Kumar
        @Description : Method will the current logged in user.
    */
    @AuraEnabled  
    public static String getCurrentUserId() {
        List<User> userObjList = [select Id,Name from User where Id =:UserInfo.getUserId()];
        
        if(userObjList.size()>0){
            if(userObjList[0].Name=='Dedupe Exception User'){
                return 'true';
            }
        }
        return '';
    }

    /*
        @Author : Sandeep Kumar
    */

    @AuraEnabled
    public static string updateLoanApp(String loanAppId,String cifId ){
        List<Dedupe_Detail__c> dedupeList = new List<Dedupe_Detail__c>();
        List<Loan_Applicant__c> loanAppList = new List<Loan_Applicant__c>();
        Loan_Applicant__c objList = [select Id,Application__r.Stage__c,Application__c from Loan_Applicant__c where Id=:loanAppId LIMIT 1];
        
        Loan_Applicant__c obj =  new Loan_Applicant__c();
         obj.Id=loanAppId;
         obj.cifId__c=cifId;
         loanAppList.add(obj);

         if(loanAppList.size()>0){
             update loanAppList;

            for(Dedupe_Detail__c dedupeobj:[select Id,Active__c,Loan_Applicant__c from Dedupe_Detail__c  where Loan_Applicant__c IN : loanAppList]){
                    Dedupe_Detail__c dedObj = new Dedupe_Detail__c();
                    dedObj.Id=dedupeobj.Id;
                    dedObj.Active__c='Yes';
                    dedupeList.add(dedObj);
            }
            if(dedupeList.size()>0){
                update dedupeList;

                 return 'success';
            }


            
         }



         return '';

    }
    /*
        @Author : Sandeep Kumar
    */
    @AuraEnabled 
    public static List<Loan_Applicant__c> getLoanApplicants(String applicationId){  
        system.debug('applicationId'+applicationId);      
         return [select Id,Applicant_Name__c from Loan_Applicant__c where Application__c=:applicationId];
    }
    /*
        @Author : Sandeep Kumar
    */

     @AuraEnabled 
    public static List<Loan_Applicant__c> getExceptionLoanApplicants(String applicationId){  
        system.debug('applicationId'+applicationId);   
        Set<String> applicantsIds = new Set<String>();
        List<Loan_Applicant__c> loanAppList = new List<Loan_Applicant__c>();
        List<Dedupe_Detail__c> dedupeAppList = [select Id,Owner.Name,Archive__c,Loan_Applicant__c,Loan_Applicant__r.Application__r.Name,Loan_Applicant__r.Application__r.Owner.Name,Loan_Applicant__r.Application__r.Stage__c,Loan_Applicant__r.Application__r.Id from Dedupe_Detail__c where Loan_Applicant__r.Application__c =:applicationId AND Archive__c=false AND Owner.Name = 'Dedupe Exception User'];

        if(dedupeAppList.size()>0){
            for(Dedupe_Detail__c obj : dedupeAppList){
                applicantsIds.add(obj.Loan_Applicant__c);
            }
        }

        if(applicantsIds.size()>0){
            for(Loan_Applicant__c loanObj : [select Id,Applicant_Name__c from Loan_Applicant__c where Id IN :applicantsIds ]){
                loanAppList.add(loanObj);
            }
        }

        return loanAppList;
        
    }

    /*
        @Author : Sandeep Kumar
    */
     @AuraEnabled
    public static List<Dedupe_Detail__c> getExceptionUserApps(){
        List<Dedupe_Detail__c> appsList = new List<Dedupe_Detail__c>();
        Map<String,Dedupe_Detail__c> dedupeMap = new Map<String,Dedupe_Detail__c>();
        List<Dedupe_Detail__c> dedupeAppList = [select Id,Archive__c,Active__c,Loan_Applicant__r.Application__r.Name,Loan_Applicant__r.Application__r.owner.Name,Loan_Applicant__r.Application__r.Stage__c,Loan_Applicant__r.Application__r.Id from Dedupe_Detail__c where owner.Name='Dedupe Exception User' AND Loan_Applicant__r.Application__r.Stage__c!=NULL AND Archive__c=FALSE];
        if(dedupeAppList.size()>0){
            for(Dedupe_Detail__c obj : dedupeAppList){
                if(!(dedupeMap.containsKey(obj.Loan_Applicant__r.Application__c))){
                    appsList.add(obj);
                    dedupeMap.put(obj.Loan_Applicant__r.Application__c,obj);
                }
            }
        }
        return appsList;
    }
    /*
        @Author : Sandeep Kumar
    */
    @AuraEnabled 
    public static boolean getApplicantsStatus(List<Loan_Applicant__c> apptList){
        String appOwnerId='';
        Integer count=0;
        String appId;
        List<Loan_Applicant__c> ownerAppts = new List<Loan_Applicant__c>();
        List<Loan_Applicant__c> loanList =[select Id,cifId__c,Application__c,Application__r.OwnerId,LMS_Customer_Info_File_Number__c from Loan_Applicant__c where Id IN : apptList];
       if(loanList.size()>0){
             appId=loanList[0].Application__c;
       }
        List<Application__c> appList = new List<Application__c>();

        List<Loan_Applicant__c> allLoanList = [select Id,cifId__c,LMS_Customer_Info_File_Number__c,Application__c from Loan_Applicant__c where Application__c=:appId AND (cifId__c=NULL AND LMS_Customer_Info_File_Number__c=NULL)];

        if(allLoanList.size()>0){
            return true;
        }else{
                for(Application__c app:[select Id,Stage__c,OwnerId from Application__c where Id=:appId]){
                        if(app.Stage__c =='Login'){
                                Application__c appObj = new Application__c();
                                appObj.Id=app.Id;
                                appObj.Stage__c='Verification';
                                appList.add(appObj);

                        }else if(app.Stage__c =='Process Credit'){
                                Utility.sendNotification('Dedupe Resolved Successfully ',' Dedupe Resolved Successfully', app.Id, 'Verification_Notification', app.OwnerId);                    

                        }else if(app.Stage__c =='Approval Credit'){
                                Utility.sendNotification('Dedupe Resolved Successfully ',' Dedupe Resolved Successfully', app.Id, 'Verification_Notification', app.OwnerId);                    
                        
                        }else if(app.Stage__c =='Lead Detail'){
                                Utility.sendNotification('Dedupe Resolved Successfully ',' Dedupe Resolved Successfully', app.Id, 'Verification_Notification', app.OwnerId);                    
                        }
                    }

                    if(appList.size()>0){
                        update appList;
                    }
        }

        return false;
    }

    




    /*
        @Author : Sandeep Kumar
        @Description : Method to get Dedupe and loan applicant records.
    */

    /*
        @Author : Sandeep Kumar
    */
    @AuraEnabled 
    public static String getLoanDedupeData(String applicationId,String CustomerNumber){

    DedupeWrapper objDedupeWrapper = new DedupeWrapper();

        try{
                objDedupeWrapper.listSObject =[SELECT Id,Loan_Applicant__r.Application__r.Name,Loan_Applicant__r.Application__r.Sourcing_Branch__r.Name, Loan_Applicant__r.Name, Loan_Applicant__r.Application__c, Loan_Applicant__r.Customer_Information__c, Loan_Applicant__r.Customer_Type__c, Loan_Applicant__r.Applicant_Name__c, Loan_Applicant__r.Constitution__c, Loan_Applicant__r.Is_Bureau_Verified__c, Loan_Applicant__r.Initiate_From__c, Loan_Applicant__r.Husband_Wife_s_Name__c,
                Loan_Applicant__r.Guardian_Name__c, Loan_Applicant__r.Marital_Status__c, Loan_Applicant__r.Resident_Type__c, Loan_Applicant__r.Person_With_Disability__c, Loan_Applicant__r.KYC_ID_Type_1__c, Loan_Applicant__r.KYC_ID_Type_2__c, Loan_Applicant__r.Ownership_Status__c, Loan_Applicant__r.Ownership_Type__c, Loan_Applicant__r.Duration_At_This_Address_From__c,
                Loan_Applicant__r.Duration_At_This_Address_To__c, Loan_Applicant__r.Duration_At_This_City_To__c, Loan_Applicant__r.Mobile__c, Loan_Applicant__r.Email__c, Loan_Applicant__r.Residence_Country__c, Loan_Applicant__r.Residence_Flat_Plot_Number__c, Loan_Applicant__r.Residence_Address_Line_1__c, Loan_Applicant__r.Residence_Address_Line_2__c, 
                Loan_Applicant__r.Residence_Pincode__r.Pincode__c, Loan_Applicant__r.Residence_Village__c, Loan_Applicant__r.Residence_Taluka__c, Loan_Applicant__r.Residence_City__c, Loan_Applicant__r.Residence_District__c, Loan_Applicant__r.Residence_State__c, Loan_Applicant__r.Income_Considered__c, Loan_Applicant__r.KYC_Id_1__c, Loan_Applicant__r.KYC_Id_2__c, Loan_Applicant__r.Applicant_Type__c,
                Loan_Applicant__r.Married__c, Loan_Applicant__r.Mobile_Verified__c, Loan_Applicant__r.Residence_Landmark__c, Loan_Applicant__r.Permanent_Landmark__c, Loan_Applicant__r.Business_Landmark__c, Loan_Applicant__r.Phone_Office__c, Loan_Applicant__r.Phone_Residence__c, Loan_Applicant__r.Verification_Type__c, Loan_Applicant__r.Is_Lead_Detail_Done__c, Loan_Applicant__r.LMS_Customer_Info_File_Number__c,
                Loan_Applicant__r.Is_KYC_Verified__c, Loan_Applicant__r.CKYC_ID_Number__c, Loan_Applicant__r.Applicant_Customer_ID__c, Loan_Applicant__r.State_Code__c, Loan_Applicant__r.Created_From__c, Loan_Applicant__r.isRetrigger__c, Loan_Applicant__r.cifId__c 
                , Name, Applicant_Id__c, Customer_Rel_Id__c, CIF_Id__c, Source__c, First_Name__c, Last_Name__c, Date_Of_Birth__c, Mobile_Number__c, Address_Line_1__c, Address_Line_3__c, City__c, District__c, State__c, Pincode__c, Pan_Number__c, Passport__c, Aadhaar_Number__c, Voter_Id__c, Driving_License__c, Active__c, Dedupe_Invoke_From__c, Archive__c, Loan_Applicant__c, Button_Name__c FROM Dedupe_Detail__c where Loan_Applicant__r.Application__c=:applicationId AND CIF_Id__c=:CustomerNumber LIMIT 1];

                objDedupeWrapper.sObjectListType = 'Dedupe_Detail__c';
        }catch(Exception e){
                objDedupeWrapper.message = e.getMessage();
        }
        return JSON.serialize(objDedupeWrapper);

    }
    /*
        @Author : Sandeep Kumar
    */
    @AuraEnabled
    public static string getLan(String dpId){
        List<Dedupe_Loan_Detail__c> objList = [select Id,Lan__c,Dedupe_Detail__c from Dedupe_Loan_Detail__c where Dedupe_Detail__c=:dpId AND Lan__c!=null LIMIT 1];
        if(objList.size()>0){
            return  objList[0].Lan__c;
        }
        
        return '';
    }

    /*
        @Author : Sandeep Kumar
    */
    @AuraEnabled
    public static List<Dedupe_Detail__c> getExceptionUserDedupe(String applicationId,String applicantName){
        List<Dedupe_Detail__c> dedupeList = new List<Dedupe_Detail__c>();
        dedupeList = [select Id,Owner.Name,Archive__c,Active__c,Loan_Applicant__c,Loan_Applicant__r.Applicant_Name__c,Loan_Applicant__r.Application__c,
        CIF_Id__c,(select Id,Lan__c,Lan_Status__c,Application_Number__c,Application_Status__c from Dedupe_Loan_Details__r) from Dedupe_Detail__c where Loan_Applicant__r.Application__c=:applicationId AND Loan_Applicant__r.Applicant_Name__c=:applicantName
        AND  (Loan_Applicant__r.LMS_Customer_Info_File_Number__c = NULL OR Loan_Applicant__r.cifId__c=NULL) AND Owner.Name!='Dedupe Exception User' AND Archive__c=false];
        if(dedupeList.size()>0){
            return dedupeList;
        }
        return dedupeList;
    }

    /*
        @Author : Sandeep Kumar
    */

    @AuraEnabled
    public static List<Dedupe_Detail__c> getDedupeUserData(String applicationId,String applicantName){
        List<Dedupe_Detail__c> dedupeList = new List<Dedupe_Detail__c>();
        dedupeList = [select Id,Owner.Name,Archive__c,Active__c,Loan_Applicant__c,Loan_Applicant__r.Applicant_Name__c,Loan_Applicant__r.Application__c,
        CIF_Id__c,(select Id,Lan__c,Lan_Status__c,Application_Number__c,Application_Status__c from Dedupe_Loan_Details__r) from Dedupe_Detail__c where Loan_Applicant__r.Application__c=:applicationId AND Loan_Applicant__r.Applicant_Name__c=:applicantName AND Archive__c=false AND Owner.Name='Dedupe Exception User'];
        if(dedupeList.size()>0){
            return dedupeList;
        }
        return dedupeList;
    }

    /*
        @Author : Sandeep Kumar
    */

    @AuraEnabled
    public static String getButtonStatus(String applicationId,String applicantName){
        
        List<Loan_Applicant__c> loannApptList = new List<Loan_Applicant__c>();
        List<Dedupe_Detail__c> dedupeList = new List<Dedupe_Detail__c>();

        loannApptList = [select Id,Applicant_Name__c,LMS_Customer_Info_File_Number__c,Application__c,cifId__c from Loan_Applicant__c where Application__c=:applicationId AND (cifId__c=NULL OR LMS_Customer_Info_File_Number__c=NULL) AND Applicant_Name__c=:applicantName];

        if(loannApptList.size()>0){
             dedupeList = [select Id,Loan_Applicant__c,Owner.Name from Dedupe_Detail__c where Loan_Applicant__c IN : loannApptList /*AND Owner.Name='Dedupe Exception User'*/];
        }



        if(dedupeList.size()>0){
             List<Dedupe_Detail__c> dedupeList1 = new List<Dedupe_Detail__c>();
                dedupeList1 = [select Id,Loan_Applicant__c,Owner.Name from Dedupe_Detail__c where Loan_Applicant__c IN : loannApptList AND Owner.Name='Dedupe Exception User'];
                if(!dedupeList1.isEmpty()){
                      return 'Dedupe Exception found and transferred to Dedupe Exception User';
                } 
        }else{
            return 'Please invoke Dedupe API';
        }

       /* if((loannApptList.size()>0)){
            if(dedupeList.isEmpty()){
                return 'Please invoke Dedupe API';
            }
        }*/

     /*   if((loannApptList.size()>0)){
            if(!dedupeList.isEmpty()){
                return 'Dedupe Exception found and transferred to Dedupe Exception User';
            }  
        }*/

    return '';

    }

    /*
        @Author : Sandeep Kumar
    */

    @AuraEnabled
    public static String lmsLoanAppt(String applicationId,String applicantName){
            List<Loan_Applicant__c> loannApptList = new List<Loan_Applicant__c>();
            loannApptList = [select Id,Applicant_Name__c,LMS_Customer_Info_File_Number__c,Application__c,cifId__c from Loan_Applicant__c where Application__c=:applicationId AND (cifId__c!=NULL AND  LMS_Customer_Info_File_Number__c!=NULL) AND Applicant_Name__c=:applicantName];

            if(loannApptList.size()>0){
                return 'Dedupe not required';
            }
        return '';
    }






    public class DedupeSubmitValidationWrapper {

        @AuraEnabled public String message;
        @AuraEnabled public Boolean errorFlag = false;

    }


    public class DedupeWrapper{
        @AuraEnabled public Integer statusCode;
        @AuraEnabled public String  message;
        @AuraEnabled public Map<String,String> mapExtraParams = new Map<String,String>();
        @AuraEnabled public List<Sobject> listSObject = new List<Sobject>();
        @AuraEnabled public String sObjectListType;
        @AuraEnabled public Boolean dedupeCriteria ;
        @AuraEnabled public Boolean noDedupeMatch ;
    }

}