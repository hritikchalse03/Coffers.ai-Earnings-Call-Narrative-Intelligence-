# Coffers.ai

Real-time earnings call narrative intelligence platform. Compares live management language against prior quarters and stated commitments to surface where narrative deviation occurs. Focuses on measuring change relative to historical baselines — not sentiment classification — so analysts can assess whether a shift is incremental or material. Designed as a structured comparison layer that reduces cognitive effort during live earnings calls.

## Tech Stack
- **Framework**: React 19 + TypeScript 5.8
- **Build tool**: Vite 6 (primary dev/build)
- **Styling**: Tailwind CSS (CDN-based, config embedded in index.html)
- **Charts**: Recharts
- **Icons**: Lucide React
- **AI**: Google Gemini (`@google/genai`) for transcript analysis
- **Backend**: Supabase (waitlist/DB), Next.js API routes (app/api/)
- **Package manager**: npm

## Commands
- `npm run dev` — Start dev server (port 3000)
- `npm run build` — Production build (outputs to /dist)
- `npm run preview` — Preview production build
- No test framework configured

## Project Structure
- `components/` — React components (PascalCase filenames)
- `services/` — Business logic and API integrations (camelCase filenames)
- `app/api/` — Next.js API routes (waitlist endpoint)
- `types.ts` — Centralized TypeScript type definitions
- `constants.ts` — Mock data and constants
- `index.html` — Entry point with Tailwind config and custom CSS variables

## Routing
- Hash-based routing in App.tsx (`#/faq`, `#/` for home) — no react-router
- `hashchange` listener for browser back/forward support
- Each page component receives `onNavigate` callback from App

## Conventions
- Functional components only, typed with `React.FC<Props>`
- Tailwind utility classes for all styling (no CSS modules)
- Local state with useState/useRef — no global state library
- Path alias: `@/*` maps to project root (configured in tsconfig + vite)
- Services use callback pattern for data flow
- localStorage for persisting driver history and panel widths

## Environment
- Requires `.env` with `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `GEMINI_API_KEY`
- App runs in simulation mode without external API keys
- See `.env.example` for template
