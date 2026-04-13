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
import { normalizePhoneForDB, formatPhoneForDisplay } from "@/lib/phoneUtils";
import { getErrorMessage } from "@/lib/errorMessages";

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
      const { data: profiles } = await supabase.from("profiles").select("*").order("full_name", { ascending: true });
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
    setEditPhone(formatPhoneForDisplay(m.whatsapp_phone || ""));
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

      // 1. Sincroniza email e metadados com Auth via RPC.
      // IMPORTANTE: NÃO passar o campo 'password' para evitar reset acidental da senha.
      // A função SQL admin_manage_user mantém a senha atual quando password é omitido.
      const { error: rpcErr } = await supabase.rpc("admin_manage_user" as any, {
        email,
        raw_user_meta_data: { full_name: editName, whatsapp_phone: normalizePhoneForDB(editPhone), username: cleanUsername },
        target_user_id: editingMember.user_id
      });
      if (rpcErr) {
        // Loga o erro completo para diagnóstico
        console.error("[Members] RPC admin_manage_user falhou:", rpcErr);
        throw new Error(rpcErr.message || "Erro ao sincronizar dados de autenticação");
      }

      // 2. Atualiza perfil local (tabela profiles)
      const { error: profErr, count } = await (supabase as any)
        .from("profiles")
        .update({
          full_name: editName,
          whatsapp_phone: normalizePhoneForDB(editPhone),
          username: cleanUsername
        })
        .eq("user_id", editingMember.user_id)
        .select();

      if (profErr) {
        console.error("[Members] UPDATE profiles falhou:", profErr);
        throw new Error(profErr.message || "Erro ao atualizar perfil");
      }

      // 3. Atualiza Role (Upsert para evitar duplicatas)
      const { error: roleErr } = await (supabase as any).from("user_roles").upsert({
        user_id: editingMember.user_id,
        role: editRole as any
      }, { onConflict: "user_id" });

      if (roleErr) {
        console.error("[Members] Upsert user_roles falhou:", roleErr);
        throw new Error(roleErr.message || "Erro ao atualizar permissão");
      }

      // 4. Atualiza departamentos com cargos
      await supabase.from("member_groups").delete().eq("user_id", editingMember.user_id);
      if (selectedGroups.length > 0) {
        const inserts = selectedGroups.map(g => ({
          user_id: editingMember.user_id,
          group_id: g.id,
          role: g.role || "member"
        }));
        const { error: groupErr } = await supabase.from("member_groups").insert(inserts as any);
        if (groupErr) console.warn("[Members] Insert member_groups parcialmente falhou:", groupErr);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      setEditingMember(null);
      toast({ title: "Membro atualizado!", description: "Dados e acesso sincronizados com sucesso." });
    },
    onError: (err: any) => {
      console.error("[Members] updateMutation erro final:", err);
      toast({ title: "Erro ao atualizar membro", description: getErrorMessage(err), variant: "destructive" });
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
        raw_user_meta_data: { full_name: editName, whatsapp_phone: normalizePhoneForDB(editPhone), username: cleanUsername }
      });
      if (error) throw error;
      const newUserId = data as any as string;

      const { error: profileError } = await supabase.from("profiles").update({
        username: cleanUsername,
        full_name: editName,
        whatsapp_phone: normalizePhoneForDB(editPhone)
      } as any).eq("user_id", newUserId);
      if (profileError) throw profileError;

      // 3. Salva a role selecionada (Membro, Gerente, Pastor ou Admin)
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
      toast({ title: "Erro ao criar", description: getErrorMessage(err), variant: "destructive" });
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
      toast({ title: "Erro ao excluir", description: getErrorMessage(err), variant: "destructive" });
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
      toast({ title: "Erro ao resetar senha", description: getErrorMessage(err), variant: "destructive" });
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-start">
        {filtered?.map((member) => (
          <Card key={member.id} className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-md hover:shadow-xl transition-all duration-300 rounded-3xl overflow-hidden group">
            <CardContent className="p-5 flex flex-col h-full relative">
              
              {/* Header: Avatar, Info & Actions */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shrink-0 shadow-inner border border-primary/20">
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                    ) : (
                      <span className="text-primary font-black text-lg sm:text-xl">
                        {(member.full_name || "?").charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-sm sm:text-base text-foreground uppercase tracking-tight leading-tight line-clamp-2">
                      {member.full_name || "Sem nome"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {(member.username || member.full_name) && (
                        <div className="flex items-center gap-1 text-primary text-[10px] sm:text-xs font-bold min-w-0">
                          <User className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            @{((member.username && !/^\d{8,}$/.test(member.username)) 
                              ? member.username 
                              : (member.full_name?.trim().toLowerCase().replace(/\s+/g, ".") || member.username)).toLowerCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex items-center shrink-0 -mt-2 -mr-2 sm:-mt-1 sm:-mr-1">
                    <Button variant="ghost" size="icon"
                      className="h-10 w-10 sm:h-8 sm:w-8 rounded-full hover:bg-amber-500/10 text-amber-500/80 hover:text-amber-500 transition-colors"
                      onClick={() => setResettingPasswordMember(member)}
                      title="Resetar Senha"
                    >
                      <Key className="h-5 w-5 sm:h-4 sm:w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" 
                      className="h-10 w-10 sm:h-8 sm:w-8 rounded-full hover:bg-primary/10 text-primary/80 hover:text-primary transition-colors"
                      onClick={() => handleEdit(member)}>
                      <Edit2 className="h-5 w-5 sm:h-4 sm:w-4" />
                    </Button>
                    <Button variant="ghost" size="icon"
                      className="h-10 w-10 sm:h-8 sm:w-8 rounded-full hover:bg-destructive/10 text-destructive/80 hover:text-destructive transition-colors"
                      onClick={() => setDeletingMember(member)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-5 w-5 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Phone (Divider line logic) */}
              {member.whatsapp_phone && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 bg-muted/40 p-2 rounded-xl border border-border/40 inline-flex w-max max-w-full">
                  <Phone className="h-3 w-3 text-primary shrink-0" />
                  <span className="font-medium truncate">{formatPhoneForDisplay(member.whatsapp_phone || "")}</span>
                </div>
              )}

              {/* Badges / Tags */}
              <div className="flex flex-wrap gap-1.5 mt-auto pt-2 border-t border-border/40">
                {member.roles?.some((r: any) => r.role === "admin_ccm") ? (
                  <Badge variant="default" className="bg-rose-600 text-white hover:bg-rose-700 uppercase text-[9px] px-2 py-0.5 rounded-md font-black shadow-sm">ADM CCM</Badge>
                ) : member.roles?.some((r: any) => r.role === "admin") ? (
                  <Badge variant="default" className="bg-slate-800 text-white uppercase text-[9px] px-2 py-0.5 rounded-md font-black shadow-sm">Admin</Badge>
                ) : null}
                {member.roles?.some((r: any) => r.role === "pastor") && (
                  <Badge variant="default" className="bg-indigo-600 text-white hover:bg-indigo-700 uppercase text-[9px] px-2 py-0.5 rounded-md font-black shadow-sm">
                    Pastor
                  </Badge>
                )}
                {member.roles?.some((r: any) => r.role === "gerente") && (
                  <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 uppercase text-[9px] px-2 py-0.5 rounded-md font-black border-0">
                    Gerente
                  </Badge>
                )}
                {(!member.roles || member.roles.length === 0 || member.roles.every((r: any) => r.role === "membro")) && (
                  <Badge variant="outline" className="uppercase text-[9px] px-2 py-0.5 rounded-md text-muted-foreground font-bold border-muted-foreground/30">
                    Membro
                  </Badge>
                )}
                {(member as any).groups?.map((name: string) => (
                  <Badge key={name} variant="outline" className="text-[9px] px-2 py-0.5 rounded-md bg-muted/30 font-medium border-muted-foreground/20 text-foreground">{name}</Badge>
                ))}
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
                    <SelectItem value="pastor">Pastor</SelectItem>
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
                    <SelectItem value="pastor">Pastor</SelectItem>
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
