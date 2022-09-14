public class PassportWrapper{
	public cls_result result;
	public String requestId;	//e336e717-ab52-4b44-9b34-e0406d5d3034
	public Integer statusCode;	//101
	public String description;	//Valid Authentication
	public class cls_result {
		public cls_passportNumber passportNumber;
		public String applicationDate;	//14/05/2018
		public String typeOfApplication;	//Tatkaal
		public cls_dateOfIssue dateOfIssue;
		public cls_name name;
	}
	public class cls_passportNumber {
		public String passportNumberFromSource;	//S3733862
		public boolean passportNumberMatch;
	}
	public class cls_dateOfIssue {
		public String dispatchedOnFromSource;	//14/05/2018
		public boolean dateOfIssueMatch;
	}
	public class cls_name {
		public Integer nameScore;	//1
		public boolean nameMatch;
		public String surnameFromPassport;	//SHIRHATTI
		public String nameFromPassport;	//OMKAR MILIND
	}
	public static PassportWrapper parse(String json){
		return (PassportWrapper) System.JSON.deserialize(json, PassportWrapper.class);
	}


}