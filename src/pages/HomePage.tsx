import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, BookOpen, Users, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const HomePage = () => {
  const { profile } = useAuth();

  const { data: nextEvents } = useQuery({
    queryKey: ["next-events"],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("*")
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true })
        .limit(3);
      return data || [];
    },
  });

  const { data: latestDevotional } = useQuery({
    queryKey: ["latest-devotional"],
    queryFn: async () => {
      const { data } = await supabase
        .from("devotionals")
        .select("*")
        .eq("status", "published")
        .order("publish_date", { ascending: false })
        .limit(1)
        .single();
      return data;
    },
  });

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">
          Olá, {profile?.full_name || "Mergulhador"}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">Bem-vindo de volta à CC Mergulho</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Calendar, label: "Agenda", path: "/agenda", color: "text-primary" },
          { icon: BookOpen, label: "Devocionais", path: "/devocionais", color: "text-primary" },
          { icon: Users, label: "Membros", path: "/membros", color: "text-primary" },
          { icon: MessageCircle, label: "Chat", path: "/chat", color: "text-primary" },
        ].map(({ icon: Icon, label, path }) => (
          <Link key={path} to={path}>
            <Card className="neo-shadow-sm border-0 hover:scale-[1.02] transition-transform cursor-pointer">
              <CardContent className="flex flex-col items-center gap-2 p-4">
                <Icon className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">{label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Upcoming Events */}
      <Card className="neo-shadow-sm border-0">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Próximos Eventos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {nextEvents && nextEvents.length > 0 ? (
            nextEvents.map((event) => (
              <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="text-center min-w-[3rem]">
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(event.event_date), "MMM", { locale: ptBR }).toUpperCase()}
                  </div>
                  <div className="text-lg font-bold text-primary">
                    {format(new Date(event.event_date), "dd")}
                  </div>
                </div>
                <div>
                  <p className="font-medium text-sm">{event.title}</p>
                  {event.location && (
                    <p className="text-xs text-muted-foreground">{event.location}</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum evento próximo</p>
          )}
        </CardContent>
      </Card>

      {/* Latest Devotional */}
      {latestDevotional && (
        <Card className="neo-shadow-sm border-0">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Devocional do Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <h4 className="font-semibold">{latestDevotional.title}</h4>
            <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
              {latestDevotional.content}
            </p>
            <Link to="/devocionais" className="text-sm text-primary mt-2 inline-block hover:underline">
              Ler mais →
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HomePage;
