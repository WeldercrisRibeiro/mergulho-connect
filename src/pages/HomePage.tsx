import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, BookOpen, Users, MessageCircle, ArrowRight, Star, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";

const HomePage = () => {
  const { profile } = useAuth();
  const { theme } = useTheme();

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
        .in("status", ["published", "scheduled"])
        .lte("publish_date", new Date().toISOString())
        .order("publish_date", { ascending: false })
        .limit(1)
        .single();
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Hero Welcome Section */}
      <div className="relative overflow-hidden bg-primary px-4 py-12 md:px-8 md:py-16 text-primary-foreground">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-cyan-400/20 mix-blend-overlay" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl" />
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-blue-100 font-medium tracking-wider mb-2 flex items-center gap-2">
                <Star className="h-4 w-4 fill-blue-200 text-blue-200" />
                BEM-VINDO DE VOLTA
              </p>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                Olá, {profile?.full_name?.split(' ')[0] || "Mergulhador"}! 👋
              </h1>
              <p className="text-blue-100/80 mt-3 text-lg font-medium">
                Sua comunidade MergulhoApp está pronta para você.
              </p>
            </div>
            <div className="hidden md:block">
              <img 
                src={theme === "dark" ? "/idvmergulho/logo-white.png" : "/idvmergulho/logo-white.png"} 
                alt="Logo" 
                className="h-24 w-auto drop-shadow-2xl opacity-90 hover:scale-105 transition-transform"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8 max-w-4xl mx-auto -mt-4 space-y-8 relative z-20">
        
        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { icon: Calendar, label: "Agenda", path: "/agenda", color: "bg-blue-500" },
            { icon: BookOpen, label: "Devocionais", path: "/devocionais", color: "bg-cyan-500" },
            { icon: Users, label: "Membros", path: "/membros", color: "bg-indigo-500" },
            { icon: MessageCircle, label: "Chat", path: "/chat", color: "bg-emerald-500" },
          ].map(({ icon: Icon, label, path, color }) => (
            <Link key={path} to={path}>
              <Card className="border-0 shadow-xl dark:bg-card/40 backdrop-blur-md hover:translate-y-[-4px] transition-all duration-300 group cursor-pointer overflow-hidden">
                <div className={cn("h-1 w-full", color)} />
                <CardContent className="flex flex-col items-center gap-3 p-6">
                  <div className={cn("p-3 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform", color)}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-bold tracking-tight">{label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Upcoming Events - Column 3/5 */}
          <div className="md:col-span-3 space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2 px-1">
              <Calendar className="h-5 w-5 text-primary" />
              Próximos Eventos
            </h3>
            <div className="space-y-4">
              {nextEvents && nextEvents.length > 0 ? (
                nextEvents.map((event) => (
                  <Card key={event.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow overflow-hidden group">
                    <CardContent className="p-0 flex items-stretch">
                      <div className="bg-primary/5 dark:bg-primary/10 w-16 md:w-20 flex flex-col items-center justify-center border-r shrink-0 group-hover:bg-primary/10 transition-colors">
                        <span className="text-xs font-bold text-muted-foreground">
                          {format(new Date(event.event_date), "MMM", { locale: ptBR }).toUpperCase()}
                        </span>
                        <span className="text-2xl font-black text-primary">
                          {format(new Date(event.event_date), "dd")}
                        </span>
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-center">
                        <h4 className="font-bold text-base group-hover:text-primary transition-colors">{event.title}</h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <ArrowRight className="h-3 w-3" />
                            {format(new Date(event.event_date), "HH:mm", { locale: ptBR })}
                          </span>
                          {event.location && <span>• {event.location}</span>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="border-0 shadow-md p-8 text-center text-muted-foreground italic">
                  Nenhum evento próximo. Fique atento às novidades!
                </Card>
              )}
              <Link to="/agenda" className="block text-center text-sm font-semibold text-primary hover:underline py-2">
                Ver agenda completa
              </Link>
            </div>
          </div>

          {/* Side Content: Latest Devotional + Stats - Column 2/5 */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2 px-1 mb-4">
                <BookOpen className="h-5 w-5 text-primary" />
                Destaque
              </h3>
              {latestDevotional ? (
                <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/30 overflow-hidden">
                  <CardHeader className="pb-2">
                    <Badge variant="secondary" className="w-fit mb-2">Devocional do Dia</Badge>
                    <CardTitle className="text-lg leading-tight">{latestDevotional.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed italic">
                      "{latestDevotional.content}"
                    </p>
                    <Link to="/devocionais">
                      <Button className="w-full mt-6 bg-primary/10 text-primary hover:bg-primary hover:text-white border-0 shadow-none transition-all font-bold">
                        Ler Completo
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-0 shadow-md p-6 text-center text-muted-foreground text-sm">
                  Aguardando o devocional de hoje...
                </Card>
              )}
            </div>

            {/* Subtle App Stats or Quote */}
            <Card className="border-0 shadow-inner bg-muted/20 p-5 flex items-center gap-4">
              <div className="bg-primary/20 p-3 rounded-full">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Status da Comunidade</p>
                <p className="text-sm font-semibold">Crescendo juntos em amor.</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple Badge component if not imported
const Badge = ({ children, variant, className }: any) => (
  <div className={cn(
    "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
    variant === "secondary" ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground",
    className
  )}>
    {children}
  </div>
);

export default HomePage;
