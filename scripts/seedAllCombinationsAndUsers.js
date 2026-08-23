// scripts/seedAllCombinationsAndUsers.js — Seed 10 CSI Events with Realistic Capacities (50-120 slots, total 790), 30 Student Accounts, and All Registration Combinations
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = 'https://yrvijufespplklfnvsfg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlydmlqdWZlc3BwbGtsZm52c2ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMTU1ODUsImV4cCI6MjEwMjg5MTU4NX0.pM5B-ojiP3TCmK_nTQsTbAZoz_w6lTAVwdreh_Gybhc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🚀 Starting VibeVenue Full Seeding: 10 Events (Realistic 50-120 Capacities), 30 Accounts, and All Registration Combinations...');

  // 1. Authenticate as Admin
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'organizer.admin@vibevenue.tech',
    password: 'VibeVenueAdmin#2026',
  });

  if (authErr) {
    console.error('Failed to log in as admin:', authErr.message);
    return;
  }
  const adminId = authData.user.id;
  console.log('✓ Admin authenticated:', adminId);

  // 2. Prepare Sample Receipt Image
  let sampleReceiptUrl = 'https://vibe-venue.vercel.app/sample_receipt.png';
  const receiptLocalPath = path.join(__dirname, '..', 'public', 'sample_receipt.png');

  if (fs.existsSync(receiptLocalPath)) {
    try {
      const fileBuffer = fs.readFileSync(receiptLocalPath);
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('receipts')
        .upload('sample_payment_receipt.png', fileBuffer, {
          contentType: 'image/png',
          upsert: true,
        });

      if (!uploadErr) {
        const { data: pubData } = supabase.storage.from('receipts').getPublicUrl('sample_payment_receipt.png');
        if (pubData?.publicUrl) {
          sampleReceiptUrl = pubData.publicUrl;
          console.log('✓ Uploaded payment receipt to Supabase Storage:', sampleReceiptUrl);
        }
      }
    } catch (e) {
      console.log('Using default sample receipt URL fallback');
    }
  }

  // 3. Define the 10 CSI Event Tracks with Realistic Capacities (Total = 790 slots, within 670-825 range)
  const csiEvents = [
    {
      code: "TECHPULSE",
      name: "CSI TECHPULSE '26 — National Emerging Technologies Convention & Keynote Summit",
      tagline: "The premier CSI annual flagship gathering for AI, Cloud & Quantum Computing",
      category: "technical",
      status: "upcoming",
      startDate: "2026-08-23",
      startTime: "09:00 AM",
      endDate: "2026-08-23",
      endTime: "05:30 PM",
      venue: "Main Auditorium & APJ Abdul Kalam Hall, SCTCE",
      isOnline: false,
      bannerUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80",
      logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80",
      tags: ["CSI-Flagship", "Keynote", "AI", "Quantum", "Networking"],
      registrationType: "both",
      isPaid: true,
      pricingType: "tiered",
      pricingTiers: [
        { label: "CSI Student Member", price: 100, requiresProof: true, proofLabel: "CSI Membership ID" },
        { label: "SCTians General Delegate", price: 250, requiresProof: false },
        { label: "External Institution Pass", price: 400, requiresProof: false }
      ],
      upiId: "adityenh@oksbi",
      paymentVerification: "both",
      groupMinSize: 2,
      groupMaxSize: 4,
      hasCapacityLimit: true,
      maxParticipants: 120, // Realistic Capacity
      amenities: {
        openTo: ["All"],
        enableSpotRegistrations: true,
        allowSpotRegistrationsUntil: "2026-08-23T11:00"
      },
      addOns: [
        { label: "Official CSI Convention Badge & Delegate Swag Kit", price: 200, required: false },
        { label: "Executive Networking Buffet Lunch Pass", price: 150, required: false }
      ],
      description: `
# CSI TECHPULSE '26 — National Emerging Tech Convention

Welcome to the flagship annual convention organized by the **Computer Society of India (CSI) Student Branch**. TECHPULSE '26 brings together 120 visionary engineers, industry leaders, and researchers to explore breakthrough frontiers in generative intelligence, quantum algorithms, and next-gen cloud systems.

---

## 🎯 Convention Highlights & Key Tracks
- **Keynote Address**: Building Resilient Autonomous Systems at Planet Scale.
- **Panel Discussion**: The Evolution of Engineering Careers in the Generative AI Era.
- **Tech Showcase**: Live demonstrations of student projects and research papers.
- **Networking Mixer**: Direct interaction with hiring managers and industry speakers.

---

## 🏆 Delegate Perks & Certifications
- **Official CSI Delegate Kit**: Digital badge pass, branded lanyard, and conference booklet.
- **National Certificate of Participation**: Verified credential issued by CSI India.
- **Gourmet Catering**: Morning refreshments and high tea included for all registered passes.

---

## 📅 Schedule of Events (Tomorrow — 23 August 2026)
1. **08:30 AM – 09:30 AM**: Gate Check-In & Physical Badge Verification (Desk 1–4)
2. **09:30 AM – 10:30 AM**: Grand Inauguration & Presidential Address by CSI Dignitaries
3. **10:30 AM – 01:00 PM**: Keynote Track 1 & Technical Paper Presentations
4. **01:00 PM – 02:00 PM**: Networking Lunch & Project Exhibition
5. **02:00 PM – 04:30 PM**: Deep-Dive Panel & Industry Fireside Chat
6. **04:30 PM – 05:30 PM**: Valedictory Ceremony & Award Distribution

---

## 📞 Organizing Committee & Emergency Contact
- **Student Secretary (CSI)**: Adithyen H (+91 94970 00090)
- **Technical Coordinator**: Rahul Nair (+91 98765 43210)
- **Email Support**: \`csi.techpulse@vibevenue.tech\`
- **Official Payment UPI ID**: \`adityenh@oksbi\`
      `
    },
    {
      code: "CODECRAFT",
      name: "CSI CodeCraft: Deep Dive into Distributed Systems & Rust Microservices",
      tagline: "Build high-throughput zero-cost distributed microservices from scratch with Rust",
      category: "workshop",
      status: "upcoming",
      startDate: "2026-08-24",
      startTime: "06:00 PM",
      endDate: "2026-08-24",
      endTime: "08:30 PM",
      venue: "Google Meet Virtual Auditorium",
      meetingLink: "https://meet.google.com/csi-rust-sys",
      isOnline: true,
      bannerUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80",
      logoUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&auto=format&fit=crop&q=80",
      tags: ["Rust", "Distributed-Systems", "Backend", "Free-Webinar", "CSI-Mastery"],
      registrationType: "individual",
      isPaid: false,
      upiId: "adityenh@oksbi",
      paymentVerification: "none",
      hasCapacityLimit: true,
      maxParticipants: 100, // Realistic Capacity
      amenities: {
        openTo: ["All"],
        enableSpotRegistrations: true
      },
      addOns: [],
      description: `
# CSI CodeCraft: Distributed Systems in Rust

A completely **free virtual masterclass** brought to you by **CSI** for students and developers seeking to master low-level concurrency, asynchronous runtimes (\`tokio\`), and fault-tolerant distributed communication.

---

## 🚀 What You Will Build
- High-performance asynchronous RPC server with \`Tonic\` & \`gRPC\`.
- Distributed consensus simulator implementing the Raft algorithm.
- Production-grade telemetry using Prometheus metrics and OpenTelemetry.

---

## 💻 Prerequisites & Setup
- Basic familiarity with C++, Java, or Python syntax.
- Pre-installed \`rustup\` and Visual Studio Code / Rust-Analyzer.
- Google Meet link will be active 15 minutes before the session starts.

---

## 📞 Support & Inquiries
- **Lead Instructor**: Priya Menon (\`csi.codecraft@vibevenue.tech\`)
- **UPI Verification ID**: \`adityenh@oksbi\`
      `
    },
    {
      code: "HACKVERSE",
      name: "CSI HACKVERSE '26 — 24-Hour Autonomous Agentic Hackathon",
      tagline: "Build multi-agent AI ecosystems, smart campus systems, and win ₹50,000 prize pool",
      category: "hackathon",
      status: "upcoming",
      startDate: "2026-08-26",
      startTime: "10:00 AM",
      endDate: "2026-08-27",
      endTime: "10:00 AM",
      venue: "Advanced Computing Lab & Innovation Arena, SCTCE",
      isOnline: false,
      bannerUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80",
      logoUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&auto=format&fit=crop&q=80",
      tags: ["Hackathon", "AI-Agents", "24-Hours", "CSI-Hack", "Team-Pass"],
      registrationType: "group",
      groupMinSize: 2,
      groupMaxSize: 4,
      isPaid: true,
      pricingType: "flat",
      groupPrice: 600,
      upiId: "adityenh@oksbi",
      paymentVerification: "both",
      hasCapacityLimit: true,
      maxParticipants: 80, // Realistic Capacity (20-40 teams)
      amenities: {
        openTo: ["All"],
        enableSpotRegistrations: true,
        allowSpotRegistrationsUntil: "2026-08-26T12:00"
      },
      addOns: [
        { label: "Midnight Red Bull Energy & Snack Pack", price: 100, required: false },
        { label: "Hacker Bedding & Rest Zone Access", price: 150, required: false }
      ],
      description: `
# CSI HACKVERSE '26 — 24-Hour Agentic Hackathon

The battleground for the sharpest coders! Form a squad of 2 to 4 hackers and construct next-generation autonomous software that solves real institutional and industrial bottlenecks.

---

## 🏆 Cash Prizes & Rewards
- 🥇 **1st Place Champion**: ₹25,000 Cash + CSI Trophy + Incubation Mentorship
- 🥈 **2nd Place Runner Up**: ₹15,000 Cash + Certificate of Excellence
- 🥉 **Best All-Girls Team**: ₹10,000 Special Recognition Grant

---

## ⚡ Hackathon Themes
1. **Autonomous Campus Orchestration**: Multi-agent assistants for lab scheduling and hostel amenities.
2. **Defensive Cybersecurity Sentinel**: Real-time anomaly detection for local network traffic.
3. **Fintech & Decentralized Ledger Tools**: Micro-transaction escrow engines for campus merchants.
      `
    },
    {
      code: "ALGOBLITZ",
      name: "CSI AlgoBlitz: Inter-Year Competitive Programming Arena",
      tagline: "Speed coding contest featuring dynamic programming, graphs, and greedy algorithms",
      category: "coding",
      status: "upcoming",
      startDate: "2026-08-28",
      startTime: "02:00 PM",
      endDate: "2026-08-28",
      endTime: "05:00 PM",
      venue: "CAD Lab 1 & Systems Center, SCTCE",
      isOnline: false,
      bannerUrl: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1200&auto=format&fit=crop&q=80",
      logoUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&auto=format&fit=crop&q=80",
      tags: ["Competitive-Programming", "Algorithms", "CSI-Contest", "Free"],
      registrationType: "individual",
      isPaid: false,
      upiId: "adityenh@oksbi",
      paymentVerification: "none",
      hasCapacityLimit: true,
      maxParticipants: 60, // Realistic Capacity
      amenities: {
        openTo: ["1st Year", "2nd Year"],
        enableSpotRegistrations: true
      },
      addOns: [],
      description: `
# CSI AlgoBlitz: Speed Coding Championship

Sharpen your logic and compete in a high-intensity algorithmic showdown! Solve complex DSA challenges with zero syntax errors under tight time constraints.
      `
    },
    {
      code: "EMBEDDEDX",
      name: "CSI EmbeddedX: Edge AI with ESP32 & TinyML Bootcamp",
      tagline: "Hands-on micro-controller sensor interfacing, TensorFlow Lite for Microcontrollers & Edge Vision",
      category: "workshop",
      status: "upcoming",
      startDate: "2026-08-30",
      startTime: "09:30 AM",
      endDate: "2026-08-30",
      endTime: "04:30 PM",
      venue: "Embedded Systems & IoT Innovation Center, Block D",
      whatsappLink: "https://chat.whatsapp.com/EmbeddedX2026",
      isOnline: false,
      bannerUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80",
      logoUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80",
      tags: ["IoT", "Edge-AI", "ESP32", "TinyML", "Hardware-Lab"],
      registrationType: "individual",
      isPaid: true,
      pricingType: "tiered",
      pricingTiers: [
        { label: "CSI Member Pass (Includes Sensor Kit Rental)", price: 300, requiresProof: true, proofLabel: "CSI Membership ID" },
        { label: "Non-CSI Delegate Pass", price: 550, requiresProof: false }
      ],
      upiId: "adityenh@oksbi",
      paymentVerification: "both",
      hasCapacityLimit: true,
      maxParticipants: 50, // Realistic Capacity
      amenities: {
        openTo: ["All"],
        enableSpotRegistrations: true
      },
      addOns: [
        { label: "Take-Home ESP32-CAM & Sensor Starter Bundle", price: 250, required: false }
      ],
      description: `
# CSI EmbeddedX: Edge AI & TinyML

Deploy neural network models directly to ultra-low-power microcontrollers! Interface sensors, capture live audio/vision streams, and run on-device inference without internet connectivity.
      `
    },
    {
      code: "PIXELFORGE",
      name: "CSI PixelForge: 6-Hour UI/UX Prototyping & Product Design Sprint",
      tagline: "Design intuitive digital experiences in Figma and master modern design systems & micro-interactions",
      category: "design",
      status: "upcoming",
      startDate: "2026-09-02",
      startTime: "10:00 AM",
      endDate: "2026-09-02",
      endTime: "04:00 PM",
      venue: "Multimedia Studio & Design Bay, Block B",
      isOnline: false,
      bannerUrl: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=1200&auto=format&fit=crop&q=80",
      logoUrl: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=400&auto=format&fit=crop&q=80",
      tags: ["UI-UX", "Figma", "Design-Sprint", "Design-Tokens"],
      registrationType: "individual",
      isPaid: true,
      pricingType: "flat",
      individualPrice: 150,
      upiId: "adityenh@oksbi",
      paymentVerification: "both",
      hasCapacityLimit: true,
      maxParticipants: 70, // Realistic Capacity
      amenities: {
        openTo: ["All"],
        enableSpotRegistrations: true
      },
      addOns: [],
      description: `
# CSI PixelForge: Product Design Sprint

A sprint for product designers, frontend developers, and creative minds! Master typography, spatial rhythm, glassmorphism, and interactive micro-animations in Figma.
      `
    },
    {
      code: "CYBERSTRIKE",
      name: "CSI CyberStrike: 5v5 Collegiate Valorant & Tactical Esports Championship",
      tagline: "LAN esports championship on dedicated 240Hz monitors with live casting",
      category: "gaming",
      status: "upcoming",
      startDate: "2026-09-05",
      startTime: "09:00 AM",
      endDate: "2026-09-05",
      endTime: "07:00 PM",
      venue: "High Performance Gaming Arena, Mechanical Block Foyer",
      isOnline: false,
      bannerUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80",
      logoUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&auto=format&fit=crop&q=80",
      tags: ["Gaming", "Valorant", "Esports", "5v5-LAN"],
      registrationType: "group",
      groupMinSize: 5,
      groupMaxSize: 5,
      isPaid: true,
      pricingType: "flat",
      groupPrice: 500,
      upiId: "adityenh@oksbi",
      paymentVerification: "both",
      hasCapacityLimit: true,
      maxParticipants: 60, // Realistic Capacity (12 squads)
      amenities: {
        openTo: ["All"],
        enableSpotRegistrations: false
      },
      addOns: [],
      description: `
# CSI CyberStrike: 5v5 Valorant LAN Championship

Assemble your 5-player squad! Compete on low-latency LAN servers with professional casting and cash prizes for top fraggers.
      `
    },
    {
      code: "PROMPTX",
      name: "CSI PromptX: Enterprise GenAI, LLMOps & RAG Architecture Masterclass",
      tagline: "Build production-grade retrieval-augmented generation pipelines with LangChain & pgvector",
      category: "workshop",
      status: "upcoming",
      startDate: "2026-09-08",
      startTime: "07:00 PM",
      endDate: "2026-09-08",
      endTime: "09:30 PM",
      venue: "Zoom Live Auditorium",
      meetingLink: "https://zoom.us/j/9876543210",
      isOnline: true,
      bannerUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&auto=format&fit=crop&q=80",
      logoUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&auto=format&fit=crop&q=80",
      tags: ["GenAI", "RAG", "LLMOps", "Vector-DB", "Free-Masterclass"],
      registrationType: "individual",
      isPaid: false,
      upiId: "adityenh@oksbi",
      paymentVerification: "none",
      hasCapacityLimit: true,
      maxParticipants: 110, // Realistic Capacity
      amenities: {
        openTo: ["All"],
        enableSpotRegistrations: true
      },
      addOns: [],
      description: `
# CSI PromptX: GenAI & RAG Masterclass

Master retrieval-augmented generation, embeddings, semantic chunking, and hybrid search using pgvector and modern LLM frameworks.
      `
    },
    {
      code: "INVENTRON",
      name: "CSI INVENTRON '26 — National Project & Paper Expo",
      tagline: "National paper presentation & hardware demo symposium with ISBN journal publication",
      category: "symposium",
      status: "upcoming",
      startDate: "2026-09-12",
      startTime: "09:30 AM",
      endDate: "2026-09-12",
      endTime: "04:30 PM",
      venue: "Central Seminar Complex & Exhibition Concourse, SCTCE",
      isOnline: false,
      bannerUrl: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1200&auto=format&fit=crop&q=80",
      logoUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&auto=format&fit=crop&q=80",
      tags: ["Symposium", "Research-Papers", "Hardware-Demo", "ISBN-Journal"],
      registrationType: "both",
      groupMinSize: 1,
      groupMaxSize: 3,
      isPaid: true,
      pricingType: "tiered",
      pricingTiers: [
        { label: "CSI Author Pass", price: 200, requiresProof: true, proofLabel: "CSI Membership ID" },
        { label: "General Author Pass", price: 400, requiresProof: false },
        { label: "Delegate / Attendee Pass", price: 100, requiresProof: false }
      ],
      upiId: "adityenh@oksbi",
      hasBankTransfer: true,
      accountNo: "98765432109876",
      ifscCode: "SBIN0070080",
      paymentVerification: "both",
      hasCapacityLimit: true,
      maxParticipants: 75, // Realistic Capacity
      amenities: {
        openTo: ["All"],
        enableSpotRegistrations: true
      },
      addOns: [
        { label: "Official Printed Conference Proceedings & ISBN Journal Inclusion", price: 300, required: false }
      ],
      description: `
# CSI INVENTRON '26 — National Project & Paper Expo

INVENTRON '26 is a national platform for undergraduate and postgraduate scholars to demonstrate working hardware prototypes and present peer-reviewed research papers.
      `
    },
    {
      code: "REDTEAM",
      name: "CSI RedTeam: Capture The Flag & Offensive Security WarGames",
      tagline: "Break cipher suites, exploit binary vulnerabilities, and pwn servers in live CTF",
      category: "cybersecurity",
      status: "upcoming",
      startDate: "2026-09-15",
      startTime: "10:00 AM",
      endDate: "2026-09-15",
      endTime: "06:00 PM",
      venue: "Cyber Forensics Lab & Systems Arena, SCTCE",
      isOnline: false,
      bannerUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&auto=format&fit=crop&q=80",
      logoUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&auto=format&fit=crop&q=80",
      tags: ["CTF", "Cybersecurity", "Offensive-Security", "CSI-WarGames"],
      registrationType: "both",
      groupMinSize: 1,
      groupMaxSize: 2,
      isPaid: true,
      pricingType: "tiered",
      pricingTiers: [
        { label: "CSI Student Member", price: 250, requiresProof: true, proofLabel: "CSI Membership ID" },
        { label: "General Hacker Pass", price: 450, requiresProof: false }
      ],
      upiId: "adityenh@oksbi",
      paymentVerification: "both",
      hasCapacityLimit: true,
      maxParticipants: 65, // Realistic Capacity
      amenities: {
        openTo: ["All"],
        enableSpotRegistrations: true
      },
      addOns: [
        { label: "CSI Certified WarGame Security Champion Badge", price: 120, required: false }
      ],
      description: `
# CSI RedTeam: Capture The Flag WarGames

Step into the shoes of ethical offensive researchers! Uncover hidden flags across realistic penetration testing targets, reverse-engineer obfuscated binaries, and exploit web application vulnerabilities.
      `
    }
  ];

  // Insert or Update Events and Store IDs
  const eventMap = {};
  let totalSlots = 0;

  for (const evt of csiEvents) {
    totalSlots += evt.maxParticipants;
    const eventPayload = {
      created_by: adminId,
      name: evt.name,
      tagline: evt.tagline,
      description: evt.description.trim(),
      category: evt.category,
      tags: evt.tags,
      is_online: evt.isOnline || false,
      banner_url: evt.bannerUrl,
      logo_url: evt.logoUrl,
      status: 'upcoming',
      start_date: evt.startDate,
      start_time: evt.startTime,
      end_date: evt.endDate,
      end_time: evt.endTime,
      venue: evt.venue,
      meeting_link: evt.meetingLink || null,
      whatsapp_link: evt.whatsappLink || null,
      registration_type: evt.registrationType,
      is_paid: evt.isPaid,
      pricing_type: evt.pricingType || "flat",
      pricing_tiers: evt.pricingTiers || [],
      individual_price: evt.individualPrice || null,
      group_price: evt.groupPrice || null,
      group_min_size: evt.groupMinSize || 2,
      group_max_size: evt.groupMaxSize || 4,
      has_capacity_limit: evt.hasCapacityLimit || false,
      max_participants: evt.maxParticipants,
      amenities: evt.amenities,
      upi_id: evt.upiId,
      has_bank_transfer: evt.hasBankTransfer || false,
      account_no: evt.accountNo || null,
      ifsc_code: evt.ifscCode || null,
      payment_verification: (evt.paymentVerification === 'none' || !evt.paymentVerification) ? 'both' : evt.paymentVerification,
      confirmation_message: "Thank you for registering! Your CSI digital pass is confirmed.",
    };

    const { data: existing } = await supabase.from('events').select('id').eq('name', evt.name).maybeSingle();
    let eventId = existing?.id;

    if (eventId) {
      await supabase.from('events').update(eventPayload).eq('id', eventId);
      console.log(`✓ Updated Event [${evt.code}]: ${evt.name} (Cap: ${evt.maxParticipants})`);
    } else {
      const { data: inserted, error: insertErr } = await supabase.from('events').insert(eventPayload).select().single();
      if (insertErr) {
        console.error(`Error inserting ${evt.name}:`, insertErr.message);
        continue;
      }
      eventId = inserted.id;
      console.log(`✓ Created Event [${evt.code}]: ${evt.name} (Cap: ${evt.maxParticipants})`);
    }
    eventMap[evt.code] = eventId;

    // Add-ons
    if (evt.addOns?.length) {
      await supabase.from('event_addons').delete().eq('event_id', eventId);
      const addonRows = evt.addOns.map((a) => ({
        event_id: eventId,
        label: a.label,
        price: a.price,
        required: a.required || false,
      }));
      await supabase.from('event_addons').insert(addonRows);
    }
  }

  console.log(`\n✨ All 10 Events configured with realistic capacities! Total aggregate slots = ${totalSlots} (Within target 670-825 range).`);

  // 4. Generate the 30 Student Testing Accounts & Retrieve IDs
  console.log('\n======================================================');
  console.log('👥 4. Registering 30 Student Accounts & User Profiles');
  console.log('======================================================');

  const defaultPassword = 'VibeVenue#2026';
  const colleges = ['SCT College of Engineering', 'College of Engineering Trivandrum', 'Model Engineering College', 'Mar Athanasius College'];
  const departments = ['Computer Science & Engineering', 'CSE(AI&ML)', 'Electronics & Communication', 'Mechanical Engineering', 'Information Technology'];
  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

  const studentNames = [
    'Aarav Nair', 'Diya Ramesh', 'Aditya Menon', 'Kavya S', 'Rohan Varma',
    'Sneha Pillai', 'Arjun Krishna', 'Meera Nambiar', 'Vishnu Prasad', 'Ananya Suresh',
    'Gautham Raj', 'Devika Panicker', 'Nikhil Kurup', 'Pooja Chandran', 'Abhishek R',
    'Archana Das', 'Kiran Kumar', 'Malavika B', 'Sanjay Mohan', 'Gopika V',
    'Midhun Joy', 'Shruthi Anand', 'Vivek G', 'Reshma Vinod', 'Deepak S',
    'Amritha Paul', 'Tarun George', 'Aswathi K', 'Rahul Madhav', 'Keerthi S'
  ];

  const studentAccounts = [];
  const userMap = {}; // email -> { id, name, rollNumber, dept, year, college, phone }

  for (let i = 0; i < studentNames.length; i++) {
    const name = studentNames[i];
    const paddedIdx = String(i + 1).padStart(2, '0');
    const email = `test.student${paddedIdx}@vibevenue.tech`;
    const rollNumber = `SCT24CS${String(100 + i).slice(1)}`;
    const dept = departments[i % departments.length];
    const yr = years[i % years.length];
    const clg = colleges[i % colleges.length];
    const phone = `98765${String(10000 + i).slice(1)}`;

    let userId = null;

    try {
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email,
        password: defaultPassword,
        options: {
          data: {
            name,
            student_id: rollNumber,
            department: dept,
            year: yr,
            college: clg,
            phone,
          }
        }
      });

      if (signUpData?.user?.id) {
        userId = signUpData.user.id;
      }
    } catch (e) {
      // ignore
    }

    if (!userId) {
      const { data: prof } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle();
      if (prof?.id) userId = prof.id;
    }

    if (userId) {
      await supabase.from('profiles').upsert({
        id: userId,
        email,
        name,
        student_id: rollNumber,
        department: dept,
        year: yr,
        college: clg,
        phone,
        role: 'participant',
      });
    }

    const userData = {
      index: i + 1,
      paddedIdx,
      id: userId,
      name,
      email,
      rollNumber,
      dept,
      year: yr,
      college: clg,
      phone,
    };

    studentAccounts.push(userData);
    userMap[email] = userData;
  }

  console.log(`✓ Synchronized all 30 student accounts!`);

  // 5. Clean Previous Registrations to Seed Fresh Combinations
  console.log('\n======================================================');
  console.log('🎟️ 5. Seeding All Multi-Track Registration Combinations');
  console.log('======================================================');

  // Helper function to insert a registration safely
  async function seedRegistration({
    eventCode,
    userEmail,
    regType = 'individual',
    teamName = null,
    teamMembers = [],
    pricingTier = null,
    membershipProof = null,
    totalPaid = 0,
    txnNumber = null,
    status = 'confirmed',
    ticketId = null,
    checkInStatus = 'Not Checked In',
    checkedInAt = null,
  }) {
    const eventId = eventMap[eventCode];
    if (!eventId) return;

    const user = userMap[userEmail];
    if (!user) return;

    const finalTicketId = ticketId || `TKT-${eventCode}-${user.paddedIdx}`;

    const regRow = {
      event_id: eventId,
      user_id: user.id || null,
      ticket_id: finalTicketId,
      full_name: user.name,
      email: user.email,
      phone: user.phone,
      student_id: user.rollNumber,
      college: user.college,
      department: user.dept,
      year: user.year,
      registration_type: regType,
      team_name: teamName,
      team_members: teamMembers,
      pricing_tier: pricingTier,
      membership_proof: membershipProof,
      payment_screenshot: totalPaid > 0 ? sampleReceiptUrl : null,
      total_paid: totalPaid,
      txn_id: txnNumber ? `testurstnx${txnNumber}` : (totalPaid > 0 ? `testurstnx${user.paddedIdx}` : null),
      status: status,
      check_in_status: checkInStatus,
      checked_in_at: checkedInAt,
    };

    // Remove any existing registration for this user & event
    await supabase.from('registrations').delete().match({ event_id: eventId, email: user.email });

    const { data: inserted, error: regErr } = await supabase.from('registrations').insert(regRow).select().single();
    if (regErr) {
      console.error(`Error registering ${user.email} for ${eventCode}:`, regErr.message);
    } else {
      console.log(`  ✓ Registered [${status.toUpperCase()}] ${user.name} for ${eventCode} (Txn: ${regRow.txn_id || 'FREE'}, Ticket: ${finalTicketId}, CheckIn: ${checkInStatus})`);
    }
  }

  // --- Seed Registrations Across 30 Accounts ---

  // 1. CSI TECHPULSE '26 (Flagship Keynote Summit)
  await seedRegistration({
    eventCode: 'TECHPULSE',
    userEmail: 'test.student01@vibevenue.tech',
    pricingTier: { label: 'CSI Student Member', price: 100 },
    membershipProof: 'CSI-MEM-2026-8812',
    totalPaid: 450, // Tier 100 + Badge 200 + Lunch 150
    txnNumber: '01',
    status: 'confirmed',
    checkInStatus: 'Checked In',
    checkedInAt: '2026-08-23T09:12:00Z',
  });

  await seedRegistration({
    eventCode: 'TECHPULSE',
    userEmail: 'test.student02@vibevenue.tech',
    pricingTier: { label: 'SCTians General Delegate', price: 250 },
    totalPaid: 400, // Tier 250 + Lunch 150
    txnNumber: '02',
    status: 'confirmed',
    checkInStatus: 'Not Checked In',
  });

  await seedRegistration({
    eventCode: 'TECHPULSE',
    userEmail: 'test.student03@vibevenue.tech',
    pricingTier: { label: 'External Institution Pass', price: 400 },
    totalPaid: 400,
    txnNumber: '03',
    status: 'pending',
    checkInStatus: 'Not Checked In',
  });

  await seedRegistration({
    eventCode: 'TECHPULSE',
    userEmail: 'test.student04@vibevenue.tech',
    pricingTier: { label: 'CSI Student Member', price: 100 },
    membershipProof: 'CSI-MEM-2026-9041',
    totalPaid: 100,
    txnNumber: '04',
    status: 'confirmed',
    checkInStatus: 'Checked In',
    checkedInAt: '2026-08-23T09:25:00Z',
  });

  // 2. CSI CodeCraft (Free Distributed Systems Masterclass)
  for (let idx = 5; idx <= 8; idx++) {
    const padded = String(idx).padStart(2, '0');
    await seedRegistration({
      eventCode: 'CODECRAFT',
      userEmail: `test.student${padded}@vibevenue.tech`,
      totalPaid: 0,
      status: 'confirmed',
      checkInStatus: idx % 2 === 0 ? 'Checked In' : 'Not Checked In',
      checkedInAt: idx % 2 === 0 ? '2026-08-24T18:05:00Z' : null,
    });
  }

  // 3. CSI HACKVERSE '26 (24-Hour Agentic Hackathon — Group Teams)
  const hackverseSquad1 = [
    { name: userMap['test.student09@vibevenue.tech'].name, email: 'test.student09@vibevenue.tech', phone: '9876500009', studentId: 'SCT24CS09', department: 'Computer Science', checkedIn: true, checkedInAt: '2026-08-26T10:15:00Z' },
    { name: userMap['test.student10@vibevenue.tech'].name, email: 'test.student10@vibevenue.tech', phone: '9876500010', studentId: 'SCT24CS10', department: 'CSE(AI&ML)', checkedIn: true, checkedInAt: '2026-08-26T10:15:00Z' },
    { name: userMap['test.student11@vibevenue.tech'].name, email: 'test.student11@vibevenue.tech', phone: '9876500011', studentId: 'SCT24CS11', department: 'ECE', checkedIn: false, checkedInAt: null },
    { name: userMap['test.student12@vibevenue.tech'].name, email: 'test.student12@vibevenue.tech', phone: '9876500012', studentId: 'SCT24CS12', department: 'IT', checkedIn: true, checkedInAt: '2026-08-26T10:15:00Z' },
  ];

  await seedRegistration({
    eventCode: 'HACKVERSE',
    userEmail: 'test.student09@vibevenue.tech',
    regType: 'group',
    teamName: 'AgentX Autonomous Swarm',
    teamMembers: hackverseSquad1,
    totalPaid: 850, // Squad ₹600 + Red Bull ₹100 + Bedding ₹150
    txnNumber: '09',
    status: 'confirmed',
    checkInStatus: 'Checked In',
    checkedInAt: '2026-08-26T10:15:00Z',
  });

  const hackverseSquad2 = [
    { name: userMap['test.student13@vibevenue.tech'].name, email: 'test.student13@vibevenue.tech', phone: '9876500013', studentId: 'SCT24CS13', department: 'Mechanical', checkedIn: false },
    { name: userMap['test.student14@vibevenue.tech'].name, email: 'test.student14@vibevenue.tech', phone: '9876500014', studentId: 'SCT24CS14', department: 'CSE', checkedIn: false },
    { name: userMap['test.student15@vibevenue.tech'].name, email: 'test.student15@vibevenue.tech', phone: '9876500015', studentId: 'SCT24CS15', department: 'ECE', checkedIn: false },
  ];

  await seedRegistration({
    eventCode: 'HACKVERSE',
    userEmail: 'test.student13@vibevenue.tech',
    regType: 'group',
    teamName: 'ByteBandits',
    teamMembers: hackverseSquad2,
    totalPaid: 600,
    txnNumber: '13',
    status: 'pending',
    checkInStatus: 'Not Checked In',
  });

  // 4. CSI AlgoBlitz (Free Speed Coding)
  for (let idx = 16; idx <= 18; idx++) {
    const padded = String(idx).padStart(2, '0');
    await seedRegistration({
      eventCode: 'ALGOBLITZ',
      userEmail: `test.student${padded}@vibevenue.tech`,
      totalPaid: 0,
      status: 'confirmed',
      checkInStatus: idx === 16 ? 'Checked In' : 'Not Checked In',
      checkedInAt: idx === 16 ? '2026-08-28T14:02:00Z' : null,
    });
  }

  // 5. CSI EmbeddedX (Edge AI Bootcamp)
  await seedRegistration({
    eventCode: 'EMBEDDEDX',
    userEmail: 'test.student19@vibevenue.tech',
    pricingTier: { label: 'CSI Member Pass', price: 300 },
    membershipProof: 'CSI-MEM-2026-1189',
    totalPaid: 550, // 300 + Kit 250
    txnNumber: '19',
    status: 'confirmed',
    checkInStatus: 'Checked In',
    checkedInAt: '2026-08-30T09:40:00Z',
  });

  await seedRegistration({
    eventCode: 'EMBEDDEDX',
    userEmail: 'test.student20@vibevenue.tech',
    pricingTier: { label: 'Non-CSI Delegate Pass', price: 550 },
    totalPaid: 550,
    txnNumber: '20',
    status: 'pending',
    checkInStatus: 'Not Checked In',
  });

  // 6. CSI PixelForge (Flat UI/UX Sprint)
  for (let idx = 21; idx <= 23; idx++) {
    const padded = String(idx).padStart(2, '0');
    await seedRegistration({
      eventCode: 'PIXELFORGE',
      userEmail: `test.student${padded}@vibevenue.tech`,
      totalPaid: 150,
      txnNumber: padded,
      status: idx === 23 ? 'cancelled' : 'confirmed',
      checkInStatus: idx === 21 ? 'Checked In' : 'Not Checked In',
      checkedInAt: idx === 21 ? '2026-09-02T10:05:00Z' : null,
    });
  }

  // 7. CSI CyberStrike (5v5 Esports Championship)
  const cyberSquad = [
    { name: userMap['test.student24@vibevenue.tech'].name, email: 'test.student24@vibevenue.tech', phone: '9876500024', studentId: 'SCT24CS24', department: 'CSE', checkedIn: true, checkedInAt: '2026-09-05T09:10:00Z' },
    { name: userMap['test.student25@vibevenue.tech'].name, email: 'test.student25@vibevenue.tech', phone: '9876500025', studentId: 'SCT24CS25', department: 'CSE', checkedIn: true, checkedInAt: '2026-09-05T09:10:00Z' },
    { name: userMap['test.student26@vibevenue.tech'].name, email: 'test.student26@vibevenue.tech', phone: '9876500026', studentId: 'SCT24CS26', department: 'IT', checkedIn: true, checkedInAt: '2026-09-05T09:10:00Z' },
    { name: userMap['test.student27@vibevenue.tech'].name, email: 'test.student27@vibevenue.tech', phone: '9876500027', studentId: 'SCT24CS27', department: 'ECE', checkedIn: true, checkedInAt: '2026-09-05T09:10:00Z' },
    { name: userMap['test.student28@vibevenue.tech'].name, email: 'test.student28@vibevenue.tech', phone: '9876500028', studentId: 'SCT24CS28', department: 'Mech', checkedIn: true, checkedInAt: '2026-09-05T09:10:00Z' },
  ];

  await seedRegistration({
    eventCode: 'CYBERSTRIKE',
    userEmail: 'test.student24@vibevenue.tech',
    regType: 'group',
    teamName: 'Phoenix Vanguard 5v5',
    teamMembers: cyberSquad,
    totalPaid: 500,
    txnNumber: '24',
    status: 'confirmed',
    checkInStatus: 'Checked In',
    checkedInAt: '2026-09-05T09:10:00Z',
  });

  // 8. CSI PromptX (Free Enterprise GenAI)
  await seedRegistration({
    eventCode: 'PROMPTX',
    userEmail: 'test.student29@vibevenue.tech',
    totalPaid: 0,
    status: 'confirmed',
    checkInStatus: 'Not Checked In',
  });

  await seedRegistration({
    eventCode: 'PROMPTX',
    userEmail: 'test.student30@vibevenue.tech',
    totalPaid: 0,
    status: 'confirmed',
    checkInStatus: 'Checked In',
    checkedInAt: '2026-09-08T19:05:00Z',
  });

  // 9. CSI INVENTRON (Paper & Hardware Symposium)
  const inventronTeam = [
    { name: userMap['test.student01@vibevenue.tech'].name, email: 'test.student01@vibevenue.tech', phone: '9876500001', studentId: 'SCT24CS01', department: 'CSE', checkedIn: true, checkedInAt: '2026-09-12T09:35:00Z' },
    { name: userMap['test.student02@vibevenue.tech'].name, email: 'test.student02@vibevenue.tech', phone: '9876500002', studentId: 'SCT24CS02', department: 'CSE', checkedIn: true, checkedInAt: '2026-09-12T09:35:00Z' },
  ];

  await seedRegistration({
    eventCode: 'INVENTRON',
    userEmail: 'test.student01@vibevenue.tech',
    regType: 'group',
    teamName: 'NeuroGrid Research Duo',
    teamMembers: inventronTeam,
    pricingTier: { label: 'CSI Author Pass', price: 200 },
    membershipProof: 'CSI-MEM-2026-8812',
    totalPaid: 500, // 200 + ISBN Journal 300
    txnNumber: '29',
    status: 'confirmed',
    checkInStatus: 'Checked In',
    checkedInAt: '2026-09-12T09:35:00Z',
  });

  // 10. CSI RedTeam CTF
  const ctfTeam = [
    { name: userMap['test.student03@vibevenue.tech'].name, email: 'test.student03@vibevenue.tech', phone: '9876500003', studentId: 'SCT24CS03', department: 'ECE', checkedIn: false },
    { name: userMap['test.student05@vibevenue.tech'].name, email: 'test.student05@vibevenue.tech', phone: '9876500005', studentId: 'SCT24CS05', department: 'Mech', checkedIn: false },
  ];

  await seedRegistration({
    eventCode: 'REDTEAM',
    userEmail: 'test.student03@vibevenue.tech',
    regType: 'group',
    teamName: 'NullSec Offensive Duo',
    teamMembers: ctfTeam,
    pricingTier: { label: 'CSI Student Member', price: 250 },
    membershipProof: 'CSI-MEM-2026-7731',
    totalPaid: 370, // 250 + Badge 120
    txnNumber: '30',
    status: 'confirmed',
    checkInStatus: 'Not Checked In',
  });

  console.log('\n======================================================');
  console.log('✨ All 10 Events, 30 Accounts & Diverse Registrations Successfully Seeded!');
  console.log('======================================================');
}

main().catch(console.error);
