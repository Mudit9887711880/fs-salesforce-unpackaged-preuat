({
    getVerificationRecord: function(component, event, helper) {
        var eventParams = event.getParams();
        if(eventParams.changeType === "LOADED") {
            console.log("Record is loaded successfully."+JSON.stringify(component.get("v.verificationRecord")));
            component.set('v.recordTypeDetails',component.get("v.verificationRecord").RecordType);
            console.log('component.get("v.verificationRecord").Application__c ',component.get("v.verificationRecord").Application__c);
            var action  = component.get('c.getAllApplicantMeta');
            action.setParams({ applicationId : component.get("v.verificationRecord").Application__c });
            action.setCallback(this, function(response) {
                console.log('response.getReturnValue() ',response.getReturnValue());
                component.set('v.allApplicantData',response.getReturnValue());
                var applicantData = JSON.parse(response.getReturnValue().strDataTableData); 
                var applicantIds = [];
                console.log(applicantData);
                for(var i=0; i<applicantData.length; i++){
                    applicantIds.push(applicantData[i].Id);    
                }
                component.set('v.allLoanApplicant',applicantIds);
            });
            $A.enqueueAction(action);
        }   
    }    
})