import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Plus, Users, Calendar, BookOpen, Trash2, Edit2, Key, Archive, User, Camera, Upload } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { normalizePhoneForDB, formatPhoneForDisplay } from "@/lib/phoneUtils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getErrorMessage } from "@/lib/errorMessages";

const Admin = () => {
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  if (!isAdmin) return <Navigate to="/home" replace />;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" />
        Painel Administrativo
      </h1>

      <Tabs defaultValue="groups">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="groups">departamentos</TabsTrigger>
          <TabsTrigger value="events">Eventos</TabsTrigger>
          <TabsTrigger value="devotionals">Devocionais</TabsTrigger>
          <TabsTrigger value="members">Membros</TabsTrigger>
          <TabsTrigger value="messages">Contatos</TabsTrigger>
        </TabsList>

        <TabsContent value="groups"><AdminGroups /></TabsContent>
        <TabsContent value="events"><AdminEvents /></TabsContent>
        <TabsContent value="devotionals"><AdminDevotionals /></TabsContent>
        <TabsContent value="members"><AdminMembers /></TabsContent>
        <TabsContent value="messages"><AdminMessages /></TabsContent>
      </Tabs>
    </div>
  );
};

const AdminGroups = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeGroupForUpload, setActiveGroupForUpload] = useState<string | null>(null);

  const { data: groups } = useQuery({
    queryKey: ["admin-groups"],
    queryFn: async () => {
      const { data } = await api.get("/groups");
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post("/groups", { name, description: desc }); const error = null;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-groups"] });
      setName(""); setDesc("");
      toast({ title: "Grupo criado!" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/groups/${id}`); const error = null;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-groups"] });
      toast({ title: "Grupo removido!" });
    },
  });

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeGroupForUpload) return;

    setUploadingId(activeGroupForUpload);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `group_${activeGroupForUpload}_${Date.now()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from("group-icons")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("group-icons").getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from("groups")
        .update({ icon: publicUrl })
        .eq("id", activeGroupForUpload);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ["admin-groups"] });
      toast({ title: "Ícone atualizado!" });
    } catch (err: any) {
      toast({ title: "Erro no upload", description: getErrorMessage(err), variant: "destructive" });
    } finally {
      setUploadingId(null);
      setActiveGroupForUpload(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const triggerUpload = (groupId: string) => {
    setActiveGroupForUpload(groupId);
    setTimeout(() => fileInputRef.current?.click(), 100);
  };

  return (
    <div className="space-y-4 mt-4">
      <Card className="neo-shadow-sm border-0">
        <CardHeader><CardTitle className="text-base">Novo Grupo</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Nome do grupo" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Descrição" value={desc} onChange={(e) => setDesc(e.target.value)} />
          <Button onClick={() => createMutation.mutate()} disabled={!name}><Plus className="h-4 w-4 mr-1" /> Criar</Button>
        </CardContent>
      </Card>
      <div className="space-y-2">
        <input 
          type="file" 
          hidden 
          ref={fileInputRef} 
          onChange={handleIconUpload} 
          accept="image/*"
        />
        {groups?.map((g) => (
          <Card key={g.id} className="border-0 bg-muted/30 hover:bg-muted/50 transition-colors">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div 
                  className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-primary/20 cursor-pointer group relative"
                  onClick={() => triggerUpload(g.id)}
                >
                  {g.icon && (g.icon.startsWith('http') || g.icon.startsWith('/')) ? (
                    <img src={g.icon} alt={g.name} className="h-full w-full object-cover" />
                  ) : (
                    <Users className="h-6 w-6 text-primary" />
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                  {uploadingId === g.id && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-bold text-sm tracking-tight">{g.name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-black">{g.description || "Sem descrição"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => triggerUpload(g.id)} className="h-8 w-8 text-primary">
                  <Camera className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(g.id)} className="h-8 w-8">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const AdminEvents = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, isAdmin, isGerente, isAdminCCM } = useAuth();

  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [isGeneral, setIsGeneral] = useState("true");
  const [groupId, setGroupId] = useState("");

  const { data: groups } = useQuery({
    queryKey: ["groups-for-events"],
    queryFn: async () => {
      const { data } = await api.get("/groups");
      return data || [];
    },
  });

  const { data: adminEvents } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => {
      const { data } = await api.get("/events", { params: { orderDesc: true, includeGroup: true } });
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title,
        description: desc || null,
        event_date: new Date(date).toISOString(),
        location: location || null,
        is_general: isGeneral === "true",
        group_id: isGeneral === "true" ? null : groupId || null,
        created_by: user!.id,
      };

      if (editingEvent) {
        await api.patch(`/events/${editingEvent.id}`, payload); const error = null;
        if (error) throw error;
      } else {
        await api.post("/events", payload); const error = null;
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["next-events"] });
      setTitle(""); setDesc(""); setDate(""); setLocation(""); setEditingEvent(null);
      toast({ title: editingEvent ? "Evento atualizado!" : "Evento criado!" });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: getErrorMessage(err), variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/events/${id}`); const error = null;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["next-events"] });
      toast({ title: "Evento removido!" });
    }
  });

  const handleEdit = (ev: any) => {
    setEditingEvent(ev);
    setTitle(ev.title);
    setDesc(ev.description || "");
    setLocation(ev.location || "");
    setIsGeneral(ev.is_general ? "true" : "false");
    setGroupId(ev.group_id || "");

    if (ev.event_date) {
      const d = new Date(ev.event_date);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      setDate(d.toISOString().slice(0, 16));
    }
  };

  const ContentForm = () => (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Título</Label>
        <Input placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Descrição</Label>
        <Textarea placeholder="Descrição" value={desc} onChange={(e) => setDesc(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Data e Hora</Label>
        <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Local</Label>
        <Input placeholder="Local" value={location} onChange={(e) => setLocation(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Tipo de Evento</Label>
        <Select value={isGeneral} onValueChange={setIsGeneral}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Evento Geral</SelectItem>
            <SelectItem value="false">Evento de Grupo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {isGeneral === "false" && (
        <div className="space-y-2">
          <Label>Grupo do Evento</Label>
          <Select value={groupId} onValueChange={setGroupId}>
            <SelectTrigger><SelectValue placeholder="Selecione o grupo" /></SelectTrigger>
            <SelectContent>
              {groups?.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4 mt-4">
      {!editingEvent && (
        <Card className="neo-shadow-sm border-0">
          <CardHeader><CardTitle className="text-base flex justify-between">Novo Evento</CardTitle></CardHeader>
          <CardContent>
            <ContentForm />
            <Button onClick={() => saveMutation.mutate()} disabled={!title || !date || saveMutation.isPending} className="mt-2 text-white">
              <Plus className="h-4 w-4 mr-1" /> {saveMutation.isPending ? "Salvando..." : "Criar Evento"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {adminEvents?.map((ev) => (
          <Card key={ev.id} className="border-0 bg-muted/30">
            <CardContent className="flex items-center justify-between p-4 flex-wrap gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{ev.title}</p>
                  <Badge variant={ev.is_general ? "default" : "secondary"} className="text-[10px]">
                    {ev.is_general ? "Geral" : ((ev.groups as any)?.name || "Grupo")}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate max-w-sm">
                  {ev.description}
                </p>
                {ev.event_date && (
                  <p className="text-xs font-mono text-muted-foreground/60 mt-1">
                    {new Date(ev.event_date).toLocaleString("pt-BR")}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(ev)}>
                  <Edit2 className="h-4 w-4 text-primary" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(ev.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editingEvent} onOpenChange={(val) => {
        if (!val) {
          setEditingEvent(null);
          setTitle(""); setDesc(""); setDate(""); setLocation(""); setIsGeneral("true"); setGroupId("");
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Evento</DialogTitle></DialogHeader>
          <ContentForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEvent(null)}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!title || !date || saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const AdminDevotionals = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const [editingDev, setEditingDev] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [status, setStatus] = useState("published");
  const [publishDate, setPublishDate] = useState("");

  const { data: devotionals } = useQuery({
    queryKey: ["admin-devotionals"],
    queryFn: async () => {
      const { data } = await api.get("/devotionals");
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title,
        content,
        media_url: mediaUrl || null,
        status,
        publish_date: publishDate ? new Date(publishDate).toISOString() : new Date().toISOString(),
        author_id: user!.id,
      };

      if (editingDev) {
        await api.patch(`/devotionals/${editingDev.id}`, payload); const error = null;
        if (error) throw error;
      } else {
        await api.post("/devotionals", payload); const error = null;
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-devotionals"] });
      queryClient.invalidateQueries({ queryKey: ["devotionals"] });
      setTitle(""); setContent(""); setMediaUrl(""); setPublishDate(""); setEditingDev(null);
      toast({ title: editingDev ? "Devocional atualizado!" : "Devocional criado!" });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: getErrorMessage(err), variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/devotionals/${id}`); const error = null;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-devotionals"] });
      queryClient.invalidateQueries({ queryKey: ["devotionals"] });
      toast({ title: "Devocional removido!" });
    }
  });

  const handleEdit = (dev: any) => {
    setEditingDev(dev);
    setTitle(dev.title);
    setContent(dev.content);
    setMediaUrl(dev.media_url || "");
    setStatus(dev.status);

    // adjust date for local input
    if (dev.publish_date) {
      const d = new Date(dev.publish_date);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      setPublishDate(d.toISOString().slice(0, 16));
    }
  };

  const ContentForm = () => (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Título</Label>
        <Input placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Conteúdo</Label>
        <Textarea placeholder="Conteúdo do devocional..." value={content} onChange={(e) => setContent(e.target.value)} rows={6} />
      </div>
      <div className="space-y-2">
        <Label>URL de Mídia (YouTube/Imagem)</Label>
        <Input placeholder="Opcional" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="published">Publicar agora</SelectItem>
            <SelectItem value="scheduled">Agendar</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {status === "scheduled" && (
        <div className="space-y-2">
          <Label>Data de Publicação</Label>
          <Input type="datetime-local" value={publishDate} onChange={(e) => setPublishDate(e.target.value)} />
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4 mt-4">
      {!editingDev && (
        <Card className="neo-shadow-sm border-0">
          <CardHeader><CardTitle className="text-base flex justify-between">Novo Devocional</CardTitle></CardHeader>
          <CardContent>
            <ContentForm />
            <Button onClick={() => saveMutation.mutate()} disabled={!title || !content || saveMutation.isPending} className="mt-2 text-white">
              <Plus className="h-4 w-4 mr-1" /> {saveMutation.isPending ? "Salvando..." : "Criar Devocional"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {devotionals?.map((dev) => (
          <Card key={dev.id} className="border-0 bg-muted/30">
            <CardContent className="flex items-center justify-between p-4 flex-wrap gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{dev.title}</p>
                  <Badge variant={dev.status === "published" ? "default" : "secondary"} className="text-[10px]">
                    {dev.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate max-w-sm">
                  {dev.content}
                </p>
                {dev.publish_date && (
                  <p className="text-xs font-mono text-muted-foreground/60 mt-1">
                    Publica em: {new Date(dev.publish_date).toLocaleString("pt-BR")}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(dev)}>
                  <Edit2 className="h-4 w-4 text-primary" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(dev.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editingDev} onOpenChange={(val) => {
        if (!val) {
          setEditingDev(null);
          setTitle(""); setContent(""); setMediaUrl(""); setPublishDate(""); setStatus("published");
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Devocional</DialogTitle></DialogHeader>
          <ContentForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDev(null)}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!title || !content || saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const AdminMembers = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { isAdminCCM } = useAuth();
  const [editingMember, setEditingMember] = useState<any>(null);
  const [creatingMember, setCreatingMember] = useState(false);
  const [resettingPasswordMember, setResettingPasswordMember] = useState<any>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editRole, setEditRole] = useState("membro");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  const { data: allGroups } = useQuery({
    queryKey: ["admin-groups-list"],
    queryFn: async () => {
      const { data } = await api.get("/groups");
      return data || [];
    },
  });

  const { data: members } = useQuery({
    queryKey: ["admin-members"],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name");

      const { data: roles } = await api.get("/user-roles");
      const { data: mgs } = await api.get("/member-groups");

      return (profiles || []).map((p) => ({
        ...p,
        roles: (roles || []).filter((r) => r.user_id === p.user_id),
        groups: (mgs || []).filter((mg) => mg.user_id === p.user_id).map((mg) => (mg.groups as any)?.name).filter(Boolean),
        group_ids: (mgs || []).filter((mg) => mg.user_id === p.user_id).map((mg) => mg.group_id),
      }));
    },
  });

  const handleEdit = (m: any) => {
    setEditingMember(m);
    setEditName(m.full_name || "");
    setEditPhone(formatPhoneForDisplay(m.whatsapp_phone || ""));
    
    // Suggest name slug if current username is empty or just a phone number
    const isPhoneLike = /^\d{8,}$/.test(m.username || "");
    const nameSlug = (m.full_name || "").trim().toLowerCase().replace(/\s+/g, ".");
    setEditUsername(m.username && !isPhoneLike ? m.username : (nameSlug || m.username || ""));
    
    setEditRole(m.roles?.[0]?.role || "membro");
    setSelectedGroups(m.group_ids || []);
    setRemovePhoto(false);
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingMember) return;
      const phoneDigits = editPhone.replace(/\D/g, "");
      const cleanUsername = (editUsername || "").trim().toLowerCase().replace("@ccmergulho.com", "").replace(/\s+/g, ".") || phoneDigits;

      const { error: pErr } = await supabase.from("profiles").update({ 
        full_name: editName, 
        whatsapp_phone: normalizePhoneForDB(editPhone),
        username: cleanUsername,
        ... (removePhoto ? { avatar_url: null } : {})
      } as any).eq("id", editingMember.id);
      if (pErr) throw pErr;

      // role
      const hasRole = editingMember.roles?.length > 0;
      if (hasRole) {
        await api.post('/user-roles/upsert', { userId: editingMember.user_id, role: editRole });
      } else {
        await api.post('/user-roles/upsert', { userId: editingMember.user_id, role: editRole });
      }

      // groups
      await api.delete(`/member-groups/user/${editingMember.user_id}`);
      if (selectedGroups.length > 0) {
        const inserts = selectedGroups.map(gid => ({ user_id: editingMember.user_id, group_id: gid }));
        for (const ins of inserts) await api.post("/member-groups", { userId: ins.user_id, groupId: ins.group_id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-members"] });
      setEditingMember(null);
      toast({ title: "Membro atualizado!" });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao atualizar", description: getErrorMessage(err), variant: "destructive" });
    }
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (m: any) => {
      // Clean up all related data first
      await api.delete(`/member-groups/user/${m.user_id}`);
      await api.delete(`/user-roles/${m.user_id}`);
      
      
      
      // Delete profile
      await api.delete(`/profiles/${m.user_id}`); const error = null;
      if (error) throw error;

      // Try to delete from auth user via RPC
      try { 
        await (api.post("/auth/admin-manage-user", { 
          _delete: true, 
          target_user_id: m.user_id 
        }) as any); 
      } catch (err) {
        console.warn("Auth user deletion skipped or failed:", err);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-members"] });
      toast({ title: "Perfil removido com sucesso" });
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (m: any) => {
      const login = m.username || m.whatsapp_phone?.replace(/\D/g, "");
      const email = (login + "@ccmergulho.com").toLowerCase();
      
      await api.post("/auth/admin-manage-user", {
        email,
        password: "123456",
        target_user_id: m.user_id
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setResettingPasswordMember(null);
      toast({ 
        title: "Senha resetada!", 
        description: "A senha do usuário voltou para o padrão: 123456" 
      });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao resetar senha", description: getErrorMessage(err), variant: "destructive" });
    }
  });

  const createMemberMutation = useMutation({
    mutationFn: async () => {
      const email = editPhone.replace(/\D/g, "") + "@ccmergulho.com";
      const payload = {
        email,
        password: "123456",
        raw_user_meta_data: { full_name: editName, whatsapp_phone: normalizePhoneForDB(editPhone) }
      };

      const { data } = await api.post("/auth/admin-create-user", payload); const error = null;
      if (error) throw error;

      const newUserId = data as any as string;
      const username = editPhone.replace(/\D/g, "");

      // Force update profiles to ensure username and phone are stored
      await supabase.from("profiles").update({ 
        full_name: editName, 
        whatsapp_phone: normalizePhoneForDB(editPhone), 
        username 
      } as any).eq("user_id", newUserId);

      if (editRole === "admin_ccm" && !isAdminCCM) {
        throw new Error("Apenas ADM CCM pode criar outros ADM CCM.");
      }
      
      await api.post("/user-roles/upsert", { userId: newUserId, role: editRole });

      if (selectedGroups.length > 0) {
        const inserts = selectedGroups.map(gid => ({ user_id: newUserId, group_id: gid }));
        for (const ins of inserts) await api.post("/member-groups", { userId: ins.user_id, groupId: ins.group_id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-members"] });
      setCreatingMember(false);
      toast({ title: "Membro criado!", description: "A senha padrão dele é: 123456" });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao criar membro", description: getErrorMessage(err), variant: "destructive" });
    }
  });

  return (
    <div className="space-y-4 mt-4">
      <Card className="neo-shadow-sm border-0">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Membros</CardTitle>
          <Button onClick={() => {
            setEditName(""); setEditPhone(""); setEditRole("membro"); setSelectedGroups([]); setCreatingMember(true);
          }} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Novo Membro
          </Button>
        </CardHeader>
      </Card>

      <div className="space-y-2">
        {members?.map((m) => (
          <Card key={m.id} className="border-0 bg-muted/30 shadow-sm hover:bg-muted/40 transition-colors">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex-1 min-w-0 mr-4">
                {/* Full Name specialized row to prevent truncation */}
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-black text-base text-foreground uppercase tracking-tight truncate">
                    {m.full_name || "Sem nome"}
                  </h3>
                </div>
                
                {/* Metadata row: Phone and Username/Email */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1 bg-background/50 px-2 py-0.5 rounded-lg border border-border/10">
                    <Phone className="h-3 w-3" />
                    <span>{formatPhoneForDisplay(m.whatsapp_phone || "")}</span>
                  </div>
                  
                  {/* Smart Display Username */}
                  {(m.username || m.email) && (
                    <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-lg border border-primary/20 font-bold">
                      <User className="h-3 w-3" />
                      <span>
                        @{((m.username && !/^\d{8,}$/.test(m.username)) 
                          ? m.username 
                          : (m.email?.split('@')[0] || m.username)).toLowerCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Roles and Groups badges */}
                <div className="flex gap-1 mt-2 flex-wrap">
                  {m.roles?.some((r: any) => r.role === "admin_ccm") ? (
                    <Badge variant="default" className="bg-rose-600 text-white hover:bg-rose-700 uppercase text-[9px] px-2 shadow-sm font-black">ADM CCM</Badge>
                  ) : m.roles?.some((r: any) => r.role === "admin") ? (
                    <Badge variant="default" className="uppercase text-[9px] px-2 shadow-sm font-black">Admin</Badge>
                  ) : m.roles?.[0] ? (
                    <Badge variant="secondary" className="uppercase text-[9px] px-2 font-black">{m.roles[0].role}</Badge>
                  ) : null}
                  {m.groups?.map((name: string) => (
                    <Badge key={name} variant="outline" className="text-[9px] px-2 font-medium bg-background/50">
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" 
                  className="hover:bg-amber-500/10"
                  onClick={() => setResettingPasswordMember(m)}
                  title="Resetar Senha"
                >
                  <Key className="h-4 w-4 text-amber-500" />
                </Button>
                <Button variant="ghost" size="icon" 
                  className="hover:bg-primary/10"
                  onClick={() => handleEdit(m)}
                >
                  <Edit2 className="h-4 w-4 text-primary" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-destructive/10"
                  onClick={() => {
                    if (window.confirm(`Tem certeza que deseja excluir ${m.full_name || 'este membro'}?`)) {
                      deleteMemberMutation.mutate(m);
                    }
                  }}
                  disabled={deleteMemberMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editingMember} onOpenChange={(val) => !val && setEditingMember(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Membro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp</Label>
              <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Login / Nome de Usuário</Label>
              <Input 
                value={editUsername} 
                onChange={e => setEditUsername(e.target.value)} 
                placeholder="Ex: joao.silva"
              />
              <p className="text-[10px] text-muted-foreground">O e-mail será {editUsername || "..."}@ccmergulho.com</p>
            </div>
            <div className="space-y-2">
              <Label>Permissão</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="membro">Membro / Usuário Comum</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  {isAdminCCM && (
                    <SelectItem value="admin_ccm">Administrador CCM (Gestor Master)</SelectItem>
                  )}
                  <SelectItem value="gerente">Líder / Gerente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>departamentos</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {allGroups?.map(g => (
                  <div key={g.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`group-${g.id}`}
                      checked={selectedGroups.includes(g.id)}
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedGroups([...selectedGroups, g.id]);
                        else setSelectedGroups(selectedGroups.filter(id => id !== g.id));
                      }}
                    />
                    <label htmlFor={`group-${g.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                      <div className="h-5 w-5 rounded bg-muted flex items-center justify-center overflow-hidden border border-border">
                        {g.icon && (g.icon.startsWith('http') || g.icon.startsWith('/')) ? (
                          <img src={g.icon} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Users className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      {g.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {isAdminCCM && editingMember?.avatar_url && !removePhoto && (
               <div className="pt-2">
                 <Button 
                   variant="outline" 
                   size="sm" 
                   className="w-full text-destructive border-destructive/20 hover:bg-destructive/10 gap-2 h-10 rounded-xl"
                   onClick={() => setRemovePhoto(true)}
                 >
                   <Trash2 className="h-4 w-4" /> Remover Foto do Usuário
                 </Button>
               </div>
            )}
            
            {removePhoto && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center">
                <p className="text-xs font-bold text-rose-600">A foto será apagada ao salvar.</p>
                <Button variant="link" size="sm" onClick={() => setRemovePhoto(false)} className="h-6 text-[10px] text-rose-500">Cancelar</Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMember(null)}>Cancelar</Button>
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={creatingMember} onOpenChange={(val) => !val && setCreatingMember(false)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Membro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-primary/10 border-l-4 border-primary p-3 rounded text-sm text-primary mb-4 font-medium">
              A senha padrão para acessos criados pelo Administrador é: <strong>123456</strong>
            </div>
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Telefone (Será o Login do novo membro)</Label>
              <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="(11) 99999-9999" required />
            </div>
            <div className="space-y-2">
              <Label>Permissão</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="membro">Membro / Usuário Comum</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  {isAdminCCM && (
                    <SelectItem value="admin_ccm">Administrador CCM (Gestor Master)</SelectItem>
                  )}
                  <SelectItem value="gerente">Líder / Gerente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>departamentos (Opcional)</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {allGroups?.map(g => (
                  <div key={g.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`gcreate-${g.id}`}
                      checked={selectedGroups.includes(g.id)}
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedGroups([...selectedGroups, g.id]);
                        else setSelectedGroups(selectedGroups.filter(id => id !== g.id));
                      }}
                    />
                    <label htmlFor={`gcreate-${g.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                      <div className="h-5 w-5 rounded bg-muted flex items-center justify-center overflow-hidden border border-border">
                        {g.icon && (g.icon.startsWith('http') || g.icon.startsWith('/')) ? (
                          <img src={g.icon} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Users className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      {g.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreatingMember(false)}>Cancelar</Button>
            <Button onClick={() => createMemberMutation.mutate()} disabled={!editPhone || !editName || createMemberMutation.isPending}>
              {createMemberMutation.isPending ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!resettingPasswordMember}
        title="Resetar Senha"
        description={`Deseja resetar a senha de ${resettingPasswordMember?.full_name}? A senha voltará para o padrão: 123456`}
        confirmLabel="Resetar"
        variant="default"
        onConfirm={() => resetPasswordMutation.mutate(resettingPasswordMember)}
        onCancel={() => setResettingPasswordMember(null)}
      />
    </div>
  );
};

const AdminMessages = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: messages } = useQuery({
    queryKey: ["admin-messages"],
    queryFn: async () => {
      const { data } = await api.get("/contact-messages");
      return data || [];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (m: any) => {
      const email = m.phone.replace(/\D/g, "") + "@ccmergulho.com";
      const payload = {
        email,
        password: "123456",
        raw_user_meta_data: { full_name: m.name, whatsapp_phone: normalizePhoneForDB(m.phone) }
      };

      const { data } = await api.post("/auth/admin-create-user", payload); const error = null;
      if (error) throw error;

      const newUserId = data as any as string;

      // Definy default role
      await api.post("/user-roles/upsert", { userId: newUserId, role: "membro" });

      // Deleta a mensagem
      await api.delete(`/contact-messages/${m.id}`); const delErr = null;
      if (delErr) throw delErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-messages"] });
      queryClient.invalidateQueries({ queryKey: ["admin-members"] });
      toast({ title: "Membro Aprovado!", description: "Conta criada e mensagem arquivada." });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: getErrorMessage(err), variant: "destructive" });
    }
  });

  const deleteMsgMutation = useMutation({
    mutationFn: async (m: any) => {
      const isArchived = m.status === 'archived';
      if (isArchived) {
         // Excluir definitivamente
         await api.delete(`/contact-messages/${m.id}`); const error = null;
         if (error) throw error;
      } else {
         // Arquivar
         await api.patch(`/contact-messages/${m.id}`, { status: "archived" }); const error = null;
         if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-messages"] });
      toast({ title: "Ação concluída com sucesso!" });
    }
  });

  const [activeTab, setActiveTab] = useState("inbox");
  const filteredMessages = messages?.filter((m: any) => activeTab === "archived" ? m.status === "archived" : m.status !== "archived") || [];

  return (
    <div className="space-y-4 mt-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 bg-muted/50 p-1 rounded-xl mb-4">
          <TabsTrigger value="inbox" className="rounded-lg">Caixa de Entrada</TabsTrigger>
          <TabsTrigger value="archived" className="rounded-lg flex gap-2">
            <Archive className="h-4 w-4" /> Arquivados
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredMessages.length === 0 && (
            <Card className="border-0 bg-muted/30">
              <CardContent className="p-6 text-center text-muted-foreground">
                Nenhuma mensagem {activeTab === "archived" ? "arquivada" : "na caixa de entrada"}.
              </CardContent>
            </Card>
          )}
          {filteredMessages.map((m: any) => (
        <Card key={m.id} className="border-0 bg-muted/30">
          <CardContent className="p-4">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{m.name}</p>
                  <p className="text-sm font-medium text-primary mt-1">Whatsapp: {m.phone}</p>
                </div>
                {m.created_at && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(m.created_at).toLocaleDateString("pt-BR")}
                  </span>
                )}
              </div>
              <div className="bg-background rounded-md p-3 mt-2 text-sm border neo-shadow-sm mb-2">
                <p className="font-medium mb-1 border-b pb-1">Assunto: {m.subject}</p>
                <p className="text-muted-foreground whitespace-pre-wrap">{m.message}</p>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={() => deleteMsgMutation.mutate(m)} disabled={deleteMsgMutation.isPending}>
                  {m.status === 'archived' ? 'Excluir Definitivamente' : 'Arquivar Mensagem'}
                </Button>
                {m.status !== 'archived' && (m.subject === "Quero me tornar Membro" || m.subject === "Contribuir/Servir") && (
                  <Button size="sm" onClick={() => approveMutation.mutate(m)} disabled={approveMutation.isPending} className="bg-emerald-500 hover:bg-emerald-600">
                    Aprovar Acesso
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
