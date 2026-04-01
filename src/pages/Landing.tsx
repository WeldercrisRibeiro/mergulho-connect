import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, BookOpen, MessageCircle, Users, Heart, Music } from "lucide-react";

const features = [
  { icon: Users, title: "Grupos", desc: "Participe de grupos como Louvor, Mídia e Acolhimento" },
  { icon: Calendar, title: "Agenda", desc: "Fique por dentro de todos os eventos e cultos" },
  { icon: BookOpen, title: "Devocionais", desc: "Leitura diária para fortalecer sua fé" },
  { icon: MessageCircle, title: "Chat", desc: "Converse com irmãos e grupos da igreja" },
  { icon: Heart, title: "Acolhimento", desc: "Comunidade acolhedora e cheia de amor" },
  { icon: Music, title: "Louvor", desc: "Conecte-se através da adoração" },
];

const Landing = () => (
  <div className="min-h-screen bg-background">
    {/* Header */}
    <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <h1 className="text-xl font-bold text-primary">CC Mergulho</h1>
        <div className="flex gap-2">
          <Button variant="ghost" asChild>
            <Link to="/auth">Entrar</Link>
          </Button>
          <Button asChild>
            <Link to="/auth?tab=signup">Cadastrar</Link>
          </Button>
        </div>
      </div>
    </header>

    {/* Hero */}
    <section className="container mx-auto px-4 py-20 text-center">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm text-primary">
          🌊 Comunidade Cristã Mergulho
        </div>
        <h2 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Bem-vindo à{" "}
          <span className="text-primary">CC Mergulho</span>
        </h2>
        <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
          Uma comunidade cristã conectada. Participe de grupos, acompanhe eventos,
          leia devocionais e converse com seus irmãos — tudo em um só lugar.
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <Button size="lg" asChild>
            <Link to="/auth?tab=signup">Começar Agora</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link to="/auth">Já tenho conta</Link>
          </Button>
        </div>
      </div>
    </section>

    {/* Features */}
    <section className="container mx-auto px-4 py-16">
      <h3 className="text-center text-2xl font-bold mb-10">Tudo que você precisa</h3>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, desc }) => (
          <Card key={title} className="neo-shadow-sm border-0 bg-card">
            <CardContent className="p-6">
              <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold text-lg">{title}</h4>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>

    {/* About */}
    <section className="bg-primary/5 py-16">
      <div className="container mx-auto px-4 text-center max-w-2xl">
        <h3 className="text-2xl font-bold mb-4">Sobre a CC Mergulho</h3>
        <p className="text-muted-foreground leading-relaxed">
          A Comunidade Cristã Mergulho é um lugar de encontro com Deus e com pessoas que buscam viver
          uma fé autêntica. Acreditamos na importância da comunhão, da adoração e do serviço ao próximo.
          Venha mergulhar conosco nessa jornada de fé!
        </p>
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

export default Landing;
