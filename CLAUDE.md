# Deploy the Camel — marketing site

The public site for **Deploy the Camel**, a one-person New Zealand software studio
(websites → web applications → bespoke business systems → support and hosting).
Static Astro site + one Cloudflare Pages Function for the contact form, deployed to
Cloudflare Pages at **https://deploythecamel.com**. Cloned from the Hutvista marketing
site's stack; `README.md` is the ops record (local dev, env vars, Postmark, deploy).

This file is the design record. Add new decisions here; do not create separate plan files.

## Locked decisions (2026-10-24)

1. **Stack** — same as the Hutvista marketing site: Astro 7 static, Tailwind CSS v4
   (CSS-first tokens in `src/styles/global.css`), self-hosted variable font, `@astrojs/sitemap`,
   ESLint flat config, strict TS with `@components/* @layouts/* @config/*` aliases, Node 22.12
   (`.nvmrc`), Cloudflare Pages + Pages Functions. Zero JS framework; the only client scripts
   are the mobile menu and the contact form submit.
2. **Env prefix is `DTC_`** (`DTC_SITE_URL`, `DTC_CONTACT_EMAIL`, `DTC_TURNSTILE_SITE_KEY`).
   Function secrets are unprefixed and read from `context.env` only.
3. **Brand** — no logo or palette existed, so this site defines them:
   - Font: **Manrope** (variable, self-hosted). Not Outfit, to keep the studio visually
     distinct from Hutvista.
   - Palette: warm gray "paper" neutrals, **ink** (`gray-900`) for headings and primary
     buttons, **camel** (`brand-*`, `#b57a40` at 500) as a sparing accent (eyebrow labels,
     link underlines, small marks, focus ring). Camel is deliberately *not* the button colour.
   - Logo: typographic lockup in `src/components/Logo.astro` (two-hump mark on a camel tile +
     wordmark). `public/favicon.svg`, `apple-touch-icon.png` and `images/og-image.png` share
     the geometry. All are placeholders to replace when a real logo exists.
   - Look: editorial rather than "SaaS template" — left-aligned, ruled sections, numbered
     tiers, generous whitespace, no gradients/blobs/glassmorphism/emoji icons, `rounded-xl`
     at most, borders over shadows.
4. **Site map** — `/` home, `/services` (anchors `websites`, `web-applications`,
   `bespoke-systems`, `support`, `pricing`), `/work` (anchor `hutvista`), `/about`, `/contact`,
   `404`. Nav: Services · Work · About · Contact; primary CTA everywhere is
   **"Start a project" → `/contact`**. No login link (this is a services company, not a product).
5. **Service tiers** — the four in `SERVICES` (`src/config/site.ts`). The home cards,
   footer, services page and the contact form's "project type" select all derive from it.
6. **Pricing** — no figures anywhere. `/services#pricing` explains: quoted in writing as part
   of the plan; fixed price for fixed scope; flat monthly support; no lock-in, client owns
   code, data and accounts. No GST wording.
7. **Truth in copy** — every claim on the site is backed by something actually shipped
   (Hutvista, the CamelArmor identity server, this site's own stack). No invented years of
   experience, team size, client logos, testimonials or SLAs. The one soft promise is the
   contact page's "usually within two working days" reply time, which the founder can edit.
8. **Portfolio** — **Hutvista only** for now (the studio's own product, in production). The
   product is written **"Hutvista"** (lowercase v) everywhere. Other projects are added only
   when the user says so.
9. **Contact** — enquiries go to **enquiries@deploythecamel.com** (`DTC_CONTACT_EMAIL`
   default and `CONTACT_TO_EMAIL`). Founder block (`FOUNDER` in `src/config/site.ts`) is the
   same approach as Hutvista: name, role, email only, **no phone**, headshot slot at
   `public/images/founder.png`. Postmark sender/domain is set up by the user later.
10. **Images** — `ImageSlot` renders a labelled placeholder until the real file exists in
    `public/`. Never mock up UI or use stock art. Expected files: `images/work/hutvista.png`
    (bookings calendar, light theme, no customer data), `images/founder.png` (square headshot).
11. **Accessibility / SEO baseline** — one `h1` per page, skip link, `aria-current` on nav,
    `scroll-mt-24` anchors, keyboard-visible focus rings, trailing-slash canonicals, JSON-LD
    (`Organization` + `ProfessionalService`, `WebSite`) on the home page only, `noindex` 404,
    CSP in `public/_headers` allowing only self + Turnstile.

## Working rules

- `npm run lint`, `npm run check`, `npm run build` must be clean before shipping; the
  user runs them on the Mac (the Linux sandbox lacks the rolldown binding and must not
  `npm install` into the host-mounted repo).
- Commits per workstream, no AI-attribution trailers.
- Keep `README.md` current when env vars, deploy steps or the site map change.
