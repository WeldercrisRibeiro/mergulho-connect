import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Moon, Sun, KeyRound, AlertCircle, ArrowLeft, Eye, EyeOff, Users, ArrowRight } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/errorMessages";
import { maskPhone } from "@/lib/phoneUtils";
import { cn } from "@/lib/utils";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [reqPhone, setReqPhone] = useState("");
  const [isRequesting, setIsRequesting] = useState(searchParams.get("request") === "true");
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, signIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  useEffect(() => {
    if (user) navigate("/home");
  }, [user, navigate]);

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/contact-messages", {
        name: fullName,
        phone: reqPhone,
        subject: "Quero me tornar Membro",
        message: "Solicitação gerada automaticamente pela tela de Acesso",
      });
      toast({ title: "Solicitação enviada!", description: "Aguarde o contato dos administradores." });
      setFullName("");
      setReqPhone("");
      setIsRequesting(false);
    } catch (err: any) {
      toast({ title: "Erro", description: getErrorMessage(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cleanUsername = username.trim().toLowerCase();

      // Se já for um e-mail completo, usa ele. Se não, adiciona o domínio padrão.
      const loginEmail = cleanUsername.includes("@")
        ? cleanUsername
        : cleanUsername.replace(/\s+/g, ".") + "@ccmergulho.com";

      try {
        await signIn(loginEmail, password);
      } catch (error) {
        // Se falhou e parece um número, tenta o formato de telefone
        const phoneDigits = cleanUsername.replace(/\D/g, "");
        if (phoneDigits.length >= 8) {
          const phoneEmail = phoneDigits + "@ccmergulho.com";
          try {
            await signIn(phoneEmail, password);
          } catch (phoneError) {
            // Se falhou, e NÃO começa com 55, tenta adicionar 55 (padrão Brasil)
            if (!phoneDigits.startsWith("55")) {
              const phoneEmail55 = "55" + phoneDigits + "@ccmergulho.com";
              await signIn(phoneEmail55, password);
            } else {
              throw phoneError; // Lança o erro original
            }
          }
        } else {
          throw error;
        }
      }

      navigate("/home");
    } catch (error: any) {
      toast({
        title: "Erro de Acesso",
        description: error.message || "Usuário ou senha incorretos. Verifique se digitou o usuário (ex: welder) ou seu telefone corretamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cleanUsername = username.trim().toLowerCase();
      const loginEmail = cleanUsername.includes("@")
        ? cleanUsername
        : cleanUsername.replace(/\s+/g, ".") + "@ccmergulho.com";
      const phoneDigits = cleanUsername.replace(/\D/g, "");
      const phoneEmail = phoneDigits + "@ccmergulho.com";
      const phoneEmail55 = "55" + phoneDigits + "@ccmergulho.com";
      const candidates = [loginEmail];
      if (phoneDigits.length >= 8) {
        candidates.push(phoneEmail);
        if (!phoneDigits.startsWith("55")) {
          candidates.push(phoneEmail55);
        }
      }

      let lastError: unknown = null;
      let updated = false;
      for (const email of candidates) {
        try {
          await api.patch("/auth/password/by-credentials", {
            email,
            currentPassword: password.trim(),
            newPassword: newPassword.trim(),
          });
          updated = true;
          break;
        } catch (candidateError) {
          lastError = candidateError;
        }
      }

      if (!updated) {
        throw lastError;
      }

      toast({
        title: "Sucesso!",
        description: "Sua senha foi alterada. Você já pode acessar o sistema."
      });

      // Volta para o login
      setIsChangingPass(false);
      setPassword("");
      setNewPassword("");
    } catch (error: any) {
      toast({
        title: "Erro ao trocar senha",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn(
      "min-h-dvh flex w-full relative overflow-x-hidden transition-colors duration-500",
      theme === 'light' ? "bg-[#f8faff]" : "bg-[#0a0c10]"
    )}>
      {/* Dynamic Animated Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-cyan-400/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {/* Left Column (Brand/Image) - Hidden on small screens */}
      <div className="hidden lg:flex lg:w-1/2 h-screen sticky top-0 relative overflow-hidden items-center justify-center p-12 bg-gradient-to-br from-[#0052cc] via-[#0747a6] to-[#002152] shadow-[inset_-20px_0_50px_rgba(0,0,0,0.2)]">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.4) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        
        {/* Decorative glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-blue-400/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] bg-blue-300/5 rounded-full blur-[120px]" />
        
        <div className="
  group
  z-10 glass-morphism
  p-6 lg:p-10
  rounded-[3rem]
  flex items-center justify-center
  w-full max-w-lg
  h-full
">
  <img
  src="/idvmergulho/logo-white.png"
  className="
    max-h-[70vh]
    w-auto
    object-contain
    drop-shadow-[0_30px_80px_rgba(0,0,0,0.7)]
    transition-all duration-500
    group-hover:scale-105
  "
/>
</div>
      </div>

      {/* Right Column (Form) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-8 lg:py-10 min-h-dvh overflow-y-auto relative">
        {/* Botão voltar à Landing */}
        <Link
          to="/landing"
          className="absolute top-8 left-8 z-30 inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-all group"
        >
          <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
          <span>Voltar</span>
        </Link>
        
        <div className="hidden lg:block absolute top-8 right-8 z-20">
          <button
            onClick={toggleTheme}
            className="p-3 rounded-2xl bg-card/40 backdrop-blur-md border border-white/10 shadow-xl hover:bg-card/60 transition-all transform hover:rotate-12 active:scale-95"
            title="Alternar Tema"
          >
            {theme === "light" ? <Moon size={20} className="text-slate-700" /> : <Sun size={20} className="text-yellow-400" />}
          </button>
        </div>

        <Card className="w-full max-w-md border-0 shadow-xl bg-card/40 backdrop-blur-xl rounded-2xl p-2 animate-fade-in-up border border-white/10">
          <CardHeader className="text-center pb-4 pt-4">
            {/* Logo para telas pequenas */}
            <div className="lg:hidden flex justify-center mb-6 relative">
              <img
                src={theme === "dark" ? "/idvmergulho/logo-white.png" : "/idvmergulho/logo.png"}
                alt="Logo"
                className="h-12 w-auto drop-shadow-sm"
              />
              <button
                onClick={toggleTheme}
                className="absolute -right-1 -top-1 p-2 rounded-full bg-card/80 border border-white/10 shadow-md"
                title="Alternar Tema"
              >
                {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
              </button>
            </div>

            <CardTitle className="text-2xl md:text-3xl font-bold text-foreground">
              {isRequesting ? (
                "Criar Cadastro"
              ) : isChangingPass ? (
                "Trocar Senha"
              ) : (
                "Bem Vindo  !"
              )}
            </CardTitle>
            <CardDescription className="text-sm font-medium mt-1 opacity-80">
              {isRequesting ? (
                "Preencha para receber o acesso."
              ) : isChangingPass ? (
                "Informe sua senha atual e a nova."
              ) : (
                "Entre para acessar a comunidade."
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">
            {isRequesting ? (
              <form onSubmit={handleRequestAccess} className="space-y-4">
                <div className="space-y-1 text-left">
                  <Label htmlFor="name" className="text-xs font-medium ml-1 opacity-70">Nome completo</Label>
                  <Input
                    id="name"
                    className="h-11 bg-white/5 border-white/10 rounded-xl focus:ring-primary/50 text-base font-medium px-4"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu nome completo"
                    required
                  />
                </div>
                <div className="space-y-1 text-left">
                  <Label htmlFor="reqPhone" className="text-xs font-medium ml-1 opacity-70">WhatsApp com DDD</Label>
                  <Input
                    id="reqPhone"
                    type="tel"
                    className="h-11 bg-white/5 border-white/10 rounded-xl focus:ring-primary/50 text-base font-medium px-4"
                    value={reqPhone}
                    onChange={(e) => setReqPhone(maskPhone(e.target.value))}
                    placeholder="(85) 99266-4889"
                    maxLength={15}
                    required
                  />
                </div>
                <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg transition-all text-sm font-bold mt-2" disabled={loading}>
                  {loading ? "Enviando..." : "Enviar Solicitação"}
                </Button>
                <div className="text-center text-xs">
                  <button type="button" onClick={() => setIsRequesting(false)} className="text-muted-foreground hover:text-primary transition-colors font-medium hover:underline">
                    Já tem acesso? Faça Login
                  </button>
                </div>
              </form>
            ) : isChangingPass ? (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-1 text-left">
                  <Label htmlFor="ch-username" className="text-xs font-medium ml-1 opacity-70">Nome de Usuário</Label>
                  <Input
                    id="ch-username"
                    className="h-11 bg-white/5 border-white/10 rounded-xl focus:ring-primary/50 text-base font-medium px-4"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="usuário"
                    required
                  />
                </div>
                <div className="space-y-1 text-left">
                  <Label htmlFor="ch-oldpass" className="text-xs font-medium ml-1 opacity-70">Senha Atual</Label>
                  <Input
                    id="ch-oldpass"
                    type={showPassword ? "text" : "password"}
                    className="h-11 bg-white/5 border-white/10 rounded-xl focus:ring-primary/50 text-base font-medium px-4 pr-12"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha atual"
                    eyeButton={true}
                    onEyeClick={() => setShowPassword(!showPassword)}
                    required
                  />
                </div>
                <div className="space-y-1 text-left">
                  <Label htmlFor="ch-newpass" className="text-xs font-medium ml-1 opacity-70">Nova Senha</Label>
                  <Input
                    id="ch-newpass"
                    type={showPassword ? "text" : "password"}
                    className="h-11 bg-white/5 border-white/10 rounded-xl focus:ring-primary/50 text-base font-medium px-4 pr-12"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    eyeButton={true}
                    onEyeClick={() => setShowPassword(!showPassword)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
                <Button type="submit" className="w-full h-11 bg-primary text-white rounded-xl shadow-lg transition-all text-sm font-bold mt-2" disabled={loading}>
                  {loading ? "Processando..." : "Alterar Senha"}
                </Button>
                <div className="text-center text-xs">
                  <button type="button" onClick={() => setIsChangingPass(false)} className="text-muted-foreground hover:text-primary transition-colors font-medium hover:underline">
                    Voltar para o Login
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1 text-left">
                  <Label htmlFor="username" className="text-xs font-medium ml-1 opacity-70">Nome de Usuário</Label>
                  <Input
                    id="username"
                    type="text"
                    className="h-11 bg-white/5 border-white/10 rounded-xl focus:ring-primary/50 text-base font-medium px-4"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Seu usuário"
                    required
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-1 text-left">
                  <div className="flex items-center justify-between ml-1">
                    <Label htmlFor="password" className="text-xs font-medium opacity-70">Senha</Label>
                    <button
                      type="button"
                      onClick={() => setIsChangingPass(true)}
                      className="text-xs text-primary hover:underline font-bold"
                    >
                      Esqueceu?
                    </button>
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 bg-white/5 border-white/10 rounded-xl focus:ring-primary/50 text-base font-medium px-4 pr-12"
                    eyeButton={true}
                    onEyeClick={() => setShowPassword(!showPassword)}
                    required
                    minLength={6}
                    autoComplete="current-password"
                  />
                </div>
                <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg transition-all text-base font-bold mt-2" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar"}
                </Button>

                <div className="pt-4 text-center">
                  <button type="button" onClick={() => setIsRequesting(true)} className="group flex items-center justify-between p-3 w-full rounded-xl bg-muted/30 border border-white/5 hover:bg-muted/50 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                        <Users size={16} />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-foreground">Não tem acesso?</p>
                        <p className="text-[10px] text-muted-foreground font-medium">Solicite Cadastro</p>
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </form>
            )}
          </CardContent>
          <div className="text-center pb-4 opacity-30">
            <p className="text-[10px] font-medium">CC Mergulho - {new Date().getFullYear()}</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
