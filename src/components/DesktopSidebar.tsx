import { useState } from "react";
import { Home, Calendar, BookOpen, MessageCircle, User, Users, LogOut, ChevronLeft, ChevronRight, Bell, BellOff, Shield, Settings, Sun, Moon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "./ThemeProvider";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
  { path: "/home", icon: Home, label: "Início" },
  { path: "/agenda", icon: Calendar, label: "Agenda" },
  { path: "/devocionais", icon: BookOpen, label: "Devocionais" },
  { path: "/grupos", icon: Shield, label: "Grupos", adminOnly: true },
  { path: "/membros", icon: Users, label: "Membros", adminOnly: true },
  { path: "/chat", icon: MessageCircle, label: "Chat" },
  { path: "/configuracoes", icon: Settings, label: "Configurações", adminOnly: true },
  { path: "/perfil", icon: User, label: "Perfil" },
];

const DesktopSidebar = () => {
  const location = useLocation();
  const { isAdmin, signOut, profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    typeof window !== "undefined" && Notification.permission === "granted"
  );

  const handleNotificationToggle = async () => {
    if (!notificationsEnabled) {
      const perm = await Notification.requestPermission();
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
                src={theme === "dark" ? "/idvmergulho/logo horizontal.png" : "/idvmergulho/logo horizontal azul.png"} 
                alt="Logo CC Mergulho" 
                className="h-10 w-auto object-contain" 
              />
            </>
          )}
        </div>

        {/* Toggle button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-16 h-6 w-6 rounded-full border bg-background shadow-sm z-10"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </Button>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navItems.filter(item => !('adminOnly' in item) || !item.adminOnly || isAdmin).map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path;
            const linkEl = (
              <Link
                key={path}
                to={path}
                className={cn(
                  "flex items-center rounded-lg px-2 py-2.5 text-sm transition-colors",
                  collapsed ? "justify-center" : "gap-3 px-3",
                  active
                    ? "bg-sidebar-accent text-sidebar-primary font-semibold"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={path}>
                  <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
                  <TooltipContent side="right">{label}</TooltipContent>
                </Tooltip>
              );
            }
            return linkEl;
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={collapsed ? "icon" : "sm"}
                className={cn("transition-colors", !collapsed && "w-full justify-start")}
                onClick={toggleTheme}
              >
                {theme === "light" ? (
                  <Moon className="h-4 w-4 text-slate-700 shrink-0" />
                ) : (
                  <Sun className="h-4 w-4 text-yellow-400 shrink-0" />
                )}
                {!collapsed && (
                  <span className="ml-2 text-xs">{theme === "light" ? "Tema Escuro" : "Tema Claro"}</span>
                )}
              </Button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Alternar Tema</TooltipContent>}
          </Tooltip>

          {/* User + Logout */}
          {!collapsed && (
            <div className="flex items-center gap-2 px-1">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs font-medium truncate flex-1">{profile?.full_name || "Membro"}</span>
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
