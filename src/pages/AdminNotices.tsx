import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Megaphone, Send, Users, User, Trash2, Loader2, Info, AlertTriangle, Bell, Filter, Inbox, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { safeFormat } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const AdminNotices = () => {
  const { user, isAdmin, isGerente, managedGroupIds } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState(isAdmin ? "general" : "group");
  const [priority, setPriority] = useState("normal");
  const [groupId, setGroupId] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState("all");

  // Invalidate and refetch on real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('announcements-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
        queryClient.invalidateQueries({ queryKey: ["announcements-inbox"] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const { data: groups } = useQuery({
    queryKey: ["groups-list-notices"],
    queryFn: async () => {
      const { data } = await supabase.from("groups").select("id, name");
      return data || [];
    },
  });

  const { data: members } = useQuery({
    queryKey: ["members-list-notices"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name");
      return data || [];
    },
  });

  const [lastCheckBeforeVisit] = useState(() => 
    localStorage.getItem("last_checked_announcements") || new Date(0).toISOString()
  );

  const { data: announcements, isLoading } = useQuery({
    queryKey: ["announcements-inbox", filter],
    queryFn: async () => {
      // Usando select "*" para evitar erros de join enquanto estabilizamos as colunas
      let query = (supabase as any)
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter === "group") query = query.not("target_group_id", "is", null);
      if (filter === "private") query = query.eq("target_user_id", user?.id);
      
      const { data, error } = await query;
      if (error) throw error;
      
      localStorage.setItem("last_checked_announcements", new Date().toISOString());
      
      return data || [];
    },
    refetchInterval: 30000,
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!title || !content) throw new Error("Título e conteúdo são obrigatórios");
      const { error } = await (supabase as any).from("announcements").insert({
        title,
        content,
        type,
        priority,
        target_group_id: type === "group" ? groupId : null,
        target_user_id: type === "individual" ? targetUserId : null,
        created_by: user?.id
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setTitle(""); setContent(""); setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ["announcements-inbox"] });
      toast({ title: "Aviso disparado!", description: "O comunicado foi enviado com sucesso." });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("announcements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements-inbox"] });
      toast({ title: "Aviso removido" });
    }
  });

  const canCreate = isAdmin;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 pb-Safe">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
            <Megaphone className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Central de Comunicados</h1>
            <p className="text-sm text-muted-foreground">Fique por dentro das novidades e avisos importantes.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canCreate && (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                  <Send className="h-4 w-4" /> Novo Comunicado
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Criar Novo Comunicado</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Alcance</Label>
                      <Select value={type} onValueChange={setType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {isAdmin && <SelectItem value="general">Geral (Todos)</SelectItem>}
                          <SelectItem value="group">Departamento</SelectItem>
                          {isAdmin && <SelectItem value="individual">Individual</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Prioridade</Label>
                      <Select value={priority} onValueChange={setPriority}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="urgent">Urgente 🚨</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {type === "group" && (
                    <div className="space-y-2">
                      <Label>Departamento Destino</Label>
                      <Select value={groupId} onValueChange={setGroupId}>
                        <SelectTrigger><SelectValue placeholder="Escolha o grupo" /></SelectTrigger>
                        <SelectContent>
                          {groups?.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {type === "individual" && (
                    <div className="space-y-2">
                      <Label>Membro Destino</Label>
                      <Select value={targetUserId} onValueChange={setTargetUserId}>
                        <SelectTrigger><SelectValue placeholder="Escolha o membro" /></SelectTrigger>
                        <SelectContent>
                          {members?.map(m => <SelectItem key={m.user_id} value={m.user_id}>{m.full_name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input placeholder="Resumo do aviso..." value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label>Mensagem</Label>
                    <Textarea 
                      placeholder="Escreva os detalhes aqui..." 
                      className="min-h-[120px]" 
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    />
                  </div>

                  <Button className="w-full" onClick={() => sendMutation.mutate()} disabled={sendMutation.isPending}>
                    {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                    Disparar agora
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </header>

      <Tabs defaultValue="all" onValueChange={setFilter} className="w-full">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="all" className="gap-2 relative">
              <Inbox className="h-3.5 w-3.5" /> Tudo
              {announcements?.filter((n: any) => 
                n.created_at > lastCheckBeforeVisit && 
                n.created_by !== user?.id
              ).length > 0 && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full border-2 border-background" />
              )}
            </TabsTrigger>
            <TabsTrigger value="group" className="gap-2 relative text-xs">
              <Users className="h-3.5 w-3.5" /> Departamentos
              {announcements?.filter((n: any) => 
                n.created_at > lastCheckBeforeVisit && 
                n.created_by !== user?.id && n.target_group_id
              ).length > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-blue-500 rounded-full border-2 border-background text-[10px] text-white flex items-center justify-center font-bold">
                  {announcements?.filter((n: any) => 
                    n.created_at > lastCheckBeforeVisit && 
                    n.created_by !== user?.id && n.target_group_id
                  ).length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="private" className="gap-2 relative text-xs">
              <User className="h-3.5 w-3.5" /> Privados
              {announcements?.filter((n: any) => 
                n.created_at > lastCheckBeforeVisit && 
                n.created_by !== user?.id && n.target_user_id === user?.id
              ).length > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-indigo-500 rounded-full border-2 border-background text-[10px] text-white flex items-center justify-center font-bold">
                  {announcements?.filter((n: any) => 
                    n.created_at > lastCheckBeforeVisit && 
                    n.created_by !== user?.id && n.target_user_id === user?.id
                  ).length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-full border">
            <Filter className="h-3 w-3" />
            Mostrando <b>{announcements?.length || 0}</b> avisos 
          </div>
        </div>

        <TabsContent value={filter} className="mt-0">
          {isLoading ? (
            <div className="space-y-4 animate-in fade-in duration-500">
              {[1, 2, 3].map(i => <Card key={i} className="h-24 animate-pulse bg-muted rounded-2xl" />)}
            </div>
          ) : announcements?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <Bell className="h-10 w-10" />
              </div>
              <h3 className="text-lg font-medium">Nenhum comunicado</h3>
              <p className="text-sm max-w-xs">Você está em dia com todos os avisos por aqui.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {announcements?.map((notice: any) => (
                <Card key={notice.id} className={cn(
                  "border-0 shadow-sm transition-all hover:shadow-md active:scale-[0.99] rounded-2xl overflow-hidden",
                  notice.priority === "urgent" ? "ring-2 ring-destructive/30" : ""
                )}>
                  <CardContent className="p-0">
                    <div className="flex items-stretch">
                      <div className={cn(
                        "w-2 shrink-0 transition-colors",
                        notice.priority === "urgent" ? "bg-destructive animate-pulse" : 
                        notice.type === "general" ? "bg-blue-500" : "bg-indigo-500"
                      )} />
                      
                      <div className="flex-1 p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            {notice.priority === "urgent" && (
                              <Badge variant="destructive" className="animate-bounce">URGENTE</Badge>
                            )}
                            <Badge variant="secondary" className="bg-muted/50">
                              {notice.type === "general" ? "Igreja" : "Departamento"}
                            </Badge>
                            {notice.target_user_id === user?.id && (
                              <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50">Individual</Badge>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground font-medium uppercase">
                            {safeFormat(notice.created_at, "PPp")}
                          </span>
                        </div>
                        
                        <h4 className="text-lg font-bold mb-1 flex items-center gap-2">
                          {notice.priority === "urgent" ? <AlertTriangle className="h-5 w-5 text-destructive" /> : <Info className="h-5 w-5 text-blue-500" />}
                          {notice.title}
                        </h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                          {notice.content}
                        </p>

                        {isAdmin && (
                          <div className="mt-4 pt-4 border-t flex justify-end">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => deleteMutation.mutate(notice.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Excluir Aviso
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminNotices;
