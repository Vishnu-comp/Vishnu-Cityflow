export function timeAgo(iso) {
  const then = new Date(iso).getTime()
  const mins = Math.max(1, Math.round((Date.now() - then) / 60000))
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export const SOURCE_ICONS = {
  app_chat: '💬',
  email: '✉️',
  playstore: '★',
  twitter: '𝕏',
}

export const SEVERITY = {
  5: { label: 'Critical', cls: 'sev-5' },
  4: { label: 'High', cls: 'sev-4' },
  3: { label: 'Medium', cls: 'sev-3' },
  2: { label: 'Low', cls: 'sev-2' },
  1: { label: 'Low', cls: 'sev-1' },
}
