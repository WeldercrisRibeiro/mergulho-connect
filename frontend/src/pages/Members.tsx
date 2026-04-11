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
import { Users, Search, Phone, Edit2, Trash2, Plus, CheckCircle, Key, Monitor, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const Members = () => {
  const [search, setSearch] = useState("");
  const { isAdmin, isGerente, isAdminCCM } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [nivelFilter, setNivelFilter] = useState("all");

  const [editingMember, setEditingMember] = useState<any>(null);
  const [creatingMember, setCreatingMember] = useState(false);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState("membro");
  const [selectedGroups, setSelectedGroups] = useState<{ id: string; role: string }[]>([]);
  const [deletingMember, setDeletingMember] = useState<any>(null);
  const [resettingPasswordMember, setResettingPasswordMember] = useState<any>(null);
  const [removePhoto, setRemovePhoto] = useState(false);

  if (!isAdmin && !isGerente) {
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
        .select("user_id, group_id, role, groups(name)");

      return (profiles || []).map((p) => ({
        ...p,
        roles: (roles || []).filter((r) => r.user_id === p.user_id),
        groups: (memberGroupsData || [])
          .filter((mg) => mg.user_id === p.user_id)
          .map((mg) => (mg.groups as any)?.name)
          .filter(Boolean),
        group_ids: (memberGroupsData || [])
          .filter((mg) => mg.user_id === p.user_id)
          .map((mg) => ({ id: mg.group_id, role: (mg as any).role || "member" })),
      }));
    },
  });

  const filtered = members?.filter((m) => {
    const matchesSearch = (m.full_name || "").toLowerCase().includes(search.toLowerCase());
    const matchesNivel = nivelFilter === "all" || m.roles?.some((r: any) => r.role === nivelFilter);
    return matchesSearch && matchesNivel;
  });

  const handleEdit = (m: any) => {
    setEditingMember(m);
    setEditName(m.full_name || "");
    setEditUsername(m.username || "");
    setEditPhone(m.whatsapp_phone || "");
    setEditRole(m.roles?.[0]?.role || "membro");
    setSelectedGroups(m.group_ids || []);
    setRemovePhoto(false);
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingMember) return;

      const phoneDigits = editPhone.replace(/\D/g, "");
      const cleanUsername = (editUsername || "").trim().toLowerCase().replace("@ccmergulho.com", "").replace(/\s+/g, ".") || phoneDigits;
      const email = cleanUsername + "@ccmergulho.com";

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
        username: cleanUsername
      } as any).eq("user_id", editingMember.user_id);

      if (profErr) throw profErr;

      // 3. Atualiza Role de forma robusta (Upsert para evitar duplicatas ou conflitos)
      const { error: roleErr } = await (supabase as any).from("user_roles").upsert({
        user_id: editingMember.user_id,
        role: editRole as any
      }, { onConflict: "user_id" });

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
      const phoneDigits = editPhone.replace(/\D/g, "");
      const cleanUsername = (editUsername || "").trim().toLowerCase().replace(/\s+/g, ".") || phoneDigits;
      const email = cleanUsername + "@ccmergulho.com";
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

      // 3. Salva a role selecionada (Membro, Gerente, Moderador ou Admin)
      await (supabase as any).from("user_roles").upsert({
        user_id: newUserId,
        role: editRole as any
      }, { onConflict: "user_id" });

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

  const resetPasswordMutation = useMutation({
    mutationFn: async (m: any) => {
      const { error } = await supabase.rpc("admin_manage_user" as any, {
        email: (m.username + "@ccmergulho.com").toLowerCase(),
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

  const GroupCheckboxes = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
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

            {isSelected && (editRole === "gerente" || editRole === "admin") && (
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
        {isAdmin && (
          <Button onClick={() => {
            setEditName(""); setEditPhone(""); setEditRole("membro"); setSelectedGroups([]);
            setCreatingMember(true);
          }}>
            <Plus className="h-4 w-4 mr-1" /> Novo Membro
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar membros..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-xl"
          />
        </div>
        <Select value={nivelFilter} onValueChange={setNivelFilter}>
          <SelectTrigger className="w-full sm:w-[180px] h-11 rounded-xl bg-background border-muted-foreground/20">
            <SelectValue placeholder="Nível" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">Todos os Níveis</SelectItem>
            <SelectItem value="admin">Administradores</SelectItem>
            <SelectItem value="gerente">Líderes (Gerentes)</SelectItem>
            <SelectItem value="membro">Membros</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {filtered?.map((member) => (
          <Card key={member.id} className="border-0 bg-muted/30 shadow-sm hover:bg-muted/40 transition-colors rounded-2xl overflow-hidden">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <span className="text-primary font-black text-lg">
                    {(member.full_name || "?").charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                {/* Name specialized row */}
                <div className="mb-1">
                  <p className="font-black text-sm text-foreground uppercase tracking-tight truncate">
                    {member.full_name || "Sem nome"}
                  </p>
                </div>
                
                {/* Info row */}
                <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                  {member.whatsapp_phone && (
                    <div className="flex items-center gap-1 bg-background/50 px-2 py-0.5 rounded-lg border border-border/10">
                      <Phone className="h-2.5 w-2.5" />
                      <span>{member.whatsapp_phone}</span>
                    </div>
                  )}
                  {(member.username || member.full_name) && (
                    <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-lg border border-primary/20 font-bold">
                      <User className="h-2.5 w-2.5" />
                      <span>
                        @{((member.username && !/^\d{8,}$/.test(member.username)) 
                          ? member.username 
                          : (member.full_name?.trim().toLowerCase().replace(/\s+/g, ".") || member.username)).toLowerCase()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-1 mt-2 flex-wrap">
                  {member.roles?.some((r: any) => r.role === "admin_ccm") ? (
                    <Badge variant="default" className="bg-rose-600 text-white hover:bg-rose-700 uppercase text-[9px] px-2 font-black">ADM CCM</Badge>
                  ) : member.roles?.some((r: any) => r.role === "admin") ? (
                    <Badge variant="default" className="uppercase text-[9px] px-2 font-black">Admin</Badge>
                  ) : null}
                  {member.roles?.some((r: any) => r.role === "gerente") && (
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 uppercase text-[9px] font-black">
                      Gerente
                    </Badge>
                  )}
                  {(!member.roles || member.roles.length === 0 || member.roles.every((r: any) => r.role === "membro")) && (
                    <Badge variant="outline" className="uppercase text-[9px] text-muted-foreground font-bold">
                      Membro
                    </Badge>
                  )}
                  {(member as any).groups?.map((name: string) => (
                    <Badge key={name} variant="outline" className="text-[9px] bg-background/50 font-medium">{name}</Badge>
                  ))}
                </div>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon"
                    className="hover:bg-amber-500/10"
                    onClick={() => setResettingPasswordMember(member)}
                    title="Resetar Senha"
                  >
                    <Key className="h-4 w-4 text-amber-500" />
                  </Button>
                  <Button variant="ghost" size="icon" 
                    className="hover:bg-primary/10"
                    onClick={() => handleEdit(member)}>
                    <Edit2 className="h-4 w-4 text-primary" />
                  </Button>
                  <Button variant="ghost" size="icon"
                    className="hover:bg-destructive/10"
                    onClick={() => setDeletingMember(member)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              )}
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

      {/* Confirm Password Reset */}
      <ConfirmDialog
        open={!!resettingPasswordMember}
        title="Resetar Senha"
        description={`Deseja resetar a senha de ${resettingPasswordMember?.full_name}? A senha voltará para o padrão: 123456`}
        confirmLabel="Resetar"
        variant="default"
        onConfirm={() => resetPasswordMutation.mutate(resettingPasswordMember)}
        onCancel={() => setResettingPasswordMember(null)}
      />

      {/* Edit Dialog */}
      <Dialog open={!!editingMember} onOpenChange={(val) => !val && setEditingMember(null)}>
        <DialogContent className="sm:max-w-[900px] rounded-3xl border-0 shadow-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader><DialogTitle className="text-xl font-bold">Editar Membro: {editingMember?.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome Completo</Label>
                <Input value={editName} onChange={e => setEditName(e.target.value)} className="rounded-xl h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome de Usuário (Login)</Label>
                <Input
                  value={editUsername}
                  onChange={e => setEditUsername(e.target.value)}
                  placeholder="ex: joao.silva"
                  className="rounded-xl h-11"
                  readOnly={!isAdminCCM}
                />
                {!isAdminCCM && <p className="text-[10px] text-amber-600 font-medium">Somente ADM CCM pode alterar o login/email.</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">WhatsApp</Label>
                <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="(11) 99999-9999" className="rounded-xl h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Permissão Global</Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="membro">Membro</SelectItem>
                    <SelectItem value="gerente">Líder (Gerente)</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    {isAdminCCM && (
                      <SelectItem value="admin_ccm">Administrador CCM (Gestor Master)</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Vincular a Departamentos</Label>
              <GroupCheckboxes />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditingMember(null)} className="rounded-xl border-2">Cancelar</Button>
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} className="rounded-xl px-8 font-bold">
              {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={creatingMember} onOpenChange={(val) => !val && setCreatingMember(false)}>
        <DialogContent className="sm:max-w-[900px] rounded-3xl border-0 shadow-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader><DialogTitle className="text-xl font-bold text-primary">Cadastrar Novo Membro</DialogTitle></DialogHeader>
          <div className="py-4 space-y-6">
            <div className="bg-primary/5 border border-primary/20 p-4 rounded-2xl text-xs text-primary font-medium flex items-center gap-3">
              <CheckCircle className="h-5 w-5 shrink-0" />
              <p>Senha padrão: <strong>123456</strong>. O usuário deverá trocar após o primeiro acesso.</p>
            </div>

            {/* Row 1: Nome + Usuário */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome Completo</Label>
                <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nome completo" required className="rounded-xl h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome de Usuário (Login)</Label>
                <Input value={editUsername} onChange={e => setEditUsername(e.target.value)} placeholder="ex: joao.silva" required className="rounded-xl h-11" />
                <p className="text-[10px] text-muted-foreground italic">Usado para entrar no sistema</p>
              </div>
            </div>

            {/* Row 2: WhatsApp + Permissão */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">WhatsApp (opcional)</Label>
                <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="(11) 99999-9999" className="rounded-xl h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Permissão Global</Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="membro">Membro</SelectItem>
                    <SelectItem value="gerente">Líder (Gerente)</SelectItem>
                    <SelectItem value="moderador">Moderador</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    {isAdminCCM && (
                      <SelectItem value="admin_ccm">Administrador CCM (Gestor Master)</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 3: departamentos */}
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">departamentos (Opcional)</Label>
              <GroupCheckboxes />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreatingMember(false)} className="rounded-xl border-2">Cancelar</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!editName || !editUsername || createMutation.isPending} className="rounded-xl px-8 font-bold">
              {createMutation.isPending ? "Cadastrando..." : "Confirmar Cadastro"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Members;
