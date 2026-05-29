import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Coins, Calendar, Users, Search, ArrowUpRight } from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string;
  credit_cost: number;
  skill_id: string | null;
  skills?: { name: string } | null;
  course_sessions?: { id: string; start_date: string; slots: number }[];
}

const PALETTE = ["bg-mint", "bg-sunny", "bg-lilac", "bg-sky-soft", "bg-primary/15", "bg-accent/40"];

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [skill, setSkill] = useState<string>("All");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/courses");
        if (!res.ok) throw new Error("Failed to fetch courses");
        const data = await res.json();
        setCourses(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const skills = useMemo(() => {
    const s = new Set<string>();
    courses.forEach((c) => c.skills?.name && s.add(c.skills.name));
    return ["All", ...Array.from(s).sort()];
  }, [courses]);

  const filtered = courses.filter((c) => {
    const matchSkill = skill === "All" || c.skills?.name === skill;
    const matchQ = !q || c.title.toLowerCase().includes(q.toLowerCase()) || c.description.toLowerCase().includes(q.toLowerCase());
    return matchSkill && matchQ;
  });

  return (
    <div className="container py-12 md:py-16 max-w-7xl">
      <div className="mb-10">
        <p className="font-mono text-xs uppercase tracking-widest text-primary mb-3">Catalog</p>
        <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tighter leading-[0.95]">
          Browse <span className="font-serif-italic font-normal text-primary">peer-taught</span> courses.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
          Spend credits to enroll. Every session is run by a user who already learned it.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-10 flex flex-col md:flex-row gap-4 md:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search DSA, Python, DBMS…"
            className="pl-11 h-12 rounded-full bg-card border-foreground/10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {skills.map((s) => (
            <button
              key={s}
              onClick={() => setSkill(s)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-smooth border ${
                skill === s
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card text-foreground/70 border-foreground/10 hover:border-foreground/30"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 rounded-3xl bg-card animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">No courses match your filters.</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((c, i) => {
            const upcoming = c.course_sessions?.[0];
            return (
              <Link
                key={c.id}
                to={`/courses/${c.id}`}
                className={`group relative rounded-3xl ${PALETTE[i % PALETTE.length]} p-7 flex flex-col min-h-[320px] shadow-card transition-smooth hover:-translate-y-1 hover:shadow-pop overflow-hidden`}
              >
                <div className="flex items-start justify-between mb-6">
                  {c.skills?.name && (
                    <Badge variant="outline" className="bg-background/80 border-foreground/20 text-foreground text-xs font-mono uppercase tracking-wider">
                      {c.skills.name}
                    </Badge>
                  )}
                  <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center transition-smooth group-hover:rotate-45">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                </div>

                <h3 className="font-display text-2xl font-bold leading-tight text-foreground mb-3">
                  {c.title}
                </h3>
                <p className="text-sm text-foreground/70 leading-relaxed line-clamp-3 flex-1">
                  {c.description}
                </p>

                <div className="mt-6 pt-5 border-t border-foreground/10 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <Coins className="w-4 h-4" />
                    {c.credit_cost} credits
                  </div>
                  {upcoming && (
                    <div className="flex items-center gap-3 text-foreground/70 text-xs font-mono">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(upcoming.start_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{upcoming.slots}</span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
