import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
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
import QRScanner from "@/components/QRScanner";
import { ShareEventDialog } from "@/components/ShareEventDialog";
import { EventNotifyDialog } from "@/components/EventNotifyDialog";
import { getErrorMessage } from "@/lib/errorMessages";

// ─── WhatsApp Icon SVG ────────────────────────────────────────────────────────
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

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

const WA_API = import.meta.env.VITE_WA_API_URL || "http://localhost:3002";

// ─── Agenda principal ─────────────────────────────────────────────────────────
const Agenda = () => {
  const { user, isAdmin, isGerente, managedGroupIds, userGroupIds } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
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

  // WhatsApp notify state
  const [notifyingEvent, setNotifyingEvent] = useState<any>(null);

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
  const [pendingRsvp, setPendingRsvp] = useState<{ eventId: string; status: string } | null>(null);
  const [isPublic, setIsPublic] = useState(false);

  const { data: userGroups } = useQuery({
    queryKey: ["user-groups", user?.id],
    enabled: !!user && !isAdmin,
    queryFn: async () => {
      const { data } = await api.get('/member-groups');
      return data?.map((m: any) => m.groupId) || [];
    },
  });

  const { data: groups } = useQuery({
    queryKey: ["groups", isAdmin, userGroups],
    queryFn: async () => {
      const { data } = await api.get('/groups');
      let filtered = data || [];
      if (!isAdmin && userGroups) {
        if (userGroups.length === 0) return [];
        filtered = filtered.filter(g => userGroups.includes(g.id));
      }
      return filtered || [];
    },
    enabled: !!user && (isAdmin || !!userGroups),
  });

  const { data: events } = useQuery({
    queryKey: ["events", filter, userGroupIds, isAdmin],
    queryFn: async () => {
      const { data } = await api.get('/events');
      let filtered = data || [];

      if (filter !== "all") {
        filtered = filtered.filter((e: any) => e.groupId === filter);
      } else if (!isAdmin) {
        filtered = filtered.filter((e: any) => e.isGeneral || userGroupIds.includes(e.groupId));
      }

      return filtered.map((e: any) => ({
        ...e,
        eventDate: e.eventDate,
        isGeneral: e.isGeneral,
        groupId: e.groupId,
        eventType: e.eventType,
        bannerUrl: e.bannerUrl,
        pixKey: e.pixKey,
        pixQrcodeUrl: e.pixQrcodeUrl,
        mapUrl: e.mapUrl,
        requireCheckin: e.requireCheckin,
        isPublic: e.isPublic,
        checkinQrSecret: e.checkinQrSecret,
        rsvps: e.rsvps || [],
        checkins: e.checkins || [],
        registrations: e.registrations || [],
        groups: e.group,
      })).sort((a: any, b: any) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
    },
    refetchInterval: 15000,
  });

  const showFilters = isAdmin || (groups && groups.length > 1);

  // ─── WhatsApp notify ──────────────────────────────────────────────────────
  const handleNotifyWhatsApp = (event: any) => {
    setNotifyingEvent(event);
  };

  // ─── Mutations ────────────────────────────────────────────────────────────
  const rsvpMutation = useMutation({
    mutationFn: async ({ eventId, status }: { eventId: string; status: string }) => {
      await api.post('/event-rsvps', { eventId, userId: user!.id, status });
    },
    onMutate: async ({ eventId, status }) => {
      setPendingRsvp({ eventId, status });
    },
    onSettled: () => {
      setPendingRsvp(null);
      queryClient.invalidateQueries({ queryKey: ["events"], exact: false });
    },
    onSuccess: () => {
      toast({ title: "Presença atualizada!" });
    },
    onError: (err: any) => {
      setPendingRsvp(null);
      toast({ title: "Falha ao atualizar presença", description: getErrorMessage(err), variant: "destructive" });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (eventId: string) => {
      await api.post('/event-registrations', { eventId, userId: user?.id, paymentStatus: "pending" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({ title: "Inscrição realizada!" });
    },
    onError: (err: any) => toast({ title: "Erro na inscrição", description: getErrorMessage(err), variant: "destructive" }),
  });

  const cancelRegistrationMutation = useMutation({
    mutationFn: async (eventId: string) => {
      await api.delete('/event-registrations', { params: { eventId, userId: user?.id } });
      await api.delete('/event-checkins', { params: { eventId, userId: user?.id } }).catch(()=>{});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({ title: "Inscrição cancelada com sucesso!" });
      setCancelingRegistration(null);
    },
    onError: (err: any) => toast({ title: "Erro ao cancelar", description: getErrorMessage(err), variant: "destructive" }),
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
      const formData = new FormData();
      formData.append('file', file);
      const { data: uploadData } = await api.post('/upload', formData);
      setBannerUrl(uploadData.url);
      toast({ title: "Banner carregado com sucesso!" });
    } catch (err: any) {
      toast({ title: "Erro no upload", description: getErrorMessage(err), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (ev: any) => {
    setEditingEvent(ev);
    setTitle(ev.title || "");
    setDesc(ev.description || "");
    setLocation(ev.location || "");
    setIsGeneral(ev.isGeneral ? "true" : "false");
    setGroupId(ev.groupId || "");
    setEventType(ev.eventType || "simple");
    setBannerUrl(ev.bannerUrl || "");
    setSpeakers(ev.speakers || "");
    setPrice(ev.price || 0);
    setPixKey(ev.pixKey || "");
    setPixQrcodeUrl(ev.pixQrcodeUrl || "");
    setMapUrl(ev.mapUrl || "");
    setRequireCheckin(ev.requireCheckin || false);
    setIsPublic(ev.isPublic || false);
    if (ev.eventDate) {
      const d = new Date(ev.eventDate);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      setDate(d.toISOString().slice(0, 16));
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const camelPayload = {
        title,
        description: desc,
        eventDate: date ? new Date(date).toISOString() : null,
        location,
        isGeneral: isGeneral === "true",
        groupId: isGeneral === "false" && groupId ? groupId : null,
        createdBy: user?.id,
        eventType,
        bannerUrl: bannerUrl.trim() || null,
        speakers: speakers.trim() || null,
        price: price || 0,
        pixKey: pixKey.trim() || null,
        pixQrcodeUrl: pixQrcodeUrl.trim() || null,
        mapUrl: mapUrl.trim() || null,
        requireCheckin,
        isPublic,
        checkinQrSecret: requireCheckin ? (editingEvent?.checkinQrSecret || generateSafeId()) : null,
      };
      if (editingEvent) {
        await api.patch(`/events/${editingEvent.id}`, camelPayload);
      } else {
        await api.post('/events', camelPayload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setEditingEvent(null);
      setCreatingEvent(false);
      resetForm();
      toast({ title: editingEvent ? "Evento atualizado!" : "Evento criado!" });
    },
    onError: (err: any) => toast({ title: "Erro", description: getErrorMessage(err), variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/events/${id}`);
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
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 pb-20 md:pb-8">
      <div className="sticky top-14 z-20 -mx-4 px-4 py-3 md:static md:p-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 border-b md:border-0">
        <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" />
          Agenda
        </h1>
        {(isAdmin || isGerente) && (
          <Button onClick={() => { resetForm(); setCreatingEvent(true); }} size="sm" className="md:h-10">
            <Plus className="h-4 w-4 mr-1" /> Novo Evento
          </Button>
        )}
      </div>
      </div>

      {showFilters && (
        <div className="flex gap-2 pb-2 overflow-x-auto no-scrollbar">
          <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>Todos</Button>
          {groups?.map(g => (
            <Button key={g.id} variant={filter === g.id ? "default" : "outline"} size="sm" onClick={() => setFilter(g.id)} className="shrink-0">
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
          const userRsvp = event.rsvps?.find((r: any) => r.userId === user?.id);
          const confirmed = event.rsvps?.filter((r: any) => r.status === "confirmed").length || 0;
          const declined = event.rsvps?.filter((r: any) => r.status === "declined").length || 0;
          const checkedInCount = event.checkins?.length || 0;
          const isComplex = event.eventType === "course" || event.eventType === "conference";
          const isPaid = event.price > 0;
          const isRegistered = event.registrations?.some((r: any) => r.userId === user?.id);
          const hasCheckedIn = event.checkins?.some((c: any) => c.userId === user?.id);
          const canManageEvent = isAdmin || (isGerente && event.groupId && managedGroupIds.includes(event.groupId));
          const isSendingNotify = notifyingEvent?.id === event.id;

          return (
            <Card key={event.id} className={`neo-shadow-sm border-0 overflow-hidden ${isComplex ? "ring-1 ring-primary/20" : ""}`}>
              {event.bannerUrl && (
                <div className="w-full h-40 overflow-hidden">
                  <img src={event.bannerUrl} alt={event.title} className="w-full h-full object-cover" />
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`text-[10px] ${EVENT_TYPE_COLORS[event.eventType] || EVENT_TYPE_COLORS.simple}`}>
                        {EVENT_TYPE_LABELS[event.eventType] || "Compromisso"}
                      </Badge>
                      <Badge variant={event.isGeneral ? "default" : "secondary"} className="text-[10px]">
                        {event.isGeneral ? "Geral" : (event.groups?.name || "Grupo")}
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
                      {safeFormat(event.eventDate, "dd/MM/yyyy 'às' HH:mm")}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 mt-0.5 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{event.location}</span>
                        {event.mapUrl && (
                          <a href={event.mapUrl} target="_blank" rel="noopener noreferrer" className="text-primary text-xs underline ml-1">
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
                    {!event.requireCheckin && (
                      <>
                        <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-semibold border border-emerald-100 dark:border-emerald-900/50">
                          <Check className="h-3 w-3" /> {confirmed}
                        </div>
                        <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded-full font-semibold border border-rose-100 dark:border-rose-900/50">
                          <X className="h-3 w-3" /> {declined}
                        </div>
                      </>
                    )}
                    {event.requireCheckin && (
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
                    {event.eventType !== "conference" && !event.requireCheckin && (
                      <>
                        <Button
                          size="sm"
                          variant={userRsvp?.status === "confirmed" ? "default" : "outline"}
                          disabled={userRsvp?.status === "confirmed" || (pendingRsvp?.eventId === event.id && pendingRsvp.status === "confirmed")}
                          onClick={() => rsvpMutation.mutate({ eventId: event.id, status: "confirmed" })}
                        >
                          {pendingRsvp?.eventId === event.id && pendingRsvp.status === "confirmed" ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Confirmando...
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              {userRsvp?.status === "confirmed" ? "Confirmado" : "Vou"}
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant={userRsvp?.status === "declined" ? "destructive" : "outline"}
                          disabled={userRsvp?.status === "declined" || (pendingRsvp?.eventId === event.id && pendingRsvp.status === "declined")}
                          onClick={() => rsvpMutation.mutate({ eventId: event.id, status: "declined" })}
                        >
                          {pendingRsvp?.eventId === event.id && pendingRsvp.status === "declined" ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Cancelando...
                            </>
                          ) : (
                            <>
                              <X className="h-4 w-4 mr-1" /> Não vou
                            </>
                          )}
                        </Button>
                      </>
                    )}
                    {isPaid && event.pixKey && (
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

                    {/* ── Botão WhatsApp Aviso — visível apenas para admin/gerente ── */}
                    {canManageEvent && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isSendingNotify}
                        onClick={() => handleNotifyWhatsApp(event)}
                        className="gap-1.5 border-green-400 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 hover:border-green-500"
                        title={`Avisar via WhatsApp (${event.isGeneral ? "Geral" : event.groups?.name || "Grupo"})`}
                      >
                        {isSendingNotify ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <WhatsAppIcon className="h-4 w-4" />
                        )}
                        {isSendingNotify ? "Enviando..." : "Avisar"}
                      </Button>
                    )}

                    <Button size="sm" variant="outline" onClick={() => setSharingEvent(event)} className="gap-1">
                      <Share2 className="h-4 w-4" /> Compartilhar
                    </Button>
                    {event.requireCheckin && isRegistered && (
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
                {isAdmin && event.requireCheckin && event.checkinQrSecret && (
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

      {/* WhatsApp Notify Dialog */}
      <EventNotifyDialog 
        event={notifyingEvent}
        open={!!notifyingEvent}
        onClose={() => setNotifyingEvent(null)}
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

              <div className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-200 ${isPublic ? "bg-blue-500/10 border-blue-500/40" : "bg-muted/20 border-border"}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl transition-colors ${isPublic ? "bg-blue-500/20 text-blue-600" : "bg-muted text-muted-foreground"}`}>
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Tornar público na Landing Page</p>
                    <p className="text-[10px] text-muted-foreground">
                      Permite que este evento apareça para qualquer visitante do site na agenda pública.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full transition-colors bg-muted peer-checked:bg-blue-500`} />
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
            {pixDialogEvent?.pixQrcodeUrl && (
              <img src={pixDialogEvent.pixQrcodeUrl} alt="QR Code PIX" className="mx-auto w-48 h-48 rounded-lg border" />
            )}
            {pixDialogEvent?.pixKey && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Chave PIX:</p>
                <div className="flex items-center gap-2 justify-center">
                  <code className="bg-muted px-3 py-1.5 rounded text-sm break-all">{pixDialogEvent.pixKey}</code>
                  <Button variant="outline" size="icon" onClick={() => copyPix(pixDialogEvent.pixKey)}>
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
              <QRCodeSVG value={qrProjectEvent?.checkinQrSecret || ""} size={280} level="H" />
            </div>
            <p className="text-sm text-muted-foreground">Projete este QR Code no telão para os membros escanearem</p>
          </div>
        </DialogContent>
      </Dialog>

      {scanningEvent && (
        <QRScanner
          onScan={async (decoded) => {
            setScanningEvent(null);
            if (decoded === scanningEvent.checkinQrSecret) {
              try {
                await api.post("/event-checkins", 
                  { eventId: scanningEvent.id, userId: user!.id }
                );
                if (error && error.code !== "23505") throw error;
                toast({ title: "✅ Presença confirmada!", description: `Check-in registrado para "${scanningEvent.title}".` });
                queryClient.invalidateQueries({ queryKey: ["events"] });
              } catch (err: any) {
                toast({ title: "Erro no check-in", description: getErrorMessage(err), variant: "destructive" });
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

/* ─── Sub-components (sem alterações) ───────────────────────────────────────── */

const RsvpList = ({ event }: { event: any }) => {
  const { data: usersData, isLoading } = useQuery({
    queryKey: ["rsvp-full-list", event?.id],
    queryFn: async () => {
      if (!event) return [];

      if (event.requireCheckin) {
        const { data: regs } = await api.get(`/event-registrations`, { params: { eventId: event.id } });
        const { data: checkins } = await api.get('/event-checkins', { params: { eventId: event.id } });
        const checkinSet = new Set(checkins?.map((c: any) => c.userId) || []);
        const userIds = regs?.map((r: any) => r.userId) || [];
        if (userIds.length === 0) return [];
        const { data: profiles } = await api.get('/profiles');
        const nameMap = new Map(profiles?.map((p: any) => [p.userId, p.fullName]));
        return userIds.map((uid: string) => ({
          userId: uid,
          name: nameMap.get(uid) || "Membro",
          status: checkinSet.has(uid) ? "checkedIn" : "pending",
        }));
      }

      let relevantProfiles: any[] = [];
      if (event.isGeneral) {
        const { data } = await api.get('/profiles');
        relevantProfiles = data || [];
      } else if (event.groupId) {
        const { data: gm } = await api.get('/member-groups', { params: { groupId: event.groupId } });
        const { data: profiles } = await api.get('/profiles');
        const nameMap = new Map(profiles?.map((p: any) => [p.userId, p.fullName]));
        relevantProfiles = gm?.map((m: any) => ({
          userId: m.userId,
          fullName: nameMap.get(m.userId) || "Membro",
        })) || [];
      }

      const { data: rsvps } = await api.get('/event-rsvps', { params: { eventId: event.id } });
      const rsvpMap = new Map(rsvps?.map((r: any) => [r.userId, r.status]));

      return relevantProfiles.map(p => ({
        userId: p.userId,
        name: p.fullName,
        status: rsvpMap.get(p.userId) || "pending",
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

  if (event.requireCheckin) {
    const checked = usersData?.filter(u => u.status === "checkedIn") || [];
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
            <div key={u.userId} className="text-[13px] px-3 py-2 bg-muted/50 rounded-lg font-medium">{u.name}</div>
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
      const { data } = await api.get('/event-registrations', { params: { eventId: event.id } });
      if (!data) return [];

      let checkinSet = new Set<string>();
      if (event.requireCheckin) {
        const { data: checkins } = await api.get('/event-checkins', { params: { eventId: event.id } });
        checkinSet = new Set(checkins?.map((c: any) => c.userId) || []);
      }

      const userIds = data.map((r: any) => r.userId);
      const { data: profiles } = await api.get('/profiles');
      const nameMap = new Map(profiles?.map((p: any) => [p.userId, p.fullName]));

      return data.map((r: any) => ({
        ...r,
        name: nameMap.get(r.userId) || "Membro",
        checkedIn: checkinSet.has(r.userId),
      }));
    },
    enabled: !!event,
  });

  const updatePayment = async (id: string, status: string) => {
    await api.patch(`/event-registrations/${id}`, { paymentStatus: status });
    queryClient.invalidateQueries({ queryKey: ["event-registrations", event?.id] });
    toast({ title: `Status atualizado para ${status}` });
  };

  if (isLoading) return (
    <div className="flex justify-center p-8">
      <span className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
    </div>
  );

  if (!event) return null;

  const checkedInCount = registrations?.filter(r => r.checkedIn).length || 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 mb-3">
        <p className="text-sm text-muted-foreground">{registrations?.length || 0} inscrito(s)</p>
        {event.requireCheckin && (
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
            {event.requireCheckin && (
              <span className={`text-[10px] font-semibold ${r.checkedIn ? "text-blue-600" : "text-amber-600"}`}>
                {r.checkedIn ? "✓ Check-in feito" : "Pendente"}
              </span>
            )}
          </div>
          {event.price > 0 ? (
            <Select value={r.paymentStatus} onValueChange={v => updatePayment(r.id, v)}>
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