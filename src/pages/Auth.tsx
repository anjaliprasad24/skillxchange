import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

export default function Auth() {
  const [params] = useSearchParams();
  const initialMode = params.get("mode") === "signup" ? "signup" : "signin";
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { name, phone },
          },
        });
        if (error) throw error;
        toast.success("Account created!", { description: "Welcome — 100 credits added to your wallet." });
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
        navigate("/dashboard");
      }
    } catch (err: any) {
      const msg = err?.message ?? "Something went wrong";
      toast.error(msg.includes("already registered") ? "Account exists — try signing in." : msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container py-16 md:py-24 max-w-md">
      <div className="rounded-lg border border-border bg-card p-8 card-elevated">
        <Link to="/" className="inline-flex items-center gap-2 mb-8 group">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground transition-smooth group-hover:glow-primary">
            <Sparkles className="w-4 h-4" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-lg">
            Skill<span className="text-primary">X</span>change
          </span>
        </Link>

        <h1 className="font-display text-3xl font-bold mb-2">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          {mode === "signup"
            ? "Get 100 credits the moment you sign up."
            : "Sign in to keep teaching and learning."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <>
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ananya Tripathi" />
              </div>
              <div>
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 1234567894" />
              </div>
            </>
          )}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </div>

          <Button type="submit" className="w-full font-semibold" disabled={busy}>
            {busy ? "…" : mode === "signup" ? "Create account & claim 100 credits" : "Sign in"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          className="mt-6 text-sm text-muted-foreground hover:text-foreground transition-smooth w-full text-center"
        >
          {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>
      </div>
    </div>
  );
}
