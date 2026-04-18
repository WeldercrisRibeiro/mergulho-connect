import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ShieldCheck, UserPlus, Search, QrCode, Phone, CheckCircle2, XCircle, Loader2, Package, ScanLine, Hash, Monitor, ClipboardList, Trash2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { safeFormatTime } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";
import { logAudit } from "@/lib/auditLogger";
import QRScanner from "@/components/QRScanner";
import { getErrorMessage } from "@/lib/errorMessages";

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
  const [showScanner, setShowScanner] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  });

  // Token/QR validation (for gerentes)
  const handleValidateToken = async (token: string) => {
    const match = activeCheckins?.find((c: any) => c.validation_token === token);
    if (match) {
      toast({ title: `✅ Token válido!`, description: `${match.child_name} — Fazendo checkout...` });
      checkoutMutation.mutate(match.id);
      setRetrievalItem(null); // Fecha modal imediatamente
    } else {
      toast({ title: "Token inválido", description: "Nenhum registro encontrado.", variant: "destructive" });
    }
  };

  if (!isAdmin && !isGerente) return <div className="p-8 text-center text-muted-foreground font-medium bg-card rounded-2xl border border-dashed">Acesso restrito ao ministério de segurança e líderes.</div>;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card p-6 rounded-3xl border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Validação de Fluxo</h1>
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

      <Tabs defaultValue="entrada" className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md bg-muted/50 p-1 rounded-2xl h-12 mb-8">
          <TabsTrigger value="entrada" className="rounded-xl font-bold flex items-center gap-2">
            <UserPlus className="h-4 w-4" /> Entrada / Nova Liberação
          </TabsTrigger>
          <TabsTrigger value="retirada" className="rounded-xl font-bold flex items-center gap-2 relative group">
            <ClipboardList className="h-4 w-4" /> 
            <span>Ativos / Retirada</span>
            {activeCheckins && activeCheckins.length > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 px-1.5 py-0 min-w-[1.2rem] h-5 justify-center rounded-full text-[10px] border-2 border-background shadow-lg animate-pulse"
              >
                {activeCheckins.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entrada">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Registration Form */}
            <div className="lg:col-span-1">
              <Card className="border-0 shadow-xl overflow-hidden rounded-[2.5rem] bg-card/50 backdrop-blur-md">
                <div className={cn("h-2 w-full", category === "kids" ? "bg-primary" : "bg-orange-500")} />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-tight">
                    <Monitor className="h-5 w-5 text-primary" /> Identificação
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{category === 'kids' ? 'Nome da Criança' : 'Identificação do Volume'}</Label>
                    <Input 
                      placeholder="Ex: Joãozinho, Bolsa azul etc" 
                      value={childName} 
                      onChange={(e) => setChildName(e.target.value)}
                      className="h-12 rounded-xl focus:ring-2 ring-primary/20 border-border/50 text-base font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Localizar Responsável</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Nome ou telefone..." 
                        value={guardianSearch} 
                        onChange={(e) => setGuardianSearch(e.target.value)}
                        className="h-12 pl-10 rounded-xl focus:ring-2 ring-primary/20 border-border/50 text-base"
                      />
                    </div>
                    {guardians && guardians.length > 0 && !selectedGuardian && (
                      <div className="mt-2 space-y-1 bg-muted/30 p-2 rounded-2xl border border-dashed border-primary/20 max-h-48 overflow-y-auto shadow-inner">
                        {guardians.map((g: any) => (
                          <div 
                            key={g.user_id} 
                            onClick={() => { setSelectedGuardian(g); setGuardianSearch(""); }}
                            className="p-3 hover:bg-card rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                {g.full_name?.charAt(0)}
                              </div>
                              <span className="text-sm font-bold">{g.full_name}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{g.whatsapp_phone}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedGuardian && (
                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center gap-3">
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
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Observações (Geral)</Label>
                    <Input 
                      placeholder="Alguma observação extra?" 
                      value={itemsInfo} 
                      onChange={(e) => setItemsInfo(e.target.value)}
                      className="h-12 rounded-xl focus:ring-2 ring-primary/20 border-border/50 text-sm"
                    />
                  </div>

                  <Button 
                    className={cn("w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]", category === "volume" ? "bg-orange-500 hover:bg-orange-600" : "bg-primary hover:bg-primary/90")} 
                    onClick={() => checkinMutation.mutate()}
                    disabled={!childName || !selectedGuardian || !selectedEventId || checkinMutation.isPending}
                  >
                    {checkinMutation.isPending ? <Loader2 className="animate-spin" /> : (
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-6 w-6" />
                        REALIZAR CHECK-IN
                      </div>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Dashboard / Info Section */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-0 bg-primary/5 rounded-[2.5rem] p-8 border-4 border-dashed border-primary/10">
                <div className="text-center space-y-4">
                  <Monitor className="h-16 w-16 text-primary mx-auto opacity-20" />
                  <h3 className="text-xl font-bold opacity-70">Painel de Segurança Administrador</h3>
                  <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                    Acompanhe em tempo real quem está no culto e gerencie as autorizações de saída com o modo seguro de 6 dígitos.
                  </p>
                </div>
              </Card>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-card p-6 rounded-[2rem] border shadow-sm flex flex-col items-center justify-center text-center">
                    <h4 className="text-3xl font-black text-primary">{activeCheckins?.filter((c: any) => c.category === 'kids').length || 0}</h4>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Crianças Ativas</p>
                 </div>
                 <div className="bg-card p-6 rounded-[2rem] border shadow-sm flex flex-col items-center justify-center text-center">
                    <h4 className="text-3xl font-black text-orange-500">{activeCheckins?.filter((c: any) => c.category === 'volume').length || 0}</h4>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Volumes Ativos</p>
                 </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="retirada">
          <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-black text-2xl flex items-center gap-3 uppercase tracking-tighter">
                <CheckCircle2 className={cn("h-7 w-7", category === "kids" ? "text-emerald-500" : "text-orange-500")} />
                Pendentes de Retirada ({activeCheckins?.length || 0})
              </h3>
            </div>

            {loadingCheckins ? (
              <div className="flex justify-center p-24"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
            ) : !activeCheckins || activeCheckins.length === 0 ? (
              <Card className="border-dashed bg-muted/20 border-4 border-muted rounded-[3rem] h-80 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <Package className="h-16 w-16 text-muted-foreground/20 mx-auto" />
                  <p className="text-muted-foreground font-bold text-xl uppercase tracking-tighter italic opacity-50">Tudo limpo! Nenhum registro ativo.</p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeCheckins.map((item: any) => (
                  <Card key={item.id} className={cn("border-0 shadow-2xl relative overflow-hidden group transition-all hover:translate-y-[-4px] rounded-[2.5rem]", item.call_requested && "ring-4 ring-rose-500 ring-offset-4")}>
                    {item.call_requested && (
                      <div className="absolute top-0 right-0 bg-rose-500 text-white text-[12px] px-4 py-1.5 font-black animate-pulse uppercase tracking-widest z-10 rounded-bl-2xl">Chamado!</div>
                    )}
                    <CardContent className="p-8 space-y-6">
                      <div className="flex justify-between items-start">
                        <div className="min-w-0">
                          <p className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-1">{item.category === 'kids' ? 'CRIANÇA' : 'IDENTIFICAÇÃO'}</p>
                          <h4 className="font-black text-2xl leading-tight uppercase truncate text-slate-800 dark:text-slate-100">{item.child_name}</h4>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-2 font-black uppercase tracking-widest">
                            <ShieldCheck className="h-3 w-3" /> RESP.: {item.profiles?.full_name?.split(' ')[0]}
                          </p>
                        </div>
                        <div className="shrink-0 h-14 w-14 bg-muted rounded-2xl flex items-center justify-center font-black text-xl text-muted-foreground/50 border-2 border-dashed border-muted-foreground/20">
                          {item.id.substring(0,2)}
                        </div>
                      </div>

                      <div className="p-4 bg-muted/30 rounded-2xl space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase">Observações:</p>
                        <p className="text-sm font-medium italic text-slate-600 dark:text-slate-400">
                          {item.items_description || "Nenhuma observação."}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <Button 
                          variant="secondary" 
                          className="h-14 rounded-2xl gap-2 font-black uppercase text-xs tracking-tighter"
                          onClick={() => {
                            setCallingItem(item);
                            setCallMessage(`⚠️ Olá, o responsável por ${item.child_name || "seu item"} favor dirigir-se ao local para retirada da liberação.`);
                          }}
                        >
                          <Phone className="h-4 w-4" />
                          Chamar
                        </Button>
                        <Button 
                          className="h-14 rounded-2xl gap-2 bg-emerald-600 hover:bg-emerald-700 font-black shadow-lg text-white uppercase text-xs tracking-tighter ring-emerald-500/10 ring-4"
                          onClick={() => {
                            setRetrievalItem(item);
                            setRetrievalToken("");
                          }}
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
        </TabsContent>
      </Tabs>


      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner
          onScan={(decoded) => {
            setShowScanner(false);
            handleValidateToken(decoded);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* modal de Chamar Responsável */}
      <Dialog open={!!callingItem} onOpenChange={(val) => { if (!val) setCallingItem(null); }}>
        <DialogContent 
          className="sm:max-w-[500px] rounded-3xl border-0 shadow-2xl"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Phone className="h-5 w-5 text-amber-500" />
              Notificar Responsável
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <p className="text-sm text-muted-foreground">
              Esta ação ativará o modo de chamada na tela e enviará uma mensagem no WhatsApp do responsável (<strong>{callingItem?.profiles?.full_name}</strong>) enviada imediatamente.
            </p>
            <div className="space-y-2">
              <Label>Mensagem Padrão (pode ser ajustada)</Label>
              <Textarea 
                value={callMessage}
                onChange={(e) => setCallMessage(e.target.value)}
                className="h-28 rounded-xl resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCallingItem(null)} className="rounded-xl" disabled={callGuardianMutation.isPending}>
              Cancelar
            </Button>
            <Button 
              className="rounded-xl px-6 bg-amber-500 hover:bg-amber-600 font-bold text-white shadow-md gap-2" 
              onClick={() => callingItem && callGuardianMutation.mutate(callingItem)}
              disabled={callGuardianMutation.isPending || !callMessage.trim()}
            >
              {callGuardianMutation.isPending ? "Processando..." : "Confirmar e Enviar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* modal de Confirmação de Retirada */}
      <Dialog open={!!retrievalItem} onOpenChange={(val) => { if (!val) setRetrievalItem(null); }}>
        <DialogContent 
          className="sm:max-w-[450px] rounded-3xl border-0 shadow-2xl"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              Confirmar Retirada
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-center">
              <p className="text-sm text-muted-foreground uppercase font-bold tracking-wider">Item / Criança</p>
              <p className="text-2xl font-black text-emerald-700">{retrievalItem?.child_name?.toUpperCase()}</p>
              <p className="text-xs text-emerald-600 mt-1">Responsável: {retrievalItem?.profiles?.full_name}</p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Token de Segurança (6 dígitos)</Label>
              <div className="flex gap-2">
                <Input 
                  autoFocus
                  placeholder="123456"
                  maxLength={6}
                  value={retrievalToken}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setRetrievalToken(val);
                    if (val.length === 6) {
                      setTimeout(() => handleValidateToken(val), 100);
                    }
                  }}
                  className="text-center text-3xl font-black h-16 tracking-[0.5em] rounded-xl bg-background border-2 focus-visible:ring-emerald-500 transition-all"
                />
              </div>
              <p className="text-[10px] text-muted-foreground text-center italic">
                Peça ao responsável para mostrar o QR Code ou informar os 6 números no app dele.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRetrievalItem(null)} className="rounded-xl" disabled={checkoutMutation.isPending}>
              Cancelar
            </Button>
            <Button 
              className="rounded-xl px-6 bg-emerald-600 hover:bg-emerald-700 font-bold text-white shadow-md" 
              onClick={() => handleValidateToken(retrievalToken)}
              disabled={checkoutMutation.isPending || retrievalToken.length < 6}
            >
              {checkoutMutation.isPending ? "Validando..." : "Confirmar Retirada"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KidsCheckin;
