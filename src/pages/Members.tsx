import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Search, Phone } from "lucide-react";

const Members = () => {
  const [search, setSearch] = useState("");

  const { data: members } = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*, member_groups(group_id, groups(name))");
      return data || [];
    },
  });

  const filtered = members?.filter((m) =>
    m.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Users className="h-6 w-6 text-primary" />
        Membros
      </h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar membros..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {filtered?.map((member) => (
          <Card key={member.id} className="neo-shadow-sm border-0">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <span className="text-primary font-bold text-lg">
                    {member.full_name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{member.full_name}</p>
                {member.whatsapp_phone && (
                  <a
                    href={`https://wa.me/${member.whatsapp_phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary flex items-center gap-1 hover:underline"
                  >
                    <Phone className="h-3 w-3" />
                    {member.whatsapp_phone}
                  </a>
                )}
                <div className="flex gap-1 mt-1 flex-wrap">
                  {member.member_groups?.map((mg: any) => (
                    <Badge key={mg.group_id} variant="secondary" className="text-xs">
                      {mg.groups?.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {filtered?.length === 0 && (
        <p className="text-center text-muted-foreground py-8">Nenhum membro encontrado</p>
      )}
    </div>
  );
};

export default Members;
