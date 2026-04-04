import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/AppLayout";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import HomePage from "./pages/HomePage";
import Agenda from "./pages/Agenda";
import Devotionals from "./pages/Devotionals";
import Members from "./pages/Members";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import Groups from "./pages/Groups";
import Settings from "./pages/Settings";
import Volunteers from "./pages/Volunteers";
import Reports from "./pages/Reports";
import ArchivedChats from "./pages/ArchivedChats";
import KidsCheckin from "./pages/KidsCheckin";
import AdminNotices from "./pages/AdminNotices";
import GroupPermissions from "./pages/GroupPermissions";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
  if (!user) return <Navigate to="/auth" replace />;
  return <AppLayout>{children}</AppLayout>;
};

const NotificationManager = () => {
  const { toast } = useToast();
  
  useEffect(() => {
    const handler = (e: any) => {
      const notice = e.detail;
      toast({
        title: "Novo Comunicado!",
        description: notice.title || "Você recebeu um novo aviso da igreja.",
      });
    };
    window.addEventListener('new-announcement', handler);
    return () => window.removeEventListener('new-announcement', handler);
  }, [toast]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <NotificationManager />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/landing" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
              <Route path="/agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
              <Route path="/devocionais" element={<ProtectedRoute><Devotionals /></ProtectedRoute>} />
              <Route path="/membros" element={<ProtectedRoute><Members /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
              <Route path="/perfil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/departamentos" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
              <Route path="/configuracoes" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/voluntarios" element={<ProtectedRoute><Volunteers /></ProtectedRoute>} />
              <Route path="/relatorios" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="/arquivos" element={<ProtectedRoute><ArchivedChats /></ProtectedRoute>} />
              <Route path="/checkin-kids" element={<ProtectedRoute><KidsCheckin /></ProtectedRoute>} />
              <Route path="/comunicados" element={<ProtectedRoute><AdminNotices /></ProtectedRoute>} />
              <Route path="/gestao-rotinas" element={<ProtectedRoute><GroupPermissions /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
