import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";

type ChatView =
  | { type: "list" }
  | { type: "group"; groupId: string; groupName: string }
  | { type: "direct"; userId: string; userName: string };

// ─── Audio ──────────────────────────────────────────────────────────────────
let sharedAudioCtx: AudioContext | null = null;
function getAudioCtx(): AudioContext {
  if (!sharedAudioCtx) sharedAudioCtx = new AudioContext();
  return sharedAudioCtx;
}

function playNotificationSound() {
  try {
    const ctx = getAudioCtx();
    const doPlay = () => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    };
    ctx.state === "suspended" ? ctx.resume().then(doPlay) : doPlay();
  } catch (_) { /* ignore */ }
}

// ─── Unread tracking (session-based) ────────────────────────────────────────
const unreadMap: Record<string, number> = {};

const Chat = () => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [view, setView] = useState<ChatView>({ type: "list" });
  const [message, setMessage] = useState("");
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [clearingChat, setClearingChat] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef(view);
  viewRef.current = view;

  // Unlock AudioContext on first user interaction
  useEffect(() => {
    const unlock = () => {
      try { if (getAudioCtx().state === "suspended") getAudioCtx().resume(); } catch (_) {}
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
      const { data: memberGroups } = await supabase
        .from("member_groups")
        .select("group_id, groups(id, name, icon)")
        .eq("user_id", user!.id);
      return memberGroups?.map((mg) => mg.groups) || [];
    },
    enabled: !!user,
  });

  const { data: allMembers } = useQuery({
    queryKey: ["members-for-dm"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name").order("full_name");
      return (data || []).filter((m) => m.user_id !== user!.id);
    },
    enabled: !!user,
  });

  const { data: conversations } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user!.id},recipient_id.eq.${user!.id}`)
        .is("group_id", null)
        .order("created_at", { ascending: false });

      const userIds = new Set<string>();
      data?.forEach((msg) => {
        if (msg.sender_id !== user!.id) userIds.add(msg.sender_id);
        if (msg.recipient_id && msg.recipient_id !== user!.id) userIds.add(msg.recipient_id);
      });
      if (userIds.size === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", Array.from(userIds));
      const profileMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) || []);

      const convMap = new Map<string, any>();
      data?.forEach((msg) => {
        const otherId = msg.sender_id === user!.id ? msg.recipient_id : msg.sender_id;
        if (otherId && !convMap.has(otherId)) {
          convMap.set(otherId, {
            userId: otherId,
            name: profileMap.get(otherId) || "Membro",
            lastMessage: msg.content,
            time: msg.created_at,
          });
        }
      });
      return Array.from(convMap.values());
    },
    enabled: !!user,
    refetchInterval: 5000,
  });

  const chatId =
    view.type === "group" ? view.groupId
    : view.type === "direct" ? view.userId
    : null;

  const { data: messages } = useQuery({
    queryKey: ["messages", chatId],
    queryFn: async () => {
      let query = supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (view.type === "group") {
        query = query.eq("group_id", view.groupId);
      } else if (view.type === "direct") {
        query = query
          .is("group_id", null)
          .or(
            `and(sender_id.eq.${user!.id},recipient_id.eq.${view.userId}),and(sender_id.eq.${view.userId},recipient_id.eq.${user!.id})`
          );
      }

      const { data } = await query;
      if (!data) return [];

      const uids = new Set(data.map((m: any) => m.sender_id));
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", Array.from(uids));
      const map = new Map(profs?.map((p: any) => [p.user_id, p.full_name]) || []);

      return data.map((m: any) => ({ ...m, senderName: map.get(m.sender_id) }));
    },
    enabled: view.type !== "list" && !!user,
    refetchInterval: 3000,
  });

  // Mark current chat as read when entering
  useEffect(() => {
    if (view.type === "list" || !chatId) return;
    setUnreadCounts((prev) => ({ ...prev, [chatId]: 0 }));
  }, [chatId, view.type]);

  // ─── Global realtime for notifications ───────────────────────────────────

  const handleNewMessage = useCallback(
    (payload: any) => {
      const msg = payload.new;
      if (!msg || msg.sender_id === user?.id) return;

      let convId: string | null = null;
      let convName = "Nova mensagem";
      let targetView: ChatView | null = null;

      if (msg.group_id) {
        convId = msg.group_id;
        const grp = (groups as any[])?.find((g: any) => g?.id === msg.group_id);
        convName = grp?.name || "Grupo";
        targetView = { type: "group", groupId: msg.group_id, groupName: convName };
      } else if (msg.recipient_id === user?.id) {
        convId = msg.sender_id;
        const prof = allMembers?.find((m) => m.user_id === msg.sender_id);
        convName = prof?.full_name || "Membro";
        targetView = { type: "direct", userId: msg.sender_id, userName: convName };
      }

      if (!convId) return;

      const currentView = viewRef.current;
      const isCurrentChat =
        (currentView.type === "group" && currentView.groupId === convId) ||
        (currentView.type === "direct" && currentView.userId === convId);

      if (!isCurrentChat) {
        // Increment unread
        setUnreadCounts((prev) => ({ ...prev, [convId!]: (prev[convId!] || 0) + 1 }));

        // Play sound
        playNotificationSound();

        // Snapshot for closure
        const snapTargetView = targetView;
        const snapConvId = convId;

        toast({
          title: `💬 ${convName}`,
          description: msg.content?.substring(0, 80) || "Nova mensagem",
          action: snapTargetView ? (
            <ToastAction
              altText="Abrir conversa"
              onClick={() => {
                setView(snapTargetView);
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
    const channel = supabase
      .channel("global-chat-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        handleNewMessage
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, handleNewMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── Mutations ────────────────────────────────────────────────────────────

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const payload: any = { sender_id: user!.id, content };
      if (view.type === "group") payload.group_id = view.groupId;
      else if (view.type === "direct") payload.recipient_id = view.userId;
      const { error } = await supabase.from("messages").insert(payload);
      if (error) throw error;
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
    sendMutation.mutate(message.trim());
  };

  const clearChatMutation = useMutation({
    mutationFn: async () => {
      if (view.type !== "group") return;
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("group_id", view.groupId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
      setClearingChat(false);
      toast({ title: "Histórico de mensagens removido para todos!" });
    },
    onError: (err: any) =>
      toast({ title: "Erro ao limpar", description: err.message, variant: "destructive" }),
  });

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const renderDateSeparator = (date: Date) => {
    let label = format(date, "d 'de' MMMM", { locale: ptBR });
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
    (m.full_name || "").toLowerCase().includes(memberSearch.toLowerCase())
  );

  // ─── List View ────────────────────────────────────────────────────────────

  if (view.type === "list") {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
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
            Grupos
          </h3>
          <div className="space-y-2">
            {(groups as any[])?.map((g: any) => {
              const count = unreadCounts[g.id] || 0;
              return (
                <Card
                  key={g.id}
                  className="neo-shadow-sm border-0 cursor-pointer hover:scale-[1.01] transition-transform"
                  onClick={() => {
                    setView({ type: "group", groupId: g.id, groupName: g.name });
                    setUnreadCounts((prev) => ({ ...prev, [g.id]: 0 }));
                  }}
                >
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                        {g.icon || <Users className="h-5 w-5 text-primary" />}
                      </div>
                      {count > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                          {count > 9 ? "9+" : count}
                        </span>
                      )}
                    </div>
                    <span className={cn("font-medium flex-1", count > 0 && "font-bold")}>{g.name}</span>
                    {count > 0 && (
                      <span className="text-xs text-rose-500 font-semibold">
                        {count} não lida{count > 1 ? "s" : ""}
                      </span>
                    )}
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
              const count = unreadCounts[conv.userId] || 0;
              return (
                <Card
                  key={conv.userId}
                  className="neo-shadow-sm border-0 cursor-pointer hover:scale-[1.01] transition-transform"
                  onClick={() => {
                    setView({ type: "direct", userId: conv.userId, userName: conv.name || "Membro" });
                    setUnreadCounts((prev) => ({ ...prev, [conv.userId]: 0 }));
                  }}
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
                    {count > 0 && (
                      <span className="h-5 w-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {count > 9 ? "9+" : count}
                      </span>
                    )}
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
                    key={m.user_id}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/70 text-left transition-colors"
                    onClick={() => {
                      setNewChatOpen(false);
                      setView({ type: "direct", userId: m.user_id, userName: m.full_name || "Membro" });
                    }}
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold text-sm">{(m.full_name || "M").charAt(0)}</span>
                    </div>
                    <span className="text-sm font-medium">{m.full_name || "Membro"}</span>
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

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] md:h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-card">
        <Button variant="ghost" size="icon" onClick={() => setView({ type: "list" })}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          {view.type === "group" ? (
            <Users className="h-4 w-4 text-primary" />
          ) : (
            <span className="text-primary font-bold text-sm">{chatName.charAt(0)}</span>
          )}
        </div>
        <span className="font-semibold flex-1">{chatName}</span>
        {isAdmin && view.type === "group" && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setClearingChat(true)}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {(!messages || messages.length === 0) && (
          <p className="text-center text-sm text-muted-foreground py-8">Nenhuma mensagem ainda. Diga olá! 👋</p>
        )}
        {messages?.map((msg: any, index: number) => {
          const isMe = msg.sender_id === user?.id;
          const msgDate = new Date(msg.created_at);
          const prevMsg = index > 0 ? messages[index - 1] : null;
          const showDateSeparator =
            !prevMsg ||
            format(new Date(prevMsg.created_at), "yyyy-MM-dd") !== format(msgDate, "yyyy-MM-dd");

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
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <p
                    className={cn(
                      "text-[10px] mt-1 text-right",
                      isMe ? "text-primary-foreground/60" : "text-muted-foreground/60"
                    )}
                  >
                    {format(msgDate, "HH:mm")}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <ConfirmDialog
        open={clearingChat}
        title="Limpar Histórico"
        description="Isso apagará TODAS as mensagens deste grupo para TODOS os membros. Esta ação não pode ser desfeita."
        confirmLabel="Limpar Tudo"
        variant="danger"
        onConfirm={() => clearChatMutation.mutate()}
        onCancel={() => setClearingChat(false)}
      />

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t bg-card flex gap-2">
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
