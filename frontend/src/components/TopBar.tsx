import {
  Home, Calendar, BookOpen, MessageCircle, User, Users,
  Settings, Target, HandHeart, BarChart3, Megaphone,
  ShieldCheck, Wallet, Menu, Sun, Moon, Bell, BellOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "./ThemeProvider";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn, getUploadUrl } from "@/lib/utils";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

interface TopBarProps {
  onToggleSidebar: () => void;
}

const TopBar = ({ onToggleSidebar }: TopBarProps) => {
  const { isAdmin, isAdminCCM, IsLider, profile } = useAuth();
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
      : IsLider
        ? "Líder"
        : "Membro";

  const roleBgClass = isAdminCCM
    ? "bg-gradient-to-r from-amber-500/20 to-yellow-400/20 text-amber-700 dark:text-amber-400 border-amber-400/40 shadow-sm shadow-amber-200/30"
    : isAdmin
      ? "bg-primary/10 text-primary border-primary/20"
      : IsLider
        ? "bg-blue-500/10 text-blue-600 border-blue-300/30"
        : "bg-muted text-muted-foreground border-border";

  const avatarUrl = getUploadUrl(profile?.avatarUrl);
  const initials = (profile?.fullName || "M").charAt(0).toUpperCase();
  const pageConfig: Record<string, { label: string; icon: any }> = {
    "/home": { label: "Início", icon: Home },
    "/agenda": { label: "Agenda", icon: Calendar },
    "/devocionais": { label: "Devocionais", icon: BookOpen },
    "/chat": { label: "Chat", icon: MessageCircle },
    "/perfil": { label: "Perfil", icon: User },
    "/membros": { label: "Membros", icon: Users },
    "/departamentos": { label: "Departamentos", icon: Target },
    "/voluntarios": { label: "Voluntários", icon: HandHeart },
    "/tesouraria": { label: "Tesouraria", icon: Wallet },
    "/relatorios": { label: "Relatórios", icon: BarChart3 },
    "/configuracoes": { label: "Ajustes", icon: Settings },
    "/whatsapp": { label: "WhatsApp", icon: WhatsAppIcon },
    "/checkin": { label: "Validação", icon: ShieldCheck },
    "/Disparos": { label: "Disparos", icon: Megaphone },

  };

  const config =
    pageConfig[location.pathname] ||
    Object.entries(pageConfig).find(([path]) => location.pathname.startsWith(`${path}/`))?.[1] ||
    { label: "Comunidade", icon: Users };

  const Icon = config.icon;

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
      <div className="min-w-0 flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary shrink-0" />
        <p className="text-sm md:text-base font-bold text-sidebar-foreground/90 truncate">{config.label}</p>
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
              <span className="text-[10px] font-extrabold text-primary leading-none text-center">{initials}</span>
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
