({
    getRecords : function(component, event) {
        var recordListData = component.get("v.recordList");
        console.log('@@## recordListData '+recordListData);

        var uniqueArray = [];

        // Loop through array values
        for(let i=0; i < recordListData.length; i++){
            if(uniqueArray.indexOf(recordListData[i]) === -1) {
                uniqueArray.push(recordListData[i]);
            }
        }

        var ExclusionsArray = [];
        let count = 0;
        for(let i=0; i < uniqueArray.length; i++){
            let newObj = {};
            newObj.Name = uniqueArray[i];
            newObj.rowNo = count + 1;
            count ++;
            ExclusionsArray.push(newObj);
        }

        component.set("v.recordListTable", ExclusionsArray);
    }
})