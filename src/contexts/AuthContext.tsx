import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface Profile {
  user_id: number;
  name: string;
  email: string;
  phone: string;
  credits: number;
  reputation: number;
}

interface AuthContextType {
  user: Profile | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (userData: Profile) => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage on mount
    const storedUser = localStorage.getItem("skillxchange_user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setProfile(parsed);
        
        // Fetch the absolute latest from the DB in the background
        fetch(`/api/users/${parsed.user_id}`)
          .then(res => {
            if (res.ok) return res.json();
            throw new Error("Failed");
          })
          .then(latestUser => {
            setUser(latestUser);
            setProfile(latestUser);
            localStorage.setItem("skillxchange_user", JSON.stringify(latestUser));
          })
          .catch(e => console.error(e));
          
      } catch (e) {
        localStorage.removeItem("skillxchange_user");
      }
    }
    setLoading(false);
  }, []);

  const signIn = (userData: Profile) => {
    localStorage.setItem("skillxchange_user", JSON.stringify(userData));
    setUser(userData);
    setProfile(userData);
  };

  const signOut = async () => {
    localStorage.removeItem("skillxchange_user");
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      try {
        const res = await fetch(`/api/users/${user.user_id}`);
        if (res.ok) {
          const latestUser = await res.json();
          setUser(latestUser);
          setProfile(latestUser);
          localStorage.setItem("skillxchange_user", JSON.stringify(latestUser));
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
