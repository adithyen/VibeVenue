// scripts/seedEvents.js — Seed Rich Multi-Track Events for Tomorrow & Upcoming Days
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yrvijufespplklfnvsfg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlydmlqdWZlc3BwbGtsZm52c2ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMTU1ODUsImV4cCI6MjEwMjg5MTU4NX0.pM5B-ojiP3TCmK_nTQsTbAZoz_w6lTAVwdreh_Gybhc';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TOMORROW_EVENT = {
  name: "NEURALHACK '26 — National AI & Autonomous Agents Buildathon",
  tagline: "36-Hour National Autonomous Agents & Generative AI Hackathon",
  description: `# Welcome to NEURALHACK '26 ⚡

NEURALHACK is South India's premier autonomous agent and Generative AI hackathon hosted at **SCTCE Campus, Trivandrum**. 

### 🚀 Hackathon Tracks:
1. **Autonomous AI Agents & Multi-Agent Swarms**
2. **Generative Multi-Modal Systems & Voice AI**
3. **Decentralized AI & On-Device Edge Models**
4. **Smart Campus & Assistive Robotics**

### 🏆 Prizes & Perks:
- **₹1,00,000+ Prize Pool** + Cloud GPU credits for all finalists.
- High-speed 1Gbps Dedicated Fiber Wi-Fi across all lab bays.
- Overnight stay accommodation, meals, midnight refreshments, and official swag kits provided.

### 📅 Schedule Overview:
- **Day 1 (23 Aug 2026)**: Registration & Check-In at 09:00 AM, Keynote & Problem reveal at 10:00 AM, Hacking starts at 11:00 AM.
- **Day 2 (24 Aug 2026)**: Final Code Freeze at 03:00 PM, Grand Pitch Presentations & Awards Ceremony at 05:00 PM.`,
  category: "hackathon",
  tags: ["AI", "Hackathon", "Agents", "Generative AI", "Python", "Robotics"],
  is_online: false,
  banner_url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop",
  logo_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop",
  status: "upcoming",
  
  // Date: Tomorrow (23 Aug 2026)
  start_date: "2026-08-23",
  start_time: "09:00 AM",
  end_date: "2026-08-24",
  end_time: "06:00 PM",
  venue: "APJ Abdul Kalam Central Auditorium & AI Research Labs, Block C",
  whatsapp_link: "https://chat.whatsapp.com/NeuralHack2026Official",
  
  // Registration & Dynamic Pricing
  registration_type: "both",
  is_paid: true,
  pricing_type: "tiered",
  pricing_tiers: [
    { id: "tier-1", label: "CSI / IEEE Member (SCTians)", price: "450", requiresProof: true, proofLabel: "CSI / IEEE Membership ID" },
    { id: "tier-2", label: "CSI / IEEE Member (External Delegations)", price: "600", requiresProof: true, proofLabel: "CSI / IEEE Membership ID" },
    { id: "tier-3", label: "SCTians General Pass", price: "650", requiresProof: false, proofLabel: "" },
    { id: "tier-4", label: "Non-SCTians / External Delegate Pass", price: "850", requiresProof: false, proofLabel: "" },
  ],
  individual_price: 650,
  group_price: 1800,
  group_min_size: 2,
  group_max_size: 4,
  has_capacity_limit: true,
  max_participants: 120,

  // Payment Setup
  upi_id: "adityenh@oksbi",
  has_bank_transfer: true,
  account_no: "987654321098",
  ifsc_code: "SBIN0070123",
  payment_verification: "both",
  confirmation_message: "You are registered for NEURALHACK '26! Please join the official WhatsApp group and keep your Gate Pass ready for check-in.",

  // Amenities & Deadlines (Stored safely in JSONB amenities)
  amenities: {
    refreshments: true,
    accommodation: true,
    certificate: true,
    wifi: true,
    openTo: ["All"],
    allowRegistrationsUntil: "2026-08-23T08:30:00",
    enableSpotRegistrations: true,
    allowSpotRegistrationsUntil: "2026-08-23T14:00:00",
  }
};

const SCHEDULE_ITEMS = [
  { time: "09:00 AM", title: "Gate Entry & Badge Check-In", speaker: "Registration Desk Volunteers", room: "Central Foyer", duration: "60m" },
  { time: "10:00 AM", title: "Opening Ceremony & Problem Statement Reveal", speaker: "Dr. A. V. Suresh (HOD AI)", room: "Central Auditorium", duration: "45m" },
  { time: "11:00 AM", title: "Hacking Starts — Architecture & Sprint Phase", speaker: "Mentors Panel", room: "Lab 401 & 402", duration: "360m" },
  { time: "05:00 PM", title: "Mentorship Round 1 (Architecture Review)", speaker: "Lead Engineers @ Google & Thoughtworks", room: "Innovation Bay", duration: "90m" },
  { time: "12:00 AM", title: "Midnight Pizza & Cyberpunk Lightning Talks", speaker: "Guest Tech Leads", room: "Cafeteria Lounge", duration: "60m" },
  { time: "03:00 PM", title: "Final Code Freeze & Git Repository Lock", speaker: "Technical Jury", room: "Lab 401 & 402", duration: "30m" },
  { time: "04:00 PM", title: "Top 8 Finalist Demos & Live Pitching", speaker: "Grand Jury", room: "Central Auditorium", duration: "90m" },
  { time: "05:30 PM", title: "Grand Awards Ceremony & Prize Distribution", speaker: "Principal & Chief Guest", room: "Central Auditorium", duration: "45m" }
];

const CONTACT_ITEMS = [
  { name: "Adithyan H", role: "Chief Student Organizer", phone: "+91 9497000090", email: "adithyan@vibevenue.tech" },
  { name: "Elena Rostova", role: "Technical Head & Mentor Lead", phone: "+91 9846001122", email: "elena.ai@sctce.ac.in" },
  { name: "Karthik Menon", role: "Logistics & Hospitality Lead", phone: "+91 9745123456", email: "karthik.logistics@sctce.ac.in" }
];

const ADDON_ITEMS = [
  { label: "Official NEURALHACK Hoodie & Swag Kit", price: 350, required: false },
  { label: "VIP Midnight Energy & 3-Course Meals Pass", price: 200, required: false },
  { label: "Hardware IoT Sensor Kit & Cloud GPU Pass", price: 150, required: false }
];

const LINK_ITEMS = [
  { link_type: "pre", label: "Hackathon Starter Kit & API Repo", url: "https://github.com/vibevenue/neuralhack-2026-starter", sort_order: 0 },
  { link_type: "pre", label: "Official Discord Community", url: "https://discord.gg/neuralhack26", sort_order: 1 },
  { link_type: "post", label: "Devpost Submission Portal", url: "https://neuralhack2026.devpost.com", sort_order: 0 }
];

async function seedTomorrowEvent() {
  console.log("🚀 Authenticating Admin & Seeding Tomorrow's Flagship Event (23 Aug 2026)...");

  // Sign in or sign up admin account to satisfy Supabase RLS
  const adminEmail = "organizer.admin@vibevenue.tech";
  const adminPass = "VibeVenueAdmin#2026";

  let { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPass,
  });

  if (authErr) {
    // Attempt sign up
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPass,
      options: {
        data: { full_name: "Lead Organizer", role: "admin" }
      }
    });
    if (signUpErr) {
      console.warn("Sign up warning:", signUpErr.message);
    } else {
      authData = signUpData;
    }
  }

  const userId = authData?.user?.id || null;
  console.log(`✓ Authenticated as Organizer: ${adminEmail} (UID: ${userId || 'anonymous'})`);

  // 1. Insert Event Row
  const eventPayload = {
    ...TOMORROW_EVENT,
    created_by: userId,
  };

  const { data: event, error: evtErr } = await supabase
    .from('events')
    .insert(eventPayload)
    .select()
    .single();

  if (evtErr) {
    console.error("❌ Failed to insert event:", evtErr.message);
    return;
  }

  console.log(`✓ Event created: "${event.name}" (ID: ${event.id})`);

  // 2. Insert Schedule
  const scheduleRows = SCHEDULE_ITEMS.map((s, idx) => ({
    event_id: event.id,
    sort_order: idx,
    time: s.time,
    title: s.title,
    speaker: s.speaker,
    room: s.room,
    duration: s.duration
  }));
  const { error: schedErr } = await supabase.from('event_schedule').insert(scheduleRows);
  if (schedErr) console.warn("Schedule warning:", schedErr.message);
  else console.log(`✓ Inserted ${scheduleRows.length} schedule entries`);

  // 3. Insert Contacts
  const contactRows = CONTACT_ITEMS.map((c, idx) => ({
    event_id: event.id,
    sort_order: idx,
    name: c.name,
    role: c.role,
    phone: c.phone,
    email: c.email
  }));
  const { error: contErr } = await supabase.from('event_contacts').insert(contactRows);
  if (contErr) console.warn("Contacts warning:", contErr.message);
  else console.log(`✓ Inserted ${contactRows.length} coordinators`);

  // 4. Insert Add-ons
  const addonRows = ADDON_ITEMS.map((a) => ({
    event_id: event.id,
    label: a.label,
    price: a.price,
    required: a.required
  }));
  const { error: addErr } = await supabase.from('event_addons').insert(addonRows);
  if (addErr) console.warn("Addons warning:", addErr.message);
  else console.log(`✓ Inserted ${addonRows.length} add-on items`);

  // 5. Insert Links
  const linkRows = LINK_ITEMS.map((l) => ({
    event_id: event.id,
    link_type: l.link_type,
    label: l.label,
    url: l.url,
    sort_order: l.sort_order
  }));
  const { error: linkErr } = await supabase.from('event_links').insert(linkRows);
  if (linkErr) console.warn("Links warning:", linkErr.message);
  else console.log(`✓ Inserted ${linkRows.length} resource links`);

  console.log("\n🎉 Tomorrow's flagship event seeded successfully!");
}

seedTomorrowEvent();
