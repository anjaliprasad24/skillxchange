import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, GraduationCap, Coins, TrendingUp } from "lucide-react";

interface Txn { id: string; amount: number; type: string; reason: string; date: string; }

export default function Dashboard() {
  const { profile, user } = useAuth();
  const [txns, setTxns] = useState<Txn[]>([]);
  const [counts, setCounts] = useState({ teaching: 0, enrolled: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: t }, { count: teachCount }, { count: enrollCount }] = await Promise.all([
        supabase.from("credit_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(8),
        supabase.from("course_sessions").select("id", { count: "exact", head: true }).eq("mentor_id", user.id),
        supabase.from("enrollments").select("id", { count: "exact", head: true }).eq("student_id", user.id),
      ]);
      if (t) setTxns(t as Txn[]);
      setCounts({ teaching: teachCount ?? 0, enrolled: enrollCount ?? 0 });
    })();
  }, [user]);

  return (
    <div className="container py-12 max-w-6xl">
      <div className="mb-12">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">
          Welcome back
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
          Hey, {profile?.name?.split(" ")[0] ?? "there"} 👋
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-lg overflow-hidden mb-12 card-elevated">
        <Stat icon={Coins} label="Credit balance" value={profile?.credits ?? 0} accent />
        <Stat icon={TrendingUp} label="Reputation" value={(profile?.reputation ?? 0).toFixed(1)} suffix="/5" />
        <Stat icon={BookOpen} label="Enrolled in" value={counts.enrolled} />
        <Stat icon={GraduationCap} label="Teaching" value={counts.teaching} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="font-display text-xl font-semibold mb-4">Pick up where you left off</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <ActionCard to="/courses" title="Browse courses" desc="Find a peer to learn from" />
              <ActionCard to="/teach" title="Create a course" desc="Earn credits teaching" />
              <ActionCard to="/profile" title="Set availability" desc="Tell people when you're free" />
              <ActionCard to="/courses" title="Find by skill" desc="Python, design, music…" />
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="font-display text-xl font-semibold mb-4">Recent activity</h2>
          {txns.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ul className="space-y-3">
              {txns.map((t) => (
                <li key={t.id} className="flex items-start justify-between text-sm pb-3 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-foreground">{t.reason}</p>
                    <p className="text-xs text-muted-foreground font-mono">{t.date}</p>
                  </div>
                  <span className={`font-mono font-semibold ${t.type === "Credit" ? "text-primary" : "text-muted-foreground"}`}>
                    {t.type === "Credit" ? "+" : "−"}{t.amount}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, suffix, accent }: any) {
  return (
    <div className={`bg-card p-6 ${accent ? "ring-1 ring-inset ring-primary/30" : ""}`}>
      <div className="flex items-center justify-between mb-3">
        <Icon className={`w-4 h-4 ${accent ? "text-primary" : "text-muted-foreground"}`} />
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <div className={`font-mono text-3xl font-bold ${accent ? "text-primary" : ""}`}>
        {value}{suffix && <span className="text-base text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

function ActionCard({ to, title, desc }: { to: string; title: string; desc: string }) {
  return (
    <Link to={to} className="group rounded-md border border-border bg-background/50 p-4 transition-smooth hover:border-primary/50 hover:bg-muted/30">
      <div className="flex items-start justify-between mb-1">
        <h3 className="font-semibold">{title}</h3>
        <ArrowRight className="w-4 h-4 text-muted-foreground transition-smooth group-hover:text-primary group-hover:translate-x-0.5" />
      </div>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </Link>
  );
}
