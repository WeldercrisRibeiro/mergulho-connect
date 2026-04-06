import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 text-center">
          <div className="max-w-md w-full space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-10 w-10 text-destructive" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">Opa! Algo deu errado.</h1>
              <p className="text-muted-foreground text-sm">
                O aplicativo encontrou um erro inesperado e precisou parar.
              </p>
            </div>

            <div className="bg-muted/50 p-4 rounded-xl border border-border/50 text-left overflow-hidden">
              <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Detalhes do erro:</p>
              <p className="text-xs font-mono text-destructive break-all line-clamp-3">
                {this.state.error?.message || "Erro desconhecido durante a renderização"}
              </p>
            </div>

            <Button 
              onClick={this.handleReset}
              className="w-full h-12 gap-2 shadow-lg shadow-primary/20"
            >
              <RefreshCcw className="h-4 w-4" />
              Recarregar Aplicativo
            </Button>
            
            <p className="text-[10px] text-muted-foreground italic">
              Se o erro persistir, tente limpar o cache do seu navegador.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
