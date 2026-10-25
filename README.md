# Deploy the Camel — Marketing Site

The public site for **Deploy the Camel** (software development, New Zealand):
**https://deploythecamel.com**. Static Astro site + one Cloudflare Pages Function for the
contact form, deployed to **Cloudflare Pages**. Design decisions live in `CLAUDE.md`.

## Pages

| Path | What it is |
|---|---|
| `/` | Hero, the four service tiers, how we work, what to expect, Hutvista as featured work, founder block, CTA |
| `/services` | One section per tier (`#websites`, `#web-applications`, `#bespoke-systems`, `#support`) + `#pricing` |
| `/work` | Case studies — currently `#hutvista` only |
| `/about` | The founder, how we build, what we build with |
| `/contact` | Founder block + enquiry form → `POST /api/contact` (Pages Function → Postmark email) |
| `404` | `noindex` |

Primary CTA everywhere is **"Start a project"** → `/contact`.

## Stack

Astro 7 (static) · Tailwind CSS v4 (CSS-first, tokens in `src/styles/global.css`) ·
self-hosted **Comfortaa** variable font (bundled from the fontsource package, no CDN request) · `@astrojs/sitemap` · Cloudflare Pages Functions
(`functions/api/contact.ts`, Postmark). Light-only, mobile-first, no JS framework.

## Local development

```bash
npm install
npm run dev        # http://localhost:4321
npm run lint       # eslint
npm run check      # astro type-check
npm run build      # static build → dist/
npm run preview    # serve dist/ (static only — the contact API won't run here)
```

To exercise the **contact function** locally you need the Workers runtime:

```bash
npm run build
echo 'POSTMARK_SERVER_TOKEN="pm-server-token"'           >  .dev.vars
echo 'CONTACT_TO_EMAIL="enquiries@deploythecamel.com"'   >> .dev.vars
echo 'CONTACT_FROM_EMAIL="enquiries@deploythecamel.com"' >> .dev.vars
# POSTMARK_MESSAGE_STREAM optional (defaults to "outbound"); TURNSTILE_SECRET_KEY optional
npx wrangler pages dev dist            # serves site + /api/contact
```

`.dev.vars` is git-ignored — never commit real keys.

## Image slots

Images are **placeholder slots** until the real file exists in `public/`; the `ImageSlot`
and `FounderCard` components render a labelled panel otherwise. Drop the files in and rebuild:

| File | Shows |
|---|---|
| `public/images/work/hutvista.png` | Hutvista bookings calendar (light theme, ~1600×1000, no customer data). Used on `/` and `/work`. |
| `public/images/founder.png` | Square headshot for the founder block (footer, `/about`, `/contact`, `/`). |
| `public/images/og-image.png` | 1200×630 social preview, generated from the logo (paper background, lockup, tagline). |

## Logo and icons

`public/logo.png` (lockup, 859×426, transparent) is what `Logo.astro` renders in the header
and footer. `public/logo-mark.png` (icon only, 225×426) is the source for the favicon set:
`favicon.ico` (16/32/48), `icon-192.png`, `icon-512.png` (transparent) and
`apple-touch-icon.png` (180, white background — iOS doesn't support transparency). All were
generated with Pillow from the PNGs; if the logo changes, replace the two source PNGs and
regenerate the derived files (a larger mark export, ≥ 512 px tall, would sharpen the 512 icon).

## Environment variables

| Var | Scope | Purpose |
|---|---|---|
| `DTC_SITE_URL` | build | canonical/OG URLs + sitemap (production: `https://deploythecamel.com`, no `www`; must match the `Sitemap:` line in `public/robots.txt`) |
| `DTC_CONTACT_EMAIL` | build | public email in the founder block (default `enquiries@deploythecamel.com`) |
| `DTC_TURNSTILE_SITE_KEY` | build | renders Turnstile on the form (optional) |
| `POSTMARK_SERVER_TOKEN` | **function secret** | send enquiry email (Postmark server API token) |
| `CONTACT_TO_EMAIL` | function | where enquiries are delivered (`enquiries@deploythecamel.com`) |
| `CONTACT_FROM_EMAIL` | function | Postmark-verified sender signature / domain |
| `POSTMARK_MESSAGE_STREAM` | function | message stream (optional; defaults to `outbound`) |
| `TURNSTILE_SECRET_KEY` | **function secret** | verify Turnstile (optional; pair with `DTC_TURNSTILE_SITE_KEY`) |

All of them go in **one** place in Cloudflare Pages — **Settings → Environment variables** —
with separate **Production** and **Preview** tabs (add to both). Click **Encrypt** on
`POSTMARK_SERVER_TOKEN` and `TURNSTILE_SECRET_KEY`.

- **`DTC_`-prefixed** vars are **baked into the browser bundle at build time** by Vite — they
  must exist *before* the build runs, and a change only takes effect after a **redeploy**.
- The **unprefixed** vars are read by the Pages Function from `context.env` at **runtime** —
  they never reach the browser, and a change takes effect **without** a rebuild.

## Postmark setup (before the first deploy)

The contact form fails silently to send if Postmark isn't set up:

1. In Postmark, create/pick a **Server** and copy its **Server API Token** → `POSTMARK_SERVER_TOKEN`.
2. **Verify the sender**: add `CONTACT_FROM_EMAIL` as a **Sender Signature**, or verify the
   `deploythecamel.com` **domain** (DKIM + Return-Path). Postmark rejects unverified senders.
3. `CONTACT_TO_EMAIL` is where enquiries land; it can be the same address as `CONTACT_FROM_EMAIL`.
   The visitor's email is set as **Reply-To**, so *Reply* in your inbox goes straight to them.
4. `POSTMARK_MESSAGE_STREAM` defaults to `outbound`; only set it if you made a custom stream.

## Deploy to Cloudflare Pages (dashboard Git integration)

1. **Pages → Create → Connect to Git →** this repo.
2. **Root directory:** `/` · **Build command:** `npm install && npm run build` · **Output:** `dist`.
   Node ≥ 22.12 is pinned by `.nvmrc`, which Pages reads automatically (fallback: a
   `NODE_VERSION=22.12.0` env var).
3. **Environment variables** — add to both **Production** and **Preview** (see table above):
   - Build vars: `DTC_SITE_URL`, optional `DTC_CONTACT_EMAIL`, optional `DTC_TURNSTILE_SITE_KEY`.
   - Function vars: `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, optional `POSTMARK_MESSAGE_STREAM`.
   - **Encrypted secrets:** `POSTMARK_SERVER_TOKEN`, optional `TURNSTILE_SECRET_KEY`.
4. Deploy. Functions in `/functions` deploy automatically alongside the static assets — no `wrangler.toml` needed.
5. **Custom domain:** Pages → Custom domains → add `deploythecamel.com` and `www.deploythecamel.com`,
   redirect `www` → apex, and set `DTC_SITE_URL=https://deploythecamel.com` before redeploying.
6. *(Optional)* Add a Cloudflare WAF rate-limit rule on `POST /api/contact`.

Every push to the production branch auto-deploys. Roll back via Pages → Deployments → Rollback.

## SEO basics

- **Canonical host** is `https://deploythecamel.com` (no `www`). `DTC_SITE_URL` and
  `public/robots.txt` must both use it.
- **Sitemap** — `@astrojs/sitemap` writes `/sitemap-index.xml` at build from `DTC_SITE_URL`.
  Submit it in Google Search Console and Bing Webmaster Tools.
- **Canonicals** use the trailing-slash form (`/services/`), matching what Pages serves.
- **Structured data** — the home page carries JSON-LD (`Organization` + `ProfessionalService`,
  `WebSite`), built in `BaseLayout`.
- **Social preview** — `public/images/og-image.png` (1200×630) feeds `og:image`/`twitter:image`.
- **404** passes `noindex` to `BaseLayout`.

## Before go-live

| Where | To do |
|---|---|
| Postmark | create server, verify `deploythecamel.com` sender; set the three function vars + secret |
| Cloudflare Pages | `DTC_SITE_URL`, custom domain, `www` redirect |
| `public/images/founder.png` | add the headshot |
| `public/images/work/hutvista.png` | add a real Hutvista screenshot |
| `/contact` copy | "usually within two working days" — adjust if that's not the promise you want to make |

## Notes

- To swap the email provider, edit only `sendEmail()` in `functions/api/contact.ts`.
- The `SERVICES` array in `src/config/site.ts` drives the home cards, footer, services
  anchors and the contact form's project-type select — change tiers there.
