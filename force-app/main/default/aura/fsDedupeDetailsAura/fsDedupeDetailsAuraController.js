({
    doInit: function (component, event, helper) {
        helper.getApps(component, event);
    },
     nav : function(component, event, helper) {
         component.set("v.Spinner", true); 
         var selectedId = event.getSource('').get('v.value');
         console.log('selectedId >>>',selectedId);
         component.set("v.Result",selectedId);
        
         let compDefinition = {
            componentDef: "c:fsdedupeDetailsLwc",
            attributes: {
                recordId: component.get("v.Result"),
                source : 'Re-Trigger Dedupe'
            }
        };
        let encodedCompDef = btoa(JSON.stringify(compDefinition));
        var urlEvent = $A.get("e.force:navigateToURL");
        urlEvent.setParams({
            "url": "/one/one.app#" + encodedCompDef
        });
        urlEvent.fire();
        component.set("v.Spinner", false); 
        $A.get("e.force:closeQuickAction").fire();
     },  
         
})