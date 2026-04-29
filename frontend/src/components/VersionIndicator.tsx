import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Wrench, Bug, History, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Change {
  type: "new" | "tweak" | "fix";
  text: string;
}

interface Version {
  version: string;
  date: string;
  changes: Change[];
}

const versions: Version[] = [
  {
    version: "1.3.1",
    date: "29/04/2026",
    changes: [
      { type: "new", text: "Hero Section com foto real da comunidade" },
      { type: "new", text: "Páginas de Termos de Uso e Política de Privacidade (LGPD)" },
      { type: "tweak", text: "Widget de suporte WhatsApp com chat interativo" },
      { type: "tweak", text: "Redesign premium do rodapé da Landing Page" },
      { type: "tweak", text: "Ajuste na hierarquia de branding (Logos)" },
      { type: "new", text: "Sistema de Versionamento Visual" },
    ]
  },
  {
    version: "1.1.2",
    date: "28/04/2026",
    changes: [
      { type: "new", text: "Interface de Versionamento Visual (Changelog)" },
      { type: "tweak", text: "Otimização de performance no carregamento de check-ins" },
      { type: "fix", text: "Ajuste na exibição do Welcome Devocional em dispositivos móveis" },
    ]
  },
  {
    version: "1.1.0",
    date: "27/04/2026",
    changes: [
      { type: "new", text: "Sistema de notificações para voluntários" },
      { type: "tweak", text: "Padronização de temas e segurança nos portais" },
      { type: "new", text: "Módulo de Tesouraria integrado" },
    ]
  },
  {
    version: "1.0.0",
    date: "20/04/2026",
    changes: [
      { type: "new", text: "Lançamento oficial do Mergulho Connect" },
      { type: "new", text: "Gestão de Membros e Departamentos" },
      { type: "new", text: "Sistema de Check-in checkin" },
    ]
  }
];

const TypeIcon = ({ type }: { type: Change["type"] }) => {
  switch (type) {
    case "new": return <Sparkles className="h-3 w-3 text-emerald-500" />;
    case "tweak": return <Wrench className="h-3 w-3 text-amber-500" />;
    case "fix": return <Bug className="h-3 w-3 text-rose-500" />;
  }
};

const TypeBadge = ({ type }: { type: Change["type"] }) => {
  const configs = {
    new: { label: "Novo", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
    tweak: { label: "Ajuste", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
    fix: { label: "Correção", className: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" },
  };
  const config = configs[type];
  return (
    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 font-bold uppercase tracking-wider", config.className)}>
      {config.label}
    </Badge>
  );
};

export function VersionIndicator({ className, collapsed }: { className?: string; collapsed?: boolean }) {
  const currentVersion = versions[0].version;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground/60 bg-muted/20 border border-muted-foreground/5 hover:border-primary/20 hover:bg-primary/5 hover:text-primary transition-all rounded-full group",
            collapsed && "justify-center px-0 w-8 h-8",
            className
          )}
        >
          <History className={cn("h-3.5 w-3.5", collapsed ? "h-5 w-5" : "")} />
          {!collapsed && (
            <>
              <span>v{currentVersion}</span>
              <ChevronRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </>
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-zinc-950">
        <div className="bg-primary/5 p-6 border-b border-primary/10">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-xl text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight">O que há de novo?</DialogTitle>
                <p className="text-xs text-muted-foreground font-medium">Acompanhe a evolução do Mergulho Connect</p>
              </div>
            </div>
          </DialogHeader>
        </div>

        <ScrollArea className="max-h-[60vh] p-6">
          <div className="space-y-8 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-[2px] before:bg-zinc-100 dark:before:bg-zinc-800">
            {versions.map((v, idx) => (
              <div key={v.version} className="relative pl-10 group">
                {/* Timeline Dot */}
                <div className={cn(
                  "absolute left-[11px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-zinc-950 transition-all duration-300 z-10",
                  idx === 0 ? "bg-primary scale-125 shadow-[0_0_0_4px_rgba(var(--primary-rgb),0.1)]" : "bg-zinc-300 dark:bg-zinc-700 group-hover:bg-primary/50"
                )} />

                <div className="mb-1 flex items-center justify-between">
                  <span className={cn("text-sm font-black", idx === 0 ? "text-primary" : "text-foreground")}>
                    Versão {v.version}
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">
                    {v.date}
                  </span>
                </div>

                <div className="space-y-3 mt-4">
                  {v.changes.map((change, cIdx) => (
                    <div key={cIdx} className="flex gap-3 items-start group/item">
                      <div className="mt-1 shrink-0">
                        <TypeIcon type={change.type} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <TypeBadge type={change.type} />
                        </div>
                        <p className="text-sm text-muted-foreground/90 leading-relaxed font-medium group-hover/item:text-foreground transition-colors">
                          {change.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 bg-zinc-50 dark:bg-white/5 border-t border-zinc-100 dark:border-white/10 flex justify-center">
          <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
            Mergulho Connect • v{currentVersion}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
