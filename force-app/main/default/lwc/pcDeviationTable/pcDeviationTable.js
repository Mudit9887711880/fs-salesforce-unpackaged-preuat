import { LightningElement, track, api } from 'lwc';
import getTrDeviationData from '@salesforce/apex/pcDeviationController.getTrDeviationData';
import getRelatedRecords from '@salesforce/apex/Fiv_Disb_LwcController.getRelatedRecords';
import getLoanApplicant from '@salesforce/apex/FeeCreationTypeInsuranceNewController.getLoanApplicant';
import picklistValues from '@salesforce/apex/FeeCreationTypeInsuranceNewController.picklistValues';
import getNewRow from '@salesforce/apex/pcDeviationController.getNewRow';
import saveDeviation from '@salesforce/apex/pcDeviationController.saveDeviation';
import saveNewDeviation from '@salesforce/apex/pcDeviationController.saveNewDeviation';
import getDevCodeFromMaster from '@salesforce/apex/pcDeviationController.getDevCodeFromMaster';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import MailingPostalCode from '@salesforce/schema/Contact.MailingPostalCode';
import saveDeviationApplication from '@salesforce/apex/pcDeviationController.saveDeviationApplication';
//save for vs 2
import saveTrDeviationRecords from '@salesforce/apex/pcDeviationController.saveTrDeviationRecords';
// commented for vs 2
//import getUserBasedOnLevel from '@salesforce/apex/pcDeviationController.getUserBasedOnLevel';
import getUserBasedOnSourcingBranch from '@salesforce/apex/pcDeviationController.getUserBasedOnSourcingBranch';
import getLowestLevelePendingTRDevRecords from '@salesforce/apex/pcDeviationController.getLowestLevelePendingTRDevRecords';
import getCurrentLoginUser from '@salesforce/apex/pcDeviationController.getCurrentLoginUser';
import sendEmailToApprovalUser from '@salesforce/apex/pcDeviationController.sendEmailToApprovalUser';

//Pending for decision
//import getPendingDeviationData from '@salesforce/apex/pcDeviationController.getPendingDeviationData';

export default class PcDeviationTable extends LightningElement {
    @track deviationSpinner = false;
    @api applicationId;
    @track data = [];
    @track isData = true;
    @track applicableForArr = [];
    @track applicableFor = [];
    @track applicant = false;
    @track asset = false;
    @track isApplication = false;
    @track applicants = [];
    @track properties = [];
    @track forApplicableForSelect = [];
    @track approvalAuthority = [];
    @track approvalUser = [];
    @track isRaise = false;
    @track existingdevOption = [];
    @track devCodeMaster = [];
    @track masterLevelMap = [];
    @track deviationLevelMap = [];
    @track authNewLevel = '';
    @track newRemark = '';
    @track masterRemarkMap = [];
    @track devNewLevel = '';
    @track preDevUpdate = new Map();
    @track applicableForUpdate = new Map();
    @track isError = false;
    @track applicantOption = [];
    @track assetOption = [];
    @track userMap = new Map();
    // @track updatePrevDeviations = {devId : '', authorityId : '', devRemark : '', devMitigant : ''};
    //for vs 2
    @track currentUser;
    @track currentDevLevelToApprove;
    @track allowRaiseDeviation = false;
    @track isSave = true;
    @api stageName;
    @track isDisplay = false;
    @track devCodeMap = new Map();
    @track sendMailShow = false;
    //Pending for decision
    //  @track decisionPending= [];

    connectedCallback() {
        console.log('In connected call back');
        setTimeout(() => {
            console.log('this.application ID ', this.applicationId);
            if(this.applicationId != undefined){
            this.deviationSpinner = true;
            this.getTrRecords();
            }
            console.log('stageName in pc deviation table',this.stageName);
            if(this.stageName == 'Approval Credit' || this.stageName == 'Disbursal Author'){
                this.isDisplay = true;
            }
            else if(this.stageName == 'Process Credit' || this.stageName == 'Disbursal Maker'){
                this.isDisplay = false;
            }
            //  this.devCodeValuesAre();
            // this.applicableForMethod();
            // this.getApplicantAset();
            // this.getPendingRecords();
        }, 300);


    }
    //While user click on raise deviation
    handleDeviationClick(event) {
        if (this.data != undefined) {
            var lengthofDevList = this.data.length;
            console.log('length of dev list to check validation', lengthofDevList);
            this.handleRaiseValidation(lengthofDevList);
        }

        console.log('Approval Authority From Deviation')
        if (this.allowRaiseDeviation == true && this.isSave == true) {
            getLowestLevelePendingTRDevRecords({ applicationId: this.applicationId })
                .then(isSuccess => {
                    console.log('Deviation raised successfully');
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'Deviation raised successfully',
                            variant: 'Success'
                        })
                    );
                    window.location.reload();
                })
                .catch(error => {
                    console.log('error in raise deviation', error);
                })
        }
    }

    // validation for raise deviation button : if all deviations in list have approval authority if not please choose for all

    handleRaiseValidation(lengthofDevList) {
        console.log('check validation to raise deviation', lengthofDevList);
        for (var appAuthorityCheck = 0; appAuthorityCheck < lengthofDevList; appAuthorityCheck++) {
            if (this.data[appAuthorityCheck].devList.Approval_Authority__c == null || this.data[appAuthorityCheck].devList.Approval_Authority__c == '' || this.data[appAuthorityCheck].devList.Approval_Authority__c == undefined) {
                this.allowRaiseDeviation = false;
                console.log('validation error for approval authority',this.data[appAuthorityCheck].Approval_Authority__c,appAuthorityCheck);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: 'Please Select and Save Approval Authority for All Deviations',
                        variant: 'error'
                    })
                );
                break;
            }
            else {
                this.allowRaiseDeviation = true;
            }
        }
        if(this.isSave == false){
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Please Save all the Changes',
                    variant: 'error'
                })
            );
        }

    }

    getTrRecords() {
        console.log('this.application ID in get records', this.applicationId);
        //this method is used for vs 2 to get current deviation level and logged in user
        this.getCurrentLoginUser();
        this.isSave = true;
        this.devCodeValuesAre();
        this.allowRaiseDeviation = false;
        this.approvalUser = [];
        this.applicantOption = [];
        this.assetOption = [];
        this.devNewLevel = '';
        this.newRemark = '';
        var resultGet = [];
        this.authNewLevel = '';
        this.sendMailShow = false;
        this.getApplicantAset();
        if (this.isError == false) {
            this.handleHideSave();
        }
        getTrDeviationData({ applicationId: this.applicationId })
            .then(result => {
                console.log('get Tr data result is', result);
                //  this.data = result;
                // For row number
                // let resultGet = JSON.parse(JSON.stringify(result));
                //  let resultGet = JSON.stringify(result);

                resultGet = JSON.parse(JSON.stringify(result));
                /*  resultGet = result;*/
                //  this.data = result;
                if (result.length == 0) {
                    console.log('result is null');
                    this.isData = false;
                    this.deviationSpinner = false;
                }
                else {
                    console.log('result==> ' + JSON.stringify(resultGet), result.length);
                    console.log('result devaiation list', resultGet[0].devList, resultGet[0].approvalUser);
                    var devLength = resultGet.length;
                    console.log('deviation length is', JSON.stringify(devLength));


                    for (var i = 0; i < devLength; i++) {
                        resultGet[i].rowNumber = i + 1;
                        if (resultGet[i].devList.Approval_Authority__c != null && resultGet[i].devList.Approval_Authority__c != '') {
                            this.approvalAuthority[i] = resultGet[i].devList.Approval_Authority__c;
                        }
                        else {
                            this.approvalAuthority[i] = '';
                        }
                        if (resultGet[i].devList.Applicable_For__c != null && resultGet[i].devList.Applicable_For__c != '') {
                            this.applicableForArr[i] = resultGet[i].devList.Applicable_For__c;
                        }
                        else {
                            this.applicableForArr[i] = '';
                        }
                        console.log('on record get applicable for', this.applicableForArr[i]);
                        if (resultGet[i].devList.MS_Deviation__c != null || resultGet[i].devList.MS_Deviation__c != '') {
                            this.devCodeMaster[i] = resultGet[i].devList.MS_Deviation__c;
                        }
                        /* if (resultGet[i].devList.Loan_Applicant__c != null ) {
                             this.forApplicableForSelect[i] = resultGet[i].devList.Applicable_For__c;
                         }
                         else if(resultGet[i].devList.Property__c != null){
                             this.forApplicableForSelect[i] = resultGet[i].devList.Property__c;
                         }
                         else{
                             this.forApplicableForSelect[i] = null;
                         }*/

                        //  console.log('resultGet.devList[i]',this.data.devList[i]);
                    }

                } this.data = resultGet;
                console.log('deviation result', this.data);
                // console.log('deviation data', this.data[0].devList.Applicable_for__c);
                this.approvalUserGet();
                this.sendEmailOption();
                // this.approvalUserValue();
                this.deviationSpinner = false;

            })
            .catch(error => {
                console.log('get Tr data error is', error);
            })



    }

    /* approvalUserValue(event){
         console.log('approval user click');
         this.approvalUser = [];
         var rowNo = event.target.getAttribute("data-row-index");
         console.log('level at row',this.authNewLevel);
         
         if(this.data[rowNo].isNewRow == true){
             var level = this.authNewLevel;
             console.log('approver list',this.authNewLevel, this.userMap.get(this.authNewLevel));
           //  this.approvalUser = [];
             for(var userList = 0; userList < this.userMap.get(this.authNewLevel).length; userList++){
                 console.log('in approval user for loop',this.userMap.get(this.authNewLevel)[userList].Name,this.userMap.get(this.authNewLevel)[userList].Id);     
                 const approval = {
                     label: this.userMap.get(this.authNewLevel)[userList].Name,
                     value: this.userMap.get(this.authNewLevel)[userList].Id
                 };
                     this.approvalUser = [...this.approvalUser, approval];
             }
             console.log('approval user'+this.approvalUser);
         }
     }*/
    approvalUserGet() {
        console.log('approval user called', this.data);
        //var result = [];
        // result = this.data[0].approvalUser;
        // console.log('result to approve', result, this.data);
        // console.log('result to approve', this.data[0].approvalUser);
        getUserBasedOnSourcingBranch({ applicationId: this.applicationId })
            .then(result => {
                for (let key in result) {
                    console.log('result from get user key', JSON.stringify(result[key]), key);
                    this.userMap.set(key, result[key]);
                    console.log('result from get user', this.userMap);

                }
            })
            .catch(error => {
                console.log('error from get user', JSON.stringify(error));
            })
        //commented for vs 2
        /* getUserBasedOnLevel()
         .then(result=>{
             for (let key in result) {
             console.log('result from get user key',JSON.stringify(result[key]),key);
             this.userMap.set(key,result[key]);
             console.log('result from get user',this.userMap);
             
         }
         })
         .catch(error=>{
             console.log('error from get user',JSON.stringify(error));
         })*/
        /*  for (let key in result) {
              //console.log('Key', key);
              console.log('this.data.approvalUser', result[key]);
  
              const approval = {
                  label: result[key],
                  value: key
              };
              this.approvalUser = [...this.approvalUser, approval];
          }*/
    }
    updateMitigant(event) {
        var rowNo = event.target.getAttribute("data-row-index");
        console.log('mitigant row', rowNo, event.target.value);
        //this.isSave = false;
        this.data[rowNo].devList.Mitigants__c = event.target.value;
        console.log('mitigant value', this.data[rowNo].devList.Mitigants__c, 'at row', rowNo);
    }
    updateRemark(event) {
        var rowNo = event.target.getAttribute("data-row-index");
        console.log('remark row', rowNo, event.target.value);
        //this.isSave = false;
        this.data[rowNo].devList.Remark__c = event.target.value;
        console.log('Remark__c value', this.data[rowNo].devList.Remark__c, 'at row', rowNo);
    }

    getApplicantAset() {
        this.applicantSelect('Applicant');
        this.applicantSelect('Asset');
    }
    applicantSelect(applicableFor) {
        //   var rowNo = event.target.getAttribute("data-row-index");
        // this.applicantAssetOption = [];
        this.applicantOption = [];
        this.assetOption = [];
        console.log('applicable on from prev data', applicableFor);
        getLoanApplicant({ applicationId: this.applicationId, applicableFor: applicableFor })
            .then(result => {
                console.log('result from applicable on change', result);

                for (let key in result) {
                    //console.log('Key', key);
                    // console.log('result', result[key]);

                    const applicant = {
                        label: result[key],
                        value: key
                    }; //console.log('result');
                    if (applicableFor == 'Applicant') {
                        this.applicantOption.push(applicant);
                    }
                    else if (applicableFor == 'Asset') {
                        this.assetOption.push(applicant);
                    }

                }

            })
            .catch(error => {
                console.log('error from applicable on change in pc', error);
            })
    }
    /* applicableForMethod() {
         picklistValues({ objectName: 'MS_Deviation__c', fieldName: 'Deviation_Level__c' })
             .then(result => {
                 console.log('applicable for values', result);
                 for (let key in result) {
                     //console.log('Key', key);
                     console.log('result', result[key]);
 
                     const applicable = {
                         label: result[key],
                         value: result[key]
                     };
                     this.applicableFor = [...this.applicableFor, applicable];
                 }
             })
             .catch(error => {
                 console.log('error applicable for values', error);
             })
     }*/


    /* applicableForChange(event) {
         var forApplicableOn = event.target.value;
         var rowNo = event.target.getAttribute("data-row-index");
         this.applicableForArr[rowNo] = event.target.value;
         console.log(forApplicableOn, this.applicableForArr[rowNo]);
         this.data[rowNo].Loan_Applicant__c = '';
         this.data[rowNo].Property__c = '';
         if (forApplicableOn != 'Application') {
             getLoanApplicant({ applicationId: this.applicationId, applicableFor: event.target.value })
                 .then(result => {
                     console.log('result from applicable on change', result);
                     this.applicant = false;
                     this.asset = false;
                     this.isApplication = false
                     this.applicants = [];
                     this.properties = [];
                     for (let key in result) {
                         //console.log('Key', key);
                         console.log('result', result[key]);
 
                         const applicant = {
                             label: result[key],
                             value: key
                         }; console.log('result');
                         if (forApplicableOn == 'Applicant') {
                             this.applicant = true;
                             console.log('application', this.isApplication);
                             this.asset = false;
                             this.isApplication = false;
                             this.applicants.push(applicant);
                         }
                         else if (forApplicableOn == 'Asset') {
                             this.applicant = false;
                             console.log('application', this.isApplication);
                             this.asset = true;
                             this.isApplication = false;
                             this.properties.push(applicant);
                         }
                         else {
                             this.isApplication = true;
                             console.log('application', this.isApplication);
                             this.applicant = false;
                             this.asset = false;
                             this.applicants = [];
                             this.properties = [];
 
                         }
                     }
 
                 })
                 .catch(error => {
                     console.log('error from applicable on change in pc', error);
                 })
         }
         if (forApplicableOn == 'Application') {
             this.isApplication = true;
             console.log('application', this.isApplication);
             this.applicant = false;
             this.asset = false;
             this.applicants = [];
             this.properties = [];
 
         }
     }*/
    applicableForSelectChange(event) {
        var forApplicableForSelect = event.target.value;
        var rowNo = event.target.getAttribute("data-row-index");
        console.log('target applicable value', forApplicableForSelect, rowNo, event.target.value);
        this.forApplicableForSelect[rowNo] = event.target.value;
        console.log('forapplicatble', this.forApplicableForSelect[rowNo]);

        if (this.data[rowNo].isNewRow == false) {
            console.log('for old row applicant or property');
            this.applicableForUpdate.set(this.data[rowNo].devList.Id, this.forApplicableForSelect[rowNo]);
            if (this.data[rowNo].applicantAsset == true) {
                console.log('applicant', this.data[rowNo].applicantAsset);
                this.data[rowNo].devList.Loan_Applicant__c = event.target.value;
                var selectedOption = this.applicantOption.filter(function (option) {
                    return option.value == event.target.value;
                })
                console.log('applicant', selectedOption);

                this.data[rowNo].applicantOrAssetName = selectedOption[0].label;
                console.log('applicant is ', this.data[rowNo].applicantOrAssetName);
            }
            else if (this.data[rowNo].applicantAsset == false && this.data[rowNo].isApplication == false) {
                console.log('property', this.data[rowNo].applicantAsset);
                this.data[rowNo].devList.Property__c = event.target.value;
                var selectedOption = this.assetOption.filter(function (option) {
                    return option.value == event.target.value;
                })
                console.log('applicant', selectedOption);
                this.data[rowNo].applicantOrAssetName = selectedOption[0].label;
                console.log('Property is ', this.data[rowNo].applicantOrAssetName);
            }
        }
        else if (this.data[rowNo].isNewRow == true) {
            //this.applicableForUpdate.set(this.data[rowNo].devList.Id, this.forApplicableForSelect[rowNo]);
            if (this.applicant == true) {
                this.data[rowNo].devList.Loan_Applicant__c = event.target.value;
            }
            else if (this.asset == true) {
                this.data[rowNo].devList.Property__c = event.target.value;
            }
        }
        this.handleShowSave();

    }

    createDeviationRecordRow(event) {
        console.log('Add new row', this.data.length, this.applicantOption, this.applicant);
        console.log('available dev codes', this.existingdevOption.length, this.existingdevOption);

        if (this.existingdevOption.length == 0) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'No More Master Deviation Available to Create Deviation Record',
                    variant: 'error'
                })
            );

        }
        else {
            this.handleShowSave();
            
           //  this.isRaise = true;// to show new row in DA DM stage
            
            getNewRow({ applicationId: this.applicationId })
                .then(result => {
                    console.log('New row created', JSON.parse(JSON.stringify(result)));
                    var newData = JSON.parse(JSON.stringify(result));
                    newData.rowNumber = this.data.length + 1;
                    this.data.push(newData);
                    console.log('this.data for deviation afer row add', this.data.length, this.data);
                    this.isData = true;
                  //  this.isRaise = false;
                })
                .catch(error => {
                    console.log('error in new row creation', error);
                })
        }
    }

    /*   handleClick(event) {
           this.isRaise = true;
           var rowNo = event.target.getAttribute("data-row-index");
           console.log('Handle click to Raise Deviation',rowNo);
           if(this.approvalAuthority[rowNo] == null && this.approvalAuthority[rowNo] == ''){
               console.log('approval authority',this.approvalAuthority[rowNo]);
               this.dispatchEvent(
                   new ShowToastEvent({
                       title: 'Error',
                       message: 'Please select Approval Authority',
                       variant: 'error'
                   })
               );
   
           }
           if(this.data[rowNo].isNewRow == false){
               console.log('Update authority only',this.data[rowNo].devList.Id, this.approvalAuthority[rowNo]);
               saveDeviation({devId : this.data[rowNo].devList.Id, approvalAut : this.approvalAuthority[rowNo]})
               .then(result =>{
                   console.log('result Saved Succesfully',result);
                   this.dispatchEvent(
                       new ShowToastEvent({
                           title: 'Success',
                           message: 'Deviation Raised successfully',
                           variant: 'success'
                       })
                   );
                   this.getTrRecords();
                   this.isRaise = false;
               })
               .catch(error=>{
                   console.log('error in save deviation',error);
               })
           }
           else if(this.data[rowNo].isNewRow == true){
               console.log('Update authority only', this.approvalAuthority[rowNo]);
               console.log('applicable for', this.applicableForArr[rowNo],this.forApplicableForSelect[rowNo]);
               saveNewDeviation({devData : JSON.stringify(this.data[rowNo].devList), approvalAut : this.approvalAuthority[rowNo], applicableFor : this.applicableForArr[rowNo], applicableOn : this.forApplicableForSelect[rowNo]})
               .then(result =>{
                   console.log('result Saved Succesfully',result);
                   
                   this.getTrRecords();
                   this.dispatchEvent(
                       new ShowToastEvent({
                           title: 'Success',
                           message: 'Deviation Raised successfully',
                           variant: 'success'
                       })
                   );
                   this.isRaise = false;
               })
               .catch(error=>{
                   console.log('error in save deviation',error);
               })
           }
           
       } */

    approvalAuthChange(event) {
        console.log('Approval authority changed', event.target.value);
        this.isSave = false;
        this.handleShowSave();
        var rowNo = event.target.getAttribute("data-row-index");
        console.log('change approval authority in row no', rowNo);
        this.approvalAuthority[rowNo] = event.target.value;
        // console.log('user name on change',event.target.key);
        // this.data[rowNo].userName = event.target.key;
        this.data[rowNo].devList.Approval_Authority__c = event.target.value;
        console.log('approval authority of dev is updated to', this.approvalAuthority[rowNo]);
        if (this.data[rowNo].isNewRow == false) {
            console.log('preDevUpdate');

            // this.preDevUpdate.push({ value: this.approvalAuthority[rowNo], key: this.data[rowNo].devList.Id });
            this.preDevUpdate.set(this.data[rowNo].devList.Id, this.approvalAuthority[rowNo]);
            console.log('preDevUpdate', this.preDevUpdate, this.preDevUpdate.size);
        }
    }
    // changes for deviation name
    devCodeValuesAre() {
        console.log('this.existingdevOption', this.existingdevOption);
        this.existingdevOption = [];
        console.log('application id to get master code', this.applicationId)
        getDevCodeFromMaster({ applicationId: this.applicationId })
            .then(resultCode => {
                console.log('dev code result is', resultCode);
                for (let key in resultCode) {
                    console.log('Key', key);
                    console.log('resultCode', resultCode[key]);
                    this.devCodeMap.set(key, resultCode[key].Code__c);
                    console.log('map for ms code',this.devCodeMap);
                    const devList = {
                        label: resultCode[key].Deviation_Description__c,
                        value: key
                    };
                    this.existingdevOption = [...this.existingdevOption, devList];
                    // map to get master level
                    this.masterLevelMap.push({ value: resultCode[key].Approval_Authority__c, key: key });
                    this.deviationLevelMap.push({ value: resultCode[key].Deviation_Level__c, key: key });
                    this.masterRemarkMap.push({ value: resultCode[key].Deviation_Description__c, key: key });

                }
                console.log('master level map', this.masterLevelMap);
                console.log('master deviation level map', this.deviationLevelMap);
                console.log('master description map', this.masterRemarkMap);
            })
            .catch(error => {
                console.log('error in dev code', error);
            })
    }

    updateDevCodeValue(event) {
        this.handleShowSave();
        //row no let sRNumber = event.target.id.split('-')[0];
        var rowNo = event.target.getAttribute("data-row-index");
        console.log('row no', rowNo);
        let value = event.target.value;
        console.log('Value##' + value);
        this.applicant = false;
        this.asset = false;
        this.isApplication = false
        this.approvalUser = [];
        // let name = event.target.name;
        this.devCodeMaster[rowNo] = event.target.value;
        this.data[rowNo].devList.MS_Deviation__c = event.target.value;
        this.data[rowNo].devList.Deviation_Code__c = this.devCodeMap.get(event.target.value);
        var selectedOption = this.existingdevOption.filter(function (option) {
            return option.value == event.target.value;
        })
        console.log('devcode selected', selectedOption);

        this.data[rowNo].devList.Deviation_Description__c = selectedOption[0].label;
        for (var level = 0; level < this.masterLevelMap.length; level++) {
            console.log('to assign level match key', this.masterLevelMap[level].key, this.devCodeMaster[rowNo]);
            if (this.masterLevelMap[level].key == this.devCodeMaster[rowNo]) {
                console.log('level to assign', this.masterLevelMap[level].value);
                //Assign auth level of new row
                this.authNewLevel = this.masterLevelMap[level].value;
                this.data[rowNo].devList.Approval_Level__c = this.authNewLevel;

            }
            console.log('to assign deviation level match key', this.deviationLevelMap[level].key, this.devCodeMaster[rowNo]);
            if (this.deviationLevelMap[level].key == this.devCodeMaster[rowNo]) {
                console.log('level to assign', this.deviationLevelMap[level].value);
                //Assign auth level of new row
                this.devNewLevel = this.deviationLevelMap[level].value;
                this.applicableForArr[rowNo] = this.devNewLevel;
                this.data[rowNo].devList.Applicable_for__c = this.devNewLevel;

            }
            console.log('to assign deviation remark (deviation description) match key', this.masterRemarkMap[level].key, this.devCodeMaster[rowNo]);
            /*  if (this.masterRemarkMap[level].key == this.devCodeMaster[rowNo]) {
                  console.log('reamark to assign', this.masterRemarkMap[level].value);
                  //Assign auth level of new row
                  this.newRemark = this.masterRemarkMap[level].value;
                  this.data[rowNo].devList.Remark__c = this.newRemark;
                  
              }*/
        }
        console.log('auth level of new row', this.authNewLevel, this.devNewLevel);
        if (this.devNewLevel == 'Application') {
            this.applicant = false;
            this.asset = false;
            this.isApplication = true;
        }
        else if (this.devNewLevel == 'Applicant') {
            this.applicant = true;
            this.asset = false;
            this.isApplication = false;
        }
        else if (this.devNewLevel == 'Asset') {
            this.applicant = false;
            this.asset = true;
            this.isApplication = false;
        }

        // for vs 2
        // var result = String1.localeCompare(String2); (result = -1 String1 comes before String2, result = 0; both are same, else String1 comes after String2)
        var resultedLevel = this.authNewLevel.localeCompare(this.currentDevLevelToApprove);
        console.log('level comparision', resultedLevel, this.currentDevLevelToApprove);

        console.log('length of usermap to assign for this level', this.userMap.get(this.authNewLevel));
        if (resultedLevel < 0) {
            console.log('level assigned is lower than current deviation level', resultedLevel);
            this.data[rowNo].userName = this.currentUser.Name;
            this.data[rowNo].devList.Approval_Authority__c = this.currentUser.Id;
            this.data[rowNo].devList.Is_Deviation_Raised__c = true;
        }
        else {
            this.data[rowNo].devList.Approval_Authority__c = null;
            this.data[rowNo].userName = '';
            //Credit committee


            for (var key in this.userMap.get(this.authNewLevel)) {
                console.log('in approval user for loop for vs 2', key, this.userMap.get(this.authNewLevel)[key]);
                const approval = {
                    label: this.userMap.get(this.authNewLevel)[key],
                    value: key
                };
                this.approvalUser = [...this.approvalUser, approval];
            }

            this.data[rowNo].userDetail = this.approvalUser;
        }
        // to assign user picklist for new row -- commented for vs 2
        /* for(var userList = 0; userList < this.userMap.get(this.authNewLevel).length; userList++){
             console.log('in approval user for loop for vs 2',this.userMap.get(this.authNewLevel));     
 
           /*  console.log('in approval user for loop',this.userMap.get(this.authNewLevel)[userList].Name,this.userMap.get(this.authNewLevel)[userList].Id);     
             const approval = {
                 label: this.userMap.get(this.authNewLevel)[userList].Name,
                 value: this.userMap.get(this.authNewLevel)[userList].Id
             };
                 this.approvalUser = [...this.approvalUser, approval];
         }*/
        

        //get updated dev code



    }

    //getCurrentLoginUser for vs 2. to get current login user and assign deviation to this user if deviation created is lower than current deviation level
    getCurrentLoginUser() {
        console.log('getCurrentLoginUser');
        getCurrentLoginUser({ applicationId: this.applicationId })
            .then(result => {
                console.log('current deviation level with logged in user', result);
                for (var key in result) {
                    this.currentUser = result[key];
                    this.currentDevLevelToApprove = key;
                }
                console.log('current user is', this.currentUser, 'and current level is', this.currentDevLevelToApprove);
                //this.sendEmailOption();

            })
            .catch(error => {
                console.log('error in geeting current dev level and logged in user', error);
            })
    }

    //to set send email button for L6 or L7 user if deviation level is L5 and current deviation user approval level is L5
    sendEmailOption(){
        this.getCurrentLoginUser();
        if(this.currentDevLevelToApprove != undefined){
        console.log('current deviation level',this.currentDevLevelToApprove);
       // if(this.currentDevLevelToApprove == 'L5'){
            console.log('current deviation level is L5',this.currentDevLevelToApprove, this.data.length);
          //  if(this.currentUser.length > 0){
            if(this.currentUser.Approval_Level__c != undefined && this.currentUser.Approval_Level__c != '' && this.currentUser.Approval_Level__c.indexOf('L5') >= 0){
                console.log('current deviation level is L5 and login user is',this.currentUser, this.data.length);
                for(var devToMail = 0; devToMail < this.data.length; devToMail++){
                    console.log('loop to check level',this.data[devToMail].devList.Approval_Level__c, this.data[devToMail].devList.Decistion__c );
                    if(this.currentDevLevelToApprove == 'L6' && this.data[devToMail].devList.Approval_Level__c == 'L6' && this.data[devToMail].devList.Decistion__c == 'Approval for Pending'){
                        console.log('Deviation at L6',this.data[devToMail].devList.Approval_Level__c, 'and decision is pending',this.data[devToMail].devList.Decistion__c);
                        this.data[devToMail].sendEmail = true;
                        this.sendMailShow = true;
                    }
                    if(this.currentDevLevelToApprove == 'L7' && this.data[devToMail].devList.Approval_Level__c == 'L7' && this.data[devToMail].devList.Decistion__c == 'Approval for Pending'){
                        console.log('Deviation at L7',this.data[devToMail].devList.Approval_Level__c, 'and decision is pending',this.data[devToMail].devList.Decistion__c);
                        this.data[devToMail].sendEmail = true;
                        this.sendMailShow = true;
                    }
                }
            }
       // }
       // }
    }
    }
    //handle click on send email buttopn to send email to respective user
    handleEmailClick(event){
        console.log('Send email called');
        var rowNo = event.target.getAttribute("data-row-index");
        console.log('deviation no to send email',rowNo, this.data[rowNo].devList.Approval_Authority__c);
        sendEmailToApprovalUser({usrToMail : this.data[rowNo].devList.Approval_Authority__c, devDes : this.data[rowNo].devList.Deviation_Description__c, applicationId : this.applicationId})
        .then(result=>{
            console.log('email sent');
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Email send successfully',
                    variant: 'success'
                })
            );
        })
        .catch(error=>{
            console.log('error in email send',error);
        })

    }

    //new handle save for vs2
    async handleSave(event) {
        console.log('handle save called', JSON.stringify(this.data));
        this.isRaise = true;
        this.handleNewRowValidation();
        if(this.isError == false){
            this.isSave = true;
            await saveTrDeviationRecords({ devWrapperList: JSON.stringify(this.data) })
                .then(result => {
                    console.log('Deviation saved successfully', result);
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'Deviation Saved successfully',
                            variant: 'success'
                        })
                    );

                })
                .catch(error => {
                    console.log('error in save deviation', error);
                })
            this.getTrRecords();
            this.isRaise = false;
        }
        else{
            this.isError = false;
        }
    }

    handleNewRowValidation(){
        for(var allDev = 0; allDev < this.data.length; allDev++){
            if(this.data[allDev].isNewRow == true){
                var devRecord = this.data[allDev];
                console.log('@@## devRecord ', JSON.stringify(devRecord));
                if (this.devCodeMaster[allDev] == '' || this.devCodeMaster[allDev] == null || this.devCodeMaster[allDev] == undefined) {
                    this.isError = true;
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error',
                            message: 'Please Select Deviation Name for the New Deviation.',
                            variant: 'error'
                        })
                    );
                    
                    this.isRaise = false;
                }
            }
        }

        if(!this.isError){      
            var duplicateDaviations = [];
            for(var allDev = 0; allDev < this.data.length; allDev++){
                if(this.data[allDev].isNewRow == true){
                    var devRecord = this.data[allDev];
                    var ubiqueId = devRecord.devList.Application__c + '-' + devRecord.devList.MS_Deviation__c + '-' + devRecord.devList.Deviation_Type__c + devRecord.devList.Approval_Authority__c;
                    console.log('@@## ubiqueId ', ubiqueId);
                    if(duplicateDaviations.indexOf(ubiqueId) === -1){
                        duplicateDaviations.push(ubiqueId);
                    }else if(duplicateDaviations.indexOf(ubiqueId) >= 0){
                        this.isError = true;
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Error',
                                message: 'Please Remove Duplidate Deviations.',
                                variant: 'error'
                            })
                        );
                        this.isRaise = false;
                    }
                }
            }
        }
    }

    //commented for vs 2
    //Handle save button
    /*  async handleSave(event) {
  
          this.isError = false;
        //  this.handleHideSave();
          console.log('Handle click to Raise Deviation');
          console.log('final length of data on save',this.data.length);
          var devToUpdate = [];
          var rowNo = this.data.length - 1;      
          console.log('new row no', rowNo);
          if(this.data[rowNo].isNewRow == true){
          this.handleValidation(rowNo);
          
          }
          if (this.preDevUpdate.size > 0 || this.applicableForUpdate.size > 0) {
              console.log('Update authority only', this.preDevUpdate, this.applicableForUpdate);
              for (var devUpdate = 0; devUpdate < this.data.length; devUpdate++) {
                  console.log('length of curren data',this.data.length, this.isError);
                  if(this.isError == false){
                  if (this.data[devUpdate].isNewRow == false) {
                      this.isRaise = true;
                      console.log('current data row is',this.data[devUpdate].isNewRow);
                      if (this.preDevUpdate.has(this.data[devUpdate].devList.Id)) {
                          console.log('yes has key');
                          devToUpdate.push({ value: this.approvalAuthority[devUpdate], key: this.data[devUpdate].devList.Id });
                          console.log('deviation to update', devToUpdate);
  
                      await    saveDeviation({ devId: this.data[devUpdate].devList.Id, approvalAut: this.approvalAuthority[devUpdate] })
                              .then(result => {
                                  console.log('result Saved Succesfully 2', result);
                                  this.dispatchEvent(
                                      new ShowToastEvent({
                                          title: 'Success',
                                          message: 'Deviation Raised successfully',
                                          variant: 'success'
                                      })
                                  );
                                  this.preDevUpdate = new Map();
                                  this.getTrRecords();
                                 // this.isRaise = false;
                              })
                              .catch(error => {
                                  console.log('error in save deviation 2', error);
                              })
                      } 
                    //  console.log('Approval map',this.applicableForUpdate,devList.Id,this.applicableForUpdate.has(this.data[devUpdate].devList.Id))
                      if(this.applicableForUpdate.has(this.data[devUpdate].devList.Id)){
                          console.log('yes has applicable');
                          
                          console.log('deviation to update', devUpdate, this.data[devUpdate].devList.Applicable_For__c, this.applicableForArr[devUpdate]);
                      await    saveDeviationApplication({ devId: this.data[devUpdate].devList.Id, applicableOn: this.forApplicableForSelect[devUpdate] })
                              .then(result => {
                                  console.log('result Saved Succesfully 3', result);
                                  this.dispatchEvent(
                                      new ShowToastEvent({
                                          title: 'Success',
                                          message: 'Deviation Raised successfully',
                                          variant: 'success'
                                      })
                                  );
                                  this.applicableForUpdate = new Map();
                                  this.getTrRecords();
                                 // this.isRaise = false;
                              })
                              .catch(error => {
                                  console.log('error in save deviation 3', error);
                              })
  
                      }
                  }}
                  if (this.data[devUpdate].isNewRow == true) {
                      
                      console.log('Update authority only', this.approvalAuthority[devUpdate]);
                      
                      //this.handleValidation(devUpdate);
                      this.handleNewRowSave(devUpdate);
                      
                      
                      
                  }
                  
              }
  
  
       //   }
          // to save list od deviation
      /*    if(devToUpdate.length >0){
              var devId = [];
              var authId = [];
              for(var val = 0; val < devToUpdate.length; val++){
                  console.log('dev to upadate key and value',devToUpdate[val].key, devToUpdate[val].value);
                  devId.push(devToUpdate[val].key);
                  authId.push(devToUpdate[val].value);
              }
              console.log(devId,authId);
              this.handleDevSave(devId, authId);
          }*/


    //commented for vs 2
    /* }
         else if(this.preDevUpdate.size == 0 && this.data[this.data.length - 1].isNewRow == true){
             this.handleNewRowSave(this.data.length - 1);
         }
         //this.getTrRecords();
         this.isRaise = false;
         
         
     }*/
    // save user in previous deviation
    handleDevSave(devId, authId) {
        saveDeviation({ devId: devId, approvalAut: authId })
            .then(result => {
                console.log('result Saved Succesfully 2', result);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Deviation Raised successfully',
                        variant: 'success'
                    })
                );
                this.preDevUpdate = new Map();
                this.getTrRecords();
                // this.isRaise = false;
            })
            .catch(error => {
                console.log('error in save deviation 2', error);
            })
    }
    // save new row
    handleNewRowSave(devUpdate) {
        if (this.isError == false) {
            console.log('applicable for', this.applicableForArr[devUpdate], this.forApplicableForSelect[devUpdate]);
            this.isRaise = true;
            this.authNewLevel = this.authNewLevel.trim();
            saveNewDeviation({ devData: JSON.stringify(this.data[devUpdate].devList), approvalAut: this.approvalAuthority[devUpdate], applicableFor: this.applicableForArr[devUpdate], applicableOn: this.forApplicableForSelect[devUpdate], authLevel: this.authNewLevel, devMaster: this.devCodeMaster[devUpdate], remarks: this.newRemark })
                .then(result => {
                    console.log('result Saved Succesfully 1', result);


                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'Deviation Raised successfully',
                            variant: 'success'
                        })
                    );
                    // this.isRaise = false;
                    this.getTrRecords();
                })
                .catch(error => {
                    console.log('error in save deviation 1', error);
                })
        }
        else {
            console.log('error');
        }
    }
    //handle validation to save new row
    handleValidation(newRowNo) {
        console.log('row number to handle validation', newRowNo, this.devCodeMaster[newRowNo]);
        console.log('approval authority');
        if (this.approvalAuthority[newRowNo] == null || this.approvalAuthority[newRowNo] == '' || this.approvalAuthority[newRowNo] == undefined) {
            console.log('approval authority', this.approvalAuthority[newRowNo]);

            this.isError = true;
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Please fill all details in new Deviation',
                    variant: 'error'
                })
            );

        }
        /*  else {
              this.isError = false;
          }*/
        console.log('applicable for null', this.applicableForArr[newRowNo]);
        /*    if (this.applicableForArr[newRowNo] == null || this.applicableForArr[newRowNo] == '' || this.applicableForArr[newRowNo] == undefined) {
                console.log('applicable for null', this.applicableForArr[newRowNo]);
                
                this.isError = true;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: 'Please fill all details in new Deviation',
                        variant: 'error'
                    })
                );
    
            }*/

        ///if (this.applicableForArr[newRowNo] == 'Applicant' || this.applicableForArr[newRowNo] == 'Asset') {
        if (this.applicableForArr[newRowNo] != 'Application') {
            console.log('approval authority for applicant', this.applicableForArr[newRowNo]);
            if (this.forApplicableForSelect[newRowNo] == '' || this.forApplicableForSelect[newRowNo] == null || this.forApplicableForSelect[newRowNo] == undefined) {
                console.log('approval authority', this.applicableForArr[newRowNo]);

                this.isError = true;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: 'Please fill all details in new Deviation',
                        variant: 'error'
                    })
                );
            }
        }
        /*    else {
                this.isError = false;
            }*/
        //   }/* else {
        //       this.isError = false;
        //   }
        if (this.devCodeMaster[newRowNo] == '' || this.devCodeMaster[newRowNo] == null || this.devCodeMaster[newRowNo] == undefined) {
            console.log('dev code', this.devCodeMaster[newRowNo]);

            this.isError = true;
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Please fill all details in new Deviation',
                    variant: 'error'
                })
            );
        }



        this.isRaise = false;
        console.log('return from validation');
    }
    // To show Save button
    handleShowSave() {
        // event.target.classList.add('visible');

        const adobeButton = this.template.querySelector('.feeCreationFooter').className;
        console.log('adobeButton', JSON.stringify(adobeButton));
        this.template.querySelector('.feeCreationFooter').className = ('feeCreationFooter visible');


    }
    handleHideSave() {
        console.log('hide save button');
        //console.log('hide class',this.template.querySelector('.feeCreationFooter .visible').className);
        //  this.template.querySelector('.feeCreationFooter').className = ('feeCreationFooter');
    }



}