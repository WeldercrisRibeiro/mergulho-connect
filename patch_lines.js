const fs = require('fs');
const file = process.argv[2];
let lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);

// Remove old import if present, though it was probably removed
let importIdx = lines.findIndex(l => l.includes('import { supabase } from "@/integrations/supabase/client"'));
if (importIdx !== -1) {
  lines[importIdx] = 'import api from "@/lib/api";';
}

// member-groups
let mgIdx = lines.findIndex(l => l.includes("return data?.map(m => m.group_id) || [];"));
if (mgIdx !== -1) {
  lines[mgIdx] = "      return data?.map((m: any) => m.groupId) || [];";
}

// groups
let grpDel1 = lines.findIndex(l => l.includes("/* data loaded above */"));
if (grpDel1 !== -1) {
  lines.splice(grpDel1, 2); // remove that and "return data || [];"
  lines.splice(grpDel1, 0, "      return filtered || [];");
}

// events
let eGrpFilter = lines.findIndex(l => l.includes('const groupFilter = userGroupIds.length > 0 ?'));
if (eGrpFilter !== -1) {
  lines.splice(eGrpFilter, 1); // remove the groupFilter const line
}
let evDel1 = lines.findIndex(l => l.includes("const { data, error } = await query;"));
if (evDel1 !== -1) {
  // remove 3 lines: const {data..., if (error)..., return data
  lines.splice(evDel1, 3);
  lines.splice(evDel1, 0, `      return filtered.map((e: any) => ({
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
      })).sort((a: any, b: any) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());`);
}

// Replace regs list loading
let regIdx = lines.findIndex(l => l.includes('const { data: regs } = await (supabase as any)'));
if (regIdx !== -1) {
  let nextLines = 0;
  while (!lines[regIdx + nextLines].includes('eq("event_id", event.id);')) {
    nextLines++;
  }
  lines.splice(regIdx, nextLines + 1);
  lines.splice(regIdx, 0, '        const { data: regs } = await api.get(`/event-registrations`, { params: { eventId: event.id } });');
}

let profIdx = lines.findIndex(l => l.includes('const { data } = await supabase.from("profiles").select("user_id, full_name").order("full_name");'));
if (profIdx !== -1) {
  lines[profIdx] = '        const { data } = await api.get("/profiles");';
}

fs.writeFileSync(file, lines.join('\n'));
console.log("Line replacements done.");
