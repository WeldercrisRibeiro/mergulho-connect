import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { Shield, Plus, Users, Calendar, BookOpen, Trash2, Edit2, Key } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/hooks/use-toast";

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

  const { data: groups } = useQuery({
    queryKey: ["admin-groups"],
    queryFn: async () => {
      const { data } = await supabase.from("groups").select("*").order("name");
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("groups").insert({ name, description: desc });
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
      const { error } = await supabase.from("groups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-groups"] });
      toast({ title: "Grupo removido!" });
    },
  });

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
        {groups?.map((g) => (
          <Card key={g.id} className="border-0 bg-muted/30">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{g.name}</p>
                <p className="text-xs text-muted-foreground">{g.description}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(g.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
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
  const { user } = useAuth();

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
      const { data } = await supabase.from("groups").select("id, name");
      return data || [];
    },
  });

  const { data: events } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => {
      const { data } = await supabase.from("events").select("*, groups(name)").order("event_date", { ascending: false });
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
        const { error } = await supabase.from("events").update(payload).eq("id", editingEvent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("events").insert(payload);
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
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
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
        {events?.map((ev) => (
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
      const { data } = await supabase.from("devotionals").select("*").order("publish_date", { ascending: false });
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
        const { error } = await supabase.from("devotionals").update(payload).eq("id", editingDev.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("devotionals").insert(payload);
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
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("devotionals").delete().eq("id", id);
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

  const [editingMember, setEditingMember] = useState<any>(null);
  const [creatingMember, setCreatingMember] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState("membro");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [resettingPasswordMember, setResettingPasswordMember] = useState<any>(null);

  const { data: allGroups } = useQuery({
    queryKey: ["admin-groups-list"],
    queryFn: async () => {
      const { data } = await supabase.from("groups").select("id, name");
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

      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      const { data: mgs } = await supabase.from("member_groups").select("user_id, group_id, groups(name)");

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
    setEditPhone(m.whatsapp_phone || "");
    setEditRole(m.roles?.[0]?.role || "membro");
    setSelectedGroups(m.group_ids || []);
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingMember) return;
      const { error: pErr } = await supabase.from("profiles").update({ full_name: editName, whatsapp_phone: editPhone }).eq("id", editingMember.id);
      if (pErr) throw pErr;

      // role
      const hasRole = editingMember.roles?.length > 0;
      if (hasRole) {
        await supabase.from("user_roles").update({ role: editRole as any }).eq("user_id", editingMember.user_id);
      } else {
        await supabase.from("user_roles").insert({ user_id: editingMember.user_id, role: editRole as any });
      }

      // groups
      await supabase.from("member_groups").delete().eq("user_id", editingMember.user_id);
      if (selectedGroups.length > 0) {
        const inserts = selectedGroups.map(gid => ({ user_id: editingMember.user_id, group_id: gid }));
        await supabase.from("member_groups").insert(inserts);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-members"] });
      setEditingMember(null);
      toast({ title: "Membro atualizado!" });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao atualizar", description: err.message, variant: "destructive" });
    }
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (m: any) => {
      // Delete from profiles and roles/groups (cascades), then from auth via RPC
      await supabase.from("member_groups").delete().eq("user_id", m.user_id);
      await supabase.from("user_roles").delete().eq("user_id", m.user_id);
      await supabase.from("profiles").delete().eq("id", m.id);
      // Try to delete from auth profile only (auth user deletion requires service_role)
      try { await (supabase.rpc("admin_create_user" as any, { _delete: true, user_id: m.user_id }) as any); } catch (_) { }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-members"] });
      toast({ title: "Perfil removido", description: "Conta de acesso pode precisar ser removida manualmente no Supabase." });
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (m: any) => {
      // Use phone based email if username is not present, following the pattern in createMemberMutation
      const login = m.username || m.whatsapp_phone?.replace(/\D/g, "");
      const email = (login + "@mergulhoconnect.com").toLowerCase();
      
      const { error } = await supabase.rpc("admin_manage_user" as any, {
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
      toast({ title: "Erro ao resetar senha", description: err.message, variant: "destructive" });
    }
  });

  const createMemberMutation = useMutation({
    mutationFn: async () => {
      const email = editPhone.replace(/\D/g, "") + "@mergulhoconnect.com";
      const payload = {
        email,
        password: "123456",
        raw_user_meta_data: { full_name: editName, whatsapp_phone: editPhone }
      };

      const { data, error } = await supabase.rpc("admin_create_user" as any, payload);
      if (error) throw error;

      const newUserId = data as any as string;

      // Update role & groups for new user
      if (editRole === "admin") {
        await supabase.from("user_roles").insert({ user_id: newUserId, role: "admin" } as any);
      }
      if (selectedGroups.length > 0) {
        const inserts = selectedGroups.map(gid => ({ user_id: newUserId, group_id: gid }));
        await supabase.from("member_groups").insert(inserts as any);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-members"] });
      setCreatingMember(false);
      toast({ title: "Membro criado!", description: "A senha padrão dele é: 123456" });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao criar membro", description: err.message, variant: "destructive" });
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
          <Card key={m.id} className="border-0 bg-muted/30">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{m.full_name || "Sem nome"}</p>
                <p className="text-xs text-muted-foreground">{m.whatsapp_phone}</p>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {(m as any).roles?.map((r: any) => (
                    <Badge key={r.role} variant={r.role === "admin" ? "default" : "secondary"} className="text-xs">
                      {r.role}
                    </Badge>
                  ))}
                  {(m as any).groups?.map((name: string) => (
                    <Badge key={name} variant="outline" className="text-xs">
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" 
                  onClick={() => setResettingPasswordMember(m)}
                  title="Resetar Senha"
                >
                  <Key className="h-4 w-4 text-amber-500" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleEdit(m)}>
                  <Edit2 className="h-4 w-4 text-primary" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
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
              <Label>Permissão</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="membro">Membro / Usuário Comum</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
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
                    <label htmlFor={`group-${g.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {g.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
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
                    <label htmlFor={`gcreate-${g.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
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
      const { data } = await supabase.from("contact_messages" as any).select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (m: any) => {
      const email = m.phone.replace(/\D/g, "") + "@mergulhoconnect.com";
      const payload = {
        email,
        password: "123456",
        raw_user_meta_data: { full_name: m.name, whatsapp_phone: m.phone }
      };

      const { data, error } = await supabase.rpc("admin_create_user" as any, payload);
      if (error) throw error;

      const newUserId = data as any as string;

      // Definy default role
      await supabase.from("user_roles").insert({ user_id: newUserId, role: "membro" } as any);

      // Deleta a mensagem
      const { error: delErr } = await supabase.from("contact_messages" as any).delete().eq("id", m.id);
      if (delErr) throw delErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-messages"] });
      queryClient.invalidateQueries({ queryKey: ["admin-members"] });
      toast({ title: "Membro Aprovado!", description: "Conta criada e mensagem arquivada." });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  });

  const deleteMsgMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contact_messages" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-messages"] });
    }
  });

  return (
    <div className="space-y-4 mt-4">
      {(!messages || messages.length === 0) && (
        <Card className="border-0 bg-muted/30">
          <CardContent className="p-6 text-center text-muted-foreground">
            Nenhuma mensagem de contato encontrada.
          </CardContent>
        </Card>
      )}
      {messages?.map((m: any) => (
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
                <Button variant="outline" size="sm" onClick={() => deleteMsgMutation.mutate(m.id)} disabled={deleteMsgMutation.isPending}>
                  Arquivar Mensagem
                </Button>
                {(m.subject === "Quero me tornar Membro" || m.subject === "Contribuir/Servir") && (
                  <Button size="sm" onClick={() => approveMutation.mutate(m)} disabled={approveMutation.isPending} className="bg-emerald-500 hover:bg-emerald-600">
                    Aprovar Acesso
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Admin;
