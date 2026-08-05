export default function ClusterBar({ clusters, selected, onSelect }) {
  const total = clusters.reduce((n, c) => n + c.count, 0)
  return (
    <div className="cluster-bar" role="tablist" aria-label="Filter by cluster">
      <button
        className={`cluster-pill ${selected === 'all' ? 'on' : ''}`}
        onClick={() => onSelect('all')}
      >
        All <b>{total}</b>
      </button>
      {clusters.map((c) => (
        <button
          key={c.id}
          className={`cluster-pill ${selected === c.id ? 'on' : ''}`}
          onClick={() => onSelect(selected === c.id ? 'all' : c.id)}
        >
          {c.label} <b>{c.count}</b>
        </button>
      ))}
    </div>
  )
}
