import * as React from "react";

import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ActionType = typeof actionTypes;

type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: ToasterToast["id"];
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: ToasterToast["id"];
    };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t,
        ),
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

const translateMessage = (msg: React.ReactNode): React.ReactNode => {
  if (typeof msg !== 'string') return msg;
  
  const lowerMsg = msg.toLowerCase();
  
  if (lowerMsg.includes("invalid login credentials")) return "Usuário ou senha incorretos.";
  if (lowerMsg.includes("user not found")) return "Usuário não encontrado.";
  if (lowerMsg.includes("password should be at least")) return "A senha deve ter pelo menos 6 caracteres.";
  if (lowerMsg.includes("duplicate key value violates unique constraint")) return "Este registro já existe.";
  if (lowerMsg.includes("jwt expired")) return "Sua sessão expirou, faça login novamente.";
  if (lowerMsg.includes("fetch payload")) return "Erro de conexão. Verifique sua internet.";
  if (lowerMsg.includes("network error")) return "Erro de rede. Verifique sua conexão.";
  if (lowerMsg.includes("failed to fetch")) return "Erro de conexão. Verifique sua internet.";
  if (lowerMsg.includes("new password should be different from the old password")) return "A nova senha deve ser diferente da antiga.";
  if (lowerMsg.includes("weak_password") || lowerMsg.includes("password is too weak")) return "A senha é muito fraca.";
  if (lowerMsg.includes("profile_username_key")) return "Este nome de usuário já está em uso.";
  if (lowerMsg.includes("not null constraint")) return "Preencha todos os campos obrigatórios.";
  if (lowerMsg.includes("email not confirmed")) return "Email não confirmado.";
  if (lowerMsg.includes("user already registered")) return "Usuário já cadastrado.";
  if (lowerMsg.includes("auth retryable error")) return "Erro de rede temporário. Tente novamente.";
  if (lowerMsg.includes("invalid update body")) return "Dados de atualização inválidos.";
  
  return msg;
};

type Toast = Omit<ToasterToast, "id">;

function toast({ ...props }: Toast) {
  if (props.description) {
    props.description = translateMessage(props.description);
  }

  const id = genId();

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id: id,
    dismiss,
    update,
  };
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export { useToast, toast };
