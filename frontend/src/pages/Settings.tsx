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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Settings, ImagePlus, MessageSquareQuote, Trash2, Plus, Edit2, ChevronLeft, ChevronRight, Upload, Mail, CheckCircle, Archive, Video, Youtube, Shield, Users, Calendar, BookOpen, HandHeart, BarChart3, MessageCircle, ShieldCheck, Megaphone, Lock, ChevronRight as ChevronRightIcon, Bell, ArrowRight, Wallet, FileSearch, LayoutGrid, UserCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import VideoPlayer from "@/components/VideoPlayer";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn, getUploadUrl } from "@/lib/utils";
import { getErrorMessage } from "@/lib/errorMessages";
import { normalizePhoneForDB } from "@/lib/phoneUtils";
import { Switch } from "@/components/ui/switch";
import { MapPin, ExternalLink } from "lucide-react";

const SettingsPage = () => {
  const { user, profile, isAdmin, IsLider, isAdminCCM, refreshProfile } = useAuth();
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

  const { data: photos } = useQuery({
    queryKey: ["landing-photos"],
    queryFn: async () => {
      const { data } = await api.get('/landing-photos', { params: { isBanner: 'false' } });
      return data || [];
    },
  });

  const { data: homeBanners } = useQuery({
    queryKey: ["landing-photos-banners"],
    queryFn: async () => {
      const { data } = await api.get('/landing-photos', { params: { isBanner: 'true' } });
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



  // Photo state
  const [photoCaption, setPhotoCaption] = useState("");
  const [photoIsBanner, setPhotoIsBanner] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<any>(null);
  const [deletingPhoto, setDeletingPhoto] = useState<any>(null);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [carouselIdx, setCarouselIdx] = useState(0);

  useEffect(() => {
    if (photos && carouselIdx >= photos.length && photos.length > 0) {
      setCarouselIdx(photos.length - 1);
    } else if (photos && photos.length === 0) {
      setCarouselIdx(0);
    }
  }, [photos, carouselIdx]);

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





  const [editWhatsApp, setEditWhatsApp] = useState("");
  const [editInstagram, setEditInstagram] = useState("");
  const [editFacebook, setEditFacebook] = useState("");
  const [editPixKey, setEditPixKey] = useState("");
  const [editYoutube, setEditYoutube] = useState("");
  const [editMapsUrl, setEditMapsUrl] = useState("");

  useEffect(() => {
    if (siteSettings) {
      setEditWhatsApp(siteSettings.whatsapp_number || "");
      setEditInstagram(siteSettings.instagram_url || "");
      setEditFacebook(siteSettings.facebook_url || "");
      setEditYoutube(siteSettings.youtube_url || "");
      setEditPixKey(siteSettings.pix_key || "");
      setEditMapsUrl(siteSettings.maps_embed_url || "");
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
        { id: "youtube_url", value: editYoutube },
        { id: "pix_key", value: editPixKey },
        { id: "maps_embed_url", value: editMapsUrl },
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
      const { data: uploadData } = await api.post('/upload', formData);
      const publicUrl = uploadData.url;

      if (editingPhoto) {
        await api.patch(`/landing-photos/${editingPhoto.id}`, { url: publicUrl, caption: photoCaption, isBanner: photoIsBanner });
      } else {
        await api.post(`/landing-photos`, { url: publicUrl, caption: photoCaption, isBanner: photoIsBanner });
      }
      queryClient.invalidateQueries({ queryKey: ["landing-photos"] });
      queryClient.invalidateQueries({ queryKey: ["landing-photos-banners"] });
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
      const { data: uploadData } = await api.post('/upload', formData);
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
      const { data: uploadData } = await api.post('/upload', formData);
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
        await api.patch(`/landing-photos/${editingPhoto.id}`, { caption: photoCaption, isBanner: photoIsBanner });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landing-photos"] });
      queryClient.invalidateQueries({ queryKey: ["landing-photos-banners"] });
      setPhotoDialogOpen(false);
      setEditingPhoto(null);
      setPhotoCaption("");
      toast({ title: "Legenda atualizada!" });
    },
  });

  const openEditPhoto = (photo: any) => {
    setEditingPhoto(photo);
    setPhotoCaption(photo.caption || "");
    setPhotoIsBanner(photo.isBanner || photo.is_banner || false);
    setPhotoDialogOpen(true);
  };

  const deletePhotoMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/landing-photos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landing-photos"] });
      queryClient.invalidateQueries({ queryKey: ["landing-photos-pub"] });
      queryClient.invalidateQueries({ queryKey: ["landing-photos-banners"] });
      setDeletingPhoto(null);
      setCarouselIdx(0);
      toast({ title: "Foto removida!" });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao remover foto", description: getErrorMessage(err), variant: "destructive" });
    }
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


  return (
    <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto pb-24 px-4">
      {/* Header premium */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-primary/60 p-6 sm:p-8 text-white shadow-lg mb-2">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)' }} />
        <div className="relative flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur shrink-0">
            <Settings className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Configurações</h1>
            <p className="text-white/70 mt-0.5 text-sm sm:text-base">Gerencie o site público, redes sociais e aparência do app.</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="landing">
        <TabsList className="mb-6 bg-muted/60 border border-border/40 p-1 rounded-2xl flex-wrap h-auto gap-1 w-full sm:w-auto">
          <TabsTrigger value="landing" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all px-4">🌐 Site Público</TabsTrigger>
          <TabsTrigger value="social" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all px-4">📱 Redes Sociais</TabsTrigger>
          <TabsTrigger value="features" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all px-4">⚙️ Funcionalidades</TabsTrigger>
          <TabsTrigger value="inbox" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all px-4 relative">
            ✉️ Inbox
            {contactMessages?.some((m: any) => m.status !== "archived") && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="space-y-6">
          <InboxMessages />
        </TabsContent>

        {/* ── Funcionalidades / Acessos ── */}
        <TabsContent value="features" className="space-y-6">
          <RoutinePermissionsPanel />
        </TabsContent>

        <TabsContent value="landing" className="space-y-6">
          <Card className="border-0 shadow-lg overflow-hidden ring-1 ring-border/30">
            <CardHeader className="bg-gradient-to-r from-violet-500/10 to-primary/5 border-b py-5">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="p-1.5 bg-violet-500/15 rounded-lg">
                  <Video className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
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
                        {uploading ? "Carregando..." : <><Upload className="h-4 w-4 mr-2" /> Enviar arquivo de vídeo</>}
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
                      <Youtube className="h-4 w-4" /> Opção 2: Link do YouTube
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

          <Card className="border-0 shadow-lg overflow-hidden ring-1 ring-border/30">
            <CardHeader className="bg-gradient-to-r from-amber-500/10 to-orange-500/5 border-b py-5">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="p-1.5 bg-amber-500/15 rounded-lg">
                  <ImagePlus className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                Banners do Painel Interno (Home)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Desktop */}
                <div className="space-y-2">
                  <Label className="font-semibold">Versão Desktop (Horizontal - 1200x400)</Label>
                  <div className="aspect-[16/5] w-full rounded-xl overflow-hidden border-2 border-dashed relative bg-muted/30 group">
                    {siteSettings?.homepage_banner ? (
                      <>
                        <img src={getUploadUrl(siteSettings.homepage_banner) || ""} alt="Desktop" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Label className="cursor-pointer bg-primary text-white p-2 rounded-full" title="Trocar imagem">
                            <ImagePlus className="h-5 w-5" />
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleSiteSettingUpload(e, 'homepage_banner')} disabled={uploading} />
                          </Label>
                          <Button size="icon" variant="destructive" className="rounded-full h-9 w-9" onClick={() => handleRemoveSiteSetting('homepage_banner')}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </>
                    ) : (
                      <Label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                        <ImagePlus className="h-8 w-8 mb-2 opacity-50" />
                        <span className="text-sm font-medium">Adicionar Banner Desktop</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleSiteSettingUpload(e, 'homepage_banner')} disabled={uploading} />
                      </Label>
                    )}
                  </div>
                </div>

                {/* Mobile */}
                <div className="space-y-2">
                  <Label className="font-semibold">Versão Mobile (Quadrado/Vertical - 800x800)</Label>
                  <div className="aspect-square md:aspect-[16/5] w-full max-w-[300px] md:max-w-none mx-auto md:mx-0 rounded-xl overflow-hidden border-2 border-dashed relative bg-muted/30 group">
                    {siteSettings?.homepage_banner_mobile ? (
                      <>
                        <img src={getUploadUrl(siteSettings.homepage_banner_mobile) || ""} alt="Mobile" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Label className="cursor-pointer bg-primary text-white p-2 rounded-full" title="Trocar imagem">
                            <ImagePlus className="h-5 w-5" />
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleSiteSettingUpload(e, 'homepage_banner_mobile')} disabled={uploading} />
                          </Label>
                          <Button size="icon" variant="destructive" className="rounded-full h-9 w-9" onClick={() => handleRemoveSiteSetting('homepage_banner_mobile')}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </>
                    ) : (
                      <Label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                        <ImagePlus className="h-8 w-8 mb-2 opacity-50" />
                        <span className="text-sm font-medium">Adicionar Banner Mobile</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleSiteSettingUpload(e, 'homepage_banner_mobile')} disabled={uploading} />
                      </Label>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg overflow-hidden ring-1 ring-border/30">
            <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border-b py-5">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-500/15 rounded-lg inline-flex">
                    <ImagePlus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  Galeria da Página Pública (Landing Page)
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Imagens que aparecem no carrossel da Landing Page principal (público).</p>
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
                        <img src={getUploadUrl(photos[carouselIdx]?.url) || ""} alt={photos[carouselIdx]?.caption} className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105" />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 pt-12 flex items-end justify-between">
                          <div>
                            <Badge className="bg-primary hover:bg-primary border-0 mb-2">Destaque {carouselIdx + 1}</Badge>
                            <p className="text-white font-medium text-lg md:text-xl drop-shadow-md">{photos[carouselIdx]?.caption || "Sem legenda"}</p>
                          </div>
                          <div className="flex gap-2 relative z-30">
                            <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur z-40" onClick={() => openEditPhoto(photos[carouselIdx])}><Edit2 className="h-4 w-4 text-white" /></Button>
                            <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full shadow-lg z-40" onClick={(e) => { e.stopPropagation(); setDeletingPhoto(photos[carouselIdx]); }}><Trash2 className="h-4 w-4" /></Button>
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
                        <img src={getUploadUrl(photo.url) || ""} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg overflow-hidden ring-1 ring-border/30">
            <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-rose-500/10 to-pink-500/5 border-b py-5">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="p-1.5 bg-rose-500/15 rounded-lg inline-flex">
                    <MessageSquareQuote className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  </div>
                  Depoimentos
                </CardTitle>
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


        <TabsContent value="social" className="space-y-6">
          <Card className="border-0 shadow-lg overflow-hidden ring-1 ring-border/30">
            <CardHeader className="bg-gradient-to-r from-sky-500/10 to-blue-500/5 border-b py-5">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="p-1.5 bg-sky-500/15 rounded-lg">
                  <Mail className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                </div>
                Redes e Contatos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 space-y-6">
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
                <div className="space-y-2">
                  <Label>Youtube URL</Label>
                  <Input value={editYoutube} onChange={(e) => setEditYoutube(e.target.value)} placeholder="https://youtube.com/..." />
                </div>
              </div>

              {/* Google Maps Embed */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-emerald-500/15 rounded-lg">
                    <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Google Maps — Link de Incorporação</p>
                    <p className="text-xs text-muted-foreground">Cole a URL do iframe do Google Maps para exibir o mapa da igreja na Landing Page.</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase">URL do Embed (src do iframe)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={editMapsUrl}
                      onChange={(e) => {
                        let val = e.target.value;
                        // Se o usuário colar o iframe inteiro, extrair apenas o src
                        const srcMatch = val.match(/src="([^"]+)"/);
                        if (srcMatch && srcMatch[1]) {
                          val = srcMatch[1];
                        }
                        setEditMapsUrl(val);
                      }}
                      placeholder="https://www.google.com/maps/embed?pb=... (ou cole o <iframe> inteiro)"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    💡 No Google Maps, clique em <strong>Compartilhar &rarr; Incorporar um mapa</strong> e cole o código <code className="bg-muted px-1 rounded">&lt;iframe&gt;</code> aqui. Nós extraímos o link para você!
                  </p>
                </div>
              </div>

              <Button onClick={() => saveSettingsMutation.mutate()} disabled={saveSettingsMutation.isPending} className="mt-4"><Edit2 className="h-4 w-4 mr-2" /> Salvar Links</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Photo Dialog */}
      <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPhoto ? "Editar Legenda" : "Nova Foto da Galeria"}</DialogTitle>
            <DialogDescription className="sr-only">
              Gerencie as fotos que aparecem na página inicial e de login.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!editingPhoto && (
              <div className="space-y-2">
                <Label>Escolha a imagem</Label>
                <div className="flex gap-2">
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChangeCapture={handleFileUpload} />
                  <Button onClick={triggerFileInput} disabled={uploading} variant="outline" className="w-full">
                    {uploading ? "Carregando..." : <><ImagePlus className="h-4 w-4 mr-2" /> Selecionar Arquivo</>}
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
              if (editingPhoto) savePhotoMutation.mutate();
              else handleFileUpload({ target: fileInputRef.current } as any);
            }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Testimonial Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTest ? "Editar Depoimento" : "Novo Depoimento"}</DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para cadastrar um novo depoimento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input value={testName} onChange={(e) => setTestName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Cargo / Papel na Igreja</Label>
              <Input value={testRole} onChange={(e) => setTestRole(e.target.value)} placeholder="Ex: Membro há 5 anos, Voluntário checkin..." />
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

      <ConfirmDialog open={!!deletingPhoto} title="Apagar foto?" description="Esta ação não pode ser desfeita e a imagem será removida da landing page." onConfirm={() => deletePhotoMutation.mutate(deletingPhoto.id)} onCancel={() => setDeletingPhoto(null)} variant="destructive" />
      <ConfirmDialog open={!!deletingTest} title="Remover depoimento?" description="Isso o tirará da exibição da página inicial." onConfirm={() => deleteTestMutation.mutate(deletingTest)} onCancel={() => setDeletingTest(null)} variant="destructive" />
    </div>
  );
};

/** Componente inline — exibe APENAS as mensagens de contato (inbox/arquivadas) */
function InboxMessages() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("inbox");

  const { data: messages } = useQuery({
    queryKey: ["contact-messages-inbox"],
    queryFn: async () => {
      const { data } = await api.get('/contact-messages');
      return data || [];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (m: any) => {
      const phoneDigits = (m.phone || "").replace(/\D/g, "");
      const generatedUsername = (m.name || "").trim().split(" ")[0]
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");

      const email = generatedUsername + "@ccmergulho.com";

      await api.post("/admin/users", {
        email,
        password: "123456",
        fullName: m.name,
        whatsappPhone: phoneDigits,
        username: generatedUsername,
        role: "membro",
        groups: []
      });
      await api.delete(`/contact-messages/${m.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-messages-inbox"] });
      toast({ title: "Membro Aprovado!", description: "Conta criada e mensagem arquivada." });
    },
    onError: (err: any) => toast({ title: "Erro", description: getErrorMessage(err), variant: "destructive" }),
  });

  const deleteMsgMutation = useMutation({
    mutationFn: async (m: any) => {
      if (m.status === "archived") {
        await api.delete(`/contact-messages/${m.id}`);
      } else {
        await api.patch(`/contact-messages/${m.id}`, { status: "archived" });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-messages-inbox"] });
      toast({ title: "Ação concluída com sucesso!" });
    },
  });

  const filtered = messages?.filter((m: any) =>
    activeTab === "archived" ? m.status === "archived" : m.status !== "archived"
  ) || [];

  return (
    <Card className="border-0 shadow-lg overflow-hidden ring-1 ring-border/30">
      <CardHeader className="bg-gradient-to-r from-blue-500/10 to-indigo-500/5 border-b py-5">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="p-1.5 bg-blue-500/15 rounded-lg">
            <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          Mensagens de Contato
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-5">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 bg-muted/50 p-1 rounded-xl mb-4">
            <TabsTrigger value="inbox" className="rounded-lg relative">
              Caixa de Entrada
              {messages?.some((m: any) => m.status !== "archived") && (
                <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-red-500 shadow-sm" />
              )}
            </TabsTrigger>
            <TabsTrigger value="archived" className="rounded-lg flex gap-2">
              <Archive className="h-4 w-4" /> Arquivados
            </TabsTrigger>
          </TabsList>
          <TabsContent value={activeTab} className="space-y-4">
            {filtered.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma mensagem {activeTab === "archived" ? "arquivada" : "na caixa de entrada"}.
              </div>
            )}
            {filtered.map((m: any) => (
              <div key={m.id} className="p-4 rounded-2xl border bg-muted/30 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{m.name}</p>
                    <p className="text-sm font-medium text-primary mt-1">WhatsApp: {m.phone}</p>
                  </div>
                  {m.createdAt && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(m.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                </div>
                <div className="bg-background rounded-xl p-3 text-sm border space-y-1">
                  <p className="font-medium border-b pb-1">Assunto: {m.subject}</p>
                  <p className="text-muted-foreground whitespace-pre-wrap">{m.message}</p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => deleteMsgMutation.mutate(m)} disabled={deleteMsgMutation.isPending}>
                    {m.status === "archived" ? "Excluir Definitivamente" : "Arquivar"}
                  </Button>
                  {m.status !== "archived" && (m.subject === "Quero me tornar Membro" || m.subject === "Contribuir/Servir") && (
                    <Button size="sm" onClick={() => approveMutation.mutate(m)} disabled={approveMutation.isPending} className="bg-emerald-500 hover:bg-emerald-600">
                      Aprovar Acesso
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function QuoteIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10 11h-4a3 3 0 0 1 3-3v-2a5 5 0 0 0-5 5v5h6v-5zm10 0h-4a3 3 0 0 1 3-3v-2a5 5 0 0 0-5 5v5h6v-5z" />
    </svg>
  );
}

// ── Funcionalidades / Acessos Panel ──────────────────────────────────────────
const ROUTINES = [
  { id: "agenda", label: "Agenda", icon: Calendar, description: "Gestão de eventos e compromissos" },
  { id: "devocionais", label: "Devocionais", icon: BookOpen, description: "Leituras e meditações diárias" },
  { id: "voluntarios", label: "Voluntários", icon: HandHeart, description: "Escalas e gestão de equipes" },
  { id: "membros", label: "Membros", icon: Users, description: "Acesso ao cadastro de pessoas" },
  { id: "relatorios", label: "Relatórios", icon: BarChart3, description: "Dados, gráficos e estatísticas" },
  { id: "chat", label: "Chat", icon: MessageCircle, description: "Mensagens e comunicação interna" },
  { id: "checkin", label: "Check-in & Segurança", icon: ShieldCheck, description: "Validação e proteção infantil" },
  { id: "disparos", label: "Disparos", icon: Megaphone, description: "Mural de avisos e notificações WhatsApp" },
];

const ROLE_TYPES = [
  { id: "c1f324b3-45ed-453a-941c-d030e22d7721", label: "Administrador", description: "Acesso total ao sistema", color: "bg-primary" },
  { id: "3e4bce2a-7856-4801-b466-7b8e3d12a74b", label: "Líder", description: "Líderes de departamento", color: "bg-emerald-500" },
  { id: "071c2037-fa67-43ab-9d1b-4480fe15fd92", label: "Membro", description: "Acesso básico", color: "bg-slate-500" },
];

function RoutinePermissionsPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("groups");

  const { data: groups } = useQuery({
    queryKey: ["all-groups"],
    queryFn: async () => {
      const { data } = await api.get('/groups');
      return data || [];
    },
  });

  const { data: permissions, isLoading: loadingPerms } = useQuery({
    queryKey: ["all-role-routines"],
    queryFn: async () => {
      const { data } = await api.get('/group-routines', { params: { includeRoles: true } });
      return data || [];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, routineKey, enabled, isRole }: { id: string, routineKey: string, enabled: boolean, isRole: boolean }) => {
      const normalizedRoutineKey = routineKey.toLowerCase();
      const existing = permissions?.find((p: any) =>
        isRole
          ? (p.roleId === id && String(p.routineKey || p.routine_key).toLowerCase() === normalizedRoutineKey)
          : ((p.groupId || p.group_id) === id && String(p.routineKey || p.routine_key).toLowerCase() === normalizedRoutineKey)
      );

      if (existing) {
        await api.patch(`/group-routines/${existing.id}`, { isEnabled: enabled });
      } else {
        const payload = isRole
          ? { roleId: id, routineKey: normalizedRoutineKey, isEnabled: enabled }
          : { groupId: id, routineKey: normalizedRoutineKey, isEnabled: enabled };
        await api.post('/group-routines', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-role-routines"] });
      toast({ title: "Permissão atualizada com sucesso!" });
    },
    onError: (err: any) => toast({ title: "Erro ao salvar", description: getErrorMessage(err), variant: "destructive" }),
  });

  const getPermStatus = (id: string, routineKey: string, isRole: boolean): boolean => {
    const normalizedRoutineKey = routineKey.toLowerCase();
    const perm = permissions?.find((p: any) =>
      isRole
        ? (p.roleId === id && String(p.routineKey || p.routine_key).toLowerCase() === normalizedRoutineKey)
        : ((p.groupId || p.group_id) === id && String(p.routineKey || p.routine_key).toLowerCase() === normalizedRoutineKey)
    );
    if (!perm) return false;
    return (p => p.isEnabled ?? p.is_enabled ?? false)(perm);
  };

  const selectedName = activeTab === "groups"
    ? groups?.find((g: any) => g.id === selectedId)?.name
    : ROLE_TYPES.find(r => r.id === selectedId)?.label;

  if (loadingPerms) {
    return (
      <Card className="border-0 shadow-lg ring-1 ring-border/30 p-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg overflow-hidden ring-1 ring-border/30">
      <CardHeader className="bg-gradient-to-r from-slate-500/10 to-zinc-500/5 border-b py-5">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="p-1.5 bg-slate-500/15 rounded-lg">
            <ShieldCheck className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </div>
          Funcionalidades & Acessos
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie quais rotinas do sistema estão ativas para cada departamento ou perfil (nível de acesso).
        </p>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSelectedId(null); }} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="groups" className="rounded-lg flex gap-2">
              <LayoutGrid className="h-4 w-4" /> Departamentos
            </TabsTrigger>
            <TabsTrigger value="roles" className="rounded-lg flex gap-2">
              <UserCircle className="h-4 w-4" /> Perfis (Níveis)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="groups" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups?.map((group: any) => (
                <div
                  key={group.id}
                  className={cn(
                    "cursor-pointer transition-all border-2 rounded-2xl p-4",
                    selectedId === group.id ? "border-primary bg-primary/5" : "border-transparent bg-card shadow-sm hover:shadow-md hover:bg-muted/50 ring-1 ring-border"
                  )}
                  onClick={() => setSelectedId(group.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center text-primary bg-primary/10">
                      <Users className="h-5 w-5" />
                    </div>
                    {selectedId === group.id && <ChevronRight className="h-5 w-5 text-primary" />}
                  </div>
                  <h3 className="font-semibold">{group.name}</h3>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="roles" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {ROLE_TYPES.map((role) => (
                <div
                  key={role.id}
                  className={cn(
                    "cursor-pointer transition-all border-2 rounded-2xl p-4",
                    selectedId === role.id ? "border-primary bg-primary/5" : "border-transparent bg-card shadow-sm hover:shadow-md hover:bg-muted/50 ring-1 ring-border"
                  )}
                  onClick={() => setSelectedId(role.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold uppercase text-white shadow-sm", role.color)}>
                      {role.label}
                    </div>
                    {selectedId === role.id && <ChevronRight className="h-5 w-5 text-primary" />}
                  </div>
                  <h3 className="font-semibold">{role.label}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{role.description}</p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {selectedId ? (
          <div key={selectedId} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-4 border-t border-dashed">
            <div>
              <h3 className="text-lg font-bold">Configurando: <span className="text-primary">{selectedName}</span></h3>
              <p className="text-sm text-muted-foreground">Ative ou desative o acesso aos módulos.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ROUTINES.map((routine) => {
                const isEnabled = getPermStatus(selectedId, routine.id, activeTab === "roles");
                return (
                  <div key={routine.id} className="p-4 bg-muted/30 rounded-2xl border flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center transition-all shrink-0",
                        isEnabled ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-background text-muted-foreground"
                      )}>
                        <routine.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm leading-tight">{routine.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{routine.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Switch
                        checked={isEnabled}
                        disabled={toggleMutation.isPending}
                        onCheckedChange={(checked) => toggleMutation.mutate({
                          id: selectedId,
                          routineKey: routine.id,
                          enabled: checked,
                          isRole: activeTab === "roles"
                        })}
                      />
                      <span className={cn("text-[9px] font-bold uppercase tracking-widest", isEnabled ? "text-emerald-500" : "text-muted-foreground")}>
                        {isEnabled ? "Ativo" : "Off"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20 flex items-start gap-3">
              <Shield className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                <strong>Regra:</strong> As permissões são cumulativas. Se uma funcionalidade estiver ativa no <b>Nível (Perfil)</b> OU no <b>Departamento</b> do usuário, ele terá acesso.
              </p>
            </div>
          </div>
        ) : (
          <div className="h-40 flex flex-col items-center justify-center text-center border-2 border-dashed rounded-3xl bg-muted/10 p-6 mt-4">
            <Lock className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">Escolha um departamento ou perfil acima para gerenciar os acessos</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SettingsPage;
