async function request(path, options) {
  const res = await fetch(path, options)
  if (res.status === 404) return null
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `Request failed (${res.status})`)
  }
  return res.json()
}

export const api = {
  feedback: () => request('/api/feedback/'),
  latestTriage: () => request('/api/triage/latest/'),
  runTriage: () => request('/api/triage/run/', { method: 'POST' }),
}
