import { LightningElement, api, wire, track } from 'lwc';
import initialize from '@salesforce/apex/OCRController.initialize';
import doOCRCallout from '@salesforce/apex/OCRController.doOCRCallout';
import getOCRData from '@salesforce/apex/OCRController.getOCRData';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { CloseActionScreenEvent } from 'lightning/actions';

export default class FsOCR extends LightningElement {

    @api customerTypeValue = 'Primary Applicant';
    @api verificationTypeValue;

    @track dataLoaded = false;
    @track allData;
    @track fileUploadsUI = [];
    @track uploadedFileData = {};
    @track activeSections = ['Verify_OCR', 'Select_OCR_Record'];
    @track isLoading = true;
    @track openImg = false;
    @track expand = 'validate revert';
    @track btnExpand = 'revert';
    @track ocrId;
    @track kycRecId = [];
    @track KYCType = 'Aadhaar Card';
    @track ocrData = [];
    @track isOCRDataArrived = false;
    @track isValidOcr = false;
    @track kycFileList = [];
    @track isOcrUploaded = false;
    @track imageUpload = 0;
    @track refreshOCR = false;
    @track selectedFile;

    @track b64;
    @track isPdf = false;
    @track isImg = false;
    @track pdfUrl;

    connectedCallback() {
        initialize()
            .then(result => {
                this.allData = result;
                this.dataLoaded = true;
                this.isLoading = false;
                this.fileUploadsUI = this.sortHelper(this.allData.metadataMap['Aadhaar Card'], 'Order__c', 'asc');
                console.log('this.fileUploadsUI ', this.fileUploadsUI);
            })
            .catch(error => {
                console.log('error while initialize ', error);
            });
        this.sendCustomerType();
    }

    @api hideOcrTable(hide) {
        this.ocrId = undefined;
        this.ocrData = [];
        this.isOCRDataArrived = hide;
    }

    handleCustomerType(event) {
        console.log('cus ', event.detail);
        this.customerTypeValue = event.detail.value;
        this.sendCustomerType();
        this.fileUploadsUI.forEach(element => {
            element.fileName = '';
        });
        this.kycFileList = [];
        this.imageUpload = 0;
        //change
        this.ocrId = '';
        this.uploadedFileData = {};
    }

    handleChange(event) {
        this.ocrId = '';
        this.isLoading = true;
        this.uploadedFileData = {};
        var _data = this.allData.metadataMap;
        this.fileUploadsUI = [];
        console.log('mdt ', this.allData.metadataMap);
        for (var key in _data) {
            if (key == event.target.value) {
                console.log('key ', key);
                this.KYCType = key;
                this.fileUploadsUI = this.sortHelper(_data[key], 'Order__c', 'asc');
            }
        }
        console.log('this.this.fileUploadsUI ', this.fileUploadsUI);
        this.isLoading = false;
        this.imageUpload = 0;
    }

    handleUploadImage(event) {
        this.expand = 'validate changemargin';
        this.btnExpand = 'btnup';
        this.isLoading = true;
        var _targetId = event.target.dataset.targetId;
        var _orientation = event.target.dataset.targetOrientation;
        console.log('orientation ' + _orientation);
        var fileData;
        console.log('file123 ', event.target.files);
        const file = event.target.files[0]
        var reader = new FileReader();
        reader.onload = async () => {
            this.isOcrUploaded = true;
            var base64 = reader.result.split(',')[1]
            fileData = {
                'filename': file.name,
                'base64': base64,
                'filetype': file.type
            }
            if (this.KYCType != 'Aadhaar Card')
                this.kycFileList.push(fileData);
            this.uploadedFileData[_targetId] = fileData;
            this.uploadedFileData[_targetId].ocrSide = _orientation //event.target.label;
            console.log('ORIENTATION ', event.target.label);
            console.log('this.uploadedFileData.side ', this.uploadedFileData.side);
            console.log('filedata ', this.uploadedFileData[_targetId]);
            let tempFileUploadUI = JSON.parse(JSON.stringify(this.fileUploadsUI));
            tempFileUploadUI.forEach(element => {
                if (element.DeveloperName === _targetId) {
                    console.log('1 ', JSON.stringify(this.uploadedFileData));
                    console.log('taretID ', _targetId);
                    element.fileName = this.uploadedFileData[_targetId].filename;
                    element.fileURL = 'data:' + this.uploadedFileData[_targetId].filetype + ';base64,' + this.uploadedFileData[_targetId].base64;
                    //element.fileURL = 'data:application/pdf;base64,'+encodeURI(this.uploadedFileData[_targetId].base64);
                    console.log('files ', element.fileName + ' :: ' + element.fileURL);
                }
            });

            // this.b64 = this.uploadedFileData[_targetId].base64;
            // console.log('this.b64 data = ',this.b64);
            this.fileUploadsUI = JSON.parse(JSON.stringify(tempFileUploadUI));
            console.log('fileUI ', this.fileUploadsUI);
            this.isLoading = false;
            this.imageUpload = this.imageUpload + 1;
            console.log('uploadedfileData ', this.uploadedFileData);
        }
        reader.readAsDataURL(file);
        if (file) {
            console.log('1running');
            this.showToast('Success', 'Success', 'Image Uploaded Successfully!!');
            this.closeAction();
        }
    }

    base64ToBlob(base64, type = "application/octet-stream") {
        const binStr = atob(base64);
        const len = binStr.length;
        const arr = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            arr[i] = binStr.charCodeAt(i);
        }
        return new Blob([arr], { type: type });
    }

    previewImage(event) {
        this.isPdf = false;
        this.isImg = false;
        this.pdfUrl = undefined; 
        console.log(JSON.parse(JSON.stringify(event.currentTarget.dataset.file)));
        let currentIndex = event.currentTarget.dataset.file;
        this.selectedFile = JSON.parse(JSON.stringify(this.fileUploadsUI[currentIndex]));
        console.log('this.selectedFile= ', this.selectedFile);
        if (this.selectedFile.fileName.includes('.pdf')) {
            console.log('FILE IS PDF')
            this.isPdf = true;
            let b64 = this.selectedFile.fileURL.replace('data:application/pdf;base64,', '');
            const blob = this.base64ToBlob(b64, 'application/pdf');
            const url = ''+URL.createObjectURL(blob);
            console.log('url= ',url)
            this.pdfUrl = url;
            //window.document.write(str)
            //window.open("").document.write(str);
            //pdfWindow.document.write(str);
            this.openImg = true;
        } else {
            console.log('FILE IS IMAGE')
            this.isImg = true;
            this.openImg = true;
        }
    }

    navigateToFiles(event) {
        this[NavigationMixin.Navigate]({
            type: 'standard__namedPage',
            attributes: {
                pageName: 'filePreview'
            },
            state: {
                //recordIds: event.target.dataset.id
                selectedRecordId: event.currentTarget.dataset.id
            }
        })
    }

    async handleClick(event) {
        var size = Object.keys(this.uploadedFileData).length;
        console.log('this.uploadedFileData.length ', size);
        if (!this.isOcrUploaded || size == 0) {
            this.showToast('Error', 'Error', 'Document is not uploaded for OCR');
            this.closeAction();
            return;
        }
        if (this.KYCType != 'Pan Card' && size < 2) {
            this.showToast('Error', 'Error', 'Front Or Back Document Missing!!');
            this.closeAction();
            return;
        }
        this.showToast('Success', 'Success', 'OCR Submitted Successfully!!');
        this.closeAction();
        this.isLoading = true;
        var breakLoop = true;
        if (this.isInputValid()) {
            for (var key in this.uploadedFileData) {
                this.isValidOcr = false;
                if (breakLoop) {
                    await doOCRCallout({ base64String: JSON.stringify(this.uploadedFileData[key]['base64']), metadataName: key, recId: this.ocrId, KYCType: this.KYCType, ocrSide: this.uploadedFileData[key].ocrSide }).then(result => {
                        console.log(result);
                        if (result.kycOcrId === 'KYC Type Missmatch Error') {
                            this.isLoading = false;
                            this.isValidOcr = false;
                            this.showToast('Error', 'Error', 'KYC Type Mismatch Error!!');
                            this.closeAction();
                            this.sendKYCDoc(this.kycFileList, this.KYCType);
                            breakLoop = false;
                            return;
                        }
                        if (result.kycOcrId === 'Wrong Side Image Uploaded Error') {
                            this.isLoading = false;
                            this.isValidOcr = false;
                            this.showToast('Error', 'Error', 'Wrong Side Image Uploaded !!');
                            this.closeAction();
                            this.sendKYCDoc(this.kycFileList, this.KYCType);
                            breakLoop = false;
                            return;
                        }
                        else if (result.kycOcrId != 'KYC Type Missmatch Error' && result.kycOcrId != 'Wrong Side Image Uploaded Error') {
                            this.isValidOcr = true;
                            console.log('id ', result.kycOcrId);
                            this.ocrId = result.kycOcrId;
                            if (!this.kycRecId.includes(result.kycOcrId))
                                this.kycRecId.push(result.kycOcrId);
                            console.log('this.kycRecId ' + this.kycRecId);
                            breakLoop = true;
                        }
                        else {
                            this.isLoading = false;
                            this.isValidOcr = false;
                            this.showToast('Error', 'Error', 'Issue in OCR please proceed with self registeration!!');
                            this.closeAction();
                            this.showCustomerInfoForm();
                            this.verificationTypeValue = 'Self';
                            this.setVerificationType();
                            this.sendKYCDoc(this.kycFileList, this.KYCType);
                            breakLoop = false;
                        }
                    })
                        .catch(error => {
                            console.error('ocr catch executed :: ', error);
                            this.isLoading = false;
                            this.isValidOcr = false;
                            this.showToast('Error', 'Error', 'Issue in OCR please proceed with self registeration!!');
                            this.closeAction();
                            this.showCustomerInfoForm();
                            this.verificationTypeValue = 'Self';
                            this.setVerificationType();
                            this.sendKYCDoc(this.kycFileList, this.KYCType);
                            breakLoop = false;
                        })
                }
            }
            if (this.isValidOcr)
                this.getAllOCRRecords();
        }
        this.isLoading = false;
        this.imageUpload = 0;
        if (breakLoop) {
            this.isOcrUploaded = false;
            this.fileUploadsUI.forEach(element => {
                element.fileName = '';
            });
        }
        // this.fileUploadsUI.forEach(element => {
        //         element.fileName = '';
        // });
    }

    @api handleRefreshOCR() {
        this.refreshOCR = true;
        this.getAllOCRRecords();
    }

    @api async getAllOCRRecords() {
        this.isOCRDataArrived = false;
        await getOCRData({ kycOCRId: this.kycRecId }).then(result => {
            if (result) {
                this.isOCRDataArrived = true;
                this.ocrData = result;
                if (!this.refreshOCR) {
                    this.showToast('Success', 'Success', 'OCR Verified Successfully!!');
                    this.closeAction();
                }
                console.log('ocr result from table ', result);
                this.verificationTypeValue = 'OCR';
                this.setVerificationType();
            }
            else {
                this.showToast('Error', 'Error', 'Issue in OCR please proceed with self registeration!!');
                this.closeAction();
                this.showCustomerInfoForm();
                this.verificationTypeValue = 'Self';
                this.setVerificationType();
                this.isLoading = false;
            }
        })
            .catch(error => {
                this.showToast('Error', 'Error', 'Issue in OCR please proceed with self registeration!!');
                this.closeAction();
                console.log('error in data table ', error);
                this.showCustomerInfoForm();
                this.verificationTypeValue = 'Self';
                this.setVerificationType();
                this.isLoading = false;
            })
        this.refreshOCR = false;
    }

    handleSelectedOCR(event) {
        console.log('Selected Row ', JSON.stringify(event.detail));
        this.showCustomerInfoForm();
        this.sendOCRTableData(event.detail);
        if (this.KYCType != 'Aadhaar Card')
            this.sendKYCDoc(this.kycFileList, this.KYCType);
    }

    sortHelper(dataToSort, sortBy, direction) {
        let fieldValue = row => row[sortBy] || '';
        let reverse = direction === 'asc' ? 1 : -1;
        if (dataToSort !== undefined && dataToSort.length > 0) {
            var records = Object.assign([], dataToSort);
            records = records.sort((a, b) => {
                a = fieldValue(a) ? fieldValue(a) : '';
                b = fieldValue(b) ? fieldValue(b) : '';
                return reverse * ((a > b) - (b > a));
            });
            return records;
        }
    }

    isInputValid() {
        let isValid = true;
        let inputFields = this.template.querySelectorAll('.validate');
        inputFields.forEach(inputField => {
            if (!inputField.checkValidity()) {
                inputField.reportValidity();
                isValid = false;
            }
        });
        return isValid;
    }

    closeModal() {
        this.openImg = false;
        this.selectedFile = undefined;
    }

    showCustomerInfoForm() {
        const ocrEvent = new CustomEvent("ocrevent", {
            detail: true
        });
        console.log('dispatch event ', ocrEvent);
        this.dispatchEvent(ocrEvent);
    }

    sendCustomerType() {
        const customerTypeEvent = new CustomEvent("changecustomertype", {
            detail: this.customerTypeValue
        });
        console.log('dispatch event ', customerTypeEvent);
        this.dispatchEvent(customerTypeEvent);
    }

    sendOCRTableData(row) {
        const ocrTableEvent = new CustomEvent("getocrtable", {
            detail: row
        });
        console.log('dispatch event ', ocrTableEvent);
        this.dispatchEvent(ocrTableEvent);
    }

    sendKYCDoc(kycDoc, kycType) {
        console.log('ocrdoc ', kycDoc, kycType);
        const fileWrap = { kycDoc: kycDoc, kycType: kycType };
        const ocrDocEvent = new CustomEvent("getocrdoc", {
            detail: fileWrap
        });
        console.log('dispatch event ocrdoc ', ocrDocEvent);
        this.dispatchEvent(ocrDocEvent);
    }

    setVerificationType() {
        const verificationTypeEvent = new CustomEvent("verificationevent", {
            detail: this.verificationTypeValue
        });
        console.log('dispatch event ', verificationTypeEvent);
        this.dispatchEvent(verificationTypeEvent);
    }

    showToast(title, variant, message) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                variant: variant,
                message: message,
            })
        );
    }

    closeAction() {
        this.dispatchEvent(new CloseActionScreenEvent());
    }
}