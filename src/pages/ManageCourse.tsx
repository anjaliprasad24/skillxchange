import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Calendar, Coins, Plus, Loader2, CheckCircle2, Trash2, Users } from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string;
  credit_cost: number;
  created_by: string;
  skills: { name: string } | null;
}

interface Session {
  id: string;
  start_date: string;
  end_date: string;
  mode: string;
  slots: number;
  enrollments: {
    id: string;
    status: string;
    student: { id: string; name: string; email: string } | null;
  }[];
}

export default function ManageCourse() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  // session form
  const [startDate, setStartDate] = useState("");
  const [mode, setMode] = useState<"Online" | "Offline">("Online");
  const [slots, setSlots] = useState(1);
  const [creating, setCreating] = useState(false);
  const [completing, setCompleting] = useState<string | null>(null);

  const load = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/manage/courses/${id}`);
      if (!res.ok) throw new Error("Course not found");
      const data = await res.json();
      setCourse(data.course);
      setSessions(data.sessions);
    } catch (err) {
      console.error(err);
      setCourse(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const isOwner = course && user && course.created_by === user.user_id?.toString();

  const createSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id || !startDate) return;
    setCreating(true);
    
    try {
      const res = await fetch(`/api/manage/courses/${id}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentor_id: user.user_id,
          start_date: startDate,
          end_date: startDate,
          mode,
          slots
        })
      });
      if (!res.ok) throw new Error("Could not schedule session");
      toast.success("Session scheduled");
      setStartDate(""); setSlots(1);
      load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const completeEnrollment = async (enrollmentId: string, courseTitle: string, cost: number) => {
    setCompleting(enrollmentId);
    try {
      const res = await fetch(`/api/manage/enrollments/${enrollmentId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_title: courseTitle,
          credit_cost: cost,
          mentor_id: user?.user_id
        })
      });
      if (!res.ok) throw new Error("Could not mark complete");
      toast.success(`+${cost} credits earned for "${courseTitle}"`);
      load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCompleting(null);
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm("Delete this session? Enrolled learners will lose access.")) return;
    try {
      const res = await fetch(`/api/manage/sessions/${sessionId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not delete session");
      toast.success("Session deleted");
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return <div className="container py-24 max-w-4xl"><div className="h-12 bg-card rounded animate-pulse" /></div>;
  }
  if (!course) {
    return <div className="container py-24 text-center text-muted-foreground">Course not found.</div>;
  }
  if (!isOwner) {
    return (
      <div className="container py-24 text-center">
        <p className="text-muted-foreground mb-4">You can only manage courses you created.</p>
        <Button onClick={() => navigate(`/courses/${course.id}`)}>View as learner</Button>
      </div>
    );
  }

  return (
    <div className="container py-12 max-w-5xl">
      <Link to="/teach" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-smooth">
        <ArrowLeft className="w-4 h-4" /> Back to Teach
      </Link>

      {/* Course header */}
      <div className="rounded-3xl bg-card p-8 shadow-card mb-10">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {course.skills?.name && (
            <Badge className="bg-primary text-primary-foreground border-0 text-xs font-mono uppercase">{course.skills.name}</Badge>
          )}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-foreground text-background text-xs font-mono">
            <Coins className="w-3.5 h-3.5" /> {course.credit_cost} credits / session
          </span>
        </div>
        <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tighter leading-tight mb-3">{course.title}</h1>
        <p className="text-muted-foreground max-w-3xl">{course.description}</p>
      </div>

      {/* Add session */}
      <section className="mb-10">
        <h2 className="font-display text-2xl font-bold mb-4">Schedule a session</h2>
        <form onSubmit={createSession} className="rounded-2xl bg-card p-6 shadow-card grid sm:grid-cols-4 gap-4 items-end">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="mt-2" min={new Date().toISOString().split("T")[0]} />
          </div>
          <div>
            <Label htmlFor="mode">Mode</Label>
            <select id="mode" value={mode} onChange={(e) => setMode(e.target.value as any)} className="mt-2 w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
              <option value="Online">Online</option>
              <option value="Offline">Offline</option>
            </select>
          </div>
          <div>
            <Label htmlFor="slots">Seats</Label>
            <Input id="slots" type="number" min={1} max={50} value={slots} onChange={(e) => setSlots(parseInt(e.target.value) || 1)} className="mt-2" />
          </div>
          <Button type="submit" disabled={creating} className="rounded-full h-10 shadow-pop">
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-1" /> Add</>}
          </Button>
        </form>
      </section>

      {/* Sessions list */}
      <section>
        <h2 className="font-display text-2xl font-bold mb-4">Sessions</h2>
        {sessions.length === 0 ? (
          <div className="rounded-2xl bg-card p-8 text-center text-muted-foreground shadow-card">
            No sessions yet. Add one above.
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((s) => {
              const active = s.enrollments.filter((e) => e.status === "Active");
              const completed = s.enrollments.filter((e) => e.status === "Completed");
              return (
                <div key={s.id} className="rounded-2xl bg-card p-6 shadow-card">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2 font-display text-lg font-bold">
                        <Calendar className="w-4 h-4 text-primary" />
                        {new Date(s.start_date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                      </div>
                      <span className="text-xs font-mono text-muted-foreground">{s.mode}</span>
                      <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" /> {s.enrollments.length}/{s.slots}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => deleteSession(s.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {s.enrollments.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No learners enrolled yet.</p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {[...active, ...completed].map((e) => (
                        <li key={e.id} className="flex items-center justify-between py-3">
                          <div>
                            <div className="font-medium">{e.student?.name ?? "Unknown"}</div>
                            <div className="text-xs text-muted-foreground font-mono">{e.student?.email}</div>
                          </div>
                          {e.status === "Completed" ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-mint/40 text-foreground text-xs font-mono">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full"
                              disabled={completing === e.id}
                              onClick={() => completeEnrollment(e.id, course.title, course.credit_cost)}
                            >
                              {completing === e.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Mark complete · +{course.credit_cost}</>}
                            </Button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
