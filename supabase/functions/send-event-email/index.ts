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
 * Modern 2026 Dark UI Email Wrapper
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
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #060913; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
  </style>
</head>
<body style="background-color: #060913; margin: 0; padding: 0;">
  <!-- Hidden Preheader Text -->
  <div style="display: none; font-size: 1px; color: #060913; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${preheader}
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #060913;">
    <tr>
      <td align="center" style="padding: 30px 15px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #0B0F19; border: 1px solid #1E293B; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
          <!-- Header Branding -->
          <tr>
            <td style="padding: 28px 32px 20px; border-bottom: 1px solid #1E293B; background: linear-gradient(180deg, #111827 0%, #0B0F19 100%);">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <span style="font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: #FFFFFF;">
                      Vibe<span style="color: #6366F1;">Venue</span>
                    </span>
                    <span style="font-size: 11px; font-family: monospace; color: #64748B; margin-left: 8px; letter-spacing: 1px;">OPERATIONS</span>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; font-family: monospace; background-color: ${badgeColor}22; color: ${badgeColor}; border: 1px solid ${badgeColor}55;">
                      ${badgeText}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 32px 32px 28px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #070A12; border-top: 1px solid #1E293B; text-align: center;">
              <p style="margin: 0 0 6px; font-size: 12px; color: #475569;">
                VibeVenue Automated Event Management & Gate Credentials
              </p>
              <p style="margin: 0; font-size: 11px; color: #334155; font-family: monospace;">
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
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="font-size: 40px; line-height: 1; margin-bottom: 12px;">🎉</div>
          <h1 style="margin: 0 0 6px; font-size: 22px; font-weight: 700; color: #F8FAFC;">Registration Confirmed!</h1>
          <p style="margin: 0; font-size: 14px; color: #94A3B8;">Your official digital gate pass is ready. Please present this at the venue entrance.</p>
        </div>

        <!-- Ticket Box -->
        <div style="background-color: #131E36; border: 1.5px solid #2563EB; border-radius: 12px; padding: 22px; margin-bottom: 24px;">
          <div style="font-family: monospace; font-size: 11px; color: #38BDF8; font-weight: 700; margin-bottom: 4px; text-transform: uppercase;">
            OFFICIAL GATE CREDENTIAL
          </div>
          <h2 style="margin: 0 0 14px; font-size: 18px; color: #FFFFFF; font-weight: 700;">${eventName}</h2>
          
          <table width="100%" cellspacing="0" cellpadding="0" border="0" style="font-family: monospace; font-size: 13px; margin-bottom: 16px;">
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
              <td style="padding: 6px 0; color: #94A3B8;">💳 AMOUNT PAID</td>
              <td style="padding: 6px 0; color: #10B981; text-align: right; font-weight: 700;">₹${total_paid || 0}</td>
            </tr>
          </table>

          <!-- Official Scannable QR Badge -->
          <div style="text-align: center; margin: 18px 0 10px;">
            <div style="display: inline-block; background-color: #FFFFFF; padding: 12px; border-radius: 12px; border: 2px solid #38BDF8; box-shadow: 0 8px 24px rgba(0,0,0,0.4);">
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
        </div>

        ${whatsappLink ? `
          <div style="text-align: center; margin-bottom: 20px;">
            <a href="${whatsappLink}" target="_blank" style="display: inline-block; background-color: #22C55E; color: #000000; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 24px; border-radius: 8px;">
              💬 Join Event WhatsApp Community
            </a>
          </div>
        ` : ""}

        <p style="margin: 0; font-size: 13px; color: #64748B; text-align: center; line-height: 1.5;">
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
      const content = `
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="font-size: 40px; line-height: 1; margin-bottom: 12px;">📋</div>
          <h1 style="margin: 0 0 6px; font-size: 22px; font-weight: 700; color: #F8FAFC;">You're on the Waiting List</h1>
          <p style="margin: 0; font-size: 14px; color: #94A3B8;">Regular delegate seats are currently full. You've secured a queue spot.</p>
        </div>

        <div style="background-color: #261B0F; border: 1.5px solid #F59E0B; border-radius: 12px; padding: 22px; margin-bottom: 24px;">
          <h2 style="margin: 0 0 10px; font-size: 18px; color: #FFFFFF; font-weight: 700;">${eventName}</h2>
          <p style="font-size: 13px; color: #FDE68A; line-height: 1.5; margin: 0 0 16px;">
            Hi <strong>${recipientName}</strong>, your waitlisted pass is registered under ticket ID <code>${ticketId}</code>.
          </p>

          <div style="background-color: #1A1308; border-radius: 8px; padding: 14px; font-family: monospace; font-size: 13px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="color: #94A3B8;">PASS ID:</span>
              <span style="color: #F8FAFC; font-weight: 700;">${ticketId}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #94A3B8;">STATUS:</span>
              <span style="color: #F59E0B; font-weight: 800;">WAITLISTED</span>
            </div>
          </div>
        </div>

        <p style="margin: 0; font-size: 13px; color: #94A3B8; text-align: center; line-height: 1.5;">
          ⚡ <strong>Automatic Promotion:</strong> If any confirmed participant cancels their registration, your pass will automatically upgrade to Confirmed and your QR gate pass will be generated instantly.
        </p>
      `;

      const html = wrapEmailTemplate({
        title: `Waiting List Confirmation: ${eventName}`,
        preheader: `You have joined the waiting list for ${eventName}. Ticket ID: ${ticketId}`,
        content,
        badgeText: "WAITLIST QUEUE",
        badgeColor: "#F59E0B",
      });

      const res = await sendEmail({
        to: email,
        subject: `📋 Waiting List Confirmation: ${eventName} (${ticketId})`,
        html,
      });

      return new Response(JSON.stringify(res), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    // ─────────────────────────────────────────────────────────────
    // SCENARIO 3: Promoted or Confirmed (UPDATE -> confirmed)
    // ─────────────────────────────────────────────────────────────
    if ((type === "UPDATE" && old_record?.status !== "confirmed" && status === "confirmed") || (payload.forceScenario === "promoted")) {
      const isFromWaitlist = old_record?.status === "waitlisted";
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(ticketId)}&margin=4`;

      const content = `
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="font-size: 46px; line-height: 1; margin-bottom: 12px;">${isFromWaitlist ? "🚀" : "🎉"}</div>
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
        <div style="background-color: #064E3B; border: 2px solid #10B981; border-radius: 12px; padding: 22px; margin-bottom: 24px;">
          <div style="font-family: monospace; font-size: 11px; color: #6EE7B7; font-weight: 700; margin-bottom: 4px; text-transform: uppercase;">
            ${isFromWaitlist ? "PROMOTION NOTICE" : "OFFICIAL GATE CREDENTIAL"}
          </div>
          <h2 style="margin: 0 0 14px; font-size: 19px; color: #FFFFFF; font-weight: 800;">${eventName}</h2>

          <p style="font-size: 13px; color: #D1FAE5; line-height: 1.5; margin: 0 0 16px;">
            Hi <strong>${recipientName}</strong>, your pass <strong>${ticketId}</strong> is officially a <strong>CONFIRMED GATE PASS</strong>.
          </p>

          <table width="100%" cellspacing="0" cellpadding="0" border="0" style="font-family: monospace; font-size: 13px; background: rgba(0,0,0,0.25); border-radius: 8px; padding: 12px; margin-bottom: 12px;">
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
            <div style="display: inline-block; background-color: #FFFFFF; padding: 12px; border-radius: 12px; border: 2px solid #10B981; box-shadow: 0 8px 24px rgba(0,0,0,0.4);">
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
        </div>

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
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="font-size: 40px; line-height: 1; margin-bottom: 12px;">❌</div>
          <h1 style="margin: 0 0 6px; font-size: 22px; font-weight: 700; color: #F8FAFC;">Registration Cancelled</h1>
          <p style="margin: 0; font-size: 14px; color: #94A3B8;">Your registration and gate credential have been revoked.</p>
        </div>

        <div style="background-color: #1E1218; border: 1.5px solid #E11D48; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h2 style="margin: 0 0 10px; font-size: 17px; color: #FFFFFF;">${eventName}</h2>
          <p style="font-size: 13px; color: #FDA4AF; line-height: 1.5; margin: 0 0 12px;">
            Hi <strong>${recipientName}</strong>, your ${wasWaitlisted ? "waiting list entry" : "gate pass"} (<code>${ticketId}</code>) has been cancelled as requested.
          </p>
          ${!wasWaitlisted ? `
            <p style="font-size: 12px; color: #94A3B8; margin: 0;">
              Your vacated seat has been automatically offered to the next delegate on the waiting list.
            </p>
          ` : ""}
        </div>

        <p style="margin: 0; font-size: 12px; color: #64748B; text-align: center;">
          If you did not request this cancellation or believe this was an error, please contact the event organizing desk.
        </p>
      `;

      const html = wrapEmailTemplate({
        title: `Registration Cancelled: ${eventName}`,
        preheader: `Your registration for ${eventName} has been cancelled`,
        content,
        badgeText: "CANCELLED",
        badgeColor: "#E11D48",
      });

      const res = await sendEmail({
        to: email,
        subject: `❌ Registration Cancelled: ${eventName} (${ticketId})`,
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
