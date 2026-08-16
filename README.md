# TalentHunt

A fictional Recruiter-as-a-Service operating system for startup hiring. TalentHunt is a portfolio product: it demonstrates recruiter workflow, client transparency, hiring operations, explainable intelligence, and a clean full-stack architecture. It is **not** a real company, and it does **not** use real brands, candidates, customers, or testimonials.

TalentHunt is also **not another ATS**. Existing ATS products already store candidate records. This product is the operational layer between recruiter judgment and client decision-making — calibration, shortlists, SLAs, pipeline health, and weekly hiring intelligence.

## Product thesis

RaaS teams do not fail because they lack a database of candidates. They fail in the handoffs: a brief that cannot be filled, a shortlist that is a dump instead of a point of view, a client who goes quiet, an interview with no written feedback, a week that cannot be explained.

**Hypothesis:** if a recruiter’s next action, a role’s health, and a client’s decision are visible in the same operating system, delivery velocity and hiring outcomes improve — without replacing the recruiter with a model.

**Primary user:** the embedded / RaaS recruiter.  
**Secondary user:** the hiring manager / founder, who needs transparency without seeing internal recruiter notes or internal rejection rationale.

## Why the pipeline dashboard was built first

The Command Center answers one question: *what should the recruiter do next?* That is the product. Role intake, calibration, Kanban, candidate intelligence, client portal, and weekly reports all exist to feed that loop. We did not start with a generic CRUD “candidate table,” because that is an ATS, and the ATS already exists.

## Features

- Role intake (multi-step brief) and **role calibration** (must-have vs preferred, feasibility, recommendations)
- Recruiter **Command Center** with attention queue and action-oriented **Recruiter Copilot**
- Pipeline board with optimistic stage updates (`PATCH /candidates/{id}`)
- Candidate intelligence (explainable fit, recruiter recommendation, notes, interview feedback)
- Pipeline health, SLA tracking, rejection analytics
- Client portal (recommended candidates only — no internal notes)
- Deterministic weekly hiring report and sample market intelligence
- Loading skeletons, empty states, API errors with retry, form validation, toasts

All “AI” in this version is **deterministic and labeled**. There is no live model.

## Architecture

```
React + Vite + Tailwind  →  FastAPI REST API  →  SQLAlchemy  →  SQLite (local) / PostgreSQL (via DATABASE_URL)
```

Intelligence is isolated behind service boundaries so an LLM can be introduced later without rewriting the app:

- `RoleCalibrationService`
- `CandidateMatchingService`
- `PipelineHealthService`
- `HiringReportService`
- `RecruiterCopilotService`
- `MarketInsightsService`

These interfaces intentionally separate product intelligence from infrastructure so an LLM provider can be introduced later without rewriting the application.

## Local setup

### Backend

```bash
cd backend
python -m pip install -r requirements.txt
copy .env.example .env   # Windows; use cp on macOS/Linux
python seed.py
uvicorn main:app --reload
```

A project venv also lives at `backend/.venv` if you prefer not to install into the global interpreter.

API: [http://localhost:8000](http://localhost:8000) · docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### Frontend

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

App: [http://localhost:5173](http://localhost:5173)

### Environment variables

| Variable | Where | Local default |
|---|---|---|
| `DATABASE_URL` | backend | `sqlite:///./talenthunt.db` |
| `FRONTEND_URL` | backend | `http://localhost:5173` |
| `VITE_API_URL` | frontend | `http://localhost:8000` |

PostgreSQL is supported by changing `DATABASE_URL` (Render often provides `postgres://…`; the app rewrites that to `postgresql://`). You will need a Postgres driver such as `psycopg2-binary` in that environment — it is intentionally **not** in the local dependency set, which stays limited to FastAPI, Uvicorn, SQLAlchemy, Pydantic, and python-dotenv.

## Demo mode

There is no authentication in this portfolio build. Switch **Recruiter** / **Client** in the header.

Suggested demo narrative:

1. Open the Recruiter Command Center (`/app`).
2. Open the at-risk **Stripe — Senior Backend Engineer** role.
3. Read Pipeline Health (~60s / 100): shortlist below target and client response time slowing the pipeline.
4. Open Role Calibration: Kafka as a must-have is shrinking the pool.
5. Open **Aarav Menon** (91% match) and walk the fit breakdown.
6. On the Kanban, move Aarav Shortlisted → Client Review (optimistic UI + `PATCH`).
7. Switch to the Client portal, open the same role, request an interview.
8. Return to the recruiter view, submit interview feedback.
9. Generate the weekly hiring report.
10. Close on: *TalentHunt turns recruiter activity into hiring intelligence.*

## Product decisions

- **Command Center over inbox:** recruiters need a prioritized work surface, not a list of every candidate.
- **Calibration before sourcing:** the cheapest time to change a must-have is before the first outreach.
- **Candidate intelligence is explainable:** fit is a readable breakdown, not a mysterious score.
- **Health and SLA are first-class:** RaaS is a delivery business.
- **Weekly reports are generated from live data:** no pasted slideware.
- **Client portal is a subset:** transparency without leaking recruiter craft.

## What we intentionally did not build

A full ATS, email sequencing, calendar, Slack, SSO, multi-tenant billing, or a live language model. Those are Phase 2/3. Shipping them now would hide the actual product thesis.

## AI roadmap

1. **Phase 1 (this repo):** deterministic, explainable intelligence — calibration, health, copilot, reports.
2. **Phase 2:** LLM-assisted summaries and weekly narratives on top of the same services.
3. **Phase 3:** sourcing and communication automation (still with a human recruiter in the loop).

## Future roadmap

Automated candidate matching, Slack notifications, calendar integration, email automation, ATS integrations, candidate outreach, deeper talent market intelligence.

## Deployment

### Render (backend)

`render.yaml` is at the repo root (`python` 3.11, `pip install -r requirements.txt`, `uvicorn main:app --host 0.0.0.0 --port $PORT`).

1. Push this repo to GitHub.
2. Create a Render Web Service from the repo, root directory `backend`, or use the Blueprint.
3. Set `FRONTEND_URL` to the Vercel origin (include `https://`).
4. Free-tier SQLite is ephemeral; the API seeds an empty database on boot so the demo still loads after a spin-up.

### Vercel (frontend)

1. Import the repo, set the root directory to `frontend`.
2. Set `VITE_API_URL` to the Render URL (no trailing slash), e.g. `https://talenthunt-api.onrender.com`.
3. `vercel.json` rewrites all routes to `index.html` for the SPA.

## Performance notes (free tiers)

This app is built for **Vercel Hobby + Render free (512MB, spins down after ~15 minutes idle)**.

Backend: indexes on `role_id`, `stage`, and `candidate_id`; GZip on JSON; in-memory cache for calibration and market insights; paginated `GET /roles`; eager-loading to avoid N+1.

Frontend: optimistic Kanban moves; one `/dashboard/summary` fetch per Command Center load; skeletons shown immediately so a 30–60s cold start is not a blank white screen.

**Be aware:** Render’s free tier will still be slow on the first request after idle. That is a hosting-tier limitation. Code can mask it with skeletons and a long fetch timeout; it cannot fully remove it.

## Design

Token preview: [/design-system](http://localhost:5173/design-system). Warm paper, Fraunces + Figtree, one terracotta accent. Screens are meant to read as a seed-stage recruiting OS, not a Tailwind tutorial.

All names, companies, metrics, and quotes are fictional and labeled as sample data.
