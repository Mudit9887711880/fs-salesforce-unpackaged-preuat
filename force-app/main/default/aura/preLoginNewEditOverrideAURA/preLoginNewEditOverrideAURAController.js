({
    doInit: function(component, event, helper) {
        try{
            //get record type Id
            var recordTypeId = component.get("v.pageReference").state.recordTypeId;
            component.set("v.selectedRecordId", recordTypeId);
            
            console.log('Record Type Name ',component.get("v.pageReference").state);
            
            //get action name edit/new 
            var actionName = component.get("v.pageReference").attributes.actionName;
            console.log('actionName-' + actionName);
            
            //get object API name
            var objectApiName = component.get("v.pageReference").attributes.objectApiName;
            console.log('objectApiName-' + objectApiName);
        /*console.log('bfr reloadLwc in donit -' + component.get("v.reloadLwc"));
        component.set("v.reloadLwc", false);
        console.log('aft reloadLwc in donit -' + component.get("v.reloadLwc"));*/
            
            var action = component.get('c.getApplicationId');
            action.setParams({'recordId':component.get('v.recordId')});
            action.setCallback(this, function(response){
                //console.log('result ',response.getReturnValue());
                var result = response.getReturnValue();
                if(result && result.appId){
                    //console.log(result.appId);
                    //console.log(result.appName);
                    console.log(response.getState());
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
            console.log('exception occurs');
        }    },
})