# Assignment submission — Product Engineer, Cityflo

**Applicant repo:** https://github.com/Vishnu-comp/Vishnu-Cityflow
**Pull request (full history):** https://github.com/Vishnu-comp/Vishnu-Cityflow/pull/1
**Memo (the product-thinking artifact):** [`docs/memo.md`](./memo.md)

## What was built

**Morning Triage** — the on-call tool for the situation in the brief: ~30 untriaged rider
messages, standup in 15. One click clusters the batch, surfaces the 2–3 things that
genuinely need attention today, and drafts replies a human reviews before sending.

- **Memo first** — grounded in Cityflo's official `feedback.csv` (30 rows, 22–23 Jun): one user
  (the support agent on morning duty), one concrete problem (the batch lies about what matters —
  quiet safety + money reports vs. loud praise and sarcastic 5★), and the cuts stated in writing.
- **LLM where it earns its place** — semantic clustering, attention ranking, and reply
  drafting via OpenAI (`gpt-4o-mini`) when `OPENAI_API_KEY` is set.
- **Honest degradation** — without a key (or on any LLM failure), a deterministic
  heuristic provider runs the same output contract, clearly badged in the UI. The tool
  never dies.
- **Don't trust the model — or the data** — the official batch contains a real prompt-injection
  attack (`FB-019`) and two planted `CF-PRIORITY-OVERRIDE` rows (`FB-012`, `FB-028`) bundled with
  an instruction to silently bury them. All three are flagged and shown, never obeyed; model
  output is validated against the real message set, counts recomputed locally, attention capped
  at 3, and every run persisted as an append-only audit record.
- **Safety-weighted ranking** — one "genuinely scared" driver report (`FB-014`) outranks a pile
  of comfort complaints; sarcastic 5★ rants (`FB-009`, `FB-021`) are classified by text, never stars.
- **Human-in-the-loop** — AI drafts are editable/copyable and explicitly never auto-sent.
- **Real data in** — Cityflo's own export shape maps cleanly (`id, created_at, channel, route,
  rider_id, star_rating, message`); paste/upload any CSV, fix-ups always come with receipts.
  The built-in 30-message sample stays one click away.

README additions, as the brief required: **"Where I disagreed with the AI"** (5 concrete moments)
and **"What I faked / cut"**.

## Stack

React + Tailwind v3 (styled to cityflo.com) on the front; Django 5 + DRF + SQLite on the
back; REST; OpenAI SDK; Node 18-compatible. Guided first-run tour in the UI.
Tests: `cd backend && python manage.py test` (12 passing, incl. official-CSV shape,
override-token detection, and safety-outranks-comfort ranking).

## Run it

```bash
cd backend && python manage.py migrate && python manage.py seed_feedback && python manage.py runserver 0.0.0.0:8000
cd frontend && npm install && npm run dev   # → http://127.0.0.1:5173
```

Full details in [`README.md`](../README.md).