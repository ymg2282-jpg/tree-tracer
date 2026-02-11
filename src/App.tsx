import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AuthPage from "./pages/AuthPage";
import ProfileSetupPage from "./pages/ProfileSetupPage";
import PendingPage from "./pages/PendingPage";
import MapPage from "./pages/MapPage";
import AddTreePage from "./pages/AddTreePage";
import MyTreesPage from "./pages/MyTreesPage";
import TreeDetailPage from "./pages/TreeDetailPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/map" replace />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/setup" element={<ProtectedRoute><ProfileSetupPage /></ProtectedRoute>} />
            <Route path="/pending" element={<ProtectedRoute><PendingPage /></ProtectedRoute>} />
            <Route path="/map" element={<ProtectedRoute requireVerified><MapPage /></ProtectedRoute>} />
            <Route path="/add-tree" element={<ProtectedRoute requireVerified><AddTreePage /></ProtectedRoute>} />
            <Route path="/my-trees" element={<ProtectedRoute requireVerified><MyTreesPage /></ProtectedRoute>} />
            <Route path="/tree/:id" element={<ProtectedRoute requireVerified><TreeDetailPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
