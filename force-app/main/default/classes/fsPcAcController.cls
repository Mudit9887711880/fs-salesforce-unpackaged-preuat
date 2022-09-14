/**
* @File Name          : fsPcAcController.cls
* @Description        : Service Class For FS PC/AC Screen Lightning Web Component
* @Author             : Ajay Kumar
* @Created On         : 22/06/2022
*==============================================================================
* Ver         Date                     Author                 Modification
*==============================================================================
* 1.0         22/06/2022              Ajay Kumar             Initial Version
*/
public without sharing class fsPcAcController {
    
    public fsPcAcController() {
        
    }
    
    // This method is used to fetch the Effective IRR 
    @AuraEnabled
    public static effIrrWrapper getEffectiveIRR(String appId,Integer Tenure,String loanType,String numofEmi)
    {
        effIrrWrapper wrapObj = new effIrrWrapper();
        Boolean MultipleProperties = false;
        
        if(numofEmi!= null)
        {
            numofEmi = numofEmi+' Advance EMI'; 
        }
        System.debug('numofEmi'+numofEmi);
        system.debug('tenor'+Tenure);
        System.debug('loanType'+loanType);
        
        List<MS_IRR__c> effectiveList = new List<MS_IRR__c>();
        String mQuery = 'SELECT Eff_IRR__c, Rate__c, Tenure__c, Type_of_loan__c, EMI__c FROM MS_IRR__C WHERE Name =:numofEmi AND Tenure__c=:Tenure ';  
        Integer vacantcount = 0,	residentialCount=0,commercialCount = 0;
        List<Property__c> propertyList=[SELECT ID,Name,Type_Of_Property__c FROM Property__c WHERE Application__c =:appId AND RecordType.Name ='PC Property Detail'];
        if(propertyList.size()>1)
        {
            for(Property__c proObj: propertyList)
            {
                if(proObj.Type_Of_Property__c != null)
                {
                    MultipleProperties = true;
                    if(proObj.Type_Of_Property__c == 'Vacant Land')
                        vacantcount++;
                    else if(proObj.Type_Of_Property__c == 'Residential')
                        residentialCount++;
                    else if(proObj.Type_Of_Property__c == 'Commercial')
                        commercialCount++;
                }
            }          
        }
        else if(propertyList.size()==1 )
        {
            for(Property__c propObj:propertyList)
            {
                if(propObj.Type_Of_Property__c == 'Vacant Land')
                {
                    wrapObj.isSamePropertyType = true;
                    mQuery +=' AND Property_Type__c =\'Vacant land\' LIMIT 1';
                }
                else
                {
                    wrapObj.isSamePropertyType = true;
                    mQuery +=' AND Type_of_Loan__c =:loanType LIMIT 1';
                }
            }
        }
        
        if(MultipleProperties)
        {
            if(vacantcount == propertyList.size() )
            {
                wrapObj.isSamePropertyType = true;
                mQuery +=' AND Property_Type__c =\'Vacant land\' LIMIT 1'; 
            }
            else if(residentialCount == propertyList.size() || commercialCount == propertyList.size())
            {
                wrapObj.isSamePropertyType = true;
                mQuery +=' AND Type_of_Loan__c =:loanType LIMIT 1';
            }
            else
            {	
                wrapObj.isSamePropertyType = false;
                system.debug('different property  type');
                mQuery +=' AND Type_of_Loan__c =:loanType LIMIT 1';
            }
        }
        
        System.debug('mQUery'+mQuery);       
        effectiveList = Database.query(mQuery);
        System.debug('effectiveList'+effectiveList);
        if(effectiveList!= null && effectiveList.size()>0 )
        { 
            if(effectiveList[0].Rate__c !=null  && effectiveList[0].Eff_IRR__c != null)
            {
                wrapObj.Rate = effectiveList[0].Rate__c;
                wrapObj.EffIrr = effectiveList[0].Eff_IRR__c;
            }
        } 
        
        return wrapObj;         
    }
    
    
    // This Method is used to update the status of PC Stage when AC Send back to PC Stage
    @AuraEnabled 
    public static void sendBackUpdate(String appId)    
    {
        Verification__c verObj = new Verification__c();
        for(Verification__c verificationObj : [SELECT Id,Status__c FROM Verification__c WHERE Application__c =:appId AND RecordType.Name = 'PC' AND Status__c!='Pending' ORDER BY CreatedDate DESC ])
        {
            verObj.Id = verificationObj.Id;
            verObj.Status__c = 'Pending';                
        }
        System.debug('Verification List>>>> '+verObj);        		
        if(verObj.Id!= null)
            update verObj;
    }
    
    // This Method is Used to get All AC Users From Public Group as per Branch
    @AuraEnabled
    public static List<User_Branch_Allocation__c> getACUsers(String SourcingBranch)
    {
        List<User_Branch_Allocation__c> userList = new List<User_Branch_Allocation__c>();
        for(User_Branch_Allocation__c uObj:[SELECT Id,User__c,User__r.Name,Branch_Master__c FROM User_Branch_Allocation__c WHERE USER__c IN (select userorgroupid from groupmember where group.name = 'AC Users Group') AND Branch_Master__c=:SourcingBranch])
        {
            userList.add(uObj);
        } 
        
        return userList;
    }   
    
    // This method is used to fetch all the Properties List under an Application
    @AuraEnabled
    public static List<Property__c> getProperties(String appId)
    {
        List<Property__c> propertyList=[SELECT ID,Name FROM Property__c WHERE Application__C =:appId];
        return propertyList;
    }
    
    // This method is used to fetch all the Applicants List under an Application
    @AuraEnabled 
    public static List<Loan_Applicant__c> getAccounts(String appId)
    {
        List<Loan_Applicant__c> LALIst=[SELECT ID,Customer_Information__r.Name,Customer_Type__c FROM Loan_Applicant__c WHERE Application__C =:appId];
        return LALIst;
    }
    
    // This Method Is Used To Return Applicant Map For Particular Application
    @AuraEnabled
    public static Map<Id,Loan_Applicant__c> getApplicantList(String appId){
        return new Map<Id,Loan_Applicant__c>([SELECT Id, Application__c, Customer_Information__c, Customer_Information__r.Name, Customer_Type__c FROM Loan_Applicant__c WHERE Application__c =: appId  ]);
    }   
    
    /*
* Added By Yogendra Degra
* Date : 04/08/2022
* Cloned Functionality Start Here
*/
    public static void clonedPCRecordToAC(String appId,String verfId){
        //Character Record Clone//
        List<Character__c> listOfChar = new List<Character__c>();
        Set<String> setOfCharIds = new Set<String>();
        String AC_CHAR_RECORD_TYPE = Utility.AC_CHARACTER_RECORD_TYPE_ID;
        for(Character__c objChar : [SELECT Id, Application__c FROM Character__c WHERE Application__c =: appId AND RecordTypeId =: Utility.PC_CHARACTER_RECORD_TYPE_ID]){
            setOfCharIds.add(objChar.Id);       
        }
        if(setOfCharIds != null && setOfCharIds.size() > 0){
            for(Character__c objChar : (List<Character__c>)Utility.doClone(setOfCharIds, 'Character__c', true)){
                objChar.RecordTypeId = AC_CHAR_RECORD_TYPE;
                objChar.Verification__c = verfId;
                listOfChar.add(objChar.clone(false, false, false, false));
            }    
        }
        System.debug('listOfChar ###'+listOfChar);
        if(listOfChar != null && listOfChar.size() > 0)
            insert listOfChar;
        
        //Property Record Clone//
        List<Property__c> listOfProperty = new List<Property__c>();
        Set<String> setOfProIds = new Set<String>();
        String AC_PRO_REOCRD_TYPE = Utility.AC_PROPERTY_RECORD_TYPE_ID;
        for(Property__c objPro : [SELECT Id, Application__c,Property__c FROM Property__c WHERE Application__c =: appId AND RecordTypeId =: Utility.PC_PROPERTY_RECORD_TYPE_ID]){
            setOfProIds.add(objPro.Id);     
        }
        if(setOfProIds != null && setOfProIds.size() > 0){
            for(Property__c objPro : (List<Property__c>)Utility.doClone(setOfProIds, 'Property__c', true)){
                objPro.RecordTypeId = AC_PRO_REOCRD_TYPE;    
                listOfProperty.add(objPro.clone(false, false, false, false));
            }    
        }
        System.debug('listOfProperty ### '+listOfProperty);
        if(listOfProperty != null && listOfProperty.size() > 0)
            insert listOfProperty;
        
        //Capability Record Clone//
        List<Capability__c> listOfCapability = new List<Capability__c>();
        Set<String> setOfCaPIds = new Set<String>();
        String AC_CAP_REOCRD_TYPE = Utility.AC_CAPABILITY_RECORD_TYPE_ID;
        Set<String> loanApplicantId = new Map<String,SObject>([SELECT Id FROM Loan_Applicant__c  WHERE Application__c =: appId]).keySet();
        if(loanApplicantId != null && loanApplicantId.size() > 0){
            for(Capability__c objPro : [SELECT Id FROM Capability__c WHERE Loan_Applicant__c IN: loanApplicantId AND RecordTypeId =: Utility.PC_CAPABILITY_RECORD_TYPE_ID]){
                setOfCaPIds.add(objPro.Id);     
            }
            if(setOfCaPIds != null && setOfCaPIds.size() > 0){
                for(Capability__c objCap : (List<Capability__c>)Utility.doClone(setOfCaPIds, 'Capability__c', true)){
                    objCap.RecordTypeId = AC_CAP_REOCRD_TYPE; 
                    objCap.Verification__c = verfId;
                    listOfCapability.add(objCap.clone(false, false, false, false));
                }    
            }
            System.debug('listOfCapability ### '+listOfCapability);
            if(listOfCapability != null && listOfCapability.size() > 0)
                insert listOfCapability;
            System.debug('listOfCapability ### ### '+listOfCapability[0].Id);
        }
        
    }
    // This method is used to Finish the PC/AC stage
    @AuraEnabled
    public static void handleFinish(String appId,String stage,String verfId,String DecisionValue)
    {
        
        // get the AC User from Application
        Application__c appObj = [SELECT Id,Name,AC_User__c  FROM Application__c WHERE Id =:appId LIMIT 1];
        if(stage == 'PC'){           
            Verification__c pcverObj = new Verification__c();
            pcverObj.Id = verfId;
            pcverObj.Application__c = appId;
            pcverObj.Status__c ='Completed';
            update pcverObj;           
            
            List<Verification__c> verObjList=[SELECT ID FROM Verification__c WHERE RecordType.Name = 'AC' AND Application__c =:appId LIMIT 1];
            if(verObjList.isEmpty())
            {              
                Verification__c verObj = new Verification__c();
                verObj.RecordTypeId = Schema.SObjectType.Verification__c.getRecordTypeInfosByName().get('AC').getRecordTypeId();
                verObj.Application__c = appId;
                insert verObj;
                
                String recTypeName = Schema.getGlobalDescribe().get('Verification__c').getDescribe().getRecordTypeInfosById().get(verObj.RecordTypeId).getName();  
                
                // send notification and create Task
                Utility.createTask(UserInfo.getName()+' has assigned you a task',null,verObj.id,verObj.OwnerId,null,'Approval Credit Case has been assigned to you',true);   
                if(appObj.AC_User__c != null)				
                    Utility.sendNotification(UserInfo.getName()+' has assigned you a task',appObj.Name +' :: '+ recTypeName ,verObj.id,'Verification_Notification',appObj.AC_User__c);
                clonedPCRecordToAC(appId,verObj.Id);
            } 
        }
        else if(stage == 'AC')
        {
            
            Verification__c acverObj = new Verification__c();
            acverObj.Id = verfId;
            acverObj.Application__c = appId;
            if(DecisionValue == 'Approve')
            { acverObj.Status__c ='Completed';}
            update acverObj;
            
            if(DecisionValue == 'Recommend to Another AC')
            {
                String recTypeId = Schema.SObjectType.Verification__c.getRecordTypeInfosByName().get('AC').getRecordTypeId();
                String recTypeName = Schema.getGlobalDescribe().get('Verification__c').getDescribe().getRecordTypeInfosById().get(recTypeId).getName();                 
                // send notification and create Task
                Utility.createTask(UserInfo.getName()+' has assigned you a task',null,acverObj.id,acverObj.OwnerId,null,'Approval Credit Case has been recommended to you',true);   
                if(appObj.AC_User__c != null)				
                    Utility.sendNotification(UserInfo.getName()+' has assigned you a task',appObj.Name +' :: '+ recTypeName ,acverObj.id,'Verification_Notification',appObj.AC_User__c);
            }
            
        }       
    }
    
    // This method is used to get  the PC character Id
    @AuraEnabled
    public static String getpccharacterId(String recordId)
    {
        List<Character__c> charList = [SELECT Id FROM Character__c WHERE PC_FIV_C_Relationship__c =:recordId AND RecordType.Name='PC Character' LIMIT 1];
        if(charList.size()>0)
        {   return charList[0].Id; }
        return null;        
    }
    
    // This method is used to get  the PC/AC Property Id
    @AuraEnabled
    public static String getpcpropertyId(String recordId)
    {
        String propertyId;
        Boolean acPresent = false;
        List<Property__c> propList = [SELECT Id,RecordType.Name,Application__c,FIVC_PC_Relationship__c,Property__c,Title_Deed_Number__c,Document_Type__c,Month__c,Title_Deed_Year__c,Mortgage_Property_Area__c,Land_Area_Sq_Ft__c,Valuation_Market_Value_Per_SqFt__c,Final_Land_Value__c,Building_Type__c,
                                      Land_Ownership__c,Building_Ownership__c,Property_Surrounding__c,Property_Type__c,Mortgage_property_distance_from_branch__c,Pathway_Available__c,Boundries_Remarks__c,Mortgage_Property_Remarks__c,Overall_Land_Remarks__c,Building_Floor__c,Building_Area_Sq_Ft__c,
                                      Mortgage_property_Living_property_are__c,Person_residing_at_Mortgage_property__c,Living_property_Distance_from_Branch__c,Remarks__c,Boundaries_As_Per_Inspection_Are_Same__c,Land_area_valuation_remarks__c,Building_Value_per_Sq_ft__c,Building_Value__c,Building_Age__c,
                                      Building_Constructed_with_Remarks__c,Is_living_property_is_own_property__c,Living_property_Pincode__c,Overall_Remarks__c,Landmark__c,Login__c FROM Property__c WHERE  FIVC_PC_Relationship__c =:recordId AND RecordType.Name IN ('PC Property Detail','AC Property Detail')];
        if(propList.size()>0)
        {   for(Property__c pObj:propList)
        {
            if(pObj.RecordType.Name == 'AC Property Detail')
            {   system.debug('ac called');
             propertyId= pObj.Id;
             acPresent = true;
            }
        }
        }
        if(propList.size()>0 && !acPresent)
        { 
            for(Property__c pObj:propList)
            {
                if(pObj.RecordType.Name == 'PC Property Detail')
                {   
                    system.debug('pc called');
                    Property__c acProperty = pObj.clone(false,false,false,false);
                    system.debug('acProperty >>>>'+acProperty);
                    acProperty.RecordTypeId = Schema.SObjectType.Property__c.getRecordTypeInfosByName().get('AC Property Detail').getRecordTypeId();
                    acProperty.Application__c = pObj.Application__c;
                    acProperty.Login__c = pObj.Login__c;
                    acProperty.FIVC_PC_Relationship__c = pObj.FIVC_PC_Relationship__c;
                    acProperty.Property__c = pObj.Property__c;  
                    insert acProperty;
                    propertyId = acProperty.Id;
                }
            }
        }
        system.debug('propertyId'+propertyId);
        return propertyId;        
    }
    
    
    // This method is used to get  the PC/AC Capability Id
    @AuraEnabled
    public static String getpccapabilityId(String recordId)
    {
        String capId;
        Boolean acPresent = false;
        List<Capability__c> capList = [SELECT Id,RecordType.Name,Loan_Applicant__c,Income_segment__c,Subsegment__c,Day_Margin_Basis__c,Name_of_the_Employer__c,PC_FIV_C_Relationship__c,
                                       Year_of_Service_With_Employer__c,Nature_of_Job__c,Total_Work_Experience__c,Monthly_Salary__c,Mode_of_Salary__c,of_income_transacted_through_bank_acco__c,
                                       Overall_Remarks__c,Employment_Document_Proof__c,Nature_of_Document_Proof__c,Other_Confirmations__c,  IncomePincode__c,Rental_Form__c,
                                       No_of_Units__c,Rental_Income__c,Remarks__c,Rental_Property_Owner_name__c,Rental_income_property_address__c,Proof__c,Proof_of_Ownership__c,
                                       FC_Enquiry_with__c,Year_of_Occupation__c,Proof_Remarks__c,Income_per_day__c,Number_of_days__c,
                                       Assumptions_for_Income__c,Gross_Monthly_Income__c,Reference_Name__c,Income_reference_Contact_Number__c,Feedback__c,Income_per_month__c,
                                       Income_Remarks__c,Spouse_alive__c,Other_Confirmations_Daily_Wages__c,Income_reference_name__c,Ownership_document_proof__c,Overall_Remarks_Regarding_Business__c,
                                       Sales_per_day__c,Sales_per_month__c,Margin__c,Margin_in_amount__c,Electricity__c,Salary__c,Rent__c,Others__c,Business_name__c,Business_Nature__c,Year_of_Business__c,
                                       Total_experience_in_this_business_yrs__c,Nature_of_Ownership__c,Nature_of_Ownership_Proof__c,regular_business_activity__c,BusinessPincode__c
                                       FROM Capability__c WHERE     PC_FIV_C_Relationship__c =:recordId AND RecordType.Name IN ('PC Capability','AC Capability')];
        if(capList.size()>0)
        {   for(Capability__c cObj:capList)
        {
            if(cObj.RecordType.Name == 'AC Capability')
            {   system.debug('ac called');
             capId= cObj.Id;
             acPresent = true;
            }
        }
        }
        if(capList.size()>0 && !acPresent)
        { 
            for(Capability__c cObj:capList)
            {
                if(cObj.RecordType.Name == 'PC Capability')
                {   
                    system.debug('pc called');
                    Capability__c acCapability = cObj.clone(false,false,false,false);
                    system.debug('acCapability >>>>'+acCapability);
                    acCapability.RecordTypeId = Schema.SObjectType.Capability__c.getRecordTypeInfosByName().get('AC Capability').getRecordTypeId();
                    acCapability.PC_FIV_C_Relationship__c = cObj.PC_FIV_C_Relationship__c;
                    acCapability.Loan_Applicant__c = cObj.Loan_Applicant__c;
                    acCapability.Income_segment__c = cObj.Income_segment__c;
                    acCapability.Subsegment__c = cObj.Subsegment__c;
                    acCapability.Day_Margin_Basis__c = cObj.Day_Margin_Basis__c;
                    
                    insert acCapability;
                    capId = acCapability.Id;
                }
            }
        }
        system.debug('capId'+capId);
        return capId;        
    } 
    
    // This method is used to get the Bureau document for the loan Applicant Id
    @AuraEnabled
    public static String getBureauDocument(String loanApplicantId)
    {
        System.debug('loan Applicant Id>>'+loanApplicantId);
        Id contentId;
        List<ContentVersion> cvIds= [SELECT Loan_Applicant__c,isBureauReport__c,ContentDocumentId FROM ContentVersion WHERE  Loan_Applicant__c =:loanApplicantId AND isBureauReport__c =true ORDER BY CreatedDate LIMIT 1];
        if(cvIds.size()>0)
            contentId = cvIds[0].ContentDocumentId;
        if(contentId!= null)
        {   
            System.debug('contentdocument Id'+contentId);
            return contentId;
        }    
        else 
        {
            System.debug('false');
            return 'false';
        }        
    }
    
    // This method is used to get the Insurance Premium for the PC/AC from Insurance Component
    @AuraEnabled
    public static Decimal getInsurancePremium(String applicationId)
    {
        Decimal TotalPremium = 0;
        for(Fee_Creation__c InsuranceObj : [SELECT Id,Premium__c,Total_Fee__c,Tax_Amount__c FROM Fee_Creation__c WHERE RecordType.Name = 'Insurance' AND Application__c=:applicationId])
        {
            if(InsuranceObj.Total_Fee__c!= null)
                TotalPremium+=InsuranceObj.Total_Fee__c;
        }
        
        return TotalPremium;
    }
    
    
    // This Method is used to fetch the records for Character DataTable
    @AuraEnabled
    public static GenericDataTableController.DataTableResponse getCharacterTabRecords(String appId, String metadataName ,String sectionName,string recType){
        Set<String> loanApplicantIds = new Set<String>();
        for(Loan_Applicant__c loanApplicant : [SELECT Id, Customer_Information__c FROM Loan_Applicant__c WHERE Application__c =: appId]){
            loanApplicantIds.add(loanApplicant.Id);
        }
        String rcId;
        system.debug('verfId'+appId);
        if(recType=='PC')
            rcId = Schema.getGlobalDescribe().get('Character__c').getDescribe().getRecordTypeInfosByName().get('PC Character').getRecordTypeId();
        else if(recType=='AC')
            rcId = Schema.getGlobalDescribe().get('Character__c').getDescribe().getRecordTypeInfosByName().get('AC Character').getRecordTypeId();   
        GenericDataTableController genericDTObj = new GenericDataTableController();
        genericDTObj.METADATA_NAME = metadataName;
        genericDTObj.IDS_SET = loanApplicantIds;
        genericDTObj.IDS_SET.add(rcId);
        genericDTObj.IDS_SET.add(sectionName);
        genericDTObj.WHERE_CLAUSE = 'Loan_Applicant__c IN:IDS_SET  AND RecordTypeId IN : IDS_SET AND Section_Type__c IN : IDS_SET';
        return genericDTObj.getTable();
    }
    
    // This Method is used to fetch the records for Property DataTable
    @AuraEnabled
    public static List<Property__c> getCollateralSummary(String applicationId,String recTypeName){
        String rcId = Schema.getGlobalDescribe().get('Property__c').getDescribe().getRecordTypeInfosByName().get(recTypeName).getRecordTypeId();
        List<Property__c> propertyList = new List<Property__c>();
        propertyList = [SELECT Id, Name, Land_Area_Sq_Ft__c, Valuation_Market_Value_Per_SqFt__c,
                        Building_Area_Sq_Ft__c,Building_Value_per_Sq_ft__c,Building_Value__c,Final_Land_Value__c
                        FROM Property__c
                        WHERE Application__c =: applicationId
                        AND RecordTypeId =: rcId];
        
        return propertyList;
    }
    
    // This Method is used to Calculate the Total Building Value
    @AuraEnabled
    public static Decimal GetBuildingTotalValue(String appId,String recordTypeName)
    {
        system.debug('appId'+appId);
        Decimal totalValue=0;
        for(Property__c pObj:[SELECT ID,Building_Value__c  FROM Property__c WHERE Application__c =:appId AND RecordType.Name =:recordTypeName])
        {
            system.debug('property total buidling value'+pObj.Building_Value__c);
            if(pObj.Building_Value__c!=null)
                totalValue+=pObj.Building_Value__c;
        }
        system.debug('total value'+totalValue);
        return totalValue;
    }
    
    // This method is used in Compare docs component of Carousal View for fetching the Documents for Comparision
    @AuraEnabled(cacheable=true)
    public static List<ContentVersion> getDocumentPublicList(String appId, String propertyId, String applicantId, String type){
        List<ContentVersion> imgList = new List<ContentVersion>();
        String docQuery= 'SELECT Id, Uploaded_From__c,ContentDocumentId, Title, FileType, FileExtension, ContentSize FROM ContentVersion WHERE Parent_Id__c =:appId';
        if(type == 'Asset')
        {
            docQuery+=' AND Current_Record_Id__c =:propertyId'; 
        }
        else if(type == 'Applicant')
        {
            docQuery+=' AND Current_Record_Id__c =:applicantId';
        } 
        imgList = Database.query(docQuery);
        return imgList;
    }
    
    // this method is used to fetch the recordTypeId
    @AuraEnabled(cacheable=true)
    public static  Id getRecordTypeId(String objName,String recordTypeName)
    {
        return Schema.getGlobalDescribe().get(objName).getDescribe().getRecordTypeInfosByName().get(recordTypeName).getRecordTypeId();
        
    }
    
    // This method is used to compare the Property Land Area And Value Field Values of FIV-B and FIV-C
    @AuraEnabled(cacheable=true)
    public static String  ComparePropertyValues(String parentPropertyId)
    {   
        Map<String,Property__c> proMap=new Map<String,Property__c>();
        for(Property__c proObj:[SELECT Id,Property__c,RecordTYpe.Name,Land_Area_Sq_Ft__c,Land_Measurement_total_area__c,Valuation_Market_Value_Per_SqFt__c,Value_per_sq_ft__c FROM Property__c WHERE Property__c=:parentPropertyId AND RecordTYpe.Name IN('FIV-B Property Detail','FIV-C Property Detail')])
        {
            proMap.put(proObj.RecordTYpe.Name,proObj);
        }
        system.debug('promap>>>>'+proMap);
        LandValueWrapper wrapObj= new LandValueWrapper();
        if(proMap.containsKey('FIV-B Property Detail') && proMap.containsKey('FIV-B Property Detail'))
        { 
            wrapObj.Land_Area = Math.min(proMap.get('FIV-B Property Detail').Land_Area_Sq_Ft__c,proMap.get('FIV-C Property Detail').Land_Measurement_total_area__c ) ; 
            wrapObj.Market_Value = Math.min(proMap.get('FIV-B Property Detail').Value_per_sq_ft__c, proMap.get('FIV-C Property Detail').Valuation_Market_Value_Per_SqFt__c);
        }
        system.debug('promapWRapper>>>>'+wrapObj);
        return JSON.serialize(wrapObj);
    }
    
    // This method is used to compare the Property Building Area And Value Field Values of FIV-B and FIV-C
    @AuraEnabled(cacheable=true)
    public static String  CompareBuildingValues(String parentPropertyId)
    {   
        Map<String,Property__c> proMap=new Map<String,Property__c>();
        for(Property__c proObj:[SELECT Id,Property__c,RecordType.Name,Building_Value_per_Sq_ft__c,Building_Area_Sq_Ft__c,Area_value_per_Sq_ft__c,Value_per_sq_ft__c FROM Property__c WHERE Property__c=:parentPropertyId AND RecordTYpe.Name IN('FIV-B Property Detail','FIV-C Property Detail')])
        {
            proMap.put(proObj.RecordTYpe.Name,proObj);
        }
        system.debug('promap>>>>'+proMap);
        BuildingValueWrapper wrapObj= new BuildingValueWrapper();
        if(proMap.containsKey('FIV-B Property Detail') && proMap.containsKey('FIV-B Property Detail'))
        { 
            wrapObj.Building_Area = Math.min(proMap.get('FIV-B Property Detail').Building_Area_Sq_Ft__c,proMap.get('FIV-C Property Detail').Area_value_per_Sq_ft__c ) ; 
            wrapObj.Building_Value = Math.min(proMap.get('FIV-B Property Detail').Building_Value_per_Sq_ft__c, proMap.get('FIV-C Property Detail').Value_per_sq_ft__c);
        }
        system.debug('promapWRapper>>>>'+wrapObj);
        return JSON.serialize(wrapObj);
    } 
    
    // method used to check all the Validations on Submit Button
    @AuraEnabled 
    public static PCValidationWrapper checkPCValidation(String verfId,String appId)
    {
        PCValidationWrapper validationWrapObj = new PCValidationWrapper();
        characterValidationWrapper charWrapObj = new characterValidationWrapper();
        for(Verification__c verObj :[SELECT ID,(SELECT ID,Section_Type__c FROM Characters__r WHERE RecordType.Name='PC Character' AND Verification__c =:verfId AND Section_Type__c IN ('Family Detail',
                                                                                                                                                                                       'Neighbour Detail','Affiliation Detail','Living Standard Detail')) FROM Verification__c WHERE Id=:verfId AND Application__c =:appId])
        {
            for( Character__c charObj: verObj.Characters__r)
            { if(charObj.Section_Type__c == 'Family Detail')
                charWrapObj.familyDetail = false;
             else if(charObj.Section_Type__c == 'Neighbour Detail')
                 charWrapObj.NeighbourDetail = false;
             else if(charObj.Section_Type__c == 'Affiliation Detail')
                 charWrapObj.AffiliationDetail = false;
             else if(charObj.Section_Type__c == 'Living Standard Detail')
                 charWrapObj.LivingStandardDetail = false;
            }
        }
        
        collateralValidationWrapper colWrapObj = new collateralValidationWrapper();
        for(Property__c proObj:[SELECT Id,  Title_Deed_Number__c,Document_Type__c,Pathway_Available__c ,Mortgage_Property_Area__c,isPrimaryOwner__c,Type_Of_Property__c,
                                Building_Age__c,Building_Type__c,RecordType.Name,Created_From__c FROM Property__c WHERE Application__c =:appId AND RecordType.Name IN ('PC Property Detail','Pre Login Property Detail')])
        {
            if(proObj.RecordType.Name == 'PC Property Detail')
            {
                if(proObj.Title_Deed_Number__c!= null&& proObj.Document_Type__c !=null)
                    colWrapObj.PropertyDetails = false;
                if(proObj.Pathway_Available__c!=null && proObj.Mortgage_Property_Area__c !=null)
                    colWrapObj.LandArea = false;
                if(proObj.Type_Of_Property__c != 'Vacant Land')
                {
                    if(proObj.Building_Age__c!=null && proObj.Building_Type__c !=null)
                        colWrapObj.BuildingValuation = false;
                }
            }
            else if(proObj.RecordType.Name == 'Pre Login Property Detail' && proObj.Created_From__c == 'Process Credit')
            {
                validationWrapObj.isPropertyAdded = true;
            }
            else if(proObj.RecordType.Name == 'Pre Login Property Detail' && proObj.isPrimaryOwner__c)
            {
                validationWrapObj.isPrimaryOwner = true;
            }
        }
        
        List<Loan_Applicant__c> loanObjList = [SELECT Id ,Customer_Information__r.Name, Created_From__c,Mobile_Verified__c,Is_KYC_Verified__c FROM Loan_Applicant__c WHERE  Application__c=:appId];
        if(loanObjList.size()>0)
        {    for(Loan_Applicant__c laObj:loanObjList)
        {
            if(laObj.Created_From__c == 'Process Credit')
            { 
                validationWrapObj.isLoanApplicantAdded = true;
                
            }
            if(laObj.Mobile_Verified__c == false)
            {
                validationWrapObj.mobileverificationList.add(laObj.Customer_Information__r.Name);
            }
            if(laObj.Is_KYC_Verified__c == false)
            {
                validationWrapObj.kycVerificationList.add(laObj.Customer_Information__r.Name);
            }
        } 
        }
        
        
        List<Capability__c> capList=[SELECT Id FROM Capability__c WHERE Verification__c=:verfId AND RecordType.Name ='PC Capability'];
        if(capList.size()>0)
            validationWrapObj.capabilityValidation = true;
        
        for( Verification__c verObj : [SELECT Id,Initiate_From__c,Status__c,RecordType.Name,Application__r.PC_Decision__c FROM Verification__c WHERE RecordType.Name IN ('FIV - C','FIV - B','Online EC')  AND Application__c=:appId])
        {
            if(verObj.Initiate_From__c =='Process Credit')
            {
                if(verObj.RecordType.Name == 'FIV - C')
                {  validationWrapObj.isfivcInitiated = true;}
                if(verObj.RecordType.Name == 'FIV - C' && verObj.Status__c == 'Completed')
                {  validationWrapObj.isfivcCompleted = true;  }
                if(verObj.RecordType.Name == 'FIV - B')
                {  validationWrapObj.isfivbInitiated = true;}
                if(verObj.RecordType.Name == 'FIV - B' && verObj.Status__c == 'Completed')
                {  validationWrapObj.isfivbCompleted = true;  }
                if(verObj.RecordType.Name == 'Online EC')
                {  validationWrapObj.isonlineECinitiated = true;}
                if(verObj.RecordType.Name == 'Online EC' && verObj.Status__c == 'Completed')
                {  validationWrapObj.isonlineECCompleted = true;  }
            }
        }
        
        financialValidationWrapper finWrapObj =new financialValidationWrapper(); 
        for( Application__c appObj:[SELECT Id, Loan_Purpose_2__c ,  Balance_Transfer__c,Balance_Transfer_Amount__c,Total_Net_income_for_Tranche_2__c,   Final_Collateral_value_for_Tranche_2__c,
                                    Name__c,    Nominee__c,Nach_Party__c,Amount_Recommended__c, Total_Net_Income__c,KYC_Risk_Rating__c,Discussion_done_with__c,Comment_Remarks__c FROM Application__c WHERE Id =:appId])
        {
            if(appObj.Loan_Purpose_2__c !=null)
                finWrapObj.ApplicationDetail = false;
            if(appObj.Balance_Transfer__c !=null && appObj.Balance_Transfer_Amount__c !=null)
                finWrapObj.LoanDetail = false;
            if(appObj.Total_Net_income_for_Tranche_2__c !=null && appObj.Final_Collateral_value_for_Tranche_2__c !=null)
                finWrapObj.TrancheDetail = false;
            if(appObj.Name__c !=null && appObj.Nominee__c !=null)
                finWrapObj.InsuranceDetail = false;
            if(appObj.Nach_Party__c !=null )
                finWrapObj.DisbursementDetail = false;
            if(appObj.Amount_Recommended__c !=null )
                finWrapObj.LoanAmtDetail = false;
            if(appObj.Total_Net_Income__c !=null )
                finWrapObj.EligibilityDetail = false;
            if(appObj.KYC_Risk_Rating__c !=null )
                finWrapObj.RiskDetail = false;
            if(appObj.Discussion_done_with__c !=null )
                finWrapObj.OtherDetail = false;
            if(appObj.Comment_Remarks__c !=null )
                finWrapObj.ExecutiveDetail = false;
            
        }
        
        validationWrapObj.charWrap = charWrapObj;
        validationWrapObj.colWrap = colWrapObj;
        validationWrapObj.finWrap = finWrapObj;
        return  validationWrapObj;
        
    }
    
    // method used to check all the Validations on Submit Button for Approval Credit
    @AuraEnabled 
    public static ACValidationWrapper checkACValidation(String verfId,String appId)
    {
        ACValidationWrapper validationWrapObj = new ACValidationWrapper();
        characterValidationWrapper charWrapObj = new characterValidationWrapper();
        for(Verification__c verObj :[SELECT ID,(SELECT ID,Section_Type__c FROM Characters__r WHERE RecordType.Name='AC Character' AND Verification__c =:verfId AND Section_Type__c IN ('Family Detail',
                                                                                                                                                                                       'Neighbour Detail','Affiliation Detail','Living Standard Detail')) FROM Verification__c WHERE Id=:verfId AND Application__c =:appId])
        {
            for( Character__c charObj: verObj.Characters__r)
            { if(charObj.Section_Type__c == 'Family Detail')
                charWrapObj.familyDetail = false;
             else if(charObj.Section_Type__c == 'Neighbour Detail')
                 charWrapObj.NeighbourDetail = false;
             else if(charObj.Section_Type__c == 'Affiliation Detail')
                 charWrapObj.AffiliationDetail = false;
             else if(charObj.Section_Type__c == 'Living Standard Detail')
                 charWrapObj.LivingStandardDetail = false;
            }
        }
        
        collateralValidationWrapper colWrapObj = new collateralValidationWrapper();
        for(Property__c proObj:[SELECT Id,  Title_Deed_Number__c,   Document_Type__c,Pathway_Available__c ,     Mortgage_Property_Area__c,isPrimaryOwner__c,Type_Of_Property__c,
                                Building_Age__c,Building_Type__c,RecordType.Name,Created_From__c,Building_Area_AC_Check__c,Land_Area_AC_Check__c,Property_Detail_AC_Check__c FROM Property__c WHERE Application__c =:appId AND RecordType.Name IN ('AC Property Detail','Pre Login Property Detail') ])
        {
            if(proObj.RecordType.Name == 'AC Property Detail')
            {
                if(proObj.Title_Deed_Number__c!= null&& proObj.Document_Type__c !=null && proObj.Property_Detail_AC_Check__c == true)
                    colWrapObj.PropertyDetails = false;
                if(proObj.Pathway_Available__c!=null && proObj.Mortgage_Property_Area__c !=null  && proObj.Land_Area_AC_Check__c == true)
                    colWrapObj.LandArea = false;
                if(proObj.Type_Of_Property__c != 'Vacant Land')
                {
                    if(proObj.Building_Age__c!=null && proObj.Building_Type__c !=null && proObj.Building_Area_AC_Check__c == true)
                        colWrapObj.BuildingValuation = false;
                }
            }
            else if(proObj.RecordType.Name == 'Pre Login Property Detail' && proObj.Created_From__c == 'Approval Credit')
            {
                validationWrapObj.isPropertyAdded = true;
            }
            else if(proObj.RecordType.Name == 'Pre Login Property Detail' && proObj.isPrimaryOwner__c)
            {
                validationWrapObj.isPrimaryOwner = true;
            }
        }
        
        List<Loan_Applicant__c> loanObjList = [SELECT Id ,Customer_Information__r.Name, Created_From__c,Mobile_Verified__c,Is_KYC_Verified__c FROM Loan_Applicant__c WHERE  Application__c=:appId];
        if(loanObjList.size()>0)
        {    for(Loan_Applicant__c laObj:loanObjList)
        {
            if(laObj.Created_From__c == 'Approval Credit')
            { 
                validationWrapObj.isLoanApplicantAdded = true;
                
            }
            if(laObj.Mobile_Verified__c == false)
            {
                validationWrapObj.mobileverificationList.add(laObj.Customer_Information__r.Name);
            }
            if(laObj.Is_KYC_Verified__c == false)
            {
                validationWrapObj.kycVerificationList.add(laObj.Customer_Information__r.Name);
            }
        } 
        }
        
        List<Capability__c> capList=[SELECT Id,Capability_AC_Check__c FROM Capability__c WHERE Verification__c=:verfId AND RecordType.Name ='AC Capability' AND Capability_AC_Check__c=true ];
        if(capList.size()>0)
            validationWrapObj.capabilityValidation = true;
        
        for( Verification__c verObj : [SELECT Id,Initiate_From__c,Status__c,RecordType.Name,Application__r.AC_Decision__c FROM Verification__c WHERE RecordType.Name IN ('FIV - C','FIV - B','Online EC') AND Application__c =:appId])
        {
            if(verObj.Initiate_From__c =='Approval Credit')
            {
                if(verObj.RecordType.Name == 'FIV - C')
                {  validationWrapObj.isfivcInitiated = true;}
                if(verObj.RecordType.Name == 'FIV - C' && verObj.Status__c == 'Completed')
                {  validationWrapObj.isfivcCompleted = true;  }
                if(verObj.RecordType.Name == 'FIV - B')
                {  validationWrapObj.isfivbInitiated = true;}
                if(verObj.RecordType.Name == 'FIV - B' && verObj.Status__c == 'Completed')
                {  validationWrapObj.isfivbCompleted = true;  }
                if(verObj.RecordType.Name == 'Online EC')
                {  validationWrapObj.isonlineECinitiated = true;}
                if(verObj.RecordType.Name == 'Online EC' && verObj.Status__c == 'Completed')
                {  validationWrapObj.isonlineECCompleted = true;  }               
            }
        }
        
        List<Legal_Approval__c> laList = new List<Legal_Approval__c>([SELECT Id,Status__c FROM Legal_Approval__c WHERE Application__c =: appId  LIMIT 1]);
        if(laList!= null && laList.size()>0)
        {
            for(Legal_Approval__c loanObj: laList)
            {
                if(loanObj.Status__c == 'Pending')
                    validationWrapObj.isLegalApprovalCompleted = false;
            }
            
        }
        else
            validationWrapObj.isLegalApprovalCompleted = false;
        
        financialValidationWrapper finWrapObj =new financialValidationWrapper(); 
        for( Application__c appObj:[SELECT Id, Loan_Purpose_2__c ,  Balance_Transfer__c,Balance_Transfer_Amount__c,Total_Net_income_for_Tranche_2__c,   Final_Collateral_value_for_Tranche_2__c,
                                    Name__c,    Nominee__c,Nach_Party__c,Amount_Recommended__c, Total_Net_Income__c,KYC_Risk_Rating__c,Discussion_done_with__c,Comment_Remarks__c FROM Application__c WHERE Id =:appId])
        {
            if(appObj.Loan_Purpose_2__c !=null)
                finWrapObj.ApplicationDetail = false;
            if(appObj.Balance_Transfer__c !=null && appObj.Balance_Transfer_Amount__c !=null)
                finWrapObj.LoanDetail = false;
            if(appObj.Total_Net_income_for_Tranche_2__c !=null && appObj.Final_Collateral_value_for_Tranche_2__c !=null)
                finWrapObj.TrancheDetail = false;
            if(appObj.Name__c !=null && appObj.Nominee__c !=null)
                finWrapObj.InsuranceDetail = false;
            if(appObj.Nach_Party__c !=null )
                finWrapObj.DisbursementDetail = false;
            if(appObj.Amount_Recommended__c !=null )
                finWrapObj.LoanAmtDetail = false;
            if(appObj.Total_Net_Income__c !=null )
                finWrapObj.EligibilityDetail = false;
            if(appObj.KYC_Risk_Rating__c !=null )
                finWrapObj.RiskDetail = false;
            if(appObj.Discussion_done_with__c !=null )
                finWrapObj.OtherDetail = false;
            if(appObj.Comment_Remarks__c !=null )
                finWrapObj.ExecutiveDetail = false;
            
        }
        
        validationWrapObj.charWrap = charWrapObj;
        validationWrapObj.colWrap = colWrapObj;
        validationWrapObj.finWrap = finWrapObj;
        return       validationWrapObj;
        
    }
    
    
    
    
    // This Method is used to fetch the records 
    @AuraEnabled
    public static List<sObject> getData(String CustomerId,String ObjName)    
    {
        System.debug('ObjNAme>>>.'+ObjName);
        System.debug('customerId>>>>>>>> '+CustomerId);
        if(ObjName=='Property__c')
        {
            
            List<Property__C> PropertyList=[SELECT Id,Land_Area_Sq_Ft__c,Value_per_sq_ft__c,Month__c,Living_property_Distance_from_Branch__c,Title_Deed_Year__c,Type_Of_Property__c  FROM Property__c WHERE Property__c=:CustomerId AND RecordType.Name='PC Property Detail' ]; 
            system.debug('plist>>>'+PropertyList);
            return PropertyList;
        }
        else if(ObjName=='Verification__c')
        {
            List<Verification__c> verificationList= [SELECT Id,Application__r.Name,Application__c ,Application__r.Pre_Login__c,Application__r.Pre_Login__r.RecordType.Name,Application__r.Requested_Loan_Amount__c,Application__r.Sourcing_Branch__c,Application__r.AC_User__c,Application__r.AC_Decision__c,Application__r.PC_Decision__c,Application__r.Recommended_AC_User__c FROM Verification__c WHERE Id=:CustomerId LIMIT 1];
            System.debug('Verification List>>>> '+verificationList);
            return verificationList;
        }
        else if(ObjName=='Financial')
        {
            List<Verification__c> verificationList= [SELECT Id, ROI__c,Tenor__c FROM Verification__c WHERE Application__c =:CustomerId AND RecordType.Name = 'FIV - B' LIMIT 1];
            System.debug('Verification List>>>> '+verificationList);
            return verificationList;
        }
        else if(ObjName=='Approval Credit')
        {
            List<Verification__c> verificationList= [SELECT Id,Status__c FROM Verification__c WHERE Application__c =:CustomerId AND RecordType.Name = 'PC' AND Status__c!='Completed' ORDER BY CreatedDate DESC LIMIT 1];
            System.debug('Verification List>>>> '+verificationList);
            return verificationList;
        }
        return null;
    }
    
    // This method is used to fetch the Income Summary for the PC/AC Verification
    @AuraEnabled
    public static IncomSummary getIncomeSummary(String applicationId,String caprecordtypeName, String VerfRecordTypeName) {
        IncomSummary incomeObj = new IncomSummary();
        Set < String > loanApplicationId = new Set < String > ();
        
        for (Loan_Applicant__c loanApplicant: [SELECT Id, Customer_Information__c FROM Loan_Applicant__c WHERE Application__c =: applicationId]) {
            
            loanApplicationId.add(loanApplicant.Id);
        }
        String rcId = Schema.getGlobalDescribe().get('Capability__c').getDescribe().getRecordTypeInfosByName().get(caprecordtypeName).getRecordTypeId();
        Id verificationId = [SELECT ID FROM Verification__c WHERE Application__c =: applicationId AND RecordType.Name = :VerfRecordTypeName LIMIT 1].Id;
        
        
        for (Character__c applicant: [SELECT Id, Customer_Information__c, Obligations__c FROM Character__c WHERE Loan_Applicant__c IN: loanApplicationId]) {
            if (applicant.Obligations__c != NULL) {
                incomeObj.allObligations += Integer.valueOf(applicant.Obligations__c);
            }
        }
        incomeObj.allObligations = 0;
        List < Capability__c > capabilities = [SELECT Id, Customer_Information__c, Segment__c, Income_segment__c,Loan_Applicant__r.Income_Considered__c,
                                               Subsegment__c, Year_of_Occupation__c, Proof__c, Proof_Remarks__c, Other_Confirmations__c,
                                               Income_per_month__c, Income_Remarks__c, Business_Reference_Name__c, Business_Reference_Contact_Number__c,
                                               Feedback__c, Business_Reference_Remarks__c, Monthly_Salary__c, Rental_Income__c,
                                               Income_per_day__c, Number_of_days__c, Day_Margin_Basis__c, Sales_per_month__c, Margin__c,
                                               Loan_Applicant__c, Loan_Applicant__r.Customer_Information__c, Loan_Applicant__r.Customer_Information__r.Name,
                                               Electricity__c, Rent__c, Others__c, Salary__c
                                               FROM Capability__c
                                               WHERE Verification__c =: verificationId AND RecordTypeId =: rcId Order BY Loan_Applicant__r.Customer_Information__r.Name
                                              ];
        
        List < IncomWrapper > incomeDetails = new List < IncomWrapper > ();
        for (Capability__c cap: capabilities) {
            IncomWrapper incWrapObj = new IncomWrapper();
            incWrapObj.applicantId = cap.Loan_Applicant__c;
            incWrapObj.applicantName = cap.Loan_Applicant__r.Customer_Information__r.Name;
            incWrapObj.incomeConsidered = cap.Loan_Applicant__r.Income_Considered__c;
            Decimal monthlyIncome = 0;
            Decimal busmonthlyIncome = 0;
            Decimal monthlyIncomeConsidered = 0;
            if (cap.Income_segment__c == 'Salaried') {
                monthlyIncome = Integer.valueOf(cap.Monthly_Salary__c);
                if(cap.Loan_Applicant__r.Income_Considered__c == 'Yes')
                    monthlyIncomeConsidered = Integer.valueOf(cap.Monthly_Salary__c);  
                else
                    monthlyIncomeConsidered = 0;   
            } else if (cap.Income_segment__c == 'Rental Income') {
                monthlyIncome = Integer.valueOf(cap.Rental_Income__c);
                if(cap.Loan_Applicant__r.Income_Considered__c == 'Yes')
                    monthlyIncomeConsidered = Integer.valueOf(cap.Rental_Income__c); 
                else
                    monthlyIncomeConsidered = 0;   
            } else if (cap.Income_segment__c == 'Daily wages') {
                monthlyIncome = cap.Income_per_day__c * cap.Number_of_days__c;
                if(cap.Loan_Applicant__r.Income_Considered__c == 'Yes')
                    monthlyIncomeConsidered =  cap.Income_per_day__c * cap.Number_of_days__c; 
                else
                    monthlyIncomeConsidered = 0;   
            } else if (cap.Income_segment__c == 'Pension' || cap.Income_segment__c == 'Income from Abroad') {
                monthlyIncome = Integer.valueOf(cap.Income_per_month__c);
                if(cap.Loan_Applicant__r.Income_Considered__c == 'Yes')
                    monthlyIncomeConsidered = Integer.valueOf(cap.Income_per_month__c); 
                else
                    monthlyIncomeConsidered = 0;   
            } else if (cap.Income_segment__c == 'Eateries' || cap.Income_segment__c == 'Food business' ||
                       cap.Income_segment__c == 'Manufacturing' || cap.Income_segment__c == 'Shop owner' ||
                       cap.Income_segment__c == 'Milk business' || cap.Income_segment__c == 'General shops' ||
                       cap.Income_segment__c == 'Vegetables/Fruits/Flower/Vendor' || cap.Income_segment__c == 'Self Employed') {
                           if (cap.Day_Margin_Basis__c == 'Day Basis') {
                               busmonthlyIncome = cap.Income_per_day__c * cap.Number_of_days__c;
                               monthlyIncome = cap.Income_per_day__c * cap.Number_of_days__c;
                               if(cap.Loan_Applicant__r.Income_Considered__c == 'Yes')
                                   monthlyIncomeConsidered = cap.Income_per_day__c * cap.Number_of_days__c;
                               else
                                   monthlyIncomeConsidered = 0;   
                           } else if (cap.Day_Margin_Basis__c == 'Margin Basis') {
                               Decimal totalSales = Integer.valueOf(cap.Sales_per_month__c);
                               Decimal margin = cap.Margin__c != null ? cap.Margin__c : 0;
                               Decimal totalIncome = 0;
                               if (totalSales != NULL && totalSales != 0) {
                                   totalIncome = (totalSales / 100 * margin);
                               }
                               if (cap.Electricity__c != Null && cap.Electricity__c != 0) {
                                   totalIncome = totalIncome - cap.Electricity__c;
                               }
                               if (cap.Rent__c != Null && cap.Rent__c != 0) {
                                   totalIncome = totalIncome - cap.Rent__c;
                               }
                               if (cap.Others__c != Null && cap.Others__c != 0) {
                                   totalIncome = totalIncome - cap.Others__c;
                               }
                               if (cap.Salary__c != Null && cap.Salary__c != 0) {
                                   totalIncome = totalIncome - cap.Salary__c;
                               }
                               monthlyIncome = totalIncome;
                               busmonthlyIncome = totalIncome;
                               if(cap.Loan_Applicant__r.Income_Considered__c == 'Yes')
                                   monthlyIncomeConsidered = totalIncome; 
                               else
                                   monthlyIncomeConsidered = 0;   
                           }
                       }
            
            incWrapObj.incomePerMonth = '' + monthlyIncome;
            incWrapObj.busincomePerMonth = '' + busmonthlyIncome;
            incWrapObj.monthlyIncomeConsidered = '' + monthlyIncomeConsidered;
            incomeObj.totalMonthlyIncome += monthlyIncome;
            incomeObj.totalbusMonthlyIncome += busmonthlyIncome;
            incomeObj.totalMonthlyIncomeConsidered +=(monthlyIncomeConsidered!=null?monthlyIncomeConsidered:0);                     
            incomeObj.incomeList.add(incWrapObj);
        }
        System.debug('incomeObj =' + incomeObj);
        incomeObj.netMonthlyIncome = incomeObj.totalMonthlyIncome - incomeObj.allObligations;
        incomeObj.netMonthlyIncomeBusiness = incomeObj.totalbusMonthlyIncome - incomeObj.allObligations;
        incomeObj.netMonthlyIncomeConsidered = incomeObj.totalMonthlyIncomeConsidered - incomeObj.allObligations; 
        return incomeObj;
    }
    
    
    
    // to get the property table data
    @AuraEnabled(cacheable=true)
    public static GenericDataTableController.DataTableResponse getCollateralTableRecords(String appId, String metadataName){      
        GenericDataTableController genericDTObj = new GenericDataTableController();
        genericDTObj.METADATA_NAME = metadataName;
        genericDTObj.IDS_SET = new Set<String>();
        genericDTObj.IDS_SET.add(appId);
        String rcId = Schema.getGlobalDescribe().get('Property__c').getDescribe().getRecordTypeInfosByName().get('FIV-C Property Detail').getRecordTypeId();
        genericDTObj.IDS_SET.add(rcId);
        genericDTObj.WHERE_CLAUSE = ' Application__c IN : IDS_SET AND RecordTypeId IN : IDS_SET';
        return genericDTObj.getTable();
    }
    
    
    
    // to get the Topup table data
    @AuraEnabled
    public static GenericDataTableController.DataTableResponse getTopupTableRecords(String appId, String metadataName){      
        GenericDataTableController genericDTObj = new GenericDataTableController();
        genericDTObj.METADATA_NAME = metadataName;
        genericDTObj.IDS_SET = new Set<String>();
        genericDTObj.IDS_SET.add(appId);
        genericDTObj.WHERE_CLAUSE = 'Application__c IN : IDS_SET';
        return genericDTObj.getTable();
    }
    
    // to get the CapabilityTable Records 
    @AuraEnabled
    public static GenericDataTableController.DataTableResponse getCapabiltyData(String appId,String loanAppId,string recTypeName,String metadataName,String caprecordTypeName){
        System.debug('rectypename'+recTypeName+'cap type'+caprecordTypeName);
        
        Id recTypeId =Schema.getGlobalDescribe().get('Verification__c').getDescribe().getRecordTypeInfosByName().get(recTypeName).getRecordTypeId();
        system.debug('rectypeid'+recTypeId);
        System.debug('loanAppId>>>>'+loanAppId);
        Id recordId = [SELECT ID FROM Verification__c WHERE RecordTypeId=:recTypeId AND  Application__C=:appId LIMIT 1].Id;
        Id caprecTypeId =Schema.getGlobalDescribe().get('Capability__c').getDescribe().getRecordTypeInfosByName().get(caprecordTypeName).getRecordTypeId();
        
        
        System.debug('appId>>>>'+recordId);
        System.debug('loanAppId>>>>'+loanAppId);
        GenericDataTableController genericDTObjCapabilty = new GenericDataTableController();
        genericDTObjCapabilty.METADATA_NAME = metadataName ;
        genericDTObjCapabilty.IDS_SET = new Set<String>();
        genericDTObjCapabilty.IDS_SET.add(recordId);
        genericDTObjCapabilty.IDS_SET.add(loanAppId);
        genericDTObjCapabilty.IDS_SET.add(caprecTypeId);
        
        System.debug('loanAppId>>>>'+loanAppId);
        genericDTObjCapabilty.WHERE_CLAUSE =' Verification__c IN : IDS_SET AND Loan_Applicant__c IN : IDS_SET AND RecordTypeId IN: IDS_SET';
        return genericDTObjCapabilty.getTable();
    } 
    
    
    
    
    // to get the Capability Summary Table for PC
    @AuraEnabled
    public static IncomeSummary getCapabilitySummary(String applicationId)
    {
        List<Id> verificationIds = new List<Id>();
        for(Verification__c verObj:[SELECT Id FROM Verification__c WHERE Application__c =:applicationId AND RecordType.Name IN('FIV - C','PC')])
        {
            verificationIds.add(verObj.Id);
        }
        IncomeSummary incomeObj = new IncomeSummary();
        String rcId1 = Schema.getGlobalDescribe().get('Capability__c').getDescribe().getRecordTypeInfosByName().get('PC Capability').getRecordTypeId();
        String rcId2 = Schema.getGlobalDescribe().get('Capability__c').getDescribe().getRecordTypeInfosByName().get('FIV-C Capability').getRecordTypeId();
        List<String> rcIds = new List<String>{rcId1, rcId2};
            
            Decimal allObligations = 0;
        Map<Id,String> loanApplicationId = new Map<Id,String>();
        for(Loan_Applicant__c loanApplicant : [SELECT Id, Customer_Information__r.Name FROM Loan_Applicant__c WHERE Application__c =: applicationId]){
            
            loanApplicationId.put(loanApplicant.Id,loanApplicant.Customer_Information__r.Name);
        }       
        
        List<Capability__c> capabilities = new List<Capability__c>();
        capabilities = [SELECT Id, Customer_Information__c, Segment__c, Income_segment__c,
                        Subsegment__c, Year_of_Occupation__c, Proof__c, Proof_Remarks__c, Other_Confirmations__c,
                        Income_per_month__c, Income_Remarks__c, Business_Reference_Name__c, Business_Reference_Contact_Number__c,
                        Feedback__c, Business_Reference_Remarks__c, Monthly_Salary__c, Rental_Income__c,
                        Income_per_day__c, Number_of_days__c, Day_Margin_Basis__c, Sales_per_month__c, Margin__c,
                        Loan_Applicant__c, Loan_Applicant__r.Customer_Information__c, Loan_Applicant__r.Customer_Information__r.Name,
                        Electricity__c, Rent__c, Others__c, Salary__c,RecordType.Name
                        FROM Capability__c 
                        WHERE Verification__c IN: verificationIds AND RecordTypeId IN: rcIds Order BY Loan_Applicant__r.Customer_Information__r.Name];
        
        system.debug('capab list+'+capabilities);
        ////////
        Map<String,Map<String,Decimal>> incomeMap = new Map<String,Map<String,Decimal>>();
        Map<String,Map<String,Decimal>> segmentMap = new Map<String,Map<String,Decimal>>();
        decimal totalpcIncome = 0;
        decimal totalfivcIncome =0;
        for(Capability__c cap : capabilities){
            
            Decimal monthlyIncome = 0;
            if(cap.Income_segment__c == 'Salaried'){
                cap.Monthly_Salary__c = cap.Monthly_Salary__c != null ? cap.Monthly_Salary__c : 0;
                monthlyIncome = Integer.valueOf(cap.Monthly_Salary__c);
            } else if(cap.Income_segment__c == 'Rental Income'){
                cap.Rental_Income__c = cap.Rental_Income__c != null ? cap.Rental_Income__c : 0;
                monthlyIncome = Integer.valueOf(cap.Rental_Income__c);
            } else if(cap.Income_segment__c == 'Daily wages'){
                cap.Income_per_day__c = cap.Income_per_day__c != null ? cap.Income_per_day__c : 0;
                cap.Number_of_days__c = cap.Number_of_days__c != null ? cap.Number_of_days__c : 0;
                monthlyIncome = cap.Income_per_day__c * cap.Number_of_days__c;
            } else if(cap.Income_segment__c == 'Pension' || cap.Income_segment__c == 'Income from Abroad'){
                cap.Income_per_month__c = cap.Income_per_month__c != null ? cap.Income_per_month__c : 0;
                monthlyIncome = Integer.valueOf(cap.Income_per_month__c);
            } else if(cap.Income_segment__c == 'Eateries' || cap.Income_segment__c == 'Food business' ||
                      cap.Income_segment__c == 'Manufacturing' || cap.Income_segment__c == 'Shop owner' ||
                      cap.Income_segment__c == 'Milk business' || cap.Income_segment__c == 'General shops' ||
                      cap.Income_segment__c == 'Vegetables/Fruits/Flower/Vendor' || cap.Income_segment__c == 'Self Employed'){
                          if(cap.Day_Margin_Basis__c == 'Day Basis'){
                              cap.Income_per_day__c = cap.Income_per_day__c != null ? cap.Income_per_day__c : 0;
                              cap.Number_of_days__c = cap.Number_of_days__c != null ? cap.Number_of_days__c : 0;
                              monthlyIncome = cap.Income_per_day__c * cap.Number_of_days__c;
                          } else if(cap.Day_Margin_Basis__c == 'Margin Basis'){
                              Decimal totalSales = Integer.valueOf(cap.Sales_per_month__c);
                              Decimal margin = cap.Margin__c != null ? cap.Margin__c : 0;
                              Decimal totalIncome = 0;
                              if(totalSales != NULL && totalSales != 0){
                                  totalIncome = (totalSales / 100 * margin);
                              }
                              if(cap.Electricity__c != Null && cap.Electricity__c != 0){
                                  totalIncome = totalIncome - cap.Electricity__c;
                              }
                              if(cap.Rent__c != Null && cap.Rent__c != 0){
                                  totalIncome = totalIncome - cap.Rent__c;
                              }
                              if(cap.Others__c != Null && cap.Others__c != 0){
                                  totalIncome = totalIncome - cap.Others__c;
                              }
                              if(cap.Salary__c != Null && cap.Salary__c != 0){
                                  totalIncome = totalIncome - cap.Salary__c;
                              }
                              monthlyIncome = totalIncome;
                          }
                      } 
            
            if(!incomeMap.containsKey(cap.Loan_Applicant__c))
            {    if(cap.RecordType.Name == 'FIV-C Capability')
            { incomeMap.put(cap.Loan_Applicant__c,new Map<String,Decimal>{'FIV-C Income'=>monthlyIncome});
             totalfivcIncome+=monthlyIncome;
            }else  if(cap.RecordType.Name == 'PC Capability')
            {   incomeMap.put(cap.Loan_Applicant__c,new Map<String,Decimal>{'PC Income'=>monthlyIncome});
             totalpcIncome+=monthlyIncome;
            }
            }
            else 
            {
                if(cap.RecordType.Name == 'FIV-C Capability')
                {
                    Map<String , Decimal> tempMap= incomeMap.get(cap.Loan_Applicant__c);
                    if(tempMap.containsKey('FIV-C Income'))
                    {    tempMap.put('FIV-C Income',tempMap.get('FIV-C Income')+monthlyIncome);
                     totalfivcIncome+=monthlyIncome;}
                    else
                    {  tempMap.put('FIV-C Income',monthlyIncome);
                     totalfivcIncome+=monthlyIncome;
                    }
                    incomeMap.put(cap.Loan_Applicant__c,tempMap); 
                }
                else  if(cap.RecordType.Name == 'PC Capability')
                {
                    Map<String , Decimal> tempMap= incomeMap.get(cap.Loan_Applicant__c);
                    if(tempMap.containsKey('PC Income'))
                    {   tempMap.put('PC Income',tempMap.get('PC Income')+monthlyIncome);
                     totalpcIncome+=monthlyIncome;
                    }else
                    {   tempMap.put('PC Income',monthlyIncome);
                     
                     totalpcIncome+=monthlyIncome;
                    }
                    incomeMap.put(cap.Loan_Applicant__c,tempMap);
                }}
            
            if(!segmentMap.containsKey(cap.Income_segment__c))
            {    if(cap.RecordType.Name == 'FIV-C Capability')
                segmentMap.put(cap.Income_segment__c,new Map<String,Decimal>{'FIV-C Income'=>monthlyIncome});
             else if(cap.RecordType.Name == 'PC Capability')
                 segmentMap.put(cap.Income_segment__c,new Map<String,Decimal>{'PC Income'=>monthlyIncome});}
            else 
            {
                if(cap.RecordType.Name == 'FIV-C Capability')
                {     
                    Map<String , Decimal> SegMap= segmentMap.get(cap.Income_segment__c);
                    if(SegMap.containsKey('FIV-C Income'))
                        SegMap.put('FIV-C Income',SegMap.get('FIV-C Income')+monthlyIncome);
                    else
                        SegMap.put('FIV-C Income',monthlyIncome);
                    segmentMap.put(cap.Income_segment__c,SegMap);             }
                else if(cap.RecordType.Name == 'PC Capability')
                {   Map<String , Decimal> tempMap= segmentMap.get(cap.Income_segment__c);
                 if(tempMap.containsKey('PC Income'))
                     tempMap.put('PC Income',tempMap.get('PC Income')+monthlyIncome);
                 else
                     tempMap.put('PC Income',monthlyIncome);
                 segmentMap.put(cap.Income_segment__c,tempMap);    }}
        }
        incomeObj.totalFivCMonthlyIncome = totalfivcIncome;
        incomeObj.totalPCMonthlyIncome = totalpcIncome;
        incomeObj.allpCObligations = allObligations;
        incomeObj.allfivCObligations = allObligations;
        incomeObj.pcnetMonthlyIncome = totalpcIncome - allObligations;
        incomeObj.fivcnetMonthlyIncome = totalfivcIncome - allObligations;
        
        List<IncomeWrapper> incomeList =new List<IncomeWrapper>();
        List<SegmentWrapper> segList = new List<SegmentWrapper>();
        for(String key:incomeMap.keySet())
        {
            Map<String,Decimal> temp = incomeMap.get(key);
            IncomeWrapper incObj = new IncomeWrapper();
            if(loanApplicationId.containsKey(key))
                incObj.customerName = loanApplicationId.get(key);
            incObj.fivCIncome = temp.get('FIV-C Income');
            incObj.pcIncome = temp.get('PC Income');
            incomeList.add(incObj);
        }
        for(String key:segmentMap.keySet())
        {
            Map<String,Decimal> temp = segmentMap.get(key);
            SegmentWrapper segObj = new SegmentWrapper();
            segObj.SegmemtName = key;
            segObj.fivCIncome = temp.get('FIV-C Income');
            segObj.pcIncome = temp.get('PC Income');
            segList.add(segObj);
        }
        incomeObj.incomList= incomeList;
        incomeObj.segmentList = segList;
        
        System.debug('incomeObj ='+incomeObj);
        System.debug('segmentMap ='+segmentMap);
        System.debug('incomeMap ='+incomeMap);
        
        return incomeObj;
        
    }
    
    // get the Capability Summary for AC
    @AuraEnabled
    public static IncomeSummary getacCapabilitySummary(String applicationId)
    {
        List<Id> verificationIds = new List<Id>();
        for(Verification__c verObj:[SELECT Id FROM Verification__c WHERE Application__c =:applicationId AND RecordType.Name IN('FIV - C','AC')])
        {
            verificationIds.add(verObj.Id);
        }
        IncomeSummary incomeObj = new IncomeSummary();
        String rcId1 = Schema.getGlobalDescribe().get('Capability__c').getDescribe().getRecordTypeInfosByName().get('AC Capability').getRecordTypeId();
        String rcId2 = Schema.getGlobalDescribe().get('Capability__c').getDescribe().getRecordTypeInfosByName().get('FIV-C Capability').getRecordTypeId();
        List<String> rcIds = new List<String>{rcId1, rcId2};
            
            Decimal allObligations = 0;
        Map<Id,String> loanApplicationId = new Map<Id,String>();
        for(Loan_Applicant__c loanApplicant : [SELECT Id, Customer_Information__r.Name FROM Loan_Applicant__c WHERE Application__c =: applicationId]){
            
            loanApplicationId.put(loanApplicant.Id,loanApplicant.Customer_Information__r.Name);
        }       
        
        List<Capability__c> capabilities = new List<Capability__c>();
        capabilities = [SELECT Id, Customer_Information__c, Segment__c, Income_segment__c,
                        Subsegment__c, Year_of_Occupation__c, Proof__c, Proof_Remarks__c, Other_Confirmations__c,
                        Income_per_month__c, Income_Remarks__c, Business_Reference_Name__c, Business_Reference_Contact_Number__c,
                        Feedback__c, Business_Reference_Remarks__c, Monthly_Salary__c, Rental_Income__c,
                        Income_per_day__c, Number_of_days__c, Day_Margin_Basis__c, Sales_per_month__c, Margin__c,
                        Loan_Applicant__c, Loan_Applicant__r.Customer_Information__c, Loan_Applicant__r.Customer_Information__r.Name,
                        Electricity__c, Rent__c, Others__c, Salary__c,RecordType.Name
                        FROM Capability__c 
                        WHERE Verification__c IN: verificationIds AND RecordTypeId IN: rcIds Order BY Loan_Applicant__r.Customer_Information__r.Name];
        
        system.debug('capab list+'+capabilities);
        ////////
        Map<String,Map<String,Decimal>> incomeMap = new Map<String,Map<String,Decimal>>();
        Map<String,Map<String,Decimal>> segmentMap = new Map<String,Map<String,Decimal>>();
        decimal totalacIncome = 0;
        decimal totalfivcIncome =0;
        for(Capability__c cap : capabilities){
            
            Decimal monthlyIncome = 0;
            if(cap.Income_segment__c == 'Salaried'){
                cap.Monthly_Salary__c = cap.Monthly_Salary__c != null ? cap.Monthly_Salary__c : 0;
                monthlyIncome = Integer.valueOf(cap.Monthly_Salary__c);
            } else if(cap.Income_segment__c == 'Rental Income'){
                cap.Rental_Income__c = cap.Rental_Income__c != null ? cap.Rental_Income__c : 0;
                monthlyIncome = Integer.valueOf(cap.Rental_Income__c);
            } else if(cap.Income_segment__c == 'Daily wages'){
                cap.Income_per_day__c = cap.Income_per_day__c != null ? cap.Income_per_day__c : 0;
                cap.Number_of_days__c = cap.Number_of_days__c != null ? cap.Number_of_days__c : 0;
                monthlyIncome = cap.Income_per_day__c * cap.Number_of_days__c;
            } else if(cap.Income_segment__c == 'Pension' || cap.Income_segment__c == 'Income from Abroad'){
                cap.Income_per_month__c = cap.Income_per_month__c != null ? cap.Income_per_month__c : 0;
                monthlyIncome = Integer.valueOf(cap.Income_per_month__c);
            } else if(cap.Income_segment__c == 'Eateries' || cap.Income_segment__c == 'Food business' ||
                      cap.Income_segment__c == 'Manufacturing' || cap.Income_segment__c == 'Shop owner' ||
                      cap.Income_segment__c == 'Milk business' || cap.Income_segment__c == 'General shops' ||
                      cap.Income_segment__c == 'Vegetables/Fruits/Flower/Vendor' || cap.Income_segment__c == 'Self Employed'){
                          if(cap.Day_Margin_Basis__c == 'Day Basis'){
                              cap.Income_per_day__c = cap.Income_per_day__c != null ? cap.Income_per_day__c : 0;
                              cap.Number_of_days__c = cap.Number_of_days__c != null ? cap.Number_of_days__c : 0;
                              monthlyIncome = cap.Income_per_day__c * cap.Number_of_days__c;
                          } else if(cap.Day_Margin_Basis__c == 'Margin Basis'){
                              Decimal totalSales = Integer.valueOf(cap.Sales_per_month__c);
                              Decimal margin = cap.Margin__c != null ? cap.Margin__c : 0;
                              Decimal totalIncome = 0;
                              if(totalSales != NULL && totalSales != 0){
                                  totalIncome = (totalSales / 100 * margin);
                              }
                              if(cap.Electricity__c != Null && cap.Electricity__c != 0){
                                  totalIncome = totalIncome - cap.Electricity__c;
                              }
                              if(cap.Rent__c != Null && cap.Rent__c != 0){
                                  totalIncome = totalIncome - cap.Rent__c;
                              }
                              if(cap.Others__c != Null && cap.Others__c != 0){
                                  totalIncome = totalIncome - cap.Others__c;
                              }
                              if(cap.Salary__c != Null && cap.Salary__c != 0){
                                  totalIncome = totalIncome - cap.Salary__c;
                              }
                              monthlyIncome = totalIncome;
                          }
                      } 
            
            if(!incomeMap.containsKey(cap.Loan_Applicant__c))
            {    if(cap.RecordType.Name == 'FIV-C Capability')
            { incomeMap.put(cap.Loan_Applicant__c,new Map<String,Decimal>{'FIV-C Income'=>monthlyIncome});
             totalfivcIncome+=monthlyIncome;
            }else  if(cap.RecordType.Name == 'AC Capability')
            {   incomeMap.put(cap.Loan_Applicant__c,new Map<String,Decimal>{'PC Income'=>monthlyIncome});
             totalacIncome+=monthlyIncome;
            }
            }
            else 
            {
                if(cap.RecordType.Name == 'FIV-C Capability')
                {
                    Map<String , Decimal> tempMap= incomeMap.get(cap.Loan_Applicant__c);
                    if(tempMap.containsKey('FIV-C Income'))
                    {    tempMap.put('FIV-C Income',tempMap.get('FIV-C Income')+monthlyIncome);
                     totalfivcIncome+=monthlyIncome;}
                    else
                    {  tempMap.put('FIV-C Income',monthlyIncome);
                     totalfivcIncome+=monthlyIncome;
                    }
                    incomeMap.put(cap.Loan_Applicant__c,tempMap); 
                }
                else  if(cap.RecordType.Name == 'AC Capability')
                {
                    Map<String , Decimal> tempMap= incomeMap.get(cap.Loan_Applicant__c);
                    if(tempMap.containsKey('AC Income'))
                    {   tempMap.put('AC Income',tempMap.get('AC Income')+monthlyIncome);
                     totalacIncome+=monthlyIncome;
                    }else
                    {   tempMap.put('AC Income',monthlyIncome);
                     
                     totalacIncome+=monthlyIncome;
                    }
                    incomeMap.put(cap.Loan_Applicant__c,tempMap);
                }}
            
            if(!segmentMap.containsKey(cap.Income_segment__c))
            {    if(cap.RecordType.Name == 'FIV-C Capability')
                segmentMap.put(cap.Income_segment__c,new Map<String,Decimal>{'FIV-C Income'=>monthlyIncome});
             else if(cap.RecordType.Name == 'AC Capability')
                 segmentMap.put(cap.Income_segment__c,new Map<String,Decimal>{'AC Income'=>monthlyIncome});}
            else 
            {
                if(cap.RecordType.Name == 'FIV-C Capability')
                {     
                    Map<String , Decimal> SegMap= segmentMap.get(cap.Income_segment__c);
                    if(SegMap.containsKey('FIV-C Income'))
                        SegMap.put('FIV-C Income',SegMap.get('FIV-C Income')+monthlyIncome);
                    else
                        SegMap.put('FIV-C Income',monthlyIncome);
                    segmentMap.put(cap.Income_segment__c,SegMap);             }
                else if(cap.RecordType.Name == 'AC Capability')
                {   Map<String , Decimal> tempMap= segmentMap.get(cap.Income_segment__c);
                 if(tempMap.containsKey('AC Income'))
                     tempMap.put('AC Income',tempMap.get('AC Income')+monthlyIncome);
                 else
                     tempMap.put('AC Income',monthlyIncome);
                 segmentMap.put(cap.Income_segment__c,tempMap);    }}
        }
        incomeObj.totalFivCMonthlyIncome = totalfivcIncome;
        incomeObj.totalPCMonthlyIncome = totalacIncome;
        incomeObj.allpCObligations = allObligations;
        incomeObj.allfivCObligations = allObligations;
        incomeObj.pcnetMonthlyIncome = totalacIncome - allObligations;
        incomeObj.fivcnetMonthlyIncome = totalfivcIncome - allObligations;
        
        List<IncomeWrapper> incomeList =new List<IncomeWrapper>();
        List<SegmentWrapper> segList = new List<SegmentWrapper>();
        for(String key:incomeMap.keySet())
        {
            Map<String,Decimal> temp = incomeMap.get(key);
            IncomeWrapper incObj = new IncomeWrapper();
            if(loanApplicationId.containsKey(key))
                incObj.customerName = loanApplicationId.get(key);
            incObj.fivCIncome = temp.get('FIV-C Income');
            incObj.pcIncome = temp.get('AC Income');
            incomeList.add(incObj);
        }
        for(String key:segmentMap.keySet())
        {
            Map<String,Decimal> temp = segmentMap.get(key);
            SegmentWrapper segObj = new SegmentWrapper();
            segObj.SegmemtName = key;
            segObj.fivCIncome = temp.get('FIV-C Income');
            segObj.pcIncome = temp.get('AC Income');
            segList.add(segObj);
        }
        incomeObj.incomList= incomeList;
        incomeObj.segmentList = segList;
        
        System.debug('incomeObj ='+incomeObj);
        System.debug('segmentMap ='+segmentMap);
        System.debug('incomeMap ='+incomeMap);        
        return incomeObj;
    }
    
    @AuraEnabled
    public static Decimal getHighmarkLoanAmount(String applicationId){
        Set<String> loanApplicantIdSet = new Set<String>();
        Set<String> bureauHighmarkIdSet = new Set<String>();
        Decimal totalLoanAmount = 0;
        for(Loan_Applicant__c applicantRecord : [SELECT Id,Application__c FROM Loan_Applicant__c WHERE Application__c = : applicationId]) {
            loanApplicantIdSet.add(applicantRecord.Id);
        }
        if(!loanApplicantIdSet.isEmpty())
            for(Bureau_Highmark__c highmarkRecord : [SELECT Id,Loan_Applicant__c FROM Bureau_Highmark__c WHERE Loan_Applicant__c IN : loanApplicantIdSet]) {
                bureauHighmarkIdSet.add(highmarkRecord.Id);
            }
        String loanDetailRecordTypeId = Schema.getGlobalDescribe().get('Loan_Details__c').getDescribe().getRecordTypeInfosByName().get('Loan Details').getRecordTypeId();
        for(Loan_details__c loanObj:[SELECT Id,Obligations__c,To_be_considerd_for_DBR__c FROM Loan_Details__c WHERE Bureau_Highmark__c IN:bureauHighmarkIdSet AND RecordTypeId =:loanDetailRecordTypeId])
        {
            if(loanObj.To_be_considerd_for_DBR__c == 'Yes')
                totalLoanAmount += (loanObj.Obligations__c!=null?loanObj.Obligations__c:0);             
        }
        return totalLoanAmount;         
    }
    
    @AuraEnabled
    public static String getHMScore(String loanAppId)
    {
        system.debug('loan AppId'+loanAppId);
        String hmScore;
        List<Bureau_Highmark__c> HMScoreList = new List<Bureau_Highmark__c>();
        if(loanAppId != null)
            HMScoreList=[SELECT Id,Highmark_Score__c, Loan_Applicant__c FROM Bureau_Highmark__c WHERE Loan_Applicant__c=:loanAppId ORDER BY CreatedDate DESC LIMIT 1];
        if(HMScoreList.size()>0)
            hmScore = HMScoreList[0].Highmark_Score__c;
        system.debug('hmScore >>> '+hmScore);
        return hmScore;   
    }
    
    @AuraEnabled
    public static GenericDataTableController.DataTableResponse getACCollateralTabRecords(String appId){
        Set<String> propIds = new Set<String>();
        for(Property__c objProp : [SELECT Id FROM Property__c WHERE Application__c =:appId AND RecordType.Name = 'AC Property Detail' AND Application__c!= null]){
            propIds.add(objProp.Id);
        }
        GenericDataTableController genericDTObj = new GenericDataTableController();
        genericDTObj.METADATA_NAME = 'AC_Collateral';
        genericDTObj.IDS_SET = propIds;
        genericDTObj.WHERE_CLAUSE = 'Id IN:IDS_SET';
        return genericDTObj.getTable();
    }
    
    
    // Wrapper Class For PC Income Summary
    public class IncomeWrapper{
        @AuraEnabled public String customerName;
        @AuraEnabled public Decimal fivCIncome;
        @AuraEnabled public Decimal pcIncome;
        public IncomeWrapper(){
            customerName='';
            pcIncome =0;
            fivCIncome =0;
        }
    }
    public class SegmentWrapper{
        @AuraEnabled public String SegmemtName;
        @AuraEnabled public Decimal fivCIncome;
        @AuraEnabled public Decimal pcIncome;
        public SegmentWrapper(){
            SegmemtName='';
            pcIncome =0;
            fivCIncome =0;
        }
    }
    
    
    public class IncomeSummary{
        @AuraEnabled public Decimal totalFivCMonthlyIncome;
        @AuraEnabled public Decimal totalPCMonthlyIncome;
        @AuraEnabled public Decimal allfivCObligations;
        @AuraEnabled public Decimal allpCObligations;
        @AuraEnabled public Decimal pcnetMonthlyIncome;
        @AuraEnabled public Decimal fivcnetMonthlyIncome;
        @AuraEnabled public List<IncomeWrapper> incomList;
        @AuraEnabled public List<SegmentWrapper> segmentList;
        
        public IncomeSummary(){
            incomList = new List<IncomeWrapper> ();
            segmentList = new List<SegmentWrapper>();
            fivcnetMonthlyIncome = 0;
            pcnetMonthlyIncome = 0;
            allpCObligations = 0;
            allfivCObligations = 0;
            totalPCMonthlyIncome = 0;
            totalFivCMonthlyIncome = 0;
        }
    }
    
    
    /// Wrapper Class for Income Summary for FIV-C
    public class IncomWrapper {
        @AuraEnabled public String applicantName;
        @AuraEnabled public String applicantId;
        @AuraEnabled public String incomeConsidered;
        @AuraEnabled public String incomePerMonth;
        @AuraEnabled public String busincomePerMonth;
        @AuraEnabled public String monthlyIncomeConsidered;
        
        public IncomWrapper() {
            applicantName = '';
            applicantId = '';
            incomePerMonth = '';
            busincomePerMonth = '';
            monthlyIncomeConsidered = '';
            incomeConsidered = 'No';
        }
    }
    
    public class IncomSummary {
        @AuraEnabled public List < IncomWrapper > incomeList;
        @AuraEnabled public Decimal totalMonthlyIncome;
        @AuraEnabled public Decimal totalbusMonthlyIncome;
        @AuraEnabled public Decimal totalMonthlyIncomeConsidered;
        @AuraEnabled public Decimal allObligations;
        @AuraEnabled public Decimal netMonthlyIncome;
        @AuraEnabled public Decimal netMonthlyIncomeBusiness;
        @AuraEnabled public Decimal netMonthlyIncomeConsidered;
        
        public IncomSummary() {
            incomeList = new List < IncomWrapper > ();
            totalMonthlyIncome = 0;
            totalbusMonthlyIncome = 0;
            allObligations = 0;
            netMonthlyIncome = 0;
            totalMonthlyIncomeConsidered = 0;
            netMonthlyIncomeBusiness = 0;
            netMonthlyIncomeConsidered = 0;
        }
    }  
    
    ///////////////////// Land and Building Value Wrapper
    public class LandValueWrapper{
        @AuraEnabled public Decimal Land_Area;
        @AuraEnabled public Decimal Market_Value;
    }
    
    public class BuildingValueWrapper{
        @AuraEnabled public Decimal Building_Area;
        @AuraEnabled public Decimal Building_Value;
    }
    
    
    ////////////////////////// Wrapper class for PC Check Validation
    public class characterValidationWrapper{
        @AuraEnabled public Boolean familyDetail;
        @AuraEnabled public Boolean NeighbourDetail;
        @AuraEnabled public Boolean AffiliationDetail;
        @AuraEnabled public Boolean LivingStandardDetail;
        
        public characterValidationWrapper()
        {
            familyDetail = true;
            NeighbourDetail = true;
            AffiliationDetail = true;
            LivingStandardDetail = true;
        }
    }
    
    public class collateralValidationWrapper{
        @AuraEnabled public Boolean PropertyDetails;
        @AuraEnabled public Boolean LandArea;
        @AuraEnabled public Boolean BuildingValuation;
        
        public collateralValidationWrapper()
        {
            PropertyDetails = true;
            BuildingValuation = true;
            LandArea = true;
        }
    }
    
    
    public class financialValidationWrapper{
        @AuraEnabled public Boolean TopupDetail;
        @AuraEnabled public Boolean CollateralDetail;
        @AuraEnabled public Boolean OldLoanDetail;
        @AuraEnabled public Boolean TrancheDetail;
        @AuraEnabled public Boolean ApplicationDetail;
        @AuraEnabled public Boolean LoanDetail;
        @AuraEnabled public Boolean InsuranceDetail;
        @AuraEnabled public Boolean DisbursementDetail;
        @AuraEnabled public Boolean LoanAmtDetail;
        @AuraEnabled public Boolean EligibilityDetail;
        @AuraEnabled public Boolean RiskDetail;
        @AuraEnabled public Boolean OtherDetail;
        @AuraEnabled public Boolean ExecutiveDetail;
        
        public financialValidationWrapper()
        {
            TopupDetail = true;
            CollateralDetail = true;
            OldLoanDetail = true;
            ApplicationDetail = true;
            TrancheDetail = true;
            LoanDetail = true;
            InsuranceDetail = true;
            DisbursementDetail = true;
            LoanAmtDetail = true;
            EligibilityDetail = true;
            RiskDetail = true;
            OtherDetail = true;
            ExecutiveDetail = true;
        }
    }
    
    // PC Validation Wrapper Class
    public class PCValidationWrapper{
        @AuraEnabled public characterValidationWrapper charWrap;
        @AuraEnabled public collateralValidationWrapper colWrap;
        @AuraEnabled public financialValidationWrapper  finWrap;
        @AuraEnabled public Boolean capabilityValidation;
        @AuraEnabled public Boolean isfivbInitiated;
        @AuraEnabled public Boolean isfivcInitiated;
        @AuraEnabled public Boolean isonlineECinitiated;
        @AuraEnabled public Boolean isfivbCompleted;
        @AuraEnabled public Boolean isfivcCompleted;
        @AuraEnabled public Boolean isonlineECCompleted;
        @AuraEnabled public Boolean isLoanApplicantAdded;
        @AuraEnabled public Boolean isPropertyAdded;
        @AuraEnabled public Boolean isPrimaryOwner;
        @AuraEnabled public List<String> mobileverificationList;
        @AuraEnabled public List<String> kycVerificationList;       
        
        public PCValidationWrapper()
        {
            charWrap = new characterValidationWrapper();
            colWrap = new collateralValidationWrapper();
            finWrap = new financialValidationWrapper();
            mobileverificationList = new List<String>();
            kycVerificationList = new List<String>();           
            capabilityValidation = false;
            isfivbInitiated = false;
            isfivcInitiated = false;
            isonlineECinitiated = false;
            isfivbCompleted = false;
            isfivcCompleted = false;
            isonlineECCompleted = false;
            isPropertyAdded = false;
            isPrimaryOwner = false;
            isLoanApplicantAdded = false; 
        }
    }
    
    // AC Validation Wrapper Class
    public class ACValidationWrapper{
        @AuraEnabled public characterValidationWrapper charWrap;
        @AuraEnabled public collateralValidationWrapper colWrap;
        @AuraEnabled public financialValidationWrapper  finWrap;
        @AuraEnabled public Boolean capabilityValidation;
        @AuraEnabled public Boolean isfivbInitiated;
        @AuraEnabled public Boolean isfivcInitiated;
        @AuraEnabled public Boolean isonlineECinitiated;
        @AuraEnabled public Boolean isfivbCompleted;
        @AuraEnabled public Boolean isfivcCompleted;
        @AuraEnabled public Boolean isonlineECCompleted;
        @AuraEnabled public Boolean isLoanApplicantAdded;
        @AuraEnabled public Boolean isPropertyAdded;
        @AuraEnabled public Boolean isPrimaryOwner;
        @AuraEnabled public List<String> mobileverificationList;
        @AuraEnabled public List<String> kycVerificationList;
        @AuraEnabled public Boolean isLegalApprovalCompleted;
        
        public ACValidationWrapper()
        {
            charWrap = new characterValidationWrapper();
            colWrap = new collateralValidationWrapper();
            finWrap = new financialValidationWrapper();
            mobileverificationList = new List<String>();
            kycVerificationList = new List<String>(); 
            capabilityValidation = false;
            isfivbInitiated = false;
            isfivcInitiated = false;
            isonlineECinitiated = false;
            isfivbCompleted = false;
            isfivcCompleted = false;
            isonlineECCompleted = false;
            isPropertyAdded = false;
            isPrimaryOwner = false;
            isLoanApplicantAdded = false;
            isLegalApprovalCompleted = true;
        }
    }
    
    // wrapper class for Effective Irr
    public class effIrrWrapper
    {
        @AuraEnabled public Boolean isSamePropertyType;
        @AuraEnabled public Decimal Rate;
        @AuraEnabled public Decimal EffIrr;
    }
}