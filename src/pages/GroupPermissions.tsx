import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Calendar, BookOpen, HandHeart, Users, BarChart3, 
  MessageCircle, ShieldCheck, Megaphone, Shield, 
  ChevronRight, Lock, CheckCircle2, XCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
  { id: "comunicados", label: "Comunicados", icon: Megaphone, description: "Mural de avisos e notificações" },
];

const GroupPermissions = () => {
  const queryClient = useQueryClient();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Fetch groups
  const { data: groups, isLoading: loadingGroups } = useQuery({
    queryKey: ["groups-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("groups").select("*").order("name");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch all permissions
  const { data: permissions, isLoading: loadingPerms } = useQuery({
    queryKey: ["all-group-routines"],
    queryFn: async () => {
      const { data, error } = await supabase.from("group_routines").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ groupId, routineKey, enabled }: { groupId: string, routineKey: string, enabled: boolean }) => {
      const { error } = await supabase
        .from("group_routines")
        .upsert(
          { group_id: groupId, routine_key: routineKey, is_enabled: enabled },
          { onConflict: "group_id,routine_key" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-group-routines"] });
      toast({ title: "Permissão atualizada com sucesso!" });
    },
    onError: (err: any) => toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" }),
  });

  const selectedGroup = groups?.find(g => g.id === selectedGroupId);
  
  const getPermStatus = (groupId: string, routineKey: string) => {
    const perm = permissions?.find(p => p.group_id === groupId && p.routine_key === routineKey);
    return perm ? perm.is_enabled : true; // Default to true if not set
  };

  if (loadingGroups || loadingPerms) {
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
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Gestão de Funções por Departamento
          </h1>
          <p className="text-muted-foreground mt-1">
            Selecione um departamento para configurar suas permissões de acesso às rotinas do sistema.
          </p>
        </div>
      </header>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups?.map((group) => (
          <div key={group.id}>
            <Card 
              className={cn(
                "cursor-pointer transition-all border-2",
                selectedGroupId === group.id ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted/50"
              )}
              onClick={() => setSelectedGroupId(group.id)}
            >
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-secondary/50 flex items-center justify-center text-primary">
                    <Users className="h-6 w-6" />
                  </div>
                  {selectedGroupId === group.id && <ChevronRight className="h-5 w-5 text-primary" />}
                </div>
                <CardTitle className="mt-3 text-lg">{group.name}</CardTitle>
                <CardDescription className="line-clamp-1">{group.description || "Gerencie este departamento"}</CardDescription>
              </CardHeader>
            </Card>
          </div>
        ))}
      </div>

      {/* Permissions Detail Panel */}
      {selectedGroupId ? (
        <div key={selectedGroupId} className="space-y-6">
            <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
              <CardHeader className="border-b bg-muted/20 pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Rotinas Ativas: {selectedGroup?.name}</CardTitle>
                    <CardDescription>
                      Ative ou desative os módulos que este departamento poderá acessar no painel e sidebar.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-primary/10 text-primary">
                    Configurando Acesso
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 divide-y md:divide-y-0 md:gap-px md:bg-muted/20">
                  {ROUTINES.map((routine) => {
                    const isEnabled = getPermStatus(selectedGroupId, routine.id);
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
                              groupId: selectedGroupId, 
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
                  As alterações aqui refletem instantaneamente no painel dos usuários vinculados a este grupo. 
                  Se um usuário pertencer a múltiplos grupos, ele terá acesso caso o módulo esteja habilitado em <b>qualquer um</b> deles. 
                  Administradores Globais mantêm acesso total a todas as rotinas independente destas travas.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-center border-2 border-dashed rounded-3xl p-8 bg-muted/10">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Nenhum departamento selecionado</h3>
            <p className="text-sm text-muted-foreground max-w-xs mt-2">
              Clique em um dos cards acima para começar a configurar os acessos às rotinas.
            </p>
          </div>
        )}
    </div>
  );
};

// Internal components to avoid import errors if not predefined
const Badge = ({ children, className, variant }: any) => (
  <div className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase", className)}>
    {children}
  </div>
);

export default GroupPermissions;
