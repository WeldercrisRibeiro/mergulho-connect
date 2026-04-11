import { ReactNode, useEffect, useState } from "react";
import BottomNav from "./BottomNav";
import DesktopSidebar from "./DesktopSidebar";
import TopBar from "./TopBar";
import DevotionalWelcome from "./DevotionalWelcome";
import { PwaPrompt } from "./PwaPrompt";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AppLayout = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("global-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, async (payload) => {
        const msg = payload.new as any;
        if (msg.sender_id === user.id) return;

        let shouldNotify = false;

        if (msg.recipient_id === user.id) {
          shouldNotify = true;
        } else if (msg.group_id) {
          const { count } = await supabase
            .from("member_groups")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("group_id", msg.group_id);
          if (count && count > 0) shouldNotify = true;
        }

        if (shouldNotify && !window.location.pathname.includes("/chat")) {
          const { data: sender } = await supabase.from("profiles").select("full_name").eq("user_id", msg.sender_id).single();
          const title = `Nova mensagem de ${sender?.full_name || "Membro"}`;
          const description = msg.content.substring(0, 50) + (msg.content.length > 50 ? "..." : "");
          
          toast({
            title,
            description,
          });

          // Dispara notificação nativa se autorizado
          if (typeof window !== "undefined" && "Notification" in window && (window as any).Notification.permission === "granted") {
            new (window as any).Notification(title, {
              body: description,
              icon: "/idvmergulho/logo.png"
            });
          }
        }
      })
      .subscribe();

    // Global listener for kids checkin calls
    const checkinChannel = supabase
      .channel("kids-checkin-calls")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "kids_checkins" }, (payload) => {
        const checkin = payload.new as any;
        if (checkin.guardian_id === user.id && checkin.call_requested && !payload.old.call_requested) {
          const title = "⚠️ CHAMADA URGENTE: Kids";
          const description = `Favor comparecer ao Kids/Volumes para auxiliar com ${(checkin.child_name || "seu item").toUpperCase()}.`;
          
          toast({
            title,
            description,
            variant: "destructive",
            duration: 10000,
          });

          if (typeof window !== "undefined" && "Notification" in window && (window as any).Notification.permission === "granted") {
            new (window as any).Notification(title, {
              body: description,
              icon: "/idvmergulho/logo.png"
            });
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(checkinChannel);
    };
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
