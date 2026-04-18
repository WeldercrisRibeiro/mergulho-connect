import { ReactNode, useEffect, useState } from "react";
import BottomNav from "./BottomNav";
import DesktopSidebar from "./DesktopSidebar";
import TopBar from "./TopBar";
import DevotionalWelcome from "./DevotionalWelcome";
import { PwaPrompt } from "./PwaPrompt";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const AppLayout = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Removed Supabase Realtime for Messages and Checkins.
    // In NestJS, this should be handled via Server-Sent Events (SSE) or a Polling interval.
    let lastChecked = new Date().toISOString();

    const pollInterval = setInterval(async () => {
      try {
        // Poll Checkins
        const { data: checkins } = await api.get('/kids-checkins', { params: { status: 'active' } });
        const myCheckin = checkins?.find((c: any) => c.guardian_id === user.id && c.call_requested);
        if (myCheckin) {
           // We would need to track if we already alerted, but skipping for simplicity
        }
      } catch (e) {
        // ignore
      }
    }, 60000);

    return () => clearInterval(pollInterval);
  }, [user, toast]);

  return (
    <div className="flex min-h-screen">
      <DesktopSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(c => !c)} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onToggleSidebar={() => setSidebarCollapsed(c => !c)} />
        <main className="flex-1 pb-20 md:pb-0 relative overflow-auto">
          {children}
          <PwaPrompt />
        </main>
      </div>
      <BottomNav />
      <DevotionalWelcome />
    </div>
  );
};

export default AppLayout;
