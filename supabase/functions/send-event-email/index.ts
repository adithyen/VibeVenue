import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "VibeVenue Events <tickets@vibevenue.adithyen.me>";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Universal Resend Dispatcher
 */
async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!to || !RESEND_API_KEY) {
    console.error("[send-event-email] Missing recipient or RESEND_API_KEY", { to, hasKey: Boolean(RESEND_API_KEY) });
    return { success: false, error: "Missing recipient or API key" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("[send-event-email] Resend API error:", data);
    return { success: false, error: data.message || "Resend API error" };
  }

  console.log(`[send-event-email] Email delivered to ${to} (ID: ${data.id})`);
  return { success: true, id: data.id };
}

/**
 * Modern 2026 Lite-Darker Gradient Email Wrapper
 * Features a rich luminous slate/navy-indigo gradient backdrop instead of plain pitch black.
 */
function wrapEmailTemplate({
  title,
  preheader,
  content,
  badgeText,
  badgeColor = "#6366F1",
}: {
  title: string;
  preheader: string;
  content: string;
  badgeText: string;
  badgeColor?: string;
}) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #151D2C !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
  </style>
</head>
<body bgcolor="#151D2C" style="background-color: #151D2C; background: linear-gradient(135deg, #182338 0%, #202D48 50%, #151D2C 100%); margin: 0; padding: 0;">
  <!-- Hidden Preheader Text -->
  <div style="display: none; font-size: 1px; color: #151D2C; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${preheader}
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#151D2C" style="background-color: #151D2C; background: linear-gradient(135deg, #182338 0%, #202D48 50%, #151D2C 100%); min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <!-- Main Card Container -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#1C273C" style="max-width: 590px; background-color: #1C273C; background: linear-gradient(180deg, #202C44 0%, #162032 100%); border: 1.5px solid #364866; border-radius: 18px; overflow: hidden; box-shadow: 0 24px 48px rgba(0,0,0,0.4);">
          <!-- Header Branding -->
          <tr>
            <td bgcolor="#22304A" style="padding: 24px 32px 20px; border-bottom: 1.5px solid #364866; background-color: #22304A; background: linear-gradient(135deg, #2B3D5E 0%, #1D2A42 100%);">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td valign="middle">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td valign="middle" style="padding-right: 14px;">
                          <!-- Brand Icon -->
                          <div style="width: 40px; height: 40px; background-color: #1A263D; border: 1.5px solid #818CF8; border-radius: 12px; text-align: center; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(99,102,241,0.3);">
                            <svg width="26" height="26" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:auto;">
                              <path d="M17 11.5C19.1 9.8 21.4 9 24 9C26.6 9 28.9 9.8 31 11.5" stroke="#818CF8" stroke-width="2.5" stroke-linecap="round"/>
                              <circle cx="24" cy="12" r="2.5" fill="#38BDF8"/>
                              <path d="M11 15L24 38L27.5 31L18 15H11Z" fill="#818CF8"/>
                              <path d="M37 15L24 38L20.5 31L30 15H37Z" fill="#06B6D4"/>
                              <path d="M24 19L20 27.5H28L24 19Z" fill="#FFFFFF"/>
                            </svg>
                          </div>
                        </td>
                        <td valign="middle">
                          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: #FFFFFF; line-height: 1.2;">
                            Vibe<span style="color: #38BDF8;">Venue</span>
                          </div>
                          <div style="font-family: 'JetBrains Mono', Monaco, Consolas, monospace; font-size: 10px; font-weight: 700; color: #93C5FD; letter-spacing: 1.2px; text-transform: uppercase; margin-top: 2px;">
                            Event Operations
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" valign="middle">
                    <span style="display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 800; font-family: monospace; background-color: ${badgeColor}26; color: ${badgeColor}; border: 1.5px solid ${badgeColor}66; letter-spacing: 0.5px; text-transform: uppercase;">
                      ${badgeText}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 34px 32px 28px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td bgcolor="#151E2E" style="padding: 24px 32px; background-color: #151E2E; background: linear-gradient(180deg, #172234 0%, #111826 100%); border-top: 1.5px solid #2F3E57; text-align: center;">
              <p style="margin: 0 0 6px; font-size: 12px; color: #94A3B8; font-weight: 500;">
                VibeVenue Automated Event Management & Gate Credentials
              </p>
              <p style="margin: 0; font-size: 11px; color: #64748B; font-family: monospace;">
                Official Notification · Deliverable to verified student credentials
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const payload = await req.json();
    console.log("[send-event-email] Received payload:", JSON.stringify(payload, null, 2));

    const { type, record, old_record, action } = payload;

    // Handle Direct Custom Invocations
    if (action === "send_custom") {
      const { to, subject, html } = payload;
      const res = await sendEmail({ to, subject, html });
      return new Response(JSON.stringify(res), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    // Must have a record to process DB triggers
    const currentRecord = record || payload;
    if (!currentRecord || !currentRecord.email) {
      console.log("[send-event-email] No record or email provided. Skipping.");
      return new Response(JSON.stringify({ skipped: true, reason: "No record or email" }), { status: 200 });
    }

    const { email, full_name, ticket_id, status, event_id, total_paid, pricing_tier } = currentRecord;
    const recipientName = full_name || "Delegate";
    const ticketId = ticket_id || "TCK-VERIFIED";

    // Fetch related event details
    let eventName = "Campus Technical Event";
    let eventDate = "Announced Soon";
    let eventTime = "";
    let eventVenue = "Campus Venue";
    let whatsappLink = "";

    if (event_id) {
      const { data: eventData } = await supabase
        .from("events")
        .select("name, start_date, start_time, venue, meeting_link, whatsapp_link")
        .eq("id", event_id)
        .maybeSingle();

      if (eventData) {
        eventName = eventData.name || eventName;
        eventDate = eventData.start_date || eventDate;
        eventTime = eventData.start_time || "";
        eventVenue = eventData.venue || eventData.meeting_link || eventVenue;
        whatsappLink = eventData.whatsapp_link || "";
      }
    }

    // ─────────────────────────────────────────────────────────────
    // SCENARIO 1: New Confirmed Registration (INSERT + confirmed)
    // ─────────────────────────────────────────────────────────────
    if ((type === "INSERT" && status === "confirmed") || (payload.forceScenario === "confirmed")) {
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(ticketId)}&margin=4`;

      const content = `
        <div style="text-align: center; margin-bottom: 26px;">
          <div style="font-size: 44px; line-height: 1; margin-bottom: 12px;">🎉</div>
          <h1 style="margin: 0 0 6px; font-size: 24px; font-weight: 800; color: #F8FAFC;">Registration Confirmed!</h1>
          <p style="margin: 0; font-size: 14px; color: #94A3B8;">Your official digital gate pass is ready. Please present this at the venue entrance.</p>
        </div>

        <!-- Ticket Box -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#19263E" style="background-color: #19263E; background: linear-gradient(135deg, #1F3050 0%, #152035 100%); border: 1.5px solid #3B82F6; border-radius: 14px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 22px;">
              <div style="font-family: monospace; font-size: 11px; color: #38BDF8; font-weight: 700; margin-bottom: 6px; text-transform: uppercase;">
                OFFICIAL GATE CREDENTIAL
              </div>
              <h2 style="margin: 0 0 16px; font-size: 19px; color: #FFFFFF; font-weight: 800;">${eventName}</h2>
              
              <table width="100%" cellspacing="0" cellpadding="0" border="0" style="font-family: monospace; font-size: 13px; margin-bottom: 18px;">
                <tr>
                  <td style="padding: 6px 0; color: #94A3B8;">📅 DATE & TIME</td>
                  <td style="padding: 6px 0; color: #F8FAFC; text-align: right; font-weight: 600;">${eventDate} ${eventTime ? `• ${eventTime}` : ""}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #94A3B8;">📍 VENUE</td>
                  <td style="padding: 6px 0; color: #F8FAFC; text-align: right; font-weight: 600;">${eventVenue}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #94A3B8;">👤 DELEGATE</td>
                  <td style="padding: 6px 0; color: #F8FAFC; text-align: right; font-weight: 600;">${recipientName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #94A3B8;">🏷️ CATEGORY</td>
                  <td style="padding: 6px 0; color: #F8FAFC; text-align: right; font-weight: 600;">${pricing_tier || "General Delegate"}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #94A3B8;">💳 AMOUNT PAID</td>
                  <td style="padding: 6px 0; color: #10B981; text-align: right; font-weight: 700;">₹${total_paid || 0}</td>
                </tr>
              </table>

              <!-- Official Scannable QR Badge -->
              <div style="text-align: center; margin: 18px 0 10px;">
                <div style="display: inline-block; background-color: #FFFFFF; padding: 12px; border-radius: 12px; border: 2px solid #38BDF8; box-shadow: 0 8px 24px rgba(0,0,0,0.35);">
                  <img
                    src="${qrCodeUrl}"
                    width="160"
                    height="160"
                    alt="Ticket QR Pass"
                    style="display: block; border-radius: 4px;"
                  />
                </div>
                <div style="margin-top: 10px;">
                  <span style="font-size: 11px; color: #94A3B8; font-family: monospace; display: block; letter-spacing: 1px;">PRESENT THIS QR AT GATE CHECK-IN</span>
                  <span style="font-size: 20px; font-weight: 800; color: #60A5FA; letter-spacing: 3px; font-family: monospace;">${ticketId}</span>
                </div>
              </div>
            </td>
          </tr>
        </table>

        ${whatsappLink ? `
          <div style="text-align: center; margin-bottom: 20px;">
            <a href="${whatsappLink}" target="_blank" style="display: inline-block; background-color: #22C55E; color: #000000; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 24px; border-radius: 8px;">
              💬 Join Event WhatsApp Community
            </a>
          </div>
        ` : ""}

        <p style="margin: 0; font-size: 13px; color: #94A3B8; text-align: center; line-height: 1.5;">
          You can access and present this live ticket at any time by logging into your <strong>VibeVenue Student Portal</strong>.
        </p>
      `;

      const html = wrapEmailTemplate({
        title: `Pass Confirmed: ${eventName}`,
        preheader: `Your official pass for ${eventName} is confirmed! Ticket ID: ${ticketId}`,
        content,
        badgeText: "CONFIRMED PASS",
        badgeColor: "#3B82F6",
      });

      const res = await sendEmail({
        to: email,
        subject: `🎟️ Pass Confirmed: ${eventName} (${ticketId})`,
        html,
      });

      return new Response(JSON.stringify(res), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    // ─────────────────────────────────────────────────────────────
    // SCENARIO 2: New Waitlist Registration (INSERT + waitlisted)
    // ─────────────────────────────────────────────────────────────
    if ((type === "INSERT" && status === "waitlisted") || (payload.forceScenario === "waitlisted")) {
      // Calculate dynamic queue position accurately from DB count
      let queuePosition = 1;
      if (payload.position) {
        queuePosition = payload.position;
      } else if (event_id) {
        const registeredAt = currentRecord.registered_at || new Date().toISOString();
        const { count, error: countErr } = await supabase
          .from("registrations")
          .select("id", { count: "exact", head: true })
          .eq("event_id", event_id)
          .eq("status", "waitlisted")
          .lte("registered_at", registeredAt);

        if (!countErr && typeof count === "number" && count > 0) {
          queuePosition = count;
        }
      }

      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(ticketId)}&margin=4`;

      const content = `
        <div style="text-align: center; margin-bottom: 26px;">
          <div style="font-size: 44px; line-height: 1; margin-bottom: 12px;">📋</div>
          <h1 style="margin: 0 0 6px; font-size: 24px; font-weight: 800; color: #F8FAFC;">You're on the Waiting List</h1>
          <p style="margin: 0; font-size: 15px; color: #FBBF24; font-weight: 700;">Queue Position #${queuePosition} in Line</p>
        </div>

        <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#281C14" style="background-color: #281C14; background: linear-gradient(135deg, #362417 0%, #20150E 100%); border: 1.5px solid #F59E0B; border-radius: 14px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 22px;">
              <div style="font-family: monospace; font-size: 11px; color: #FBBF24; font-weight: 700; margin-bottom: 6px; text-transform: uppercase;">
                WAITLIST REGISTRATION RECEIPT
              </div>
              <h2 style="margin: 0 0 10px; font-size: 19px; color: #FFFFFF; font-weight: 800;">${eventName}</h2>
              <p style="font-size: 13px; color: #CBD5E1; line-height: 1.5; margin: 0 0 16px;">
                Standard venue limit for this event has been reached. Your pass has been securely queued at <strong>Position #${queuePosition}</strong>.
              </p>

              <table width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#1A110A" style="font-family: monospace; font-size: 13px; margin-bottom: 16px; background-color: #1A110A; border-radius: 8px; padding: 12px;">
                <tr>
                  <td style="padding: 6px 0; color: #94A3B8;">🎫 PASS CODE</td>
                  <td style="padding: 6px 0; color: #FBBF24; text-align: right; font-weight: 700;">${ticketId}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #94A3B8;">🔢 QUEUE POSITION</td>
                  <td style="padding: 6px 0; color: #F59E0B; text-align: right; font-weight: 800;">#${queuePosition}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #94A3B8;">👤 DELEGATE</td>
                  <td style="padding: 6px 0; color: #F8FAFC; text-align: right; font-weight: 600;">${recipientName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #94A3B8;">📅 EVENT DATE</td>
                  <td style="padding: 6px 0; color: #F8FAFC; text-align: right;">${eventDate}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #94A3B8;">🏷️ STATUS</td>
                  <td style="padding: 6px 0; color: #F59E0B; text-align: right; font-weight: 800;">WAITLISTED (#${queuePosition})</td>
                </tr>
              </table>

              <!-- Waitlist Live QR Tracking Badge -->
              <div style="text-align: center; margin: 18px 0 12px;">
                <div style="display: inline-block; background-color: #FFFFFF; padding: 12px; border-radius: 12px; border: 2px solid #F59E0B; box-shadow: 0 8px 24px rgba(0,0,0,0.35);">
                  <img
                    src="${qrCodeUrl}"
                    width="150"
                    height="150"
                    alt="Waitlist QR Pass"
                    style="display: block; border-radius: 4px;"
                  />
                </div>
                <div style="margin-top: 10px;">
                  <span style="font-size: 11px; color: #94A3B8; font-family: monospace; display: block; letter-spacing: 1px;">WAITLIST QUEUE TRACKING PASS</span>
                  <span style="font-size: 20px; font-weight: 800; color: #FBBF24; letter-spacing: 3px; font-family: monospace;">${ticketId}</span>
                  <span style="display: block; font-size: 13px; font-weight: 700; color: #F59E0B; margin-top: 4px; font-family: monospace;">POSITION #${queuePosition}</span>
                </div>
              </div>

              <!-- Auto-promotion notice -->
              <div style="background-color: rgba(245, 158, 11, 0.14); border-left: 3px solid #F59E0B; padding: 14px; border-radius: 6px; margin-top: 16px;">
                <strong style="color: #FBBF24; font-size: 13px; display: block; margin-bottom: 4px;">⚡ Automatic Upgradation System</strong>
                <span style="color: #CBD5E1; font-size: 12px; line-height: 1.5; display: block;">
                  If any confirmed participant cancels their registration, your pass will automatically upgrade to <strong>Confirmed</strong> and your gate pass QR credentials will be generated and delivered instantly.
                </span>
              </div>
            </td>
          </tr>
        </table>

        <p style="margin: 0; font-size: 13px; color: #94A3B8; text-align: center; line-height: 1.5;">
          You can track your live queue standing anytime in your <strong>VibeVenue Student Portal</strong>.
        </p>
      `;

      const html = wrapEmailTemplate({
        title: `Waiting List Confirmation: ${eventName}`,
        preheader: `You are #${queuePosition} on the waiting list for ${eventName}. Ticket ID: ${ticketId}`,
        content,
        badgeText: `WAITLIST #${queuePosition}`,
        badgeColor: "#F59E0B",
      });

      const res = await sendEmail({
        to: email,
        subject: `📋 Waiting List Confirmation: ${eventName} (Position #${queuePosition})`,
        html,
      });

      return new Response(JSON.stringify(res), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    // ─────────────────────────────────────────────────────────────
    // SCENARIO 3: Promoted or Confirmed (UPDATE -> confirmed)
    // ─────────────────────────────────────────────────────────────
    if ((type === "UPDATE" && old_record?.status !== "confirmed" && status === "confirmed") || (payload.forceScenario === "promoted")) {
      const isFromWaitlist = old_record?.status === "waitlisted" || payload.isFromWaitlist === true;
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(ticketId)}&margin=4`;

      const content = `
        <div style="text-align: center; margin-bottom: 26px;">
          <div style="font-size: 48px; line-height: 1; margin-bottom: 12px;">${isFromWaitlist ? "🚀" : "🎉"}</div>
          <h1 style="margin: 0 0 6px; font-size: 24px; font-weight: 800; color: #10B981;">
            ${isFromWaitlist ? "You're In! Pass Confirmed" : "Registration Confirmed!"}
          </h1>
          <p style="margin: 0; font-size: 14px; color: #CBD5E1;">
            ${isFromWaitlist 
              ? "A seat opened up and your ticket has been automatically upgraded from the waiting list!" 
              : "Your registration is confirmed. Please present your pass at the entrance."}
          </p>
        </div>

        <!-- Highlight Box -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#113227" style="background-color: #113227; background: linear-gradient(135deg, #174234 0%, #0C251C 100%); border: 2px solid #10B981; border-radius: 14px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 22px;">
              <div style="font-family: monospace; font-size: 11px; color: #6EE7B7; font-weight: 700; margin-bottom: 6px; text-transform: uppercase;">
                ${isFromWaitlist ? "PROMOTION NOTICE" : "OFFICIAL GATE CREDENTIAL"}
              </div>
              <h2 style="margin: 0 0 14px; font-size: 19px; color: #FFFFFF; font-weight: 800;">${eventName}</h2>

              <p style="font-size: 13px; color: #D1FAE5; line-height: 1.5; margin: 0 0 16px;">
                Congratulations <strong>${recipientName}</strong>! Your pass <strong>${ticketId}</strong> is officially a <strong>CONFIRMED GATE PASS</strong>.
              </p>

              <table width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#091A14" style="font-family: monospace; font-size: 13px; background-color: #091A14; border-radius: 8px; padding: 12px; margin-bottom: 14px;">
                <tr>
                  <td style="padding: 4px 0; color: #A7F3D0;">📅 DATE</td>
                  <td style="padding: 4px 0; color: #FFFFFF; text-align: right; font-weight: 700;">${eventDate} ${eventTime ? `(${eventTime})` : ""}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #A7F3D0;">📍 LOCATION</td>
                  <td style="padding: 4px 0; color: #FFFFFF; text-align: right; font-weight: 700;">${eventVenue}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #A7F3D0;">🎟️ TICKET ID</td>
                  <td style="padding: 4px 0; color: #6EE7B7; text-align: right; font-weight: 800;">${ticketId}</td>
                </tr>
              </table>

              <!-- Official Scannable QR Badge -->
              <div style="text-align: center; margin: 18px 0 6px;">
                <div style="display: inline-block; background-color: #FFFFFF; padding: 12px; border-radius: 12px; border: 2px solid #10B981; box-shadow: 0 8px 24px rgba(0,0,0,0.35);">
                  <img
                    src="${qrCodeUrl}"
                    width="160"
                    height="160"
                    alt="Ticket QR Pass"
                    style="display: block; border-radius: 4px;"
                  />
                </div>
                <div style="margin-top: 10px;">
                  <span style="font-size: 11px; color: #A7F3D0; font-family: monospace; display: block; letter-spacing: 1px;">PRESENT THIS QR AT ENTRANCE</span>
                  <span style="font-size: 20px; font-weight: 800; color: #34D399; letter-spacing: 3px; font-family: monospace;">${ticketId}</span>
                </div>
              </div>
            </td>
          </tr>
        </table>

        ${whatsappLink ? `
          <div style="text-align: center; margin-bottom: 20px;">
            <a href="${whatsappLink}" target="_blank" style="display: inline-block; background-color: #22C55E; color: #000000; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 24px; border-radius: 8px;">
              💬 Join Event WhatsApp Community
            </a>
          </div>
        ` : ""}

        <p style="margin: 0; font-size: 13px; color: #94A3B8; text-align: center; line-height: 1.5;">
          Your updated QR credential is now live in your <strong>VibeVenue Student Portal</strong>.
        </p>
      `;

      const html = wrapEmailTemplate({
        title: `Pass Confirmed: ${eventName}`,
        preheader: `Your pass for ${eventName} is confirmed! Ticket ID: ${ticketId}`,
        content,
        badgeText: "✓ CONFIRMED PASS",
        badgeColor: "#10B981",
      });

      const res = await sendEmail({
        to: email,
        subject: `🚀 ${isFromWaitlist ? "Great News! You're Confirmed" : "Pass Confirmed"}: ${eventName} (${ticketId})`,
        html,
      });

      return new Response(JSON.stringify(res), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    // ─────────────────────────────────────────────────────────────
    // SCENARIO 4: Registration Cancelled (UPDATE status -> cancelled)
    // ─────────────────────────────────────────────────────────────
    if ((type === "UPDATE" && old_record?.status !== "cancelled" && status === "cancelled") || (payload.forceScenario === "cancelled")) {
      const wasWaitlisted = old_record?.status === "waitlisted";

      const content = `
        <div style="text-align: center; margin-bottom: 26px;">
          <div style="font-size: 44px; line-height: 1; margin-bottom: 12px;">❌</div>
          <h1 style="margin: 0 0 6px; font-size: 24px; font-weight: 800; color: #F43F5E;">Registration Cancelled</h1>
          <p style="margin: 0; font-size: 14px; color: #CBD5E1;">Your registration and gate credential have been revoked.</p>
        </div>

        <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#2E131C" style="background-color: #2E131C; background: linear-gradient(135deg, #3D1826 0%, #220D15 100%); border: 1.5px solid #F43F5E; border-radius: 14px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 22px;">
              <h2 style="margin: 0 0 10px; font-size: 18px; color: #FFFFFF; font-weight: 700;">${eventName}</h2>
              <p style="font-size: 14px; color: #FDA4AF; line-height: 1.6; margin: 0 0 16px;">
                Hi <strong>${recipientName}</strong>, your ${wasWaitlisted ? "waiting list entry" : "gate pass"} (<code>${ticketId}</code>) has been successfully cancelled as requested.
              </p>

              <table width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#1D0B12" style="background-color: #1D0B12; border-radius: 8px; padding: 12px; font-family: monospace; font-size: 13px; margin-bottom: 14px;">
                <tr>
                  <td style="padding: 4px 0; color: #FDA4AF;">PASS ID</td>
                  <td style="padding: 4px 0; color: #FFFFFF; text-align: right; font-weight: 700;">${ticketId}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #FDA4AF;">STATUS</td>
                  <td style="padding: 4px 0; color: #F43F5E; text-align: right; font-weight: 800;">CANCELLED / REVOKED</td>
                </tr>
              </table>

              ${!wasWaitlisted ? `
                <div style="background-color: rgba(244, 63, 94, 0.12); border-left: 3px solid #F43F5E; padding: 12px 14px; border-radius: 6px;">
                  <span style="color: #FDA4AF; font-size: 12px; line-height: 1.5; display: block;">
                    ⚡ <strong>Seat Reallocated:</strong> Your vacated seat has been automatically released and offered to the next attendee waiting in line.
                  </span>
                </div>
              ` : ""}
            </td>
          </tr>
        </table>

        <p style="margin: 0; font-size: 12px; color: #94A3B8; text-align: center;">
          If you did not request this cancellation or believe this was an error, please contact the event organizing desk.
        </p>
      `;

      const html = wrapEmailTemplate({
        title: `Registration Cancelled: ${eventName}`,
        preheader: `Your registration for ${eventName} has been cancelled`,
        content,
        badgeText: "CANCELLED",
        badgeColor: "#F43F5E",
      });

      const res = await sendEmail({
        to: email,
        subject: `❌ Registration Cancelled: ${eventName} (${ticketId})`,
        html,
      });

      return new Response(JSON.stringify(res), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    // ─────────────────────────────────────────────────────────────
    // SCENARIO 5: Waitlist Queue Shift Notification
    // ─────────────────────────────────────────────────────────────
    if (action === "queue_shift" || payload.forceScenario === "queue_shift") {
      const oldPos = payload.oldPosition || 2;
      const newPos = payload.newPosition || 1;
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(ticketId)}&margin=4`;

      const content = `
        <div style="text-align: center; margin-bottom: 26px;">
          <div style="font-size: 44px; line-height: 1; margin-bottom: 12px;">📈</div>
          <h1 style="margin: 0 0 6px; font-size: 24px; font-weight: 800; color: #F8FAFC;">You Moved Up in the Queue!</h1>
          <p style="margin: 0; font-size: 15px; color: #38BDF8; font-weight: 700;">
            Position #${oldPos} ➔ <span style="font-size: 18px; color: #10B981; font-weight: 800;">Position #${newPos}</span>
          </p>
        </div>

        <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#152A42" style="background-color: #152A42; background: linear-gradient(135deg, #1B3654 0%, #112033 100%); border: 1.5px solid #0EA5E9; border-radius: 14px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 22px;">
              <h2 style="margin: 0 0 10px; font-size: 18px; color: #FFFFFF; font-weight: 700;">${eventName}</h2>
              <p style="font-size: 13px; color: #CBD5E1; line-height: 1.5; margin: 0 0 16px;">
                Hi <strong>${recipientName}</strong>, a seat vacancy has advanced your standing in the waiting list closer to confirmation!
              </p>

              <table width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#0D1A29" style="background-color: #0D1A29; border-radius: 8px; padding: 14px; font-family: monospace; font-size: 13px; margin-bottom: 16px;">
                <tr>
                  <td style="padding: 4px 0; color: #94A3B8;">PASS ID:</td>
                  <td style="padding: 4px 0; color: #F8FAFC; text-align: right; font-weight: 700;">${ticketId}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #94A3B8;">NEW STANDING:</td>
                  <td style="padding: 4px 0; color: #10B981; text-align: right; font-weight: 800;">#${newPos} IN LINE</td>
                </tr>
              </table>

              <!-- Waitlist QR Tracking Badge -->
              <div style="text-align: center; margin: 16px 0 12px;">
                <div style="display: inline-block; background-color: #FFFFFF; padding: 10px; border-radius: 10px; border: 2px solid #0EA5E9; box-shadow: 0 4px 12px rgba(0,0,0,0.35);">
                  <img
                    src="${qrCodeUrl}"
                    width="140"
                    height="140"
                    alt="Waitlist QR Pass"
                    style="display: block; border-radius: 4px;"
                  />
                </div>
                <div style="margin-top: 8px;">
                  <span style="font-size: 11px; color: #94A3B8; font-family: monospace; display: block;">UPDATED QUEUE PASS</span>
                  <span style="font-size: 18px; font-weight: 800; color: #38BDF8; letter-spacing: 2px; font-family: monospace;">${ticketId}</span>
                  <span style="display: block; font-size: 13px; font-weight: 700; color: #10B981; margin-top: 4px; font-family: monospace;">POSITION #${newPos}</span>
                </div>
              </div>
            </td>
          </tr>
        </table>

        <p style="margin: 0; font-size: 12px; color: #94A3B8; text-align: center;">
          We will notify you immediately if you are promoted to a Confirmed Pass.
        </p>
      `;

      const html = wrapEmailTemplate({
        title: `Queue Update: Position #${newPos} for ${eventName}`,
        preheader: `You moved up in the waitlist! Now at position #${newPos}`,
        content,
        badgeText: `QUEUE #${newPos}`,
        badgeColor: "#0EA5E9",
      });

      const res = await sendEmail({
        to: email,
        subject: `📈 Queue Update: Advanced to #${newPos} for ${eventName}`,
        html,
      });

      return new Response(JSON.stringify(res), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ skipped: true, reason: `Unmatched event: ${type} ${status}` }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[send-event-email] Fatal error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
