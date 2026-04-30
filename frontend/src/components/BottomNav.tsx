import { Home, Calendar, BookOpen, MessageCircle, User, ShieldCheck, Users, Settings, Target, HandHeart, BarChart3, Megaphone, Smartphone, FileSearch, Wallet } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/components/ThemeProvider";
import api from "@/lib/api";
import { VersionIndicator } from "./VersionIndicator";

interface NavItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

interface MoreMenuItem extends NavItem {
  condition?: boolean;
  colorScheme?: string;
  showBadge?: boolean;
  badgeCount?: number;
}

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

const navItems: NavItem[] = [
  { path: "/home", icon: Home, label: "Início" },
  { path: "/agenda", icon: Calendar, label: "Agenda" },
  { path: "/chat", icon: MessageCircle, label: "" },
  { path: "/devocionais", icon: BookOpen, label: "Devocional" },
  { path: "/perfil", icon: User, label: "Perfil" },
];
// intercalar cores de acordo cm quantidade seguindo padrão cyan/navy/charcoal
const moreMenuItems: MoreMenuItem[] = [
  { path: "/departamentos", icon: Target, label: "Departamentos", colorScheme: "cyan" },
  { path: "/membros", icon: Users, label: "Membros", colorScheme: "navy" },
  { path: "/voluntarios", icon: HandHeart, label: "Voluntários", colorScheme: "cyan" },
  { path: "/tesouraria", icon: Wallet, label: "Tesouraria", colorScheme: "navy" },
  { path: "/relatorios", icon: BarChart3, label: "Relatórios", colorScheme: "cyan" },
  { path: "/configuracoes", icon: Settings, label: "Ajustes", colorScheme: "navy" },
  { path: "/whatsapp", icon: WhatsAppIcon, label: "WhatsApp", colorScheme: "cyan" },
  { path: "/checkin", icon: ShieldCheck, label: "Check-in", colorScheme: "navy" },
  { path: "/Disparos", icon: Megaphone, label: "Disparos", colorScheme: "cyan", showBadge: true },
  { path: "/gestao-rotinas", icon: ShieldCheck, label: "Acessos", colorScheme: "navy" },
];

const NavItemButton = ({ path, icon: Icon, label, active, onNavigate }: { path: string; icon: NavItem['icon']; label: string; active: boolean; onNavigate?: () => void }) => (
  <Link
    to={path}
    onClick={onNavigate}
    aria-current={active ? "page" : undefined}
    className={cn(
      "flex min-w-[64px] flex-col items-center justify-center gap-1 rounded-full px-3 py-2 text-[10px] transition-all",
      active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-primary"
    )}
  >
    <div className={cn(
      "flex h-11 w-11 items-center justify-center rounded-full border transition-colors",
      active ? "border-primary bg-primary/10" : "border-transparent bg-transparent"
    )}>
      <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
    </div>
    <span className={cn(active ? "font-semibold" : "font-medium")}>{label}</span>
  </Link>
);

const MoreMenuButton = ({ item, skin, unreadAnnouncements, onClose }: { item: MoreMenuItem; skin: string; unreadAnnouncements: number; onClose: () => void }) => {
  const getColorStyles = () => {
    const schemes: Record<string, { bg: string; text: string }> = {
      cyan: { bg: "bg-brand-cyan/10 border-brand-cyan/20 group-hover:bg-brand-cyan/20", text: "text-brand-cyan dark:text-white" },
      navy: { bg: "bg-brand-navy/10 border-brand-navy/20 group-hover:bg-brand-navy/20", text: "text-brand-navy dark:text-white" },
      charcoal: { bg: "bg-brand-charcoal/10 border-brand-charcoal/20 group-hover:bg-brand-charcoal/20", text: "text-brand-charcoal dark:text-white" },
    };
    return schemes[item.colorScheme || "navy"] || schemes.navy;
  };

  const colors = getColorStyles();
  const Icon = item.icon;

  return (
    <Link to={item.path} onClick={onClose} className="group flex flex-col items-center gap-2.5 transition-transform active:scale-90">
      <div className={cn(
        "h-14 w-14 rounded-2xl flex items-center justify-center shadow-sm transition-colors relative",
        skin !== "default" ? "bg-primary/20 border border-primary/30" : `${colors.bg} dark:bg-white/10 dark:border-white/20`
      )}>
        <Icon className={cn("h-6 w-6", skin !== "default" ? "text-primary" : colors.text)} />
        {item.showBadge && unreadAnnouncements > 0 && (
          <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-blue-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-background shadow-lg">
            {unreadAnnouncements > 9 ? "9+" : unreadAnnouncements}
          </span>
        )}
      </div>
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">{item.label}</span>
    </Link>
  );
};

const BottomNav = () => {
  const location = useLocation();
  const { isAdmin, isAdminCCM, IsLider, routinePermissions, unreadAnnouncements } = useAuth();
  const { skin } = useTheme();
  const [open, setOpen] = useState(false);

  const { data: contactMessages } = useQuery({
    queryKey: ["contact-messages"],
    queryFn: async () => {
      if (!isAdmin) return [];
      const { data } = await api.get('/contact-messages');
      return data || [];
    },
    enabled: !!isAdmin
  });

  const unreadInbox = contactMessages?.some((m: any) => m.status !== "archived") || false;

  const filteredNavItems = navItems.filter((item) => {
    const routineKeyMap: Record<string, string> = {
      "/agenda": "agenda",
      "/devocionais": "devocionais",
      "/chat": "chat"
    };
    const key = routineKeyMap[item.path];
    if (key && !isAdmin && routinePermissions[key] !== true) return false;
    return true;
  });

  const hasMaisItems = Boolean(isAdmin || routinePermissions.voluntarios === true || routinePermissions.tesouraria === true);

  const isPathActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const isMaisActive = [
    "/departamentos",
    "/membros",
    "/voluntarios",
    "/tesouraria",
    "/relatorios",
    "/configuracoes",
    "/whatsapp",
    "/checkin",
    "/Disparos",
    "/gestao-rotinas",
  ].some((path) => isPathActive(path));

  const leftNav = filteredNavItems.slice(0, 2);
  const centerItem = filteredNavItems[2];
  const rightNav = filteredNavItems.slice(3);

  const getVisibleMoreMenu = () => {
    return moreMenuItems.filter(item => {
      if (item.path === "/voluntarios") return isAdmin || routinePermissions.voluntarios === true;
      if (item.path === "/tesouraria") return isAdmin || routinePermissions.tesouraria === true;
      return isAdmin;
    });
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-sm md:hidden pb-safe shadow-[0_-6px_20px_-14px_rgba(0,0,0,0.35)]">
      <div className="relative flex items-stretch justify-around py-1.5 px-1">
        {/* Left Navigation */}
        {leftNav.map(({ path, icon, label }) => (
          <NavItemButton key={path} path={path} icon={icon} label={label} active={isPathActive(path)} />
        ))}

        {/* Center Button 
        {centerItem && (
          <Link
            to={centerItem.path}
            aria-current={isPathActive(centerItem.path) ? "page" : undefined}
            className={cn(
              "absolute inset-x-1/2 -top-24 z-40 flex h-20 w-20 -translate-x-1/2 flex-col items-center justify-center gap-0.5 rounded-full bg-primary text-white shadow-[0_20px_40px_-20px_rgba(0,0,0,0.35)] transition-transform hover:-translate-y-1 active:scale-95",
              isPathActive(centerItem.path) ? "ring-4 ring-primary/20" : ""
            )}
          >
            <centerItem.icon className="h-6 w-6" />
            <span className="text-[7px] font-bold uppercase tracking-[0.1em]">{centerItem.label}</span>
          </Link>
        )}*/}

        {/* Right Navigation */}
        {rightNav.map(({ path, icon, label }) => (
          <NavItemButton key={path} path={path} icon={icon} label={label} active={isPathActive(path)} />
        ))}

        {/* More Menu */}
        {hasMaisItems && (
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex min-w-[64px] flex-col items-center justify-center gap-1 rounded-full px-3 py-2 text-[10px] transition-all outline-none relative",
                  isMaisActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-primary"
                )}
                aria-label="Mais opções"
              >
                <div className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full border transition-colors",
                  isMaisActive ? "border-primary bg-primary/10" : "border-transparent bg-transparent"
                )}>
                  <ShieldCheck className={cn("h-5 w-5", isMaisActive ? "text-primary" : "text-muted-foreground")} />
                </div>
                <span className={cn(isMaisActive ? "font-semibold" : "font-medium")}>Mais</span>
                {(unreadAnnouncements > 0 || unreadInbox) && (
                  <span className={cn(
                    "absolute top-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card animate-pulse",
                    unreadInbox ? "bg-red-500" : "bg-blue-500"
                  )} />
                )}
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[auto] max-h-[85vh] rounded-t-[2.5rem] px-6 pb-12 pt-4 border-t-0 shadow-[0_-20px_50px_-20px_rgba(0,0,0,0.3)] bg-background/95 backdrop-blur-xl">
              <div className="mx-auto w-12 h-1.5 rounded-full bg-muted/30 mb-8" />
              <SheetHeader className="mb-8">
                <SheetTitle className="text-xl font-black tracking-tight text-center">Mais Opções</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-4 gap-y-8 gap-x-4">
                {getVisibleMoreMenu().map(item => (
                  <MoreMenuButton key={item.path} item={item} skin={skin} unreadAnnouncements={unreadAnnouncements} onClose={() => setOpen(false)} />
                ))}
              </div>

              <div className="mt-12 flex justify-center border-t border-muted/20 pt-6">
                <VersionIndicator />
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </nav>
  );
};

export default BottomNav;
