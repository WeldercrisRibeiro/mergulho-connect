import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Calendar, BookOpen, HandHeart, Users, BarChart3,
  MessageCircle, ShieldCheck, Megaphone, Shield,
  ChevronRight, Lock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const ROUTINES = [
  { id: "agenda", label: "Agenda", icon: Calendar, description: "Gestão de eventos e compromissos" },
  { id: "devocionais", label: "Devocionais", icon: BookOpen, description: "Leituras e meditações diárias" },
  { id: "voluntarios", label: "Voluntários", icon: HandHeart, description: "Escalas e gestão de equipes" },
  { id: "membros", label: "Membros", icon: Users, description: "Acesso ao cadastro de pessoas" },
  { id: "relatorios", label: "Relatórios", icon: BarChart3, description: "Dados, gráficos e estatísticas" },
  { id: "chat", label: "Chat", icon: MessageCircle, description: "Mensagens e comunicação interna" },
  { id: "kids", label: "Kids & Segurança", icon: ShieldCheck, description: "Check-in e proteção infantil" },
  { id: "Disparos", label: "Disparos", icon: Megaphone, description: "Mural de avisos e notificações" },
];

const ROLE_TYPES = [
  { id: "gerente", label: "Gerente", description: "Líderes de departamento com acesso ampliado", color: "bg-emerald-500" },
  { id: "pastor", label: "Pastor", description: "Apoio pastoral e gestão de membros", color: "bg-blue-500" },
  { id: "membro", label: "Membro", description: "Acesso básico às rotinas habilitadas", color: "bg-slate-500" },
];

const GroupPermissions = () => {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // Fetch all permissions (we'll use role name as group_id concept - store as a convention)
  const { data: permissions, isLoading: loadingPerms } = useQuery({
    queryKey: ["all-role-routines"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("group_routines").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ roleId, routineKey, enabled }: { roleId: string, routineKey: string, enabled: boolean }) => {
      // We use the role name as a pseudo group_id for role-based permissions
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
      toast({ title: "Permissão atualizada com sucesso!" });
    },
    onError: (err: any) => toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" }),
  });

  const selectedRoleConfig = ROLE_TYPES.find(r => r.id === selectedRole);

  const getPermStatus = (roleId: string, routineKey: string) => {
    const perm = permissions?.find((p: any) => p.group_id === roleId && p.routine_key === routineKey);
    return perm ? perm.is_enabled : true;
  };

  if (loadingPerms) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 pb-Safe">
      <header>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          Gestão de Rotinas por Tipo de Usuário
        </h1>
        <p className="text-muted-foreground mt-1">
          Selecione um tipo de usuário para configurar suas permissões de acesso às rotinas do sistema.
        </p>
      </header>

      {/* Role Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {ROLE_TYPES.map((role) => (
          <Card
            key={role.id}
            className={cn(
              "cursor-pointer transition-all border-2",
              selectedRole === role.id ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted/50"
            )}
            onClick={() => setSelectedRole(role.id)}
          >
            <CardHeader className="p-4">
              <div className="flex items-center justify-between">
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center text-white", role.color)}>
                  <Users className="h-6 w-6" />
                </div>
                {selectedRole === role.id && <ChevronRight className="h-5 w-5 text-primary" />}
              </div>
              <CardTitle className="mt-3 text-lg">{role.label}</CardTitle>
              <CardDescription>{role.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Permissions Panel */}
      {selectedRole ? (
        <div key={selectedRole} className="space-y-6">
          <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
            <CardHeader className="border-b bg-muted/20 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Rotinas: {selectedRoleConfig?.label}</CardTitle>
                  <CardDescription>
                    Ative ou desative os módulos que usuários com este perfil poderão acessar.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-primary/10 text-primary">
                  Configurando Acesso
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:gap-px md:bg-muted/20">
                {ROUTINES.map((routine) => {
                  const isEnabled = getPermStatus(selectedRole, routine.id);
                  return (
                    <div key={routine.id} className="p-6 bg-card flex items-center justify-between hover:bg-muted/10 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                          isEnabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          <routine.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm leading-tight mb-0.5">{routine.label}</p>
                          <p className="text-xs text-muted-foreground">{routine.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={cn("text-[10px] font-bold uppercase tracking-wider", isEnabled ? "text-primary" : "text-muted-foreground")}>
                          {isEnabled ? "Ativado" : "Bloqueado"}
                        </span>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={(checked) => toggleMutation.mutate({
                            roleId: selectedRole,
                            routineKey: routine.id,
                            enabled: checked
                          })}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="bg-secondary/30 rounded-2xl p-6 border flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">Como as permissões funcionam?</h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                As alterações refletem nos acessos dos usuários com o perfil <b>{selectedRoleConfig?.label}</b>.
                Administradores Globais mantêm acesso total a todas as rotinas independente destas configurações.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-64 flex flex-col items-center justify-center text-center border-2 border-dashed rounded-3xl p-8 bg-muted/10">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">Nenhum perfil selecionado</h3>
          <p className="text-sm text-muted-foreground max-w-xs mt-2">
            Clique em um dos cards acima para configurar os acessos às rotinas.
          </p>
        </div>
      )}
    </div>
  );
};

export default GroupPermissions;
