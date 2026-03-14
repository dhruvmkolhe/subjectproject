import { useState, useEffect } from "react";
import {
  Download,
  FolderOpen,
  Search,
  Filter,
  Calendar,
  FileText,
  Image,
  Video,
  FileCode,
  ChevronDown,
  CheckCircle2,
  Cloud,
  Trash2,
  Eye,
  Shield,
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/utils";

import { User as FirebaseUser } from "firebase/auth";

interface CleanedFilesProps {
  isAuthenticated?: boolean;
  onLogout?: () => void;
  user?: FirebaseUser | null;
}

interface CleanedFile {
  id: string;
  name: string;
  originalName: string;
  type: string;
  size: number;
  cleanedDate: Date;
  metadataRemoved: string[];
  backupLocation: string;
  downloadUrl?: string;
}

interface CleanedFileApiResponse extends Omit<CleanedFile, "cleanedDate"> {
  cleanedDate: string;
}

const CleanedFiles = ({
  isAuthenticated = false,
  onLogout,
  user,
}: CleanedFilesProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [files, setFiles] = useState<CleanedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCleanedFiles = async () => {
      setLoading(true);
      try {
        const data =
          await apiRequest<CleanedFileApiResponse[]>("/api/cleaned-files");
        setFiles(
          data.map((file) => ({
            ...file,
            cleanedDate: new Date(file.cleanedDate),
          })),
        );
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to load cleaned files",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchCleanedFiles();
  }, [toast]);

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/"))
      return <Image className="w-5 h-5 text-blue-500" />;
    if (fileType.startsWith("video/"))
      return <Video className="w-5 h-5 text-purple-500" />;
    if (fileType.includes("pdf"))
      return <FileText className="w-5 h-5 text-red-500" />;
    if (fileType.includes("document") || fileType.includes("presentation"))
      return <FileText className="w-5 h-5 text-blue-600" />;
    return <FileCode className="w-5 h-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const handleDownload = (file: CleanedFile) => {
    toast({
      title: "Download started",
      description: `Downloading ${file.name}`,
    });
    // Actual download logic would go here
  };

  const handleViewBackup = (file: CleanedFile) => {
    toast({
      title: "Opening Google Drive",
      description: `Navigating to ${file.backupLocation}`,
    });
    // Open Google Drive location
  };

  const handleDelete = (file: CleanedFile) => {
    toast({
      title: "File deleted",
      description: `${file.name} has been removed. Original backup remains in Google Drive.`,
      variant: "default",
    });
  };

  const handleLogout = () => {
    onLogout?.();
  };

  const filteredFiles = files.filter((file) => {
    const matchesSearch =
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.originalName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterType === "all" || file.type.startsWith(filterType);
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: files.length,
    images: files.filter((f) => f.type.startsWith("image/")).length,
    documents: files.filter(
      (f) =>
        f.type.includes("pdf") ||
        f.type.includes("document") ||
        f.type.includes("presentation"),
    ).length,
    videos: files.filter((f) => f.type.startsWith("video/")).length,
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
              <FolderOpen className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Cleaned Files</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Browse and download your privacy-protected files. All originals are
            safely stored in your Google Drive.
          </p>
        </div>

        {/* Stats Cards */}
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
              <div className="text-2xl font-bold text-blue-500">
                {stats.images}
              </div>
              <div className="text-xs text-muted-foreground">Images</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">
                {stats.documents}
              </div>
              <div className="text-xs text-muted-foreground">Documents</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-500">
                {stats.videos}
              </div>
              <div className="text-xs text-muted-foreground">Videos</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Bar */}
        <Card
          className="mb-8 animate-slide-up"
          style={{ animationDelay: "0.1s" }}
        >
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="w-4 h-4" />
                    {filterType === "all"
                      ? "All Files"
                      : filterType === "image"
                        ? "Images"
                        : filterType === "video"
                          ? "Videos"
                          : "Documents"}
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setFilterType("all")}>
                    All Files
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType("image")}>
                    Images
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType("video")}>
                    Videos
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFilterType("application")}
                  >
                    Documents
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>

        {/* Files List */}
        {filteredFiles.length > 0 ? (
          <div
            className="space-y-4 animate-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            {filteredFiles.map((file) => (
              <Card
                key={file.id}
                className="transition-all duration-300 hover:border-primary/30"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* File Icon */}
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      {getFileIcon(file.type)}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold mb-1 flex items-center gap-2">
                            <span className="truncate">{file.name}</span>
                            <Badge
                              variant="outline"
                              className="shrink-0 gap-1 bg-success/10 text-success border-success/20"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Cleaned
                            </Badge>
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(file.cleanedDate)}
                            </span>
                            <span>•</span>
                            <span>{formatFileSize(file.size)}</span>
                            <span>•</span>
                            <span className="truncate">
                              Original: {file.originalName}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Metadata Removed */}
                      <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="w-4 h-4 text-primary" />
                          <span className="text-xs font-medium text-primary">
                            {file.metadataRemoved.length} metadata field(s)
                            removed
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {file.metadataRemoved.map((item) => (
                            <Badge
                              key={item}
                              variant="outline"
                              className="text-xs bg-background"
                            >
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Backup Info */}
                      <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Cloud className="w-4 h-4" />
                          <span>Original backed up to: </span>
                          <code className="text-xs bg-background px-2 py-0.5 rounded border border-border">
                            {file.backupLocation}
                          </code>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => handleDownload(file)}>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewBackup(file)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Backup
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(file)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Empty State */
          <Card className="animate-fade-in">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <FolderOpen className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery || filterType !== "all"
                  ? "No files found"
                  : "No cleaned files yet"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {searchQuery || filterType !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Upload files to get started with metadata removal and privacy protection."}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Info Section */}
        <Card
          className="mt-8 animate-slide-up"
          style={{ animationDelay: "0.3s" }}
        >
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Privacy & Security
            </CardTitle>
            <CardDescription>How your files are protected</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <CheckCircle2 className="w-5 h-5 text-success mb-2" />
                <h4 className="font-medium text-sm mb-1">Metadata Removed</h4>
                <p className="text-xs text-muted-foreground">
                  All sensitive metadata stripped from cleaned files
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <Cloud className="w-5 h-5 text-primary mb-2" />
                <h4 className="font-medium text-sm mb-1">Secure Backup</h4>
                <p className="text-xs text-muted-foreground">
                  Originals safely stored in your Google Drive
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <Download className="w-5 h-5 text-primary mb-2" />
                <h4 className="font-medium text-sm mb-1">Download Anytime</h4>
                <p className="text-xs text-muted-foreground">
                  Access your cleaned files whenever you need them
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CleanedFiles;
