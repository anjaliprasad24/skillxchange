import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

interface Skill { id: string; name: string }

const LEVELS = [
  { label: "Beginner", credits: 10, desc: "Intro topics, light prep" },
  { label: "Intermediate", credits: 20, desc: "Deeper concepts, practice" },
  { label: "Advanced", credits: 30, desc: "Mastery topics, mock interviews" },
];

export default function NewCourse() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillId, setSkillId] = useState("");
  const [newSkill, setNewSkill] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [credits, setCredits] = useState(20);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("skills").select("id, name").order("name");
      setSkills((data as any) ?? []);
    })();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim() || !description.trim()) {
      toast.error("Title and description are required");
      return;
    }
    setSaving(true);

    let finalSkillId = skillId;
    if (!finalSkillId && newSkill.trim()) {
      const { data: s, error: e1 } = await supabase
        .from("skills").insert({ name: newSkill.trim() }).select("id").maybeSingle();
      if (e1 || !s) {
        toast.error(e1?.message ?? "Could not create skill");
        setSaving(false); return;
      }
      finalSkillId = s.id;
    }
    if (!finalSkillId) {
      toast.error("Pick a skill or add a new one");
      setSaving(false); return;
    }

    const { data: course, error } = await supabase.from("courses").insert({
      title: title.trim(),
      description: description.trim(),
      credit_cost: credits,
      skill_id: finalSkillId,
      created_by: user.id,
    }).select("id").maybeSingle();

    setSaving(false);
    if (error || !course) {
      toast.error(error?.message ?? "Could not create course"); return;
    }
    toast.success("Course created! Now schedule a session.");
    navigate(`/teach/course/${course.id}`);
  };

  return (
    <div className="container py-12 max-w-2xl">
      <Link to="/teach" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-smooth">
        <ArrowLeft className="w-4 h-4" /> Back to Teach
      </Link>

      <p className="font-mono text-xs uppercase tracking-widest text-primary mb-3">New course</p>
      <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tighter leading-[0.95] mb-3">
        Share what you <span className="font-serif-italic font-normal text-primary">already learned.</span>
      </h1>
      <p className="text-muted-foreground mb-10">Each completed session pays out the credit cost you set.</p>

      <form onSubmit={submit} className="space-y-6 rounded-3xl bg-card p-7 shadow-card">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="DSA Crash Course: Arrays to Trees" required className="mt-2" />
        </div>

        <div>
          <Label htmlFor="desc">Description</Label>
          <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What learners walk away with..." rows={4} required className="mt-2" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="skill">Pick a skill</Label>
            <select
              id="skill"
              value={skillId}
              onChange={(e) => { setSkillId(e.target.value); setNewSkill(""); }}
              className="mt-2 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="">— Select —</option>
              {skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="newSkill">…or add new</Label>
            <Input
              id="newSkill"
              value={newSkill}
              onChange={(e) => { setNewSkill(e.target.value); setSkillId(""); }}
              placeholder="e.g. Compiler Design"
              className="mt-2"
            />
          </div>
        </div>

        <div>
          <Label>Credit cost per session</Label>
          <div className="grid grid-cols-3 gap-3 mt-2">
            {LEVELS.map((l) => (
              <button
                type="button"
                key={l.label}
                onClick={() => setCredits(l.credits)}
                className={`rounded-2xl p-4 text-left border-2 transition-smooth ${
                  credits === l.credits
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-foreground/30"
                }`}
              >
                <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{l.label}</div>
                <div className="font-display text-2xl font-bold mt-1">{l.credits} cr</div>
                <div className="text-xs text-muted-foreground mt-1">{l.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" disabled={saving} size="lg" className="w-full rounded-full h-12 shadow-pop">
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating…</> : "Create course"}
        </Button>
      </form>
    </div>
  );
}
