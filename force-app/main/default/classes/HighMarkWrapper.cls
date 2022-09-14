/**************** PREVIOUS WRAPPER ****************
public class HighMarkWrapper {
    public BasePlusReportFile basePlusReportFile;

    public class PrimaryAccountsSummary {
        public String primaryNumberOfAccounts;
        public String primaryActiveNumberOfAccounts;
        public String primaryOverdueNumberrOfAccounts;
        public String primarySecuredNumberOfAccounts;
        public String primaryUnsecuredNumberOfAccounts;
        public String primaryUntaggedNumberOfAccounts;
        public String primaryCurrentBalance;
        public String primarySanctionedAmount;
        public String primaryDisbursedAmount;
    }

    public class Scores {
        public List<Score> score;
    }

    public class BasePlusReport {
        public Header header;
        public Request request;
        public Responses responses;
        public PersonalInfoVariation personalInfoVariation;
        public String secondaryMatches;
        public AccountsSummary accountsSummary;
        public List<InquiryHistory> inquiryHistory;
        public Scores scores;
        public PrintableReport printableReport;
    }

    public class History {
        public String memberName;
        public String inquiryDate;
        public String purpose;
        public String ownershipType;
        public String amount;
    }

    public class SecurityDetail {
        public String securityType;
        public String ownerName;
        public String securityValue;
        public String dateOfValue;
        public String securityCharge;
        public String propertyAddress;
        public String automobileType;
        public String yearOfManufacture;
        public String registrationNumber;
        public String engineNumber;
        public String chassisNumber;
    }

    public class SecondaryAccountsSummary {
        public String secondaryNumberOfAccounts;
        public String secondaryActiveNumberOfAccounts;
        public String secondaryOverdueNumberOfAccounts;
        public String secondarySecuredNumberOfAccounts;
        public String secondaryUnSecuredNumberOfAccounts;
        public String secondaryUntaggedNumberOfAccounts;
        public String secondaryCurrentBalance;
        public String secondarySanctionedAmount;
        public String secondaryDisbursedAmount;
    }

    public class LinkedAccounts {
        public AccountDetails accountDetails;
    }

    public class PersonalInfoVariation {
        public NameVariations nameVariations;
        public NameVariations addressVariations;
        public NameVariations panVariations;
        public NameVariations drivingLicenseVariations;
        public NameVariations dateOfBirthVariations;
        public NameVariations voterIdVariations;
        public NameVariations passportVariations;
        public NameVariations phoneNumberVariations;
        public NameVariations rationCardVariations;
        public NameVariations emailVariations;
    }

    public class InquiryHistory {
        public History history;
    }

    public class DerivedAttributes {
        public String inquiriesInLastSixMonths;
        public String lengthOfCreditHistoryYear;
        public String lengthOfCreditHistoryMonth;
        public String averageAccountAgeYear;
        public String averageAccountAgeMonth;
        public String newAccountsInLastSixMonths;
        public String newDelinqAccountsInLastSixMonths;
    }

    public class AccountDetails {
        public String acctNumber;
        public String creditGuarantor;
        public String acctType;
        public String dateReported;
        public String ownershipInd;
        public String accountStatus;
        public String disbursedAmt;
        public String disbursedDate;
        public String lastPaymentDate;
        public String closeDate;
        public String installmentAmt;
        public String overdueAmt;
        public String writeOffAmt;
        public String currentBal;
        public String creditLimit;
        public String accountRemarks;
        public String securityStatus;
        public String frequency;
        public String originalTerm;
        public String termToMaturity;
        public String acctInDispute;
        public String settlementAmt;
        public String principalWriteOffAmt;
        public SecurityDetails securityDetails;
    }

    public class BasePlusReportFile {
        public BasePlusReports basePlusReports;
    }

    public class Request {
        public String name;
        public String aka;
        public String father;
        public String dob;
        public String ageAsOn;
        public String passport;
        public String email1;
        public String email2;
        public String gender;
        public String addresss1;
        public String phone1;
        public String branch;
        public String kendra;
        public String mbrId;
        public String creditInqPurpsTyp;
        public String creditInqPurpsTypDesc;
        public String creditInquiryStage;
        public String creditRptId;
        public String creditReqTyp;
        public String creditRptTrnDtTm;
        public String losAppId;
        public String loanAmount;
    }

    public class AccountsSummary {
        public DerivedAttributes derivedAttributes;
        public PrimaryAccountsSummary primaryAccountsSummary;
        public SecondaryAccountsSummary secondaryAccountsSummary;
    }

    public class LoanDetails {
        public String acctNumber;
        public String creditGuarantor;
        public String acctType;
        public String dateReported;
        public String ownershipInd;
        public String accountStatus;
        public String disbursedAmt;
        public String disbursedDt;
        public String lastPaymentDate;
        public String closedDate;
        public String overdueAmt;
        public String writeOffAmt;
        public String currentBal;
        public String creditLimit;
        public String accountRemarks;
        public String securityStatus;
        public String frequency;
        public String originalTerm;
        public String termToMaturity;
        public String acctInDispute;
        public String settlementAmt;
        public String combinedPaymentHistory;
        public String matchedType;
        public String repaymentTenure;
        public String suitFiledWilfulDefault;
        public String writtenOffSettledStatus;
        public String cashLimit;
        public String actualPayment;
        public String installmentAmt;
        public SecurityDetails securityDetails;
        public LinkedAccounts linkedAccounts;
    }

    public class Responses {
        public List<Response> response;
    }

    public class PrintableReport {
        public String type;
        public String fileName;
        public String content;
    }

    public class Response {
        public List<LoanDetails> loanDetails;
    }

    public class BasePlusReports {
        public BasePlusReport basePlusReport;
    }

    public class Score {
        public String scoreType;
        public String scoreValue;
        public String scoreVersion;
        public String scoreFactors;
        public String scoreComments;
    }

    public class Header {
        public String dateOfRequest;
        public String preparedFor;
        public String preparedForId;
        public String dateOfIssue;
        public String reportId;
        public String batchId;
        public String status;
    }

    public class NameVariations {
        public List<Variation> variation;
    }

    public class SecurityDetails {
        public List<SecurityDetail> securityDetail;
    }

    public class Variation {
        public String value;
        public String reportedDate;
    }

    
    public static HighMarkWrapper parse(String json){
        return (HighMarkWrapper) System.JSON.deserialize(json, HighMarkWrapper.class);
    }
}
**************** PREVIOUS WRAPPER ****************/

/**************** PREVIOUS WRAPPER ****************
public class HighMarkWrapper {
    public BasePlusReportFile basePlusReportFile;

    public class PrimaryAccountsSummary {
        public String primaryNumberOfAccounts;
        public String primaryActiveNumberOfAccounts;
        public String primaryOverdueNumberrOfAccounts;
        public String primarySecuredNumberOfAccounts;
        public String primaryUnsecuredNumberOfAccounts;
        public String primaryUntaggedNumberOfAccounts;
        public String primaryCurrentBalance;
        public String primarySanctionedAmount;
        public String primaryDisbursedAmount;
    }

    public class Scores {
        public List<Score> score;
    }

    public class BasePlusReport {
        public Header header;
        public Request request;
        public Responses responses;
        public PersonalInfoVariation personalInfoVariation;
        public String secondaryMatches;
        public AccountsSummary accountsSummary;
        public List<InquiryHistory> inquiryHistory;
        public Scores scores;
        public PrintableReport printableReport;
    }

    public class History {
        public String memberName;
        public String inquiryDate;
        public String purpose;
        public String ownershipType;
        public String amount;
    }

    public class SecurityDetail {
        public String securityType;
        public String ownerName;
        public String securityValue;
        public String dateOfValue;
        public String securityCharge;
        public String propertyAddress;
        public String automobileType;
        public String yearOfManufacture;
        public String registrationNumber;
        public String engineNumber;
        public String chassisNumber;
    }

    public class SecondaryAccountsSummary {
        public String secondaryNumberOfAccounts;
        public String secondaryActiveNumberOfAccounts;
        public String secondaryOverdueNumberOfAccounts;
        public String secondarySecuredNumberOfAccounts;
        public String secondaryUnSecuredNumberOfAccounts;
        public String secondaryUntaggedNumberOfAccounts;
        public String secondaryCurrentBalance;
        public String secondarySanctionedAmount;
        public String secondaryDisbursedAmount;
    }

    public class LinkedAccounts {
        public AccountDetails accountDetails;
    }

    public class PersonalInfoVariation {
        public NameVariations nameVariations;
        public NameVariations addressVariations;
        public NameVariations panVariations;
        public NameVariations drivingLicenseVariations;
        public NameVariations dateOfBirthVariations;
        public NameVariations voterIdVariations;
        public NameVariations passportVariations;
        public NameVariations phoneNumberVariations;
        public NameVariations rationCardVariations;
        public NameVariations emailVariations;
    }

    public class InquiryHistory {
        public History history;
    }

    public class DerivedAttributes {
        public String inquiriesInLastSixMonths;
        public String lengthOfCreditHistoryYear;
        public String lengthOfCreditHistoryMonth;
        public String averageAccountAgeYear;
        public String averageAccountAgeMonth;
        public String newAccountsInLastSixMonths;
        public String newDelinqAccountsInLastSixMonths;
    }

    public class AccountDetails {
        public String acctNumber;
        public String creditGuarantor;
        public String acctType;
        public String dateReported;
        public String ownershipInd;
        public String accountStatus;
        public String disbursedAmt;
        public String disbursedDate;
        public String lastPaymentDate;
        public String closeDate;
        public String installmentAmt;
        public String overdueAmt;
        public String writeOffAmt;
        public String currentBal;
        public String creditLimit;
        public String accountRemarks;
        public String securityStatus;
        public String frequency;
        public String originalTerm;
        public String termToMaturity;
        public String acctInDispute;
        public String settlementAmt;
        public String principalWriteOffAmt;
        public SecurityDetails securityDetails;
    }

    public class BasePlusReportFile {
        public BasePlusReports basePlusReports;
    }

    public class Request {
        public String name;
        public String aka;
        public String father;
        public String dob;
        public String ageAsOn;
        public String passport;
        public String email1;
        public String email2;
        public String gender;
        public String addresss1;
        public String phone1;
        public String branch;
        public String kendra;
        public String mbrId;
        public String creditInqPurpsTyp;
        public String creditInqPurpsTypDesc;
        public String creditInquiryStage;
        public String creditRptId;
        public String creditReqTyp;
        public String creditRptTrnDtTm;
        public String losAppId;
        public String loanAmount;
    }

    public class AccountsSummary {
        public DerivedAttributes derivedAttributes;
        public PrimaryAccountsSummary primaryAccountsSummary;
        public SecondaryAccountsSummary secondaryAccountsSummary;
    }

    public class LoanDetails {
        public String acctNumber;
        public String creditGuarantor;
        public String acctType;
        public String dateReported;
        public String ownershipInd;
        public String accountStatus;
        public String disbursedAmt;
        public String disbursedDt;
        public String lastPaymentDate;
        public String closedDate;
        public String overdueAmt;
        public String writeOffAmt;
        public String currentBal;
        public String creditLimit;
        public String accountRemarks;
        public String securityStatus;
        public String frequency;
        public String originalTerm;
        public String termToMaturity;
        public String acctInDispute;
        public String settlementAmt;
        public String combinedPaymentHistory;
        public String matchedType;
        public String repaymentTenure;
        public String suitFiledWilfulDefault;
        public String writtenOffSettledStatus;
        public String cashLimit;
        public String actualPayment;
        public String installmentAmt;
        public SecurityDetails securityDetails;
        public LinkedAccounts linkedAccounts;
    }

    public class Responses {
        public List<Response> response;
    }

    public class PrintableReport {
        public String type;
        public String fileName;
        public String content;
    }

    public class Response {
        public List<LoanDetails> loanDetails;
    }

    public class BasePlusReports {
        public BasePlusReport basePlusReport;
    }

    public class Score {
        public String scoreType;
        public String scoreValue;
        public String scoreVersion;
        public String scoreFactors;
        public String scoreComments;
    }

    public class Header {
        public String dateOfRequest;
        public String preparedFor;
        public String preparedForId;
        public String dateOfIssue;
        public String reportId;
        public String batchId;
        public String status;
    }

    public class NameVariations {
        public List<Variation> variation;
    }

    public class SecurityDetails {
        public List<SecurityDetail> securityDetail;
    }

    public class Variation {
        public String value;
        public String reportedDate;
    }

    
    public static HighMarkWrapper parse(String json){
        return (HighMarkWrapper) System.JSON.deserialize(json, HighMarkWrapper.class);
    }
}
**************** PREVIOUS WRAPPER ****************/
public class HighMarkWrapper{
	public basePlusReportFile basePlusReportFile;
	public class basePlusReportFile {
		public basePlusReports basePlusReports;
	}
	public class basePlusReports {
		public basePlusReport basePlusReport;
	}
	public class basePlusReport {
		public header header;
		public request request;
		public personalInfoVariation personalInfoVariation;
		public accountsSummary accountsSummary;
		public responses responses;
		public inquiryHistory[] inquiryHistory;
		public scores scores;
        public PrintableReport printableReport;
	}
	public class header {
		public String dateOfRequest;
		public String preparedFor;
		public String preparedForId;
		public String dateOfIssue;
		public String reportId;
		public String batchId;
		public String status;
	}
	public class request {
		public String name;
		public String dob;
		public String addresss1;
		public String mbrId;
		public String creditInqPurpsTyp;
		public String creditInqPurpsTypDesc;
		public String creditInquiryStage;
		public String creditRptId;
		public String creditReqTyp;
		public String creditRptTrnDtTm;
		public String loanAmount;
	}
	public class personalInfoVariation {
		public nameVariations[] nameVariations;
		public addressVariations[] addressVariations;
		public panVariations[] panVariations;
		public drivingLicenseVariations drivingLicenseVariations;
		public dateOfBirthVariations[] dateOfBirthVariations;
		public voterIdVariations[] voterIdVariations;
		public passportVariations passportVariations;
		public phoneNumberVariations[] phoneNumberVariations;
		public rationCardVariations[] rationCardVariations;
		public emailVariations[] emailVariations;
	}
	public class nameVariations {
		public variation variation;
	}
	public class variation {
		public String value;
		public String reportedDate;
	}
	public class addressVariations {
		public variation variation;
	}
	public class panVariations {
		public variation variation;
	}
	public class drivingLicenseVariations {
        public variation variation;
	}
	public class dateOfBirthVariations {
		public variation variation;
	}
	public class voterIdVariations {
		public variation variation;
	}
	public class passportVariations {
        public variation variation;
	}
	public class phoneNumberVariations {
		public variation variation;
	}
	public class rationCardVariations {
		public variation variation;
	}
	public class emailVariations {
		public variation variation;
	}
	public class accountsSummary {
		public derivedAttributes derivedAttributes;
		public primaryAccountsSummary primaryAccountsSummary;
		public secondaryAccountsSummary secondaryAccountsSummary;
	}
	public class derivedAttributes {
		public String inquiriesInLastSixMonths;
		public String lengthOfCreditHistoryYear;
		public String lengthOfCreditHistoryMonth;
		public String averageAccountAgeYear;
		public String averageAccountAgeMonth;
		public String newAccountsInLastSixMonths;
		public String newDelinqAccountsInLastSixMonths;
	}
	public class primaryAccountsSummary {
		public String primaryNumberOfAccounts;
		public String primaryActiveNumberOfAccounts;
		public String primaryOverdueNumberrOfAccounts;
		public String primarySecuredNumberOfAccounts;
		public String primaryUnsecuredNumberOfAccounts;
		public String primaryUntaggedNumberOfAccounts;
		public String primaryCurrentBalance;
		public String primarySanctionedAmount;
		public String primaryDisbursedAmount;
	}
	public class secondaryAccountsSummary {
		public String secondaryNumberOfAccounts;
		public String secondaryActiveNumberOfAccounts;
		public String secondaryOverdueNumberOfAccounts;
		public String secondarySecuredNumberOfAccounts;
		public String secondaryUnSecuredNumberOfAccounts;
		public String secondaryUntaggedNumberOfAccounts;
		public String secondaryCurrentBalance;
		public String secondarySanctionedAmount;
		public String secondaryDisbursedAmount;
	}
	public class responses {
		public response[] response;
	}
	public class response {
		public loanDetails loanDetails;
	}
	public class loanDetails {
		public String acctNumber;
		public String creditGuarantor;
		public String acctType;
		public String dateReported;
		public String ownershipInd;
		public String accountStatus;
		public String disbursedAmt;
		public String disbursedDt;
		public String lastPaymentDate;
		public String overdueAmt;
		public String writeOffAmt;
		public String currentBal;
		public String combinedPaymentHistory;
		public String matchedType;
        public String installmentAmt;
	}
	public class inquiryHistory {
		public history history;
	}
	public class history {
		public String memberName;
		public String inquiryDate;
		public String purpose;
		public String ownershipType;
		public String amount;
	}
	public class scores {
		public score score;
	}
	public class score {
		public String scoreType;
		public String scoreValue;
		public String scoreComments;
	}
    
   public class PrintableReport {
        public String type;
        public String fileName;
        public String content;
    }
	
	public static HighMarkWrapper parse(String json){
        return (HighMarkWrapper) System.JSON.deserialize(json, HighMarkWrapper.class);
    }
}