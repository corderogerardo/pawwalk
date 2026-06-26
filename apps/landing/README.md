# PawWalk Landing — Next.js 15 · React 19 · Tailwind v4

The marketing site + waitlist. App Router, server components, Turbopack dev.

## Run it

```bash
cd apps/landing
npm install
npm run dev        # http://localhost:3000
```

Build for production: `npm run build && npm start`.

## Layout

```
app/
├── layout.tsx      # root layout + <head> metadata
├── page.tsx        # composes the sections below
└── globals.css     # Tailwind v4 entry + @theme tokens
components/          # Nav, Hero, Features, HowItWorks, Pricing, Waitlist, Footer
```

## Notes for learning

- **Tailwind v4 is CSS-first.** There is no `tailwind.config.js`. The entry is `@import "tailwindcss";` in `app/globals.css`, and brand tokens are declared with `@theme { --color-brand-600: …; }`, which Tailwind turns into utilities like `bg-brand-600`. PostCSS wires it up via `@tailwindcss/postcss` (see `postcss.config.mjs`).
- **App Router + server components.** Everything is a server component by default (fast, zero client JS). Only `components/Waitlist.tsx` is a client component (`"use client"`) because it has form state.
- **Phase 2:** point the waitlist form at the backend (`POST /waitlist`) and add an app-store badge section.
