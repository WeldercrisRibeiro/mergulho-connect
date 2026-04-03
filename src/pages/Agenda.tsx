import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, MapPin, Check, X, Share2, Plus, Edit2, Trash2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Agenda = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [rsvpViewEvent, setRsvpViewEvent] = useState<any>(null);
  const [deletingEvent, setDeletingEvent] = useState<any>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [isGeneral, setIsGeneral] = useState("true");
  const [groupId, setGroupId] = useState("");

  const { data: groups } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const { data } = await supabase.from("groups").select("*");
      return data || [];
    },
  });

  const { data: events } = useQuery({
    queryKey: ["events", filter],
    queryFn: async () => {
      let query = supabase
        .from("events")
        .select("*, event_rsvps(*), groups(name)")
        .order("event_date", { ascending: true });

      if (filter !== "all") {
        query = query.eq("group_id", filter);
      }

      const { data } = await query;
      return data || [];
    },
  });

  const rsvpMutation = useMutation({
    mutationFn: async ({ eventId, status }: { eventId: string; status: string }) => {
      const { error } = await supabase.from("event_rsvps").upsert(
        { event_id: eventId, user_id: user!.id, status },
        { onConflict: "event_id,user_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({ title: "Presença atualizada!" });
    },
  });

  const resetForm = () => {
    setTitle(""); setDesc(""); setDate(""); setLocation(""); setIsGeneral("true"); setGroupId("");
  };

  const handleEdit = (ev: any) => {
    setEditingEvent(ev);
    setTitle(ev.title || "");
    setDesc(ev.description || "");
    setLocation(ev.location || "");
    setIsGeneral(ev.is_general ? "true" : "false");
    setGroupId(ev.group_id || "");
    if (ev.event_date) {
      const d = new Date(ev.event_date);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      setDate(d.toISOString().slice(0, 16));
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title,
        description: desc,
        event_date: date ? new Date(date).toISOString() : null,
        location,
        is_general: isGeneral === "true",
        group_id: isGeneral === "false" && groupId ? groupId : null,
      };

      if (editingEvent) {
        const { error } = await supabase.from("events").update(payload).eq("id", editingEvent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("events").insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setEditingEvent(null);
      setCreatingEvent(false);
      resetForm();
      toast({ title: editingEvent ? "Evento atualizado!" : "Evento criado!" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({ title: "Evento removido!" });
    },
  });

  const shareWhatsApp = (event: any) => {
    const text = `🌊 *CC Mergulho - Evento*\n\n📌 ${event.title}\n📅 ${format(new Date(event.event_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}\n📍 ${event.location || "A definir"}\n\n${event.description || ""}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" />
          Agenda
        </h1>
        {isAdmin && (
          <Button onClick={() => { resetForm(); setCreatingEvent(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Novo Evento
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>Todos</Button>
        {groups?.map(g => (
          <Button key={g.id} variant={filter === g.id ? "default" : "outline"} size="sm" onClick={() => setFilter(g.id)}>
            {g.name}
          </Button>
        ))}
      </div>

      {/* Events */}
      <div className="space-y-4">
        {events?.map((event) => {
          const userRsvp = event.event_rsvps?.find((r: any) => r.user_id === user?.id);
          const confirmed = event.event_rsvps?.filter((r: any) => r.status === "confirmed").length || 0;
          const declined = event.event_rsvps?.filter((r: any) => r.status === "declined").length || 0;

          return (
            <Card key={event.id} className="neo-shadow-sm border-0">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {event.event_date && format(new Date(event.event_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 mt-0.5 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {event.location}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant={event.is_general ? "default" : "secondary"}>
                      {event.is_general ? "Geral" : ((event.groups as any)?.name || "Grupo")}
                    </Badge>
                    {isAdmin && (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(event)}>
                          <Edit2 className="h-4 w-4 text-primary" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeletingEvent(event)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {event.description && <p className="text-sm text-muted-foreground mb-3">{event.description}</p>}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="text-emerald-600 font-medium">{confirmed} confirmados</span>
                    <span className="text-rose-500 font-medium">{declined} não vão</span>
                    {isAdmin && (
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setRsvpViewEvent(event)}>
                        <Users className="h-3 w-3 mr-1" /> Ver lista
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant={userRsvp?.status === "confirmed" ? "default" : "outline"}
                      onClick={() => rsvpMutation.mutate({ eventId: event.id, status: "confirmed" })}>
                      <Check className="h-4 w-4 mr-1" /> Vou
                    </Button>
                    <Button size="sm" variant={userRsvp?.status === "declined" ? "destructive" : "outline"}
                      onClick={() => rsvpMutation.mutate({ eventId: event.id, status: "declined" })}>
                      <X className="h-4 w-4 mr-1" /> Não vou
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => shareWhatsApp(event)}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {events?.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhum evento encontrado</p>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={creatingEvent} onOpenChange={val => !val && setCreatingEvent(false)}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader><DialogTitle>Novo Evento</DialogTitle></DialogHeader>
          <EventForm 
            title={title} setTitle={setTitle}
            desc={desc} setDesc={setDesc}
            date={date} setDate={setDate}
            location={location} setLocation={setLocation}
            isGeneral={isGeneral} setIsGeneral={setIsGeneral}
            groupId={groupId} setGroupId={setGroupId}
            groups={groups}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreatingEvent(false)}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!title || !date || saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando..." : "Criar Evento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Confirm Delete */}
      <ConfirmDialog
        open={!!deletingEvent}
        title="Excluir Evento"
        description={`Deseja realmente excluir o evento "${deletingEvent?.title}"?`}
        confirmLabel="Excluir"
        variant="danger"
        onConfirm={() => deleteMutation.mutate(deletingEvent?.id)}
        onCancel={() => setDeletingEvent(null)}
      />

      {/* Edit Dialog */}
      <Dialog open={!!editingEvent} onOpenChange={val => !val && setEditingEvent(null)}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader><DialogTitle>Editar Evento</DialogTitle></DialogHeader>
          <EventForm 
            title={title} setTitle={setTitle}
            desc={desc} setDesc={setDesc}
            date={date} setDate={setDate}
            location={location} setLocation={setLocation}
            isGeneral={isGeneral} setIsGeneral={setIsGeneral}
            groupId={groupId} setGroupId={setGroupId}
            groups={groups}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEvent(null)}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!title || !date || saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* RSVP List Dialog (Admin only) */}
      <Dialog open={!!rsvpViewEvent} onOpenChange={val => !val && setRsvpViewEvent(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Confirmações: {rsvpViewEvent?.title}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2 max-h-[400px] overflow-y-auto">
            <RsvpList event={rsvpViewEvent} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRsvpViewEvent(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const RsvpList = ({ event }: { event: any }) => {
  const { data: rsvpDetails } = useQuery({
    queryKey: ["rsvp-details", event?.id],
    queryFn: async () => {
      if (!event) return [];
      // Get all RSVPs with profile names
      const { data: rsvps } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", event.id);
      
      if (!rsvps || rsvps.length === 0) return [];
      
      const uids = rsvps.map(r => r.user_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", uids);
      const map = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
      
      return rsvps.map(r => ({ ...r, name: map.get(r.user_id) || "Membro" }));
    },
    enabled: !!event,
  });

  const confirmed = rsvpDetails?.filter(r => r.status === "confirmed") || [];
  const declined = rsvpDetails?.filter(r => r.status === "declined") || [];

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-emerald-600 mb-2">✅ Confirmados ({confirmed.length})</p>
        {confirmed.length === 0 ? <p className="text-xs text-muted-foreground">Nenhum ainda</p> : (
          <div className="space-y-1">
            {confirmed.map(r => <p key={r.user_id} className="text-sm px-2 py-1 bg-emerald-50 dark:bg-emerald-950/30 rounded">{r.name}</p>)}
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-semibold text-rose-500 mb-2">❌ Não vão ({declined.length})</p>
        {declined.length === 0 ? <p className="text-xs text-muted-foreground">Nenhum ainda</p> : (
          <div className="space-y-1">
            {declined.map(r => <p key={r.user_id} className="text-sm px-2 py-1 bg-rose-50 dark:bg-rose-950/30 rounded">{r.name}</p>)}
          </div>
        )}
      </div>
    </div>
  );
};

export default Agenda;

const EventForm = ({ title, setTitle, desc, setDesc, date, setDate, location, setLocation, isGeneral, setIsGeneral, groupId, setGroupId, groups }: any) => (
  <div className="space-y-4 py-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4 font-semibold uppercase tracking-tight text-xs text-muted-foreground border-b pb-2 col-span-full">Informações Básicas</div>
      <div className="space-y-2">
        <Label>Título</Label>
        <Input placeholder="Título do evento" value={title} onChange={e => setTitle(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Local</Label>
        <Input placeholder="Onde será o evento?" value={location} onChange={e => setLocation(e.target.value)} />
      </div>
      <div className="space-y-2 col-span-full">
        <Label>Descrição</Label>
        <Textarea placeholder="Breve descritivo..." value={desc} onChange={e => setDesc(e.target.value)} rows={3} />
      </div>

      <div className="space-y-4 font-semibold uppercase tracking-tight text-xs text-muted-foreground border-b pb-2 col-span-full mt-4">Configurações e Data</div>
      <div className="space-y-2">
        <Label>Data e Hora</Label>
        <Input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Tipo</Label>
        <Select value={isGeneral} onValueChange={setIsGeneral}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Evento Geral</SelectItem>
            <SelectItem value="false">Evento de Grupo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {isGeneral === "false" && (
        <div className="space-y-2 col-span-full">
          <Label>Grupo</Label>
          <Select value={groupId} onValueChange={setGroupId}>
            <SelectTrigger><SelectValue placeholder="Selecione o grupo" /></SelectTrigger>
            <SelectContent>
              {groups?.map((gAny: any) => <SelectItem key={gAny.id} value={gAny.id}>{gAny.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  </div>
);
