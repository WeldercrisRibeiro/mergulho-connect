import { useState, useEffect } from "react";
import { Home, Calendar, BookOpen, MessageCircle, User, Users, LogOut, ChevronLeft, ChevronRight, Bell, BellOff, Shield, ShieldCheck, Settings, Sun, Moon, HandHeart, BarChart3, Archive, Megaphone, Smartphone } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "./ThemeProvider";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";

const navGroups: { 
  label: string; 
  items: { 
    path: string; 
    icon: any; 
    label: string; 
    adminOnly?: boolean; 
    routine?: string; 
  }[] 
}[] = [
  {
    label: "Geral",
    items: [
      { path: "/home", icon: Home, label: "Início" },
      { path: "/perfil", icon: User, label: "Perfil" },
    ]
  },
  {
    label: "Ministério",
    items: [
      { path: "/agenda", icon: Calendar, label: "Agenda", routine: "agenda" },
      { path: "/devocionais", icon: BookOpen, label: "Devocionais", routine: "devocionais" },
      { path: "/voluntarios", icon: HandHeart, label: "Voluntários", routine: "voluntarios" },
      { path: "/checkin-kids", icon: ShieldCheck, label: "Check-in", routine: "kids" },
    ]
  },
  {
    label: "Comunicação",
    items: [
      { path: "/chat", icon: MessageCircle, label: "Chat", routine: "chat" },
      { path: "/comunicados", icon: Megaphone, label: "Comunicados", routine: "comunicados" },
    ]
  },
  {
    label: "Administração",
    items: [
      { path: "/membros", icon: Users, label: "Membros", routine: "membros" },
      { path: "/departamentos", icon: Shield, label: "Departamentos", adminOnly: true },
      { path: "/relatorios", icon: BarChart3, label: "Relatórios", adminOnly: true, routine: "relatorios" },
      { path: "/whatsapp", icon: Smartphone, label: "WhatsApp", adminOnly: true },
      { path: "/configuracoes", icon: Settings, label: "Ajustes", adminOnly: true },
    ]
  }
];



const DesktopSidebar = () => {
  const location = useLocation();
  const { isAdmin, isGerente, isVisitor, signOut, profile, user, routinePermissions, unreadAnnouncements } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    typeof window !== "undefined" && "Notification" in window && (window as any).Notification.permission === "granted"
  );
  const [totalUnread, setTotalUnread] = useState(0);

  // Poll for unread counts from localStorage + messages
  useEffect(() => {
    if (!user) return;
    const check = async () => {
      try {
        const LS_READ_KEY = "chat_read_timestamps";
        const readTs: Record<string, string> = JSON.parse(localStorage.getItem(LS_READ_KEY) || "{}");

        // Check direct messages
        const { data: directMsgs } = await supabase
          .from("messages")
          .select("sender_id, created_at, recipient_id")
          .eq("recipient_id", user.id)
          .order("created_at", { ascending: false });

        const directUnread = new Set<string>();
        directMsgs?.forEach((m: any) => {
          if (m.sender_id === user.id) return;
          const lastRead = readTs[m.sender_id];
          if (!lastRead || new Date(m.created_at) > new Date(lastRead)) {
            directUnread.add(m.sender_id);
          }
        });

        // Check group messages
        const { data: memberGroups } = await supabase
          .from("member_groups")
          .select("group_id")
          .eq("user_id", user.id);
        const groupIds = memberGroups?.map((mg: any) => mg.group_id) || [];

        let groupUnread = 0;
        if (groupIds.length > 0) {
          const { data: groupMsgs } = await supabase
            .from("messages")
            .select("group_id, sender_id, created_at")
            .in("group_id", groupIds)
            .neq("sender_id", user.id)
            .order("created_at", { ascending: false });

          const seen = new Set<string>();
          groupMsgs?.forEach((m: any) => {
            if (seen.has(m.group_id)) return;
            seen.add(m.group_id);
            const lastRead = readTs[m.group_id];
            if (!lastRead || new Date(m.created_at) > new Date(lastRead)) {
              groupUnread++;
            }
          });
        }

        setTotalUnread(directUnread.size + groupUnread);
      } catch (_) { }
    };

    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const handleNotificationToggle = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      alert("Seu navegador não suporta notificações nativas.");
      return;
    }
    if (!notificationsEnabled) {
      const perm = await (window as any).Notification.requestPermission();
      if (perm === "granted") {
        setNotificationsEnabled(true);
      } else {
        alert("Permissão negada pelo navegador. Ative nas configurações do seu browser.");
      }
    } else {
      setNotificationsEnabled(false);
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "hidden md:flex flex-col border-r bg-sidebar h-screen sticky top-0 transition-all duration-300",
          collapsed ? "w-[68px]" : "w-64"
        )}
      >
        {/* Logo */}
        <div className={cn("flex items-center p-4 border-b border-sidebar-border", collapsed ? "justify-center" : "gap-3")}>
          {collapsed ? (
            <img
              src={theme === "dark" ? "/idvmergulho/logo-white.png" : "/idvmergulho/logo.png"}
              alt="Logo"
              className="h-9 w-9 object-contain"
            />
          ) : (
            <>
              <img
                src={theme === "dark" ? "/idvmergulho/logo-horizontal.png" : "/idvmergulho/logo-horizontal-azul.png"}
                alt="Logo CC Mergulho"
                className="h-10 w-auto object-contain"
              />
            </>
          )}
        </div>

        {/* Toggle button - Melhorado Visualmente */}
        {/* Toggle button - Melhorado Visualmente */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute -right-4 top-16 h-8 w-8 rounded-full border border-sidebar-border bg-sidebar-accent shadow-xl shadow-black/10 z-50 hover:scale-110 active:scale-95 transition-all text-sidebar-primary flex items-center justify-center"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-6 overflow-y-auto custom-scrollbar">
          {navGroups.map((group) => {
            const filteredItems = group.items.filter(item => {
              const visitorAllowed = ["/home", "/agenda", "/devocionais", "/perfil"].includes(item.path);
              if (isVisitor && !visitorAllowed) return false;
              if (item.adminOnly && !isAdmin) return false;
              if (item.routine && !isAdmin && routinePermissions[item.routine] === false) return false;
              return true;
            });

            if (filteredItems.length === 0) return null;

            return (
              <div key={group.label} className="space-y-1">
                {!collapsed && (
                  <h3 className="px-3 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/40 mb-2">
                    {group.label}
                  </h3>
                )}
                <div className="space-y-1">
                  {filteredItems.map(({ path, icon: Icon, label }) => {
                    const active = location.pathname === path;
                    const linkEl = (
                      <Link
                        key={path}
                        to={path}
                        className={cn(
                          "flex items-center rounded-xl px-2 py-2 text-sm transition-all duration-200 relative group/item",
                          collapsed ? "justify-center" : "gap-3 px-3",
                          active
                            ? "bg-primary/10 text-primary font-bold shadow-sm"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        )}
                      >
                        <div className="relative">
                          <Icon className={cn("h-5 w-5 shrink-0 transition-transform duration-200", active ? "scale-110" : "group-hover/item:scale-110")} />
                          {path === "/chat" && totalUnread > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse border-2 border-sidebar">
                              {totalUnread > 9 ? "9+" : totalUnread}
                            </span>
                          )}
                          {path === "/comunicados" && unreadAnnouncements > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center animate-bounce border-2 border-sidebar">
                              {unreadAnnouncements > 9 ? "9+" : unreadAnnouncements}
                            </span>
                          )}
                        </div>
                        {!collapsed && <span className="truncate">{label}</span>}
                        {!collapsed && active && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                      </Link>
                    );

                    if (collapsed) {
                      return (
                        <Tooltip key={path}>
                          <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
                          <TooltipContent side="right" className="font-bold">{label}</TooltipContent>
                        </Tooltip>
                      );
                    }
                    return linkEl;
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className={cn("p-3 border-t border-sidebar-border space-y-2", collapsed && "flex flex-col items-center")}>
          {/* Notifications */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={collapsed ? "icon" : "sm"}
                className={cn("transition-colors", !collapsed && "w-full justify-start")}
                onClick={handleNotificationToggle}
              >
                {notificationsEnabled
                  ? <Bell className="h-4 w-4 text-primary shrink-0" />
                  : <BellOff className="h-4 w-4 text-muted-foreground shrink-0" />
                }
                {!collapsed && (
                  <span className="ml-2 text-xs">{notificationsEnabled ? "Notificações ativas" : "Notificações off"}</span>
                )}
              </Button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Notificações: {notificationsEnabled ? "ativas" : "desativadas"}</TooltipContent>}
          </Tooltip>

          {/* Theme Toggle */}
          <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between px-1")}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-primary/5 transition-colors"
                  onClick={toggleTheme}
                >
                  {theme === "light" ? (
                    <Moon className="h-4 w-4 text-slate-700 shrink-0" />
                  ) : (
                    <Sun className="h-4 w-4 text-yellow-400 shrink-0" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Alternar Tema</TooltipContent>
            </Tooltip>
            
            {!collapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-blue-500 transition-colors"
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              >
                {notificationsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4 opacity-50" />}
              </Button>
            )}
          </div>

          {/* User + Logout */}
          {!collapsed && (
            <div className="flex items-center gap-2 px-1">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs font-medium truncate flex-1 leading-tight">
                {profile?.full_name || "Membro"}
                <br />
                <span className="text-[9px] text-muted-foreground uppercase tracking-tighter">
                  {isAdmin ? "Administrador" : isGerente ? "Gerente" : "Membro"}
                </span>
              </span>
            </div>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={collapsed ? "icon" : "sm"}
                className={cn(!collapsed && "w-full justify-start")}
                onClick={signOut}
              >
                <LogOut className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="ml-2">Sair</span>}
              </Button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Sair</TooltipContent>}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
};

export default DesktopSidebar;
