import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Copy, MessageCircle, CheckCheck } from "lucide-react";
import { safeFormat } from "@/lib/dateUtils";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ShareEventDialogProps {
  event: any;
  open: boolean;
  onClose: () => void;
  landingPageUrl?: string;
}

export const ShareEventDialog = ({ event, open, onClose, landingPageUrl }: ShareEventDialogProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!event) return null;

  // ── URL pública do evento ──────────────────────────────────────────────────
  // Se tiver landing page configurada, usa ela; senão usa a rota /agenda com query param
  const baseUrl = landingPageUrl
    ? landingPageUrl.replace(/\/$/, "")
    : window.location.origin;

  const eventUrl = `${baseUrl}/landing#agenda`;
  //const eventUrl = `${baseUrl}/agenda?event=${event.id}`; para o evnto direto
  // como a agenda fica disponível na landing page,você pode colocar 
  //const eventUrl = `${baseUrl}/landing#agenda`; para acessar direto a agenda

  // ── Data formatada ─────────────────────────────────────────────────────────
  const dataFormatada = event.event_date
    ? safeFormat(event.event_date, "dd/MM/yyyy 'às' HH:mm")
    : "Data a confirmar";

  // ── Tipo do evento ─────────────────────────────────────────────────────────
  const tipoEmoji: Record<string, string> = {
    simple: "📌",
    course: "📚",
    conference: "🎤",
  };

  const tipo = tipoEmoji[event.event_type] || "📌";

  // ── Mensagem do WhatsApp formatada corretamente ────────────────────────────
  const buildWhatsAppMessage = () => {
    const lines: string[] = [];

    lines.push(`${tipo} *${event.title}*`);
    lines.push("");
    lines.push(`📅 ${dataFormatada}`);

    if (event.location) {
      lines.push(`📍 ${event.location}`);
    }

    if (event.speakers) {
      lines.push(`🎙️ ${event.speakers}`);
    }

    if (event.price > 0) {
      lines.push(`💰 R$ ${Number(event.price).toFixed(2)}`);
    } else {
      lines.push(`✅ Entrada gratuita`);
    }

    if (event.description) {
      lines.push("");
      lines.push(event.description);
    }

    lines.push("");
    lines.push(`🔗 Confira os detalhes e inscreva-se:`);
    lines.push(eventUrl);

    return lines.join("\n");
  };

  const handleWhatsApp = () => {
    const msg = buildWhatsAppMessage();
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(eventUrl);
    setCopied(true);
    toast({ title: "Link copiado!" });
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl rounded-3xl border-0 shadow-2xl p-0 overflow-hidden bg-background">
        <DialogHeader className="px-6 pt-8 pb-2">
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Compartilhar Evento
          </DialogTitle>
          <p className="text-sm text-muted-foreground text-center mt-1">
            Convide as pessoas para participarem deste evento especial!
          </p>
        </DialogHeader>

        <div className="px-6 pb-8 pt-4 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left Column: Event Card Preview */}
          <div className="space-y-4 h-full">
            <div className="relative group overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-3xl p-6 shadow-xl backdrop-blur-md h-full flex flex-col justify-between">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 <Calendar className="h-24 w-24 -mr-8 -mt-8" />
              </div>
              
              <div className="space-y-3 relative z-10">
                <Badge variant="secondary" className="bg-primary/20 text-primary border-0 font-bold px-3 py-1">
                  {event.event_type === 'course' ? 'CURSO' : event.event_type === 'conference' ? 'CONFERÊNCIA' : 'EVENTO'}
                </Badge>
                <h3 className="font-extrabold text-2xl leading-tight tracking-tight">{event.title}</h3>
                
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center gap-3 text-sm font-medium text-foreground/80">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <span>{dataFormatada}</span>
                  </div>
                  
                  {event.location && (
                    <div className="flex items-center gap-3 text-sm font-medium text-foreground/80">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <span className="line-clamp-2">{event.location}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6 relative z-10 flex items-center justify-between">
                {event.price > 0 ? (
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Investimento</span>
                    <span className="text-xl font-black text-primary">R$ {Number(event.price).toFixed(2)}</span>
                  </div>
                ) : (
                  <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-1.5 rounded-xl border-0">
                    ENTRADA FRANCA
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: QR Code & Actions */}
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-3 border-2 border-dashed border-primary/20 rounded-3xl p-6 bg-white dark:bg-zinc-900 shadow-inner">
              <div className="p-2 bg-white rounded-xl shadow-sm">
                <QRCodeSVG
                  value={eventUrl}
                  size={150}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">
                  Escaneie para acessar
                </p>
                <p className="text-[9px] text-muted-foreground max-w-[150px] leading-tight">
                  Acesse detalhes, localização e faça sua inscrição pelo site oficial.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Button
                onClick={handleWhatsApp}
                className="w-full h-14 rounded-2xl bg-[#25D366] hover:bg-[#1ebe5d] text-white font-black text-base gap-3 shadow-lg shadow-green-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <MessageCircle className="h-6 w-6 fill-white" />
                CONVIDAR POR WHATSAPP
              </Button>

              <Button
                variant="outline"
                onClick={handleCopy}
                className="w-full h-14 rounded-2xl font-bold gap-3 border-2 hover:bg-muted/50 transition-all active:scale-[0.98]"
              >
                {copied
                  ? <><CheckCheck className="h-5 w-5 text-emerald-500" /> LINK COPIADO COM SUCESSO!</>
                  : <><Copy className="h-5 w-5" /> COPIAR LINK PÚBLICO</>
                }
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};