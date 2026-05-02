import { useState } from "react";
import DOMPurify from "dompurify";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Megaphone, CalendarClock, Inbox, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

// Components
import { DispatchCard } from "@/components/DispatchCard";
import { DispatchFormDialog } from "@/components/DispatchFormDialog";

// Hooks
import { useDispatches } from "@/hooks/useDispatches";

const AdminNotices = () => {
  const { user, profile, isAdmin, IsLider, managedGroupIds } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [editingDispatch, setEditingDispatch] = useState<any>(null);

  const {
    dispatches,
    isLoading,
    sendMutation,
    retryMutation,
    deleteMutation
  } = useDispatches();

  const { data: groups } = useQuery({
    queryKey: ["groups-list-notices"],
    queryFn: async () => {
      const params: any = {};
      if (!isAdmin && managedGroupIds.length > 0) params.ids = managedGroupIds.join(',');
      const { data } = await api.get('/groups', { params });
      return data || [];
    },
  });

  const { data: members } = useQuery({
    queryKey: ["members-list-notices"],
    queryFn: async () => {
      const params: any = {};
      if (!isAdmin && managedGroupIds.length > 0) params.groupIds = managedGroupIds.join(',');
      const { data } = await api.get('/profiles', { params });
      return data || [];
    },
  });

  const handleSave = (formData: FormData) => {
    sendMutation.mutate({ formData, id: editingDispatch?.id }, {
      onSuccess: () => {
        setIsOpen(false);
        setEditingDispatch(null);
      }
    });
  };

  const renderWhatsAppText = (text: string) => {
    if (!text) return null;
    const rawHtml = text
      .replace(/\*([^\*]+)\*/g, "<strong>$1</strong>")
      .replace(/_([^_]+)_/g, "<em>$1</em>")
      .replace(/~([^~]+)~/g, "<del>$1</del>")
      .replace(/```(.*?)```/g, "<code class='bg-black/10 px-1 py-[2px] rounded text-[13px] font-mono'>$1</code>")
      .replace(/\n/g, "<br />");
    // Sanitiza para prevenir XSS antes de injetar HTML
    const sanitizedHtml = DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: ['strong', 'em', 'del', 'code', 'br'],
      ALLOWED_ATTR: ['class'],
    });
    return <span dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
  };

  const canCreate = isAdmin || IsLider;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 pb-safe animate-fade-in">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-[inset_0_0_20px_rgba(16,185,129,0.1)] border border-emerald-500/20 shrink-0">
            <Megaphone className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent truncate">Disparos (WhatsApp)</h1>
            <p className="text-[11px] sm:text-sm text-muted-foreground/80 font-medium truncate">Envio rico em mídia com integração ao bot Baileys.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canCreate && (
            <Button 
              onClick={() => setIsOpen(true)}
              className="gap-2.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all duration-300 hover:scale-[1.02] active:scale-95 px-6 h-11 font-bold rounded-xl"
            >
              <CalendarClock className="h-4 w-4" /> Novo Disparo
            </Button>
          )}
        </div>
      </header>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-muted/50 p-1 mb-4">
          <TabsTrigger value="all" className="gap-2"><Inbox className="h-3.5 w-3.5" /> Caixas de Envio</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : !dispatches || dispatches.length === 0 ? (
            <p className="text-center opacity-50 py-10">Fila Limpa</p>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {dispatches.map((dispatch: any) => (
                <DispatchCard
                  key={dispatch.id}
                  dispatch={dispatch}
                  isAdmin={isAdmin}
                  onEdit={(d) => { setEditingDispatch(d); setIsOpen(true); }}
                  onRetry={(id) => retryMutation.mutate(id)}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  isRetrying={retryMutation.isPending && retryMutation.variables === dispatch.id}
                  isDeleting={deleteMutation.isPending && deleteMutation.variables === dispatch.id}
                  groups={groups || []}
                  members={members || []}
                  renderWhatsAppText={renderWhatsAppText}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <DispatchFormDialog
        open={isOpen}
        onClose={() => { setIsOpen(false); setEditingDispatch(null); }}
        onSave={handleSave}
        editingDispatch={editingDispatch}
        isAdmin={isAdmin}
        IsLider={IsLider}
        groups={groups || []}
        members={members || []}
        user={user}
        profile={profile}
        isSaving={sendMutation.isPending}
        renderWhatsAppText={renderWhatsAppText}
      />
    </div>
  );
};

export default AdminNotices;
