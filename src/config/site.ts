/**
 * Site-wide constants resolved from build-time env (DTC_ prefix). Centralised so
 * pages/components never read import.meta.env directly.
 */
export const CONTACT_EMAIL = import.meta.env.DTC_CONTACT_EMAIL ?? 'enquiries@deploythecamel.com';
export const TURNSTILE_SITE_KEY = import.meta.env.DTC_TURNSTILE_SITE_KEY ?? '';

export const SITE_NAME = 'Deploy the Camel';
export const SITE_TAGLINE = 'Software development, New Zealand';
export const SITE_DESCRIPTION =
  'Deploy the Camel is a New Zealand software studio. We design, build and run websites, web applications and bespoke business systems, and we stay around after launch.';

/** Primary nav (header + footer "Company" column). */
export const NAV_LINKS = [
  { label: 'Services', href: '/services' },
  { label: 'Work', href: '/work' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
] as const;

/** The primary call to action, used in the header, hero and CTA band. */
export const CTA = { label: 'Start a project', href: '/contact' } as const;

/**
 * The four service tiers. `id` is the anchor on /services; the home cards and the
 * contact form's "project type" select reuse these.
 */
export const SERVICES = [
  {
    id: 'websites',
    title: 'Websites',
    summary: 'A fast, well-built site that says what you do and brings enquiries in.',
  },
  {
    id: 'web-applications',
    title: 'Web applications',
    summary: 'Customer portals, admin tools and software products your team logs in to every day.',
  },
  {
    id: 'bespoke-systems',
    title: 'Bespoke business systems',
    summary: 'The system your business actually runs on: bookings, billing, reporting, all fitted to how you work.',
  },
  {
    id: 'support',
    title: 'Support & hosting',
    summary: 'We host, monitor and maintain what we build, on a simple monthly arrangement.',
  },
] as const;

/**
 * Founder contact block shown in the footer and on /contact — a real person, not a
 * mailbox. Email only, no phone (same approach as Hutvista). A labelled placeholder
 * renders until the headshot exists at `photo`.
 */
export const FOUNDER = {
  name: 'Albert Janse v Rensburg',
  role: 'Founder & developer, Deploy the Camel',
  email: CONTACT_EMAIL,
  photo: '/images/founder.png',
  promise: 'You’ll deal with me directly, from the first call to go-live and after.',
} as const;
