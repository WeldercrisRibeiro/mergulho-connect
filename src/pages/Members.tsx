import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Search, Phone, Edit2, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Members = () => {
  const [search, setSearch] = useState("");
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editingMember, setEditingMember] = useState<any>(null);
  const [creatingMember, setCreatingMember] = useState(false);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState("member");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  if (!isAdmin) {
    return <Navigate to="/home" replace />;
  }

  const { data: allGroups } = useQuery({
    queryKey: ["members-groups-list"],
    queryFn: async () => {
      const { data } = await supabase.from("groups").select("id, name");
      return data || [];
    },
  });

  const { data: members } = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("*");
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      const { data: memberGroupsData } = await supabase
        .from("member_groups")
        .select("user_id, group_id, groups(name)");

      return (profiles || []).map((p) => ({
        ...p,
        roles: (roles || []).filter((r) => r.user_id === p.user_id),
        groups: (memberGroupsData || [])
          .filter((mg) => mg.user_id === p.user_id)
          .map((mg) => (mg.groups as any)?.name)
          .filter(Boolean),
        group_ids: (memberGroupsData || [])
          .filter((mg) => mg.user_id === p.user_id)
          .map((mg) => mg.group_id),
      }));
    },
  });

  const filtered = members?.filter((m) =>
    (m.full_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (m: any) => {
    setEditingMember(m);
    setEditName(m.full_name || "");
    setEditUsername(m.username || "");
    setEditPhone(m.whatsapp_phone || "");
    setEditRole(m.roles?.[0]?.role || "member");
    setSelectedGroups(m.group_ids || []);
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingMember) return;
      await supabase.from("profiles").update({ full_name: editName, whatsapp_phone: editPhone }).eq("id", editingMember.id);
      const hasRole = editingMember.roles?.length > 0;
      if (hasRole) {
        await supabase.from("user_roles").update({ role: editRole as any }).eq("user_id", editingMember.user_id);
      } else {
        await supabase.from("user_roles").insert({ user_id: editingMember.user_id, role: editRole as any });
      }
      await supabase.from("member_groups").delete().eq("user_id", editingMember.user_id);
      if (selectedGroups.length > 0) {
        const inserts = selectedGroups.map(gid => ({ user_id: editingMember.user_id, group_id: gid }));
        await supabase.from("member_groups").insert(inserts as any);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      setEditingMember(null);
      toast({ title: "Membro atualizado!" });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const email = editUsername.trim().toLowerCase().replace(/\s+/g, ".") + "@mergulhoconnect.com";
      const { data, error } = await supabase.rpc("admin_create_user" as any, {
        email, password: "123456", raw_user_meta_data: { full_name: editName, whatsapp_phone: editPhone }
      });
      if (error) throw error;
      const newUserId = data as any as string;
      if (editRole === "admin") {
        await supabase.from("user_roles").insert({ user_id: newUserId, role: "admin" } as any);
      }
      if (selectedGroups.length > 0) {
        await supabase.from("member_groups").insert(selectedGroups.map(gid => ({ user_id: newUserId, group_id: gid })) as any);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      setCreatingMember(false);
      setEditName(""); setEditUsername(""); setEditPhone(""); setEditRole("member"); setSelectedGroups([]);
      toast({ title: "Membro criado!", description: `Usuário: ${editUsername} | Senha: 123456` });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao criar", description: err.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (m: any) => {
      await supabase.from("member_groups").delete().eq("user_id", m.user_id);
      await supabase.from("user_roles").delete().eq("user_id", m.user_id);
      await supabase.from("profiles").delete().eq("id", m.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast({ title: "Membro removido!" });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast({ title: "Perfil removido", description: "Conta de acesso pode precisar ser removida manualmente no Supabase." });
    }
  });

  const GroupCheckboxes = () => (
    <div className="grid grid-cols-2 gap-2 mt-2">
      {allGroups?.map(g => (
        <div key={g.id} className="flex items-center space-x-2">
          <Checkbox id={`mg-${g.id}`} checked={selectedGroups.includes(g.id)}
            onCheckedChange={(checked) => {
              if (checked) setSelectedGroups([...selectedGroups, g.id]);
              else setSelectedGroups(selectedGroups.filter(id => id !== g.id));
            }}
          />
          <label htmlFor={`mg-${g.id}`} className="text-sm font-medium leading-none">{g.name}</label>
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Membros
        </h1>
        <Button onClick={() => {
          setEditName(""); setEditPhone(""); setEditRole("member"); setSelectedGroups([]);
          setCreatingMember(true);
        }}>
          <Plus className="h-4 w-4 mr-1" /> Novo Membro
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar membros..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {filtered?.map((member) => (
          <Card key={member.id} className="neo-shadow-sm border-0">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <span className="text-primary font-bold text-lg">
                    {(member.full_name || "?").charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{member.full_name}</p>
                {member.whatsapp_phone && (
                  <a
                    href={`https://wa.me/${member.whatsapp_phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary flex items-center gap-1 hover:underline"
                  >
                    <Phone className="h-3 w-3" />
                    {member.whatsapp_phone}
                  </a>
                )}
                <div className="flex gap-1 mt-1 flex-wrap">
                  {(member as any).roles?.map((r: any) => (
                    <Badge key={r.role} variant={r.role === "admin" ? "default" : "secondary"} className="text-xs">
                      {r.role}
                    </Badge>
                  ))}
                  {(member as any).groups?.map((name: string) => (
                    <Badge key={name} variant="outline" className="text-xs">{name}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(member)}>
                  <Edit2 className="h-4 w-4 text-primary" />
                </Button>
                <Button variant="ghost" size="icon"
                  onClick={() => {
                    if (window.confirm(`Excluir ${member.full_name || "este membro"}?`)) {
                      deleteMutation.mutate(member);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered?.length === 0 && (
        <p className="text-center text-muted-foreground py-8">Nenhum membro encontrado</p>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingMember} onOpenChange={(val) => !val && setEditingMember(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Editar Membro</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp (apenas exibição)</Label>
              <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="(11) 99999-9999" />
            </div>
            <div className="space-y-2">
              <Label>Permissão</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Membro</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Grupos</Label>
              <GroupCheckboxes />
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

      {/* Create Dialog */}
      <Dialog open={creatingMember} onOpenChange={(val) => !val && setCreatingMember(false)}>
        <DialogContent className="sm:max-w-[680px]">
          <DialogHeader><DialogTitle>Novo Membro</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <div className="bg-primary/10 border-l-4 border-primary p-3 rounded text-sm text-primary font-medium">
              Senha padrão: <strong>123456</strong>. O usuário deverá trocar após o primeiro acesso.
            </div>

            {/* Row 1: Nome + Usuário */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nome completo" required />
              </div>
              <div className="space-y-2">
                <Label>Nome de Usuário (Login)</Label>
                <Input value={editUsername} onChange={e => setEditUsername(e.target.value)} placeholder="ex: joao.silva" required />
                <p className="text-xs text-muted-foreground">Usado para entrar no sistema</p>
              </div>
            </div>

            {/* Row 2: WhatsApp + Permissão */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>WhatsApp (opcional)</Label>
                <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="(11) 99999-9999" />
              </div>
              <div className="space-y-2">
                <Label>Permissão</Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Membro</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 3: Grupos */}
            <div className="space-y-2">
              <Label>Grupos (Opcional)</Label>
              <GroupCheckboxes />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreatingMember(false)}>Cancelar</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!editName || !editUsername || createMutation.isPending}>
              {createMutation.isPending ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Members;
