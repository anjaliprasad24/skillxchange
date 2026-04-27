import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Calendar, Users, CheckCircle2, Plus } from "lucide-react";

interface EventRow {
  id: string;
  name: string;
  description: string | null;
  mode: string;
  start_date: string;
  end_date: string;
}
interface Team {
  id: string;
  team_name: string;
  member_ids: string[];
  registered: boolean;
}

export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [ev, setEv] = useState<EventRow | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!id) return;
    const [{ data: e }, { data: ts }, { data: tm }, { data: regs }] = await Promise.all([
      supabase.from("events").select("*").eq("id", id).maybeSingle(),
      supabase.from("teams").select("*").eq("event_id", id),
      supabase.from("team_members").select("team_id, user_id"),
      supabase.from("event_registrations").select("team_id"),
    ]);
    setEv(e as any);

    const memberMap = new Map<string, string[]>();
    tm?.forEach((m) => {
      const arr = memberMap.get(m.team_id) ?? [];
      arr.push(m.user_id);
      memberMap.set(m.team_id, arr);
    });
    const regSet = new Set(regs?.map((r) => r.team_id) ?? []);
    setTeams(
      (ts ?? []).map((t) => ({
        id: t.id,
        team_name: t.team_name,
        member_ids: memberMap.get(t.id) ?? [],
        registered: regSet.has(t.id),
      })),
    );
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const createTeam = async () => {
    if (!newTeamName.trim() || !id) return;
    setBusy(true);
    const { error } = await supabase.rpc("create_team_and_join", {
      _event_id: id,
      _team_name: newTeamName.trim(),
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Team created. You're in!");
    setNewTeamName("");
    load();
  };

  const joinTeam = async (teamId: string) => {
    if (!user) return;
    const { error } = await supabase.from("team_members").insert({ team_id: teamId, user_id: user.id });
    if (error) return toast.error(error.message);
    toast.success("Joined team");
    load();
  };

  const leaveTeam = async (teamId: string) => {
    if (!user) return;
    const { error } = await supabase.from("team_members").delete().eq("team_id", teamId).eq("user_id", user.id);
    if (error) return toast.error(error.message);
    toast.success("Left team");
    load();
  };

  const registerTeam = async (teamId: string) => {
    const { error } = await supabase.rpc("register_team_for_event", { _team_id: teamId });
    if (error) return toast.error(error.message);
    toast.success("Team registered for the event!");
    load();
  };

  if (loading) return <div className="container py-12">Loading…</div>;
  if (!ev) return <div className="container py-12">Event not found.</div>;

  return (
    <div className="container py-12 max-w-5xl">
      <Link to="/events" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-smooth">
        <ArrowLeft className="w-4 h-4" /> All events
      </Link>

      <div className="rounded-3xl bg-mint p-8 md:p-12 mb-10 shadow-card">
        <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full bg-foreground/10 inline-block mb-5">
          {ev.mode}
        </span>
        <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tighter leading-[0.95] mb-4">
          {ev.name}
        </h1>
        <p className="text-foreground/80 text-lg max-w-2xl mb-6">{ev.description}</p>
        <div className="flex items-center gap-2 text-sm font-mono">
          <Calendar className="w-4 h-4" />
          {new Date(ev.start_date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
          {ev.end_date !== ev.start_date &&
            ` – ${new Date(ev.end_date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}`}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <h2 className="font-display text-2xl font-bold mb-5">Teams ({teams.length})</h2>
          {teams.length === 0 ? (
            <div className="rounded-2xl bg-card p-8 text-center">
              <Users className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No teams yet. Be the first to start one!</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {teams.map((t) => {
                const mine = user ? t.member_ids.includes(user.id) : false;
                return (
                  <li key={t.id} className="rounded-2xl bg-card p-5 shadow-card flex items-center justify-between flex-wrap gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-display text-xl font-bold">{t.team_name}</h3>
                        {t.registered && (
                          <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-mint text-foreground flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Registered
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        {t.member_ids.length} member{t.member_ids.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {mine ? (
                        <>
                          {!t.registered && (
                            <Button size="sm" onClick={() => registerTeam(t.id)}>Register team</Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => leaveTeam(t.id)}>Leave</Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => joinTeam(t.id)}>Join</Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div>
          <div className="rounded-2xl bg-sunny p-6 shadow-card sticky top-24">
            <h3 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5" /> Start a team
            </h3>
            <Label htmlFor="team" className="text-xs uppercase tracking-wider opacity-80">Team name</Label>
            <Input
              id="team"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="The Compilers"
              className="mt-1 mb-4 bg-background/60 border-foreground/20"
            />
            <Button onClick={createTeam} disabled={busy || !newTeamName.trim()} className="w-full">
              {busy ? "Creating…" : "Create team"}
            </Button>
            <p className="text-xs text-foreground/70 mt-3">You'll automatically join as the first member.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
