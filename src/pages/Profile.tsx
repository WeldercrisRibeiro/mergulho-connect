import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/ThemeProvider";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, LogOut, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { user, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setWhatsapp(profile.whatsapp_phone || "");
    }
  }, [profile]);

  const { data: myGroups } = useQuery({
    queryKey: ["my-profile-groups"],
    queryFn: async () => {
      const { data } = await supabase
        .from("member_groups")
        .select("groups(name)")
        .eq("user_id", user!.id);
      return data?.map((mg) => mg.groups?.name) || [];
    },
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, whatsapp_phone: whatsapp })
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-profile-groups"] });
      toast({ title: "Perfil atualizado!" });
    },
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
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">
                {fullName.charAt(0).toUpperCase() || "M"}
              </span>
            </div>
            <div>
              <CardTitle>{fullName || "Membro"}</CardTitle>
              <p className="text-sm text-muted-foreground">{whatsapp || "Sem telefone configurado"}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nome completo</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>WhatsApp</Label>
            <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(11) 99999-9999" />
          </div>

          {myGroups && myGroups.length > 0 && (
            <div className="space-y-2">
              <Label>Meus Grupos</Label>
              <div className="flex gap-1 flex-wrap">
                {myGroups.map((name) => (
                  <Badge key={name} variant="secondary">{name}</Badge>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4 mt-2 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Tema do Aplicativo</Label>
                <p className="text-xs text-muted-foreground">Escolha entre modo claro ou escuro</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleTheme}
                className="gap-2"
              >
                {theme === "light" ? "Modo Escuro" : "Modo Claro"}
              </Button>
            </div>
          </div>

          <div className="space-y-2 mt-4 pt-4 border-t border-border/50">
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
                {updatePasswordMutation.isPending ? "Alterando..." : "Alterar"}
              </Button>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={() => updateMutation.mutate()} className="flex-1">
              <Save className="h-4 w-4 mr-2" /> Salvar Perfil
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
