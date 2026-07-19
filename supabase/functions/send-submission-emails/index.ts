import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Personal Access Token from Calendly (Integrations → API & webhooks). Optional:
// without it we still confirm the booking, we just can't show the exact time /
// video link and instead point the client at Calendly's own calendar invite.
const CALENDLY_TOKEN = Deno.env.get("CALENDLY_API_TOKEN");

// Where client replies should land. Falls back to the same inbox the contact
// form uses so a reply always reaches a real person, not the sandbox sender.
const REPLY_TO = Deno.env.get("CONTACT_TO_EMAIL") || "saminew3919@gmail.com";

const SITE_NAME = "Design & Supply";
const SITE_URL = "https://designandsupply.ca";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Brand palette (mirrors src/index.css) so the email matches the site.
const C = {
  cream: "#FBF8F4",
  sand: "#F5EFE7",
  border: "#E7DED3",
  espresso: "#2D241E",
  muted: "#6B5D52",
  copper: "#C06D44",
  copperDark: "#A35530",
};

interface EmailRequest {
  clientEmail: string;
  clientName: string;
  adminEmail?: string;
  /** "booking" = confirmation sent right after Calendly scheduling. */
  emailType?: "submission" | "booking";
  submissionData: {
    fullName: string;
    email: string;
    phone?: string;
    postalCode: string;
    spaces: any[];
    storagePriorities: string[];
    additionalNotes: string;
    /** URIs from the Calendly event_scheduled postMessage. */
    calendlyEventUri?: string;
    calendlyInviteeUri?: string;
    /** Legacy fallbacks, used only if the Calendly API lookup is unavailable. */
    meetingDate?: string;
    meetingLink?: string;
    meetingPlatform?: string;
  };
}

const escapeHtml = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// ---- Calendly lookup -------------------------------------------------------

const PLATFORM_LABELS: Record<string, string> = {
  google_conference: "Google Meet",
  zoom_conference: "Zoom",
  microsoft_teams_conference: "Microsoft Teams",
  gotomeeting: "GoToMeeting",
  webex_conference: "Webex",
};

interface BookingDetails {
  startTime: string | null;
  endTime: string | null;
  timezone: string;
  platformLabel: string;
  joinUrl: string | null;
  physicalLocation: string | null;
}

const fetchCalendly = async (url: string) => {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${CALENDLY_TOKEN}` } });
  if (!res.ok) throw new Error(`Calendly API ${res.status} for ${url}`);
  return await res.json();
};

/**
 * Resolve the concrete time and video link for a booked event. Best-effort:
 * any failure returns null so the email still sends with a graceful fallback.
 */
const getBookingDetails = async (
  eventUri?: string,
  inviteeUri?: string,
): Promise<BookingDetails | null> => {
  if (!CALENDLY_TOKEN || !eventUri) return null;
  try {
    const event = (await fetchCalendly(eventUri)).resource ?? {};

    let timezone = "UTC";
    if (inviteeUri) {
      try {
        const invitee = (await fetchCalendly(inviteeUri)).resource ?? {};
        if (invitee.timezone) timezone = invitee.timezone;
      } catch (e) {
        console.error("Calendly invitee lookup failed (non-fatal):", (e as Error).message);
      }
    }

    const loc = event.location ?? {};
    const isPhysical = loc.type === "physical" || loc.type === "custom" || loc.type === "outbound_call";
    return {
      startTime: event.start_time ?? null,
      endTime: event.end_time ?? null,
      timezone,
      platformLabel: PLATFORM_LABELS[loc.type] ?? (isPhysical ? "In Person" : "Video Call"),
      joinUrl: loc.join_url ?? null,
      physicalLocation: isPhysical ? (loc.location ?? null) : null,
    };
  } catch (e) {
    console.error("Calendly event lookup failed (non-fatal):", (e as Error).message);
    return null;
  }
};

const formatWhen = (startISO: string | null, endISO: string | null, tz: string) => {
  if (!startISO) return null;
  const start = new Date(startISO);
  const dateStr = new Intl.DateTimeFormat("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: tz,
  }).format(start);
  const startStr = new Intl.DateTimeFormat("en-US", {
    hour: "numeric", minute: "2-digit", timeZone: tz,
  }).format(start);
  let timeStr = startStr;
  if (endISO) {
    const endStr = new Intl.DateTimeFormat("en-US", {
      hour: "numeric", minute: "2-digit", timeZoneName: "short", timeZone: tz,
    }).format(new Date(endISO));
    timeStr = `${startStr} – ${endStr}`;
  } else {
    timeStr = new Intl.DateTimeFormat("en-US", {
      hour: "numeric", minute: "2-digit", timeZoneName: "short", timeZone: tz,
    }).format(start);
  }
  return { dateStr, timeStr };
};

// ---- Email building blocks -------------------------------------------------

const brandHeader = () => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.espresso};border-radius:14px 14px 0 0;">
    <tr>
      <td style="padding:26px 32px;">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <div style="width:46px;height:46px;border-radius:12px;background:#ffffff;color:${C.espresso};font-family:Georgia,'Times New Roman',serif;font-weight:bold;font-size:15px;text-align:center;line-height:46px;">D&amp;S</div>
            </td>
            <td style="padding-left:14px;vertical-align:middle;">
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:21px;font-weight:bold;color:#ffffff;line-height:1;">Design &amp; Supply</div>
              <div style="font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:#C58B64;margin-top:5px;">Custom Storage Design</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;

const emailShell = (inner: string) => `
  <div style="background:${C.sand};padding:28px 12px;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
      <tr><td>
        ${brandHeader()}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid ${C.border};border-top:none;border-radius:0 0 14px 14px;">
          <tr><td style="padding:32px;">
            ${inner}
          </td></tr>
        </table>
        <p style="text-align:center;color:${C.muted};font-size:12px;margin:22px 0 4px;">
          ${SITE_NAME} · <a href="${SITE_URL}" style="color:${C.copper};text-decoration:none;">${SITE_URL.replace("https://", "")}</a>
        </p>
        <p style="text-align:center;color:${C.muted};font-size:11px;margin:0;">
          You're receiving this because you requested a design consultation.
        </p>
      </td></tr>
    </table>
  </div>`;

const meetingCard = (
  when: { dateStr: string; timeStr: string } | null,
  platformLabel: string,
  joinUrl: string | null,
  physicalLocation: string | null,
) => {
  const rows: string[] = [];

  if (when) {
    rows.push(`
      <p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.copper};">Your Consultation</p>
      <p style="margin:0;font-size:19px;font-weight:bold;color:${C.espresso};line-height:1.3;">${escapeHtml(when.dateStr)}</p>
      <p style="margin:5px 0 0;font-size:15px;color:${C.muted};">${escapeHtml(when.timeStr)}</p>
      <hr style="border:none;border-top:1px solid ${C.border};margin:18px 0;">`);
  }

  rows.push(`
    <p style="margin:0 0 3px;font-size:12px;color:${C.muted};">${physicalLocation ? "Location" : "Platform"}</p>
    <p style="margin:0;font-size:16px;font-weight:600;color:${C.espresso};">${escapeHtml(physicalLocation || platformLabel)}</p>`);

  if (joinUrl) {
    rows.push(`
      <div style="margin-top:20px;">
        <a href="${escapeHtml(joinUrl)}" style="display:inline-block;background:${C.copper};color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:13px 30px;border-radius:999px;">Join the Video Call</a>
      </div>
      <p style="margin:12px 0 0;font-size:12px;color:${C.muted};word-break:break-all;">
        Link: <a href="${escapeHtml(joinUrl)}" style="color:${C.copper};">${escapeHtml(joinUrl)}</a>
      </p>`);
  } else if (!physicalLocation) {
    rows.push(`
      <p style="margin:16px 0 0;font-size:13px;color:${C.muted};line-height:1.6;">
        Your video link is included in the calendar invitation Calendly just emailed you.
        It will also appear on the calendar event for the meeting.
      </p>`);
  }

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream};border:1px solid ${C.border};border-radius:12px;margin:8px 0 4px;">
      <tr><td style="padding:24px;">${rows.join("")}</td></tr>
    </table>`;
};

// ---- Handler ---------------------------------------------------------------

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientEmail, clientName, adminEmail, emailType, submissionData }: EmailRequest =
      await req.json();
    const isBooking = emailType === "booking";

    console.log(`Sending ${emailType || "submission"} email for:`, clientEmail);

    // Resolve the real meeting time + link from Calendly when this is a booking.
    const details = isBooking
      ? await getBookingDetails(submissionData.calendlyEventUri, submissionData.calendlyInviteeUri)
      : null;

    const when = details
      ? formatWhen(details.startTime, details.endTime, details.timezone)
      : submissionData.meetingDate
        ? {
            dateStr: new Date(submissionData.meetingDate).toLocaleDateString("en-US", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            }),
            timeStr: new Date(submissionData.meetingDate).toLocaleTimeString("en-US", {
              hour: "numeric", minute: "2-digit",
            }),
          }
        : null;

    const platformLabel = details?.platformLabel || submissionData.meetingPlatform || "Video Call";
    const joinUrl = details?.joinUrl || submissionData.meetingLink || null;
    const physicalLocation = details?.physicalLocation || null;

    const hasMeeting = isBooking || !!when || !!joinUrl;

    // ---- Client email ----
    const clientInner = `
      <h1 style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:bold;color:${C.espresso};">
        ${isBooking ? "You're booked in" : "Thank you"}, ${escapeHtml(clientName)}!
      </h1>
      <p style="margin:0 0 22px;font-size:15px;line-height:1.65;color:${C.muted};">
        ${
          isBooking
            ? "Your design consultation is confirmed. Here are the details — we're looking forward to meeting you."
            : "We've received your design consultation request and our team is excited to work with you. We'll be in touch shortly to arrange the next steps."
        }
      </p>

      ${hasMeeting ? meetingCard(when, platformLabel, joinUrl, physicalLocation) : ""}

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.sand};border-radius:12px;margin:22px 0 4px;">
        <tr><td style="padding:22px 24px;">
          <p style="margin:0 0 12px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.copper};">Your Details</p>
          <p style="margin:0 0 6px;font-size:14px;color:${C.espresso};"><strong style="color:${C.muted};font-weight:normal;">Name:</strong> ${escapeHtml(submissionData.fullName)}</p>
          <p style="margin:0 0 6px;font-size:14px;color:${C.espresso};"><strong style="color:${C.muted};font-weight:normal;">Email:</strong> ${escapeHtml(submissionData.email)}</p>
          ${submissionData.phone ? `<p style="margin:0 0 6px;font-size:14px;color:${C.espresso};"><strong style="color:${C.muted};font-weight:normal;">Phone:</strong> ${escapeHtml(submissionData.phone)}</p>` : ""}
          <p style="margin:0 0 6px;font-size:14px;color:${C.espresso};"><strong style="color:${C.muted};font-weight:normal;">Postal code:</strong> ${escapeHtml(submissionData.postalCode)}</p>
          <p style="margin:0;font-size:14px;color:${C.espresso};"><strong style="color:${C.muted};font-weight:normal;">Spaces:</strong> ${submissionData.spaces.length} space(s)</p>
        </td></tr>
      </table>

      <p style="margin:22px 0 0;font-size:14px;line-height:1.65;color:${C.muted};">
        ${
          hasMeeting
            ? "Our team will review your submission ahead of time so we can make the most of the call. If anything comes up, just reply to this email."
            : "If you have any questions in the meantime, simply reply to this email — we're happy to help."
        }
      </p>
      <p style="margin:26px 0 0;font-size:14px;color:${C.espresso};">
        Warm regards,<br><strong>The ${SITE_NAME} Team</strong>
      </p>`;

    const clientEmailResponse = await resend.emails.send({
      from: `${SITE_NAME} <onboarding@resend.dev>`,
      to: [clientEmail],
      reply_to: REPLY_TO,
      subject: isBooking ? "Your consultation is confirmed ✓" : "Thank you for your submission!",
      html: emailShell(clientInner),
    });

    console.log("Client confirmation email sent:", clientEmailResponse);

    // Booking confirmations only email the client; skip the admin digest.
    if (!adminEmail) {
      return new Response(
        JSON.stringify({ success: true, clientEmailId: clientEmailResponse.data?.id }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    // ---- Admin email ----
    const spacesDetails = submissionData.spaces
      .map(
        (space: any, index: number) => `
        <div style="margin-bottom:12px;padding:12px 14px;background:#ffffff;border-left:3px solid ${C.copper};border-radius:0 8px 8px 0;">
          <strong style="color:${C.espresso};">Space ${index + 1}:</strong> ${escapeHtml(space.name)}<br>
          <span style="color:${C.muted};font-size:13px;">Type: ${escapeHtml(space.type ?? "—")} · Ceiling: ${escapeHtml(space.ceilingHeight ?? "—")} ${escapeHtml(space.unit ?? "in")}</span>
        </div>`,
      )
      .join("");

    const adminInner = `
      <h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:bold;color:${C.espresso};">
        New ${isBooking ? "booking" : "submission"} — ${escapeHtml(submissionData.fullName)}
      </h1>

      ${hasMeeting ? meetingCard(when, platformLabel, joinUrl, physicalLocation) : ""}

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.sand};border-radius:12px;margin:18px 0;">
        <tr><td style="padding:20px 22px;">
          <p style="margin:0 0 10px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.copper};">Contact</p>
          <p style="margin:0 0 5px;font-size:14px;color:${C.espresso};">${escapeHtml(submissionData.fullName)}</p>
          <p style="margin:0 0 5px;font-size:14px;color:${C.espresso};">${escapeHtml(submissionData.email)}</p>
          ${submissionData.phone ? `<p style="margin:0 0 5px;font-size:14px;color:${C.espresso};">${escapeHtml(submissionData.phone)}</p>` : ""}
          <p style="margin:0;font-size:14px;color:${C.espresso};">Postal code: ${escapeHtml(submissionData.postalCode)}</p>
        </td></tr>
      </table>

      <p style="margin:0 0 10px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.copper};">Spaces</p>
      ${spacesDetails}

      ${
        submissionData.storagePriorities?.length
          ? `<p style="margin:18px 0 8px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.copper};">Storage priorities</p>
             <p style="margin:0;font-size:14px;color:${C.espresso};">${submissionData.storagePriorities.map(escapeHtml).join(" · ")}</p>`
          : ""
      }

      ${
        submissionData.additionalNotes
          ? `<p style="margin:18px 0 8px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.copper};">Notes</p>
             <p style="margin:0;font-size:14px;line-height:1.6;color:${C.espresso};white-space:pre-wrap;">${escapeHtml(submissionData.additionalNotes)}</p>`
          : ""
      }

      <p style="margin:24px 0 0;font-size:13px;color:${C.muted};">
        ${hasMeeting ? "Prepare for the scheduled consultation." : "Reach out to the client to arrange a consultation."}
      </p>`;

    const adminEmailResponse = await resend.emails.send({
      from: `${SITE_NAME} Admin <onboarding@resend.dev>`,
      to: [adminEmail],
      reply_to: submissionData.email,
      subject: `New ${isBooking ? "booking" : "submission"}: ${submissionData.fullName}`,
      html: emailShell(adminInner),
    });

    console.log("Admin notification email sent:", adminEmailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        clientEmailId: clientEmailResponse.data?.id,
        adminEmailId: adminEmailResponse.data?.id,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (error: any) {
    console.error("Error sending emails:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
};

serve(handler);
