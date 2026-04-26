import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Home, Calendar, BookOpen, MessageCircle, User, Users, LogOut, Shield, ShieldCheck, Settings, HandHeart, BarChart3, Megaphone, Smartphone, FileSearch, Wallet, Inbox } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "./ThemeProvider";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import api from "@/lib/api";

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
        { path: "/tesouraria", icon: Wallet, label: "Tesouraria", routine: "tesouraria" },
        { path: "/voluntarios", icon: HandHeart, label: "Voluntários", routine: "voluntarios" },
        { path: "/checkin-kids", icon: ShieldCheck, label: "Validação", routine: "kids" },
      ]
    },
    {
      label: "Comunicação",
      items: [

        { path: "/chat", icon: MessageCircle, label: "Chat", routine: "chat" },
        { path: "/Disparos", icon: Megaphone, label: "Disparos", routine: "Disparos" },
      ]
    },
    {
      label: "Administração",
      items: [
        { path: "/membros", icon: Users, label: "Membros", adminOnly: true },
        { path: "/departamentos", icon: Shield, label: "Departamentos", adminOnly: true },
        { path: "/relatorios", icon: BarChart3, label: "Relatórios", adminOnly: true, routine: "relatorios" },
        { path: "/whatsapp", icon: Smartphone, label: "WhatsApp", adminOnly: true },
        { path: "/configuracoes", icon: Settings, label: "Ajustes", adminOnly: true },
      ]
    }
  ];

interface DesktopSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const DesktopSidebar = ({ collapsed = false, onToggle }: DesktopSidebarProps) => {
  const location = useLocation();
  const { isAdmin, isAdminCCM, isGerente, signOut, profile, user, routinePermissions, unreadAnnouncements } = useAuth();
  const { theme } = useTheme();
  const [totalUnread, setTotalUnread] = useState(0);

  // Poll for unread counts from localStorage + messages
  useEffect(() => {
    if (!user) return;
    const check = async () => {
      try {
        const LS_READ_KEY = "chat_read_timestamps";
        const readTs: Record<string, string> = JSON.parse(localStorage.getItem(LS_READ_KEY) || "{}");

        // Only fetch if user.id is a real UUID
        const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!user.id || !UUID_RE.test(user.id)) return;

        // Check direct messages & group messages locally using API
        const { data: allMsgs } = await api.get(`/messages/user/${user.id}`);
        const msgs = allMsgs || [];

        const directUnread = new Set<string>();
        const groupUnreadSet = new Set<string>();
        
        msgs.forEach((m: any) => {
          if (m.senderId === user.id) return;
          
          if (!m.groupId && m.recipientId === user.id) {
            const lastRead = readTs[m.senderId];
            if (!lastRead || new Date(m.createdAt) > new Date(lastRead)) {
              directUnread.add(m.senderId);
            }
          }
          else if (m.groupId) {
             // In a perfect system, DesktopSidebar should know user's groupIds.
             // We'll just assume they fetch them or we check if the msg was read:
            const lastRead = readTs[m.groupId];
            if (!lastRead || new Date(m.createdAt) > new Date(lastRead)) {
               groupUnreadSet.add(m.groupId);
            }
          }
        });

        // Simulating the group Unread count
        setTotalUnread(directUnread.size + groupUnreadSet.size);
      } catch (_) { }
    };

    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const { data: contactMessages } = useQuery({
    queryKey: ["contact-messages"],
    queryFn: async () => {
      if (!isAdmin) return [];
      const { data } = await api.get('/contact-messages');
      return data || [];
    },
    enabled: !!user && isAdmin
  });

  const unreadInbox = contactMessages?.some((m: any) => m.status !== "archived") || false;

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

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-6 overflow-y-auto custom-scrollbar">
          {navGroups.map((group) => {
            const filteredItems = group.items.filter(item => {
              if (item.adminOnly && !isAdmin) return false;
              
              // Se tem routine key e não é admin: exige permissão explícita (true)
              if (item.routine && !isAdmin) {
                if (routinePermissions[item.routine] !== true) return false;
              }
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
                          {path === "/Disparos" && unreadAnnouncements > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center animate-bounce border-2 border-sidebar">
                              {unreadAnnouncements > 9 ? "9+" : unreadAnnouncements}
                            </span>
                          )}
                          {path === "/configuracoes" && unreadInbox && (
                            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-sidebar animate-pulse" />
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

        {/* Bottom: Sign Out */}
        <div className={cn("p-3 border-t border-sidebar-border", collapsed && "flex flex-col items-center")}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={collapsed ? "icon" : "sm"}
                className={cn("text-muted-foreground hover:text-destructive transition-colors", !collapsed && "w-full justify-start")}
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
