import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Archive, MessageSquare, Clock, User, Users } from "lucide-react";
import { safeFormat } from "@/lib/dateUtils";

const ArchivedChats = () => {
  const { isAdmin } = useAuth();

  const { data: archivedStats, isLoading } = useQuery({
    queryKey: ["archived-chats-stats"],
    queryFn: async () => {
      const { data: hidden } = await api.get('/hidden-conversations');
      
      const statsMap = new Map<string, any>();
      for (const h of (hidden || [])) {
        const id = h.groupId || h.targetUserId;
        const type = h.groupId ? "group" : "direct";
        const name = h.groupId ? h.group?.name : h.profile?.fullName;
        
        if (!statsMap.has(id)) {
          statsMap.set(id, {
            id, type,
            name: name || "Desconhecido",
            archivedBy: [],
            lastArchiveAt: h.hiddenAt
          });
        }
        
        const entry = statsMap.get(id);
        entry.archivedBy.push(h.userId);
        if (new Date(h.hiddenAt) > new Date(entry.lastArchiveAt)) {
          entry.lastArchiveAt = h.hiddenAt;
        }
      }
      return Array.from(statsMap.values());
    },
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return <div className="p-8 text-center text-muted-foreground">Acesso restrito.</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Archive className="h-6 w-6 text-primary" />
          Conversas Arquivadas
        </h1>
      </div>

      <p className="text-sm text-muted-foreground">
        Esta área permite ao administrador monitorar conversas que foram "ocultadas" pelos usuários em seus painéis pessoais.
        As mensagens originais permanecem preservadas no banco de dados.
      </p>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <span className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : archivedStats?.length === 0 ? (
        <Card className="border-dashed bg-muted/20">
          <CardContent className="p-12 text-center text-muted-foreground">
            Nenhuma conversa foi arquivada ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {archivedStats?.map((stat) => (
            <Card key={stat.id} className="neo-shadow-sm border-0 overflow-hidden hover:scale-[1.01] transition-transform">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {stat.type === "group" ? <Users className="h-5 w-5 text-primary" /> : <User className="h-5 w-5 text-primary" />}
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">{stat.name}</CardTitle>
                    <Badge variant="outline" className="text-[10px] mt-1">
                      {stat.type === "group" ? "Departamento" : "Chat Direto"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2 space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Último arquivamento: {safeFormat(stat.lastArchiveAt, "PPp")}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Arquivado por {stat.archivedBy.length} usuário(s)</span>
                </div>
                
                <div className="pt-2 border-t mt-2">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground/60 mb-2 tracking-tight">Status de Integridade</p>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 bg-emerald-100 dark:bg-emerald-950/30 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 w-full" />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600">PRESERVADO</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ArchivedChats;
