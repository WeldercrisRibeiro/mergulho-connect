import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Info, ImagePlus, Upload, Loader2, X, Ticket, Settings, QrCode, Globe, Plus, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/errorMessages";

interface EventFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  editingEvent?: any;
  isAdmin: boolean;
  userGroups: string[];
  allGroups: any[];
  user: any;
  isSaving: boolean;
}

const generateSafeId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const EventFormDialog = ({
  open,
  onClose,
  onSave,
  editingEvent,
  isAdmin,
  userGroups,
  allGroups,
  user,
  isSaving
}: EventFormDialogProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    isGeneral: isAdmin ? "true" : "false",
    groupId: "",
    eventType: "simple",
    bannerUrl: "",
    speakers: "",
    price: 0,
    pixKey: "",
    pixQrcodeUrl: "",
    mapUrl: "",
    requireCheckin: false,
    isPublic: false,
  });

  useEffect(() => {
    if (editingEvent) {
      const d = editingEvent.eventDate ? new Date(editingEvent.eventDate) : new Date();
      if (editingEvent.eventDate) {
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      }
      
      setFormData({
        title: editingEvent.title || "",
        description: editingEvent.description || "",
        date: editingEvent.eventDate ? d.toISOString().slice(0, 16) : "",
        location: editingEvent.location || "",
        isGeneral: editingEvent.isGeneral ? "true" : "false",
        groupId: editingEvent.groupId || "",
        eventType: editingEvent.eventType || "simple",
        bannerUrl: editingEvent.bannerUrl || "",
        speakers: editingEvent.speakers || "",
        price: editingEvent.price || 0,
        pixKey: editingEvent.pixKey || "",
        pixQrcodeUrl: editingEvent.pixQrcodeUrl || "",
        mapUrl: editingEvent.mapUrl || "",
        requireCheckin: editingEvent.requireCheckin || false,
        isPublic: editingEvent.isPublic || false,
      });
    } else {
      setFormData({
        title: "",
        description: "",
        date: "",
        location: "",
        isGeneral: isAdmin ? "true" : "false",
        groupId: "",
        eventType: "simple",
        bannerUrl: "",
        speakers: "",
        price: 0,
        pixKey: "",
        pixQrcodeUrl: "",
        mapUrl: "",
        requireCheckin: false,
        isPublic: false,
      });
    }
  }, [editingEvent, isAdmin, open]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      const { data: uploadData } = await api.post('/upload', uploadFormData);
      setFormData(prev => ({ ...prev, bannerUrl: uploadData.url }));
      toast({ title: "Banner carregado com sucesso!" });
    } catch (err: any) {
      toast({ title: "Erro no upload", description: getErrorMessage(err), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    const payload = {
      ...formData,
      eventDate: formData.date ? new Date(formData.date).toISOString() : null,
      isGeneral: formData.isGeneral === "true",
      groupId: formData.isGeneral === "false" && formData.groupId ? formData.groupId : null,
      createdBy: user?.id,
      checkinQrSecret: formData.requireCheckin ? (editingEvent?.checkinQrSecret || generateSafeId()) : null,
    };
    onSave(payload);
  };

  return (
    <Dialog open={open} onOpenChange={val => !val && onClose()}>
      <DialogContent className="w-[95vw] sm:max-w-[800px] max-h-[90svh] overflow-y-auto rounded-[1.75rem] sm:rounded-3xl border-0 p-0 shadow-2xl custom-scrollbar">
        <DialogHeader className="px-5 pt-6 sm:px-6">
          <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            {editingEvent ? <Edit2 className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
            {editingEvent ? "Editar Evento" : "Novo Evento"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-8 px-5 py-6 sm:px-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground border-b pb-2">
              <Info className="h-3.5 w-3.5" /> Informações Básicas
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Título</Label>
                <Input placeholder="Título do evento" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} className="rounded-xl h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Tipo de Evento</Label>
                <Select value={formData.eventType} onValueChange={v => setFormData(p => ({ ...p, eventType: v }))}>
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
                <Input placeholder="Onde será o evento?" value={formData.location} onChange={e => setFormData(p => ({ ...p, location: e.target.value }))} className="rounded-xl h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Link do Mapa (opcional)</Label>
                <Input placeholder="https://maps.google.com/..." value={formData.mapUrl} onChange={e => setFormData(p => ({ ...p, mapUrl: e.target.value }))} className="rounded-xl h-11" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase">Descrição</Label>
              <Textarea placeholder="Breve descritivo..." value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows={3} className="rounded-2xl resize-none" />
            </div>
          </div>

          {/* Banner */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground border-b pb-2">
              <ImagePlus className="h-3.5 w-3.5" /> Banner do Evento
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input placeholder="URL da imagem..." value={formData.bannerUrl} onChange={e => setFormData(p => ({ ...p, bannerUrl: e.target.value }))} className="flex-1 rounded-xl h-11" />
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
              <Button variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="rounded-xl px-6 sm:self-start">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                {uploading ? "Sendo..." : "Upload"}
              </Button>
            </div>
            {formData.bannerUrl && (
              <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-muted shadow-inner bg-muted/20">
                <img src={formData.bannerUrl} className="w-full h-full object-cover" />
                <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8 rounded-full" onClick={() => setFormData(p => ({ ...p, bannerUrl: "" }))}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Detalhes Complexos */}
          {(formData.eventType === "course" || formData.eventType === "conference") && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground border-b pb-2">
                <Ticket className="h-3.5 w-3.5" /> Detalhes do Evento
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Palestrantes</Label>
                <Input placeholder="Nomes separados por vírgula" value={formData.speakers} onChange={e => setFormData(p => ({ ...p, speakers: e.target.value }))} className="rounded-xl h-11" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">Valor (R$) — 0 se gratuito</Label>
                  <Input type="number" min={0} step={0.01} value={formData.price} onChange={e => setFormData(p => ({ ...p, price: Number(e.target.value) }))} className="rounded-xl h-11" />
                </div>
                {formData.price > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase">Chave PIX</Label>
                    <Input placeholder="email@, CPF, telefone..." value={formData.pixKey} onChange={e => setFormData(p => ({ ...p, pixKey: e.target.value }))} className="rounded-xl h-11" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Configurações de Data e Visibilidade */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground border-b pb-2">
              <Settings className="h-3.5 w-3.5" /> Configurações de Data e Visibilidade
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-primary">Data e Hora do Evento</Label>
                <Input type="datetime-local" value={formData.date} onChange={e => setFormData(p => ({ ...p, date: e.target.value }))} className="rounded-xl h-11 border-primary/30 bg-primary/5" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Escopo de Visibilidade</Label>
                <Select
                  value={formData.isGeneral}
                  onValueChange={(v) => { setFormData(p => ({ ...p, isGeneral: v, groupId: v === "true" ? "" : p.groupId })); }}
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

            {formData.isGeneral === "false" && (
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Selecione o Departamento / Grupo</Label>
                <Select value={formData.groupId || ""} onValueChange={v => setFormData(p => ({ ...p, groupId: v }))}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue placeholder="Escolha o departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {allGroups?.filter(g => isAdmin || userGroups?.includes(g.id)).map((group) => (
                      <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Toggles */}
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
                  checked={formData.requireCheckin}
                  onChange={(e) => setFormData(p => ({ ...p, requireCheckin: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
              </label>
            </div>

            <div className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-200 ${formData.isPublic ? "bg-blue-500/10 border-blue-500/40" : "bg-muted/20 border-border"}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl transition-colors ${formData.isPublic ? "bg-blue-500/20 text-blue-600" : "bg-muted text-muted-foreground"}`}>
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">Tornar público na Landing Page</p>
                  <p className="text-[10px] text-muted-foreground">Exibe o evento na agenda pública.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData(p => ({ ...p, isPublic: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className={`w-11 h-6 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full transition-colors bg-muted peer-checked:bg-blue-500`} />
              </label>
            </div>
          </div>
        </div>
        <DialogFooter className="sticky bottom-0 gap-2 border-t bg-background/95 px-5 py-4 pb-safe backdrop-blur-sm sm:px-6">
          <Button variant="outline" onClick={onClose} className="w-full rounded-xl border-2 sm:w-auto">Cancelar</Button>
          <Button onClick={handleSave} disabled={!formData.title || !formData.date || isSaving} className="w-full rounded-xl px-12 font-bold sm:w-auto">
            {isSaving ? "Salvando..." : editingEvent ? "Salvar Alterações" : "Criar Evento Agora"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
