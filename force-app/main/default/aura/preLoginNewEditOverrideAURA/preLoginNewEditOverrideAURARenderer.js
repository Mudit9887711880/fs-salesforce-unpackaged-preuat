({
    
    // Your renderer method overrides go here
    rerender  : function(component,event, helper) {
        //console.log('Iam Called!!'); 
        try{
            this.superRerender();
            var recordTypeId = component.get("v.pageReference").state.recordTypeId;
            console.log('recordTypeId ',component.get("v.pageReference"));
            component.set("v.selectedRecordId", recordTypeId);
            //console.log('recordTypeId ',component.get("v.selectedRecordId"));
            //get action name edit/new
            var actionName = component.get("v.pageReference").attributes.actionName;
            //console.log('actionName-' + actionName);
            
            //get object API name
            var objectApiName = component.get("v.pageReference").attributes.objectApiName;
            //console.log('objectApiName-' + objectApiName);
            
            //console.log('bfr reloadLwc in renderer -' + component.get("v.reloadLwc"));
            if (component.get("v.reloadLwc")) {
                component.set("v.reloadLwc", false);   
            }
            else{
                component.set("v.reloadLwc", true);
            }
            
            //console.log('aft reloadLwc in renderer -' + component.get("v.reloadLwc"));
            
            var action = component.get('c.getApplicationId');
            action.setParams({'recordId':component.get('v.recordId')});
            action.setCallback(this, function(response){
                //console.log('result ',response.getReturnValue());
                var result = response.getReturnValue();
                if(result && result.appId){
                    //console.log(result.appId);
                    //console.log(result.appName);
                    if(response.getState() == 'SUCCESS'){
                        component.set('v.preAppId',result.appId);
                        component.set('v.preAppName',result.appName); 
                        //console.log(component.get('v.preAppId'));
                    }   
                }
            });
            $A.enqueueAction(action);
        }
        catch(exe){
            console.log('Exception in rendered aura ',exe);
        }
        
    }
    
})