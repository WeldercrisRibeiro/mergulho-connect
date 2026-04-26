import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MapPin, Phone, Instagram, Facebook, Youtube, ChevronLeft, ChevronRight, Moon, Sun, Star, Calendar } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/components/ThemeProvider";
import VideoPlayer from "@/components/VideoPlayer";
import { PublicAgenda } from "@/components/PublicAgenda"; // ajuste o path conforme sua estrutura
import { TestimonialCarousel } from "@/components/TestimonialCarousel";
import MapViewer from "@/components/MapViewer";
import { PhotoCarousel } from "@/components/PhotoCarousel";

const Landing = () => {
  const [formData, setFormData] = useState({ name: "", phone: "", subject: "Quero me tornar Membro", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();

  const { data: photos } = useQuery({
    queryKey: ["landing-photos-pub"],
    queryFn: async () => {
      const { data } = await api.get('/landing-photos');
      return data || [];
    },
  });

  const { data: siteSettings } = useQuery({
    queryKey: ["site-settings-pub"],
    queryFn: async () => {
      const { data } = await api.get('/site-settings');
      const settings: Record<string, string> = {};
      (data || []).forEach((s: any) => { settings[s.id] = s.value; });
      return settings;
    },
  });

  const { data: testimonials } = useQuery({
    queryKey: ["landing-testimonials-pub"],
    queryFn: async () => {
      const { data } = await api.get('/landing-testimonials');
      return data || [];
    },
  });

  const whatsappUrl = siteSettings?.whatsapp_number
    ? `https://wa.me/${siteSettings.whatsapp_number.replace(/\D/g, "")}`
    : "#";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/contact-messages', {
        name: formData.name, phone: formData.phone, subject: formData.subject, message: formData.message
      });
    } catch (err) {
      console.error("Erro ao salvar mensagem:", err);
    }
    toast({ title: "Mensagem recebida!", description: "Sua solicitação foi salva e nossos administradores entrarão em contato." });
    setIsSubmitting(false);
    setFormData({ name: "", phone: "", subject: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-white/10 bg-background/60 backdrop-blur-xl sticky top-0 z-50 transition-all duration-300">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <img
              src={theme === "dark" ? "/idvmergulho/logo-white.png" : "/idvmergulho/logo.png"}
              alt="Logo"
              className="h-10 w-auto hover:opacity-80 transition-opacity"
            />
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-muted-foreground">
            <a href="#inicio" className="hover:text-primary transition-colors">Início</a>
            <a href="#sobre" className="hover:text-primary transition-colors">Sobre Nós</a>
            <a href="#agenda" className="hover:text-primary transition-colors">Agenda</a>
            <a href="#servicos" className="hover:text-primary transition-colors">Estrutura</a>
            <a href="#projetos" className="hover:text-primary transition-colors">Projetos</a>
            <a href="#contato" className="hover:text-primary transition-colors">Contato</a>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted"
              title="Alternar tema"
              aria-label="Alternar tema"
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
            <Button asChild variant="secondary" className="rounded-full px-6 font-bold shadow-md transition-all hover:-translate-y-0.5 hidden sm:flex border border-border/50">
              <Link to="/auth">Entrar</Link>
            </Button>
            <Button asChild className="rounded-full px-6 bg-primary hover:bg-primary/90 text-white border-0 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 transition-all hover:-translate-y-0.5">
              <Link to="/auth?request=true">Seja um Membro!</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="inicio" className="scroll-mt-24 relative container mx-auto px-4 py-24 md:py-32 text-center overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] -z-10 mix-blend-screen pointer-events-none opacity-60 animate-pulse" />
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] -z-10 mix-blend-screen pointer-events-none" />

        <div className="mx-auto max-w-4xl flex flex-col items-center relative z-10">
          <div className="mb-10 relative group w-full flex justify-center">
            <img
              src={theme === "dark" ? "/idvmergulho/logo-horizontal.png" : "/idvmergulho/logo-horizontal-azul.png"}
              alt="Logo CC Mergulho"
              className="h-32 md:h-48 w-auto object-contain drop-shadow-xl transition-transform duration-500 hover:scale-105"
            />
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-4 text-primary">
            AMAR | CUIDAR | SERVIR
          </h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl font-medium">
            Uma comunidade cristã interligada. Junte-se aos nossos departamentos, envolva-se em projetos, estude a Palavra e conecte-se com seus irmãos com um clique.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center w-full max-w-lg">
            <Button size="lg" asChild className="rounded-full sm:flex-1 h-14 text-base bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all hover:-translate-y-1">
              <Link to="/auth?request=true">Fazer Parte</Link>
            </Button>
            <Button variant="secondary" size="lg" asChild className="rounded-full sm:flex-1 h-14 text-base border shadow-lg transition-all hover:-translate-y-1 font-bold">
              <Link to="/auth">Entrar</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── SEÇÃO AGENDA PÚBLICA ─────────────────────────────────────────────── */}
      <section id="agenda" className="scroll-mt-24 py-20 bg-gradient-to-b from-background to-primary/5 border-t border-border/40">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Header da seção */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3">Próximos Eventos</h2>
            <p className="text-muted-foreground text-base max-w-xl mx-auto">
              Fique por dentro da programação da CC Mergulho. Eventos em tempo real, atualizados pelos nossos líderes.
            </p>
          </div>

          {/* Agenda component */}
          <PublicAgenda />
        </div>
      </section>

      {/* Projetos */}
      <section id="projetos" className="scroll-mt-24 py-24 bg-gradient-to-b from-primary/5 to-background border-t border-border/50">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6">
            <Heart className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-3xl md:text-4xl font-extrabold mb-6">Nossos Projetos</h3>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Acompanhe em breve as novidades e campanhas solidárias de expansão da nossa igreja. Estamos preparando um espaço para conectar corações abertos com necessidades reais.
          </p>
        </div>
      </section>

      {/* Sobre */}
      <section id="sobre" className="scroll-mt-24 py-24 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -z-10" />
        <div className="container mx-auto px-4 text-center max-w-4xl mb-24">
          <h3 className="text-sm font-bold tracking-widest text-primary uppercase mb-3">Quem Somos</h3>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-8 leading-tight">Uma igreja focada no Reino</h2>
          <p className="text-lg text-muted-foreground leading-relaxed md:px-12">
            A Comunidade Cristã Mergulho é um lugar de encontro real e tangível com Deus e com pessoas que buscam viver
            uma fé prática e autêntica. Acreditamos na força da comunhão, na manifestação do Espírito pela adoração conjunta e no serviço abnegado ao próximo.
            <br /><br />
            <span className="text-primary font-bold text-xl block mt-4 animate-bounce">🌊 Venha mergulhar conosco nessa jornada!</span>
          </p>
        </div>

        {/* Institutional Video */}
        <div className="container mx-auto px-4 mb-24 max-w-5xl">
          <Card className="border-0 shadow-2xl overflow-hidden bg-card/40 backdrop-blur-md rounded-[2.5rem]">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="p-8 md:p-12 space-y-6 flex flex-col justify-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest w-fit">
                    <Star className="h-3 w-3 fill-primary" /> Institucional
                  </div>
                  <h4 className="text-3xl md:text-5xl font-black leading-tight tracking-tighter">
                    Conheça a Comunidade Cristã Mergulho
                  </h4>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    Assista ao nosso vídeo e entenda como estamos construindo uma comunidade focada em amar, cuidar e servir.
                  </p>
                  <div className="flex items-center gap-4 pt-4 border-t border-border/50">
                    <div className="flex -space-x-3">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-10 w-10 rounded-full border-4 border-background bg-muted overflow-hidden shadow-sm">
                          <img src={`https://i.pravatar.cc/100?u=${i + 10}`} alt="avatar" />
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-xs font-black text-foreground uppercase tracking-wider">Comunidade Unida</p>
                      <p className="text-[10px] text-muted-foreground uppercase">+500 Membros Ativos</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 md:p-8 bg-muted/20">
                  <div className="rounded-3xl overflow-hidden shadow-2xl hover:scale-[1.02] transition-transform duration-500 bg-black">
                    <VideoPlayer
                      url={siteSettings?.about_us_video_url || "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}
                      isUpload={siteSettings?.about_us_video_is_upload === "true"}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gallery + Testimonials */}
        <div id="servicos" className="relative container mx-auto px-4 pt-20 mt-10">
          <div className="flex justify-center mb-16">
            <div className="h-1 w-20 bg-gradient-to-r from-transparent via-primary/30 to-transparent rounded-full" />
          </div>

          <div className="text-center mb-16">
            <h2 className="text-sm font-bold tracking-[0.2em] text-primary uppercase mb-3 opacity-80">Vida na Igreja</h2>
            <h3 className="text-4xl md:text-5xl font-black text-foreground tracking-tight">Experiências que nos marcam</h3>
          </div>

          {photos && photos.length > 0 && (
            <PhotoCarousel photos={photos} />
          )}

          {testimonials && testimonials.length > 0 && (
            <div className="mt-32 mb-16">
              <div className="text-center mb-4 px-4">
                <h3 className="text-3xl md:text-5xl font-black text-foreground tracking-tight mb-4 leading-tight">
                  Conheça as histórias da nossa comunidade
                </h3>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-medium">
                  Temos membros de todas as idades e lugares sendo transformados pelo evangelho. Cada testemunho é uma nova jornada.
                </p>
              </div>

              <TestimonialCarousel testimonials={testimonials} />
            </div>
          )}

          {(!photos || photos.length === 0) && (!testimonials || testimonials.length === 0) && (
            <p className="text-center text-muted-foreground py-12">Conteúdo em breve! 🌊</p>
          )}
        </div>
      </section>

      {/* Contato */}
      <section id="contato" className="scroll-mt-24 container mx-auto px-4 py-24 mb-10">
        <div className="bg-card/50 backdrop-blur-xl border border-white/10 rounded-[3rem] shadow-2xl p-8 md:p-14 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[80px] -z-10 rounded-full" />

          <div className="grid gap-16 lg:grid-cols-2 relative z-10">
            <div className="flex flex-col justify-center">
              <h3 className="text-4xl font-extrabold mb-4">Fale Conosco</h3>
              <p className="text-muted-foreground mb-8">Envie sua mensagem. Entraremos em contato de forma rápida diretamente no seu WhatsApp.</p>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="grid sm:grid-cols-2 gap-5">
                  <Input className="h-12 bg-background/50 border-white/20 shadow-inner rounded-xl focus:ring-primary/50 text-base" placeholder="Seu Nome Completo" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                  <Input type="tel" className="h-12 bg-background/50 border-white/20 shadow-inner rounded-xl focus:ring-primary/50 text-base" placeholder="DDD + WhatsApp" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required />
                </div>
                <Select value={formData.subject} onValueChange={(val) => setFormData({ ...formData, subject: val })}>
                  <SelectTrigger className="h-12 bg-background/50 border-white/20 shadow-inner rounded-xl focus:ring-primary/50 text-base">
                    <SelectValue placeholder="Selecione o motivo do contato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Quero me tornar Membro">Quero me tornar Membro</SelectItem>
                    <SelectItem value="Dúvidas e Informações">Dúvidas e Informações</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea placeholder="Descreva como podemos ajudar..." className="min-h-[140px] bg-background/50 border-white/20 shadow-inner rounded-xl text-base resize-none focus:ring-primary/50 p-4" value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} required />
                <Button disabled={isSubmitting} type="submit" size="lg" className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-white border-0 shadow-lg hover:shadow-xl transition-all text-base font-semibold">
                  {isSubmitting ? "Processando envio..." : "Enviar Mensagem"}
                </Button>
              </form>
            </div>

            <div className="flex flex-col space-y-6 lg:border-l lg:pl-16 border-border/50">
              <div>
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2"><MapPin className="text-primary" /> Onde Estamos</h3>
                <MapViewer
                  lat={-3.723844}
                  lng={-38.584113}
                  title="Igreja Cristã Aba Pai"
                  address="Rua Rio Paraguai, 534 - Fortaleza, CE"
                  height="h-[250px] md:h-[350px]"
                  zoom={16}
                  showControls={true}
                  showOpenInMapsButton={true}
                  className="mb-8"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="mt-1 rounded-full bg-primary/10 p-2 text-primary">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Endereço</h4>
                    <p className="text-sm text-muted-foreground mt-1">Rua Rio Paraguai, 534 - Jardim Iracema <br />Fortaleza - CE, 60341-270</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t">
                <span className="font-medium">Redes Sociais:</span>
                <a href={siteSettings?.instagram_url || "#"} target="_blank" rel="noreferrer" className="rounded-full bg-primary/5 p-2 hover:bg-primary/20 text-primary transition-colors inline-flex">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href={siteSettings?.facebook_url || "#"} target="_blank" rel="noreferrer" className="rounded-full bg-primary/5 p-2 hover:bg-primary/20 text-primary transition-colors inline-flex">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="rounded-full bg-primary/5 p-2 hover:bg-primary/20 text-primary transition-colors inline-flex">
                  <Youtube className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating WhatsApp */}
      {siteSettings?.whatsapp_number && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-6 right-6 z-[60] bg-emerald-500 text-white p-4 rounded-full shadow-2xl hover:bg-emerald-600 hover:scale-110 transition-all duration-300 group flex items-center gap-2"
        >
          <Phone className="h-6 w-6 fill-current" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 font-bold whitespace-nowrap">Fale Conosco</span>
        </a>
      )}

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} CC Mergulho. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};
export default Landing;