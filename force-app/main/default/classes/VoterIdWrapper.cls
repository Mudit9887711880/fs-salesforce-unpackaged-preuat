public class VoterIdWrapper{
	public cls_result result;
	public String requestId;	//10808147-d1d8-4b96-afa0-3d5038df003e
	public String statusCode;	//101
	public String description;	//Valid Authentication
	public class cls_result {
		public String psLatLong;	//0.0,0.0
		public String rlnNameV1;	//विजयराज सामादारीया
		public String rlnNameV2;	//
		public String rlnNameV3;	//
		public String partNo;	//140
		public String rlnType;	//F
		public String sectionNo;	//5
		public String id;	//S131820140050271
		public String epicNo;	//SHA4722088
		public String rlnName;	//Vijairaj Samdariya
		public String district;	//MumbaiCity
		public String lastUpdate;	//06-01-2022
		public String state;	//Maharashtra
		public String acNo;	//182
		public String slnoInpart;	//271
		public String psName;	//BrihanMumbai Mahanagarpalika, Worli Naka School, Ground Floor, Room No. 1, Dr. Annie Besant Road, Mumbai 400 018
		public String pcName;	//Mumbai South
		public String houseNo;	//1302
		public String name;	//Gaurav Vijairaj Samdariya
		public String partName;	//Dr. Annie Besant Road
		public String stCode;	//S13
		public String gender;	//M
		public Integer age;	//33
		public String acName;	//Worli
		public String nameV1;	//गौरव विजयराज सामादारीया
		public String dob;	//07-10-1987
		public String nameV3;	//
		public String nameV2;	//
	}
	public static VoterIdWrapper parse(String json){
		return (VoterIdWrapper) System.JSON.deserialize(json, VoterIdWrapper.class);
	}


}