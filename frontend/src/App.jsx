import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from './api.js'
import AttentionCard from './components/AttentionCard.jsx'
import ClusterBar from './components/ClusterBar.jsx'
import FeedbackList from './components/FeedbackList.jsx'

export default function App() {
  const [messages, setMessages] = useState([])
  const [run, setRun] = useState(null) // latest triage run
  const [loading, setLoading] = useState(true)
  const [triaging, setTriaging] = useState(false)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [focusCluster, setFocusCluster] = useState(null)

  useEffect(() => {
    Promise.all([api.feedback(), api.latestTriage()])
      .then(([feed, latest]) => {
        setMessages(feed?.messages ?? [])
        setRun(latest)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const runTriage = useCallback(async () => {
    setTriaging(true)
    setError(null)
    try {
      setRun(await api.runTriage())
    } catch (e) {
      setError(e.message)
    } finally {
      setTriaging(false)
    }
  }, [])

  const result = run?.result
  const clusters = result?.clusters ?? []
  const attention = result?.attention ?? []
  const flagged = result?.flagged_ids ?? []

  const clusterById = useMemo(() => new Map(clusters.map((c) => [c.id, c])), [clusters])
  const clusterOf = useMemo(() => {
    const map = new Map()
    for (const c of clusters) for (const id of c.message_ids) map.set(id, c)
    return map
  }, [clusters])

  const visible = useMemo(() => {
    if (filter === 'all') return messages
    return messages.filter((m) => clusterOf.get(m.message_id)?.id === filter)
  }, [messages, filter, clusterOf])

  const providerBadge = run ? (
    run.provider === 'openai' ? (
      <span className="provider ok">● LLM triage · {run.model}</span>
    ) : (
      <span className="provider warn" title={run.note}>
        ● Offline heuristic triage
      </span>
    )
  ) : null

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <span className="logo">C</span>
          <div>
            <h1>Morning triage</h1>
            <p className="subtitle">
              Rider feedback · last 48h · {messages.length} messages · standup in 15
            </p>
          </div>
        </div>
        <div className="topbar-right">
          {providerBadge}
          <button className="btn primary" onClick={runTriage} disabled={triaging || loading}>
            {triaging ? 'Triaging…' : run ? '↻ Re-run triage' : '▶ Run triage'}
          </button>
        </div>
      </header>

      {run?.note && <div className="banner">{run.note}</div>}
      {error && <div className="banner error">{error}</div>}

      <main className="layout">
        <section className="col-attention" aria-label="Needs attention">
          <h2 className="section-title">
            <span className="dot" /> Needs attention today
          </h2>

          {triaging && (
            <>
              <div className="skeleton-card" />
              <div className="skeleton-card" />
              <div className="skeleton-card" />
            </>
          )}

          {!triaging && !run && !loading && (
            <div className="empty">
              <p>No triage yet. Hit <b>Run triage</b> to cluster this batch and draft replies.</p>
            </div>
          )}

          {!triaging &&
            attention.map((item) => (
              <AttentionCard
                key={item.rank}
                item={item}
                cluster={clusterById.get(item.cluster_id)}
                active={focusCluster === item.cluster_id}
                onSelect={() =>
                  setFocusCluster((f) => (f === item.cluster_id ? null : item.cluster_id))
                }
              />
            ))}

          <aside className="memo-strip">
            <h4>📋 Today's memo (docs/memo.md)</h4>
            <p>
              <b>User:</b> the daily pass commuter. <b>Problem:</b> pickup reliability — buses
              leaving early, fictional ETAs. <b>Cut:</b> new routes, pricing, pet policy — not a
              today problem.
            </p>
          </aside>
        </section>

        <section className="col-feed" aria-label="All feedback">
          <h2 className="section-title">Inbox</h2>
          {clusters.length > 0 && (
            <ClusterBar clusters={clusters} selected={filter} onSelect={setFilter} />
          )}
          {loading ? (
            <div className="skeleton-card tall" />
          ) : (
            <FeedbackList
              messages={visible}
              clusterOf={clusterOf}
              flagged={flagged}
              highlightCluster={focusCluster}
            />
          )}
        </section>
      </main>
    </div>
  )
}
