import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import ConfirmDialog from "@/components/ConfirmDialog";
import { HandHeart, Plus, Trash2, User, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

const INTEREST_AREAS = [
  "Louvor / Música",
  "Infantil",
  "Recepção",
  "Multimídia / Som",
  "Limpeza",
  "Cozinha / Café",
  "Intercessão",
  "Diaconia",
  "Outro",
];

const Volunteers = () => {
  const { user, isAdmin, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [availability, setAvailability] = useState("");
  const [interestAreas, setInterestAreas] = useState<string[]>([]);

  const { data: volunteers } = useQuery({
    queryKey: ["volunteers"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("volunteers").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const alreadyVolunteer = volunteers?.some((v: any) => v.user_id === user?.id);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("volunteers").insert({
        user_id: user!.id,
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        availability: availability.trim() || null,
        interest_areas: interestAreas,
        interest_area: interestAreas[0] || null, // Backwards compatibility
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteers"] });
      setCreating(false);
      setFullName(""); setPhone(""); setAvailability(""); setInterestAreas([]);
      toast({ title: "Inscrição realizada! 🙌" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("volunteers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteers"] });
      toast({ title: "Inscrição removida." });
    },
  });

  const handleOpen = () => {
    setFullName(profile?.full_name || "");
    setPhone(profile?.whatsapp_phone || "");
    setAvailability("");
    setInterestAreas([]);
    setCreating(true);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <HandHeart className="h-6 w-6 text-primary" />
          Voluntários
        </h1>
        {!alreadyVolunteer && (
          <Button onClick={handleOpen}>
            <Plus className="h-4 w-4 mr-1" /> Quero ser voluntário
          </Button>
        )}
      </div>

      {alreadyVolunteer && !isAdmin && (
        <Card className="neo-shadow-sm border-0 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardContent className="p-4 text-sm text-emerald-700 dark:text-emerald-400">
            ✅ Você já está inscrito como voluntário! Obrigado pelo seu coração de servir.
          </CardContent>
        </Card>
      )}

      {/* Admin view - list all */}
      {isAdmin && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground font-medium">{volunteers?.length || 0} voluntário(s) inscrito(s)</p>
          {volunteers?.map((v: any) => (
            <Card key={v.id} className="neo-shadow-sm border-0">
              <CardContent className="p-4 flex items-start justify-between">
                <div className="space-y-1">
                  <p className="font-semibold flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" /> {v.full_name}
                  </p>
                  {v.phone && <p className="text-xs text-muted-foreground">📱 {v.phone}</p>}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {v.interest_areas && v.interest_areas.length > 0 ? (
                      v.interest_areas.map((area: string) => (
                        <Badge key={area} variant="secondary" className="text-[10px] uppercase font-bold">
                          {area}
                        </Badge>
                      ))
                    ) : v.interest_area ? (
                      <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                        {v.interest_area}
                      </Badge>
                    ) : null}
                  </div>
                  {v.availability && <p className="text-xs text-muted-foreground mt-2">Disponibilidade: {v.availability}</p>}
                  <p className="text-[10px] text-muted-foreground">
                    Inscrito em {format(new Date(v.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setDeleting(v)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Non-admin: just show own status */}
      {!isAdmin && !alreadyVolunteer && volunteers?.length === 0 && (
        <Card className="border-0 bg-muted/30">
          <CardContent className="p-6 text-center text-muted-foreground">
            Seja o primeiro a se inscrever como voluntário!
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={creating} onOpenChange={v => !v && setCreating(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Inscrição de Voluntário</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Seu nome" />
            </div>
            <div className="space-y-2">
              <Label>Telefone / WhatsApp</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-bold">Áreas de Interesse (Selecione uma ou mais)</Label>
              <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-xl border">
                {INTEREST_AREAS.map((area) => (
                  <div key={area} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`area-${area}`} 
                      checked={interestAreas.includes(area)}
                      onCheckedChange={(checked) => {
                        if (checked) setInterestAreas([...interestAreas, area]);
                        else setInterestAreas(interestAreas.filter(a => a !== area));
                      }}
                    />
                    <label 
                      htmlFor={`area-${area}`} 
                      className="text-xs font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {area}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Disponibilidade</Label>
              <Textarea value={availability} onChange={e => setAvailability(e.target.value)} placeholder="Ex: Sábados à tarde, domingos de manhã..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!fullName.trim() || saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando..." : "Inscrever-se"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        title="Remover Voluntário"
        description={`Remover "${deleting?.full_name}" da lista de voluntários?`}
        confirmLabel="Remover"
        variant="danger"
        onConfirm={() => deleteMutation.mutate(deleting?.id)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
};

export default Volunteers;
