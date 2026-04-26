import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { io } from "socket.io-client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageCircle, Send, Users, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { isToday, isYesterday } from "date-fns";
import { safeFormat, safeFormatTime } from "@/lib/dateUtils";

type ChatView =
  | { type: "list" }
  | { type: "group"; groupId: string; groupName: string }
  | { type: "direct"; userId: string; userName: string };

// ─── Persistent unread tracking via localStorage ──────────────────────────────
const LS_READ_KEY = "chat_read_timestamps";

function getReadTimestamps(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(LS_READ_KEY) || "{}"); } catch { return {}; }
}

function markAsRead(convId: string) {
  const ts = getReadTimestamps();
  ts[convId] = new Date().toISOString();
  localStorage.setItem(LS_READ_KEY, JSON.stringify(ts));
}

function hasUnread(convId: string, lastMsgTime: string | null, lastMsgSenderId: string | null, myUserId: string): boolean {
  if (!lastMsgTime || !lastMsgSenderId) return false;
  if (lastMsgSenderId === myUserId) return false;
  const ts = getReadTimestamps();
  const lastRead = ts[convId];
  if (!lastRead) return true;
  return new Date(lastMsgTime) > new Date(lastRead);
}

let sharedAudioCtx: AudioContext | null = null;
function getAudioCtx(): AudioContext {
  if (!sharedAudioCtx) sharedAudioCtx = new AudioContext();
  return sharedAudioCtx;
}

function playNotificationSound() {
  try {
    const ctx = getAudioCtx();
    const ensureResume = async () => {
      if (ctx.state === "suspended") {
        try { await ctx.resume(); } catch (e) { console.error("Audio resume failed", e); }
      }
    };
    const doPlay = async () => {
      await ensureResume();
      const playBeep = (startTime: number, freq: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.4, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
        osc.start(startTime);
        osc.stop(startTime + 0.3);
      };
      playBeep(ctx.currentTime, 660);
      playBeep(ctx.currentTime + 0.2, 880);
    };
    doPlay();
  } catch (_) { /* ignore */ }
}

// ─── Helper: renderiza ícone do grupo (imagem, emoji ou fallback) ─────────────
function GroupIcon({ icon, name, size = "md" }: { icon?: string | null; name?: string; size?: "sm" | "md" }) {
  const dimension = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  if (icon && (icon.startsWith("http") || icon.startsWith("/api/uploads") || icon.startsWith("/uploads"))) {
    return (
      <div className={cn(dimension, "rounded-full overflow-hidden shrink-0")}>
        <img
          src={icon}
          alt={name || "grupo"}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className={cn(dimension, "rounded-full bg-primary/10 flex items-center justify-center text-lg shrink-0")}>
      {icon ? <span>{icon}</span> : <Users className={cn(iconSize, "text-primary")} />}
    </div>
  );
}

// ─── Unread tracking (session-based) ────────────────────────────────────────
const unreadMap: Record<string, number> = {};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUuid = (v?: string | null) => !!v && UUID_RE.test(v);

const Chat = () => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [view, setView] = useState<ChatView>({ type: "list" });
  const [message, setMessage] = useState("");
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [chatToDelete, setChatToDelete] = useState<{ type: "group" | "direct"; id: string; name?: string } | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef(view);
  viewRef.current = view;

  // Unlock AudioContext on first user interaction
  useEffect(() => {
    const unlock = () => {
      try { if (getAudioCtx().state === "suspended") getAudioCtx().resume(); } catch (_) { }
    };
    window.addEventListener("click", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  // ─── Queries ─────────────────────────────────────────────────────────────

  const { data: groups } = useQuery({
    queryKey: ["my-groups"],
    queryFn: async () => {
      const { data } = await api.get('/member-groups');
      const groups = (data || []).map((mg: any) => mg.group).filter(Boolean);
      const uniqueGroups = new Map<string, any>();
      groups.forEach((group: any) => {
        if (group?.id && !uniqueGroups.has(group.id)) {
          uniqueGroups.set(group.id, group);
        }
      });
      return Array.from(uniqueGroups.values());
    },
    enabled: !!user,
  });

  const { data: allMembers } = useQuery({
    queryKey: ["members-for-dm"],
    queryFn: async () => {
      const { data } = await api.get('/profiles');
      return (data || []).map((m: any) => ({ userId: m.userId, fullName: m.fullName })).filter((m: any) => m.userId !== user!.id);
    },
    enabled: !!user,
  });

const { data: conversations } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const { data } = await api.get(`/messages/user/${user!.id}`);
      const convMap = new Map<string, any>();
      (data || []).forEach((msg: any) => {
        const otherId = msg.senderId === user!.id ? msg.recipientId : msg.senderId;
        const otherProfile = msg.senderId === user!.id ? msg.recipient?.profile : msg.sender?.profile;
        if (otherId && !convMap.has(otherId)) {
          convMap.set(otherId, {
            userId: otherId,
            name: otherProfile?.fullName || "Membro",
            lastMessage: msg.content,
            time: msg.createdAt,
            lastSenderId: msg.senderId,
          });
        }
      });
      return Array.from(convMap.values());
    },
    enabled: !!user && isValidUuid(user?.id),
    refetchInterval: 5000,
  });

  // ─── Group unread counts ──────────────────────────────────────────────────

  const { data: groupLastMessages } = useQuery({
    queryKey: ["group-last-messages", groups],
    queryFn: async () => {
      if (!groups || (groups as any[]).length === 0) return {};
      const groupIds = (groups as any[]).map((g: any) => g?.id).filter(Boolean);
      const { data } = await api.get('/messages/group-messages', { params: { groupIds: groupIds.join(','), excludeUserId: user!.id }});
      
      const result: Record<string, { time: string; senderId: string }> = {};
      data?.forEach((m: any) => {
        if (m.groupId && !result[m.groupId]) {
          result[m.groupId] = { time: m.createdAt, senderId: m.senderId };
        }
      });
      return result;
    },
    enabled: !!user && !!groups && (groups as any[]).length > 0,
    refetchInterval: 5000,
  });

  const computedUnreads = {
    ...unreadCounts,
    ...Object.fromEntries(
      (conversations || []).map((c: any) => [
        c.userId,
        unreadCounts[c.userId] || (hasUnread(c.userId, c.time, c.lastSenderId, user!.id) ? 1 : 0),
      ])
    ),
    ...Object.fromEntries(
      Object.entries(groupLastMessages || {}).map(([gid, info]: [string, any]) => [
        gid,
        unreadCounts[gid] || (hasUnread(gid, info.time, info.senderId, user!.id) ? 1 : 0),
      ])
    ),
  };

  const chatId =
    view.type === "group" ? view.groupId
      : view.type === "direct" ? view.userId
        : null;

  const { data: messages } = useQuery({
    queryKey: ["messages", chatId],
    queryFn: async () => {
      const isGroup = view.type === "group";
      const idStr = isGroup ? (view as any).groupId : (view as any).userId;
      
      const { data } = await api.get(`/messages/chat/${idStr}`, { params: { isGroup, userId: user!.id } });
      
      return (data || []).map((m: any) => ({
        ...m,
        senderName: m.sender?.profile?.fullName || "Membro"
      }));
    },
    enabled: view.type !== "list" && !!user,
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (view.type === "list" || !chatId) return;
    markAsRead(chatId);
    setUnreadCounts((prev) => ({ ...prev, [chatId]: 0 }));
  }, [chatId, view.type]);

  // ─── Global realtime for notifications ───────────────────────────────────

  const handleNewMessage = useCallback(
    (payload: any) => {
      const msg = payload.new;
      if (!msg || msg.senderId === user?.id) return;

      let convId: string | null = null;
      let convName = "Nova mensagem";
      let targetView: ChatView | null = null;

      if (msg.groupId) {
        convId = msg.groupId;
        const grp = (groups as any[])?.find((g: any) => g?.id === msg.groupId);
        convName = grp?.name || "Grupo";
        targetView = { type: "group", groupId: msg.groupId, groupName: convName };
      } else if (msg.recipientId === user?.id) {
        convId = msg.senderId;
        const prof = allMembers?.find((m) => m.userId === msg.senderId);
        convName = prof?.fullName || "Membro";
        targetView = { type: "direct", userId: msg.senderId, userName: convName };
      }

      if (!convId) return;

      const currentView = viewRef.current;
      const isCurrentChat =
        (currentView.type === "group" && currentView.groupId === convId) ||
        (currentView.type === "direct" && currentView.userId === convId);

      if (!isCurrentChat) {
        setUnreadCounts((prev) => ({ ...prev, [convId!]: (prev[convId!] || 0) + 1 }));
        playNotificationSound();

        const snapTargetView = targetView;
        const snapConvId = convId;

        if (document.hidden && typeof window !== "undefined" && "Notification" in window && (window as any).Notification.permission === "granted") {
          const notif = new (window as any).Notification(`💬 ${convName}`, {
            body: msg.content?.substring(0, 80) || "Nova mensagem",
            icon: "/idvmergulho/logo.png"
          });
          notif.onclick = () => {
            window.focus();
            setView(snapTargetView);
            markAsRead(snapConvId);
            setUnreadCounts((prev) => ({ ...prev, [snapConvId]: 0 }));
          };
        }

        toast({
          title: `💬 ${convName}`,
          description: msg.content?.substring(0, 80) || "Nova mensagem",
          onClick: () => {
            setView(snapTargetView);
            markAsRead(snapConvId);
            setUnreadCounts((prev) => ({ ...prev, [snapConvId]: 0 }));
          },
          action: snapTargetView ? (
            <ToastAction
              altText="Abrir conversa"
              onClick={() => {
                setView(snapTargetView);
                markAsRead(snapConvId);
                setUnreadCounts((prev) => ({ ...prev, [snapConvId]: 0 }));
              }}
            >
              Abrir
            </ToastAction>
          ) : undefined,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["messages", convId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    [user?.id, groups, allMembers, toast, queryClient]
  );

  useEffect(() => {
    if (!user) return;
    const WS_URL = import.meta.env.VITE_API_URL?.replace('http', 'ws') || `ws://${window.location.hostname}:3001`;
    const socket = io(WS_URL + "/chat");
    socket.on("new_message", (payload: any) => {
      // payload structure emitted from Nest is { new: message_obj_in_camelCase }
      const newMsg = payload.new;
      handleNewMessage({
        new: newMsg
      });
    });
    return () => { socket.disconnect(); };
  }, [user, handleNewMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── Mutations ────────────────────────────────────────────────────────────

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const payload: any = { senderId: user!.id, content };
      if (view.type === "group") payload.groupId = view.groupId;
      else if (view.type === "direct") payload.recipientId = view.userId;
      
      await api.post("/messages", payload);
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendMutation.isPending) return;
    try {
      const ctx = getAudioCtx();
      if (ctx.state === "suspended") ctx.resume();
    } catch (_) { }
    sendMutation.mutate(message.trim());
  };

  const deleteChatMutation = useMutation({
    mutationFn: async ({ type, id }: { type: "group" | "direct"; id: string }) => {
      if (type === "group") {
        await api.delete(`/messages/group/${id}`);
      } else {
        await api.delete(`/messages/direct/${user!.id}/${id}`);
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setUnreadCounts((prev) => ({ ...prev, [variables.id]: 0 }));
      setChatToDelete(null);
      if (viewRef.current.type !== "list") {
          const currentId = viewRef.current.type === "group" ? viewRef.current.groupId : (viewRef.current as any).userId;
          if (currentId === variables.id) setView({ type: "list" });
      }
      toast({ title: "Aviso", description: "O chat foi excluído definitivamente para todos." });
    },
    onError: (err: any) => toast({ title: "Erro ao excluir", description: getErrorMessage(err), variant: "destructive" }),
  });

// ─── Helpers ──────────────────────────────────────────────────────────────

  const renderDateSeparator = (date: Date) => {
    let label = safeFormat(date, "d 'de' MMMM");
    if (isToday(date)) label = "Hoje";
    else if (isYesterday(date)) label = "Ontem";
    return (
      <div key={`sep-${date.getTime()}`} className="flex justify-center my-6">
        <span className="px-3 py-1 bg-muted rounded-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 shadow-sm border border-border/50">
          {label}
        </span>
      </div>
    );
  };

  const filteredMembers = allMembers?.filter((m) =>
    (m.fullName || "").toLowerCase().includes(memberSearch.toLowerCase())
  );

  const openConv = (id: string, target: ChatView) => {
    setView(target);
    markAsRead(id);
    setUnreadCounts((prev) => ({ ...prev, [id]: 0 }));
  };

  // ─── List View ────────────────────────────────────────────────────────────

  if (view.type === "list") {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 pb-20 md:pb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-primary" />
            Chat
          </h1>
          <Button onClick={() => { setMemberSearch(""); setNewChatOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Novo Chat
          </Button>
        </div>

        {/* Group Chats */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            Departamentos
          </h3>
          <div className="space-y-2">
            {groups?.map((g: any) => {
              if (!g) return null;
              const count = computedUnreads[g.id] || 0;
              return (
                <Card
                  key={`group-${g.id}`}
                  className="neo-shadow-sm border-0 cursor-pointer hover:scale-[1.01] transition-transform active:scale-[0.995]"
                  onClick={() => openConv(g.id, { type: "group", groupId: g.id, groupName: g.name })}
                >
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="relative">
                      {/* ✅ CORRIGIDO: usa componente GroupIcon que renderiza imagem se for URL */}
                      <GroupIcon icon={g.icon} name={g.name} size="md" />
                      {count > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                          {count > 9 ? "9+" : count}
                        </span>
                      )}
                    </div>
                    <span className={cn("font-medium flex-1", count > 0 && "font-bold")}>{g.name}</span>
                    <div className="flex items-center gap-2">
                      {count > 0 && (
                        <span className="text-xs text-rose-500 font-semibold">
                          {count}
                        </span>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/40 hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); setChatToDelete({ type: "group", id: g.id, name: g.name }); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {(!groups || (groups as any[]).length === 0) && (
              <p className="text-sm text-muted-foreground">Você ainda não participa de nenhum grupo</p>
            )}
          </div>
        </div>

        {/* Direct Messages */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            Conversas Diretas
          </h3>
          <div className="space-y-2">
            {conversations?.map((conv: any) => {
              const count = computedUnreads[conv.userId] || 0;
              return (
                <Card
                  key={conv.userId}
                  className="neo-shadow-sm border-0 cursor-pointer hover:scale-[1.01] transition-transform active:scale-[0.995]"
                  onClick={() => openConv(conv.userId, { type: "direct", userId: conv.userId, userName: conv.name || "Membro" })}
                >
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="relative shrink-0">
                      <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                        <span className="font-bold text-primary">{(conv.name || "M").charAt(0)}</span>
                      </div>
                      {count > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                          {count > 9 ? "9+" : count}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn("font-medium text-sm", count > 0 && "font-bold")}>
                        {conv.name || "Membro"}
                      </p>
                      <p className={cn("text-xs truncate", count > 0 ? "text-foreground font-medium" : "text-muted-foreground")}>
                        {conv.lastMessage}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {count > 0 && (
                        <span className="h-5 w-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {count > 9 ? "9+" : count}
                        </span>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/40 hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); setChatToDelete({ type: "direct", id: conv.userId, name: conv.name }); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {(!conversations || conversations.length === 0) && (
              <p className="text-sm text-muted-foreground">
                Nenhuma conversa ainda. Clique em "Novo Chat" para começar.
              </p>
            )}
          </div>
        </div>

        {/* New Chat Dialog */}
        <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Iniciar Nova Conversa</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Input
                placeholder="Buscar membro..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
              />
              <div className="max-h-[300px] overflow-y-auto space-y-1">
                {filteredMembers?.map((m) => (
                  <button
                    key={m.userId}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/70 text-left transition-colors"
                    onClick={() => {
                      setNewChatOpen(false);
                      setView({ type: "direct", userId: m.userId, userName: m.fullName || "Membro" });
                    }}
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold text-sm">{(m.fullName || "M").charAt(0)}</span>
                    </div>
                    <span className="text-sm font-medium">{m.fullName || "Membro"}</span>
                  </button>
                ))}
                {filteredMembers?.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4 text-center">Nenhum membro encontrado</p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ─── Chat View ────────────────────────────────────────────────────────────

  const chatName = view.type === "group" ? view.groupName : view.userName;

  // Encontra o grupo atual para exibir o ícone no header
  const currentGroup = view.type === "group"
    ? (groups as any[])?.find((g: any) => g?.id === view.groupId)
    : null;

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] md:h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-card">
        <Button variant="ghost" size="icon" onClick={() => setView({ type: "list" })}>
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {/* ✅ CORRIGIDO: header também usa GroupIcon para grupos */}
        {view.type === "group" ? (
          <GroupIcon icon={currentGroup?.icon} name={chatName} size="sm" />
        ) : (
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-primary font-bold text-sm">{chatName.charAt(0)}</span>
          </div>
        )}

        <span className="font-semibold flex-1">{chatName}</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (view.type === "group") setChatToDelete({ type: "group", id: view.groupId, name: view.groupName });
              else if (view.type === "direct") setChatToDelete({ type: "direct", id: view.userId, name: view.userName });
            }}
            className="text-muted-foreground hover:text-destructive"
            title="Excluir Conversa"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 overscroll-contain">
        {(!messages || messages.length === 0) && (
          <p className="text-center text-sm text-muted-foreground py-8">Nenhuma mensagem ainda. Diga olá! 👋</p>
        )}
        {messages?.map((msg: any, index: number) => {
          const isMe = msg.senderId === user?.id;
          const msgDate = new Date(msg.createdAt);
          const prevMsg = index > 0 ? messages[index - 1] : null;
          const showDateSeparator =
            !prevMsg ||
            safeFormat(prevMsg.createdAt, "yyyy-MM-dd") !== safeFormat(msg.createdAt, "yyyy-MM-dd");

          return (
            <div key={msg.id} className="space-y-3">
              {showDateSeparator && renderDateSeparator(msgDate)}
              <div className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2 shadow-sm",
                    isMe ? "bg-primary text-primary-foreground" : "bg-card border border-border/50"
                  )}
                >
                  {!isMe && view.type === "group" && (
                    <p className="text-[10px] font-bold uppercase tracking-tight text-primary mb-1">
                      {msg.senderName || "Membro"}
                    </p>
                  )}
                  <p className="text-sm leading-relaxed">
                    {msg.content}
                  </p>
                  <p
                    className={cn(
                      "text-[10px] mt-1 text-right",
                      isMe ? "text-primary-foreground/60" : "text-muted-foreground/60"
                    )}
                  >
                    {safeFormatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <ConfirmDialog
        open={!!chatToDelete}
        title={`Excluir ${chatToDelete?.type === "group" ? "Grupo" : "Conversa"}`}
        description={`Isso excluirá DEFINITIVAMENTE todas as mensagens ${chatToDelete?.type === "group" ? "deste grupo" : "desta conversa"} para TODOS os participantes. Ação irreversível!`}
        confirmLabel="Excluir Tudo"
        variant="danger"
        onConfirm={() => { if (chatToDelete) deleteChatMutation.mutate(chatToDelete); }}
        onCancel={() => setChatToDelete(null)}
      />

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t bg-card/95 backdrop-blur-sm flex gap-2 pb-safe">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="flex-1"
          autoComplete="off"
        />
        <Button type="submit" size="icon" disabled={!message.trim() || sendMutation.isPending}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

export default Chat;