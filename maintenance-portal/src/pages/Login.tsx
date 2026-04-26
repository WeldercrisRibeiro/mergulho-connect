import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Lock, User, Loader2, ChevronRight, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getApiBaseUrl } from '../lib/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const finalEmail = email.includes('@') ? email : `${email}@ccmergulho.com`;
      await login(finalEmail, password);
      navigate('/');
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message;
      setError(message || 'Falha na autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#020617] relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-500/20 rounded-full blur-[120px]" />
      
      <div className="w-full max-w-[450px] z-10">
        <div className="text-center mb-10">
          <div className="inline-flex p-5 rounded-[2rem] bg-sky-500 shadow-2xl shadow-sky-500/20 mb-6">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase">
            Mergulho <span className="text-sky-500">Portal</span>
          </h1>
          <p className="text-slate-400 font-medium mt-2">Administração Independente</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/5 p-10 rounded-[2.5rem] shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-2xl flex items-center gap-3">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span className="font-semibold">{error}</span>
              </div>
            )}
            {!error && (
              <div className="p-4 bg-sky-500/10 border border-sky-500/20 text-sky-300 text-sm rounded-2xl">
                Use seu usuário administrador. Se o login não responder, confirme a URL da API em <code>VITE_API_URL</code>.
                <div className="mt-2 text-xs text-sky-200/80 break-all">
                  API ativa: <code>{getApiBaseUrl()}</code>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Acesso</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type="text"
                  required
                  className="block w-full h-14 pl-12 pr-4 bg-slate-950 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-500 transition-all"
                  placeholder="Usuário"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type="password"
                  required
                  className="block w-full h-14 pl-12 pr-4 bg-slate-950 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-500 transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-sky-500 hover:bg-sky-400 disabled:opacity-70 disabled:cursor-not-allowed text-white font-black rounded-2xl shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <>Entrar no Portal <ChevronRight className="h-5 w-5" /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
