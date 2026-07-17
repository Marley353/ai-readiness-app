# AI Readiness Assessment

An 8-dimension AI readiness assessment tool for organisations. Scores maturity across Leadership & Strategy, Data Foundations, Technology & Architecture, People & Culture, Process & Integration, Governance & Risk, Training & Enablement, and Measurement & Value.

## Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **UI:** React 19, Tailwind v4, Recharts, GSAP
- **Auth:** Clerk v7
- **Payments:** Stripe (subscriptions, £15/mo or £129.99/yr)
- **PDF:** jsPDF
- **Deploy:** Vercel

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in values below
npm run dev
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Yes | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Yes | `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Yes | `/app` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Yes | `/app` |
| `STRIPE_SECRET_KEY` | For payments | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | For payments | Stripe webhook signing secret |
| `STRIPE_PRICE_ID_MONTHLY` | For payments | Stripe Price ID for monthly plan |
| `STRIPE_PRICE_ID_ANNUAL` | For payments | Stripe Price ID for annual plan |
| `NEXT_PUBLIC_APP_URL` | For payments | Production URL (e.g. `https://yourapp.vercel.app`) |
| `RESEND_API_KEY` | For email | Resend API key — enables the "Send Results" email feature |
| `RESEND_FROM` | Optional | From address for result emails (defaults to Resend onboarding sender) |

## Data storage

Assessment data is stored in the browser's `localStorage` under:
- `ai-readiness-assessments-v3` — array of assessment objects
- `ai-readiness-active-id-v3` — currently selected assessment ID
- `ai_industry` — selected industry for personalisation

No server-side database — all scoring and results are computed client-side.

## Project structure

```
app/                    # Next.js App Router pages
  api/checkout/         # Stripe Checkout session creation
  api/stripe/webhook/   # Stripe webhook receiver
  app/                  # Assessment tool (/app)
components/
  ai-readiness-scorecard.tsx  # Main assessment + results engine
  assessment-wizard.tsx       # Guided 32-question flow
  landing/              # Marketing landing page sections
  ui/                   # shadcn/ui components
lib/
  plans.ts              # Free/Pro feature definitions
  use-plan.ts           # Client-side plan hook
  scoring.ts            # Data model + scoring engine (golden-tested)
  pdf-export.ts         # jsPDF report generation + mailto composition
```

## Design decisions

- **Landing sections are client components by design.** Every section uses the
  GSAP `useScrollReveal` hook (`lib/gsap-hooks.ts`) and styled-jsx, both of
  which require the client. Converting to Server Components would drop the
  scroll-animation system for a negligible first-load gain on a page that is
  mostly below the fold.
- **Scoring behaviour is frozen by golden-master tests** (`lib/scoring.test.ts`).
  If a scoring change is intentional, update the expected values deliberately
  and explain why in the commit message.
