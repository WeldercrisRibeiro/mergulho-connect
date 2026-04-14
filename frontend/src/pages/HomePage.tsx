import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, BookOpen, Users, MessageCircle, ArrowRight, Star, TrendingUp, ShieldCheck, Phone, Megaphone, HandHeart, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";
import { safeFormatMonth, safeFormatDay, safeFormatTime } from "@/lib/dateUtils";

const HomePage = () => {
  const { profile, user, isVisitor, isAdmin, userGroupIds, routinePermissions } = useAuth();
  const { skin } = useTheme();

  const { data: myActiveCheckin } = useQuery({
    queryKey: ["my-active-checkin", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await (supabase as any)
        .from("kids_checkins")
        .select("*")
        .eq("guardian_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  const { data: siteSettings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*");
      return data?.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.value }), {} as any) || {};
    },
  });

  const { data: announcements } = useQuery({
    queryKey: ["my-announcements", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: memberGroups } = await (supabase as any)
        .from("member_groups")
        .select("group_id")
        .eq("user_id", user.id);
      const groupIds = memberGroups?.map((mg: any) => mg.group_id) || [];

      // Primeiro buscamos os anúncios
      const { data: annData, error: annError } = await (supabase as any)
        .from("announcements")
        .select("*")
        .or(`type.eq.general,target_user_id.eq.${user.id}${groupIds.length > 0 ? `,and(type.eq.group,group_id.in.(${groupIds.join(",")}))` : ""}`)
        .order("created_at", { ascending: false })
        .limit(5);

      if (annError) throw annError;
      if (!annData || annData.length === 0) return [];

      // Depois buscamos os perfis dos criadores para evitar erro de Join (400) se não houver FK formal
      const creatorIds = [...new Set(annData.map((a: any) => a.created_by))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", creatorIds);

      // Mapeamos os perfis de volta para os anúncios
      return annData.map((ann: any) => ({
        ...ann,
        profiles: profilesData?.find((p: any) => p.user_id === ann.created_by) || null
      }));
    },
    enabled: !!user,
  });

  const { data: nextEvents } = useQuery({
    queryKey: ["next-events", userGroupIds, isAdmin],
    queryFn: async () => {
      let query = supabase
        .from("events")
        .select("*")
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true })
        .limit(3);

      if (!isAdmin) {
        const groupFilter = userGroupIds?.length > 0 ? `group_id.in.(${userGroupIds.join(",")})` : "";
        query = query.or(`is_general.eq.true${groupFilter ? `,${groupFilter}` : ""}`);
      }

      const { data } = await query;
      return data || [];
    },
  });

  const { data: latestDevotional } = useQuery({
    queryKey: ["latest-devotional"],
    queryFn: async () => {
      const { data } = await supabase
        .from("devotionals")
        .select("*")
        .in("status", isAdmin ? ["published", "scheduled"] : ["published"])
        .lte("publish_date", new Date().toISOString())
        .order("publish_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Hero Welcome Section */}
      <div className="relative overflow-hidden bg-primary px-4 py-8 md:px-8 md:py-10 text-primary-foreground">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900 via-cyan-800 to-blue-900" />
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-blue-100 font-medium tracking-wider mb-2 flex items-center gap-2">
                <Star className="h-4 w-4 fill-blue-200 text-blue-200" />
                BEM-VINDO AO MERGULHO CONNECT
              </p>
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight z-20 relative">
                Olá, {profile?.full_name?.split(' ')[0] || "Querido Membro"}! 👋
              </h1>
              <p className="text-blue-100/80 mt-3 text-lg font-medium relative z-20">
                Sua vida cristã em um só lugar.
              </p>
            </div>
            
            <div className="hidden md:block relative z-20">
              <img src="/idvmergulho/logo-white.png" alt="Logo" className="h-14 w-auto drop-shadow-2xl opacity-90" />
            </div>
          </div>
        </div>
      </div>

      {/* Billboard Section (Outdoor Style) */}
      {(siteSettings?.homepage_banner || siteSettings?.homepage_banner_mobile) && (
        <div className="px-4 mt-6">
          <div className="max-w-6xl mx-auto rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl ring-4 ring-white/10 dark:ring-white/5 border-4 border-muted/20 bg-muted/10">
            {/* Banner Desktop (Oculta no mobile se houver banner mobile) */}
            {siteSettings?.homepage_banner && (
              <img 
                src={siteSettings.homepage_banner} 
                alt="Mural Mergulho Desktop" 
                className={`w-full h-auto max-h-[500px] lg:max-h-[600px] object-cover hover:scale-105 transition-transform duration-700 aspect-video md:aspect-[16/5] ${siteSettings.homepage_banner_mobile ? 'hidden md:block' : 'block'}`}
              />
            )}
            
            {/* Banner Mobile (Oculta no desktop) */}
            {siteSettings?.homepage_banner_mobile && (
              <img 
                src={siteSettings.homepage_banner_mobile} 
                alt="Mural Mergulho Mobile" 
                className={`w-full h-auto object-cover hover:scale-105 transition-transform duration-700 aspect-[4/5] sm:aspect-square md:hidden ${!siteSettings.homepage_banner ? 'block' : ''}`}
              />
            )}
          </div>
        </div>
      )}

      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 relative z-20">

        {/* Active Kids Check-in */}
        {myActiveCheckin && (
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-900/10 overflow-hidden ring-2 ring-emerald-500/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="bg-emerald-500/10 p-3 rounded-2xl flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-16 w-16 text-emerald-600" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <Badge className="bg-emerald-500 hover:bg-emerald-600 border-0 mb-3 uppercase tracking-tighter">Check-in Ativo</Badge>
                  <h3 className="text-2xl font-black text-emerald-900 dark:text-emerald-300 leading-none mb-2">
                    {myActiveCheckin.child_name?.toUpperCase()}
                  </h3>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-emerald-700 dark:text-emerald-400 font-black text-lg">
                    TOKEN: {myActiveCheckin.validation_token}
                  </div>
                  {myActiveCheckin.call_requested && (
                    <div className="mt-4 p-3 bg-rose-500 text-white rounded-xl flex items-center gap-2 animate-bounce shadow-lg">
                      <Phone className="h-5 w-5 fill-white" />
                      <span className="font-bold text-sm text-center">ATENÇÃO: Favor comparecer ao Kids!</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions (Funções Liberadas) */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { icon: Calendar, label: "Agenda", path: "/agenda", color: skin !== "default" ? "bg-primary text-white" : "bg-brand-cyan text-white", routine: "agenda" },
            { icon: BookOpen, label: "Devocionais", path: "/devocionais", color: skin !== "default" ? "bg-primary text-white" : "bg-brand-navy text-white", routine: "devocionais" },
            { icon: HandHeart, label: "Voluntários", path: "/voluntarios", color: skin !== "default" ? "bg-primary text-white" : "bg-brand-charcoal text-white", routine: "voluntarios" },
            { icon: MessageCircle, label: "Chat", path: "/chat", color: skin !== "default" ? "bg-primary text-white" : "bg-brand-navy text-white", routine: "chat" },
            { icon: Users, label: "Membros", path: "/membros", color: skin !== "default" ? "bg-primary text-white" : "bg-brand-cyan text-white", adminOnly: true, routine: "membros" },
            { icon: ShieldCheck, label: "Check-in", path: "/checkin-kids", color: skin !== "default" ? "bg-primary text-white" : "bg-brand-navy text-white", adminOnly: true, routine: "kids" },
            { icon: Megaphone, label: "Avisos", path: "/Disparos", color: skin !== "default" ? "bg-primary text-white" : "bg-brand-charcoal text-white", routine: "Disparos" },
            { icon: BarChart3, label: "Relatórios", path: "/relatorios", color: skin !== "default" ? "bg-primary text-white" : "bg-brand-cyan text-white", adminOnly: true, routine: "relatorios" },
          ].filter(item => {
            if (isVisitor) return ["/agenda", "/devocionais"].includes(item.path);
            if (item.adminOnly && !isAdmin) return false;
            if (item.routine && !isAdmin && routinePermissions[item.routine] === false) return false;
            return true;
          }).map(({ icon: Icon, label, path, color }) => (
            <Link key={path} to={path} className="block h-full">
              <Card className="border-0 shadow-lg overflow-hidden hover:translate-y-[-4px] transition-all duration-300 group relative bg-card/60 backdrop-blur-sm h-full cursor-pointer min-h-[140px]">
                <div className={`absolute -top-10 -right-10 w-32 h-32 blur-3xl opacity-20 rounded-full ${color.split(' ')[0]}`} />
                <div className={`absolute top-0 left-0 w-full h-1 ${color.split(' ')[0]}`} />
                <CardContent className="p-4 sm:p-5 flex flex-col items-center justify-center relative z-10 h-full">
                  <div className={cn(`p-3.5 sm:p-4 rounded-2xl shadow-lg mb-3 shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`, color)}>
                    <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  <span className="text-sm sm:text-base font-bold text-foreground block text-center leading-tight mt-1">{label}</span>
                </CardContent>
                <div className={cn("absolute -bottom-4 -right-4 opacity-[0.03] transform scale-[5] pointer-events-none group-hover:opacity-[0.06] transition-opacity", color.split(' ')[0].replace('bg-', 'text-'))}>
                  <Icon className="h-full w-full" />
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Announcements */}
        {announcements && announcements.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2 px-1">
              <Megaphone className="h-5 w-5 text-primary" /> Central de Avisos
            </h3>
            <div className="grid gap-3">
              {announcements.map((notice: any) => (
                <Card key={notice.id} className="border-0 shadow-lg bg-card/60 backdrop-blur-md">
                  <CardContent className="p-4 sm:p-6 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] uppercase">{notice.type}</Badge>
                      <h4 className="font-bold text-sm truncate">{notice.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground italic">"{notice.content}"</p>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      Por {notice.profiles?.full_name} • {safeFormatTime(notice.created_at)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Events */}
          <div className="md:col-span-3 space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2 px-1">
              <Calendar className="h-5 w-5 text-primary" /> Próximos Eventos
            </h3>
            <div className="space-y-4">
              {nextEvents && nextEvents.length > 0 ? (
                nextEvents.map((event) => (
                  <Card key={event.id} className="border-0 shadow-lg flex items-stretch overflow-hidden group">
                    <div className="bg-primary/5 w-16 md:w-20 flex flex-col items-center justify-center border-r font-bold">
                      <span className="text-xs text-muted-foreground uppercase">{safeFormatMonth(event.event_date)}</span>
                      <span className="text-2xl text-primary">{safeFormatDay(event.event_date)}</span>
                    </div>
                    <div className="p-4 flex-1">
                      <h4 className="font-bold text-base group-hover:text-primary transition-colors">{event.title}</h4>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-bold">{safeFormatTime(event.event_date)}</span>
                        {event.location && <span>• {event.location}</span>}
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground italic bg-muted/10 rounded-2xl border-2 border-dashed">Sem eventos próximos.</div>
              )}
            </div>
          </div>

          {/* Devotional Sidebar */}
          <div className="md:col-span-2 space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2 px-1">
              <BookOpen className="h-5 w-5 text-primary" /> Em Destaque
            </h3>
            {latestDevotional ? (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/30 p-6">
                <Badge variant="secondary" className="mb-2">Devocional do Dia</Badge>
                <h4 className="text-lg font-bold mb-2">{latestDevotional.title}</h4>
                <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed italic">"{latestDevotional.content}"</p>
                <Link to="/devocionais" className="block mt-4 w-full">
                  <Button className="w-full font-bold">Ler Completo</Button>
                </Link>
              </Card>
            ) : (
              <div className="p-8 text-center text-muted-foreground text-sm border font-italic rounded-2xl">Nada em destaque no momento.</div>
            )}

            <div className="bg-muted/20 p-5 rounded-3xl flex items-center gap-4 shadow-inner">
              <div className="bg-primary/20 p-3 rounded-full text-primary"><TrendingUp className="h-5 w-5" /></div>
              <div>
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest leading-tight">COMUNIDADE</p>
                <p className="text-sm font-semibold">Crescendo juntos em amor.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
