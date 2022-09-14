({
    doInit : function(component, event, helper) {
        var action = component.get("c.getAllLoanApplicant");
        action.setParams({ 'applicationId' : component.get("v.recordId") });
        action.setCallback(this, function(response) {
            var state = response.getState();
            console.log('response ### ',response.getReturnValue());
            
            if (state === "SUCCESS") {
                var loanApplicant = response.getReturnValue()[0].Loan_Applicants__r;
                var loanApplicantId = [];
                loanApplicant.forEach(element =>{
                    loanApplicantId.push(element.Id);    
                });
                    let compDefinition = {
                    componentDef: "c:fsLeadDetails",
                    attributes: {
                        recordId: component.get("v.recordId"),
                        allLoanApplicant : loanApplicantId
                    }
                };
                                      let encodedCompDef = btoa(JSON.stringify(compDefinition));
                var urlEvent = $A.get("e.force:navigateToURL");
                urlEvent.setParams({
                    "url": "/one/one.app#" + encodedCompDef
                });
                urlEvent.fire();  
            }
        });
        $A.enqueueAction(action);
        	
    }
})