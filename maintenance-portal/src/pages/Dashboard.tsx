import { useState, useEffect, useRef } from "react";
import { 
  Terminal, 
  Search, 
  Play, 
  Loader2, 
  ShieldCheck,
  UserPlus,
  KeyRound,
  UserCog,
  Settings2,
  Download,
  Upload,
  AlertTriangle,
  X,
  LogOut
} from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

interface ScriptField {
  name: string;
  label: string;
  type: "text" | "password" | "email" | "select" | "user_select" | "file";
  required: boolean;
  options?: string[];
}

interface AdminScript {
  id: string;
  name: string;
  description: string;
  fields: ScriptField[];
}

interface UserSummary {
  id: string;
  email: string;
  profile: {
    fullName: string;
    username: string;
  };
}

const Dashboard = () => {
  const [scripts, setScripts] = useState<AdminScript[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [selectedScript, setSelectedScript] = useState<AdminScript | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [output, setOutput] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [statusType, setStatusType] = useState<"success" | "error" | "info">("info");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const { logout, user: currentUser } = useAuth();
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchScripts();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  const fetchScripts = async () => {
    try {
      const response = await api.get("/maintenance/scripts");
      setScripts(response.data);
      setStatusMessage("Ferramentas carregadas com sucesso.");
      setStatusType("success");
    } catch (error) {
      setStatusMessage("Erro ao carregar scripts. Verifique a conexão com o backend.");
      setStatusType("error");
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get("/maintenance/users");
      setUsers(response.data);
    } catch (error) {
      setStatusMessage("Não foi possível carregar a lista de usuários.");
      setStatusType("error");
    }
  };

  const handleScriptSelect = (script: AdminScript) => {
    setSelectedScript(script);
    setFormData({});
    setOutput([]);
  };

  const handleInputChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (fieldName: string, file: File) => {
    setUploading(fieldName);
    const fd = new FormData();
    fd.append("file", file);
    
    try {
      addLog(`Enviando arquivo: ${file.name}...`);
      const response = await api.post("/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      handleInputChange(fieldName, response.data.url);
      addLog(`Arquivo enviado com sucesso: ${response.data.url}`);
    } catch (error) {
      addLog(`Erro no upload: ${file.name}`);
    } finally {
      setUploading(null);
    }
  };

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setOutput(prev => [...prev, `[${time}] ${msg}`]);
  };

  const executeScript = async () => {
    if (!selectedScript) return;
    setConfirmOpen(false);
    setLoading(true);
    addLog(`Iniciando execução de: ${selectedScript.name}...`);

    try {
      const response = await api.post(`/maintenance/run/${selectedScript.id}`, formData);
      addLog(`SUCESSO: ${response.data.message || "Script concluído"}`);
      if (selectedScript.id === 'create-user') setFormData({});
      setStatusMessage("Operação concluída com sucesso.");
      setStatusType("success");
    } catch (error: any) {
      const errMsg = error.response?.data?.message || "Erro desconhecido";
      addLog(`ERRO: ${errMsg}`);
      setStatusMessage(`Falha na execução: ${errMsg}`);
      setStatusType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleExportLogs = async () => {
    try {
      const response = await api.get("/maintenance/logs/export", { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'maintenance_audit_log.txt');
      document.body.appendChild(link);
      link.click();
      link.remove();
      setStatusMessage("Auditoria exportada com sucesso.");
      setStatusType("success");
    } catch (error) {
      setStatusMessage("Erro ao exportar logs.");
      setStatusType("error");
    }
  };

  const filteredScripts = scripts.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getScriptIcon = (id: string) => {
    switch (id) {
      case 'create-user': return <UserPlus className="h-5 w-5" />;
      case 'change-password': return <KeyRound className="h-5 w-5" />;
      case 'update-profile': return <UserCog className="h-5 w-5" />;
      case 'update-role': return <ShieldCheck className="h-5 w-5" />;
      default: return <Terminal className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-primary/20 p-2 rounded-xl">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white uppercase">Maintenance Center</h1>
              <p className="text-xs text-slate-500 font-bold tracking-widest uppercase">Portal Administrativo</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold text-white">{currentUser?.profile?.fullName || 'Admin'}</p>
              <p className="text-xs text-slate-500">{currentUser?.email}</p>
            </div>
            <button 
              onClick={logout}
              className="p-3 rounded-xl bg-slate-800 hover:bg-red-500/10 hover:text-red-500 transition-all border border-slate-700"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-primary transition-colors" />
            <input 
              type="text"
              placeholder="Buscar ferramenta..." 
              className="w-full h-14 pl-12 pr-4 bg-slate-900 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-2 custom-scrollbar">
            {filteredScripts.map((script) => (
              <button
                key={script.id}
                onClick={() => handleScriptSelect(script)}
                className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 group ${
                  selectedScript?.id === script.id
                    ? "bg-primary border-primary shadow-2xl shadow-primary/30 scale-[1.02]"
                    : "bg-slate-900 hover:bg-slate-800 border-slate-800 hover:border-slate-600"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${
                    selectedScript?.id === script.id ? "bg-white/20" : "bg-primary/10 text-primary"
                  }`}>
                    {getScriptIcon(script.id)}
                  </div>
                  <div>
                    <h3 className={`font-bold ${selectedScript?.id === script.id ? "text-white" : "text-slate-200"}`}>
                      {script.name}
                    </h3>
                    <p className={`text-xs mt-1 line-clamp-1 ${
                      selectedScript?.id === script.id ? "text-white/70" : "text-slate-500"
                    }`}>
                      {script.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <button 
            onClick={handleExportLogs}
            className="w-full flex items-center justify-center gap-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl hover:bg-slate-800 transition-all text-sm font-bold text-slate-400 hover:text-white group"
          >
            <Download className="h-5 w-5 group-hover:animate-bounce" />
            Exportar Auditoria (TXT)
          </button>
        </aside>

        {/* Content */}
        <section className="lg:col-span-8 space-y-8">
          {statusMessage && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                statusType === "error"
                  ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
                  : statusType === "success"
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                    : "border-sky-500/40 bg-sky-500/10 text-sky-300"
              }`}
            >
              {statusMessage}
            </div>
          )}
          {selectedScript ? (
            <div className="animate-in slide-in-from-right-8 duration-500 space-y-8">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
                <div className="p-8 border-b border-slate-800 bg-gradient-to-r from-primary/10 to-transparent">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-black text-white flex items-center gap-3">
                        {getScriptIcon(selectedScript.id)}
                        {selectedScript.name}
                      </h2>
                      <p className="text-slate-400 mt-2">{selectedScript.description}</p>
                    </div>
                    <Badge>{selectedScript.id}</Badge>
                  </div>
                </div>
                
                <div className="p-8">
                  <form onSubmit={(e) => { e.preventDefault(); setConfirmOpen(true); }} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {selectedScript.fields.map((field) => (
                        <div key={field.name} className={`space-y-2 ${field.type === 'password' ? 'md:col-span-2' : ''}`}>
                          <label className="text-sm font-bold text-slate-400 ml-1">
                            {field.label} {field.required && <span className="text-primary">*</span>}
                          </label>
                          
                          {field.type === "user_select" ? (
                            <select 
                              className="w-full h-14 px-4 bg-slate-950 border-slate-800 rounded-xl focus:border-primary outline-none text-white"
                              value={formData[field.name] || ""} 
                              onChange={(e) => handleInputChange(field.name, e.target.value)}
                              required={field.required}
                            >
                              <option value="">Selecione um membro...</option>
                              {users.map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.profile?.fullName || u.email} ({u.email})
                                </option>
                              ))}
                            </select>
                          ) : field.type === "select" ? (
                            <select 
                              className="w-full h-14 px-4 bg-slate-950 border-slate-800 rounded-xl focus:border-primary outline-none text-white"
                              value={formData[field.name] || ""} 
                              onChange={(e) => handleInputChange(field.name, e.target.value)}
                              required={field.required}
                            >
                              <option value="">Selecione...</option>
                              {field.options?.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : field.type === "file" ? (
                            <div className="flex gap-4">
                              <input
                                type="text"
                                className="flex-1 h-14 px-4 bg-slate-950 border-slate-800 rounded-xl text-slate-500"
                                value={formData[field.name] || ""}
                                readOnly
                                placeholder="Nenhum arquivo enviado"
                              />
                              <button 
                                type="button" 
                                className="h-14 px-6 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all border border-slate-700 flex items-center justify-center"
                                disabled={!!uploading}
                                onClick={() => document.getElementById(`file-${field.name}`)?.click()}
                              >
                                {uploading === field.name ? <Loader2 className="animate-spin h-5 w-5" /> : <Upload className="h-5 w-5" />}
                              </button>
                              <input 
                                id={`file-${field.name}`}
                                type="file" 
                                className="hidden" 
                                onChange={(e) => e.target.files?.[0] && handleFileUpload(field.name, e.target.files[0])}
                              />
                            </div>
                          ) : (
                            <input
                              type={field.type}
                              required={field.required}
                              className="w-full h-14 px-4 bg-slate-950 border-slate-800 rounded-xl focus:border-primary outline-none text-white placeholder:text-slate-700"
                              placeholder={field.label}
                              value={formData[field.name] || ""}
                              onChange={(e) => handleInputChange(field.name, e.target.value)}
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 flex items-center justify-between">
                       <p className="text-xs text-slate-600 italic">* Campos obrigatórios</p>
                       <button 
                        type="submit" 
                        disabled={loading || !!uploading}
                        className="h-14 px-12 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95 flex items-center gap-3"
                      >
                        {loading ? <Loader2 className="animate-spin h-6 w-6" /> : <Play className="h-5 w-5 fill-current" />}
                        EXECUTAR SCRIPT
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Terminal */}
              <div className="bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
                <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">System Logs</span>
                  </div>
                  <button onClick={() => setOutput([])} className="p-1 hover:text-white transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div 
                  ref={terminalRef}
                  className="h-60 overflow-y-auto p-6 font-mono text-sm custom-scrollbar"
                >
                  {output.length > 0 ? (
                    output.map((line, i) => (
                      <div key={`${line}-${i}`} className={`mb-1 ${
                        line.includes("ERRO") ? "text-rose-400" : 
                        line.includes("SUCESSO") ? "text-emerald-400" : "text-slate-400"
                      }`}>
                        <span className="text-slate-600 mr-3">❯</span>
                        {line}
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-800 italic">Ready for commands...</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[600px] flex flex-col items-center justify-center text-center p-12 border-4 border-dashed border-slate-800 rounded-[3rem] bg-slate-900/20 space-y-6">
              <div className="p-10 rounded-full bg-slate-900 shadow-inner">
                <Settings2 className="h-24 w-24 text-slate-700" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">Central de Operações</h3>
                <p className="text-slate-500 mt-3 max-w-md mx-auto leading-relaxed">
                  Bem-vindo ao Portal de Manutenção do Mergulho Connect. Escolha uma ferramenta na barra lateral para interagir diretamente com os dados do sistema.
                </p>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Confirmation Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-8 space-y-6">
            <div className="flex items-center gap-4 text-amber-500">
              <div className="p-3 bg-amber-500/10 rounded-2xl">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-black">Confirmar Operação</h3>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Você está prestes a executar o script <strong>{selectedScript?.name}</strong>. Esta ação terá efeito imediato e permanente no banco de dados.
            </p>
            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => setConfirmOpen(false)}
                className="flex-1 h-14 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={executeScript}
                className="flex-1 h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className="px-3 py-1 bg-slate-950 border border-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-full">
    {children}
  </span>
);

export default Dashboard;
