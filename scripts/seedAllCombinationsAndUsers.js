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
  console.log('🚀 Starting Seeding of 10 CSI Events & 30 Student Accounts...');

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

  // 2. Define the 10 CSI Event Combinations
  const csiEvents = [
    {
      name: "CSI TECHPULSE '26 — National Emerging Technologies Convention & Keynote Summit",
      tagline: "The premier CSI annual flagship gathering for AI, Cloud & Quantum Computing",
      category: "technical",
      status: "published",
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
      maxParticipants: 300,
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

Welcome to the flagship annual convention organized by the **Computer Society of India (CSI) Student Branch**. TECHPULSE '26 brings together 300+ visionary engineers, industry leaders, and researchers to explore breakthrough frontiers in generative intelligence, quantum algorithms, and next-gen cloud systems.

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
      name: "CSI CodeCraft: Deep Dive into Distributed Systems & Rust Microservices",
      tagline: "Build high-throughput zero-cost distributed microservices from scratch with Rust",
      category: "workshop",
      status: "published",
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
      hasCapacityLimit: false,
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
      name: "CSI HACKVERSE '26 — 24-Hour Autonomous Agentic Hackathon",
      tagline: "Build multi-agent AI ecosystems, smart campus systems, and win ₹50,000 prize pool",
      category: "hackathon",
      status: "published",
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
      maxParticipants: 40,
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

---

## 📋 Rules & Conduct
- All code must be authored inside fresh repositories created during the hackathon kickoff.
- Open-source libraries and public LLM APIs are permitted; plagiarism results in immediate disqualification.
- 24-hour continuous food, high-speed fiber Wi-Fi, and mentoring support provided on venue.

---

## 📞 Emergency & Desk Support
- **Hackathon Convener**: Harikrishnan K (+91 94471 23456)
- **Payment Verification UPI ID**: \`adityenh@oksbi\`
      `
    },
    {
      name: "CSI AlgoBlitz: Inter-Year Competitive Programming Arena",
      tagline: "Speed coding contest featuring dynamic programming, graphs, and greedy algorithms",
      category: "coding",
      status: "published",
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
      maxParticipants: 50,
      amenities: {
        openTo: ["1st Year", "2nd Year"],
        enableSpotRegistrations: true
      },
      addOns: [],
      description: `
# CSI AlgoBlitz Competitive Programming Arena

An adrenaline-pumping 3-hour algorithmic showdown strictly curated for **1st and 2nd Year undergraduate students**. Test your problem-solving velocity, time complexity optimization, and debugging precision.

---

## 🧠 Contest Structure
- **Round 1 (60 Mins)**: 4 Rapid-fire implementation & math challenges.
- **Round 2 (120 Mins)**: 3 Hard algorithmic problems (Graph traversals, Dynamic Programming, Segment Trees).
- **Supported Languages**: C++20, Java 21, Python 3.12, Rust.

---

## 🎁 Prizes & Perks
- 🏅 Top 3 coders receive direct wildcard entry into the CSI National Collegiate Coding Team.
- 📜 Certificate of Distinction for top 10 percentile participants.

---

## 📞 Coordinator Info
- **Student Lead**: Ananya S (\`csi.algoblitz@vibevenue.tech\`)
- **UPI Verification ID**: \`adityenh@oksbi\`
      `
    },
    {
      name: "CSI EmbeddedX: Hands-on Edge AI with ESP32 & TinyML Bootcamp",
      tagline: "Build smart edge devices running neural inference without cloud connectivity",
      category: "workshop",
      status: "published",
      startDate: "2026-08-30",
      startTime: "09:30 AM",
      endDate: "2026-08-30",
      endTime: "04:30 PM",
      venue: "IoT & Embedded Systems Center, 3rd Floor",
      isOnline: false,
      bannerUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80",
      logoUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80",
      tags: ["IoT", "Edge-AI", "ESP32", "TinyML", "CSI-Workshop"],
      registrationType: "individual",
      isPaid: true,
      pricingType: "tiered",
      pricingTiers: [
        { label: "CSI Student Member", price: 300, requiresProof: true, proofLabel: "CSI Membership ID" },
        { label: "General Pass", price: 550, requiresProof: false }
      ],
      upiId: "adityenh@oksbi",
      paymentVerification: "screenshot",
      hasCapacityLimit: true,
      maxParticipants: 45,
      whatsappLink: "https://chat.whatsapp.com/CSI-EmbeddedX-2026",
      amenities: {
        openTo: ["All"],
        enableSpotRegistrations: false
      },
      addOns: [
        { label: "Pre-flashed ESP32-S3 Dev Board + Sensor Shield Kit", price: 450, required: false }
      ],
      description: `
# CSI EmbeddedX: Edge AI with ESP32 & TinyML

Dive into hardware-software co-design! Learn how to quantize lightweight TensorFlow models and execute real-time computer vision and audio gesture recognition directly on sub-$5 microcontrollers.

---

## 🛠️ Hands-on Agenda
1. **ESP32 Architecture & FreeRTOS Fundamentals**
2. **Sensor Interfacing (I2C, SPI, Camera Modules)**
3. **Training & Quantizing Neural Networks with Edge Impulse**
4. **Deploying TinyML Models for Keyword Spotting & Fall Detection**

---

## 📦 What to Bring
- Laptop with USB-C / USB-A port and administrative access.
- Visual Studio Code with PlatformIO extension pre-installed.

---

## 📞 Support Contacts
- **Workshop Lead**: Siddharth V (+91 94950 11223)
- **Official Payment UPI ID**: \`adityenh@oksbi\`
      `
    },
    {
      name: "CSI PixelForge: 6-Hour Rapid Prototyping & Product Design Sprint",
      tagline: "Design intuitive 2026-level digital products, design systems, and micro-interactions",
      category: "design",
      status: "published",
      startDate: "2026-09-02",
      startTime: "10:00 AM",
      endDate: "2026-09-02",
      endTime: "04:00 PM",
      venue: "Design Studio & Digital Media Lab, SCTCE",
      isOnline: false,
      bannerUrl: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=1200&auto=format&fit=crop&q=80",
      logoUrl: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=400&auto=format&fit=crop&q=80",
      tags: ["UI-UX", "Figma", "Design-Sprint", "CSI-Design", "Prototyping"],
      registrationType: "individual",
      isPaid: true,
      pricingType: "flat",
      individualPrice: 150,
      upiId: "adityenh@oksbi",
      paymentVerification: "both",
      hasCapacityLimit: true,
      maxParticipants: 40,
      amenities: {
        openTo: ["All"],
        enableSpotRegistrations: true
      },
      addOns: [],
      description: `
# CSI PixelForge Design Sprint

Transform user empathy into breathtaking digital interfaces! In this rapid 6-hour sprint organized by **CSI**, delegates will receive real product design briefs and engineer interactive, high-fidelity prototypes.

---

## 🎨 Sprint Criteria
- Design System Consistency & Token Hierarchy
- Spatial Rhythm, Contrast, & Accessibility (WCAG AAA)
- Fluid Micro-interactions and Motion Choreography in Figma

---

## 🏆 Awards & Perks
- 🥇 **Best Product Experience**: ₹5,000 + Figma Pro Annual License
- 📜 CSI Design Certificate for all qualifying submissions

---

## 📞 Coordinator Details
- **Design Lead**: Niharika Das (\`csi.pixelforge@vibevenue.tech\`)
- **Payment UPI ID**: \`adityenh@oksbi\`
      `
    },
    {
      name: "CSI CyberStrike: National Collegiate Valorant & Esports Arena",
      tagline: "5v5 Tactical FPS championship battle for collegiate esports supremacy",
      category: "gaming",
      status: "published",
      startDate: "2026-09-05",
      startTime: "11:00 AM",
      endDate: "2026-09-05",
      endTime: "07:00 PM",
      venue: "LAN Gaming Hub & Student Activity Center",
      isOnline: false,
      bannerUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80",
      logoUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&auto=format&fit=crop&q=80",
      tags: ["Gaming", "Valorant", "Esports", "LAN", "CSI-Arena"],
      registrationType: "group",
      groupMinSize: 5,
      groupMaxSize: 5,
      isPaid: true,
      pricingType: "flat",
      groupPrice: 500,
      upiId: "adityenh@oksbi",
      paymentVerification: "both",
      hasCapacityLimit: true,
      maxParticipants: 16,
      amenities: {
        openTo: ["All"],
        enableSpotRegistrations: false
      },
      addOns: [],
      description: `
# CSI CyberStrike Collegiate Esports Championship

Gear up for high-intensity 5v5 tactical FPS action! 16 squads compete in double-elimination brackets on low-latency dedicated LAN servers.

---

## 🎮 Tournament Format
- **Group Stages**: Best of 1 (Custom Competitive Tournament Mode)
- **Semi-Finals & Grand Finals**: Best of 3 with map veto system
- **Anti-Cheat Enforcement**: Strict hardware validation & referee monitoring

---

## 🏆 Prize Pool
- 🥇 **Champion Squad**: ₹12,000 Cash + CSI Esports Trophies
- 🥈 **Runner-Up Squad**: ₹6,000 Cash

---

## 📞 Esports Marshall Contact
- **Head Marshall**: Gautham Krishna (+91 97450 99887)
- **Payment UPI ID**: \`adityenh@oksbi\`
      `
    },
    {
      name: "CSI PromptX: Generative AI, RAG & LLM Application Mastery",
      tagline: "Master prompt orchestration, vector databases, and enterprise RAG architecture",
      category: "seminar",
      status: "published",
      startDate: "2026-09-08",
      startTime: "07:00 PM",
      endDate: "2026-09-08",
      endTime: "09:30 PM",
      venue: "Google Meet Virtual Auditorium",
      meetingLink: "https://meet.google.com/csi-promptx-mastery",
      isOnline: true,
      bannerUrl: "https://images.unsplash.com/photo-1677442136019-21780efad99a?w=1200&auto=format&fit=crop&q=80",
      logoUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&auto=format&fit=crop&q=80",
      tags: ["GenAI", "LLM", "RAG", "Prompt-Engineering", "CSI-Webinar"],
      registrationType: "individual",
      isPaid: false,
      upiId: "adityenh@oksbi",
      paymentVerification: "none",
      hasCapacityLimit: false,
      amenities: {
        openTo: ["All"],
        enableSpotRegistrations: true
      },
      addOns: [],
      description: `
# CSI PromptX: Enterprise GenAI & RAG Architecture

A comprehensive virtual masterclass focusing on building high-reliability LLM applications with hybrid semantic search, context compression, and agentic workflows.

---

## 🧠 Core Topics
- Few-shot Prompt Engineering & ReAct Reasoning Loops
- Chunking Strategies & Vector Indexing (pgvector & Pinecone)
- Preventing Hallucinations with Guardrails & Evaluation Benchmarks

---

## 📞 Session Coordinator
- **AI Track Coordinator**: Akhil Mohan (\`csi.promptx@vibevenue.tech\`)
- **UPI Verification ID**: \`adityenh@oksbi\`
      `
    },
    {
      name: "CSI INVENTRON '26 — National Technical Paper & Project Expo",
      tagline: "Showcase original research, patentable hardware, and software inventions",
      category: "technical",
      status: "published",
      startDate: "2026-09-12",
      startTime: "09:00 AM",
      endDate: "2026-09-12",
      endTime: "05:00 PM",
      venue: "Seminar Complex & Central Tech Quad, SCTCE",
      isOnline: false,
      bannerUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80",
      logoUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&auto=format&fit=crop&q=80",
      tags: ["Research", "Paper-Presentation", "Invention", "CSI-Symposium"],
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
      maxParticipants: 100,
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

---

## 📜 Publication & Presentation Tracks
1. **Intelligent Computing & Autonomous Systems**
2. **Sustainable Smart Grid & Renewable Energy IoT**
3. **Applied Cryptography & Privacy-Preserving Computing**

---

## 💳 Payment Options
- **Direct Instant UPI**: \`adityenh@oksbi\`
- **NEFT / Bank Transfer**:
  - Bank: State Bank of India
  - A/C No: \`98765432109876\`
  - IFSC: \`SBIN0070080\`

---

## 📞 Organizing Secretariat
- **Secretary**: Prof. V. Ramanathan (\`csi.inventron@vibevenue.tech\`)
- **Emergency Helpline**: +91 94970 00090
      `
    },
    {
      name: "CSI RedTeam: Capture The Flag & Offensive Security WarGames",
      tagline: "Break cipher suites, exploit binary vulnerabilities, and pwn servers in live CTF",
      category: "cybersecurity",
      status: "published",
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
      maxParticipants: 50,
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

---

## 🚩 CTF Categories
- **Web Exploitation**: SSRF, SQL Injection, JWT tampering, and Prototype Pollution.
- **Reverse Engineering**: x86-64 disassembly, decompilation, and anti-debugging bypass.
- **Cryptography**: Broken RSA implementations, custom elliptic curve ciphers, and hash collisions.
- **Forensics & Steganography**: PCAP network analysis and memory dump investigation.

---

## 🏆 Hacker Bounties
- 🥇 **1st Place Cyber Sentinel**: ₹10,000 + TryHackMe Annual Subscriptions
- 🥈 **2nd Place Runner-Up**: ₹5,000 Cash

---

## 📞 WarGame Marshall Contact
- **CTF Marshall**: Arjun Dev (\`csi.redteam@vibevenue.tech\`)
- **Official Payment UPI ID**: \`adityenh@oksbi\`
      `
    }
  ];

  // Insert or Upsert Events
  for (const evt of csiEvents) {
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
      max_participants: evt.maxParticipants || 9999,
      amenities: evt.amenities,
      upi_id: evt.upiId,
      has_bank_transfer: evt.hasBankTransfer || false,
      account_no: evt.accountNo || null,
      ifsc_code: evt.ifscCode || null,
      payment_verification: (evt.paymentVerification === 'none' || !evt.paymentVerification) ? 'both' : evt.paymentVerification,
      confirmation_message: "Thank you for registering! Your CSI digital pass is confirmed.",
    };

    // Check if event with this name already exists
    const { data: existing } = await supabase.from('events').select('id').eq('name', evt.name).single();
    let eventId = existing?.id;

    if (eventId) {
      await supabase.from('events').update(eventPayload).eq('id', eventId);
      console.log(`✓ Updated Event: ${evt.name}`);
    } else {
      const { data: inserted, error: insertErr } = await supabase.from('events').insert(eventPayload).select().single();
      if (insertErr) {
        console.error(`Error inserting ${evt.name}:`, insertErr.message);
        continue;
      }
      eventId = inserted.id;
      console.log(`✓ Created Event: ${evt.name} (${eventId})`);
    }

    // Insert add-ons if any
    if (evt.addOns?.length) {
      await supabase.from('event_addons').delete().eq('event_id', eventId);
      const addonRows = evt.addOns.map((a) => ({
        event_id: eventId,
        label: a.label,
        price: a.price,
        required: a.required || false,
      }));
      await supabase.from('event_addons').insert(addonRows);
      console.log(`  ✓ Inserted ${addonRows.length} Add-ons for ${evt.name}`);
    }
  }

  console.log('\n======================================================');
  console.log('👥 3. Generating 30 Student Testing Accounts & 2 Admins');
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

  const accountRows = [];

  // Add 2 Admin accounts first
  accountRows.push({
    account_type: 'Admin / Organizer',
    full_name: 'Lead Organizer Admin',
    email: 'organizer.admin@vibevenue.tech',
    password: 'VibeVenueAdmin#2026',
    roll_number: 'ADMIN-01',
    department: 'CSE / Organizer Secretariat',
    year: 'Faculty / Lead',
    college: 'SCT College of Engineering',
    role: 'admin'
  });

  accountRows.push({
    account_type: 'Admin / Organizer',
    full_name: 'CSI Staff Lead & Admin',
    email: 'csi.lead@vibevenue.tech',
    password: 'CSIAdmin#2026',
    roll_number: 'ADMIN-CSI-02',
    department: 'Computer Science Department',
    year: 'CSI Staff Lead',
    college: 'SCT College of Engineering',
    role: 'admin'
  });

  // Create the 30 student accounts
  for (let i = 0; i < studentNames.length; i++) {
    const name = studentNames[i];
    const paddedIdx = String(i + 1).padStart(2, '0');
    const email = `test.student${paddedIdx}@vibevenue.tech`;
    const rollNumber = `SCT24CS${String(100 + i).slice(1)}`;
    const dept = departments[i % departments.length];
    const yr = years[i % years.length];
    const clg = colleges[i % colleges.length];
    const phone = `98765${String(10000 + i).slice(1)}`;

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

      if (signUpErr) {
        // If user already registered, that's completely fine
        console.log(`- Student ${paddedIdx} (${email}) already registered / exists`);
      } else if (signUpData?.user?.id) {
        console.log(`+ Created Student ${paddedIdx}: ${name} (${email})`);
        // Update profile table
        await supabase.from('profiles').update({
          name,
          student_id: rollNumber,
          department: dept,
          year: yr,
          phone,
          role: 'participant',
        }).eq('id', signUpData.user.id);
      }
    } catch (e) {
      console.log(`- Handled signup for ${email}`);
    }

    accountRows.push({
      account_type: 'Student / Participant',
      full_name: name,
      email,
      password: defaultPassword,
      roll_number: rollNumber,
      department: dept,
      year: yr,
      college: clg,
      role: 'participant'
    });
  }

  // 4. Save to CSV file in project root
  const csvHeaders = ['account_type', 'full_name', 'email', 'password', 'roll_number', 'department', 'year', 'college', 'role'];
  const csvLines = [
    csvHeaders.join(','),
    ...accountRows.map(r => [
      `"${r.account_type}"`,
      `"${r.full_name}"`,
      `"${r.email}"`,
      `"${r.password}"`,
      `"${r.roll_number}"`,
      `"${r.department}"`,
      `"${r.year}"`,
      `"${r.college}"`,
      `"${r.role}"`,
    ].join(','))
  ];

  const csvPath = path.join(process.cwd(), 'test_accounts.csv');
  fs.writeFileSync(csvPath, csvLines.join('\n'), 'utf-8');
  console.log(`\n✓ Saved CSV of all 32 accounts to: ${csvPath}`);
}

main().catch(console.error);
