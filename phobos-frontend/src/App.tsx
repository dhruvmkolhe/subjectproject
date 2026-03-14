import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { initializeGoogleIdentity } from "@/lib/googleDrive";
import Home from "./pages/Home";
import Documentation from "./pages/Documentation";
import UploadFiles from "./pages/UploadFiles";
import CleanedFiles from "./pages/CleanedFiles";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Initialize Google Drive when component mounts
  useEffect(() => {
    const initGoogleDrive = async () => {
      try {
        const clientId = import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID;
        if (clientId && clientId !== "your_google_drive_client_id_here") {
          await initializeGoogleIdentity(clientId);
        }
      } catch (error) {
        console.warn("Google Drive initialization failed:", error);
      }
    };

    initGoogleDrive();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-6 h-6 rounded bg-primary"></div>
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home onLogin={() => {}} user={user} />} />
            <Route
              path="/docs"
              element={
                <Documentation
                  isAuthenticated={!!user}
                  onLogout={handleLogout}
                  user={user}
                />
              }
            />
            <Route
              path="/upload"
              element={
                <UploadFiles
                  isAuthenticated={!!user}
                  onLogout={handleLogout}
                  user={user}
                />
              }
            />
            <Route
              path="/cleaned"
              element={
                <CleanedFiles
                  isAuthenticated={!!user}
                  onLogout={handleLogout}
                  user={user}
                />
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
