import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isAdminCCM: boolean;
  isGerente: boolean;
  isVisitor: boolean;
  managedGroupIds: string[];
  userGroupIds: string[];
  profile: { full_name: string; avatar_url: string | null; whatsapp_phone: string | null; username: string | null } | null;
  routinePermissions: Record<string, boolean>;
  unreadAnnouncements: number;
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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
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

  // ─── Ref para o timer de inatividade (evita stale closure) ────────────────
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ref para signOut para evitar stale closure no timer
  const signOutRef = useRef<() => Promise<void>>(async () => {});

  // ─── Som de notificação ────────────────────────────────────────────────────
  const playNotificationSound = () => {
    const isNotifyEnabled = localStorage.getItem("notify_enabled") !== "false";
    if (!isNotifyEnabled) return;
    try {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
      audio.volume = 0.5;
      audio.play().catch((e) => console.log("Audio bloqueado pelo browser:", e));
    } catch (_) {}
  };

  // ─── Init: auth state ────────────────────────────────────────────────────
  useEffect(() => {
    const IS_DEBUG_ADMIN = localStorage.getItem("debug_admin") === "true";

    if (IS_DEBUG_ADMIN) {
      console.warn("⚠️ MODO DEBUG ADMIN ATIVO: Ignorando autenticação Supabase.");
      const mockUser: any = {
        id: "00000000-0000-0000-0000-000000000000",
        email: "admin@debug.com",
        user_metadata: { full_name: "Debug" },
        app_metadata: {},
        aud: "authenticated",
        created_at: new Date().toISOString(),
      };
      setUser(mockUser);
      setSession({ user: mockUser, access_token: "debug", refresh_token: "debug" } as any);
      setIsAdmin(true);
      setIsGerente(true);
      setIsAdminCCM(true);
      setProfile({
        full_name: "Gestor Master (Emergência)",
        avatar_url: null,
        whatsapp_phone: "5500000000000",
        username: "ccm",
      });
      setLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(async () => {
          await Promise.all([fetchProfile(session.user.id), checkRoles(session.user.id)]);
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
        setAppBadge(0);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await Promise.all([fetchProfile(session.user.id), checkRoles(session.user.id)]);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ─── fetchProfile ─────────────────────────────────────────────────────────
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("full_name, avatar_url, whatsapp_phone, username")
        .eq("user_id", userId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Erro ao buscar perfil:", error);
      }
      if (data) setProfile(data);
    } catch (err) {
      console.error("Exceção ao buscar perfil:", err);
    }
  };

  // ─── checkRoles ───────────────────────────────────────────────────────────
  const checkRoles = async (userId: string) => {
    try {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      const rolesList = roles?.map((r: any) => r.role) || [];
      const hasAdminCCM = rolesList.includes("admin_ccm");
      const hasAdmin = rolesList.includes("admin") || rolesList.includes("pastor") || hasAdminCCM;
      const hasGerente = rolesList.includes("gerente");
      const hasVisitante = rolesList.includes("visitante");

      setIsAdminCCM(hasAdminCCM);
      setIsAdmin(hasAdmin);
      setIsVisitor(hasVisitante);

      const { data: memberGroupsData, error: managedErr } = await supabase
        .from("member_groups")
        .select("group_id, role")
        .eq("user_id", userId);

      if (managedErr) console.error("Erro ao buscar grupos:", managedErr);
      const managedGroups = memberGroupsData || [];

      const allGroupIds = Array.from(new Set((managedGroups as any[]).map((m) => m.group_id)));
      setUserGroupIds(allGroupIds);

      const managedIds = (managedGroups as any[])
        .filter((mg) => {
          const role = (mg.role || "").toLowerCase();
          return role !== "" && role !== "member" && role !== "membro";
        })
        .map((m: any) => m.group_id);

      setManagedGroupIds(managedIds);
      setIsGerente(hasAdmin || hasGerente || managedIds.length > 0);

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
          (routines as any[])?.forEach((r) => {
            if (perms[r.routine_key] !== true) perms[r.routine_key] = r.is_enabled;
          });
          setRoutinePermissions(perms);
        }
      } catch (e) {
        console.error("Falha silenciosa na busca de rotinas:", e);
        setRoutinePermissions({});
      }
    } catch (err) {
      console.error("Erro ao verificar roles:", err);
    }
  };

  // ─── Effect: Announcements + Realtime + Badge ────────────────────────────
  useEffect(() => {
    if (!user) return;

    const checkAnnouncements = async () => {
      try {
        const lastChecked =
          localStorage.getItem("last_checked_announcements") || new Date(0).toISOString();
        const { count } = await (supabase as any)
          .from("announcements")
          .select("id", { count: "exact" })
          .gt("created_at", lastChecked)
          .neq("created_by", user.id);

        const unread = count || 0;
        setUnreadAnnouncements(unread);
        setAppBadge(unread);
      } catch (_) {}
    };

    checkAnnouncements();

    const channelName = `announcements-${user.id}-${Math.random().toString(36).substr(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "announcements" },
        (payload) => {
          const newNotice = payload.new as any;
          if (payload.eventType === "INSERT" && newNotice.created_by !== user.id) {
            playNotificationSound();
            window.dispatchEvent(new CustomEvent("new-announcement", { detail: newNotice }));
          }
          checkAnnouncements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // ─── Effect: Web Push Subscription ──────────────────────────────────────
  useEffect(() => {
    if (user && !loading) {
      subscribeToPush(user.id);
    }
  }, [user, loading]);

  // ─── Effect: Auto Logout por inatividade ─────────────────────────────────
  // FIX: usa setTimeout em vez de setInterval + checkInactivity imediata.
  // Isso evita que uma sessão anterior no localStorage cause logout imediato
  // ao montar o componente. O timestamp é sempre renovado no login.
  useEffect(() => {
    if (!user) return;

    // Tempo máximo de inatividade: 60 minutos
    const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000;

    // Ao logar (user muda de null → valor), renova o timestamp imediatamente.
    // Isso garante que uma sessão anterior no storage não dispare o logout.
    localStorage.setItem("last_active_time", Date.now().toString());

    const resetTimer = () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = setTimeout(() => {
        console.warn("Sessão expirada por inatividade.");
        signOutRef.current();
      }, INACTIVITY_TIMEOUT_MS);
    };

    // Inicia o timer
    resetTimer();

    const updateActivity = () => {
      localStorage.setItem("last_active_time", Date.now().toString());
      resetTimer(); // Reinicia o countdown a cada interação
    };

    window.addEventListener("mousedown", updateActivity, { passive: true });
    window.addEventListener("keydown", updateActivity, { passive: true });
    window.addEventListener("touchstart", updateActivity, { passive: true });
    window.addEventListener("scroll", updateActivity, { passive: true });

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      window.removeEventListener("mousedown", updateActivity);
      window.removeEventListener("keydown", updateActivity);
      window.removeEventListener("touchstart", updateActivity);
      window.removeEventListener("scroll", updateActivity);
    };
  }, [user]); // Só roda quando user muda (login/logout)

  const subscribeToPush = async (userId: string) => {
    if (!VAPID_PUBLIC_KEY) {
      console.warn(
        "VITE_VAPID_PUBLIC_KEY não definida. Web Push desabilitado. " +
        "Gere um par de chaves com: npx web-push generate-vapid-keys"
      );
      return;
    }

    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      if (subscription) {
        await (supabase as any)
          .from("user_push_subscriptions")
          .upsert(
            {
              user_id: userId,
              subscription: subscription.toJSON(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );
        console.log("Push subscription salva com sucesso.");
      }
    } catch (err) {
      console.warn("Push subscription falhou:", err);
    }
  };

  // ─── signOut ──────────────────────────────────────────────────────────────
  const signOut = async () => {
    console.log("[AuthContext] Saindo...");
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    localStorage.removeItem("last_active_time");
    localStorage.removeItem("debug_admin");
    setAppBadge(0);
    await supabase.auth.signOut();
  };

  // Mantém o ref sempre atualizado para o timer poder chamar sem stale closure
  useEffect(() => {
    signOutRef.current = signOut;
  });

  // ─── refreshProfile ───────────────────────────────────────────────────────
  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
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
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};