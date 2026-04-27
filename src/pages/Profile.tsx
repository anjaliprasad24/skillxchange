import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Profile() {
  const { profile, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!profile) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ name, phone }).eq("id", profile.id);
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Profile updated"); refreshProfile(); }
  };

  return (
    <div className="container py-12 max-w-2xl">
      <h1 className="font-display text-4xl font-bold tracking-tight mb-2">Your profile</h1>
      <p className="text-muted-foreground mb-10">Manage how you appear to other learners.</p>

      <div className="rounded-lg border border-border bg-card p-8 space-y-6">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={profile?.email ?? ""} disabled />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" value={phone ?? ""} onChange={(e) => setPhone(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <Stat label="Credits" value={profile?.credits ?? 0} mono />
          <Stat label="Reputation" value={(profile?.reputation ?? 0).toFixed(1) + " / 5"} />
        </div>

        <Button onClick={save} disabled={busy} className="w-full">
          {busy ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value, mono }: { label: string; value: any; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-bold ${mono ? "font-mono text-primary" : ""}`}>{value}</p>
    </div>
  );
}
