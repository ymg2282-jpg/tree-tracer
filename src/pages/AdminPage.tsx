import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Check, X, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface VerificationRequest {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  profile?: {
    full_name: string;
    face_photo_url: string | null;
    id_card_photo_url: string | null;
    date_of_birth: string | null;
    living_location: string;
  };
}

interface VerifiedUser {
  user_id: string;
  full_name: string;
  is_verified: boolean;
}

export default function AdminPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [verifiedUsers, setVerifiedUsers] = useState<VerifiedUser[]>([]);
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchRequests = async () => {
    const { data } = await supabase
      .from("verification_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (data) {
      const enriched = await Promise.all(
        data.map(async (req) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, face_photo_url, id_card_photo_url, date_of_birth, living_location")
            .eq("user_id", req.user_id)
            .single();
          return { ...req, profile: profile || undefined } as VerificationRequest;
        })
      );
      setRequests(enriched);
    }
  };

  const fetchVerified = async () => {
    const { data } = await supabase.from("profiles").select("user_id, full_name, is_verified").eq("is_verified", true);
    if (data) setVerifiedUsers(data);
  };

  useEffect(() => {
    fetchRequests();
    fetchVerified();
  }, []);

  const handleApprove = async (req: VerificationRequest) => {
    setActionLoading(req.id);
    await supabase.from("verification_requests").update({ status: "approved" }).eq("id", req.id);
    await supabase.from("profiles").update({ is_verified: true }).eq("user_id", req.user_id);
    toast({ title: "Approved", description: `${req.profile?.full_name} has been verified.` });
    fetchRequests();
    fetchVerified();
    setActionLoading(null);
  };

  const handleReject = async (req: VerificationRequest) => {
    setActionLoading(req.id);
    await supabase.from("verification_requests").update({ status: "rejected", rejection_reason: rejectionReasons[req.id] || "" }).eq("id", req.id);
    toast({ title: "Rejected", description: `${req.profile?.full_name} has been rejected.` });
    fetchRequests();
    setActionLoading(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl p-4 space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-display text-2xl font-bold">Admin Panel</h1>
        </div>

        <Tabs defaultValue="pending">
          <TabsList className="w-full">
            <TabsTrigger value="pending" className="flex-1">Pending ({requests.length})</TabsTrigger>
            <TabsTrigger value="verified" className="flex-1">Verified ({verifiedUsers.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4 mt-4">
            {requests.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No pending requests</p>
            ) : (
              requests.map((req) => (
                <Card key={req.id}>
                  <CardHeader>
                    <CardTitle className="font-display text-base">{req.profile?.full_name || "Unknown"}</CardTitle>
                    <p className="text-xs text-muted-foreground">{new Date(req.created_at).toLocaleDateString()}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Selfie</p>
                        {req.profile?.face_photo_url ? (
                          <img src={req.profile.face_photo_url} alt="Selfie" className="h-40 w-full rounded-lg object-cover" />
                        ) : (
                          <div className="h-40 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">No photo</div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">ID Card</p>
                        {req.profile?.id_card_photo_url ? (
                          <img src={req.profile.id_card_photo_url} alt="ID" className="h-40 w-full rounded-lg object-contain bg-muted" />
                        ) : (
                          <div className="h-40 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">No photo</div>
                        )}
                      </div>
                    </div>
                    <Textarea
                      placeholder="Rejection reason (optional)"
                      value={rejectionReasons[req.id] || ""}
                      onChange={(e) => setRejectionReasons({ ...rejectionReasons, [req.id]: e.target.value })}
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button className="flex-1" onClick={() => handleApprove(req)} disabled={actionLoading === req.id}>
                        {actionLoading === req.id ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
                        Approve
                      </Button>
                      <Button variant="destructive" className="flex-1" onClick={() => handleReject(req)} disabled={actionLoading === req.id}>
                        <X className="mr-1 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="verified" className="space-y-3 mt-4">
            {verifiedUsers.map((u) => (
              <Card key={u.user_id}>
                <CardContent className="flex items-center justify-between p-4">
                  <span className="font-medium">{u.full_name}</span>
                  <span className="text-xs text-primary">✓ Verified</span>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
