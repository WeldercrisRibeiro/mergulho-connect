import { Menu, Sun, Moon, Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "./ThemeProvider";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface TopBarProps {
  onToggleSidebar: () => void;
}

const TopBar = ({ onToggleSidebar }: TopBarProps) => {
  const { isAdmin, isAdminCCM, isGerente, profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [notifEnabled, setNotifEnabled] = useState(
    typeof window !== "undefined" && "Notification" in window && (window as any).Notification.permission === "granted" && localStorage.getItem("notify_enabled") === "true"
  );

  const handleNotifToggle = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (!notifEnabled) {
      const perm = await (window as any).Notification.requestPermission();
      if (perm === "granted") {
        setNotifEnabled(true);
        localStorage.setItem("notify_enabled", "true");
      }
    } else {
      setNotifEnabled(false);
      localStorage.setItem("notify_enabled", "false");
    }
  };

  const roleLabel = isAdminCCM
    ? "ADM CCM"
    : isAdmin
    ? "Admin"
    : isGerente
    ? "Gerente"
    : "Membro";

  const roleBgClass = isAdminCCM
    ? "bg-gradient-to-r from-amber-500/20 to-yellow-400/20 text-amber-700 dark:text-amber-400 border-amber-400/40 shadow-sm shadow-amber-200/30"
    : isAdmin
    ? "bg-primary/10 text-primary border-primary/20"
    : isGerente
    ? "bg-blue-500/10 text-blue-600 border-blue-300/30"
    : "bg-muted text-muted-foreground border-border";

  const avatarUrl = profile?.avatarUrl;
  const initials = (profile?.fullName || "M").charAt(0).toUpperCase();
  const pageTitleMap: Record<string, string> = {
    "/home": "Início",
    "/agenda": "Agenda",
    "/devocionais": "Devocionais",
    "/chat": "Chat",
    "/perfil": "Perfil",
    "/membros": "Membros",
    "/departamentos": "Departamentos",
    "/voluntarios": "Voluntários",
    "/tesouraria": "Tesouraria",
    "/relatorios": "Relatórios",
    "/configuracoes": "Ajustes",
  };
  const currentPageTitle =
    pageTitleMap[location.pathname] ||
    Object.entries(pageTitleMap).find(([path]) => location.pathname.startsWith(`${path}/`))?.[1] ||
    "Comunidade";

  return (
    <header className="sticky top-0 z-40 h-14 border-b bg-sidebar/95 backdrop-blur-sm flex items-center px-3 gap-2 shadow-sm">
      {/* Left: hamburger + optional whatsapp shortcut */}
      <div className="hidden md:flex">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors"
          onClick={onToggleSidebar}
          aria-label="Alternar menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      <div className="min-w-0 md:hidden">
        <p className="text-xs font-semibold text-sidebar-foreground/85 truncate">{currentPageTitle}</p>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right section */}
      <div className="flex items-center gap-1">
        {/* Role badge */}
        <span
          className={cn(
            "hidden sm:inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border",
            roleBgClass
          )}
        >
          {roleLabel}
        </span>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
          onClick={toggleTheme}
          aria-label="Alternar tema"
        >
          {theme === "light" ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4 text-yellow-400" />
          )}
        </Button>

        {/* Notification bell */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
          onClick={handleNotifToggle}
          aria-label="Notificações"
        >
          {notifEnabled ? (
            <Bell className="h-4 w-4 text-primary" />
          ) : (
            <BellOff className="h-4 w-4 opacity-50" />
          )}
        </Button>

        {/* User avatar + name */}
        <Link
          to="/perfil"
          className="flex items-center gap-2 ml-1 pl-2 border-l border-sidebar-border hover:opacity-80 transition-opacity"
        >
          <div className={cn(
            "h-8 w-8 rounded-full overflow-hidden flex items-center justify-center shrink-0 ring-2",
            isAdminCCM
              ? "bg-gradient-to-br from-amber-400/20 to-yellow-500/20 ring-amber-400/50"
              : "bg-primary/10 ring-primary/20"
          )}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={profile?.fullName || "Avatar"}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-primary">{initials}</span>
            )}
          </div>
          <div className="flex flex-col items-start leading-none gap-0.5 max-w-[120px]">
            <span className="hidden sm:block text-xs font-bold text-sidebar-foreground truncate w-full">
              {profile?.fullName}
            </span>
            {profile?.username && (
              <span className="hidden sm:block text-[9px] text-muted-foreground truncate w-full font-medium">
                {profile.username.toLowerCase()}@ccmergulho.com
              </span>
            )}
          </div>
        </Link>
      </div>
    </header>
  );
};

export default TopBar;
