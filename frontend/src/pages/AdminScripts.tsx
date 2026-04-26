import { useState, useEffect, useRef } from "react";
import { 
  Terminal, 
  Search, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ShieldCheck,
  UserPlus,
  KeyRound,
  UserCog,
  Settings2,
  Download,
  Upload,
  AlertTriangle,
  X
} from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

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

const AdminScripts = () => {
  const [scripts, setScripts] = useState<AdminScript[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [selectedScript, setSelectedScript] = useState<AdminScript | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [output, setOutput] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const { toast } = useToast();
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
    } catch (error) {
      toast({
        title: "Erro ao carregar scripts",
        description: "Não foi possível carregar a lista de ferramentas.",
        variant: "destructive",
      });
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get("/maintenance/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
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
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      addLog(`Enviando arquivo: ${file.name}...`);
      const response = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      handleInputChange(fieldName, response.data.url);
      addLog(`Arquivo enviado com sucesso: ${response.data.url}`);
      toast({ title: "Upload concluído" });
    } catch (error) {
      addLog(`Erro no upload: ${file.name}`);
      toast({
        title: "Erro no upload",
        description: "Não foi possível enviar o arquivo.",
        variant: "destructive",
      });
    } finally {
      setUploading(null);
    }
  };

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setOutput(prev => [...prev, `[${time}] ${msg}`]);
  };

  const handleExecuteRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmOpen(true);
  };

  const executeScript = async () => {
    if (!selectedScript) return;
    setConfirmOpen(false);
    setLoading(true);
    addLog(`Iniciando execução de: ${selectedScript.name}...`);

    try {
      const response = await api.post(`/maintenance/run/${selectedScript.id}`, formData);
      addLog(`SUCESSO: ${response.data.message || "Script concluído"}`);
      toast({
        title: "Executado com sucesso!",
        description: `O script "${selectedScript.name}" foi concluído.`,
      });
      if (selectedScript.id === 'create-user') setFormData({});
    } catch (error: any) {
      const errMsg = error.response?.data?.message || "Erro desconhecido";
      addLog(`ERRO: ${errMsg}`);
      toast({
        title: "Erro na execução",
        description: errMsg,
        variant: "destructive",
      });
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
      toast({ title: "Logs exportados com sucesso" });
    } catch (error) {
      toast({
        title: "Erro ao exportar logs",
        variant: "destructive",
      });
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
    <div className="container mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Settings2 className="h-8 w-8 text-primary" />
            Scripts de Manutenção
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestão avançada do Mergulho Connect.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExportLogs} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar Auditoria (TXT)
          </Button>
          <Badge variant="outline" className="py-1.5 px-3 border-primary/20 bg-primary/5 text-primary gap-2">
            <ShieldCheck className="h-4 w-4" />
            Admin CCM
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar script..." 
              className="pl-9 h-11 bg-card/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredScripts.map((script) => (
              <button
                key={script.id}
                onClick={() => handleScriptSelect(script)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 group ${
                  selectedScript?.id === script.id
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-[1.02]"
                    : "bg-card hover:bg-accent border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    selectedScript?.id === script.id ? "bg-white/20" : "bg-primary/10 text-primary"
                  }`}>
                    {getScriptIcon(script.id)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{script.name}</h3>
                    <p className={`text-xs line-clamp-1 ${
                      selectedScript?.id === script.id ? "text-primary-foreground/80" : "text-muted-foreground"
                    }`}>
                      {script.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Execução */}
        <div className="lg:col-span-8 space-y-6">
          {selectedScript ? (
            <>
              <Card className="border-primary/10 shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden animate-in slide-in-from-right-4 duration-300">
                <CardHeader className="bg-gradient-to-r from-primary/10 via-transparent to-transparent border-b border-primary/5">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-2xl flex items-center gap-2">
                        {getScriptIcon(selectedScript.id)}
                        {selectedScript.name}
                      </CardTitle>
                      <CardDescription>{selectedScript.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <form onSubmit={handleExecuteRequest} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {selectedScript.fields.map((field) => (
                        <div key={field.name} className={`space-y-2 ${field.type === 'password' ? 'md:col-span-2' : ''}`}>
                          <Label htmlFor={field.name} className="text-sm font-medium">
                            {field.label} {field.required && <span className="text-destructive">*</span>}
                          </Label>
                          
                          {field.type === "user_select" ? (
                            <Select 
                              value={formData[field.name]} 
                              onValueChange={(val) => handleInputChange(field.name, val)}
                            >
                              <SelectTrigger className="h-12 bg-background/50 border-primary/10">
                                <SelectValue placeholder="Selecione um membro" />
                              </SelectTrigger>
                              <SelectContent>
                                <div className="p-2">
                                  <Input 
                                    placeholder="Filtrar membros..." 
                                    className="h-8 mb-2"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                                {users.map((u) => (
                                  <SelectItem key={u.id} value={u.id}>
                                    {u.profile?.fullName || u.email} ({u.email})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : field.type === "select" ? (
                            <Select 
                              value={formData[field.name]} 
                              onValueChange={(val) => handleInputChange(field.name, val)}
                            >
                              <SelectTrigger className="h-12 bg-background/50 border-primary/10">
                                <SelectValue placeholder={`Selecione ${field.label}`} />
                              </SelectTrigger>
                              <SelectContent>
                                {field.options?.map((opt) => (
                                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : field.type === "file" ? (
                            <div className="flex gap-2">
                              <Input
                                type="text"
                                className="h-12 bg-background/50 border-primary/10"
                                value={formData[field.name] || ""}
                                readOnly
                                placeholder="Nenhum arquivo"
                              />
                              <Button 
                                type="button" 
                                variant="outline" 
                                className="h-12 px-4"
                                disabled={uploading === field.name}
                                onClick={() => document.getElementById(`file-${field.name}`)?.click()}
                              >
                                {uploading === field.name ? <Loader2 className="animate-spin" /> : <Upload className="h-4 w-4" />}
                              </Button>
                              <input 
                                id={`file-${field.name}`}
                                type="file" 
                                className="hidden" 
                                onChange={(e) => e.target.files?.[0] && handleFileUpload(field.name, e.target.files[0])}
                              />
                            </div>
                          ) : (
                            <Input
                              id={field.name}
                              type={field.type}
                              required={field.required}
                              className="h-12 bg-background/50 border-primary/10"
                              placeholder={field.label}
                              value={formData[field.name] || ""}
                              onChange={(e) => handleInputChange(field.name, e.target.value)}
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-end">
                      <Button 
                        type="submit" 
                        disabled={loading || !!uploading}
                        className="h-12 px-10 bg-primary font-bold rounded-xl shadow-lg shadow-primary/20"
                      >
                        {loading ? <Loader2 className="animate-spin mr-2" /> : <Play className="mr-2 h-5 w-5 fill-current" />}
                        Executar Script
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Console de Saída */}
              <Card className="bg-slate-950 border-slate-800 text-slate-300 font-mono text-sm overflow-hidden shadow-2xl">
                <CardHeader className="py-3 px-4 bg-slate-900 border-b border-slate-800 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Terminal Output</span>
                  </div>
                  <button onClick={() => setOutput([])} className="hover:text-white transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </CardHeader>
                <CardContent className="p-0">
                  <div 
                    ref={terminalRef}
                    className="h-48 overflow-y-auto p-4 space-y-1 custom-scrollbar"
                  >
                    {output.length > 0 ? (
                      output.map((line, i) => (
                        <div key={i} className={line.includes("ERRO") ? "text-red-400" : line.includes("SUCESSO") ? "text-emerald-400" : ""}>
                          {line}
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-600 italic">Aguardando execução...</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-primary/10 rounded-3xl bg-primary/5 space-y-4">
              <Terminal className="h-16 w-16 text-primary/40" />
              <h3 className="text-xl font-bold">Painel de Manutenção</h3>
              <p className="text-muted-foreground max-w-xs">
                Selecione uma ferramenta administrativa à esquerda para começar.
              </p>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirmar Execução
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a executar o script <strong>{selectedScript?.name}</strong>. 
              Esta ação alterará dados permanentemente no banco de dados. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={executeScript} className="bg-primary">
              Confirmar e Executar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminScripts;
