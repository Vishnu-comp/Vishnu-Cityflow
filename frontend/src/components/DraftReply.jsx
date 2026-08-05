import { useState } from 'react'
import { BTN_GHOST } from '../format.js'

/**
 * LLM drafts the reply; the human approves/edits/sends.
 * Deliberately a textarea, not a send button — keeping the human in the loop.
 */
export default function DraftReply({ draft }) {
  const [text, setText] = useState(draft)
  const [dirty, setDirty] = useState(false)
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked in some iframes — textarea is selectable anyway */
    }
  }

  return (
    <div data-tour="draft" className="mt-1.5 overflow-hidden rounded-xl border border-line bg-[#fefefa]">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line bg-cream px-3 py-2 text-xs font-semibold text-ink-soft">
        <span>✨ AI draft reply</span>
        <span className="text-[11px] font-medium text-muted">
          review &amp; edit before sending — never auto-sent
        </span>
      </div>
      <textarea
        className="min-h-[120px] w-full resize-y bg-transparent p-3 text-[13px] leading-[1.6] text-ink outline-none"
        value={text}
        rows={7}
        onChange={(e) => {
          setText(e.target.value)
          setDirty(true)
        }}
      />
      <div className="flex items-center justify-between border-t border-line px-3 py-[7px] text-xs">
        <span className="text-muted">
          {text.length} chars {dirty && '· edited'}
        </span>
        <button className={BTN_GHOST} onClick={copy}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
    </div>
  )
}
