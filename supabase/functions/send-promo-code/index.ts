import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PromoRequest {
  email: string;
}

// No 0/O/1/I — these get misread when a code is typed off a phone screen.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const generateCode = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  const body = Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
  return `COLOR-${body}`;
};

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

/**
 * Returns the caller's existing code, or claims a fresh one. The unique index on
 * lower(email) makes a repeat signup return the same code instead of a second row.
 */
const claimCode = async (email: string): Promise<string> => {
  const { data: existing, error: lookupError } = await supabase
    .from("promo_signups")
    .select("code")
    .ilike("email", email)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (existing) return existing.code;

  // Retry guards against the (very unlikely) collision on the code unique index.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const { error } = await supabase.from("promo_signups").insert({ email, code });

    if (!error) return code;

    if (error.code === "23505") {
      // Someone signed up with this email between our lookup and insert.
      const { data: raced } = await supabase
        .from("promo_signups")
        .select("code")
        .ilike("email", email)
        .maybeSingle();
      if (raced) return raced.code;
      continue; // Code collided rather than the email — try another code.
    }

    throw error;
  }

  throw new Error("Could not allocate a promo code. Please try again.");
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: PromoRequest = await req.json();

    if (!email || !isValidEmail(email)) {
      return new Response(
        JSON.stringify({ error: "A valid email address is required." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const code = await claimCode(email.trim());

    const response = await resend.emails.send({
      from: "Design & Supply <onboarding@resend.dev>",
      to: [email],
      subject: "Your FREE Color Upgrade promo code 🎁",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <p style="color: #b87333; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 8px;">
            Limited Time Offer
          </p>
          <h1 style="color: #2c3e50; font-weight: 300; margin-top: 0;">Your FREE Color Upgrade</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            Thanks for signing up! Use the code below at checkout to claim a free color
            upgrade on your first design order.
          </p>
          <div style="background-color: #f8f9fa; border: 1px dashed #b87333; padding: 24px; border-radius: 8px; margin: 28px 0; text-align: center;">
            <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #856404;">
              Your promo code
            </p>
            <p style="margin: 0; font-size: 30px; letter-spacing: 4px; font-weight: bold; color: #2c3e50;">
              ${escapeHtml(code)}
            </p>
          </div>
          <p style="font-size: 13px; line-height: 1.6; color: #888;">
            *Valid for orders above $3,500. Cannot be combined with other offers.
            This code is tied to ${escapeHtml(email)} and can be used once.
          </p>
        </div>
      `,
    });

    return new Response(
      JSON.stringify({ success: true, id: response.data?.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (error: any) {
    console.error("Error sending promo code:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
};

serve(handler);
