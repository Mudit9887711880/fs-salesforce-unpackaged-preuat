({
	doInit : function(component, event, helper) {
        console.log('record id ',component.get("v.recordId"));
        
        let compDefinition = {
            componentDef: "c:fsDocumentDispatch",
            attributes: {
                recordId: component.get("v.recordId"),
            }
        };
        
        let encodedCompDef = btoa(JSON.stringify(compDefinition));
        var urlEvent = $A.get("e.force:navigateToURL");
        urlEvent.setParams({
            "url": "/one/one.app#" + encodedCompDef
        });
        urlEvent.fire();  
    }
})