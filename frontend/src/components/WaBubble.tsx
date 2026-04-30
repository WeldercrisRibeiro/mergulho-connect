import { CheckCircle2 } from "lucide-react";

export function WaBubble({ children, time }: { children: React.ReactNode; time: string }) {
  return (
    <div className="self-end bg-[#DCF8C6] dark:bg-[#005c4b] p-1.5 pb-5 rounded-xl rounded-tr-sm shadow-sm relative max-w-[85%] animate-in fade-in duration-300 min-w-[80px]">
      <div className="text-[#111111] dark:text-[#e9edef]">{children}</div>
      <span className="text-[10.5px] text-[#075E54]/70 dark:text-white/50 font-medium absolute bottom-1 right-2 inline-flex items-center gap-1">
        {time}<CheckCircle2 className="h-[14px] w-[14px] text-[#34B7F1] dark:text-[#53bdeb]" strokeWidth={2.5} />
      </span>
      <svg viewBox="0 0 8 13" width="8" height="13" className="absolute top-0 -right-[7px] text-[#DCF8C6] dark:text-[#005c4b]">
        <path opacity=".13" d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z" />
        <path fill="currentColor" d="M5.188 0H0v11.193l6.467-8.625C7.526 1.156 6.958 0 5.188 0z" />
      </svg>
    </div>
  );
}
