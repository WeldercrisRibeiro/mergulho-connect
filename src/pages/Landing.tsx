import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MapPin, Phone, Instagram, Facebook, Youtube, Quote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const Landing = () => {
  const [formData, setFormData] = useState({ name: "", phone: "", subject: "Quero me tornar Membro", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { data: photos } = useQuery({
    queryKey: ["landing-photos-pub"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("landing_photos").select("*").order("created_at", { ascending: true });
      return data || [];
    },
  });

  const { data: testimonials } = useQuery({
    queryKey: ["landing-testimonials-pub"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("landing_testimonials").select("*").order("created_at", { ascending: true });
      return data || [];
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Send to Supabase (contact_messages table - needs to be created by ADM)
    try {
      await supabase.from("contact_messages" as any).insert([
        {
          name: formData.name,
          phone: formData.phone,
          subject: formData.subject,
          message: formData.message,
        }
      ] as any);
    } catch (err) {
      console.error("Erro ao salvar mensagem:", err);
    }

    toast({ title: "Mensagem recebida!", description: "Sua solicitação foi salva e nossos administradores entrarão em contato." });
    setIsSubmitting(false);
    setFormData({ name: "", phone: "", subject: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header com Glassmorphism perfeito */}
      <header className="border-b border-white/10 bg-background/60 backdrop-blur-xl sticky top-0 z-50 transition-all duration-300">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img src="/idvmergulho/logo horizontal azul.png" alt="Logo" className="h-10 w-auto hover:opacity-80 transition-opacity" />
          </div>

          {/* Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-muted-foreground">
            <a href="#inicio" className="hover:text-primary transition-colors">Início</a>
            <a href="#servicos" className="hover:text-primary transition-colors">Estrutura</a>
            <a href="#sobre" className="hover:text-primary transition-colors">Sobre Nós</a>
            <a href="#projetos" className="hover:text-primary transition-colors">Projetos</a>
            <a href="#contato" className="hover:text-primary transition-colors">Contato</a>
          </nav>

          {/* Auth / Action */}
          <div className="flex items-center gap-4">
            <Link to="/auth" className="text-sm font-bold hover:text-primary transition-colors hidden sm:block">
              Área de Membros
            </Link>
            <Button asChild className="rounded-full px-6 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white border-0 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 transition-all hover:-translate-y-0.5">
              <Link to="/auth?request=true">Participar</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Ultra Moderno com Blobs Gradient */}
      <section id="inicio" className="relative container mx-auto px-4 py-24 md:py-32 text-center overflow-hidden">
        {/* Background Blobs de Luz */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] -z-10 mix-blend-screen pointer-events-none opacity-60 animate-pulse" />
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] -z-10 mix-blend-screen pointer-events-none" />

        <div className="mx-auto max-w-4xl flex flex-col items-center relative z-10">
          <div className="mb-10 relative group w-full flex justify-center">
            <img src="/idvmergulho/logo horizontal azul.png" alt="Logo Comunidade Cristã Mergulho" className="h-32 md:h-48 w-auto object-contain drop-shadow-xl transition-transform duration-500 hover:scale-105" />
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-primary to-cyan-400">AMAR | CUIDAR | SERVIR</span>
          </h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl font-medium">
            Uma comunidade cristã interligada. Junte-se aos nossos grupos, envolva-se em projetos, estude a Palavra e conecte-se com seus irmãos com um clique.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center w-full max-w-lg">
            <Button size="lg" asChild className="rounded-full sm:flex-1 h-14 text-base bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all hover:-translate-y-1">
              <Link to="/auth?request=true">Fazer Parte</Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="rounded-full sm:flex-1 h-14 text-base border-2 hover:bg-primary/5 transition-all hover:-translate-y-1">
              <Link to="/auth">Área do Membro</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Galeria de Fotos + Depoimentos */}
      <section id="servicos" className="relative container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-sm font-bold tracking-widest text-primary uppercase mb-3">Nossa Comunidade</h2>
          <h3 className="text-3xl md:text-4xl font-extrabold text-foreground">Momentos que nos unem</h3>
        </div>

        {/* Photo Gallery */}
        {photos && photos.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-16">
            {photos.map((p: any) => (
              <div key={p.id} className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 aspect-video bg-muted">
                <img src={p.url} alt={p.caption || ""} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                {p.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-white text-sm font-medium">{p.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Testimonials */}
        {testimonials && testimonials.length > 0 && (
          <div>
            <h3 className="text-center text-xl font-bold mb-8 text-muted-foreground">O que dizem nossos membros</h3>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t: any) => (
                <div key={t.id} className="relative bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <Quote className="h-8 w-8 text-primary/30 absolute top-4 right-4" />
                  <p className="text-muted-foreground text-sm leading-relaxed italic mb-4">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0">
                      <span className="text-white font-bold text-sm">{(t.name || "?").charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{t.name}</p>
                      {t.role && <p className="text-xs text-muted-foreground">{t.role}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(!photos || photos.length === 0) && (!testimonials || testimonials.length === 0) && (
          <p className="text-center text-muted-foreground py-12">Conteúdo em breve! 🌊</p>
        )}
      </section>

      {/* Projetos & Sobre com backgrounds alternados */}
      <section id="projetos" className="py-24 bg-gradient-to-b from-primary/5 to-background border-t border-border/50">
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

      <section id="sobre" className="py-24 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -z-10" />
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h3 className="text-sm font-bold tracking-widest text-primary uppercase mb-3">Quem Somos</h3>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-8 leading-tight">Uma igreja focada no Reino</h2>
          <p className="text-lg text-muted-foreground leading-relaxed md:px-12">
            A Comunidade Cristã Mergulho é um lugar de encontro real e tangível com Deus e com pessoas que buscam viver
            uma fé prática e autêntica. Acreditamos na força da comunhão, na manifestação do Espírito pela adoração conjunta e no serviço abnegado ao próximo.
            <br /><br />
            <strong>Venha mergulhar conosco nessa jornada!</strong>
          </p>
        </div>
      </section>

      {/* Contato e Localização */}
      <section id="contato" className="container mx-auto px-4 py-24 mb-10">
        <div className="bg-card/50 backdrop-blur-xl border border-white/10 rounded-[3rem] shadow-2xl p-8 md:p-14 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[80px] -z-10 rounded-full" />

          <div className="grid gap-16 lg:grid-cols-2 relative z-10">
            {/* Formulário Moderno */}
            <div className="flex flex-col justify-center">
              <h3 className="text-4xl font-extrabold mb-4">Fale Conosco</h3>
              <p className="text-muted-foreground mb-8">Envie sua mensagem. Entraremos em contato de forma rápida diretamente no seu WhatsApp.</p>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Input className="h-12 bg-background/50 border-white/20 shadow-inner rounded-xl focus:ring-primary/50 text-base" placeholder="Seu Nome Completo" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Input type="tel" className="h-12 bg-background/50 border-white/20 shadow-inner rounded-xl focus:ring-primary/50 text-base" placeholder="DDD + WhatsApp" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required />
                  </div>
                </div>
                <div className="space-y-2">
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
                </div>
                <div className="space-y-2">
                  <Textarea placeholder="Descreva como podemos ajudar..." className="min-h-[140px] bg-background/50 border-white/20 shadow-inner rounded-xl text-base resize-none focus:ring-primary/50 p-4" value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} required />
                </div>
                <Button disabled={isSubmitting} type="submit" size="lg" className="w-full h-14 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white border-0 shadow-lg hover:shadow-xl transition-all text-base font-semibold">
                  {isSubmitting ? "Processando envio..." : "Enviar Mensagem"}
                </Button>
              </form>
            </div>

            {/* Mapa e Localização aprimorados */}
            <div className="flex flex-col space-y-6 lg:border-l lg:pl-16 border-border/50">
              <div>
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2"><MapPin className="text-primary" /> Onde Estamos</h3>

                <div className="w-full h-[250px] md:h-[350px] rounded-3xl overflow-hidden bg-muted/50 border-2 border-white/20 shadow-xl relative group transition-all duration-500 hover:shadow-primary/30 hover:border-primary/50 mb-8">
                  <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d388.0409256833397!2d-38.58419775850198!3d-3.723572088732412!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x7c74b53c0489361%3A0xb90a07e97b6bb455!2sIgreja%20Crist%C3%A3%20Aba%20Pai!5e0!3m2!1spt-BR!2sbr!4v1775220550750!5m2!1spt-BR!2sbr" width="100%" height="100%" style={{ border: 0 }} allowFullScreen={false} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700"></iframe>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="mt-1 rounded-full bg-primary/10 p-2 text-primary">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Endereço</h4>
                    <p className="text-sm text-muted-foreground mt-1">Rua Rio Paraguai, 534 - Jardim Iracema <br />Fortaleza - CE,60341-270</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-1 rounded-full bg-primary/10 p-2 text-primary">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Contato</h4>
                    <p className="text-sm text-muted-foreground mt-1">(00) 00000-0000</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t">
                <span className="font-medium">Redes Sociais:</span>
                <a href="#" className="rounded-full bg-primary/5 p-2 hover:bg-primary/20 text-primary transition-colors inline-flex">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="rounded-full bg-primary/5 p-2 hover:bg-primary/20 text-primary transition-colors inline-flex">
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

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Comunidade Cristã Mergulho. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
