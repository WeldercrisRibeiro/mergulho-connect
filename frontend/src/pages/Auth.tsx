import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Moon, Sun, KeyRound, AlertCircle, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/ThemeProvider";
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
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
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
      const cleanUsername = username.trim().toLowerCase();

      // Se já for um e-mail completo, usa ele. Se não, adiciona o domínio padrão.
      const loginEmail = cleanUsername.includes("@") 
        ? cleanUsername 
        : cleanUsername.replace(/\s+/g, ".") + "@mergulhoconnect.com";

      const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });

      if (error) {
        // Se falhou e parece um número, tenta o formato de telefone (para usuários antigos/aprovados via contato)
        const phoneDigits = cleanUsername.replace(/\D/g, "");
        if (phoneDigits.length >= 8) {
          // Tenta com os dígitos exatos (pode ter 55 ou não)
          const phoneEmail = phoneDigits + "@mergulhoconnect.com";
          const { error: phoneError } = await supabase.auth.signInWithPassword({ email: phoneEmail, password });
          
          if (phoneError) {
            // Se falhou, e NÃO começa com 55, tenta adicionar 55 (padrão Brasil)
            if (!phoneDigits.startsWith("55")) {
              const phoneEmail55 = "55" + phoneDigits + "@mergulhoconnect.com";
              const { error: phoneError55 } = await supabase.auth.signInWithPassword({ email: phoneEmail55, password });
              if (phoneError55) throw error; // Lança o erro original
            } else {
              throw error; // Lança o erro original
            }
          }
        } else {
          throw error;
        }
      }

      navigate("/home");
    } catch (error: any) {
      console.error("Login error details:", error);
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
      const loginEmail = cleanUsername.replace(/\s+/g, ".") + "@mergulhoconnect.com";
      const phoneDigits = cleanUsername.replace(/\D/g, "");
      const phoneEmail = phoneDigits + "@mergulhoconnect.com";
      const phoneEmail55 = "55" + phoneDigits + "@mergulhoconnect.com";

      // 1. Tenta verificar a senha atual com o formato de username
      let { error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password.trim()
      });

      // 2. Se falhar, tenta com formato de telefone (exato)
      if (signInError && phoneDigits.length >= 8) {
        const { error: phoneError } = await supabase.auth.signInWithPassword({
          email: phoneEmail,
          password: password.trim()
        });
        signInError = phoneError;

        // 3. Se falhou e não tem 55, tenta com 55
        if (signInError && !phoneDigits.startsWith("55")) {
          const { error: phoneError55 } = await supabase.auth.signInWithPassword({
            email: phoneEmail55,
            password: password.trim()
          });
          signInError = phoneError55;
        }
      }

      if (signInError) {
        throw new Error(signInError.message || "Senha atual incorreta ou usuário não encontrado.");
      }

      // 2. Com o usuário logado, atualiza para a nova senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

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
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-background relative">

      {/* Left Column (Brand/Image) - Hidden on small screens */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary/90 to-primary/60 overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-black/10"></div>
        {/* Usando a logo grandona à esquerda */}
        <div className="z-10 bg-white/10 backdrop-blur-md p-10 rounded-[2rem] shadow-2xl border border-white/20 flex flex-col items-center max-w-lg w-full transform transition-transform hover:scale-105 duration-500 text-white">
          <img
            src="/idvmergulho/logo-white.png"
            alt="Logo CC Mergulho"
            className="w-full h-auto drop-shadow-xl mb-6"
          />
        </div>
      </div>

      {/* Right Column (Form) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-12 bg-background/50 relative">
        {/* Botão voltar à Landing */}
        <Link
          to="/landing"
          className="absolute top-6 left-6 z-30 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <Card className="w-full max-w-md border-0 shadow-none bg-transparent">
          <CardHeader className="text-center pb-8">
            {/* Logo para telas pequenas, já que a esquerda vai sumir */}
            <div className="lg:hidden flex justify-center mb-6 relative">
              <img
                src={theme === "dark" ? "/idvmergulho/logo-horizontal.png" : "/idvmergulho/logo-horizontal-azul.png"}
                alt="Logo"
                className="h-16 w-auto"
              />
              <button
                onClick={toggleTheme}
                className="absolute -right-4 -top-4 p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                title="Alternar Tema"
              >
                {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
              </button>
            </div>

            <div className="hidden lg:block absolute top-[5%] right-[5%] z-20">
              <button
                onClick={toggleTheme}
                className="p-3 rounded-full bg-card/50 backdrop-blur-md shadow-lg border hover:bg-card/80 transition-all transform hover:rotate-12"
                title="Alternar Tema"
              >
                {theme === "light" ? <Moon size={20} className="text-slate-700" /> : <Sun size={20} className="text-yellow-400" />}
              </button>
            </div>

            <CardTitle className="text-3xl font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
              {isRequesting ? (
                <>Solicitar Acesso</>
              ) : isChangingPass ? (
                <> <KeyRound className="h-7 w-7 text-primary" /> Trocar Senha</>
              ) : (
                <>Acesso ao Sistema</>
              )}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {isRequesting ? (
                "Preencha seus dados para receber o acesso."
              ) : isChangingPass ? (
                "Informe sua senha atual e a nova senha que deseja usar."
              ) : (
                "Entre na sua conta para acessar a comunidade."
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isRequesting ? (
              <form onSubmit={handleRequestAccess} className="space-y-5">
                <div className="space-y-2 text-left">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input 
                    id="name" 
                    className="h-12 bg-white/50 dark:bg-black/20 border-white/30 dark:border-white/10 rounded-xl focus:ring-primary/50 text-base font-medium" 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)} 
                    placeholder="Seu nome completo" 
                    required 
                  />
                </div>
                <div className="space-y-2 text-left">
                  <Label htmlFor="reqPhone">WhatsApp com DDD</Label>
                  <Input 
                    id="reqPhone" 
                    type="tel" 
                    className="h-12 bg-white/50 dark:bg-black/20 border-white/30 dark:border-white/10 rounded-xl focus:ring-primary/50 text-base font-medium" 
                    value={reqPhone} 
                    onChange={(e) => setReqPhone(e.target.value)} 
                    placeholder="Seu melhor contato" 
                    required 
                  />
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
            ) : isChangingPass ? (
              <form onSubmit={handleChangePassword} className="space-y-5">
                <div className="space-y-2 text-left">
                  <Label htmlFor="ch-username">Seu Nome de Usuário</Label>
                  <Input 
                    id="ch-username" 
                    className="h-12 bg-white/50 dark:bg-black/20 border-white/30 dark:border-white/10 rounded-xl focus:ring-primary/50 text-base font-medium" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    placeholder="usuário ou telefone" 
                    required 
                  />
                </div>
                <div className="space-y-2 text-left">
                  <Label htmlFor="ch-oldpass">Senha Atual</Label>
                  <div className="relative">
                    <Input
                      id="ch-oldpass"
                      type={showPassword ? "text" : "password"}
                      className="h-12 bg-white/50 dark:bg-black/20 border-white/30 dark:border-white/10 rounded-xl focus:ring-primary/50 text-base font-medium pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Sua senha atual"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors p-1 rounded-md"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2 text-left">
                  <Label htmlFor="ch-newpass">Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="ch-newpass"
                      type={showPassword ? "text" : "password"}
                      className="h-12 bg-white/50 dark:bg-black/20 border-white/30 dark:border-white/10 rounded-xl focus:ring-primary/50 text-base font-medium pr-10"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors p-1 rounded-md"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl shadow-md hover:shadow-lg transition-all text-base mt-4" disabled={loading}>
                  {loading ? "Processando..." : "Alterar Senha"}
                </Button>
                <div className="mt-8 text-center text-sm">
                  <button type="button" onClick={() => setIsChangingPass(false)} className="text-muted-foreground hover:text-primary transition-colors font-medium border-b border-transparent hover:border-primary pb-0.5">
                    Voltar para o Login
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
                    className="h-12 bg-white/50 dark:bg-black/20 border-white/30 dark:border-white/10 rounded-xl focus:ring-primary/50 text-base font-medium"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Seu usuário definido pelo ADM"
                    required
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-2 text-left">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Senha</Label>
                    <button
                      type="button"
                      onClick={() => setIsChangingPass(true)}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Trocar Senha?
                    </button>
                  </div>
                  <div className="relative group/password">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 bg-white/50 dark:bg-black/20 border-white/30 dark:border-white/10 rounded-xl focus:ring-primary/50 text-base font-medium pr-10"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors p-1 rounded-md"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
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
