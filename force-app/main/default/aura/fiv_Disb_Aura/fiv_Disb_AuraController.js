({
    doInit: function (component, event, helper) {

        let compDefinition = {
            componentDef: "c:fiv_Disb_Lwc",
            attributes: {
                recordId: component.get("v.recordId")
            }
        };
        let encodedCompDef = btoa(JSON.stringify(compDefinition));//btao() is used for encoding string to base64
        var urlEvent = $A.get("e.force:navigateToURL");
        urlEvent.setParams({
            "url": "/one/one.app#" + encodedCompDef
        });
        urlEvent.fire();

        /*Deprecated as we need its related records  as well 
        var eventParams = event.getParams();
        if (eventParams.changeType === "ERROR") {
            var toastEvent = $A.get("e.force:showToast");
            toastEvent.setParams({
                title: 'ERROR',
                message: component.get("v.recordError") + '.',
                mode: 'dismissible'
            });
            toastEvent.fire();
        }

        console.log(component.get("v.objAppt"));
        */
    }
})