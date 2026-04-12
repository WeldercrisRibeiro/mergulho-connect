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
import { Calendar, MapPin, Check, X, Share2, Plus, Edit2, Trash2, Users, Ticket, Copy, QrCode, Mic2, Info, ImagePlus, Loader2, Upload, Settings, ScanLine, Clock, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import { logAudit } from "@/lib/auditLogger";
import QRScanner from "@/components/QRScanner";
import { ShareEventDialog } from "@/components/ShareEventDialog";

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

const generateSafeId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const Agenda = () => {
  const { user, isAdmin, isGerente, managedGroupIds, userGroupIds } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── FIX 1: todos os useState DENTRO do componente ──────────────────────────
  const [sharingEvent, setSharingEvent] = useState<any>(null);
  const [cancelingRegistration, setCancelingRegistration] = useState<any>(null);
  const [filter, setFilter] = useState<string>("all");
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [rsvpViewEvent, setRsvpViewEvent] = useState<any>(null);
  const [deletingEvent, setDeletingEvent] = useState<any>(null);
  const [registrationViewEvent, setRegistrationViewEvent] = useState<any>(null);
  const [pixDialogEvent, setPixDialogEvent] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [qrProjectEvent, setQrProjectEvent] = useState<any>(null);
  const [scanningEvent, setScanningEvent] = useState<any>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [isGeneral, setIsGeneral] = useState(isAdmin ? "true" : "false");
  const [groupId, setGroupId] = useState("");
  const [eventType, setEventType] = useState("simple");
  const [bannerUrl, setBannerUrl] = useState("");
  const [speakers, setSpeakers] = useState("");
  const [price, setPrice] = useState(0);
  const [pixKey, setPixKey] = useState("");
  const [pixQrcodeUrl, setPixQrcodeUrl] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [requireCheckin, setRequireCheckin] = useState(false);
  const [isPublic, setIsPublic] = useState(false);

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
    queryKey: ["events", filter, userGroupIds, isAdmin],
    queryFn: async () => {
      let query = (supabase as any)
        .from("events")
        .select("*, event_rsvps(*), event_checkins(*), event_registrations(*), groups(name)")
        .order("event_date", { ascending: true });

      if (filter !== "all") {
        query = query.eq("group_id", filter);
      } else if (!isAdmin) {
        const groupFilter = userGroupIds.length > 0 ? `group_id.in.(${userGroupIds.join(",")})` : "";
        query = query.or(`is_general.eq.true${groupFilter ? `,${groupFilter}` : ""}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 15000,
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
        { event_id: eventId, user_id: user?.id, payment_status: "pending" },
        { onConflict: "event_id,user_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({ title: "Inscrição realizada!" });
    },
    onError: (err: any) => toast({ title: "Erro na inscrição", description: err.message, variant: "destructive" }),
  });

  const cancelRegistrationMutation = useMutation({
    mutationFn: async (eventId: string) => {
      await (supabase as any).from("event_checkins").delete().eq("event_id", eventId).eq("user_id", user?.id);
      const { error } = await (supabase as any).from("event_registrations").delete().eq("event_id", eventId).eq("user_id", user?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({ title: "Inscrição cancelada com sucesso!" });
      setCancelingRegistration(null);
    },
    onError: (err: any) => toast({ title: "Erro ao cancelar", description: err.message, variant: "destructive" }),
  });

  const resetForm = () => {
    setTitle(""); setDesc(""); setDate(""); setLocation("");
    setIsGeneral(isAdmin ? "true" : "false");
    setGroupId("");
    setEventType("simple"); setBannerUrl(""); setSpeakers(""); setPrice(0);
    setPixKey(""); setPixQrcodeUrl(""); setMapUrl("");
    setRequireCheckin(false);
    setIsPublic(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `event-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("event-banners")
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("event-banners").getPublicUrl(fileName);
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
    setRequireCheckin(ev.require_checkin || false);
    setIsPublic(ev.is_public || false);
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
        require_checkin: requireCheckin,
        is_public: isPublic,
        checkin_qr_secret: requireCheckin
          ? (editingEvent?.checkin_qr_secret || generateSafeId())
          : null,
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
      logAudit(editingEvent ? "update" : "create", "agenda", { title });
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
        {(isAdmin || isGerente) && (
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
          const checkedInCount = event.event_checkins?.length || 0;
          const isComplex = event.event_type === "course" || event.event_type === "conference";
          const isPaid = event.price > 0;
          const isRegistered = event.event_registrations?.some((r: any) => r.user_id === user?.id);
          const hasCheckedIn = event.event_checkins?.some((c: any) => c.user_id === user?.id);

          // ── FIX 2: usar managedGroupIds do hook já chamado no topo, não useAuth() no JSX ──
          const canManageEvent = isAdmin || (isGerente && event.group_id && managedGroupIds.includes(event.group_id));

          return (
            <Card key={event.id} className={`neo-shadow-sm border-0 overflow-hidden ${isComplex ? "ring-1 ring-primary/20" : ""}`}>
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
                  {canManageEvent && (
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
                    {!event.require_checkin && (
                      <>
                        <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-semibold border border-emerald-100 dark:border-emerald-900/50">
                          <Check className="h-3 w-3" /> {confirmed}
                        </div>
                        <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded-full font-semibold border border-rose-100 dark:border-rose-900/50">
                          <X className="h-3 w-3" /> {declined}
                        </div>
                      </>
                    )}
                    {event.require_checkin && (
                      <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full font-semibold border border-blue-100 dark:border-blue-900/50">
                        <ScanLine className="h-3 w-3" /> {checkedInCount}
                      </div>
                    )}
                    {canManageEvent && (
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setRsvpViewEvent(event)}>
                        <Users className="h-3 w-3 mr-1" /> Lista
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {event.event_type !== "conference" && !event.require_checkin && (
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
                          <X className="h-4 w-4 mr-1" /> Não vou
                        </Button>
                      </>
                    )}
                    {isPaid && event.pix_key && (
                      <Button size="sm" variant="outline" onClick={() => setPixDialogEvent(event)}>
                        <QrCode className="h-4 w-4 mr-1" /> PIX
                      </Button>
                    )}
                    {isComplex && (
                      isRegistered ? (
                        <Button size="sm" variant="destructive" onClick={() => setCancelingRegistration(event)}>
                          <X className="h-4 w-4 mr-1" /> Cancelar Inscrição
                        </Button>
                      ) : (
                        <Button size="sm" variant="secondary" onClick={() => registerMutation.mutate(event.id)}>
                          <Ticket className="h-4 w-4 mr-1" /> Inscrever-se
                        </Button>
                      )
                    )}
                    <Button size="sm" variant="outline" onClick={() => setSharingEvent(event)} className="gap-1">
                      <Share2 className="h-4 w-4" /> Compartilhar
                    </Button>
                    {event.require_checkin && isRegistered && (
                      <Button
                        size="sm"
                        variant={hasCheckedIn ? "default" : "secondary"}
                        className="gap-1"
                        disabled={hasCheckedIn}
                        onClick={() => !hasCheckedIn && setScanningEvent(event)}
                      >
                        <ScanLine className="h-4 w-4" />
                        {hasCheckedIn ? "✓ Check-in feito" : "Check-in"}
                      </Button>
                    )}
                  </div>
                </div>

                {isAdmin && isComplex && (
                  <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => setRegistrationViewEvent(event)}>
                    <Ticket className="h-3 w-3 mr-1" /> Ver Inscritos
                  </Button>
                )}
                {isAdmin && event.require_checkin && event.checkin_qr_secret && (
                  <Button variant="ghost" size="sm" className="mt-2 text-xs gap-1" onClick={() => setQrProjectEvent(event)}>
                    <QrCode className="h-3 w-3" /> Projetar QR Code
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Share Dialog */}
      <ShareEventDialog
        event={sharingEvent}
        open={!!sharingEvent}
        onClose={() => setSharingEvent(null)}
        landingPageUrl={undefined}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={creatingEvent || !!editingEvent} onOpenChange={val => { if (!val) { setCreatingEvent(false); setEditingEvent(null); } }}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto rounded-3xl border-0 shadow-2xl custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
              {editingEvent ? <Edit2 className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
              {editingEvent ? "Editar Evento" : "Novo Evento"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-8 py-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground border-b pb-2">
                <Info className="h-3.5 w-3.5" /> Informações Básicas
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">Título</Label>
                  <Input placeholder="Título do evento" value={title} onChange={e => setTitle(e.target.value)} className="rounded-xl h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">Tipo de Evento</Label>
                  <Select value={eventType} onValueChange={setEventType}>
                    <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Compromisso Simples</SelectItem>
                      <SelectItem value="course">Curso</SelectItem>
                      <SelectItem value="conference">Conferência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">Local</Label>
                  <Input placeholder="Onde será o evento?" value={location} onChange={e => setLocation(e.target.value)} className="rounded-xl h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">Link do Mapa (opcional)</Label>
                  <Input placeholder="https://maps.google.com/..." value={mapUrl} onChange={e => setMapUrl(e.target.value)} className="rounded-xl h-11" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Descrição</Label>
                <Textarea placeholder="Breve descritivo..." value={desc} onChange={e => setDesc(e.target.value)} rows={3} className="rounded-2xl resize-none" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground border-b pb-2">
                <ImagePlus className="h-3.5 w-3.5" /> Banner do Evento
              </div>
              <div className="flex gap-3">
                <Input placeholder="URL da imagem..." value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} className="flex-1 rounded-xl h-11" />
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                <Button variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="rounded-xl px-6">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                  {uploading ? "Sendo..." : "Upload"}
                </Button>
              </div>
              {bannerUrl && (
                <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-muted shadow-inner bg-muted/20">
                  <img src={bannerUrl} className="w-full h-full object-cover" />
                  <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8 rounded-full" onClick={() => setBannerUrl("")}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {(eventType === "course" || eventType === "conference") && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground border-b pb-2">
                  <Ticket className="h-3.5 w-3.5" /> Detalhes do {EVENT_TYPE_LABELS[eventType]}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">Palestrantes</Label>
                  <Input placeholder="Nomes separados por vírgula" value={speakers} onChange={e => setSpeakers(e.target.value)} className="rounded-xl h-11" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase">Valor (R$) — 0 se gratuito</Label>
                    <Input type="number" min={0} step={0.01} value={price} onChange={e => setPrice(Number(e.target.value))} className="rounded-xl h-11" />
                  </div>
                  {price > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase">Chave PIX</Label>
                      <Input placeholder="email@, CPF, telefone..." value={pixKey} onChange={e => setPixKey(e.target.value)} className="rounded-xl h-11" />
                    </div>
                  )}
                </div>
                {price > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase">URL QR Code PIX (opcional)</Label>
                    <Input placeholder="https://..." value={pixQrcodeUrl} onChange={e => setPixQrcodeUrl(e.target.value)} className="rounded-xl h-11" />
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground border-b pb-2">
                <Settings className="h-3.5 w-3.5" /> Configurações de Data e Visibilidade
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-primary">Data e Hora do Evento</Label>
                  <Input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="rounded-xl h-11 border-primary/30 bg-primary/5" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">Escopo de Visibilidade</Label>
                  <Select
                    value={isGeneral}
                    onValueChange={(v) => { setIsGeneral(v); if (v === "true") setGroupId(""); }}
                    disabled={!isAdmin}
                  >
                    <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {isAdmin && <SelectItem value="true">Evento Geral</SelectItem>}
                      <SelectItem value="false">Evento de Grupo (Departamento)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isGeneral === "false" && (
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">Selecione o Departamento / Grupo</Label>
                  <Select value={groupId || ""} onValueChange={setGroupId}>
                    <SelectTrigger className="rounded-xl h-11">
                      <SelectValue placeholder="Escolha o departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups?.filter(g => isAdmin || userGroups?.includes(g.id)).map((group) => (
                        <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {isAdmin && (
                <div className="flex items-center justify-between p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-xl">
                      <QrCode className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Check-in via QR Code</p>
                      <p className="text-[10px] text-muted-foreground">Gera QR Code para confirmar presença automaticamente</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requireCheckin}
                      onChange={(e) => setRequireCheckin(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                  </label>
                </div>
              )}

              {/* Tornar público — visível para eventos de grupo também */}
              <div className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-200 ${isPublic ? "bg-blue-500/10 border-blue-500/40" : "bg-muted/20 border-border"}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl transition-colors ${isPublic ? "bg-blue-500/20 text-blue-600" : "bg-muted text-muted-foreground"}`}>
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Tornar público na Landing Page</p>
                    <p className="text-[10px] text-muted-foreground">
                      {isGeneral === "true"
                        ? "Eventos gerais já aparecem publicamente."
                        : "Permite que este evento de departamento apareça para qualquer visitante do site."}
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublic || isGeneral === "true"}
                    disabled={isGeneral === "true"}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full transition-colors ${isGeneral === "true" ? "bg-blue-400 cursor-not-allowed opacity-60" : "bg-muted peer-checked:bg-blue-500"}`} />
                </label>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 pb-2">
            <Button variant="outline" onClick={() => { setCreatingEvent(false); setEditingEvent(null); }} className="rounded-xl border-2">Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!title || !date || saveMutation.isPending} className="rounded-xl px-12 font-bold">
              {saveMutation.isPending ? "Salvando..." : editingEvent ? "Salvar Alterações" : "Criar Evento Agora"}
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

      <ConfirmDialog
        open={!!deletingEvent}
        title="Excluir Evento"
        description={`Deseja realmente excluir o evento "${deletingEvent?.title}"?`}
        confirmLabel="Excluir"
        variant="danger"
        onConfirm={() => deleteMutation.mutate(deletingEvent?.id)}
        onCancel={() => setDeletingEvent(null)}
      />

      <ConfirmDialog
        open={!!cancelingRegistration}
        title="Cancelar Inscrição"
        description={`Tem certeza que deseja cancelar sua inscrição no evento "${cancelingRegistration?.title}"?`}
        confirmLabel="Sim, Cancelar"
        variant="danger"
        onConfirm={() => cancelRegistrationMutation.mutate(cancelingRegistration?.id)}
        onCancel={() => setCancelingRegistration(null)}
      />

      <Dialog open={!!rsvpViewEvent} onOpenChange={val => !val && setRsvpViewEvent(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader><DialogTitle>Controle de Presença: {rsvpViewEvent?.title}</DialogTitle></DialogHeader>
          <div className="py-2 max-h-[500px] overflow-y-auto pr-2">
            <RsvpList event={rsvpViewEvent} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRsvpViewEvent(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      <Dialog open={!!qrProjectEvent} onOpenChange={v => !v && setQrProjectEvent(null)}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2">
              <QrCode className="h-5 w-5" /> QR Code — {qrProjectEvent?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-6 py-6">
            <div className="bg-white p-6 rounded-3xl shadow-2xl">
              <QRCodeSVG value={qrProjectEvent?.checkin_qr_secret || ""} size={280} level="H" />
            </div>
            <p className="text-sm text-muted-foreground">Projete este QR Code no telão para os membros escanearem</p>
          </div>
        </DialogContent>
      </Dialog>

      {scanningEvent && (
        <QRScanner
          onScan={async (decoded) => {
            setScanningEvent(null);
            if (decoded === scanningEvent.checkin_qr_secret) {
              try {
                const { error } = await (supabase as any).from("event_checkins").insert(
                  { event_id: scanningEvent.id, user_id: user!.id }
                );
                if (error && error.code !== "23505") throw error;
                toast({ title: "✅ Presença confirmada!", description: `Check-in registrado para "${scanningEvent.title}".` });
                logAudit("create", "event_checkin", { eventId: scanningEvent.id, eventTitle: scanningEvent.title });
                queryClient.invalidateQueries({ queryKey: ["events"] });
              } catch (err: any) {
                toast({ title: "Erro no check-in", description: err.message, variant: "destructive" });
              }
            } else {
              toast({ title: "QR Code inválido", description: "Este QR Code não corresponde ao evento.", variant: "destructive" });
            }
          }}
          onClose={() => setScanningEvent(null)}
        />
      )}
    </div>
  );
};

/* ─── Sub-components ─────────────────────────────────────────────────────── */

const RsvpList = ({ event }: { event: any }) => {
  const { data: usersData, isLoading } = useQuery({
    queryKey: ["rsvp-full-list", event?.id],
    queryFn: async () => {
      if (!event) return [];

      if (event.require_checkin) {
        const { data: regs } = await (supabase as any)
          .from("event_registrations").select("user_id").eq("event_id", event.id);
        const { data: checkins } = await supabase
          .from("event_checkins").select("user_id").eq("event_id", event.id);
        const checkinSet = new Set(checkins?.map((c: any) => c.user_id) || []);
        const userIds = regs?.map((r: any) => r.user_id) || [];
        if (userIds.length === 0) return [];
        const { data: profiles } = await supabase
          .from("profiles").select("user_id, full_name").in("user_id", userIds);
        const nameMap = new Map(profiles?.map(p => [p.user_id, p.full_name]));
        return userIds.map((uid: string) => ({
          user_id: uid,
          name: nameMap.get(uid) || "Membro",
          status: checkinSet.has(uid) ? "checked_in" : "pending",
        }));
      }

      let relevantProfiles: any[] = [];
      if (event.is_general) {
        const { data } = await supabase.from("profiles").select("user_id, full_name").order("full_name");
        relevantProfiles = data || [];
      } else if (event.group_id) {
        const { data: gm } = await supabase
          .from("member_groups").select("user_id, profiles(full_name)").eq("group_id", event.group_id);
        relevantProfiles = gm?.map(m => ({
          user_id: m.user_id,
          full_name: (m.profiles as any)?.full_name || "Membro",
        })) || [];
      }

      const { data: rsvps } = await supabase
        .from("event_rsvps").select("user_id, status").eq("event_id", event.id);
      const rsvpMap = new Map(rsvps?.map(r => [r.user_id, r.status]));

      return relevantProfiles.map(p => ({
        user_id: p.user_id,
        name: p.full_name,
        status: rsvpMap.get(p.user_id) || "pending",
      }));
    },
    enabled: !!event,
  });

  if (isLoading) return (
    <div className="flex justify-center p-8">
      <span className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
    </div>
  );

  if (!event) return null;

  if (event.require_checkin) {
    const checked = usersData?.filter(u => u.status === "checked_in") || [];
    const pending = usersData?.filter(u => u.status === "pending") || [];
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400">
            <ScanLine className="h-4 w-4" /> {checked.length} check-in{checked.length !== 1 ? "s" : ""}
          </div>
          <span className="text-muted-foreground">·</span>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-600 dark:text-amber-400">
            <Clock className="h-4 w-4" /> {pending.length} pendente{pending.length !== 1 ? "s" : ""}
          </div>
          <span className="text-muted-foreground">·</span>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-4 w-4" /> {usersData?.length || 0} inscrito{(usersData?.length || 0) !== 1 ? "s" : ""}
          </div>
        </div>
        <RsvpSection label="Fizeram Check-in" items={checked} color="blue" icon={<ScanLine className="h-4 w-4" />} />
        <RsvpSection label="Inscritos — Pendentes" items={pending} color="amber" icon={<Clock className="h-4 w-4" />} />
      </div>
    );
  }

  const confirmed = usersData?.filter(u => u.status === "confirmed") || [];
  const declined = usersData?.filter(u => u.status === "declined") || [];
  const pending = usersData?.filter(u => u.status === "pending") || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
          <Check className="h-4 w-4" /> {confirmed.length} confirmado{confirmed.length !== 1 ? "s" : ""}
        </div>
        <span className="text-muted-foreground">·</span>
        <div className="flex items-center gap-1.5 text-sm font-semibold text-rose-600 dark:text-rose-400">
          <X className="h-4 w-4" /> {declined.length} não vai{declined.length !== 1 ? "o" : ""}
        </div>
        <span className="text-muted-foreground">·</span>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" /> {pending.length} pendente{pending.length !== 1 ? "s" : ""}
        </div>
      </div>
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
      {items.length === 0
        ? <p className="text-xs text-muted-foreground italic px-2">Nenhum</p>
        : items.map(u => (
            <div key={u.user_id} className="text-[13px] px-3 py-2 bg-muted/50 rounded-lg font-medium">{u.name}</div>
          ))
      }
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
      const { data } = await (supabase as any)
        .from("event_registrations").select("*").eq("event_id", event.id);
      if (!data) return [];

      // ── FIX 3: checkinSet calculado aqui dentro do sub-componente ──
      let checkinSet = new Set<string>();
      if (event.require_checkin) {
        const { data: checkins } = await supabase
          .from("event_checkins").select("user_id").eq("event_id", event.id);
        checkinSet = new Set(checkins?.map((c: any) => c.user_id) || []);
      }

      const userIds = data.map((r: any) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles").select("user_id, full_name").in("user_id", userIds);
      const nameMap = new Map(profiles?.map(p => [p.user_id, p.full_name]));

      return data.map((r: any) => ({
        ...r,
        name: nameMap.get(r.user_id) || "Membro",
        checked_in: checkinSet.has(r.user_id),
      }));
    },
    enabled: !!event,
  });

  const updatePayment = async (id: string, status: string) => {
    await (supabase as any).from("event_registrations").update({ payment_status: status }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["event-registrations", event?.id] });
    toast({ title: `Status atualizado para ${status}` });
  };

  if (isLoading) return (
    <div className="flex justify-center p-8">
      <span className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
    </div>
  );

  // Resumo de check-ins calculado a partir dos dados já carregados
  const checkedInCount = registrations?.filter(r => r.checked_in).length || 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 mb-3">
        <p className="text-sm text-muted-foreground">{registrations?.length || 0} inscrito(s)</p>
        {event.require_checkin && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full font-semibold border border-blue-100 dark:border-blue-900/50 text-xs">
              <ScanLine className="h-3 w-3" /> {checkedInCount} check-in{checkedInCount !== 1 ? "s" : ""}
            </div>
          </div>
        )}
      </div>
      {registrations?.map((r: any) => (
        <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 bg-muted/50 rounded-lg px-3 py-2">
          <div className="flex flex-col">
            <span className="text-sm font-medium">{r.name}</span>
            {event.require_checkin && (
              <span className={`text-[10px] font-semibold ${r.checked_in ? "text-blue-600" : "text-amber-600"}`}>
                {r.checked_in ? "✓ Check-in feito" : "Pendente"}
              </span>
            )}
          </div>
          {event.price > 0 ? (
            <Select value={r.payment_status} onValueChange={v => updatePayment(r.id, v)}>
              <SelectTrigger className="w-32 h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="confirmed">Pago</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Badge variant="outline" className="text-[10px]">Gratuito</Badge>
          )}
        </div>
      ))}
      {(!registrations || registrations.length === 0) && (
        <p className="text-xs text-muted-foreground text-center py-4">Nenhum inscrito ainda.</p>
      )}
    </div>
  );
};

export default Agenda;