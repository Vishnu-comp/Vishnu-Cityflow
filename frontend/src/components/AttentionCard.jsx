import { SEVERITY } from '../format.js'
import DraftReply from './DraftReply.jsx'

export default function AttentionCard({ item, cluster, active, onSelect }) {
  const sev = SEVERITY[cluster?.severity ?? 3]
  return (
    <article
      className={`attention-card ${active ? 'active' : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
    >
      <div className="attention-top">
        <span className="rank">{item.rank}</span>
        <div className="attention-heading">
          <h3>{item.headline}</h3>
          <div className="chips">
            {cluster && <span className="chip">{cluster.label}</span>}
            {cluster && <span className={`chip ${sev.cls}`}>{sev.label}</span>}
            {cluster && <span className="chip subtle">{cluster.count} msgs</span>}
          </div>
        </div>
      </div>

      <p className="why">{item.why_now}</p>

      <div className="action-row">
        <span className="action-tag">Next step</span>
        <span>{item.suggested_action}</span>
      </div>

      {item.draft_reply && <DraftReply key={item.rank + item.cluster_id} draft={item.draft_reply} />}
    </article>
  )
}
