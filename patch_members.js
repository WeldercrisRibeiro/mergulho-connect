const fs = require('fs');

const file = process.argv[2];
let lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);

// Remove old import if present
let importIdx = lines.findIndex(l => l.includes('import { supabase } from "@/integrations/supabase/client"'));
if (importIdx !== -1) {
  lines[importIdx] = 'import api from "@/lib/api";';
}

// 1. replace in allGroups queryFn
let allGroupsQueryFnStart = lines.findIndex(l => l.includes('const { data: allGroups } = useQuery({'));
if (allGroupsQueryFnStart !== -1) {
  let gStart = lines.findIndex((l, i) => i > allGroupsQueryFnStart && l.includes('const { data } = await supabase.from("groups").select("id, name");'));
  if (gStart !== -1) {
    lines[gStart] = '      const { data } = await api.get("/groups");';
  }
}

// 2. replace in members queryFn
let membersQueryStart = lines.findIndex(l => l.includes('const { data: members } = useQuery({'));
if (membersQueryStart !== -1) {
  let pIdx = lines.findIndex((l, i) => i > membersQueryStart && l.includes('const { data: profiles } = await supabase.from("profiles").select("*").order("full_name", { ascending: true });'));
  if (pIdx !== -1) lines[pIdx] = `      const { data: profiles } = await api.get("/profiles");`;

  let rIdx = lines.findIndex((l, i) => i > membersQueryStart && l.includes('const { data: roles } = await supabase.from("user_roles").select("user_id, role");'));
  if (rIdx !== -1) lines[rIdx] = `      const { data: roles } = await api.get("/user-roles");`;

  let mgIdx1 = lines.findIndex((l, i) => i > membersQueryStart && l.includes('      const { data: memberGroupsData } = await supabase'));
  if (mgIdx1 !== -1) {
    lines.splice(mgIdx1, 3, "      const { data: memberGroupsData } = await api.get('/member-groups');");
  }

  // adapt mapping
  let retIdx = lines.findIndex((l, i) => i > membersQueryStart && l.includes('return (profiles || []).map((p) => ({'));
  if (retIdx !== -1) {
    // We rewrite the return block to use camelCase matches
    let endIdx = retIdx + 11;
    lines.splice(retIdx, 12, `      return (profiles || []).map((p: any) => ({
        ...p,
        full_name: p.fullName,
        user_id: p.userId,
        whatsapp_phone: p.whatsappPhone,
        avatar_url: p.avatarUrl,
        roles: (roles || []).filter((r: any) => r.userId === p.userId),
        groups: (memberGroupsData || [])
          .filter((mg: any) => mg.userId === p.userId)
          .map((mg: any) => mg.group?.name)
          .filter(Boolean),
        group_ids: (memberGroupsData || [])
          .filter((mg: any) => mg.userId === p.userId)
          .map((mg: any) => ({ id: mg.groupId, role: mg.role || "member" })),
      }));`);
  }
}

// 3. updateMutation
let updateMutationStart = lines.findIndex(l => l.includes('const updateMutation = useMutation({'));
if (updateMutationStart !== -1) {
  let targetEnd = lines.findIndex((l, i) => i > updateMutationStart && l.includes('onSuccess: () => {'));
  if (targetEnd !== -1) {
    lines.splice(updateMutationStart + 1, targetEnd - updateMutationStart - 1, `    mutationFn: async () => {
      if (!editingMember) return;
      const phoneDigits = editPhone.replace(/\\D/g, "");
      const cleanUsername = (editUsername || "").trim().toLowerCase().replace("@ccmergulho.com", "").replace(/\\s+/g, ".") || phoneDigits;
      const email = cleanUsername + "@ccmergulho.com";
      await api.patch(\`/admin/users/\${editingMember.user_id}\`, {
        email, fullName: editName, whatsappPhone: editPhone, username: cleanUsername, role: editRole, groups: selectedGroups
      });
    },
    `);
  }
}

// 4. createMutation
let createMutationStart = lines.findIndex(l => l.includes('const createMutation = useMutation({'));
if (createMutationStart !== -1) {
  let targetEnd = lines.findIndex((l, i) => i > createMutationStart && l.includes('onSuccess: () => {'));
  if (targetEnd !== -1) {
    lines.splice(createMutationStart + 1, targetEnd - createMutationStart - 1, `    mutationFn: async () => {
      const phoneDigits = editPhone.replace(/\\D/g, "");
      const cleanUsername = (editUsername || "").trim().toLowerCase().replace(/\\s+/g, ".") || phoneDigits;
      const email = cleanUsername + "@ccmergulho.com";
      await api.post(\`/admin/users\`, {
        email, fullName: editName, whatsappPhone: editPhone, username: cleanUsername, role: editRole, groups: selectedGroups, password: "123456"
      });
    },
    `);
  }
}

// 5. deleteMutation
let deleteMutationStart = lines.findIndex(l => l.includes('const deleteMutation = useMutation({'));
if (deleteMutationStart !== -1) {
  let targetEnd = lines.findIndex((l, i) => i > deleteMutationStart && l.includes('onSuccess: () => {'));
  if (targetEnd !== -1) {
    lines.splice(deleteMutationStart + 1, targetEnd - deleteMutationStart - 1, `    mutationFn: async (m: any) => {
      await api.delete(\`/admin/users/\${m.user_id}\`);
    },
    `);
  }
}

// 6. resetPasswordMutation
let resetMutationStart = lines.findIndex(l => l.includes('const resetPasswordMutation = useMutation({'));
if (resetMutationStart !== -1) {
  let targetEnd = lines.findIndex((l, i) => i > resetMutationStart && l.includes('onSuccess: () => {'));
  if (targetEnd !== -1) {
    lines.splice(resetMutationStart + 1, targetEnd - resetMutationStart - 1, `    mutationFn: async (m: any) => {
      await api.post(\`/admin/users/\${m.user_id}/reset-password\`, { password: "123456" });
    },
    `);
  }
}

fs.writeFileSync(file, lines.join('\\n'));
console.log("Line replacements done.");
