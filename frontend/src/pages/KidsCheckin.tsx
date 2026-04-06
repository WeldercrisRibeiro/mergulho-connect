import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, UserPlus, Search, QrCode, Phone, CheckCircle2, XCircle, Loader2, Package } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { safeFormatTime } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";

const KidsCheckin = () => {
  const { user, isAdmin, isGerente } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [category, setCategory] = useState<"kids" | "volume">("kids");
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [childName, setChildName] = useState("");
  const [itemsInfo, setItemsInfo] = useState("");
  const [guardianSearch, setGuardianSearch] = useState("");
  const [selectedGuardian, setSelectedGuardian] = useState<any>(null);

  // Fetch events for selection
  const { data: events } = useQuery({
    queryKey: ["checkin-events"],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("id, title, event_date")
        .order("event_date", { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  // Set default event if possible
  useEffect(() => {
    if (events && events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  // Search guardians (profiles)
  const { data: guardians } = useQuery({
    queryKey: ["guardian-search", guardianSearch],
    queryFn: async () => {
      if (guardianSearch.length < 2) return [];
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, whatsapp_phone")
        .ilike("full_name", `%${guardianSearch}%`)
        .limit(5);
      return data || [];
    },
    enabled: guardianSearch.length >= 2,
  });

  // Active check-ins filtered by event and category
  const { data: activeCheckins, isLoading: loadingCheckins } = useQuery({
    queryKey: ["active-checkins", selectedEventId, category],
    queryFn: async () => {
      let query = (supabase as any)
        .from("kids_checkins")
        .select("*, profiles:guardian_id(full_name, whatsapp_phone)")
        .eq("status", "active")
        .eq("category", category);

      if (selectedEventId) {
        query = query.eq("event_id", selectedEventId);
      }

      const { data } = await query.order("created_at", { ascending: false });
      return data || [];
    },
    refetchInterval: 5000,
    enabled: !!selectedEventId,
  });

  const checkinMutation = useMutation({
    mutationFn: async () => {
      if (!selectedGuardian || !childName || !selectedEventId) {
        throw new Error("Preencha todos os campos obrigatórios e selecione um evento.");
      }
      
      const token = Math.floor(100000 + Math.random() * 900000).toString();
      
      const { error } = await (supabase as any).from("kids_checkins").insert({
        child_name: childName,
        guardian_id: selectedGuardian.user_id,
        items_description: itemsInfo,
        validation_token: token,
        status: "active",
        category: category,
        event_id: selectedEventId
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      setChildName("");
      setItemsInfo("");
      setSelectedGuardian(null);
      setGuardianSearch("");
      // Invalida a query específica para forçar o refresh
      queryClient.invalidateQueries({ queryKey: ["active-checkins"] });
      toast({ title: "Check-in realizado!", description: `Registrado em ${category === "kids" ? "Kids" : "Volumes"}.` });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" })
  });

  const callGuardianMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("kids_checkins")
        .update({ call_requested: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-checkins"] });
      toast({ title: "Chamada enviada!", description: "O responsável receberá uma notificação." });
    }
  });

  const checkoutMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("kids_checkins")
        .update({ status: "completed" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-checkins"] });
      toast({ title: "Checkout concluído!", description: "Liberação realizada com sucesso." });
    }
  });

  if (!isAdmin && !isGerente) return <div className="p-8 text-center text-muted-foreground font-medium bg-card rounded-2xl border border-dashed">Acesso restrito ao ministério de segurança e líderes.</div>;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card p-6 rounded-3xl border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Check-in Mergulho</h1>
            <p className="text-muted-foreground text-sm">Segurança de crianças e controle de pertences.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="w-full sm:w-64">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Evento / Culto Ativo</Label>
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger className="bg-background border-primary/20">
                <SelectValue placeholder="Selecione o culto" />
              </SelectTrigger>
              <SelectContent>
                {events?.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Tabs value={category} onValueChange={(v: any) => setCategory(v)} className="w-full sm:w-auto">
            <TabsList className="grid grid-cols-2 h-10 p-1 bg-muted/50 rounded-xl">
              <TabsTrigger value="kids" className="rounded-lg gap-2">
                <ShieldCheck className="h-4 w-4" /> Kids
              </TabsTrigger>
              <TabsTrigger value="volume" className="rounded-lg gap-2">
                <Package className="h-4 w-4" /> Volumes
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Registration Form */}
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-xl overflow-hidden">
            <div className={cn("h-1.5 w-full", category === "kids" ? "bg-primary" : "bg-orange-500")} />
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Nova Entrada — {category === "kids" ? "Criança" : "Volume"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{category === "kids" ? "Nome da Criança" : "Identificação do Volume"}</Label>
                <Input 
                  placeholder={category === "kids" ? "Ex: Joãozinho Silva" : "Ex: Carrinho de Bebê / Mochila"} 
                  value={childName} 
                  onChange={(e) => setChildName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Responsável</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    className="pl-9"
                    placeholder="Buscar por nome..." 
                    value={guardianSearch}
                    onChange={(e) => setGuardianSearch(e.target.value)}
                  />
                </div>
                
                {guardians && guardians.length > 0 && !selectedGuardian && (
                  <div className="mt-1 border rounded-xl overflow-hidden bg-background shadow-2xl z-50 relative">
                    {guardians.map((g) => (
                      <button
                        key={g.user_id}
                        className="w-full text-left px-4 py-3 hover:bg-primary/5 text-sm border-b last:border-0 transition-colors"
                        onClick={() => {
                          setSelectedGuardian(g);
                          setGuardianSearch(g.full_name);
                        }}
                      >
                        <p className="font-bold">{g.full_name}</p>
                        <p className="text-[10px] text-muted-foreground">{g.whatsapp_phone || "Sem telefone"}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedGuardian && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex justify-between items-center animate-in fade-in zoom-in-95">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-xs text-primary">
                      {selectedGuardian.full_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-none">{selectedGuardian.full_name}</p>
                      <p className="text-[10px] text-muted-foreground">{selectedGuardian.whatsapp_phone}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setSelectedGuardian(null)}>
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                <Label>Observações (Opcional)</Label>
                <Input 
                  placeholder="Ex: Alergias, objetos dentro etc" 
                  value={itemsInfo} 
                  onChange={(e) => setItemsInfo(e.target.value)}
                />
              </div>

              <Button 
                className={cn("w-full h-12 font-bold shadow-lg transition-all", category === "volume" && "bg-orange-500 hover:bg-orange-600")} 
                onClick={() => checkinMutation.mutate()}
                disabled={!childName || !selectedGuardian || !selectedEventId || checkinMutation.isPending}
              >
                {checkinMutation.isPending ? "Processando..." : `Realizar Check-in ${category === "kids" ? "Kids" : ""}`}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Active List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <CheckCircle2 className={cn("h-5 w-5", category === "kids" ? "text-emerald-500" : "text-orange-500")} />
              Pendentes de Retirada ({activeCheckins?.length || 0})
            </h3>
          </div>
          
          {loadingCheckins ? (
            <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : !activeCheckins || activeCheckins.length === 0 ? (
            <Card className="border-dashed bg-muted/20 border-2 rounded-3xl h-64 flex items-center justify-center">
              <div className="text-center space-y-2">
                <Package className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                <p className="text-muted-foreground italic text-sm">Nenhum registro ativo para este evento.</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeCheckins.map((item: any) => (
                <Card key={item.id} className={cn("border-0 shadow-lg relative overflow-hidden group transition-all hover:translate-y-[-2px]", item.call_requested && "ring-2 ring-rose-500")}>
                  {item.call_requested && (
                    <div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] px-3 py-1 font-black animate-pulse uppercase tracking-wider">Chamado!</div>
                  )}
                  <CardContent className="p-5 space-y-5">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <h4 className="font-black text-lg leading-tight uppercase truncate">{item.child_name}</h4>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1 font-bold">
                          RESPONSÁVEL: {item.profiles?.full_name?.split(' ')[0]}
                        </p>
                      </div>
                      <Badge className={cn("text-white font-mono text-lg px-3 py-1 border-0 shadow-md", category === "kids" ? "bg-primary" : "bg-orange-500")}>
                        {item.validation_token}
                      </Badge>
                    </div>

                    {item.items_description && (
                      <div className="bg-muted/30 p-2 rounded-lg text-[11px] leading-relaxed italic border-l-2 border-primary/40">
                        "{item.items_description}"
                      </div>
                    )}

                    <div className="flex gap-2 pt-2 border-t mt-4">
                      <Button 
                        size="sm" 
                        variant={item.call_requested ? "destructive" : "secondary"}
                        className="flex-1 h-11 gap-2 font-black shadow-sm"
                        onClick={() => callGuardianMutation.mutate(item.id)}
                        disabled={callGuardianMutation.isPending}
                      >
                        <Phone className="h-4 w-4" />
                        Chamar
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1 h-11 gap-2 bg-emerald-600 hover:bg-emerald-700 font-black shadow-sm text-white"
                        onClick={() => checkoutMutation.mutate(item.id)}
                        disabled={checkoutMutation.isPending}
                      >
                        <ShieldCheck className="h-4 w-4" />
                        Retirar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KidsCheckin;
