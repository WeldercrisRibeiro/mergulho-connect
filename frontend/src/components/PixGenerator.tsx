import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check, QrCode, Wallet, MapPin, User, FileText, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";


export const PixGenerator = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [brCode, setBrCode] = useState("");
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    pixKey: "",
    amount: "",
    name: "Igreja Mergulho",
    city: "SAO PAULO",
    description: "Contribuição",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pixKey || !formData.amount) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.get("/pix/gerar", {
        params: {
          ...formData,
          amount: Number(formData.amount),
        },
      });
      setBrCode(data.brCode);
      toast({ title: "Sucesso", description: "Payload Pix gerado com sucesso! ✅" });
    } catch (err: any) {
      toast({
        title: "Erro ao gerar Pix",
        description: err.response?.data?.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setLoading(true); // Simulate a bit of loading for effect
      setTimeout(() => setLoading(false), 800);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(brCode);
    setCopied(true);
    toast({ title: "Copiado!", description: "Chave Copia e Cola copiada para a área de transferência." });
    setTimeout(() => setCopied(false), 2000);
  };

  const resetForm = () => {
    setBrCode("");
    setFormData({
      pixKey: "",
      amount: "",
      name: "",
      description: "",
    });
  };

  const { data: siteSettings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data } = await api.get('/site-settings');
      const settings: Record<string, string> = {};
      (data || []).forEach((s: any) => { settings[s.id] = s.value; });
      return settings;
    },
  });

  useEffect(() => {
    if (siteSettings) {
      setFormData(prev => ({
        ...prev,
        pixKey: siteSettings.pix_key || prev.pixKey,
        name: siteSettings.merchant_name || prev.name,
        city: siteSettings.merchant_city || prev.city,
      }));
    }
  }, [siteSettings]);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
          Gerador de QR Code Pix
        </h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Gere cobranças estáticas rápidas e seguras com um design moderno e minimalista.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full items-start">
        {/* Formulário */}
        <Card className="border-0 bg-white/5 dark:bg-black/20 backdrop-blur-xl ring-1 ring-white/10 shadow-2xl rounded-[2rem] overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <div className="p-2 bg-emerald-500/10 rounded-xl">
                <Wallet className="h-5 w-5 text-emerald-500" />
              </div>
              Dados do Recebedor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider opacity-60 ml-1">Chave Pix</Label>
                <div className="relative">
                  <QrCode className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    name="pixKey"
                    placeholder="E-mail, CPF, Telefone ou Chave"
                    value={formData.pixKey}
                    onChange={handleInputChange}
                    className="pl-10 h-11 bg-muted/30 border-transparent focus-visible:ring-emerald-500 rounded-xl transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider opacity-60 ml-1">Valor(R$)</Label>
                  <Input
                    name="amount"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.amount}
                    onChange={handleInputChange}
                    className="h-11 bg-muted/30 border-transparent focus-visible:ring-emerald-500 rounded-xl"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 mt-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>Gerar QR Code <QrCode className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Resultado */}
        <div className="flex flex-col gap-6">
          <Card className={cn(
            "border-0 bg-white/5 dark:bg-black/20 backdrop-blur-xl ring-1 ring-white/10 shadow-2xl rounded-[2rem] h-full flex flex-col justify-center transition-all duration-500",
            brCode ? "opacity-100 scale-100" : "opacity-40 scale-95 pointer-events-none grayscale"
          )}>
            <CardContent className="pt-6 flex flex-col items-center space-y-6">
              <div className="relative p-4 bg-white rounded-[2rem] shadow-2xl">
                {brCode ? (
                  <QRCodeSVG value={brCode} size={220} level="H" includeMargin />
                ) : (
                  <div className="w-[220px] h-[220px] flex items-center justify-center bg-muted/10 rounded-[1.5rem]">
                    <QrCode className="h-12 w-12 text-muted-foreground opacity-20" />
                  </div>
                )}
              </div>

              {brCode && (
                <div className="w-full space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider opacity-60 ml-1">Código Pix Copia e Cola</Label>
                    <div className="relative group">
                      <Input
                        readOnly
                        value={brCode}
                        className="pr-12 bg-muted/30 border-transparent rounded-xl font-mono text-xs overflow-hidden text-ellipsis h-11"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={copyToClipboard}
                        className="absolute right-1 top-1 h-9 w-9 rounded-lg hover:bg-emerald-500/20 text-emerald-500"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={resetForm}
                    className="w-full h-11 rounded-xl border-dashed border-2 hover:bg-emerald-500/5 hover:text-emerald-500 hover:border-emerald-500/50 transition-all"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" /> Gerar Novo
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-3xl text-amber-600 dark:text-amber-400 text-xs leading-relaxed flex gap-3">
             <div className="shrink-0 pt-0.5">💡</div>
             <p>Este é um <strong>Pix Estático</strong>. Ele não tem data de validade e pode ser pago múltiplas vezes. Ideal para doações ou pagamentos simples sem integração bancária direta.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
