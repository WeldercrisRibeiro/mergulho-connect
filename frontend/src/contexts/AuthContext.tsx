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
  IsLider: boolean;
  managedGroupIds: string[];
  userGroupIds: string[];
  profile: { fullName: string; avatarUrl: string | null; whatsappPhone: string | null; username: string | null; createdAt: string | null } | null;
  setProfile: (profile: AuthContextType["profile"]) => void;
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
  IsLider: false,
  managedGroupIds: [],
  userGroupIds: [],
  profile: null,
  setProfile: () => { },
  routinePermissions: {},
  unreadAnnouncements: 0,
  signIn: async () => { },
  signOut: async () => { },
  refreshProfile: async () => { },
});

export const useAuth = () => useContext(AuthContext);

const setAppBadge = (count: number) => {
  if (!("setAppBadge" in navigator)) return;
  if (count > 0) {
    (navigator as any).setAppBadge(count).catch(() => { });
  } else {
    (navigator as any).clearAppBadge().catch(() => { });
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
  const [IsLider, setIsLider] = useState(false);
  const [managedGroupIds, setManagedGroupIds] = useState<string[]>([]);
  const [userGroupIds, setUserGroupIds] = useState<string[]>([]);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);
  const [routinePermissions, setRoutinePermissions] = useState<Record<string, boolean>>({});
  const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);

  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const signOutRef = useRef<() => Promise<void>>(async () => { });

  const playNotificationSound = () => {
    const isNotifyEnabled = localStorage.getItem("notify_enabled") !== "false";
    if (!isNotifyEnabled) return;
    try {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
      audio.volume = 0.5;
      audio.play().catch((e) => devLog("warn", "Audio bloqueado pelo browser:", e));
    } catch (_) { }
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
    setIsLider(false);
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
      if (data) {
        // Normaliza os campos do backend (camelCase) para o formato esperado pelo frontend (snake_case)
        setProfile({
          fullName: data.fullName || data.full_name || "",
          avatarUrl: data.avatarUrl || data.avatar_url || null,
          whatsappPhone: data.whatsappPhone || data.whatsapp_phone || null,
          username: data.username || null,
          createdAt: data.createdAt || data.created_at || null,
        });
      }
    } catch (err) {
      devError("Exceção ao buscar perfil:", err);
    }
  };

  // ─── checkRoles ───────────────────────────────────────────────────────────
  const checkRoles = async (userId: string) => {
    try {
      const { data: roleData } = await api.get(`/user-roles/user/${userId}`);

      const currentRole = roleData?.role || "membro";
      const rolesList = roleData ? [currentRole] : [];
      const hasAdminCCM = rolesList.includes("admin_ccm");
      const hasAdmin = rolesList.includes("admin") || rolesList.includes("pastor") || hasAdminCCM;
      const hasLeaderRole = rolesList.includes("lider");

      setIsAdminCCM(hasAdminCCM);
      setIsAdmin(hasAdmin);

      const { data: managedGroups } = await api.get(`/member-groups/user/${userId}`);

      const allGroupIds: string[] = Array.from(
        new Set<string>(
          (managedGroups || [])
            .map((m: any) => m.groupId || m.group_id)
            .filter((id: string | null | undefined): id is string => Boolean(id))
        )
      );
      setUserGroupIds(allGroupIds);

      const managedIds: string[] = Array.from(
        new Set<string>(
          (managedGroups || [])
            .filter((mg: any) => {
              const role = (mg.role || "").toLowerCase();
              return role !== "" && role !== "member" && role !== "membro";
            })
            .map((m: any) => m.groupId || m.group_id)
            .filter((id: string | null | undefined): id is string => Boolean(id))
        )
      );

      setManagedGroupIds(managedIds);
      setIsLider(hasAdmin || hasLeaderRole || managedIds.length > 0);

      try {
        const roleMapping: Record<string, string> = {
          "admin": "c1f324b3-45ed-453a-941c-d030e22d7721",
          "admin_ccm": "c1f324b3-45ed-453a-941c-d030e22d7721",
          "pastor": "c1f324b3-45ed-453a-941c-d030e22d7721",
          "lider": "3e4bce2a-7856-4801-b466-7b8e3d12a74b",
          "membro": "071c2037-fa67-43ab-9d1b-4480fe15fd92"
        };

        const roleId = roleMapping[currentRole] || roleMapping.membro;
        
        const params: any = {};
        if (allGroupIds.length > 0) params.groupIds = allGroupIds.join(",");
        if (roleId) params.roleId = roleId;
        
        const { data: routines } = await api.get(`/group-routines/groups`, { params });
        const perms: Record<string, boolean> = {};
        
        (routines || []).forEach((r: any) => {
          const key = (r.routineKey || r.routine_key || "").toLowerCase();
          const enabled = r.isEnabled !== undefined ? r.isEnabled : r.is_enabled;
          // Se qualquer regra habilitar a rotina, o usuário tem acesso
          if (enabled === true) perms[key] = true;
        });

        setRoutinePermissions(perms);
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
      } catch (_) { }
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
        IsLider,
        managedGroupIds: managedGroupIds || [],
        userGroupIds: userGroupIds || [],
        profile,
        setProfile,
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
