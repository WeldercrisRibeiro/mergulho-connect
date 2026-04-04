import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, Share } from "lucide-react";

export function PwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  
  useEffect(() => {
    // Check if dismissed enough times
    const dismissCount = parseInt(localStorage.getItem("pwa_dismiss_count") || "0", 10);
    // Determine if it is already standalone (installed)
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
    
    if (isStandalone || dismissCount >= 3) {
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice && !isStandalone) {
      // Show iOS prompt right away if not standalone and not dismissed
      const hasSeenIosPrompt = localStorage.getItem("pwa_ios_shown");
      if (!hasSeenIosPrompt) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    }

    // Listen for Android/Chrome install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (dismissCount < 3) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    const count = parseInt(localStorage.getItem("pwa_dismiss_count") || "0", 10);
    localStorage.setItem("pwa_dismiss_count", (count + 1).toString());
    if (isIOS) {
       localStorage.setItem("pwa_ios_shown", "true");
    }
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-96 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-primary text-primary-foreground rounded-2xl p-4 shadow-xl flex gap-4">
        <div className="shrink-0 flex items-center justify-center bg-white/20 h-12 w-12 rounded-xl">
          <Download className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-sm">Instalar Aplicativo</h3>
          {isIOS ? (
            <p className="text-xs text-primary-foreground/90 mt-1">
              Para instalar, toque em <Share className="inline h-3 w-3 mx-1" /> e depois <strong>"Adicionar à Tela de Início"</strong>.
            </p>
          ) : (
            <p className="text-xs text-primary-foreground/90 mt-1">
              Instale o CC Mergulho na sua tela de início para acesso rápido e notificações!
            </p>
          )}
          
          <div className="flex gap-2 mt-3">
            {!isIOS && (
              <Button size="sm" variant="secondary" className="h-7 text-xs flex-1" onClick={handleInstallClick}>
                Instalar Agora
              </Button>
            )}
            <Button size="sm" variant="ghost" className="h-7 text-xs px-2 hover:bg-white/10" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
