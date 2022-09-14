public class DedupeResponseWrapper {
    
	public List<Applicant> applicant;
    
	public class Applicant {
		public Applicant applicant;
		public String applicantId;	// 
		public List<Matches> matches;
	}
    
    
	public class Matches {
		public Match match;
	}
    
    
	public class Match {
		public String customerRelId;	// 
		public String cifId;	// 
		public String source;	//xyz
		public List<Loans> loans;
		public String firstName;	//applicantname1
		public String lastName;	//xyz
		public String dob;	//24-06-1982
		public String mobileNo;	//7655433223
		public ResidenceAddress residenceAddress;
		public KYC kycIds;
	}
    
    
	public class Loans {
		public Loan loan;
	}
    
    
	public class Loan {
		public String lan;	// 
		public String lanstatus;	// 
		public String applicationNo;	// 
		public String applicationStatus;	// 
		public String branchCode;	// 
	}
    
    
	public class ResidenceAddress {
		public String addressLine1;	//876 canel bank road
		public String addressLine2;	//Adyar Town
		public String addressLine3;	//Adyar
		public String city;	//Chennai
		public String district;	//Kanchipuram
		public String state;	//Tamilnadu
		public String pincode;	//600087
	}
    
    
	public class KYC {
		public String pan;	//AZKCF1234
		public String passport;	//KPKC2627876554
		public String aadhaar;	//6666777788889999
		public String voterId;	//vo1817171717
		public String drivingLicense;	//tn07ksdjfksdjf
	}
    
}