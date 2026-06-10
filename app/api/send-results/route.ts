import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

// Emails the user's readiness summary to themselves via Resend.
// Configure RESEND_API_KEY (and optionally RESEND_FROM) in env.
// Without a key the endpoint degrades gracefully so the UI can show
// a friendly "not configured" message instead of a hard failure.

const BodySchema = z.object({
  email: z.string().email().max(254),
  // Plain-text executive summary generated client-side. Capped so the
  // endpoint can't be used to relay arbitrary large payloads.
  summary: z.string().min(1).max(10_000),
  businessName: z.string().max(200).optional(),
});

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Email sending is not configured yet. Set RESEND_API_KEY to enable it." },
      { status: 503 },
    );
  }

  let parsed: z.infer<typeof BodySchema>;
  try {
    parsed = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request — provide a valid email and summary." }, { status: 400 });
  }

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM || "AI Readiness <onboarding@resend.dev>";
  const subject = `Your AI Readiness Results${parsed.businessName ? ` — ${parsed.businessName}` : ""}`;

  try {
    const { error } = await resend.emails.send({
      from,
      to: parsed.email,
      subject,
      text: parsed.summary,
    });
    if (error) {
      console.error("[send-results] resend error", error);
      return NextResponse.json({ error: "Email provider rejected the request." }, { status: 502 });
    }
    return NextResponse.json({ sent: true });
  } catch (e) {
    console.error("[send-results] unexpected error", e);
    return NextResponse.json({ error: "Failed to send email." }, { status: 500 });
  }
}
