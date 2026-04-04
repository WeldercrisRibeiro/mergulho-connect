import { Home, Calendar, BookOpen, MessageCircle, User, ShieldCheck, Users, Settings, Target } from "lucide-react";
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
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-sm md:hidden pb-safe">
      <div className="flex items-center justify-around py-2 px-1">
        {navItems.map(({ path, icon: Icon, label }) => {
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
        {isAdmin && (
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2 py-1 text-xs transition-colors",
                  "text-muted-foreground outline-none"
                )}
              >
                <ShieldCheck className="h-5 w-5" />
                <span className="font-medium truncate">Painel</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[45vh] rounded-t-2xl px-4 py-6 text-center">
              <SheetHeader className="mb-6">
                <SheetTitle className="text-center">Administração</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-3 gap-y-6 gap-x-2">
                <Link to="/departamentos" onClick={() => setOpen(false)} className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary">
                  <div className="h-12 w-12 rounded-2xl bg-secondary/50 flex items-center justify-center">
                    <Target className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-semibold">Departamentos</span>
                </Link>
                <Link to="/membros" onClick={() => setOpen(false)} className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary">
                  <div className="h-12 w-12 rounded-2xl bg-secondary/50 flex items-center justify-center">
                    <Users className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-semibold">Membros</span>
                </Link>
                <Link to="/configuracoes" onClick={() => setOpen(false)} className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary">
                  <div className="h-12 w-12 rounded-2xl bg-secondary/50 flex items-center justify-center">
                    <Settings className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-semibold">Ajustes</span>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </nav>
  );
};

export default BottomNav;
