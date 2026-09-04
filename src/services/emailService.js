// ============================================================
//  VIBEVENUE — RESEND EMAIL AUTOMATION SERVICE
//  Delivers responsive, transactional HTML emails for:
//  - 🎟️ Confirmed Ticket Pass
//  - 📋 Waiting List Ticket (with Queue Position)
//  - 📈 Queue Advancement (e.g. #4 -> #3)
//  - 🚀 Promoted from Waitlist to Confirmed
//  - ❌ Registration Cancelled
// ============================================================

const RESEND_API_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_RESEND_API_KEY) ||
  (typeof process !== 'undefined' && process.env?.VITE_RESEND_API_KEY) ||
  '';
const FROM_EMAIL = 'VibeVenue Events <tickets@vibevenue.adithyen.me>';

/**
 * Universal dispatcher using Resend REST API
 */
const sendRawEmail = async ({ to, subject, html }) => {
  if (!to) {
    console.warn('[EmailService] No recipient address provided');
    return { success: false, error: 'No recipient email' };
  }

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
    console.error('[EmailService] Network/Dispatch error:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Base Email Wrapper with Modern 2026 Dark UI Styling
 */
const wrapEmailTemplate = ({ title, preheader, content, badgeText, badgeColor = '#6366F1' }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0; padding:0; background-color:#090D16; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#F8FAFC;">
  <div style="display:none;font-size:1px;color:#090D16;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheader || title}
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#090D16; width:100%; padding: 40px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:580px; background-color:#0F172A; border:1px solid #1E293B; border-radius:16px; overflow:hidden; box-shadow:0 20px 40px rgba(0,0,0,0.5);">
          <!-- Top Header -->
          <tr>
            <td style="padding: 28px 32px 20px; background: linear-gradient(180deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.9) 100%); border-bottom: 1px solid #1E293B;">
              <table width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <span style="font-family:monospace; font-size:13px; font-weight:700; color:#38BDF8; letter-spacing:1.5px; text-transform:uppercase;">
                      ✦ VIBEVENUE '26
                    </span>
                  </td>
                  <td align="right">
                    <span style="display:inline-block; font-family:monospace; font-size:11px; font-weight:700; color:${badgeColor}; background:rgba(255,255,255,0.06); border:1px solid ${badgeColor}; padding:4px 10px; border-radius:20px; text-transform:uppercase;">
                      ${badgeText || 'OFFICIAL PASS'}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color:#0A0F1D; border-top: 1px solid #1E293B; text-align:center;">
              <p style="margin:0 0 8px; font-size:12px; color:#64748B; font-family:monospace;">
                SCT College of Engineering • µLearn
              </p>
              <p style="margin:0; font-size:11px; color:#475569;">
                This is an automated operational notification regarding your event registration.
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
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="font-size: 40px; line-height: 1; margin-bottom: 12px;">🎉</div>
      <h1 style="margin: 0 0 6px; font-size: 22px; font-weight: 700; color: #F8FAFC;">Registration Confirmed!</h1>
      <p style="margin: 0; font-size: 14px; color: #94A3B8;">Your digital gate pass is ready. Please present this at the venue entrance.</p>
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
        <div style="display: inline-block; background-color: #FFFFFF; padding: 12px; border-radius: 12px; border: 2px solid #38BDF8; box-shadow: 0 8px 24px rgba(0,0,0,0.4);">
          <img
            src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(ticketId)}&margin=4"
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
    ` : ''}

    <p style="margin: 0; font-size: 13px; color: #64748B; text-align: center; line-height: 1.5;">
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
 * 2. Waiting List Ticket Email (with initial Queue Position)
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
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="font-size: 40px; line-height: 1; margin-bottom: 12px;">📋</div>
      <h1 style="margin: 0 0 6px; font-size: 22px; font-weight: 700; color: #F8FAFC;">You are on the Waiting List</h1>
      <p style="margin: 0; font-size: 14px; color: #F59E0B; font-weight: 600;">Queue Position #${position}</p>
    </div>

    <div style="background-color: #1A150B; border: 1.5px solid #F59E0B; border-radius: 12px; padding: 22px; margin-bottom: 24px;">
      <div style="font-family: monospace; font-size: 11px; color: #FBBF24; font-weight: 700; margin-bottom: 4px; text-transform: uppercase;">
        WAITLIST REGISTRATION RECEIPT
      </div>
      <h2 style="margin: 0 0 14px; font-size: 18px; color: #FFFFFF; font-weight: 700;">${eventName}</h2>
      
      <p style="font-size: 13px; color: #CBD5E1; line-height: 1.5; margin: 0 0 16px;">
        Standard seat capacity for this event is currently full. Your application has been secured at <strong>Position #${position}</strong> in the queue.
      </p>

      <table width="100%" cellspacing="0" cellpadding="0" border="0" style="font-family: monospace; font-size: 13px; margin-bottom: 16px;">
        <tr>
          <td style="padding: 6px 0; color: #94A3B8;">🎫 TICKET CODE</td>
          <td style="padding: 6px 0; color: #FBBF24; text-align: right; font-weight: 700;">${ticketId}</td>
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
          <td style="padding: 6px 0; color: #94A3B8;">🏷️ TIER</td>
          <td style="padding: 6px 0; color: #F8FAFC; text-align: right;">${pricingTier}</td>
        </tr>
      </table>

      <!-- Waitlist QR Tracking Badge -->
      <div style="text-align: center; margin: 16px 0 12px;">
        <div style="display: inline-block; background-color: #FFFFFF; padding: 10px; border-radius: 10px; border: 2px solid #F59E0B; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
          <img
            src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(ticketId)}&margin=4"
            width="140"
            height="140"
            alt="Waitlist QR Pass"
            style="display: block; border-radius: 4px;"
          />
        </div>
        <div style="margin-top: 8px;">
          <span style="font-size: 11px; color: #94A3B8; font-family: monospace; display: block;">WAITLIST TRACKING PASS</span>
          <span style="font-size: 18px; font-weight: 800; color: #FBBF24; letter-spacing: 2px; font-family: monospace;">${ticketId}</span>
        </div>
      </div>

      <!-- Auto-promotion notice -->
      <div style="background-color: rgba(245, 158, 11, 0.1); border-left: 3px solid #F59E0B; padding: 12px 14px; border-radius: 4px;">
        <strong style="color: #FBBF24; font-size: 12px; display: block; margin-bottom: 2px;">⚡ Automatic Upgradation System</strong>
        <span style="color: #E2E8F0; font-size: 12px; line-height: 1.4; display: block;">
          Whenever a confirmed participant cancels their registration, the next person in line is <strong>automatically upgraded to a Confirmed ticket</strong> and emailed immediately!
        </span>
      </div>
    </div>

    <p style="margin: 0; font-size: 12px; color: #64748B; text-align: center;">
      You can track your live queue status anytime in your VibeVenue Student Portal.
    </p>
  `;

  const html = wrapEmailTemplate({
    title: `Waitlist Entry: ${eventName}`,
    preheader: `You are #${position} on the waiting list for ${eventName}`,
    content,
    badgeText: `WAITLIST #${position}`,
    badgeColor: '#F59E0B',
  });

  return sendRawEmail({
    to,
    subject: `📋 Waitlist Confirmation: ${eventName} (Position #${position})`,
    html,
  });
};

/**
 * 3. Queue Position Advancement Email (e.g. #4 -> #3)
 */
export const sendWaitlistQueueShiftEmail = async ({
  to,
  name,
  eventName,
  oldPosition,
  newPosition,
  ticketId,
}) => {
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="font-size: 40px; line-height: 1; margin-bottom: 12px;">📈</div>
      <h1 style="margin: 0 0 6px; font-size: 22px; font-weight: 700; color: #F8FAFC;">You Moved Up in the Queue!</h1>
      <p style="margin: 0; font-size: 14px; color: #38BDF8; font-weight: 600;">
        Position ${oldPosition} ➔ <span style="font-size: 18px; color: #10B981; font-weight: 800;">Position #${newPosition}</span>
      </p>
    </div>

    <div style="background-color: #0F172A; border: 1.5px solid #0EA5E9; border-radius: 12px; padding: 22px; margin-bottom: 24px;">
      <h2 style="margin: 0 0 10px; font-size: 17px; color: #FFFFFF; font-weight: 700;">${eventName}</h2>
      <p style="font-size: 13px; color: #CBD5E1; line-height: 1.5; margin: 0 0 16px;">
        Hi <strong>${name}</strong>, a seat vacancy or queue change has occurred. Your waiting list standing has advanced closer to confirmation!
      </p>

      <div style="background-color: #0A0F1D; border-radius: 8px; padding: 14px; font-family: monospace; font-size: 13px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <span style="color: #94A3B8;">PASS ID:</span>
          <span style="color: #F8FAFC; font-weight: 700;">${ticketId}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #94A3B8;">NEW STANDING:</span>
          <span style="color: #10B981; font-weight: 800;">#${newPosition} IN LINE</span>
        </div>
      </div>
    </div>

    <p style="margin: 0; font-size: 12px; color: #64748B; text-align: center;">
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
    subject: `📈 Queue Update: #${newPosition} for ${eventName}`,
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
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="font-size: 46px; line-height: 1; margin-bottom: 12px;">🚀</div>
      <h1 style="margin: 0 0 6px; font-size: 24px; font-weight: 800; color: #10B981;">You're In! Pass Confirmed</h1>
      <p style="margin: 0; font-size: 14px; color: #CBD5E1;">A seat has opened up and your ticket has been automatically promoted from the waiting list!</p>
    </div>

    <!-- Highlight Box -->
    <div style="background-color: #064E3B; border: 2px solid #10B981; border-radius: 12px; padding: 22px; margin-bottom: 24px;">
      <div style="font-family: monospace; font-size: 11px; color: #6EE7B7; font-weight: 700; margin-bottom: 4px; text-transform: uppercase;">
        PROMOTION NOTICE
      </div>
      <h2 style="margin: 0 0 14px; font-size: 19px; color: #FFFFFF; font-weight: 800;">${eventName}</h2>

      <p style="font-size: 13px; color: #D1FAE5; line-height: 1.5; margin: 0 0 16px;">
        Congratulations <strong>${name}</strong>! Your waiting list ticket <strong>${ticketId}</strong> is now officially a <strong>CONFIRMED GATE PASS</strong>.
      </p>

      <table width="100%" cellspacing="0" cellpadding="0" border="0" style="font-family: monospace; font-size: 13px; background: rgba(0,0,0,0.25); border-radius: 8px; padding: 12px; margin-bottom: 12px;">
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
        <div style="display: inline-block; background-color: #FFFFFF; padding: 12px; border-radius: 12px; border: 2px solid #10B981; box-shadow: 0 8px 24px rgba(0,0,0,0.4);">
          <img
            src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(ticketId)}&margin=4"
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

    <p style="margin: 0; font-size: 13px; color: #94A3B8; text-align: center; line-height: 1.5;">
      Your updated QR credential is now live in your <strong>VibeVenue Student Portal</strong>. Present it at the venue desk on event day.
    </p>
  `;

  const html = wrapEmailTemplate({
    title: `Promoted to Confirmed: ${eventName}`,
    preheader: `Great news! You have been promoted to Confirmed for ${eventName}`,
    content,
    badgeText: '✓ PROMOTED CONFIRMED',
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
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="font-size: 40px; line-height: 1; margin-bottom: 12px;">❌</div>
      <h1 style="margin: 0 0 6px; font-size: 22px; font-weight: 700; color: #F8FAFC;">Registration Cancelled</h1>
      <p style="margin: 0; font-size: 14px; color: #94A3B8;">Your registration and gate credential have been revoked.</p>
    </div>

    <div style="background-color: #1E1218; border: 1.5px solid #E11D48; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <h2 style="margin: 0 0 10px; font-size: 17px; color: #FFFFFF;">${eventName}</h2>
      <p style="font-size: 13px; color: #FDA4AF; line-height: 1.5; margin: 0 0 12px;">
        Hi <strong>${name}</strong>, your ${wasWaitlisted ? 'waiting list entry' : 'gate pass'} (<code>${ticketId}</code>) has been cancelled as requested.
      </p>
      ${!wasWaitlisted ? `
        <p style="font-size: 12px; color: #94A3B8; margin: 0;">
          Your vacated seat has been automatically offered to the next delegate on the waiting list.
        </p>
      ` : ''}
    </div>

    <p style="margin: 0; font-size: 12px; color: #64748B; text-align: center;">
      If you did not request this cancellation or believe this was an error, please contact the event organizing desk.
    </p>
  `;

  const html = wrapEmailTemplate({
    title: `Registration Cancelled: ${eventName}`,
    preheader: `Your registration for ${eventName} has been cancelled`,
    content,
    badgeText: 'CANCELLED',
    badgeColor: '#E11D48',
  });

  return sendRawEmail({
    to,
    subject: `❌ Registration Cancelled: ${eventName} (${ticketId})`,
    html,
  });
};
