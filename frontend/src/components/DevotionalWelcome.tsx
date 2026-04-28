import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
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
      const { data } = await api.get("/devotionals", { params: { status: 'publicado' } });
      const valid = (data || []).filter((d: any) => new Date(d.publishDate) <= new Date());
      // Sort by publishDate desc
      valid.sort((a: any, b: any) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
      return valid[0] || null;
    },
    enabled: !!user,
  });

  const { data: myLike } = useQuery({
    queryKey: ["my-like", devotional?.id, user?.id],
    queryFn: async () => {
      const { data } = await api.get(`/devotional-likes`, {
        params: { devotionalId: devotional!.id, userId: user!.id },
      });
      // Retorna o primeiro like do user para este devocional (ou null)
      return (data && data.length > 0) ? data[0] : null;
    },
    enabled: !!devotional && !!user,
  });

  const { data: likeCount } = useQuery({
    queryKey: ["like-count", devotional?.id],
    queryFn: async () => {
      const { data } = await api.get(`/devotional-likes`, { params: { devotionalId: devotional!.id } });
      return data?.length || 0;
    },
    enabled: !!devotional,
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      // POST /devotional-likes sempre — o servidor faz toggle (cria ou remove)
      await api.post(`/devotional-likes`, { devotionalId: devotional!.id, userId: user!.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-like", devotional?.id, user?.id] });
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
      <DialogContent className="w-[94vw] md:max-w-[850px] max-h-[90vh] p-0 overflow-hidden gap-0 flex flex-col [&>button]:hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Devocional do Dia</DialogTitle>
          <DialogDescription>Leia o devocional de hoje.</DialogDescription>
        </DialogHeader>
        
        {/* Header strip */}
        <div className="bg-gradient-to-r from-primary to-primary/70 p-4 md:p-5 relative shrink-0">
          <div className="flex items-center gap-2 text-white">
            <BookOpen className="h-5 w-5" />
            <span className="text-sm font-semibold tracking-wide uppercase">Devocional do Dia</span>
          </div>
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-2.5 md:top-3 text-white hover:bg-white/20 h-8 w-8"
            >
              <X className="h-5 w-5" />
            </Button>
          </DialogClose>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-5 md:p-6">
            <h2 className="text-xl font-bold mb-1">{devotional.title}</h2>
            <p className="text-xs text-muted-foreground mb-4 md:mb-6">
              {safeFormat(devotional.publishDate, "dd 'de' MMMM 'de' yyyy")}
            </p>

            <div className="space-y-6">
              {/* Text content */}
              <div className="prose prose-sm max-w-none">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {devotional.content}
                </p>
              </div>

              {/* Media content (Image/Video) */}
              {((devotional as any).videoUrl || devotional.mediaUrl) && (() => {
                const url = (devotional as any).videoUrl || devotional.mediaUrl || "";
                const isYoutube = url.includes("youtube") || url.includes("youtu.be");
                const isVideoFile = (devotional as any).isVideoUpload || url.match(/\.(mp4|webm|mov)(\?.*)?$/i);
                return (
                  <div className="rounded-xl overflow-hidden shadow-md bg-muted/10 border border-border/50">
                    {isYoutube ? (
                      <VideoPlayer url={url} isUpload={false} />
                    ) : isVideoFile ? (
                      <VideoPlayer url={url} isUpload={true} />
                    ) : (
                      <img
                        src={url}
                        alt={devotional.title}
                        className="w-full object-cover max-h-[400px]"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t pt-4 mt-6">
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

              <DialogClose asChild>
                <Button className="px-8">
                  Fechar
                </Button>
              </DialogClose>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DevotionalWelcome;
