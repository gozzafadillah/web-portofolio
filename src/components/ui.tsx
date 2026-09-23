import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react'

/* Reveal-on-scroll with a 3-beat entrance (opacity + translateY + blur).
   Stagger via `delay`. Respects reduced-motion through CSS. */
export function Reveal({
  children,
  delay = 0,
  className = '',
  as: Tag = 'div',
}: {
  children: ReactNode
  delay?: number
  className?: string
  as?: ElementType
}) {
  const ref = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          io.unobserve(entry.target)
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const Comp = Tag as ElementType
  return (
    <Comp
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}
    >
      {children}
    </Comp>
  )
}

/* Terminal window chrome — the container language of the whole surface. */
export function TermWindow({
  title,
  children,
  className = '',
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`overflow-hidden rounded-lg border border-[var(--border)] bg-[hsl(var(--color-surface))] shadow-[0_0_0_1px_rgba(0,0,0,0.4),0_18px_50px_-24px_rgba(51,255,143,0.25)] ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[hsl(var(--color-surface-2))] px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
        <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
        <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
        <span className="mono ml-3 truncate text-xs text-[var(--muted)]">{title}</span>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  )
}

/* Section heading rendered as a shell command. */
export function CmdHeading({ cmd }: { cmd: string }) {
  return (
    <h2 className="mb-6 flex flex-wrap items-center gap-2">
      <span className="prompt select-none">
        <span className="at">fadillah</span>
        <span className="text-[var(--muted)]">@</span>
        <span className="path">arch</span>
        <span className="text-[var(--muted)]">:~$</span>
      </span>
      <span className="text-[var(--fg)]">{cmd}</span>
    </h2>
  )
}
