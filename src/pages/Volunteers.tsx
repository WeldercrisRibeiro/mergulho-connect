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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import ConfirmDialog from "@/components/ConfirmDialog";
import { HandHeart, Plus, Trash2, User, CalendarDays, Megaphone, ClipboardList, Clock, CheckCircle2, Loader2, Edit2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

const INTEREST_AREAS = [
  "Louvor / Música", "Infantil", "Recepção", "Multimídia / Som",
  "Limpeza", "Cozinha / Café", "Intercessão", "Diaconia", "Outro",
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Solicitação Enviada", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock },
  in_progress: { label: "Em Andamento", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: Loader2 },
  completed: { label: "Concluído", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle2 },
};

const Volunteers = () => {
  const { user, isAdmin, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<any>(null);
  const [editingStatus, setEditingStatus] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [availability, setAvailability] = useState("");
  const [interestAreas, setInterestAreas] = useState<string[]>([]);

  // Schedule form
  const [creatingSchedule, setCreatingSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleRole, setScheduleRole] = useState("");
  const [scheduleVolunteerId, setScheduleVolunteerId] = useState("");
  const [scheduleGroupId, setScheduleGroupId] = useState("");

  const { data: volunteers } = useQuery({
    queryKey: ["volunteers"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("volunteers").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: schedules } = useQuery({
    queryKey: ["volunteer-schedules"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("volunteer_schedules")
        .select("*, volunteers(full_name), groups(name)")
        .order("schedule_date", { ascending: true });
      return data || [];
    },
  });

  const { data: announcements } = useQuery({
    queryKey: ["volunteer-announcements"],
    queryFn: async () => {
      // Get announcements targeted to volunteer-related groups or general
      const { data } = await (supabase as any)
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: groups } = useQuery({
    queryKey: ["volunteer-groups"],
    queryFn: async () => {
      const { data } = await supabase.from("groups").select("id, name");
      return data || [];
    },
  });

  const myVolunteer = volunteers?.find((v: any) => v.user_id === user?.id);
  const isVolunteer = !!myVolunteer;
  const volunteerStatus = myVolunteer?.status || "pending";
  const isActive = volunteerStatus === "completed" || volunteerStatus === "in_progress";

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("volunteers").insert({
        user_id: user!.id,
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        availability: availability.trim() || null,
        interest_areas: interestAreas,
        interest_area: interestAreas[0] || null,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteers"] });
      setCreating(false);
      setFullName(""); setPhone(""); setAvailability(""); setInterestAreas([]);
      toast({ title: "Inscrição realizada! 🙌", description: "Sua solicitação foi enviada ao pastor." });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("volunteers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteers"] });
      toast({ title: "Voluntário removido." });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase as any).from("volunteers").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteers"] });
      setEditingStatus(null);
      toast({ title: "Status atualizado!" });
    },
  });

  const saveScheduleMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("volunteer_schedules").insert({
        volunteer_id: scheduleVolunteerId,
        group_id: scheduleGroupId || null,
        schedule_date: scheduleDate,
        role_function: scheduleRole,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteer-schedules"] });
      setCreatingSchedule(false);
      setScheduleDate(""); setScheduleRole(""); setScheduleVolunteerId(""); setScheduleGroupId("");
      toast({ title: "Escala criada!" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("volunteer_schedules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteer-schedules"] });
      toast({ title: "Escala removida." });
    },
  });

  const handleOpen = () => {
    setFullName(profile?.full_name || "");
    setPhone(profile?.whatsapp_phone || "");
    setAvailability("");
    setInterestAreas([]);
    setCreating(true);
  };

  const activeVolunteers = volunteers?.filter((v: any) => v.status === "completed") || [];

  // Non-volunteer view: show signup form
  if (!isVolunteer && !isAdmin) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HandHeart className="h-6 w-6 text-primary" /> Voluntários
          </h1>
        </div>
        <Card className="border-0 neo-shadow-sm">
          <CardContent className="p-8 text-center space-y-4">
            <HandHeart className="h-16 w-16 mx-auto text-primary/30" />
            <h2 className="text-xl font-bold">Quer ser voluntário?</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Preencha o formulário abaixo para se inscrever como voluntário. Sua solicitação será enviada ao pastor para aprovação.
            </p>
            <Button onClick={handleOpen} size="lg">
              <Plus className="h-4 w-4 mr-2" /> Quero ser voluntário
            </Button>
          </CardContent>
        </Card>

        <SignupDialog
          open={creating}
          onClose={() => setCreating(false)}
          fullName={fullName} setFullName={setFullName}
          phone={phone} setPhone={setPhone}
          availability={availability} setAvailability={setAvailability}
          interestAreas={interestAreas} setInterestAreas={setInterestAreas}
          onSave={() => saveMutation.mutate()}
          isPending={saveMutation.isPending}
        />
      </div>
    );
  }

  // Volunteer with pending status
  if (isVolunteer && volunteerStatus === "pending" && !isAdmin) {
    const StatusIcon = STATUS_CONFIG.pending.icon;
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HandHeart className="h-6 w-6 text-primary" /> Voluntários
          </h1>
        </div>
        <Card className="border-0 neo-shadow-sm">
          <CardContent className="p-8 text-center space-y-4">
            <StatusIcon className="h-16 w-16 mx-auto text-amber-500" />
            <h2 className="text-xl font-bold">Solicitação Enviada</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Sua inscrição como voluntário foi enviada ao pastor. Aguarde a aprovação para ter acesso completo.
            </p>
            <Badge className={STATUS_CONFIG.pending.color}>
              {STATUS_CONFIG.pending.label}
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Active volunteer or admin: show full tabs
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <HandHeart className="h-6 w-6 text-primary" /> Voluntários
        </h1>
      </div>

      {/* Status badge for volunteer */}
      {isVolunteer && !isAdmin && (
        <Card className="neo-shadow-sm border-0">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-sm font-medium">Você é voluntário</p>
              <Badge className={STATUS_CONFIG[volunteerStatus]?.color || ""}>
                {STATUS_CONFIG[volunteerStatus]?.label || volunteerStatus}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue={isAdmin ? "gerenciar" : "escala"}>
        <TabsList className={`grid w-full max-w-2xl bg-muted/50 p-1 rounded-2xl ${isAdmin ? "grid-cols-4" : "grid-cols-3"}`}>
          {(isActive || isAdmin) && (
            <TabsTrigger value="escala" className="rounded-xl flex items-center gap-1 text-xs">
              <CalendarDays className="h-3.5 w-3.5" /> Escala
            </TabsTrigger>
          )}
          {(isActive || isAdmin) && (
            <TabsTrigger value="comunicados" className="rounded-xl flex items-center gap-1 text-xs">
              <Megaphone className="h-3.5 w-3.5" /> Comunicados
            </TabsTrigger>
          )}
          {volunteerStatus === "in_progress" && !isAdmin && (
            <TabsTrigger value="treinamento" className="rounded-xl flex items-center gap-1 text-xs">
              <ClipboardList className="h-3.5 w-3.5" /> Treinamento
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="gerenciar" className="rounded-xl flex items-center gap-1 text-xs">
              <User className="h-3.5 w-3.5" /> Gerenciar
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="escalas-adm" className="rounded-xl flex items-center gap-1 text-xs">
              <CalendarDays className="h-3.5 w-3.5" /> Escalas
            </TabsTrigger>
          )}
        </TabsList>

        {/* Escala Tab */}
        <TabsContent value="escala" className="space-y-4 pt-4">
          <h2 className="text-lg font-bold">Escala de Voluntários</h2>
          {schedules?.length === 0 ? (
            <Card className="border-0 bg-muted/30">
              <CardContent className="p-6 text-center text-muted-foreground">
                Nenhuma escala publicada ainda.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {schedules?.map((s: any) => (
                <Card key={s.id} className="neo-shadow-sm border-0">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-sm">
                          {format(new Date(s.schedule_date + "T12:00:00"), "dd/MM/yyyy (EEEE)", { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-sm"><span className="text-muted-foreground">Função:</span> {s.role_function}</p>
                      <p className="text-sm"><span className="text-muted-foreground">Voluntário:</span> {s.volunteers?.full_name || "—"}</p>
                      {s.groups?.name && <Badge variant="outline" className="text-[10px]">{s.groups.name}</Badge>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Comunicados Tab */}
        <TabsContent value="comunicados" className="space-y-4 pt-4">
          <h2 className="text-lg font-bold">Comunicados</h2>
          {announcements?.length === 0 ? (
            <Card className="border-0 bg-muted/30">
              <CardContent className="p-6 text-center text-muted-foreground">
                Nenhum comunicado disponível.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {announcements?.map((a: any) => (
                <Card key={a.id} className="neo-shadow-sm border-0">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">{a.title}</h3>
                      {a.priority === "urgent" && <Badge variant="destructive" className="text-[10px]">Urgente</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{a.content}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {a.created_at && format(new Date(a.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Treinamento Tab (in_progress only) */}
        <TabsContent value="treinamento" className="space-y-4 pt-4">
          <h2 className="text-lg font-bold">Treinamento</h2>
          <Card className="border-0 neo-shadow-sm">
            <CardContent className="p-6 text-center space-y-3">
              <Loader2 className="h-12 w-12 mx-auto text-blue-500 animate-spin" />
              <h3 className="font-bold">Treinamento em Andamento</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Fique atento aos comunicados e instruções do pastor. Quando o treinamento for concluído, você terá acesso completo à escala e comunicados.
              </p>
            </CardContent>
          </Card>
          {/* Show announcements here too for in_progress */}
          {announcements?.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-muted-foreground uppercase">Avisos do Treinamento</h3>
              {announcements?.map((a: any) => (
                <Card key={a.id} className="neo-shadow-sm border-0">
                  <CardContent className="p-4 space-y-2">
                    <h3 className="font-semibold text-sm">{a.title}</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{a.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Admin: Gerenciar */}
        <TabsContent value="gerenciar" className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Gerenciar Voluntários</h2>
            <p className="text-sm text-muted-foreground">{volunteers?.length || 0} inscrito(s)</p>
          </div>
          <div className="space-y-3">
            {volunteers?.map((v: any) => {
              const sc = STATUS_CONFIG[v.status] || STATUS_CONFIG.pending;
              const StatusIcon = sc.icon;
              return (
                <Card key={v.id} className="neo-shadow-sm border-0">
                  <CardContent className="p-4 flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <p className="font-semibold flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" /> {v.full_name}
                      </p>
                      {v.phone && <p className="text-xs text-muted-foreground">📱 {v.phone}</p>}
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge className={`text-[10px] ${sc.color}`}>
                          <StatusIcon className="h-3 w-3 mr-1" /> {sc.label}
                        </Badge>
                        {v.interest_areas?.map((area: string) => (
                          <Badge key={area} variant="secondary" className="text-[10px] uppercase font-bold">{area}</Badge>
                        ))}
                      </div>
                      {v.availability && <p className="text-xs text-muted-foreground mt-1">Disponibilidade: {v.availability}</p>}
                      <p className="text-[10px] text-muted-foreground">
                        Inscrito em {format(new Date(v.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditingStatus(v)}>
                        <Edit2 className="h-4 w-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleting(v)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Admin: Escalas */}
        <TabsContent value="escalas-adm" className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Gerenciar Escalas</h2>
            <Button size="sm" onClick={() => setCreatingSchedule(true)}>
              <Plus className="h-4 w-4 mr-1" /> Nova Escala
            </Button>
          </div>
          <div className="space-y-3">
            {schedules?.length === 0 && (
              <Card className="border-0 bg-muted/30">
                <CardContent className="p-6 text-center text-muted-foreground">Nenhuma escala criada.</CardContent>
              </Card>
            )}
            {schedules?.map((s: any) => (
              <Card key={s.id} className="neo-shadow-sm border-0">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm">
                        {format(new Date(s.schedule_date + "T12:00:00"), "dd/MM/yyyy (EEEE)", { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-sm"><span className="text-muted-foreground">Função:</span> {s.role_function}</p>
                    <p className="text-sm"><span className="text-muted-foreground">Voluntário:</span> {s.volunteers?.full_name || "—"}</p>
                    {s.groups?.name && <Badge variant="outline" className="text-[10px]">{s.groups.name}</Badge>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteScheduleMutation.mutate(s.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Signup Dialog */}
      <SignupDialog
        open={creating}
        onClose={() => setCreating(false)}
        fullName={fullName} setFullName={setFullName}
        phone={phone} setPhone={setPhone}
        availability={availability} setAvailability={setAvailability}
        interestAreas={interestAreas} setInterestAreas={setInterestAreas}
        onSave={() => saveMutation.mutate()}
        isPending={saveMutation.isPending}
      />

      {/* Edit Status Dialog */}
      <Dialog open={!!editingStatus} onOpenChange={v => !v && setEditingStatus(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Alterar Status</DialogTitle></DialogHeader>
          <div className="py-4 space-y-3">
            <p className="text-sm font-medium">{editingStatus?.full_name}</p>
            <Select value={editingStatus?.status || "pending"} onValueChange={(val) => setEditingStatus({ ...editingStatus, status: val })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Solicitação Enviada</SelectItem>
                <SelectItem value="in_progress">Em Andamento (Treinamento)</SelectItem>
                <SelectItem value="completed">Concluído (Ativo)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingStatus(null)}>Cancelar</Button>
            <Button onClick={() => updateStatusMutation.mutate({ id: editingStatus.id, status: editingStatus.status })}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Schedule Dialog */}
      <Dialog open={creatingSchedule} onOpenChange={v => !v && setCreatingSchedule(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nova Escala</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Voluntário</Label>
              <Select value={scheduleVolunteerId} onValueChange={setScheduleVolunteerId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {activeVolunteers.map((v: any) => (
                    <SelectItem key={v.id} value={v.id}>{v.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Departamento (opcional)</Label>
              <Select value={scheduleGroupId} onValueChange={setScheduleGroupId}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  {groups?.map(g => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Função</Label>
              <Input value={scheduleRole} onChange={e => setScheduleRole(e.target.value)} placeholder="Ex: Recepção, Louvor, Som..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreatingSchedule(false)}>Cancelar</Button>
            <Button onClick={() => saveScheduleMutation.mutate()} disabled={!scheduleVolunteerId || !scheduleDate || !scheduleRole || saveScheduleMutation.isPending}>
              {saveScheduleMutation.isPending ? "Salvando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        title="Remover Voluntário"
        description={`Remover "${deleting?.full_name}" da lista?`}
        confirmLabel="Remover"
        variant="danger"
        onConfirm={() => deleteMutation.mutate(deleting?.id)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
};

// Signup dialog component
const SignupDialog = ({ open, onClose, fullName, setFullName, phone, setPhone, availability, setAvailability, interestAreas, setInterestAreas, onSave, isPending }: any) => (
  <Dialog open={open} onOpenChange={v => !v && onClose()}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader><DialogTitle>Inscrição de Voluntário</DialogTitle></DialogHeader>
      <div className="space-y-4 py-2">
        <div className="space-y-2">
          <Label>Nome Completo</Label>
          <Input value={fullName} onChange={(e: any) => setFullName(e.target.value)} placeholder="Seu nome" />
        </div>
        <div className="space-y-2">
          <Label>Telefone / WhatsApp</Label>
          <Input value={phone} onChange={(e: any) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
        </div>
        <div className="space-y-3">
          <Label className="text-sm font-bold">Áreas de Interesse</Label>
          <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-xl border">
            {INTEREST_AREAS.map(area => (
              <div key={area} className="flex items-center space-x-2">
                <Checkbox
                  id={`area-${area}`}
                  checked={interestAreas.includes(area)}
                  onCheckedChange={(checked: boolean) => {
                    if (checked) setInterestAreas([...interestAreas, area]);
                    else setInterestAreas(interestAreas.filter((a: string) => a !== area));
                  }}
                />
                <label htmlFor={`area-${area}`} className="text-xs font-medium cursor-pointer">{area}</label>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Disponibilidade</Label>
          <Textarea value={availability} onChange={(e: any) => setAvailability(e.target.value)} placeholder="Ex: Sábados à tarde, domingos de manhã..." rows={2} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={onSave} disabled={!fullName?.trim() || isPending}>
          {isPending ? "Salvando..." : "Inscrever-se"}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default Volunteers;
