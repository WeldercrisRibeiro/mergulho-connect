import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
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
import { cn, getUploadUrl } from "@/lib/utils";
import { normalizePhoneForDB, formatPhoneForDisplay, maskPhone } from "@/lib/phoneUtils";
import { getErrorMessage } from "@/lib/errorMessages";

const maskCep = (value: string) => {
  return value.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
};

const Members = () => {
  const [search, setSearch] = useState("");
  const { isAdmin, IsLider, isAdminCCM } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [nivelFilter, setNivelFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");

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

  const [editBirthDate, setEditBirthDate] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editStreet, setEditStreet] = useState("");
  const [editNumber, setEditNumber] = useState("");
  const [editNeighborhood, setEditNeighborhood] = useState("");
  const [editComplement, setEditComplement] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editState, setEditState] = useState("");
  const [editCodCep, setEditCodCep] = useState("");
  const [editCountry, setEditCountry] = useState("Brazil");

  const handleCepChange = async (cep: string) => {
    const masked = maskCep(cep);
    setEditCodCep(masked);
    
    const cleaned = masked.replace(/\D/g, "");
    if (cleaned.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setEditAddress(`${data.logradouro}${data.bairro ? ', ' + data.bairro : ''}`);
          setEditStreet(data.logradouro);
          setEditNeighborhood(data.bairro);
          setEditComplement(data.complemento || "");
          setEditCity(data.localidade);
          setEditState(data.uf);
          toast({ title: "Endereço encontrado!", description: "Os campos foram preenchidos automaticamente." });
        } else {
          toast({ title: "CEP não encontrado", description: "Verifique o número digitado.", variant: "destructive" });
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
        toast({ title: "Erro na busca", description: "Não foi possível conectar ao serviço de CEP.", variant: "destructive" });
      }
    }
  };

  if (!isAdmin && !IsLider) {
    return <Navigate to="/home" replace />;
  }

  const { data: allGroups } = useQuery({
    queryKey: ["members-groups-list"],
    queryFn: async () => {
      const { data } = await api.get("/groups");
      return data || [];
    },
  });

  const { data: members } = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const { data: profiles } = await api.get("/profiles");
      const { data: roles } = await api.get("/user-roles");
      const { data: memberGroupsData } = await api.get('/member-groups');

      return (profiles || []).map((p: any) => ({
        ...p,
        roles: (roles || []).filter((r: any) => r.userId === p.userId),
        groups: (memberGroupsData || [])
          .filter((mg: any) => mg.userId === p.userId)
          .map((mg: any) => mg.group?.name)
          .filter(Boolean),
        groupIds: (memberGroupsData || [])
          .filter((mg: any) => mg.userId === p.userId)
          .map((mg: any) => ({ id: mg.groupId, role: mg.role || "member" })),
      }));
    },
  });

  const filtered = members?.filter((m: any) => {
    const searchLower = search.toLowerCase();
    const searchDigits = search.replace(/\D/g, "");

    const matchesName = (m.fullName || "").toLowerCase().includes(searchLower);
    const matchesPhone = searchDigits.length > 0 && m.whatsappPhone ? m.whatsappPhone.includes(searchDigits) : false;
    
    const matchesSearch = matchesName || matchesPhone;
    const matchesNivel = nivelFilter === "all" || m.roles?.some((r: any) => r.role === nivelFilter);
    const matchesGroup = groupFilter === "all" || m.groupIds?.some((g: any) => g.id === groupFilter);
    
    return matchesSearch && matchesNivel && matchesGroup;
  });

  const handleEdit = (m: any) => {
    setEditingMember(m);
    setEditName(m.fullName || "");
    setEditUsername(m.username || "");
    setEditPhone(maskPhone(formatPhoneForDisplay(m.whatsappPhone || "")));
    setEditRole(m.roles?.[0]?.role || "membro");
    setSelectedGroups(m.groupIds || []);
    setRemovePhoto(false);
    setEditBirthDate(m.birthDate ? new Date(m.birthDate).toISOString().split('T')[0] : "");
    setEditAddress(m.address || "");
    setEditStreet(m.street || "");
    setEditNumber(m.number || "");
    setEditNeighborhood(m.neighborhood || "");
    setEditComplement(m.complement || "");
    setEditCity(m.city || "");
    setEditState(m.state || "");
    setEditCodCep(m.codCep || "");
    setEditCountry(m.country || "Brazil");
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingMember) return;
      const normalizedPhone = normalizePhoneForDB(editPhone);
      const phoneDigits = editPhone.replace(/\D/g, "");
      const cleanUsername = (editUsername || "").trim().toLowerCase().replace("@ccmergulho.com", "").replace(/\s+/g, ".") || phoneDigits;
      const email = cleanUsername + "@ccmergulho.com";
      await api.patch(`/admin/users/${editingMember.userId}`, {
        email, fullName: editName, whatsappPhone: normalizedPhone, username: cleanUsername, role: editRole, groups: selectedGroups,
        birthDate: editBirthDate || null,
        address: editAddress,
        street: editStreet,
        number: editNumber,
        neighborhood: editNeighborhood,
        complement: editComplement,
        city: editCity,
        state: editState,
        codCep: editCodCep,
        country: editCountry
      });
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
      const normalizedPhone = normalizePhoneForDB(editPhone);
      const phoneDigits = editPhone.replace(/\D/g, "");
      const cleanUsername = (editUsername || "").trim().toLowerCase().replace(/\s+/g, ".") || phoneDigits;
      const email = cleanUsername + "@ccmergulho.com";
      await api.post(`/admin/users`, {
        email, fullName: editName, whatsappPhone: normalizedPhone, username: cleanUsername, role: editRole, groups: selectedGroups, password: "123456",
        birthDate: editBirthDate || null,
        address: editAddress,
        street: editStreet,
        number: editNumber,
        neighborhood: editNeighborhood,
        complement: editComplement,
        city: editCity,
        state: editState,
        codCep: editCodCep,
        country: editCountry
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      setCreatingMember(false);
      setEditName(""); setEditUsername(""); setEditPhone(""); setEditRole("membro"); setSelectedGroups([]);
      setEditBirthDate(""); setEditAddress(""); setEditStreet(""); setEditNumber(""); setEditNeighborhood(""); setEditComplement(""); setEditCity(""); setEditState(""); setEditCodCep(""); setEditCountry("Brazil");
      toast({ title: "Usuário criado!", description: `Login: ${editUsername} | Senha: 123456` });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao criar", description: getErrorMessage(err), variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (m: any) => {
      await api.delete(`/admin/users/${m.userId}`);
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
      await api.post(`/admin/users/${m.userId}/reset-password`, { password: "123456" });
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
      {allGroups?.map((g: any) => {
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

            {isSelected && (editRole === "lider" || editRole === "admin") && (
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
        {isAdmin && (
          <Button onClick={() => {
            setEditName(""); setEditPhone(""); setEditRole("membro"); setSelectedGroups([]);
            setEditBirthDate(""); setEditAddress(""); setEditCity(""); setEditState(""); setEditCodCep(""); setEditCountry("Brasil");
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
            placeholder="Buscar por nome ou telefone..."
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
            <SelectItem value="lider">Líderes</SelectItem>
            <SelectItem value="membro">Membros</SelectItem>
          </SelectContent>
        </Select>
        <Select value={groupFilter} onValueChange={setGroupFilter}>
          <SelectTrigger className="w-full sm:w-[180px] h-11 rounded-xl bg-background border-muted-foreground/20">
            <SelectValue placeholder="Departamento" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">Todos os Deptos</SelectItem>
            {allGroups?.map((g: any) => (
              <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-3">
        {filtered?.map((member: any) => (
          <div key={member.id} className="flex flex-col sm:flex-row sm:items-center p-3 sm:p-4 bg-card/60 backdrop-blur-sm border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl sm:rounded-[1.25rem] group">
            
            {/* Esquerda: Avatar, Nome e Telefone */}
            <div className="flex items-center gap-4 min-w-0 sm:w-[45%]">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shrink-0 shadow-inner border border-primary/20">
                {member.avatarUrl ? (
                  <img src={getUploadUrl(member.avatarUrl) || ""} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  <span className="text-primary font-black text-lg">
                    {(member.fullName || "?").charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex flex-col justify-center">
                <p className="font-bold text-sm sm:text-base text-foreground uppercase tracking-tight leading-none truncate mb-1">
                  {member.fullName || "Sem nome"}
                </p>
                <div className="flex items-center gap-3">
                  {(member.username || member.fullName) && (
                    <span className="text-muted-foreground text-xs font-medium truncate">
                      @{((member.username && !/^\d{8,}$/.test(member.username))
                        ? member.username
                        : (member.fullName?.trim().toLowerCase().replace(/\s+/g, ".") || member.username)).toLowerCase()}
                    </span>
                  )}
                  {member.whatsappPhone && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                      <Phone className="h-3 w-3 text-primary shrink-0" />
                      <span className="truncate">{formatPhoneForDisplay(member.whatsappPhone || "")}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Centro: Badges */}
            <div className="flex flex-col items-start sm:items-center justify-center mt-3 sm:mt-0 sm:flex-1">
              <div className="flex flex-wrap items-center justify-start sm:justify-center gap-1.5">
                {member.roles?.some((r: any) => r.role === "admin_ccm") ? (
                  <Badge variant="default" className="bg-rose-600 text-white hover:bg-rose-700 uppercase text-[9px] px-2 py-0.5 rounded-full font-black shadow-sm">ADM CCM</Badge>
                ) : member.roles?.some((r: any) => r.role === "admin") ? (
                  <Badge variant="default" className="bg-slate-800 text-white uppercase text-[9px] px-2 py-0.5 rounded-full font-black shadow-sm">Admin</Badge>
                ) : null}
                {member.roles?.some((r: any) => r.role === "pastor") && (
                  <Badge variant="default" className="bg-indigo-600 text-white hover:bg-indigo-700 uppercase text-[9px] px-2 py-0.5 rounded-full font-black shadow-sm">
                    Pastor
                  </Badge>
                )}
                {member.roles?.some((r: any) => r.role === "lider") && (
                  <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-700 uppercase text-[9px] px-2 py-0.5 rounded-full font-black border-0">
                    Líder
                  </Badge>
                )}
                {(!member.roles || member.roles.length === 0 || member.roles.every((r: any) => r.role === "membro")) && (
                  <Badge variant="outline" className="uppercase text-[9px] px-2 py-0.5 rounded-full text-muted-foreground font-bold border-muted-foreground/30 bg-muted/40">
                    Membro
                  </Badge>
                )}
                {member.groups?.map((name: string) => (
                  <Badge key={name} variant="outline" className="uppercase text-[9px] px-2 py-0.5 rounded-full bg-muted/30 font-bold border-muted-foreground/20 text-muted-foreground">
                    {name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Direita: Ações */}
            {isAdmin && (
              <div className="flex items-center justify-end gap-2 shrink-0 mt-3 sm:mt-0 sm:w-1/4">
                <Button variant="outline" size="icon"
                  className="h-8 w-8 rounded-lg border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-600 transition-colors"
                  onClick={() => setResettingPasswordMember(member)}
                  title="Resetar Senha"
                >
                  <Key className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon"
                  className="h-8 w-8 rounded-lg border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                  onClick={() => handleEdit(member)}
                  title="Editar Membro"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon"
                  className="h-8 w-8 rounded-lg border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                  onClick={() => setDeletingMember(member)}
                  disabled={deleteMutation.isPending}
                  title="Excluir Membro"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
            
          </div>
        ))}
      </div>

      {filtered?.length === 0 && (
        <p className="text-center text-muted-foreground py-8">Nenhum membro encontrado</p>
      )}

      <ConfirmDialog
        open={!!deletingMember}
        title="Excluir Membro"
        description={`Tem certeza que deseja excluir ${deletingMember?.fullName || "este membro"}? Esta ação removerá o acesso e todos os dados vinculados.`}
        confirmLabel="Excluir"
        variant="danger"
        onConfirm={() => deleteMutation.mutate(deletingMember)}
        onCancel={() => setDeletingMember(null)}
      />

      <ConfirmDialog
        open={!!resettingPasswordMember}
        title="Resetar Senha"
        description={`Deseja resetar a senha de ${resettingPasswordMember?.fullName}? A senha voltará para o padrão: 123456`}
        confirmLabel="Resetar"
        variant="default"
        onConfirm={() => resetPasswordMutation.mutate(resettingPasswordMember)}
        onCancel={() => setResettingPasswordMember(null)}
      />

      <Dialog open={!!editingMember} onOpenChange={(val) => !val && setEditingMember(null)}>
        <DialogContent className="sm:max-w-[900px] rounded-3xl border-0 shadow-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader><DialogTitle className="text-xl font-bold">Editar Membro: {editingMember?.fullName}</DialogTitle></DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome Completo</Label>
                <Input value={editName} onChange={e => setEditName(e.target.value)} className="rounded-xl h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome de Usuário (Login)</Label>
                <div className="relative flex items-center">
                  <Input
                    value={editUsername}
                    onChange={e => setEditUsername(e.target.value)}
                    placeholder="ex: joao.silva"
                    className={cn("rounded-xl h-11", editUsername && "pr-[140px]")}
                    readOnly={!isAdminCCM}
                  />
                  {editUsername && (
                    <span className="absolute right-3 text-muted-foreground pointer-events-none font-medium text-xs">
                      @ccmergulho.com
                    </span>
                  )}
                </div>
                {!isAdminCCM && <p className="text-[10px] text-amber-600 font-medium">Somente ADM CCM pode alterar o login/email.</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">WhatsApp</Label>
                <Input 
                  value={editPhone} 
                  onChange={e => setEditPhone(maskPhone(e.target.value))} 
                  placeholder="(11) 99999-9999" 
                  className="rounded-xl h-11" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Permissão Global</Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="membro">Membro</SelectItem>
                    <SelectItem value="lider">Líder</SelectItem>
                    <SelectItem value="pastor">Pastor</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    {isAdminCCM && (
                      <SelectItem value="admin_ccm">Administrador CCM (Gestor Master)</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Data de Nascimento</Label>
                <Input type="date" max="9999-12-31" value={editBirthDate} onChange={e => setEditBirthDate(e.target.value)} className="rounded-xl h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">CEP</Label>
                <Input value={editCodCep} onChange={e => handleCepChange(e.target.value)} placeholder="00000-000" className="rounded-xl h-11" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rua</Label>
                <Input value={editStreet} onChange={e => setEditStreet(e.target.value)} placeholder="Rua" className="rounded-xl h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Bairro</Label>
                <Input value={editNeighborhood} onChange={e => setEditNeighborhood(e.target.value)} placeholder="Bairro" className="rounded-xl h-11" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Número</Label>
                <Input value={editNumber} onChange={e => setEditNumber(e.target.value)} placeholder="Nº" className="rounded-xl h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Complemento</Label>
                <Input value={editComplement} onChange={e => setEditComplement(e.target.value)} placeholder="Apto, Bloco, etc." className="rounded-xl h-11" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cidade</Label>
                <Input value={editCity} onChange={e => setEditCity(e.target.value)} placeholder="Cidade" className="rounded-xl h-11" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Estado (UF)</Label>
                <Input value={editState} onChange={e => setEditState(e.target.value)} placeholder="Ex: CE" className="rounded-xl h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">País</Label>
                <Input value={editCountry} onChange={e => setEditCountry(e.target.value)} className="rounded-xl h-11" />
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

      <Dialog open={creatingMember} onOpenChange={(val) => !val && setCreatingMember(false)}>
        <DialogContent className="sm:max-w-[900px] rounded-3xl border-0 shadow-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader><DialogTitle className="text-xl font-bold text-primary">Cadastrar Novo Membro</DialogTitle></DialogHeader>
          <div className="py-4 space-y-6">
            <div className="bg-primary/5 border border-primary/20 p-4 rounded-2xl text-xs text-primary font-medium flex items-center gap-3">
              <CheckCircle className="h-5 w-5 shrink-0" />
              <p>Senha padrão: <strong>123456</strong>. O usuário deverá trocar após o primeiro acesso.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome Completo</Label>
                <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nome completo" required className="rounded-xl h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome de Usuário (Login)</Label>
                <div className="relative flex items-center">
                  <Input 
                    value={editUsername} 
                    onChange={e => setEditUsername(e.target.value)} 
                    placeholder="ex: joao.silva" 
                    required 
                    className={cn("rounded-xl h-11", editUsername && "pr-[140px]")} 
                  />
                  {editUsername && (
                    <span className="absolute right-3 text-muted-foreground pointer-events-none font-medium text-xs">
                      @ccmergulho.com
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground italic">Usado para entrar no sistema</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">WhatsApp (opcional)</Label>
                <Input 
                  value={editPhone} 
                  onChange={e => setEditPhone(maskPhone(e.target.value))} 
                  placeholder="(11) 99999-9999" 
                  className="rounded-xl h-11" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Permissão Global</Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="membro">Membro</SelectItem>
                    <SelectItem value="lider">Líder</SelectItem>
                    <SelectItem value="pastor">Pastor</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    {isAdminCCM && (
                      <SelectItem value="admin_ccm">Administrador CCM (Gestor Master)</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Data de Nascimento</Label>
                <Input type="date" max="9999-12-31" value={editBirthDate} onChange={e => setEditBirthDate(e.target.value)} className="rounded-xl h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">CEP</Label>
                <Input value={editCodCep} onChange={e => handleCepChange(e.target.value)} placeholder="00000-000" className="rounded-xl h-11" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rua</Label>
                <Input value={editStreet} onChange={e => setEditStreet(e.target.value)} placeholder="Rua" className="rounded-xl h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Bairro</Label>
                <Input value={editNeighborhood} onChange={e => setEditNeighborhood(e.target.value)} placeholder="Bairro" className="rounded-xl h-11" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Número</Label>
                <Input value={editNumber} onChange={e => setEditNumber(e.target.value)} placeholder="Nº" className="rounded-xl h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Complemento</Label>
                <Input value={editComplement} onChange={e => setEditComplement(e.target.value)} placeholder="Apto, Bloco, etc." className="rounded-xl h-11" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cidade</Label>
                <Input value={editCity} onChange={e => setEditCity(e.target.value)} placeholder="Cidade" className="rounded-xl h-11" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Estado (UF)</Label>
                <Input value={editState} onChange={e => setEditState(e.target.value)} placeholder="Ex: CE" className="rounded-xl h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">País</Label>
                <Input value={editCountry} onChange={e => setEditCountry(e.target.value)} className="rounded-xl h-11" />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Departamentos (Opcional)</Label>
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