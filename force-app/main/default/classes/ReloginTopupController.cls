public class ReloginTopupController {
    
    //Re-Login, Topup Insertion
    //Insertion Of LoanApplicant,Property,PropertyOwner,Application
    @AuraEnabled
    public static Wrapper insertReloginOrTopup(String oldAppId,String recTypeName){
        System.debug('OldAppId '+oldAppId);
        Id devRecordTypeId = Schema.SObjectType.Pre_Login__c.getRecordTypeInfosByName().get(recTypeName).getRecordTypeId();
        Pre_Login__c preLog = new Pre_Login__c(RecordTypeId=devRecordTypeId,Status__c='Active');
        INSERT preLog; 
        System.debug('Relogin id '+preLog.Id);
        Application__c oldApp = [SELECT Id, Name
                                     /*Visit_date__c, Recommended__c, Geo_tagging_pin_for_the_user__c,
                                     Type_of_Purchase__c, Title_Deed_Number__c, Property_Schedule__c, Approximate_property_cost__c,
                                     Nature_of_Property__c, Staff_Loan__c, Stage__c, Customer_Request_Amount__c, Customer_Visit_date__c,
                                     Field_Officer_Employee_ID__c, External_Lawyer__c, Channel__c, Alternate_Channel_Mode__c,
                                     Employee_ID__c, Constitution__c,
                                     Approved_Reciept_Count__c, All_Reciept_Count__c, File_Type__c, MODT_Template__c,
                                     MODT_to_be_done_in_name_of__c, Old_Loan_Sanction_Date__c, Old_MODT_Document_No__c, Old_Loan_Amount__c,
                                     Old_Mortgage_Date__c, Registration_District__c, SRO_Office__c, MODT_Schedule__c, 
                                     Sanction_Amount_Restriction__c, Sanction_amount_restriction_upto__c, File_Category__c, 
                                     Risk_Document_Color__c, User_ID__c, Legal_Decision__c, Legal_Sanction_Condition__c, Source_Of_Loan__c,
                                     Broker_Code__c, Broker_Name__c, Field_Officer_Id__c, Field_Officer_Name__c, hasVerificationRecords__c,
                                     BM_Recommended_Amount__c, Requested_Loan_Amount__c, Existing_loan_A_C_No__c, AC__c, Branch__c, 
                                     Loan_Amount__c, EMI__c, Principal_O_S__c, DPD__c, Considered_for__c, Remarks_Topup__c, LC__c,
                                     Collateral_ID__c, Loan_ID__c, Collateral_Address__c, Total_ROI_percent__c, Tranche_2__c, Name__c, 
                                     Lien_Marked__c, LTV__c, DBR__c, Loan_Type__c, Product_Type__c, Customer_Type__c, Loan_Purpose_1__c, 
                                     Balance_Transfer__c, Balance_Transfer_Amount__c, Tranche_Disbursal__c, Tenor_In_Months__c, Nach_Party__c, 
                                     Customer_Communicated__c, Margin_ROI__c, Total_ROI__c, Effective_IRR__c, Loan_Purpose_2__c, 
                                     Risk_Document__c, User__c, Nach_Party_2__c, Reason_for_change_in_net_income__c, Disbursement_party__c, 
                                     Reason_for_change_in_collateral_value__c, Remarks_change_in_net_income__c, Tranche_1__c, Sub_Stage__c, 
                                     Total__c, EMI_for_Tranche_2__c, Date_of_legal_opinion__c, Nominee__c, Guarantor_Networth_Choosen__c, 
                                     Is_Lead_Detail_Done__c, Amount_Recommended__c, Insurance_Premium__c, Total_amount_recommended__c, 
                                     Group_Total_Exposure__c, Group_Valuation__c, Total_Net_Income__c, Total_net_income_after_2nd_tranche__c, 
                                     Mortgage_property_Collateral_Value__c, Mortgage_property_after_tranche2__c, Transaction_LTV__c, 
                                     Transaction_DBR__c, Number_of_advance_EMI__c, Upload_date__c, HM__c, Living_style__c, Neighbour_feedback__c,
                                     KYC_Risk_Rating__c, Guarantor_Networth_If_application__c, Discussion_done_with__c, Comment_Remarks__c, 
                                     Nominee_Party__c, Total_Tenor__c, Old_Loan_Gross_Income__c, Old_Loan_Net_Income__c, 
                                     Old_Collateral_value__c, Final_Collateral_value_for_Tranche_2__c, Remarks_for_change_in_collateral_value__c,
                                     Customer_Segment__c, Total_Net_income_for_Tranche_2__c, Combined_DBR__c, Combined_LTV__c, 
                                     Customer_Sub_Segment__c, Sr_Num__c, Old_Loan_Obligationss__c, Borrower_s_Risk_Rating__c*/ 
                              FROM Application__c
                              WHERE Id = :oldAppId];
        Application__c objApp = oldApp.clone(false,false,false,false);
        objApp.Pre_Login__c = preLog.Id;
        objApp.application_status__c = 'Active';
        objApp.Old_Application_Number__c = oldApp.Name;
        INSERT objApp;
        System.debug('App id '+objApp.Id);
        List<Loan_Applicant__c> laList = new List<Loan_Applicant__c>();
        laList = [SELECT Id, Application__c,
                         /*Customer_Information__c, Customer_Type__c, Applicant_Name__c,Constitution__c,
                         Is_Bureau_Verified__c, Initiate_From__c, Husband_Wife_s_Name__c,Guardian_Name__c, Marital_Status__c,
                         KYC_ID_Type_1__c, KYC_ID_Type_2__c, Ownership_Status__c, Ownership_Type__c, 
                         Duration_At_This_Address_From__c, Duration_At_This_Address_To__c, 
                         Duration_At_This_City_From__c, Duration_At_This_City_To__c, Communication_Address__c, 
                         Mobile__c, Email__c, Residence_Country__c, Residence_Flat_Plot_Number__c, 
                         Residence_Address_Line_1__c, Residence_Address_Line_2__c, Residence_Pincode__c, 
                         Residence_Village__c, Residence_Taluka__c, Residence_City__c, Residence_District__c, 
                         Residence_State__c, Permanent_Country__c, Permanent_Flat_Plot_Number__c, 
                         Permanent_Address_Line_1__c, Permanent_Address_Line_2__c, Permanent_Pincode__c, 
                         Permanent_Village__c, Permanent_Taluka__c, Permanent_City__c, Permanent_District__c, 
                         Permanent_State__c, Business_Country__c, Business_Flat_Plot_Number__c, 
                         Business_Address_Line_1__c, Business_Address_Line_2__c, Business_Pincode__c, 
                         Business_Village__c, Business_Taluka__c, Business_City__c, Business_District__c, 
                         Business_State__c, Same_As_Address_Pernament__c, Same_As_Address_Business__c, 
                         Income_Considered__c, KYC_Id_1__c, KYC_Id_2__c, Applicant_Type__c, Married__c, 
                         Mobile_Verified__c, Residence_Landmark__c, Permanent_Landmark__c, Business_Landmark__c, 
                         Phone_Office__c, Phone_Residence__c, Verification_Type__c, Is_Lead_Detail_Done__c,*/
                         (SELECT Id, Loan_Applicant__c, Property__c FROM Property_Owners__r)
                    FROM Loan_Applicant__c 
                    WHERE Application__c = :oldAppId
                ];
        System.debug('laList '+laList.size());
        if(laList.isEmpty())
            return null;        
        Map<Integer,Loan_Applicant__c> loanApplicantMap = new Map<Integer,Loan_Applicant__c>();
        Map<Integer,List<Property_Owners__c>> allChildPropertyOwner = new Map<Integer,List<Property_Owners__c>>();
        for(Integer i=0;i< laList.size();i=i+1){
            Loan_Applicant__c newLA = laList.get(i).clone(false,false,false,false);
            newLA.Application__c = objApp.Id;
            loanApplicantMap.put(i,newLA);
            for(Integer j=0;j< laList.get(i).Property_Owners__r.size();j=j+1){
                if(!allChildPropertyOwner.containsKey(i)){
                    allChildPropertyOwner.put(i,new List<Property_Owners__c>());
                }
                Property_Owners__c newChildPropertyOwner = laList.get(i).Property_Owners__r.get(j).clone(false,false,false,false);
                allChildPropertyOwner.get(i).add(newChildPropertyOwner);
            }
        }
        System.debug('allChildPropertyOwner '+allChildPropertyOwner);
        if(loanApplicantMap.isEmpty())
            return null;
        INSERT loanApplicantMap.values();

        List<Property_Owners__c> newPropertieOwnerList = new List<Property_Owners__c>();
        for(Integer i = 0; i< loanApplicantMap.size();i=i+1){
            for(Integer j=0;j< allChildPropertyOwner.get(i).size();j=j+1){
                allChildPropertyOwner.get(i).get(j).Loan_Applicant__c = loanApplicantMap.get(i).Id;
                newPropertieOwnerList.add(allChildPropertyOwner.get(i).get(j));
            }
        }
        System.debug('newPropertieOwnerList '+newPropertieOwnerList);
        INSERT newPropertieOwnerList;

        List<Property__c> pList = new List<Property__c>();
        pList = [SELECT Id, RecordTypeId,
                        /*Property_Type__c, Title_Deed_Type__c, Title_Deed_Number__c, Title_Deed_Date__c,
                        Property_Address__c, Application__c, Customer_Information__c, Login__c, Title_Document_date__c,
                        Building_Value_per_Sq_ft__c, MS_Pincode__c, Property__c, Is_Fiv_B_Completed__c, Risk_Document__c,
                        Doc_Seen_Original_with__c, Customers_Residing__c, If_No_Reason__c, BM_Comments_for_Collateral__c,
                        Land_Area_Sq_Ft__c, Value_per_sq_ft__c, Doc_No__c, Building_Area_Sq_Ft__c, Total_Value__c, 
                        Pathway_Available__c, Enquiry_Market_Value__c, Collateral_Type__c, Valuation_Market_Value_Per_SqFt__c,
                        Document_Type__c, Month__c, Title_Deed_Year__c, Mortgage_property_PINCODE__c, 
                        Person_residing_at_Mortgage_property__c, Is_Online_Ec_Completed__c, Living_property_Pincode__c, 
                        Landmark__c, Overall_Remarks__c, Remarks__c, North_by__c, South_by__c, East_by__c, West_by__c, 
                        Location_of_Mortgage_Property__c, Mortgage_Property_Area__c, 
                        Enquiry_Name__c, North_by_land_measurements__c, East_by_land_measurements__c, East_by_boundaries__c, 
                        North_by_boundaries__c, West_by_land_measurements__c, West_by_boundaries__c, South_by_land_measurements__c,
                        South_by_boundaries__c, Contact_Number__c, Is_Lead_Detail_Done__c, Total_Collateral_Value__c, 
                        Valuation_Remarks__c, Remarks_land_measurements__c, Mortgage_Property_Remarks__c, 
                        Building_Constructed_with_Remarks__c, Building_Age__c, Building_Type__c, Floor__c, LengthSq_ft__c, 
                        WidthSq_ft__c, Area_value_per_Sq_ft__c, Enquiry_Contact_Number__c, Total_Area__c, 
                        Total_Area_land_measurementsTotal_Area__c, Collateral_Sub_Type_Property_Details__c, Current__c, 
                        Valuation_Final_land_value__c, Boundries_Remarks__c, Is_living_property_is_own_property__c, Survey_Number__c,
                        Plot_No__c, House_Door_No__c, Extent_Sqft__c, Link_Doc_Status__c, Link_Document_Type__c, Link_Doc_Date__c, 
                        Link_Documents_in_Name_of__c, Supporting_Document_SD__c, SD_in_name_of__c, SD_Date__c, 
                        GuidelineValue_SqFt_asPer_LegalOpinion__c, Online_Guideline_Value_Search__c, Online_Guidelive_Value__c, 
                        Existing_Encumberances__c, Property_Identified__c, Property_Purchased_Type__c, Nature_Of_Property__c, 
                        Property_Location_Classification__c, Carpet_Area__c, Proposed_Area__c, Registration_Status__c, 
                        Property_Ownership__c, Age_Of_Property__c, Property_Purpose__c, Ownership_Status__c, Current_Owner_Name__c, 
                        Co_Owner_Name__c, Percent_Share__c, Onwership_Date__c, Loan_Applicant__c, Property_Owner__c, 
                        hasRelatedRecords__c, IsPrimaryApplicant__c, System_computed_distance__c, 
                        Mortgage_property_distance_from_branch__c, Land_area_valuation_remarks__c, Land_Ownership__c, 
                        Building_Ownership__c, Building_area_total_value__c, Mortgage_property_Living_property_are__c, 
                        Land_Measurement_Length_Sq_ft__c, Land_Measurement_Width_Sq_ft__c, Land_Measurement_total_area__c, 
                        Sub_Registrar_Office__c, Property_Number__c, Residual_Age_Of_Property__c, Market_Value_Of_Property__c, 
                        Flat_Plot_Number__c, Address_Line_2__c, Address_Line_3__c, Village__c, Taluka__c, City__c, District__c, 
                        State__c, Is_Initiate_From_Lead_Details__c, Is_Fiv_B_Clonded__c, Record_Type_Name__c, Pincode__c, 
                        Property_Surrounding__c, Overall_Land_Remarks__c, Original_Mortgage_Document__c, 
                        Living_property_Distance_from_Branch__c, Distance_from_Branch__c,*/
                        (SELECT Id, RecordTypeId
                                /*Property_Type__c, Title_Deed_Type__c, Title_Deed_Number__c, Title_Deed_Date__c,
                                Property_Address__c, Application__c, Customer_Information__c, Login__c, Title_Document_date__c,
                                Building_Value_per_Sq_ft__c, MS_Pincode__c, Property__c, Is_Fiv_B_Completed__c, Risk_Document__c,
                                Doc_Seen_Original_with__c, Customers_Residing__c, If_No_Reason__c, BM_Comments_for_Collateral__c,
                                Land_Area_Sq_Ft__c, Value_per_sq_ft__c, Doc_No__c, Building_Area_Sq_Ft__c, Total_Value__c, 
                                Pathway_Available__c, Enquiry_Market_Value__c, Collateral_Type__c, Valuation_Market_Value_Per_SqFt__c,
                                Document_Type__c, Month__c, Title_Deed_Year__c, Mortgage_property_PINCODE__c, 
                                Person_residing_at_Mortgage_property__c, Is_Online_Ec_Completed__c, Living_property_Pincode__c, 
                                Landmark__c, Overall_Remarks__c, Remarks__c, North_by__c, South_by__c, East_by__c, West_by__c, 
                                Location_of_Mortgage_Property__c, Mortgage_Property_Area__c, 
                                Enquiry_Name__c, North_by_land_measurements__c, East_by_land_measurements__c, East_by_boundaries__c, 
                                North_by_boundaries__c, West_by_land_measurements__c, West_by_boundaries__c, South_by_land_measurements__c,
                                South_by_boundaries__c, Contact_Number__c, Is_Lead_Detail_Done__c, Total_Collateral_Value__c, 
                                Valuation_Remarks__c, Remarks_land_measurements__c, Mortgage_Property_Remarks__c, 
                                Building_Constructed_with_Remarks__c, Building_Age__c, Building_Type__c, Floor__c, LengthSq_ft__c, 
                                WidthSq_ft__c, Area_value_per_Sq_ft__c, Enquiry_Contact_Number__c, Total_Area__c, 
                                Total_Area_land_measurementsTotal_Area__c, Collateral_Sub_Type_Property_Details__c, Current__c, 
                                Valuation_Final_land_value__c, Boundries_Remarks__c, Is_living_property_is_own_property__c, Survey_Number__c,
                                Plot_No__c, House_Door_No__c, Extent_Sqft__c, Link_Doc_Status__c, Link_Document_Type__c, Link_Doc_Date__c, 
                                Link_Documents_in_Name_of__c, Supporting_Document_SD__c, SD_in_name_of__c, SD_Date__c, 
                                GuidelineValue_SqFt_asPer_LegalOpinion__c, Online_Guideline_Value_Search__c, Online_Guidelive_Value__c, 
                                Existing_Encumberances__c, Property_Identified__c, Property_Purchased_Type__c, Nature_Of_Property__c, 
                                Property_Location_Classification__c, Carpet_Area__c, Proposed_Area__c, Registration_Status__c, 
                                Property_Ownership__c, Age_Of_Property__c, Property_Purpose__c, Ownership_Status__c, Current_Owner_Name__c, 
                                Co_Owner_Name__c, Percent_Share__c, Onwership_Date__c, Loan_Applicant__c, Property_Owner__c, 
                                hasRelatedRecords__c, IsPrimaryApplicant__c, System_computed_distance__c, 
                                Mortgage_property_distance_from_branch__c, Land_area_valuation_remarks__c, Land_Ownership__c, 
                                Building_Ownership__c, Building_area_total_value__c, Mortgage_property_Living_property_are__c, 
                                Land_Measurement_Length_Sq_ft__c, Land_Measurement_Width_Sq_ft__c, Land_Measurement_total_area__c, 
                                Sub_Registrar_Office__c, Property_Number__c, Residual_Age_Of_Property__c, Market_Value_Of_Property__c, 
                                Flat_Plot_Number__c, Address_Line_2__c, Address_Line_3__c, Village__c, Taluka__c, City__c, District__c, 
                                State__c, Is_Initiate_From_Lead_Details__c, Is_Fiv_B_Clonded__c, Record_Type_Name__c, Pincode__c, 
                                Property_Surrounding__c, Overall_Land_Remarks__c, Original_Mortgage_Document__c, 
                                Living_property_Distance_from_Branch__c, Distance_from_Branch__c*/
                        FROM Properties__r)
                    FROM Property__c
                    WHERE RecordType.Name='Pre Login Property Detail' AND Application__c = :oldAppId
                ];
        System.debug('pList '+pList);

        Map<Integer,Property__c> preloginProperties = new Map<Integer,Property__c>();
        Map<Integer,List<Property__c>> allChildProperties = new Map<Integer,List<Property__c>>();
        Map<Integer,Property__c> oldPreloginProperties = new Map<Integer,Property__c>();
        Map<String,String> propertyLinkerMap = new Map<String,String>();

        for(Integer i=0;i< pList.size();i=i+1){
            Property__c newPLProperty = pList.get(i).clone(false,false,false,false);
            newPLProperty.Application__c = objApp.Id;
            preloginProperties.put(i,newPLProperty);
            oldPreloginProperties.put(i,pList.get(i));
            for(Integer j=0;j< pList.get(i).Properties__r.size();j=j+1){
                if(!allChildProperties.containsKey(i)){
                    allChildProperties.put(i,new List<Property__c>());
                }
                Property__c newChildProperty = pList.get(i).Properties__r.get(j).clone(false,false,false,false);
                allChildProperties.get(i).add(newChildProperty);
            }
        }
        System.debug('allChildProperties '+allChildProperties);
        List<Property__c> propertyToInsert = new List<Property__c>();
        INSERT preloginProperties.values();
        for(Integer i =0; i< preloginProperties.size();i++){
            propertyLinkerMap.put(oldPreloginProperties.get(i).Id,preloginProperties.get(i).Id);
            for(Integer j=0;j< allChildProperties.get(i).size();j=j+1){
                allChildProperties.get(i).get(j).Property__c = preloginProperties.get(i).Id;
                propertyToInsert.add(allChildProperties.get(i).get(j));
            }
        }
        INSERT propertyToInsert;
        System.debug('propertyToInsert '+propertyToInsert);
        for(Property_Owners__c po : newPropertieOwnerList){
            String oldPId = po.Property__c;
            System.debug('oldPId '+oldPId);
            if(propertyLinkerMap.containsKey(oldPId)){
                System.debug('propertyLinkerMap.get(oldPId) '+propertyLinkerMap.get(oldPId));
                po.Property__c = propertyLinkerMap.get(oldPId);
            }
        }
        System.debug('propertyLinkerMap '+propertyLinkerMap);
        UPDATE  newPropertieOwnerList;
        
        String appName = oldApp.Name;
        String newAppName = [SELECT Name FROM Application__c WHERE ID = :objApp.Id].Name;
        Wrapper wrap = new Wrapper();
        wrap.preloginId = preLog.Id;
        wrap.appId = objApp.Id;
        wrap.oldAppName = appName;
        wrap.newAppName = newAppName;
        return wrap;   
    }
    
    public class Wrapper{
        @auraEnabled public String preloginId;
        @auraEnabled public String appId;
        @auraEnabled public String oldAppName;
        @auraEnabled public String newAppName;
    }
}