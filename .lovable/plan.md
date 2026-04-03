

## CC Mergulho — Full MVP Plan

### 🎨 Design System
- **Colors**: Baby Blue (`#89CFF0`), Cyan (`#00BCD4`), White (`#FFFFFF`), with dark text for contrast
- **Style**: Clean, modern neomorphism-inspired with soft shadows and rounded corners
- **Typography**: Clean sans-serif (Inter), friendly and readable

---

### Phase 1: Landing Page & Auth
1. **Landing Page** with hero section ("Bem-vindo ao MergulhoApp"), about section, features overview, and CTA to login/register
2. **Authentication** via Lovable Cloud — email/password signup and login
3. **User profiles table** with name, phone (WhatsApp), avatar photo, and role (member/admin)
4. **Role system** — separate `user_roles` table for admin/member distinction

### Phase 2: Groups & Members
5. **Groups table** — id, name, description, icon
6. **Member-group relationship** (many-to-many) so members can belong to multiple groups (Louvor, Mídia, Acolhimento, Mulheres, Homens, Voluntários)
7. **Member directory page** — search/filter members, view profiles
8. **Admin panel** — create/edit groups, manage members, assign roles

### Phase 3: Events & Agenda
9. **Events table** — title, date, time, location, type (general or group-specific), description
10. **Events calendar page** with filters: "Todos" and by group
11. **RSVP system** — confirm/decline attendance with admin-visible attendance list
12. **Group-specific events** visible only to members of that group

### Phase 4: Devotionals
13. **Devotionals table** — title, content (rich text), media URL, publish date, status (draft/scheduled/published)
14. **Devotional feed page** — chronological feed with text and video embeds
15. **Admin scheduling** — create devotionals with future publish dates, auto-publish

### Phase 5: Communication
16. **Chat system** using Supabase real-time — direct messages between members
17. **Group chats** auto-created for each group
18. **WhatsApp deep links** — important announcements include a "Share on WhatsApp" button that opens `wa.me` with pre-formatted message

### Navigation & Layout
- **Bottom tab navigation** (mobile-friendly): Home, Agenda, Devocionais, Chat, Perfil
- **Sidebar navigation** on desktop
- **Admin section** accessible only to admin-role users

