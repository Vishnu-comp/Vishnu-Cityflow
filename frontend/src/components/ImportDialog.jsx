import { useEffect, useRef, useState } from 'react'
import { api } from '../api.js'
import { BTN_GHOST, BTN_PRIMARY } from '../format.js'

/**
 * Import a real feedback spreadsheet (paste CSV or pick a .csv file).
 * Importing REPLACES the current batch; the built-in sample is restorable
 * from the footer, so nothing is ever lost.
 */

const SAMPLE_CSV = `id,timestamp,source,rider,route,message
R-001,2026-08-14T07:41:00+05:30,app_chat,Asha N.,Andheri West → BKC,"Bus left 4 min early again, second time this week."
R-002,2026-08-14T07:55:00+05:30,email,Kunal D.,Thane → Powai,"Charged twice for the weekend pass, please refund one."
R-003,2026-08-14T08:02:00+05:30,playstore,Mehul S.,Vashi → Lower Parel,"App freezes when I open live tracking. iPhone 12."
`

export default function ImportDialog({ open, onClose, onDone }) {
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null) // {imported, dropped, warnings[], fromSample?}
  const fileRef = useRef(null)

  // fresh state every time the dialog opens; Esc closes
  useEffect(() => {
    if (!open) return
    setText('')
    setFileName('')
    setError(null)
    setResult(null)
    setBusy(false)
    document.body.style.overflow = 'hidden'
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  const pickFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      setText(String(reader.result || ''))
      setFileName(f.name)
    }
    reader.readAsText(f)
  }

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cityflo-feedback-sample.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const runImport = async () => {
    setBusy(true)
    setError(null)
    try {
      setResult(await api.importCsv(text))
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const restoreSample = async () => {
    setBusy(true)
    setError(null)
    try {
      setResult({ ...(await api.loadSample()), fromSample: true })
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Import a feedback batch">
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(23, 22, 15, 0.5)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
        }}
        onClick={onClose}
      />

      <div className="relative z-10 max-h-[86vh] w-full max-w-[580px] overflow-y-auto rounded-2xl border border-line bg-white p-5 shadow-[0_18px_60px_rgba(23,22,15,0.25)]">
        <button
          aria-label="Close"
          onClick={onClose}
          className="absolute right-4 top-3.5 text-xl leading-none text-muted hover:text-ink"
        >
          ×
        </button>

        {result ? (
          <>
            <h3 className="m-0 font-display text-lg font-bold">
              {result.fromSample ? 'Sample batch restored' : 'Batch imported'}
            </h3>
            <p className="mb-0 mt-2 text-[13.5px] leading-relaxed text-ink-soft">
              {result.fromSample
                ? `The built-in ${result.imported}-message sample is back.`
                : `${result.imported} messages imported${result.dropped ? ` · ${result.dropped} rows skipped` : ''}.`}
              {' '}Triage will re-run on the new batch when you close this.
            </p>
            {result.warnings?.length > 0 && (
              <div className="mt-3 rounded-xl border border-line bg-paper p-3">
                <p className="m-0 text-xs font-bold uppercase tracking-[0.06em] text-muted">
                  Fix-ups applied
                </p>
                <ul className="mb-0 mt-1.5 max-h-36 list-disc overflow-y-auto pl-5 text-xs leading-relaxed text-ink-soft">
                  {result.warnings.slice(0, 8).map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                  {result.warnings.length > 8 && (
                    <li>…and {result.warnings.length - 8} more</li>
                  )}
                </ul>
              </div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button className={BTN_GHOST} onClick={() => setResult(null)}>
                Import another
              </button>
              <button className={BTN_PRIMARY} onClick={() => onDone(result)}>
                Done
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="m-0 pr-6 font-display text-lg font-bold">Import a feedback batch</h3>
            <p className="mb-0 mt-1.5 text-[13px] leading-relaxed text-ink-soft">
              Bring the morning's real spreadsheet. Only a <b>message</b> column is required —
              headers like <i>id, timestamp, source, rider, route</i> (or aliases such as{' '}
              <i>name, date, comment</i>) fill in the rest. Importing replaces the current batch;
              the sample is always restorable below.
            </p>

            <div className="mt-3 rounded-xl border border-line bg-paper p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-[0.06em] text-muted">
                  Expected format
                </span>
                <button className={BTN_GHOST} onClick={downloadSample}>
                  ⬇ Download sample CSV
                </button>
              </div>
              <pre className="mb-0 mt-2 overflow-x-auto font-mono text-[10.5px] leading-relaxed text-ink-soft">
                {SAMPLE_CSV}
              </pre>
            </div>

            <textarea
              className="mt-3 min-h-[150px] w-full resize-y rounded-xl border border-line bg-[#fefefa] p-3 font-mono text-[11.5px] leading-relaxed text-ink outline-none focus:border-ink-soft"
              placeholder={'id,timestamp,source,rider,route,message\nR-001,2026-08-14T07:41:00+05:30,app_chat,Asha N.,Andheri West → BKC,"Bus left early again…"'}
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                setFileName('')
              }}
            />

            <div className="mt-2 flex items-center gap-2">
              <button className={BTN_GHOST} onClick={() => fileRef.current?.click()}>
                Choose .csv file…
              </button>
              {fileName && <span className="text-xs font-semibold text-ink-soft">{fileName}</span>}
              <input ref={fileRef} type="file" accept=".csv,text/csv,text/plain" className="hidden" onChange={pickFile} />
            </div>

            {error && <p className="mb-0 mt-3 text-[13px] font-medium text-danger">{error}</p>}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <button className={BTN_GHOST} onClick={restoreSample} disabled={busy} title="Bring back the built-in 30-message sample batch">
                ↺ Restore sample batch
              </button>
              <div className="flex gap-2">
                <button className={BTN_GHOST} onClick={onClose}>
                  Cancel
                </button>
                <button className={BTN_PRIMARY} onClick={runImport} disabled={busy || !text.trim()}>
                  {busy ? 'Importing…' : 'Import & replace batch'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
