import { Home, Calendar, BookOpen, MessageCircle, User, ShieldCheck, Users, Settings, Target, HandHeart, BarChart3, Megaphone, Smartphone, FileSearch, Wallet } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { useTheme } from "@/components/ThemeProvider";

const navItems = [
  { path: "/home", icon: Home, label: "Início" },
  { path: "/agenda", icon: Calendar, label: "Agenda" },
  { path: "/devocionais", icon: BookOpen, label: "Devocionais" },
  { path: "/chat", icon: MessageCircle, label: "Chat" },
  { path: "/perfil", icon: User, label: "Perfil" },
];

const BottomNav = () => {
  const location = useLocation();
  const { isAdmin, isAdminCCM, isGerente, isVisitor, routinePermissions, unreadAnnouncements } = useAuth();
  const { skin } = useTheme();
  const [open, setOpen] = useState(false);

  const filteredNavItems = navItems.filter(item => {
    if (isVisitor) {
      return ["/home", "/agenda", "/devocionais", "/perfil"].includes(item.path);
    }
    const routineKeyMap: Record<string, string> = {
      "/agenda": "agenda",
      "/devocionais": "devocionais",
      "/chat": "chat"
    };
    const key = routineKeyMap[item.path];
    if (key && !isAdmin && routinePermissions[key] === false) return false;
      return true;
    });

  const hasMaisItems = Boolean(isAdmin || routinePermissions.voluntarios === true || routinePermissions.tesouraria === true);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-sm md:hidden pb-safe">
      <div className="flex items-center justify-around py-2 px-1">
        {filteredNavItems.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
              <span className={cn(active ? "font-semibold" : "font-medium")}>{label}</span>
            </Link>
          );
        })}
        {hasMaisItems && (
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2 py-1 text-xs transition-colors",
                  "text-muted-foreground outline-none"
                )}
              >
                <div className="relative">
                  <ShieldCheck className="h-5 w-5" />
                  {unreadAnnouncements > 0 && (
                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-blue-500 border-2 border-card animate-pulse" />
                  )}
                </div>
                <span className="font-medium truncate">Mais</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[auto] max-h-[85vh] rounded-t-[2.5rem] px-6 pb-12 pt-4 border-t-0 shadow-[0_-20px_50px_-20px_rgba(0,0,0,0.3)] bg-background/95 backdrop-blur-xl">
              <div className="mx-auto w-12 h-1.5 rounded-full bg-muted/30 mb-8" />
              <SheetHeader className="mb-8">
                <SheetTitle className="text-xl font-black tracking-tight text-center">Mais Opções</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-4 gap-y-8 gap-x-4">
                {isAdmin && (
                  <Link to="/departamentos" onClick={() => setOpen(false)} className="group flex flex-col items-center gap-2.5 transition-transform active:scale-90">
                    <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shadow-sm transition-colors", 
                      skin !== "default" ? "bg-primary/20 border border-primary/30" : "bg-brand-cyan/10 border border-brand-cyan/20 group-hover:bg-brand-cyan/20 dark:bg-white/10 dark:border-white/20 dark:group-hover:bg-white/20")}>
                      <Target className={cn("h-6 w-6", skin !== "default" ? "text-primary" : "text-brand-cyan dark:text-white")} />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Setores</span>
                  </Link>
                )}
                {isAdmin && (
                  <Link to="/membros" onClick={() => setOpen(false)} className="group flex flex-col items-center gap-2.5 transition-transform active:scale-90">
                    <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shadow-sm transition-colors", 
                      skin !== "default" ? "bg-primary/20 border border-primary/30" : "bg-brand-navy/10 border border-brand-navy/20 group-hover:bg-brand-navy/20 dark:bg-white/10 dark:border-white/20 dark:group-hover:bg-white/20")}>
                      <Users className={cn("h-6 w-6", skin !== "default" ? "text-primary" : "text-brand-navy dark:text-white")} />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Membros</span>
                  </Link>
                )}
                {(isAdmin || routinePermissions.voluntarios === true) && (
                  <Link to="/voluntarios" onClick={() => setOpen(false)} className="group flex flex-col items-center gap-2.5 transition-transform active:scale-90">
                    <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shadow-sm transition-colors", 
                      skin !== "default" ? "bg-primary/20 border border-primary/30" : "bg-brand-charcoal/10 border border-brand-charcoal/20 group-hover:bg-brand-charcoal/20 dark:bg-white/10 dark:border-white/20 dark:group-hover:bg-white/20")}>
                      <HandHeart className={cn("h-6 w-6", skin !== "default" ? "text-primary" : "text-brand-charcoal dark:text-white")} />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Voluntários</span>
                  </Link>
                )}
                {(isAdmin || routinePermissions.tesouraria === true) && (
                  <Link to="/tesouraria" onClick={() => setOpen(false)} className="group flex flex-col items-center gap-2.5 transition-transform active:scale-90">
                    <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shadow-sm transition-colors", 
                      skin !== "default" ? "bg-brand-cyan/10 border border-brand-cyan/20 group-hover:bg-brand-cyan/20 dark:bg-white/10 dark:border-white/20 dark:group-hover:bg-white/20" : "bg-primary/20 border border-primary/30")}>
                      <Wallet className={cn("h-6 w-6", skin !== "default" ? "text-primary dark:text-white" : "text-brand-cyan dark:text-white")} />
                    </div>
                    <span className={cn("text-[10px] font-extrabold uppercase tracking-tight", skin !== "default" ? "text-primary dark:text-white" : "text-brand-cyan dark:text-white")}>Tesouraria</span>
                  </Link>
                )}
                {isAdmin && (
                  <Link to="/relatorios" onClick={() => setOpen(false)} className="group flex flex-col items-center gap-2.5 transition-transform active:scale-90">
                    <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shadow-sm transition-colors", 
                      skin !== "default" ? "bg-primary/20 border border-primary/30" : "bg-brand-navy/10 border border-brand-navy/20 group-hover:bg-brand-navy/20 dark:bg-white/10 dark:border-white/20 dark:group-hover:bg-white/20")}>
                      <BarChart3 className={cn("h-6 w-6", skin !== "default" ? "text-primary" : "text-brand-navy dark:text-white")} />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Relatórios</span>
                  </Link>
                )}
                {isAdmin && (
                  <Link to="/configuracoes" onClick={() => setOpen(false)} className="group flex flex-col items-center gap-2.5 transition-transform active:scale-90">
                    <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shadow-sm transition-colors", 
                      skin !== "default" ? "bg-primary/20 border border-primary/30" : "bg-brand-charcoal/10 border border-brand-charcoal/20 group-hover:bg-brand-charcoal/20 dark:bg-white/10 dark:border-white/20 dark:group-hover:bg-white/20")}>
                      <Settings className={cn("h-6 w-6", skin !== "default" ? "text-primary" : "text-brand-charcoal dark:text-white")} />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Ajustes</span>
                  </Link>
                )}
                {isAdmin && (
                  <Link to="/whatsapp" onClick={() => setOpen(false)} className="group flex flex-col items-center gap-2.5 transition-transform active:scale-90">
                    <div className="h-14 w-14 rounded-2xl bg-brand-charcoal/10 border border-brand-charcoal/20 flex items-center justify-center shadow-sm group-hover:bg-brand-charcoal/20 dark:bg-white/10 dark:border-white/20 dark:group-hover:bg-white/20 transition-colors">
                      <Smartphone className="h-6 w-6 text-brand-charcoal dark:text-white" />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">WhatsApp</span>
                  </Link>
                )}
                {isAdmin && (
                  <Link to="/checkin-kids" onClick={() => setOpen(false)} className="group flex flex-col items-center gap-2.5 transition-transform active:scale-90">
                    <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shadow-sm transition-colors", 
                      skin !== "default" ? "bg-primary/20 border border-primary/30" : "bg-brand-navy/10 border border-brand-navy/20 group-hover:bg-brand-navy/20 dark:bg-white/10 dark:border-white/20 dark:group-hover:bg-white/20")}>
                      <ShieldCheck className={cn("h-6 w-6", skin !== "default" ? "text-primary" : "text-brand-navy dark:text-white")} />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Validação</span>
                  </Link>
                )}
                {isAdmin && (
                  <Link to="/Disparos" onClick={() => setOpen(false)} className="group flex flex-col items-center gap-2.5 transition-transform active:scale-90">
                    <div className="h-14 w-14 rounded-2xl bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center relative shadow-sm group-hover:bg-brand-cyan/20 dark:bg-white/10 dark:border-white/20 dark:group-hover:bg-white/20 transition-colors">
                      <Megaphone className="h-6 w-6 text-brand-cyan dark:text-white" />
                      {unreadAnnouncements > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-blue-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-background shadow-lg">
                          {unreadAnnouncements > 9 ? "9+" : unreadAnnouncements}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Disparos</span>
                  </Link>
                )}

                {isAdmin && (
                  <Link to="/gestao-rotinas" onClick={() => setOpen(false)} className="group flex flex-col items-center gap-2.5 transition-transform active:scale-90">
                    <div className="h-14 w-14 rounded-2xl bg-brand-charcoal/10 border border-brand-charcoal/20 flex items-center justify-center shadow-sm group-hover:bg-brand-charcoal/20 dark:bg-white/10 dark:border-white/20 dark:group-hover:bg-white/20 transition-colors">
                      <ShieldCheck className="h-6 w-6 text-brand-charcoal dark:text-white" />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Acessos</span>
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </nav>
  );
};

export default BottomNav;
