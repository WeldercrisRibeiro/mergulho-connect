import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarClock, AlertCircle, ImageIcon, FileText, Mic, Video, Edit3, RefreshCw, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { safeFormat } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";

interface DispatchCardProps {
  dispatch: any;
  isAdmin: boolean;
  onEdit: (d: any) => void;
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
  isRetrying: boolean;
  isDeleting: boolean;
  groups: any[];
  members: any[];
  renderWhatsAppText: (text: string) => React.ReactNode;
}

export const DispatchCard = ({
  dispatch,
  isAdmin,
  onEdit,
  onRetry,
  onDelete,
  isRetrying,
  isDeleting,
  groups,
  members,
  renderWhatsAppText,
}: DispatchCardProps) => {
  const isOverdue = dispatch.status === "pending" && new Date(dispatch.scheduledAt) <= new Date();
  const canEdit = (dispatch.status === "pending" && !isOverdue) || dispatch.status === "error";

  const successCount = dispatch.logs?.filter((l: any) => l.status === "success").length || 0;
  const errorCount = dispatch.logs?.filter((l: any) => l.status === "error").length || 0;
  const hasErrors = errorCount > 0;

  const targetLabel = dispatch.type === "general"
    ? "Geral"
    : dispatch.type === "group"
      ? (groups?.find(g => g.id === dispatch.targetGroupId)?.name || "Departamento")
      : (members?.find(m => m.userId === dispatch.targetUserId)?.fullName || "Membro");

  return (
    <Card className={cn(
      "border-0 shadow-xl rounded-[2rem] overflow-hidden group hover:scale-[1.01] transition-all duration-500 bg-card/40 backdrop-blur-xl border border-white/5",
      dispatch.status === "error" && "ring-1 ring-rose-500/20"
    )}>
      <CardContent className="p-0 flex flex-col md:flex-row gap-0 relative">
        <div className={cn(
          "w-1.5 shrink-0",
          dispatch.status === "pending" && "bg-amber-500",
          dispatch.status === "sending" && "bg-blue-500 animate-pulse",
          dispatch.status === "sent" && "bg-emerald-500",
          dispatch.status === "error" && "bg-rose-500"
        )} />

        <div className="flex-1 p-6">
          <div className="flex flex-col sm:flex-row justify-between gap-2 mb-3">
            <div className="flex flex-wrap items-center gap-2">
              {dispatch.status === "pending" && <Badge variant="outline" className="text-amber-500 bg-amber-500/10 border-amber-500/20 rounded-lg px-2.5 py-0.5">Na Fila</Badge>}
              {dispatch.status === "sending" && <Badge variant="outline" className="text-blue-500 bg-blue-500/10 border-blue-500/20 animate-pulse rounded-lg px-2.5 py-0.5">Enviando...</Badge>}
              {dispatch.status === "sent" && <Badge variant="outline" className="text-emerald-500 bg-emerald-500/10 border-emerald-500/20 rounded-lg px-2.5 py-0.5">Disparado</Badge>}
              {dispatch.status === "error" && <Badge variant="outline" className="text-rose-500 bg-rose-500/10 border-rose-500/20 rounded-lg px-2.5 py-0.5">Falha</Badge>}
              {dispatch.priority === "urgent" && <Badge className="bg-gradient-to-r from-rose-500 to-orange-500 text-white text-[10px] rounded-lg px-2.5 shadow-lg shadow-rose-500/20">Urgente 🚨</Badge>}
            </div>
            <span className="text-[11px] font-bold text-muted-foreground/60 flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-xl border border-white/5">
              <CalendarClock className="h-3.5 w-3.5 text-primary/60" /> Agendado: {safeFormat(dispatch.scheduledAt, "PPp")}
            </span>
          </div>

          <h4 className="font-bold text-lg text-foreground">{dispatch.title}</h4>

          {dispatch.errorMessage && (
            <div className="mt-2 flex items-start gap-2 text-rose-600 text-xs bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{dispatch.errorMessage}</span>
            </div>
          )}

          <div className="mt-4 bg-muted/10 p-5 rounded-2xl border border-white/5 inline-flex flex-col gap-4 min-w-[300px] shadow-inner">
            {dispatch.attachments?.length > 0 && (
              <div className="flex flex-wrap gap-2.5 mb-1">
                {dispatch.attachments.map((att: any) => (
                  <div key={att.id} className="flex items-center gap-2.5 bg-card/60 border border-white/5 rounded-xl shadow-sm overflow-hidden text-[11px] p-1.5 pr-3 group/att transition-colors hover:bg-card">
                    {att.type === "image" && <div className="h-7 w-7 bg-blue-500/10 rounded-lg flex items-center justify-center shrink-0"><ImageIcon className="h-3.5 w-3.5 text-blue-500" /></div>}
                    {att.type === "document" && <div className="h-7 w-7 bg-rose-500/10 rounded-lg flex items-center justify-center shrink-0"><FileText className="h-3.5 w-3.5 text-rose-500" /></div>}
                    {att.type === "audio" && <div className="h-7 w-7 bg-purple-500/10 rounded-lg flex items-center justify-center shrink-0"><Mic className="h-3.5 w-3.5 text-purple-500" /></div>}
                    {att.type === "video" && <div className="h-7 w-7 bg-indigo-500/10 rounded-lg flex items-center justify-center shrink-0"><Video className="h-3.5 w-3.5 text-indigo-500" /></div>}
                    <span className="truncate max-w-[140px] font-bold text-muted-foreground/80">
                      {att.type === "image" ? "Imagem" : att.type === "audio" ? "Voz" : att.filename}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {dispatch.content && (
              <p className="text-[14.5px] font-medium text-foreground/90 whitespace-pre-wrap leading-relaxed border-l-2 border-primary/30 pl-4">
                {renderWhatsAppText(dispatch.content)}
              </p>
            )}
          </div>

          {dispatch.logs?.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/40 mb-1 ml-1">Resultado do Envio</p>
              <div className={cn("flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold border", hasErrors ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400")}>
                {hasErrors ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
                <span>
                  <span className="text-foreground">{targetLabel}</span>
                  {" • "}
                  {successCount > 0 && <span>{successCount} enviado(s)</span>}
                  {successCount > 0 && errorCount > 0 && " / "}
                  {errorCount > 0 && <span className="text-rose-500">{errorCount} falha(s)</span>}
                </span>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3 w-full border-t border-white/5 pt-5">
            {canEdit ? (
              <Button variant="outline" size="sm" onClick={() => onEdit(dispatch)} className="text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20 rounded-xl px-4 font-bold">
                <Edit3 className="h-4 w-4 mr-2" /> Editar
              </Button>
            ) : isOverdue ? (
              <span className="text-[11px] text-amber-500 font-bold flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl animate-pulse uppercase tracking-wider">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Processando...
              </span>
            ) : null}
            {dispatch.status === "error" && (
              <Button variant="outline" size="sm" onClick={() => onRetry(dispatch.id)} disabled={isRetrying} className="text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20 rounded-xl px-4 font-bold">
                <RefreshCw className={cn("h-4 w-4 mr-2", isRetrying && "animate-spin")} /> Reparar
              </Button>
            )}
            {isAdmin && dispatch.status !== "sending" && (
              <Button variant="ghost" size="sm" onClick={() => onDelete(dispatch.id)} disabled={isDeleting} className="text-muted-foreground/60 hover:bg-rose-500/10 hover:text-rose-500 rounded-xl px-4 font-bold">
                <Trash2 className="h-4 w-4 mr-2" /> Excluir
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
