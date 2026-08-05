async function request(path, options) {
  const res = await fetch(path, options)
  if (res.status === 404) return null
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `Request failed (${res.status})`)
  }
  return res.json()
}

const postJson = (path, payload) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload ?? {}),
})

export const api = {
  feedback: () => request('/api/feedback/'),
  latestTriage: () => request('/api/triage/latest/'),
  runTriage: () => request('/api/triage/run/', { method: 'POST' }),
  importCsv: (csv) => request('/api/feedback/import/', postJson({ csv })),
  loadSample: () => request('/api/feedback/load-sample/', postJson()),
}
