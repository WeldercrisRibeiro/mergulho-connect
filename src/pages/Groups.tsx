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
import { Shield, Plus, Edit2, Trash2, Users } from "lucide-react";
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
  const [groupIcon, setGroupIcon] = useState("🌊");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [deletingGroup, setDeletingGroup] = useState<any>(null);

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
          Grupos
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
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{g.icon || "🌊"}</span>
                  <div>
                    <CardTitle className="text-base">{g.name}</CardTitle>
                    {g.description && <p className="text-xs text-muted-foreground mt-0.5">{g.description}</p>}
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
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>Novo Grupo</DialogTitle></DialogHeader>
          <GroupForm 
            groupIcon={groupIcon} setGroupIcon={setGroupIcon}
            groupName={groupName} setGroupName={setGroupName}
            groupDesc={groupDesc} setGroupDesc={setGroupDesc}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreatingGroup(false)}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!groupName || saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando..." : "Criar"}
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
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>Editar Grupo</DialogTitle></DialogHeader>
          <GroupForm 
            groupIcon={groupIcon} setGroupIcon={setGroupIcon}
            groupName={groupName} setGroupName={setGroupName}
            groupDesc={groupDesc} setGroupDesc={setGroupDesc}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingGroup(null)}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!groupName || saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Members Dialog */}
      <Dialog open={!!managingGroup} onOpenChange={val => !val && setManagingGroup(null)}>
        <DialogContent className="sm:max-w-[450px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Membros: {managingGroup?.name}</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[50vh] py-2 space-y-2">
            {allMembers?.map(m => (
              <div key={m.user_id} className="flex items-center space-x-3 p-2 rounded hover:bg-muted/50">
                <Checkbox
                  id={`gm-${m.user_id}`}
                  checked={selectedMembers.includes(m.user_id)}
                  onCheckedChange={checked => {
                    if (checked) setSelectedMembers([...selectedMembers, m.user_id]);
                    else setSelectedMembers(selectedMembers.filter(id => id !== m.user_id));
                  }}
                />
                <label htmlFor={`gm-${m.user_id}`} className="text-sm font-medium cursor-pointer flex-1">
                  {m.full_name || "Sem nome"}
                </label>
                {selectedMembers.includes(m.user_id) && (
                  <Badge variant="secondary" className="text-xs">no grupo</Badge>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManagingGroup(null)}>Cancelar</Button>
            <Button onClick={() => saveMembersMutation.mutate()} disabled={saveMembersMutation.isPending}>
              {saveMembersMutation.isPending ? "Salvando..." : "Salvar Membros"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Groups;

const GroupForm = ({ groupIcon, setGroupIcon, groupName, setGroupName, groupDesc, setGroupDesc }: any) => (
  <div className="space-y-4 py-4">
    <div className="space-y-2">
      <Label>Ícone (emoji)</Label>
      <Input value={groupIcon} onChange={e => setGroupIcon(e.target.value)} placeholder="🌊" className="w-20" />
    </div>
    <div className="space-y-2">
      <Label>Nome do Grupo</Label>
      <Input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Nome do grupo" />
    </div>
    <div className="space-y-2">
      <Label>Descrição (opcional)</Label>
      <Input value={groupDesc} onChange={e => setGroupDesc(e.target.value)} placeholder="Descrição breve" />
    </div>
  </div>
);
