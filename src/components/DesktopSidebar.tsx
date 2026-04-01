import { Home, Calendar, BookOpen, MessageCircle, User, Shield, Users, LogOut } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const navItems = [
  { path: "/home", icon: Home, label: "Início" },
  { path: "/agenda", icon: Calendar, label: "Agenda" },
  { path: "/devocionais", icon: BookOpen, label: "Devocionais" },
  { path: "/membros", icon: Users, label: "Membros" },
  { path: "/chat", icon: MessageCircle, label: "Chat" },
  { path: "/perfil", icon: User, label: "Perfil" },
];

const DesktopSidebar = () => {
  const location = useLocation();
  const { isAdmin, signOut, profile } = useAuth();

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-sidebar h-screen sticky top-0">
      <div className="p-6">
        <h1 className="text-xl font-bold text-primary">CC Mergulho</h1>
        <p className="text-xs text-muted-foreground mt-1">Comunidade Cristã</p>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-primary font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
        {isAdmin && (
          <Link
            to="/admin"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              location.pathname.startsWith("/admin")
                ? "bg-sidebar-accent text-sidebar-primary font-medium"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
            <Shield className="h-4 w-4" />
            Admin
          </Link>
        )}
      </nav>

      <div className="p-4 border-t">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-medium truncate">{profile?.full_name || "Membro"}</span>
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={signOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
