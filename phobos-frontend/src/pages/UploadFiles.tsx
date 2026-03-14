import { useState, useCallback } from "react";
import { User as FirebaseUser } from "firebase/auth";
import {
  Upload,
  FileWarning,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  Image,
  Video,
  FileCode,
  AlertCircle,
  Cloud,
  Shield,
  HardDrive,
  ExternalLink,
} from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useGoogleDrive } from "@/hooks/use-google-drive";
import { getApiBaseUrl } from "@/lib/utils";

interface UploadFilesProps {
  isAuthenticated?: boolean;
  onLogout?: () => void;
  user?: FirebaseUser | null;
}

interface FileUpload {
  id: string;
  file: File;
  status: "pending" | "uploaded" | "processing" | "success" | "error";
  progress: number;
  error?: string;
  metadataRemoved?: string[];
  metadataBefore?: Record<string, unknown>;
  metadataAfter?: Record<string, unknown>;
  driveFileId?: string;
  isBackedUp?: boolean;
  remoteLink?: string;
}

const UploadFiles = ({
  isAuthenticated = false,
  onLogout,
  user,
}: UploadFilesProps) => {
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();
  const {
    isLoading: driveIsLoading,
    accessToken,
    requestAccess,
    uploadFile: uploadToDrive,
  } = useGoogleDrive();

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <Image className="w-5 h-5" />;
    if (fileType.startsWith("video/")) return <Video className="w-5 h-5" />;
    if (fileType.includes("pdf") || fileType.includes("document"))
      return <FileText className="w-5 h-5" />;
    return <FileCode className="w-5 h-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles);
      const uploadFiles: FileUpload[] = fileArray.map((file) => ({
        id: Math.random().toString(36).substring(7),
        file,
        status: "uploaded" as const,
        progress: 0,
      }));

      setFiles((prev) => [...prev, ...uploadFiles]);

      toast({
        title: "Files uploaded",
        description: `${fileArray.length} file(s) ready to process`,
      });
    },
    [toast],
  );

  const processFile = async (fileId: string, file: File) => {
    // Set status to processing
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId
          ? { ...f, status: "processing" as const, progress: 0 }
          : f,
      ),
    );

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${getApiBaseUrl()}/sanitize`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Processing failed");
      const data = await response.json();

      // Extract removed metadata by comparing before and after
      const metadataRemoved: string[] = [];
      if (data.metadata_before && data.metadata_after) {
        Object.keys(data.metadata_before).forEach((key) => {
          if (!(key in data.metadata_after)) {
            metadataRemoved.push(key);
          }
        });
      }

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: "success" as const,
                progress: 100,
                metadataRemoved,
                metadataBefore: data.metadata_before,
                metadataAfter: data.metadata_after,
                remoteLink: data.remote_link,
              }
            : f,
        ),
      );

      toast({
        title: "File processed",
        description: `${file.name} has been cleaned successfully`,
      });
    } catch (error) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: "error" as const,
                progress: 0,
                error:
                  error instanceof Error ? error.message : "Processing failed",
              }
            : f,
        ),
      );

      toast({
        title: "Processing failed",
        description:
          error instanceof Error ? error.message : "Failed to process file",
        variant: "destructive",
      });
    }
  };

  const processAllFiles = async () => {
    const uploadedFiles = files.filter((f) => f.status === "uploaded");

    if (uploadedFiles.length === 0) {
      toast({
        title: "No files to process",
        description: "Please upload files first",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Processing started",
      description: `Processing ${uploadedFiles.length} file(s)...`,
    });

    // Process files sequentially
    for (const uploadFile of uploadedFiles) {
      await processFile(uploadFile.id, uploadFile.file);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const clearCompleted = () => {
    setFiles((prev) =>
      prev.filter((f) => f.status === "uploaded" || f.status === "processing"),
    );
    toast({
      title: "Cleared",
      description: "Completed and failed files have been removed",
    });
  };

  const handleLogout = () => {
    onLogout?.();
  };

  const backupSuccessfulFiles = async () => {
    const successFiles = files.filter((f) => f.status === "success");
    if (successFiles.length === 0) {
      toast({
        title: "No files to backup",
        description: "Please process files first",
        variant: "destructive",
      });
      return;
    }

    if (!accessToken) {
      const token = await requestAccess();
      if (!token) return;
    }

    toast({
      title: "Starting backup",
      description: `Backing up ${successFiles.length} file(s) to Google Drive...`,
    });

    for (const file of successFiles) {
      try {
        const result = await uploadToDrive(
          file.file,
          `${file.file.name}_cleaned`,
          accessToken || undefined,
        );
        if (result) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === file.id
                ? { ...f, driveFileId: result.fileId, isBackedUp: true }
                : f,
            ),
          );
        }
      } catch (error) {
        console.error("Backup error:", error);
      }
    }
  };

  const stats = {
    total: files.length,
    uploaded: files.filter((f) => f.status === "uploaded").length,
    processing: files.filter((f) => f.status === "processing").length,
    success: files.filter((f) => f.status === "success").length,
    error: files.filter((f) => f.status === "error").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        user={user}
      />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Page Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Upload Files</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Upload files to automatically remove sensitive metadata. Originals
            are securely backed up to your Google Drive.
          </p>
        </div>

        {/* Stats Cards */}
        {files.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-slide-up">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-foreground">
                  {stats.total}
                </div>
                <div className="text-xs text-muted-foreground">Total Files</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-primary">
                  {stats.uploaded}
                </div>
                <div className="text-xs text-muted-foreground">
                  Ready to Process
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-success">
                  {stats.success}
                </div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-destructive">
                  {stats.error}
                </div>
                <div className="text-xs text-muted-foreground">Failed</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Upload Area */}
        <Card
          className="mb-8 animate-slide-up"
          style={{ animationDelay: "0.1s" }}
        >
          <CardContent className="p-8">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
                isDragging
                  ? "border-primary bg-primary/5 scale-[1.02]"
                  : "border-border hover:border-primary/50 hover:bg-primary/5"
              }`}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Drop files here or click to browse
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Supports images, documents, videos, and audio files
                  </p>
                </div>
                <input
                  type="file"
                  multiple
                  onChange={handleFileInput}
                  className="hidden"
                  id="file-input"
                />
                <label htmlFor="file-input">
                  <Button size="lg" asChild>
                    <span className="cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      Select Files
                    </span>
                  </Button>
                </label>
              </div>
            </div>

            {/* Info Badges */}
            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium mb-1">
                    Privacy Protected
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Metadata removed automatically
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                <Cloud className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium mb-1">Secure Backup</h4>
                  <p className="text-xs text-muted-foreground">
                    Originals saved to Google Drive
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                <FileWarning className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium mb-1">
                    Content Preserved
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Files remain fully usable
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File List */}
        {files.length > 0 && (
          <Card className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Upload Queue</CardTitle>
                  <CardDescription>
                    {stats.processing > 0
                      ? `Processing ${stats.processing} file(s)...`
                      : stats.uploaded > 0
                        ? `${stats.uploaded} file(s) ready to process`
                        : "All files processed"}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {stats.uploaded > 0 && (
                    <Button
                      size="sm"
                      onClick={processAllFiles}
                      disabled={stats.processing > 0}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Process Files
                    </Button>
                  )}
                  {stats.success > 0 && (
                    <Button
                      size="sm"
                      onClick={backupSuccessfulFiles}
                      disabled={driveIsLoading}
                      variant="secondary"
                    >
                      <HardDrive className="w-4 h-4 mr-2" />
                      {driveIsLoading ? "Backing Up..." : "Backup to Drive"}
                    </Button>
                  )}
                  {(stats.success > 0 || stats.error > 0) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearCompleted}
                    >
                      Clear Completed
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {files.map((uploadFile) => (
                  <div
                    key={uploadFile.id}
                    className="p-4 rounded-lg border border-border bg-card/50 transition-all duration-300 hover:border-primary/30"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                        {getFileIcon(uploadFile.file.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate mb-1">
                              {uploadFile.file.name}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(uploadFile.file.size)}
                            </p>
                          </div>

                          <div className="shrink-0">
                            {uploadFile.status === "pending" && (
                              <Badge variant="outline">Pending</Badge>
                            )}
                            {uploadFile.status === "uploaded" && (
                              <Badge
                                variant="default"
                                className="gap-1 bg-blue-600 hover:bg-blue-700"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                Uploaded
                              </Badge>
                            )}
                            {uploadFile.status === "processing" && (
                              <Badge variant="default" className="gap-1">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Processing
                              </Badge>
                            )}
                            {uploadFile.status === "success" && (
                              <Badge
                                variant="default"
                                className="gap-1 bg-success hover:bg-success/80"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                Complete
                              </Badge>
                            )}
                            {uploadFile.status === "error" && (
                              <Badge variant="destructive" className="gap-1">
                                <XCircle className="w-3 h-3" />
                                Failed
                              </Badge>
                            )}
                          </div>
                        </div>

                        {uploadFile.status === "processing" && (
                          <Progress
                            value={uploadFile.progress}
                            className="h-2 mb-2"
                          />
                        )}

                        {uploadFile.status === "success" &&
                          (uploadFile.metadataRemoved ||
                            uploadFile.metadataBefore) && (
                            <div className="mt-3 space-y-3">
                              {/* Removed Metadata Summary */}
                              {uploadFile.metadataRemoved &&
                                uploadFile.metadataRemoved.length > 0 && (
                                  <div className="p-3 rounded-lg bg-success/5 border border-success/20">
                                    <div className="flex items-center gap-2 mb-2">
                                      <CheckCircle2 className="w-4 h-4 text-success" />
                                      <span className="text-xs font-medium text-success">
                                        {uploadFile.metadataRemoved.length}{" "}
                                        Metadata Field(s) Removed
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {uploadFile.metadataRemoved.map(
                                        (item) => (
                                          <Badge
                                            key={item}
                                            variant="outline"
                                            className="text-xs bg-background"
                                          >
                                            {item}
                                          </Badge>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                )}

                              {/* Before vs After Comparison */}
                              {uploadFile.metadataBefore &&
                                uploadFile.metadataAfter && (
                                  <div className="grid md:grid-cols-2 gap-3">
                                    {/* Before */}
                                    <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                                      <h5 className="text-xs font-semibold text-destructive mb-2 flex items-center gap-1">
                                        <XCircle className="w-3 h-3" />
                                        Before
                                      </h5>
                                      <div className="space-y-1 max-h-40 overflow-y-auto text-xs">
                                        {Object.entries(
                                          uploadFile.metadataBefore,
                                        ).map(([key, value]) => (
                                          <div
                                            key={key}
                                            className="text-muted-foreground"
                                          >
                                            <span className="font-medium text-foreground">
                                              {key}:
                                            </span>{" "}
                                            {typeof value === "string" ||
                                            typeof value === "number"
                                              ? String(value)
                                              : JSON.stringify(value).substring(
                                                  0,
                                                  50,
                                                ) +
                                                (JSON.stringify(value).length >
                                                50
                                                  ? "..."
                                                  : "")}
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {/* After */}
                                    <div className="p-3 rounded-lg bg-success/5 border border-success/20">
                                      <h5 className="text-xs font-semibold text-success mb-2 flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" />
                                        After
                                      </h5>
                                      <div className="space-y-1 max-h-40 overflow-y-auto text-xs">
                                        {Object.entries(
                                          uploadFile.metadataAfter,
                                        ).length > 0 ? (
                                          Object.entries(
                                            uploadFile.metadataAfter,
                                          ).map(([key, value]) => (
                                            <div
                                              key={key}
                                              className="text-muted-foreground"
                                            >
                                              <span className="font-medium text-foreground">
                                                {key}:
                                              </span>{" "}
                                              {typeof value === "string" ||
                                              typeof value === "number"
                                                ? String(value)
                                                : JSON.stringify(
                                                    value,
                                                  ).substring(0, 50) +
                                                  (JSON.stringify(value)
                                                    .length > 50
                                                    ? "..."
                                                    : "")}
                                            </div>
                                          ))
                                        ) : (
                                          <div className="text-muted-foreground italic">
                                            All metadata removed
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}

                              {/* Remote Link */}
                              {uploadFile.remoteLink && (
                                <div className="p-3 rounded-lg bg-green/5 border border-green/20">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <Cloud className="w-4 h-4 text-green" />
                                      <span className="text-xs font-medium">
                                        Cleaned File Available
                                      </span>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => {
                                      window.open(
                                        uploadFile.remoteLink,
                                        "_blank",
                                      );
                                    }}
                                    className="w-full gap-2"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                    Open in Google Drive
                                  </Button>
                                </div>
                              )}

                              {/* Backup Status */}
                              <div className="p-3 rounded-lg bg-blue/5 border border-blue/20">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <HardDrive className="w-4 h-4 text-blue" />
                                    <span className="text-xs font-medium">
                                      Google Drive Backup
                                    </span>
                                  </div>
                                  {uploadFile.isBackedUp ? (
                                    <Badge
                                      variant="default"
                                      className="gap-1 bg-blue hover:bg-blue/80"
                                    >
                                      <CheckCircle2 className="w-3 h-3" />
                                      Backed Up
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="gap-1">
                                      Pending
                                    </Badge>
                                  )}
                                </div>
                                {uploadFile.driveFileId && (
                                  <p className="text-xs text-muted-foreground mt-2 break-all">
                                    File ID: {uploadFile.driveFileId}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                        {uploadFile.status === "error" && uploadFile.error && (
                          <div className="mt-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-destructive" />
                              <span className="text-xs text-destructive">
                                {uploadFile.error}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {files.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <FileWarning className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              No files uploaded yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Upload your first file to start removing sensitive metadata and
              protecting your privacy.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadFiles;
