import { useNavigate, Link } from "react-router-dom";
import { User as FirebaseUser } from "firebase/auth";
import {
  Shield,
  Eye,
  Lock,
  Cloud,
  FileWarning,
  MapPin,
  User,
  FileCode,
  BookOpen,
  Globe,
  Terminal,
  Monitor,
  CheckCircle2,
} from "lucide-react";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import FeatureCard from "@/components/FeatureCard";
import FileTypesBadge from "@/components/FileTypesBadge";
import UsageModeCard from "@/components/UsageModeCard";
import { Button } from "@/components/ui/button";

interface HomeProps {
  onLogin: () => void;
  user?: FirebaseUser | null;
}

const Home = ({ onLogin, user }: HomeProps) => {
  const navigate = useNavigate();

  const handleSignIn = () => {
    onLogin();
    navigate("/upload");
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background glow effect */}
      <div className="absolute inset-0 hero-glow pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 bg-background/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center animate-pulse-glow">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-semibold">Phobos</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10">
        <section className="container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <Lock className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">
                Privacy-First File Protection
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="gradient-text">Automated Metadata Privacy.</span>
              <br />
              <span className="text-foreground">Zero Data Loss.</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
              Phobos automatically detects and strips sensitive metadata from
              your files before sharing—protecting your privacy while securely
              backing up originals.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <GoogleSignInButton onSignIn={handleSignIn} />
              <Link to="/docs">
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2 px-6 py-3.5 h-auto border-border hover:border-primary/50 hover:bg-primary/5"
                >
                  <BookOpen className="w-5 h-5" />
                  View Documentation
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16 animate-slide-up">
              <h2 className="text-2xl md:text-3xl font-semibold mb-4">
                Your Files Are Leaking Information
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Every file you share contains hidden metadata that can expose
                sensitive details about you and your work.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div
                className="feature-card animate-slide-up"
                style={{ animationDelay: "0.1s" }}
              >
                <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Location Data</h3>
                <p className="text-muted-foreground text-sm">
                  Photos and documents can reveal GPS coordinates, exposing
                  where you live, work, or travel.
                </p>
              </div>

              <div
                className="feature-card animate-slide-up"
                style={{ animationDelay: "0.2s" }}
              >
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center mb-4">
                  <User className="w-6 h-6 text-warning" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Author Details</h3>
                <p className="text-muted-foreground text-sm">
                  Files often contain your name, email, organization, and
                  software versions used to create them.
                </p>
              </div>

              <div
                className="feature-card animate-slide-up"
                style={{ animationDelay: "0.3s" }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <FileCode className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Version History</h3>
                <p className="text-muted-foreground text-sm">
                  Document metadata can include revision history, showing
                  previous edits and collaborators.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Solution Section */}
        <section className="container mx-auto px-4 py-16 md:py-24 border-t border-border/50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-2xl md:text-3xl font-semibold mb-4">
                How Phobos Protects You
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                A complete privacy solution that removes risk without losing
                your original files.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <FeatureCard
                icon={<Eye className="w-5 h-5" />}
                title="Automatic Detection"
                description="Monitors your files and automatically identifies sensitive metadata across multiple file formats."
              />
              <FeatureCard
                icon={<FileWarning className="w-5 h-5" />}
                title="Content-Equivalent Output"
                description="Conservative removal preserves file usability. Content-equivalent, not byte-identical—your files stay usable."
              />
              <FeatureCard
                icon={<Cloud className="w-5 h-5" />}
                title="Secure Google Drive Backup"
                description="Originals are safely stored in your personal Google Drive. Zero data loss guaranteed."
              />
            </div>
          </div>
        </section>

        {/* File Types Section */}
        <section className="container mx-auto px-4 py-16 md:py-24 border-t border-border/50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-semibold mb-4">
                Supported File Types
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Phobos supports a wide range of file formats commonly containing
                sensitive metadata.
              </p>
            </div>
            <FileTypesBadge />
          </div>
        </section>

        {/* Dual Deployment Section */}
        <section className="container mx-auto px-4 py-16 md:py-24 border-t border-border/50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-semibold mb-4">
                Two Ways to Use Phobos
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Choose the interface that fits your workflow—whether you're a
                casual user or a power developer.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <UsageModeCard
                icon={<Globe className="w-6 h-6" />}
                title="Web UI"
                description="For individuals"
                variant="web"
                features={[
                  "Sign in with Google authentication",
                  "Drag-and-drop file uploads",
                  "One-click sanitization",
                  "Instant download of clean files",
                  "View sanitization history",
                  "Before vs after metadata summary",
                ]}
              />
              <UsageModeCard
                icon={<Terminal className="w-6 h-6" />}
                title="CLI / Daemon"
                description="For developers & organizations"
                variant="cli"
                features={[
                  "Local processing—no cloud account needed",
                  "Daemon mode for folder monitoring",
                  "Batch processing via command line",
                  "Detailed .md audit logs",
                  "Docker-based deployment",
                  "Full control over sanitization",
                ]}
              />
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="container mx-auto px-4 py-16 md:py-24 border-t border-border/50">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20 mb-6">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="text-sm text-success font-medium">
                Trust & Transparency
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold mb-4">
              You're Always in Control
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Files are processed ephemerally and deleted immediately after. You
              always see what was removed, with detailed logs available when you
              need them. No silent failures—clear, actionable error messages
              every time.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 text-left">
              <div className="p-4 rounded-xl bg-card border border-border">
                <Monitor className="w-5 h-5 text-primary mb-2" />
                <h4 className="font-medium text-sm mb-1">
                  Ephemeral Processing
                </h4>
                <p className="text-xs text-muted-foreground">
                  Files exist only during processing, then deleted.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border">
                <Eye className="w-5 h-5 text-primary mb-2" />
                <h4 className="font-medium text-sm mb-1">Full Visibility</h4>
                <p className="text-xs text-muted-foreground">
                  See exactly what metadata was removed.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border">
                <Shield className="w-5 h-5 text-primary mb-2" />
                <h4 className="font-medium text-sm mb-1">Isolated Engine</h4>
                <p className="text-xs text-muted-foreground">
                  Core engine runs in isolated Docker containers.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/50 py-8">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>© 2024 Phobos. Privacy-first. Zero data loss.</p>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Home;
