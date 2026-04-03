import { useState } from "react";
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
import { BookOpen, Plus, Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

const Devotionals = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editingDev, setEditingDev] = useState<any>(null);
  const [creatingDev, setCreatingDev] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [status, setStatus] = useState("published");

  const { data: devotionals } = useQuery({
    queryKey: ["devotionals"],
    queryFn: async () => {
      let query = supabase.from("devotionals").select("*").order("publish_date", { ascending: false });
      if (!isAdmin) {
        query = query.in("status", ["published", "scheduled"]).lte("publish_date", new Date().toISOString());
      }
      const { data } = await query;
      return data || [];
    },
  });

  const resetForm = () => {
    setTitle(""); setContent(""); setMediaUrl(""); setPublishDate(""); setStatus("published");
  };

  const handleEdit = (dev: any) => {
    setEditingDev(dev);
    setTitle(dev.title || "");
    setContent(dev.content || "");
    setMediaUrl(dev.media_url || "");
    setStatus(dev.status || "published");
    if (dev.publish_date) {
      const d = new Date(dev.publish_date);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      setPublishDate(d.toISOString().slice(0, 16));
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        title,
        content,
        media_url: mediaUrl || null,
        status,
        publish_date: publishDate ? new Date(publishDate).toISOString() : new Date().toISOString(),
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
      setEditingDev(null);
      setCreatingDev(false);
      resetForm();
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

  const DevForm = () => (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Título</Label>
        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título do devocional" />
      </div>
      <div className="space-y-2">
        <Label>Conteúdo</Label>
        <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Conteúdo..." rows={6} />
      </div>
      <div className="space-y-2">
        <Label>URL de Mídia (YouTube / Imagem)</Label>
        <Input value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} placeholder="Opcional" />
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="published">Publicar agora</SelectItem>
            <SelectItem value="scheduled">Agendar</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {status === "scheduled" && (
        <div className="space-y-2">
          <Label>Data de Publicação</Label>
          <Input type="datetime-local" value={publishDate} onChange={e => setPublishDate(e.target.value)} />
        </div>
      )}
    </div>
  );

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
        {devotionals?.map((dev) => (
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
                      <Badge variant={dev.status === "published" ? "default" : "secondary"} className="text-[10px]">
                        {dev.status}
                      </Badge>
                    )}
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(dev)}>
                      <Edit2 className="h-4 w-4 text-primary" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => {
                      if (window.confirm("Excluir este devocional?")) deleteMutation.mutate(dev.id);
                    }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none text-foreground">
                <p className="whitespace-pre-wrap">{dev.content}</p>
              </div>
              {dev.media_url && (
                <div className="mt-4 rounded-lg overflow-hidden">
                  {dev.media_url.includes("youtube") || dev.media_url.includes("youtu.be") ? (
                    <iframe className="w-full aspect-video rounded-lg" src={dev.media_url.replace("watch?v=", "embed/")} allowFullScreen />
                  ) : (
                    <img src={dev.media_url} alt={dev.title} className="w-full rounded-lg" />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {devotionals?.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhum devocional publicado ainda</p>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={creatingDev} onOpenChange={val => !val && setCreatingDev(false)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo Devocional</DialogTitle></DialogHeader>
          <DevForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreatingDev(false)}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!title || !content || saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingDev} onOpenChange={val => !val && setEditingDev(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Devocional</DialogTitle></DialogHeader>
          <DevForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDev(null)}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!title || !content || saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Devotionals;
