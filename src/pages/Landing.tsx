import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Coins, GraduationCap, Users, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />

        <div className="container relative z-10 py-24 md:py-36">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 mb-8 animate-fade-up">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-widest text-primary">Now in beta</span>
            </div>

            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tighter animate-fade-up">
              Teach what you know.
              <br />
              <span className="text-gradient-credit">Learn what you don't.</span>
            </h1>

            <p className="mt-8 text-lg md:text-xl text-muted-foreground max-w-2xl animate-fade-up">
              SkillXchange is the credit-based skill economy. No subscriptions. No paywalls.
              Earn credits by teaching, spend them to learn from peers around the world.
            </p>

            <div className="mt-10 flex flex-wrap gap-4 animate-fade-up">
              <Button size="lg" asChild className="font-semibold">
                <Link to="/auth?mode=signup">
                  Claim 100 free credits <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/auth">I already have an account</Link>
              </Button>
            </div>

            <div className="mt-16 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-muted-foreground font-mono">
              <span>✓ No credit card</span>
              <span>✓ 100 starter credits</span>
              <span>✓ Built for students</span>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container py-24 md:py-32">
        <div className="max-w-2xl mb-16">
          <p className="font-mono text-xs uppercase tracking-widest text-primary mb-4">How it works</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
            A new economy for learning.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-border rounded-lg overflow-hidden">
          {[
            { icon: Coins, n: "01", title: "Get 100 credits", body: "Sign up and your wallet is loaded. No purchases, no card." },
            { icon: GraduationCap, n: "02", title: "Spend to learn", body: "Browse peer-led courses. One enrollment = some credits, depending on level." },
            { icon: Zap, n: "03", title: "Teach to earn", body: "Run a session, attendance gets logged, credits land in your wallet." },
          ].map((s) => (
            <div key={s.n} className="bg-card p-8 transition-smooth hover:bg-muted/30 group">
              <div className="flex items-center justify-between mb-6">
                <s.icon className="w-7 h-7 text-primary" strokeWidth={1.75} />
                <span className="font-mono text-sm text-muted-foreground">{s.n}</span>
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">{s.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CREDIT POLICY */}
      <section className="container pb-24 md:pb-32">
        <div className="rounded-lg border border-border bg-card p-8 md:p-12 card-elevated">
          <div className="flex items-start gap-4 mb-8">
            <Users className="w-6 h-6 text-primary mt-1" />
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-primary mb-2">Mentor payout</p>
              <h3 className="font-display text-2xl md:text-3xl font-bold">Credits per session, by level</h3>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-px bg-border rounded-md overflow-hidden">
            {[
              { lvl: "Beginner", c: 10 },
              { lvl: "Intermediate", c: 20 },
              { lvl: "Advanced", c: 30 },
            ].map((p) => (
              <div key={p.lvl} className="bg-card p-6 text-center">
                <div className="font-mono text-3xl md:text-5xl font-bold text-primary mb-2">+{p.c}</div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{p.lvl}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-32">
        <div className="rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-12 md:p-16 text-center">
          <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Stop paying for courses you can't afford.
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Join the peer-driven alternative. Knowledge should be exchanged, not gatekept.
          </p>
          <Button size="lg" asChild className="font-semibold">
            <Link to="/auth?mode=signup">Start learning for free <ArrowRight className="ml-2 w-4 h-4" /></Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border/50 py-8">
        <div className="container flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <span className="font-mono">© 2026 SkillXchange</span>
          <span className="font-mono text-xs">Built for learners, by learners.</span>
        </div>
      </footer>
    </div>
  );
}
