import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getCharacterTabRecords from '@salesforce/apex/fsPcAcController.getCharacterTabRecords';
import getRecordTypeId from '@salesforce/apex/fsPcAcController.getRecordTypeId';
import getApplicantList from '@salesforce/apex/fsPcAcController.getApplicantList';

export default class PcCharacter extends LightningElement {


    @api ispcFamily = false;
    @api ispcNeighbour = false;
    @api ispcAffiliation = false;
    @api ispcLivingStandard = false;
    @api isacFamily = false;
    @api isacNeighbour = false;
    @api isacAffiliation = false;
    @api isacLivingStandard = false;
    @api loanAmount;
    @api sectionName;
    @api verificationId;
    @api charcterRecordId;
    @api showFIVCFamily = false;
    @api fivCfamilyTableData;
    @api customerOptions;
    @api showFIVCCharacter = false;
    @api applicationid;
    @api calledFrom;

    @track childSpinner = false;
    @track famRecordId;
    @track negRecordId;
    @track affRecordId;
    @track livingRecordId;
    @track repaymentRecordId;
    @track characterRecordTypeId;
    @track isRemarksReq;
    @track familyTableData;
    @track affTableData;
    @track neighbourTableData;
    @track livingStandardTableData;
    @track loanApplicantId;
    @track charRecordId;
    @track showDeleteModal = false;
    @track customerName;
    @track fivcpcrelation;
    @track accharacterRecordTypeId;
    @track showacCharacter = false;
    @track familyRecId;
    @track labelSave = 'Save';
    @track isAc = false;
    @track customerData;
    @track customerTypeVal;


    @track rowAction = [
        {
            //label: 'Delete',
            type: 'button-icon',
            fixedWidth: 50,
            typeAttributes: {
                iconName: 'utility:delete',
                title: 'Delete',
                variant: 'border-filled',
                alternativeText: 'Delete',
                name: 'delete'
            }
        },
        {
            //label: 'Edit',
            type: 'button-icon',
            fixedWidth: 50,
            typeAttributes: {
                iconName: 'utility:edit',
                title: 'Edit',
                variant: 'border-filled',
                alternativeText: 'Edit',
                name: 'edit'
            }
        }
    ];



    @track familyautoData = {
        Family_memeber_Name: undefined, Customer_Type: undefined, Relationship: undefined, Living_with_Applicant: undefined
        , Overall_Remarks: undefined, Remarks__c: undefined
    };

    @track neighbourautoData = {
        Applicant_Name: undefined, Feedback: undefined, Remarks: undefined
    };

    @track affautoData = {
        Applicant_Name: undefined, Affiliation_Remarks: undefined
    };

    @track livingAutoData = {
        Applicant_Name: undefined, LifeStyle: undefined, Consumer_Durables: undefined, Remarks: undefined,
        SecondLifestyle: undefined, ThirdLifeStyle: undefined, FourthLifeStyle: undefined
    };

    get showCharacter() {
        return (this.ispcFamily || this.ispcNeighbour || this.ispcAffiliation || this.ispcLivingStandard) ? true : false;
    }

    // get showacCharacter() {
    //     return (this.isacFamily || this.isacNeighbour || this.isacAffiliation || this.isacLivingStandard) ? true : false;
    // }

    // gettter method to show the PC / AC Grid
    get pcFamilyTable() {
        return (this.ispcFamily || this.isacFamily) ? true : false;
    }

    get pcNeighbourTable() {
        return (this.isacNeighbour || this.ispcNeighbour) ? true : false;
    }

    get pcAffiliationTable() {
        return (this.ispcAffiliation || this.isacAffiliation) ? true : false;
    }

    get pcLivingStandardTable() {
        return (this.ispcLivingStandard || this.isacLivingStandard) ? true : false;
    }

    // for showing Life style Fields As Per the Requested Loan Amount

    get showSecondLifestyle() {
        return (this.loanAmount > 200000) ? true : false;
    }

    get showThirdLifestyle() {
        return (this.loanAmount > 400000) ? true : false;
    }

    get showFourthLifestyle() {
        return (this.loanAmount > 800000) ? true : false;
    }




    connectedCallback() {
        console.log('applicationid', this.applicationid);
        console.log('fam', this.ispcFamily);
        console.log('neg', this.ispcNeighbour);
        console.log('Verification Id', this.verificationId);
        console.log('called FROM >>>> ', this.calledFrom);
        this.childSpinner = true;
        this.getcharcterRecordTypeId();
        this.handleGetApplicantList();
        this.familyTableData = undefined;
        this.getCharacterTableRecords('PC_Table_Family_Details', 'Family Detail');
        this.neighbourTableData = undefined;
        this.getCharacterTableRecords('PC_Neighbour_Table', 'Neighbour Detail');
        this.affTableData = undefined;
        this.getCharacterTableRecords('PC_Affiliation_Table', 'Affiliation Detail');
        this.livingStandardTableData = undefined;
        this.getCharacterTableRecords('PC_LivingStandard_Table', 'Living Standard Detail');

        console.log('this.family table data ', this.familyTableData, 'this.called from', this.calledFrom, 'show pc familty table', this.pcFamilyTable);
        if (this.calledFrom == 'AC') {
            this.isAc = true;
            setTimeout(() => {
                this.rowAction.splice(0, 2, {
                    //label: 'Edit',
                    type: 'button-icon',
                    fixedWidth: 50,
                    typeAttributes: {
                        iconName: 'utility:edit',
                        title: 'Edit',
                        variant: 'border-filled',
                        alternativeText: 'Edit',
                        name: 'edit'
                    }
                })
                //this.rowAction.push()
            }, 200);
        }
    }


    // form submit method for Approval Credit Character Form
    handleacCharacterSubmit(event) {
        console.log('handle AC character called');
    }

    // form submit method for Process Credit Character Form
    handleCharacterSubmit(event) {
        console.log('handle PC character called');
    }



    // pc family detail handle success method
    handleFamilySuccess(event) {
        console.log('handleCharacterSubmit called');
        console.log(event.detail.value);
        if (this.labelSave == 'Save')
            this.showToast('Success', 'success', 'Record Created Successfully');
        else if (this.labelSave == 'Update')
            this.showToast('Success', 'success', 'Record Updated Successfully');
        this.resetLogic();
        this.childSpinner = true;
        if (this.ispcFamily)
            this.getCharacterTableRecords('PC_Table_Family_Details', 'Family Detail');
        if (this.ispcNeighbour)
            this.getCharacterTableRecords('PC_Neighbour_Table', 'Neighbour Detail');
        if (this.ispcAffiliation)
            this.getCharacterTableRecords('PC_Affiliation_Table', 'Affiliation Detail');
        if (this.ispcLivingStandard)
            this.getCharacterTableRecords('PC_LivingStandard_Table', 'Living Standard Detail');
        this.charRecordId = undefined;
        this.labelSave = 'Save';
    }

    // ac family detail handle success method
    handleacFamilySuccess(event) {
        console.log('pc record Id in handle success', this.charRecordId);
        console.log('handle AC Character SUccess called', event.detail.id);
        if (this.labelSave == 'Save')
            this.showToast('Success', 'success', 'Record Created Successfully');
        else if (this.labelSave == 'Update')
            this.showToast('Success', 'success', 'Record Updated Successfully');
        this.showacCharacter = false;
        this.resetLogic();
        this.childSpinner = true;
        if (this.isacFamily)
            this.getCharacterTableRecords('PC_Table_Family_Details', 'Family Detail');
        if (this.isacNeighbour)
            this.getCharacterTableRecords('PC_Neighbour_Table', 'Neighbour Detail');
        if (this.isacAffiliation)
            this.getCharacterTableRecords('PC_Affiliation_Table', 'Affiliation Detail');
        if (this.isacLivingStandard)
            this.getCharacterTableRecords('PC_LivingStandard_Table', 'Living Standard Detail');
    }


    handleCharacterChange(character) {
        if (this.ispcNeighbour) {
            if (character.target.fieldName == 'FeedBack__c') {
                if (character.target.value == 'Negative' || character.target.value == 'Neutral')
                    this.isRemarksReq = true;
                else
                    this.isRemarksReq = false;
            }
        }
    }


    // FIV-C Data Table radio Button Selection Method
    handleSelectedRow(event) {
        this.childSpinner = true;
        let row = event.detail[0];
        if (this.calledFrom == 'PC') {
            console.log('selected row>>>>> ', JSON.stringify(event.detail));
            console.log('is pc family>>>>', row.Family_Member_Name__c);
            console.log('fivc recordId>>>>', row.Id);
            this.fivcpcrelation = row.Id;
            if (row.Loan_Applicant__c == ' ') {
                this.loanApplicantId = null;
            }
            else {
                console.log('inside else');
                this.loanApplicantId = row.Loan_Applicant__c;
                this.customerName = row.Loan_Applicant__c;
            }
            if (this.ispcFamily) {
                if (row.Family_Member_Name__c == ' ') {
                    this.familyautoData.Family_memeber_Name = null;
                }
                else {
                    console.log('inside else');
                    this.familyautoData.Family_memeber_Name = row.Family_Member_Name__c;
                }
                if (row.Customer_Type__c == ' ') {
                    this.customerTypeVal = '--None--';
                }
                else {
                    console.log('inside else');
                    this.customerTypeVal = row.Customer_Type__c;
                }
                if (row.Relationship__c == ' ') {
                    this.familyautoData.Relationship__c = '--None--';
                }
                else {
                    console.log('inside else');
                    this.familyautoData.Relationship__c = row.Relationship__c;
                }
                if (row.Living_with_Applicant__c == ' ') {
                    this.familyautoData.Living_with_Applicant__c = '--None--';
                }
                else {
                    console.log('inside else');
                    this.familyautoData.Living_with_Applicant__c = row.Living_with_Applicant__c;
                }
                if (row.Overall_Remarks__c == ' ') {
                    this.familyautoData.Overall_Remarks__c = null;
                }
                else {
                    console.log('inside else');
                    this.familyautoData.Overall_Remarks__c = row.Overall_Remarks__c;
                }
                if (this.calledFrom == 'AC') {
                    if (row.Remarks__c == ' ') {
                        this.familyautoData.Remarks__c = null;
                    }
                    else {
                        console.log('inside else');
                        this.familyautoData.Remarks__c = row.Remarks__c;
                    }
                }
            }

            else if (this.ispcNeighbour) {
                console.log('neighbour applicant name', row.Loan_Applicant__c, 'neighbour feedback',
                    row.FeedBack__c, 'neighbour remarks', row.Remarks__c);
                if (row.Loan_Applicant__c == ' ') {
                    this.neighbourautoData.Applicant_Name = null;
                }
                else {
                    this.neighbourautoData.Applicant_Name = row.Loan_Applicant__c;
                }
                if (row.FeedBack__c == ' ') {
                    this.neighbourautoData.Feedback = '--None--';
                }
                else {
                    this.neighbourautoData.Feedback = row.FeedBack__c;
                }
                if (row.Remarks__c == ' ') {
                    this.neighbourautoData.Remarks = null;
                }
                else {
                    this.neighbourautoData.Remarks = row.Remarks__c;
                }
            }
            else if (this.ispcAffiliation) {
                if (row.Loan_Applicant__c == ' ') {
                    this.affautoData.Applicant_Name = null;
                }
                else {
                    this.affautoData.Applicant_Name = row.Loan_Applicant__c;
                }
                if (row.Remarks__c == ' ') {
                    this.affautoData.Remarks = null;
                }
                else {
                    this.affautoData.Remarks = row.Remarks__c;
                }
            }
            else if (this.ispcLivingStandard) {
                if (row.Loan_Applicant__c == ' ') {
                    this.livingAutoData.Applicant_Name = null;
                }
                else {
                    this.livingAutoData.Applicant_Name = row.Loan_Applicant__c;
                }
                if (row.Lifestyle__c == ' ') {
                    this.livingAutoData.LifeStyle = '--None--';
                }
                else {
                    this.livingAutoData.LifeStyle = row.Lifestyle__c;
                }
                if (row.Lifestyle_Loan_Amount_2L_to_4_Lakhs__c == ' ') {
                    this.livingAutoData.SecondLifestyle = '--None--';
                }
                else {
                    this.livingAutoData.SecondLifestyle = row.Lifestyle_Loan_Amount_2L_to_4_Lakhs__c;
                }
                if (row.Lifestyle_Loan_Amount_4L_to_8_Lakhs__c == ' ') {
                    this.livingAutoData.ThirdLifeStyle = '--None--';
                }
                else {
                    this.livingAutoData.ThirdLifeStyle = row.Lifestyle_Loan_Amount_4L_to_8_Lakhs__c;
                }
                if (row.Lifestyle_Loan_Amount_8Lakhs__c == ' ') {
                    this.livingAutoData.FourthLifeStyle = '--None--';
                }
                else {
                    this.livingAutoData.FourthLifeStyle = row.Lifestyle_Loan_Amount_8Lakhs__c;
                }
                if (row.Living_Standard_Remarks__c == ' ') {
                    this.livingAutoData.Remarks = null;
                }
                else {
                    this.livingAutoData.Remarks = row.Living_Standard_Remarks__c;
                }
                if (row.Consumer_Durables__c == ' ') {
                    this.livingAutoData.Consumer_Durables = null;
                }
                else {
                    this.livingAutoData.Consumer_Durables = row.Consumer_Durables__c;
                }
            }
        }
        else if (this.calledFrom == 'AC') {

            this.getPCRecordId(row.Id);

            if (row.Loan_Applicant__c == ' ') {
                this.loanApplicantId = null;
            }
            else {
                console.log('inside else');
                this.loanApplicantId = row.Loan_Applicant__c;
                this.customerName = row.Loan_Applicant__c;
            }
        }

        console.log('loan appppplicant id>>>>> ', this.loanApplicantId);
        this.childSpinner = false;
    }

    // data table row selection Action Method
    handleSelectedFamilyMember(event) {
        var data = event.detail;
        this.charRecordId = data.recordData.Id;
        if (data && data.ActionName == 'delete') {
            console.log('char id', this.charRecordId);
            this.showDeleteModal = true;
        }
        if (data && data.ActionName == 'edit') {
            this.labelSave = 'Update';
            console.log('labelSave', this.labelSave);
            console.log('data.recordData ', data.recordData);
            console.log('char id', this.charRecordId);
            //this.customerName = data.recordData

            console.log('name ', data.recordData);
            this.customerTypeVal = data.recordData.Customer_Type__c;
            this.customerName = data.recordData.Loan_Applicant__c;
            this.loanApplicantId = data.recordData.Loan_Applicant__c;
            if (this.calledFrom == 'AC')
                this.showacCharacter = true;
        }

    }

    // method to handle Deletion Event
    handlemodalactions(event) {
        this.showDeleteModal = false;
        console.log('event.detail>>>>> ', event.detail);
        if (event.detail === true) {
            this.childSpinner = true;
            var charEvent = new CustomEvent('characterchangeevent', { detail: true })
            this.dispatchEvent(charEvent);
            if (this.ispcFamily || this.isacFamily)
                this.getCharacterTableRecords('PC_Table_Family_Details', 'Family Detail');
            if (this.ispcNeighbour || this.isacNeighbour)
                this.getCharacterTableRecords('PC_Neighbour_Table', 'Neighbour Detail');
            if (this.ispcAffiliation || this.isacAffiliation)
                this.getCharacterTableRecords('PC_Affiliation_Table', 'Affiliation Detail');
            if (this.ispcLivingStandard || this.isacLivingStandard)
                this.getCharacterTableRecords('PC_LivingStandard_Table', 'Living Standard Detail');

        }
    }

    // method to handle customer Selection
    handleCustomerChange(event) {
        console.log('customer change callled', event.target.value);
        this.customerName = event.target.value;
        this.loanApplicantId = this.customerData[this.customerName].Id;
        this.customerTypeVal = this.customerData[this.customerName].Customer_Type__c;

    }

    // method to Handle Reset
    handleReset(event) {
        if (this.calledFrom == 'AC')
            this.showacCharacter = false;
        if (this.labelSave == 'Update') {
            this.charRecordId = undefined;
        }
        this.labelSave = 'Save';
        this.resetLogic();
    }

    // to reset the form fields;
    resetLogic() {
        const inputFields = this.template.querySelectorAll('.character');
        if (inputFields) {
            inputFields.forEach(field => {
                field.reset();
            });
        }
        this.customerName = null;
        this.customerTypeVal = null;
        if (this.calledFrom == 'PC') {
            if (this.ispcFamily) {
                this.template.querySelector('.familycombopc').value = null;
                this.familyautoData = {
                    Family_memeber_Name: undefined, Customer_Type: undefined, Relationship: undefined, Living_with_Applicant: undefined
                    , Overall_Remarks: undefined, Remarks__c: undefined
                };
            }
            if (this.ispcNeighbour) {
                this.template.querySelector('.neighbourcombopc').value = null;
                this.neighbourautoData = {
                    Applicant_Name: undefined, Feedback: undefined, Remarks: undefined
                };
            }
            if (this.ispcAffiliation) {
                this.template.querySelector('.affcombopc').value = null;
                this.affautoData = {
                    Applicant_Name: undefined, Affiliation_Remarks: undefined
                };
            }
            if (this.ispcLivingStandard) {
                this.template.querySelector('.livingcombopc').value = null;
                this.livingAutoData = {
                    Applicant_Name: undefined, LifeStyle: undefined, Consumer_Durables: undefined, Remarks: undefined,
                    SecondLifestyle: undefined, ThirdLifeStyle: undefined, FourthLifeStyle: undefined
                };
                console.log('living in reset Logic ', this.livingAutoData);
            }
        }
        else if (this.calledFrom == 'AC') {
            if (this.isacFamily)
                this.template.querySelector('.familycomboac').value = null;
            if (this.isacNeighbour)
                this.template.querySelector('.neighbourcomboac').value = null;
            if (this.isacAffiliation)
                this.template.querySelector('.affcomboac').value = null;
            if (this.isacLivingStandard)
                this.template.querySelector('.livingcomboac').value = null;
        }
    }



    // for getting the character table records------
    @api getCharacterTableRecords(metadataName, secName) {
        if (secName == 'Family Detail')
            this.familyTableData = undefined;
        else if (secName == 'Neighbour Detail')
            this.neighbourTableData = undefined;
        else if (secName == 'Affiliation Detail')
            this.affTableData = undefined;
        else if (secName == 'Living Standard Detail')
            this.livingStandardTableData = undefined;
        getCharacterTabRecords({ appId: this.applicationid, metadataName: metadataName, sectionName: secName, recType: this.calledFrom }).then((result) => {
            console.log(this.calledFrom, ':::::', secName, 'getFamilyDetailTableRecords in child= ', JSON.parse(JSON.stringify(result)));
            if (secName == 'Family Detail')
                this.familyTableData = JSON.parse(JSON.stringify(result));
            else if (secName == 'Neighbour Detail')
                this.neighbourTableData = JSON.parse(JSON.stringify(result));
            else if (secName == 'Affiliation Detail')
                this.affTableData = JSON.parse(JSON.stringify(result));
            else if (secName == 'Living Standard Detail')
                this.livingStandardTableData = JSON.parse(JSON.stringify(result));

            var charEvent = new CustomEvent('characterchangeevent', { detail: true })
            this.dispatchEvent(charEvent);

            this.childSpinner = false;
        }).catch((err) => {
            if (secName == 'Family Detail')
                this.familyTableData = undefined;
            else if (secName == 'Neighbour Detail')
                this.neighbourTableData = undefined;
            else if (secName == 'Affiliation Detail')
                this.affTableData = undefined;
            else if (secName == 'Living Standard Detail')
                this.livingStandardTableData = undefined;
            console.log('getFamilyDetailTableRecords in child Error= ', err);

            this.childSpinner = false;
        });
    }



    // get the character recordTypeId
    getcharcterRecordTypeId() {
        let rectypeName;
        if (this.calledFrom == 'AC')
            rectypeName = 'AC Character';
        if (this.calledFrom == 'PC')
            rectypeName = 'PC Character';
        getRecordTypeId({ objName: 'Character__c', recordTypeName: rectypeName })
            .then(res => {
                if (res)
                    this.characterRecordTypeId = res;
                console.log('character record type id >>>> ', JSON.stringify(res));
            })
            .catch(err => {
                console.log('errr occured in getting record type id for character', err);
            })
    }


    // This Method Is Used To Get Applicant List From Server Side
    handleGetApplicantList() {
        getApplicantList({ appId: this.applicationid }).then((result) => {
            console.log('handleGetApplicantList = ', result);
            if (result) {
                this.customerData = JSON.parse(JSON.stringify(result));
            }
        }).catch((err) => {
            console.log('handleGetApplicantList Error= ', err)
        });
    }

    // show toast Method
    showToast(title, variant, message) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                variant: variant,
                message: message,
            })
        );
    }

}