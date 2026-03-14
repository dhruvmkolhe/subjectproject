import { Image, FileText, Video } from "lucide-react";

const fileTypes = [
  {
    category: "Images",
    icon: Image,
    formats: [".jpg", ".png"],
  },
  {
    category: "Documents",
    icon: FileText,
    formats: [".pdf"],
  },
  {
    category: "Media",
    icon: Video,
    formats: [".mp4", ".mov", ".mp3"],
  },
];

const FileTypesBadge = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {fileTypes.map((type) => (
        <div
          key={type.category}
          className="p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <type.icon className="w-4 h-4 text-primary" />
            </div>
            <span className="font-medium text-sm">{type.category}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {type.formats.map((format) => (
              <span
                key={format}
                className="px-2 py-1 rounded-md bg-muted text-xs font-mono text-muted-foreground"
              >
                {format}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FileTypesBadge;
