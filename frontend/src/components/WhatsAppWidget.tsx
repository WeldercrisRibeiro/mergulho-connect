import { useState } from "react";
import { Send, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WhatsAppWidgetProps {
  phoneNumber: string;
  className?: string;
}

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={className} 
    fill="currentColor" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.435 5.711 1.435h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

export const WhatsAppWidget = ({ phoneNumber, className }: WhatsAppWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!message.trim()) return;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneNumber.replace(/\D/g, "")}?text=${encodedMessage}`, "_blank");
    setIsOpen(false);
    setMessage("");
  };

  return (
    <div className={cn("fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-3", className)}>
      {/* Popup */}
      <div
        className={cn(
          "w-[320px] bg-white dark:bg-zinc-950 rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 transition-all duration-300 transform origin-bottom-right",
          isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-50 opacity-0 translate-y-10 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="bg-[#075e54] p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-[#EFEAE2] dark:bg-[#0c141a] rounded-full flex items-center justify-center overflow-hidden border border-white/20 shadow-inner shrink-0">
              <img src="/idvmergulho/logo.png" alt="CC Mergulho" className="h-8 w-8 object-contain" />
            </div>
            <div>
              <h4 className="font-bold text-sm">CC Mergulho</h4>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] opacity-80 uppercase font-black tracking-widest">Online</span>
              </div>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="bg-white dark:bg-zinc-800 p-3 rounded-2xl rounded-tl-none shadow-sm text-sm text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed border border-zinc-100 dark:border-zinc-700">
            Olá! Seja bem-vindo(a) à CC Mergulho!
            <br />
            <span className="font-bold text-zinc-900 dark:text-white">Envie sua mensagem e falaremos no WhatsApp!</span>
            <p>Informe seu nome na mensagem para facilitar na sua identificação! </p>
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Digite sua mensagem aqui..."
            className="w-full min-h-[100px] p-4 rounded-2xl bg-white dark:bg-zinc-800 border-2 border-emerald-500/20 focus:border-emerald-500 focus:ring-0 transition-all resize-none text-sm font-medium"
          />

          <Button
            onClick={handleSend}
            disabled={!message.trim()}
            className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 font-bold transition-all hover:-translate-y-0.5 active:scale-95"
          >
            <Send className="h-4 w-4" />
            Abrir no WhatsApp
          </Button>
        </div>
      </div>

      {/* Toggle Button */}
      <div className="relative">
        {!isOpen ? (
          <button
            onClick={() => setIsOpen(true)}
            className="bg-emerald-500 text-white p-4 rounded-full shadow-2xl hover:bg-emerald-600 hover:scale-110 transition-all duration-300 group flex items-center gap-2"
          >
            <WhatsAppIcon className="h-7 w-7" />
            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 font-bold whitespace-nowrap">
              Fale Conosco
            </span>
          </button>
        ) : (
          <button
            onClick={() => setIsOpen(false)}
            className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 p-4 rounded-full shadow-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all duration-300 animate-in fade-in zoom-in duration-300"
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>
    </div>
  );
};
