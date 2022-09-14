({
	init : function(cmp, event, helper) {
        var navService = cmp.find("navService");        
        var action  = cmp.get('c.initiaize');
        action.setParams({ applicationId : cmp.get("v.recordId"),recordTypeName:"AC"});
        action.setCallback(this, function(response) {
            var result = response.getReturnValue();
            if(result === 'Error'){
                helper.showToast(cmp, event, 'Error', 'Please Complete Process Credit Stage First!!', 'error');
                var dismissActionPanel = $A.get("e.force:closeQuickAction");
        		dismissActionPanel.fire();
                return;
            }
            var pageReference = {
                type: 'standard__recordPage',
                attributes: {
                    "recordId": result,
                    "objectApiName": "Verification__c",
                    "actionName": "view"
                }
            };
            cmp.set("v.pageReference", pageReference);
            
            navService.navigate(pageReference);
            
        });
        $A.enqueueAction(action);
        
    }
})