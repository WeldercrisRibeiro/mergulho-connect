import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Settings, ImagePlus, MessageSquareQuote, Trash2, Plus, Edit2, ChevronLeft, ChevronRight, Upload, Mail, CheckCircle, Archive, Video, Youtube, Shield, Users, Calendar, BookOpen, HandHeart, BarChart3, MessageCircle, ShieldCheck, Megaphone, Lock, ChevronRight as ChevronRightIcon, Bell, ArrowRight, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import VideoPlayer from "@/components/VideoPlayer";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
 
const SettingsPage = () => {
  const { user, profile, isAdmin, isGerente, refreshProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { data: userGroupIds } = useQuery({
    queryKey: ["user-group-ids", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("member_groups").select("group_id").eq("user_id", user?.id);
      return data?.map(d => d.group_id) || [];
    },
    enabled: !!user?.id
  });
 
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
  const [nativeNotifications, setNativeNotifications] = useState(() => localStorage.getItem("notify_enabled") !== "false");
  const [editingTest, setEditingTest] = useState<any>(null);
  const [deletingTest, setDeletingTest] = useState<any>(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
 
  // Video state
  const [tempVideoUrl, setTempVideoUrl] = useState("");
  const [tempIsVideoUpload, setTempIsVideoUpload] = useState(false);
 
  // Routine Permissions state
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
 
  const ROUTINES = [
    { id: "agenda", label: "Agenda", icon: Calendar, description: "Gestão de eventos e compromissos" },
    { id: "devocionais", label: "Devocionais", icon: BookOpen, description: "Leituras e meditações diárias" },
    { id: "voluntarios", label: "Voluntários", icon: HandHeart, description: "Escalas e gestão de equipes" },
    { id: "membros", label: "Membros", icon: Users, description: "Acesso ao cadastro de pessoas" },
    { id: "relatorios", label: "Relatórios", icon: BarChart3, description: "Dados, gráficos e estatísticas" },
    { id: "chat", label: "Chat", icon: MessageCircle, description: "Mensagens e comunicação interna" },
    { id: "kids", label: "Check-in", icon: ShieldCheck, description: "Check-in e proteção infantil" },
    { id: "Disparos", label: "Disparos", icon: Megaphone, description: "Mural de avisos e notificações" },
    { id: "tesouraria", label: "Tesouraria", icon: Wallet, description: "Gestão financeira e dízimos" },
  ];
 
  const ROLE_TYPES = [
    { id: "admin", label: "Administrador", description: "Acesso total ao sistema", color: "bg-primary" },
    { id: "gerente", label: "Líder (Gerente)", description: "Líderes de departamento", color: "bg-emerald-500" },
    { id: "membro", label: "Membro", description: "Acesso básico", color: "bg-slate-500" },
  ];
 
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
 
  const { data: permissions } = useQuery({
    queryKey: ["all-role-routines"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("group_routines").select("*");
      if (error) throw error;
      return data || [];
    },
  });
 
 
  const [editWhatsApp, setEditWhatsApp] = useState("");
  const [editInstagram, setEditInstagram] = useState("");
  const [editFacebook, setEditFacebook] = useState("");
  const [editPixKey, setEditPixKey] = useState("");
 
  useEffect(() => {
    if (siteSettings) {
      setEditWhatsApp(siteSettings.whatsapp_number || "");
      setEditInstagram(siteSettings.instagram_url || "");
      setEditFacebook(siteSettings.facebook_url || "");
      setEditPixKey(siteSettings.pix_key || "");
      setTempVideoUrl(siteSettings.about_us_video_url || "");
      setTempIsVideoUpload(siteSettings.about_us_video_is_upload === "true");
    }
  }, [siteSettings]);
 
  if (!isAdmin) return <Navigate to="/home" replace />;
 
  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      const updates = [
        { id: "whatsapp_number", value: editWhatsApp },
        { id: "instagram_url", value: editInstagram },
        { id: "facebook_url", value: editFacebook },
        { id: "pix_key", value: editPixKey },
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
 
  const saveVideoSettingsMutation = useMutation({
    mutationFn: async () => {
      const updates = [
        { id: "about_us_video_url", value: tempVideoUrl },
        { id: "about_us_video_is_upload", value: tempIsVideoUpload.toString() },
      ];
      for (const u of updates) {
        await (supabase as any).from("site_settings").upsert(u);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast({ title: "Vídeo institucional atualizado!" });
    },
    onError: (err: any) => toast({ title: "Erro ao salvar vídeo", description: err.message, variant: "destructive" }),
  });
 
  const toggleRoutineMutation = useMutation({
    mutationFn: async ({ roleId, routineKey, enabled }: { roleId: string, routineKey: string, enabled: boolean }) => {
      const { error } = await (supabase as any)
        .from("group_routines")
        .upsert(
          { group_id: roleId, routine_key: routineKey, is_enabled: enabled },
          { onConflict: "group_id,routine_key" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-role-routines"] });
      toast({ title: "Permissão atualizada!" });
    },
    onError: (err: any) => toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" }),
  });
 
  const getPermStatus = (roleId: string, routineKey: string) => {
    const perm = permissions?.find((p: any) => p.group_id === roleId && p.routine_key === routineKey);
    return perm ? perm.is_enabled : true;
  };
 
 
  const loadSettings = () => {
    if (siteSettings) {
      setEditWhatsApp(siteSettings.whatsapp_number || "");
      setEditInstagram(siteSettings.instagram_url || "");
      setEditFacebook(siteSettings.facebook_url || "");
    }
  };
 
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
 
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `video_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("devotionals")
        .upload(fileName, file, { upsert: true });
 
      if (uploadError) throw uploadError;
 
      const { data: urlData } = supabase.storage.from("devotionals").getPublicUrl(fileName);
      setTempVideoUrl(urlData.publicUrl);
      setTempIsVideoUpload(true);
      toast({ title: "Vídeo carregado!", description: "Clique em salvar para aplicar." });
    } catch (err: any) {
      toast({ title: "Erro no upload do vídeo", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };
 
  const handleSiteSettingUpload = async (e: React.ChangeEvent<HTMLInputElement>, settingKey: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${settingKey}_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("event-banners").upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
 
      const { data: urlData } = supabase.storage.from("event-banners").getPublicUrl(fileName);
      await (supabase as any).from("site_settings").upsert({ id: settingKey, value: urlData.publicUrl });
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast({ title: "Imagem da Home atualizada!" });
    } catch (err: any) {
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };
 
  const deletePhotoMutation = useMutation({
    mutationFn: async (p: any) => {
      const filename = p.url.split("/").pop();
      if (filename) await supabase.storage.from("landing-photos").remove([filename]);
      await (supabase as any).from("landing_photos").delete().eq("id", p.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landing-photos"] });
      toast({ title: "Foto removida!" });
    },
  });
 
  const saveTestMutation = useMutation({
    mutationFn: async () => {
      const payload = { name: testName, role: testRole, text: testText };
      if (editingTest) {
        const { error } = await (supabase as any).from("landing_testimonials").update(payload).eq("id", editingTest.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("landing_testimonials").insert(payload);
        if (error) throw error;
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
      const { error } = await (supabase as any).from("landing_testimonials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landing-testimonials"] });
      toast({ title: "Depoimento excluído!" });
    },
  });
 
  const handleToggleNotifications = (val: boolean) => {
    setNativeNotifications(val);
    localStorage.setItem("notify_enabled", val.toString());
    toast({
      title: val ? "Notificações ativadas" : "Notificações silenciadas",
      description: val ? "Você receberá avisos sonoros." : "Os avisos sonoros foram desativados."
    });
  };
 
  
  const removeMyPhotoMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase.from("profiles").update({ avatar_url: null } as any).eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      refreshProfile();
      toast({ title: "Sua foto foi removida!" });
    },
    onError: (err: any) => toast({ title: "Erro ao remover foto", description: err.message, variant: "destructive" }),
  });
 
  const approveContactMutation = useMutation({
    mutationFn: async (m: any) => {
      const phoneDigits = m.phone?.replace(/\D/g, "");
      const nameSlug = m.name?.trim().toLowerCase().replace(/\s+/g, ".");
      const loginPrefix = nameSlug || phoneDigits;
 
      const email = loginPrefix + "@ccmergulho.com";
      const { data, error } = await supabase.rpc("admin_manage_user" as any, {
        email, password: "123456", raw_user_meta_data: { full_name: m.name, whatsapp_phone: m.phone }
      });
      if (error) throw error;
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
      const { error } = await (supabase as any).from("contact_messages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-messages"] });
      toast({ title: "Mensagem arquivada!" });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao arquivar", description: err.message, variant: "destructive" });
    },
  });
 
  const prev = () => setCarouselIdx(i => (i - 1 + (photos?.length || 1)) % (photos?.length || 1));
  const next = () => setCarouselIdx(i => (i + 1) % (photos?.length || 1));
 
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Settings className="h-6 w-6 text-primary" />
        Configurações do Projeto
      </h1>
 
      <Tabs defaultValue="site">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 w-full bg-muted/50 p-1 rounded-2xl h-auto gap-1">
          <TabsTrigger value="site" className="rounded-xl flex items-center gap-2 py-2">
            <ImagePlus className="h-4 w-4" /> Layout
          </TabsTrigger>
          <TabsTrigger value="preferencias" className="rounded-xl flex items-center gap-2 py-2">
            <Bell className="h-4 w-4" /> Preferências
          </TabsTrigger>
          <TabsTrigger value="video" className="rounded-xl flex items-center gap-2 py-2">
            <Video className="h-4 w-4" /> Vídeo
          </TabsTrigger>
          <TabsTrigger value="links" className="rounded-xl flex items-center gap-2 py-2">
            <Youtube className="h-4 w-4" /> Canais
          </TabsTrigger>
          <TabsTrigger value="mensagens" className="rounded-xl flex items-center gap-2 py-2 relative">
            <Mail className="h-4 w-4" /> Inbox
            {contactMessages && contactMessages.length > 0 && (
              <span className="absolute -top-1 -right-0 h-4 w-4 bg-destructive text-white text-[8px] font-bold flex items-center justify-center rounded-full animate-bounce">
                {contactMessages.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="arquivados" className="rounded-xl flex items-center gap-2 py-2">
            <Archive className="h-4 w-4" /> Arquivos
          </TabsTrigger>
          <TabsTrigger value="rotinas" className="rounded-xl flex items-center gap-2 py-2">
            <Shield className="h-4 w-4" /> Privilégios
          </TabsTrigger>
        </TabsList>
 
        <TabsContent value="preferencias" className="pt-6">
          <Card className="border-0 shadow-xl overflow-hidden rounded-3xl">
            <div className="h-1.5 w-full bg-amber-500" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-amber-500" /> Notificações
              </CardTitle>
              <p className="text-sm text-muted-foreground">Configure como você recebe alertas na plataforma.</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50">
                <div className="space-y-0.5">
                  <Label className="text-base font-bold">Avisos Sonoros</Label>
                  <p className="text-xs text-muted-foreground">Reproduzir som ao receber novas mensagens ou atualizações importantes.</p>
                </div>
                <Switch
                  checked={nativeNotifications}
                  onCheckedChange={handleToggleNotifications}
                />
              </div>
 
              <div className="p-4 bg-muted/30 rounded-2xl border border-border/50">
              {/* Account Insights Section */}
              <div className="pt-6 border-t border-border/50">
                <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Insights da Conta
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-muted/30 p-4 rounded-2xl border border-border/50">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Membro desde</p>
                    <p className="text-sm font-bold">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR') : 'Recentemente'}</p>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-2xl border border-border/50">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Departamentos</p>
                    <p className="text-sm font-bold text-primary">{userGroupIds?.length || 0} Ativos</p>
                  </div>
                  <div className="sm:col-span-2 bg-primary/5 p-4 rounded-2xl border border-primary/10 flex items-center justify-between group cursor-pointer hover:bg-primary/10 transition-colors"
                    onClick={() => window.location.href = '/perfil'}>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-primary/70">Nível de Acesso</p>
                      <p className="text-sm font-black uppercase text-primary">
                        {isAdmin ? 'Administrador CCM' : isGerente ? 'Gestor de Fluxo' : 'Membro Conectado'}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-primary transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mt-3 italic">
                  Seus dados de perfil e foto devem ser gerenciados na página dedicada de Perfil.
                </p>
              </div>
            </div>
          </CardContent>
          </Card>
        </TabsContent>
 
 
        <TabsContent value="site" className="space-y-10 pt-6">
          {/* Photos Carousel Management */}
          <Card className="border-0 shadow-xl overflow-hidden rounded-3xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/20">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <ImagePlus className="h-5 w-5 text-primary" /> Carrossel de Fotos
                </CardTitle>
                <p className="text-xs text-muted-foreground">Fotos que aparecem no topo da Landing Page.</p>
              </div>
              <Button size="sm" className="rounded-xl gap-2" onClick={() => { setPhotoCaption(""); setEditingPhoto(null); setPhotoDialogOpen(true); }}>
                <Plus className="h-4 w-4" /> Adicionar
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              {photos && photos.length > 0 ? (
                <div className="space-y-6">
                  <div className="relative rounded-2xl overflow-hidden bg-black h-64 md:h-80 group">
                    <img
                      src={photos[carouselIdx]?.url}
                      alt={photos[carouselIdx]?.caption || ""}
                      className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-white font-medium">{photos[carouselIdx]?.caption || "Sem legenda"}</p>
                    </div>
                    <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="secondary" className="h-10 w-10 rounded-full" onClick={prev}><ChevronLeft /></Button>
                      <Button size="icon" variant="secondary" className="h-10 w-10 rounded-full" onClick={next}><ChevronRight /></Button>
                    </div>
                  </div>
 
                  <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
                    {photos.map((p: any, i: number) => (
                      <div key={p.id} className={cn("relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all aspect-square", i === carouselIdx ? "border-primary scale-105" : "border-transparent opacity-60 hover:opacity-100")} onClick={() => setCarouselIdx(i)}>
                        <img src={p.url} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 hover:opacity-100 bg-black/40 transition-opacity">
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-white" onClick={(e) => { e.stopPropagation(); setEditingPhoto(p); setPhotoCaption(p.caption || ""); setPhotoDialogOpen(true); }}><Edit2 className="h-3 w-3" /></Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-rose-500" onClick={(e) => { e.stopPropagation(); setDeletingPhoto(p); }}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-48 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-muted-foreground">
                  <ImagePlus className="h-10 w-10 mb-2 opacity-20" />
                  <p>Nenhuma foto cadastrada</p>
                </div>
              )}
            </CardContent>
          </Card>
 
          {/* Banner da Home Page Substituição */}
          <Card className="border-0 shadow-xl overflow-hidden rounded-3xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/20">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <ImagePlus className="h-5 w-5 text-indigo-500" /> Banner da Tela Inicial
                </CardTitle>
                <p className="text-xs text-muted-foreground">Foto de destaque na Home (tela principal de usuários logados).</p>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                <div className="w-48 h-32 bg-muted rounded-xl overflow-hidden border border-dashed flex-shrink-0 relative">
                  {siteSettings && siteSettings["homepage_banner"] ? (
                    <img src={siteSettings["homepage_banner"]} className="w-full h-full object-cover" alt="Banner Atual" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ImagePlus className="h-8 w-8 opacity-20" /></div>
                  )}
                </div>
                <div className="flex-1 space-y-4">
                  <p className="text-sm font-medium">Faça o upload do banner que ficará na recepção dos membros (Tamanho ideal: 1200x400 para efeito Outdoor centralizado).</p>
                  <Input type="file" accept="image/*" disabled={uploading} className="h-11 rounded-xl w-full" onChange={(e) => handleSiteSettingUpload(e, "homepage_banner")} />
                </div>
              </div>
            </CardContent>
          </Card>
 
          {/* Testimonials */}
          <Card className="border-0 shadow-xl overflow-hidden rounded-3xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/20">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <MessageSquareQuote className="h-5 w-5 text-primary" /> Depoimentos
                </CardTitle>
                <p className="text-xs text-muted-foreground">O que as pessoas dizem sobre o Mergulho.</p>
              </div>
              <Button size="sm" variant="outline" className="rounded-xl gap-2" onClick={() => { setTestName(""); setTestRole(""); setTestText(""); setEditingTest(null); setTestDialogOpen(true); }}>
                <Plus className="h-4 w-4" /> Novo
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {testimonials?.map((t: any) => (
                <div key={t.id} className="flex items-start gap-4 p-4 rounded-2xl bg-muted/30 border border-border/50 group">
                  <div className="flex-1">
                    <p className="text-sm italic leading-relaxed">"{t.text}"</p>
                    <p className="mt-2 font-bold text-sm text-primary">{t.name} <span className="font-normal text-muted-foreground text-xs">— {t.role}</span></p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditingTest(t); setTestName(t.name); setTestRole(t.role || ""); setTestText(t.text); setTestDialogOpen(true); }}><Edit2 className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-500" onClick={() => setDeletingTest(t)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
 
        <TabsContent value="video" className="pt-6">
          <Card className="border-0 shadow-xl rounded-3xl overflow-hidden">
            <div className="h-1.5 w-full bg-indigo-500" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-indigo-500" /> Vídeo Institucional
              </CardTitle>
              <p className="text-sm text-muted-foreground">Gerencie o vídeo "Conheça a Comunidade Cristã Mergulho" na Landing Page.</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-2xl border">
                  <div className="flex-1 space-y-2">
                    <Label>URL do Vídeo (YouTube, Vimeo ou Link Direto)</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://youtube.com/..."
                        value={tempVideoUrl}
                        onChange={(e) => {
                          setTempVideoUrl(e.target.value);
                          setTempIsVideoUpload(false);
                        }}
                        className="bg-background"
                      />
                      <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                      <Button
                        variant="secondary"
                        className="gap-2 shrink-0"
                        onClick={() => videoInputRef.current?.click()}
                        disabled={uploading}
                      >
                        <Upload className="h-4 w-4" /> {uploading ? "Subindo..." : "Upload"}
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">O upload salva o vídeo diretamente no servidor do projeto.</p>
                  </div>
                </div>
 
                <div className="space-y-3">
                  <Label>Prévia do Vídeo Atual</Label>
                  <div className="aspect-video rounded-2xl overflow-hidden border-4 border-muted/50 shadow-inner bg-black">
                    {tempVideoUrl ? (
                      <VideoPlayer url={tempVideoUrl} isUpload={tempIsVideoUpload} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground gap-2">
                        <Video className="h-8 w-8 opacity-20" /> Selecione um vídeo para prévia
                      </div>
                    )}
                  </div>
                </div>
 
                <Button className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg" onClick={() => saveVideoSettingsMutation.mutate()} disabled={saveVideoSettingsMutation.isPending}>
                  {saveVideoSettingsMutation.isPending ? "Salvando..." : "Salvar Configurações de Vídeo"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
 
        <TabsContent value="links" className="pt-6">
          <Card className="border-0 shadow-xl rounded-3xl overflow-hidden">
            <div className="h-1.5 w-full bg-emerald-500" />
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Youtube className="h-5 w-5 text-emerald-500" /> Canais Externos
              </CardTitle>
              <Button size="sm" variant="ghost" onClick={loadSettings}><Archive className="h-4 w-4 mr-2" /> Resetar</Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>WhatsApp de Atendimento</Label>
                  <Input value={editWhatsApp} onChange={e => setEditWhatsApp(e.target.value)} placeholder="85997763630" />
                </div>
                <div className="space-y-2">
                  <Label>Link do Instagram</Label>
                  <Input value={editInstagram} onChange={e => setEditInstagram(e.target.value)} placeholder="https://instagram.com/mergulho" />
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <Label>Link do Facebook</Label>
                  <Input value={editFacebook} onChange={e => setEditFacebook(e.target.value)} placeholder="https://facebook.com/mergulho" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold dark:bg-emerald-900/40 dark:text-emerald-400">₢</span>
                    Chave PIX da Igreja
                  </Label>
                  <Input
                    value={editPixKey}
                    onChange={e => setEditPixKey(e.target.value)}
                    placeholder="CPF, CNPJ, e-mail, celular ou chave aleatória"
                    className="font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground">Esta chave será exibida para os membros na tela de Tesouraria para pagamento via PIX.</p>
                </div>
              </div>
              <Button className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 font-bold" onClick={() => saveSettingsMutation.mutate()} disabled={saveSettingsMutation.isPending}>
                Atualizar Canais
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
 
        <TabsContent value="mensagens" className="pt-6">
          <div className="space-y-4">
            {contactMessages?.map((m: any) => (
              <Card key={m.id} className="border-0 shadow-xl rounded-3xl overflow-hidden group">
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 md:grid-cols-4">
                    <div className="p-6 bg-muted/20 flex flex-col justify-center">
                      <p className="font-black text-xs uppercase tracking-widest text-primary mb-1">{m.subject}</p>
                      <h4 className="font-bold text-lg">{m.name}</h4>
                      <p className="text-xs text-muted-foreground">{m.phone}</p>
                    </div>
                    <div className="md:col-span-2 p-6 flex flex-col justify-center">
                      <p className="text-sm leading-relaxed text-muted-foreground italic">"{m.message}"</p>
                    </div>
                    <div className="p-6 flex items-center justify-end gap-2 bg-muted/10 opacity-60 group-hover:opacity-100 transition-opacity">
                      <Button variant="outline" size="sm" className="rounded-xl" onClick={() => archiveContactMutation.mutate(m.id)}>Arquivar</Button>
                      {m.subject === "Quero me tornar Membro" && (
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 rounded-xl" onClick={() => approveContactMutation.mutate(m)}>Aprovar</Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!contactMessages || contactMessages.length === 0) && (
              <div className="h-64 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-muted-foreground">
                <CheckCircle className="h-10 w-10 mb-2 opacity-10" />
                <p>Nenhuma mensagem nova</p>
              </div>
            )}
          </div>
        </TabsContent>
 
        <TabsContent value="arquivados" className="pt-6">
          <Card className="border-0 shadow-xl rounded-3xl overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Archive className="h-5 w-5 text-primary" /> Conversas Arquivadas
              </CardTitle>
              <p className="text-sm text-muted-foreground">Acesse suas conversas arquivadas do chat.</p>
            </CardHeader>
            <CardContent className="text-center py-8">
              <Link to="/arquivos" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors">
                <Archive className="h-4 w-4" /> Abrir Conversas Arquivadas
              </Link>
            </CardContent>
          </Card>
        </TabsContent>
 
        <TabsContent value="rotinas" className="pt-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {ROLE_TYPES.map((role) => (
              <Card
                key={role.id}
                className={cn(
                  "cursor-pointer transition-all border-2 rounded-2xl",
                  selectedRole === role.id ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted/50"
                )}
                onClick={() => setSelectedRole(role.id)}
              >
                <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
                  <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center text-white", role.color)}>
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{role.label}</p>
                    <p className="text-[10px] text-muted-foreground">{role.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
 
          {selectedRole ? (
            <Card className="border-0 shadow-xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-muted/20 border-b pb-4">
                <CardTitle className="text-lg">Acessos: {ROLE_TYPES.find(r => r.id === selectedRole)?.label}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:gap-px md:bg-muted/10">
                  {ROUTINES.map((routine) => {
                    const isEnabled = getPermStatus(selectedRole, routine.id);
                    const Icon = routine.icon;
                    return (
                      <div key={routine.id} className="p-4 bg-card flex items-center justify-between hover:bg-muted/5 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", isEnabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-bold text-xs">{routine.label}</p>
                            <p className="text-[10px] text-muted-foreground">{routine.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn("text-[9px] font-bold uppercase", isEnabled ? "text-primary" : "text-muted-foreground")}>
                            {isEnabled ? "On" : "Off"}
                          </span>
                          <input
                            type="checkbox"
                            className="w-8 h-4 rounded-full bg-muted checked:bg-primary appearance-none cursor-pointer transition-colors relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-transform checked:after:translate-x-4 border border-border"
                            checked={isEnabled}
                            onChange={(e) => toggleRoutineMutation.mutate({
                              roleId: selectedRole,
                              routineKey: routine.id,
                              enabled: e.target.checked
                            })}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-48 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-muted-foreground text-center p-6">
              <Lock className="h-8 w-8 mb-2 opacity-20" />
              <p className="text-sm font-medium">Selecione um perfil para configurar as rotinas</p>
            </div>
          )}
        </TabsContent>
 
      </Tabs>
 
 
      {/* Dialogs */}
      <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border-0 shadow-2xl">
          <DialogHeader><DialogTitle className="text-xl font-bold">Adicionar Foto</DialogTitle></DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Legenda</Label>
              <Input placeholder="Descreva a foto brevemente..." value={photoCaption} onChange={e => setPhotoCaption(e.target.value)} className="rounded-xl h-11" />
            </div>
            <div className="space-y-4">
              <Label>Arquivo de Imagem</Label>
              <div className="border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                <div className="p-3 bg-primary/10 rounded-full text-primary"><Upload className="h-6 w-6" /></div>
                <div className="text-center">
                  <p className="text-sm font-bold">Clique para selecionar</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG ou WEBP até 10MB</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
 
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl border-0 shadow-2xl">
          <DialogHeader><DialogTitle className="text-xl font-bold">Depoimento</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nome</Label><Input value={testName} onChange={e => setTestName(e.target.value)} className="rounded-xl h-11" /></div>
              <div className="space-y-2"><Label>Cargo/Função</Label><Input value={testRole} onChange={e => setTestRole(e.target.value)} className="rounded-xl h-11" /></div>
            </div>
            <div className="space-y-2"><Label>Contexto</Label><Textarea value={testText} onChange={e => setTestText(e.target.value)} className="rounded-2xl resize-none h-32" /></div>
            <Button className="w-full h-12 rounded-xl font-bold" onClick={() => saveTestMutation.mutate()}>{saveTestMutation.isPending ? "Salvando..." : "Salvar Depoimento"}</Button>
          </div>
        </DialogContent>
      </Dialog>
 
      <ConfirmDialog open={!!deletingPhoto} title="Remover Foto?" description="Essa ação é permanente." onConfirm={() => deletePhotoMutation.mutate(deletingPhoto)} onCancel={() => setDeletingPhoto(null)} />
      <ConfirmDialog open={!!deletingTest} title="Remover Depoimento?" description="Essa ação é permanente." onConfirm={() => deleteTestMutation.mutate(deletingTest?.id)} onCancel={() => setDeletingTest(null)} />
    </div>
  );
};
 
export default SettingsPage;
 



