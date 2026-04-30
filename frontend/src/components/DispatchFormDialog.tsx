import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Send, Edit3, CalendarClock, Smile, Paperclip, Mic, Square, X, Video, FileText, Image as ImageIcon } from "lucide-react";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { cn } from "@/lib/utils";
import { WaBubble } from "./WaBubble";
import { AudioBubblePlayer } from "./AudioBubblePlayer";

interface LocalAttachment {
  id: string;
  file?: File;
  existingApiId?: string;
  type: "image" | "video" | "document" | "audio";
  url: string;
  name: string;
}

interface DispatchFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (formData: FormData) => void;
  editingDispatch?: any;
  isAdmin: boolean;
  IsLider: boolean;
  groups: any[];
  members: any[];
  user: any;
  profile: any;
  isSaving: boolean;
  renderWhatsAppText: (text: string) => React.ReactNode;
}

export const DispatchFormDialog = ({
  open,
  onClose,
  onSave,
  editingDispatch,
  isAdmin,
  IsLider,
  groups,
  members,
  user,
  profile,
  isSaving,
  renderWhatsAppText
}: DispatchFormDialogProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState(isAdmin ? "general" : "group");
  const [priority, setPriority] = useState("normal");
  const [groupId, setGroupId] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [attachments, setAttachments] = useState<LocalAttachment[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [signEnabled, setSignEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cursorPositionRef = useRef<number>(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);
  const chunks = useRef<BlobPart[]>([]);

  const signatureName = profile?.fullName || user?.user_metadata?.full_name || "";

  useEffect(() => {
    if (editingDispatch) {
      setTitle(editingDispatch.title || "");
      setContent(editingDispatch.content || "");
      setType(editingDispatch.type || "general");
      setPriority(editingDispatch.priority || "normal");
      setGroupId(editingDispatch.targetGroupId || "");
      setTargetUserId(editingDispatch.targetUserId || "");
      
      if (editingDispatch.scheduledAt) {
        const d = new Date(editingDispatch.scheduledAt);
        const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        setScheduledAt(localIso);
      } else {
        setScheduledAt("");
      }

      const mappedAtts: LocalAttachment[] = editingDispatch.attachments?.map((a: any) => {
        let url = a.filepath;
        if (url && !url.startsWith('http') && !url.startsWith('blob:')) {
          const filename = url.includes('/') ? url.split('/').pop()! : url;
          url = `/api/uploads/${filename}`;
        }
        return { id: a.id, existingApiId: a.id, type: a.type, url, name: a.filename };
      }) || [];
      setAttachments(mappedAtts);
    } else {
      setTitle("");
      setContent("");
      setType(isAdmin ? "general" : "group");
      setPriority("normal");
      setGroupId("");
      setTargetUserId("");
      setScheduledAt("");
      setAttachments([]);
      setSignEnabled(false);
    }
  }, [editingDispatch, open, isAdmin]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newAtts = Array.from(e.target.files).map((file) => {
        let type: any = "document";
        if (file.type.startsWith("image/")) type = "image";
        else if (file.type.startsWith("video/")) type = "video";
        else if (file.type.startsWith("audio/")) type = "audio";
        return { id: Math.random().toString(36).substr(2, 9), file, type, url: URL.createObjectURL(file), name: file.name };
      });
      setAttachments((prev) => [...prev, ...newAtts]);
    }
  };

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
      mediaRecorder.current = recorder;
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimer.current = setInterval(() => setRecordingTime((p) => p + 1), 1000);
    } catch {
      // Toast would be here, but using console for component extraction simplicity
      console.error("Erro no microfone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach((t) => t.stop());
      setIsRecording(false);
      if (recordingTimer.current) clearInterval(recordingTimer.current);
    }
  };

  const handleEmojiClick = useCallback((emojiData: EmojiClickData) => {
    const pos = cursorPositionRef.current;
    setContent((prev) => prev.slice(0, pos) + emojiData.emoji + prev.slice(pos));
    cursorPositionRef.current = pos + emojiData.emoji.length;
    setShowEmojiPicker(false);
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(cursorPositionRef.current, cursorPositionRef.current);
      }
    });
  }, []);

  const handleSubmit = () => {
    const formData = new FormData();
    formData.append("title", title);
    const finalContent = (signEnabled && signatureName && content) ? `*${signatureName}:*\n${content}` : content;
    formData.append("content", finalContent);
    formData.append("type", type);
    formData.append("priority", priority);
    formData.append("scheduledAt", new Date(scheduledAt).toISOString());
    if (user?.id) formData.append("createdBy", user.id);
    if (type === "group" && groupId) formData.append("targetGroupId", groupId);
    if (type === "individual" && targetUserId) formData.append("targetUserId", targetUserId);

    const keptIds = attachments.map(a => a.existingApiId).filter(Boolean);
    if (keptIds.length > 0) formData.append("kept_attachments", JSON.stringify(keptIds));

    attachments.forEach((att) => {
      if (att.file) formData.append("files", att.file);
    });

    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={val => !val && onClose()}>
      <DialogContent className="w-[95vw] max-w-[1300px] p-0 rounded-[2rem] sm:rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden flex flex-col md:flex-row h-[95dvh] md:h-[min(90vh, 850px)] bg-[#0b141a]">
        
        {/* FORM SIDE */}
        <div className="flex-1 flex flex-col bg-card min-w-0 overflow-y-auto md:overflow-hidden">
          <div className="p-8 pb-4 border-b border-white/5">
            <DialogTitle className="text-2xl font-black flex items-center gap-3 text-emerald-500">
              {editingDispatch ? <Edit3 className="h-6 w-6" /> : <Send className="h-6 w-6" />}
              {editingDispatch ? "Editar Comunicado" : "Novo Disparo"}
            </DialogTitle>
          </div>

          <div className="flex-1 md:overflow-y-auto p-6 space-y-5 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase">Público Alvo</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="rounded-xl h-10 bg-muted/30"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {isAdmin && <SelectItem value="general">Geral (Igreja)</SelectItem>}
                    <SelectItem value="group">Departamento</SelectItem>
                    {(isAdmin || IsLider) && <SelectItem value="individual">Membro Específico</SelectItem>}
                  </SelectContent>
                </Select>
              </div>

              {type === "group" && (
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase">Departamento</Label>
                  <Select value={groupId} onValueChange={setGroupId}>
                    <SelectTrigger className="rounded-xl h-10 bg-muted/30"><SelectValue placeholder="Escolha..." /></SelectTrigger>
                    <SelectContent>{groups?.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}

              {type === "individual" && (
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase">Membro</Label>
                  <Select value={targetUserId} onValueChange={setTargetUserId}>
                    <SelectTrigger className="rounded-xl h-10 bg-muted/30"><SelectValue placeholder="Busque..." /></SelectTrigger>
                    <SelectContent>{members?.map(m => <SelectItem key={m.userId} value={m.userId}>{m.fullName}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase">Prioridade</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="rounded-xl h-10 bg-muted/30"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgent">Urgente 🚨</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 bg-emerald-500/5 p-6 rounded-[2rem] border border-emerald-500/10">
              <Label className="text-[11px] font-black uppercase text-emerald-500 flex items-center gap-2">
                <CalendarClock className="h-4 w-4" /> Agendamento
              </Label>
              <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} className="rounded-xl h-11" />
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-black uppercase text-muted-foreground/50">Título Interno</Label>
              <Input placeholder="Identificação do envio" value={title} onChange={e => setTitle(e.target.value)} className="rounded-xl h-11" />
            </div>

            <div className="flex flex-col border rounded-2xl bg-white dark:bg-[#2a3942] overflow-hidden">
              {attachments.length > 0 && (
                <div className="flex gap-2 p-3 overflow-x-auto bg-slate-50 border-b custom-scrollbar">
                  {attachments.map(att => (
                    <div key={att.id} className="relative shrink-0 border rounded-lg p-1 group w-16 h-16 flex items-center justify-center bg-white">
                      {att.type === "image" ? <img src={att.url} className="w-full h-full object-cover rounded" /> :
                        att.type === "video" ? <Video className="h-6 w-6 text-blue-500" /> :
                        att.type === "audio" ? <Mic className="h-6 w-6 text-purple-500" /> :
                        <FileText className="h-6 w-6 text-rose-500" />}
                      <button onClick={() => setAttachments(p => p.filter(a => a.id !== att.id))} className="absolute top-0 right-0 bg-rose-500 text-white rounded-bl-lg p-1 opacity-0 group-hover:opacity-100"><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
              )}
              <Textarea
                ref={textareaRef}
                placeholder="Mensagem..."
                className="min-h-[140px] border-0 focus-visible:ring-0 resize-none py-3 px-4 bg-transparent"
                value={content}
                onChange={e => { setContent(e.target.value); cursorPositionRef.current = e.target.selectionStart; }}
                onSelect={e => cursorPositionRef.current = (e.target as any).selectionStart}
              />
              <div className="flex bg-slate-50 dark:bg-[#202c33] p-2 border-t gap-1.5 items-center">
                <div className="relative">
                  <Button variant="ghost" size="icon" onClick={() => setShowEmojiPicker(!showEmojiPicker)}><Smile className="h-5 w-5" /></Button>
                  {showEmojiPicker && <div className="absolute bottom-12 left-0 z-50 shadow-2xl"><EmojiPicker onEmojiClick={handleEmojiClick} theme="light" /></div>}
                </div>
                <Label className="p-2 cursor-pointer hover:bg-slate-200 rounded-lg">
                  <Paperclip className="h-5 w-5" />
                  <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                </Label>
                <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-lg border cursor-pointer", signEnabled ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700" : "bg-white text-muted-foreground")} onClick={() => setSignEnabled(!signEnabled)}>
                  <span className="text-[11px] font-bold">Assinar</span>
                  <Switch checked={signEnabled} onCheckedChange={setSignEnabled} className="h-4 w-7" />
                </div>
                <Button variant="ghost" size="icon" onClick={isRecording ? stopRecording : startRecording} className={cn("ml-auto", isRecording && "bg-rose-100 text-rose-500 animate-pulse")}>
                  {isRecording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="p-8 border-t bg-card/30">
            <Button className="w-full h-14 rounded-2xl font-black text-lg bg-emerald-600 hover:bg-emerald-500" onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6 mr-2" />}
              {editingDispatch ? "SALVAR ALTERAÇÕES" : "CONFIRMAR DISPARO"}
            </Button>
          </div>
        </div>

        {/* PREVIEW SIDE */}
        <div className="hidden md:flex bg-[#EFEAE2] dark:bg-[#0c141a] w-[420px] shrink-0 border-l relative overflow-hidden flex-col">
          <div className="bg-[#075E54] dark:bg-[#202c33] text-white px-5 py-4 flex items-center gap-4 z-10">
            <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center"><ImageIcon className="h-6 w-6" /></div>
            <div>
              <div className="font-bold text-sm">CC Mergulho Oficial</div>
              <div className="text-white/60 text-[10px] uppercase tracking-widest">Online</div>
            </div>
          </div>
          <div className="flex-1 p-4 overflow-y-auto flex flex-col justify-end gap-2 pb-6">
            {content && (
              <WaBubble time="Agora">
                <div className="px-1.5 py-0.5 text-[15px] leading-snug">
                  {signEnabled && <><strong className="text-emerald-700">{signatureName}:</strong><br /></>}
                  {renderWhatsAppText(content)}
                </div>
              </WaBubble>
            )}
            {attachments.map(att => (
              <WaBubble key={att.id} time="Agora">
                {att.type === "image" && <img src={att.url} className="w-full rounded-lg" />}
                {att.type === "video" && <video src={att.url} className="w-full rounded-lg" controls />}
                {att.type === "audio" && <AudioBubblePlayer src={att.url} />}
                {att.type === "document" && <div className="flex items-center gap-2 p-2 bg-black/5 rounded-lg"><FileText className="h-5 w-5" /><span className="text-xs truncate">{att.name}</span></div>}
              </WaBubble>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
