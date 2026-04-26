import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
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
import { getErrorMessage } from "@/lib/errorMessages";

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

const GroupPermissions = () => {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

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
    mutationFn: async ({ roleId, routineKey, enabled }: { roleId: string, routineKey: string, enabled: boolean }) => {
      const normalizedRoutineKey = routineKey.toLowerCase();
      // Tenta encontrar registro existente para fazer update, senão cria
      const existing = permissions?.find((p: any) =>
        (p.groupId ?? p.group_id) === roleId &&
        String(p.routineKey ?? p.routine_key).toLowerCase() === normalizedRoutineKey
      );
      if (existing) {
        await api.patch(`/group-routines/${existing.id}`, { isEnabled: enabled });
      } else {
        await api.post('/group-routines', { groupId: roleId, routineKey: normalizedRoutineKey, isEnabled: enabled });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-role-routines"] });
      toast({ title: "Permissão atualizada com sucesso!" });
    },
    onError: (err: any) => toast({ title: "Erro ao salvar", description: getErrorMessage(err), variant: "destructive" }),
  });

  const selectedGroupObj = groups?.find((g: any) => g.id === selectedRole);

  const getPermStatus = (roleId: string, routineKey: string): boolean => {
    const normalizedRoutineKey = routineKey.toLowerCase();
    const perm = permissions?.find((p: any) =>
      (p.groupId ?? p.group_id) === roleId &&
      String(p.routineKey ?? p.routine_key).toLowerCase() === normalizedRoutineKey
    );
    // Se não houver registro, considera desabilitado por padrão
    if (!perm) return false;
    return (p => p.isEnabled ?? p.is_enabled ?? false)(perm);
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
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 pb-12">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups?.map((group: any) => (
          <Card
            key={group.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md border-2",
              selectedRole === group.id ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted/50"
            )}
            onClick={() => setSelectedRole(group.id)}
          >
            <CardHeader className="p-4">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-primary bg-primary/10">
                  <Users className="h-6 w-6" />
                </div>
                {selectedRole === group.id && <ChevronRight className="h-5 w-5 text-primary" />}
              </div>
              <CardTitle className="mt-3 text-lg">{group.name}</CardTitle>
              <CardDescription>{group.description || "Departamento"}</CardDescription>
            </CardHeader>
          </Card>
        ))}
        {groups?.length === 0 && (
          <p className="text-muted-foreground text-sm col-span-3">Nenhum departamento cadastrado.</p>
        )}
      </div>

      {/* Permissions Panel */}
      {selectedRole ? (
        <div key={selectedRole} className="space-y-6">
          <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
            <CardHeader className="border-b bg-muted/20 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Rotinas: {selectedGroupObj?.name}</CardTitle>
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
              <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:gap-px lg:bg-muted/20">
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
                          disabled={toggleMutation.isPending}
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
                As alterações refletem nos acessos dos usuários com o perfil <b>{selectedGroupObj?.name}</b>.
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
