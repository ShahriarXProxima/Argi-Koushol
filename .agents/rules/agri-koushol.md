---
trigger: always_on
---

PROJECT: Agri-Koushol - an autonomous AI farm platform (Next.js dashboard + n8n automation + MCP server + 'Shoshsho-Prohori' chatbot, Bangla/English).

STACK (do not change without asking): Next.js App Router + TypeScript strict, Tailwind, shadcn/ui, lucide-react, Recharts, react-leaflet, Prisma + Supabase Postgres, SWR, zod, @modelcontextprotocol/sdk, @google/genai behind lib/llm.ts.

CONVENTIONS
- Server components by default; 'use client' only where needed.
- Validate every API input with zod; return JSON errors as { error: { code, message } }.
- Secrets only from process.env. Never print or commit secrets. Keep .env.example current.
- Internal/n8n endpoints require header x-api-key = INGEST_API_KEY.
- Do not edit prisma/schema.prisma without telling me; always use migrations.
- Do not rewrite unrelated files. Keep components small and typed.
- Before using any SDK, read its installed README/types. Never guess method names.
- After every task: run npm run lint and npm run build, fix all errors, then summarise what changed.

DESIGN: green and earth palette, rounded-2xl cards, light and dark mode, mobile-first, large touch targets (farmers use phones). English font Inter, Bangla font Noto Sans Bengali.

HONESTY: sensors, drone, sprayer and irrigation valves are SIMULATED. Mark simulated data in the UI with a small 'Simulated' badge. Never present simulated data as real.

AI SAFETY RULES (also enforce in code, not only in prompts)
- Never recommend or execute spraying when rain probability > 50% within the next 6 hours.
- If detection confidence < 0.6, the decision must be INSPECT.
- The assistant must call tools for facts (weather, soil, field status) and never invent values.
- Every automated action creates a Decision row with reasoning and can be overridden by the farmer.

ENV VARS: DATABASE_URL, DIRECT_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, OPENWEATHER_API_KEY, GEMINI_API_KEY, MCP_SERVER_URL, MCP_TOKEN, INGEST_API_KEY, N8N_WEBHOOK_URL, N8N_SHARED_SECRET, USE_N8N, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, FARMER_WHATSAPP_TO
