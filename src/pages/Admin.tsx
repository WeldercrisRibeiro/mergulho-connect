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
import { Shield, Plus, Users, Calendar, BookOpen, Trash2 } from "lucide-react";
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
        <TabsList className="w-full justify-start">
          <TabsTrigger value="groups">Grupos</TabsTrigger>
          <TabsTrigger value="events">Eventos</TabsTrigger>
          <TabsTrigger value="devotionals">Devocionais</TabsTrigger>
          <TabsTrigger value="members">Membros</TabsTrigger>
        </TabsList>

        <TabsContent value="groups"><AdminGroups /></TabsContent>
        <TabsContent value="events"><AdminEvents /></TabsContent>
        <TabsContent value="devotionals"><AdminDevotionals /></TabsContent>
        <TabsContent value="members"><AdminMembers /></TabsContent>
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

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("events").insert({
        title,
        description: desc || null,
        event_date: new Date(date).toISOString(),
        location: location || null,
        is_general: isGeneral === "true",
        group_id: isGeneral === "true" ? null : groupId || null,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setTitle(""); setDesc(""); setDate(""); setLocation("");
      toast({ title: "Evento criado!" });
    },
  });

  return (
    <div className="space-y-4 mt-4">
      <Card className="neo-shadow-sm border-0">
        <CardHeader><CardTitle className="text-base">Novo Evento</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea placeholder="Descrição" value={desc} onChange={(e) => setDesc(e.target.value)} />
          <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input placeholder="Local" value={location} onChange={(e) => setLocation(e.target.value)} />
          <Select value={isGeneral} onValueChange={setIsGeneral}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Evento Geral</SelectItem>
              <SelectItem value="false">Evento de Grupo</SelectItem>
            </SelectContent>
          </Select>
          {isGeneral === "false" && (
            <Select value={groupId} onValueChange={setGroupId}>
              <SelectTrigger><SelectValue placeholder="Selecione o grupo" /></SelectTrigger>
              <SelectContent>
                {groups?.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Button onClick={() => createMutation.mutate()} disabled={!title || !date}><Plus className="h-4 w-4 mr-1" /> Criar Evento</Button>
        </CardContent>
      </Card>
    </div>
  );
};

const AdminDevotionals = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [status, setStatus] = useState("published");
  const [publishDate, setPublishDate] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("devotionals").insert({
        title,
        content,
        media_url: mediaUrl || null,
        status,
        publish_date: publishDate ? new Date(publishDate).toISOString() : new Date().toISOString(),
        author_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devotionals"] });
      setTitle(""); setContent(""); setMediaUrl(""); setPublishDate("");
      toast({ title: "Devocional criado!" });
    },
  });

  return (
    <div className="space-y-4 mt-4">
      <Card className="neo-shadow-sm border-0">
        <CardHeader><CardTitle className="text-base">Novo Devocional</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea placeholder="Conteúdo do devocional..." value={content} onChange={(e) => setContent(e.target.value)} rows={6} />
          <Input placeholder="URL de mídia (YouTube, imagem)" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="published">Publicar agora</SelectItem>
              <SelectItem value="scheduled">Agendar</SelectItem>
              <SelectItem value="draft">Rascunho</SelectItem>
            </SelectContent>
          </Select>
          {status === "scheduled" && (
            <Input type="datetime-local" value={publishDate} onChange={(e) => setPublishDate(e.target.value)} />
          )}
          <Button onClick={() => createMutation.mutate()} disabled={!title || !content}><Plus className="h-4 w-4 mr-1" /> Criar Devocional</Button>
        </CardContent>
      </Card>
    </div>
  );
};

const AdminMembers = () => {
  const { data: members } = useQuery({
    queryKey: ["admin-members"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*, user_roles(role), member_groups(groups(name))")
        .order("full_name");
      return data || [];
    },
  });

  return (
    <div className="space-y-2 mt-4">
      {members?.map((m) => (
        <Card key={m.id} className="border-0 bg-muted/30">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">{m.full_name || "Sem nome"}</p>
              <p className="text-xs text-muted-foreground">{m.whatsapp_phone}</p>
              <div className="flex gap-1 mt-1 flex-wrap">
                {m.user_roles?.map((r: any) => (
                  <Badge key={r.role} variant={r.role === "admin" ? "default" : "secondary"} className="text-xs">
                    {r.role}
                  </Badge>
                ))}
                {m.member_groups?.map((mg: any) => (
                  <Badge key={mg.groups?.name} variant="outline" className="text-xs">
                    {mg.groups?.name}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Admin;
