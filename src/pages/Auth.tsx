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
  const { user, signIn } = useAuth();

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name, phone }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Signup failed");
        
        // Log them in automatically after signup
        signIn({
          user_id: data.userId,
          name,
          email,
          phone,
          credits: 100,
          reputation: 0
        });
        toast.success("Account created!", { description: "Welcome — 100 credits added to your wallet." });
        navigate("/dashboard");
      } else {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Login failed");
        
        signIn(data.user);
        toast.success("Welcome back");
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed relative" style={{
      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`
    }}>
      <div className="flex min-h-screen">
        <div className="flex-1"></div>
        <div className="w-1/2 lg:w-2/5 xl:w-1/3 py-16 md:py-24 min-h-screen flex items-center justify-center pr-8 md:pr-16">
        <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-4 mb-10 group">
          <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center text-primary-foreground transition-smooth group-hover:glow-primary shadow-lg">
            <Sparkles className="w-8 h-8" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-4xl text-gray-100 drop-shadow-lg">
            Skill<span className="text-primary">X</span>change
          </span>
        </Link>

        <h1 className="font-display text-3xl font-bold mb-2 text-gray-100 drop-shadow-lg">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>
        <p className="text-gray-200 text-sm mb-8 drop-shadow-lg">
          {mode === "signup"
            ? "Get 100 credits the moment you sign up."
            : "Sign in to keep teaching and learning."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-100 mb-2 drop-shadow-lg">Full name</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Ananya Tripathi"
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-gray-100 placeholder-gray-300 focus:ring-2 focus:ring-white/40 focus:border-transparent outline-none transition-all drop-shadow-lg"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-white mb-2 drop-shadow-lg">Phone (optional)</label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 1234567894"
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-gray-100 placeholder-gray-300 focus:ring-2 focus:ring-white/40 focus:border-transparent outline-none transition-all drop-shadow-lg"
                />
              </div>
            </>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white mb-2 drop-shadow-lg">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="name@example.com"
              className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-gray-100 placeholder-gray-300 focus:ring-2 focus:ring-white/40 focus:border-transparent outline-none transition-all drop-shadow-lg"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white mb-2">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/60 focus:ring-2 focus:ring-white/30 focus:border-transparent outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-white text-gray-900 py-3 rounded-lg font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={busy}
          >
            {busy ? "…" : mode === "signup" ? "Create account & claim 100 credits" : "Sign in"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          className="mt-6 text-sm text-gray-100 hover:text-white transition-colors w-full text-center drop-shadow-lg"
        >
          {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>
        </div>
      </div>
    </div>
  </div>
  );
}
