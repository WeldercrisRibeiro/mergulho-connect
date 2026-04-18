import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import api from "@/lib/api";
import { devLog, devWarn, devError } from "@/lib/security";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";

interface AuthContextType {
  user: any | null; // Substitui o User do Supabase
  session: any | null; // Apenas para compatibilidade de tipagem se necessário
  loading: boolean;
  isAdmin: boolean;
  isAdminCCM: boolean;
  isGerente: boolean;
  isVisitor: boolean;
  managedGroupIds: string[];
  userGroupIds: string[];
  profile: { full_name: string; avatar_url: string | null; whatsapp_phone: string | null; username: string | null; created_at: string | null } | null;
  routinePermissions: Record<string, boolean>;
  unreadAnnouncements: number;
  signIn: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isAdmin: false,
  isAdminCCM: false,
  isGerente: false,
  isVisitor: false,
  managedGroupIds: [],
  userGroupIds: [],
  profile: null,
  routinePermissions: {},
  unreadAnnouncements: 0,
  signIn: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const setAppBadge = (count: number) => {
  if (!("setAppBadge" in navigator)) return;
  if (count > 0) {
    (navigator as any).setAppBadge(count).catch(() => {});
  } else {
    (navigator as any).clearAppBadge().catch(() => {});
  }
};

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminCCM, setIsAdminCCM] = useState(false);
  const [isGerente, setIsGerente] = useState(false);
  const [isVisitor, setIsVisitor] = useState(false);
  const [managedGroupIds, setManagedGroupIds] = useState<string[]>([]);
  const [userGroupIds, setUserGroupIds] = useState<string[]>([]);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);
  const [routinePermissions, setRoutinePermissions] = useState<Record<string, boolean>>({});
  const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);

  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const signOutRef = useRef<() => Promise<void>>(async () => {});

  const playNotificationSound = () => {
    const isNotifyEnabled = localStorage.getItem("notify_enabled") !== "false";
    if (!isNotifyEnabled) return;
    try {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
      audio.volume = 0.5;
      audio.play().catch((e) => devLog("warn", "Audio bloqueado pelo browser:", e));
    } catch (_) {}
  };

  // ─── Init: auth state ────────────────────────────────────────────────────
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("mergulho_auth_token");
      if (!token) {
        clearAuthData();
        return;
      }

      try {
        const { data: me } = await api.get('/auth/me');
        setUser(me);
        await Promise.all([fetchProfile(me.id), checkRoles(me.id)]);
      } catch (err) {
        devWarn("Token inválido ou expirado.");
        clearAuthData();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const clearAuthData = () => {
    localStorage.removeItem("mergulho_auth_token");
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
    setIsGerente(false);
    setIsVisitor(false);
    setManagedGroupIds([]);
    setUserGroupIds([]);
    setRoutinePermissions({});
    setUnreadAnnouncements(0);
    setAppBadge(0);
    setLoading(false);
  };

  // ─── fetchProfile ─────────────────────────────────────────────────────────
  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await api.get(`/profiles/user/${userId}`);
      if (data) setProfile(data);
    } catch (err) {
      devError("Exceção ao buscar perfil:", err);
    }
  };

  // ─── checkRoles ───────────────────────────────────────────────────────────
  const checkRoles = async (userId: string) => {
    try {
      const { data: roleData } = await api.get(`/user-roles/user/${userId}`);
      
      const rolesList = roleData ? [roleData.role] : [];
      const hasAdminCCM = rolesList.includes("admin_ccm");
      const hasAdmin = rolesList.includes("admin") || rolesList.includes("pastor") || hasAdminCCM;
      const hasGerente = rolesList.includes("gerente");
      const hasVisitante = rolesList.includes("visitante");

      setIsAdminCCM(hasAdminCCM);
      setIsAdmin(hasAdmin);
      setIsVisitor(hasVisitante);

      const { data: managedGroups } = await api.get(`/member-groups/user/${userId}`);

      const allGroupIds = Array.from(new Set((managedGroups || []).map((m: any) => m.group_id)));
      setUserGroupIds(allGroupIds);

      const managedIds = (managedGroups || [])
        .filter((mg: any) => {
          const role = (mg.role || "").toLowerCase();
          return role !== "" && role !== "member" && role !== "membro";
        })
        .map((m: any) => m.group_id);

      setManagedGroupIds(managedIds);
      setIsGerente(hasAdmin || hasGerente || managedIds.length > 0);

      try {
        if (allGroupIds.length > 0) {
          const { data: routines } = await api.get(`/group-routines/groups`, { params: { groupIds: allGroupIds.join(",") } });
          const perms: Record<string, boolean> = {};
          (routines || []).forEach((r: any) => {
            if (perms[r.routine_key] !== true) perms[r.routine_key] = r.is_enabled;
          });
          setRoutinePermissions(perms);
        } else {
          setRoutinePermissions({});
        }
      } catch (e) {
        devError("Falha silenciosa na busca de rotinas:", e);
        setRoutinePermissions({});
      }
    } catch (err) {
      devError("Erro ao verificar roles:", err);
    }
  };

  // ─── Polling Announcements ────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    let previousCount = -1;

    const checkAnnouncements = async () => {
      try {
        const lastChecked = localStorage.getItem("last_checked_announcements") || new Date(0).toISOString();
        const { data } = await api.get("/announcements/unread-count", { params: { lastChecked } });

        const unread = data?.count || 0;
        setUnreadAnnouncements(unread);
        setAppBadge(unread);

        if (previousCount !== -1 && unread > previousCount) {
            playNotificationSound();
        }
        previousCount = unread;
      } catch (_) {}
    };

    checkAnnouncements();
    const interval = setInterval(checkAnnouncements, 30000); // Polling a cada 30s
    return () => clearInterval(interval);
  }, [user]);

  // ─── Web Push ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (user && !loading) {
      subscribeToPush(user.id);
    }
  }, [user, loading]);

  const subscribeToPush = async (userId: string) => {
    // Implementar Web Push com endpoint do Nest se necessário
  };

  // ─── Auto Logout ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000;
    localStorage.setItem("last_active_time", Date.now().toString());

    const resetTimer = () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = setTimeout(() => {
        devWarn("Sessão expirada por inatividade.");
        signOutRef.current();
      }, INACTIVITY_TIMEOUT_MS);
    };

    resetTimer();
    const updateActivity = () => {
      localStorage.setItem("last_active_time", Date.now().toString());
      resetTimer();
    };

    window.addEventListener("mousedown", updateActivity, { passive: true });
    window.addEventListener("keydown", updateActivity, { passive: true });
    window.addEventListener("scroll", updateActivity, { passive: true });

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      window.removeEventListener("mousedown", updateActivity);
      window.removeEventListener("keydown", updateActivity);
      window.removeEventListener("scroll", updateActivity);
    };
  }, [user]);

  // ─── Actions ─────────────────────────────────────────────────────────────
  const signIn = async (email: string, pass: string) => {
    const { data } = await api.post('/auth/login', { email, password: pass });
    localStorage.setItem('mergulho_auth_token', data.access_token);
    setUser(data.user);
    await Promise.all([fetchProfile(data.user.id), checkRoles(data.user.id)]);
  };

  const signOut = async () => {
    devLog("log", "[AuthContext] Saindo...");
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    clearAuthData();
  };

  useEffect(() => {
    signOutRef.current = signOut;
  });

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session: null,
        loading,
        isAdmin,
        isAdminCCM,
        isGerente,
        isVisitor,
        managedGroupIds: managedGroupIds || [],
        userGroupIds: userGroupIds || [],
        profile,
        routinePermissions,
        unreadAnnouncements,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};