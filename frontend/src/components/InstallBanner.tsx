import { useState, useEffect } from "react";
import { X, Smartphone, Download, Share, PlusSquare } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

const InstallBanner = () => {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "other">("other");

  useEffect(() => {
    // Check if already in standalone mode (installed as PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');

    if (isStandalone) return;

    // Detect platform
    const ua = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);

    if (isIos) setPlatform("ios");
    else if (isAndroid) setPlatform("android");

    // Show banner after 3 seconds on mobile
    if (isIos || isAndroid) {
      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[100] animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="bg-primary/95 text-primary-foreground p-4 rounded-2xl shadow-2xl backdrop-blur-sm border border-white/20">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <Smartphone className="h-6 w-6" />
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="font-bold text-sm">Instalar Mergulho Connect</h3>
            <p className="text-[10px] opacity-90 leading-tight">
              {platform === "ios" 
                ? "Clique em 'Compartilhar' e depois em 'Adicionar à Tela de Início' para ter acesso total e notificações."
                : "Instale o aplicativo na sua tela inicial para uma experiência completa e notificações push."}
            </p>
            
            <div className="flex gap-2 pt-1">
              {platform === "ios" ? (
                <div className="flex items-center gap-3 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                   <div className="flex flex-col items-center gap-0.5">
                      <Share className="h-4 w-4" />
                      <span className="text-[8px] uppercase font-bold">Botão</span>
                   </div>
                   <div className="h-4 w-[1px] bg-white/20" />
                   <div className="flex flex-col items-center gap-0.5">
                      <PlusSquare className="h-4 w-4" />
                      <span className="text-[8px] uppercase font-bold">Adicionar</span>
                   </div>
                </div>
              ) : (
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className="h-8 text-xs font-bold rounded-lg"
                  onClick={() => setShow(false)}
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" /> Instalar agora
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-[10px] opacity-70 hover:opacity-100"
                onClick={() => setShow(false)}
              >
                Agora não
              </Button>
            </div>
          </div>
          <button onClick={() => setShow(false)} className="opacity-50 hover:opacity-100 transition-opacity">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallBanner;
