/**
* @File Name          : CryptoClass.apxc
* @Author             : Umair Ahmad
* @Created On         : 18 August 2022
*==============================================================================
* Ver         Date                     Author                 Modification
*==============================================================================
* 1.0     18 August 2022              Umair Ahmad             Initial Version
**/

public class CryptoClass {
    
    public static blob generateIV(){
        //Generate Random 16 cahracter string
        Integer len = 16;
        Blob blobKey = crypto.generateAesKey(128);
        String key = EncodingUtil.convertToHex(blobKey);
        String pwd = key.substring(0,len);
        system.debug('pwd  ' +pwd);
        
        Blob exampleIv = Blob.valueOf(pwd);
        return exampleIv;
    }
    
    public static String perfromEncrypt(String textToEncrypt){
        String secKey = 'a83216b649715a39b98918f6962d5606';
        Blob ivGen = generateIV();
        String iv = EncodingUtil.base64Encode(ivGen);
        Blob clearText = Blob.valueOf(textToEncrypt);                    
        Blob privateKey = Blob.valueOf(secKey);
        String ciphertextAndIV = EncodingUtil.base64Encode(Crypto.encrypt('AES256', privateKey, ivGen, clearText))+'.'+iv;
        system.debug('ciphertextAndIVciphertextAndIV '+ciphertextAndIV);
        
        return ciphertextAndIV;
    }
    
    
}