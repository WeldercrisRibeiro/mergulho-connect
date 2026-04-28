import { useState } from "react";
import { Phone, Send, X, Shield, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WhatsAppWidgetProps {
  phoneNumber: string;
  className?: string;
}

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
    <div className={cn("fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-4", className)}>
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
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
              <MessageCircle className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Mergulho Suporte</h4>
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
            Olá! 👋 Precisa de ajuda ou quer conhecer o Mergulho?
            <br />
            <span className="font-bold text-zinc-900 dark:text-white">Envie sua mensagem e falaremos no WhatsApp!</span>
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
            Enviar no WhatsApp
          </Button>

          <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
            <Shield className="h-3 w-3" />
            Seus dados estão seguros
          </div>
        </div>
      </div>

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "bg-emerald-500 text-white p-4 rounded-full shadow-2xl hover:bg-emerald-600 hover:scale-110 transition-all duration-300 group flex items-center gap-2",
          isOpen && "rotate-90 scale-90 opacity-0 pointer-events-none"
        )}
      >
        <Phone className="h-6 w-6 fill-current" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 font-bold whitespace-nowrap">Fale Conosco</span>
      </button>
      
      {isOpen && (
        <button
          onClick={() => setIsOpen(false)}
          className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 p-4 rounded-full shadow-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all duration-300"
        >
          <X className="h-6 w-6" />
        </button>
      )}
    </div>
  );
};
