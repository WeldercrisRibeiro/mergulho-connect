import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Camera, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

const QRScanner = ({ onScan, onClose }: QRScannerProps) => {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    const scannerId = "qr-scanner-container";
    let isMounted = true;
    
    const startScanner = async () => {
      try {
        // Pré-validação de permissões amigável e ambiente HTTP seguro
        try {
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
             throw new Error("NotReadyError");
          }
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
          if (!isMounted) {
            stream.getTracks().forEach(track => track.stop());
            return;
          }
          stream.getTracks().forEach(track => track.stop()); // Libera para o Html5Qrcode assumir
        } catch (permErr: any) {
          if (!isMounted) return;
          if (permErr.message === "NotReadyError") {
             toast({
               title: "Câmera indisponível",
               description: "O navegador bloqueou o acesso à câmera. Se você estiver usando um IP local, acesse via HTTPS.",
               variant: "destructive"
             });
             throw permErr;
          } else if (permErr.name === "NotAllowedError" || permErr.message?.includes("denied")) {
             toast({
               title: "Permissão Necessária",
               description: "Por favor, libere o acesso à câmera nas configurações do seu navegador para escanear.",
               variant: "destructive"
             });
             throw permErr;
          } else {
             // Caso de prompt sendo solicitado
             toast({
               title: "Acesso à Câmera",
               description: "Permita o uso da câmera na notificação do seu navegador.",
             });
          }
        }

        if (!isMounted) return;
        
        const scanner = new Html5Qrcode(scannerId);
        scannerRef.current = scanner;
        
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          (decodedText) => {
            if (isMounted) onScanRef.current(decodedText);
            try {
              // Deixar o parent desmontar.
            } catch (e) {}
          },
          () => {} // Ignore scan failures
        );
      } catch (err: any) {
        if (!isMounted) return;
        console.error("QR Scanner error:", err);
        setError(
          err?.name === "NotAllowedError" || err?.message?.includes("NotAllowedError")
            ? "Permissão da câmera bloqueada. Ative nas configurações do navegador."
            : err?.message === "NotReadyError"
              ? "Câmera indisponível no navegador atual (ambiente inseguro/HTTP)."
              : "Falha ao iniciar a câmera."
        );
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(() => {});
        } catch (e) {}
        try {
          scannerRef.current.clear();
        } catch (e) {}
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            <span className="font-bold text-lg">Scanner QR Code</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 rounded-full"
            onClick={onClose}
          >
            <XCircle className="h-6 w-6" />
          </Button>
        </div>

        <div
          id="qr-scanner-container"
          ref={containerRef}
          className="w-full rounded-2xl overflow-hidden border-4 border-white/20"
        />

        {error && (
          <div className="bg-destructive/20 border border-destructive/50 text-white p-4 rounded-xl text-sm text-center">
            {error}
          </div>
        )}

        <p className="text-white/60 text-xs text-center">
          Aponte a câmera para o QR Code para escanear
        </p>
      </div>
    </div>
  );
};

export default QRScanner;
