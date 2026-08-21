# VibeVenue 🎪✨

> **Next-Generation Campus & Technical Event Management Platform**  
> Real-time event orchestration, attendee telemetry, digital ticketing with NPCI UPI payments, and interactive participant portal.

---

## ⚡ Features

- **🎯 Event Management & Creation Wizard**: Multi-step event creation with banners, logos, category badges, dynamic schedules, contact persons, and custom add-ons.
- **🎟️ Digital Passes & Smart Ticketing**: High-contrast NPCI-compliant UPI QR codes with automated transaction notes (`<StudentName> <EventName> <TicketID>`) and digital ticket IDs.
- **👥 Flexible Registration Modes**: Individual and Team/Group registrations with full member name and email collection.
- **📊 Real-time Operations & Analytics**: Real-time attendee verification, gate check-in status, pass revocation, and revenue tracking via Supabase Realtime.
- **🔐 Multi-Role Access**: Organizer Control Dashboard and Student Participant Portal with instant session switching.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Framer Motion, Vanilla CSS Design System
- **Backend & Database**: Supabase (PostgreSQL, Realtime subscriptions, Auth)
- **Charts & QR**: Recharts, QRCode.react, date-fns
- **Deployment**: Vercel ready (`vercel.json` SPA routing rewrites included)

---

## 🚀 Getting Started Locally

```bash
# Clone the repository
git clone https://github.com/adithyen/VibeVenue.git
cd VibeVenue

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Start development server
npm run dev
```

---

## 🌐 Deploying to Vercel

1. Push your repository to GitHub: `https://github.com/adithyen/VibeVenue`
2. Import the project into **[Vercel](https://vercel.com/)**.
3. Under **Settings → Environment Variables**, add the following:
   - `VITE_SUPABASE_URL` = Your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = Your Supabase Anon Public Key
   - `VITE_GOOGLE_CLIENT_ID` = *(Optional)* Google OAuth Client ID
4. Click **Deploy**. Vercel will automatically build the app with zero configuration using the included `vercel.json`!

---

## 📄 License

MIT © [adithyen](https://github.com/adithyen)
