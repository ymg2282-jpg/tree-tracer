import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, MapPin, Loader2, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AddTreePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [species, setSpecies] = useState("");
  const [height, setHeight] = useState("");
  const [health, setHealth] = useState("healthy");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [gettingLocation, setGettingLocation] = useState(false);

  const handlePhotoChange = (file: File | null) => {
    if (!file) return;
    setPhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Auto-capture GPS
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setGettingLocation(false);
      },
      () => {
        toast({ title: "Location error", description: "Could not get GPS location. Please enable location services.", variant: "destructive" });
        setGettingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !photo || latitude === null || longitude === null) {
      toast({ title: "Missing data", description: "Please take a photo and ensure GPS is captured.", variant: "destructive" });
      return;
    }
    setLoading(true);

    try {
      const ext = photo.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("tree-photos").upload(fileName, photo);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("tree-photos").getPublicUrl(fileName);

      const { data: tree, error: treeError } = await supabase
        .from("trees")
        .insert({
          user_id: user.id,
          photo_url: urlData.publicUrl,
          latitude,
          longitude,
          species,
          height_meters: height ? parseFloat(height) : null,
          health,
          notes,
        })
        .select()
        .single();
      if (treeError) throw treeError;

      if (tags.length > 0 && tree) {
        const tagInserts = tags.map((tag) => ({ tree_id: tree.id, tag }));
        await supabase.from("tree_tags").insert(tagInserts);
      }

      toast({ title: "Tree saved!", description: `${species || "Tree"} has been recorded.` });
      navigate("/my-trees");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="mx-auto max-w-md p-4">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">Add a Tree</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Photo capture */}
              <div className="space-y-2">
                <Label>Tree Photo</Label>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-input p-6 hover:border-primary transition-colors">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Tree" className="h-48 w-full rounded-lg object-cover" />
                  ) : (
                    <>
                      <Camera className="mb-2 h-10 w-10 text-primary" />
                      <span className="text-sm text-muted-foreground">Take a photo of the tree</span>
                    </>
                  )}
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handlePhotoChange(e.target.files?.[0] || null)} />
                </label>
              </div>

              {/* GPS */}
              <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm">
                <MapPin className="h-4 w-4 text-primary" />
                {gettingLocation ? (
                  <span className="text-muted-foreground">Getting location...</span>
                ) : latitude !== null ? (
                  <span className="text-foreground">{latitude.toFixed(5)}, {longitude?.toFixed(5)}</span>
                ) : (
                  <span className="text-muted-foreground">Location will be captured with photo</span>
                )}
              </div>

              <div className="space-y-2">
                <Label>Species Name</Label>
                <Input value={species} onChange={(e) => setSpecies(e.target.value)} placeholder="e.g. Oak, Pine, Maple" />
              </div>

              <div className="space-y-2">
                <Label>Estimated Height (meters)</Label>
                <Input type="number" step="0.1" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="e.g. 12.5" />
              </div>

              <div className="space-y-2">
                <Label>Health Condition</Label>
                <Select value={health} onValueChange={setHealth}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="healthy">🌿 Healthy</SelectItem>
                    <SelectItem value="damaged">⚠️ Damaged</SelectItem>
                    <SelectItem value="diseased">🦠 Diseased</SelectItem>
                    <SelectItem value="dead">💀 Dead</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any observations..." rows={3} />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Add a tag" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} />
                  <Button type="button" variant="outline" size="icon" onClick={addTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tags.map((t) => (
                      <span key={t} className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs text-accent-foreground">
                        {t}
                        <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))}><X className="h-3 w-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Tree
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <BottomNav />
    </div>
  );
}
