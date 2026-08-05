# Assignment submission — Product Engineer, Cityflo

**Applicant repo:** https://github.com/Vishnu-comp/Vishnu-Cityflow
**Pull request (full history):** https://github.com/Vishnu-comp/Vishnu-Cityflow/pull/1
**Memo (the product-thinking artifact):** [`docs/memo.md`](./memo.md)

## What was built

**Morning Triage** — the on-call tool for the situation in the brief: ~30 untriaged rider
messages, standup in 15. One click clusters the batch, surfaces the 2–3 things that
genuinely need attention today, and drafts replies a human reviews before sending.

- **Memo first** — one user (the daily pass commuter), one concrete problem (pickup
  reliability breaking the core promise), and the cuts stated in writing: new routes,
  pricing nits, pet policy, auto-sending AI drafts.
- **LLM where it earns its place** — semantic clustering, attention ranking, and reply
  drafting via OpenAI (`gpt-4o-mini`) when `OPENAI_API_KEY` is set.
- **Honest degradation** — without a key (or on any LLM failure), a deterministic
  heuristic provider runs the same output contract, clearly badged in the UI. The tool
  never dies.
- **Don't trust the model** — rider text is treated as untrusted data (a real
  prompt-injection attempt, `F-30`, ships in the batch and is flagged); model output is
  validated against the real message set, counts are recomputed locally, attention is
  capped at 3, and every run is persisted as an append-only audit record.
- **Human-in-the-loop** — AI drafts are editable/copyable and explicitly never auto-sent.
- **Real data in** — paste/upload any feedback CSV (flexible headers, fix-up receipts);
  the built-in 30-message sample stays one click away.

## Stack

React + Tailwind v3 (styled to cityflo.com) on the front; Django 5 + DRF + SQLite on the
back; REST; OpenAI SDK; Node 18-compatible. Guided first-run tour in the UI.
Tests: `cd backend && python manage.py test` (7 passing).

## Run it

```bash
cd backend && python manage.py migrate && python manage.py seed_feedback && python manage.py runserver 0.0.0.0:8000
cd frontend && npm install && npm run dev   # → http://127.0.0.1:5173
```

Full details in [`README.md`](../README.md).
