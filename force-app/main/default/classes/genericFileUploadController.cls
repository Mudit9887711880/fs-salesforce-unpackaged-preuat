public without sharing class genericFileUploadController {

     @AuraEnabled
     public static genericFileUploadWrapper getDocumentNames( Id recordId ){

        genericFileUploadWrapper objGenWrap = new genericFileUploadWrapper();
        String sObjectName = String.valueOf( recordId.getSobjectType());
        system.debug('@@@@@@@ sObjectName ' + sObjectName);
        
        for( Document_Name_and_Code__mdt objDocNameCode :  [SELECT Id,DeveloperName, Document_No__c, Document_Type__c, Group_ID__c,Document_Name__c
                                                                                                            FROM Document_Name_and_Code__mdt
                                                                                                             WHERE Sobject_Names__c =: sObjectName ])
        {
            if( !objGenWrap.mapDocumentTypeName.containsKey( objDocNameCode.Document_Type__c ) )
            {
                objGenWrap.mapDocumentTypeName.put( objDocNameCode.Document_Type__c, new List<Document_Name_and_Code__mdt>());
            }
            
            objGenWrap.mapDocumentTypeName.get( objDocNameCode.Document_Type__c).add(objDocNameCode );

        }//end of metadata loop

        //CH01 : adding account lookup
        for( Loan_Applicant__c objCusAppt : [ SELECT id, Customer_Information__c, Customer_Information__r.Name 
                                                                                    FROM  Loan_Applicant__c 
                                                                                    WHERE Application__c = : recordId
                                                                                    AND  Customer_Information__c <> NULL] )
        {
            objGenWrap.mapAccIdName.put( objCusAppt.Customer_Information__c,objCusAppt.Customer_Information__r.Name );
        }//end of Customer_Application__c Loop
        system.debug( objGenWrap );
        return objGenWrap;
     }

     //CH01 : if name exists then add numeric number at last of doc
     @AuraEnabled
     public static void updateDocumentName( String docName, String documentId , String docType, String accountId){
         
        String docNameToChck = '%' + docName +  '%';//CH01
        String suffixIndex = '';
        List<ContentDocument> listContentDocument = [ SELECT Id, Title
                                                      FROM ContentDocument
                                                      WHERE Title Like : docNameToChck AND Id != :documentId
                                                      ORDER BY createdDate DESC LIMIT 1];
        if( !listContentDocument.isEmpty() ){
            if( listContentDocument[0].Title.contains('-'))
            {
                suffixIndex = listContentDocument[0].Title.split('-')[0];
                system.debug( suffixIndex  );
                suffixIndex  = suffixIndex .remove('(').remove(')');
                system.debug( suffixIndex  );
                suffixIndex = '(' + ( Integer.valueOf(suffixIndex) +1 ) + ')';
            }
            else{
                suffixIndex = '(0)';
            }
            
        }
        system.debug( suffixIndex  );
        listContentDocument = [ SELECT Id, Title
                                                 FROM ContentDocument
                                                 WHERE ID =  :documentId ];

        if( String.isNotBlank( suffixIndex ) ){
            suffixIndex += '-' + listContentDocument[0].title +'_'+docName;
            listContentDocument[0].title = suffixIndex;
        }else{
            listContentDocument[0].title +=  '_'+docName;
        }
        system.debug( listContentDocument[0].title  );
        try{
            update listContentDocument;

            List<ContentVersion> listConVer = [ SELECT Id,Category__c,Customer_Information__c, ContentDocumentId  
                                                FROM ContentVersion 
                                                WHERE ContentDocumentId =: documentId ];
            if( !listConVer.isEmpty() )
            {
                listConVer[0].Category__c = docType;
                //CH02
                if(String.isNotBlank(accountId)) {
                    listConVer[0].Customer_Information__c = accountId;
                }    
                update listConVer;
            }
        }catch( Exception e ) {
            system.debug('Exception has occurred! ' + e.getMessage() + ' ==> Line No'+e.getLineNumber());
            throw new AuraHandledException(e.getMessage());
        }
     }//end of updateDocumentName

 //CH01 Start
 public class genericFileUploadWrapper{
    @AuraEnabled public Map<String,List<Document_Name_and_Code__mdt>> mapDocumentTypeName;
    @AuraEnabled public Map< String,String > mapAccIdName;

    public genericFileUploadWrapper(){
        this.mapDocumentTypeName =  new Map<String,List<Document_Name_and_Code__mdt>>();
        this.mapAccIdName = new Map< String,String > {''=>'--NONE--' };
    }
 }
 //CH01 END
}