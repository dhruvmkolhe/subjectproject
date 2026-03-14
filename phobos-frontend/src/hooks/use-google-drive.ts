import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  requestAccessToken,
  uploadFileToDrive,
  listDriveFiles,
  downloadFileFromDrive,
  deleteFileFromDrive,
  createDriveFolder,
} from "@/lib/googleDrive";

export const useGoogleDrive = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const { toast } = useToast();

  const requestAccess = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await requestAccessToken();
      setAccessToken(token);
      toast({
        title: "Connected to Google Drive",
        description: "You can now backup your files",
      });
      return token;
    } catch (error) {
      toast({
        title: "Google Drive connection failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to connect to Google Drive",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const uploadFile = useCallback(
    async (file: File, fileName: string, token?: string) => {
      const finalToken = token || accessToken;
      if (!finalToken) {
        toast({
          title: "Not connected",
          description: "Please connect to Google Drive first",
          variant: "destructive",
        });
        return null;
      }

      try {
        setIsLoading(true);
        const result = await uploadFileToDrive(file, fileName, finalToken);
        toast({
          title: "File uploaded",
          description: `${result.name} has been backed up to Google Drive`,
        });
        return result;
      } catch (error) {
        toast({
          title: "Upload failed",
          description:
            error instanceof Error ? error.message : "Failed to upload file",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken, toast]
  );

  const listFiles = useCallback(
    async (token?: string) => {
      const finalToken = token || accessToken;
      if (!finalToken) {
        toast({
          title: "Not connected",
          description: "Please connect to Google Drive first",
          variant: "destructive",
        });
        return [];
      }

      try {
        setIsLoading(true);
        const files = await listDriveFiles(finalToken);
        return files;
      } catch (error) {
        toast({
          title: "Failed to load files",
          description:
            error instanceof Error
              ? error.message
              : "Failed to load files from Google Drive",
          variant: "destructive",
        });
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken, toast]
  );

  const downloadFile = useCallback(
    async (fileId: string, fileName: string, token?: string) => {
      const finalToken = token || accessToken;
      if (!finalToken) {
        toast({
          title: "Not connected",
          description: "Please connect to Google Drive first",
          variant: "destructive",
        });
        return false;
      }

      try {
        setIsLoading(true);
        await downloadFileFromDrive(fileId, fileName, finalToken);
        toast({
          title: "Download started",
          description: `${fileName} is being downloaded`,
        });
        return true;
      } catch (error) {
        toast({
          title: "Download failed",
          description:
            error instanceof Error ? error.message : "Failed to download file",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken, toast]
  );

  const deleteFile = useCallback(
    async (fileId: string, token?: string) => {
      const finalToken = token || accessToken;
      if (!finalToken) {
        toast({
          title: "Not connected",
          description: "Please connect to Google Drive first",
          variant: "destructive",
        });
        return false;
      }

      try {
        setIsLoading(true);
        await deleteFileFromDrive(fileId, finalToken);
        toast({
          title: "File deleted",
          description: "File has been removed from Google Drive",
        });
        return true;
      } catch (error) {
        toast({
          title: "Delete failed",
          description:
            error instanceof Error ? error.message : "Failed to delete file",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken, toast]
  );

  const createFolder = useCallback(
    async (folderName: string, token?: string) => {
      const finalToken = token || accessToken;
      if (!finalToken) {
        toast({
          title: "Not connected",
          description: "Please connect to Google Drive first",
          variant: "destructive",
        });
        return null;
      }

      try {
        setIsLoading(true);
        const folderId = await createDriveFolder(folderName, finalToken);
        toast({
          title: "Folder created",
          description: `${folderName} has been created in Google Drive`,
        });
        return folderId;
      } catch (error) {
        toast({
          title: "Folder creation failed",
          description:
            error instanceof Error ? error.message : "Failed to create folder",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken, toast]
  );

  return {
    isLoading,
    accessToken,
    requestAccess,
    uploadFile,
    listFiles,
    downloadFile,
    deleteFile,
    createFolder,
  };
};
