import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/ThemeProvider";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, LogOut, Save, Camera, Loader2, Sun, Moon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { user, profile, signOut, isAdmin, isGerente, isVisitor, refreshProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isNotifGranted, setIsNotifGranted] = useState(
    typeof window !== "undefined" && "Notification" in window && (window as any).Notification.permission === "granted"
  );

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setWhatsapp(profile.whatsapp_phone || "");
      
      const isPhoneLike = /^\d{8,}$/.test(profile.username || "");
      const emailPrefix = user?.email?.split('@')[0] || "";
      setUsername(profile.username && !isPhoneLike ? profile.username : emailPrefix);
      
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile, user]);

  const roleLabel = isAdmin ? "Administrador" : isGerente ? "Gerente" : isVisitor ? "Visitante" : "Membro";
  const roleBg = isAdmin
    ? "bg-primary/10 text-primary border-primary/30"
    : isGerente
    ? "bg-blue-500/10 text-blue-600 border-blue-300/30"
    : "bg-muted text-muted-foreground border-border";

  const initials = (fullName || "M").charAt(0).toUpperCase();

  const { data: myGroups } = useQuery({
    queryKey: ["my-profile-groups"],
    queryFn: async () => {
      const { data } = await supabase
        .from("member_groups")
        .select("groups(name)")
        .eq("user_id", user!.id);
      return data?.map((mg) => (mg as any).groups?.name).filter(Boolean) || [];
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
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `avatars/${user.id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);

      // Add cache-busting timestamp
      const url = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await (supabase as any)
        .from("profiles")
        .update({ avatar_url: url })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setAvatarUrl(url);
      await refreshProfile();
      toast({ title: "Foto atualizada com sucesso!" });
    } catch (err: any) {
      toast({ title: "Erro ao enviar foto", description: err.message, variant: "destructive" });
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      const phoneDigits = whatsapp.replace(/\D/g, "");
      const cleanUsername = (username || "").trim().toLowerCase().replace("@ccmergulho.com", "").replace(/\s+/g, ".") || phoneDigits;

      const { error } = await (supabase as any)
        .from("profiles")
        .update({ 
          full_name: fullName, 
          whatsapp_phone: whatsapp,
          username: cleanUsername
        })
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["my-profile-groups"] });
      toast({ title: "Perfil atualizado!" });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    }
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewPassword("");
      toast({ title: "Senha atualizada com sucesso!" });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao atualizar senha", description: err.message, variant: "destructive" });
    }
  });

  return (
    <div className="p-4 md:p-8 max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <User className="h-6 w-6 text-primary" />
        Meu Perfil
      </h1>

      <Card className="neo-shadow-sm border-0">
        <CardHeader className="pb-2">
          {/* Avatar section */}
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <div className="h-20 w-20 rounded-full overflow-hidden bg-primary/10 ring-4 ring-primary/20 flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Foto de perfil" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-primary">{initials}</span>
                )}
              </div>
              {/* Camera button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform border-2 border-background"
                title="Alterar foto"
              >
                {uploadingPhoto ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handlePhotoUpload}
              />
              {avatarUrl && (
                <button
                  onClick={async () => {
                    if (window.confirm("Deseja remover sua foto?")) {
                      try {
                        const { error } = await supabase.from("profiles").update({ avatar_url: null } as any).eq("user_id", user!.id);
                        if (error) throw error;
                        setAvatarUrl(null);
                        await refreshProfile();
                        toast({ title: "Foto removida" });
                      } catch (e: any) {
                        toast({ title: "Erro ao remover", description: e.message, variant: "destructive" });
                      }
                    }
                  }}
                  className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-destructive text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform border-2 border-background"
                  title="Remover foto"
                >
                  <LogOut className="h-3 w-3 rotate-180" />
                </button>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">{fullName || "Membro"}</CardTitle>
              <div className="flex flex-col gap-0.5">
                <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                {(profile?.username || user?.email) && (
                  <p className="text-[11px] font-bold text-primary">
                    @{((profile?.username && !/^\d{8,}$/.test(profile.username)) 
                      ? profile.username 
                      : (user?.email?.split('@')[0] || profile?.username)).toLowerCase()}
                  </p>
                )}
              </div>
              <span className={`inline-flex items-center mt-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${roleBg}`}>
                {roleLabel}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2 ml-1">
            Clique na câmera para alterar sua foto de perfil (máx. 2MB)
          </p>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label>Nome completo</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome" />
          </div>

          {/* WhatsApp */}
          <div className="space-y-1.5">
            <Label>WhatsApp</Label>
            <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(11) 99999-9999" />
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <Label>Nome de Usuário (Login)</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ex: joao.silva" />
            <p className="text-[10px] text-muted-foreground mt-1">Seu acesso será {username || "..."}@ccmergulho.com</p>
          </div>

          {/* Groups */}
          {myGroups && myGroups.length > 0 && (
            <div className="space-y-1.5">
              <Label>Meus departamentos</Label>
              <div className="flex gap-1.5 flex-wrap">
                {myGroups.map((name: string) => (
                  <Badge key={name} variant="secondary">{name}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Settings */}
          <div className="space-y-3 mt-2 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Tema do Aplicativo</Label>
                <p className="text-xs text-muted-foreground">Modo claro ou escuro</p>
              </div>
              <Button variant="outline" size="sm" onClick={toggleTheme} className="gap-2">
                {theme === "light" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
                {theme === "light" ? "Modo Escuro" : "Modo Claro"}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações Nativas</Label>
                <p className="text-xs text-muted-foreground">Alertas no seu dispositivo</p>
              </div>
              <Button
                variant={isNotifGranted ? "secondary" : "outline"}
                size="sm"
                onClick={async () => {
                  if (typeof window === "undefined" || !("Notification" in window)) {
                    toast({ title: "Não suportado", description: "Seu dispositivo não suporta notificações nativas.", variant: "destructive" });
                    return;
                  }
                  if (isNotifGranted) {
                    toast({ title: "Notificações já estão ativas!" });
                  } else {
                    const perm = await (window as any).Notification.requestPermission();
                    if (perm === "granted") {
                      setIsNotifGranted(true);
                      toast({ title: "Notificações ativadas!" });
                    } else {
                      toast({ title: "Permissão negada", description: "Habilite nas configurações do navegador.", variant: "destructive" });
                    }
                  }
                }}
              >
                {isNotifGranted ? "✓ Ativado" : "Ativar"}
              </Button>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5 pt-4 border-t border-border/50">
            <Label>Redefinir Senha</Label>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Nova senha (mín. 6 caracteres)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Button
                variant="secondary"
                onClick={() => updatePasswordMutation.mutate()}
                disabled={newPassword.length < 6 || updatePasswordMutation.isPending}
              >
                {updatePasswordMutation.isPending ? "..." : "Alterar"}
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
              className="flex-1"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Perfil
            </Button>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" /> Sair
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
