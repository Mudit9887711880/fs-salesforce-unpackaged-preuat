({
	getApps: function(component, event) {
        var action = component.get("c.getExceptionUserApps"); 
        action.setCallback(this, function(response) {
            var state = response.getReturnValue();
            console.log('state is >>',JSON.stringify(state));
            if(state != null){
                component.set("v.appList", state);
            }
        });
        $A.enqueueAction(action);
    },
})