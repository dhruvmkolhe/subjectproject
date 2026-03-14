import { cn } from "@/lib/utils";

interface DocsSidebarProps {
  activeSection: string;
  onSectionClick: (section: string) => void;
}

const sections = [
  { id: "overview", label: "Overview" },
  { id: "file-support", label: "Supported Files" },
  { id: "requirements", label: "System Requirements" },
  { id: "setup", label: "Local Setup" },
  { id: "usage", label: "Usage Modes" },
  { id: "internals", label: "How It Works" },
  { id: "security", label: "Security" },
];

const DocsSidebar = ({ activeSection, onSectionClick }: DocsSidebarProps) => {
  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <nav className="sticky top-24 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Documentation
        </p>
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => onSectionClick(section.id)}
            className={cn(
              "block w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200",
              activeSection === section.id
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {section.label}
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default DocsSidebar;
