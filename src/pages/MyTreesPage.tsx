import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TreePine, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Tree {
  id: string;
  photo_url: string;
  species: string;
  health: string;
  created_at: string;
  latitude: number;
  longitude: number;
}

export default function MyTreesPage() {
  const { user } = useAuth();
  const [trees, setTrees] = useState<Tree[]>([]);
  const [search, setSearch] = useState("");
  const [healthFilter, setHealthFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase.from("trees").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (data) setTrees(data);
    };
    fetch();
  }, [user]);

  const filtered = trees.filter((t) => {
    const matchesSearch = !search || t.species.toLowerCase().includes(search.toLowerCase());
    const matchesHealth = healthFilter === "all" || t.health === healthFilter;
    return matchesSearch && matchesHealth;
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="mx-auto max-w-md p-4 space-y-4">
        <h1 className="font-display text-2xl font-bold">My Trees</h1>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search species..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={healthFilter} onValueChange={setHealthFilter}>
            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="healthy">Healthy</SelectItem>
              <SelectItem value="damaged">Damaged</SelectItem>
              <SelectItem value="diseased">Diseased</SelectItem>
              <SelectItem value="dead">Dead</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-muted-foreground">
            <TreePine className="mb-3 h-12 w-12" />
            <p className="text-sm">No trees found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((tree) => (
              <Card key={tree.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/tree/${tree.id}`)}>
                <CardContent className="flex gap-3 p-3">
                  <img src={tree.photo_url} alt={tree.species} className="h-20 w-20 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold truncate">{tree.species || "Unknown"}</h3>
                    <span className="inline-block mt-1 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground capitalize">{tree.health}</span>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(tree.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
