import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import { BookOpen, Plus, Edit2, Trash2, Heart, Users, Upload, Mic2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Calendar as CalendarIcon } from "lucide-react";

const Devotionals = () => {
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editingDev, setEditingDev] = useState<any>(null);
  const [creatingDev, setCreatingDev] = useState(false);
  const [deletingDev, setDeletingDev] = useState<any>(null);
  const [likersDevId, setLikersDevId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [status, setStatus] = useState("published");
  const [isActive, setIsActive] = useState(true);

  const { data: devotionals } = useQuery({
    queryKey: ["devotionals", isAdmin],
    queryFn: async () => {
      let query = supabase.from("devotionals").select("*").order("publish_date", { ascending: false }) as any;
      if (!isAdmin) {
        const now = new Date().toISOString();
        query = query
          .eq("status", "published")
          .eq("is_active", true)
          .lte("publish_date", now)
          .or(`expiration_date.is.null,expiration_date.gt.${now}`);
      }
      const { data } = await query;
      return data || [];
    },
  });

  const { data: likeCounts } = useQuery({
    queryKey: ["devotional-like-counts"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("devotional_likes").select("devotional_id");
      const counts: Record<string, number> = {};
      (data || []).forEach((l: any) => {
        counts[l.devotional_id] = (counts[l.devotional_id] || 0) + 1;
      });
      return counts;
    },
  });

  const { data: myLikes } = useQuery({
    queryKey: ["my-likes", user?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("devotional_likes")
        .select("devotional_id")
        .eq("user_id", user!.id);
      return new Set((data || []).map((l: any) => l.devotional_id));
    },
    enabled: !!user,
  });

  const { data: likers } = useQuery({
    queryKey: ["devotional-likers", likersDevId],
    queryFn: async () => {
      const { data: likes } = await (supabase as any)
        .from("devotional_likes")
        .select("user_id")
        .eq("devotional_id", likersDevId);
      if (!likes || likes.length === 0) return [];
      const uids = likes.map((l: any) => l.user_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", uids);
      return profiles || [];
    },
    enabled: !!likersDevId,
  });

  const likeMutation = useMutation({
    mutationFn: async (devId: string) => {
      const liked = myLikes?.has(devId);
      if (liked) {
        await (supabase as any)
          .from("devotional_likes")
          .delete()
          .eq("devotional_id", devId)
          .eq("user_id", user!.id);
      } else {
        await (supabase as any)
          .from("devotional_likes")
          .insert({ devotional_id: devId, user_id: user!.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-likes"] });
      queryClient.invalidateQueries({ queryKey: ["devotional-like-counts"] });
    },
  });

  const resetForm = () => {
    setTitle(""); setContent(""); setMediaUrl(""); setPublishDate(""); setExpirationDate(""); setStatus("published"); setIsActive(true);
  };

  const handleEdit = (dev: any) => {
    setEditingDev(dev);
    setTitle(dev.title || "");
    setContent(dev.content || "");
    setMediaUrl(dev.media_url || "");
    setStatus(dev.status || "published");
    setIsActive(dev.is_active !== false);
    if (dev.publish_date) {
      const d = new Date(dev.publish_date);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      setPublishDate(d.toISOString().slice(0, 16));
    }
    if (dev.expiration_date) {
      const d = new Date(dev.expiration_date);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      setExpirationDate(d.toISOString().slice(0, 16));
    } else {
      setExpirationDate("");
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        title, content,
        media_url: mediaUrl || null,
        status,
        is_active: isActive,
        publish_date: publishDate ? new Date(publishDate).toISOString() : new Date().toISOString(),
        expiration_date: expirationDate ? new Date(expirationDate).toISOString() : null,
      };
      if (editingDev) {
        const { error } = await supabase.from("devotionals").update(payload).eq("id", editingDev.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("devotionals").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devotionals"] });
      setEditingDev(null); setCreatingDev(false); resetForm();
      toast({ title: editingDev ? "Devocional atualizado!" : "Devocional criado!" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("devotionals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devotionals"] });
      toast({ title: "Devocional removido!" });
    },
  });

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          Devocionais
        </h1>
        {isAdmin && (
          <Button onClick={() => { resetForm(); setCreatingDev(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Novo Devocional
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {devotionals?.map((dev) => {
          const liked = myLikes?.has(dev.id);
          const count = likeCounts?.[dev.id] || 0;
          return (
            <Card key={dev.id} className="neo-shadow-sm border-0">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{dev.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground">
                        {dev.publish_date && format(new Date(dev.publish_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                      {isAdmin && (
                        <div className="flex gap-1">
                          <Badge variant={dev.status === "published" ? "default" : "secondary"} className="text-[10px]">
                            {dev.status}
                          </Badge>
                          {!dev.is_active && (
                            <Badge variant="destructive" className="text-[10px]">Inativo</Badge>
                          )}
                          {dev.expiration_date && new Date(dev.expiration_date) < new Date() && (
                            <Badge variant="outline" className="text-[10px] text-orange-500 border-orange-500">Expirado</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(dev)}>
                        <Edit2 className="h-4 w-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeletingDev(dev)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground mb-4">{dev.content}</p>
                {dev.media_url && (
                  <div className="mt-2 mb-4 rounded-lg overflow-hidden">
                    {dev.media_url.includes("youtube") || dev.media_url.includes("youtu.be") ? (
                      <iframe className="w-full aspect-video rounded-lg" src={dev.media_url.replace("watch?v=", "embed/")} allowFullScreen />
                    ) : (
                      <img src={dev.media_url} alt={dev.title} className="w-full rounded-lg" />
                    )}
                  </div>
                )}
                <div className="flex items-center gap-4 border-t pt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-1.5 ${liked ? "text-rose-500" : "text-muted-foreground"}`}
                    onClick={() => likeMutation.mutate(dev.id)}
                  >
                    <Heart className={`h-4 w-4 ${liked ? "fill-rose-500" : ""}`} />
                    <span className="text-sm">{count}</span>
                  </Button>
                  {isAdmin && (
                    <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => setLikersDevId(dev.id)}>
                      <Users className="h-4 w-4" />
                      <span className="text-xs">Ver quem curtiu</span>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {devotionals?.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhum devocional publicado ainda</p>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={creatingDev} onOpenChange={val => !val && setCreatingDev(false)}>
        <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto rounded-3xl border-0 shadow-2xl custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
              <Plus className="h-6 w-6" /> Novo Devocional
            </DialogTitle>
          </DialogHeader>
          <DevForm 
            title={title} setTitle={setTitle}
            content={content} setContent={setContent}
            status={status} setStatus={setStatus}
            publishDate={publishDate} setPublishDate={setPublishDate}
            expirationDate={expirationDate} setExpirationDate={setExpirationDate}
            isActive={isActive} setIsActive={setIsActive}
            mediaUrl={mediaUrl} setMediaUrl={setMediaUrl}
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreatingDev(false)} className="rounded-xl border-2">Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!title || !content || saveMutation.isPending} className="rounded-xl px-12 font-bold shadow-lg shadow-primary/20">
              {saveMutation.isPending ? "Salvando..." : "Publicar Devocional"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingDev} onOpenChange={val => !val && setEditingDev(null)}>
        <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto rounded-3xl border-0 shadow-2xl custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
              <Edit2 className="h-6 w-6" /> Editar Devocional
            </DialogTitle>
          </DialogHeader>
          <DevForm 
            title={title} setTitle={setTitle}
            content={content} setContent={setContent}
            status={status} setStatus={setStatus}
            publishDate={publishDate} setPublishDate={setPublishDate}
            expirationDate={expirationDate} setExpirationDate={setExpirationDate}
            isActive={isActive} setIsActive={setIsActive}
            mediaUrl={mediaUrl} setMediaUrl={setMediaUrl}
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditingDev(null)} className="rounded-xl border-2">Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!title || !content || saveMutation.isPending} className="rounded-xl px-12 font-bold shadow-lg shadow-primary/20">
              {saveMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deletingDev}
        title="Excluir Devocional"
        description={`Tem certeza que deseja excluir "${deletingDev?.title}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        variant="danger"
        onConfirm={() => deleteMutation.mutate(deletingDev?.id)}
        onCancel={() => setDeletingDev(null)}
      />

      {/* Likers Dialog (ADM only) */}
      <Dialog open={!!likersDevId} onOpenChange={val => !val && setLikersDevId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>Quem curtiu</DialogTitle></DialogHeader>
          <div className="py-2 max-h-[300px] overflow-y-auto space-y-2">
            {likers?.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Ninguém curtiu ainda</p>}
            {likers?.map((p: any) => (
              <div key={p.user_id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/40">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">{(p.full_name || "?").charAt(0)}</span>
                </div>
                <span className="text-sm font-medium">{p.full_name || "Membro"}</span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLikersDevId(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const DevForm = ({ title, setTitle, content, setContent, status, setStatus, publishDate, setPublishDate, expirationDate, setExpirationDate, isActive, setIsActive, mediaUrl, setMediaUrl }: any) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `img_${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("devotionals").upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("devotionals").getPublicUrl(fileName);
      setMediaUrl(urlData.publicUrl);
    } catch (err: any) {
      console.error("Upload error:", err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `video_${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("devotionals").upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("devotionals").getPublicUrl(fileName);
      setMediaUrl(urlData.publicUrl);
    } catch (err: any) {
      console.error("Upload error:", err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
  <div className="space-y-8 py-4">
    <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/20 shadow-inner">
      <div className="space-y-1">
        <Label className="text-sm font-bold text-primary">Estado de Visibilidade</Label>
        <p className="text-[11px] text-muted-foreground leading-tight">Escolha se este devocional estará visível imediatamente para os membros.</p>
      </div>
      <Switch checked={isActive} onCheckedChange={setIsActive} className="data-[state=checked]:bg-primary" />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4 md:col-span-2">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Título do Devocional</Label>
          <Input value={title} onChange={(e: any) => setTitle(e.target.value)} placeholder="Ex: A Importância da Oração Diária" className="rounded-xl h-11 font-medium" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Conteúdo Inspiracional</Label>
          <Textarea value={content} onChange={(e: any) => setContent(e.target.value)} placeholder="Escreva a mensagem aqui..." rows={8} className="rounded-2xl resize-none" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status de Publicação</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="published">Publicar Imediatamente</SelectItem>
              <SelectItem value="scheduled">Agendar p/ Futuro</SelectItem>
              <SelectItem value="draft">Manter como Rascunho</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {(status === "scheduled" || status === "published") && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Data/Hora de Ativação</Label>
            <div className="relative">
              <Input type="datetime-local" value={publishDate} onChange={(e: any) => setPublishDate(e.target.value)} className="rounded-xl h-11 pl-10" />
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            Data de Expiração (Opcional)
          </Label>
          <div className="relative">
            <Input type="datetime-local" value={expirationDate} onChange={(e: any) => setExpirationDate(e.target.value)} className="rounded-xl h-11 pl-10" />
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-[10px] text-muted-foreground italic">Deixará de aparecer após esta data.</p>
        </div>
      </div>
    </div>

    <div className="space-y-4 bg-muted/30 p-5 rounded-2xl border border-dashed border-muted-foreground/30">
      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mídia e Anexos (Imagem, Vídeo ou YouTube)</Label>
      <div className="flex gap-2">
        <Input value={mediaUrl} onChange={(e: any) => setMediaUrl(e.target.value)} placeholder="Cole uma URL ou use os botões ao lado" className="flex-1 rounded-xl h-11" />
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
        <Button type="button" variant="secondary" className="h-11 w-11 rounded-xl" onClick={() => fileRef.current?.click()} disabled={uploading}>
          <Upload className="h-4 w-4" />
        </Button>
        <Button type="button" variant="secondary" className="h-11 w-11 rounded-xl" onClick={() => videoRef.current?.click()} disabled={uploading}>
          <Mic2 className="h-4 w-4" />
        </Button>
      </div>
      {uploading && <p className="text-xs text-primary font-medium animate-pulse flex items-center gap-2">
        <Loader2 className="h-3 w-3 animate-spin" /> Processando seu arquivo...
      </p>}
      
      {mediaUrl && (
        <div className="relative mt-2 rounded-xl overflow-hidden border-2 border-background shadow-md bg-muted aspect-video max-h-48 mx-auto">
          {mediaUrl.includes("youtube") || mediaUrl.includes("youtu.be") ? (
            <iframe className="w-full h-full" src={mediaUrl.replace("watch?v=", "embed/")} allowFullScreen />
          ) : mediaUrl.match(/\.(mp4|webm|mov)/) ? (
            <video src={mediaUrl} controls className="w-full h-full object-cover" />
          ) : (
            <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
          )}
          <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7 rounded-full" onClick={() => setMediaUrl("")}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      )}
    </div>
  </div>
  );
};

export default Devotionals;
