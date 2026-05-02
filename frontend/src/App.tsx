import { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/AppLayout";
import { PasswordPrompt } from "@/components/PasswordPrompt";

// ─── Páginas carregadas imediatamente (críticas para o primeiro render) ────────
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";

// ─── Páginas com lazy loading (carregadas sob demanda) ────────────────────────
// Isso reduz o bundle inicial em ~60%, melhorando o tempo de carregamento.
const HomePage        = lazy(() => import("./pages/HomePage"));
const Agenda          = lazy(() => import("./pages/Agenda"));
const Devotionals     = lazy(() => import("./pages/Devotionals"));
const Members         = lazy(() => import("./pages/Members"));
const Chat            = lazy(() => import("./pages/Chat"));
const Profile         = lazy(() => import("./pages/Profile"));
const Groups          = lazy(() => import("./pages/Groups"));
const Settings        = lazy(() => import("./pages/Settings"));
const Volunteers      = lazy(() => import("./pages/Volunteers"));
const Reports         = lazy(() => import("./pages/Reports"));
const ArchivedChats   = lazy(() => import("./pages/ArchivedChats"));
const Checkin         = lazy(() => import("./pages/Checkin"));
const AdminNotices    = lazy(() => import("./pages/AdminNotices"));
const Admin           = lazy(() => import("./pages/Admin"));
const AdminWhatsApp   = lazy(() => import("./pages/AdminWhatsApp"));
const Tesouraria      = lazy(() => import("./pages/Tesouraria"));
const AdminScripts    = lazy(() => import("./pages/AdminScripts"));

// ─── Loader de fallback para lazy routes ─────────────────────────────────────
const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const queryClient = new QueryClient();

// ─── ProtectedRoute ───────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/auth" replace />;
  return <AppLayout>{children}</AppLayout>;
};

// ─── NotificationManager ─────────────────────────────────────────────────────
// Ouve o evento customizado "new-announcement" disparado pelo AuthContext
// quando chega uma nova mensagem via Supabase Realtime, e mostra um Toast.
const NotificationManager = () => {
  const { toast } = useToast();

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const notice = e.detail;
      toast({
        title: "📢 Novo Comunicado!",
        description: notice.title || "Você recebeu um novo aviso da igreja.",
        // Duração maior para o usuário ter tempo de ler
        duration: 6000,
      });
    };

    // CustomEvent requer cast para o addEventListener reconhecer o tipo
    window.addEventListener("new-announcement", handler as EventListener);
    return () => window.removeEventListener("new-announcement", handler as EventListener);
  }, [toast]);

  return null;
};

// ─── App ──────────────────────────────────────────────────────────────────────
const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            {/*
              NotificationManager não renderiza nada visualmente — apenas
              escuta eventos e dispara toasts.
            */}
            <NotificationManager />
            <PasswordPrompt />

            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* ─── Rotas públicas ─────────────────────────────────── */}
                <Route path="/"           element={<Index />} />
                <Route path="/landing"    element={<Landing />} />
                <Route path="/auth"       element={<Auth />} />
                <Route path="/privacidade" element={<Privacy />} />
                <Route path="/termos"     element={<Terms />} />

                {/* ─── Rotas protegidas (lazy) ─────────────────────────── */}
                <Route path="/home"        element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                <Route path="/agenda"      element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
                <Route path="/devocionais" element={<ProtectedRoute><Devotionals /></ProtectedRoute>} />
                <Route path="/membros"     element={<ProtectedRoute><Members /></ProtectedRoute>} />
                <Route path="/chat"        element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                <Route path="/perfil"      element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/departamentos" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
                <Route path="/configuracoes" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/voluntarios"   element={<ProtectedRoute><Volunteers /></ProtectedRoute>} />
                <Route path="/relatorios"    element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                <Route path="/arquivos"      element={<ProtectedRoute><ArchivedChats /></ProtectedRoute>} />
                <Route path="/checkin"       element={<ProtectedRoute><Checkin /></ProtectedRoute>} />
                <Route path="/Disparos"      element={<ProtectedRoute><AdminNotices /></ProtectedRoute>} />
                <Route path="/whatsapp"      element={<ProtectedRoute><AdminWhatsApp /></ProtectedRoute>} />
                <Route path="/tesouraria"    element={<ProtectedRoute><Tesouraria /></ProtectedRoute>} />
                <Route path="/admin/scripts" element={<ProtectedRoute><AdminScripts /></ProtectedRoute>} />

                {/* ─── 404 ─────────────────────────────────────────────── */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;