/// <reference types="@cloudflare/workers-types" />
/**
 * POST /api/contact — Cloudflare Pages Function that turns a site enquiry into an
 * email to the studio.
 *
 * Anti-spam: a honeypot field (`website`) plus optional Cloudflare Turnstile.
 * Email is sent via the Postmark API; the provider call is isolated in `sendEmail`
 * so it can be swapped without touching the request handling.
 *
 * Secrets/vars (Cloudflare Pages → Settings → Environment variables; NONE are
 * DTC_-prefixed, so they never reach the browser bundle):
 *   POSTMARK_SERVER_TOKEN   (secret, required — a Postmark server API token)
 *   CONTACT_TO_EMAIL        (where enquiries are delivered)
 *   CONTACT_FROM_EMAIL      (a Postmark-verified sender signature / domain)
 *   POSTMARK_MESSAGE_STREAM (optional — defaults to "outbound")
 *   TURNSTILE_SECRET_KEY    (secret, optional — enables Turnstile verification)
 */
interface Env {
  POSTMARK_SERVER_TOKEN: string;
  CONTACT_TO_EMAIL: string;
  CONTACT_FROM_EMAIL: string;
  POSTMARK_MESSAGE_STREAM?: string;
  TURNSTILE_SECRET_KEY?: string;
}

interface ContactPayload {
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  projectType?: string;
  message?: string;
  website?: string; // honeypot
  'cf-turnstile-response'?: string;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FIELD = 200;
const MAX_MESSAGE = 5000;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Trim and cap a free-text field; undefined when empty. */
function clean(value: string | undefined, max: number): string | undefined {
  const v = value?.trim();
  return v ? v.slice(0, max) : undefined;
}

async function verifyTurnstile(secret: string, token: string, ip: string | null): Promise<boolean> {
  const form = new FormData();
  form.append('secret', secret);
  form.append('response', token);
  if (ip) form.append('remoteip', ip);
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

async function sendEmail(env: Env, payload: Required<Pick<ContactPayload, 'name' | 'email' | 'message'>> & ContactPayload): Promise<boolean> {
  const rows: Array<[string, string]> = [
    ['Name', payload.name],
    ['Email', payload.email],
    ['Company', payload.company ?? '—'],
    ['Phone', payload.phone ?? '—'],
    ['Project type', payload.projectType ?? '—'],
  ];

  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n') + `\n\nMessage:\n${payload.message}`;
  const html =
    `<h2>New enquiry — Deploy the Camel</h2><table cellpadding="6" style="border-collapse:collapse">` +
    rows
      .map(([k, v]) => `<tr><td style="color:#7a7266">${k}</td><td><strong>${escapeHtml(v)}</strong></td></tr>`)
      .join('') +
    `</table><p style="white-space:pre-wrap;margin-top:16px">${escapeHtml(payload.message)}</p>`;

  const res = await fetch('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Postmark-Server-Token': env.POSTMARK_SERVER_TOKEN,
    },
    body: JSON.stringify({
      From: env.CONTACT_FROM_EMAIL,
      To: env.CONTACT_TO_EMAIL,
      // Replies go straight to the enquirer.
      ReplyTo: `${payload.name} <${payload.email}>`,
      Subject: `New enquiry from ${payload.name}${payload.projectType ? ` — ${payload.projectType}` : ''}`,
      TextBody: text,
      HtmlBody: html,
      MessageStream: env.POSTMARK_MESSAGE_STREAM || 'outbound',
    }),
  });

  return res.ok;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  let payload: ContactPayload;
  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return json({ ok: false, error: 'invalid-json' }, 400);
  }

  // Honeypot: a filled decoy field means a bot. Pretend success, send nothing.
  if (payload.website && payload.website.trim() !== '') {
    return json({ ok: true });
  }

  const name = clean(payload.name, MAX_FIELD);
  const email = clean(payload.email, MAX_FIELD);
  const message = clean(payload.message, MAX_MESSAGE);
  if (!name || !email || !message || !EMAIL_RE.test(email)) {
    return json({ ok: false, error: 'validation' }, 400);
  }

  // Optional Turnstile — only enforced when a secret is configured.
  if (env.TURNSTILE_SECRET_KEY) {
    const token = payload['cf-turnstile-response'];
    const ip = request.headers.get('CF-Connecting-IP');
    if (!token || !(await verifyTurnstile(env.TURNSTILE_SECRET_KEY, token, ip))) {
      return json({ ok: false, error: 'turnstile' }, 403);
    }
  }

  if (!env.POSTMARK_SERVER_TOKEN || !env.CONTACT_TO_EMAIL || !env.CONTACT_FROM_EMAIL) {
    // Misconfiguration — log for the operator, don't leak details to the client.
    console.error('contact function missing Postmark env vars');
    return json({ ok: false, error: 'server' }, 500);
  }

  const sent = await sendEmail(env, {
    name,
    email,
    message,
    company: clean(payload.company, MAX_FIELD),
    phone: clean(payload.phone, MAX_FIELD),
    projectType: clean(payload.projectType, MAX_FIELD),
  });
  return sent ? json({ ok: true }) : json({ ok: false, error: 'send-failed' }, 502);
};
