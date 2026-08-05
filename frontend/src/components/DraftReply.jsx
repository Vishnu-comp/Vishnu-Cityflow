import { useState } from 'react'

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
    <div className="draft">
      <div className="draft-label">
        <span>✨ AI draft reply</span>
        <span className="draft-hint">review &amp; edit before sending — never auto-sent</span>
      </div>
      <textarea
        value={text}
        rows={7}
        onChange={(e) => {
          setText(e.target.value)
          setDirty(true)
        }}
      />
      <div className="draft-footer">
        <span className="muted">
          {text.length} chars {dirty && '· edited'}
        </span>
        <button className="btn ghost" onClick={copy}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
    </div>
  )
}
