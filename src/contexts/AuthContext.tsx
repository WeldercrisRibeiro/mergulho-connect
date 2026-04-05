import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isGerente: boolean;
  isVisitor: boolean;
  managedGroupIds: string[];
  userGroupIds: string[];
  profile: { full_name: string; avatar_url: string | null; whatsapp_phone: string | null } | null;
  routinePermissions: Record<string, boolean>;
  unreadAnnouncements: number;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isAdmin: false,
  isGerente: false,
  isVisitor: false,
  managedGroupIds: [],
  userGroupIds: [],
  profile: null,
  routinePermissions: {},
  unreadAnnouncements: 0,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGerente, setIsGerente] = useState(false);
  const [isVisitor, setIsVisitor] = useState(false);
  const [managedGroupIds, setManagedGroupIds] = useState<string[]>([]);
  const [userGroupIds, setUserGroupIds] = useState<string[]>([]);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);
  const [routinePermissions, setRoutinePermissions] = useState<Record<string, boolean>>({});
  const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);

  const playNotificationSound = () => {
    try {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
      audio.volume = 0.5;
      audio.play().catch(e => console.log("Audio play blocked by browser:", e));
    } catch (_) {}
  };

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
        setIsVisitor(false);
        setManagedGroupIds([]);
        setUserGroupIds([]);
        setRoutinePermissions({});
        setUnreadAnnouncements(0);
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

      const rolesList = roles?.map((r: any) => r.role) || [];
      const hasAdmin = rolesList.includes("admin");
      const hasGerente = rolesList.includes("gerente");
      const hasVisitante = rolesList.includes("visitante");

      setIsAdmin(hasAdmin);
      setIsVisitor(hasVisitante);

      // Busca associações deste usuário aos grupos (membro ou líder)
      const { data: memberGroupsData, error: managedErr } = await supabase
        .from("member_groups")
        .select("group_id, role")
        .eq("user_id", userId);

      if (managedErr) console.error("Managed groups fetch error:", managedErr);
      const managedGroups = memberGroupsData || [];

      const allGroupIds = Array.from(new Set((managedGroups as any[])?.map(m => m.group_id) || []));
      setUserGroupIds(allGroupIds);

      const managedIds = (managedGroups as any[])
        ?.filter(mg => {
          const role = (mg.role || "").toLowerCase();
          return role !== "" && role !== "member" && role !== "membro";
        })
        .map((m: any) => m.group_id) || [];
      
      setManagedGroupIds(managedIds);
      setIsGerente(hasAdmin || hasGerente || managedIds.length > 0);

      // NOVO: Busca permissões baseadas no PAPEL do usuário (admin, gerente, moderador, membro)
      const currentRoles = rolesList.length > 0 ? rolesList : ["membro"];
      
      try {
        const { data: routines, error: routineErr } = await (supabase as any)
          .from("group_routines")
          .select("routine_key, is_enabled")
          .in("group_id", currentRoles);
        
        if (routineErr) {
          console.error("Erro ao buscar permissões de rotina:", routineErr);
          setRoutinePermissions({});
        } else {
          const perms: Record<string, boolean> = {};
          (routines as any[])?.forEach(r => {
            if (perms[r.routine_key] !== true) {
              perms[r.routine_key] = r.is_enabled;
            }
          });
          setRoutinePermissions(perms);
        }
      } catch (e) {
        console.error("Falha silenciosa na busca de rotinas:", e);
        setRoutinePermissions({});
      }
    } catch (err) {
      console.error("Error checking roles:", err);
    }
  };

  // Dedicated effect for Announcements and Notifications
  useEffect(() => {
    if (!user) return;

    const checkAnnouncements = async () => {
      try {
        const lastChecked = localStorage.getItem("last_checked_announcements") || new Date(0).toISOString();
        const { count } = await (supabase as any)
          .from("announcements")
          .select("id", { count: 'exact' })
          .gt("created_at", lastChecked)
          .neq("created_by", user.id);
        setUnreadAnnouncements(count || 0);
      } catch (_) {}
    };

    checkAnnouncements();

    const channelName = `announcements-${user.id}-${Math.random().toString(36).substr(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, (payload) => {
        const newNotice = payload.new as any;
        
        // Sound notification ONLY on new entries (INSERT)
        if (payload.eventType === 'INSERT' && newNotice.created_by !== user.id) {
          playNotificationSound();
          window.dispatchEvent(new CustomEvent('new-announcement', { detail: newNotice }));
        }
        
        // Always recalculate count for any change (INSERT, DELETE, UPDATE)
        checkAnnouncements();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      user, session, loading, isAdmin, isGerente, isVisitor, 
      managedGroupIds: managedGroupIds || [], 
      userGroupIds: userGroupIds || [],
      profile, routinePermissions, unreadAnnouncements, signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
