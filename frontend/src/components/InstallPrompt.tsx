/**
 * InstallPrompt.tsx
 *
 * Componente único que substitui tanto InstallBanner quanto PwaPrompt.
 * Consolida toda a lógica de instalação PWA em um lugar só.
 *
 * Comportamento:
 * - Android/Chrome: captura beforeinstallprompt e mostra botão "Instalar"
 * - iOS (Safari): mostra instrução passo-a-passo (Share → Adicionar)
 * - Não aparece se já instalado (standalone mode)
 * - Dismiss persiste via localStorage (máx 3 rejeições, depois para)
 * - Aparece na primeira visita após 4s, ou quando o usuário faz login pela 1ª vez
 */

import { useState, useEffect, useRef } from "react";
import { X, Smartphone, Share, PlusSquare, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type Platform = "ios" | "android" | "other";

const STORAGE_KEY = "pwa_install_dismissed";
const MAX_DISMISSALS = 3;

function getDismissCount(): number {
  return parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
}

function incrementDismiss() {
  localStorage.setItem(STORAGE_KEY, (getDismissCount() + 1).toString());
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes("android-app://")
  );
}

const InstallPrompt = () => {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<Platform>("other");
  const deferredPromptRef = useRef<any>(null);

  useEffect(() => {
    // Já instalado ou excedeu rejeições → não mostra
    if (isStandalone() || getDismissCount() >= MAX_DISMISSALS) return;

    const ua = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);

    if (isIos) setPlatform("ios");
    else if (isAndroid) setPlatform("android");
    else return; // Desktop: não mostra o banner (o Chrome cuida disso nativamente)

    if (isIos) {
      // iOS: mostra após 4s se nunca mostrou antes
      const hasShown = localStorage.getItem("pwa_ios_shown");
      if (!hasShown) {
        const timer = setTimeout(() => {
          setShow(true);
          localStorage.setItem("pwa_ios_shown", "true");
        }, 4000);
        return () => clearTimeout(timer);
      }
      return;
    }

    // Android: aguarda o evento nativo beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      // Mostra após 4s para não interromper a primeira experiência
      setTimeout(() => setShow(true), 4000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleDismiss = () => {
    setShow(false);
    incrementDismiss();
  };

  const handleInstall = async () => {
    if (!deferredPromptRef.current) return;
    deferredPromptRef.current.prompt();
    const { outcome } = await deferredPromptRef.current.userChoice;
    if (outcome === "accepted") {
      setShow(false);
      // Não incrementa dismiss — o usuário instalou, não rejeitou
    } else {
      incrementDismiss();
      setShow(false);
    }
    deferredPromptRef.current = null;
  };

  if (!show) return null;

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-[100] animate-in fade-in slide-in-from-bottom-5 duration-500"
      role="dialog"
      aria-label="Instalar aplicativo"
    >
      <div className="bg-primary/95 text-primary-foreground p-4 rounded-2xl shadow-2xl backdrop-blur-sm border border-white/20">
        <div className="flex items-start gap-3">
          {/* Ícone */}
          <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <Smartphone className="h-6 w-6" aria-hidden="true" />
          </div>

          {/* Conteúdo */}
          <div className="flex-1 space-y-1">
            <h3 className="font-bold text-sm">Instalar Mergulho Connect</h3>

            {platform === "ios" ? (
              <>
                <p className="text-[11px] opacity-90 leading-snug">
                  Adicione à sua tela inicial para acesso rápido e notificações.
                </p>
                {/* Instrução visual iOS — Share → Adicionar */}
                <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-xl border border-white/10 mt-2 w-fit">
                  <div className="flex flex-col items-center gap-0.5">
                    <Share className="h-4 w-4" aria-hidden="true" />
                    <span className="text-[9px] uppercase font-bold tracking-wide">Compartilhar</span>
                  </div>
                  <span className="text-white/40 text-lg leading-none">›</span>
                  <div className="flex flex-col items-center gap-0.5">
                    <PlusSquare className="h-4 w-4" aria-hidden="true" />
                    <span className="text-[9px] uppercase font-bold tracking-wide">Adicionar</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-[11px] opacity-90 leading-snug">
                Instale na tela inicial para uma experiência completa com notificações push.
              </p>
            )}

            {/* Ações */}
            <div className="flex gap-2 pt-2">
              {platform === "android" && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 text-xs font-bold rounded-lg"
                  onClick={handleInstall}
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                  Instalar agora
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-[11px] opacity-70 hover:opacity-100"
                onClick={handleDismiss}
              >
                Agora não
              </Button>
            </div>
          </div>

          {/* Fechar */}
          <button
            onClick={handleDismiss}
            className="opacity-50 hover:opacity-100 transition-opacity mt-0.5"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;