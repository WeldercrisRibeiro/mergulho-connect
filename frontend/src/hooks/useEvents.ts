import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/errorMessages";

export const useEvents = (filter: string) => {
  const { user, isAdmin, userGroupIds } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [pendingRsvp, setPendingRsvp] = useState<{ eventId: string; status: string } | null>(null);

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["events", filter, userGroupIds, isAdmin],
    queryFn: async () => {
      const { data } = await api.get('/events');
      let filtered = data || [];

      if (filter !== "all") {
        filtered = filtered.filter((e: any) => e.groupId === filter);
      } else if (!isAdmin) {
        filtered = filtered.filter((e: any) => e.isGeneral || userGroupIds.includes(e.groupId));
      }

      return filtered.sort((a: any, b: any) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
    },
    refetchInterval: 15000,
    enabled: !!user,
  });

  const rsvpMutation = useMutation({
    mutationFn: async ({ eventId, status }: { eventId: string; status: string }) => {
      await api.post('/event-rsvps', { eventId, userId: user!.id, status });
    },
    onMutate: async ({ eventId, status }) => {
      setPendingRsvp({ eventId, status });
    },
    onSettled: () => {
      setPendingRsvp(null);
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onSuccess: () => toast({ title: "Presença atualizada!" }),
    onError: (err: any) => {
      setPendingRsvp(null);
      toast({ title: "Falha ao atualizar presença", description: getErrorMessage(err), variant: "destructive" });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (eventId: string) => {
      await api.post('/event-registrations', { eventId, userId: user?.id, paymentStatus: "pending" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({ title: "Inscrição realizada!" });
    },
    onError: (err: any) => toast({ title: "Erro na inscrição", description: getErrorMessage(err), variant: "destructive" }),
  });

  const cancelRegistrationMutation = useMutation({
    mutationFn: async (eventId: string) => {
      await api.delete('/event-registrations', { params: { eventId, userId: user?.id } });
      await api.delete('/event-checkins', { params: { eventId, userId: user?.id } }).catch(() => { });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({ title: "Inscrição cancelada com sucesso!" });
    },
    onError: (err: any) => toast({ title: "Erro ao cancelar", description: getErrorMessage(err), variant: "destructive" }),
  });

  const saveMutation = useMutation({
    mutationFn: async ({ payload, id }: { payload: any; id?: string }) => {
      if (id) {
        await api.patch(`/events/${id}`, payload);
      } else {
        await api.post('/events', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({ title: "Evento salvo com sucesso!" });
    },
    onError: (err: any) => toast({ title: "Erro ao salvar", description: getErrorMessage(err), variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({ title: "Evento removido!" });
    },
    onError: (err: any) => toast({ title: "Erro ao excluir", description: getErrorMessage(err), variant: "destructive" }),
  });

  return {
    events,
    eventsLoading,
    pendingRsvp,
    rsvpMutation,
    registerMutation,
    cancelRegistrationMutation,
    saveMutation,
    deleteMutation
  };
};
