import { useState, useRef } from "react";
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
import { safeFormat } from "@/lib/dateUtils";
import { Calendar, MapPin, Check, X, Share2, Plus, Edit2, Trash2, Users, Ticket, Copy, QrCode, Mic2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const EVENT_TYPE_LABELS: Record<string, string> = {
  simple: "Compromisso",
  course: "Curso",
  conference: "Conferência",
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  simple: "bg-muted text-muted-foreground",
  course: "bg-primary/10 text-primary border-primary/30",
  conference: "bg-accent text-accent-foreground border-accent",
};

const Agenda = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [rsvpViewEvent, setRsvpViewEvent] = useState<any>(null);
  const [deletingEvent, setDeletingEvent] = useState<any>(null);
  const [registrationViewEvent, setRegistrationViewEvent] = useState<any>(null);
  const [pixDialogEvent, setPixDialogEvent] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [isGeneral, setIsGeneral] = useState("true");
  const [groupId, setGroupId] = useState("");
  const [eventType, setEventType] = useState("simple");
  const [bannerUrl, setBannerUrl] = useState("");
  const [speakers, setSpeakers] = useState("");
  const [price, setPrice] = useState(0);
  const [pixKey, setPixKey] = useState("");
  const [pixQrcodeUrl, setPixQrcodeUrl] = useState("");
  const [mapUrl, setMapUrl] = useState("");

  const { data: userGroups } = useQuery({
    queryKey: ["user-groups", user?.id],
    enabled: !!user && !isAdmin,
    queryFn: async () => {
      const { data } = await supabase.from("member_groups").select("group_id").eq("user_id", user?.id);
      return data?.map(m => m.group_id) || [];
    },
  });

  const { data: groups } = useQuery({
    queryKey: ["groups", isAdmin, userGroups],
    queryFn: async () => {
      const query = supabase.from("groups").select("*");
      if (!isAdmin && userGroups) {
        if (userGroups.length === 0) return [];
        query.in("id", userGroups);
      }
      const { data } = await query;
      return data || [];
    },
    enabled: !!user && (isAdmin || !!userGroups),
  });

  const { data: events } = useQuery({
    queryKey: ["events", filter],
    queryFn: async () => {
      let query = (supabase as any)
        .from("events")
        .select("*, event_rsvps(*), groups(name)")
        .order("event_date", { ascending: true });
      if (filter !== "all") query = query.eq("group_id", filter);
      const { data } = await query;
      return data || [];
    },
  });

  const showFilters = isAdmin || (groups && groups.length > 1);

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

  const registerMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await (supabase as any).from("event_registrations").upsert(
        { event_id: eventId, user_id: user!.id, payment_status: "pending" },
        { onConflict: "event_id,user_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({ title: "Inscrição realizada!" });
    },
  });

  const resetForm = () => {
    setTitle(""); setDesc(""); setDate(""); setLocation(""); setIsGeneral("true"); setGroupId("");
    setEventType("simple"); setBannerUrl(""); setSpeakers(""); setPrice(0); setPixKey(""); setPixQrcodeUrl(""); setMapUrl("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `event-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("landing-photos")
        .upload(fileName, file, { upsert: true });
      
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("landing-photos").getPublicUrl(fileName);
      setBannerUrl(urlData.publicUrl);
      toast({ title: "Banner carregado com sucesso!" });
    } catch (err: any) {
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (ev: any) => {
    setEditingEvent(ev);
    setTitle(ev.title || "");
    setDesc(ev.description || "");
    setLocation(ev.location || "");
    setIsGeneral(ev.is_general ? "true" : "false");
    setGroupId(ev.group_id || "");
    setEventType(ev.event_type || "simple");
    setBannerUrl(ev.banner_url || "");
    setSpeakers(ev.speakers || "");
    setPrice(ev.price || 0);
    setPixKey(ev.pix_key || "");
    setPixQrcodeUrl(ev.pix_qrcode_url || "");
    setMapUrl(ev.map_url || "");
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
        created_by: user?.id,
        event_type: eventType,
        banner_url: bannerUrl.trim() || null,
        speakers: speakers.trim() || null,
        price: price || 0,
        pix_key: pixKey.trim() || null,
        pix_qrcode_url: pixQrcodeUrl.trim() || null,
        map_url: mapUrl.trim() || null,
      };
      if (editingEvent) {
        const { error } = await (supabase as any).from("events").update(payload).eq("id", editingEvent.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("events").insert(payload);
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
    const text = `🌊 *CC Mergulho - ${EVENT_TYPE_LABELS[event.event_type] || "Evento"}*\n\n📌 ${event.title}\n📅 ${safeFormat(event.event_date, "dd/MM/yyyy 'às' HH:mm")}\n📍 ${event.location || "A definir"}${event.price > 0 ? `\n💰 R$ ${event.price.toFixed(2)}` : ""}\n\n${event.description || ""}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const copyPix = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({ title: "Chave PIX copiada!" });
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

      {showFilters && (
        <div className="flex flex-wrap gap-2 pb-2">
          <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>Todos</Button>
          {groups?.map(g => (
            <Button key={g.id} variant={filter === g.id ? "default" : "outline"} size="sm" onClick={() => setFilter(g.id)}>
              {g.name}
            </Button>
          ))}
        </div>
      )}

      {/* Events */}
      <div className="space-y-4">
        {events?.length === 0 && (
          <Card className="border-0 bg-muted/30">
            <CardContent className="p-6 text-center text-muted-foreground">
              Nenhum evento programado no momento.
            </CardContent>
          </Card>
        )}
        {events?.map((event: any) => {
          const userRsvp = event.event_rsvps?.find((r: any) => r.user_id === user?.id);
          const confirmed = event.event_rsvps?.filter((r: any) => r.status === "confirmed").length || 0;
          const declined = event.event_rsvps?.filter((r: any) => r.status === "declined").length || 0;
          const isComplex = event.event_type === "course" || event.event_type === "conference";
          const isPaid = event.price > 0;

          return (
            <Card key={event.id} className={`neo-shadow-sm border-0 overflow-hidden ${isComplex ? "ring-1 ring-primary/20" : ""}`}>
              {/* Banner */}
              {event.banner_url && (
                <div className="w-full h-40 overflow-hidden">
                  <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover" />
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`text-[10px] ${EVENT_TYPE_COLORS[event.event_type] || EVENT_TYPE_COLORS.simple}`}>
                        {EVENT_TYPE_LABELS[event.event_type] || "Compromisso"}
                      </Badge>
                      <Badge variant={event.is_general ? "default" : "secondary"} className="text-[10px]">
                        {event.is_general ? "Geral" : (event.groups?.name || "Grupo")}
                      </Badge>
                      {isPaid && (
                        <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-600">
                          R$ {Number(event.price).toFixed(2)}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {safeFormat(event.event_date, "dd/MM/yyyy 'às' HH:mm")}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 mt-0.5 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{event.location}</span>
                        {event.map_url && (
                          <a href={event.map_url} target="_blank" rel="noopener noreferrer" className="text-primary text-xs underline ml-1">
                            Ver mapa
                          </a>
                        )}
                      </div>
                    )}
                    {event.speakers && (
                      <div className="flex items-center gap-2 mt-0.5 text-sm text-muted-foreground">
                        <Mic2 className="h-3.5 w-3.5" />
                        {event.speakers}
                      </div>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(event)}>
                        <Edit2 className="h-4 w-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeletingEvent(event)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {event.description && <p className="text-sm text-muted-foreground mb-3">{event.description}</p>}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3 text-[10px] sm:text-xs">
                    <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-semibold border border-emerald-100 dark:border-emerald-900/50">
                      <Check className="h-3 w-3" /> {confirmed}
                    </div>
                    <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded-full font-semibold border border-rose-100 dark:border-rose-900/50">
                      <X className="h-3 w-3" /> {declined}
                    </div>
                    {isAdmin && (
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setRsvpViewEvent(event)}>
                        <Users className="h-3 w-3 mr-1" /> Lista
                      </Button>
                    )}
                  </div>
                    <div className="flex gap-2 flex-wrap">
                      {/* RSVP buttons: Only for non-conferences */}
                      {event.event_type !== "conference" && (
                        <>
                          <Button
                            size="sm"
                            variant={userRsvp?.status === "confirmed" ? "default" : "outline"}
                            disabled={userRsvp?.status === "confirmed"}
                            onClick={() => rsvpMutation.mutate({ eventId: event.id, status: "confirmed" })}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            {userRsvp?.status === "confirmed" ? "Confirmado" : "Vou"}
                          </Button>
                          <Button
                            size="sm"
                            variant={userRsvp?.status === "declined" ? "destructive" : "outline"}
                            disabled={userRsvp?.status === "declined"}
                            onClick={() => rsvpMutation.mutate({ eventId: event.id, status: "declined" })}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Não vou
                          </Button>
                        </>
                      )}

                    {/* Paid event: PIX/registration */}
                    {isPaid && event.pix_key && (
                      <Button size="sm" variant="outline" onClick={() => setPixDialogEvent(event)}>
                        <QrCode className="h-4 w-4 mr-1" /> PIX
                      </Button>
                    )}
                    {isComplex && (
                      <Button size="sm" variant="secondary" onClick={() => registerMutation.mutate(event.id)}>
                        <Ticket className="h-4 w-4 mr-1" /> Inscrever-se
                      </Button>
                    )}

                    <Button size="sm" variant="outline" onClick={() => shareWhatsApp(event)}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Admin: view registrations */}
                {isAdmin && isComplex && (
                  <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => setRegistrationViewEvent(event)}>
                    <Ticket className="h-3 w-3 mr-1" /> Ver Inscritos
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={creatingEvent || !!editingEvent} onOpenChange={val => { if (!val) { setCreatingEvent(false); setEditingEvent(null); } }}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingEvent ? "Editar Evento" : "Novo Evento"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4 font-semibold uppercase tracking-tight text-xs text-muted-foreground border-b pb-2 col-span-full">Informações Básicas</div>
              <div className="space-y-2">
                <Label>Título</Label>
                <Input placeholder="Título do evento" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Evento</Label>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Compromisso Simples</SelectItem>
                    <SelectItem value="course">Curso</SelectItem>
                    <SelectItem value="conference">Conferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Local</Label>
                <Input placeholder="Onde será o evento?" value={location} onChange={e => setLocation(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Link do Mapa (opcional)</Label>
                <Input placeholder="https://maps.google.com/..." value={mapUrl} onChange={e => setMapUrl(e.target.value)} />
              </div>
              <div className="space-y-2 col-span-full">
                <Label>Descrição</Label>
                <Textarea placeholder="Breve descritivo..." value={desc} onChange={e => setDesc(e.target.value)} rows={3} />
              </div>
              <div className="space-y-2 col-span-full">
                <Label>Banner do Evento</Label>
                <div className="flex gap-2">
                  <Input placeholder="URL da imagem..." value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} className="flex-1" />
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                  <Button variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    {uploading ? "..." : "Upload"}
                  </Button>
                </div>
              </div>

              {(eventType === "course" || eventType === "conference") && (
                <>
                  <div className="space-y-4 font-semibold uppercase tracking-tight text-xs text-muted-foreground border-b pb-2 col-span-full mt-2">Detalhes do {EVENT_TYPE_LABELS[eventType]}</div>
                  <div className="space-y-2 col-span-full">
                    <Label>Palestrantes</Label>
                    <Input placeholder="Nomes separados por vírgula" value={speakers} onChange={e => setSpeakers(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor (R$) — 0 se gratuito</Label>
                    <Input type="number" min={0} step={0.01} value={price} onChange={e => setPrice(Number(e.target.value))} />
                  </div>
                  {price > 0 && (
                    <>
                      <div className="space-y-2">
                        <Label>Chave PIX</Label>
                        <Input placeholder="email@, CPF, telefone..." value={pixKey} onChange={e => setPixKey(e.target.value)} />
                      </div>
                      <div className="space-y-2 col-span-full">
                        <Label>URL QR Code PIX (opcional)</Label>
                        <Input placeholder="https://..." value={pixQrcodeUrl} onChange={e => setPixQrcodeUrl(e.target.value)} />
                      </div>
                    </>
                  )}
                </>
              )}

              <div className="space-y-4 font-semibold uppercase tracking-tight text-xs text-muted-foreground border-b pb-2 col-span-full mt-2">Configurações e Data</div>
              <div className="space-y-2">
                <Label>Data e Hora</Label>
                <Input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Visibilidade</Label>
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
                      {groups?.map((g: any) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreatingEvent(false); setEditingEvent(null); }}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!title || !date || saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando..." : editingEvent ? "Salvar" : "Criar Evento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PIX Dialog */}
      <Dialog open={!!pixDialogEvent} onOpenChange={v => !v && setPixDialogEvent(null)}>
        <DialogContent className="sm:max-w-sm text-center">
          <DialogHeader><DialogTitle>Pagamento PIX</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-lg font-bold text-primary">R$ {Number(pixDialogEvent?.price || 0).toFixed(2)}</p>
            {pixDialogEvent?.pix_qrcode_url && (
              <img src={pixDialogEvent.pix_qrcode_url} alt="QR Code PIX" className="mx-auto w-48 h-48 rounded-lg border" />
            )}
            {pixDialogEvent?.pix_key && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Chave PIX:</p>
                <div className="flex items-center gap-2 justify-center">
                  <code className="bg-muted px-3 py-1.5 rounded text-sm break-all">{pixDialogEvent.pix_key}</code>
                  <Button variant="outline" size="icon" onClick={() => copyPix(pixDialogEvent.pix_key)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground">Após o pagamento, o administrador confirmará sua inscrição.</p>
          </div>
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

      {/* RSVP List Dialog */}
      <Dialog open={!!rsvpViewEvent} onOpenChange={val => !val && setRsvpViewEvent(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader><DialogTitle>Controle de Presença: {rsvpViewEvent?.title}</DialogTitle></DialogHeader>
          <div className="py-2 max-h-[500px] overflow-y-auto pr-2">
            <RsvpList event={rsvpViewEvent} />
          </div>
          <DialogFooter>
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setRsvpViewEvent(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Registration List Dialog (admin) */}
      <Dialog open={!!registrationViewEvent} onOpenChange={v => !v && setRegistrationViewEvent(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader><DialogTitle>Inscritos: {registrationViewEvent?.title}</DialogTitle></DialogHeader>
          <div className="py-2 max-h-[500px] overflow-y-auto pr-2">
            <RegistrationList event={registrationViewEvent} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegistrationViewEvent(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* --- Sub-components --- */

const RsvpList = ({ event }: { event: any }) => {
  const { data: usersData, isLoading } = useQuery({
    queryKey: ["rsvp-full-list", event?.id],
    queryFn: async () => {
      if (!event) return [];
      const { data: rsvps } = await supabase.from("event_rsvps").select("user_id, status").eq("event_id", event.id);
      let relevantProfiles: any[] = [];
      if (event.is_general) {
        const { data } = await supabase.from("profiles").select("user_id, full_name").order("full_name");
        relevantProfiles = data || [];
      } else if (event.group_id) {
        const { data: gm } = await supabase.from("member_groups").select("user_id, profiles(full_name)").eq("group_id", event.group_id);
        relevantProfiles = gm?.map(m => ({ user_id: m.user_id, full_name: (m.profiles as any)?.full_name || "Membro" })) || [];
      }
      const rsvpMap = new Map(rsvps?.map(r => [r.user_id, r.status]));
      return relevantProfiles.map(p => ({
        user_id: p.user_id,
        name: p.full_name,
        status: rsvpMap.get(p.user_id) || "pending"
      }));
    },
    enabled: !!event,
  });

  if (isLoading) return <div className="flex justify-center p-8"><span className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" /></div>;

  const confirmed = usersData?.filter(u => u.status === "confirmed") || [];
  const declined = usersData?.filter(u => u.status === "declined") || [];
  const pending = usersData?.filter(u => u.status === "pending") || [];

  return (
    <div className="space-y-6">
      <RsvpSection label="Confirmados" items={confirmed} color="emerald" icon={<Check className="h-4 w-4" />} />
      <RsvpSection label="Não Vão" items={declined} color="rose" icon={<X className="h-4 w-4" />} />
      <RsvpSection label="Pendentes" items={pending} color="slate" icon={<Users className="h-4 w-4" />} />
    </div>
  );
};

const RsvpSection = ({ label, items, color, icon }: { label: string; items: any[]; color: string; icon: React.ReactNode }) => (
  <section>
    <div className="flex items-center justify-between mb-2">
      <p className={`text-sm font-bold text-${color}-600 dark:text-${color}-400 flex items-center gap-2`}>{icon} {label}</p>
      <Badge variant="outline" className="text-xs">{items.length}</Badge>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
      {items.length === 0 ? <p className="text-xs text-muted-foreground italic px-2">Nenhum</p> : items.map(u => (
        <div key={u.user_id} className="text-[13px] px-3 py-2 bg-muted/50 rounded-lg font-medium">{u.name}</div>
      ))}
    </div>
  </section>
);

const RegistrationList = ({ event }: { event: any }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: registrations, isLoading } = useQuery({
    queryKey: ["event-registrations", event?.id],
    queryFn: async () => {
      if (!event) return [];
      const { data } = await (supabase as any).from("event_registrations").select("*").eq("event_id", event.id);
      if (!data) return [];
      const userIds = data.map((r: any) => r.user_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
      const nameMap = new Map(profiles?.map(p => [p.user_id, p.full_name]));
      return data.map((r: any) => ({ ...r, name: nameMap.get(r.user_id) || "Membro" }));
    },
    enabled: !!event,
  });

  const updatePayment = async (id: string, status: string) => {
    await (supabase as any).from("event_registrations").update({ payment_status: status }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["event-registrations", event?.id] });
    toast({ title: `Status atualizado para ${status}` });
  };

  if (isLoading) return <div className="flex justify-center p-8"><span className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">{registrations?.length || 0} inscrito(s)</p>
      {registrations?.map((r: any) => (
        <div key={r.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
          <span className="text-sm font-medium">{r.name}</span>
          <Select value={r.payment_status} onValueChange={v => updatePayment(r.id, v)}>
            <SelectTrigger className="w-32 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="confirmed">Pago</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ))}
      {registrations?.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Nenhum inscrito ainda.</p>}
    </div>
  );
};

export default Agenda;
