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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Settings, ImagePlus, MessageSquareQuote, Trash2, Plus, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SettingsPage = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Photo state
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoCaption, setPhotoCaption] = useState("");
  const [editingPhoto, setEditingPhoto] = useState<any>(null);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);

  // Testimonial state
  const [testName, setTestName] = useState("");
  const [testRole, setTestRole] = useState("");
  const [testText, setTestText] = useState("");
  const [editingTest, setEditingTest] = useState<any>(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);

  if (!isAdmin) return <Navigate to="/home" replace />;

  const { data: photos } = useQuery({
    queryKey: ["landing-photos"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("landing_photos").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: testimonials } = useQuery({
    queryKey: ["landing-testimonials"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("landing_testimonials").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  // --- Photo mutations ---
  const savePhotoMutation = useMutation({
    mutationFn: async () => {
      const payload = { url: photoUrl, caption: photoCaption };
      if (editingPhoto) {
        await (supabase as any).from("landing_photos").update(payload).eq("id", editingPhoto.id);
      } else {
        await (supabase as any).from("landing_photos").insert(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landing-photos"] });
      setPhotoDialogOpen(false);
      setEditingPhoto(null);
      setPhotoUrl(""); setPhotoCaption("");
      toast({ title: editingPhoto ? "Foto atualizada!" : "Foto adicionada!" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const deletePhotoMutation = useMutation({
    mutationFn: async (id: string) => {
      await (supabase as any).from("landing_photos").delete().eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["landing-photos"] }),
  });

  // --- Testimonial mutations ---
  const saveTestMutation = useMutation({
    mutationFn: async () => {
      const payload = { name: testName, role: testRole, text: testText };
      if (editingTest) {
        await (supabase as any).from("landing_testimonials").update(payload).eq("id", editingTest.id);
      } else {
        await (supabase as any).from("landing_testimonials").insert(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landing-testimonials"] });
      setTestDialogOpen(false);
      setEditingTest(null);
      setTestName(""); setTestRole(""); setTestText("");
      toast({ title: editingTest ? "Depoimento atualizado!" : "Depoimento adicionado!" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const deleteTestMutation = useMutation({
    mutationFn: async (id: string) => {
      await (supabase as any).from("landing_testimonials").delete().eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["landing-testimonials"] }),
  });

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Settings className="h-6 w-6 text-primary" />
        Configurações
      </h1>

      <Tabs defaultValue="inicio">
        <TabsList>
          <TabsTrigger value="inicio">Página Inicial</TabsTrigger>
        </TabsList>

        <TabsContent value="inicio" className="space-y-8 pt-4">
          {/* Fotos */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ImagePlus className="h-5 w-5 text-primary" /> Fotos da Igreja
              </h2>
              <Button size="sm" onClick={() => { setPhotoUrl(""); setPhotoCaption(""); setEditingPhoto(null); setPhotoDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-1" /> Adicionar Foto
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {photos?.map((p: any) => (
                <Card key={p.id} className="overflow-hidden group">
                  <div className="relative h-40 bg-muted">
                    <img src={p.url} alt={p.caption} className="w-full h-full object-cover" onError={(e) => { (e.target as any).src = "https://placehold.co/400x200?text=Foto"; }} />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button size="icon" variant="secondary" onClick={() => { setEditingPhoto(p); setPhotoUrl(p.url); setPhotoCaption(p.caption || ""); setPhotoDialogOpen(true); }}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="destructive" onClick={() => { if (window.confirm("Remover foto?")) deletePhotoMutation.mutate(p.id); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {p.caption && <CardContent className="p-2 text-xs text-muted-foreground">{p.caption}</CardContent>}
                </Card>
              ))}
              {(!photos || photos.length === 0) && (
                <p className="text-muted-foreground col-span-3 py-6 text-center">Nenhuma foto adicionada ainda</p>
              )}
            </div>
          </div>

          {/* Depoimentos */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <MessageSquareQuote className="h-5 w-5 text-primary" /> Depoimentos de Membros
              </h2>
              <Button size="sm" onClick={() => { setTestName(""); setTestRole(""); setTestText(""); setEditingTest(null); setTestDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-1" /> Adicionar Depoimento
              </Button>
            </div>
            <div className="space-y-3">
              {testimonials?.map((t: any) => (
                <Card key={t.id} className="border-l-4 border-primary/40">
                  <CardContent className="p-4 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-muted-foreground text-sm italic">"{t.text}"</p>
                      <p className="mt-2 font-semibold text-sm">{t.name} <span className="font-normal text-muted-foreground text-xs">— {t.role}</span></p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingTest(t); setTestName(t.name); setTestRole(t.role || ""); setTestText(t.text); setTestDialogOpen(true); }}>
                        <Edit2 className="h-4 w-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { if (window.confirm("Remover depoimento?")) deleteTestMutation.mutate(t.id); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(!testimonials || testimonials.length === 0) && (
                <p className="text-muted-foreground py-6 text-center">Nenhum depoimento adicionado ainda</p>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Photo Dialog */}
      <Dialog open={photoDialogOpen} onOpenChange={val => !val && setPhotoDialogOpen(false)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>{editingPhoto ? "Editar Foto" : "Adicionar Foto"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>URL da Imagem</Label>
              <Input value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} placeholder="https://..." />
              <p className="text-xs text-muted-foreground">Cole o link direto de uma imagem (hospedada no Imgur, Google Drive compartilhado, etc.)</p>
            </div>
            {photoUrl && (
              <div className="rounded-lg overflow-hidden h-40 bg-muted">
                <img src={photoUrl} className="w-full h-full object-cover" alt="preview" onError={(e) => { (e.target as any).style.display = "none"; }} />
              </div>
            )}
            <div className="space-y-2">
              <Label>Legenda (opcional)</Label>
              <Input value={photoCaption} onChange={e => setPhotoCaption(e.target.value)} placeholder="Ex: Culto de domingo" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPhotoDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => savePhotoMutation.mutate()} disabled={!photoUrl || savePhotoMutation.isPending}>
              {savePhotoMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Testimonial Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={val => !val && setTestDialogOpen(false)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>{editingTest ? "Editar Depoimento" : "Novo Depoimento"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Membro</Label>
                <Input value={testName} onChange={e => setTestName(e.target.value)} placeholder="Ex: João Silva" />
              </div>
              <div className="space-y-2">
                <Label>Função / Grupo</Label>
                <Input value={testRole} onChange={e => setTestRole(e.target.value)} placeholder="Ex: Líder de Louvor" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Depoimento</Label>
              <Textarea value={testText} onChange={e => setTestText(e.target.value)} placeholder="Escreva o depoimento aqui..." rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => saveTestMutation.mutate()} disabled={!testName || !testText || saveTestMutation.isPending}>
              {saveTestMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;
