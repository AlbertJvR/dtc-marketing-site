interface ImportMetaEnv {
  /** Canonical site URL for OG/canonical tags and the sitemap, e.g. https://deploythecamel.com. */
  readonly DTC_SITE_URL?: string;
  /** Public contact email shown on the site (mailto:). Default enquiries@deploythecamel.com. */
  readonly DTC_CONTACT_EMAIL?: string;
  /** Cloudflare Turnstile public site key — optional; the contact form works without it. */
  readonly DTC_TURNSTILE_SITE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
