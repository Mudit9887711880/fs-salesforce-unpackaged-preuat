/**
* @File Name          : ReceiptGenerationVFController.cls
* @Description        : Apex Controller for Receipt PDF Generation
* @Author             : Ajay Kumar
* @Created On         : 22/04/2022
*==============================================================================
* Ver         Date                     Author                 Modification
*==============================================================================
* 1.0         22/04/2022              Ajay Kumar             Initial Version
*/

public class ReceiptGenerationVFController {
    public Application__C appObj {get;set;} 
    public String accountObj {get;set;}
    public Receipt__c recObj{get;set;}
    public String ReceiptDate{get;set;}
    public String BranchName{get;set;}
    public String currDate{get;set;}
    public String amountInWords{get;set;}
    public String feeCode{get;set;}
    public ReceiptGenerationVFController()
    {
        try 
        {	//List<Loan_Applicant__c> appAccountObj = new List<Loan_Applicant__c>();
            recObj=[SELECT Receipt_Id__c,Receipt_Date__c,Amount__c,Cashier__C,Pre_Login__C,Application__C,Fee_Code__c, Fee_Code__r.Fee_Code__c FROM Receipt__c WHERE Id=:ApexPages.currentPage().getParameters().get('recId')]; 
            ReceiptDate=recObj.Receipt_Date__c.day()+'-';
            System.debug('Fee code Name>>>'+recObj.Fee_Code__r.Fee_Code__c);
            ReceiptDate=((recObj.Receipt_Date__c.day()>9)?String.valueOf(recObj.Receipt_Date__c.day()):'0'+recObj.Receipt_Date__c.day())+'-'+((recObj.Receipt_Date__c.month()>9)?String.valueOf(recObj.Receipt_Date__c.month()):'0'+recObj.Receipt_Date__c.month())+'-'+ recObj.Receipt_Date__c.year();
            System.debug('ReceiptDate>>>>> '+ReceiptDate);
            appObj=[SELECT Id,Name,Pre_Login__c FROM Application__c Where 	Id=:recObj.Application__C];
            System.debug('ApplicationObj>>>>> '+appObj);
            List<Loan_Applicant__c> appAccountObj=[SELECT Id,Customer_Information__r.Name FROM Loan_Applicant__c Where Application__c=:appObj.Id And Customer_Type__c ='Primary Applicant' LIMIT 1];
            if(appAccountObj.isEmpty()){
                System.debug('AccountObj>>>>> '+appAccountObj);
                accountObj = '';
               
            }
            else{
                System.debug('AccountObj>>>>> '+appAccountObj);
               	accountObj = appAccountObj[0].Customer_Information__r.Name; 
            }
            List<Account> branchNameList=[SELECT Branch_Master__r.Name FROM Account Where User__c IN(SELECT OwnerId FROM Pre_Login__c WHERE Id=:recObj.Pre_Login__c)];
            if(branchNameList.isEmpty()){
                System.debug('BRanch Name>>>>> '+branchNameList);
                BranchName = '';
               
            }
            else{
                System.debug('BRanch Name>>>>> '+branchNameList);
               	BranchName = branchNameList[0].Branch_Master__r.Name; 
            }
            System.debug('BRanch Name>>>'+BranchName);
            
            if(recObj.Fee_Code__r.Fee_Code__c <> null && recObj.Fee_Code__r.Fee_Code__c <> ''){
                feeCode = recObj.Fee_Code__r.Fee_Code__c;
            }
            system.debug('Amount'+ recObj.Amount__c);
            if(recObj.Amount__c <> null){
                amountInWords = amountInWords(recObj.Amount__c);
            }
            else{
                amountInWords = '0';
            }
        }
        catch(Exception e)
        {
            System.debug('exception>>>>>'+e);
        } 
        currDate=System.Datetime.now().format('dd-MM-yyyy h:mm a');
        system.debug('>>>Record id>> ' +ApexPages.currentPage().getParameters().get('recId') );
        system.debug('APPOBJ>>>'+appObj);
        system.debug('APPOBJ>>>'+accountObj);
        system.debug('recObj>>>'+recObj);
        system.debug('BRanch Name>>>'+BranchName);
    }
    // @Author : Sangeeta Yadav
    // Description : This method is used to convert amount to words
    // @Date : 09-Aug-2022
    public String amountInWords(Decimal num) {
        System.debug('Inside amountInWords');
        if(num == null){
            return '';
        }
        Decimal junkVal = num;
        Decimal junkValPaisa = junkVal - Math.floor(junkVal);
        junkVal = Math.floor(junkVal);
        
        String obStr = junkVal.toPlainString();
        String[] numReversed = obStr.split('');
        String[] actnumber = reverse(numReversed);
        String firstHalf = convertInWords(numReversed, actnumber);
        
        Integer tmp = Math.round(junkValPaisa * 100);
        junkValPaisa = (Decimal)tmp / 100; System.debug('jj :' + junkValPaisa);
        String paisaStr = junkValPaisa.toPlainString();
        String secondHalf;
        if (paisaStr == '0') {
            secondHalf = '';
        } else if (paisaStr.length() != 4) {
            paisaStr = paisaStr + '0';
            paisaStr = paisaStr.substring(2);
            String [] numReversedPaisa = paisaStr.split('');
            String[] actnumberPaisa = reverse(numReversedPaisa);
            secondHalf = convertInWords(numReversedPaisa, actnumberPaisa);
        } else {
            paisaStr = paisaStr.substring(2);
            String [] numReversedPaisa = paisaStr.split('');
            String[] actnumberPaisa = reverse(numReversedPaisa);
            secondHalf = convertInWords(numReversedPaisa, actnumberPaisa);
        }
        
        String SumOFHalves = '';
        
        if (secondHalf.length() > 4) {
            firstHalf = firstHalf.replace('Only', 'Rupees And ');
            secondHalf = secondHalf.replace('Only', 'Paisa Only');
            SumOFHalves = firstHalf + secondHalf;
        } else {
            firstHalf = firstHalf.replace('Only', 'Rupees Only');
            SumOFHalves = firstHalf;
        }
        
        // IF amount has any value
        if (SumOFHalves.length() > 5) {
            return SumOFHalves;
        } else {
            return '';
        }
    }
    // Method reverse the number
    public List<String> reverse(List<String> strToRev) {
        List<String> revList = new List<String>();
        for (Integer i = strToRev.size() - 1; i >= 0; i--) {
            revList.add(strToRev.get(i));
        }
        revList.add('');
        return revList;
    }
    
    public String convertInWords(String[] numRev, String[] actnum) {
        List<String> iWords = new List<String> {'Zero', ' One', ' Two', ' Three', ' Four', ' Five', ' Six', ' Seven', ' Eight', ' Nine'};
            List<String> ePlace = new List<String> {' Ten', ' Eleven', ' Twelve', ' Thirteen', ' Fourteen', ' Fifteen', ' Sixteen', ' Seventeen', ' Eighteen', ' Nineteen'};
                List<String> tensPlace = new List<String> {'dummy', ' Ten', ' Twenty', ' Thirty', ' Forty', ' Fifty', ' Sixty', ' Seventy', ' Eighty', ' Ninety' };
                    
                    Integer iWordsLength = numRev.size();
        String totalWords = '';
        List<String> inWords = new List<String>();
        for (Integer k = 0; k < iWordsLength; k++) {
            inWords.add('');
        }
        String finalWord = '';
        Integer j = 0;
        
        // Main For loop
        for (Integer i = 0; i < iWordsLength; i++) {
            
            if (i == 0) {
                if (actnum[i] == '0' || actnum[i + 1] == '1') {
                    inWords[j] = '';
                } else {
                    inWords[j] = iWords[Integer.valueof(actnum[i])];
                }
                inWords[j] = inWords[j] + ' Only';
            } else if (i == 1) {
                
                if (actnum[i] == '0') {
                    inWords[j] = '';
                } else if (actnum[i] == '1') {
                    inWords[j] = ePlace[Integer.valueof(actnum[i - 1])];
                } else {
                    inWords[j] = tensPlace[Integer.valueof(actnum[i])];
                }
            } else if (i == 2) {
                if (actnum[i] == '0') {
                    inWords[j] = '';
                } else if (actnum[i - 1] != '0' && actnum[i - 2] != '0') {
                    inWords[j] = iWords[Integer.valueof(actnum[i])] + ' Hundred and';
                } else {
                    inWords[j] = iWords[Integer.valueof(actnum[i])] + ' Hundred';
                }
            } else if (i == 3) {
                if (actnum[i] == '0' || actnum[i + 1] == '1') {
                    inWords[j] = '';
                } else {
                    inWords[j] = iWords[Integer.valueof(actnum[i])];
                }
                if (actnum[i + 1] != '0' || Integer.valueof(actnum[i]) > 0) {
                    inWords[j] = inWords[j] + ' Thousand';
                }
            } else if (i == 4) {
                
                if (actnum[i] == '0') {
                    inWords[j] = '';
                } else if (actnum[i] == '1') {
                    inWords[j] = ePlace[Integer.valueof(actnum[i - 1])];
                } else {
                    inWords[j] = tensPlace[Integer.valueof(actnum[i])];
                }
                
            } else if (i == 5) {
                if (actnum[i] == '0' || actnum[i + 1] == '1') {
                    inWords[j] = '';
                } else {
                    inWords[j] = iWords[Integer.valueof(actnum[i])];
                }
                if (actnum[i + 1] != '0' || Integer.valueof(actnum[i]) > 0) {
                    inWords[j] = inWords[j] + ' Lakh';
                }
            } else if (i == 6) {
                
                if (actnum[i] == '0') {
                    inWords[j] = '';
                } else if (actnum[i] == '1') {
                    inWords[j] = ePlace[Integer.valueof(actnum[i - 1])];
                } else {
                    inWords[j] = tensPlace[Integer.valueof(actnum[i])];
                }
                
            } else if (i == 7) {
                if (actnum[i] == '0' || actnum[i + 1] == '1' ) {
                    inWords[j] = '';
                } else {
                    inWords[j] = iWords[Integer.valueof(actnum[i])];
                }
                inWords[j] = inWords[j] + ' Crore';
            } else if (i == 8) {
                
                if (actnum[i] == '0') {
                    inWords[j] = '';
                } else if (actnum[i] == '1') {
                    inWords[j] = ePlace[Integer.valueof(actnum[i - 1])];
                } else {
                    inWords[j] = tensPlace[Integer.valueof(actnum[i])];
                }
                
            }
            
            j++;
        }
        // End of For loop
        
        // Reverse the List
        inWords = reverse(inWords);
        
        for (Integer i = 0; i < inWords.size(); i++) {
            finalWord += inWords[i];
        }
        
        return finalWord;
    }
       
}