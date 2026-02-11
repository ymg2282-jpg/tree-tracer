import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Camera, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProfileSetupPage() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [location, setLocation] = useState("");
  const [selfie, setSelfie] = useState<File | null>(null);
  const [idCard, setIdCard] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [idCardPreview, setIdCardPreview] = useState<string | null>(null);

  const handleFileChange = (file: File | null, type: "selfie" | "idCard") => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === "selfie") {
        setSelfie(file);
        setSelfiePreview(reader.result as string);
      } else {
        setIdCard(file);
        setIdCardPreview(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selfie || !idCard) {
      toast({ title: "Missing files", description: "Please upload both your selfie and ID card.", variant: "destructive" });
      return;
    }
    setLoading(true);

    try {
      // Upload selfie
      const selfieExt = selfie.name.split(".").pop();
      const selfiePath = `${user.id}/selfie.${selfieExt}`;
      const { error: selfieError } = await supabase.storage.from("selfies").upload(selfiePath, selfie, { upsert: true });
      if (selfieError) throw selfieError;
      const { data: selfieUrl } = supabase.storage.from("selfies").getPublicUrl(selfiePath);

      // Upload ID card
      const idExt = idCard.name.split(".").pop();
      const idPath = `${user.id}/id-card.${idExt}`;
      const { error: idError } = await supabase.storage.from("id-cards").upload(idPath, idCard, { upsert: true });
      if (idError) throw idError;
      const { data: idUrl } = supabase.storage.from("id-cards").getPublicUrl(idPath);

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          date_of_birth: dob,
          living_location: location,
          face_photo_url: selfieUrl.publicUrl,
          id_card_photo_url: idUrl.publicUrl,
        })
        .eq("user_id", user.id);
      if (profileError) throw profileError;

      // Create verification request
      const { error: verifyError } = await supabase
        .from("verification_requests")
        .insert({ user_id: user.id });
      if (verifyError) throw verifyError;

      await refreshProfile();
      toast({ title: "Profile submitted!", description: "Your verification is pending admin review." });
      navigate("/pending");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-display text-xl">Complete Your Profile</CardTitle>
          <CardDescription>Upload your photo and ID for verification</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Your full name" />
            </div>
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Living Location</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} required placeholder="City, Country" />
            </div>

            {/* Selfie upload */}
            <div className="space-y-2">
              <Label>Your Face Photo (Selfie)</Label>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-input p-6 hover:border-primary transition-colors">
                {selfiePreview ? (
                  <img src={selfiePreview} alt="Selfie preview" className="h-32 w-32 rounded-full object-cover" />
                ) : (
                  <>
                    <Camera className="mb-2 h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Tap to take/upload selfie</span>
                  </>
                )}
                <input type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => handleFileChange(e.target.files?.[0] || null, "selfie")} />
              </label>
            </div>

            {/* ID Card upload */}
            <div className="space-y-2">
              <Label>Government ID Card</Label>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-input p-6 hover:border-primary transition-colors">
                {idCardPreview ? (
                  <img src={idCardPreview} alt="ID preview" className="h-32 w-full rounded-lg object-contain" />
                ) : (
                  <>
                    <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Upload photo of your ID card</span>
                  </>
                )}
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileChange(e.target.files?.[0] || null, "idCard")} />
              </label>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit for Verification
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
