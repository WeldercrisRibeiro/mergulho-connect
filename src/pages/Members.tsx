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
import ConfirmDialog from "@/components/ConfirmDialog";
import { Users, Search, Phone, Edit2, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
  const [editRole, setEditRole] = useState("membro");
  const [selectedGroups, setSelectedGroups] = useState<{ id: string; role: string }[]>([]);
  const [deletingMember, setDeletingMember] = useState<any>(null);

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
          .map((mg) => ({ id: mg.group_id, role: mg.role || "member" })),
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
    setEditRole(m.roles?.[0]?.role || "membro");
    setSelectedGroups(m.group_ids || []);
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingMember) return;

      const cleanUsername = (editUsername || "").trim().toLowerCase().replace(/\s+/g, ".");
      const email = cleanUsername + "@mergulhoconnect.com";

      // 1. Sincroniza com Auth via RPC sem trocar a senha atual
      const { error: rpcErr } = await supabase.rpc("admin_manage_user" as any, {
        email,
        password: null,
        raw_user_meta_data: { full_name: editName, whatsapp_phone: editPhone, username: cleanUsername },
        target_user_id: editingMember.user_id
      });
      if (rpcErr) throw rpcErr;

      // 2. Atualiza perfil local (incluindo username para busca/exibição)
      const { error: profErr } = await supabase.from("profiles").update({
        full_name: editName,
        whatsapp_phone: editPhone,
        username: editUsername
      } as any).eq("user_id", editingMember.user_id);

      if (profErr) throw profErr;

      // 3. Atualiza Role de forma robusta (Deleta anterior e insere nova)
      await supabase.from("user_roles").delete().eq("user_id", editingMember.user_id);
      const { error: roleErr } = await supabase.from("user_roles").insert({ 
        user_id: editingMember.user_id, 
        role: editRole as any 
      });
      
      if (roleErr) throw roleErr;

      // 4. Atualiza departamentos com cargos
      await supabase.from("member_groups").delete().eq("user_id", editingMember.user_id);
      if (selectedGroups.length > 0) {
        const inserts = selectedGroups.map(g => ({ 
          user_id: editingMember.user_id, 
          group_id: g.id,
          role: g.role || "member"
        }));
        await supabase.from("member_groups").insert(inserts as any);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      setEditingMember(null);
      toast({ title: "Membro atualizado!", description: "Dados e acesso sincronizados." });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao atualizar", description: err.message, variant: "destructive" });
    }
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const cleanUsername = editUsername.trim().toLowerCase().replace(/\s+/g, ".");
      const email = cleanUsername + "@mergulhoconnect.com";
      const { data, error } = await supabase.rpc("admin_manage_user" as any, {
        email,
        password: "123456",
        raw_user_meta_data: { full_name: editName, whatsapp_phone: editPhone, username: cleanUsername }
      });
      if (error) throw error;
      const newUserId = data as any as string;

      const { error: profileError } = await supabase.from("profiles").update({
        username: cleanUsername,
        full_name: editName,
        whatsapp_phone: editPhone
      } as any).eq("user_id", newUserId);
      if (profileError) throw profileError;

      // 3. Salva a role selecionada (Membro, Gerente ou Admin)
      await supabase.from("user_roles").insert({ user_id: newUserId, role: editRole as any } as any);
      if (selectedGroups.length > 0) {
        await supabase.from("member_groups").insert(selectedGroups.map(g => ({ 
          user_id: newUserId, 
          group_id: g.id,
          role: g.role || "member" 
        })) as any);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      setCreatingMember(false);
      setEditName(""); setEditUsername(""); setEditPhone(""); setEditRole("membro"); setSelectedGroups([]);
      toast({ title: "Membro criado!", description: `Usuário (Login): ${editUsername} | Senha: 123456` });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao criar", description: err.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (m: any) => {
      const { error } = await supabase.rpc("admin_remove_user" as any, { target_user_id: m.user_id });
      if (error) throw error;
      await supabase.from("member_groups").delete().eq("user_id", m.user_id);
      await supabase.from("user_roles").delete().eq("user_id", m.user_id);
      await supabase.from("profiles").delete().eq("user_id", m.user_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      setDeletingMember(null);
      toast({ title: "Membro removido definitivamente!" });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" });
    }
  });

  const GroupCheckboxes = () => (
    <div className="space-y-2 mt-2">
      {allGroups?.map(g => {
        const isSelected = selectedGroups.some(sg => sg.id === g.id);
        const currentGroup = selectedGroups.find(sg => sg.id === g.id);
        
        return (
          <div key={g.id} className="flex items-center justify-between p-2 rounded-lg border bg-muted/30">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id={`mg-${g.id}`} 
                checked={isSelected}
                onCheckedChange={(checked) => {
                  if (checked) setSelectedGroups([...selectedGroups, { id: g.id, role: "member" }]);
                  else setSelectedGroups(selectedGroups.filter(sg => sg.id !== g.id));
                }}
              />
              <label htmlFor={`mg-${g.id}`} className="text-sm font-medium">{g.name}</label>
            </div>
            
            {isSelected && (
              <div className="flex bg-muted rounded-md p-0.5 border">
                <button
                  type="button"
                  onClick={() => setSelectedGroups(selectedGroups.map(sg => sg.id === g.id ? { ...sg, role: "member" } : sg))}
                  className={cn(
                    "px-2 py-0.5 text-[10px] rounded-sm transition-all",
                    currentGroup?.role === "member" ? "bg-white shadow-sm font-bold" : "text-muted-foreground"
                  )}
                >
                  Membro
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedGroups(selectedGroups.map(sg => sg.id === g.id ? { ...sg, role: "manager" } : sg))}
                  className={cn(
                    "px-2 py-0.5 text-[10px] rounded-sm transition-all",
                    currentGroup?.role === "manager" ? "bg-primary text-white shadow-sm font-bold" : "text-muted-foreground"
                  )}
                >
                  Líder
                </button>
              </div>
            )}
          </div>
        );
      })}
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
          setEditName(""); setEditPhone(""); setEditRole("membro"); setSelectedGroups([]);
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
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{member.full_name}</p>
                  {member.username && (
                    <span className="text-xs text-muted-foreground font-normal bg-muted/50 px-1.5 py-0.5 rounded">
                      @{member.username}
                    </span>
                  )}
                </div>
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
                  {member.roles?.some((r: any) => r.role === "admin") && (
                    <Badge variant="default" className="uppercase text-[10px]">Admin</Badge>
                  )}
                  {member.roles?.some((r: any) => r.role === "gerente") && (
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 uppercase text-[10px]">
                      Gerente
                    </Badge>
                  )}
                  {(!member.roles || member.roles.length === 0 || member.roles.every((r: any) => r.role === "membro")) && (
                    <Badge variant="outline" className="uppercase text-[10px] text-muted-foreground">
                      Membro
                    </Badge>
                  )}
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
                  onClick={() => setDeletingMember(member)}
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

      {/* Confirm Delete */}
      <ConfirmDialog
        open={!!deletingMember}
        title="Excluir Membro"
        description={`Tem certeza que deseja excluir ${deletingMember?.full_name || "este membro"}? Esta ação removerá o acesso e todos os dados vinculados.`}
        confirmLabel="Excluir"
        variant="danger"
        onConfirm={() => deleteMutation.mutate(deletingMember)}
        onCancel={() => setDeletingMember(null)}
      />

      {/* Edit Dialog */}
      <Dialog open={!!editingMember} onOpenChange={(val) => !val && setEditingMember(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Editar Membro</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input value={editName} onChange={e => setEditName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Nome de Usuário (Login)</Label>
                <Input value={editUsername} onChange={e => setEditUsername(e.target.value)} placeholder="ex: joao.silva" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>WhatsApp</Label>
                <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="(11) 99999-9999" />
              </div>
              <div className="space-y-2">
                <Label>Permissão</Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="membro">Membro</SelectItem>
                    <SelectItem value="gerente">Gerente</SelectItem>
                    <SelectItem value="moderador">Moderador</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Departamentos</Label>
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
                    <SelectItem value="membro">Membro</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 3: departamentos */}
            <div className="space-y-2">
              <Label>departamentos (Opcional)</Label>
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
