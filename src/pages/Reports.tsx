import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import { BarChart3, Plus, Trash2, Users, Baby, DollarSign, Heart, Edit2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

const Reports = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleting, setDeleting] = useState<any>(null);

  // Form
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [reportType, setReportType] = useState("culto");
  const [totalAttendees, setTotalAttendees] = useState(0);
  const [childrenCount, setChildrenCount] = useState(0);
  const [monitorsCount, setMonitorsCount] = useState(0);
  const [youthCount, setYouthCount] = useState(0);
  const [publicCount, setPublicCount] = useState(0);
  const [totalOfferings, setTotalOfferings] = useState(0);
  const [tithesAmount, setTithesAmount] = useState(0);
  const [tithers, setTithers] = useState<string[]>([]);
  const [newTither, setNewTither] = useState("");
  const [notes, setNotes] = useState("");
  const [eventId, setEventId] = useState<string | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);

  const { isGerente, managedGroupIds } = useAuth();

  const { data: reports } = useQuery({
    queryKey: ["event-reports", managedGroupIds, isAdmin],
    queryFn: async () => {
      let query = (supabase as any).from("event_reports").select("*, groups(name)").order("report_date", { ascending: false });
      if (!isAdmin && managedGroupIds.length > 0) {
        query = query.in("group_id", managedGroupIds);
      }
      const { data } = await query;
      return data || [];
    },
  });

  const { data: events } = useQuery({
    queryKey: ["events-for-reports"],
    queryFn: async () => {
      const { data } = await supabase.from("events").select("id, title, event_date").order("event_date", { ascending: false }).limit(50);
      return data || [];
    },
  });

  const { data: groups } = useQuery({
    queryKey: ["groups-for-reports"],
    queryFn: async () => {
      const { data } = await supabase.from("groups").select("id, name");
      return data || [];
    },
  });

  const resetForm = () => {
    setReportDate(new Date().toISOString().slice(0, 10));
    setReportType("culto");
    setTotalAttendees(0);
    setChildrenCount(0);
    setMonitorsCount(0);
    setYouthCount(0);
    setPublicCount(0);
    setTotalOfferings(0);
    setTithesAmount(0);
    setTithers([]);
    setNewTither("");
    setNotes("");
    setEventId(null);
    setGroupId(null);
  };

  const handleEdit = (r: any) => {
    setEditing(r);
    setReportDate(r.report_date);
    setReportType(r.report_type || "culto");
    setTotalAttendees(r.total_attendees || 0);
    setChildrenCount(r.children_count || 0);
    setMonitorsCount(r.monitors_count || 0);
    setYouthCount(r.youth_count || 0);
    setPublicCount(r.public_count || 0);
    setTotalOfferings(r.total_offerings || 0);
    setTithesAmount(r.tithes_amount || 0);
    setTithers(r.tithers || []);
    setNotes(r.notes || "");
    setEventId(r.event_id || null);
    setGroupId(r.group_id || null);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        report_date: reportDate,
        report_type: reportType,
        total_attendees: totalAttendees,
        children_count: childrenCount,
        monitors_count: monitorsCount,
        youth_count: youthCount,
        public_count: publicCount,
        total_offerings: totalOfferings,
        tithes_amount: tithesAmount,
        tithers,
        notes: notes.trim() || null,
        event_id: eventId || null,
        group_id: groupId || null,
        created_by: user?.id,
      };
      if (editing) {
        const { error } = await (supabase as any).from("event_reports").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("event_reports").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-reports"] });
      setCreating(false);
      setEditing(null);
      resetForm();
      toast({ title: editing ? "Relatório atualizado!" : "Relatório criado!" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("event_reports").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-reports"] });
      toast({ title: "Relatório removido." });
    },
  });

  const addTither = () => {
    if (newTither.trim()) {
      setTithers(prev => [...prev, newTither.trim()]);
      setNewTither("");
    }
  };

  const removeTither = (idx: number) => {
    setTithers(prev => prev.filter((_, i) => i !== idx));
  };

  if (!isAdmin && !isGerente) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Acesso restrito a administradores e líderes de departamento.
      </div>
    );
  }

  // Summary stats
  const totalPeople = reports?.reduce((s: number, r: any) => s + (r.total_attendees || 0), 0) || 0;
  const totalOfferingSum = reports?.reduce((s: number, r: any) => s + (r.total_offerings || 0), 0) || 0;
  const totalReports = reports?.length || 0;

  const formOpen = creating || !!editing;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          Relatórios
        </h1>
        <Button onClick={() => { resetForm(); setCreating(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Novo Relatório
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="neo-shadow-sm border-0">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{totalReports}</p>
            <p className="text-xs text-muted-foreground">Relatórios</p>
          </CardContent>
        </Card>
        <Card className="neo-shadow-sm border-0">
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold">{totalPeople}</p>
            <p className="text-xs text-muted-foreground">Total Pessoas</p>
          </CardContent>
        </Card>
        <Card className="neo-shadow-sm border-0">
          <CardContent className="p-4 text-center">
            <Baby className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold">{reports?.reduce((s: number, r: any) => s + (r.children_count || 0), 0) || 0}</p>
            <p className="text-xs text-muted-foreground">Total Crianças</p>
          </CardContent>
        </Card>
        <Card className="neo-shadow-sm border-0">
          <CardContent className="p-4 text-center">
            <DollarSign className="h-5 w-5 mx-auto text-emerald-600 mb-1" />
            <p className="text-2xl font-bold text-emerald-600">R$ {(totalOfferingSum + (reports?.reduce((s: number, r: any) => s + (r.tithes_amount || 0), 0) || 0)).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Total Arrecadado (O+D)</p>
          </CardContent>
        </Card>
      </div>

      {isAdmin && (
        <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20">
          <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-3">Visão Macro (Consolidado)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Presentes</p>
              <p className="text-xl font-bold">{totalPeople}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Crianças+Jovens</p>
              <p className="text-xl font-bold">
                {(reports?.reduce((s: number, r: any) => s + (r.children_count || 0) + (r.youth_count || 0), 0) || 0)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Dízimos</p>
              <p className="text-xl font-bold text-emerald-600">
                R$ {(reports?.reduce((s: number, r: any) => s + (r.tithes_amount || 0), 0) || 0).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Ofertas</p>
              <p className="text-xl font-bold text-emerald-600">
                R$ {totalOfferingSum.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Reports list */}
      <div className="space-y-3">
        {reports?.length === 0 && (
          <Card className="border-0 bg-muted/30">
            <CardContent className="p-6 text-center text-muted-foreground">Nenhum relatório ainda.</CardContent>
          </Card>
        )}
        {reports?.map((r: any) => (
          <Card key={r.id} className="neo-shadow-sm border-0">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs capitalize">{r.report_type}</Badge>
                    <span className="text-sm font-semibold">
                      {format(new Date(r.report_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                    {r.groups?.name && <Badge variant="outline" className="text-[10px]">{r.groups.name}</Badge>}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2 text-xs">
                    <div className="bg-muted/50 rounded-lg p-2 text-center">
                      <p className="font-bold text-lg">{r.total_attendees}</p>
                      <p className="text-muted-foreground">Frequência</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2 text-center">
                      <p className="font-bold text-lg">{r.children_count || 0}</p>
                      <p className="text-muted-foreground">Kids</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2 text-center">
                      <p className="font-bold text-lg">{r.youth_count || 0}</p>
                      <p className="text-muted-foreground">Jovens</p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-2 text-center">
                      <p className="font-bold text-sm text-emerald-600">R$ {(r.tithes_amount || 0).toFixed(2)}</p>
                      <p className="text-[10px] text-muted-foreground">Dízimos</p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-2 text-center">
                      <p className="font-bold text-sm text-emerald-600">R$ {(r.total_offerings || 0).toFixed(2)}</p>
                      <p className="text-[10px] text-muted-foreground">Ofertas</p>
                    </div>
                  </div>
                  {r.tithers && (r.tithers as string[]).length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                        <Heart className="h-3 w-3" /> Dizimistas ({(r.tithers as string[]).length}):
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(r.tithers as string[]).map((t: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-[10px]">{t}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {r.notes && <p className="text-xs text-muted-foreground mt-1 italic">📝 {r.notes}</p>}
                </div>
                <div className="flex gap-1 ml-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(r)}>
                    <Edit2 className="h-4 w-4 text-primary" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleting(r)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={v => { if (!v) { setCreating(false); setEditing(null); } }}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar Relatório" : "Novo Relatório"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="culto">Culto</SelectItem>
                    <SelectItem value="evento">Evento</SelectItem>
                    <SelectItem value="conferencia">Conferência</SelectItem>
                    <SelectItem value="celula">Célula</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Departamento/Grupo (obrigatório)</Label>
                <Select value={groupId || ""} onValueChange={v => setGroupId(v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione o depto" /></SelectTrigger>
                  <SelectContent>
                    {isAdmin 
                      ? (groups?.map((g: any) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>))
                      : (groups?.filter((g: any) => managedGroupIds.includes(g.id)).map((g: any) => (
                          <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                        )))
                    }
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Evento Vinculado (opcional)</Label>
                <Select value={eventId || "none"} onValueChange={v => setEventId(v === "none" ? null : v)}>
                  <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {events?.map(ev => (
                      <SelectItem key={ev.id} value={ev.id}>{ev.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="font-semibold uppercase tracking-tight text-xs text-muted-foreground border-b pb-2 mt-4">Público</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Total Geral</Label>
                <Input type="number" min={0} value={totalAttendees} onChange={e => setTotalAttendees(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Crianças</Label>
                <Input type="number" min={0} value={childrenCount} onChange={e => setChildrenCount(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Jovens (opcional)</Label>
                <Input type="number" min={0} value={youthCount} onChange={e => setYouthCount(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Público Geral</Label>
                <Input type="number" min={0} value={publicCount} onChange={e => setPublicCount(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Monitores / Tios</Label>
                <Input type="number" min={0} value={monitorsCount} onChange={e => setMonitorsCount(Number(e.target.value))} />
              </div>
            </div>

            <div className="font-semibold uppercase tracking-tight text-xs text-muted-foreground border-b pb-2 mt-4">Financeiro</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Total Dízimos (R$)</Label>
                <Input type="number" min={0} step={0.01} value={tithesAmount} onChange={e => setTithesAmount(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Total Ofertas (R$)</Label>
                <Input type="number" min={0} step={0.01} value={totalOfferings} onChange={e => setTotalOfferings(Number(e.target.value))} />
              </div>
            </div>

            <div className="font-semibold uppercase tracking-tight text-xs text-muted-foreground border-b pb-2 mt-4">Dizimistas do Dia</div>
            <div className="flex gap-2">
              <Input
                value={newTither}
                onChange={e => setNewTither(e.target.value)}
                placeholder="Nome do dizimista"
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTither())}
              />
              <Button type="button" variant="outline" onClick={addTither} disabled={!newTither.trim()}>Adicionar</Button>
            </div>
            {tithers.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tithers.map((t, i) => (
                  <Badge key={i} variant="secondary" className="text-xs cursor-pointer" onClick={() => removeTither(i)}>
                    {t} ✕
                  </Badge>
                ))}
              </div>
            )}

            <div className="space-y-2 mt-4">
              <Label>Observações</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas adicionais..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreating(false); setEditing(null); }}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando..." : editing ? "Salvar" : "Criar Relatório"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        title="Excluir Relatório"
        description="Deseja realmente excluir este relatório?"
        confirmLabel="Excluir"
        variant="danger"
        onConfirm={() => deleteMutation.mutate(deleting?.id)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
};

export default Reports;
