public class genericFileViewerController {
    @AuraEnabled 
    public static List<FileUtility> loadInitialData(String recordId, String uploadedFrom){ 
        List<FileUtility> lstFiles = new List<FileUtility>();
        lstFiles.addAll(
            FileUtility.fetchFiles(new Set<String>{recordId}, uploadedFrom)

        );
        System.debug(lstFiles);
        return lstFiles;
    }
}