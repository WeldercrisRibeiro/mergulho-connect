import re
import sys

filepath = r'c:\Users\SURI - BEM 085\Documents\WELDER\DEV\ccmergulho\mergulho-connect\frontend\src\pages\Chat.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. State changes
code = code.replace(
    'const [clearingChat, setClearingChat] = useState(false);',
    'const [chatToDelete, setChatToDelete] = useState<{ type: "group" | "direct"; id: string; name?: string } | null>(null);'
)

# 2. Queries changes
# hiddenConvs
code = re.sub(
    r'  const \{ data: hiddenConvs \} = useQuery\(\{[\s\S]*?\}\);\s*',
    '',
    code
)
# conversations queryKey
code = code.replace(
    'queryKey: ["conversations", hiddenConvs]',
    'queryKey: ["conversations"]'
)
code = code.replace(
    'enabled: !!user && !!hiddenConvs,',
    'enabled: !!user,'
)

# remove hidden logic from conversations
conv_body_old = r'''        if (otherId && !convMap.has(otherId)) {
          const hidden = hiddenConvs?.find((h: any) => h.target_user_id === otherId);
          if (!isAdmin && hidden && new Date(msg.created_at) <= new Date(hidden.hidden_at)) return;

          convMap.set(otherId, {
            userId: otherId,
            name: profileMap.get(otherId) || "Membro",
            lastMessage: msg.content,
            time: msg.created_at,
            lastSenderId: msg.sender_id,
            isHiddenForMe: !!hidden,
          });
        }'''
conv_body_new = '''        if (otherId && !convMap.has(otherId)) {
          convMap.set(otherId, {
            userId: otherId,
            name: profileMap.get(otherId) || "Membro",
            lastMessage: msg.content,
            time: msg.created_at,
            lastSenderId: msg.sender_id,
          });
        }'''
code = code.replace(conv_body_old, conv_body_new)

# messages query
code = code.replace(
    'queryKey: ["messages", chatId, hiddenConvs],',
    'queryKey: ["messages", chatId],'
)
code = code.replace(
    'enabled: view.type !== "list" && !!user && !!hiddenConvs,',
    'enabled: view.type !== "list" && !!user,'
)

msg_body_old = r'''      const currentHidden = hiddenConvs?.find((h: any) =>
        (view.type === "group" && h.group_id === view.groupId) ||
        (view.type === "direct" && h.target_user_id === view.userId)
      );

      let filteredData = data;
      if (!isAdmin && currentHidden) {
        filteredData = data.filter((m: any) => new Date(m.created_at) > new Date(currentHidden.hidden_at));
      }

      const uids = new Set(filteredData.map((m: any) => m.sender_id));'''
msg_body_new = '''      let filteredData = data;
      const uids = new Set(filteredData.map((m: any) => m.sender_id));'''
code = code.replace(msg_body_old, msg_body_new)

msg_map_old = r'''      return filteredData.map((m: any) => ({
        ...m,
        senderName: map.get(m.sender_id),
        isVisuallyHidden: currentHidden && new Date(m.created_at) <= new Date(currentHidden.hidden_at)
      }));'''
msg_map_new = '''      return filteredData.map((m: any) => ({
        ...m,
        senderName: map.get(m.sender_id)
      }));'''
code = code.replace(msg_map_old, msg_map_new)

# 3. Mutations
mutations_new = '''  const deleteChatMutation = useMutation({
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
  });'''
code = re.sub(r'  const hideConversationMutation = useMutation[\s\S]*?toast\(\{ title: "Erro ao limpar"[\s\S]*?\}\);\s*', mutations_new + '\n\n', code)


# 4. List view group trash
list_group_trash_old = r'''<Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/40 hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); hideConversationMutation.mutate({ groupId: g.id }); }}>'''
list_group_trash_new = '''<Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/40 hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); setChatToDelete({ type: "group", id: g.id, name: g.name }); }}>'''
code = code.replace(list_group_trash_old, list_group_trash_new)

# 5. List view direct trash
list_direct_trash_old = r'''<Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/40 hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); hideConversationMutation.mutate({ targetUserId: conv.userId }); }}>'''
list_direct_trash_new = '''<Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/40 hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); setChatToDelete({ type: "direct", id: conv.userId, name: conv.name }); }}>'''
code = code.replace(list_direct_trash_old, list_direct_trash_new)

# 6. Header trash
header_trash_old = r'''<div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (view.type === "group") hideConversationMutation.mutate({ groupId: view.groupId });
              else if (view.type === "direct") hideConversationMutation.mutate({ targetUserId: view.userId });
              setView({ type: "list" });
            }}
            className="text-muted-foreground hover:text-destructive"
            title="Apagar conversa (visual)"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          {isAdmin && view.type === "group" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setClearingChat(true)}
              className="text-muted-foreground hover:text-destructive"
              title="Limpar Histórico (Todos)"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>'''
header_trash_new = '''<div className="flex items-center gap-1">
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
        </div>'''
code = code.replace(header_trash_old, header_trash_new)

# 7. Messages hidden flag UI
msg_ui_old = r'''                  <p className={cn("text-sm leading-relaxed", msg.isVisuallyHidden && "italic text-muted-foreground/60")}>
                    {msg.content}
                    {msg.isVisuallyHidden && <span className="ml-1 text-[9px] font-normal">(apagada)</span>}
                  </p>'''
msg_ui_new = '''                  <p className="text-sm leading-relaxed">
                    {msg.content}
                  </p>'''
code = code.replace(msg_ui_old, msg_ui_new)

# 8. Confirm Dialog
dialog_old = r'''      <ConfirmDialog
        open={clearingChat}
        title="Limpar Histórico"
        description="Isso apagará TODAS as mensagens deste grupo para TODOS os membros. Esta ação não pode ser desfeita."
        confirmLabel="Limpar Tudo"
        variant="danger"
        onConfirm={() => clearChatMutation.mutate()}
        onCancel={() => setClearingChat(false)}
      />'''
dialog_new = '''      <ConfirmDialog
        open={!!chatToDelete}
        title={`Excluir ${chatToDelete?.type === "group" ? "Grupo" : "Conversa"}`}
        description={`Isso excluirá DEFINITIVAMENTE todas as mensagens ${chatToDelete?.type === "group" ? "deste grupo" : "desta conversa"} para TODOS os participantes. Ação irreversível!`}
        confirmLabel="Excluir Tudo"
        variant="danger"
        onConfirm={() => { if (chatToDelete) deleteChatMutation.mutate(chatToDelete); }}
        onCancel={() => setChatToDelete(null)}
      />'''
code = code.replace(dialog_old, dialog_new)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS")
