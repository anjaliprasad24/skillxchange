import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, ArrowRight, Users, Sparkles } from "lucide-react";

interface EventRow {
  id: string;
  name: string;
  description: string | null;
  mode: string;
  start_date: string;
  end_date: string;
  team_count?: number;
}

const tints = ["bg-mint", "bg-sunny", "bg-lilac", "bg-sky"];

export default function Events() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: evs } = await supabase
        .from("events")
        .select("*")
        .order("start_date", { ascending: true });
      if (!evs) { setLoading(false); return; }

      const ids = evs.map((e) => e.id);
      const { data: teams } = await supabase.from("teams").select("event_id").in("event_id", ids);
      const counts = new Map<string, number>();
      teams?.forEach((t) => counts.set(t.event_id, (counts.get(t.event_id) ?? 0) + 1));

      setEvents(evs.map((e) => ({ ...e, team_count: counts.get(e.id) ?? 0 })));
      setLoading(false);
    })();
  }, []);

  return (
    <div className="container py-12 md:py-16 max-w-6xl">
      <div className="mb-12">
        <p className="font-mono text-xs uppercase tracking-widest text-primary mb-3">Events</p>
        <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tighter leading-[0.95]">
          Build with <span className="font-serif-italic font-normal text-primary">others</span>.
        </h1>
        <p className="text-muted-foreground mt-4 max-w-xl text-lg">
          Hackathons, jams, and showdowns. Form a team, register, and ship something together.
        </p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading events…</p>
      ) : events.length === 0 ? (
        <div className="rounded-2xl bg-card p-12 text-center">
          <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
          <p className="text-muted-foreground">No events scheduled yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {events.map((e, i) => (
            <Link
              key={e.id}
              to={`/events/${e.id}`}
              className={`group rounded-3xl ${tints[i % tints.length]} p-7 shadow-card hover:shadow-pop transition-smooth hover:-translate-y-1`}
            >
              <div className="flex items-center justify-between mb-5">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full bg-foreground/10">
                  {e.mode}
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest opacity-70">
                  <Users className="w-3 h-3 inline mr-1" />
                  {e.team_count} team{e.team_count === 1 ? "" : "s"}
                </span>
              </div>
              <h2 className="font-display text-3xl font-bold tracking-tight mb-2 leading-tight">{e.name}</h2>
              <p className="text-sm text-foreground/75 mb-6 line-clamp-3">{e.description}</p>
              <div className="flex items-center justify-between">
                <p className="text-xs font-mono flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(e.start_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  {e.end_date !== e.start_date &&
                    ` – ${new Date(e.end_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`}
                </p>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-smooth" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
