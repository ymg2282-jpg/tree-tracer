import { useAuth } from "@/contexts/AuthContext";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, MapPin, Calendar, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ProfilePage() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="mx-auto max-w-md p-4 space-y-4">
        <h1 className="font-display text-2xl font-bold">Profile</h1>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile?.face_photo_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-display text-lg">
                {profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="font-display font-bold text-lg truncate">{profile?.full_name || "Unnamed"}</h2>
              <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 mt-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  <Shield className="h-3 w-3" /> Admin
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile?.date_of_birth && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{new Date(profile.date_of_birth).toLocaleDateString()}</span>
              </div>
            )}
            {profile?.living_location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{profile.living_location}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {isAdmin && (
          <Button variant="outline" className="w-full" onClick={() => navigate("/admin")}>
            <Shield className="mr-2 h-4 w-4" />
            Admin Panel
          </Button>
        )}

        <Button variant="destructive" className="w-full" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
      <BottomNav />
    </div>
  );
}
