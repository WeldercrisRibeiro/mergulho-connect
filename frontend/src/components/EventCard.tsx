import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Check, X, Share2, Edit2, Trash2, Users, Ticket, QrCode, Mic2, ScanLine, Loader2 } from "lucide-react";
import { safeFormat } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";

// ─── WhatsApp Icon SVG ────────────────────────────────────────────────────────
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
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

interface EventCardProps {
  event: any;
  user: any;
  canManageEvent: boolean;
  onEdit: (ev: any) => void;
  onDelete: (ev: any) => void;
  onRsvp: (eventId: string, status: string) => void;
  onRegister: (eventId: string) => void;
  onCancelRegistration: (event: any) => void;
  onNotify: (event: any) => void;
  onShare: (event: any) => void;
  onCheckin: (event: any) => void;
  onViewRsvps: (event: any) => void;
  onViewRegistrations: (event: any) => void;
  onProjectQr: (event: any) => void;
  onShowPix: (event: any) => void;
  pendingRsvp: { eventId: string; status: string } | null;
  isSendingNotify: boolean;
}

export const EventCard = ({
  event,
  user,
  canManageEvent,
  onEdit,
  onDelete,
  onRsvp,
  onRegister,
  onCancelRegistration,
  onNotify,
  onShare,
  onCheckin,
  onViewRsvps,
  onViewRegistrations,
  onProjectQr,
  onShowPix,
  pendingRsvp,
  isSendingNotify,
}: EventCardProps) => {
  const userRsvp = event.rsvps?.find((r: any) => r.userId === user?.id);
  const confirmed = event.rsvps?.filter((r: any) => r.status === "confirmed").length || 0;
  const declined = event.rsvps?.filter((r: any) => r.status === "declined").length || 0;
  const checkedInCount = event.checkins?.length || 0;
  const isComplex = event.eventType === "course" || event.eventType === "conference";
  const isPaid = event.price > 0;
  const isRegistered = event.registrations?.some((r: any) => r.userId === user?.id);
  const hasCheckedIn = event.checkins?.some((c: any) => c.userId === user?.id);

  return (
    <Card className={cn("neo-shadow-sm border-0 overflow-hidden", isComplex && "ring-1 ring-primary/20")}>
      {event.bannerUrl && (
        <div className="w-full h-40 overflow-hidden">
          <img src={event.bannerUrl} alt={event.title} className="w-full h-full object-cover" />
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={cn("text-[10px]", EVENT_TYPE_COLORS[event.eventType] || EVENT_TYPE_COLORS.simple)}>
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
              <Button variant="ghost" size="icon" onClick={() => onEdit(event)}>
                <Edit2 className="h-4 w-4 text-primary" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete(event)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {event.description && <p className="text-sm text-muted-foreground mb-3">{event.description}</p>}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => onViewRsvps(event)}>
                <Users className="h-3 w-3 mr-1" /> Lista
              </Button>
            )}
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
            {event.eventType !== "conference" && (
              <>
                <Button
                  size="sm"
                  variant={userRsvp?.status === "confirmed" ? "default" : "outline"}
                  disabled={userRsvp?.status === "confirmed" || (pendingRsvp?.eventId === event.id && pendingRsvp.status === "confirmed")}
                  onClick={() => onRsvp(event.id, "confirmed")}
                  className="w-full sm:w-auto"
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
                  onClick={() => onRsvp(event.id, "declined")}
                  className="w-full sm:w-auto"
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
              <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => onShowPix(event)}>
                <QrCode className="h-4 w-4 mr-1" /> PIX
              </Button>
            )}
            {isComplex && (
              isRegistered ? (
                <Button size="sm" variant="destructive" className="w-full sm:w-auto" onClick={() => onCancelRegistration(event)}>
                  <X className="h-4 w-4 mr-1" /> Cancelar Inscrição
                </Button>
              ) : (
                <Button size="sm" variant="secondary" className="w-full sm:w-auto" onClick={() => onRegister(event.id)}>
                  <Ticket className="h-4 w-4 mr-1" /> Inscrever-se
                </Button>
              )
            )}

            {canManageEvent && (
              <Button
                size="sm"
                variant="outline"
                disabled={isSendingNotify}
                onClick={() => onNotify(event)}
                className="w-full gap-1.5 border-green-400 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 hover:border-green-500 sm:w-auto"
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

            <Button size="sm" variant="outline" onClick={() => onShare(event)} className="w-full gap-1 sm:w-auto">
              <Share2 className="h-4 w-4" /> Compartilhar
            </Button>
            {event.requireCheckin && isRegistered && (
              <Button
                size="sm"
                variant={hasCheckedIn ? "default" : "secondary"}
                className="w-full gap-1 sm:w-auto"
                disabled={hasCheckedIn}
                onClick={() => !hasCheckedIn && onCheckin(event)}
              >
                <ScanLine className="h-4 w-4" />
                {hasCheckedIn ? "✓ Check-in feito" : "Check-in"}
              </Button>
            )}
          </div>
        </div>

        {canManageEvent && isComplex && (
          <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => onViewRegistrations(event)}>
            <Ticket className="h-3 w-3 mr-1" /> Ver Inscritos
          </Button>
        )}
        {canManageEvent && event.requireCheckin && event.checkinQrSecret && (
          <Button variant="ghost" size="sm" className="mt-2 text-xs gap-1" onClick={() => onProjectQr(event)}>
            <QrCode className="h-3 w-3" /> Projetar QR Code
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
