import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isGerente: boolean;
  managedGroupIds: string[];
  profile: { full_name: string; avatar_url: string | null; whatsapp_phone: string | null } | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isAdmin: false,
  isGerente: false,
  managedGroupIds: [],
  profile: null,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGerente, setIsGerente] = useState(false);
  const [managedGroupIds, setManagedGroupIds] = useState<string[]>([]);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(async () => {
          await Promise.all([
            fetchProfile(session.user.id),
            checkRoles(session.user.id)
          ]);
          setLoading(false);
        }, 0);
      } else {
        setProfile(null);
        setIsAdmin(false);
        setIsGerente(false);
        setManagedGroupIds([]);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await Promise.all([
          fetchProfile(session.user.id),
          checkRoles(session.user.id)
        ]);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("full_name, avatar_url, whatsapp_phone")
        .eq("user_id", userId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching profile:", error);
      }
      if (data) setProfile(data);
    } catch (err) {
      console.error("Profile fetch exception:", err);
    }
  };

  const checkRoles = async (userId: string) => {
    try {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      const admin = roles?.some((r: any) => r.role === "admin") || false;
      const moderador = roles?.some((r: any) => r.role === "moderador") || false;

      setIsAdmin(admin);

      if (!admin) {
        const { data: managed } = await (supabase as any)
          .from("member_groups")
          .select("group_id")
          .eq("user_id", userId)
          .eq("role" as any, "manager");

        const managedIds = managed?.map((m: any) => m.group_id) || [];
        setManagedGroupIds(managedIds);
        setIsGerente(moderador || managedIds.length > 0);
      } else {
        setIsGerente(true);
        setManagedGroupIds([]);
      }
    } catch (err) {
      console.error("Error checking roles:", err);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, isGerente, managedGroupIds, profile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
