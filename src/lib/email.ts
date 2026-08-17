import "server-only";

import { reportError } from "@/lib/errors";

/**
 * Transactional email, through Resend's REST API.
 *
 * Called directly rather than through their SDK: one `fetch` against a
 * documented endpoint is less to keep up to date than a dependency, and this
 * application sends exactly one kind of message.
 *
 * Configuration:
 *   RESEND_API_KEY   from resend.com → API Keys
 *   EMAIL_FROM       e.g. "Vibe Tag <noreply@vibetag.net>"
 *
 * The sending domain has to be verified at Resend first, which means adding
 * their DKIM and SPF records to the domain's DNS. Without that, mail is either
 * rejected outright or lands in spam — which for a sign-up code is the same
 * thing as not sending it.
 */

const ENDPOINT = "https://api.resend.com/emails";

export type Mail = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

/**
 * Send one message. Returns whether it left the building.
 *
 * Never throws: a failed send is a thing the caller shows to the person
 * waiting for a code, not a crash.
 */
export async function sendEmail(mail: Mail): Promise<boolean> {
  if (!emailConfigured()) {
    await reportError(
      "email/send",
      new Error("RESEND_API_KEY or EMAIL_FROM is not set"),
      { level: "WARN" },
    );
    return false;
  }

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [mail.to],
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      }),
      // A sign-in screen must not hang because a mail provider is slow.
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      await reportError(
        "email/send",
        new Error(`Resend ${response.status}: ${body.slice(0, 500)}`),
      );
      return false;
    }
    return true;
  } catch (error) {
    await reportError("email/send", error);
    return false;
  }
}

/**
 * The one email template this application has.
 *
 * Inline styles and a table-free layout on purpose: mail clients strip
 * stylesheets, and a code nobody can read is a code nobody can use. The code
 * is repeated in the plain-text part so it survives a client that renders
 * neither.
 */
export function otpEmail(
  code: string,
  copy: { subject: string; heading: string; body: string; expiry: string; ignore: string },
): Omit<Mail, "to"> {
  const html = `
<div style="margin:0;padding:32px 16px;background:#FAF7F2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#FFFDF9;border:1px solid #E4D7C8;border-radius:24px;padding:32px;">
    <p style="margin:0 0 24px;font-size:11px;font-weight:800;letter-spacing:2.4px;color:#F05262;">VIBE TAG</p>
    <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#2D211C;">${copy.heading}</h1>
    <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#746860;">${copy.body}</p>
    <p style="margin:0 0 24px;padding:18px;background:#FFF4E8;border:1px solid #F0C298;border-radius:16px;text-align:center;font-size:34px;font-weight:800;letter-spacing:10px;color:#2D211C;">${code}</p>
    <p style="margin:0 0 8px;font-size:12.5px;line-height:1.6;color:#746860;">${copy.expiry}</p>
    <p style="margin:0;font-size:12.5px;line-height:1.6;color:#A6968A;">${copy.ignore}</p>
  </div>
</div>`.trim();

  const text = [copy.heading, "", copy.body, "", code, "", copy.expiry, copy.ignore].join(
    "\n",
  );

  return { subject: copy.subject, html, text };
}
