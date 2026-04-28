import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface VolunteerScheduleNotifyDialogProps {
  schedule: any;
  open: boolean;
  onClose: () => void;
}

// WhatsApp Icon SVG
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

export function VolunteerScheduleNotifyDialog({ schedule, open, onClose }: VolunteerScheduleNotifyDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (schedule && open) {
      const dateStr = schedule.scheduleDate;
      const date = dateStr ? new Date(dateStr) : new Date();
      const formattedDate = date.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Sao_Paulo",
      });

      const scope = schedule.itemUserId 
        ? `Individualmente para ${schedule.profiles?.fullName || "o voluntário"}`
        : schedule.groupId 
          ? `Membros do grupo ${schedule.groups?.name || "sem nome"}` 
          : "Todos os membros";

      let msg = `🔔 *Lembrete de Escala*\n\n`;
      msg += `📅 Data: *${formattedDate}*\n`;
      msg += `👤 Função: *${schedule.roleFunction}*\n`;
      msg += `👥 Responsável: *${schedule.profiles?.fullName || "Não atribuído"}*\n`;
      msg += `🏢 Grupo: *${schedule.groups?.name || "Geral"}*\n\n`;

      msg += `Olá! Este é um lembrete sobre sua escala de voluntariado.\n`;
      msg += `Sua presença é muito importante para nós! 🙌\n\n`;
      msg += `_Mensagem enviada por: ${user?.full_name || "Mergulho Connect - o nosso App Mergulho"}_`;

      setMessage(msg);
    }
  }, [schedule, open, user]);

  const notifyMutation = useMutation({
    mutationFn: async () => {
      const scheduledAt = new Date().toISOString();
      const formData = new FormData();
      formData.append("title", `Lembrete Individual: ${schedule.roleFunction}`);
      formData.append("content", message);

      // Define alvo individual se houver usuário atribuído
      if (schedule.itemUserId) {
        formData.append("type", "individual");
        formData.append("targetUserId", schedule.itemUserId);
      } else if (schedule.groupId) {
        formData.append("type", "group");
        formData.append("targetGroupId", schedule.groupId);
      } else {
        formData.append("type", "general");
      }

      formData.append("priority", "high");

      formData.append("scheduledAt", scheduledAt);
      if (user?.id) formData.append("createdBy", user.id);

      const res = await fetch("/api/dispatches", { method: "POST", body: formData });
      if (!res.ok) {
        let err;
        try {
          err = await res.json();
        } catch (e) {
          throw new Error("Falha ao agendar aviso.");
        }
        const errorMsg = Array.isArray(err.message) ? err.message.join(', ') : err.message;
        throw new Error(errorMsg || err.error || "Falha ao agendar aviso.");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wz-dispatches"] });
      toast({
        title: "✅ Aviso agendado!",
        description: "A mensagem foi enviada para a fila de disparos e será entregue em instantes."
      });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: "Falha ao enviar", description: err.message, variant: "destructive" });
    }
  });

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[550px] rounded-3xl border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <WhatsAppIcon className="h-5 w-5 text-green-500" />
            Notificar Escala via WhatsApp
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-2xl border border-blue-100 dark:border-blue-900/50">
            <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              O aviso será enviado para <strong>{
                schedule?.itemUserId 
                  ? `Individualmente para ${schedule.profiles?.fullName || "o voluntário"}`
                  : schedule?.groupId 
                    ? `Membros do grupo ${schedule.groups?.name || "sem nome"}` 
                    : "Todos os membros"
              }</strong>.
              Você pode ajustar a mensagem abaixo antes de enviar.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Conteúdo da Mensagem</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="h-64 rounded-2xl resize-none focus:ring-2 ring-primary/20 border-border/50 text-sm leading-relaxed"
              placeholder="Digite sua mensagem aqui..."
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl" disabled={notifyMutation.isPending}>
            Cancelar
          </Button>
          <Button
            className="rounded-xl px-6 bg-green-600 hover:bg-green-700 font-bold text-white shadow-md gap-2"
            onClick={() => notifyMutation.mutate()}
            disabled={notifyMutation.isPending || !message.trim()}
          >
            {notifyMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Agendando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Confirmar e Enviar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}