import { CHIP, SEVERITY } from '../format.js'
import DraftReply from './DraftReply.jsx'

export default function AttentionCard({ item, cluster, active, onSelect }) {
  const sev = SEVERITY[cluster?.severity ?? 3]
  const churn = cluster?.signals?.churn_mentions
  const money = cluster?.signals?.money_mentions
  const blocking = cluster?.signals?.blocking_mentions
  const stripBits = [
    cluster ? `${cluster.count} messages` : null,
    churn ? `${churn} churn signals` : null,
    money ? `${money} money mentions` : null,
    blocking ? `${blocking} blocked flows` : null,
  ].filter(Boolean)

  return (
    <article
      className={
        'mb-4 cursor-pointer overflow-hidden rounded-2xl border border-line bg-white px-[18px] pt-[18px] transition ' +
        'hover:border-[#d8d2be] hover:shadow-[0_2px_10px_rgba(23,22,15,0.05)]' +
        (active ? ' outline-2 outline-brand outline-offset-1' : '')
      }
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
    >
      <div className="flex items-start gap-3">
        <span className="grid size-[26px] shrink-0 place-items-center rounded-lg bg-ink text-sm font-extrabold text-brand">
          {item.rank}
        </span>
        <div className="min-w-0">
          <h3 className="mb-[7px] text-[15.5px] font-semibold leading-[1.35] tracking-[-0.01em]">
            {item.headline}
          </h3>
          <div className="flex flex-wrap gap-[6px]">
            {cluster && <span className={CHIP.default}>{cluster.label}</span>}
            {cluster && <span className={CHIP[sev.cls]}>{sev.label}</span>}
          </div>
        </div>
      </div>

      <p className="my-2.5 text-[13.5px] leading-[1.6] text-ink-soft">{item.why_now}</p>

      <div className="mb-3 flex items-baseline gap-2 rounded-[10px] border border-dashed border-line bg-paper px-3 py-2.5 text-[13px]">
        <span className="shrink-0 rounded-[5px] bg-brand px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.05em] text-ink">
          Next step
        </span>
        <span>{item.suggested_action}</span>
      </div>

      {item.draft_reply && <DraftReply key={item.rank + item.cluster_id} draft={item.draft_reply} />}

      {stripBits.length > 0 && (
        <div className="-mx-[18px] mt-3.5 bg-cream-deep px-[18px] py-[9px] text-center text-xs font-semibold tracking-[0.01em] text-ink-soft">
          {stripBits.join('  ·  ')}
        </div>
      )}
    </article>
  )
}
