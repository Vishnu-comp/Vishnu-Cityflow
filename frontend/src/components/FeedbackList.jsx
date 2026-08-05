import { SOURCE_ICONS, timeAgo } from '../format.js'

export default function FeedbackList({ messages, clusterOf, flagged, highlightCluster }) {
  return (
    <ul className="feed">
      {messages.map((m) => {
        const cluster = clusterOf.get(m.message_id)
        const isFlagged = flagged.includes(m.message_id)
        const dimmed = highlightCluster && cluster?.id !== highlightCluster && !isFlagged
        return (
          <li key={m.message_id} className={`feed-row ${dimmed ? 'dimmed' : ''}`}>
            <div className="feed-meta">
              <span className="feed-id">{m.message_id}</span>
              <span className="feed-src" title={m.source}>
                {SOURCE_ICONS[m.source] ?? '•'}
              </span>
              <span className="muted">{m.rider}</span>
              <span className="muted hide-sm">{m.route}</span>
              <span className="muted">{timeAgo(m.ts)}</span>
            </div>
            <p className="feed-body">{m.body}</p>
            <div className="feed-tags">
              {isFlagged && (
                <span className="chip danger" title="This message tries to hijack the AI. It was treated as data, not instructions.">
                  ⚠ prompt-injection attempt — ignored, treated as data
                </span>
              )}
              {cluster && <span className="chip subtle">{cluster.label}</span>}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
