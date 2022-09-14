/*
* ──────────────────────────────────────────────────────────────────────────────────────────────────
* @author           Parag Goyal 
* @modifiedBy       Parag Goyal   
* @created          2022-07-21
* @modified         2022-07-21
* @TestClassName    ''
* @Description      This component is build to handle all the operations related to 
                    Owners Validation of Vehicle_RC,Electricity_Bill,Property_Tax and 
                    Vehicle_RC_Advance at PC Stage in FiveStar.              
* ──────────────────────────────────────────────────────────────────────────────────────────────────
*/
public class OwnerValidationsController {
    
    @AuraEnabled
    public static String callOwnersAPIs(String recordId, String mdtName, Map<String,String> params){ 
        System.debug('Params '+recordId+' :: '+mdtName+' :: '+params);      
        HttpCalloutHelper http = new HttpCalloutHelper(mdtName,null,getRequestBody(params,mdtName));
        http.className = 'OwnerValidationsController';
        HttpCalloutHelper.ResponseWrapper resWrap = http.doCallout();
        System.debug('KYC RESPWRAP '+resWrap.response.getBody());   
        if( resWrap.response.getStatusCode() == 200){
            KYCWrapper respWrap = KYCWrapper.parse(resWrap.response.getBody());
            if(respWrap.statusCode != null && respWrap.statusCode == 101 && respWrap.result != null){
                KYC__c kyc=new KYC__c();
                if(mdtName == 'Vehicle_RC'){
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
                    if(string.isNotBlank(respWrap.result.rcRegnDt))  
                        kyc.RC_Regn_Date__c = Date.valueOf(convertDate(respWrap.result.rcRegnDt));
                    if(string.isNotBlank(respWrap.result.rcFinancer))    
                        kyc.RC_Financer__c=respWrap.result.rcFinancer;
                    if(string.isNotBlank(respWrap.result.rcPermanentAddress))    
                        kyc.RC_Permanent_Address__c=respWrap.result.rcPermanentAddress; 
                    if(string.isNotBlank(respWrap.result.rcPermanentAddress))    
                        kyc.RC_Permanent_Address__c=respWrap.result.rcPermanentAddress; 
                    if(string.isNotBlank(respWrap.result.rcValidUpto)) 
                        kyc.RC_Valid_Upto__c = Date.valueOf(convertDate(respWrap.result.rcValidUpto));
                }  
                if(mdtName == 'Electricity_Bill'){
                    if(string.isNotBlank(respWrap.result.billNo))  
                        kyc.Bill_No__c=respWrap.result.billNo;
                    if(respWrap.result.billDueDate!=null)
                        kyc.Bill_Due_Date__c = Date.valueOf(convertDate(respWrap.result.billDueDate));
                    if(string.isNotBlank(respWrap.result.consumerNumber))    
                        kyc.Consumer_Number__c=respWrap.result.consumerNumber;
                    if(string.isNotBlank(respWrap.result.billAmount))    
                        kyc.Bill_Amount__c=decimal.valueof(respWrap.result.billAmount);
                    if(string.isNotBlank(respWrap.result.billIssueDate))
                        kyc.Bill_Issue_Date__c = Date.valueOf(convertDate(respWrap.result.billIssueDate));
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
                    if(string.isNotBlank(respWrap.result.billDate))
                        kyc.Bill_Date__c = Date.valueOf(convertDate(respWrap.result.billDate));
                } 
                if(mdtName == 'Property_Tax'){
                    List<Tax_Calculations__c> listtaxcalculationToInsert = new List<Tax_Calculations__c>();
                    List<Owner_Details__c> listownerDetailsToInsert = new List<Owner_Details__c>();
                    List<Payment_Details__c> listPaymentDetailsToInsert = new List<Payment_Details__c>();
                    List<Floor_Details__c> listFloorDetailsToInsert = new List<Floor_Details__c>();
                    if(respWrap.result.propertyDetails != null){
                        Property_Details__c pd = new Property_Details__c();
                        pd.KYC__c = kyc.id;
                        if(string.isNotBlank(respWrap.result.propertyDetails.propertyId)) 
                            pd.Property_Id__c = respWrap.result.propertyDetails.propertyId;
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
                        INSERT pd;
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
                                if(detail.effectiveFromDate!=null)
                                    FloorDetails.Effective_From_Date__c=  date.valueof(detail.effectiveFromDate);
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
                        INSERT Penalty;
                    }  
                    if(respWrap.result.ownerDetails!=null){
                        for(KYCWrapper.cls_ownerDetails detail:respWrap.result.ownerDetails){
                            Owner_Details__c OwnerDetail=new Owner_Details__c();
                            OwnerDetail.KYC__c=kyc.id;
                            if(detail.mobileNo!=null)
                                OwnerDetail.Mobile_No__c=detail.mobileNo;
                            if(detail.ownerName!=null)
                                OwnerDetail.name=detail.ownerName;
                            if(detail.email!=null && string.isNotBlank(detail.email))
                                OwnerDetail.Email__c=detail.email;
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
                } 
                if(mdtName == 'Vehicle_RC_Advance'){
                    if(string.isNotBlank(respWrap.result.bodyTypeDescription))  
                        kyc.Body_Type_Description__c=respWrap.result.bodyTypeDescription; 
                    if(string.isNotBlank(respWrap.result.fatherName))  
                        kyc.father_husband__c=respWrap.result.fatherName;
                    if(string.isNotBlank(respWrap.result.fitnessUpto))
                        kyc.Fitness_Upto__c = Date.valueOf(convertDate(respWrap.result.fitnessUpto));
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
                    if(string.isNotBlank(respWrap.result.nationalPermitIssuedBy))
                        kyc.National_Permit_Issued_By__c = Date.valueOf(convertDate(respWrap.result.nationalPermitIssuedBy));
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
                    if(string.isNotBlank(respWrap.result.pucExpiryDate))
                        kyc.PUC_Expiry_Date__c = Date.valueOf(convertDate(respWrap.result.pucExpiryDate));
                    if(string.isNotBlank(respWrap.result.registeredAt))    
                        kyc.RC_Registered_At__c=respWrap.result.registeredAt;                    
                    if(string.isNotBlank(respWrap.result.taxPaidUpto))  
                        kyc.Tax_Paid_Upto__c=respWrap.result.taxPaidUpto;  
                    if(string.isNotBlank(respWrap.result.chassisNumber))    
                        kyc.RC_ChasiNo__c=respWrap.result.chassisNumber; 
                    if(string.isNotBlank(respWrap.result.registrationDate))   
                        kyc.Registration_Date__c = Date.valueOf(convertDate(respWrap.result.registrationDate));
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
                } 
                API_Logger__c al=new API_Logger__c();
                al.Name='OwnerValidationsController';
                al.API_Name__c='Owner Validations'; 
                al.Status__c='Success';
                al.Response__c = resWrap.response.getBody();
                //al.EndPoint__c = request.getEndpoint();
                INSERT al;
                kyc.Api_Logger__c = al.Id;
                INSERT kyc;
                return 'Validated Successfully';
            }  
        }
        return null;
    }
    
    private static String getRequestBody(Map<String,String> params, String mdtName ){
        String  kycRequest = '';
        if(mdtName == 'Electricity_Bill'){
            kycRequest = '{ "consumerId": "'+params.get('consumerId')+'", "serviceProvider": "'+params.get('serviceProvider')+'", "consent": "Y" } ';
        }
        if(mdtName == 'Vehicle_RC'){
            kycRequest = '{ "consent": "Y", "engineNo": "'+params.get('engineNo')+'", "chassisNo": "'+params.get('chassisNo')+'", "state": "'+params.get('state')+'" }  ';
        }
        if(mdtName == 'Property_Tax'){
            kycRequest = '{ "state": "'+params.get('stateName')+'", "city": "'+params.get('city')+'", "propertyNo": "'+params.get('propertyNo')+'", "district": "", "ulb": "", "consent": "y" }  ';
        }
        if(mdtName == 'Vehicle_RC_Advance'){
            kycRequest = '{ "registrationNumber": "'+params.get('registrationNumber')+'", "consent": "Y", "version": 3.1 } ';
        }
        return kycRequest;
    }
    
    private static String convertDate(String dob){
        String str = dob;
        string day=str.SubStringBefore('-');
        string month=str.SubStringafter('-');
        string year=month.SubStringafter('-');
        month=month.SubStringBefore('-');
        return year+'-'+month+'-'+day; 
    }

    @AuraEnabled
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
    
}