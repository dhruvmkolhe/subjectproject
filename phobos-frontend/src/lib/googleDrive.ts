import { User } from "firebase/auth";

// Google Drive API configuration
const DISCOVERY_DOC =
  "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest";
const SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive",
];

let gapiInited = false;
let gisInited = false;
let tokenClient: any = null;

/**
 * Initialize Google API client
 */
export const initializeGoogleApi = async (clientId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (gapiInited) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.async = true;
    script.defer = true;
    script.onload = async () => {
      try {
        window.gapi.load("client", async () => {
          try {
            await window.gapi.client.init({
              discoveryDocs: [DISCOVERY_DOC],
              clientId: clientId,
              scope: SCOPES.join(" "),
            });
            gapiInited = true;
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      } catch (error) {
        reject(error);
      }
    };
    script.onerror = () => reject(new Error("Failed to load Google API"));
    document.body.appendChild(script);
  });
};

/**
 * Initialize Google Identity Services
 */
export const initializeGoogleIdentity = (clientId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (gisInited) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      try {
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: SCOPES.join(" "),
          callback: "", // Will be set when requesting access
        });
        gisInited = true;
        resolve();
      } catch (error) {
        reject(error);
      }
    };
    script.onerror = () =>
      reject(new Error("Failed to load Google Identity Services"));
    document.body.appendChild(script);
  });
};

/**
 * Request access token from user
 */
export const requestAccessToken = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error("Google Identity not initialized"));
      return;
    }

    tokenClient.callback = async (response: any) => {
      if (response.error) {
        reject(new Error(response.error));
      } else {
        resolve(response.access_token);
      }
    };

    // Request token
    tokenClient.requestAccessToken({ prompt: "consent" });
  });
};

/**
 * Upload file to Google Drive
 */
export const uploadFileToDrive = async (
  file: File,
  fileName: string,
  accessToken: string
): Promise<{ fileId: string; name: string }> => {
  const metadata = {
    name: fileName,
    mimeType: file.type,
  };

  const form = new FormData();
  form.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" })
  );
  form.append("file", file);

  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    }
  );

  if (!response.ok) {
    throw new Error("Failed to upload file to Google Drive");
  }

  const data = await response.json();
  return {
    fileId: data.id,
    name: data.name,
  };
};

/**
 * List files from Google Drive
 */
export const listDriveFiles = async (accessToken: string): Promise<any[]> => {
  const response = await fetch(
    "https://www.googleapis.com/drive/v3/files?pageSize=50&fields=files(id,name,mimeType,createdTime,modifiedTime,size)",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to list Google Drive files");
  }

  const data = await response.json();
  return data.files || [];
};

/**
 * Download file from Google Drive
 */
export const downloadFileFromDrive = async (
  fileId: string,
  fileName: string,
  accessToken: string
): Promise<void> => {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to download file from Google Drive");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(link);
};

/**
 * Delete file from Google Drive
 */
export const deleteFileFromDrive = async (
  fileId: string,
  accessToken: string
): Promise<void> => {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to delete file from Google Drive");
  }
};

/**
 * Create folder in Google Drive
 */
export const createDriveFolder = async (
  folderName: string,
  accessToken: string
): Promise<string> => {
  const metadata = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
  };

  const response = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(metadata),
  });

  if (!response.ok) {
    throw new Error("Failed to create folder in Google Drive");
  }

  const data = await response.json();
  return data.id;
};

// Extend Window interface for Google APIs
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}
