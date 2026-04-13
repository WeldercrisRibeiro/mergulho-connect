import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Mic2, Clock, ChevronRight } from "lucide-react";
import { safeFormat } from "@/lib/dateUtils";
import { Link } from "react-router-dom";

const EVENT_TYPE_LABELS: Record<string, string> = {
  simple: "Compromisso",
  course: "Curso",
  conference: "Conferência",
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  simple: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  course: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
  conference: "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400",
};

const EVENT_TYPE_EMOJI: Record<string, string> = {
  simple: "📌",
  course: "📚",
  conference: "🎤",
};

export const PublicAgenda = () => {
  const { data: events, isLoading } = useQuery({
    queryKey: ["public-agenda"],
    queryFn: async () => {
      const today = new Date().toISOString();
      const { data } = await (supabase as any)
        .from("events")
        .select("id, title, description, event_date, location, event_type, price, speakers, banner_url, is_general, is_public, groups(name)")
        .or("is_general.eq.true,is_public.eq.true") // eventos gerais OU marcados como públicos
        .gte("event_date", today)
        .order("event_date", { ascending: true })
        .limit(6);
      return data || [];
    },
    refetchInterval: 60000, // refresh a cada 1 min
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <span className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          <p className="text-sm text-muted-foreground">Carregando agenda...</p>
        </div>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
        <p className="font-medium">Nenhum evento programado no momento.</p>
        <p className="text-sm mt-1">Volte em breve para novidades! 🌊</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event: any) => {
        const isPaid = event.price > 0;
        const isComplex = event.event_type === "course" || event.event_type === "conference";
        const emoji = EVENT_TYPE_EMOJI[event.event_type] || "📌";

        return (
          <Link key={event.id} to="/auth?request=true" className="block focus:outline-none">
            <Card
              className="border-0 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden group bg-card/80 backdrop-blur-sm"
            >
              <div className="flex">
                {/* Color accent bar */}
                <div className={`w-1.5 shrink-0 ${event.event_type === "conference" ? "bg-purple-500" : event.event_type === "course" ? "bg-blue-500" : "bg-primary"}`} />

                {/* Banner thumbnail (if exists) */}
                {event.banner_url && (
                  <div className="w-24 h-24 shrink-0 overflow-hidden">
                    <img
                      src={event.banner_url}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}

                <CardContent className="p-4 flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {/* Type + Price badges */}
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${EVENT_TYPE_COLORS[event.event_type] || EVENT_TYPE_COLORS.simple}`}>
                          {emoji} {EVENT_TYPE_LABELS[event.event_type] || "Compromisso"}
                        </span>
                        {/* Badge de departamento para eventos não-gerais que foram tornados públicos */}
                        {!event.is_general && event.is_public && event.groups?.name && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                            🏷️ {event.groups.name}
                          </span>
                        )}
                        {isPaid && (
                          <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-600 font-bold">
                            R$ {Number(event.price).toFixed(2)}
                          </Badge>
                        )}
                        {!isPaid && isComplex && (
                          <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-600 font-bold">
                            Gratuito
                          </Badge>
                        )}
                      </div>

                      {/* Title */}
                      <h4 className="font-bold text-sm leading-tight truncate">{event.title}</h4>

                      {/* Date */}
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 shrink-0 text-primary" />
                        <span className="font-medium text-foreground/80">
                          {safeFormat(event.event_date, "dd/MM/yyyy 'às' HH:mm")}
                        </span>
                      </div>

                      {/* Location */}
                      {event.location && (
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}

                      {/* Speakers */}
                      {event.speakers && (
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                          <Mic2 className="h-3 w-3 shrink-0" />
                          <span className="truncate">{event.speakers}</span>
                        </div>
                      )}
                    </div>

                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0 group-hover:text-primary group-hover:translate-x-0.5 transition-all mt-1" />
                  </div>
                </CardContent>
              </div>
            </Card>
          </Link>
        );
      })}

      {/* CTA para login/cadastro */}
      <div className="pt-2 text-center">
        <Link
          to="/auth?request=true"
          className="inline-flex items-center gap-2 text-sm text-primary font-bold hover:underline underline-offset-4"
        >
          Ver agenda completa e confirmar presença →
        </Link>
      </div>
    </div>
  );
};