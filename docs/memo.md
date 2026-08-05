# Morning memo — rider feedback triage, 5 Aug 2026

**To:** standup · **From:** on-call product eng · **Batch:** 30 messages, last ~48h (app chat, email, Play Store, X)

## The one user

**The daily pass commuter** — someone like Ananya (F-01), who rides Whitefield → Koramangala every
workday on a monthly pass and plans her morning, her meetings, and her leave balance around our
pickup promise. She is not a prospect or an occasional rider; she's the revenue base. Features for
anyone else can wait.

## The one concrete problem

**Pickup reliability is breaking the core promise.** 8 of 30 messages (~27%) are about
timing/reliability: buses leaving minutes *early* (F-01), ETAs that jump 5 → 22 min or claim
"arriving in 2" for 25 minutes (F-05, F-17), a no-show after a 40-min-late day (F-13), skipped
stops (F-09), a booked seat that didn't exist (F-21), a pickup point moved with zero notice (F-25),
and 4 cancellations in 9 working days on a single run (F-29).

Four of these eight riders explicitly gesture at leaving — *"cancelling my pass if this week
repeats"*, *"weighing whether to renew"*, *"I plan my leave balance around this bus."* Every other
complaint in the batch (a wet seat, a loud FM radio) is survivable; a bus you can't trust to exist
is not. This is the product.

**What we do this week:** pull departure-adherence and ETA-accuracy numbers for the flagged
corridors (Whitefield ↔ Koramangala is over-represented), brief ops on the worst 3 runs, and send
the drafted replies today — with a specific follow-up date, not an apology template.

## What I'm deliberately cutting

- **New routes & feature requests** (women-only late bus, Sarjapur→Manyata, weekend service, 7:30pm
  slot — F-06, F-10, F-18, F-22): real signal, wrong week. Logged as votes for the monthly route
  review; replies acknowledge honestly without promising dates.
- **Pet policy question** (F-26): a FAQ entry, not a fire. Punted to the content backlog.
- **GST-invoice self-serve** (F-27): worth automating eventually; today it's one manual reply.
- **Auto-sending AI-drafted replies**: drafts are review-and-edit only. One wrong promise to an
  angry rider costs more than the 90 seconds a human spends reading.

## Watchlist (not acted on today, surfaced in the app)

- **Payments & refunds (6 msgs)** — a double charge (F-02), an 8-day-stuck refund (F-07), a pass
  paid but inactive at boarding (F-11). This is the #2 cluster and the cheapest trust-repair
  available: it's process, not engineering. Recommend a same-day refunds desk this week.
- **App bugs (4 msgs)** — tracking crash, OTP outage, greyed-out stop edit. OTP/blocking issues go
  to eng immediately if reproducible.

## Data hygiene note

One message (F-30) is a **prompt-injection attempt** instructing the AI to mark everything resolved.
It was quarantined, treated as data, and excluded from clustering. The pipeline validates all model
output against the real message set — counts are recomputed locally, never taken from the model.
