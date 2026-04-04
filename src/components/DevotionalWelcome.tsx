import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, X, BookOpen } from "lucide-react";
import { safeFormat } from "@/lib/dateUtils";
import VideoPlayer from "./VideoPlayer";

const SESSION_KEY = "devotional_shown";

const DevotionalWelcome = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: devotional } = useQuery({
    queryKey: ["latest-devotional"],
    queryFn: async () => {
      const { data } = await supabase
        .from("devotionals")
        .select("*")
        .eq("status", "published")
        .lte("publish_date", new Date().toISOString())
        .order("publish_date", { ascending: false })
        .limit(1)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const { data: myLike } = useQuery({
    queryKey: ["my-like", devotional?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("devotional_likes")
        .select("id")
        .eq("devotional_id", devotional!.id)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!devotional && !!user,
  });

  const { data: likeCount } = useQuery({
    queryKey: ["like-count", devotional?.id],
    queryFn: async () => {
      const { count } = await (supabase as any)
        .from("devotional_likes")
        .select("*", { count: "exact", head: true })
        .eq("devotional_id", devotional!.id);
      return count || 0;
    },
    enabled: !!devotional,
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (myLike) {
        await (supabase as any)
          .from("devotional_likes")
          .delete()
          .eq("id", myLike.id);
      } else {
        await (supabase as any)
          .from("devotional_likes")
          .insert({ devotional_id: devotional!.id, user_id: user!.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-like", devotional?.id] });
      queryClient.invalidateQueries({ queryKey: ["like-count", devotional?.id] });
      queryClient.invalidateQueries({ queryKey: ["devotionals"] });
    },
  });

  // Show once per session
  useEffect(() => {
    if (!user || !devotional) return;
    const shown = sessionStorage.getItem(SESSION_KEY);
    if (!shown) {
      setOpen(true);
      sessionStorage.setItem(SESSION_KEY, "true");
    }
  }, [user, devotional]);

  if (!devotional) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden gap-0">
        {/* Header strip */}
        <div className="bg-gradient-to-r from-primary to-primary/70 p-5 relative">
          <div className="flex items-center gap-2 text-white">
            <BookOpen className="h-5 w-5" />
            <span className="text-sm font-semibold tracking-wide uppercase">Devocional do Dia</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-3 top-3 text-white hover:bg-white/20 h-7 w-7"
            onClick={() => setOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          <h2 className="text-xl font-bold mb-1">{devotional.title}</h2>
          <p className="text-xs text-muted-foreground mb-4">
            {safeFormat(devotional.publish_date, "dd 'de' MMMM 'de' yyyy")}
          </p>

          <div className="max-h-52 overflow-y-auto pr-1 mb-4">
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {devotional.content}
            </p>
          </div>

          {((devotional as any).video_url || devotional.media_url) && (
            <div className="rounded-xl overflow-hidden mb-4 shadow-md">
              <VideoPlayer 
                url={(devotional as any).video_url || devotional.media_url || ""} 
                isUpload={(devotional as any).is_video_upload}
              />
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between border-t pt-4 mt-2">
            <Button
              variant="ghost"
              size="sm"
              className={`gap-2 transition-colors ${myLike ? "text-rose-500" : "text-muted-foreground"}`}
              onClick={() => likeMutation.mutate()}
              disabled={likeMutation.isPending}
            >
              <Heart className={`h-5 w-5 ${myLike ? "fill-rose-500" : ""}`} />
              <span className="text-sm font-medium">{likeCount ?? 0}</span>
            </Button>

            <Button onClick={() => setOpen(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DevotionalWelcome;
