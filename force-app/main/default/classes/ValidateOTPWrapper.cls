public class ValidateOTPWrapper {
	public String requestId;
	public Result result;
	public String statusCode;
	public String description;
    public String status;
     public Error error;
    public class Error {
		public String source;
		public String target;
		public String errorCode;
		public String message;
		public String description;
		public String timestamp;
	}
/*	public class Device {
		//public Object 3gSupport;
		public Object deviceActivationDate;
		public Object imei;
		public String model;
	}
*/
/*	public class SimDetails {
		public Object activationDate;
		public Object lastActivityDate;
		public Boolean otpValidated;
		public String provider;
		public String type;
	} */

/*	public class Identity {
		public String dateOfBirth;
		public Object gender;
		public String name;
	}
*/
/*	public class Profile {
		public Object education;
		public Object language;
		public Object maritalStatus;
		public Object occupation;
		public Object relationships;
		public Object workplace;
	} */

	/*public class Contact {
		public String address;
		public String altContact;
		public Object emailId;
		public Object workEmail;
	} */

	public class Result {
	//	public Contact contact;
	//	public Device device;
	//	public Object history;
	//	public Identity identity;
	//	public Profile profile;
	//	public SimDetails simDetails;
	}

	
	public static ValidateOTPWrapper parse(String json) {
		return (ValidateOTPWrapper) System.JSON.deserialize(json, ValidateOTPWrapper.class);
	}
}