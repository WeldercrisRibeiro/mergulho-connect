const fs = require('fs');

const file = process.argv[2];
let content = fs.readFileSync(file, 'utf8');

const reps = [
  ['import { supabase } from "@/integrations/supabase/client";', 'import api from "@/lib/api";'],
  
  // member_groups
  ['await supabase.from("member_groups").select("group_id").eq("user_id", user?.id);', "await api.get('/member-groups');"],
  ['return data?.map(m => m.group_id) || [];', 'return data?.map(m => m.groupId) || [];'],
  
  // groups
  ['const query = supabase.from("groups").select("*");', "const { data } = await api.get('/groups');\n      let filtered = data || [];"],
  ['query.in("id", userGroups);', "filtered = filtered.filter(g => userGroups.includes(g.id));"],
  ['const { data } = await query;', "/* data loaded above */"],
  ['return data || [];', "return filtered || [];"],

  // events
  [
    `let query = (supabase as any)
        .from("events")
        .select("*, event_rsvps(*), event_checkins(*), event_registrations(*), groups(name)")
        .order("event_date", { ascending: true });`,
    `const { data } = await api.get('/events');
      let filtered = data || [];`
  ],
  [
    `query = query.eq("group_id", filter);`,
    `filtered = filtered.filter((e: any) => e.groupId === filter);`
  ],
  [
    `query = query.or(\`is_general.eq.true\${groupFilter ? \`,\${groupFilter}\` : ""}\`);`,
    `filtered = filtered.filter((e: any) => e.isGeneral || userGroupIds.includes(e.groupId));`
  ],
  [
    `const { data, error } = await query;
      if (error) throw error;
      return data || [];`,
    `return filtered.map((e: any) => ({
        ...e,
        event_date: e.eventDate,
        is_general: e.isGeneral,
        group_id: e.groupId,
        event_type: e.eventType,
        banner_url: e.bannerUrl,
        pix_key: e.pixKey,
        pix_qrcode_url: e.pixQrcodeUrl,
        map_url: e.mapUrl,
        require_checkin: e.requireCheckin,
        is_public: e.isPublic,
        checkin_qr_secret: e.checkinQrSecret,
        event_rsvps: (e.rsvps || []).map((r: any) => ({ ...r, user_id: r.userId })),
        event_checkins: (e.checkins || []).map((c: any) => ({ ...c, user_id: c.userId })),
        event_registrations: (e.registrations || []).map((c: any) => ({ ...c, user_id: c.userId, payment_status: c.paymentStatus })),
        groups: e.group,
      })).sort((a: any, b: any) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());`
  ],

  // RSVP insert
  [
    `const { error } = await supabase.from("event_rsvps").upsert(
        { event_id: eventId, user_id: user!.id, status },
        { onConflict: "event_id,user_id" }
      );
      if (error) throw error;`,
    `await api.post('/event-rsvps', { eventId, userId: user!.id, status });`
  ],

  // Registrations insert
  [
    `const { error } = await (supabase as any).from("event_registrations").upsert(
        { event_id: eventId, user_id: user?.id, payment_status: "pending" },
        { onConflict: "event_id,user_id" }
      );
      if (error) throw error;`,
    `await api.post('/event-registrations', { eventId, userId: user?.id, paymentStatus: "pending" });`
  ],

  // Cancel Registrations delete
  [
    `await (supabase as any).from("event_checkins").delete().eq("event_id", eventId).eq("user_id", user?.id);
      const { error } = await (supabase as any).from("event_registrations").delete().eq("event_id", eventId).eq("user_id", user?.id);
      if (error) throw error;`,
    `await api.delete('/event-registrations', { params: { eventId, userId: user?.id } });
      await api.delete('/event-checkins', { params: { eventId, userId: user?.id } }).catch(()=>{});`
  ],

  // Mutations Events - Delete
  [
    `const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;`,
    `await api.delete(\`/events/\${id}\`);`
  ],
  
  // Updates Event Checkins (way down in file)
  [
    `const { error } = await (supabase as any).from("event_checkins").insert(`,
    `await api.post("/event-checkins", `
  ],

  // Get Registration List
  [
    `const { data: regs } = await (supabase as any)
          .from("event_registrations")
          .select("id, user_id, payment_status, created_at, profiles(full_name)")
          .eq("event_id", event.id);`,
    `const { data: regs } = await api.get(\`/event-registrations\`, { params: { eventId: event.id } });`
  ],
  [
    `const { data } = await supabase.from("profiles").select("user_id, full_name").order("full_name");`,
    `const { data } = await api.get('/profiles');`
  ],
  [
    `await (supabase as any).from("event_registrations").update({ payment_status: status }).eq("id", id);`,
    `await api.patch(\`/event-registrations/\${id}\`, { paymentStatus: status });`
  ]
];

for (const [from, to] of reps) {
  const normFrom = from.replace(/\\r\\n/g, '\\n');
  
  // Custom smart replace: ignore varying amounts of whitespace/newlines between words
  const regexStr = normFrom.split('').map(c => 
    /\s/.test(c) ? '\\s+' : '[' + c.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\$&') + ']'
  ).join('');

  const regex = new RegExp(regexStr.replace(/(\\s\+)+/g, '\\s+'), 'g');
  
  if (!regex.test(content)) {
    console.log("NOT FOUND:", from.substring(0, 80));
  } else {
    content = content.replace(regex, to);
  }
}

// Final big block replace for SaveMutation payload
content = content.replace(
  /const payload = {[\s\S]+?};[\s\S]+?if \(editingEvent\) {[\s\S]+?const { error } = await \(supabase as any\)\.from\("events"\)\.update\(payload\)\.eq\("id", editingEvent\.id\);[\s\S]+?if \(error\) throw error;[\s\S]+?} else {[\s\S]+?const { error } = await \(supabase as any\)\.from\("events"\)\.insert\(payload\);[\s\S]+?if \(error\) throw error;[\s\S]+?}/g,
  `const camelPayload = {
        title,
        description: desc,
        eventDate: date ? new Date(date).toISOString() : null,
        location,
        isGeneral: isGeneral === "true",
        groupId: isGeneral === "false" && groupId ? groupId : null,
        createdBy: user?.id,
        eventType,
        bannerUrl: bannerUrl.trim() || null,
        speakers: speakers.trim() || null,
        price: price || 0,
        pixKey: pixKey.trim() || null,
        pixQrcodeUrl: pixQrcodeUrl.trim() || null,
        mapUrl: mapUrl.trim() || null,
        requireCheckin,
        isPublic,
        checkinQrSecret: requireCheckin ? (editingEvent?.checkinQrSecret || generateSafeId()) : null,
      };
      if (editingEvent) {
        await api.patch(\`/events/\${editingEvent.id}\`, camelPayload);
      } else {
        await api.post('/events', camelPayload);
      }`
);

fs.writeFileSync(file, content);
console.log("DONE");
