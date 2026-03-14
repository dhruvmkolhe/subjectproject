import { Link, useLocation, useNavigate } from "react-router-dom";
import { User as FirebaseUser } from "firebase/auth";
import {
  Shield,
  LogOut,
  FileText,
  Upload,
  FolderOpen,
  Activity,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  isAuthenticated?: boolean;
  onLogout?: () => void;
  user?: FirebaseUser | null;
}

const Header = ({ isAuthenticated = false, onLogout, user }: HeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await onLogout?.();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xl font-semibold">Phobos</span>
        </Link>

        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/docs"
              className={`nav-link flex items-center gap-2 text-sm ${
                location.pathname === "/docs" ? "nav-link-active" : ""
              }`}
            >
              <FileText className="w-4 h-4" />
              Documentation
            </Link>
            <Link
              to="/upload"
              className={`nav-link flex items-center gap-2 text-sm ${
                location.pathname === "/upload" ? "nav-link-active" : ""
              }`}
            >
              <Upload className="w-4 h-4" />
              Upload File
            </Link>
            <Link
              to="/cleaned"
              className={`nav-link flex items-center gap-2 text-sm ${
                location.pathname === "/cleaned" ? "nav-link-active" : ""
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              Cleaned Files
            </Link>
            <button className="nav-link flex items-center gap-2 text-sm opacity-50 cursor-not-allowed">
              <Activity className="w-4 h-4" />
              Backup Status
            </button>
          </nav>
        )}

        <div className="flex items-center gap-3">
          {isAuthenticated && user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground hover:text-foreground"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "User"}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-xs font-semibold">
                        {user.displayName?.[0]?.toUpperCase() || "U"}
                      </span>
                    </div>
                  )}
                  <span className="hidden sm:inline text-sm">
                    {user.displayName}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled className="font-medium">
                  {user.email}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
