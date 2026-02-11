import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TreePine, MapPin, Ruler, Heart, User, Calendar } from "lucide-react";
import "leaflet/dist/leaflet.css";

interface TreeDetail {
  id: string;
  photo_url: string;
  latitude: number;
  longitude: number;
  species: string;
  height_meters: number | null;
  health: string;
  notes: string;
  created_at: string;
  user_id: string;
}

interface Tag {
  id: string;
  tag: string;
}

export default function TreeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tree, setTree] = useState<TreeDetail | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [creatorName, setCreatorName] = useState("");

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      const { data: treeData } = await supabase.from("trees").select("*").eq("id", id).single();
      if (treeData) {
        setTree(treeData as TreeDetail);
        const { data: tagData } = await supabase.from("tree_tags").select("*").eq("tree_id", id);
        if (tagData) setTags(tagData);
        const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", treeData.user_id).single();
        if (profile) setCreatorName(profile.full_name);
      }
    };
    fetch();
  }, [id]);

  if (!tree) return <div className="flex min-h-screen items-center justify-center"><TreePine className="h-8 w-8 animate-pulse text-primary" /></div>;

  const healthEmoji: Record<string, string> = { healthy: "🌿", damaged: "⚠️", diseased: "🦠", dead: "💀" };

  return (
    <div className="min-h-screen bg-background">
      {/* Header image */}
      <div className="relative">
        <img src={tree.photo_url} alt={tree.species} className="h-64 w-full object-cover" />
        <Button variant="ghost" size="icon" className="absolute left-3 top-3 bg-background/80 backdrop-blur-sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="mx-auto max-w-md space-y-4 p-4">
        <h1 className="font-display text-2xl font-bold">{tree.species || "Unknown Species"}</h1>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
            <Heart className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Health</p>
              <p className="text-sm font-medium capitalize">{healthEmoji[tree.health]} {tree.health}</p>
            </div>
          </div>
          {tree.height_meters && (
            <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
              <Ruler className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Height</p>
                <p className="text-sm font-medium">{tree.height_meters}m</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
            <User className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Added by</p>
              <p className="text-sm font-medium truncate">{creatorName || "Unknown"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
            <Calendar className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="text-sm font-medium">{new Date(tree.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {tree.notes && (
          <div>
            <h2 className="font-display font-semibold mb-1">Notes</h2>
            <p className="text-sm text-muted-foreground">{tree.notes}</p>
          </div>
        )}

        {tags.length > 0 && (
          <div>
            <h2 className="font-display font-semibold mb-1">Tags</h2>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span key={t.id} className="rounded-full bg-accent px-2.5 py-0.5 text-xs text-accent-foreground">{t.tag}</span>
              ))}
            </div>
          </div>
        )}

        {/* Mini map */}
        <div>
          <h2 className="font-display font-semibold mb-1 flex items-center gap-1">
            <MapPin className="h-4 w-4" /> Location
          </h2>
          <div className="h-48 rounded-lg overflow-hidden border">
            <MapContainer center={[tree.latitude, tree.longitude]} zoom={15} className="h-full w-full" scrollWheelZoom={false} dragging={false}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[tree.latitude, tree.longitude]} />
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
