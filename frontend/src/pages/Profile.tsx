import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/ThemeProvider";
import api from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, LogOut, Save, Camera, Loader2, Sun, Moon, Smartphone, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { normalizePhoneForDB, formatPhoneForDisplay, maskPhone } from "@/lib/phoneUtils";
import { getErrorMessage } from "@/lib/errorMessages";
import { cn, getUploadUrl } from "@/lib/utils";

const Profile = () => {
  const { user, profile, setProfile, signOut, isAdmin, IsLider, refreshProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initializedRef = useRef(false);

  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isNotifGranted, setIsNotifGranted] = useState(
    typeof window !== "undefined" && "Notification" in window && (window as any).Notification.permission === "granted"
  );

  useEffect(() => {
    if (profile && !initializedRef.current) {
      setFullName(profile.fullName || "");
      setWhatsapp(maskPhone(formatPhoneForDisplay(profile.whatsappPhone || "")));
      const rawUsername = profile.username || "";
      const isPhoneLike = /^\d{8,}$/.test(rawUsername);
      const emailPrefix = user?.email?.split('@')[0] || "";
      setUsername(rawUsername && !isPhoneLike ? rawUsername : emailPrefix);
      setAvatarUrl(getUploadUrl(profile.avatarUrl));
      initializedRef.current = true;
    }
  }, [profile, user]);
  
  // Efeito para atualização realtime no Header e Sidebar (através do context)
  useEffect(() => {
    if (profile) {
      setProfile({
        ...profile,
        fullName: fullName,
        username: username.toLowerCase(),
      });
    }
  }, [fullName, username]);

  const roleLabel = isAdmin ? "Administrador" : IsLider ? "Líder" : "Membro";
  const roleBg = isAdmin
    ? "bg-primary/10 text-primary border-primary/30"
    : IsLider
      ? "bg-blue-500/10 text-blue-600 border-blue-300/30"
      : "bg-muted text-muted-foreground border-border";

  const initials = (fullName || "M").charAt(0).toUpperCase();

  const { data: myGroups } = useQuery({
    queryKey: ["my-profile-groups"],
    queryFn: async () => {
      const { data } = await api.get('/member-groups/my');
      return (data || []).map((mg: any) => mg.group?.name).filter(Boolean);
    },
    enabled: !!user,
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_SIZE) {
      toast({ title: "Foto muito grande", description: "Tamanho máximo: 2MB", variant: "destructive" });
      return;
    }

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data: uploadData } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = uploadData.url;

      await api.patch(`/profiles/user/${user.id}`, { avatarUrl: url });
      setAvatarUrl(getUploadUrl(url));
      await refreshProfile();
      toast({ title: "Foto atualizada com sucesso!" });
    } catch (err: any) {
      toast({ title: "Erro ao enviar foto", description: getErrorMessage(err), variant: "destructive" });
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      const phoneDigits = whatsapp.replace(/\D/g, "");
      const cleanUsername = (username || "").trim().toLowerCase().replace("@ccmergulho.com", "").replace(/\s+/g, ".") || phoneDigits;
      await api.patch(`/profiles/user/${user!.id}`, {
        fullName: fullName,
        whatsappPhone: normalizePhoneForDB(whatsapp),
        username: cleanUsername
      });
    },
    onSuccess: async () => {
      await refreshProfile();
      initializedRef.current = false; // Permite re-inicializar com os dados salvos se necessário
      queryClient.invalidateQueries({ queryKey: ["my-profile-groups"] });
      toast({ title: "Perfil atualizado!" });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao salvar", description: getErrorMessage(err), variant: "destructive" });
    }
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async () => {
      await api.patch('/auth/password', { password: newPassword });
    },
    onSuccess: () => {
      setNewPassword("");
      toast({ title: "Senha atualizada com sucesso!" });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao atualizar senha", description: getErrorMessage(err), variant: "destructive" });
    }
  });

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 pb-20 md:pb-8">
      <Card className="neo-shadow-sm border-0 overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row">
            {/* Left Sidebar - Profile Summary */}
            <div className="w-full md:w-80 bg-muted/30 p-6 md:p-8 border-b md:border-b-0 md:border-r border-border/50">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="relative group">
                  <div className="h-32 w-32 rounded-full overflow-hidden bg-primary/10 ring-4 ring-background flex items-center justify-center shadow-lg">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Foto de perfil" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <span className="text-5xl font-bold text-primary">{initials}</span>
                    )}
                  </div>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="absolute bottom-1 right-1 h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all border-4 border-background z-10"
                    title="Alterar foto"
                  >
                    {uploadingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  
                  {avatarUrl && (
                    <button
                      onClick={async () => {
                        if (window.confirm("Deseja remover sua foto?")) {
                          try {
                            await api.patch(`/profiles/user/${user!.id}`, { avatarUrl: null });
                            setAvatarUrl(null);
                            await refreshProfile();
                            toast({ title: "Foto removida" });
                          } catch (e: any) {
                            toast({ title: "Erro ao remover", description: e.message, variant: "destructive" });
                          }
                        }
                      }}
                      className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-destructive text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform border-4 border-background z-10"
                      title="Remover foto"
                    >
                      <LogOut className="h-3.5 w-3.5 rotate-180" />
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  <h2 className="text-xl font-bold tracking-tight text-foreground">{fullName || "Membro"}</h2>
                  <p className="text-sm text-muted-foreground">{username?.toLowerCase()}@ccmergulho.com</p>
                </div>

                <div className="flex flex-col items-center gap-2 w-full pt-2">
                  <Badge variant="outline" className={cn("px-3 py-1 font-semibold", roleBg)}>
                    {roleLabel}
                  </Badge>
                  {username && (
                    <span className="text-xs font-bold text-primary">
                      @{username.toLowerCase()}
                    </span>
                  )}
                </div>

                {myGroups && myGroups.length > 0 && (
                  <div className="w-full pt-6 space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground text-center">Departamentos</p>
                    <div className="flex gap-2 flex-wrap justify-center">
                      {Array.from(new Set(myGroups)).map((name: string) => (
                        <Badge key={name} variant="secondary" className="text-[10px] px-2 py-0.5">
                          {name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="w-full pt-6 flex flex-col gap-2 md:flex md:hidden">
                </div>
                
                <div className="hidden md:flex w-full pt-6 flex-col gap-2 border-t border-border/50">
                  <Button variant="outline" size="sm" onClick={toggleTheme} className="w-full gap-2 text-xs h-10">
                    {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    {theme === "light" ? "Modo Escuro" : "Modo Claro"}
                  </Button>
                  <Button variant="destructive" size="sm" onClick={signOut} className="w-full gap-2 font-bold h-10 shadow-sm">
                    <LogOut className="h-4 w-4" /> Sair da conta
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Side - Form Fields */}
            <div className="flex-1 p-6 md:p-10 space-y-8 bg-background">
              <div className="space-y-6">
                <div className="border-b pb-2">
                  <h3 className="text-sm font-bold text-muted-foreground">Dados Pessoais</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name Field */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Nome completo</Label>
                    <div className="relative flex items-center">
                      <User className="absolute left-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={fullName} 
                        onChange={(e) => setFullName(e.target.value)} 
                        placeholder="Seu nome" 
                        className="pl-9" 
                      />
                    </div>
                  </div>

                  {/* Username Field */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Nome de usuário</Label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 text-xs font-bold text-muted-foreground">@</div>
                      <Input 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                        placeholder="joao.silva" 
                        className="pl-7" 
                      />
                    </div>
                  </div>

                  {/* WhatsApp Field */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">WhatsApp</Label>
                    <div className="relative flex items-center">
                      <Smartphone className="absolute left-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={whatsapp} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setWhatsapp(maskPhone(val));
                        }} 
                        placeholder="(85) 99999-9999" 
                        maxLength={15}
                        className="pl-9" 
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Alterar senha</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1 flex items-center">
                        <Lock className="absolute left-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Mín. 6 caracteres"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          eyeButton={true}
                          onEyeClick={() => setShowPassword(!showPassword)}
                          className="pl-9"
                        />
                      </div>
                      <Button
                        variant="secondary"
                        onClick={() => updatePasswordMutation.mutate()}
                        disabled={newPassword.length < 6 || updatePasswordMutation.isPending}
                        className="text-xs font-bold"
                      >
                        {updatePasswordMutation.isPending ? "..." : "Alterar"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-border/50 flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-muted-foreground">Configuração de Segurança</p>
                    <p className="text-xs text-muted-foreground">Sua senha é criptografada e protegida.</p>
                  </div>
                  
                  <Button
                    onClick={() => updateMutation.mutate()}
                    disabled={updateMutation.isPending}
                    className="w-full sm:w-auto min-w-[200px] h-10 font-bold"
                  >
                    {updateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Salvar alterações
                  </Button>
                </div>

                {/* Mobile only actions at bottom */}
                <div className="flex flex-col gap-2 md:hidden pt-6 border-t border-dashed">
                  <Button variant="outline" onClick={toggleTheme} className="w-full h-11 gap-2 text-sm">
                    {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    {theme === "light" ? "Modo Escuro" : "Modo Claro"}
                  </Button>
                  <Button variant="destructive" onClick={signOut} className="w-full h-12 gap-2 font-bold shadow-lg">
                    <LogOut className="h-4 w-4" /> Sair da conta
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
