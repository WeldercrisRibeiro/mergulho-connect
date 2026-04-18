const fs = require('fs');

const file = process.argv[2];
let lines = fs.readFileSync(file, 'utf8').split(/\\r?\\n/);

let importIdx = lines.findIndex(l => l.includes('import { supabase }'));
if (importIdx !== -1) {
  lines.splice(importIdx, 1, 'import api from "@/lib/api";', 'import { io } from "socket.io-client";');
}

// 1. my-groups
let groupsFn = lines.findIndex(l => l.includes('const { data: memberGroups } = await supabase'));
if (groupsFn !== -1 && lines[groupsFn + 1].includes('from("member_groups")')) {
  lines.splice(groupsFn, 4, 
    "      const { data } = await api.get('/member-groups');",
    "      return data?.map((mg: any) => mg.group).filter(Boolean) || [];"
  );
}

// 2. members-for-dm
let membersFn = lines.findIndex((l, i) => i > 100 && l.includes('const { data } = await supabase.from("profiles")'));
if (membersFn !== -1) {
  lines.splice(membersFn, 2, 
    "      const { data } = await api.get('/profiles');",
    "      return (data || []).map((m: any) => ({ user_id: m.userId, full_name: m.fullName })).filter((m: any) => m.user_id !== user!.id);"
  );
}

// 3. conversations
let convStart = lines.findIndex(l => l.includes('const { data: conversations } = useQuery({'));
if (convStart !== -1) {
  let innerQueryStart = lines.findIndex((l, i) => i > convStart && l.includes('const { data } = await supabase'));
  if (innerQueryStart !== -1) {
    let returnIdx = lines.findIndex((l, i) => i > innerQueryStart && l.includes('return Array.from(convMap.values());'));
    
    // Replace the huge block
    lines.splice(innerQueryStart, (returnIdx - innerQueryStart) + 1, 
      "      const { data } = await api.get(`/messages/user/${user!.id}`);",
      "      const convMap = new Map<string, any>();",
      "      (data || []).forEach((msg: any) => {",
      "        const otherId = msg.senderId === user!.id ? msg.recipientId : msg.senderId;",
      "        const otherProfile = msg.senderId === user!.id ? msg.recipient?.profile : msg.sender?.profile;",
      "        if (otherId && !convMap.has(otherId)) {",
      "          convMap.set(otherId, {",
      "            userId: otherId,",
      "            name: otherProfile?.fullName || \"Membro\",",
      "            lastMessage: msg.content,",
      "            time: msg.createdAt,",
      "            lastSenderId: msg.senderId,",
      "          });",
      "        }",
      "      });",
      "      return Array.from(convMap.values());"
    );
  }
}

// 4. group-last-messages
let grpMsgStart = lines.findIndex(l => l.includes('const { data: groupLastMessages } = useQuery({'));
if (grpMsgStart !== -1) {
  let sStart = lines.findIndex((l, i) => i > grpMsgStart && l.includes('const { data } = await supabase'));
  let endFn = lines.findIndex((l, i) => i > sStart && l.includes('return result;'));
  if (sStart !== -1) {
    lines.splice(sStart, (endFn - sStart) + 1,
      "      const { data } = await api.get('/messages/group-messages', { params: { groupIds: groupIds.join(','), excludeUserId: user!.id }});",
      "      const result: Record<string, { time: string; senderId: string }> = {};",
      "      data?.forEach((m: any) => {",
      "        if (m.groupId && !result[m.groupId]) {",
      "          result[m.groupId] = { time: m.createdAt, senderId: m.senderId };",
      "        }",
      "      });",
      "      return result;"
    );
  }
}

// 5. messages
let msgStart = lines.findIndex(l => l.includes('const { data: messages } = useQuery({'));
if (msgStart !== -1) {
  let innerStart = lines.findIndex((l, i) => i > msgStart && l.includes('let query = supabase'));
  let retEnd = lines.findIndex((l, i) => i > innerStart && l.includes('return filteredData.map'));
  // retEnd spans multiple lines, so find the end of it
  let blockEnd = lines.findIndex((l, i) => i > retEnd && l.includes('}));'));
  
  if (innerStart !== -1) {
    lines.splice(innerStart, (blockEnd - innerStart) + 1,
      "      const isGroup = view.type === 'group';",
      "      const idStr = isGroup ? (view as any).groupId : (view as any).userId;",
      "      const { data } = await api.get(`/messages/chat/${idStr}`, { params: { isGroup, userId: user!.id } });",
      "      ",
      "      return (data || []).map((m: any) => ({",
      "        ...m,",
      "        id: m.id,",
      "        content: m.content,",
      "        created_at: m.createdAt,",
      "        sender_id: m.senderId,",
      "        recipient_id: m.recipientId,",
      "        group_id: m.groupId,",
      "        senderName: m.sender?.profile?.fullName || \"Membro\"",
      "      }));"
    );
  }
}

// 6. realtime channel
let realtimeStart = lines.findIndex(l => l.includes('const channel = supabase'));
if (realtimeStart !== -1) {
  let subEnd = lines.findIndex((l, i) => i > realtimeStart && l.includes('return () => { supabase.removeChannel(channel); };'));
  
  lines.splice(realtimeStart, (subEnd - realtimeStart) + 1,
    "    const WS_URL = import.meta.env.VITE_API_URL?.replace('http', 'ws') || 'ws://localhost:3001';",
    "    const socket = io(WS_URL + '/chat');",
    "    socket.on('new_message', (payload: any) => {",
    "      const newMsg = payload.new;",
    "      handleNewMessage({",
    "        new: {",
    "          id: newMsg.id,",
    "          content: newMsg.content,",
    "          created_at: newMsg.createdAt,",
    "          sender_id: newMsg.senderId,",
    "          recipient_id: newMsg.recipientId,",
    "          group_id: newMsg.groupId",
    "        }",
    "      });",
    "    });",
    "    return () => { socket.disconnect(); };"
  );
}

// 7. sendMutation
let sendMutStart = lines.findIndex(l => l.includes('const sendMutation = useMutation({'));
if (sendMutStart !== -1) {
  let bodyStart = lines.findIndex((l, i) => i > sendMutStart && l.includes('const payload: any = { sender_id: user!.id, content };'));
  if (bodyStart !== -1) {
    lines.splice(bodyStart, 4,
      "      const payload: any = { senderId: user!.id, content };",
      "      if (view.type === 'group') payload.groupId = view.groupId;",
      "      else if (view.type === 'direct') payload.recipientId = view.userId;",
      "      await api.post('/messages', payload);"
    );
  }
}

// 8. deleteChatMutation
let delMutStart = lines.findIndex(l => l.includes('const deleteChatMutation = useMutation({'));
if (delMutStart !== -1) {
  let bStart = lines.findIndex((l, i) => i > delMutStart && l.includes('if (type === "group") {'));
  let bEnd = lines.findIndex((l, i) => i > bStart && l.includes(')')); 
  // actually bEnd might be hard to guess, let's look for "if (error) throw error;" two lines down
  // or let's use exact line offsets since we know the structure:
  // if (type === "group") {
  //   const { error } = await supabase.from("messages").delete().eq("group_id", id);
  //   if (error) throw error;
  // } else {
  //   const { error } = await supabase
  //     .from("messages")
  //     .delete()
  //     .is("group_id", null)
  //     .or(`and(sender_id.eq.${user!.id},recipient_id.eq.${id}),and(sender_id.eq.${id},recipient_id.eq.${user!.id})`);
  //   if (error) throw error;
  // }
  
  // finding closing } } is safe:
  let closeIdx = bStart;
  while (!lines[closeIdx].includes('},') && closeIdx < lines.length) closeIdx++;
  
  lines.splice(bStart, closeIdx - bStart,
    "      if (type === 'group') {",
    "        await api.delete(`/messages/group/${id}`);",
    "      } else {",
    "        await api.delete(`/messages/direct/${user!.id}/${id}`);",
    "      }"
  );
}

fs.writeFileSync(file, lines.join('\\n'));
console.log("Chat patched safely.");
