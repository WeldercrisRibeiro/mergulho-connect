import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  BarChart3, Plus, Trash2, Users, Baby, Edit2,
  Smile, UserCheck, CalendarDays, BookOpen, Mic2,
  Music, HandHeart, Monitor, Filter, X, ChevronDown, ChevronUp
} from "lucide-react";
import { safeFormat } from "@/lib/dateUtils";
import { useToast } from "@/hooks/use-toast";

// ─── helpers ───────────────────────────────────────────────────────────────

const NumericInput = ({
  value,
  onChange,
  ...props
}: { value: number; onChange: (v: number) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) => (
  <Input
    type="number"
    min={0}
    value={value === 0 ? "" : value}
    onChange={e => {
      const raw = e.target.value;
      onChange(raw === "" ? 0 : Math.max(0, parseInt(raw, 10) || 0));
    }}
    placeholder="0"
    {...props}
  />
);

const TagInput = ({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) => {
  const [draft, setDraft] = useState("");
  const add = () => {
    const t = draft.trim();
    if (t && !values.includes(t)) onChange([...values, t]);
    setDraft("");
  };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder={placeholder}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
        />
        <Button type="button" variant="outline" size="sm" onClick={add} disabled={!draft.trim()}>
          + Add
        </Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map((v, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary rounded-full px-2.5 py-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
              onClick={() => onChange(values.filter((_, idx) => idx !== i))}
            >
              {v} <X className="h-3 w-3" />
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const REPORT_TYPES = [
  { value: "culto", label: "Culto" },
  { value: "evento", label: "Evento" },
  { value: "conferencia", label: "Conferência" },
  { value: "celula", label: "Célula" },
];

const StatBox = ({ label, value, accent }: { label: string; value: number | string; accent?: boolean }) => (
  <div className={`rounded-xl p-3 text-center ${accent ? "bg-primary/10" : "bg-muted/60"}`}>
    <p className={`text-2xl font-bold ${accent ? "text-primary" : ""}`}>{value}</p>
    <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{label}</p>
  </div>
);

const SectionTitle = ({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) => (
  <div className="flex items-center gap-1.5 border-b pb-2">
    {icon}
    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{children}</p>
  </div>
);

const RequiredMark = () => <span className="text-destructive ml-0.5">*</span>;
const Optional = () => <span className="text-[10px] text-muted-foreground font-normal ml-1">(opcional)</span>;

// ─── component ─────────────────────────────────────────────────────────────

const Reports = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // modal state
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleting, setDeleting] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // filter state
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [filterGroup, setFilterGroup] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // form state
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [reportType, setReportType] = useState("culto");
  const [totalAttendees, setTotalAttendees] = useState(0);
  const [childrenCount, setChildrenCount] = useState(0);
  const [monitorsCount, setMonitorsCount] = useState(0);
  const [youthCount, setYouthCount] = useState(0);
  const [visitorsCount, setVisitorsCount] = useState(0);
  const [notes, setNotes] = useState("");
  const [eventId, setEventId] = useState<string | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);

  // culto-specific
  const [preacher, setPreacher] = useState("");
  const [sermonRef, setSermonRef] = useState("");
  const [pastors, setPastors] = useState<string[]>([]);
  const [worshipTeam, setWorshipTeam] = useState<string[]>([]);
  const [welcomeTeam, setWelcomeTeam] = useState<string[]>([]);
  const [mediaTeam, setMediaTeam] = useState<string[]>([]);

  // queries
  const { data: reports } = useQuery({
    queryKey: ["event-reports"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("event_reports")
        .select("*")
        .order("report_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: groups } = useQuery({
    queryKey: ["groups-for-reports"],
    queryFn: async () => {
      const { data, error } = await supabase.from("groups").select("id, name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: events } = useQuery({
    queryKey: ["events-for-reports"],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("id, title, event_date")
        .order("event_date", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  const groupMap = Object.fromEntries((groups || []).map((g: any) => [g.id, g.name]));

  // filtered list + totals
  const filtered = useMemo(() => {
    return (reports || []).filter((r: any) => {
      if (filterFrom && r.report_date < filterFrom) return false;
      if (filterTo && r.report_date > filterTo) return false;
      if (filterGroup !== "all" && r.group_id !== filterGroup) return false;
      if (filterType !== "all" && r.report_type !== filterType) return false;
      return true;
    });
  }, [reports, filterFrom, filterTo, filterGroup, filterType]);

  const totals = useMemo(() => ({
    count: filtered.length,
    people: filtered.reduce((s: number, r: any) => s + (r.total_attendees || 0), 0),
    visitors: filtered.reduce((s: number, r: any) => s + (r.visitors_count || 0), 0),
    children: filtered.reduce((s: number, r: any) => s + (r.children_count || 0), 0),
    youth: filtered.reduce((s: number, r: any) => s + (r.youth_count || 0), 0),
    monitors: filtered.reduce((s: number, r: any) => s + (r.monitors_count || 0), 0),
  }), [filtered]);

  const hasFilters = filterFrom || filterTo || filterGroup !== "all" || filterType !== "all";

  const resetForm = () => {
    setReportDate(new Date().toISOString().slice(0, 10));
    setReportType("culto");
    setTotalAttendees(0);
    setChildrenCount(0);
    setMonitorsCount(0);
    setYouthCount(0);
    setVisitorsCount(0);
    setNotes("");
    setEventId(null);
    setGroupId(null);
    setPreacher("");
    setSermonRef("");
    setPastors([]);
    setWorshipTeam([]);
    setWelcomeTeam([]);
    setMediaTeam([]);
  };

  const handleEdit = (r: any) => {
    setEditing(r);
    setReportDate(r.report_date);
    setReportType(r.report_type || "culto");
    setTotalAttendees(r.total_attendees || 0);
    setChildrenCount(r.children_count || 0);
    setMonitorsCount(r.monitors_count || 0);
    setYouthCount(r.youth_count || 0);
    setVisitorsCount(r.visitors_count || 0);
    setNotes(r.notes || "");
    setEventId(r.event_id || null);
    setGroupId(r.group_id || null);
    setPreacher(r.preacher || "");
    setSermonRef(r.sermon_ref || "");
    setPastors(r.pastors || []);
    setWorshipTeam(r.worship_team || []);
    setWelcomeTeam(r.welcome_team || []);
    setMediaTeam(r.media_team || []);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        report_date: reportDate,
        report_type: reportType,
        total_attendees: totalAttendees,
        children_count: childrenCount,
        monitors_count: monitorsCount,
        youth_count: youthCount,
        visitors_count: visitorsCount,
        notes: notes.trim() || null,
        event_id: eventId || null,
        group_id: groupId || null,
        created_by: user?.id,
        preacher: preacher.trim() || null,
        sermon_ref: sermonRef.trim() || null,
        pastors: pastors.length ? pastors : null,
        worship_team: worshipTeam.length ? worshipTeam : null,
        welcome_team: welcomeTeam.length ? welcomeTeam : null,
        media_team: mediaTeam.length ? mediaTeam : null,
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
      setDeleting(null);
      toast({ title: "Relatório removido." });
    },
  });

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Acesso restrito a administradores.
      </div>
    );
  }

  const formOpen = creating || !!editing;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          Relatórios
        </h1>
        <div className="flex gap-2">
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(v => !v)}
          >
            <Filter className="h-4 w-4 mr-1" />
            Filtros
            {hasFilters && (
              <span className="ml-1.5 bg-white text-primary text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">!</span>
            )}
          </Button>
          <Button onClick={() => { resetForm(); setCreating(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Novo Relatório
          </Button>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <Card className="border border-primary/20 shadow-none">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">De</Label>
                <Input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Até</Label>
                <Input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Grupo</Label>
                <Select value={filterGroup} onValueChange={setFilterGroup}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {groups?.map((g: any) => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tipo</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {REPORT_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground h-7"
                onClick={() => { setFilterFrom(""); setFilterTo(""); setFilterGroup("all"); setFilterType("all"); }}
              >
                <X className="h-3 w-3 mr-1" /> Limpar filtros
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Totalizador */}
      <div className="bg-primary/5 border border-primary/15 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-primary uppercase tracking-widest">
            Totalizador {hasFilters ? "— período filtrado" : "— todos os registros"}
          </h2>
          <span className="text-xs text-muted-foreground bg-primary/10 text-primary rounded-full px-2.5 py-0.5 font-medium">
            {totals.count} relatório{totals.count !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          <StatBox label="Presentes" value={totals.people} accent />
          <StatBox label="Visitantes" value={totals.visitors} />
          <StatBox label="Crianças" value={totals.children} />
          <StatBox label="Jovens" value={totals.youth} />
          <StatBox label="Monitores" value={totals.monitors} />
          <StatBox label="Kids + Jovens" value={totals.children + totals.youth} />
        </div>
      </div>

      {/* Lista de relatórios */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <Card className="border-0 bg-muted/30">
            <CardContent className="p-8 text-center text-muted-foreground">
              {hasFilters ? "Nenhum relatório para os filtros selecionados." : "Nenhum relatório ainda."}
            </CardContent>
          </Card>
        )}

        {filtered.map((r: any) => {
          const groupName = groupMap[r.group_id] || null;
          const typeLabel = REPORT_TYPES.find(t => t.value === r.report_type)?.label || r.report_type;
          const isExpanded = expandedId === r.id;
          const hasDetail = r.preacher || r.sermon_ref || r.pastors?.length || r.worship_team?.length || r.welcome_team?.length || r.media_team?.length;

          return (
            <Card key={r.id} className="border-0 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <CardContent className="p-0">

                {/* Cabeçalho do card */}
                <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-semibold text-sm">
                      {safeFormat(r.report_date + "T12:00:00", "dd/MM/yyyy")}
                    </span>
                    <Badge variant="secondary" className="capitalize text-xs">{typeLabel}</Badge>
                    {groupName && <Badge variant="outline" className="text-[11px]">{groupName}</Badge>}
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(r)}>
                      <Edit2 className="h-3.5 w-3.5 text-primary" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleting(r)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>

                {/* Corpo do card */}
                <div className="px-4 py-4 space-y-4">

                  {/* Grid de métricas */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                      Frequência
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      <StatBox label="Presentes" value={r.total_attendees || 0} accent />
                      <StatBox label="Visitantes" value={r.visitors_count || 0} />
                      <StatBox label="Kids" value={r.children_count || 0} />
                      <StatBox label="Jovens" value={r.youth_count || 0} />
                      <StatBox label="Monitores" value={r.monitors_count || 0} />
                      <StatBox label="Kids+Jovens" value={(r.children_count || 0) + (r.youth_count || 0)} />
                    </div>
                  </div>

                  {/* Observações */}
                  {r.notes && (
                    <p className="text-xs text-muted-foreground italic border-t pt-3">
                      📝 {r.notes}
                    </p>
                  )}

                  {/* Accordion de detalhes */}
                  {hasDetail && (
                    <>
                      <button
                        className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                        onClick={() => setExpandedId(isExpanded ? null : r.id)}
                      >
                        {isExpanded
                          ? <><ChevronUp className="h-3.5 w-3.5" /> Ocultar detalhes do culto</>
                          : <><ChevronDown className="h-3.5 w-3.5" /> Ver detalhes do culto</>
                        }
                      </button>

                      {isExpanded && (
                        <div className="border-t pt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                          {r.preacher && (
                            <DetailBlock icon={<Mic2 className="h-3 w-3" />} label="Pregador">
                              <p className="text-sm font-medium">{r.preacher}</p>
                            </DetailBlock>
                          )}
                          {r.sermon_ref && (
                            <DetailBlock icon={<BookOpen className="h-3 w-3" />} label="Palavra / Referência">
                              <p className="text-sm font-medium">{r.sermon_ref}</p>
                            </DetailBlock>
                          )}
                          {r.pastors?.length > 0 && (
                            <DetailBlock icon={<UserCheck className="h-3 w-3" />} label="Pastores Presentes">
                              <TagList items={r.pastors} />
                            </DetailBlock>
                          )}
                          {r.worship_team?.length > 0 && (
                            <DetailBlock icon={<Music className="h-3 w-3" />} label="Escala do Louvor">
                              <TagList items={r.worship_team} />
                            </DetailBlock>
                          )}
                          {r.welcome_team?.length > 0 && (
                            <DetailBlock icon={<HandHeart className="h-3 w-3" />} label="Acolhimento">
                              <TagList items={r.welcome_team} />
                            </DetailBlock>
                          )}
                          {r.media_team?.length > 0 && (
                            <DetailBlock icon={<Monitor className="h-3 w-3" />} label="Escala da Mídia">
                              <TagList items={r.media_team} />
                            </DetailBlock>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialog Formulário */}
      <Dialog open={formOpen} onOpenChange={v => { if (!v) { setCreating(false); setEditing(null); } }}>
        <DialogContent className="sm:max-w-[680px] max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Relatório" : "Novo Relatório"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-2">

            {/* Identificação */}
            <section className="space-y-3">
              <SectionTitle>Identificação</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {REPORT_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Departamento / Grupo <RequiredMark /></Label>
                  <Select value={groupId || ""} onValueChange={v => setGroupId(v || null)}>
                    <SelectTrigger><SelectValue placeholder="Selecione o depto" /></SelectTrigger>
                    <SelectContent>
                      {groups?.map((g: any) => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Evento Vinculado <Optional /></Label>
                  <Select value={eventId || "none"} onValueChange={v => setEventId(v === "none" ? null : v)}>
                    <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {events?.map((ev: any) => (
                        <SelectItem key={ev.id} value={ev.id}>{ev.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {/* Público */}
            <section className="space-y-3">
              <SectionTitle icon={<Users className="h-3.5 w-3.5" />}>Público</SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Total Presentes</Label>
                  <NumericInput value={totalAttendees} onChange={setTotalAttendees} />
                </div>
                <div className="space-y-2">
                  <Label>Visitantes</Label>
                  <NumericInput value={visitorsCount} onChange={setVisitorsCount} />
                </div>
                <div className="space-y-2">
                  <Label>Crianças</Label>
                  <NumericInput value={childrenCount} onChange={setChildrenCount} />
                </div>
                <div className="space-y-2">
                  <Label>Jovens</Label>
                  <NumericInput value={youthCount} onChange={setYouthCount} />
                </div>
                <div className="space-y-2">
                  <Label>Monitores / Tios</Label>
                  <NumericInput value={monitorsCount} onChange={setMonitorsCount} />
                </div>
              </div>
            </section>

            {/* Culto */}
            <section className="space-y-3">
              <SectionTitle icon={<Mic2 className="h-3.5 w-3.5" />}>
                Culto <Optional />
              </SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Mic2 className="h-3.5 w-3.5 text-muted-foreground" /> Pregador
                  </Label>
                  <Input value={preacher} onChange={e => setPreacher(e.target.value)} placeholder="Nome do pregador" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-muted-foreground" /> Palavra / Referência Bíblica
                  </Label>
                  <Input value={sermonRef} onChange={e => setSermonRef(e.target.value)} placeholder="Ex: João 3:16 — O Amor de Deus" />
                </div>
              </div>
            </section>

            {/* Voluntários */}
            <section className="space-y-4">
              <SectionTitle icon={<UserCheck className="h-3.5 w-3.5" />}>
                Voluntários <Optional />
              </SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5 text-muted-foreground" /> Pastores Presentes
                  </Label>
                  <TagInput values={pastors} onChange={setPastors} placeholder="Nome do pastor" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Music className="h-3.5 w-3.5 text-muted-foreground" /> Escala do Louvor
                  </Label>
                  <TagInput values={worshipTeam} onChange={setWorshipTeam} placeholder="Nome do músico/vocal" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <HandHeart className="h-3.5 w-3.5 text-muted-foreground" /> Escala do Acolhimento
                  </Label>
                  <TagInput values={welcomeTeam} onChange={setWelcomeTeam} placeholder="Nome do recepcionista" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Monitor className="h-3.5 w-3.5 text-muted-foreground" /> Escala da Mídia
                  </Label>
                  <TagInput values={mediaTeam} onChange={setMediaTeam} placeholder="Nome da pessoa de mídia" />
                </div>
              </div>
            </section>

            {/* Observações */}
            <section className="space-y-2">
              <SectionTitle>Observações <Optional /></SectionTitle>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Notas adicionais sobre o culto ou evento..."
                rows={2}
              />
            </section>

          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreating(false); setEditing(null); }}>
              Cancelar
            </Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !groupId}>
              {saveMutation.isPending ? "Salvando..." : editing ? "Salvar Alterações" : "Criar Relatório"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        title="Excluir Relatório"
        description="Deseja realmente excluir este relatório? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        variant="danger"
        onConfirm={() => deleteMutation.mutate(deleting?.id)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
};

// sub-components
const DetailBlock = ({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
      {icon} {label}
    </p>
    {children}
  </div>
);

const TagList = ({ items }: { items: string[] }) => (
  <div className="flex flex-wrap gap-1">
    {items.map((item: string, i: number) => (
      <Badge key={i} variant="outline" className="text-[11px]">{item}</Badge>
    ))}
  </div>
);

export default Reports;