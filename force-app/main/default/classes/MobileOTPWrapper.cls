public class MobileOTPWrapper {
	public Result result;
	public String requestId;
	public String statusCode;
	public String description;
    public Error error;
    public class Error {
		public String source;
		public String target;
		public String errorCode;
		public String message;
		public String description;
		public String timestamp;
	}
	public class Result {
		public String message;
	}

	
	public static MobileOTPWrapper parse(String json) {
		return (MobileOTPWrapper) System.JSON.deserialize(json, MobileOTPWrapper.class);
	}
}