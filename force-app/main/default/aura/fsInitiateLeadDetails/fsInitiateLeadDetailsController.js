({
    doInit : function(component, event, helper) {
        var action = component.get("c.getAllLoanApplicant");
        action.setParams({ 'applicationId' : component.get("v.recordId") });
        action.setCallback(this, function(response) {
            var state = response.getState();
            console.log('response ### ',response.getReturnValue());
            console.log('response ### ',response.getReturnValue()[0].Verifications__r);
            
            try{
            if (state === "SUCCESS") {
                var loanApplicant = response.getReturnValue()[0].Loan_Applicants__r;
                var isPCRecordAvailable = response.getReturnValue()[0].Verifications__r !== undefined && response.getReturnValue()[0].Verifications__r.length > 0 ? true : false;
                console.log('isPCRecordAvailable #### ',isPCRecordAvailable);
                var loanApplicantId = [];
                var primaryApplicantName = '';
                loanApplicant.forEach(element =>{
                    loanApplicantId.push(element.Id); 
                    if(element.Customer_Type__c == 'Primary Applicant'){
                    	primaryApplicantName = element.Customer_Information__r.Name;
                	}                
                });
                    console.log('primaryApplicantName ### '+primaryApplicantName);
                    let compDefinition = {
                    componentDef: "c:fsLeadDetails",
                    attributes: {
                        recordId: component.get("v.recordId"),
                        allLoanApplicant : loanApplicantId,
                        preLogin : response.getReturnValue()[0].Pre_Login__c,
                        primaryApplicantName : primaryApplicantName,
                        isPCRecordAvailable : isPCRecordAvailable
                    }
                };
                                      let encodedCompDef = btoa(JSON.stringify(compDefinition));
                var urlEvent = $A.get("e.force:navigateToURL");
                urlEvent.setParams({
                    "url": "/one/one.app#" + encodedCompDef
                });
                urlEvent.fire();  
            }
            }catch(error){
                console.log(error);
            }
        });
        $A.enqueueAction(action);
        
    }
})