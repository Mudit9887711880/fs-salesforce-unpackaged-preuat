public class FIVCReportVfController {
    public String applicationId{get;set;}
    public List<String> AppNames{get;set;}
    public List<String> Name{get;set;}
    public Verification__c verificationObj{get;set;}
    public List<Loan_Applicant__c> applicants{get;set;}
    public List<Character__c> familyList{get;set;}
    public List<Character__c> affiliationList{get;set;}
    public List<Character__c> neighbourList{get;set;}
    public List<Character__c> livingStandardList{get;set;}
    public List<Account> accountList{get;set;}
    public List<Property__c> propertyList{get;set;}
    public List<Capability__c> capabilities{get;set;}
    public List<ContentDistribution> imageList{get;set;}
    public List<IncomeWrapper> incomeDetails{get;set;}
    public Decimal totalMonthlyIncome{get;set;}
    public Decimal allObligations{get;set;}
    public Decimal netMonthlyIncome{get;set;}

    public Decimal totalBuildingValue{get;set;}
    public Decimal totalLandValue{get;set;}
    public Decimal totalCollateralValue{get;set;}

    public String image{get;set;}
    Public FIVCReportVfController(){
        applicationId = ApexPages.currentPage().getParameters().get('applicationId');
        
        if(applicationId == '' || applicationId == NULL){
            applicationId = 'a030w000009gf0RAAQ';
        }
        allObligations = 0;
        Set<String> docIds = new Set<String>();
        for(ContentDocumentLink cdl : [SELECT Id, LinkedEntityId, ContentDocumentId FROM ContentDocumentLink WHERE LinkedEntityId =: applicationId]){
            docIds.add(cdl.ContentDocumentId);
        }
        Set<String> cvIds = new Set<String>();
        for(ContentVersion cv : [SELECT Id, ContentDocumentId, Title, FileType, FileExtension, ContentSize FROM ContentVersion WHERE ContentDocumentId IN : docIds AND FileExtension IN ('jpg','jpeg','png','tiff','tif')]){
            cvIds.add(cv.Id);
        }

        imageList = [SELECT Id, Name, ContentVersionId, DistributionPublicURL, contentDownloadURL
                    FROM ContentDistribution WHERE ContentVersionId IN : cvIds];
        System.debug('image list= '+imageList);

        verificationObj = [SELECT 
                           Id, Application__c, Application__r.Name, Remarks__c, I_hereby_declare__c, Owner__c,
                           Status__c, Result__c, Application__r.Requested_Loan_Amount__c, Application__r.Branch__c,
                           Remarks_Declaration__c, Is_applicant_co_applicant_related_kn__c, Is_applic_co_applic_related__c
                           FROM Verification__c 
                           WHERE Application__c =:applicationId 
                           AND recordType.Name = 'FIV - C' 
                           ORDER BY CreatedDate 
                           DESC LIMIT 1];
        
        Set<String> loanApplicantIds = new Set<String>();
        applicants = new List<Loan_Applicant__c>();
        applicants = [SELECT Id, Customer_Information__c, Mobile__c, Customer_Information__r.Name FROM Loan_Applicant__c WHERE Application__c =: applicationId AND Mobile_Verified__c =true];
        for(Loan_Applicant__c loanApplicant : applicants){
            loanApplicantIds.add(loanApplicant.Id);
        }
        
        familyList = new List<Character__c>();
        affiliationList = new List<Character__c>();
        neighbourList = new List<Character__c>();
        livingStandardList = new List<Character__c>();

		allObligations = 0;
        for(Character__c character : [SELECT Id, Loan_Applicant__r.Customer_Information__c, Loan_Applicant__r.Customer_Information__r.Name, 
                         Application__c, Section_Type__c,Customer_Type__c, Family_Member_Name__c ,Relationship__c,
                         Living_with_Applicant__c, Overall_Remarks__c, Neighbour_Name__c, Neighbour_Number__c, FeedBack__c, Remarks__c,
                         Is_Involved__c, Applicant_Type__c, Affiliation_Name__c, Affiliation_with__c, Current_position_Position_held_in_Past__c,
                         Name_of_party__c, No_of_years_in_politics__c, Present_Political_Status__c, Character_Of_Affiliated_Person__c,
                         Lifestyle__c, Lifestyle_Loan_Amount_2L_to_4_Lakhs__c, Lifestyle_Loan_Amount_4L_to_8_Lakhs__c, Lifestyle_Loan_Amount_8Lakhs__c, 
                         Consumer_Durables__c, Living_Standard_Remarks__c
                         FROM Character__c WHERE Loan_Applicant__c IN : loanApplicantIds AND RecordType.Name = 'FIV-C Character'])
        {
            System.debug('IN LOOP= '+ character.Section_Type__c +' - '+character);
            if(character.Section_Type__c == 'Family Detail'){
                familyList.add(character);
            } else if(character.Section_Type__c == 'Neighbour Detail'){
                neighbourList.add(character);
            } else if(character.Section_Type__c == 'Affiliation Detail'){
                affiliationList.add(character);
            } else if(character.Section_Type__c == 'Living Standard Detail'){
                livingStandardList.add(character);
            }
        }
        totalBuildingValue = 0;
        totalLandValue = 0;
        totalCollateralValue = 0;
        propertyList = new List<Property__c>();
        propertyList = [SELECT Id, Name, Original_Mortgage_Document__c, Title_Deed_Number__c, Document_Type__c, 
                        Month__c, Title_Deed_Year__c, Mortgage_property_PINCODE__c, Mortgage_property_Living_property_are__c,
                        Person_residing_at_Mortgage_property__c, Living_property_Pincode__c, Living_property_Distance_from_Branch__c,
                        landmark__c, Overall_Remarks__c, Title_Deed_Date__c, Pathway_Available__c, Distance_from_Branch__c,
                        Boundaries_As_Per_Inspection_Are_Same__c, Mortgage_Property_Area__c, Location_of_Mortgage_Property__c,
                        Mortgage_Property_Remarks__c, Boundries_Remarks__c, Remarks__c, Remarks_land_measurements__c,
                        East_by_land_measurements__c, North_by_land_measurements__c, South_by_land_measurements__c, West_by_land_measurements__c,
                        Enquiry_Name__c, Enquiry_Contact_Number__c, Enquiry_Market_Value__c, Valuation_Remarks__c, Valuation_Market_Value_Per_SqFt__c,                
                        Building_Age__c, Building_Type__c, floor__c, lengthSq_ft__c, widthSq_ft__c, Value_per_sq_ft__c,
                        Land_Measurement_total_area__c, Adopted_Value_Per_SqFt__c, Valuation_Final_land_value__c,
                        Area_value_per_Sq_ft__c, Building_area_total_value__c, Total_Collateral_Value__c, Mortgage_property_distance_from_branch__c,
                        North_By_Land_Physical__c, South_By_Land_Physical__c, East_By_Land_Physical__c, West_By_Land_Physical__c,
                        Land_Measurement_Length_Sq_ft__c, Land_Measurement_Width_Sq_ft__c,Building_Constructed_with_Remarks__c,
                        (SELECT Id, Enquiry_Name__c, Enquiry_Contact_Number__c, Enquiry_Market_Value__c FROM Enquiries__r WHERE Object_Type__c='Enquiry')
                        FROM Property__c  
                        WHERE Application__c =: applicationId AND RecordType.Name = 'FIV-C Property Detail' ];
        
        for(Property__c pro : propertyList){
            totalLandValue = totalLandValue + (pro.Valuation_Final_land_value__c != NULL ? pro.Valuation_Final_land_value__c : 0);
            totalBuildingValue = totalBuildingValue + (pro.Building_area_total_value__c != NULL ? pro.Building_area_total_value__c : 0);
            totalCollateralValue = totalCollateralValue + (pro.Total_Collateral_Value__c != NULL ? pro.Total_Collateral_Value__c : 0); 
        }

        capabilities = [SELECT Id, Loan_Applicant__c, Loan_Applicant__r.Customer_Information__c, 
                        Loan_Applicant__r.Customer_Information__r.Name, Segment__c, Income_segment__c,
                        Subsegment__c, Year_of_Occupation__c, Proof__c, Proof_Remarks__c, Other_Confirmations__c,
                        Income_per_month__c, Income_Remarks__c, Business_Reference_Name__c, Business_Reference_Contact_Number__c,
                        Feedback__c, Business_Reference_Remarks__c, Monthly_Salary__c, Rental_Income__c,
                        Income_per_day__c, Number_of_days__c, Day_Margin_Basis__c, Sales_per_month__c, Margin__c,
                        Electricity__c, Rent__c, Others__c, Salary__c
                        FROM Capability__c 
                        WHERE Verification__c =: verificationObj.Id Order BY Loan_Applicant__r.Customer_Information__r.Name]; 
        
        totalMonthlyIncome = 0;
        netMonthlyIncome = 0;       
        incomeDetails = new List<IncomeWrapper>();
        for(Capability__c cap : capabilities){
            IncomeWrapper incWrapObj = new IncomeWrapper();
            incWrapObj.applicantName = cap.Loan_Applicant__r.Customer_Information__r.Name;
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
            incWrapObj.incomePerMonth = ''+monthlyIncome;
            totalMonthlyIncome += monthlyIncome;

            incomeDetails.add(incWrapObj);
        }

        netMonthlyIncome = totalMonthlyIncome - allObligations;
    }


    @AuraEnabled	
    public static void generateFIVCPdf(String verificationId, String applicationId){
        PageReference pdf = Page.FIVCReportVf;
        pdf.getParameters().put('applicationId',applicationId);
        Blob body;
        
        if(Test.isRunningTest()) { 
            body = blob.valueOf('Unit.Test');
        } else {
            body = pdf.getContentAsPDF();
        }    
        ContentVersion cv = new ContentVersion(Title = 'FIV-C Report',Document_Type__c='FIV-C Report', PathOnClient ='FIV-C Report.PDF', VersionData = body, FirstPublishLocationId = applicationId);
        insert cv;
    }


    public class IncomeWrapper{
        public String applicantName{get;set;}
        public String incomePerMonth{get;set;}

        public IncomeWrapper(){
            applicantName = '';
            incomePerMonth = '';
        }
    }
}