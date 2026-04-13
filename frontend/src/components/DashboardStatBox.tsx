import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export const DashboardStatBox = ({
  icon,
  label,
  value,
  color,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
  description?: string;
}) => (
  <Card className="border-0 shadow-lg overflow-hidden hover:translate-y-[-4px] transition-all duration-300 group relative bg-card/60 backdrop-blur-sm h-full">
    <div className={`absolute -top-10 -right-10 w-32 h-32 blur-3xl opacity-20 rounded-full ${color}`} />
    <div className={`absolute top-0 left-0 w-full h-1 ${color}`} />
    <CardContent className="p-4 sm:p-5 flex flex-col relative z-10 h-full">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 sm:p-3 rounded-2xl text-white ${color} shadow-lg shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
          {icon}
        </div>
      </div>
      <div className="mt-auto">
        <p className="text-3xl sm:text-4xl font-black tracking-tighter text-foreground leading-none">{value}</p>
        <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">{label}</p>
        {description && <p className="text-[10px] text-muted-foreground/70 mt-1 font-medium">{description}</p>}
      </div>
    </CardContent>
    <div className={`absolute -bottom-4 -right-4 opacity-[0.03] text-foreground transform scale-[4] pointer-events-none group-hover:opacity-[0.06] transition-opacity`}>
      {icon}
    </div>
  </Card>
);
