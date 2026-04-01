import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

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
              <p className="text-sm text-muted-foreground">{user?.email}</p>
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

          <div className="flex gap-2 pt-2">
            <Button onClick={() => updateMutation.mutate()} className="flex-1">
              <Save className="h-4 w-4 mr-2" /> Salvar
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
