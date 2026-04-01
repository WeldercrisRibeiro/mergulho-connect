import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, MapPin, Check, X, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Agenda = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");

  const { data: groups } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const { data } = await supabase.from("groups").select("*");
      return data || [];
    },
  });

  const { data: events } = useQuery({
    queryKey: ["events", filter],
    queryFn: async () => {
      let query = supabase
        .from("events")
        .select("*, event_rsvps(*)")
        .order("event_date", { ascending: true });

      if (filter !== "all") {
        query = query.eq("group_id", filter);
      }

      const { data } = await query;
      return data || [];
    },
  });

  const rsvpMutation = useMutation({
    mutationFn: async ({ eventId, status }: { eventId: string; status: string }) => {
      const { error } = await supabase.from("event_rsvps").upsert(
        { event_id: eventId, user_id: user!.id, status },
        { onConflict: "event_id,user_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({ title: "Presença atualizada!" });
    },
  });

  const shareWhatsApp = (event: any) => {
    const text = `🌊 *CC Mergulho - Evento*\n\n📌 ${event.title}\n📅 ${format(new Date(event.event_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}\n📍 ${event.location || "A definir"}\n\n${event.description || ""}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Calendar className="h-6 w-6 text-primary" />
        Agenda
      </h1>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          Todos
        </Button>
        {groups?.map((g) => (
          <Button
            key={g.id}
            variant={filter === g.id ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(g.id)}
          >
            {g.name}
          </Button>
        ))}
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {events?.map((event) => {
          const userRsvp = event.event_rsvps?.find((r: any) => r.user_id === user?.id);
          const confirmed = event.event_rsvps?.filter((r: any) => r.status === "confirmed").length || 0;

          return (
            <Card key={event.id} className="neo-shadow-sm border-0">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(new Date(event.event_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 mt-0.5 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {event.location}
                      </div>
                    )}
                  </div>
                  <Badge variant={event.is_general ? "default" : "secondary"}>
                    {event.is_general ? "Geral" : "Grupo"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {event.description && (
                  <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{confirmed} confirmado(s)</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={userRsvp?.status === "confirmed" ? "default" : "outline"}
                      onClick={() => rsvpMutation.mutate({ eventId: event.id, status: "confirmed" })}
                    >
                      <Check className="h-4 w-4 mr-1" /> Vou
                    </Button>
                    <Button
                      size="sm"
                      variant={userRsvp?.status === "declined" ? "destructive" : "outline"}
                      onClick={() => rsvpMutation.mutate({ eventId: event.id, status: "declined" })}
                    >
                      <X className="h-4 w-4 mr-1" /> Não vou
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => shareWhatsApp(event)}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {events?.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhum evento encontrado</p>
        )}
      </div>
    </div>
  );
};

export default Agenda;
