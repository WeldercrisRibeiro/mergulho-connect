import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  Calendar, BookOpen, HandHeart, Users, BarChart3,
  MessageCircle, ShieldCheck, Megaphone, Shield,
  ChevronRight, Lock, LayoutGrid, UserCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/errorMessages";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  { id: "c1f324b3-45ed-453a-941c-d030e22d7721", label: "Administrador", description: "Acesso total ao sistema", color: "bg-primary" },
  { id: "3e4bce2a-7856-4801-b466-7b8e3d12a74b", label: "Líder", description: "Líderes de departamento", color: "bg-emerald-500" },
  { id: "071c2037-fa67-43ab-9d1b-4480fe15fd92", label: "Membro", description: "Acesso básico", color: "bg-slate-500" },
];

const GroupPermissions = () => {
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
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Acessos
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as permissões de acesso por departamento ou por nível de usuário.
          </p>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSelectedId(null); }} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="groups" className="rounded-lg flex gap-2">
            <LayoutGrid className="h-4 w-4" /> Departamentos
          </TabsTrigger>
          <TabsTrigger value="roles" className="rounded-lg flex gap-2">
            <UserCircle className="h-4 w-4" /> Perfis (Cargos)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="groups" className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups?.map((group: any) => (
              <Card
                key={group.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md border-2",
                  selectedId === group.id ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted/50"
                )}
                onClick={() => setSelectedId(group.id)}
              >
                <CardHeader className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center text-primary bg-primary/10">
                      <Users className="h-5 w-5" />
                    </div>
                    {selectedId === group.id && <ChevronRight className="h-5 w-5 text-primary" />}
                  </div>
                  <CardTitle className="mt-3 text-base">{group.name}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="roles" className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {ROLE_TYPES.map((role) => (
              <Card
                key={role.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md border-2",
                  selectedId === role.id ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted/50"
                )}
                onClick={() => setSelectedId(role.id)}
              >
                <CardHeader className="p-4">
                  <div className="flex items-center justify-between">
                    <div className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold uppercase text-white shadow-sm", role.color)}>
                      {role.label}
                    </div>
                    {selectedId === role.id && <ChevronRight className="h-5 w-5 text-primary" />}
                  </div>
                  <CardTitle className="mt-3 text-base">{role.label}</CardTitle>
                  <CardDescription className="text-xs">{role.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Permissions Panel */}
      {selectedId ? (
        <div key={selectedId} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-md ring-1 ring-border/50">
            <CardHeader className="border-b bg-muted/20 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Configurando: {selectedName}</CardTitle>
                  <CardDescription>
                    Ative ou desative o acesso às rotinas do sistema para este {activeTab === "groups" ? "departamento" : "perfil"}.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  {activeTab === "groups" ? "Por Departamento" : "Por Perfil"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:gap-px lg:bg-muted/20">
                {ROUTINES.map((routine) => {
                  const isEnabled = getPermStatus(selectedId, routine.id, activeTab === "roles");
                  return (
                    <div key={routine.id} className="p-5 bg-card flex items-center justify-between hover:bg-muted/5 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                          isEnabled ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-muted text-muted-foreground"
                        )}>
                          <routine.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm leading-tight mb-0.5">{routine.label}</p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{routine.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={cn("text-[9px] font-black uppercase tracking-widest", isEnabled ? "text-primary" : "text-muted-foreground")}>
                          {isEnabled ? "Ativo" : "Off"}
                        </span>
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
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">Regra de Precedência</h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                As permissões são cumulativas. Se uma rotina estiver ativa no <b>Perfil</b> OU no <b>Departamento</b> do usuário, ele terá acesso.
                Administradores globais ignoram estas restrições.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-64 flex flex-col items-center justify-center text-center border-2 border-dashed rounded-[2.5rem] p-8 bg-muted/5">
          <div className="h-16 w-16 rounded-3xl bg-muted flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-muted-foreground/30" />
          </div>
          <h3 className="text-lg font-semibold text-muted-foreground">Nenhum alvo selecionado</h3>
          <p className="text-sm text-muted-foreground/60 max-w-xs mt-2">
            Escolha um departamento ou perfil acima para configurar os acessos.
          </p>
        </div>
      )}
    </div>
  );
};

export default GroupPermissions;
