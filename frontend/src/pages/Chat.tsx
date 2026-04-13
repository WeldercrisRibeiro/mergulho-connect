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

  if (icon && icon.startsWith("http")) {
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
      const { data: memberGroups } = await supabase
        .from("member_groups")
        .select("group_id, groups(id, name, icon)")
        .eq("user_id", user!.id);
      return memberGroups?.map((mg) => mg.groups).filter(Boolean) || [];
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
            lastSenderId: msg.sender_id,
          });
        }
      });
      return Array.from(convMap.values());
    },
    enabled: !!user,
    refetchInterval: 5000,
  });

  // ─── Group unread counts ──────────────────────────────────────────────────

  const { data: groupLastMessages } = useQuery({
    queryKey: ["group-last-messages", groups],
    queryFn: async () => {
      if (!groups || (groups as any[]).length === 0) return {};
      const groupIds = (groups as any[]).map((g: any) => g?.id).filter(Boolean);
      const { data } = await supabase
        .from("messages")
        .select("group_id, sender_id, created_at")
        .in("group_id", groupIds)
        .neq("sender_id", user!.id)
        .order("created_at", { ascending: false });
      const result: Record<string, { time: string; senderId: string }> = {};
      data?.forEach((m: any) => {
        if (m.group_id && !result[m.group_id]) {
          result[m.group_id] = { time: m.created_at, senderId: m.sender_id };
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

      let filteredData = data;
      const uids = new Set(filteredData.map((m: any) => m.sender_id));

      let map = new Map();
      if (uids.size > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", Array.from(uids));
        map = new Map(profs?.map((p: any) => [p.user_id, p.full_name]) || []);
      }

      return filteredData.map((m: any) => ({
        ...m,
        senderName: map.get(m.sender_id)
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
    try {
      const ctx = getAudioCtx();
      if (ctx.state === "suspended") ctx.resume();
    } catch (_) { }
    sendMutation.mutate(message.trim());
  };

  const deleteChatMutation = useMutation({
    mutationFn: async ({ type, id }: { type: "group" | "direct"; id: string }) => {
      if (type === "group") {
        const { error } = await supabase.from("messages").delete().eq("group_id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("messages")
          .delete()
          .is("group_id", null)
          .or(`and(sender_id.eq.${user!.id},recipient_id.eq.${id}),and(sender_id.eq.${id},recipient_id.eq.${user!.id})`);
        if (error) throw error;
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
    (m.full_name || "").toLowerCase().includes(memberSearch.toLowerCase())
  );

  const openConv = (id: string, target: ChatView) => {
    setView(target);
    markAsRead(id);
    setUnreadCounts((prev) => ({ ...prev, [id]: 0 }));
  };

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
            Departamentos
          </h3>
          <div className="space-y-2">
            {groups?.map((g: any) => {
              if (!g) return null;
              const count = computedUnreads[g.id] || 0;
              return (
                <Card
                  key={`group-${g.id}`}
                  className="neo-shadow-sm border-0 cursor-pointer hover:scale-[1.01] transition-transform"
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
                  className="neo-shadow-sm border-0 cursor-pointer hover:scale-[1.01] transition-transform"
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
            safeFormat(prevMsg.created_at, "yyyy-MM-dd") !== safeFormat(msg.created_at, "yyyy-MM-dd");

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
                    {safeFormatTime(msg.created_at)}
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