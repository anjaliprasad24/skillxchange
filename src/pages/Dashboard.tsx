import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, BookOpen, GraduationCap, Coins, TrendingUp, Calendar, Sparkles } from "lucide-react";

interface Txn { id: string; amount: number; type: string; reason: string; date: string; }
interface Enrollment {
  id: string;
  status: string;
  course_sessions: {
    id: string;
    start_date: string;
    mode: string;
    courses: { id: string; title: string; credit_cost: number; skills: { name: string } | null } | null;
  } | null;
}

export default function Dashboard() {
  const { profile, user } = useAuth();
  const [txns, setTxns] = useState<Txn[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [counts, setCounts] = useState({ teaching: 0, enrolled: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await fetch(`/api/users/${user.user_id}/dashboard`);
        if (!res.ok) throw new Error("Failed to fetch dashboard data");
        const data = await res.json();
        
        setTxns(data.txns);
        setEnrollments(data.enrollments);
        setCounts(data.counts);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [user]);

  return (
    <div className="container py-12 md:py-16 max-w-7xl">
      {/* Header */}
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-primary mb-3">Welcome back</p>
          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tighter leading-[0.95]">
            Hey, <span className="font-serif-italic font-normal text-primary">{profile?.name?.split(" ")[0] ?? "there"}</span>
          </h1>
        </div>
        <div className="flex gap-3">
          <Link to="/courses" className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-smooth shadow-pop">
            Browse courses <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/teach" className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-card border border-foreground/10 text-foreground text-sm font-semibold hover:bg-muted transition-smooth">
            Teach
          </Link>
        </div>
      </div>

      {/* Stats — colored blocks */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <Stat icon={Coins} label="Credit balance" value={profile?.credits ?? 0} bg="bg-primary text-primary-foreground" />
        <Stat icon={TrendingUp} label="Reputation" value={(profile?.reputation ?? 0).toFixed(1)} suffix="/5" bg="bg-mint" />
        <Stat icon={BookOpen} label="Enrolled in" value={counts.enrolled} bg="bg-sunny" />
        <Stat icon={GraduationCap} label="Teaching" value={counts.teaching} bg="bg-lilac" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* My enrollments */}
        <div className="lg:col-span-2 rounded-3xl bg-card p-7 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-2xl font-bold">My enrollments</h2>
            <Link to="/courses" className="text-sm text-muted-foreground hover:text-foreground transition-smooth font-mono">
              + Add another
            </Link>
          </div>

          {enrollments.length === 0 ? (
            <div className="rounded-2xl bg-background p-8 text-center">
              <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">You haven't joined any sessions yet.</p>
              <Link to="/courses" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                Find your first course <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {enrollments.map((e) => {
                const c = e.course_sessions?.courses;
                if (!c) return null;
                return (
                  <li key={e.id}>
                    <Link to={`/courses/${c.id}`} className="flex items-center justify-between py-4 group">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {c.skills?.name && (
                            <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-muted text-foreground/70">
                              {c.skills.name}
                            </span>
                          )}
                          <span className="text-[10px] font-mono uppercase tracking-widest text-mint">{e.status}</span>
                        </div>
                        <h3 className="font-semibold truncate group-hover:text-primary transition-smooth">{c.title}</h3>
                        {e.course_sessions?.start_date && (
                          <p className="text-xs text-muted-foreground font-mono mt-1 flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" />
                            {new Date(e.course_sessions.start_date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                            <span className="text-foreground/30">·</span>
                            {e.course_sessions.mode}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-smooth" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Transactions */}
        <div className="rounded-3xl bg-card p-7 shadow-card">
          <h2 className="font-display text-2xl font-bold mb-5">Activity</h2>
          {txns.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ul className="space-y-3">
              {txns.map((t) => (
                <li key={t.id} className="flex items-start justify-between text-sm pb-3 border-b border-border/50 last:border-0">
                  <div className="min-w-0 pr-3">
                    <p className="text-foreground truncate">{t.reason}</p>
                    <p className="text-xs text-muted-foreground font-mono">{t.date}</p>
                  </div>
                  <span className={`font-mono font-bold shrink-0 ${t.type === "Credit" ? "text-mint" : "text-primary"}`}>
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

function Stat({ icon: Icon, label, value, suffix, bg }: { icon: any; label: string; value: any; suffix?: string; bg: string }) {
  return (
    <div className={`rounded-2xl ${bg} p-6 shadow-card`}>
      <div className="flex items-center justify-between mb-4">
        <Icon className="w-5 h-5" />
        <span className="text-[10px] uppercase tracking-widest opacity-80">{label}</span>
      </div>
      <div className="font-display text-4xl md:text-5xl font-bold">
        {value}{suffix && <span className="text-base opacity-70">{suffix}</span>}
      </div>
    </div>
  );
}
