import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
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
import { Settings, ImagePlus, MessageSquareQuote, Trash2, Plus, Edit2, ChevronLeft, ChevronRight, Upload, Mail, CheckCircle, Archive, Video, Youtube, Shield, Users, Calendar, BookOpen, HandHeart, BarChart3, MessageCircle, ShieldCheck, Megaphone, Lock, ChevronRight as ChevronRightIcon, Bell, ArrowRight, Wallet, FileSearch } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import VideoPlayer from "@/components/VideoPlayer";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/errorMessages";
import { normalizePhoneForDB } from "@/lib/phoneUtils";
import { Switch } from "@/components/ui/switch";
 
const SettingsPage = () => {
  const { user, profile, isAdmin, isGerente, isAdminCCM, refreshProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const { data: userGroupIds } = useQuery({
    queryKey: ["user-group-ids", user?.id],
    queryFn: async () => {
      const { data } = await api.get('/member-groups/my');
      return data?.map((d: any) => d.groupId || d.group_id) || [];
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

  // Rotinas exclusivas ADM CCM — não aparecem na grade geral de roles
  const CCM_ONLY_ROUTINES = [
    { id: "auditoria", label: "Auditoria & Logs", icon: FileSearch, description: "Registros de acesso e ações do sistema" },
    { id: "ajustes", label: "Configurações", icon: Settings, description: "Ajustes gerais da plataforma" },
  ];
 
  const ROLE_TYPES = [
    { id: "admin", label: "Administrador", description: "Acesso total ao sistema", color: "bg-primary" },
    { id: "gerente", label: "Líder (Gerente)", description: "Líderes de departamento", color: "bg-emerald-500" },
    { id: "membro", label: "Membro", description: "Acesso básico", color: "bg-slate-500" },
  ];
 
  const { data: photos } = useQuery({
    queryKey: ["landing-photos"],
    queryFn: async () => {
      const { data } = await api.get('/landing-photos');
      return data || [];
    },
  });
 
  const { data: testimonials } = useQuery({
    queryKey: ["landing-testimonials"],
    queryFn: async () => {
      const { data } = await api.get('/landing-testimonials');
      return data || [];
    },
  });
 
  const { data: contactMessages } = useQuery({
    queryKey: ["contact-messages"],
    queryFn: async () => {
      const { data } = await api.get('/contact-messages');
      return data || [];
    },
  });
 
  const { data: siteSettings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data } = await api.get('/site-settings');
      const settings: Record<string, string> = {};
      (data || []).forEach((s: any) => { settings[s.id] = s.value; });
      return settings;
    },
  });
 
  const { data: permissions } = useQuery({
    queryKey: ["all-role-routines"],
    queryFn: async () => {
      const { data } = await api.get('/group-routines');
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
        await api.post('/site-settings/upsert', u);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast({ title: "Configurações salvas!" });
    },
    onError: (err: any) => toast({ title: "Erro ao salvar", description: getErrorMessage(err), variant: "destructive" }),
  });
 
  const saveVideoSettingsMutation = useMutation({
    mutationFn: async () => {
      const updates = [
        { id: "about_us_video_url", value: tempVideoUrl },
        { id: "about_us_video_is_upload", value: tempIsVideoUpload.toString() },
      ];
      for (const u of updates) {
        await api.post('/site-settings/upsert', u);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast({ title: "Vídeo institucional atualizado!" });
    },
    onError: (err: any) => toast({ title: "Erro ao salvar vídeo", description: getErrorMessage(err), variant: "destructive" }),
  });
 
  const toggleRoutineMutation = useMutation({
    mutationFn: async ({ roleId, routineKey, enabled }: { roleId: string, routineKey: string, enabled: boolean }) => {
      await api.post('/group-routines/upsert', { groupId: roleId, routineKey, isEnabled: enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-role-routines"] });
      toast({ title: "Permissão atualizada!" });
    },
    onError: (err: any) => toast({ title: "Erro ao salvar", description: getErrorMessage(err), variant: "destructive" }),
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
      const formData = new FormData();
      formData.append('file', file);
      const { data: uploadData } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const publicUrl = uploadData.url;
 
      if (editingPhoto) {
        await api.patch(`/landing-photos/${editingPhoto.id}`, { url: publicUrl, caption: photoCaption });
      } else {
        await api.post(`/landing-photos`, { url: publicUrl, caption: photoCaption });
      }
      queryClient.invalidateQueries({ queryKey: ["landing-photos"] });
      setPhotoDialogOpen(false);
      setEditingPhoto(null);
      setPhotoCaption("");
      toast({ title: "Foto salva com sucesso!" });
    } catch (err: any) {
      toast({ title: "Erro no upload", description: getErrorMessage(err), variant: "destructive" });
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
      const { data: uploadData } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setTempVideoUrl(uploadData.url);
      setTempIsVideoUpload(true);
      toast({ title: "Vídeo carregado!", description: "Clique em salvar para aplicar." });
    } catch (err: any) {
      toast({ title: "Erro no upload do vídeo", description: getErrorMessage(err), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };
 
  const handleSiteSettingUpload = async (e: React.ChangeEvent<HTMLInputElement>, settingKey: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data: uploadData } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await api.post('/site-settings/upsert', { id: settingKey, value: uploadData.url });
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast({ title: "Imagem da Home atualizada!" });
    } catch (err: any) {
      toast({ title: "Erro no upload", description: getErrorMessage(err), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };
 
  const handleRemoveSiteSetting = async (settingKey: string) => {
    if (!window.confirm("Tem certeza que deseja remover este banner?")) return;
    setUploading(true);
    try {
      await api.delete(`/site-settings/${settingKey}`);
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast({ title: "Banner removido com sucesso!" });
    } catch (err: any) {
      toast({ title: "Erro ao remover banner", description: getErrorMessage(err), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };
 
  const savePhotoMutation = useMutation({
    mutationFn: async () => {
      if (editingPhoto && !fileInputRef.current?.files?.[0]) {
        await api.patch(`/landing-photos/${editingPhoto.id}`, { caption: photoCaption });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landing-photos"] });
      setPhotoDialogOpen(false);
      setEditingPhoto(null);
      setPhotoCaption("");
      toast({ title: "Legenda atualizada!" });
    },
  });
 
  const openEditPhoto = (photo: any) => {
    setEditingPhoto(photo);
    setPhotoCaption(photo.caption || "");
    setPhotoDialogOpen(true);
  };
 
  const deletePhotoMutation = useMutation({
    mutationFn: async (photo: any) => {
      await api.delete(`/landing-photos/${photo.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landing-photos"] });
      setDeletingPhoto(null);
      toast({ title: "Foto removida!" });
    },
  });
 
  const saveTestimonialMutation = useMutation({
    mutationFn: async () => {
      if (editingTest) {
        await api.patch(`/landing-testimonials/${editingTest.id}`, { name: testName, role: testRole, text: testText });
      } else {
        await api.post(`/landing-testimonials`, { name: testName, role: testRole, text: testText });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landing-testimonials"] });
      setTestDialogOpen(false);
      setEditingTest(null);
      setTestName(""); setTestRole(""); setTestText("");
      toast({ title: editingTest ? "Depoimento atualizado!" : "Depoimento criado!" });
    },
  });
 
  const openEditTest = (t: any) => {
    setEditingTest(t);
    setTestName(t.name || "");
    setTestRole(t.role || "");
    setTestText(t.text || "");
    setTestDialogOpen(true);
  };
 
  const deleteTestMutation = useMutation({
    mutationFn: async (t: any) => {
      await api.delete(`/landing-testimonials/${t.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landing-testimonials"] });
      setDeletingTest(null);
      toast({ title: "Depoimento removido!" });
    },
  });
 
  // Função para abrir o uploader de imagem chamando o input invisível
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
 
  const triggerVideoInput = () => {
    if (videoInputRef.current) {
      videoInputRef.current.click();
    }
  };
 
  const handleToggleNotifications = async (checked: boolean) => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        localStorage.setItem("notify_enabled", checked.toString());
        setNativeNotifications(checked);
        toast({ title: checked ? "Notificações Ativadas" : "Notificações Desativadas" });
      } else {
        if (checked) {
          toast({ title: "Permissão Negada", description: "Ative as notificações do navegador para este site.", variant: "destructive" });
        }
      }
    } catch (e) {
      console.warn("Navegador não suporta notificações", e);
    }
  };
 
  return (
    <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Definições da Conta</h1>
            <p className="text-muted-foreground mt-1">Gerencie seu aplicativo e landing page.</p>
          </div>
        </div>
        <Link to="/admin">
          <Button variant="outline" className="gap-2">
            Ver Membros <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
 
      {isAdminCCM && (
        <Card className="border-0 shadow-md bg-gradient-to-r from-rose-500/10 to-transparent border-l-4 border-l-rose-500 mb-6">
          <CardHeader className="py-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-rose-500" />
              <CardTitle className="text-lg">Acesso Master (ADM CCM)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="py-0 pb-4">
            <p className="text-sm text-muted-foreground mb-4">
              Você tem permissões de gerenciamento de logs globais e configurações de sistema.
            </p>
            <div className="flex gap-3">
              <Link to="/admin">
                <Button size="sm" variant="outline" className="gap-2 border-rose-200">
                  <Users className="h-4 w-4" /> Gestão de Administradores
                </Button>
              </Link>
              <Link to="/admin/logs">
                <Button size="sm" variant="outline" className="gap-2 border-rose-200">
                  <FileSearch className="h-4 w-4" /> Ver Audit Logs
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
 
      <Tabs defaultValue="landing">
        <TabsList className="mb-4 bg-muted/50 p-1 rounded-xl flex-wrap h-auto gap-1">
          <TabsTrigger value="landing" className="rounded-lg">Site Público</TabsTrigger>
          {isAdminCCM && <TabsTrigger value="permissions" className="rounded-lg">Privilégios</TabsTrigger>}
          <TabsTrigger value="social" className="rounded-lg">Redes Sócias</TabsTrigger>
          <TabsTrigger value="sys" className="rounded-lg">Sistema</TabsTrigger>
        </TabsList>
 
        <TabsContent value="landing" className="space-y-6">
          <Card className="border-0 neo-shadow mb-6">
            <CardHeader className="bg-primary/5 border-b py-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                Vídeo Institucional
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Este vídeo aparece na seção "Sobre Nós" da página inicial. Você pode enviar um arquivo MP4/WebM padrão ou colar o link de um vídeo do youtube.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-4">
                  <div>
                     <Label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">Opção 1: Fazer Upload (MP4, WebM)</Label>
                     <div className="flex gap-2">
                       <input type="file" ref={videoInputRef} className="hidden" accept="video/mp4,video/webm" onChange={handleVideoUpload} />
                       <Button onClick={triggerVideoInput} disabled={uploading} variant="outline" className="w-full justify-start h-12">
                         {uploading ? "Carregando..." : <><Upload className="h-4 w-4 mr-2"/> Enviar arquivo de vídeo</>}
                       </Button>
                     </div>
                  </div>
 
                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-muted"></div>
                    <span className="flex-shrink-0 mx-4 text-xs font-medium text-muted-foreground uppercase">OU</span>
                    <div className="flex-grow border-t border-muted"></div>
                  </div>
 
                  <div>
                     <Label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block flex items-center gap-1">
                       <Youtube className="h-4 w-4"/> Opção 2: Link do YouTube
                     </Label>
                     <Input 
                       placeholder="https://www.youtube.com/watch?v=..." 
                       value={tempIsVideoUpload ? "" : tempVideoUrl}
                       onChange={(e) => {
                         setTempVideoUrl(e.target.value);
                         setTempIsVideoUpload(false);
                       }}
                       className="h-12 border-primary/20 focus-visible:ring-primary"
                     />
                  </div>
 
                  <Button 
                    onClick={() => saveVideoSettingsMutation.mutate()} 
                    disabled={saveVideoSettingsMutation.isPending || (!tempVideoUrl && !tempIsVideoUpload)}
                    className="w-full sm:w-auto mt-4"
                  >
                    Salvar Vídeo Institucional
                  </Button>
                </div>
 
                <div className="bg-muted/10 rounded-2xl border p-2 aspect-video flex items-center justify-center overflow-hidden">
                   {tempVideoUrl ? (
                     <div className="w-full h-full relative group">
                       <VideoPlayer url={tempVideoUrl} isUpload={tempIsVideoUpload} />
                     </div>
                   ) : (
                     <div className="text-center text-muted-foreground">
                        <Video className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm font-medium">Nenhum vídeo configurado</p>
                     </div>
                   )}
                </div>
              </div>
            </CardContent>
          </Card>
 
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-secondary/40 border-b pb-4">
              <CardTitle className="text-lg">Banners Carrossel da Home</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { key: 'home_banner_1', label: 'Banner 1' },
                  { key: 'home_banner_2', label: 'Banner 2' },
                  { key: 'home_banner_3', label: 'Banner 3' },
                ].map((banner, index) => (
                  <div key={banner.key} className="space-y-3">
                    <Label className="font-semibold">{banner.label}</Label>
                    <div className="aspect-[16/9] w-full rounded-xl overflow-hidden border-2 border-dashed relative bg-muted/30 group">
                      {siteSettings?.[banner.key] ? (
                        <>
                          <img src={siteSettings[banner.key]} alt={banner.label} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Label className="cursor-pointer bg-primary text-white p-2 rounded-full hover:scale-105 transition-transform" title="Trocar imagem">
                              <ImagePlus className="h-5 w-5" />
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleSiteSettingUpload(e, banner.key)} disabled={uploading} />
                            </Label>
                            <Button size="icon" variant="destructive" className="rounded-full h-9 w-9" onClick={() => handleRemoveSiteSetting(banner.key)} title="Remover banner">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      ) : (
                        <Label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors text-muted-foreground">
                          <ImagePlus className="h-8 w-8 mb-2 opacity-50" />
                          <span className="text-sm font-medium">Adicionar Imagem</span>
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleSiteSettingUpload(e, banner.key)} disabled={uploading} />
                        </Label>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
 
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between bg-primary/5 border-b pb-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2"><ImagePlus className="h-5 w-5" /> Fotos da Galeria</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Imagens que aparecem na página de login e na landing page principal.</p>
              </div>
              <Button onClick={() => {
                setEditingPhoto(null);
                setPhotoCaption("");
                setPhotoDialogOpen(true);
              }} size="sm">
                <Plus className="h-4 w-4 mr-2" /> Nova Foto
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              {photos?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Nenhuma foto na galeria.</div>
              ) : (
                <div className="relative">
                  {photos && photos.length > 0 && (
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-full max-w-3xl aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden relative shadow-lg group">
                        <img src={photos[carouselIdx]?.url} alt={photos[carouselIdx]?.caption} className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105" />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 pt-12 flex items-end justify-between">
                          <div>
                            <Badge className="bg-primary hover:bg-primary border-0 mb-2">Destaque {carouselIdx + 1}</Badge>
                            <p className="text-white font-medium text-lg md:text-xl drop-shadow-md">{photos[carouselIdx]?.caption || "Sem legenda"}</p>
                          </div>
                          <div className="flex gap-2">
                             <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur" onClick={() => openEditPhoto(photos[carouselIdx])}><Edit2 className="h-4 w-4 text-white" /></Button>
                             <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full bg-rose-500/80 hover:bg-rose-500 backdrop-blur" onClick={() => setDeletingPhoto(photos[carouselIdx])}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </div>
                        
                        <div className="absolute inset-y-0 left-4 flex items-center">
                          <Button size="icon" variant="outline" className="rounded-full bg-background/50 border-white/20 backdrop-blur hover:bg-background/80" onClick={() => setCarouselIdx(prev => (prev === 0 ? photos.length - 1 : prev - 1))}>
                            <ChevronLeft className="h-5 w-5" />
                          </Button>
                        </div>
                        <div className="absolute inset-y-0 right-4 flex items-center">
                          <Button size="icon" variant="outline" className="rounded-full bg-background/50 border-white/20 backdrop-blur hover:bg-background/80" onClick={() => setCarouselIdx(prev => (prev === photos.length - 1 ? 0 : prev + 1))}>
                            <ChevronRight className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-center gap-2 mt-4 flex-wrap">
                    {photos?.map((photo: any, i: number) => (
                      <button key={photo.id} onClick={() => setCarouselIdx(i)} className={cn("w-16 h-16 rounded-xl overflow-hidden border-2 transition-all", carouselIdx === i ? "border-primary scale-110 shadow-md ring-2 ring-primary/30 ring-offset-2" : "border-transparent opacity-60 hover:opacity-100")}>
                        <img src={photo.url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
 
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between bg-primary/5 border-b pb-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2"><MessageSquareQuote className="h-5 w-5" /> Depoimentos</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Opiniões de membros exibidas na página inicial.</p>
              </div>
              <Button onClick={() => {
                setEditingTest(null);
                setTestName(""); setTestRole(""); setTestText("");
                setTestDialogOpen(true);
              }} size="sm">
                <Plus className="h-4 w-4 mr-2" /> Novo
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {testimonials?.map((t: any) => (
                  <div key={t.id} className="p-5 border rounded-2xl bg-card hover:shadow-md transition-shadow relative group">
                    <QuoteIcon className="absolute top-4 right-4 h-8 w-8 text-muted-foreground/10" />
                    <p className="text-sm italic mb-4 relative z-10">"{t.text}"</p>
                    <div className="flex items-center justify-between border-t pt-3">
                       <div>
                         <p className="font-semibold text-sm">{t.name}</p>
                         <p className="text-xs text-muted-foreground">{t.role}</p>
                       </div>
                       <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditTest(t)}><Edit2 className="h-4 w-4" /></Button>
                         <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => setDeletingTest(t)}><Trash2 className="h-4 w-4" /></Button>
                       </div>
                    </div>
                  </div>
                ))}
                {testimonials?.length === 0 && <p className="text-muted-foreground col-span-2 text-center py-4">Nenhum depoimento cadastrado.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
 
        <TabsContent value="permissions" className="space-y-6">
           <Card className="border-0 shadow-md">
             <CardHeader className="bg-primary/5 border-b pb-6">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                     <Shield className="h-5 w-5 text-white" />
                   </div>
                   <div>
                     <CardTitle className="text-xl">Gestão de Privilégios</CardTitle>
                     <p className="text-sm text-muted-foreground mt-1">Configure o acesso aos módulos do sistema por tipo de usuário.</p>
                   </div>
                </div>
             </CardHeader>
             <CardContent className="pt-6 px-4 md:px-6">
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {ROLE_TYPES.map(role => (
                     <button
                       key={role.id}
                       onClick={() => setSelectedRole(role.id)}
                       className={cn(
                          "flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all relative overflow-hidden",
                          selectedRole === role.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                       )}
                     >
                        <div className={cn("h-12 w-12 rounded-full flex items-center justify-center mb-3 text-white shadow-sm", role.color)}>
                           <Users className="h-6 w-6" />
                        </div>
                        <h3 className="font-bold text-lg">{role.label}</h3>
                        <p className="text-xs text-muted-foreground text-center mt-1">{role.description}</p>
                        
                        {selectedRole === role.id && (
                           <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-primary animate-pulse" />
                        )}
                     </button>
                  ))}
                </div>
 
                {selectedRole ? (
                  <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                     <div className="flex items-center justify-between pb-2 border-b">
                        <h4 className="font-bold text-lg flex items-center gap-2">
                          Configurando acessos para: 
                          <Badge variant="outline" className="text-primary border-primary/30 uppercase">{ROLE_TYPES.find(r => r.id === selectedRole)?.label}</Badge>
                        </h4>
                     </div>
                     
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {ROUTINES.map(routine => {
                          const isEnabled = getPermStatus(selectedRole, routine.id);
                          return (
                             <div key={routine.id} className={cn(
                                "flex items-center justify-between p-4 rounded-xl border transition-all",
                                isEnabled ? "bg-card border-border" : "bg-muted/30 border-dashed"
                             )}>
                               <div className="flex gap-3 items-center">
                                  <div className={cn(
                                     "h-10 w-10 rounded-lg flex items-center justify-center",
                                     isEnabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                  )}>
                                     <routine.icon className="h-5 w-5" />
                                  </div>
                                  <div>
                                     <p className={cn("font-medium text-sm", !isEnabled && "text-muted-foreground")}>{routine.label}</p>
                                     <p className="text-[10px] text-muted-foreground leading-tight">{routine.description}</p>
                                  </div>
                               </div>
                               <Switch 
                                 checked={isEnabled}
                                 onCheckedChange={(checked) => toggleRoutineMutation.mutate({ roleId: selectedRole, routineKey: routine.id, enabled: checked })}
                               />
                             </div>
                          )
                        })}
                     </div>
 
                     {selectedRole !== 'membro' && selectedRole !== 'gerente' && (
                       <div className="mt-8">
                         <div className="flex items-center gap-2 mb-4 text-rose-500 bg-rose-50 p-3 rounded-lg border border-rose-100">
                            <Lock className="h-5 w-5" />
                            <h4 className="font-bold text-sm">Privilégios Restritos (Acesso Master)</h4>
                         </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {CCM_ONLY_ROUTINES.map(routine => {
                              // Force enable for admin_ccm logic is handled in API/UI, but we display the state here.
                              // Admin normal can't change these usually, but for visual we show them disabled unless you actually query them.
                              // Assuming getPermStatus works for them if we seeded them.
                              const isEnabled = getPermStatus(selectedRole, routine.id);
                              return (
                                 <div key={routine.id} className="flex items-center justify-between p-4 rounded-xl border bg-rose-500/5 transition-all">
                                   <div className="flex gap-3 items-center opacity-80">
                                      <div className="h-10 w-10 bg-rose-500/10 text-rose-500 rounded-lg flex items-center justify-center">
                                         <routine.icon className="h-5 w-5" />
                                      </div>
                                      <div>
                                         <p className="font-medium text-sm text-foreground">{routine.label}</p>
                                      </div>
                                   </div>
                                   <Switch 
                                     checked={isEnabled}
                                     onCheckedChange={(checked) => toggleRoutineMutation.mutate({ roleId: selectedRole, routineKey: routine.id, enabled: checked })}
                                   />
                                 </div>
                              )
                            })}
                         </div>
                       </div>
                     )}
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center bg-muted/20 rounded-2xl border-2 border-dashed">
                     <Shield className="h-12 w-12 text-muted-foreground/30 mb-4" />
                     <h3 className="font-semibold text-lg">Selecione um tipo de conta</h3>
                     <p className="text-muted-foreground text-sm max-w-sm mt-1">Para visualizar ou alterar as permissões de acesso às rotinas da plataforma, escolha um dos cards acima.</p>
                  </div>
                )}
             </CardContent>
           </Card>
        </TabsContent>
 
        <TabsContent value="social" className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-primary/5 border-b pb-4">
              <CardTitle className="text-lg">Redes e Contatos</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>WhatsApp (Apenas números)</Label>
                  <Input value={editWhatsApp} onChange={(e) => setEditWhatsApp(e.target.value.replace(/\D/g, ""))} placeholder="Ex: 5511999999999" />
                </div>
                <div className="space-y-2">
                  <Label>Chave PIX (Telefone/Email/CPF)</Label>
                  <Input value={editPixKey} onChange={(e) => setEditPixKey(e.target.value)} placeholder="Ex: financeiro@igreja.com" />
                </div>
                <div className="space-y-2">
                  <Label>Instagram URL</Label>
                  <Input value={editInstagram} onChange={(e) => setEditInstagram(e.target.value)} placeholder="https://instagram.com/..." />
                </div>
                <div className="space-y-2">
                  <Label>Facebook URL</Label>
                  <Input value={editFacebook} onChange={(e) => setEditFacebook(e.target.value)} placeholder="https://facebook.com/..." />
                </div>
              </div>
              <Button onClick={() => saveSettingsMutation.mutate()} disabled={saveSettingsMutation.isPending} className="mt-4"><Edit2 className="h-4 w-4 mr-2" /> Salvar Links</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sys" className="space-y-6">
           <Card className="border-0 shadow-md overflow-hidden">
             <CardHeader className="bg-primary/5 border-b pb-4">
                <CardTitle className="text-lg flex items-center gap-2"><Bell className="h-5 w-5 text-primary"/> Notificações Push</CardTitle>
             </CardHeader>
             <CardContent className="pt-6">
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border max-w-2xl">
                   <div>
                      <p className="font-semibold">Notificações no Dispositivo</p>
                      <p className="text-sm text-muted-foreground mt-1 block">Receba alertas locais quando novos itens forem criados.</p>
                   </div>
                   <Switch checked={nativeNotifications} onCheckedChange={handleToggleNotifications} />
                </div>
             </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
 
      {/* Photo Dialog */}
      <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPhoto ? "Editar Legenda" : "Nova Foto da Galeria"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!editingPhoto && (
              <div className="space-y-2">
                <Label>Escolha a imagem</Label>
                <div className="flex gap-2">
                   <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChangeCapture={handleFileUpload} />
                   <Button onClick={triggerFileInput} disabled={uploading} variant="outline" className="w-full">
                     {uploading ? "Carregando..." : <><ImagePlus className="h-4 w-4 mr-2"/> Selecionar Arquivo</>}
                   </Button>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Legenda (Opcional)</Label>
              <Input placeholder="Qual o momento capturado?" value={photoCaption} onChange={(e) => setPhotoCaption(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPhotoDialogOpen(false)}>Cancelar</Button>
            <Button disabled={uploading || savePhotoMutation.isPending} onClick={() => {
               if(editingPhoto) savePhotoMutation.mutate();
               else handleFileUpload({ target: fileInputRef.current } as any);
            }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
 
      {/* Testimonial Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingTest ? "Editar Depoimento" : "Novo Depoimento"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input value={testName} onChange={(e) => setTestName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Cargo / Papel na Igreja</Label>
              <Input value={testRole} onChange={(e) => setTestRole(e.target.value)} placeholder="Ex: Membro há 5 anos, Voluntário Kids..." />
            </div>
            <div className="space-y-2">
              <Label>Depoimento</Label>
              <Textarea value={testText} onChange={(e) => setTestText(e.target.value)} rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => saveTestimonialMutation.mutate()} disabled={!testName || !testText || saveTestimonialMutation.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
 
      <ConfirmDialog open={!!deletingPhoto} title="Apagar foto?" description="Esta ação não pode ser desfeita e a imagem será removida da landing page." onConfirm={() => deletePhotoMutation.mutate(deletingPhoto)} onCancel={() => setDeletingPhoto(null)} variant="destructive" />
      <ConfirmDialog open={!!deletingTest} title="Remover depoimento?" description="Isso o tirará da exibição da página inicial." onConfirm={() => deleteTestMutation.mutate(deletingTest)} onCancel={() => setDeletingTest(null)} variant="destructive" />
    </div>
  );
};
 
function QuoteIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10 11h-4a3 3 0 0 1 3-3v-2a5 5 0 0 0-5 5v5h6v-5zm10 0h-4a3 3 0 0 1 3-3v-2a5 5 0 0 0-5 5v5h6v-5z" />
    </svg>
  );
}
 
export default SettingsPage;
