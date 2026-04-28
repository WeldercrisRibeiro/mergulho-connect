import { ChevronLeft, Gavel } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Terms = () => {
  return (
    <div className="min-h-screen bg-[#faf9f6] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" asChild className="gap-2 font-bold text-zinc-500 hover:text-primary">
            <Link to="/landing">
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>
          <div className="flex items-center gap-2 px-3 py-1 bg-zinc-100 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-zinc-200 dark:border-zinc-700">
            <Gavel className="h-3 w-3" /> Legal
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="space-y-4 mb-12">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">
            Termos de Uso
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">
            Plataforma de Gestão Ministerial — CC Mergulho
            <br />
            Última atualização: 28 de Abril de 2026
          </p>
        </div>

        <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8 text-lg leading-relaxed text-zinc-600 dark:text-zinc-300 font-medium">
          <section className="space-y-4">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white">1. Identificação das Partes</h2>
            <p>
              Estes Termos de Uso ("TERMOS") regulam a relação contratual entre a <strong>Comunidade Cristã Mergulho</strong> e os usuários da plataforma de gestão ministerial Mergulho Connect.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white">2. Objeto</h2>
            <p>
              A plataforma tem como finalidade facilitar a comunicação, organização e gestão administrativa e ministerial da igreja, incluindo, mas não se limitando a: cadastro de membros, escalas de serviço, tesouraria e check-in infantil.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white">3. Responsabilidades do Usuário</h2>
            <p>
              O Usuário compromete-se a:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Fornecer informações verídicas e mantê-las atualizadas;</li>
              <li>Zelar pela confidencialidade de suas credenciais de acesso;</li>
              <li>Utilizar a plataforma em conformidade com os princípios cristãos e éticos da instituição;</li>
              <li>Não utilizar o sistema para finalidades comerciais ou ilícitas.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white">4. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo visual, logotipos, códigos e estruturas da plataforma são de propriedade exclusiva da Mergulho Connect ou de seus desenvolvedores parceiros, sendo vedada a reprodução sem autorização prévia.
            </p>
          </section>

          <footer className="pt-12 border-t border-zinc-200 dark:border-zinc-800 text-sm text-zinc-400">
            Ao acessar a plataforma, você concorda integralmente com estes termos.
          </footer>
        </div>
      </main>
    </div>
  );
};

export default Terms;
