const PILL =
  'cursor-pointer rounded-full border bg-cream px-3.5 py-[7px] text-[12.5px] font-semibold transition'

export default function ClusterBar({ clusters, selected, onSelect }) {
  const total = clusters.reduce((n, c) => n + c.count, 0)

  const pill = (on) =>
    `${PILL} ${on ? 'border-ink bg-white text-ink' : 'border-transparent text-ink hover:border-[#cfc9b4]'}`
  const count = (on) => `ml-0.5 font-bold ${on ? 'text-ink' : 'text-muted'}`

  return (
    <div className="mb-3.5 flex flex-wrap gap-2" role="tablist" aria-label="Filter by cluster">
      <button className={pill(selected === 'all')} onClick={() => onSelect('all')}>
        All <b className={count(selected === 'all')}>{total}</b>
      </button>
      {clusters.map((c) => {
        const on = selected === c.id
        return (
          <button
            key={c.id}
            className={pill(on)}
            onClick={() => onSelect(on ? 'all' : c.id)}
          >
            {c.label} <b className={count(on)}>{c.count}</b>
          </button>
        )
      })}
    </div>
  )
}
