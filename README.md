# Cityflo — Morning Triage

A small, sharp tool for the on-call product engineer: dump in the last ~48h of rider feedback,
get back **the 2–3 things that genuinely need attention before standup** — clustered, ranked,
with draft replies a human can edit and send. Includes the decision memo (`docs/memo.md`).

Built for the Cityflo product-engineer assignment (timeboxed slice, ~30-message sample batch).

## What it does

| Step | How | Where an LLM earns its place |
|---|---|---|
| Ingest | 30 realistic Bengaluru rider messages (`backend/data/feedback.json`) seeded into SQLite | — |
| Cluster | Messages grouped into issue themes (timing, payments, app bugs, ride quality, requests) | ✅ semantic clustering of messy, mixed-tone free text |
| Rank | Top-3 "needs attention" cards with *why now* + concrete next step | ✅ weighing churn risk, money stuck, volume |
| Draft | Editable reply drafts per top issue — **review before sending, never auto-sent** | ✅ tone + specificity at speed |
| Guard | Prompt-injection messages flagged & quarantined; model output validated against real ids, counts recomputed locally, attention capped at 3 | ✅ (this is the "don't trust the model" part) |

**No API key?** Everything still works — a deterministic keyword-heuristic provider runs the same
output contract, clearly badged in the UI. Set `OPENAI_API_KEY` to switch to semantic LLM triage
(`OPENAI_MODEL` optional, default `gpt-4o-mini`). Any LLM failure falls back to heuristic with a
visible note — the tool is never dead in the water.

## Project structure

```
Vishnu-Cityflow/
├── docs/
│   └── memo.md                 # The memo: one user, one problem, deliberate cuts
├── backend/                    # Django + DRF, SQLite
│   ├── manage.py
│   ├── requirements.txt
│   ├── cityflo_triage/         # project: settings, urls, wsgi
│   ├── data/
│   │   └── feedback.json       # sample batch — 30 rider messages (incl. 1 injection attempt)
│   └── triage/                 # the app
│       ├── models.py           # FeedbackMessage, TriageRun (append-only, auditable)
│       ├── llm.py              # ★ triage engine: openai + heuristic providers, validation guardrails
│       ├── views.py            # REST endpoints
│       ├── serializers.py
│       └── management/commands/seed_feedback.py
├── frontend/                   # React + Vite (dev server proxies /api → Django)
│   └── src/
│       ├── App.jsx             # layout, state, run-triage flow
│       ├── api.js              # fetch wrappers (relative URLs only)
│       ├── format.js
│       ├── components/
│       │   ├── AttentionCard.jsx  # ranked card: why-now, next step, draft reply
│       │   ├── DraftReply.jsx     # editable AI draft + copy (human-in-the-loop)
│       │   ├── ClusterBar.jsx     # cluster pills → filter the inbox
│       │   └── FeedbackList.jsx   # the 30 messages, severity/injection chips
│       └── styles.css          # matches cityflo.com: serif display, cream surfaces, black pill CTA, yellow accents
└── README.md
```

## Run it

```bash
# 1) API  (http://127.0.0.1:8000)
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_feedback
python manage.py runserver 0.0.0.0:8000

# 2) UI  (http://127.0.0.1:5173)
cd frontend
npm install
npm run dev
```

Optional — real LLM triage:

```bash
export OPENAI_API_KEY=sk-...        # plus OPENAI_MODEL if you want a different model
```

### API

| Method | Path | Returns |
|---|---|---|
| GET | `/api/feedback/` | the seeded batch |
| GET | `/api/triage/latest/` | most recent triage run (404 until first run) |
| POST | `/api/triage/run/` | runs triage, persists + returns the run |

## Scope — deliberately cut (see memo for the *why*)

Auth/accounts; actually sending replies; multi-day trend charts; embeddings/vector search;
pagination; PDF/CSV export. The assignment is "2–3 things that need attention, fast" — everything
here serves that or it's not here.
