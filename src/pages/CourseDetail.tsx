import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Coins, Calendar, Users, Globe, MapPin, CheckCircle2, Loader2 } from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string;
  credit_cost: number;
  skills?: { name: string } | null;
}

interface Session {
  id: string;
  start_date: string;
  end_date: string;
  mode: string;
  slots: number;
  taken: number;
  enrolled: boolean;
  mentor: {
    name: string;
    email: string;
    phone: string;
  };
}

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  const load = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/courses/${id}`);
      if (!res.ok) throw new Error("Course not found");
      const data = await res.json();
      
      setCourse(data.course);
      
      // Check enrollments if logged in
      let enrolledMap: Record<string, boolean> = {};
      if (user && data.sessions.length > 0) {
        const sessionIds = data.sessions.map((s: any) => s.id);
        const enrollRes = await fetch("/api/enrollments/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.user_id, session_ids: sessionIds })
        });
        if (enrollRes.ok) {
          enrolledMap = await enrollRes.json();
        }
      }

      setSessions(
        data.sessions.map((s: any) => ({
          ...s,
          enrolled: !!enrolledMap[s.id],
        }))
      );
    } catch (err) {
      console.error(err);
      setCourse(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.user_id]);

  const enroll = async (sessionId: string) => {
    if (!course) return;
    if (!user) {
      navigate("/auth?mode=signup");
      return;
    }
    if ((profile?.credits ?? 0) < course.credit_cost) {
      toast.error(`Not enough credits — need ${course.credit_cost}, you have ${profile?.credits ?? 0}.`);
      return;
    }
    setEnrollingId(sessionId);
    
    try {
      const res = await fetch("/api/courses/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.user_id, session_id: sessionId })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to enroll");
      
      toast.success(`Enrolled! ${course.credit_cost} credits debited.`);
      
      // Update local profile credit count from database
      await refreshProfile();
      
      await load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setEnrollingId(null);
    }
  };

  if (loading) {
    return (
      <div className="container py-24 max-w-4xl">
        <div className="h-8 w-32 bg-card rounded animate-pulse mb-6" />
        <div className="h-16 w-3/4 bg-card rounded animate-pulse" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container py-24 text-center">
        <p className="text-muted-foreground">Course not found.</p>
        <Button asChild className="mt-6"><Link to="/courses">Back to catalog</Link></Button>
      </div>
    );
  }

  return (
    <div className="container py-12 md:py-16 max-w-5xl">
      <Link to="/courses" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-smooth">
        <ArrowLeft className="w-4 h-4" /> All courses
      </Link>

      {/* Header */}
      <div className="rounded-3xl bg-card p-8 md:p-12 shadow-card mb-10">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {course.skills?.name && (
            <Badge className="bg-primary text-primary-foreground border-0 text-xs font-mono uppercase tracking-wider px-3 py-1">
              {course.skills.name}
            </Badge>
          )}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-foreground text-background text-xs font-mono">
            <Coins className="w-3.5 h-3.5" /> {course.credit_cost} credits
          </div>
        </div>

        <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tighter leading-[1.05] mb-6">
          {course.title}
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl">
          {course.description}
        </p>
      </div>

      {/* Sessions */}
      <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-6">
        Upcoming sessions
      </h2>

      {sessions.length === 0 ? (
        <div className="rounded-2xl bg-card p-10 text-center text-muted-foreground shadow-card">
          No sessions scheduled yet. Check back soon.
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((s) => {
            const full = s.taken >= s.slots;
            return (
              <div key={s.id} className="rounded-2xl bg-card p-6 shadow-card flex flex-col md:flex-row md:items-center gap-6 justify-between">
                <div className="flex flex-wrap items-center gap-6">
                  <div>
                    <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-1">Starts</div>
                    <div className="font-display text-xl font-bold flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      {new Date(s.start_date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-1">Mode</div>
                    <div className="font-medium flex items-center gap-2">
                      {s.mode === "Online" ? <Globe className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                      {s.mode}
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-1">Mentor</div>
                    <div className="font-medium flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {s.mentor?.name || "Unknown"}
                      {s.mentor?.email && <span className="text-xs text-muted-foreground ml-1">({s.mentor.email})</span>}
                    </div>
                  </div>
                </div>

                <div>
                  {s.enrolled ? (
                    <Button disabled variant="outline" className="rounded-full h-12 px-6 border-mint bg-mint/30 text-foreground">
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Enrolled
                    </Button>
                  ) : (
                    <Button
                      onClick={() => enroll(s.id)}
                      disabled={enrollingId === s.id || full}
                      className="rounded-full h-12 px-6 shadow-pop"
                    >
                      {enrollingId === s.id ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enrolling…</>
                      ) : full ? "Session full" : (
                        <>Enroll for {course.credit_cost} credits</>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
