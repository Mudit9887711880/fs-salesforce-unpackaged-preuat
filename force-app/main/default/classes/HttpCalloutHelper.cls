public class HttpCalloutHelper {
    
    public API_Handler__mdt calloutMetadata;
    public String base64Str;
    public String className;
    public String body;

    public HttpCalloutHelper(String metadataName, String base64Str){
        System.debug('base64Str in constructor '+base64Str);
        System.debug('metadataname '+metadataName);
        calloutMetadata = [SELECT DeveloperName, Body__c, Endpoint__c, HeaderParameters__c, Method__c, Timeout__c, isActive__c, 
                            Mock_Response__c FROM API_Handler__mdt WHERE DeveloperName =: metadataName];
        this.base64Str = base64Str;
    }
    
    public HttpCalloutHelper(String metadataName, String base64Str,String body){
        System.debug('base64Str in constructor '+base64Str);
        System.debug('metadataName in constructor '+metadataName);
        calloutMetadata = [SELECT DeveloperName, Body__c, Endpoint__c, HeaderParameters__c, Method__c, Timeout__c, isActive__c, 
                            Mock_Response__c FROM API_Handler__mdt WHERE DeveloperName =: metadataName];
        this.base64Str = base64Str;
        this.body = body;
        System.debug('HeaderParameters__c '+calloutMetadata.HeaderParameters__c);
        System.debug('Endpoint__c '+calloutMetadata.Endpoint__c);
    }

    public ResponseWrapper doCallout(){
        ResponseWrapper resWrap = new ResponseWrapper();
        HttpResponse response = new HttpResponse();
        if(calloutMetadata.isActive__c){
            Http http = new Http();
            if(String.isNotEmpty(body)){
                response = http.send(requestWithYourBody(body));
            }
            else
            response = http.send(request());
        }else{
            response.setStatusCode(200);
            response.setBody(calloutMetadata.Mock_Response__c);
        }
        resWrap.response = response;
        resWrap.apiLoggerId = insertAPILogger(className,calloutMetadata.DeveloperName,response.getStatusCode(),response.getBody(),calloutMetadata.Endpoint__c);  
        return resWrap;
    }

    /*
    * This Helper method is use to create Http Request.
    */
    public HttpRequest request(){      
        HttpRequest request = new HttpRequest();  
        if(calloutMetadata != null){
            System.debug('calloutMetadata.Body__c. '+calloutMetadata.Body__c);
            System.debug('base64Str '+base64Str);
            String body = calloutMetadata.Body__c.contains('##REPLACE_WITH_IMAGE##') ? calloutMetadata.Body__c.replaceAll('##REPLACE_WITH_IMAGE##',base64Str) : calloutMetadata.Body__c;
            System.debug('body '+body);
            request.setBody(body);
            request.setEndpoint(calloutMetadata.Endpoint__c);
            request.setMethod(calloutMetadata.Method__c); 
            request.setTimeout(Integer.valueOf(calloutMetadata.Timeout__c));
            Map<String,String> headerMap = getHeaderMap(calloutMetadata.HeaderParameters__c);
            if(!headerMap.isEmpty()){
                for(String key : headerMap.keySet()){
                    request.setHeader(key, headerMap.get(key));
                }
            }
        }
        return request;
    }
    
       public HttpRequest requestWithYourBody(String body){      
        HttpRequest request = new HttpRequest();  
        if(calloutMetadata != null && String.isNotEmpty(body)){
            request.setBody(body);
            request.setEndpoint(calloutMetadata.Endpoint__c);
            request.setMethod(calloutMetadata.Method__c); 
            request.setTimeout(Integer.valueOf(calloutMetadata.Timeout__c));
            Map<String,String> headerMap = getHeaderMap(calloutMetadata.HeaderParameters__c);
            if(!headerMap.isEmpty()){
                for(String key : headerMap.keySet()){
                    request.setHeader(key, headerMap.get(key));
                }
            }
        }
        return request;
    }
    
    private Map<String,String> getHeaderMap(String parameterInfo){
        Map<String, String> parametersMap = new Map<String, String>();
        List<String> parameters = parameterInfo.split('\n');
        for(String urlParam : parameters) {
            List<String> keyValuePair = urlParam.trim().split(':');
            if(!keyValuePair.isEmpty() && keyValuePair.size() == 2) {
                if(String.isNotEmpty(keyValuePair[0]) && String.isNotEmpty(keyValuePair[1])) {
                    parametersMap.put(keyValuePair[0], keyValuePair[1]);
                }
            }
        }
        return parametersMap;
    }
    
    private static String insertAPILogger(String name,String APIName,Integer statusCode,String resBody,String endPoint){
        API_Logger__c al=new API_Logger__c();
        al.Name = name;
        al.API_Name__c = APIName;  
        if(statusCode == 101)  
            al.Status__c = 'success';
        else
            al.Status__c = 'fail';   
        al.Response__c =  resBody.length() > 130068 ? resBody.substring(0, 130068) : resBody;
        al.EndPoint__c = endPoint;
        insert al; 
        return al.Id;
    }
    
    public class ResponseWrapper{
        public HttpResponse response;
        public String apiLoggerId;
    }
}