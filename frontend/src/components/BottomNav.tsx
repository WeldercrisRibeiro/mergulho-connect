import { Home, Calendar, BookOpen, MessageCircle, User, ShieldCheck, Users, Settings, Target, HandHeart, BarChart3, Megaphone, Smartphone, FileSearch } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const navItems = [
  { path: "/home", icon: Home, label: "Início" },
  { path: "/agenda", icon: Calendar, label: "Agenda" },
  { path: "/devocionais", icon: BookOpen, label: "Devocionais" },
  { path: "/chat", icon: MessageCircle, label: "Chat" },
  { path: "/perfil", icon: User, label: "Perfil" },
];

const BottomNav = () => {
  const location = useLocation();
  const { isAdmin, isGerente, isVisitor, routinePermissions, unreadAnnouncements } = useAuth();
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
          <SheetContent side="bottom" className="h-[45vh] rounded-t-2xl px-4 py-6 text-center">
            <SheetHeader className="mb-6">
              <SheetTitle className="text-center">Mais Opções</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-4 gap-y-6 gap-x-2">
              {isAdmin && (
                <Link to="/departamentos" onClick={() => setOpen(false)} className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary">
                  <div className="h-10 w-10 rounded-xl bg-secondary/50 flex items-center justify-center">
                    <Target className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-semibold">Departamentos</span>
                </Link>
              )}
              {isAdmin && (
                <Link to="/membros" onClick={() => setOpen(false)} className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary">
                  <div className="h-10 w-10 rounded-xl bg-secondary/50 flex items-center justify-center">
                    <Users className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-semibold">Membros</span>
                </Link>
              )}
              {(isAdmin || routinePermissions.voluntarios === true) && (
                <Link to="/voluntarios" onClick={() => setOpen(false)} className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary">
                  <div className="h-10 w-10 rounded-xl bg-secondary/50 flex items-center justify-center">
                    <HandHeart className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-semibold">Voluntários</span>
                </Link>
              )}
              {isAdmin && (
                <Link to="/relatorios" onClick={() => setOpen(false)} className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary">
                  <div className="h-10 w-10 rounded-xl bg-secondary/50 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-semibold">Relatórios</span>
                </Link>
              )}
              {isAdmin && (
                <Link to="/configuracoes" onClick={() => setOpen(false)} className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary">
                  <div className="h-10 w-10 rounded-xl bg-secondary/50 flex items-center justify-center">
                    <Settings className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-semibold">Ajustes</span>
                </Link>
              )}
              {isAdmin && (
                <Link to="/whatsapp" onClick={() => setOpen(false)} className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary">
                  <div className="h-10 w-10 rounded-xl bg-secondary/50 flex items-center justify-center">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-semibold">WhatsApp</span>
                </Link>
              )}
              {isAdmin && (
                <Link to="/checkin-kids" onClick={() => setOpen(false)} className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary">
                  <div className="h-10 w-10 rounded-xl bg-secondary/50 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-semibold">Validação</span>
                </Link>
              )}
              {isAdmin && (
                <Link to="/Disparos" onClick={() => setOpen(false)} className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary">
                  <div className="h-10 w-10 rounded-xl bg-secondary/50 flex items-center justify-center relative">
                    <Megaphone className="h-5 w-5" />
                    {unreadAnnouncements > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-blue-500 text-white text-[8px] font-bold flex items-center justify-center border-2 border-background">
                        {unreadAnnouncements > 9 ? "9" : unreadAnnouncements}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold">Disparos</span>
                </Link>
              )}
              {isAdmin && (
                <Link to="/auditoria" onClick={() => setOpen(false)} className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <FileSearch className="h-5 w-5 text-amber-600" />
                  </div>
                  <span className="text-[10px] font-semibold">Auditoria</span>
                </Link>
              )}
              {isAdmin && (
                <Link to="/gestao-rotinas" onClick={() => setOpen(false)} className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-[10px] font-semibold text-primary">Sistema</span>
                </Link>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};

export default BottomNav;
