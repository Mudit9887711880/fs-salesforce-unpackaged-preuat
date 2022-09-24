/**
 * @author            : Karan Singh Soni
 * @group             : TechMatrix Consulting
 * @description       : This is an main class for the Disbursal Maker and Disbursal Author Components -
 * @created on        : 12-07-2022
 * @last modified on  : 17-09-2022
 * @last modified by  : Karan Singh Soni
**/
public without sharing class Fiv_Disb_LwcController extends GenericFormBuilderController{

    /**
    * @description : This is used to get the existing records of insurance details of application.
    * @author Neeraj Soni | 01-09-2022
    * @param applicationId
    * @return label-value pair of loan applicant names
    **/
    @AuraEnabled
    public static List<Insurance_Details__c> getInsuranceDetailRecords(String applicationId){
        return [Select Insurance_Waiver__c, Insured_Person_Date_of_Birth__c, Nominee_Type__c,
            Nominee_Relationship_Type__c, Nominee_KYC_ID_Type__c, Nominee_KYC_ID_No__c, Nominee_DOB_as_per_KYC__c,
            Nominee_Relationship_with_Insured_Person__c,Nominee_Name__c, Insured_Person_Name__c, Part_of_Loan__c, Not_Part_of_Loan__c,
            Insurance_Requirement__c, Insurance_Medical_Test_Result__c, Id, Application__c, Application__r.id
            from Insurance_Details__c where Application__r.id =:applicationId ];
    }

    /**
    * @description : This is used to get the naames of Loan Applicants related to an Application.
    * @author Neeraj Soni | 01-09-2022
    * @param applicationId
    * @return label-value pair of loan applicant names
    **/
    @AuraEnabled
    public static List<String> getLoanApplicantnames(String applicationId){
        List<String> loanApplicantNames = new List<String>();
        List<Application__c> applicationRecords = [Select Id, (select id, Customer_Type__c, Applicant_Type__c,
                                                               Applicant_Name__c from Loan_Applicants__r)
                                                   from Application__c where id =:applicationId LIMIT 1];
        if(applicationRecords.size() > 0){
            for(Loan_Applicant__c applicantRec: applicationRecords.get(0).Loan_Applicants__r){
                loanApplicantNames.add(applicantRec.Applicant_Name__c);
            }
        }
        return loanApplicantNames;
    }

    /**
    * @description : This is used to invoke generic edit form logic.
    * @author Karan Singh Soni | 02-08-2022
    * @param recordIds - record id of the object mentioned in the metadata
    * @param metaDetaName - Name of the Generic_Detail_Page__mdt record which will have Generic_Detail_Page_Content__mdt fields
    * @return GenericFormBuilderController.InitWrapper
    * prerequistic - create Generic_Detail_Page__mdt and Generic_Detail_Page_Content__mdt records for testing
    **/
    @AuraEnabled
    public static GenericFormBuilderController.InitWrapper getMetaDataFields(String recordIds, String metaDetaName){
        Fiv_Disb_LwcController obj = new Fiv_Disb_LwcController();
        obj.METADATA_NAME = metaDetaName;
        obj.IDS_SET = new Set<String>();
        if(String.isNotEmpty(recordIds)){
            obj.IDS_SET = new Set<String>();
            obj.IDS_SET.addAll(recordIds.split('_'));
            obj.WHERE_CLAUSE = ' Id IN : IDS_SET';
            obj.RECORD_LIMIT = '1';
        }
        return obj.initialize();//getSectionContent();
    }



    /**
    * @description
    * @author Karan Singh Soni | 02-08-2022
    * @param recordId
    * @param childObjectName
    * @param parentObjectName
    * @param parentWhereRecdCondn
    * @param listPrntConditions
    * @param listChildConditions
    * @return DisbursalCompWrap
    **/
    @AuraEnabled
    public static DisbursalCompWrap getParentAndRelatedData( String recordId ,String childObjectName,String parentObjectName, String parentWhereRecdCondn , List<String> listPrntConditions,List<String> listChildConditions){

        DisbursalCompWrap objDisbursalCompWrap = new DisbursalCompWrap();
        String schemeRecdTypDisb = 'Disbursal_Parameters';

        if( String.isBlank(recordId) ){
            objDisbursalCompWrap.statusCode = 400;
            objDisbursalCompWrap.message = 'Invalid Record Id.';
            return objDisbursalCompWrap;
        }
        if( String.isBlank(parentWhereRecdCondn) ){
            parentWhereRecdCondn = 'ID';
        }

        String strPrntWithChildQuery =  'SELECT Id,Name,( SELECT Id,Name FROM {0} ORDER BY CreatedDate DESC {1} ) FROM {2} WHERE '+parentWhereRecdCondn+' =: recordId';

        if( !listPrntConditions.isEmpty() ){
            for( String conditionId : listPrntConditions ){
                strPrntWithChildQuery += ' AND ' + conditionId.split('--')[0] +' =\''+conditionId.split('--')[1] + '\'';
            }

        }
        if( !listChildConditions.isEmpty() ){
            List<String> listqueryStr = strPrntWithChildQuery.split('ORDER');
            System.debug('listqueryStr ' + listqueryStr );
            String queryChildConds = '';

            for( String conditionId : listChildConditions ){
                system.debug( 'conditionId ' + conditionId );
                if( !listqueryStr[0].contains('WHERE') ){

                    queryChildConds += ' WHERE ' + conditionId.split('--')[0] +' =\''+conditionId.split('--')[1] + '\'';
                }else{
                    queryChildConds += ' AND ' + conditionId.split('--')[0] +' =\''+conditionId.split('--')[1] + '\'';
                }
            }
            strPrntWithChildQuery = listqueryStr[0] + queryChildConds + ' ORDER ' + listqueryStr[1];

        }

        try {

            //bydeault we will be calling disbursal records
            if( String.isBlank(childObjectName) && String.isBlank(parentObjectName)){

                strPrntWithChildQuery = String.format(strPrntWithChildQuery, new List<Object>{'Disbursals__r', 'LIMIT 1','Application__c'});

                //adding more fields in Applications for inital load up
                strPrntWithChildQuery = strPrntWithChildQuery.replace( 'FROM Application__c' , ',Stage__c,LMS_Response_Reference__c,Emi_PcAc__c,Loan_Amount__c,Amount_Recommended__c,Nach_Party__c,Nach_Party_2__c,NACH_Party_1_ID__c,NACH_Party_2_ID__c,Pre_Login__c,Total_Amount_Recommended_PcAc__c,Customer_Communicated__c,Margin_ROI__c,Tenor_In_Months__c,Tranche_Disbursal__c,AC_Submission_Date__c FROM Application__c');
            }else{

                strPrntWithChildQuery = String.format(strPrntWithChildQuery, new List<Object>{ childObjectName, '' , parentObjectName});

                if( childObjectName == 'Disbursal_Repayment_Details__r' ){

                    //adding more fields in Disbursal_Repayment_Detail__c
                strPrntWithChildQuery = strPrntWithChildQuery.replace( 'FROM Disbursal_Repayment_Details__r' , ', NACH_Party_Type__c FROM Disbursal_Repayment_Details__r');
                }
            }
            System.debug('strPrntWithChildQuery -> ' + strPrntWithChildQuery);
            List< Sobject > listSobject = Database.query(strPrntWithChildQuery);

            if( listSobject.isEmpty() ){
                objDisbursalCompWrap.statusCode = 400;
                objDisbursalCompWrap.message = 'No Data found.';
            }else{

                //incase of application get the related records of application and fill the map for auto population
                if( Id.valueOf(String.valueOf( listSobject[0].get('Id') )).getSobjectType()
                    == Schema.Application__c.getSObjectType()){
                        //need to do this else many existing got affected
                    objDisbursalCompWrap.objAppt = (Application__c)listSobject[0];

                    if( objDisbursalCompWrap.objAppt.Stage__c == 'Disbursal Maker' ){

                        objDisbursalCompWrap.disbMetaPrefix = 'DISBM_';

                    }else if( objDisbursalCompWrap.objAppt.Stage__c == 'Disbursal Author' ){

                        objDisbursalCompWrap.disbMetaPrefix = 'DISBA_';
                    }

                    //----------------------------------------------------------
                    //need to auto populate
                    //if( objDisbursalCompWrap.objAppt.Disbursals__r.isEmpty() ){

                        for( MS_Scheme__c objSchemeMaster : [ SELECT Id, Due_Date__c, First_Installment_Date__c, Interest_Start_Date__c
                                                                            FROM MS_Scheme__c
                                                                            ORDER BY CreatedDate DESC LIMIT 1])
                        {
                            //.remove(' 00:00:00') this is done so that in lightning input take string as param so we need to remove this suffix while conversion
                            objDisbursalCompWrap.mapExtraParams.put( 'Due_Date__c',''+String.valueOf(objSchemeMaster.Due_Date__c).remove(' 00:00:00'));
                            objDisbursalCompWrap.mapExtraParams.put( 'First_Installment_Date__c',''+String.valueOf(objSchemeMaster.First_Installment_Date__c).remove(' 00:00:00'));
                            objDisbursalCompWrap.mapExtraParams.put( 'Interest_Start_Date__c',''+String.valueOf(objSchemeMaster.Interest_Start_Date__c).remove(' 00:00:00'));
                        }
                    //}
                    //----------------------------------------------------------


                    //Karan Singh : 10/09/2022 - Get the primary applicant Name
                    for( Loan_Applicant__c objLoanApp : [ SELECT Id, Customer_Type__c,Customer_Information__r.Name, CKYC_ID_Number__c
                                                             FROM Loan_Applicant__c
                                                             WHERE  Application__c =: objDisbursalCompWrap.objAppt.Id
                                                             AND  Customer_Type__c = 'Primary Applicant' AND Customer_Information__c <> Null
                                                             ORDER BY CreatedDate LIMIT 1] )
                        {
                            objDisbursalCompWrap.mapExtraParams.put( 'apptPrimaryApplicantName', objLoanApp.Customer_Information__r.Name);
                            objDisbursalCompWrap.mapExtraParams.put( 'apptPrimaryApplicantCkyc', objLoanApp.CKYC_ID_Number__c);
                        }

                    //Karan Singh : 29/08/2022 : getting Insurance amount for deduction - - Disbursal Paramaters
                    for( AggregateResult  objAggResult : [ SELECT Sum( Total_Fee__c ) totalAmnt
                                                        FROM Fee_Creation__c
                                                        WHERE Application__c =:objDisbursalCompWrap.objAppt.Id AND RecordType.Name = 'Insurance'
                                                        AND Repayment_Type_2__c = 'Deduct from Disbursement' ] )
                    {

                        if( objAggResult.get('totalAmnt') != Null ){

                            objDisbursalCompWrap.mapExtraParams.put( 'Total_Deductions__c', String.valueOf(objAggResult.get('totalAmnt')));

                        }
                    }

                    if(!objDisbursalCompWrap.mapExtraParams.containsKey('Total_Deductions__c')){

                        objDisbursalCompWrap.mapExtraParams.put( 'Total_Deductions__c', '0');
                    }

                    //calculating final disbursement amount - Disbursal Paramaters
                    Decimal finalDisbAmt = objDisbursalCompWrap.objAppt.Total_Amount_Recommended_PcAc__c<> Null ? objDisbursalCompWrap.objAppt.Total_Amount_Recommended_PcAc__c : 0;
                    finalDisbAmt -= objDisbursalCompWrap.mapExtraParams.get( 'Total_Deductions__c' ) <> Null ? Decimal.valueOf( objDisbursalCompWrap.mapExtraParams.get( 'Total_Deductions__c' ) ): 0;
                    finalDisbAmt =finalDisbAmt.setScale(2);
                    objDisbursalCompWrap.mapExtraParams.put('Final_Disbursal_Amount__c', String.valueOf( finalDisbAmt) );

                    //Checking Final Disbursement Amount saved in object
                    for( Disbursal__c objDisbursal : [ SELECT Id, Final_Disbursal_Amount__c,CKYC_Original__c
                                                        FROM Disbursal__c
                                                        WHERE Application__c =: objDisbursalCompWrap.objAppt.Id
                                                        ORDER BY CreatedDate Desc LIMIT 1 ] )
                    {
                        if( objDisbursal.Final_Disbursal_Amount__c <> Null  ){

                            objDisbursalCompWrap.mapExtraParams.put('finalDisbAmtfromDB', String.valueOf( objDisbursal.Final_Disbursal_Amount__c) );

                            if( objDisbursal.CKYC_Original__c <> Null ){
                                objDisbursalCompWrap.mapExtraParams.put('ckycOriginal', String.valueOf( objDisbursal.CKYC_Original__c) );
                            }
                        }
                    }
                    if( !objDisbursalCompWrap.mapExtraParams.containsKey('finalDisbAmtfromDB') ){

                        objDisbursalCompWrap.mapExtraParams.put('finalDisbAmtfromDB', '0' );
                    }
                }else{

                    objDisbursalCompWrap.objSobject = listSobject[0];
                }

                //getting user empoyeeid
                for( User objUser : [ SELECT Id, EmployeeNumber FROM USER WHERE Id =: UserInfo.getUserId()] )
                {
                    if( objDisbursalCompWrap.disbMetaPrefix == 'DISBM_' ){

                        objDisbursalCompWrap.mapExtraParams.put('Disbursal_Maker_ID__c', objUser.EmployeeNumber);
                    }else{
                        objDisbursalCompWrap.mapExtraParams.put('Disbursal_Author_ID__c', objUser.EmployeeNumber);
                    }
                }
                for( Verification__c objVerif : [ SELECT Id
                                                    FROM Verification__c
                                                    WHERE recordtype.name = 'AC' ORDER BY CreatedDate DESC
                                                    LIMIT 1 ])
                {
                    objDisbursalCompWrap.mapExtraParams.put('acRecordId', objVerif.Id);
                }
                //
                objDisbursalCompWrap.statusCode = 200;
                objDisbursalCompWrap.message = 'Data fetched successfully.';
            }
        } catch (Exception e) {

            objDisbursalCompWrap.statusCode = 500;
            objDisbursalCompWrap.message = e.getMessage();
        }
        return objDisbursalCompWrap;
    }

    @AuraEnabled
    public static GenericDataTableController.DataTableResponse getRelatedRecords(List<String> setRecordIds,String metadataName){

        system.debug( 'metadataName ' + metadataName );
        system.debug( 'setRecordIds ' + setRecordIds );
        GenericDataTableController genericDTObjCapabilty = new GenericDataTableController();
        genericDTObjCapabilty.METADATA_NAME = metadataName ;
        genericDTObjCapabilty.IDS_SET = new Set< String >(setRecordIds);
        genericDTObjCapabilty.WHERE_CLAUSE = 'ID IN : IDS_SET';
        return genericDTObjCapabilty.getTable();

    }

    @AuraEnabled
    public static DisbursalCompWrap getIfscDetails( String ifscCodeId ){

        DisbursalCompWrap objWrapDisbComp = new DisbursalCompWrap();

        if( String.isBlank( ifscCodeId ) ){

            objWrapDisbComp.statusCode = 400;
            objWrapDisbComp.message = 'IFSC Code is blank.';
            return objWrapDisbComp;
        }
        try {

            List< IFSC_Code_Master__c > listIfscMaster = [ SELECT Id,Name, Bank_Branch_Name__c, Bank_Name__c
                                                            FROM IFSC_Code_Master__c
                                                            WHERE Id =: ifscCodeId  ];

            if( listIfscMaster.isEmpty() ){

                objWrapDisbComp.statusCode = 404;
                objWrapDisbComp.message = 'IFSC Code not found.';
                objWrapDisbComp.mapExtraParams.put( 'Beneficiary_Branch_Name__c', '' );
                objWrapDisbComp.mapExtraParams.put( 'Beneficiary_Bank_Name__c', '' );
            }else{

                objWrapDisbComp.statusCode = 200;
                objWrapDisbComp.mapExtraParams.put( 'Beneficiary_Branch_Name__c', listIfscMaster[0].Bank_Name__c );
                objWrapDisbComp.mapExtraParams.put( 'Beneficiary_Bank_Name__c', listIfscMaster[0].Bank_Branch_Name__c );
            }
        } catch (Exception e) {

            objWrapDisbComp.statusCode = 503;
                objWrapDisbComp.message = e.getMessage();
        }

        return objWrapDisbComp;
    }

    @AuraEnabled
    public static DisbursalCompWrap initDisbursalPayee( String jsonParamData){

        DisbursalCompWrap objDisbursalCompWrap = new DisbursalCompWrap();
        List<String> listApptNameType = new List<String>();

        if( String.isBlank(jsonParamData) ){

            objDisbursalCompWrap.statusCode = 400;
            objDisbursalCompWrap.message = 'Invalid data passed';
            return objDisbursalCompWrap;
        }
        try{

            Map<String, Object> mapJsonParam =   (Map<String, Object>) JSON.deserializeUntyped(jsonParamData);
            Set<String> setLoanApptIds =  new Set<String>();
            Decimal sanctionLoanAmt = 0;
            for( Application__c objAppt : [ SELECT Id,Total_Amount_Recommended_PcAc__c,
                                                ( SELECT Id,Customer_Information__r.Name, Customer_Type__c FROM Loan_Applicants__r )
                                            FROM Application__c
                                            WHERE Id =: (String) mapJsonParam.get('apptId')])
            {
                sanctionLoanAmt = objAppt.Total_Amount_Recommended_PcAc__c;
                for(  Loan_Applicant__c objLoanAppt :  objAppt.Loan_Applicants__r ){
                    setLoanApptIds.add( objLoanAppt.Id );
                    listApptNameType.add( objLoanAppt.Customer_Type__c + '---' + objLoanAppt.Customer_Information__r.Name );
                }
                listApptNameType.add( 'BT Bank---' );
                listApptNameType.add( 'Third Party---' );
            }
            if( !listApptNameType.isEmpty() ){

                objDisbursalCompWrap.mapExtraParams.put('listApptNameType' , String.join( listApptNameType, ','));
            }
            objDisbursalCompWrap.mapExtraParams.put('sanctionLoanAmt' , ''+sanctionLoanAmt);


            //fetching exisitng Disbursal Payee details
            if( mapJsonParam.containsKey('existDisbId') ){

                for( Disbursal__c objDisb : [ SELECT Id,Final_Disbursal_Amount__c,
                                                ( SELECT Id, Beneficiary_Amount__c, Beneficiary_Bank_Account_Number__c, Beneficiary_Bank_Name__c, Beneficiary_Branch_Name__c,Beneficiary_IFSC_Code__c, Beneficiary_IFSC_Code__r.Name, Beneficiary_Name__c, Beneficiary_Type__c, Disbursal__c, Is_Verified__c, Payment_Type__c, Name FROM Disbursal_Payees__r )

                                             FROM Disbursal__c
                                             WHERE Id =: (String) mapJsonParam.get('existDisbId')] )
                {
                    if(objDisb.Final_Disbursal_Amount__c <> Null ){
                        objDisbursalCompWrap.mapExtraParams.put('Final_Disbursal_Amount' , ''+objDisb.Final_Disbursal_Amount__c);
                    }else{
                        objDisbursalCompWrap.mapExtraParams.put('Final_Disbursal_Amount' , '0');
                    }
                    if( !objDisb.Disbursal_Payees__r.isEmpty() ){

                        objDisbursalCompWrap.listSObject = objDisb.Disbursal_Payees__r;
                        objDisbursalCompWrap.sObjectListType = 'Disbursal_Payee__c';
                    }

                }
            }

            //---------------------------------------------------
            //getting loan applicant premium and final AMount
            List<String> listStrLoanApptDetails =new  List<String>();
            for(Application__c objAppt : [ SELECT Id,Name,Stage__c,
                                                    ( SELECT Id, Premium__c, Stage_Due__c,Total_Fee__c
                                                        FROM Fee_Creations__r
                                                        WHERE  RecordType.Name = 'Insurance' AND Repayment_Type_2__c = 'Deduct from Disbursement' AND Stage_Due__c IN ('Approval Credit', 'Disbursal Maker')
                                                        ORDER BY CreatedDate ASC )
                                                 FROM Application__c WHERE ID=: (String) mapJsonParam.get('apptId') ])
            {
                String json;
                //now we will give preference DM then AC first in case  of Da, AC incase of DM
                if( objAppt.Stage__c == 'Disbursal Maker' ){

                    Decimal totalPremiumAC = 0;
                    Decimal totalFeesAC = 0;
                    for( Fee_Creation__c objFee : objAppt.Fee_Creations__r ){

                        if( objFee.Stage_Due__c == 'Approval Credit' ){

                            totalPremiumAC += objFee.Premium__c <> Null ? objFee.Premium__c : 0;
                            totalFeesAC += objFee.Total_Fee__c <> Null ? objFee.Total_Fee__c : 0;
                        }
                    }
                    json = '{ "premium" :'+totalPremiumAC +', "fee" : '+totalFeesAC+' }';
                    System.debug(' DM - premium '+totalPremiumAC +', "fee" : '+totalFeesAC);
                }else{

                    Decimal totalPremiumAC = 0;
                    Decimal totalFeesAC = 0;
                    Decimal totalPremiumDM = 0;
                    Decimal totalFeesDM = 0;

                    for( Fee_Creation__c objFee : objAppt.Fee_Creations__r ){

                        if( objFee.Stage_Due__c == 'Approval Credit' ){

                            totalPremiumAC += objFee.Premium__c <> Null ? objFee.Premium__c : 0;
                            totalFeesAC += objFee.Total_Fee__c <> Null ? objFee.Total_Fee__c : 0;
                        }
                        else if( objFee.Stage_Due__c == 'Disbursal Maker' ){

                            totalPremiumDM += objFee.Premium__c <> Null ? objFee.Premium__c : 0;
                            totalFeesDM += objFee.Total_Fee__c <> Null ? objFee.Total_Fee__c : 0;
                        }

                    }
                    System.debug(' DA - totalPremiumDM '+totalPremiumDM +' "totalFeesDM" : '+totalFeesDM);
                    System.debug(' DA - totalPremiumAC '+totalPremiumAC +' "totalFeesAC" : '+totalFeesAC);

                    if(totalPremiumDM != 0 ||totalFeesDM != 0 ){
                        json = '{ "premium" :'+totalPremiumDM +', "fee" : '+totalFeesDM+' }';
                    }else{
                        json = '{ "premium" :'+totalPremiumAC +', "fee" : '+totalFeesAC+' }';
                    }

                }
                objDisbursalCompWrap.mapExtraParams.put('insuranceCalc' , json);
            }

            if(listStrLoanApptDetails.size() > 0){
                objDisbursalCompWrap.mapExtraParams.put('listLoanApptPremiumFees' , String.join( listStrLoanApptDetails, ','));
            }
            objDisbursalCompWrap.statusCode = 200;
        } catch (Exception e) {

            objDisbursalCompWrap.statusCode = 500;
            objDisbursalCompWrap.message = e.getMessage();
        }

        //getting Disbursal Data

        return objDisbursalCompWrap;
    }
    @AuraEnabled
    public static String callPennyDropAPI( Id disbPayee ){
        String status = 'Success';
        try {
            PennyDropAPI.callPennyDropAPI(disbPayee);
        } catch (Exception e) {
            status = e.getMessage();
        }
        return status;
    }
    @AuraEnabled
    public static List<ContentVersion> getDocumentId(String parentId, String documentPrefix){
        documentPrefix = documentPrefix + '%';
        return [SELECT Id, Title,ContentDocumentId FROM ContentVersion WHERE Parent_Id__c =:parentId AND Title LIKE :documentPrefix ORDER BY CreatedDate DESC LIMIT 1];
    }
    /*
     * Karan Singh : 02/09/2022 : This method will update the owner of the application
     */
    @AuraEnabled
    public static String allocateUser( String stageName, String apptId ){
        String msg = 'Success';
        try{
            Id userId = null;
            if( stageName == 'Disbursal Maker' ){
                List<PermissionSetAssignment> listPermissionSet = [SELECT Id,AssigneeId, Assignee.Name FROM PermissionSetAssignment WHERE PermissionSet.Name = 'Disbursal_Maker_Permission_Set' LIMIT 1];

                if( !listPermissionSet.isEmpty() ){
                    userId = listPermissionSet[0].AssigneeId;
                }

            }else if(stageName == 'Disbursal Author'){
                List<PermissionSetAssignment> listPermissionSet = [SELECT Id,AssigneeId, Assignee.Name FROM PermissionSetAssignment WHERE PermissionSet.Name = 'Disbursal_Author_Permission_Set' LIMIT 1];

                if( !listPermissionSet.isEmpty() ){
                    userId = listPermissionSet[0].AssigneeId;
                }
            }else if(stageName == 'Custody'){
                List<PermissionSetAssignment> listPermissionSet = [SELECT Id,AssigneeId, Assignee.Name FROM PermissionSetAssignment WHERE PermissionSet.Name = 'File_Inward_Permission_Set' LIMIT 1];

                if( !listPermissionSet.isEmpty() ){
                    userId = listPermissionSet[0].AssigneeId;
                }
            }
            if( userId == Null ){

                msg= 'No Applicable Disbursal Author user found.';
                return msg;
            }else{

                update new Application__c(Id = apptId, OwnerId = userId);
                List<CustomNotificationType > TemplateInfoDetail = [SELECT Id, DeveloperName FROM CustomNotificationType WHERE DeveloperName='Verification_Notification'];

                Messaging.CustomNotification currNotification = new Messaging.CustomNotification();

                currNotification.setTitle('Application Assigend.' );
                currNotification.setBody('Application has been assigned to you.');
                currNotification.setNotificationTypeId(TemplateInfoDetail[0].Id);

                currNotification.setTargetId(apptId);
                currNotification.send(new Set<String>{userId});

            }

        } catch (Exception e) {


            msg = e.getMessage();
        }
        return msg;
    }

    /*
     * Karan Singh : 02/09/2022 : This method will update the Stage of the application base on defferal condition.
     *             : 10-09-2022 : CH01 : object is changed for deferral logic
     */
    @AuraEnabled
    public static String updateApptStageFromDA( String apptId){

        String msg = 'Success';
        try{

            /*List<ContentVersion> listCntnVrsnDefferal =  [ SELECT Id FROM ContentVersion
                                                             WHERE Deferal_Stage__c = 'Post Disbursement' AND Parent_Id__c =: apptId LIMIT 1];*/

            List<Deferral_Document__c> listDeffDoc = [ SELECT Id FROM Deferral_Document__c
                                                        WHERE Is_Deferral_Document__c = TRUE
                                                        AND Application__c =: apptId LIMIT 1 ];

            Application__c objAppt = new Application__c();
            objAppt.Id = apptId;
            //objAppt.Stage__c = listCntnVrsnDefferal.isEmpty() ? 'Custody' : 'Document Deferral';
            objAppt.Stage__c = listDeffDoc.isEmpty() ? 'Custody' : 'Document Deferral';
            update objAppt;
            if( objAppt.Stage__c == 'Custody'){
                msg = allocateUser( objAppt.Stage__c, objAppt.Id);
            }

        }catch (Exception e) {


            msg = e.getMessage();
        }
        return msg;
    }


    /**
    * @description : Will be used in DA, check if any pending deviaiton is there or not.
    * @author Karan Singh Soni | 17-09-2022
    * @param apptId
    * @return DisbursalCompWrap
    **/
    @AuraEnabled
    public static DisbursalCompWrap chechExistDeviaitons( String apptId ){

        DisbursalCompWrap objDisbursalCompWrap = new DisbursalCompWrap();

        if( apptId == Null ){

            objDisbursalCompWrap.statusCode = 400;
            objDisbursalCompWrap.message = 'Invalid application Id';
            return objDisbursalCompWrap;
        }
        List < TR_Deviation__c > listDeviation = [ SELECT Id FROM  TR_Deviation__c
                                                    WHERE Application__c =: apptId AND Is_Deviation_Active__c = TRUE
                                                    AND Decistion__c != 'Approved'
                                                    LIMIT 1];

        if( listDeviation.isEmpty() ){
            objDisbursalCompWrap.statusCode = 200;
        }else{
            objDisbursalCompWrap.statusCode = 400;
            objDisbursalCompWrap.message = 'All Deviations are not approved.';
        }
        return objDisbursalCompWrap;
    }
    //objDisbursal will be any type of object
    //base64, filename,prntRecordId will be used to create file under the prntRecordId. if prntRecordId is blank then it means the parent will be objDisbursal object
    @AuraEnabled
    public static DisbursalCompWrap saveDisbursalCompData( Sobject objDisbursal, String base64, String filename, String prntRecordId ){

        DisbursalCompWrap objDisbursalCompWrap = new DisbursalCompWrap();

        if( objDisbursal == Null ){

            objDisbursalCompWrap.statusCode = 400;
            objDisbursalCompWrap.message = 'Invalid Data to Save.';
            return objDisbursalCompWrap;
        }

        try{

            System.debug( objDisbursal );
            upsert objDisbursal;

            //if prntRecordId is blank it means the above record will be the parent
            if( String.isNotBlank(base64) && String.isNotBlank(filename) ){

                ContentVersion objContntVrsn = new ContentVersion();
                objContntVrsn.VersionData = EncodingUtil.base64Decode(base64);
                objContntVrsn.FirstPublishLocationId = String.isNotBlank(prntRecordId) ? prntRecordId : objDisbursal.Id;
                objContntVrsn.Title = filename;
                objContntVrsn.PathOnClient = filename;
                objContntVrsn.PathOnClient = filename;
                objContntVrsn.Parent_Id__c = objContntVrsn.FirstPublishLocationId;

                insert objContntVrsn;
                system.debug( 'objContntVrsn id ' + objContntVrsn.Id );
            }
            objDisbursalCompWrap.statusCode = 201;
            objDisbursalCompWrap.message = 'Data saved successfully.';

        } catch (Exception e) {

            objDisbursalCompWrap.statusCode = 500;
            objDisbursalCompWrap.message = e.getMessage();
        }
        return objDisbursalCompWrap;
    }
    public class DisbursalCompWrap{
        @AuraEnabled public Application__c objAppt;
        @AuraEnabled public Sobject objSobject;
        @AuraEnabled public Integer statusCode;
        @AuraEnabled public String  message;
        @AuraEnabled public Map<String,String> mapExtraParams = new Map<String,String>();
        @AuraEnabled public String  disbMetaPrefix;
        @AuraEnabled public List<Sobject> listSObject = new List<Sobject>();
        @AuraEnabled public String sObjectListType;
    }
}