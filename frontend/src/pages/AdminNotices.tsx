import { useState, useRef, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Megaphone, Send, User, Trash2, Loader2, Inbox, RefreshCw, CheckCircle2,
  CalendarClock, Mic, X, Paperclip, Square, Smile, FileText, Video, Image as ImageIcon, AlertCircle, Edit3, Play, Pause
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { safeFormat } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { getErrorMessage } from "@/lib/errorMessages";

type AttachmentType = "image" | "video" | "document" | "audio";
type LocalAttachment = { id: string; file?: File; existingApiId?: string; type: AttachmentType; url: string; name: string; };
type ApiAttachment = { id: string; type: AttachmentType; filename: string; filepath: string; mimetype: string; };
type Dispatch = {
  id: string; title: string; content: string | null; type: string; priority: string;
  targetGroupId: string | null; targetUserId: string | null;
  status: "pending" | "sending" | "sent" | "error";
  scheduledAt: string; sentAt: string | null; errorMessage: string | null; createdAt: string;
  attachments: ApiAttachment[];
  logs: { id: string; recipient: string; status: string; error: string | null }[];
};

function WaBubble({ children, time }: { children: React.ReactNode; time: string }) {
  return (
    <div className="self-end bg-[#DCF8C6] dark:bg-[#005c4b] p-1.5 pb-5 rounded-xl rounded-tr-sm shadow-sm relative max-w-[85%] animate-in fade-in duration-300 min-w-[80px]">
      <div className="text-[#111111] dark:text-[#e9edef]">{children}</div>
      <span className="text-[10.5px] text-[#075E54]/70 dark:text-white/50 font-medium absolute bottom-1 right-2 inline-flex items-center gap-1">
        {time}<CheckCircle2 className="h-[14px] w-[14px] text-[#34B7F1] dark:text-[#53bdeb]" strokeWidth={2.5} />
      </span>
      <svg viewBox="0 0 8 13" width="8" height="13" className="absolute top-0 -right-[7px] text-[#DCF8C6] dark:text-[#005c4b]">
        <path opacity=".13" d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z" />
        <path fill="currentColor" d="M5.188 0H0v11.193l6.467-8.625C7.526 1.156 6.958 0 5.188 0z" />
      </svg>
    </div>
  );
}

async function apiGet(url: string) { const { data } = await api.get(url); return data; }
async function apiPost(url: string, body?: any) {
  const { data } = await api.post(url, body);
  return data;
}
async function apiDelete(url: string) { const { data } = await api.delete(url); return data; }
async function apiPatch(url: string, body?: any) {
  const { data } = await api.patch(url, body);
  return data;
}

function AudioBubblePlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const toggle = () => { const a = audioRef.current; if (!a) return; if (playing) a.pause(); else a.play(); setPlaying(!playing); };
  const fmt = (s: number) => { if (!s || !isFinite(s)) return "0:00"; return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`; };
  const handleTimeUpdate = () => { const a = audioRef.current; if (!a) return; setCurrentTime(a.currentTime); setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0); };
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => { const a = audioRef.current; if (!a || !a.duration) return; const r = e.currentTarget.getBoundingClientRect(); a.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * a.duration; };
  const heights = [6, 10, 14, 8, 16, 12, 18, 10, 6, 14, 18, 10, 8, 16, 12, 6, 14, 10, 18, 8, 12, 16, 6, 10, 14, 8, 18, 12];
  return (
    <div className="flex items-center gap-2.5 px-2 py-1.5 min-w-[220px]">
      <audio ref={audioRef} src={src} preload="metadata" onTimeUpdate={handleTimeUpdate} onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)} onEnded={() => { setPlaying(false); setProgress(0); setCurrentTime(0); }} />
      <button type="button" onClick={toggle} className="h-10 w-10 shrink-0 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-md hover:bg-[#1DA851] transition-colors">
        {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
      </button>
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-center gap-1.5 h-[18px]" onClick={handleSeek} style={{ cursor: "pointer" }}>
          {Array.from({ length: 28 }).map((_, i) => <div key={i} className="rounded-full" style={{ width: 2.5, height: heights[i % heights.length], backgroundColor: ((i / 28) * 100) <= progress ? "#25D366" : "#B0B0B0", opacity: ((i / 28) * 100) <= progress ? 1 : 0.45 }} />)}
        </div>
        <span className="text-[10px] text-[#666] font-medium leading-none">{playing || currentTime > 0 ? fmt(currentTime) : fmt(duration)}</span>
      </div>
    </div>
  );
}

const AdminNotices = () => {
  const { user, profile, isAdmin, IsLider, managedGroupIds } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState(isAdmin ? "general" : "group");
  const [priority, setPriority] = useState("normal");
  const [groupId, setGroupId] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<LocalAttachment[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cursorPositionRef = useRef<number>(0);
  const [signEnabled, setSignEnabled] = useState(false);
  const signatureName = useMemo(() => profile?.fullName || user?.user_metadata?.full_name || "", [profile, user]);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);
  const chunks = useRef<BlobPart[]>([]);

  const { data: groups } = useQuery({
    queryKey: ["groups-list-notices"],
    queryFn: async () => {
      const params: any = {};
      if (!isAdmin && managedGroupIds.length > 0) params.ids = managedGroupIds.join(',');
      const { data } = await api.get('/groups', { params });
      return data || [];
    },
  });

  const { data: members } = useQuery({
    queryKey: ["members-list-notices"],
    queryFn: async () => {
      const params: any = {};
      if (!isAdmin && managedGroupIds.length > 0) params.groupIds = managedGroupIds.join(',');
      const { data } = await api.get('/profiles', { params });
      return data || [];
    },
  });

  const { data: dispatches, isLoading } = useQuery<Dispatch[]>({
    queryKey: ["wz-dispatches"],
    queryFn: () => apiGet("/dispatches"),
    refetchInterval: (query) => {
      const data = query.state.data as Dispatch[] | undefined;
      if (!data) return 5000;
      const hasActive = data.some((d) => {
        if (d.status === "sending") return true;
        if (d.status === "pending" && new Date(d.scheduledAt) <= new Date()) return true;
        return false;
      });
      return hasActive ? 3000 : 10000;
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!title) throw new Error("O título de controle é obrigatório.");
      if (!scheduledAt) throw new Error("A data e hora de agendamento é obrigatória.");
      if (!content && attachments.length === 0) throw new Error("É necessário pelo menos texto ou um anexo.");

      // VALIDAÇÕES DE DESTINO EXIGIDAS
      if (type === "group" && !groupId) {
        throw new Error("Você selecionou Departamento, por favor informe qual o departamento desejado.");
      }
      if (type === "individual" && !targetUserId) {
        throw new Error("Você selecionou Membro, por favor informe qual membro receberá o envio.");
      }

      const formData = new FormData();
      formData.append("title", title);

      // Se "Assinar" está ativo, prefixa o conteúdo com o nome do remetente
      const finalContent = (signEnabled && signatureName && content)
        ? `*${signatureName}:*\n${content}`
        : content;
      formData.append("content", finalContent);
      formData.append("type", type);
      formData.append("priority", priority);
      formData.append("scheduledAt", new Date(scheduledAt).toISOString());
      if (user?.id) formData.append("createdBy", user.id);
      if (type === "group" && groupId) formData.append("targetGroupId", groupId);
      if (type === "individual" && targetUserId) formData.append("targetUserId", targetUserId);

      // Tratamento de anexos antigos vs novos
      const keptIds = attachments.map(a => a.existingApiId).filter(Boolean);
      if (keptIds.length > 0) {
        formData.append("kept_attachments", JSON.stringify(keptIds));
      }

      attachments.forEach((att) => {
        if (att.file) formData.append("files", att.file);
      });

      const url = editId ? `/dispatches/${editId}` : "/dispatches";
      if (editId) {
        return await apiPatch(url, formData);
      } else {
        return await apiPost(url, formData);
      }
    },
    onSuccess: () => {
      resetForm();
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ["wz-dispatches"] });
      toast({ title: "Salvo com sucesso!", description: "O comunicado atualizado está na fila de disparos do bot." });
    },
    onError: (err: any) => toast({ title: "Atenção", description: getErrorMessage(err), variant: "destructive" }),
  });

  const retryMutation = useMutation({
    mutationFn: (id: string) => apiPost(`/dispatches/${id}/retry`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wz-dispatches"] });
      toast({ title: "Recolocado na fila", description: "O disparo será tentado novamente." });
    },
    onError: (err: any) => toast({ title: "Erro", description: getErrorMessage(err), variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/dispatches/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wz-dispatches"] }),
    onError: (err: any) => toast({ title: "Erro", description: getErrorMessage(err), variant: "destructive" }),
  });

  const handleEdit = (dispatch: Dispatch) => {
    setEditId(dispatch.id);
    setTitle(dispatch.title);
    setContent(dispatch.content || "");
    setType(dispatch.type);
    setPriority(dispatch.priority);
    setGroupId(dispatch.targetGroupId || "");
    setTargetUserId(dispatch.targetUserId || "");

    if (dispatch.scheduledAt) {
      const dateStr = new Date(dispatch.scheduledAt);
      // Converter para timezone local compatível com YYYY-MM-DDThh:mm (datetime-local)
      const localIso = new Date(dateStr.getTime() - dateStr.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setScheduledAt(localIso);
    } else {
      setScheduledAt("");
    }

    const mappedAtts: LocalAttachment[] = dispatch.attachments.map(a => {
      // filepath from backend is like "uploads/uuid.ext" — we need to serve it via the API
      let url = a.filepath;
      if (url && !url.startsWith('http') && !url.startsWith('blob:')) {
        // Normalize path separators and strip leading directory
        const normalized = url.replace(/\\/g, '/');
        const filename = normalized.includes('/') ? normalized.split('/').pop()! : normalized;
        url = `/api/uploads/${filename}`;
      }
      return {
        id: a.id,
        existingApiId: a.id,
        type: a.type,
        url,
        name: a.filename
      };
    });
    setAttachments(mappedAtts);
    setIsOpen(true);
  };

  const resetForm = () => {
    setEditId(null);
    setTitle(""); setContent(""); setGroupId(""); setTargetUserId("");
    setScheduledAt(""); setAttachments([]); setShowEmojiPicker(false);
    setType(isAdmin ? "general" : "group");
    setPriority("normal");
    stopRecording();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newAtts = Array.from(e.target.files).map((file) => {
        let type: AttachmentType = "document";
        if (file.type.startsWith("image/")) type = "image";
        else if (file.type.startsWith("video/")) type = "video";
        else if (file.type.startsWith("audio/")) type = "audio";
        return { id: Math.random().toString(36).substr(2, 9), file, type, url: URL.createObjectURL(file), name: file.name };
      });
      setAttachments((prev) => [...prev, ...newAtts]);
    }
  };

  const removeAttachment = (id: string) => setAttachments((prev) => prev.filter((a) => a.id !== id));

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        const file = new File([blob], "Gravacao.webm", { type: "audio/webm" });
        setAttachments((prev) => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          file, type: "audio", url: URL.createObjectURL(blob), name: "Gravacao.webm",
        }]);
        chunks.current = [];
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimer.current = setInterval(() => setRecordingTime((p) => p + 1), 1000);
    } catch {
      toast({ title: "Erro no Microfone", description: "Verifique as permissões de gravação no navegador.", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach((t) => t.stop());
      setIsRecording(false);
      if (recordingTimer.current) clearInterval(recordingTimer.current);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rs = secs % 60;
    return `${mins}:${rs < 10 ? "0" : ""}${rs}`;
  };

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    cursorPositionRef.current = e.target.selectionStart;
  }, []);

  const handleContentSelect = useCallback((e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    cursorPositionRef.current = (e.target as HTMLTextAreaElement).selectionStart;
  }, []);

  const handleEmojiClick = useCallback((emojiData: EmojiClickData) => {
    const pos = cursorPositionRef.current;
    setContent((prev) => {
      const before = prev.slice(0, pos);
      const after = prev.slice(pos);
      const newContent = before + emojiData.emoji + after;
      // Update cursor position to be after the inserted emoji
      cursorPositionRef.current = pos + emojiData.emoji.length;
      return newContent;
    });
    // Restore focus and cursor position after emoji insertion
    requestAnimationFrame(() => {
      const ta = textareaRef.current;
      if (ta) {
        ta.focus();
        const newPos = cursorPositionRef.current;
        ta.setSelectionRange(newPos, newPos);
      }
    });
  }, []);

  const renderWhatsAppText = (text: string) => {
    if (!text) return null;
    const html = text
      .replace(/\*([^\*]+)\*/g, "<strong>$1</strong>")
      .replace(/_([^_]+)_/g, "<em>$1</em>")
      .replace(/~([^~]+)~/g, "<del>$1</del>")
      .replace(/```(.*?)```/g, "<code class='bg-black/10 px-1 py-[2px] rounded text-[13px] font-mono'>$1</code>")
      .replace(/\n/g, "<br />");
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

  const canCreate = isAdmin || IsLider;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 pb-safe animate-fade-in">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-[inset_0_0_20px_rgba(16,185,129,0.1)] border border-emerald-500/20 shrink-0">
            <Megaphone className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent truncate">Disparos (WhatsApp)</h1>
            <p className="text-[11px] sm:text-sm text-muted-foreground/80 font-medium truncate">Envio rico em mídia com integração ao bot Baileys.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canCreate && (
            <Dialog open={isOpen} onOpenChange={(val) => { setIsOpen(val); if (!val) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="gap-2.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all duration-300 hover:scale-[1.02] active:scale-95 px-6 h-11 font-bold rounded-xl">
                  <CalendarClock className="h-4 w-4" /> Novo Disparo
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-[1300px] p-0 rounded-[2rem] sm:rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden flex flex-col md:flex-row h-[95dvh] md:h-[min(90vh, 850px)] bg-[#0b141a] dark:bg-[#0b141a] animate-in zoom-in-95 duration-300">

                {/* LADO ESQUERDO: FORMULÁRIO */}
                <div className="flex-1 flex flex-col bg-card min-w-0 overflow-y-auto md:overflow-hidden custom-scrollbar">
                  <div className="p-8 pb-4 border-b border-white/5 bg-card/50">
                    <DialogTitle className="text-2xl font-black flex items-center gap-3 text-emerald-500">
                      {editId ? <Edit3 className="h-6 w-6" /> : <Send className="h-6 w-6" />}
                      {editId ? "Editar Comunicado" : "Novo Disparo"}
                    </DialogTitle>
                    <p className="text-muted-foreground/60 text-sm mt-1 font-medium">Configure os detalhes do seu envio via bot.</p>
                  </div>

                  <div className="flex-none md:flex-1 md:overflow-y-auto p-6 space-y-5 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Público Alvo</Label>
                        <Select value={type} onValueChange={setType}>
                          <SelectTrigger className="rounded-xl h-10 bg-muted/30 dark:bg-[#2a3942] dark:border-0 dark:text-white"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>
                            {isAdmin && <SelectItem value="general">Geral (Igreja)</SelectItem>}
                            <SelectItem value="group">Departamento</SelectItem>
                            {(isAdmin || IsLider) && <SelectItem value="individual">Membro Específico</SelectItem>}
                          </SelectContent>
                        </Select>
                      </div>

                      {type === "group" && (
                        <div className="space-y-1.5 animate-in fade-in">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Departamento</Label>
                          <Select value={groupId} onValueChange={setGroupId}>
                            <SelectTrigger className={cn("rounded-2xl h-12 bg-muted/20 border-white/5 focus:ring-emerald-500/20", !groupId && !!editId && "border-rose-500/50")}><SelectValue placeholder="Escolha o departamento..." /></SelectTrigger>
                            <SelectContent className="rounded-2xl border-white/5 bg-[#1c2c33]">{groups?.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      )}

                      {type === "individual" && (
                        <div className="space-y-1.5 animate-in fade-in">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Membro Relacionado</Label>
                          <Select value={targetUserId} onValueChange={setTargetUserId}>
                            <SelectTrigger className={cn("rounded-xl h-10 bg-muted/30", !targetUserId && !!editId && "border-rose-300 ring-rose-200")}><SelectValue placeholder="Busque..." /></SelectTrigger>
                            <SelectContent>{members?.map((m) => <SelectItem key={m.userId} value={m.userId}>{m.fullName}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Prioridade Visual</Label>
                        <Select value={priority} onValueChange={setPriority}>
                          <SelectTrigger className="rounded-xl h-10 bg-muted/30 dark:bg-[#2a3942] dark:border-0 dark:text-white"><SelectValue placeholder="Escolha a prioridade" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">Baixa / Informativo</SelectItem>
                            <SelectItem value="urgent">Urgente 🚨</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-3 bg-emerald-500/5 p-6 rounded-[2rem] border border-emerald-500/10 shadow-inner">
                      <Label className="text-[11px] font-black uppercase tracking-widest text-emerald-500/70 flex items-center gap-2 ml-1">
                        <CalendarClock className="h-4 w-4" /> Data/Hora do Agendamento
                      </Label>
                      <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="rounded-2xl h-12 bg-card border-white/5 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-bold" />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/50 ml-1">Título de Controle</Label>
                      <Input placeholder="Ex: Reunião de Jovens - 25/04" value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-2xl h-12 bg-muted/20 border-white/5 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-bold" />
                    </div>

                    {/* CAIXA DE TEXTO E ANEXOS */}
                    <div className="space-y-0 rounded-2xl border dark:border-white/10 bg-white dark:bg-[#2a3942] overflow-visible shadow-sm focus-within:ring-2 focus-within:ring-[#25D366] transition-all flex flex-col">
                      {attachments.length > 0 && (
                        <div className="flex gap-2 p-3 overflow-x-auto bg-slate-50 border-b custom-scrollbar items-start rounded-t-2xl">
                          {attachments.map((att) => (
                            <div key={att.id} className="relative shrink-0 border bg-white rounded-lg p-1 group w-16 h-16 flex items-center justify-center overflow-hidden shadow-sm">
                              {att.type === "image" ? <img src={att.url} className="w-full h-full object-cover rounded" /> :
                                att.type === "video" ? <Video className="h-6 w-6 text-blue-500" /> :
                                  att.type === "audio" ? <Mic className="h-6 w-6 text-purple-500" /> :
                                    <FileText className="h-6 w-6 text-rose-500" />}
                              <button type="button" onClick={() => removeAttachment(att.id)} className="absolute top-0 right-0 bg-rose-500 text-white rounded-bl-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <X className="h-3 w-3" />
                              </button>
                              {att.type === "document" && <span className="absolute bottom-0 text-[8px] bg-black/60 text-white w-full text-center truncate px-1">{att.name}</span>}
                            </div>
                          ))}
                        </div>
                      )}

                      <Textarea
                        ref={textareaRef}
                        placeholder="Mensagem do WhatsApp. Formatações: *negrito*, _itálico_, ~tachado~, ```código```"
                        className={cn("min-h-[140px] border-0 focus-visible:ring-0 resize-none py-3 px-4 bg-transparent text-[14.5px] leading-relaxed dark:text-[#e9edef] dark:placeholder:text-white/30", attachments.length === 0 ? "rounded-t-2xl" : "")}
                        value={content}
                        onChange={handleContentChange}
                        onSelect={handleContentSelect}
                        onClick={handleContentSelect}
                        onKeyUp={handleContentSelect}
                      />

                      <div className="flex bg-slate-50 dark:bg-[#202c33] p-2 border-t dark:border-white/10 gap-1.5 items-center relative rounded-b-2xl flex-wrap">
                        <div className="relative">
                          <Button type="button" variant="ghost" size="icon" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="h-9 w-9 text-slate-500 hover:text-slate-800 hover:bg-slate-200">
                            <Smile className="h-5 w-5" />
                          </Button>
                          {showEmojiPicker && (
                            <div className="absolute z-50 bottom-12 left-0 shadow-2xl rounded-2xl border border-black/10 overflow-hidden">
                              <div className="fixed inset-0 z-[-1]" onClick={() => setShowEmojiPicker(false)} />
                              <EmojiPicker onEmojiClick={handleEmojiClick} searchPlaceHolder="Pesquisar..." theme={"light" as any} />
                            </div>
                          )}
                        </div>

                        <Label className="flex items-center justify-center p-2 cursor-pointer hover:bg-slate-200 rounded-lg transition-colors text-slate-500 hover:text-slate-800" title="Anexar Imagens / Documentos">
                          <Paperclip className="h-5 w-5" />
                          <input type="file" multiple accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx" className="hidden" onChange={handleFileUpload} />
                        </Label>

                        {/* Toggle Assinar — identifica o remetente na mensagem */}
                        <div
                          className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border shadow-sm select-none cursor-pointer transition-colors",
                            signEnabled ? "bg-[#25D366]/10 border-[#25D366]/30" : "bg-white border-slate-200"
                          )}
                          title={signEnabled ? `Assinando como: ${signatureName}` : "Clique para assinar com seu nome"}
                          onClick={() => setSignEnabled(!signEnabled)}
                        >
                          <span className={cn("text-[11px] font-semibold tracking-wide", signEnabled ? "text-[#075E54]" : "text-slate-500")}>Assinar</span>
                          <Switch
                            checked={signEnabled}
                            onCheckedChange={setSignEnabled}
                            className="h-4 w-7 data-[state=checked]:bg-[#25D366]"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={isRecording ? stopRecording : startRecording}
                          className={cn("p-2 rounded-lg transition-colors ml-auto mr-1 relative", isRecording ? "bg-rose-100 text-rose-500 animate-pulse border border-rose-200" : "text-slate-500 hover:text-slate-800 hover:bg-slate-200")}
                          title={isRecording ? "Parar e Anexar" : "Gravar Áudio de Voz"}
                        >
                          {isRecording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                          {isRecording && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
                            </span>
                          )}
                        </button>
                        {isRecording && <span className="text-xs text-rose-600 font-bold ml-1">{formatTime(recordingTime)}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="p-8 border-t border-white/5 bg-card/30 backdrop-blur-sm mt-auto">
                    <Button
                      className="w-full h-14 rounded-[1.25rem] font-black text-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                      onClick={() => sendMutation.mutate()}
                      disabled={sendMutation.isPending}
                    >
                      {sendMutation.isPending ? <Loader2 className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6" />}
                      {editId ? "SALVAR ALTERAÇÕES" : "CONFIRMAR DISPARO"}
                    </Button>
                  </div>
                </div>

                {/* LADO DIREITO: PREVIEW WHATSAPP */}
                <div className="hidden md:flex bg-[#EFEAE2] dark:bg-[#0c141a] shrink-0 border-l border-white/5 relative overflow-hidden flex-col shadow-2xl" style={{ width: 'clamp(320px, 42%, 480px)' }}>
                  <div className="bg-[#075E54] dark:bg-[#202c33] text-white px-5 py-4 shadow-lg flex items-center gap-4 z-10 border-b border-black/10">
                    <div className="h-11 w-11 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center overflow-hidden border border-white/20 shadow-inner shrink-0">
                      <img src="/idvmergulho/logo.png" alt="CC Mergulho" className="h-8 w-8 object-contain" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-[16px] leading-snug truncate pr-2 dark:text-[#e9edef]">CC Mergulho Oficial</div>
                      <div className="text-white/80 dark:text-[#8696a0] text-[11px] font-medium truncate uppercase tracking-widest">Mergulhando no evangelho</div>
                    </div>
                  </div>

                  <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col justify-end gap-2 pb-6 relative z-0">
                    {(!content && attachments.length === 0) ? (
                      <div className="mx-auto bg-[#FFEECD] text-[#544B3D] text-[12px] px-4 py-2 rounded-xl shadow-sm border border-[#F0DFBE] text-center max-w-[85%] font-medium">
                        🔒 As mensagens e as chamadas são protegidas com a criptografia de ponta a ponta nativa do WhatsApp.<br />A pré-visualização da sua mensagem aparecerá aqui!
                      </div>
                    ) : (
                      <>
                        {/* 1ª bolha: texto (enviado primeiro e separado) */}
                        {content && (
                          <WaBubble time={new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}>
                            <p className="px-1.5 py-0.5 text-[15px] leading-snug" style={{ wordBreak: "break-word" }}>
                              {signEnabled && signatureName && (
                                <>
                                  <strong className="text-[#075E54] dark:text-[#25D366]">{signatureName}:</strong>
                                  <br />
                                </>
                              )}
                              {renderWhatsAppText(content)}
                            </p>
                          </WaBubble>
                        )}

                        {/* Uma bolha por anexo (enviados separadamente após o texto) */}
                        {attachments.map((att) => (
                          <WaBubble key={att.id} time={new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}>
                            {att.type === "image" && <img src={att.url} alt="anexo" className="w-full object-cover max-h-[200px] rounded-lg" />}
                            {att.type === "video" && <video src={att.url} className="w-full max-h-[160px] rounded-lg" controls />}
                            {att.type === "audio" && <AudioBubblePlayer src={att.url} />}
                            {att.type === "document" && (
                              <div className="flex items-center gap-3 p-2 bg-black/5 rounded-lg">
                                <div className="h-9 w-9 bg-rose-500 rounded flex items-center justify-center shrink-0"><FileText className="h-4 w-4 text-white" /></div>
                                <span className="text-[13px] font-medium text-slate-800 truncate">{att.name}</span>
                              </div>
                            )}
                          </WaBubble>
                        ))}
                      </>
                    )}
                  </div>
                </div>

              </DialogContent>
            </Dialog>
          )}
        </div>
      </header>

      {/* Lista de Disparos */}
      <Tabs defaultValue="all" className="w-full">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="all" className="gap-2 relative"><Inbox className="h-3.5 w-3.5" /> Caixas de Envio</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="mt-0">
          {isLoading ? (
            <div className="space-y-4 animate-in fade-in duration-500">
              <Card className="h-32 animate-pulse bg-muted rounded-2xl" />
            </div>
          ) : !dispatches || dispatches.length === 0 ? (
            <p className="text-center opacity-50 py-10">Fila Limpa</p>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {dispatches.map((dispatch) => (
                <Card key={dispatch.id} className={cn(
                  "border-0 shadow-xl rounded-[2rem] overflow-hidden group hover:scale-[1.01] transition-all duration-500 bg-card/40 backdrop-blur-xl border border-white/5",
                  dispatch.status === "error" && "ring-1 ring-rose-500/20"
                )}>
                  <CardContent className="p-0 flex flex-col md:flex-row gap-0 relative">
                    {/* Status side accent */}
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
                          {dispatch.status === "pending" && <Badge variant="outline" className="text-amber-500 bg-amber-500/10 border-amber-500/20 rounded-lg px-2.5 py-0.5">Na Fila (Aguardando Horário)</Badge>}
                          {dispatch.status === "sending" && <Badge variant="outline" className="text-blue-500 bg-blue-500/10 border-blue-500/20 animate-pulse rounded-lg px-2.5 py-0.5">Enviando...</Badge>}
                          {dispatch.status === "sent" && <Badge variant="outline" className="text-emerald-500 bg-emerald-500/10 border-emerald-500/20 rounded-lg px-2.5 py-0.5">Disparado pelo Bot</Badge>}
                          {dispatch.status === "error" && <Badge variant="outline" className="text-rose-500 bg-rose-500/10 border-rose-500/20 rounded-lg px-2.5 py-0.5">Falha ao Conectar</Badge>}
                          {dispatch.priority === "urgent" && <Badge className="bg-gradient-to-r from-rose-500 to-orange-500 text-white text-[10px] rounded-lg px-2.5 shadow-lg shadow-rose-500/20">Urgente 🚨</Badge>}
                        </div>
                        <span className="text-[11px] font-bold text-muted-foreground/60 flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-xl border border-white/5">
                          <CalendarClock className="h-3.5 w-3.5 text-primary/60" /> Disparo: {safeFormat(dispatch.scheduledAt, "PPp")}
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
                        {dispatch.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2.5 mb-1">
                            {dispatch.attachments.map((att) => (
                              <div key={att.id} className="flex items-center gap-2.5 bg-card/60 border border-white/5 rounded-xl shadow-sm overflow-hidden text-[11px] p-1.5 pr-3 group/att transition-colors hover:bg-card">
                                {att.type === "image" && <div className="h-7 w-7 bg-blue-500/10 rounded-lg flex items-center justify-center shrink-0"><ImageIcon className="h-3.5 w-3.5 text-blue-500" /></div>}
                                {att.type === "document" && <div className="h-7 w-7 bg-rose-500/10 rounded-lg flex items-center justify-center shrink-0"><FileText className="h-3.5 w-3.5 text-rose-500" /></div>}
                                {att.type === "audio" && <div className="h-7 w-7 bg-purple-500/10 rounded-lg flex items-center justify-center shrink-0"><Mic className="h-3.5 w-3.5 text-purple-500" /></div>}
                                {att.type === "video" && <div className="h-7 w-7 bg-indigo-500/10 rounded-lg flex items-center justify-center shrink-0"><Video className="h-3.5 w-3.5 text-indigo-500" /></div>}
                                <span className="truncate max-w-[140px] font-bold text-muted-foreground/80">
                                  {att.type === "image" ? "Imagem Anexa" : att.type === "audio" ? "Voz Gravada" : att.filename}
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

                      {/* Logs por destinatário */}
                      {dispatch.logs.length > 0 && (() => {
                        const successCount = dispatch.logs.filter(l => l.status === "success").length;
                        const errorCount = dispatch.logs.filter(l => l.status === "error").length;
                        const hasErrors = errorCount > 0;

                        // Nome legível do destino
                        const targetLabel = dispatch.type === "general"
                          ? "Geral"
                          : dispatch.type === "group"
                            ? (groups?.find(g => g.id === dispatch.targetGroupId)?.name || "Departamento")
                            : (members?.find(m => m.userId === dispatch.targetUserId)?.fullName || "Membro");

                        return (
                          <div className="mt-4 space-y-2">
                            <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/40 mb-1 ml-1">Resultado do Envio</p>

                            {/* Resumo compacto */}
                            <div className={cn("flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold border", hasErrors ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400")}>
                              {hasErrors
                                ? <AlertCircle className="h-4 w-4 shrink-0" />
                                : <CheckCircle2 className="h-4 w-4 shrink-0" />}
                              <span>
                                <span className="text-foreground">{targetLabel}</span>
                                {" • "}
                                {successCount > 0 && <span>{successCount} enviado{successCount !== 1 ? "s" : ""}</span>}
                                {successCount > 0 && errorCount > 0 && " / "}
                                {errorCount > 0 && <span className="text-rose-500">{errorCount} falha{errorCount !== 1 ? "s" : ""}</span>}
                              </span>
                            </div>

                            {/* Detalhe só de erros (com número mascarado) */}
                            {hasErrors && dispatch.logs.filter(l => l.status === "error").map((log) => {
                              const masked = log.recipient.length > 6
                                ? log.recipient.slice(0, 4) + "•••" + log.recipient.slice(-4)
                                : log.recipient;
                              return (
                                <div key={log.id} className="flex items-start gap-2 text-xs rounded-lg px-3 py-1.5 bg-rose-500/5 text-rose-400/80 border border-rose-500/10">
                                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                  <span className="font-mono opacity-70">{masked}</span>
                                  {log.error && <span className="text-[10px] opacity-70 ml-2 truncate">{log.error}</span>}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}


                      <div className="mt-6 flex justify-end gap-3 w-full border-t border-white/5 pt-5">
                        {/* Editar só disponível para pending cujo horário ainda não chegou, ou erros */}
                        {(() => {
                          const isOverdue = dispatch.status === "pending" && new Date(dispatch.scheduledAt) <= new Date();
                          const canEdit = (dispatch.status === "pending" && !isOverdue) || dispatch.status === "error";
                          return canEdit ? (
                            <Button variant="outline" size="sm" onClick={() => handleEdit(dispatch)} className="text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20 rounded-xl px-4 font-bold">
                              <Edit3 className="h-4 w-4 mr-2" /> Editar
                            </Button>
                          ) : isOverdue ? (
                            <span className="text-[11px] text-amber-500 font-bold flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl animate-pulse uppercase tracking-wider">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Aguardando envio...
                            </span>
                          ) : null;
                        })()}
                        {dispatch.status === "error" && (
                          <Button variant="outline" size="sm" onClick={() => retryMutation.mutate(dispatch.id)} disabled={retryMutation.isPending} className="text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20 rounded-xl px-4 font-bold">
                            <RefreshCw className={cn("h-4 w-4 mr-2", retryMutation.isPending && "animate-spin")} /> Reparar
                          </Button>
                        )}
                        {isAdmin && dispatch.status !== "sending" && (
                          <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(dispatch.id)} disabled={deleteMutation.isPending} className="text-muted-foreground/60 hover:bg-rose-500/10 hover:text-rose-500 rounded-xl px-4 font-bold">
                            <Trash2 className="h-4 w-4 mr-2" /> Excluir
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminNotices;
