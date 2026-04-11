import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Shield, Plus, Edit2, Trash2, Users, Camera, Upload } from "lucide-react";
import { useRef } from "react";
import { useToast } from "@/hooks/use-toast";

const Groups = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [managingGroup, setManagingGroup] = useState<any>(null);
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [groupIcon, setGroupIcon] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [deletingGroup, setDeletingGroup] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isAdmin) return <Navigate to="/home" replace />;

  const { data: groups } = useQuery({
    queryKey: ["groups-admin"],
    queryFn: async () => {
      const { data: grps } = await supabase.from("groups").select("*").order("name");
      const { data: memberCounts } = await supabase.from("member_groups").select("group_id");
      const countMap = new Map<string, number>();
      memberCounts?.forEach(mg => countMap.set(mg.group_id, (countMap.get(mg.group_id) || 0) + 1));
      return (grps || []).map(g => ({ ...g, memberCount: countMap.get(g.id) || 0 }));
    },
  });

  const { data: allMembers } = useQuery({
    queryKey: ["all-profiles-groups"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name").order("full_name");
      return data || [];
    },
  });

  const { data: groupMembers } = useQuery({
    queryKey: ["group-members", managingGroup?.id],
    queryFn: async () => {
      if (!managingGroup) return [];
      const { data } = await supabase.from("member_groups").select("user_id").eq("group_id", managingGroup.id);
      const ids = data?.map(m => m.user_id) || [];
      setSelectedMembers(ids);
      return ids;
    },
    enabled: !!managingGroup,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { name: groupName, description: groupDesc, icon: groupIcon };
      if (editingGroup) {
        const { error } = await supabase.from("groups").update(payload).eq("id", editingGroup.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("groups").insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups-admin"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      setEditingGroup(null);
      setCreatingGroup(false);
      toast({ title: editingGroup ? "Grupo atualizado!" : "Grupo criado!" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const saveMembersMutation = useMutation({
    mutationFn: async () => {
      if (!managingGroup) return;
      await supabase.from("member_groups").delete().eq("group_id", managingGroup.id);
      if (selectedMembers.length > 0) {
        const inserts = selectedMembers.map(uid => ({ user_id: uid, group_id: managingGroup.id }));
        await supabase.from("member_groups").insert(inserts as any);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups-admin"] });
      queryClient.invalidateQueries({ queryKey: ["group-members", managingGroup?.id] });
      setManagingGroup(null);
      toast({ title: "Membros do grupo atualizados!" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `group_icon_${Date.now()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from("group-icons")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("group-icons").getPublicUrl(fileName);
      setGroupIcon(urlData.publicUrl);
      toast({ title: "Foto selecionada!", description: "Clique em Salvar para confirmar." });
    } catch (err: any) {
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("member_groups").delete().eq("group_id", id);
      const { error } = await supabase.from("groups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups-admin"] });
      toast({ title: "Grupo removido!" });
    },
  });

  const handleEdit = (g: any) => {
    setEditingGroup(g);
    setGroupName(g.name || "");
    setGroupDesc(g.description || "");
    setGroupIcon(g.icon || "🌊");
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Departamentos
        </h1>
        <Button onClick={() => { setGroupName(""); setGroupDesc(""); setGroupIcon("🌊"); setCreatingGroup(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Novo Grupo
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {groups?.map(g => (
          <Card key={g.id} className="neo-shadow-sm border-0">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-primary/20 shrink-0">
                    {g.icon && (g.icon.startsWith('http') || g.icon.startsWith('/')) ? (
                      <img src={g.icon} alt={g.name} className="h-full w-full object-cover" />
                    ) : (
                      <Users className="h-7 w-7 text-primary" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg tracking-tight font-black">{g.name}</CardTitle>
                    {g.description && <p className="text-[10px] text-muted-foreground uppercase font-medium leading-tight mt-0.5">{g.description}</p>}
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">{g.memberCount} membros</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={() => { setManagingGroup(g); setSelectedMembers([]); }}>
                  <Users className="h-3 w-3 mr-1" /> Gerenciar Membros
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleEdit(g)}>
                  <Edit2 className="h-4 w-4 text-primary" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setDeletingGroup(g)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {groups?.length === 0 && (
          <p className="text-muted-foreground col-span-2 text-center py-8">Nenhum grupo criado ainda</p>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={creatingGroup} onOpenChange={val => !val && setCreatingGroup(false)}>
        <DialogContent className="sm:max-w-[600px] rounded-3xl border-0 shadow-2xl">
          <DialogHeader><DialogTitle className="text-xl font-bold">Novo Departamento</DialogTitle></DialogHeader>
          <GroupForm
            groupIcon={groupIcon} setGroupIcon={setGroupIcon}
            groupName={groupName} setGroupName={setGroupName}
            groupDesc={groupDesc} setGroupDesc={setGroupDesc}
            handleIconUpload={handleIconUpload}
            uploading={uploading}
            fileInputRef={fileInputRef}
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreatingGroup(false)} className="rounded-xl border-2">Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!groupName || saveMutation.isPending} className="rounded-xl px-8 font-bold">
              {saveMutation.isPending ? "Salvando..." : "Criar Departamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete */}
      <ConfirmDialog
        open={!!deletingGroup}
        title="Excluir Grupo"
        description={`Deseja realmente excluir o grupo "${deletingGroup?.name}"? Isso removerá o vínculo de todos os membros deste grupo.`}
        confirmLabel="Excluir"
        variant="danger"
        onConfirm={() => deleteMutation.mutate(deletingGroup?.id)}
        onCancel={() => setDeletingGroup(null)}
      />

      {/* Edit Dialog */}
      <Dialog open={!!editingGroup} onOpenChange={val => !val && setEditingGroup(null)}>
        <DialogContent className="sm:max-w-[600px] rounded-3xl border-0 shadow-2xl">
          <DialogHeader><DialogTitle className="text-xl font-bold">Editar Departamento: {editingGroup?.name}</DialogTitle></DialogHeader>
          <GroupForm
            groupIcon={groupIcon} setGroupIcon={setGroupIcon}
            groupName={groupName} setGroupName={setGroupName}
            groupDesc={groupDesc} setGroupDesc={setGroupDesc}
            handleIconUpload={handleIconUpload}
            uploading={uploading}
            fileInputRef={fileInputRef}
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditingGroup(null)} className="rounded-xl border-2">Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!groupName || saveMutation.isPending} className="rounded-xl px-8 font-bold">
              {saveMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Members Dialog */}
      <Dialog open={!!managingGroup} onOpenChange={val => !val && setManagingGroup(null)}>
        <DialogContent className="sm:max-w-[550px] rounded-3xl border-0 shadow-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Gerenciar Membros: {managingGroup?.name}</DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">Selecione os membros que fazem parte deste departamento.</p>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[50vh] py-4 pr-2 space-y-2 custom-scrollbar">
            {allMembers?.map(m => (
              <div key={m.user_id} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-muted/50 border border-transparent hover:border-border transition-all group">
                <Checkbox
                  id={`gm-${m.user_id}`}
                  checked={selectedMembers.includes(m.user_id)}
                  onCheckedChange={checked => {
                    if (checked) setSelectedMembers([...selectedMembers, m.user_id]);
                    else setSelectedMembers(selectedMembers.filter(id => id !== m.user_id));
                  }}
                  className="rounded-md"
                />
                <label htmlFor={`gm-${m.user_id}`} className="text-sm font-semibold cursor-pointer flex-1 group-hover:text-primary transition-colors">
                  {m.full_name || "Sem nome"}
                </label>
                {selectedMembers.includes(m.user_id) && (
                  <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-0">membro ativo</Badge>
                )}
              </div>
            ))}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setManagingGroup(null)} className="rounded-xl border-2">Cancelar</Button>
            <Button onClick={() => saveMembersMutation.mutate()} disabled={saveMembersMutation.isPending} className="rounded-xl px-8 font-bold">
              {saveMembersMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Groups;

const GroupForm = ({ groupIcon, setGroupIcon, groupName, setGroupName, groupDesc, setGroupDesc, handleIconUpload, uploading, fileInputRef }: any) => (
  <div className="space-y-6 py-4">
    <div className="flex flex-col items-center justify-center gap-4 py-4 mb-2 bg-muted/20 rounded-3xl border border-dashed border-border/50">
      <div 
        className="h-24 w-24 rounded-3xl bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-primary/20 relative cursor-pointer group"
        onClick={() => fileInputRef.current?.click()}
      >
        {groupIcon && (groupIcon.startsWith('http') || groupIcon.startsWith('/')) ? (
          <img src={groupIcon} alt="Preview" className="h-full w-full object-cover" />
        ) : (
          <Users className="h-10 w-10 text-primary" />
        )}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera className="h-6 w-6 text-white" />
        </div>
        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      <div className="text-center">
        <Button 
          variant="outline" 
          size="sm" 
          className="rounded-xl border-2 gap-2 h-9" 
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="h-4 w-4" /> 
          {groupIcon ? 'Trocar Foto' : 'Carregar Foto'}
        </Button>
      </div>
      <input type="file" hidden ref={fileInputRef} onChange={handleIconUpload} accept="image/*" />
    </div>

    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome do Departamento</Label>
        <Input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Nome do departamento" className="rounded-xl h-11" />
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Descrição (opcional)</Label>
        <Input value={groupDesc} onChange={e => setGroupDesc(e.target.value)} placeholder="Descreva brevemente a função deste departamento..." className="rounded-xl h-11" />
      </div>
    </div>
  </div>
);

