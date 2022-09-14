/**
* @File Name          : ReceiptTriggerHelper.cls
* @Description        : Helper Class for Receipt Trigger for Receipt generation and save as files under 
the Application Object
* @Author             : Ajay Kumar
* @Created On         : 22/04/2022
*==============================================================================
* Ver         Date                     Author                 Modification
*==============================================================================
* 1.0         22/04/2022              Ajay Kumar             Initial Version
*/
public class ReceiptTriggerHelper {
    
    @future(callout=true)
    public static void ReceiptMaker(String jsonString)
    {
        
        List<Receipt__c> receiptList = (List<Receipt__c>)JSON.deserialize(jsonString, List<Receipt__c>.class);
        System.debug('receiptList'+receiptList);
        List<String> preloginList=new List<String>();
        Map<String, Decimal> receiptFee = new Map<String, Decimal>();
        Map<Id,Id>AppMap=new  Map<Id,Id>();
        for(Receipt__c recObj:receiptList){
            if(recObj.Amount__c == null){recObj.Amount__c = 0;}
            
                //recObj.Fee_Code__r.Fee_Collection__c = 0;
         //   if(recObj.Fee_Code__c != null && recObj.Fee_Code__c != ''){
                System.debug(recObj.Fee_Code__c);
            	
              //  recObj.Fee_Code__r.Fee_Collection__c = recObj.Amount__c;
                receiptFee.put(recObj.Fee_Code__c, recObj.Amount__c);
       //  }
         
            preloginList.add(recObj.Pre_Login__c);
        }
        List<Fee_Creation__c> feeUpdate = new List<Fee_Creation__c>();
        if(receiptFee.size() > 0){
            feeUpdate = [SELECT Id, Fee_Collection__c FROM Fee_Creation__c WHERE Id IN :receiptFee.keySet()];
            for(Fee_Creation__c feeCollection : feeUpdate){
                feeCollection.Fee_Collection__c = receiptFee.get(feeCollection.Id);
            }
        }
        if(feeUpdate.size() > 0){
        	update feeUpdate;
        }
        
        for(Application__c appObj:[SELECT Name,Pre_Login__c FROM Application__C Where 	Pre_Login__c IN:preloginList])
        {
            AppMap.put(appObj.Pre_Login__c,appObj.Id);
            
        } 
        
        List<ContentVersion> ContentVersionList=new List<ContentVersion>();
        for(Receipt__c recObj:receiptList)
        {
            PageReference pdf = Page.ReceiptGenerationVF;
            pdf.getParameters().put('recId',recObj.Id);
            Blob content;
            content = pdf.getContent(); 
            ContentVersion cont = new ContentVersion();
            if(recObj.Customer_name__c!=null)
                cont.Title = recObj.Name+'.pdf';
            else
                cont.Title  =  'Receipt.pdf'; 
            cont.PathOnClient = 'Receipt.pdf';
            cont.VersionData = content;
            if(AppMap.containsKey(recObj.Pre_Login__c))
                cont.Login__c= recObj.Pre_Login__c;
            ContentVersionList.add(cont);
        }
        
        system.debug('attach'+ContentVersionList);
        if(ContentVersionList.size()>0)
            insert ContentVersionList;
        
        List<Id>cvList=new List<Id>();
        for(ContentVersion cObj:ContentVersionList)
        {
            cvList.add(cObj.Id);
        }
        
        System.debug('cvList>>>>'+cvList);
        Map<Id,List<Id>>ContentMap=new Map<Id,List<Id>>();
        for(ContentVersion cvObj:[SELECT ContentDocumentId,Login__c FROM ContentVersion WHERE Id IN:cvList])
        {
            if(ContentMap.containsKey(cvObj.Login__c))
                ContentMap.get(cvObj.Login__c).add(cvObj.ContentDocumentId);
            else
                ContentMap.put(cvObj.Login__c,new List<id>{cvObj.ContentDocumentId});    
        }
        
        List<ContentDocumentLink>cdlist=new List<ContentDocumentLink>();
        for(String loginId:ContentMap.keySet())
        {
            if(AppMap.containsKey(loginId))
            {
                for(Integer i=0;i<ContentMap.get(loginId).size();i++)
                {
                    ContentDocumentLink conDocLink = New ContentDocumentLink();
                    conDocLink.LinkedEntityId =AppMap.get(loginId)  ;  
                    conDocLink.ContentDocumentId = ContentMap.get(loginId)[i]; 
                    conDocLink.shareType = 'V';
                    cdlist.add(conDocLink);
                }
                
                
            }
            
        }
        
        System.debug('cdlist>>>'+cdlist);
        
        if(cdlist.size()>0)
            insert cdlist;
        
        
    }
    
    
    
}