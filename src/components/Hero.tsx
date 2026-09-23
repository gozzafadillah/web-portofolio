import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { TermWindow, Reveal } from './ui'
import {
  execPacman,
  handleCommand,
  SUDO_PASSWORD,
  typeLen,
  type Line,
  type Tone,
} from './cliEngine'

function Prompt() {
  return (
    <span className="prompt select-none">
      <span className="at">fadillah</span>
      <span className="text-[var(--muted)]">@</span>
      <span className="path">arch</span>
      <span className="text-[var(--muted)]">:~$</span>
    </span>
  )
}

const toneClass = (t?: Tone) =>
  t === 'accent' ? 'text-[var(--accent)]' : t === 'fg' ? 'text-[var(--fg)]' : 'text-[var(--muted)]'

function LineRow({ line, partial, caret }: { line: Line; partial?: number; caret?: boolean }) {
  const cut = (s: string) => (partial != null ? s.slice(0, partial) : s)
  const C = caret ? <span className="caret" aria-hidden="true" /> : null

  switch (line.kind) {
    case 'cmd':
      return (
        <div className="flex flex-wrap gap-x-2">
          <Prompt />
          <span className="text-[var(--fg)]">{line.text}</span>
        </div>
      )
    case 'out':
      return (
        <p className={`whitespace-pre-wrap ${toneClass(line.tone)}`}>
          {cut(line.text)}
          {C}
        </p>
      )
    case 'err':
      return (
        <p className="whitespace-pre-wrap text-[#ff7b72]">
          {cut(line.text)}
          {C}
        </p>
      )
    case 'pre':
      return (
        <pre className={`whitespace-pre-wrap ${toneClass(line.tone)}`}>
          {cut(line.text)}
          {C}
        </pre>
      )
    case 'link':
      return (
        <p className="text-[var(--muted)]">
          <span className="text-[var(--accent)]">→ </span>
          <a
            href={line.href}
            target="_blank"
            rel="noopener noreferrer"
            download={line.download || undefined}
            className="text-[var(--color-cyan)] underline decoration-dotted underline-offset-4 transition hover:text-[var(--accent)]"
          >
            {line.label}
          </a>
          {line.note ? <span className="ml-2 text-xs">({line.note})</span> : null}
          {C}
        </p>
      )
    case 'hero':
      return (
        <div className="py-1">
          <h1 className="mb-1">{line.name}</h1>
          <p className="mono text-sm text-[var(--muted)] sm:text-base">{line.sub}</p>
          {C}
        </div>
      )
  }
}

function SudoHint() {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label="Tampilkan petunjuk password sudo"
        className="ml-1 rounded border border-[var(--border)] px-1.5 text-xs text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
      >
        ?
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-0 z-10 mb-2 w-max max-w-[16rem] rounded border border-[var(--border)] bg-[hsl(var(--color-surface-2))] px-3 py-2 text-xs text-[var(--muted)] opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        password: <span className="mono text-[var(--accent)]">fadillah</span> — santai, ini cuma
        porto web, bukan beneran :D
      </span>
    </span>
  )
}

const BOOT_LOG: Line[] = [
  { kind: 'cmd', text: './whoami' },
  { kind: 'hero', name: 'Muhammad Fadillah Abdul Aziz', sub: 'Backend Developer · Cimahi Utara, Kota Cimahi' },
  { kind: 'out', text: 'ketik help (atau -h) untuk lihat command. coba: cat about.md', tone: 'muted' },
]

const COMMANDS = [
  'help',
  'cat about.md',
  'cat skills.txt',
  './experience --list',
  'ls projects/',
  'cat education.txt',
  './contact',
  'sudo pacman cv',
  'sudo pacman social-media -t instagram',
  'sudo pacman social-media -t linkedin',
  'sudo pacman latest-career',
  'sudo pacman -h',
  'clear',
]

const SUDO_TTL = 30_000

export default function Hero({ active = true }: { active?: boolean }) {
  const [log, setLog] = useState<Line[]>(BOOT_LOG)
  const [batch, setBatch] = useState<Line[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [shown, setShown] = useState(0)
  const [mode, setMode] = useState<'cmd' | 'sudo'>('cmd')
  const [pending, setPending] = useState<string | null>(null)
  const [tries, setTries] = useState(0)
  const [value, setValue] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [histPos, setHistPos] = useState(0)
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [suggestIdx, setSuggestIdx] = useState(0)
  const [kb, setKb] = useState(0)
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches
  )

  const logRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const sudoTsRef = useRef(0)

  const isTyping = batch.length > 0 && activeIdx < batch.length

  const q = value.trim()
  const matches = q && mode === 'cmd' ? COMMANDS.filter((c) => c.toLowerCase().startsWith(q.toLowerCase())) : []
  const showSuggest = mode === 'cmd' && suggestOpen && matches.length > 0 && !matches.includes(q)
  const selIdx = matches.length ? Math.min(suggestIdx, matches.length - 1) : 0

  // Track viewport class (desktop vs mobile) for the two layouts.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const on = () => setIsDesktop(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  // Track on-screen keyboard height (mobile) so the prompt stays above it.
  useEffect(() => {
    const vv = window.visualViewport
    const on = () => setKb(Math.max(0, window.innerHeight - (vv?.height ?? window.innerHeight) - (vv?.offsetTop ?? 0)))
    on()
    vv?.addEventListener('resize', on)
    vv?.addEventListener('scroll', on)
    return () => {
      vv?.removeEventListener('resize', on)
      vv?.removeEventListener('scroll', on)
    }
  }, [])

  useEffect(() => {
    if (batch.length > 0 && activeIdx >= batch.length) {
      setLog((l) => [...l, ...batch])
      setBatch([])
      setActiveIdx(0)
      setShown(0)
    }
  }, [activeIdx, batch])

  useEffect(() => {
    if (batch.length === 0 || activeIdx >= batch.length) return
    const cur = batch[activeIdx]
    const len = typeLen(cur)
    if (len === 0) {
      setShown(0)
      const t = window.setTimeout(() => setActiveIdx((i) => i + 1), 45)
      return () => window.clearTimeout(t)
    }
    let n = 0
    setShown(0)
    const dur = Math.min(Math.max(len * 5, 120), 900)
    const step = Math.max(1, Math.ceil((len * 20) / dur))
    const iv = window.setInterval(() => {
      n += step
      if (n >= len) {
        setShown(len)
        window.clearInterval(iv)
        setActiveIdx((i) => i + 1)
      } else {
        setShown(n)
      }
    }, 20)
    return () => window.clearInterval(iv)
  }, [activeIdx, batch])

  useEffect(() => {
    if (!isTyping) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault()
        setActiveIdx(batch.length)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isTyping, batch.length])

  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [log, batch, activeIdx, shown])

  useEffect(() => {
    if (active && !isTyping) inputRef.current?.focus()
  }, [active, isTyping, mode, isDesktop])

  const focus = () => inputRef.current?.focus()
  const onShellClick = (e: { target: EventTarget | null }) => {
    if (isTyping) {
      setActiveIdx(batch.length)
      return
    }
    const t = e.target as HTMLElement | null
    if (t && t.closest('a, button')) return
    const sel = window.getSelection()
    if (sel && sel.toString().length > 0) return
    focus()
  }

  function accept(cmd: string) {
    setValue(cmd)
    setSuggestOpen(false)
    setSuggestIdx(0)
    focus()
  }

  function tabComplete() {
    if (matches.length === 0) return
    if (matches.length === 1) {
      accept(matches[0])
      return
    }
    let prefix = matches[0]
    for (const m of matches) {
      while (!m.toLowerCase().startsWith(prefix.toLowerCase())) prefix = prefix.slice(0, -1)
    }
    if (prefix.length > q.length) setValue(prefix)
    setSuggestOpen(true)
    setSuggestIdx(0)
  }

  function onKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Tab') {
      e.preventDefault()
      if (mode === 'cmd') tabComplete()
      return
    }
    if (mode !== 'cmd') return

    if (showSuggest) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSuggestIdx((selIdx + 1) % matches.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSuggestIdx((selIdx - 1 + matches.length) % matches.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        accept(matches[selIdx])
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setSuggestOpen(false)
      }
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (histPos > 0) {
        const p = histPos - 1
        setValue(history[p])
        setHistPos(p)
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (histPos < history.length) {
        const p = histPos + 1
        setValue(p === history.length ? '' : history[p])
        setHistPos(p)
      }
    }
  }

  function startOutput(out: Line[]) {
    if (out.length === 0) return
    setBatch(out)
    setActiveIdx(0)
    setShown(0)
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    const raw = value
    setValue('')
    setSuggestOpen(false)
    setSuggestIdx(0)

    if (mode === 'sudo') {
      setLog((l) => [...l, { kind: 'out', text: '[sudo] password for fadillah: •••••••' }])
      if (raw === SUDO_PASSWORD) {
        sudoTsRef.current = Date.now()
        startOutput(pending ? execPacman(pending) : [])
        setMode('cmd')
        setPending(null)
        setTries(0)
      } else {
        const t = tries + 1
        setTries(t)
        if (t >= 3) {
          setLog((l) => [...l, { kind: 'err', text: 'sudo: 3 incorrect password attempts' }])
          setMode('cmd')
          setPending(null)
          setTries(0)
        } else {
          setLog((l) => [...l, { kind: 'err', text: 'Sorry, try again.' }])
        }
      }
      return
    }

    const trimmed = raw.trim()
    if (trimmed) {
      const nh = [...history, trimmed]
      setHistory(nh)
      setHistPos(nh.length)
    }

    const echo: Line = { kind: 'cmd', text: raw }
    const { lines, pendingSudo, clear } = handleCommand(raw)

    if (clear) {
      setLog([])
      setBatch([])
      setActiveIdx(0)
      setShown(0)
      return
    }
    setLog((l) => [...l, echo])
    if (pendingSudo) {
      if (Date.now() - sudoTsRef.current < SUDO_TTL) {
        startOutput(execPacman(pendingSudo))
      } else {
        setMode('sudo')
        setPending(pendingSudo)
        setTries(0)
      }
      return
    }
    startOutput(lines)
  }

  /* ── shared render pieces ── */
  const logLines = (
    <>
      {log.map((line, i) => (
        <LineRow key={`l${i}`} line={line} />
      ))}
      {batch.slice(0, Math.min(activeIdx + 1, batch.length)).map((line, i) => {
        const activeLine = i === activeIdx && activeIdx < batch.length
        const len = typeLen(line)
        const partial = activeLine && len > 0 ? shown : undefined
        return <LineRow key={`b${i}`} line={line} partial={partial} caret={activeLine} />
      })}
    </>
  )

  const typingHint = (
    <p className="mono text-xs text-[var(--muted)]">
      <span className="text-[var(--accent)]">»</span> mengetik… [ enter ] tampilkan seketika
    </p>
  )

  const formUI = (
    <form onSubmit={submit} className="mt-1 flex flex-wrap items-baseline gap-x-2">
      {mode === 'sudo' ? (
        <>
          <span className="text-[var(--muted)]">[sudo] password for fadillah:</span>
          <SudoHint />
        </>
      ) : (
        <Prompt />
      )}
      <span className="relative min-w-0 flex-1">
        <span className="break-words whitespace-pre-wrap text-[var(--accent)]">
          {mode === 'sudo' ? '' : value}
        </span>
        <span className="caret" aria-hidden="true" />
        <input
          ref={inputRef}
          type={mode === 'sudo' ? 'password' : 'text'}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setHistPos(history.length)
            setSuggestOpen(true)
            setSuggestIdx(0)
          }}
          onKeyDown={onKeyDown}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          enterKeyHint="go"
          aria-label={mode === 'sudo' ? 'Sudo password' : 'Terminal command'}
          className="cli-input absolute inset-0 h-full w-full text-base text-transparent caret-transparent"
        />
      </span>
    </form>
  )

  const suggestUI = (cls: string) => (
    <ul role="listbox" aria-label="Command suggestions" className={cls}>
      {matches.slice(0, 8).map((m, i) => (
        <li
          key={m}
          role="option"
          aria-selected={i === selIdx}
          onPointerDown={(ev) => {
            ev.preventDefault()
            accept(m)
          }}
          className={`cursor-pointer rounded px-2 py-2 sm:py-1 ${
            i === selIdx
              ? 'bg-[hsl(var(--color-accent)/0.12)] text-[var(--accent)]'
              : 'text-[var(--muted)] hover:bg-[hsl(var(--color-accent)/0.06)]'
          }`}
        >
          <span className="mono">{i === selIdx ? '▸ ' : '  '}</span>
          {m}
        </li>
      ))}
      {matches.length > 8 && (
        <li className="px-2 text-xs text-[var(--muted)]">… {matches.length - 8} lagi</li>
      )}
      <li className="mono px-2 pt-1 text-[10px] text-[var(--muted)]">
        ↑↓ / ketuk untuk pilih · Enter · Esc
      </li>
    </ul>
  )

  /* ── desktop: classic single scroll, prompt + suggestions inline ── */
  const desktop = (
    <section id="hero" className="flex min-h-[100svh] items-center justify-center px-4 py-8">
      <Reveal className="w-full max-w-4xl">
        <TermWindow title="fadillah@arch: ~/portfolio — zsh">
          <div
            ref={logRef}
            onClick={onShellClick}
            className="max-h-[72vh] cursor-text overflow-y-auto text-sm leading-relaxed sm:text-base"
            role="log"
            aria-live="polite"
            aria-label="Terminal output"
          >
            {logLines}
            {isTyping ? typingHint : formUI}
            {!isTyping && showSuggest && suggestUI('mt-2 max-h-44 overflow-y-auto border-t border-[var(--border)] pt-1')}
          </div>
        </TermWindow>
      </Reveal>
    </section>
  )

  /* ── mobile: log scrolls, prompt + suggestions pinned above the keyboard ── */
  const mobile = (
    <section
      id="hero"
      className="flex min-h-[100svh] items-center justify-center px-4 py-6"
      style={{ paddingBottom: `calc(1.5rem + ${kb}px)` }}
    >
      <Reveal className="w-full max-w-4xl">
        <TermWindow title="fadillah@arch: ~/portfolio — zsh">
          <div className="flex flex-col" style={{ height: 'min(68svh, 560px)' }}>
            <div
              ref={logRef}
              onClick={onShellClick}
              className="min-h-0 flex-1 cursor-text overflow-y-auto text-sm leading-relaxed sm:text-base"
              role="log"
              aria-live="polite"
              aria-label="Terminal output"
            >
              {logLines}
            </div>
            <div className="mt-3 shrink-0 border-t border-[var(--border)] pt-3">
              {showSuggest && suggestUI('mb-2 max-h-44 overflow-y-auto')}
              {isTyping ? <div className="py-2">{typingHint}</div> : formUI}
            </div>
          </div>
        </TermWindow>
      </Reveal>
    </section>
  )

  return isDesktop ? desktop : mobile
}
