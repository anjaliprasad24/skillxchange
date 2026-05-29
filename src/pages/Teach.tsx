import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, Calendar, Users, Coins, ArrowRight, GraduationCap, Sparkles } from "lucide-react";

interface MyCourse {
  id: string;
  title: string;
  credit_cost: number;
  skills: { name: string } | null;
  course_sessions: { id: string }[];
}

interface MySession {
  id: string;
  start_date: string;
  mode: string;
  slots: number;
  courses: { id: string; title: string; credit_cost: number } | null;
  enrollments: { id: string; status: string }[];
}

export default function Teach() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<MyCourse[]>([]);
  const [sessions, setSessions] = useState<MySession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await fetch(`/api/users/${user.user_id}/teaching`);
        if (!res.ok) throw new Error("Failed to fetch teaching data");
        const data = await res.json();
        
        setCourses(data.courses);
        setSessions(data.sessions);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const totalEnrollments = sessions.reduce((sum, s) => sum + s.enrollments.length, 0);
  const completedCount = sessions.reduce(
    (sum, s) => sum + s.enrollments.filter((e) => e.status === "Completed").length,
    0
  );

  return (
    <div className="container py-12 md:py-16 max-w-7xl">
      {/* Header */}
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-primary mb-3">Teach</p>
          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tighter leading-[0.95]">
            Your <span className="font-serif-italic font-normal text-primary">teaching</span> hub
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl">
            Create a course, schedule a session, mark it complete — your wallet refills automatically.
          </p>
        </div>
        <Button asChild size="lg" className="rounded-full h-14 px-7 shadow-pop">
          <Link to="/teach/new"><Plus className="w-5 h-5 mr-2" /> New course</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
        <div className="rounded-2xl bg-mint p-6 shadow-card">
          <BookOpen className="w-5 h-5 mb-3" />
          <div className="font-display text-4xl font-bold">{courses.length}</div>
          <div className="text-sm text-foreground/70">Courses created</div>
        </div>
        <div className="rounded-2xl bg-sunny p-6 shadow-card">
          <Users className="w-5 h-5 mb-3" />
          <div className="font-display text-4xl font-bold">{totalEnrollments}</div>
          <div className="text-sm text-foreground/70">Learners enrolled</div>
        </div>
        <div className="rounded-2xl bg-primary text-primary-foreground p-6 shadow-card">
          <GraduationCap className="w-5 h-5 mb-3" />
          <div className="font-display text-4xl font-bold">{completedCount}</div>
          <div className="text-sm opacity-80">Sessions completed</div>
        </div>
      </div>

      {/* My courses */}
      <section className="mb-12">
        <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-6">My courses</h2>
        {loading ? (
          <div className="rounded-2xl bg-card p-8 animate-pulse h-32" />
        ) : courses.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="You haven't created any courses yet"
            body="Pick a skill you've already learned and offer a 1:1 session. Your first earner is one click away."
            cta={<Button asChild className="rounded-full"><Link to="/teach/new"><Plus className="w-4 h-4 mr-2" /> Create your first course</Link></Button>}
          />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((c) => (
              <div key={c.id} className="rounded-2xl bg-card p-6 shadow-card flex flex-col">
                {c.skills?.name && (
                  <span className="inline-block w-fit text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-full bg-muted text-foreground/70 mb-3">
                    {c.skills.name}
                  </span>
                )}
                <h3 className="font-display text-xl font-bold mb-3 leading-tight">{c.title}</h3>
                <div className="mt-auto flex items-center justify-between text-sm pt-4 border-t border-border">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Coins className="w-4 h-4" /> {c.credit_cost} cr
                  </span>
                  <span className="text-muted-foreground font-mono text-xs">
                    {c.course_sessions.length} {c.course_sessions.length === 1 ? "session" : "sessions"}
                  </span>
                </div>
                <Button asChild variant="outline" size="sm" className="rounded-full mt-4">
                  <Link to={`/teach/course/${c.id}`}>Manage <ArrowRight className="w-4 h-4 ml-1" /></Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sessions I'm teaching */}
      <section>
        <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-6">Sessions I'm teaching</h2>
        {loading ? (
          <div className="rounded-2xl bg-card p-8 animate-pulse h-32" />
        ) : sessions.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No sessions scheduled"
            body="Once you create a course, schedule a session for learners to enroll in."
          />
        ) : (
          <ul className="space-y-3">
            {sessions.map((s) => {
              const active = s.enrollments.filter((e) => e.status === "Active").length;
              const done = s.enrollments.filter((e) => e.status === "Completed").length;
              return (
                <li key={s.id} className="rounded-2xl bg-card p-5 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-display text-lg font-bold leading-tight">{s.courses?.title}</h3>
                    <p className="text-xs text-muted-foreground font-mono mt-1 flex items-center gap-3">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(s.start_date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>
                      <span>·</span>
                      <span>{s.mode}</span>
                      <span>·</span>
                      <span>{active} active · {done} completed · {s.slots} slots</span>
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm" className="rounded-full">
                    <Link to={`/teach/course/${s.courses?.id}`}>Open <ArrowRight className="w-4 h-4 ml-1" /></Link>
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function EmptyState({ icon: Icon, title, body, cta }: any) {
  return (
    <div className="rounded-3xl bg-card p-10 text-center shadow-card">
      <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="font-display text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md mx-auto mb-5">{body}</p>
      {cta}
      {!cta && <Sparkles className="w-4 h-4 text-primary mx-auto" />}
    </div>
  );
}
