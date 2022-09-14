/**
 * @author            : Ajay kumar
 * @group             : TechMatrix Consulting
 * @description       : Service class of fsHighmarkObligationsScreen component
 * @created on        : 20-07-2022
 * @last modified on  : 24-07-2022
 * @last modified by  : Ajay kumar
 **/
public with sharing class fsHighmarkObligationsScreenController {

	// method to fetch the Overall Remarks
	@AuraEnabled
	public static String getcharacterRepayment(String verfId, String recTypeName) {
		system.debug('verficiation Id' + verfId);
		system.debug('recTypeName' + recTypeName);

		List<Character__c > charList = [SELECT Id FROM Character__c WHERE RecordType.Name =: recTypeName AND Verification__c =: verfId AND Section_Type__c = 'Repayment Behaviour Detail' LIMIT 1 ];
		System.debug('Character Id' + charList);
		if (charList.size() > 0)
			return charList[0].Id;
		return null;
	}

	// this method is used to fetch the recordTypeId
	@AuraEnabled(cacheable = true)
	public static Id getRecordTypeId(String objName, String recordTypeName) {
		system.debug('objName' + objName + ' :::: recordTypeName' + recordTypeName);
		return Schema.getGlobalDescribe().get(objName).getDescribe().getRecordTypeInfosByName().get(recordTypeName).getRecordTypeId();

	}

	//to get the Highmark Obligations Records 
	@AuraEnabled(cacheable = true)
	public static List<HighmarkObligationsWrapper> getHighmarkObligations(String appId) {

		Integer index = 1;
		Map<String, Loan_Details__c > ScoreMap = new Map<String, Loan_Details__c > ();
		Map<String, Bureau_Highmark__c > bureauMap = new Map<String, Bureau_Highmark__c > ();
		List<HighmarkObligationsWrapper> wrapperList = new List<HighmarkObligationsWrapper> ();

		system.debug('appid' + appId);		 
		Set<String> bureauHighmarkIdSet = new Set<String> ();
		List<Loan_Details__c > loanDetailList = new List<Loan_Details__c > ();
		for (Loan_Applicant__c applicantRecord: [SELECT Id, Application__c, (SELECT Id, Loan_Applicant__c FROM Bureau_Highmarks__r) FROM Loan_Applicant__c WHERE Application__c =: appId]) {
			if (applicantRecord.Bureau_Highmarks__r.size() > 0) {
				for (Bureau_Highmark__c bureauObj: applicantRecord.Bureau_Highmarks__r)
					bureauHighmarkIdSet.add(bureauObj.Id);
			}  
		}	
        String loanDetailRecordTypeId = Schema.getGlobalDescribe().get('Loan_Details__c').getDescribe().getRecordTypeInfosByName().get('Loan Details').getRecordTypeId();


		Boolean flag = false;
		if (bureauHighmarkIdSet.size() > 0) {
			for (Bureau_Highmark__c bureauObj: [SELECT Id, Loan_Applicant__r.Customer_Information__r.Name, Highmark_Score__c, Loan_Applicant__c, (SELECT Id, Type_of_Loan__c, Loan_Amt__c, O_S__c, Overdue_Amt__c, Obligations__c, Type__c, Ownership__c,
					Current_DPD__c, Max_DPD__c, To_be_considerd_for_DBR__c, Remarks__c, Loan_Applicant__c, Bureau_Highmark__c FROM AccountsSummaries__r WHERE RecordTypeId =:loanDetailRecordTypeId) FROM Bureau_Highmark__c WHERE Id IN: bureauHighmarkIdSet]) {
				if (bureauObj.Loan_Applicant__c != null) {
					bureauMap.put(bureauObj.Loan_Applicant__c, bureauObj);
				}
				if (bureauObj.AccountsSummaries__r.size() > 0) {
					for (Loan_Details__c loanObj: bureauObj.AccountsSummaries__r) {
						flag = true;
						HighmarkObligationsWrapper wrapObj = new HighmarkObligationsWrapper();
						wrapObj.srNo = index;
						wrapObj.id = loanObj.Id;
						wrapObj.loanApplicantId = bureauObj.Loan_Applicant__c;
						wrapObj.applicantName = bureauObj.Loan_Applicant__r.Customer_Information__r.Name;
						wrapObj.highmarkScore = bureauObj.Highmark_Score__c;
						wrapObj.loanAmt = loanObj.Loan_Amt__c;
						wrapObj.osAmt = loanObj.O_S__c;
						wrapObj.overdueAmount = loanObj.Overdue_Amt__c;
						wrapObj.obligations = loanObj.Obligations__c;
						wrapObj.typeofloan = loanObj.Type_of_Loan__c;
						wrapObj.ownership = loanObj.Ownership__c;
						wrapObj.currentDPD = loanObj.Current_DPD__c;
						wrapObj.maxdpd = loanObj.Max_DPD__c;
						wrapObj.tobeconsiderValue = (loanObj.To_be_considerd_for_DBR__c != null) ? loanObj.To_be_considerd_for_DBR__c : '';
						wrapObj.remarks = loanObj.Remarks__c;
						wrapObj.type = loanObj.Type__c;
						if (loanObj.Type__c == 'Self')
							wrapObj.IsSelfType = true;
						else
							wrapObj.IsSelfType = false;
						index++;
						wrapperList.add(wrapObj);
						wrapperList[0].HighmarkMap = bureauMap;
					}
				}
			}
		}

		if (flag == false) {
			HighmarkObligationsWrapper wrapObj = new HighmarkObligationsWrapper();
			wrapObj.srNo = 1;
			wrapObj.IsSelfType = true;
			wrapObj.type = 'Self'; 
			wrapObj.id= '';
			wrapObj.applicantName= '';
			wrapObj.typeofloan= '';
			wrapObj.ownership= '';
			wrapObj.currentDPD= '';
			wrapObj.remarks= '';
			wrapObj.tobeconsiderValue= '';
			wrapObj.maxdpd= '';
			wrapObj.overdueAmount= 0;
			wrapObj.osAmt= 0;
			wrapObj.obligations= 0;
			wrapObj.loanAmt= 0;
			wrapObj.highmarkScore= '';
			wrapObj.bureauId= ''; 
			wrapObj.isChanged= false;
			wrapperList.add(wrapObj);
			wrapperList[0].HighmarkMap = bureauMap;
		}

		System.debug('size' + wrapperList.size());
		return wrapperList;
	}

	// to save highmark Obligations records
	@AuraEnabled
	public static String saveObligations(String dataWrapper) {
		system.debug('dataWrapper' + dataWrapper);
		List<Loan_Details__c > loanList = new List<Loan_Details__c > ();
		List<HighmarkObligationsWrapper> wrapperList = (List<HighmarkObligationsWrapper> ) JSON.deserialize(dataWrapper, List<HighmarkObligationsWrapper> .class);

		Set<Id> loanAppSet = new Set<Id> ();
		for (HighmarkObligationsWrapper wrapObj: wrapperList) {
			if (wrapObj.isChanged == true && wrapObj.IsSelfType) {
				if (wrapObj.loanApplicantId != null)
					loanAppSet.add(wrapObj.loanApplicantId);
			}
		}
		List<Bureau_Highmark__c > bureautobeCreate = new List<Bureau_Highmark__c > ();
		Map<Id, Id> bureauLoanMap = new Map<Id, Id> ();
		List<Bureau_Highmark__c > bureauList = [SELECT Id, Highmark_Score__c FROM Bureau_Highmark__c WHERE Loan_Applicant__c IN: loanAppSet];
		system.debug('bureauList' + bureauList);
		if (bureauList.size() == 0) {
			for (String loanObj: loanAppSet) {
				Bureau_Highmark__c bObj = new Bureau_Highmark__c();
				bObj.Loan_Applicant__c = loanObj;
				bObj.Highmark_Score__c = '0';
				bureautobeCreate.add(bObj);
			}
		} else {
			for (Bureau_Highmark__c bobj: bureauList) {
				bureauLoanMap.put(bobj.Loan_Applicant__c, bobj.Id);
			}
		}
		if (bureautobeCreate.size() > 0 && bureautobeCreate != null)
			insert bureautobeCreate;

		system.debug('bureautobeCreate' + bureautobeCreate);

		for (Bureau_Highmark__c bobj: bureautobeCreate) {
			bureauLoanMap.put(bobj.Loan_Applicant__c, bobj.Id);
		}
		system.debug('bureauLoanMap' + bureauLoanMap);
		String loanDetailRecordTypeId = Schema.getGlobalDescribe().get('Loan_Details__c').getDescribe().getRecordTypeInfosByName().get('Loan Details').getRecordTypeId();

		for (HighmarkObligationsWrapper wrapObj: wrapperList) {
			if (wrapObj.isChanged == true) {
				Loan_Details__c loanObj = new Loan_Details__c();
				if (wrapObj.IsSelfType) {
                    loanObj.RecordTypeId = loanDetailRecordTypeId;
					loanObj.Loan_Applicant__c = wrapObj.applicantName;
					loanObj.Type_of_Loan__c = wrapObj.typeofloan;
					loanObj.Bureau_Highmark__c = wrapObj.bureauId != null ? wrapObj.bureauId : (bureauLoanMap.containsKey(wrapObj.loanApplicantId) ? bureauLoanMap.get(wrapObj.loanApplicantId) : null);
					loanObj.Type__c = wrapObj.type;
					loanObj.Ownership__c = wrapObj.ownership;
					loanObj.Loan_Amt__c = wrapObj.loanAmt;
					loanObj.O_S__c = wrapObj.osAmt;
					loanObj.Overdue_Amt__c = wrapObj.overdueAmount;
					loanObj.Obligations__c = wrapObj.obligations;
					loanObj.Current_DPD__c = wrapObj.currentDPD;
					loanObj.Max_DPD__c = wrapObj.maxdpd;
				} else {
					loanObj.Id = wrapObj.id;
				}
				loanObj.To_be_considerd_for_DBR__c = wrapObj.tobeconsiderValue;
				loanObj.Remarks__c = wrapObj.remarks;
				loanList.add(loanObj);
			}
		}
		system.debug('loandetails OBj list' + loanList);

		if (!loanList.isEmpty() && loanList.size() > 0) {
			try {
				upsert loanList;
				return 'success';
			} catch (DmlException e) {
				System.debug(e.getMessage());
				return 'error';
			}
		}
		system.debug('dataWrapper' + wrapperList);
		return null;

	}

	// highmark Obligations Wrapper Class
	public class HighmarkObligationsWrapper {
		@AuraEnabled public Integer srNo;
		@AuraEnabled public String bureauId;
		@AuraEnabled public String id;
		@AuraEnabled public String applicantName;
		@AuraEnabled public String typeofloan;
		@AuraEnabled public String ownership;
		@AuraEnabled public String currentDPD;
		@AuraEnabled public String maxdpd;
		@AuraEnabled public String tobeconsiderValue;
		@AuraEnabled public String remarks;
		@AuraEnabled public Decimal osAmt;
		@AuraEnabled public Decimal overdueAmount;
		@AuraEnabled public Decimal obligations;
		@AuraEnabled public String highmarkScore;
		@AuraEnabled public Decimal loanAmt;
		@AuraEnabled public String type;
		@AuraEnabled public Boolean IsSelfType;
		@AuraEnabled public String loanApplicantId;
		@AuraEnabled public Map<String, Bureau_Highmark__c > HighmarkMap;
		@AuraEnabled public Boolean isChanged;

		public HighmarkObligationsWrapper() {
			isChanged = false;
			remarks = '';
			tobeconsiderValue = '';
		}

	}

}