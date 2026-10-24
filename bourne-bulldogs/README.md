# Bourne Bulldogs Basketball Club website

Next.js 15 (App Router) with Tailwind v4, Framer Motion, GSAP ScrollTrigger and Lenis. Every image is self-hosted in `public/images`; nothing points at Squarespace.

Railway project: **Bourne Bulldogs Website**, service `bourne-bulldogs-web`. Root directory `/bourne-bulldogs`, built from `Dockerfile` with the settings in `railway.json` (same pattern as the other projects in this repo). Only pushes that touch `bourne-bulldogs/` redeploy it.

## Editing text

All copy lives in `src/content/site.ts`. Open it on GitHub, click the pencil, change the words between the quotes, commit. Railway redeploys in about two minutes.

Keep the quotes and commas where they are. If you need an apostrophe inside a line, it's fine: the lines are wrapped in double quotes.

## Swapping or adding photos

- **Swap:** upload a new file to `public/images` with exactly the same filename. Sizes and blur placeholders regenerate on every build, so a different shape is fine.
- **Add:** upload it to `public/images`, then add an entry with its alt text in `src/content/images.ts`.
- **Nicola's photo:** upload `team-nicola.jpg`, add `teamNicola: { file: "team-nicola.jpg", alt: "Nicola Read, safeguarding officer and club manager" },` to `src/content/images.ts`, then in `src/content/site.ts` add `image: "teamNicola",` to Nicola's entry. Her monogram card turns into the photo.

Phone photos can be uploaded as they are; Next.js serves them as AVIF/WebP at the right size.

## Forms and email (Resend)

The contact, join and merch forms email `CONTACT_TO_EMAIL` through Resend. Without `RESEND_API_KEY`:

- in development the email is printed to the terminal and the form shows success;
- in production the form shows a friendly error with the club email and phone number.

Set these on the Railway service (Variables tab): `RESEND_API_KEY`, `CONTACT_FROM_EMAIL` (e.g. `Bourne Bulldogs <hello@bournebulldogs.com>`), `CONTACT_TO_EMAIL`, `NEXT_PUBLIC_SITE_URL`. See `.env.example`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Local dev server on :3000 |
| `npm run build` / `npm run start` | Production build / server (`PORT` respected) |
| `node scripts/fetch-assets.mjs` | Re-downloads everything from the old Squarespace site (only works while it's still live) |
| `node scripts/brand-logos.mjs` | Rebuilds the on-dark logo and the favicon set from `logo-main.png` |

The asset download runs on GitHub Actions (`.github/workflows/bourne-bulldogs-assets.yml`) because it needs open internet. Once Squarespace is cancelled it has nothing left to fetch, and everything it fetched is already committed.
