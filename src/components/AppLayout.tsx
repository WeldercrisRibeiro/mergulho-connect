import { ReactNode, useEffect } from "react";
import BottomNav from "./BottomNav";
import DesktopSidebar from "./DesktopSidebar";
import DevotionalWelcome from "./DevotionalWelcome";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AppLayout = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();

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
          toast({
            title: `Nova mensagem de ${sender?.full_name || "Membro"}`,
            description: msg.content.substring(0, 50) + (msg.content.length > 50 ? "..." : ""),
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  return (
    <div className="flex min-h-screen">
      <DesktopSidebar />
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>
      <BottomNav />
      <DevotionalWelcome />
    </div>
  );
};

export default AppLayout;
