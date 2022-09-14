/*
* ──────────────────────────────────────────────────────────────────────────────────────────────────
* @author           Parag Goyal  
* @modifiedBy       Parag Goyal  
* @created          2022-07-25
* @modified         2022-08-03
* @TestClassName    
* @Description      This component is build to handle all the operations related to 
Agreement Execution Stage in FiveStar.              
* ──────────────────────────────────────────────────────────────────────────────────────────────────
*/
public class AgreementExecutionController extends GenericFormBuilderController {
    
    //Getting All Applicants Of Application
    @AuraEnabled
    public static List<Loan_Applicant__c> getApplicants(String applicationId){
        if(String.isNotBlank(applicationId) && String.isNotEmpty(applicationId)){
            return [SELECT Id,Customer_Information__r.Name,Application__c,Applicant_Name__c,Customer_Information__c
                    FROM Loan_Applicant__c 
                    WHERE Application__c = :applicationId];
        }
        return null;
    }
    
    //Getting Primary Applicant Of Application
    @AuraEnabled
    public static Loan_Applicant__c getPrimaryApplicant(String applicationId){
        if(String.isNotBlank(applicationId) && String.isNotEmpty(applicationId)){
            return [SELECT Id,Customer_Information__r.Name,Application__c,Applicant_Name__c,Customer_Information__c,Customer_Type__c
                    FROM Loan_Applicant__c 
                    WHERE Application__c = :applicationId AND Customer_Type__c = 'Primary Applicant'];
        }
        return null;
    }
    
    //Getting Address Of Applicant
    @AuraEnabled
    public static String getApplicantAddress(String loanAppId){
        if(String.isNotBlank(loanAppId) && String.isNotEmpty(loanAppId)){
            return [SELECT Id,Residence_Address_Line_1__c
                    FROM Loan_Applicant__c 
                    WHERE Id = :loanAppId ].Residence_Address_Line_1__c;
        }
        return null;
    }
    
    //Getting NACH Parties Details For Nach Screen
    @AuraEnabled
    public static Map<String,String> getNACHApplicants(String applicationId){
        if(String.isNotBlank(applicationId) && String.isNotEmpty(applicationId)){
            Map<String,String> mapOfNACHParties = new Map<String,String>();
            Application__c objApp = [SELECT Id,Nach_Party__c,Nach_Party_2__c,NACH_Party_1_ID__c,NACH_Party_2_ID__c
                                     FROM Application__c
                                     WHERE Id = :applicationId AND ((Nach_Party__c != NULL AND NACH_Party_1_ID__c != NULL)  
                                                                    OR  (Nach_Party_2__c != NULL AND NACH_Party_2_ID__c != NULL))];
            if(objApp != null){
                mapOfNACHParties.put(objApp.NACH_Party_1_ID__c,objApp.Nach_Party__c);
                mapOfNACHParties.put(objApp.NACH_Party_2_ID__c,objApp.Nach_Party_2__c);
            }
            if(mapOfNACHParties.size() > 0)
                return mapOfNACHParties;
        }
        return null;
    }
    
    //Getting AC Property Of Application 
    @AuraEnabled
    public static List<Property__c> getProperties(String applicationId){
        if(String.isNotBlank(applicationId) && String.isNotEmpty(applicationId)){
            return [SELECT Id,Name,Title_Deed_Number__c
                    FROM Property__c
                    WHERE Application__c = :applicationId AND RecordType.Name = 'AC Property Detail'];
        }
        return null;
    }
    
    //Generic Method To Get Insert/Update Record Form
    @AuraEnabled
    public static GenericFormBuilderController.InitWrapper getEditPageContent(String recordIds, String metaDetaName){
        AgreementExecutionController genericObj = new AgreementExecutionController();
        genericObj.METADATA_NAME = metaDetaName;
        genericObj.IDS_SET = new Set<String>();
        if(String.isNotEmpty(recordIds)){
            genericObj.IDS_SET = new Set<String>();
            genericObj.IDS_SET.addAll(recordIds.split('_'));
            genericObj.WHERE_CLAUSE = ' Id IN : IDS_SET';
            genericObj.RECORD_LIMIT = '1'; 
        }
        System.debug('genericObj.initialize() $$$$$ '+genericObj.initialize());
        return genericObj.initialize();
    }  
    
    //Save Record
    @AuraEnabled
    public static string saveRecord(sobject dataToInsert){
        System.debug(dataToInsert);
        System.debug(dataToInsert.getSObjectType());
        try{
            system.debug(':::dataToInsert:::' + dataToInsert);
            upsert dataToInsert; 
            return  dataToInsert.Id;
        } catch(Exception ex){
            System.debug('exception ::: '+ex);
            System.debug('exception ::: '+ex.getMessage());
            System.debug('exception ::: '+ex.getLineNumber());
            return null;
        }
    }
    
    //Getting Applicant Records In Data Table 
    @AuraEnabled
    public static GenericDataTableController.DataTableResponse getAgDataTable(String recordId,String metaDataName, String tabName){
        System.debug('recordId=  '+recordId);
        SET<String> recIds = new SET<String>();
        if(tabName == 'CKYC'){
            for(Loan_Applicant__c objLa : [SELECT Id FROM Loan_Applicant__c
                                           WHERE Application__c  =: recordId AND Application__c  != NULL AND CKYC_ID_Number__c != NULL]){
                                               recIds.add(objLa.Id); 
                                           }
        }
        if(tabName == 'NACH'){
            for(Bank_Detail__c objBank : [SELECT Id FROM Bank_Detail__c
                                          WHERE Loan_Applicant__c  =: recordId AND Loan_Applicant__c  != NULL]){
                                              recIds.add(objBank.Id); 
                                          }
        }
        if(tabName == 'Doc_Gen'){
            for(Agreement_Execution_Document_Generation__c objDg : [SELECT Id FROM Agreement_Execution_Document_Generation__c
                                                                    WHERE Application__c  =: recordId AND Application__c  != NULL
                                                                    AND RecordType.Name = 'Vernacular / LTI Declaration']){
                                                                        recIds.add(objDg.Id); 
                                                                    }
        }
        GenericDataTableController genericDTObj = new GenericDataTableController();
        genericDTObj.METADATA_NAME = metaDataName; 
        genericDTObj.IDS_SET = recIds;
        genericDTObj.WHERE_CLAUSE = ' ID IN : IDS_SET';
        return genericDTObj.getTable();     
    }
    
    //Get All List Of Documents Uploaded In List Of Document Screen
    @AuraEnabled
    public static List<ContentVersion> getContentVersionRecords(String parentId, String stage){
        List<ContentVersion> listOfContentVersion = new List<ContentVersion>();
        Map<String,ContentVersion> mapOfDocSetCode = new Map<String,ContentVersion>();
        listOfContentVersion = [SELECT Id, CreatedDate, ContentDocumentId, Title, Uploaded_From__c, Document_Name__c, Parent_Id__c, Current_Record_Id__c,
                                Agreement_Document_Type__c, Document_Number__c, Document_Date__c, Number_of_Pages__c, Document_Condition__c
                                FROM ContentVersion 
                                WHERE Parent_Id__c =:parentId AND Uploaded_From__c =:stage];
        List<String> docSetCodeList = new List<String>();
        if(listOfContentVersion.size() > 0){
            for(ContentVersion con : listOfContentVersion){
                docSetCodeList.add(con.Document_Name__c);
            }
        }
        return listOfContentVersion;
    }
    
    @AuraEnabled
    public static String updateDocuments(String strData){
        List<DocWrapper> listToUpdate = new List<DocWrapper> ();
        try{
            listToUpdate = (List<DocWrapper>) System.JSON.deserialize(strData, List<DocWrapper>.class);
            List<ContentVersion> cvList= new List<ContentVersion>();
            for(DocWrapper wrapObj : listToUpdate){
                cvList.add(wrapObj.cv);
            }
            
            if(!cvList.isEmpty()){
                update cvList;
            }
            return 'success';
        }catch(Exception ex){
            System.debug('Error in saveDOSData= '+ex.getMessage());
            return 'failed';
        }
    }
    
    @AuraEnabled
    public static List<DocWrapper> getContentVersionRecordsNew(String parentId, String stage){
        List<ContentVersion> listOfContentVersion = new List<ContentVersion>();
        List<DocWrapper> wrapperList = new List<DocWrapper>();
        Map<String,String> mapOfDocSetCode = new Map<String,String>();
        Set<String> docNames = new Set<String>();
        listOfContentVersion = [SELECT Id, CreatedDate, ContentDocumentId, Title, Uploaded_From__c, Document_Name__c, Parent_Id__c, Current_Record_Id__c,
                                Agreement_Document_Type__c, Document_Number__c, Document_Date__c, Number_of_Pages__c, Document_Condition__c
                                FROM ContentVersion 
                                WHERE Parent_Id__c =:parentId AND Uploaded_From__c =:stage];
        
        for(ContentVersion cv : listOfContentVersion){
            if(String.isNotBlank(cv.Document_Name__c)){
                docNames.add(cv.Document_Name__c);
            }
        }
        
        if(!docNames.isEmpty()){
            for(Document_Set_Code__c docSetCode : [SELECT Id, Document_Set_Code__c FROM Document_Set_Code__c WHERE Id IN: docNames]){
                mapOfDocSetCode.put(docSetCode.Id, docSetCode.Document_Set_Code__c);
            }
            
            for(ContentVersion cv : listOfContentVersion){
                DocWrapper docWrapObj = new DocWrapper();
                docWrapObj.cv = cv;
                if(String.isNotBlank(cv.Document_Name__c) && mapOfDocSetCode.containsKey(cv.Document_Name__c)){
                    docWrapObj.docNumber = mapOfDocSetCode.get(cv.Document_Name__c);
                }
                wrapperList.add(docWrapObj);
            }
            
        }
        return wrapperList;
    }
    
    @AuraEnabled
    public static List<String> checkCKYCId(String applicationId){
        List<String> listOfLoanAppCKYC = new List<String>();
        if(String.isNotBlank(applicationId) && String.isNotEmpty(applicationId)){
            List<Loan_Applicant__c> listOfLoanApp = [SELECT Id,Name,Applicant_Name__c,Application__c,CKYC_ID_Number__c 
                                                     FROM Loan_Applicant__c
                                                     WHERE Application__c = :applicationId AND CKYC_ID_Number__c = NULL];
            if(listOfLoanApp.size() > 0){
                for(Loan_Applicant__c objLoan : listOfLoanApp){
                    listOfLoanAppCKYC.add(objLoan.Name+' :: '+objLoan.Applicant_Name__c);
                }   
            }
        }
        return listOfLoanAppCKYC;
    }
    
    @AuraEnabled
    public static List<String> checkDocGenerated(String applicationId){
        String recordTypesToCheck = System.Label.Document_Generation_Record_Type_Name;
        Map<String,Boolean> checkRecordsMap = new Map<String,Boolean>();
        List<String> recordTypeNames = recordTypesToCheck.split(',');
        Map<Id,Loan_Applicant__c> loanApplicantMap = new Map<Id,Loan_Applicant__c>([SELECT Id,Applicant_Name__c FROM Loan_Applicant__c WHERE Application__c = :applicationId]);
        for(String loanAppliantId : loanApplicantMap.keySet()){
            for(String rcName : recordTypeNames){
                String key = rcName +' :: '+ loanApplicantMap.get(loanAppliantId).Applicant_Name__c; 
                checkRecordsMap.put(key, false);
            }
        }
        List<Agreement_Execution_Document_Generation__c> listOfPendingDoc = [SELECT Applicant_Name__c,Application__c,Loan_Applicant__c,RecordType.Name
                                                                             FROM Agreement_Execution_Document_Generation__c
                                                                             WHERE Application__c = :applicationId];
        System.debug(listOfPendingDoc);
        List<String> aeList = new List<String>();
        for(Agreement_Execution_Document_Generation__c objAE : listOfPendingDoc){
            String key = objAE.RecordType.Name +' :: '+ objAE.Applicant_Name__c;
            if(checkRecordsMap.containsKey(key)){
                checkRecordsMap.put(key,true);
            }
        }
        
        for(String keyItem : checkRecordsMap.keySet()){
            if(!checkRecordsMap.get(keyItem)){
                aeList.add(keyItem);
            }
        }
        
        return aeList;
    }
    
    @AuraEnabled
    public static String moveApplicationStage(String applicationId){
        Application__c objApp = [SELECT Id,Stage__c FROM Application__c WHERE Id = :applicationId];
        objApp.Stage__c = 'Dispatch Pending';
        UPDATE objApp;
        return objApp.Stage__c;
    }
    
    @AuraEnabled
    public static Boolean checkSendBackVaidation(String applicationId){
        List<Verification__c> acList = new List<Verification__c>([SELECT Id FROM Verification__c WHERE Application__c =: applicationId AND recordTypeId =: Utility.VERIFICATION_AC_RECORD_TYPE_ID AND Status__c =: 'Pending']);
        List<Legal_Approval__c> laList = new List<Legal_Approval__c>([SELECT Id FROM Legal_Approval__c WHERE Application__c =: applicationId AND Status__c =: 'Pending']);
        if((!acList.isEmpty() && acList.size() > 0) || (!laList.isEmpty() && laList.size() > 0)){
            return false;
        }else{
            return true;
        }        
    } 
    
    @AuraEnabled
    public static String sendBackLegalApproval(String applicationId){
        List<Legal_Approval__c> legalList = new List<Legal_Approval__c>([SELECT Id,Status__c,Application__c FROM Legal_Approval__c WHERE Application__c =: applicationId ORDER BY CreatedDate DESC LIMIT 1]);
        if(legalList.size() > 0){
            legalList.get(0).Status__c = 'Pending';
            Update legalList;
            return 'Success';   
        } 
        return 'Error'; 
    }
    
    @AuraEnabled
    public static String sendBackAprovalCredit(String applicationId){
        List<Verification__c> approvalList = new List<Verification__c>([SELECT Id,Status__c,Application__c FROM Verification__c WHERE Application__c =: applicationId ORDER BY CreatedDate DESC LIMIT 1]);
        if(approvalList.size() > 0){
            approvalList.get(0).Status__c = 'Pending';
            Update approvalList;
            return 'Success';
        }
        return 'error';
    }
    
    @AuraEnabled
    public static Boolean checkDOSCondition(String recordId){
        Boolean decision = true;
        if(String.IsNotBlank(recordId)){
            List<Application__c> appList = [SELECT 
                                            ID, Name, Group_Total_Exposure__c, Loan_Amount__c, Sourcing_Branch__r.State__c 
                                            FROM Application__c
                                            WHERE ID =:  recordId];
            String branch = appList.get(0).Sourcing_Branch__r.State__c;           
            Decimal amount = appList.get(0).Group_Total_Exposure__c;                      
            if(branch == 'TN' || branch == 'AP' || branch == 'TS' || branch == 'KA'){
                if(amount <= 400000){
                    decision = false;
                }
            }else if(branch == 'MP' || branch == 'MH' || branch == 'CG' || branch == 'UP'){
                if(amount <= 300000){
                    decision = false;
                }
            }
            appList.get(0).DOS_Required__c = decision;
            if(decision){
                appList.get(0).Sub_Stage__c = 'DOS';
            }
            update appList;
        }
        return decision;
    }
    
    @AuraEnabled
    public static String checkPennyDrop(String applicationId){
        String defList = '';
        Map<String,String> mapOfApplicants = new Map<String,String>();
        mapOfApplicants = getNACHApplicants(applicationId);
        iF(!mapOfApplicants.isEmpty()){
         	List<Bank_Detail__c> listBank = [SELECT Id,Loan_Applicant__r.Applicant_Name__c
                                         	 FROM Bank_Detail__c
                                         	 WHERE Loan_Applicant__c IN :mapOfApplicants.keySet()
                                                   AND Is_Account_Verified__c = FALSE
                                                   AND Loan_Applicant__c != NULL
                                                   AND Application__c = :applicationId];
            if(!listBank.isEmpty()){
                defList = 'Penny Drop is pending for ';
             	for(Bank_Detail__c objBank : listBank){
                	defList += objBank.Loan_Applicant__r.Applicant_Name__c+', ';
                }      
                defList.removeEnd(',');
                defList += 'In Nach & Disbursement Tab';
            }
        }
        System.debug('defList '+defList);
        return defList;
    }
    
    @AuraEnabled
    public static String checkBankDetailsExist(String applicationId){
        String defList = '';
        Map<String,String> mapOfApplicants = new Map<String,String>();
        Map<String,String> mapOfBankApplicants = new Map<String,String>();
        mapOfApplicants = getNACHApplicants(applicationId);
        iF(!mapOfApplicants.isEmpty()){
         	List<Bank_Detail__c> listBank = [SELECT Id,Loan_Applicant__r.Applicant_Name__c
                                         	 FROM Bank_Detail__c
                                         	 WHERE Loan_Applicant__c IN :mapOfApplicants.keySet()
                                                   AND Loan_Applicant__c != NULL
                                                   AND Application__c = :applicationId];
            if(!listBank.isEmpty()){
             	for(Bank_Detail__c objBank : listBank){
                	mapOfBankApplicants.put(objBank.Loan_Applicant__c,objBank.Loan_Applicant__r.Applicant_Name__c);
                }      
                for(String str : mapOfApplicants.keySet()){
                    if(!mapOfBankApplicants.containsKey(str)){
                        defList += mapOfApplicants.get(str)+', ';
                    }
				}
                if(String.isNotEmpty(defList) && String.isNotBlank(defList)){
                    defList = 'Bank Details not found for '+defList+' in Nach & Disbursement Tab';
                }
            }
        }
        System.debug('defList '+defList);
        return defList;
    }
    
    @AuraEnabled
    public static Boolean checkDecision(String applicationId){
        if(String.isNotBlank(applicationId) && String.isNotEmpty(applicationId)){
            Application__c objApp = [SELECT Id,Agreement_Execution_Status__c FROM Application__c WHERE Id = :applicationId];
            if(String.isNotBlank(objApp.Agreement_Execution_Status__c) && String.isNotEmpty(objApp.Agreement_Execution_Status__c))
                return true;
        }
        return false;
    }
    
    public class DocWrapper{
        @AuraEnabled public ContentVersion cv;
        @AuraEnabled public String docNumber;
        
        public DocWrapper(){
            cv = new ContentVersion();
            docNumber = '';
        }
    }
}