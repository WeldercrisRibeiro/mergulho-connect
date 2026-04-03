import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageCircle, Send, Users, ArrowLeft, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type ChatView = { type: "list" } | { type: "group"; groupId: string; groupName: string } | { type: "direct"; userId: string; userName: string };

const Chat = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [view, setView] = useState<ChatView>({ type: "list" });
  const [message, setMessage] = useState("");
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      return (data || []).filter(m => m.user_id !== user!.id);
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
          convMap.set(otherId, { userId: otherId, name: profileMap.get(otherId) || "Membro", lastMessage: msg.content, time: msg.created_at });
        }
      });
      return Array.from(convMap.values());
    },
    enabled: !!user,
  });

  const chatId = view.type === "group" ? view.groupId : view.type === "direct" ? view.userId : null;

  const { data: messages } = useQuery({
    queryKey: ["messages", chatId],
    queryFn: async () => {
      let query = supabase.from("messages").select("*").order("created_at", { ascending: true });

      if (view.type === "group") {
        query = query.eq("group_id", view.groupId);
      } else if (view.type === "direct") {
        query = query
          .is("group_id", null)
          .or(`and(sender_id.eq.${user!.id},recipient_id.eq.${view.userId}),and(sender_id.eq.${view.userId},recipient_id.eq.${user!.id})`);
      }

      const { data } = await query;
      if (!data) return [];

      const uids = new Set(data.map((m: any) => m.sender_id));
      const { data: profs } = await supabase.from("profiles").select("user_id, full_name").in("user_id", Array.from(uids));
      const map = new Map(profs?.map((p: any) => [p.user_id, p.full_name]) || []);

      return data.map((m: any) => ({ ...m, senderName: map.get(m.sender_id) }));
    },
    enabled: view.type !== "list" && !!user,
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (view.type === "list" || !chatId) return;
    const channel = supabase
      .channel(`chat-${chatId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [chatId, queryClient, view.type]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const filteredMembers = allMembers?.filter(m =>
    (m.full_name || "").toLowerCase().includes(memberSearch.toLowerCase())
  );

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
          <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Grupos</h3>
          <div className="space-y-2">
            {groups?.map((g: any) => (
              <Card key={g.id} className="neo-shadow-sm border-0 cursor-pointer hover:scale-[1.01] transition-transform"
                onClick={() => setView({ type: "group", groupId: g.id, groupName: g.name })}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                    {g.icon || <Users className="h-5 w-5 text-primary" />}
                  </div>
                  <span className="font-medium">{g.name}</span>
                </CardContent>
              </Card>
            ))}
            {(!groups || groups.length === 0) && (
              <p className="text-sm text-muted-foreground">Você ainda não participa de nenhum grupo</p>
            )}
          </div>
        </div>

        {/* Direct Messages */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Conversas Diretas</h3>
          <div className="space-y-2">
            {conversations?.map((conv: any) => (
              <Card key={conv.userId} className="neo-shadow-sm border-0 cursor-pointer hover:scale-[1.01] transition-transform"
                onClick={() => setView({ type: "direct", userId: conv.userId, userName: conv.name || "Membro" })}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                    <span className="font-bold text-primary">{(conv.name || "M").charAt(0)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{conv.name || "Membro"}</p>
                    <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!conversations || conversations.length === 0) && (
              <p className="text-sm text-muted-foreground">Nenhuma conversa ainda. Clique em "Novo Chat" para começar.</p>
            )}
          </div>
        </div>

        {/* New Chat Dialog */}
        <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader><DialogTitle>Iniciar Nova Conversa</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <Input placeholder="Buscar membro..." value={memberSearch} onChange={e => setMemberSearch(e.target.value)} />
              <div className="max-h-[300px] overflow-y-auto space-y-1">
                {filteredMembers?.map(m => (
                  <button key={m.user_id}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/70 text-left transition-colors"
                    onClick={() => {
                      setNewChatOpen(false);
                      setView({ type: "direct", userId: m.user_id, userName: m.full_name || "Membro" });
                    }}>
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold text-sm">{(m.full_name || "M").charAt(0)}</span>
                    </div>
                    <span className="text-sm font-medium">{m.full_name || "Membro"}</span>
                  </button>
                ))}
                {filteredMembers?.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Nenhum membro encontrado</p>}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Chat View
  const chatName = view.type === "group" ? view.groupName : view.userName;

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] md:h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-card">
        <Button variant="ghost" size="icon" onClick={() => setView({ type: "list" })}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          {view.type === "group" ? <Users className="h-4 w-4 text-primary" /> : <span className="text-primary font-bold text-sm">{chatName.charAt(0)}</span>}
        </div>
        <span className="font-semibold">{chatName}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {(!messages || messages.length === 0) && (
          <p className="text-center text-sm text-muted-foreground py-8">Nenhuma mensagem ainda. Diga olá! 👋</p>
        )}
        {messages?.map((msg) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[75%] rounded-2xl px-4 py-2", isMe ? "bg-primary text-primary-foreground" : "bg-muted")}>
                {!isMe && view.type === "group" && (
                  <p className="text-xs font-semibold mb-0.5 opacity-70">{(msg as any).senderName || "Membro"}</p>
                )}
                <p className="text-sm">{msg.content}</p>
                <p className={cn("text-xs mt-1", isMe ? "text-primary-foreground/60" : "text-muted-foreground")}>
                  {format(new Date(msg.created_at), "HH:mm")}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

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
