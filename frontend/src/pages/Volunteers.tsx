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
import { HandHeart, Plus, Trash2, User, CalendarDays, Megaphone, ClipboardList, Clock, CheckCircle2, Loader2, Edit2, ShieldCheck, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";


const FALLBACK_INTEREST_AREAS = [
  "Louvor", "Infantil", "Recepção", "Mídia",
  "Limpeza", "Cozinha", "Intercessão", "Diaconia", "Jovens"
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Solicitação Enviada", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock },
  in_progress: { label: "Em Andamento", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: Loader2 },
  completed: { label: "Concluído", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle2 },
};

const Volunteers = () => {
  const { user, isAdmin, isGerente, managedGroupIds, userGroupIds, profile, unreadAnnouncements } = useAuth();
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
  const [editingSchedule, setEditingSchedule] = useState<any>(null);

  const { data: volunteers } = useQuery({
    queryKey: ["volunteers"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("volunteers").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: schedules } = useQuery({
    queryKey: ["volunteer-schedules", userGroupIds, isAdmin],
    queryFn: async () => {
      let query = (supabase as any)
        .from("volunteer_schedules")
        .select("*, volunteers!volunteer_schedules_volunteer_id_fkey(full_name), profiles!volunteer_schedules_item_user_id_fkey(full_name), groups(name)")
        .order("schedule_date", { ascending: true });

      if (!isAdmin) {
        query = query.in("group_id", userGroupIds);
      }

      const { data, error } = await query;
      console.log("RAW SCHEDULES RESPONSE:", data, "ERROR:", error, "isAdmin:", isAdmin, "userGroupIds:", userGroupIds);
      if (error) {
         console.error("Volunteer Schedules Query Error:", error);
         throw error;
      }
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
      let query = supabase.from("groups").select("id, name");
      if (!isAdmin && userGroupIds.length > 0) {
        query = query.in("id", userGroupIds);
      } else if (!isAdmin) {
        // Se não for admin e não tiver grupos, retorna vazio para segurança
        return [];
      }
      const { data } = await query;
      return data || [];
    },
  });

  const { data: departmentMembers } = useQuery({
    queryKey: ["department-members", scheduleGroupId],
    queryFn: async () => {
      if (!scheduleGroupId) return [];

      if (scheduleGroupId === "general") {
         const { data: allProfiles } = await supabase.from("profiles").select("user_id, full_name").order("full_name");
         return allProfiles?.map(p => ({
           user_id: p.user_id,
           profiles: { full_name: p.full_name }
         })) || [];
      }

      // Passo 1: Busca apenas os IDs dos usuários no grupo
      const { data: groupLinks, error: linkErr } = await supabase
        .from("member_groups")
        .select("user_id")
        .eq("group_id", scheduleGroupId);

      if (linkErr || !groupLinks || groupLinks.length === 0) return [];

      const userIds = groupLinks.map(l => l.user_id);

      // Passo 2: Busca os perfis desses usuários
      const { data: profiles, error: profErr } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds)
        .order("full_name");

      if (profErr) return [];

      // Retorna no formato esperado pelo Select m.profiles.full_name
      return profiles.map(p => ({
        user_id: p.user_id,
        profiles: { full_name: p.full_name }
      }));
    },
    enabled: !!scheduleGroupId
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
      const volunteerToDelete = volunteers?.find((v: any) => v.id === id);
      if (volunteerToDelete) {
        // Automatically remove from all departments as requested
        await supabase.from("member_groups").delete().eq("user_id", volunteerToDelete.user_id);
      }

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
      // 1. Update status
      const { error: statusErr } = await (supabase as any).from("volunteers").update({ status }).eq("id", id);
      if (statusErr) throw statusErr;

      // 2. If completed, auto-link to departments based on interest_areas
      if (status === "completed") {
        const volunteer = volunteers?.find((v: any) => v.id === id);
        if (volunteer && volunteer.interest_areas?.length > 0) {
          // Get group IDs for the interest areas
          const { data: matchedGroups } = await supabase
            .from("groups")
            .select("id, name")
            .in("name", volunteer.interest_areas);

          if (matchedGroups && matchedGroups.length > 0) {
            const inserts = matchedGroups.map(g => ({
              user_id: volunteer.user_id,
              group_id: g.id,
              role: "member"
            }));
            // Upsert or insert (ignoring duplicates)
            await (supabase as any).from("member_groups").upsert(inserts, { onConflict: "user_id,group_id" });
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteers"] });
      queryClient.invalidateQueries({ queryKey: ["member-groups"] });
      setEditingStatus(null);
      toast({ title: "Status atualizado!", description: "Voluntário sincronizado com departamentos." });
    },
  });

  const saveScheduleMutation = useMutation({
    mutationFn: async () => {
      const finalGroupId = scheduleGroupId === "general" || !scheduleGroupId ? null : scheduleGroupId;
      const volRecord = volunteers?.find((v: any) => v.user_id === scheduleVolunteerId);

      const payload = {
        item_user_id: scheduleVolunteerId,
        volunteer_id: volRecord?.id || null,
        group_id: finalGroupId,
        schedule_date: scheduleDate,
        role_function: scheduleRole,
        created_by: user!.id,
      };

      if (editingSchedule) {
        const { error } = await (supabase as any)
          .from("volunteer_schedules")
          .update(payload)
          .eq("id", editingSchedule.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("volunteer_schedules").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteer-schedules"] });
      setCreatingSchedule(false);
      setEditingSchedule(null);
      setScheduleDate(""); setScheduleRole(""); setScheduleVolunteerId(""); setScheduleGroupId("");
      toast({ title: editingSchedule ? "Escala atualizada!" : "Escala criada!" });
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

  const handleOpenSchedule = (s: any = null) => {
    if (s) {
      setEditingSchedule(s);
      setScheduleDate(s.schedule_date);
      setScheduleRole(s.role_function);
      setScheduleVolunteerId(s.volunteer_id);
      setScheduleGroupId(s.group_id || "");
      setCreatingSchedule(true);
    } else {
      setEditingSchedule(null);
      setScheduleDate("");
      setScheduleRole("");
      setScheduleVolunteerId("");
      setScheduleGroupId("");
      setCreatingSchedule(true);
    }
  };

  const handleOpen = () => {
    setFullName(profile?.full_name || "");
    setPhone(profile?.whatsapp_phone || "");
    setAvailability("");
    setInterestAreas([]);
    setCreating(true);
  };

  // Matrix Grouping Function
  const groupedSchedules = schedules?.reduce((acc: any, s: any) => {
    const key = `${s.schedule_date}_${s.group_id}`;
    if (!acc[key]) {
      acc[key] = {
        id: key,
        date: s.schedule_date,
        group_id: s.group_id,
        group_name: s.groups?.name || "Geral",
        assignments: []
      };
    }
    acc[key].assignments.push(s);
    return acc;
  }, {});

  const matrixSchedules = Object.values(groupedSchedules || {}).sort((a: any, b: any) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const activeVolunteers = volunteers?.filter((v: any) => v.status === "completed") || [];

  // Non-volunteer view: show signup form (unless Admin or Gerente)
  if (!isVolunteer && !isAdmin && !isGerente) {
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
          groups={groups}
        />
      </div>
    );
  }

  // Volunteer with pending status (unless Admin or Gerente)
  if (isVolunteer && volunteerStatus === "pending" && !isAdmin && !isGerente) {
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

        <SignupDialog
          open={creating}
          onClose={() => setCreating(false)}
          fullName={fullName} setFullName={setFullName}
          phone={phone} setPhone={setPhone}
          availability={availability} setAvailability={setAvailability}
          interestAreas={interestAreas} setInterestAreas={setInterestAreas}
          onSave={() => saveMutation.mutate()}
          isPending={saveMutation.isPending}
          groups={groups}
        />
      </div>
    );
  }

  const showAdmin = isAdmin || isGerente;
  const showUser = isActive || isAdmin || isGerente;
  const showTrain = volunteerStatus === "in_progress" && !isAdmin;

  const activeTabsCount = [
    showUser, // Escala
    showTrain, // Treinamento
    showAdmin, // Gerenciar
    showAdmin  // Escalas-adm
  ].filter(Boolean).length;

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
              <p className="text-sm font-medium">
                {volunteerStatus === "completed" ? "Você é voluntário" : "Você é quase um voluntário"}
              </p>
              <Badge className={STATUS_CONFIG[volunteerStatus]?.color || ""}>
                {STATUS_CONFIG[volunteerStatus]?.label || volunteerStatus}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs
        defaultValue={(isAdmin || isGerente) ? "gerenciar" : "escala"}
        onValueChange={(val) => {
          if (val === "Disparos") {
            localStorage.setItem("last_checked_announcements", new Date().toISOString());
            // Trigger a potential re-render in sidebar if needed, 
            // though AuthContext polls or we can use an event
            window.dispatchEvent(new Event('storage'));
          }
        }}
      >
        <TabsList className={cn(
          "grid w-full max-w-2xl bg-muted/50 p-1 rounded-2xl gap-1",
          activeTabsCount === 1 && "grid-cols-1",
          activeTabsCount === 2 && "grid-cols-2",
          activeTabsCount === 3 && "grid-cols-3",
          activeTabsCount === 4 && "grid-cols-4",
          activeTabsCount === 5 && "grid-cols-5"
        )}>
          {(isActive || isAdmin || isGerente) && (
            <TabsTrigger value="escala" className="rounded-xl flex items-center gap-1 text-xs">
              <CalendarDays className="h-3.5 w-3.5" /> Escala
            </TabsTrigger>
          )}
          {volunteerStatus === "in_progress" && !isAdmin && (
            <TabsTrigger value="treinamento" className="rounded-xl flex items-center gap-1 text-xs">
              <ClipboardList className="h-3.5 w-3.5" /> Treinamento
            </TabsTrigger>
          )}
          {(isAdmin || isGerente) && (
            <TabsTrigger value="gerenciar" className="rounded-xl flex items-center gap-1 text-xs">
              <User className="h-3.5 w-3.5" /> Gerenciar
            </TabsTrigger>
          )}
          {(isAdmin || isGerente) && (
            <TabsTrigger value="escalas-adm" className="rounded-xl flex items-center gap-1 text-xs">
              <CalendarDays className="h-3.5 w-3.5" /> Escalas
            </TabsTrigger>
          )}
        </TabsList>

        {/* Escala Tab */}
        <TabsContent value="escala" className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Escala Semanal</h2>
          </div>
          {matrixSchedules.length === 0 ? (
            <Card className="border-0 bg-muted/30">
              <CardContent className="p-6 text-center text-muted-foreground italic">
                Nenhuma escala publicada.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {matrixSchedules.map((group: any) => (
                <Card key={group.id} className="neo-shadow-sm border-0 overflow-hidden">
                  <div className="bg-primary/5 px-4 py-2 border-b flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      <span className="font-bold text-sm uppercase">
                        {format(new Date(group.date + "T12:00:00"), "dd/MM (EEEE)", { locale: ptBR })}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-[9px] uppercase tracking-tighter">{group.group_name}</Badge>
                  </div>
                  <CardContent className="p-0">
                    <div className="grid grid-cols-1 divide-y divide-dashed">
                      {group.assignments.map((s: any) => (
                        <div key={s.id} className="flex items-center justify-between p-4 bg-card/40">
                          <div className="flex-1">
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{s.role_function}</p>
                            <p className="font-bold text-base text-primary mr-2">
                              {s.profiles?.full_name || s.volunteers?.full_name || "—"}
                            </p>
                          </div>
                          {s.volunteer_id && (
                            <Badge className="bg-emerald-500 font-bold text-[9px] h-5">VOLUNTÁRIO</Badge>
                          )}
                        </div>
                      ))}
                    </div>
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
              <h3 className="font-extrabold text-xl font-display text-blue-600">Você já está no caminho!</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Fique atento às instruções do pastor. Quando o treinamento for concluído, você terá acesso completo à escala.
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
                    <div className="flex-1 min-w-0 mr-4 space-y-1">
                      <p className="font-bold text-sm text-foreground truncate flex items-center gap-2">
                        <User className="h-4 w-4 text-primary shrink-0" /> {v.full_name}
                      </p>
                      {v.phone && <p className="text-[11px] text-muted-foreground font-medium">📱 {v.phone}</p>}
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge className={cn("text-[9px] px-2 py-0.5 uppercase tracking-tighter shadow-sm font-black", sc.color)}>
                          <StatusIcon className="h-2.5 w-2.5 mr-1" /> {sc.label}
                        </Badge>
                        {v.interest_areas?.map((area: string) => (
                          <Badge key={area} variant="secondary" className="text-[9px] px-2 py-0.5 uppercase font-black tracking-tighter bg-muted/50 border-0">{area}</Badge>
                        ))}
                      </div>
                      {v.availability && <p className="text-[10px] text-muted-foreground mt-1 truncate">📅 {v.availability}</p>}
                      <p className="text-[9px] font-medium text-muted-foreground/60">
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
            <Button size="sm" onClick={() => handleOpenSchedule()}>
              <Plus className="h-4 w-4 mr-1" /> Nova Escala
            </Button>
          </div>
          <div className="space-y-4">
            {matrixSchedules.length === 0 && (
              <Card className="border-0 bg-muted/30">
                <CardContent className="p-6 text-center text-muted-foreground italic">Nenhuma escala criada.</CardContent>
              </Card>
            )}
            {matrixSchedules.map((group: any) => (
              <Card key={group.id} className="neo-shadow-sm border-0 overflow-hidden ring-1 ring-primary/10">
                <div className="bg-muted/50 px-4 py-2 border-b flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5 text-primary" />
                    <span className="font-bold text-xs uppercase text-muted-foreground">
                      {format(new Date(group.date + "T12:00:00"), "dd/MM (EEEE)", { locale: ptBR })}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[9px] uppercase tracking-tighter bg-background">{group.group_name}</Badge>
                </div>
                <div className="divide-y divide-dashed">
                  {group.assignments.map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between p-3 px-4 hover:bg-muted/20 transition-colors">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-wider leading-none mb-1">{s.role_function}</p>
                        <p className="font-bold text-sm">{s.profiles?.full_name || s.volunteers?.full_name || "—"}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenSchedule(s)}>
                          <Edit2 className="h-3.5 w-3.5 text-primary" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteScheduleMutation.mutate(s.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
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
        groups={groups}
      />

      {/* Edit Status Dialog */}
      <Dialog open={!!editingStatus} onOpenChange={v => !v && setEditingStatus(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl border-0 shadow-2xl">
          <DialogHeader><DialogTitle className="text-xl font-bold">Alterar Status: {editingStatus?.full_name}</DialogTitle></DialogHeader>
          <div className="py-6 space-y-4 text-center">
            <div className={cn("h-16 w-16 mx-auto rounded-full flex items-center justify-center mb-2", STATUS_CONFIG[editingStatus?.status || "pending"]?.color)}>
              <User className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Novo Status de Voluntário</Label>
              <Select value={editingStatus?.status || "pending"} onValueChange={(val) => setEditingStatus({ ...editingStatus, status: val })}>
                <SelectTrigger className="rounded-xl h-12"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Solicitação Enviada</SelectItem>
                  <SelectItem value="in_progress">Em Andamento (Treinamento)</SelectItem>
                  <SelectItem value="completed">Concluído (Ativo)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditingStatus(null)} className="rounded-xl border-2">Cancelar</Button>
            <Button onClick={() => updateStatusMutation.mutate({ id: editingStatus.id, status: editingStatus.status })} className="rounded-xl px-8 font-bold">
              Atualizar Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Schedule Dialog */}
      <Dialog open={creatingSchedule} onOpenChange={v => {
        if (!v) {
          setCreatingSchedule(false);
          setEditingSchedule(null);
        }
      }}>
        <DialogContent className="sm:max-w-[600px] rounded-3xl border-0 shadow-2xl">
          <DialogHeader><DialogTitle className="text-xl font-bold">{editingSchedule ? "Editar Escala" : "Nova Escala de Voluntários"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            {isAdmin && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-3 text-sm text-amber-600 mb-2">
                <p className="font-bold">Aviso para Admin:</p>
                Deseja que esta escala seja Geral (visível para todos)? Deixe o grupo em branco.
              </div>
            )}
            <div className="space-y-2">
              <Label>Departamento da Escala</Label>
              <Select value={scheduleGroupId} onValueChange={setScheduleGroupId}>
                <SelectTrigger><SelectValue placeholder="Selecione o departamento" /></SelectTrigger>
                <SelectContent>
                  {isAdmin && <SelectItem value="general">Geral / Sem Grupo Específico</SelectItem>}
                  {groups?.map((g: any) => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Membro do Departamento</Label>
              <Select value={scheduleVolunteerId} onValueChange={setScheduleVolunteerId} disabled={!scheduleGroupId}>
                <SelectTrigger className="rounded-xl h-11"><SelectValue placeholder={scheduleGroupId ? "Selecione o Membro" : "Selecione o departamento primeiro"} /></SelectTrigger>
                <SelectContent>
                  {departmentMembers?.map((m: any) => {
                    const isApprovedVolunteer = volunteers?.some((v: any) => v.user_id === m.user_id && v.status === "completed");
                    return (
                      <SelectItem key={m.user_id} value={m.user_id}>
                        {m.profiles?.full_name} {isApprovedVolunteer && "✅"}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Data da Escala</Label>
                <Input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="rounded-xl h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Função / Atividade</Label>
                <Input value={scheduleRole} onChange={e => setScheduleRole(e.target.value)} placeholder="Ex: Recepção, Louvor, Som..." className="rounded-xl h-11" />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreatingSchedule(false)} className="rounded-xl border-2">Cancelar</Button>
            <Button onClick={() => saveScheduleMutation.mutate()} disabled={(!isAdmin && !scheduleGroupId) || !scheduleVolunteerId || !scheduleDate || !scheduleRole || saveScheduleMutation.isPending} className="rounded-xl px-8 font-bold">
              {saveScheduleMutation.isPending ? "Salvando..." : "Salvar Escala"}
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

const SignupDialog = ({ open, onClose, fullName, setFullName, phone, setPhone, availability, setAvailability, interestAreas, setInterestAreas, onSave, isPending, groups }: any) => {
  const displayAreas = groups && groups.length > 0 ? groups.map((g: any) => g.name) : FALLBACK_INTEREST_AREAS;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-[700px] rounded-3xl border-0 shadow-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader><DialogTitle className="text-xl font-bold text-primary">Inscrição de Voluntário</DialogTitle></DialogHeader>
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome Completo</Label>
              <Input value={fullName} onChange={(e: any) => setFullName(e.target.value)} placeholder="Seu nome" className="rounded-xl h-11" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Telefone / WhatsApp</Label>
              <Input value={phone} onChange={(e: any) => setPhone(e.target.value)} placeholder="(00) 00000-0000" className="rounded-xl h-11" />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-bold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> Áreas de Interesse (Departamentos)
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-muted/20 rounded-2xl border border-dashed">
              {displayAreas.map((area: string) => (
                <div key={area} className="flex items-center space-x-2 group cursor-pointer">
                  <Checkbox
                    id={`area-${area}`}
                    checked={interestAreas.includes(area)}
                    onCheckedChange={(checked: boolean) => {
                      if (checked) setInterestAreas([...interestAreas, area]);
                      else setInterestAreas(interestAreas.filter((a: string) => a !== area));
                    }}
                    className="rounded-md"
                  />
                  <label htmlFor={`area-${area}`} className="text-xs font-semibold cursor-pointer group-hover:text-primary transition-colors">{area}</label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sua Disponibilidade</Label>
            <Textarea value={availability} onChange={(e: any) => setAvailability(e.target.value)} placeholder="Ex: Sábados à tarde, domingos de manhã..." rows={2} className="rounded-2xl resize-none" />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl border-2">Cancelar</Button>
          <Button onClick={onSave} disabled={!fullName?.trim() || isPending} className="rounded-xl px-12 font-bold shadow-lg">
            {isPending ? "Processando..." : "Confirmar Inscrição"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


export default Volunteers;
