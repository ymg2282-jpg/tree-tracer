import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface Props {
  children: React.ReactNode;
  requireVerified?: boolean;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireVerified = false, requireAdmin = false }: Props) {
  const { user, profile, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (requireAdmin && !isAdmin) return <Navigate to="/map" replace />;

  if (requireVerified && profile && !profile.is_verified) {
    return <Navigate to="/pending" replace />;
  }

  return <>{children}</>;
}
