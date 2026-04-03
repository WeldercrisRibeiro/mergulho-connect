import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Settings, ImagePlus, MessageSquareQuote, Trash2, Plus, Edit2, ChevronLeft, ChevronRight, Upload, Mail, CheckCircle, Archive } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SettingsPage = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Photo state
  const [photoCaption, setPhotoCaption] = useState("");
  const [editingPhoto, setEditingPhoto] = useState<any>(null);
  const [deletingPhoto, setDeletingPhoto] = useState<any>(null);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [carouselIdx, setCarouselIdx] = useState(0);

  // Testimonial state
  const [testName, setTestName] = useState("");
  const [testRole, setTestRole] = useState("");
  const [testText, setTestText] = useState("");
  const [editingTest, setEditingTest] = useState<any>(null);
  const [deletingTest, setDeletingTest] = useState<any>(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);

  if (!isAdmin) return <Navigate to="/home" replace />;

  const { data: photos } = useQuery({
    queryKey: ["landing-photos"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("landing_photos").select("*").order("created_at", { ascending: true });
      return data || [];
    },
  });

  const { data: testimonials } = useQuery({
    queryKey: ["landing-testimonials"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("landing_testimonials").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: contactMessages } = useQuery({
    queryKey: ["contact-messages"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("contact_messages").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: siteSettings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("site_settings").select("*");
      const settings: Record<string, string> = {};
      (data || []).forEach((s: any) => { settings[s.id] = s.value; });
      return settings;
    },
  });

  const [editWhatsApp, setEditWhatsApp] = useState("");
  const [editInstagram, setEditInstagram] = useState("");
  const [editFacebook, setEditFacebook] = useState("");

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      const updates = [
        { id: "whatsapp_number", value: editWhatsApp },
        { id: "instagram_url", value: editInstagram },
        { id: "facebook_url", value: editFacebook },
      ];
      for (const u of updates) {
        await (supabase as any).from("site_settings").upsert(u);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast({ title: "Configurações salvas!" });
    },
    onError: (err: any) => toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" }),
  });

  const loadSettings = () => {
    if (siteSettings) {
      setEditWhatsApp(siteSettings.whatsapp_number || "");
      setEditInstagram(siteSettings.instagram_url || "");
      setEditFacebook(siteSettings.facebook_url || "");
    }
  };

  // --- Upload photo ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("landing-photos")
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("landing-photos").getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;

      if (editingPhoto) {
        await (supabase as any).from("landing_photos").update({ url: publicUrl, caption: photoCaption }).eq("id", editingPhoto.id);
      } else {
        await (supabase as any).from("landing_photos").insert({ url: publicUrl, caption: photoCaption });
      }
      queryClient.invalidateQueries({ queryKey: ["landing-photos"] });
      setPhotoDialogOpen(false);
      setEditingPhoto(null);
      setPhotoCaption("");
      toast({ title: "Foto salva com sucesso!" });
    } catch (err: any) {
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const deletePhotoMutation = useMutation({
    mutationFn: async (p: any) => {
      // Extract filename from URL for storage cleanup
      const filename = p.url.split("/").pop();
      if (filename) await supabase.storage.from("landing-photos").remove([filename]);
      await (supabase as any).from("landing_photos").delete().eq("id", p.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landing-photos"] });
      toast({ title: "Foto removida!" });
    },
  });

  // --- Testimonial mutations ---
  const saveTestMutation = useMutation({
    mutationFn: async () => {
      const payload = { name: testName, role: testRole, text: testText };
      if (editingTest) {
        await (supabase as any).from("landing_testimonials").update(payload).eq("id", editingTest.id);
      } else {
        await (supabase as any).from("landing_testimonials").insert(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landing-testimonials"] });
      setTestDialogOpen(false); setEditingTest(null);
      setTestName(""); setTestRole(""); setTestText("");
      toast({ title: editingTest ? "Depoimento atualizado!" : "Depoimento adicionado!" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const deleteTestMutation = useMutation({
    mutationFn: async (id: string) => {
      await (supabase as any).from("landing_testimonials").delete().eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landing-testimonials"] });
      toast({ title: "Depoimento removido!" });
    }
  });

  const approveContactMutation = useMutation({
    mutationFn: async (m: any) => {
      const email = m.phone.replace(/\D/g, "") + "@mergulhoconnect.com";
      const { data, error } = await supabase.rpc("admin_manage_user" as any, {
        email, password: "123456", raw_user_meta_data: { full_name: m.name, whatsapp_phone: m.phone }
      });
      if (error) throw error;
      const newUserId = data as any as string;
      await supabase.from("user_roles").insert({ user_id: newUserId, role: "member" } as any);
      await (supabase as any).from("contact_messages").delete().eq("id", m.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-messages"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast({ title: "Membro aprovado!", description: "Conta criada com sucesso." });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const archiveContactMutation = useMutation({
    mutationFn: async (id: string) => {
      await (supabase as any).from("contact_messages").delete().eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-messages"] });
      toast({ title: "Mensagem arquivada!" });
    }
  });

  const prev = () => setCarouselIdx(i => (i - 1 + (photos?.length || 1)) % (photos?.length || 1));
  const next = () => setCarouselIdx(i => (i + 1) % (photos?.length || 1));

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Settings className="h-6 w-6 text-primary" />
        Configurações
      </h1>

      <Tabs defaultValue="inicio">
        <TabsList className="grid grid-cols-2 w-[400px]">
          <TabsTrigger value="inicio" className="flex items-center gap-2">
            <ImagePlus className="h-4 w-4" /> Início
          </TabsTrigger>
          <TabsTrigger value="mensagens" className="flex items-center gap-2">
            <Mail className="h-4 w-4" /> Mensagens
            {contactMessages && contactMessages.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                {contactMessages.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inicio" className="space-y-10 pt-4">

          {/* === PHOTOS CAROUSEL PREVIEW === */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ImagePlus className="h-5 w-5 text-primary" /> Fotos da Igreja
              </h2>
              <Button size="sm" onClick={() => { setPhotoCaption(""); setEditingPhoto(null); setPhotoDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-1" /> Adicionar Foto
              </Button>
            </div>

            {/* Carousel preview */}
            {photos && photos.length > 0 ? (
              <div className="relative rounded-2xl overflow-hidden bg-muted border border-border/50 mb-4">
                <div className="relative h-64 md:h-80">
                  <img
                    src={photos[carouselIdx]?.url}
                    alt={photos[carouselIdx]?.caption || ""}
                    className="w-full h-full object-contain bg-black/5"
                  />
                  {photos[carouselIdx]?.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                      <p className="text-white text-sm">{photos[carouselIdx].caption}</p>
                    </div>
                  )}
                  <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex gap-1.5 justify-center py-2">
                  {photos.map((_: any, i: number) => (
                    <button key={i} onClick={() => setCarouselIdx(i)}
                      className={`h-1.5 rounded-full transition-all ${i === carouselIdx ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/40"}`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-48 rounded-2xl border-2 border-dashed border-border flex items-center justify-center text-muted-foreground text-sm mb-4">
                Nenhuma foto adicionada ainda
              </div>
            )}

            {/* Photo list */}
            <div className="grid sm:grid-cols-3 gap-3">
              {photos?.map((p: any, i: number) => (
                <div key={p.id} className={`group relative rounded-xl overflow-hidden border-2 transition-all ${i === carouselIdx ? "border-primary" : "border-transparent"}`}
                  onClick={() => setCarouselIdx(i)}>
                  <img src={p.url} alt="" className="w-full h-24 object-contain bg-muted cursor-pointer" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="icon" variant="secondary" className="h-7 w-7" onClick={e => { e.stopPropagation(); setEditingPhoto(p); setPhotoCaption(p.caption || ""); setPhotoDialogOpen(true); }}>
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="destructive" className="h-7 w-7" onClick={e => { e.stopPropagation(); setDeletingPhoto(p); }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <hr className="border-border/30" />

          {/* === SOCIAL LINKS === */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" /> Redes Sociais e Contato
              </h2>
              <Button size="sm" variant="outline" onClick={loadSettings} disabled={!siteSettings}>
                Recarregar Atuais
              </Button>
            </div>
            <div className="grid gap-4 bg-muted/20 p-5 rounded-2xl border border-border/50">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>WhatsApp (Apenas números + DDD)</Label>
                  <Input value={editWhatsApp} onChange={e => setEditWhatsApp(e.target.value)} placeholder="Ex: 85997763630" />
                </div>
                <div className="space-y-2">
                  <Label>Instagram (URL Completa)</Label>
                  <Input value={editInstagram} onChange={e => setEditInstagram(e.target.value)} placeholder="https://instagram.com/..." />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Facebook (URL Completa)</Label>
                <Input value={editFacebook} onChange={e => setEditFacebook(e.target.value)} placeholder="https://facebook.com/..." />
              </div>
              <Button className="w-full mt-2" onClick={() => saveSettingsMutation.mutate()} disabled={saveSettingsMutation.isPending}>
                {saveSettingsMutation.isPending ? "Salvando..." : "Salvar Links e Contato"}
              </Button>
            </div>
          </div>

          <hr className="border-border/30" />

          {/* === TESTIMONIALS === */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <MessageSquareQuote className="h-5 w-5 text-primary" /> Depoimentos de Membros
              </h2>
              <Button size="sm" onClick={() => { setTestName(""); setTestRole(""); setTestText(""); setEditingTest(null); setTestDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-1" /> Adicionar Depoimento
              </Button>
            </div>
            <div className="space-y-3">
              {testimonials?.map((t: any) => (
                <div key={t.id} className="flex items-start justify-between gap-4 p-4 bg-card rounded-xl border border-border/50">
                  <div className="flex-1">
                    <p className="text-sm italic text-muted-foreground">"{t.text}"</p>
                    <p className="mt-1 font-semibold text-sm">{t.name} <span className="font-normal text-muted-foreground text-xs">— {t.role}</span></p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingTest(t); setTestName(t.name); setTestRole(t.role || ""); setTestText(t.text); setTestDialogOpen(true); }}>
                      <Edit2 className="h-4 w-4 text-primary" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeletingTest(t)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              {(!testimonials || testimonials.length === 0) && (
                <p className="text-muted-foreground py-4 text-center text-sm">Nenhum depoimento adicionado ainda</p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="mensagens" className="pt-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Solicitações de Contato (Landing)</h2>
          </div>
          
          <div className="grid gap-4">
            {contactMessages?.map((m: any) => (
              <Card key={m.id} className="border-0 shadow-sm bg-muted/20">
                <CardContent className="p-5">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-lg">{m.name}</p>
                          <p className="text-sm font-medium text-primary">{m.phone}</p>
                        </div>
                        <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded-full border">
                          {new Date(m.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      
                      <div className="bg-background/80 rounded-xl p-4 border border-border/50">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                          Assunto: {m.subject}
                        </p>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.message}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-row md:flex-col gap-2 shrink-0 md:justify-center">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 gap-2 border-primary/20 hover:border-primary/50"
                        onClick={() => archiveContactMutation.mutate(m.id)}
                      >
                        <Archive className="h-4 w-4" /> Arquivar
                      </Button>
                      {(m.subject === "Quero me tornar Membro") && (
                        <Button 
                          size="sm" 
                          className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => approveContactMutation.mutate(m)}
                        >
                          <CheckCircle className="h-4 w-4" /> Aprovar Membro
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {(!contactMessages || contactMessages.length === 0) && (
              <div className="text-center py-20 bg-muted/10 rounded-3xl border-2 border-dashed border-border/50">
                <Mail className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">Nenhuma mensagem nova</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Photo Upload Dialog */}
      <Dialog open={photoDialogOpen} onOpenChange={val => !val && setPhotoDialogOpen(false)}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader><DialogTitle>{editingPhoto ? "Editar Foto" : "Adicionar Foto"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Legenda (opcional)</Label>
              <Input value={photoCaption} onChange={e => setPhotoCaption(e.target.value)} placeholder="Ex: Culto de domingo" />
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            <Button
              className="w-full h-12 border-2 border-dashed"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? "Enviando..." : "Selecionar imagem do computador"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">A imagem será salva diretamente no servidor do projeto.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPhotoDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Testimonial Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={val => !val && setTestDialogOpen(false)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>{editingTest ? "Editar Depoimento" : "Novo Depoimento"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Membro</Label>
                <Input value={testName} onChange={e => setTestName(e.target.value)} placeholder="Ex: João Silva" />
              </div>
              <div className="space-y-2">
                <Label>Função / Grupo</Label>
                <Input value={testRole} onChange={e => setTestRole(e.target.value)} placeholder="Ex: Líder de Louvor" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Depoimento</Label>
              <Textarea value={testText} onChange={e => setTestText(e.target.value)} placeholder="Escreva o depoimento aqui..." rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => saveTestMutation.mutate()} disabled={!testName || !testText || saveTestMutation.isPending}>
              {saveTestMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm delete photo */}
      <ConfirmDialog
        open={!!deletingPhoto}
        title="Remover Foto"
        description={`Remover a foto "${deletingPhoto?.caption || "sem legenda"}"?`}
        confirmLabel="Remover"
        variant="danger"
        onConfirm={() => deletePhotoMutation.mutate(deletingPhoto)}
        onCancel={() => setDeletingPhoto(null)}
      />

      {/* Confirm delete testimonial */}
      <ConfirmDialog
        open={!!deletingTest}
        title="Remover Depoimento"
        description={`Remover o depoimento de "${deletingTest?.name}"?`}
        confirmLabel="Remover"
        variant="danger"
        onConfirm={() => deleteTestMutation.mutate(deletingTest?.id)}
        onCancel={() => setDeletingTest(null)}
      />
    </div>
  );
};

export default SettingsPage;
