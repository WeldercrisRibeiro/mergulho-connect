import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
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
import { BookOpen, Plus, Edit2, Trash2, Heart, Users, Upload, Mic2, Loader2, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Calendar as CalendarIcon } from "lucide-react";
import { getErrorMessage } from "@/lib/errorMessages";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Cria um disparo no WhatsApp vinculado a um devocional.
 * Chama diretamente a API do backend (mesmo host, porta 3002 ou via proxy).
 */
async function createDevotionalDispatch(params: {
  title: string;
  content: string;
  scheduledAt: string; // ISO string
  createdBy?: string;
  attachmentUrl?: string; // URL pública de imagem/vídeo do Supabase Storage
}): Promise<void> {
  const formData = new FormData();
  formData.append("title", `📖 Devocional: ${params.title}`);
  formData.append("content", params.content);
  formData.append("type", "devotional");
  formData.append("priority", "normal");
  formData.append("scheduled_at", params.scheduledAt);
  if (params.createdBy) formData.append("created_by", params.createdBy);
  // Envia URL de mídia para o backend baixar e anexar ao disparo
  if (params.attachmentUrl) formData.append("attachment_url", params.attachmentUrl);

  const res = await fetch(`/api/dispatches`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Erro ao criar disparo (${res.status})`);
  }
}

// ─── Componente principal ─────────────────────────────────────────────────────

const Devotionals = () => {
  const { isAdmin, user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editingDev, setEditingDev] = useState<any>(null);
  const [creatingDev, setCreatingDev] = useState(false);
  const [deletingDev, setDeletingDev] = useState<any>(null);
  const [likersDevId, setLikersDevId] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [status, setStatus] = useState("published");
  const [isActive, setIsActive] = useState(true);
  // WhatsApp dispatch
  const [sendViaWhatsapp, setSendViaWhatsapp] = useState(false);
  const [signEnabled, setSignEnabled] = useState(false);

  const signatureName: string = profile?.full_name || user?.user_metadata?.full_name || "";

  const { data: devotionals } = useQuery({
    queryKey: ["devotionals", isAdmin],
    queryFn: async () => {
      const { data } = await api.get('/devotionals');
      const all = data || [];
      if (!isAdmin) {
        const now = new Date().toISOString();
        return all.filter((d: any) =>
          d.status === 'published' && d.isActive &&
          d.publishDate <= now &&
          (!d.expirationDate || d.expirationDate > now)
        ).map((d: any) => ({ ...d, publish_date: d.publishDate, media_url: d.mediaUrl, is_active: d.isActive, expiration_date: d.expirationDate }));
      }
      return all.map((d: any) => ({ ...d, publish_date: d.publishDate, media_url: d.mediaUrl, is_active: d.isActive, expiration_date: d.expirationDate }));
    },
  });

  const { data: likeCounts } = useQuery({
    queryKey: ["devotional-like-counts"],
    queryFn: async () => {
      const { data } = await api.get('/devotional-likes');
      const counts: Record<string, number> = {};
      (data || []).forEach((l: any) => {
        counts[l.devotionalId] = (counts[l.devotionalId] || 0) + 1;
      });
      return counts;
    },
  });

  const { data: myLikes } = useQuery({
    queryKey: ["my-likes", user?.id],
    queryFn: async () => {
      const { data } = await api.get('/devotional-likes', { params: { userId: user!.id } });
      return new Set((data || []).map((l: any) => l.devotionalId));
    },
    enabled: !!user,
  });

  const { data: likers } = useQuery({
    queryKey: ["devotional-likers", likersDevId],
    queryFn: async () => {
      const { data: likes } = await api.get('/devotional-likes', { params: { devotionalId: likersDevId } });
      if (!likes || likes.length === 0) return [];
      const uids = likes.map((l: any) => l.userId);
      const { data: profiles } = await api.get('/profiles');
      return (profiles || []).filter((p: any) => uids.includes(p.userId)).map((p: any) => ({ ...p, user_id: p.userId, full_name: p.fullName }));
    },
    enabled: !!likersDevId,
  });

  const likeMutation = useMutation({
    mutationFn: async (devId: string) => {
      const liked = myLikes?.has(devId);
      if (liked) {
        await api.delete('/devotional-likes', { params: { devotionalId: devId, userId: user!.id } });
      } else {
        await api.post('/devotional-likes', { devotionalId: devId, userId: user!.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-likes"] });
      queryClient.invalidateQueries({ queryKey: ["devotional-like-counts"] });
    },
  });

  const resetForm = () => {
    setTitle("");
    setContent("");
    setMediaUrl("");
    setPublishDate("");
    setExpirationDate("");
    setStatus("published");
    setIsActive(true);
    setSendViaWhatsapp(false);
    setSignEnabled(false);
  };

  const handleEdit = (dev: any) => {
    setEditingDev(dev);
    setTitle(dev.title || "");
    setContent(dev.content || "");
    setMediaUrl(dev.media_url || "");
    setStatus(dev.status || "published");
    setIsActive(dev.is_active !== false);
    setSendViaWhatsapp(false); // nunca re-dispara na edição por padrão
    setSignEnabled(false);
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
      const scheduledAt = publishDate
        ? new Date(publishDate).toISOString()
        : new Date().toISOString();

      const camelPayload: any = {
        title,
        content,
        mediaUrl: mediaUrl || null,
        status,
        isActive,
        publishDate: scheduledAt,
        expirationDate: expirationDate ? new Date(expirationDate).toISOString() : null,
      };

      if (editingDev) {
        await api.patch(`/devotionals/${editingDev.id}`, camelPayload);
      } else {
        await api.post(`/devotionals`, camelPayload);
      }

      // Cria o disparo WhatsApp se o toggle estiver ativo
      if (sendViaWhatsapp && content.trim()) {
        const finalContent = (signEnabled && signatureName)
          ? `*${signatureName}:*\n${content.trim()}`
          : content.trim();

        // Inclui a mídia como anexo se for imagem/vídeo hospedado (não YouTube)
        const isYoutube = mediaUrl && (mediaUrl.includes("youtube") || mediaUrl.includes("youtu.be"));
        const attachmentUrl = (mediaUrl && !isYoutube) ? mediaUrl : undefined;

        await createDevotionalDispatch({
          title,
          content: finalContent,
          scheduledAt,
          createdBy: user?.id,
          attachmentUrl,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devotionals"] });
      setEditingDev(null);
      setCreatingDev(false);
      resetForm();
      toast({
        title: editingDev ? "Devocional atualizado!" : "Devocional criado!",
        description: sendViaWhatsapp
          ? "Disparo WhatsApp agendado para o mesmo horário de publicação."
          : undefined,
      });
    },
    onError: (err: any) =>
      toast({ title: "Erro", description: getErrorMessage(err), variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/devotionals/${id}`);
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
                        {dev.publish_date &&
                          format(new Date(dev.publish_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                      {isAdmin && (
                        <div className="flex gap-1">
                          <Badge
                            variant={dev.status === "published" ? "default" : "secondary"}
                            className="text-[10px]"
                          >
                            {dev.status}
                          </Badge>
                          {!dev.is_active && (
                            <Badge variant="destructive" className="text-[10px]">Inativo</Badge>
                          )}
                          {dev.expiration_date && new Date(dev.expiration_date) < new Date() && (
                            <Badge variant="outline" className="text-[10px] text-orange-500 border-orange-500">
                              Expirado
                            </Badge>
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
                      <iframe
                        className="w-full aspect-video rounded-lg"
                        src={dev.media_url.replace("watch?v=", "embed/")}
                        allowFullScreen
                      />
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-muted-foreground"
                      onClick={() => setLikersDevId(dev.id)}
                    >
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
      <Dialog open={creatingDev} onOpenChange={(val) => !val && setCreatingDev(false)}>
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
            sendViaWhatsapp={sendViaWhatsapp} setSendViaWhatsapp={setSendViaWhatsapp}
            signEnabled={signEnabled} setSignEnabled={setSignEnabled}
            signatureName={signatureName}
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreatingDev(false)} className="rounded-xl border-2">
              Cancelar
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!title || !content || saveMutation.isPending}
              className="rounded-xl px-12 font-bold shadow-lg shadow-primary/20"
            >
              {saveMutation.isPending ? "Salvando..." : "Publicar Devocional"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingDev} onOpenChange={(val) => !val && setEditingDev(null)}>
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
            sendViaWhatsapp={sendViaWhatsapp} setSendViaWhatsapp={setSendViaWhatsapp}
            signEnabled={signEnabled} setSignEnabled={setSignEnabled}
            signatureName={signatureName}
            isEditing
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditingDev(null)} className="rounded-xl border-2">
              Cancelar
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!title || !content || saveMutation.isPending}
              className="rounded-xl px-12 font-bold shadow-lg shadow-primary/20"
            >
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
      <Dialog open={!!likersDevId} onOpenChange={(val) => !val && setLikersDevId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>Quem curtiu</DialogTitle></DialogHeader>
          <div className="py-2 max-h-[300px] overflow-y-auto space-y-2">
            {likers?.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Ninguém curtiu ainda</p>
            )}
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

// ─── Formulário ───────────────────────────────────────────────────────────────

const DevForm = ({
  title, setTitle,
  content, setContent,
  status, setStatus,
  publishDate, setPublishDate,
  expirationDate, setExpirationDate,
  isActive, setIsActive,
  mediaUrl, setMediaUrl,
  sendViaWhatsapp, setSendViaWhatsapp,
  signEnabled, setSignEnabled,
  signatureName,
  isEditing = false,
}: any) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMediaUrl(data.url);
    } catch (err: any) {
      console.error("Upload error:", getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMediaUrl(data.url);
    } catch (err: any) {
      console.error("Upload error:", getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8 py-4">
      {/* Visibilidade */}
      <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/20 shadow-inner">
        <div className="space-y-1">
          <Label className="text-sm font-bold text-primary">Estado de Visibilidade</Label>
          <p className="text-[11px] text-muted-foreground leading-tight">
            Escolha se este devocional estará visível imediatamente para os membros.
          </p>
        </div>
        <Switch checked={isActive} onCheckedChange={setIsActive} className="data-[state=checked]:bg-primary" />
      </div>

      {/* Campos principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4 md:col-span-2">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Título do Devocional
            </Label>
            <Input
              value={title}
              onChange={(e: any) => setTitle(e.target.value)}
              placeholder="Ex: A Importância da Oração Diária"
              className="rounded-xl h-11 font-medium"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Conteúdo Inspiracional
            </Label>
            <Textarea
              value={content}
              onChange={(e: any) => setContent(e.target.value)}
              placeholder="Escreva a mensagem aqui..."
              rows={8}
              className="rounded-2xl resize-none"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Status de Publicação
            </Label>
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
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Data/Hora de Ativação
              </Label>
              <div className="relative">
                <Input
                  type="datetime-local"
                  value={publishDate}
                  onChange={(e: any) => setPublishDate(e.target.value)}
                  className="rounded-xl h-11 pl-10"
                />
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
              <Input
                type="datetime-local"
                value={expirationDate}
                onChange={(e: any) => setExpirationDate(e.target.value)}
                className="rounded-xl h-11 pl-10"
              />
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-[10px] text-muted-foreground italic">Deixará de aparecer após esta data.</p>
          </div>
        </div>
      </div>

      {/* Mídia */}
      <div className="space-y-4 bg-muted/30 p-5 rounded-2xl border border-dashed border-muted-foreground/30">
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Mídia e Anexos (Imagem, Vídeo ou YouTube)
        </Label>
        <div className="flex gap-2">
          <Input
            value={mediaUrl}
            onChange={(e: any) => setMediaUrl(e.target.value)}
            placeholder="Cole uma URL ou use os botões ao lado"
            className="flex-1 rounded-xl h-11"
          />
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
          <Button
            type="button"
            variant="secondary"
            className="h-11 w-11 rounded-xl"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-11 w-11 rounded-xl"
            onClick={() => videoRef.current?.click()}
            disabled={uploading}
          >
            <Mic2 className="h-4 w-4" />
          </Button>
        </div>
        {uploading && (
          <p className="text-xs text-primary font-medium animate-pulse flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" /> Processando seu arquivo...
          </p>
        )}
        {mediaUrl && (
          <div className="relative mt-2 rounded-xl overflow-hidden border-2 border-background shadow-md bg-muted aspect-video max-h-48 mx-auto">
            {mediaUrl.includes("youtube") || mediaUrl.includes("youtu.be") ? (
              <iframe className="w-full h-full" src={mediaUrl.replace("watch?v=", "embed/")} allowFullScreen />
            ) : mediaUrl.match(/\.(mp4|webm|mov)/) ? (
              <video src={mediaUrl} controls className="w-full h-full object-cover" />
            ) : (
              <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
            )}
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7 rounded-full"
              onClick={() => setMediaUrl("")}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* WhatsApp dispatch toggle */}
      <div
        className={`flex items-start justify-between p-4 rounded-2xl border shadow-inner transition-colors ${
          sendViaWhatsapp
            ? "bg-green-500/10 border-green-500/30"
            : "bg-muted/30 border-muted-foreground/20"
        }`}
      >
        <div className="space-y-1 flex-1 pr-4">
          <Label className={`text-sm font-bold flex items-center gap-2 ${sendViaWhatsapp ? "text-green-700 dark:text-green-400" : ""}`}>
            <MessageCircle className="h-4 w-4" />
            {isEditing ? "Re-disparar pelo WhatsApp" : "Enviar pelo WhatsApp"}
          </Label>
          <p className="text-[11px] text-muted-foreground leading-tight">
            {isEditing
              ? "Cria um novo disparo agendado com o conteúdo atualizado, para todos os membros com WhatsApp."
              : "Agenda automaticamente um disparo WhatsApp para todos os membros, no mesmo horário de publicação."}
          </p>
          {sendViaWhatsapp && (
            <div className="mt-2 space-y-2">
              <p className="text-[11px] text-green-600 dark:text-green-400 font-medium">
                ✓ Texto e imagem/vídeo serão enviados. Links do YouTube não são incluídos.
              </p>
              {/* Sub-toggle de assinatura — idêntico ao AdminNotices */}
              <div
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border shadow-sm cursor-pointer transition-colors w-fit ${
                  signEnabled ? "bg-[#25D366]/10 border-[#25D366]/30" : "bg-white border-slate-200"
                }`}
                title={signEnabled ? `Assinando como: ${signatureName}` : "Clique para assinar com seu nome"}
                onClick={() => setSignEnabled(!signEnabled)}
              >
                <span className={`text-[11px] font-semibold tracking-wide ${signEnabled ? "text-[#075E54]" : "text-slate-500"}`}>
                  Assinar como {signatureName || "meu nome"}
                </span>
                <Switch
                  checked={signEnabled}
                  onCheckedChange={setSignEnabled}
                  className="h-4 w-7 data-[state=checked]:bg-[#25D366]"
                />
              </div>
              {signEnabled && signatureName && (
                <p className="text-[11px] text-slate-500 italic">
                  Mensagem enviada como: <strong className="text-[#075E54]">{signatureName}:</strong>
                </p>
              )}
            </div>
          )}
        </div>
        <Switch
          checked={sendViaWhatsapp}
          onCheckedChange={setSendViaWhatsapp}
          className="data-[state=checked]:bg-green-500 mt-0.5"
        />
      </div>
    </div>
  );
};

export default Devotionals;