import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ConfirmDialog from "@/components/ConfirmDialog";
import { FileSearch, Trash2, Filter, RefreshCw, Shield, Clock, User, Monitor, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  login: { label: "Login", color: "bg-blue-500" },
  access: { label: "Acesso", color: "bg-slate-500" },
  create: { label: "Criação", color: "bg-emerald-500" },
  update: { label: "Edição", color: "bg-amber-500" },
  delete: { label: "Exclusão", color: "bg-rose-500" },
};

const AuditLogs = () => {
  const { isAdmin, isAdminCCM } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [filterUser, setFilterUser] = useState("");
  const [filterRoutine, setFilterRoutine] = useState("all");
  const [filterAction, setFilterAction] = useState("all");
  const [deletingLog, setDeletingLog] = useState<any>(null);
  const [clearAllConfirm, setClearAllConfirm] = useState(false);

  if (!isAdmin) return <Navigate to="/home" replace />;

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ["audit-logs", filterUser, filterRoutine, filterAction],
    queryFn: async () => {
      let query = (supabase as any)
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (filterUser.trim()) {
        query = query.or(`user_name.ilike.%${filterUser}%,user_email.ilike.%${filterUser}%`);
      }
      if (filterRoutine !== "all") {
        query = query.eq("routine", filterRoutine);
      }
      if (filterAction !== "all") {
        query = query.eq("action", filterAction);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 10000, // Refresh every 10s for real-time feel
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("audit-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "audit_logs" }, () => {
        refetch();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [refetch]);

  const deleteLogMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("audit_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
      toast({ title: "Log removido." });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("audit_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
      toast({ title: "Todos os logs foram limpos." });
    },
  });

  const uniqueRoutines = [...new Set((logs || []).map((l: any) => l.routine))].sort();

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-600">
            <FileSearch className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Auditoria</h1>
            <p className="text-sm text-muted-foreground">Log de acessos e ações em tempo real</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Atualizar
          </Button>
          {isAdmin && (
            <Button variant="destructive" size="sm" onClick={() => setClearAllConfirm(true)} className="gap-2">
              <Trash2 className="h-4 w-4" /> Limpar Tudo
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4 text-center">
            <Activity className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold">{logs?.length || 0}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Total Logs</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4 text-center">
            <User className="h-5 w-5 mx-auto text-blue-500 mb-1" />
            <p className="text-2xl font-bold">{new Set((logs || []).map((l: any) => l.user_id)).size}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Usuários</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4 text-center">
            <Shield className="h-5 w-5 mx-auto text-emerald-500 mb-1" />
            <p className="text-2xl font-bold">{(logs || []).filter((l: any) => l.action === "create").length}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Criações</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4 text-center">
            <Trash2 className="h-5 w-5 mx-auto text-rose-500 mb-1" />
            <p className="text-2xl font-bold">{(logs || []).filter((l: any) => l.action === "delete").length}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Exclusões</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase text-muted-foreground">
            <Filter className="h-3.5 w-3.5" /> Filtros
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              placeholder="Buscar por nome ou email..."
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="h-10"
            />
            <Select value={filterRoutine} onValueChange={setFilterRoutine}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Rotina" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as rotinas</SelectItem>
                {uniqueRoutines.map((r: string) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Ação" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as ações</SelectItem>
                {Object.entries(ACTION_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <span className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : logs?.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="p-12 text-center text-muted-foreground">
              <FileSearch className="h-10 w-10 mx-auto mb-2 opacity-20" />
              <p>Nenhum log encontrado.</p>
            </CardContent>
          </Card>
        ) : (
          logs?.map((log: any) => {
            const actionInfo = ACTION_LABELS[log.action] || { label: log.action, color: "bg-gray-500" };
            return (
              <Card key={log.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={cn("h-2 w-2 rounded-full shrink-0", actionInfo.color)} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={cn("text-[10px] text-white border-0", actionInfo.color)}>
                            {actionInfo.label}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">{log.routine}</Badge>
                          <span className="text-xs font-bold truncate">{log.user_name || log.user_email}</span>
                        </div>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <p className="text-[11px] text-muted-foreground mt-1 truncate">
                            {JSON.stringify(log.details).substring(0, 100)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDate(log.created_at)}
                        </div>
                        {log.device_info && (
                          <div className="flex items-center gap-1 text-[9px] text-muted-foreground mt-0.5">
                            <Monitor className="h-2.5 w-2.5" />
                            {log.device_info.substring(0, 30)}...
                          </div>
                        )}
                      </div>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeletingLog(log)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <ConfirmDialog
        open={!!deletingLog}
        title="Excluir Log"
        description="Deseja excluir este registro de auditoria?"
        confirmLabel="Excluir"
        variant="danger"
        onConfirm={() => deleteLogMutation.mutate(deletingLog?.id)}
        onCancel={() => setDeletingLog(null)}
      />

      <ConfirmDialog
        open={clearAllConfirm}
        title="Limpar Todos os Logs"
        description="Esta ação é irreversível. Todos os registros de auditoria serão removidos permanentemente."
        confirmLabel="Limpar Tudo"
        variant="danger"
        onConfirm={() => { clearAllMutation.mutate(); setClearAllConfirm(false); }}
        onCancel={() => setClearAllConfirm(false)}
      />
    </div>
  );
};

export default AuditLogs;
