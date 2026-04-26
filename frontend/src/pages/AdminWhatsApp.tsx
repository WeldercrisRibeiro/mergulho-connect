import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Phone, QrCode, PowerOff, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

type ConnectionStatus = "disconnected" | "connecting" | "qrcode" | "connected";

interface WzStatusEvent {
  type: "status";
  status: ConnectionStatus;
  qrCode?: string | null;
}

const AdminWhatsApp = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  if (!isAdmin) return <Navigate to="/home" replace />;

  // Conecta ao SSE para receber status em tempo real
  useEffect(() => {
    const ssePath = `${api.defaults.baseURL}/whatsapp/sse`;
    console.log(`[WA] Conectando ao fluxo de eventos em: ${ssePath}`);
    
    const es = new EventSource(ssePath);
    eventSourceRef.current = es;
    
    es.onopen = () => {
      console.log("[WA] Conexão SSE estabelecida.");
    };

    es.onmessage = (e) => {
      try {
        const data: WzStatusEvent = JSON.parse(e.data);
        console.log("[WA] Evento recebido:", data.type, data.status);
        
        setStatus(data.status);
        setQrCode(data.qrCode ?? null);
      } catch (err) {
        console.error("[WA] Erro ao processar mensagem SSE:", err);
      }
    };

    es.onerror = (err) => {
      console.warn("[WA] Erro na conexão SSE. Tentando reconectar...", err);
      // SSE vai tentar reconectar automaticamente
    };

    return () => {
      console.log("[WA] Fechando conexão SSE.");
      es.close();
    };
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    try {
      await api.post("/whatsapp/connect");
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || "Falha ao iniciar conexão.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await api.delete("/whatsapp/disconnect");
      toast({ title: "Desconectado", description: "O WhatsApp foi desconectado com sucesso." });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || "Falha ao desconectar.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-primary/10 rounded-xl text-primary neo-shadow-sm">
          <Phone className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Conexão WhatsApp</h1>
          <p className="text-sm text-muted-foreground">Gerencie a conexão da API Baileys para o bot de mensagens.</p>
        </div>
      </div>

      <Card className="neo-shadow-sm border-0 border-t-4 border-t-primary overflow-hidden bg-card/60 backdrop-blur-sm">
        <CardHeader className="bg-muted/30 border-b border-sidebar-border pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Status do Serviço</CardTitle>
            {status === "connected" && (
              <span className="flex items-center gap-1.5 text-sm py-1 px-3 rounded-full bg-emerald-500/10 text-emerald-500 font-medium border border-emerald-500/20">
                <CheckCircle2 className="h-4 w-4" /> Conectado
              </span>
            )}
            {status === "disconnected" && (
              <span className="flex items-center gap-1.5 text-sm py-1 px-3 rounded-full bg-rose-500/10 text-rose-500 font-medium border border-rose-500/20">
                <AlertCircle className="h-4 w-4" /> Desconectado
              </span>
            )}
            {(status === "connecting" || status === "qrcode") && (
              <span className="flex items-center gap-1.5 text-sm py-1 px-3 rounded-full bg-amber-500/10 text-amber-500 font-medium border border-amber-500/20">
                <RefreshCw className="h-4 w-4 animate-spin" /> Aguardando...
              </span>
            )}
          </div>
          <CardDescription className="mt-2">
            {status === "connected"
              ? "Sua instância do WhatsApp está conectada e pronta para enviar mensagens."
              : "Conecte seu WhatsApp lendo o QR Code pelo aplicativo para liberar os recursos."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center space-y-6 py-8">

            {status === "disconnected" && (
              <div className="flex flex-col items-center text-center max-w-sm space-y-5 animate-scale-in">
                <div className="h-28 w-28 rounded-full bg-muted/60 flex items-center justify-center neo-shadow-sm border border-border">
                  <Phone className="h-12 w-12 text-muted-foreground/60" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-xl text-foreground">Nenhum Aparelho Vinculado</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Você precisa conectar seu smartphone capturando o QR Code para ativar o envio unificado de Disparos.
                  </p>
                </div>
                <Button
                  onClick={handleConnect}
                  size="lg"
                  disabled={loading}
                  className="w-full sm:w-auto font-semibold gap-2 mt-4 text-white hover:scale-105 transition-transform neo-shadow-sm"
                >
                  {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <QrCode className="h-5 w-5" />}
                  Gerar QR Code de Acesso
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={loading}
                  className="text-muted-foreground hover:text-destructive text-xs gap-1.5"
                >
                  <PowerOff className="h-3 w-3" /> Forçar Limpeza de Sessão
                </Button>
              </div>
            )}

            {status === "connecting" && (
              <div className="flex flex-col items-center space-y-4 animate-fade-in py-8">
                <div className="relative h-16 w-16">
                  <RefreshCw className="h-16 w-16 text-primary animate-spin" />
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                </div>
                <p className="text-muted-foreground font-medium animate-pulse mt-2">Comunicando com o servidor Baileys...</p>
              </div>
            )}

            {status === "qrcode" && (
              <div className="flex flex-col items-center text-center space-y-6 max-w-sm animate-scale-in">
                <div className="bg-amber-500/10 text-amber-600 px-4 py-2.5 rounded-lg text-sm font-medium border border-amber-500/20">
                  Abra o WhatsApp, vá em <strong className="font-bold">Aparelhos Conectados</strong> e aponte a câmera para o quadro abaixo.
                </div>

                <div className="p-5 bg-white rounded-2xl shadow-xl shadow-black/5 border border-slate-200">
                  {qrCode ? (
                    <img src={qrCode} alt="QR Code WhatsApp" className="w-64 h-64 rounded-xl" />
                  ) : (
                    <div className="w-64 h-64 bg-slate-50 rounded-xl flex items-center justify-center">
                      <RefreshCw className="h-12 w-12 text-slate-300 animate-spin" />
                    </div>
                  )}
                  <p className="text-center text-[10px] uppercase tracking-widest text-slate-400 font-semibold mt-2">Baileys API</p>
                </div>

                <Button
                  variant="outline"
                  onClick={handleDisconnect}
                  disabled={loading}
                  className="gap-2 w-full max-w-[200px]"
                >
                  Cancelar Requisição
                </Button>
              </div>
            )}

            {status === "connected" && (
              <div className="flex flex-col items-center text-center space-y-6 animate-scale-in py-4">
                <div className="relative">
                  <div className="h-28 w-28 rounded-full bg-emerald-500/10 flex items-center justify-center border-4 border-emerald-500/20 neo-shadow-sm">
                    <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                  </div>
                  <div className="absolute top-0 bottom-0 left-0 right-0 animate-ping rounded-full bg-emerald-500/20 opacity-50" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-semibold text-xl">WhatsApp Operacional</h3>
                  <p className="text-sm text-muted-foreground">O servidor está autenticado e rodando em segundo plano perfeitamente.</p>
                </div>

                <div className="pt-4">
                  <Button
                    variant="destructive"
                    onClick={handleDisconnect}
                    disabled={loading}
                    className="gap-2 neo-shadow-sm font-semibold hover:bg-destructive/90"
                  >
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <PowerOff className="h-4 w-4" />}
                    Encerrar Sessão do WhatsApp
                  </Button>
                </div>
              </div>
            )}

          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminWhatsApp;
