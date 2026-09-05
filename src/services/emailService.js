// ============================================================
//  VIBEVENUE — RESEND EMAIL AUTOMATION SERVICE
//  Delivers responsive, transactional HTML emails for:
//  - 🎟️ Confirmed Ticket Pass (with Scannable QR Gate Pass)
//  - 📋 Waiting List Ticket (with Dynamic Queue Position & Tracking QR)
//  - 📈 Queue Advancement (e.g. #2 -> #1 with Updated QR)
//  - 🚀 Promoted from Waitlist to Confirmed (with Confirmed QR Gate Pass)
//  - ❌ Registration Cancelled
// ============================================================

const RESEND_API_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_RESEND_API_KEY) ||
  (typeof process !== 'undefined' && process.env?.VITE_RESEND_API_KEY) ||
  '';
const FROM_EMAIL = 'VibeVenue Events <tickets@vibevenue.adithyen.me>';

const EDGE_FUNCTION_URL =
  ((typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
   (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
   'https://yrvijufespplklfnvsfg.supabase.co') + '/functions/v1/send-event-email';

/**
 * Universal dispatcher using Supabase Edge Function (CORS-friendly for browsers) with direct Resend fallback
 */
const sendRawEmail = async ({ to, subject, html }) => {
  if (!to) {
    console.warn('[EmailService] No recipient address provided');
    return { success: false, error: 'No recipient email' };
  }

  // 1. Primary path: Supabase Edge Function (works across all browsers with CORS allowed)
  try {
    const edgeRes = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'send_custom',
        to,
        subject,
        html,
      }),
    });

    if (edgeRes.ok) {
      const edgeData = await edgeRes.json();
      if (edgeData.success) {
        console.log(`[EmailService] Email delivered via Edge Function to ${to} (ID: ${edgeData.id})`);
        return { success: true, id: edgeData.id };
      }
    }
  } catch (edgeErr) {
    console.warn('[EmailService] Edge Function proxy attempt warning:', edgeErr?.message || edgeErr);
  }

  // 2. Fallback path: Direct Resend API (for Node.js or server-side scripts)
  if (RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
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
        console.warn('[EmailService] Resend API error response:', data);
        return { success: false, error: data.message || 'Resend API failed' };
      }

      console.log(`[EmailService] Email successfully delivered to ${to} (ID: ${data.id})`);
      return { success: true, id: data.id };
    } catch (err) {
      console.error('[EmailService] Direct Resend dispatch error:', err);
      return { success: false, error: err.message };
    }
  }

  return { success: false, error: 'All dispatch mechanisms failed' };
};

/**
 * Base Email Wrapper with Modern 2026 Lite-Darker Gradient Theme
 * Features a rich luminous slate/navy-indigo gradient backdrop instead of plain pitch black.
 */
const wrapEmailTemplate = ({ title, preheader, content, badgeText, badgeColor = '#6366F1' }) => `
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
    ${preheader || title}
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
                          <!-- Brand Icon (Uniform VibeVenue Mark) -->
                          <img src="https://vibe-venue.vercel.app/favicon.png" width="40" height="40" alt="VibeVenue" style="display: block; width: 40px; height: 40px; border-radius: 12px; border: 1.5px solid #818CF8; box-shadow: 0 4px 12px rgba(99,102,241,0.3); background-color: #1A263D;" />
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
                      ${badgeText || 'OFFICIAL PASS'}
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

// ============================================================
//  INDIVIDUAL EMAIL TEMPLATES & SENDERS
// ============================================================

/**
 * 1. Confirmed Ticket Pass Email
 */
export const sendConfirmedTicketEmail = async ({
  to,
  name,
  eventName,
  date,
  time,
  venue,
  ticketId,
  pricingTier = 'General Delegate',
  totalPaid = 0,
  whatsappLink = null,
}) => {
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
              <td style="padding: 6px 0; color: #F8FAFC; text-align: right; font-weight: 600;">${date || 'Announced Soon'} ${time ? `• ${time}` : ''}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94A3B8;">📍 VENUE</td>
              <td style="padding: 6px 0; color: #F8FAFC; text-align: right; font-weight: 600;">${venue || 'Campus Venue'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94A3B8;">👤 DELEGATE</td>
              <td style="padding: 6px 0; color: #F8FAFC; text-align: right; font-weight: 600;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94A3B8;">🏷️ CATEGORY</td>
              <td style="padding: 6px 0; color: #F8FAFC; text-align: right; font-weight: 600;">${pricingTier}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94A3B8;">💳 AMOUNT PAID</td>
              <td style="padding: 6px 0; color: #10B981; text-align: right; font-weight: 700;">₹${totalPaid}</td>
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
    ` : ''}

    <p style="margin: 0; font-size: 13px; color: #94A3B8; text-align: center; line-height: 1.5;">
      You can access and present this live ticket at any time by logging into your <strong>VibeVenue Student Portal</strong>.
    </p>
  `;

  const html = wrapEmailTemplate({
    title: `Pass Confirmed: ${eventName}`,
    preheader: `Your pass ${ticketId} for ${eventName} is confirmed!`,
    content,
    badgeText: '✓ PASS CONFIRMED',
    badgeColor: '#10B981',
  });

  return sendRawEmail({
    to,
    subject: `🎟️ Pass Confirmed: ${eventName} (${ticketId})`,
    html,
  });
};

/**
 * 2. Waiting List Ticket Email (with Dynamic Queue Position & QR Code)
 */
export const sendWaitlistTicketEmail = async ({
  to,
  name,
  eventName,
  date,
  time,
  venue,
  ticketId,
  position = 1,
  pricingTier = 'General Delegate',
}) => {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(ticketId)}&margin=4`;

  const content = `
    <div style="text-align: center; margin-bottom: 26px;">
      <div style="font-size: 44px; line-height: 1; margin-bottom: 12px;">📋</div>
      <h1 style="margin: 0 0 6px; font-size: 24px; font-weight: 800; color: #F8FAFC;">You're on the Waiting List</h1>
      <p style="margin: 0; font-size: 15px; color: #FBBF24; font-weight: 700;">Queue Position #${position} in Line</p>
    </div>

    <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#281C14" style="background-color: #281C14; background: linear-gradient(135deg, #362417 0%, #20150E 100%); border: 1.5px solid #F59E0B; border-radius: 14px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 22px;">
          <div style="font-family: monospace; font-size: 11px; color: #FBBF24; font-weight: 700; margin-bottom: 6px; text-transform: uppercase;">
            WAITLIST REGISTRATION RECEIPT
          </div>
          <h2 style="margin: 0 0 10px; font-size: 19px; color: #FFFFFF; font-weight: 800;">${eventName}</h2>
          
          <p style="font-size: 13px; color: #CBD5E1; line-height: 1.5; margin: 0 0 16px;">
            Standard venue limit for this event has been reached. Your pass has been securely queued at <strong>Position #${position}</strong>.
          </p>

          <table width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#1A110A" style="font-family: monospace; font-size: 13px; margin-bottom: 16px; background-color: #1A110A; border-radius: 8px; padding: 12px;">
            <tr>
              <td style="padding: 6px 0; color: #94A3B8;">🎫 PASS CODE</td>
              <td style="padding: 6px 0; color: #FBBF24; text-align: right; font-weight: 700;">${ticketId}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94A3B8;">🔢 QUEUE POSITION</td>
              <td style="padding: 6px 0; color: #F59E0B; text-align: right; font-weight: 800;">#${position}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94A3B8;">👤 DELEGATE</td>
              <td style="padding: 6px 0; color: #F8FAFC; text-align: right; font-weight: 600;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94A3B8;">📅 EVENT DATE</td>
              <td style="padding: 6px 0; color: #F8FAFC; text-align: right;">${date || 'Announced Soon'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94A3B8;">🏷️ STATUS</td>
              <td style="padding: 6px 0; color: #F59E0B; text-align: right; font-weight: 800;">WAITLISTED (#${position})</td>
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
              <span style="display: block; font-size: 13px; font-weight: 700; color: #F59E0B; margin-top: 4px; font-family: monospace;">POSITION #${position}</span>
            </div>
          </div>

          <!-- Auto-promotion notice -->
          <div style="background-color: rgba(245, 158, 11, 0.14); border-left: 3px solid #F59E0B; padding: 14px; border-radius: 6px; margin-top: 16px;">
            <strong style="color: #FBBF24; font-size: 13px; display: block; margin-bottom: 4px;">⚡ Automatic Upgradation System</strong>
            <span style="color: #CBD5E1; font-size: 12px; line-height: 1.5; display: block;">
              If any confirmed participant cancels their registration, the next delegate on the waiting list is <strong>automatically upgraded to a Confirmed Pass</strong> and issued an entrance QR pass instantly!
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
    preheader: `You are #${position} on the waiting list for ${eventName}. Ticket ID: ${ticketId}`,
    content,
    badgeText: `WAITLIST #${position}`,
    badgeColor: '#F59E0B',
  });

  return sendRawEmail({
    to,
    subject: `📋 Waiting List Confirmation: ${eventName} (Position #${position})`,
    html,
  });
};

/**
 * 3. Queue Position Advancement Email (e.g. #2 -> #1)
 */
export const sendWaitlistQueueShiftEmail = async ({
  to,
  name,
  eventName,
  oldPosition,
  newPosition,
  ticketId,
}) => {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(ticketId)}&margin=4`;

  const content = `
    <div style="text-align: center; margin-bottom: 26px;">
      <div style="font-size: 44px; line-height: 1; margin-bottom: 12px;">📈</div>
      <h1 style="margin: 0 0 6px; font-size: 24px; font-weight: 800; color: #F8FAFC;">You Moved Up in the Queue!</h1>
      <p style="margin: 0; font-size: 15px; color: #38BDF8; font-weight: 700;">
        Position #${oldPosition} ➔ <span style="font-size: 18px; color: #10B981; font-weight: 800;">Position #${newPosition}</span>
      </p>
    </div>

    <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#152A42" style="background-color: #152A42; background: linear-gradient(135deg, #1B3654 0%, #112033 100%); border: 1.5px solid #0EA5E9; border-radius: 14px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 22px;">
          <h2 style="margin: 0 0 10px; font-size: 18px; color: #FFFFFF; font-weight: 700;">${eventName}</h2>
          <p style="font-size: 13px; color: #CBD5E1; line-height: 1.5; margin: 0 0 16px;">
            Hi <strong>${name}</strong>, a seat vacancy has advanced your standing in the waiting list closer to confirmation!
          </p>

          <table width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#0D1A29" style="background-color: #0D1A29; border-radius: 8px; padding: 14px; font-family: monospace; font-size: 13px; margin-bottom: 16px;">
            <tr>
              <td style="padding: 4px 0; color: #94A3B8;">PASS ID:</td>
              <td style="padding: 4px 0; color: #F8FAFC; text-align: right; font-weight: 700;">${ticketId}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #94A3B8;">NEW STANDING:</td>
              <td style="padding: 4px 0; color: #10B981; text-align: right; font-weight: 800;">#${newPosition} IN LINE</td>
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
              <span style="display: block; font-size: 13px; font-weight: 700; color: #10B981; margin-top: 4px; font-family: monospace;">POSITION #${newPosition}</span>
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
    title: `Queue Update: Position #${newPosition} for ${eventName}`,
    preheader: `You moved up in the waitlist! Now at position #${newPosition}`,
    content,
    badgeText: `QUEUE #${newPosition}`,
    badgeColor: '#0EA5E9',
  });

  return sendRawEmail({
    to,
    subject: `📈 Queue Update: Advanced to #${newPosition} for ${eventName}`,
    html,
  });
};

/**
 * 4. Waitlist Promoted to Confirmed Email
 */
export const sendWaitlistPromotedEmail = async ({
  to,
  name,
  eventName,
  date,
  time,
  venue,
  ticketId,
}) => {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(ticketId)}&margin=4`;

  const content = `
    <div style="text-align: center; margin-bottom: 26px;">
      <div style="font-size: 48px; line-height: 1; margin-bottom: 12px;">🚀</div>
      <h1 style="margin: 0 0 6px; font-size: 24px; font-weight: 800; color: #10B981;">You're In! Pass Confirmed</h1>
      <p style="margin: 0; font-size: 14px; color: #CBD5E1;">A seat has opened up and your ticket has been automatically promoted from the waiting list!</p>
    </div>

    <!-- Highlight Box -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#113227" style="background-color: #113227; background: linear-gradient(135deg, #174234 0%, #0C251C 100%); border: 2px solid #10B981; border-radius: 14px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 22px;">
          <div style="font-family: monospace; font-size: 11px; color: #6EE7B7; font-weight: 700; margin-bottom: 6px; text-transform: uppercase;">
            PROMOTION NOTICE
          </div>
          <h2 style="margin: 0 0 14px; font-size: 19px; color: #FFFFFF; font-weight: 800;">${eventName}</h2>

          <p style="font-size: 13px; color: #D1FAE5; line-height: 1.5; margin: 0 0 16px;">
            Congratulations <strong>${name}</strong>! Your waiting list ticket <strong>${ticketId}</strong> is now officially a <strong>CONFIRMED GATE PASS</strong>.
          </p>

          <table width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#091A14" style="font-family: monospace; font-size: 13px; background-color: #091A14; border-radius: 8px; padding: 12px; margin-bottom: 14px;">
            <tr>
              <td style="padding: 4px 0; color: #A7F3D0;">📅 DATE</td>
              <td style="padding: 4px 0; color: #FFFFFF; text-align: right; font-weight: 700;">${date || 'Event Day'} ${time ? `(${time})` : ''}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #A7F3D0;">📍 LOCATION</td>
              <td style="padding: 4px 0; color: #FFFFFF; text-align: right; font-weight: 700;">${venue || 'Campus Venue'}</td>
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

    <p style="margin: 0; font-size: 13px; color: #94A3B8; text-align: center; line-height: 1.5;">
      Your updated QR credential is now live in your <strong>VibeVenue Student Portal</strong>. Present it at the venue desk on event day.
    </p>
  `;

  const html = wrapEmailTemplate({
    title: `Pass Confirmed: ${eventName}`,
    preheader: `Great news! You have been promoted to Confirmed for ${eventName}`,
    content,
    badgeText: '✓ PASS CONFIRMED',
    badgeColor: '#10B981',
  });

  return sendRawEmail({
    to,
    subject: `🚀 Great News! You're Confirmed for ${eventName} (${ticketId})`,
    html,
  });
};

/**
 * 5. Registration Cancelled Email
 */
export const sendCancellationEmail = async ({
  to,
  name,
  eventName,
  ticketId,
  wasWaitlisted = false,
}) => {
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
            Hi <strong>${name}</strong>, your ${wasWaitlisted ? 'waiting list entry' : 'gate pass'} (<code>${ticketId}</code>) has been successfully cancelled as requested.
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
          ` : ''}
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
    badgeText: 'CANCELLED',
    badgeColor: '#F43F5E',
  });

  return sendRawEmail({
    to,
    subject: `❌ Registration Cancelled: ${eventName} (${ticketId})`,
    html,
  });
};
