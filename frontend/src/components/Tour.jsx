import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { BTN_GHOST, BTN_PRIMARY } from '../format.js'

/**
 * Product tour: dims + blurs the page, spotlights one element at a time,
 * and explains it in plain English. Zero dependencies.
 *
 * - Auto-starts once per browser (localStorage); reopen via the "? Tour" button
 *   (parent calls tourRef.current.open()).
 * - Steps whose target isn't rendered yet (e.g. attention cards before the
 *   first triage run) are skipped automatically.
 * - Keyboard: → next, ← back, Esc close.
 */

const STORAGE_KEY = 'cityflo_tour_seen_v1'
const PAD = 8 // breathing room around the spotlight
const GAP = 14 // distance between spotlight and card
const CARD_W = 320
const CARD_H_EST = 224 // for above/below placement math

const STEPS = [
  {
    sel: '[data-tour="hero"]',
    title: 'Welcome to Morning Triage 👋',
    body: 'Every morning, new rider messages land here. This page turns the pile into a short, ranked to-do list before standup.',
  },
  {
    sel: '[data-tour="run"]',
    title: 'Start here',
    body: 'One click: the AI reads every message, groups similar ones together, and picks the few that truly matter today. Takes a few seconds.',
  },
  {
    sel: '[data-tour="provider"]',
    title: 'Which brain did the work',
    body: 'A yellow tag means a real AI model triaged the batch. A plain tag means the built-in offline backup did it — we always tell you which, and why.',
  },
  {
    sel: '[data-tour="attention-card"]',
    title: 'Your to-do list, ranked',
    body: 'These 2–3 cards are the only things that need action today. Each one says why it can’t wait and what to do next. Click a card to spotlight its messages.',
  },
  {
    sel: '[data-tour="draft"]',
    title: 'AI writes the first draft',
    body: 'A ready-to-send reply for that group of riders. Read it, edit it, copy it — nothing is ever sent automatically. You stay in charge.',
  },
  {
    sel: '[data-tour="band"]',
    title: 'Receipts, not vibes',
    body: 'This strip shows the numbers behind the ranking — how many messages, and how many riders hinted at leaving. That’s why this card is ranked where it is.',
  },
  {
    sel: '[data-tour="clusters"]',
    title: 'Filter by theme',
    body: 'Similar complaints are grouped into themes like timing, payments and app bugs. Tap one to read just those messages.',
  },
  {
    sel: '[data-tour="feed-row"]',
    title: 'The raw inbox',
    body: 'Every message, untouched, with its source and theme tag. Nasty attempts to trick the AI (prompt injections) get flagged and are never obeyed.',
  },
  {
    sel: '[data-tour="memo"]',
    title: 'The why, in one note',
    body: 'A short memo records today’s call: who we’re solving for, the one problem worth fixing, and what we deliberately skipped. Full version lives in docs/memo.md.',
  },
]

const Tour = forwardRef(function Tour({ ready }, ref) {
  const [idx, setIdx] = useState(null) // active step index; null = closed
  const [rect, setRect] = useState(null)
  const autoStarted = useRef(false)

  /** First step index from `from` (in direction `dir`) whose target exists. -1 if none. */
  const findStep = useCallback((from, dir) => {
    for (let i = from; i >= 0 && i < STEPS.length; i += dir) {
      if (document.querySelector(STEPS[i].sel)) return i
    }
    return -1
  }, [])

  const close = useCallback((markSeen = true) => {
    setIdx(null)
    if (markSeen) localStorage.setItem(STORAGE_KEY, '1')
  }, [])

  const open = useCallback(() => {
    const first = findStep(0, 1)
    if (first >= 0) setIdx(first)
  }, [findStep])

  useImperativeHandle(ref, () => ({ open }), [open])

  const go = useCallback(
    (dir) => {
      const next = findStep(idx + dir, dir)
      if (next === -1) close(true)
      else setIdx(next)
    },
    [idx, findStep, close],
  )

  // Scroll target into view and keep its box measured while open
  useEffect(() => {
    if (idx === null) return
    const el = document.querySelector(STEPS[idx].sel)
    if (!el) return
    setRect(null)
    el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    const measure = () => setRect(el.getBoundingClientRect())
    const t = setTimeout(measure, 420)
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [idx])

  // Auto-start exactly once per browser, after the inbox loads
  useEffect(() => {
    if (!ready || autoStarted.current) return
    if (localStorage.getItem(STORAGE_KEY)) return
    autoStarted.current = true
    const t = setTimeout(open, 800)
    return () => clearTimeout(t)
  }, [ready, open])

  // Keyboard controls
  useEffect(() => {
    if (idx === null) return
    const onKey = (e) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [idx, go, close])

  if (idx === null || !rect) return null

  const step = STEPS[idx]
  const vw = window.innerWidth
  const vh = window.innerHeight

  // Spotlight box, inset by PAD and clamped to the viewport
  const l = Math.max(rect.left - PAD, 0)
  const t = Math.max(rect.top - PAD, 0)
  const r = Math.min(rect.right + PAD, vw)
  const b = Math.min(rect.bottom + PAD, vh)
  const w = r - l
  const h = b - t

  // Four dimming/blurring strips around the spotlight
  const strips = [
    { top: 0, left: 0, width: vw, height: t },
    { top: b, left: 0, width: vw, height: Math.max(vh - b, 0) },
    { top: t, left: 0, width: l, height: h },
    { top: t, left: r, width: Math.max(vw - r, 0), height: h },
  ].filter((s) => s.width > 0 && s.height > 0)

  // Card placement: below the target if it fits, otherwise above, clamped on-screen
  const cardW = Math.min(CARD_W, vw - 24)
  const centerX = rect.left + rect.width / 2
  const left = Math.min(Math.max(centerX - cardW / 2, 12), Math.max(vw - cardW - 12, 12))
  const arrowLeft = Math.min(Math.max(centerX - left, 28), cardW - 28)
  const belowY = rect.bottom + PAD + GAP
  const fitsAbove = belowY + CARD_H_EST > vh && rect.top - PAD - GAP - CARD_H_EST > 8
  const cardY = fitsAbove
    ? rect.top - PAD - GAP - CARD_H_EST
    : Math.min(belowY, vh - 60)

  const isFirst = findStep(idx - 1, -1) === -1
  const isLast = findStep(idx + 1, 1) === -1

  return (
    <div role="dialog" aria-modal="true" aria-label={`Product tour: ${step.title}`}>
      {strips.map((s, i) => (
        <div
          key={i}
          className="fixed z-50"
          style={{
            ...s,
            backgroundColor: 'rgba(23, 22, 15, 0.45)',
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)',
          }}
        />
      ))}

      <div
        className="pointer-events-none fixed z-[55] rounded-2xl border-2 border-brand shadow-[0_0_0_4px_rgba(246,197,0,0.25)]"
        style={{ top: t, left: l, width: w, height: h }}
      />

      <div
        className="fixed z-[60] rounded-2xl border border-line bg-white p-4 shadow-[0_12px_40px_rgba(23,22,15,0.18)]"
        style={{ top: cardY, left, width: cardW }}
      >
        <span
          aria-hidden
          className={
            'absolute size-3.5 rotate-45 bg-white ' +
            (fitsAbove ? 'border-b border-r border-line' : 'border-l border-t border-line')
          }
          style={
            fitsAbove
              ? { bottom: -7, left: arrowLeft - 7 }
              : { top: -7, left: arrowLeft - 7 }
          }
        />

        <button
          aria-label="Close tour"
          onClick={() => close()}
          className="absolute right-3 top-2.5 text-lg leading-none text-muted hover:text-ink"
        >
          ×
        </button>

        <p className="m-0 pr-6 font-display text-[16px] font-bold">{step.title}</p>
        <p className="mb-0 mt-1.5 text-[13px] leading-relaxed text-ink-soft">{step.body}</p>

        <div className="mt-3.5 flex items-center justify-between border-t border-line pt-3">
          <span className="text-xs font-semibold text-muted">
            {idx + 1} of {STEPS.length}
          </span>
          <div className="flex gap-2">
            {!isFirst && (
              <button className={BTN_GHOST} onClick={() => go(-1)}>
                Back
              </button>
            )}
            <button
              className={BTN_PRIMARY}
              style={{ padding: '7px 16px', fontSize: 13 }}
              onClick={() => go(1)}
            >
              {isLast ? 'Done ✓' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})

export default Tour
