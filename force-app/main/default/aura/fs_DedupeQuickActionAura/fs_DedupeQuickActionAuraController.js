({
    doInit: function (component, event, helper) {

        let compDefinition = {
            componentDef: "c:fsdedupeDetailsLwc",
            attributes: {
                recordId: component.get("v.recordId"),
                source : 'Check Dedupe'
            }
        };
        let encodedCompDef = btoa(JSON.stringify(compDefinition));//btao() is used for encoding string to base64
        var urlEvent = $A.get("e.force:navigateToURL");
        urlEvent.setParams({
            "url": "/one/one.app#" + encodedCompDef
        });
        urlEvent.fire();
    }
})