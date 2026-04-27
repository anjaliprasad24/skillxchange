import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Coins, GraduationCap, Sparkles, Star, Play, Users, Zap, ArrowUpRight } from "lucide-react";
import heroVideo from "@/assets/hero-engineering.mp4.asset.json";
import featTeach from "@/assets/feature-teach.jpg";
import featLearn from "@/assets/feature-learn.jpg";
import featCredits from "@/assets/feature-credits.jpg";

const marqueeWords = [
  "DSA", "Python", "Java", "C++", "DAA", "AI / ML", "DBMS",
  "Operating Systems", "Computer Networks", "Web Dev", "Cloud", "System Design",
];

export default function Landing() {
  return (
    <div className="bg-background overflow-hidden">

      {/* ===================== HERO — full-screen video bg ===================== */}
      <section className="relative h-screen min-h-[640px] w-full overflow-hidden">
        {/* Background video covers entire hero */}
        <video
          src={heroVideo.url}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark gradient overlay for text legibility */}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-foreground/75 via-foreground/45 to-foreground/85" />
        {/* Subtle warm color wash */}
        <div aria-hidden className="absolute inset-0 bg-primary/10 mix-blend-overlay" />

        {/* Top label row */}
        <div className="relative z-10 container pt-8 md:pt-12 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background text-foreground text-xs font-mono uppercase tracking-widest shadow-pop">
            <Sparkles className="w-3.5 h-3.5" /> A new way to learn
          </div>
        </div>

        {/* Centered hero content */}
        <div className="relative z-10 container h-[calc(100%-6rem)] flex flex-col justify-center">
          <h1 className="font-display font-bold tracking-tighter leading-[0.92] text-[3rem] sm:text-6xl md:text-8xl lg:text-[9rem] text-background animate-fade-up max-w-6xl">
            Teach. Learn.
            <br />
            <span className="font-serif-italic font-normal text-accent">Exchange</span>{" "}
            knowledge.
          </h1>

          <div className="mt-8 grid md:grid-cols-3 gap-8 items-end animate-fade-up max-w-6xl">
            <p className="md:col-span-2 text-lg md:text-xl text-background/90 max-w-xl leading-snug">
              Earn credits when you teach. Spend them when you learn.
              <span className="text-accent font-semibold"> No subscriptions.</span>
            </p>
            <div className="flex flex-col gap-3">
              <Button size="lg" asChild className="h-14 text-base font-semibold rounded-full shadow-pop">
                <Link to="/auth?mode=signup">
                  Claim 100 credits <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-14 text-base rounded-full bg-transparent border-background/40 text-background hover:bg-background hover:text-foreground">
                <Link to="/auth">I have an account</Link>
              </Button>
            </div>
          </div>

          {/* Live badge bottom-left */}
          <div className="absolute bottom-8 left-4 md:left-8 flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/90 backdrop-blur text-xs font-mono uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> Live
          </div>
        </div>
      </section>

      {/* ===================== STATS STRIP — bold colored block ===================== */}
      <section className="bg-gradient-warm py-16 md:py-20 border-b-2 border-foreground">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { v: "100", l: "Free credits at signup" },
              { v: "0$", l: "Subscription cost" },
              { v: "1:1", l: "Peer sessions" },
              { v: "∞", l: "Skills to exchange" },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl bg-background p-6 shadow-card border-2 border-foreground/10">
                <div className="font-display text-4xl md:text-5xl font-bold text-foreground">{s.v}</div>
                <div className="mt-1 text-sm text-foreground/70">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MARQUEE of engineering skills */}
      <section className="border-y-2 border-foreground py-5 bg-accent overflow-hidden">
        <div className="marquee whitespace-nowrap">
          {[...marqueeWords, ...marqueeWords].map((w, i) => (
            <span key={i} className="font-display text-3xl md:text-5xl font-bold mx-8 inline-flex items-center gap-8">
              {w} <Star className="w-6 h-6 fill-foreground" />
            </span>
          ))}
        </div>
      </section>

      {/* ===================== HOW IT WORKS — 3 colorful cards ===================== */}
      <section className="container py-24 md:py-36">
        <div className="max-w-3xl mb-16">
          <p className="font-mono text-xs uppercase tracking-widest text-primary mb-4">How it works</p>
          <h2 className="font-display text-5xl md:text-7xl font-bold tracking-tighter">
            Three steps. <span className="font-serif-italic font-normal">Zero friction.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { img: featCredits, bg: "bg-mint", n: "01", title: "Get 100 credits free", body: "Your wallet is loaded the moment you sign up. No card. No tricks.", icon: Coins },
            { img: featLearn,   bg: "bg-lilac", n: "02", title: "Spend to learn anything", body: "Browse peer-led sessions across hundreds of skills and enroll in seconds.", icon: GraduationCap },
            { img: featTeach,   bg: "bg-sunny", n: "03", title: "Teach to earn more", body: "Run a session, your wallet refills automatically. Knowledge becomes income.", icon: Zap },
          ].map((s) => (
            <div key={s.n} className={`group relative rounded-3xl ${s.bg} p-2 transition-smooth hover:-translate-y-2 shadow-card overflow-hidden`}>
              <div className="absolute top-6 right-6 z-10 w-10 h-10 rounded-full bg-foreground text-background font-mono text-sm font-bold flex items-center justify-center">
                {s.n}
              </div>
              <div className="aspect-square rounded-2xl overflow-hidden mb-4">
                <img src={s.img} alt={s.title} loading="lazy" width={1024} height={1024} className="w-full h-full object-cover transition-smooth group-hover:scale-105" />
              </div>
              <div className="p-4 pb-6">
                <s.icon className="w-6 h-6 mb-3 text-foreground" />
                <h3 className="font-display text-2xl font-bold mb-2 text-foreground">{s.title}</h3>
                <p className="text-foreground/70">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== BIG STATEMENT BLOCK ===================== */}
      <section className="container pb-24 md:pb-36">
        <div className="rounded-[2.5rem] bg-foreground text-background p-8 md:p-16 lg:p-24 relative overflow-hidden">
          <div aria-hidden className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/40 blur-3xl" />
          <div aria-hidden className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-accent/30 blur-3xl" />

          <div className="relative z-10 max-w-4xl">
            <p className="font-mono text-xs uppercase tracking-widest text-accent mb-6">Our manifesto</p>
            <h2 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-[1.05]">
              Education shouldn't bankrupt you.
              <br />
              <span className="font-serif-italic font-normal text-accent">It should empower you.</span>
            </h2>
            <p className="mt-8 text-lg md:text-xl text-background/70 max-w-2xl leading-relaxed">
              Online courses cost more than textbooks once did. We believe the next great teacher
              is the student two semesters ahead — and they deserve to be paid for what they share.
            </p>
            <div className="mt-12 grid sm:grid-cols-3 gap-px bg-background/10 rounded-2xl overflow-hidden">
              {[
                { v: "+10", l: "Beginner session", color: "text-mint" },
                { v: "+20", l: "Intermediate session", color: "text-accent" },
                { v: "+30", l: "Advanced session", color: "text-primary" },
              ].map((c) => (
                <div key={c.l} className="bg-foreground p-8 text-center">
                  <div className={`font-display text-6xl md:text-7xl font-bold ${c.color}`}>{c.v}</div>
                  <div className="mt-2 text-xs uppercase tracking-widest text-background/60">{c.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===================== TESTIMONIAL / PEER GRID ===================== */}
      <section className="container pb-24 md:pb-36">
        <div className="grid md:grid-cols-12 gap-6">
          <div className="md:col-span-5 rounded-3xl bg-primary text-primary-foreground p-10 flex flex-col justify-between min-h-[400px] shadow-pop">
            <Users className="w-10 h-10" />
            <div>
              <p className="font-display text-3xl md:text-4xl font-bold leading-tight">
                "I taught 4 Python sessions and unlocked an entire UX course. Wild."
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-foreground/20" />
                <div>
                  <div className="font-semibold">Maya R.</div>
                  <div className="text-sm opacity-80">CS Sophomore</div>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-7 grid grid-cols-2 gap-6">
            <div className="rounded-3xl bg-mint p-8 flex flex-col justify-between min-h-[195px]">
              <Star className="w-8 h-8 fill-foreground" />
              <div>
                <div className="font-display text-4xl font-bold">4.9</div>
                <div className="text-sm text-foreground/70">avg session rating</div>
              </div>
            </div>
            <div className="rounded-3xl bg-sky-soft p-8 flex flex-col justify-between min-h-[195px]">
              <Coins className="w-8 h-8" />
              <div>
                <div className="font-display text-4xl font-bold">120k+</div>
                <div className="text-sm text-foreground/70">credits exchanged</div>
              </div>
            </div>
            <div className="col-span-2 rounded-3xl bg-accent p-8 flex items-center justify-between">
              <div>
                <div className="font-mono text-xs uppercase tracking-widest mb-2">Featured skill drop</div>
                <div className="font-display text-2xl md:text-3xl font-bold">"Intro to Generative AI" — open now</div>
              </div>
              <Link to="/courses" className="shrink-0 w-14 h-14 rounded-full bg-foreground text-background flex items-center justify-center hover:scale-110 transition-smooth">
                <ArrowUpRight className="w-6 h-6" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== FINAL CTA ===================== */}
      <section className="container pb-24 md:pb-36">
        <div className="rounded-[2.5rem] bg-gradient-warm p-12 md:p-20 text-center relative overflow-hidden grain">
          <Play className="w-12 h-12 mx-auto mb-6 text-foreground" />
          <h2 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-foreground leading-[0.95]">
            Your first 100 credits
            <br />
            <span className="font-serif-italic font-normal">are waiting.</span>
          </h2>
          <p className="mt-6 text-lg md:text-xl text-foreground/80 max-w-xl mx-auto">
            Join SkillXchange today. Sign up takes 30 seconds.
          </p>
          <Button size="lg" asChild className="mt-10 h-16 px-10 text-lg font-semibold rounded-full bg-foreground text-background hover:bg-foreground/90 shadow-pop">
            <Link to="/auth?mode=signup">
              Start exchanging <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border py-10">
        <div className="container flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold">SkillXchange</span>
          </div>
          <div className="font-mono text-xs text-muted-foreground">© 2026 — Built for learners, by learners.</div>
        </div>
      </footer>
    </div>
  );
}
