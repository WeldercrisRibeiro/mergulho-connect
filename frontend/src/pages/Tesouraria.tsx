import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import { DashboardStatBox } from "@/components/DashboardStatBox";
import { DollarSign, Wallet, Heart, BarChart3, TrendingUp, Users, Plus, Filter, Download, ArrowUpRight, Search, FileText, Copy, CheckCheck, Baby, QrCode, CalendarDays, Trash2, Edit2, ClipboardList, ChevronDown } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { safeFormat } from "@/lib/dateUtils";
import { useToast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────
type PaymentType = "dizimo" | "oferta";

interface TreasuryEntry {
  id: string;
  memberName: string;
  amount: number;
  paymentType: PaymentType;
  paymentDate: string;
  notes: string | null;
  createdBy: string;
  createdAt: string;
}

interface CultoReport {
  id: string;
  reportDate: string;
  reportType: string;
  totalAttendees: number;
  childrenCount: number;
  youthCount: number;
  monitorsCount: number;
  publicCount: number;
  notes: string | null;
  createdBy: string;
  eventId: string | null;
  escalaData: { role: string; name: string }[] | null;
  eventTitle?: string;
}

// ─── PIX Copy Button ──────────────────────────────────────────────────────────
const PixCopyButton = ({ pixKey }: { pixKey: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-2 text-emerald-700 dark:text-emerald-400 font-mono text-sm hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
    >
      {copied ? <CheckCheck className="h-4 w-4 shrink-0" /> : <Copy className="h-4 w-4 shrink-0" />}
      <span className="truncate max-w-[200px]">{pixKey}</span>
      <span className="text-[10px] font-sans ml-1 text-emerald-600">{copied ? "Copiado!" : "Copiar"}</span>
    </button>
  );
};

// ─── Member View ──────────────────────────────────────────────────────────────
const MemberTesouraria = ({
  pixKey,
  user,
}: {
  pixKey: string;
  user: any;
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<PaymentType>("dizimo");
  const [memberName, setMemberName] = useState(user?.user_metadata?.full_name || "");
  const [amount, setAmount] = useState<number | "">("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  const { data: myEntries } = useQuery({
    queryKey: ["treasury-my-entries", user?.id],
    queryFn: async () => {
      const { data } = await api.get('/treasury-entries', { params: { createdBy: user?.id } });
      return data as TreasuryEntry[];
    },
    enabled: !!user?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!amount || Number(amount) <= 0) throw new Error("Informe um valor válido.");
      const payload = {
        memberName: memberName.trim(),
        amount: Number(amount),
        paymentType: paymentType,
        paymentDate: paymentDate,
        notes: notes.trim() || null,
        createdBy: user?.id,
      };
      await api.post('/treasury-entries', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treasury-my-entries", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["treasury-all-entries"] });
      setOpen(false);
      setAmount("");
      setNotes("");
      toast({ title: `${paymentType === "dizimo" ? "Dízimo" : "Oferta"} registrado(a) com sucesso! 🙏` });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const myTotal = myEntries?.reduce((s, e) => s + Number(e.amount || 0), 0) || 0;
  const myTithes = myEntries?.filter(e => e.paymentType === "dizimo").reduce((s, e) => s + Number(e.amount || 0), 0) || 0;
  const myOfferings = myEntries?.filter(e => e.paymentType === "oferta").reduce((s, e) => s + Number(e.amount || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* PIX Card */}
      {pixKey ? (
        <Card className="border-0 shadow-xl rounded-3xl overflow-hidden">
          <div className="h-1.5 bg-emerald-500" />
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                <QrCode className="h-7 w-7 text-emerald-600" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="font-bold text-base">Chave PIX da Igreja</p>
                <p className="text-xs text-muted-foreground">Copie a chave abaixo para realizar sua contribuição no app do banco.</p>
                <PixCopyButton pixKey={pixKey} />
              </div>
            </div>
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-700 dark:text-amber-400">
              💡 Após realizar o pagamento, registre aqui para que sua contribuição seja contabilizada.
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 rounded-3xl bg-muted/30">
          <CardContent className="p-6 text-center text-muted-foreground text-sm">
            Chave PIX ainda não configurada. Fale com um administrador.
          </CardContent>
        </Card>
      )}

      {/* Register Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg">Minhas Contribuições</h2>
          <p className="text-xs text-muted-foreground">{myEntries?.length || 0} registros</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Registrar Contribuição
        </Button>
      </div>

      {/* My Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-0 bg-muted/30 rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-lg font-bold text-emerald-600">R$ {myTotal.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Total</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-muted/30 rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-lg font-bold">R$ {myTithes.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Dízimos</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-muted/30 rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-lg font-bold">R$ {myOfferings.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Ofertas</p>
          </CardContent>
        </Card>
      </div>

      {/* My Entries List */}
      <div className="space-y-2">
        {myEntries?.length === 0 && (
          <Card className="border-0 bg-muted/20 rounded-3xl">
            <CardContent className="p-8 text-center text-muted-foreground">
              <Heart className="h-10 w-10 mx-auto mb-2 opacity-20" />
              <p>Nenhuma contribuição registrada ainda.</p>
            </CardContent>
          </Card>
        )}
        {myEntries?.map(entry => (
          <Card key={entry.id} className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${entry.paymentType === "dizimo" ? "bg-primary/10 text-primary" : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"}`}>
                {entry.paymentType === "dizimo" ? <Heart className="h-5 w-5" /> : <DollarSign className="h-5 w-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={entry.paymentType === "dizimo" ? "default" : "secondary"} className="text-[10px] capitalize">
                    {entry.paymentType}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {safeFormat(entry.paymentDate + "T12:00:00", "dd/MM/yyyy")}
                  </span>
                </div>
                {entry.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate italic">{entry.notes}</p>}
              </div>
              <p className="font-bold text-emerald-600 shrink-0">R$ {Number(entry.amount || 0).toFixed(2)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Registration Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" /> Registrar Contribuição
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["dizimo", "oferta"] as PaymentType[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setPaymentType(t)}
                    className={`p-3 rounded-xl border-2 text-sm font-bold capitalize transition-all ${paymentType === t ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/20 text-muted-foreground hover:border-primary/50"}`}
                  >
                    {t === "dizimo" ? "💚 Dízimo" : "🙏 Oferta"}
                  </button>
                ))}
              </div>
            </div>

            {paymentType === "dizimo" && (
              <div className="space-y-2">
                <Label>Nome do Dizimista</Label>
                <Input
                  value={memberName}
                  onChange={e => setMemberName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="h-11 rounded-xl"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={amount}
                  onChange={e => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="0,00"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Data do Pagamento</Label>
                <Input
                  type="date"
                  max="9999-12-31"
                  value={paymentDate}
                  onChange={e => setPaymentDate(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Ex: Mês de março..."
                rows={2}
                className="rounded-xl resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const AdminTesouraria = ({ pixKey, user, isAdminCCM }: { pixKey: string; user: any; isAdminCCM: boolean }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { skin } = useTheme();

  // Culto report form
  const [reportOpen, setReportOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<any>(null);
  const [deletingReport, setDeletingReport] = useState<any>(null);
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [reportType, setReportType] = useState("culto");
  const [totalAttendees, setTotalAttendees] = useState(0);
  const [childrenCount, setChildrenCount] = useState(0);
  const [youthCount, setYouthCount] = useState(0);
  const [monitorsCount, setMonitorsCount] = useState(0);
  const [reportNotes, setReportNotes] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [escala, setEscala] = useState<{ role: string; name: string }[]>([]);

  // Entries
  const [filterType, setFilterType] = useState<"all" | PaymentType>("all");
  const [deletingEntry, setDeletingEntry] = useState<TreasuryEntry | null>(null);

  const { data: events } = useQuery({
    queryKey: ["events-for-reports"],
    queryFn: async () => {
      const { data } = await api.get('/events');
      return (data || []).slice(0, 20).map((e: any) => ({ id: e.id, title: e.title, event_date: e.eventDate }));
    }
  });

  const { data: allEntries } = useQuery({
    queryKey: ["treasury-all-entries"],
    queryFn: async () => {
      const { data } = await api.get('/treasury-entries');
      return data as TreasuryEntry[];
    },
  });

  const { data: cultoReports } = useQuery({
    queryKey: ["culto-reports"],
    queryFn: async () => {
      const { data } = await api.get('/culto-reports');
      return (data || []).map((r: any) => ({
        ...r,
        reportDate: r.reportDate,
        reportType: r.reportType,
        totalAttendees: r.totalAttendees,
        childrenCount: r.childrenCount,
        youthCount: r.youthCount,
        monitorsCount: r.monitorsCount,
        publicCount: r.publicCount,
        eventId: r.eventId,
        createdBy: r.createdBy,
        escalaData: r.escalaData,
        eventTitle: r.event?.title,
      })) as CultoReport[];
    },
  });

  const resetReportForm = () => {
    setReportDate(new Date().toISOString().slice(0, 10));
    setReportType("culto");
    setTotalAttendees(0);
    setChildrenCount(0);
    setYouthCount(0);
    setMonitorsCount(0);
    setReportNotes("");
    setSelectedEventId(null);
    setEscala([]);
    setEditingReport(null);
  };

  const handleEditReport = (r: CultoReport) => {
    setEditingReport(r);
    setReportDate(r.reportDate);
    setReportType(r.reportType);
    setTotalAttendees(r.totalAttendees || 0);
    setChildrenCount(r.childrenCount || 0);
    setYouthCount(r.youthCount || 0);
    setMonitorsCount(r.monitorsCount || 0);
    setReportNotes(r.notes || "");
    setSelectedEventId(r.eventId);
    setEscala(r.escalaData || []);
    setReportOpen(true);
  };

  const saveReportMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        reportDate: reportDate,
        reportType: reportType,
        totalAttendees: totalAttendees,
        childrenCount: childrenCount,
        youthCount: youthCount,
        monitorsCount: monitorsCount,
        publicCount: Math.max(0, totalAttendees - childrenCount - monitorsCount),
        notes: reportNotes.trim() || null,
        createdBy: user?.id,
        eventId: selectedEventId,
        escalaData: escala,
      };
      if (editingReport) {
        await api.patch(`/culto-reports/${editingReport.id}`, payload);
      } else {
        await api.post('/culto-reports', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["culto-reports"] });
      setReportOpen(false);
      resetReportForm();
      toast({ title: editingReport ? "Relatório atualizado! ✅" : "Relatório de culto criado! ✅" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const suggestCounts = async () => {
    if (!selectedEventId) return;
    try {
      const { data } = await api.get(`/event-checkins`, { params: { eventId: selectedEventId } });
      const count = (data || []).length;
      if (count > 0) {
        setTotalAttendees(count);
        toast({ title: "Sugestão aplicada", description: `${count} presenças detectadas via check-in.` });
      } else {
        toast({ title: "Sem dados", description: "Nenhum check-in registrado para este evento ainda.", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Erro ao sugerir", variant: "destructive" });
    }
  };

  const addEscalaRow = () => setEscala([...escala, { role: "", name: "" }]);
  const removeEscalaRow = (index: number) => setEscala(escala.filter((_, i) => i !== index));
  const updateEscalaRow = (index: number, field: "role" | "name", value: string) => {
    const newEscala = [...escala];
    newEscala[index][field] = value;
    setEscala(newEscala);
  };

  const deleteEntryMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/treasury-entries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treasury-all-entries"] });
      queryClient.invalidateQueries({ queryKey: ["treasury-my-entries"] });
      setDeletingEntry(null);
      toast({ title: "Contribuição excluída." });
    },
    onError: (err: any) => toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" }),
  });

  const deleteReportMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/culto-reports/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["culto-reports"] });
      setDeletingReport(null);
      toast({ title: "Relatório removido." });
    },
  });

  // Computed stats
  const totalTithes = allEntries?.filter(e => e.paymentType === "dizimo").reduce((s, e) => s + Number(e.amount || 0), 0) || 0;
  const totalOfferings = allEntries?.filter(e => e.paymentType === "oferta").reduce((s, e) => s + Number(e.amount || 0), 0) || 0;
  const totalAmount = totalTithes + totalOfferings;
  const uniqueTithers = new Set(allEntries?.filter(e => e.paymentType === "dizimo").map(e => e.memberName)).size;
  const totalPeople = cultoReports?.reduce((s, r) => s + (r.totalAttendees || 0), 0) || 0;

  const filteredEntries = allEntries?.filter(e =>
    filterType === "all" ? true : e.paymentType === filterType
  ) || [];

  return (
    <div className="space-y-6">
      {/* Summary Macro */}
      <div className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" /> Visão Consolidada
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardStatBox
            icon={<DollarSign className="h-6 w-6" />}
            label="Total Arrecadado"
            value={`R$ ${totalAmount.toFixed(2)}`}
            color={skin !== "default" ? "bg-primary" : "bg-brand-cyan"}
          />
          <DashboardStatBox
            icon={<Heart className="h-6 w-6" />}
            label="Dízimos"
            value={`R$ ${totalTithes.toFixed(2)}`}
            color={skin !== "default" ? "bg-primary" : "bg-brand-navy"}
          />
          <DashboardStatBox
            icon={<Wallet className="h-6 w-6" />}
            label="Ofertas"
            value={`R$ ${totalOfferings.toFixed(2)}`}
            color={skin !== "default" ? "bg-primary" : "bg-brand-charcoal"}
          />
          <DashboardStatBox
            icon={<Users className="h-6 w-6" />}
            label="Dizimistas"
            value={uniqueTithers}
            color={skin !== "default" ? "bg-primary" : "bg-brand-cyan"}
          />
        </div>
      </div>

      <Tabs defaultValue="entradas">
        <TabsList className="w-full bg-muted/40 rounded-2xl p-1 h-auto gap-1">
          <TabsTrigger value="entradas" className="flex-1 rounded-xl gap-2 py-2 text-xs">
            <DollarSign className="h-3.5 w-3.5" /> Entradas
          </TabsTrigger>
          <TabsTrigger value="relatorio" className="flex-1 rounded-xl gap-2 py-2 text-xs">
            <ClipboardList className="h-3.5 w-3.5" /> Relatórios de Culto
          </TabsTrigger>
        </TabsList>

        {/* ── Entradas Tab ─────────────────────────────────────────────── */}
        <TabsContent value="entradas" className="pt-4 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            {(["all", "dizimo", "oferta"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${filterType === f ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50 text-muted-foreground"}`}
              >
                {f === "all" ? "Todos" : f === "dizimo" ? "Dízimos" : "Ofertas"}
              </button>
            ))}
            <span className="ml-auto text-xs text-muted-foreground">{filteredEntries.length} registros</span>
          </div>

          <div className="space-y-2">
            {filteredEntries.length === 0 && (
              <Card className="border-0 bg-muted/20 rounded-3xl">
                <CardContent className="p-8 text-center text-muted-foreground">
                  Nenhuma contribuição registrada.
                </CardContent>
              </Card>
            )}
            {filteredEntries.map(entry => (
              <Card key={entry.id} className="border-0 shadow-sm rounded-2xl">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${entry.paymentType === "dizimo" ? "bg-primary/10 text-primary" : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"}`}>
                    {entry.paymentType === "dizimo" ? <Heart className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{entry.memberName || "—"}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant={entry.paymentType === "dizimo" ? "default" : "secondary"} className="text-[9px] capitalize">
                        {entry.paymentType}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {safeFormat(entry.paymentDate + "T12:00:00", "dd/MM/yyyy")}
                      </span>
                    </div>
                    {entry.notes && <p className="text-[10px] text-muted-foreground truncate italic mt-0.5">{entry.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <p className="font-bold text-emerald-600 shrink-0 text-sm">R$ {Number(entry.amount || 0).toFixed(2)}</p>
                    {isAdminCCM && (
                      <button
                        onClick={() => setDeletingEntry(entry)}
                        className="ml-2 p-1.5 rounded-lg text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Excluir contribuição"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── Relatórios de Culto Tab ───────────────────────────────────── */}
        <TabsContent value="relatorio" className="pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{cultoReports?.length || 0} relatórios · {totalPeople} pessoas no total</p>
            </div>
            <Button
              onClick={() => { resetReportForm(); setReportOpen(true); }}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" /> Novo Relatório
            </Button>
          </div>

          {/* Culto Reports Macro */}
          {(cultoReports?.length || 0) > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="border-0 bg-muted/30 rounded-2xl">
                <CardContent className="p-4 text-center">
                  <BarChart3 className="h-4 w-4 mx-auto text-primary mb-1" />
                  <p className="text-lg font-bold">{cultoReports?.length}</p>
                  <p className="text-[10px] text-muted-foreground">Cultos</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-muted/30 rounded-2xl">
                <CardContent className="p-4 text-center">
                  <Users className="h-4 w-4 mx-auto text-primary mb-1" />
                  <p className="text-lg font-bold">{totalPeople}</p>
                  <p className="text-[10px] text-muted-foreground">Total Presentes</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-muted/30 rounded-2xl">
                <CardContent className="p-4 text-center">
                  <Baby className="h-4 w-4 mx-auto text-primary mb-1" />
                  <p className="text-lg font-bold">
                    {cultoReports?.reduce((s, r) => s + (r.childrenCount || 0), 0) || 0}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Total checkin</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-muted/30 rounded-2xl">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-4 w-4 mx-auto text-primary mb-1" />
                  <p className="text-lg font-bold">
                    {cultoReports && cultoReports.length > 0
                      ? Math.round(totalPeople / cultoReports.length)
                      : 0}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Média/Culto</p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="space-y-3">
            {(cultoReports?.length || 0) === 0 && (
              <Card className="border-0 bg-muted/20 rounded-3xl">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  <p>Nenhum relatório de culto criado.</p>
                </CardContent>
              </Card>
            )}
            {cultoReports?.map(r => (
              <Card key={r.id} className="border-0 shadow-sm rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="capitalize text-xs">{r.reportType}</Badge>
                        <span className="text-sm font-semibold flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                          {safeFormat(r.reportDate + "T12:00:00", "dd/MM/yyyy")}
                        </span>
                      </div>
                      {r.eventTitle && (
                        <p className="text-xs font-bold text-primary flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" /> {r.eventTitle}
                        </p>
                      )}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="bg-muted/50 rounded-xl p-2 text-center">
                          <p className="font-bold text-base">{r.totalAttendees}</p>
                          <p className="text-muted-foreground">Frequência</p>
                        </div>
                        <div className="bg-muted/50 rounded-xl p-2 text-center">
                          <p className="font-bold text-base">{r.childrenCount || 0}</p>
                          <p className="text-muted-foreground">checkin</p>
                        </div>
                        <div className="bg-muted/50 rounded-xl p-2 text-center">
                          <p className="font-bold text-base">{r.youthCount || 0}</p>
                          <p className="text-muted-foreground">Jovens</p>
                        </div>
                        <div className="bg-muted/50 rounded-xl p-2 text-center">
                          <p className="font-bold text-base">{r.monitorsCount || 0}</p>
                          <p className="text-muted-foreground">Monitores</p>
                        </div>
                      </div>
                      {r.notes && <p className="text-xs text-muted-foreground italic">📝 {r.notes}</p>}
                    </div>
                    <div className="flex gap-1 ml-3">
                      <Button variant="ghost" size="icon" onClick={() => handleEditReport(r)}>
                        <Edit2 className="h-4 w-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeletingReport(r)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Culto Report Dialog */}
      <Dialog open={reportOpen} onOpenChange={v => { if (!v) { setReportOpen(false); resetReportForm(); } }}>
        <DialogContent className="sm:max-w-lg rounded-3xl border-0 shadow-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              {editingReport ? "Editar Relatório" : "Novo Relatório de Culto"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" max="9999-12-31" value={reportDate} onChange={e => setReportDate(e.target.value)} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="culto">Culto</SelectItem>
                    <SelectItem value="evento">Evento</SelectItem>
                    <SelectItem value="conferencia">Conferência</SelectItem>
                    <SelectItem value="celula">Célula</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b pb-1">
              Vínculo com Agenda
            </div>
            <div className="space-y-2">
              <Label>Vincular ao Evento</Label>
              <div className="flex gap-2">
                <Select value={selectedEventId || "none"} onValueChange={(v) => setSelectedEventId(v === "none" ? null : v)}>
                  <SelectTrigger className="h-11 rounded-xl flex-1">
                    <SelectValue placeholder="Selecione um evento (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum vínculo</SelectItem>
                    {events?.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.title} ({safeFormat(e.event_date, "dd/MM")})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedEventId && (
                  <Button type="button" variant="outline" size="icon" className="shrink-0 h-11 w-11 rounded-xl" onClick={suggestCounts}>
                    <QrCode className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {selectedEventId && <p className="text-[10px] text-muted-foreground">Clique no botão de QR ao lado para carregar presenças via check-in.</p>}
            </div>

            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b pb-1">
              Frequência
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Total de Presentes</Label>
                <Input type="number" min={0} value={totalAttendees} onChange={e => setTotalAttendees(Number(e.target.value))} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Crianças (checkin)</Label>
                <Input type="number" min={0} value={childrenCount} onChange={e => setChildrenCount(Number(e.target.value))} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Jovens</Label>
                <Input type="number" min={0} value={youthCount} onChange={e => setYouthCount(Number(e.target.value))} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Monitores / Tios</Label>
                <Input type="number" min={0} value={monitorsCount} onChange={e => setMonitorsCount(Number(e.target.value))} className="h-11 rounded-xl" />
              </div>
            </div>

            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b pb-1 flex items-center justify-between">
              Escala do Culto
              <Button type="button" variant="ghost" size="sm" className="h-6 gap-1 text-[10px]" onClick={addEscalaRow}>
                <Plus className="h-3 w-3" /> Adicionar Função
              </Button>
            </div>
            <div className="space-y-2">
              {escala.length === 0 && (
                <p className="text-[10px] text-muted-foreground italic text-center py-2">Nenhuma escala registrada para este relatório.</p>
              )}
              {escala.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-end group">
                  <div className="flex-1 space-y-1">
                    {idx === 0 && <Label className="text-[9px] uppercase opacity-60">Função</Label>}
                    <Input placeholder="Ex: Louvor" value={item.role} onChange={e => updateEscalaRow(idx, "role", e.target.value)} className="h-9 rounded-lg text-xs" />
                  </div>
                  <div className="flex-[2] space-y-1">
                    {idx === 0 && <Label className="text-[9px] uppercase opacity-60">Voluntário</Label>}
                    <Input placeholder="Nome do membro" value={item.name} onChange={e => updateEscalaRow(idx, "name", e.target.value)} className="h-9 rounded-lg text-xs" />
                  </div>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeEscalaRow(idx)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="bg-muted/30 rounded-xl p-3 text-xs text-muted-foreground">
              💡 Os números ajudam a ter um panorama da frequência e do engajamento dos membros.
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={reportNotes} onChange={e => setReportNotes(e.target.value)} rows={2} className="rounded-xl resize-none" placeholder="Notas do culto..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setReportOpen(false); resetReportForm(); }}>Cancelar</Button>
            <Button onClick={() => saveReportMutation.mutate()} disabled={saveReportMutation.isPending}>
              {saveReportMutation.isPending ? "Salvando..." : editingReport ? "Salvar" : "Criar Relatório"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deletingReport}
        title="Excluir Relatório"
        description="Deseja realmente excluir este relatório de culto?"
        confirmLabel="Excluir"
        variant="danger"
        onConfirm={() => deletingReport && deleteReportMutation.mutate(deletingReport.id)}
        onCancel={() => setDeletingReport(null)}
      />

      <ConfirmDialog
        open={!!deletingEntry}
        title="Excluir Contribuição"
        description={`Deseja realmente excluir o ${deletingEntry?.paymentType === "dizimo" ? "dízimo" : "oferta"} de R$ ${Number(deletingEntry?.amount || 0).toFixed(2)} de ${deletingEntry?.memberName}? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        variant="danger"
        onConfirm={() => deletingEntry && deleteEntryMutation.mutate(deletingEntry.id)}
        onCancel={() => setDeletingEntry(null)}
      />
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const Tesouraria = () => {
  const { user, isAdmin, isAdminCCM, routinePermissions } = useAuth();
  const { skin } = useTheme();

  const { data: siteSettings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data } = await api.get('/site-settings');
      const settings: Record<string, string> = {};
      (data || []).forEach((s: any) => { settings[s.id] = s.value; });
      return settings;
    },
  });

  const pixKey = siteSettings?.pix_key || "";
  const canManage = isAdmin || routinePermissions.tesouraria === true;

  if (!canManage) {
    return (
      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Wallet className="h-6 w-6 text-primary" /> Tesouraria
        </h1>
        <MemberTesouraria pixKey={pixKey} user={user} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Wallet className="h-6 w-6 text-primary" /> Tesouraria
      </h1>

      <Tabs defaultValue="admin">
        <TabsList className="w-full bg-muted/40 rounded-2xl p-1 h-auto gap-1 grid grid-cols-2">
          <TabsTrigger value="admin" className="rounded-xl py-2.5 gap-2">
            <BarChart3 className="h-4 w-4" /> Visão Administrativa
          </TabsTrigger>
          <TabsTrigger value="membro" className="rounded-xl py-2.5 gap-2">
            <Heart className="h-4 w-4" /> Minha Contribuição
          </TabsTrigger>
        </TabsList>

        <TabsContent value="admin" className="pt-4">
          <AdminTesouraria pixKey={pixKey} user={user} isAdminCCM={isAdminCCM} />
        </TabsContent>

        <TabsContent value="membro" className="pt-4">
          <MemberTesouraria pixKey={pixKey} user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Tesouraria;