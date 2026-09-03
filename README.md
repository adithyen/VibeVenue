# 🎟️ VibeVenue — Next-Gen Event Management & Gate Check-In Suite

> **Production Deployment:** [https://vibe-venue.vercel.app](https://vibe-venue.vercel.app)  
>   
> **Author :** Adithyen H

---

## 🌟 Executive Overview

**VibeVenue** is an ultra-fast, 2026-level Event Management, Attendee Verification, and Gate Check-In Platform engineered for academic summits, collegiate hackathons, technical symposiums, and sports championships.

Built with **React 18**, **Vite**, **Supabase Postgres (Live Realtime WebSockets)**, **Framer Motion**, and **Zero-Latency Canvas 2D QR / Hardware Barcode Decoders**, VibeVenue eliminates paper ticket friction and streamlines attendee turnouts across multiple simultaneous gate desks.

---

## 📸 Visual Showcase & Screen Recordings

<!-- 
  RESERVED MEDIA PLACEHOLDER SECTION 
  Insert high-resolution screenshots and screen recording walkthroughs below
-->

| Feature / Page | Interactive Preview / Recording |
| :--- | :--- |
| **Ultra-Fast 60FPS Camera Gate Scanner** | *[ Screenshot / Video Walkthrough Placeholder ]* |
| **Turnout Matrix & Team Attendance Hub** | *[ Screenshot / Video Walkthrough Placeholder ]* |
| **Digital Pass Wallet & QR Ticket** | *[ Screenshot / Video Walkthrough Placeholder ]* |
| **Team Roster Registration Engine** | *[ Screenshot / Video Walkthrough Placeholder ]* |
| **Attendee Verification Dossier & Receipt Desk** | *[ Screenshot / Video Walkthrough Placeholder ]* |

---

## 🔐 Credentials for Testing

### 👑 1. Organizer & Admin Portals
| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Lead Organizer Admin** | \`organizer.admin@vibevenue.tech\` | \`VibeVenueAdmin#2026\` | Full Root Access, Event Creation, Dossier Approval, Gate Scanning |
| **Operations Lead & Admin** | \`lead@vibevenue.tech\` | \`VibeVenueAdmin#2026\` | Event Ops, Attendance Management, Spot Pass Clearance |

### 👥 2. 30 Pre-Seeded Student / Participant Test Accounts
All 30 accounts are pre-configured with the default password: **\`VibeVenue#2026\`**

> 📄 **Complete Accounts File:** View the generated [test_accounts.csv](file:///d:/Projects/Event%20Management%20Dashboard/test_accounts.csv) in the project root for full names, emails, roll numbers, departments, and academic years.

Sample test logins:
- \`test.student01@vibevenue.tech\` • Pass: \`VibeVenue#2026\` (Aarav Nair — 3rd Year CSE)
- \`test.student02@vibevenue.tech\` • Pass: \`VibeVenue#2026\` (Diya Ramesh — 2nd Year AI&ML)
- \`test.student03@vibevenue.tech\` • Pass: \`VibeVenue#2026\` (Aditya Menon — 4th Year ECE)
- \`test.student04@vibevenue.tech\` • Pass: \`VibeVenue#2026\` (Kavya S — 1st Year IT)
- \`test.student05@vibevenue.tech\` • Pass: \`VibeVenue#2026\` (Rohan Varma — 3rd Year Mech)
*(...up to \`test.student30@vibevenue.tech\`)*

---

## ⚡ 10 Distinct Event Tracks (Pre-Seeded)

The database includes 10 live events covering every creation combination:

1. **TECHPULSE '26 (Tomorrow — 23 Aug 2026)**: In-Person Flagship Summit, Tiered (Member ₹100, General ₹250, External ₹400), Add-ons (Kit, Lunch), Capacity: 300.
2. **CodeCraft (24 Aug 2026)**: Free Online Distributed Systems & Rust Webinar with Google Meet integration.
3. **HACKVERSE '26 (26 Aug 2026)**: 24-Hour In-Person Autonomous Agentic Hackathon, 2–4 Member Team Pass (₹600 Flat), Add-ons.
4. **AlgoBlitz (28 Aug 2026)**: Free Competitive Programming Contest, Strictly restricted to 1st & 2nd Year, 60 Seat Capacity Limit.
5. **EmbeddedX (30 Aug 2026)**: Hands-on Edge AI with ESP32 & TinyML Bootcamp, Tiered (Member ₹300, Non-Member ₹550), Hardware Kit Add-on, WhatsApp Group.
6. **PixelForge (02 Sep 2026)**: 6-Hour UI/UX Prototyping & Product Design Sprint, Individual Flat Fee (₹150).
7. **CyberStrike (05 Sep 2026)**: 5v5 Collegiate Valorant & Esports Championship, 5-Member Team Pass (₹500 Flat).
8. **PromptX (08 Sep 2026)**: Free Enterprise GenAI & RAG Architecture Masterclass with Live Meet Link.
9. **INVENTRON '26 (12 Sep 2026)**: National Paper & Project Expo, Bank Transfer + UPI (\`adityenh@oksbi\`), Tiered Author & Delegate passes.
10. **RedTeam CTF (15 Sep 2026)**: Capture The Flag & Offensive Security WarGames, Solo or Duo Team Passes (₹250 / ₹450).

---

## 🚀 Key Features & Architectural Highlights

### 1. ⚡ Ultra-Fast 60FPS Zero-Latency Gate Scanner (\`/scanner\`)
- **Direct Canvas 2D Frame Sampling Engine**: Decodes QR codes from bright mobile screens and printed passes at 60 FPS using \`jsQR\` with \`attemptBoth\` luminance inversion.
- **Hardware USB Barcode Gun Listener**: Intercepts high-speed keyboard input streams from physical barcode scanners without requiring mouse clicks.
- **Dynamic Hardware Detection**: Displays real-time status pill (\`⚡ BARCODE READER DETECTED\` / \`○ BARCODE READER NOT DETECTED\`).
- **Interactive Team Gate Clearance Modal**: When scanning a group pass, an interactive roster pops up with **\`✓ Select All\`** and individual member checkboxes for granular team arrivals.
- **Audio Feedback**: Instant low-latency synth chimes for success, warning, and invalid ticket alerts.

### 2. 📋 Delegate Attendance & Turnout Hub (\`/attendance\`)
- **Instant Check-In Search Bar**: Scan QR or type Ticket ID / Roll No / Name to mark present in under 100ms.
- **Granular Team Member Roster**: Expandable team view with individual **\`[✓ Mark Present]\`** / **\`[○ Absent]\`** buttons.
- **Interactive Turnout Stat Cards**: Click any of the 4 stat cards (*Total*, *Present*, *Absent*, *Teams*) to instantly filter the table.
- **Spot Walk-in Pass Issuance**: Issue on-desk emergency passes and auto-check in delegates on the fly.
- **CSV Export**: 1-Click download of complete turnout records with check-in timestamps.

### 3. 👥 Dynamic Team Roster Builder (`/portal/register/:id`)
- **Leader + Member Cards**: Auto-binds the primary applicant as Team Leader and provides dynamic `+ Add Team Member` / `✕ Remove` controls.
- **Granular Member Profiles**: Collects Name, Email, Phone, Roll Number, and Department for every teammate.
- **Enforced Constraints**: Strictly validates min and max squad bounds (e.g. 2 to 4 hackers).

### 4. 🏷️ Multi-Tier Pricing & Membership Verification
- **Dynamic Tier Matrix**: Automatic price computation for Members, Non-Members, Early Birds, and General passes.
- **Eligibility Proof Auditing**: Captures and validates Membership IDs on checkout and highlights them in the organizer verification dossier.

### 5. 🎟️ Digital Pass Wallet & Offline QR Tickets (`/portal`)
- **Mobile-Responsive Pass Dossier**: Displays Ticket ID, Category, Venue, Schedule, Gate Instructions, and QR Code.
- **Live Pass Filtering**: Dynamically moves registered passes out of available tracks into the active pass wallet.

### 6. 📁 Attendee Verification Dossier & Receipt Desk (`/registrations/:id`)
- **High-Resolution Receipt Viewer**: Preview payment screenshot with zoom-modal.
- **1-Click Replace / Upload Image**: Organizers can attach or update original payment proofs directly in Supabase.
- **Add-ons Distribution Checklist**: Real-time toggles to hand over merchandise, hoodies, badges, and lunch coupons at the desk.

### 7. 🔄 Realtime Multi-Desk Sync
- Powered by **Supabase Postgres Realtime channels** (`postgres_changes`). Turnout counts, check-ins, and registrations sync instantly across multiple laptops and mobile scanner devices.

---

## 🧪 Comprehensive Feature Testing Guide

### 🧪 Test 1: Register for an Event (Individual & Team)
1. Navigate to [https://vibe-venue.vercel.app/portal](https://vibe-venue.vercel.app/portal)
2. Log in using a student test account (e.g. `test.student01@vibevenue.tech` / `VibeVenue#2026`).
3. Click **"Register Now"** on **HACKVERSE '26** (Team Event).
4. Enter Team Name (e.g. `NeuralKnights`), add 2 additional teammates with their emails and roll numbers, pick any add-ons, and enter Transaction ID.
5. Confirm registration — your digital pass with QR code will appear under **"My Digital Passes"**.

### 🧪 Test 2: Gate Check-In via Scanner
1. Open [https://vibe-venue.vercel.app/scanner](https://vibe-venue.vercel.app/scanner) (log in as Admin: `organizer.admin@vibevenue.tech` / `VibeVenueAdmin#2026`).
2. Point your camera at the pass QR code (or type the Ticket ID into the USB Barcode search input and press Enter).
3. **Team Modal Pops Up**: Select which members are present (or leave all checked) and click **"Confirm Gate Check-In"**.
4. The success chime plays, and the attendee is marked as present in real time.

### 🧪 Test 3: Manage Attendance & Individual Team Members
1. Open [https://vibe-venue.vercel.app/attendance](https://vibe-venue.vercel.app/attendance).
2. Filter by **"HACKVERSE '26"** using the top gate track pills.
3. Click on the **"Teams"** tab (or the **TEAMS & SPOT PASSES** stat card).
4. Click **`Team Roster ▼`** on your team row — toggle any individual member between **`✓ Present`** and **`○ Mark Present`**.
5. Click **"Export CSV"** to download the live attendance roster.

### 🧪 Test 4: Issue On-Desk Spot Walk-In Pass
1. On [https://vibe-venue.vercel.app/attendance](https://vibe-venue.vercel.app/attendance), click **"Issue Spot Pass"**.
2. Enter the delegate's name, roll number, and fee collected (₹100), and click **"⚡ Issue Spot Pass & Print Badge"**.
3. The spot pass is generated, auto-checked in, and added to the live feed.

---

## 🛠️ Local Development & Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **yarn** / **pnpm**

### Installation

\`\`\`bash
# 1. Clone the repository
git clone https://github.com/adithyen/VibeVenue.git
cd VibeVenue

# 2. Install dependencies
npm install

# 3. Create .env file with Supabase credentials
cp .env.example .env
\`\`\`

### Environment Variables (\`.env\`)
\`\`\`env
VITE_SUPABASE_URL=https://yrvijufespplklfnvsfg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

### Running the App
\`\`\`bash
# Start local development server
npm run dev

# Run production build validation
npm run build
\`\`\`

---

## 📜 License
Distributed under the **MIT License**. Engineered with precision by **Adithyen H**.
