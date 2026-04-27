import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Sparkles, LogOut } from "lucide-react";

export function AppNav() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();

  const navItems = user
    ? [
        { to: "/dashboard", label: "Dashboard" },
        { to: "/courses", label: "Browse" },
        { to: "/teach", label: "Teach" },
        { to: "/profile", label: "Profile" },
      ]
    : [];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground transition-smooth group-hover:scale-110">
            <Sparkles className="w-4 h-4" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">
            Skill<span className="text-primary">X</span>change
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((it) => (
            <Link
              key={it.to}
              to={it.to}
              className={`px-3 py-1.5 text-sm rounded-md transition-smooth ${
                loc.pathname === it.to
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {it.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md border border-primary/30 bg-primary/5">
                <span className="font-mono text-sm font-semibold text-primary">
                  {profile?.credits ?? 0}
                </span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">credits</span>
              </div>
              <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate("/"); }}>
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>Sign in</Button>
              <Button size="sm" onClick={() => navigate("/auth?mode=signup")}>Get started</Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
