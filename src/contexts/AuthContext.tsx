import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type AppRole = "admin" | "coordenador" | "user" | "cliente";

interface Profile {
  username: string;
  display_name: string | null;
  platform_company_id: string | null;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  role: AppRole | null;
  isAdmin: boolean;
  isCoordenador: boolean;
  isCliente: boolean;
  platformCompanyId: string | null;
  canEditChecklist: boolean;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

function toEmail(input: string) {
  const v = input.trim();
  if (v.includes("@")) return v.toLowerCase();
  return `${v.toLowerCase()}@internal.app`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId: string) {
    try {
      const { data: p } = await supabase
        .from("profiles")
        .select("username, display_name, platform_company_id")
        .eq("id", userId)
        .maybeSingle();
      setProfile(p ? { username: p.username, display_name: p.display_name, platform_company_id: (p as any).platform_company_id ?? null } : null);

      const { data: r } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();
      setRole((r?.role as AppRole) || "user");
    } catch (err) {
      console.error("Error loading profile:", err);
      setProfile(null);
      setRole("user");
    }
  }

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const u = session?.user ?? null;
        setUser(u);
        if (u) {
          setLoading(true);
          // Defer to avoid deadlock inside the auth callback
          setTimeout(async () => {
            await loadProfile(u.id);
            if (mounted) setLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setRole(null);
          setLoading(false);
        }
      }
    );

    // Initial session load
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const u = session?.user ?? null;
        setUser(u);
        if (u) {
          await loadProfile(u.id);
        } else {
          setRole(null);
        }
      } catch (err) {
        console.error("Error initializing auth:", err);
        setUser(null);
        setProfile(null);
        setRole(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (username: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: toEmail(username),
      password,
    });
    return { error: error ? "Usuário ou senha incorretos" : null };
  };

  const signOut = async () => {
    try {
      localStorage.removeItem("hef:nav-state:v1");
    } catch {}
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isAdmin: role === "admin",
        isCoordenador: role === "coordenador",
        isCliente: role === "cliente",
        platformCompanyId: profile?.platform_company_id ?? null,
        canEditChecklist: role === "admin" || role === "coordenador",
        loading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
