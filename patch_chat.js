const fs = require('fs');

const file = process.argv[2];
let content = fs.readFileSync(file, 'utf8');

// 1. Imports
content = content.replace('import { supabase } from "@/integrations/supabase/client";', 'import api from "@/lib/api";\\nimport { io } from "socket.io-client";');

// 2. my-groups queryFn
content = content.replace(
  /queryFn: async \(\) => {[\s\S]+?const { data: memberGroups } = await supabase[\s\S]+?\.from\("member_groups"\)[\s\S]+?\.select\("group_id, groups\(id, name, icon\)"\)[\s\S]+?\.eq\("user_id", user!\.id\);[\s\S]+?return memberGroups\?\.map\(\(mg\) => mg\.groups\)\.filter\(Boolean\) \|\| \[\];[\s\S]+?}/,
  `queryFn: async () => {
      // Actually /member-groups returns { groupId, role, group: { id, name, icon } }
      const { data } = await api.get('/member-groups');
      return data?.map((mg: any) => mg.group).filter(Boolean) || [];
    }`
);

// 3. members-for-dm queryFn
content = content.replace(
  /queryFn: async \(\) => {[\s\S]+?const { data } = await supabase\.from\("profiles"\)\.select\("user_id, full_name"\)\.order\("full_name"\);[\s\S]+?return \(data \|\| \[\]\)\.filter\(\(m\) => m\.user_id !== user!\.id\);[\s\S]+?}/,
  `queryFn: async () => {
      const { data } = await api.get('/profiles');
      return (data || []).map((m: any) => ({ user_id: m.userId, full_name: m.fullName })).filter((m: any) => m.user_id !== user!.id);
    }`
);

// 4. conversations queryFn
content = content.replace(
  /queryFn: async \(\) => {[\s\S]+?const { data } = await supabase[\s\S]+?\.from\("messages"\)[\s\S]+?\.select\("\*"\)[\s\S]+?\.or\(\`sender_id\.eq\.\$\{user!\.id\},recipient_id\.eq\.\$\{user!\.id\}\`\)[\s\S]+?\.is\("group_id", null\)[\s\S]+?\.order\("created_at", \{ ascending: false \}\);[\s\S]+?const userIds = new Set<string>\(\);[\s\S]+?data\?\.forEach\(\(msg\) => {[\s\S]+?if \(msg\.sender_id !== user!\.id\) userIds\.add\(msg\.sender_id\);[\s\S]+?if \(msg\.recipient_id && msg\.recipient_id !== user!\.id\) userIds\.add\(msg\.recipient_id\);[\s\S]+?}\);[\s\S]+?if \(userIds\.size === 0\) return \[\];[\s\S]+?const { data: profiles } = await supabase[\s\S]+?\.from\("profiles"\)[\s\S]+?\.select\("user_id, full_name"\)[\s\S]+?\.in\("user_id", Array\.from\(userIds\)\);[\s\S]+?const profileMap = new Map\(profiles\?\.map\(\(p\) => \[p\.user_id, p\.full_name\]\) \|\| \[\]\);[\s\S]+?const convMap = new Map<string, any>\(\);[\s\S]+?data\?\.forEach\(\(msg\) => {[\s\S]+?const otherId = msg\.sender_id === user!\.id \? msg\.recipient_id : msg\.sender_id;[\s\S]+?if \(otherId && !convMap\.has\(otherId\)\) {[\s\S]+?convMap\.set\(otherId, {[\s\S]+?userId: otherId,[\s\S]+?name: profileMap\.get\(otherId\) \|\| "Membro",[\s\S]+?lastMessage: msg\.content,[\s\S]+?time: msg\.created_at,[\s\S]+?lastSenderId: msg\.sender_id,[\s\S]+?}\);[\s\S]+?}[\s\S]+?}\);[\s\S]+?return Array\.from\(convMap\.values\(\)\);[\s\S]+?}/,
  `queryFn: async () => {
      const { data } = await api.get(\`/messages/user/\${user!.id}\`);
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
    }`
);

// 5. group-last-messages queryFn
content = content.replace(
  /queryFn: async \(\) => {[\s\S]+?if \(!groups \|\| \(groups as any\[\]\)\.length === 0\) return {};[\s\S]+?const groupIds = \(groups as any\[\]\)\.map\(\(g: any\) => g\?\.id\)\.filter\(Boolean\);[\s\S]+?const { data } = await supabase[\s\S]+?\.from\("messages"\)[\s\S]+?\.select\("group_id, sender_id, created_at"\)[\s\S]+?\.in\("group_id", groupIds\)[\s\S]+?\.neq\("sender_id", user!\.id\)[\s\S]+?\.order\("created_at", { ascending: false }\);[\s\S]+?const result: Record<string, { time: string; senderId: string }> = {};[\s\S]+?data\?\.forEach\(\(m: any\) => {[\s\S]+?if \(m\.group_id && !result\[m\.group_id\]\) {[\s\S]+?result\[m\.group_id\] = { time: m\.created_at, senderId: m\.sender_id };[\s\S]+?}[\s\S]+?}\);[\s\S]+?return result;[\s\S]+?}/,
  `queryFn: async () => {
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
    }`
);

// 6. messages queryFn
content = content.replace(
  /queryFn: async \(\) => {[\s\S]+?let query = supabase[\s\S]+?\.from\("messages"\)[\s\S]+?\.select\("\*"\)[\s\S]+?\.order\("created_at", { ascending: true }\);[\s\S]+?if \(view\.type === "group"\) {[\s\S]+?query = query\.eq\("group_id", view\.groupId\);[\s\S]+?} else if \(view\.type === "direct"\) {[\s\S]+?query = query[\s\S]+?\.is\("group_id", null\)[\s\S]+?\.or\([\s\S]+?\`and\(sender_id\.eq\.\$\{user!\.id\},recipient_id\.eq\.\$\{view\.userId\}\),and\(sender_id\.eq\.\$\{view\.userId\},recipient_id\.eq\.\$\{user!\.id\}\)\`[\s\S]+?\);[\s\S]+?}[\s\S]+?const { data } = await query;[\s\S]+?if \(!data\) return \[\];[\s\S]+?let filteredData = data;[\s\S]+?const uids = new Set\(filteredData\.map\(\(m: any\) => m\.sender_id\)\);[\s\S]+?let map = new Map\(\);[\s\S]+?if \(uids\.size > 0\) {[\s\S]+?const { data: profs } = await supabase[\s\S]+?\.from\("profiles"\)[\s\S]+?\.select\("user_id, full_name"\)[\s\S]+?\.in\("user_id", Array\.from\(uids\)\);[\s\S]+?map = new Map\(profs\?\.map\(\(p: any\) => \[p\.user_id, p\.full_name\]\) \|\| \[\]\);[\s\S]+?}[\s\S]+?return filteredData\.map\(\(m: any\) => \({[\s\S]+?\.\.\.m,[\s\S]+?senderName: map\.get\(m\.sender_id\)[\s\S]+?}\)\);[\s\S]+?}/,
  `queryFn: async () => {
      const isGroup = view.type === "group";
      const idStr = isGroup ? (view as any).groupId : (view as any).userId;
      
      const { data } = await api.get(\`/messages/chat/\${idStr}\`, { params: { isGroup, userId: user!.id } });
      
      return (data || []).map((m: any) => ({
        ...m,
        id: m.id,
        content: m.content,
        created_at: m.createdAt,
        sender_id: m.senderId,
        recipient_id: m.recipientId,
        group_id: m.groupId,
        senderName: m.sender?.profile?.fullName || "Membro"
      }));
    }`
);

// 7. Global realtime setup with Socket.io
content = content.replace(
  /useEffect\(\(\) => {[\s\S]+?if \(!user\) return;[\s\S]+?const channel = supabase[\s\S]+?\.channel\("global-chat-notifications"\)[\s\S]+?\.on\([\s\S]+?"postgres_changes",[\s\S]+?{ event: "INSERT", schema: "public", table: "messages" },[\s\S]+?handleNewMessage[\s\S]+?\)[\s\S]+?\.subscribe\(\);[\s\S]+?return \(\) => { supabase\.removeChannel\(channel\); };[\s\S]+?}, \[user, handleNewMessage\]\);/,
  `useEffect(() => {
    if (!user) return;
    const WS_URL = import.meta.env.VITE_API_URL?.replace('http', 'ws') || "ws://localhost:3001";
    const socket = io(WS_URL + "/chat");
    socket.on("new_message", (payload: any) => {
      // payload structure emitted from Nest is { new: message_obj_in_camelCase }
      const newMsg = payload.new;
      handleNewMessage({
        new: {
          id: newMsg.id,
          content: newMsg.content,
          created_at: newMsg.createdAt,
          sender_id: newMsg.senderId,
          recipient_id: newMsg.recipientId,
          group_id: newMsg.groupId
        }
      });
    });
    return () => { socket.disconnect(); };
  }, [user, handleNewMessage]);`
);


// 8. sendMutation
content = content.replace(
  /mutationFn: async \(content: string\) => {[\s\S]+?const payload: any = { sender_id: user!\.id, content };[\s\S]+?if \(view\.type === "group"\) payload\.group_id = view\.groupId;[\s\S]+?else if \(view\.type === "direct"\) payload\.recipient_id = view\.userId;[\s\S]+?const { error } = await supabase\.from\("messages"\)\.insert\(payload\);[\s\S]+?if \(error\) throw error;[\s\S]+?},/,
  `mutationFn: async (content: string) => {
      const payload: any = { senderId: user!.id, content };
      if (view.type === "group") payload.groupId = view.groupId;
      else if (view.type === "direct") payload.recipientId = view.userId;
      
      await api.post("/messages", payload);
    },`
);

// 9. deleteChatMutation
content = content.replace(
  /mutationFn: async \(\{ type, id \}: \{ type: "group" \| "direct"; id: string \}\) => {[\s\S]+?if \(type === "group"\) {[\s\S]+?const { error } = await supabase\.from\("messages"\)\.delete\(\)\.eq\("group_id", id\);[\s\S]+?if \(error\) throw error;[\s\S]+?} else {[\s\S]+?const { error } = await supabase[\s\S]+?\.from\("messages"\)[\s\S]+?\.delete\(\)[\s\S]+?\.is\("group_id", null\)[\s\S]+?\.or\(\`and\(sender_id\.eq\.\$\{user!\.id\},recipient_id\.eq\.\$\{id\}\),and\(sender_id\.eq\.\$\{id\},recipient_id\.eq\.\$\{user!\.id\}\)\`\);[\s\S]+?if \(error\) throw error;[\s\S]+?}[\s\S]+?},/,
  `mutationFn: async ({ type, id }: { type: "group" | "direct"; id: string }) => {
      if (type === "group") {
        await api.delete(\`/messages/group/\${id}\`);
      } else {
        await api.delete(\`/messages/direct/\${user!.id}/\${id}\`);
      }
    },`
);


fs.writeFileSync(file, content);
console.log("Chat patched successfully");
