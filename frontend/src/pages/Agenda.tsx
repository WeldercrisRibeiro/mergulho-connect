import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MessageCircle, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Components
import { EventCard } from "@/components/EventCard";
import { EventFormDialog } from "@/components/EventFormDialog";
import { ShareEventDialog } from "@/components/ShareEventDialog";
import { EventNotifyDialog } from "@/components/EventNotifyDialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Hooks
import { useEvents } from "@/hooks/useEvents";

const Agenda = () => {
  const { user, isAdmin, IsLider, managedGroupIds } = useAuth();
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>("all");
  
  // Custom Hook for Events Logic
  const {
    events,
    pendingRsvp,
    rsvpMutation,
    registerMutation,
    cancelRegistrationMutation,
    saveMutation,
    deleteMutation
  } = useEvents(filter);

  // UI State
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [sharingEvent, setSharingEvent] = useState<any>(null);
  const [cancelingRegistration, setCancelingRegistration] = useState<any>(null);
  const [deletingEvent, setDeletingEvent] = useState<any>(null);
  const [rsvpViewEvent, setRsvpViewEvent] = useState<any>(null);
  const [registrationViewEvent, setRegistrationViewEvent] = useState<any>(null);
  const [pixDialogEvent, setPixDialogEvent] = useState<any>(null);
  const [notifyingEvent, setNotifyingEvent] = useState<any>(null);
  const [qrProjectEvent, setQrProjectEvent] = useState<any>(null);
  const [scanningEvent, setScanningEvent] = useState<any>(null);

  // Auxiliary Queries
  const { data: userGroups } = useQuery({
    queryKey: ["user-groups", user?.id],
    enabled: !!user && !isAdmin,
    queryFn: async () => {
      const { data } = await api.get('/member-groups/my');
      return data?.map((m: any) => m.groupId) || [];
    },
  });

  const { data: groups } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const { data } = await api.get('/groups');
      return data || [];
    },
    enabled: !!user,
  });

  const showFilters = isAdmin || (groups && (groups as any[]).length > 1);

  const handleSave = (payload: any) => {
    saveMutation.mutate({ payload, id: editingEvent?.id }, {
      onSuccess: () => {
        setCreatingEvent(false);
        setEditingEvent(null);
      }
    });
  };

  const copyPix = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({ title: "Chave PIX copiada!" });
  };

  return (
    <div className="px-4 pt-0 md:p-8 max-w-4xl mx-auto space-y-2 md:space-y-6 pb-20 md:pb-8">
      <div className="sticky top-0 z-20 -mx-4 px-4 pt-0 pb-1 md:static md:p-0 bg-background/95 backdrop-blur-sm border-b md:border-0">
        <div className="flex items-center justify-end py-2">
          {(isAdmin || IsLider) && (
            <Button onClick={() => setCreatingEvent(true)} size="sm" className="h-8 md:h-10 text-xs md:text-sm px-3 md:px-4">
              <Plus className="h-3.5 w-3.5 mr-1" /> Novo Evento
            </Button>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="flex gap-2 pb-2 overflow-x-auto no-scrollbar">
          <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>Todos</Button>
          {groups?.map((g: any) => (
            <Button key={g.id} variant={filter === g.id ? "default" : "outline"} size="sm" onClick={() => setFilter(g.id)} className="shrink-0">
              {g.name}
            </Button>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {events?.length === 0 && (
          <Card className="border-0 bg-muted/30">
            <CardContent className="p-6 text-center text-muted-foreground">
              Nenhum evento programado no momento.
            </CardContent>
          </Card>
        )}
        {events?.map((event: any) => (
          <EventCard
            key={event.id}
            event={event}
            user={user}
            canManageEvent={isAdmin || (IsLider && event.groupId && managedGroupIds.includes(event.groupId))}
            onEdit={setEditingEvent}
            onDelete={setDeletingEvent}
            onRsvp={(id, status) => rsvpMutation.mutate({ eventId: id, status })}
            onRegister={(id) => registerMutation.mutate(id)}
            onCancelRegistration={setCancelingRegistration}
            onNotify={setNotifyingEvent}
            onShare={setSharingEvent}
            onCheckin={setScanningEvent}
            onViewRsvps={setRsvpViewEvent}
            onViewRegistrations={setRegistrationViewEvent}
            onProjectQr={setQrProjectEvent}
            onShowPix={setPixDialogEvent}
            pendingRsvp={pendingRsvp}
            isSendingNotify={notifyingEvent?.id === event.id}
          />
        ))}
      </div>

      {/* Dialogs */}
      <EventFormDialog
        open={creatingEvent || !!editingEvent}
        onClose={() => { setCreatingEvent(false); setEditingEvent(null); }}
        onSave={handleSave}
        editingEvent={editingEvent}
        isAdmin={isAdmin}
        userGroups={userGroups || []}
        allGroups={groups || []}
        user={user}
        isSaving={saveMutation.isPending}
      />

      <ShareEventDialog
        event={sharingEvent}
        open={!!sharingEvent}
        onClose={() => setSharingEvent(null)}
      />

      <EventNotifyDialog
        event={notifyingEvent}
        open={!!notifyingEvent}
        onClose={() => setNotifyingEvent(null)}
      />

      <ConfirmDialog
        open={!!deletingEvent}
        title="Excluir Evento"
        description={`Deseja realmente excluir o evento "${deletingEvent?.title}"?`}
        confirmLabel="Excluir"
        variant="danger"
        onConfirm={() => deleteMutation.mutate(deletingEvent?.id, { onSuccess: () => setDeletingEvent(null) })}
        onCancel={() => setDeletingEvent(null)}
      />

      <ConfirmDialog
        open={!!cancelingRegistration}
        title="Cancelar Inscrição"
        description={`Tem certeza que deseja cancelar sua inscrição no evento "${cancelingRegistration?.title}"?`}
        confirmLabel="Sim, Cancelar"
        variant="danger"
        onConfirm={() => cancelRegistrationMutation.mutate(cancelingRegistration?.id, { onSuccess: () => setCancelingRegistration(null) })}
        onCancel={() => setCancelingRegistration(null)}
      />

      {/* PIX Dialog */}
      <Dialog open={!!pixDialogEvent} onOpenChange={v => !v && setPixDialogEvent(null)}>
        <DialogContent className="sm:max-w-sm text-center">
          <DialogHeader><DialogTitle>Pagamento PIX</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-lg font-bold text-primary">R$ {Number(pixDialogEvent?.price || 0).toFixed(2)}</p>
            {pixDialogEvent?.pixQrcodeUrl && (
              <img src={pixDialogEvent.pixQrcodeUrl} alt="QR Code PIX" className="mx-auto w-48 h-48 rounded-lg border" />
            )}
            {pixDialogEvent?.pixKey && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Chave PIX:</p>
                <div className="flex items-center gap-2 justify-center">
                  <code className="bg-muted px-3 py-1.5 rounded text-sm break-all">{pixDialogEvent.pixKey}</code>
                  <Button variant="outline" size="icon" onClick={() => copyPix(pixDialogEvent.pixKey)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground">Após o pagamento, o administrador confirmará sua inscrição.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Agenda;
