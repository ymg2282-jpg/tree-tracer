import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { TreePine } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const treeIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

interface Tree {
  id: string;
  photo_url: string;
  latitude: number;
  longitude: number;
  species: string;
  health: string;
  user_id: string;
}

function LocationMarker() {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const map = useMap();

  useEffect(() => {
    map.locate({ setView: true, maxZoom: 13 });
    map.on("locationfound", (e) => setPosition(e.latlng));
  }, [map]);

  return position ? (
    <Marker position={position}>
      <Popup>You are here</Popup>
    </Marker>
  ) : null;
}

export default function MapPage() {
  const [trees, setTrees] = useState<Tree[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrees = async () => {
      const { data } = await supabase.from("trees").select("id, photo_url, latitude, longitude, species, health, user_id");
      if (data) setTrees(data);
    };
    fetchTrees();
  }, []);

  return (
    <div className="flex h-screen flex-col">
      <div className="flex-1 relative">
        <MapContainer center={[20, 0]} zoom={3} className="h-full w-full z-0">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker />
          {trees.map((tree) => (
            <Marker key={tree.id} position={[tree.latitude, tree.longitude]} icon={treeIcon}>
              <Popup>
                <Card className="border-0 shadow-none p-0 min-w-[180px]">
                  <div className="space-y-2">
                    <img src={tree.photo_url} alt={tree.species} className="h-24 w-full rounded-md object-cover" />
                    <div className="flex items-center gap-1">
                      <TreePine className="h-3.5 w-3.5 text-primary" />
                      <span className="font-display font-semibold text-sm">{tree.species || "Unknown species"}</span>
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">{tree.health}</span>
                    <button
                      onClick={() => navigate(`/tree/${tree.id}`)}
                      className="block w-full text-center text-xs text-primary underline-offset-2 hover:underline mt-1"
                    >
                      View Details →
                    </button>
                  </div>
                </Card>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      <BottomNav />
    </div>
  );
}
