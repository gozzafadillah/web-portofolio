import { useEffect, useRef, useState } from 'react'

type Kind = 'ok' | 'kernel' | 'dim' | 'accent' | 'text' | 'blank'
type BootLine = { text: string; kind?: Kind; delay?: number }

const LINES: BootLine[] = [
  { kind: 'kernel', text: 'fadillah@arch kernel: Linux version 6.9.3-arch1-1 (linux-hardened)', delay: 120 },
  { kind: 'kernel', text: '[    0.000000] Command line: BOOT_IMAGE=/vmlinuz-linux root=/dev/nvme0n1p2 rw quiet', delay: 120 },
  { kind: 'kernel', text: '[    0.412399] nvme nvme0: allocated 8 GiB host memory buffer', delay: 110 },
  { kind: 'blank', text: '' },
  { kind: 'ok', text: 'Mounted /boot.', delay: 80 },
  { kind: 'ok', text: 'Started Journal Service.', delay: 70 },
  { kind: 'ok', text: 'Reached target Local File Systems.', delay: 70 },
  { kind: 'ok', text: 'Started D-Bus System Message Bus.', delay: 70 },
  { kind: 'ok', text: 'Started Network Manager.', delay: 80 },
  { kind: 'ok', text: 'Started OpenSSH server daemon.', delay: 70 },
  { kind: 'ok', text: 'Started Docker Application Container Engine.', delay: 90 },
  { kind: 'ok', text: 'Started PostgreSQL Database Server.', delay: 80 },
  { kind: 'ok', text: 'Started Mosquitto MQTT Broker.', delay: 70 },
  { kind: 'ok', text: 'Started Portfolio Daemon.', delay: 90 },
  { kind: 'ok', text: 'Reached target Multi-User System.', delay: 80 },
  { kind: 'ok', text: 'Reached target Graphical Interface.', delay: 120 },
  { kind: 'blank', text: '' },
  { kind: 'dim', text: 'archlinux 6.9.3-arch1-1 (tty1)', delay: 140 },
  { kind: 'text', text: 'fadillah@arch login: fadillah', delay: 260 },
  { kind: 'dim', text: 'password: •••••••', delay: 320 },
  { kind: 'dim', text: 'Last login: Wed Sep 23 10:24:07 on tty1', delay: 200 },
  { kind: 'blank', text: '' },
  { kind: 'accent', text: 'fadillah@arch:~$ ./start-portfolio --load', delay: 320 },
  { kind: 'dim', text: '> booting interface', delay: 420 },
]

export default function BootScreen({ onDone }: { onDone: () => void }) {
  const [shown, setShown] = useState(0)
  const [exiting, setExiting] = useState(false)
  const doneRef = useRef(false)
  const logRef = useRef<HTMLDivElement>(null)

  const finish = () => {
    if (doneRef.current) return
    doneRef.current = true
    setExiting(true)
    window.setTimeout(onDone, 500)
  }

  // Reduced motion: no theater, straight to the site.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      doneRef.current = true
      onDone()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reveal lines on a timeline, then finish.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let i = 0
    let timer: number
    const step = () => {
      if (i >= LINES.length) {
        timer = window.setTimeout(finish, 650)
        return
      }
      i++
      setShown(i)
      timer = window.setTimeout(step, LINES[i - 1].delay ?? 90)
    }
    timer = window.setTimeout(step, 180)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Esc (or any key) and any click skip the boot.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') finish()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [shown])

  return (
    <div
      onClick={finish}
      aria-hidden="true"
      className={`fixed inset-0 z-[1000] cursor-pointer overflow-hidden bg-[hsl(var(--color-bg))] px-4 py-6 transition-opacity duration-500 sm:px-8 ${
        exiting ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        ref={logRef}
        className="mx-auto max-w-4xl overflow-y-auto text-xs leading-relaxed sm:text-sm"
      >
        {LINES.slice(0, shown).map((line, i) => (
          <BootRow key={i} line={line} last={i === LINES.length - 1} />
        ))}
      </div>

      <button
        type="button"
        onClick={finish}
        tabIndex={-1}
        className="mono fixed bottom-5 right-5 rounded border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
      >
        [ esc ] skip
      </button>
    </div>
  )
}

function BootRow({ line, last }: { line: BootLine; last: boolean }) {
  if (line.kind === 'blank') return <div className="h-3" />

  if (line.kind === 'ok') {
    return (
      <p className="flex gap-2 text-[var(--muted)]">
        <span className="text-[var(--accent)]">[&nbsp;&nbsp;OK&nbsp;&nbsp;]</span>
        <span>{line.text}</span>
      </p>
    )
  }

  const color =
    line.kind === 'accent'
      ? 'text-[var(--accent)]'
      : line.kind === 'kernel' || line.kind === 'dim'
        ? 'text-[var(--muted)]'
        : 'text-[var(--fg)]'

  return (
    <p className={color}>
      {line.text}
      {last ? <span className="caret" /> : null}
    </p>
  )
}
