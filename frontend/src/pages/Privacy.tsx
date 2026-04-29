import { ChevronLeft, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Privacy = () => {
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
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-200 dark:border-amber-800">
            <Shield className="h-3 w-3" /> Privacidade & LGPD
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="space-y-4 mb-12">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">
            Política de Privacidade
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">
            Última atualização: 28/04/2026
          </p>
        </div>

        <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8 text-lg leading-relaxed text-zinc-600 dark:text-zinc-300 font-medium">
          <section className="space-y-4">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white">1. Introdução</h2>
            <p>
              A <strong>CC Mergulho</strong> ("nós", "nosso" ou "Mergulho") tem o compromisso com a privacidade e proteção dos dados pessoais de seus Usuários. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e compartilhamos dados em conformidade com a <strong>Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018)</strong>.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white">2. Coleta de Dados</h2>
            <p>
              Coletamos informações que você nos fornece diretamente ao se cadastrar como membro, solicitar contato ou utilizar nossas ferramentas de gestão ministerial. Isso inclui:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Dados de identificação (nome, data de nascimento, CPF);</li>
              <li>Dados de contato (e-mail, número de WhatsApp);</li>
              <li>Dados ministeriais (departamentos, voluntariado, histórico de participação).</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white">3. Finalidade do Tratamento</h2>
            <p>
              Os dados coletados são utilizados exclusivamente para:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Gestão da membresia e comunicação institucional;</li>
              <li>Organização de escalas de voluntários e eventos;</li>
              <li>Segurança e controle de acesso físico (Check-in checkin);</li>
              <li>Cumprimento de obrigações legais e estatutárias.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white">4. Seus Direitos</h2>
            <p>
              Como titular dos dados, você tem direito a confirmar a existência do tratamento, acessar seus dados, corrigir informações incompletas ou revogar seu consentimento a qualquer momento, através de nossos canais oficiais de suporte.
            </p>
          </section>

          <footer className="pt-12 border-t border-zinc-200 dark:border-zinc-800 text-sm text-zinc-400">
            Para dúvidas sobre como tratamos seus dados, entre em contato em <a href="mailto:privacidade@ccmergulho.com.br" className="text-primary hover:underline">privacidade@ccmergulho.com.br</a>.
          </footer>
        </div>
      </main>
    </div>
  );
};

export default Privacy;
