import { CHIP, SOURCE_LABELS, timeAgo } from '../format.js'

export default function FeedbackList({ messages, clusterOf, flagged, highlightCluster }) {
  return (
    <ul className="m-0 list-none p-0">
      {messages.map((m) => {
        const cluster = clusterOf.get(m.message_id)
        const isFlagged = flagged.includes(m.message_id)
        const dimmed = highlightCluster && cluster?.id !== highlightCluster && !isFlagged
        return (
          <li
            key={m.message_id}
            className={
              'mb-2.5 rounded-2xl border border-line bg-white px-4 py-3.5 transition hover:border-[#d8d2be]' +
              (dimmed ? ' opacity-35' : '')
            }
          >
            <div className="mb-1.5 flex flex-wrap items-baseline gap-2.5 text-xs">
              <span className="font-mono text-[11px] font-bold text-ink-soft">{m.message_id}</span>
              <span className="rounded-[5px] bg-cream px-[7px] py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-ink-soft">
                {SOURCE_LABELS[m.source] ?? m.source}
              </span>
              <span className="font-semibold text-ink">{m.rider}</span>
              <span className="text-muted max-[920px]:hidden">{m.route}</span>
              <span className="text-muted">{timeAgo(m.ts)}</span>
            </div>
            <p className="mb-2 text-[13.5px] leading-[1.6]">{m.body}</p>
            <div className="flex flex-wrap gap-[6px]">
              {isFlagged && (
                <span className={CHIP.danger} title="This message tries to hijack the AI. It was treated as data, not instructions.">
                  ⚠ prompt-injection attempt — ignored, treated as data
                </span>
              )}
              {cluster && <span className={CHIP.subtle}>{cluster.label}</span>}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
