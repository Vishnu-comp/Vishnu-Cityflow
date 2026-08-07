export function timeAgo(iso) {
  const then = new Date(iso).getTime()
  const mins = Math.max(1, Math.round((Date.now() - then) / 60000))
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export const SOURCE_LABELS = {
  app_chat: 'Chat',
  email: 'Mail',
  playstore: 'Store',
  twitter: 'X',
  // Cityflo's official feedback export channels
  app_feedback: 'In-app',
  support_chat: 'Support',
  play_store_review: 'Play Store',
  appstore_review: 'App Store',
}

// ---- shared Tailwind recipes (components stay terse, tokens come from styles.css) ----

export const BTN_PRIMARY =
  'rounded-full bg-ink px-[22px] py-2.5 text-[13.5px] font-semibold text-white transition ' +
  'hover:bg-[#2c2a20] active:scale-[0.97] disabled:opacity-50 disabled:cursor-default'

export const BTN_GHOST =
  'rounded-full border border-line bg-white px-3.5 py-1.5 text-[12.5px] font-semibold text-ink-soft ' +
  'transition hover:border-ink-soft active:scale-[0.97]'

const chipBase = 'inline-flex items-center rounded-full px-[11px] py-1 text-[11.5px] font-semibold'

export const CHIP = {
  default: `${chipBase} bg-cream text-ink-soft`,
  subtle: `${chipBase} border border-line bg-white text-muted`,
  danger: `${chipBase} bg-ink text-brand`,
  'sev-5': `${chipBase} bg-ink text-white`,   // Critical
  'sev-4': `${chipBase} bg-brand text-ink`,    // High
  'sev-3': `${chipBase} border border-line bg-cream text-ink`,
  'sev-2': `${chipBase} bg-cream text-muted`,
  'sev-1': `${chipBase} bg-cream text-muted`,
}

export const SEVERITY = {
  5: { label: 'Critical', cls: 'sev-5' },
  4: { label: 'High', cls: 'sev-4' },
  3: { label: 'Medium', cls: 'sev-3' },
  2: { label: 'Low', cls: 'sev-2' },
  1: { label: 'Low', cls: 'sev-1' },
}