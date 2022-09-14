({
	doInit : function(component, event, helper) {
        console.log('record id ',component.get("v.recordId"));
        
        let compDefinition = {
            componentDef: "c:postApprovalLWC",
            attributes: {
                recordId: component.get("v.recordId"),
            }
        };
        console.log('FIRE NOW')
        let encodedCompDef = btoa(JSON.stringify(compDefinition));
        var urlEvent = $A.get("e.force:navigateToURL");
        urlEvent.setParams({
            "url": "/one/one.app#" + encodedCompDef
        });
        urlEvent.fire();  
    }
})