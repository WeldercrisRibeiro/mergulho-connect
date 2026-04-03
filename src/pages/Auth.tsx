import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [reqPhone, setReqPhone] = useState("");
  const [isRequesting, setIsRequesting] = useState(searchParams.get("request") === "true");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) navigate("/home");
  }, [user, navigate]);

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await supabase.from("contact_messages" as any).insert([
        {
          name: fullName,
          phone: reqPhone,
          subject: "Quero me tornar Membro",
          message: "Solicitação gerada automaticamente pela tela de Acesso",
        }
      ] as any);
      toast({ title: "Solicitação enviada!", description: "Aguarde o contato dos administradores." });
      setFullName("");
      setReqPhone("");
      setIsRequesting(false);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Username vira proxy email: username@mergulhoconnect.com
      const loginEmail = username.trim().toLowerCase().replace(/\s+/g, ".") + "@mergulhoconnect.com";

      const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
      if (error) throw error;
      navigate("/home");
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-background">

      {/* Left Column (Brand/Image) - Hidden on small screens */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary/90 to-primary/60 overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-black/10"></div>
        {/* Usando a logo grandona à esquerda */}
        <div className="z-10 bg-white/10 backdrop-blur-md p-10 rounded-[2rem] shadow-2xl border border-white/20 flex flex-col items-center max-w-lg w-full transform transition-transform hover:scale-105 duration-500">
          <img
            src="/idvmergulho/logo horizontal.png"
            alt="Logo CC Mergulho"
            className="w-full h-auto drop-shadow-xl mb-6 mix-blend-multiply"
          />
          <p className="text-white text-center text-lg md:text-xl font-medium leading-relaxed drop-shadow-md">
            AMAR | CUIDAR | SERVIR
          </p>
        </div>
      </div>

      {/* Right Column (Form) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-12 bg-background/50">
        <Card className="w-full max-w-md border-0 shadow-none bg-transparent">
          <CardHeader className="text-center pb-8">
            {/* Logo para telas pequenas, já que a esquerda vai sumir */}
            <div className="lg:hidden flex justify-center mb-6">
              <img src="/idvmergulho/logo horizontal azul.png" alt="Logo" className="h-16 w-auto" />
            </div>

            <CardTitle className="text-3xl font-bold tracking-tight text-foreground">
              {isRequesting ? "Solicitar Acesso" : "Acesso ao Sistema"}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {isRequesting ? "Preencha seus dados para receber o acesso." : "Entre na sua conta para acessar a comunidade."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isRequesting ? (
              <form onSubmit={handleRequestAccess} className="space-y-5">
                <div className="space-y-2 text-left">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input id="name" className="bg-card h-12" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome completo" required />
                </div>
                <div className="space-y-2 text-left">
                  <Label htmlFor="reqPhone">WhatsApp com DDD</Label>
                  <Input id="reqPhone" type="tel" className="bg-card h-12" value={reqPhone} onChange={(e) => setReqPhone(e.target.value)} placeholder="Seu melhor contato" required />
                </div>
                <Button type="submit" className="w-full h-12 bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white rounded-xl shadow-md hover:shadow-lg transition-all text-base mt-4" disabled={loading}>
                  {loading ? "Enviando..." : "Enviar Solicitação"}
                </Button>
                <div className="mt-8 text-center text-sm">
                  <button type="button" onClick={() => setIsRequesting(false)} className="text-muted-foreground hover:text-primary transition-colors font-medium border-b border-transparent hover:border-primary pb-0.5">
                    Já tem acesso? Volte para o Login
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2 text-left">
                  <Label htmlFor="username">Nome de Usuário</Label>
                  <Input
                    id="username"
                    type="text"
                    className="bg-card h-12"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Seu usuário definido pelo ADM"
                    required
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-2 text-left">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    className="bg-card h-12"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full h-12 bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white rounded-xl shadow-md hover:shadow-lg transition-all text-base mt-4" disabled={loading}>
                  {loading ? "Aguarde..." : "Entrar na Comunidade"}
                </Button>
                <div className="mt-8 text-center text-sm">
                  <button type="button" onClick={() => setIsRequesting(true)} className="text-muted-foreground hover:text-primary transition-colors font-medium border-b border-transparent hover:border-primary pb-0.5">
                    Não tem acesso? Solicite aos Administradores
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
