# Edu Plus - PRD

## Stack
FastAPI + MongoDB + APScheduler + emergentintegrations | React 19 + Tailwind + shadcn/ui + framer-motion

## Iter 1 — MVP (landing, auth JWT, dashboard, team, packages Stripe, leaderboard, evaluare, AI plan)
## Iter 2 — 100 întrebări pe categorii, streak, medalii, simulare examen 2h, sesiuni live, leaderboard săptămânal
## Iter 3 — Mod părinte (link prin cod 6-char), email reminders mock, cron săptămânal Luni 00:00 Bucharest
## Iter 4 — Admin Panel COMPLET
- Rol nou `admin` cu utilizator pre-seedat (`calinmorarumihai@gmail.com` / `EduPlus@Admin2026!`)
- Pagină `/admin` cu 5 taburi:
  - **Statistici**: elevi, părinți, teste, întrebări, plăți, venit RON, scor mediu RO/MAT, Top 5 elevi
  - **Întrebări CRUD**: filtru materie, grupare pe categorie, form modal cu opțiuni + radio răspuns corect + flag inițial
  - **Pachete CRUD**: editare preț, features (listă dinamică), descriere, popular flag — *migrate din hardcoded dict → DB collection*
  - **Profesori CRUD**: nume, materie, bio, fun fact, URL imagine
  - **Sesiuni live CRUD**: titlu, profesor, dată/oră, durată, Zoom link, tier acces, locuri
- 38/38 teste admin trec + regresia iter 1-3 toate passing

## Tests
- 60+ teste backend trec (100%) acumulat across all iterations
- Admin panel verificat manual cu screenshots

## Credentials
- Admin: `calinmorarumihai@gmail.com` / `EduPlus@Admin2026!`
