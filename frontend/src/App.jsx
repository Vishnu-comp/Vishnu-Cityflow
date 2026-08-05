import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from './api.js'
import { BTN_PRIMARY } from './format.js'
import AttentionCard from './components/AttentionCard.jsx'
import ClusterBar from './components/ClusterBar.jsx'
import FeedbackList from './components/FeedbackList.jsx'

const SKELETON = 'mb-4 h-[130px] animate-pulse rounded-2xl bg-cream'

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
      <span className="rounded-md bg-brand px-[11px] py-[5px] text-[11.5px] font-bold text-ink">
        LLM triage{run.model ? ` · ${run.model}` : ''}
      </span>
    ) : (
      <span
        className="rounded-md border border-line bg-white px-[11px] py-[5px] text-[11.5px] font-bold text-ink-soft"
        title={run.note}
      >
        Heuristic mode
      </span>
    )
  ) : null

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b-[3px] border-brand bg-white px-7 py-3.5 max-[920px]:px-4">
        <div className="flex min-w-0 items-baseline gap-3">
          <span className="text-[21px] font-extrabold tracking-[-0.04em] text-ink">
            cityflo<span className="text-brand">.</span>
          </span>
          <span className="text-[12.5px] font-semibold tracking-[0.02em] text-muted">
            ops · morning triage
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {providerBadge}
          <button className={BTN_PRIMARY} onClick={runTriage} disabled={triaging || loading}>
            {triaging ? 'Triaging…' : run ? 'Re-run triage' : 'Run triage'}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1180px] px-7 pb-1.5 pt-[34px] max-[920px]:px-4 max-[920px]:pt-[22px]">
        <h1 className="m-0 font-display text-[clamp(30px,4.5vw,44px)] font-black leading-[1.05] tracking-[-0.01em]">
          Morning triage
        </h1>
        <p className="mb-0 mt-2 max-w-[640px] text-[15px] leading-relaxed text-muted">
          {messages.length} rider messages from the last 48 hours — clustered and ranked, with the
          2–3 things that actually need attention before standup.
        </p>
      </div>

      {run?.note && (
        <div className="mx-auto mt-3.5 max-w-[1180px] rounded-2xl border border-brand-line bg-brand-soft px-4 py-2.5 text-[13px] font-medium text-[#7a6400]">
          {run.note}
        </div>
      )}
      {error && (
        <div className="mx-auto mt-3.5 max-w-[1180px] rounded-2xl border border-[#efd2d0] bg-danger-bg px-4 py-2.5 text-[13px] font-medium text-danger">
          {error}
        </div>
      )}

      <main className="mx-auto grid max-w-[1180px] grid-cols-1 items-start gap-[26px] px-7 pb-[60px] pt-[22px] min-[921px]:grid-cols-[5fr_7fr] max-[920px]:px-4 max-[920px]:pb-[50px] max-[920px]:pt-3.5">
        <section aria-label="Needs attention">
          <h2 className="mb-3 mt-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-ink-soft">
            <span className="inline-block size-2 rounded-full bg-danger" /> Needs attention today
          </h2>

          {triaging && (
            <>
              <div className={SKELETON} />
              <div className={SKELETON} />
              <div className={SKELETON} />
            </>
          )}

          {!triaging && !run && !loading && (
            <div className="rounded-2xl border-2 border-dashed border-line bg-white px-6 py-8 text-center text-sm text-muted">
              <p className="m-0">
                No triage yet. Hit <b>Run triage</b> to cluster this batch and draft replies.
              </p>
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

          <aside className="mt-1 rounded-2xl border border-brand-line bg-[#fffdf0] px-4 py-3.5">
            <h4 className="mb-1.5 font-display text-[13px] font-bold">
              Today's memo — docs/memo.md
            </h4>
            <p className="m-0 text-[12.5px] leading-relaxed text-ink-soft">
              <b>User:</b> the daily pass commuter. <b>Problem:</b> pickup reliability — buses
              leaving early, fictional ETAs. <b>Cut:</b> new routes, pricing, pet policy — not a
              today problem.
            </p>
          </aside>
        </section>

        <section aria-label="All feedback">
          <h2 className="mb-3 mt-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-ink-soft">
            All feedback
          </h2>
          {clusters.length > 0 && (
            <ClusterBar clusters={clusters} selected={filter} onSelect={setFilter} />
          )}
          {loading ? (
            <div className={`${SKELETON} h-[320px]`} />
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
