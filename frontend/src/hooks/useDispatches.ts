import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/errorMessages";

export const useDispatches = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: dispatches, isLoading } = useQuery<any[]>({
    queryKey: ["wz-dispatches"],
    queryFn: async () => {
      const { data } = await api.get("/dispatches");
      return data || [];
    },
    refetchInterval: 10000,
  });

  const sendMutation = useMutation({
    mutationFn: async ({ formData, id }: { formData: FormData; id?: string }) => {
      if (id) {
        return await api.patch(`/dispatches/${id}`, formData);
      } else {
        return await api.post("/dispatches", formData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wz-dispatches"] });
      toast({ title: "Sucesso!", description: "Comunicado salvo na fila de disparos." });
    },
    onError: (err: any) => toast({ title: "Erro", description: getErrorMessage(err), variant: "destructive" }),
  });

  const retryMutation = useMutation({
    mutationFn: (id: string) => api.post(`/dispatches/${id}/retry`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wz-dispatches"] });
      toast({ title: "Recolocado na fila", description: "O disparo será tentado novamente." });
    },
    onError: (err: any) => toast({ title: "Erro ao reparar", description: getErrorMessage(err), variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/dispatches/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wz-dispatches"] });
      toast({ title: "Excluído com sucesso!" });
    },
    onError: (err: any) => toast({ title: "Erro ao excluir", description: getErrorMessage(err), variant: "destructive" }),
  });

  return {
    dispatches,
    isLoading,
    sendMutation,
    retryMutation,
    deleteMutation
  };
};
