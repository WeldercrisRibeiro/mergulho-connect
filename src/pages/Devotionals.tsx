import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Devotionals = () => {
  const { data: devotionals } = useQuery({
    queryKey: ["devotionals"],
    queryFn: async () => {
      const { data } = await supabase
        .from("devotionals")
        .select("*")
        .eq("status", "published")
        .order("publish_date", { ascending: false });
      return data || [];
    },
  });

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <BookOpen className="h-6 w-6 text-primary" />
        Devocionais
      </h1>

      <div className="space-y-4">
        {devotionals?.map((dev) => (
          <Card key={dev.id} className="neo-shadow-sm border-0">
            <CardHeader>
              <CardTitle className="text-lg">{dev.title}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {format(new Date(dev.publish_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none text-foreground">
                <p className="whitespace-pre-wrap">{dev.content}</p>
              </div>
              {dev.media_url && (
                <div className="mt-4 rounded-lg overflow-hidden">
                  {dev.media_url.includes("youtube") || dev.media_url.includes("youtu.be") ? (
                    <iframe
                      className="w-full aspect-video rounded-lg"
                      src={dev.media_url.replace("watch?v=", "embed/")}
                      allowFullScreen
                    />
                  ) : (
                    <img src={dev.media_url} alt={dev.title} className="w-full rounded-lg" />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {devotionals?.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhum devocional publicado ainda</p>
        )}
      </div>
    </div>
  );
};

export default Devotionals;
