import { useCallback, useEffect, useRef, useState } from 'react'

export type SnakeMode = 'walls' | 'nowalls'
type Pt = { x: number; y: number }

const COLS = 20
const ROWS = 20
const CELL = 20
const SIZE = COLS * CELL // 400

const C = {
  bg: '#0d1117',
  grid: '#161b22',
  snake: '#34d399',
  head: '#6ee7b7',
  food: '#fbbf24',
}

const highKey = (m: SnakeMode) => `snake-high-${m}`
const getHigh = (m: SnakeMode) => Number(localStorage.getItem(highKey(m)) || 0)
const saveHigh = (m: SnakeMode, s: number) => localStorage.setItem(highKey(m), String(s))

export default function SnakeGame({
  mode,
  onExit,
}: {
  mode: SnakeMode
  onExit: (score: number, high: number, mode: SnakeMode) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const snakeRef = useRef<Pt[]>([])
  const foodRef = useRef<Pt>({ x: 12, y: 12 })
  const dirRef = useRef<Pt>({ x: 1, y: 0 })
  const nextDirRef = useRef<Pt>({ x: 1, y: 0 })
  const scoreRef = useRef(0)
  const speedRef = useRef(150)
  const loopRef = useRef(0)
  const deadRef = useRef(false)
  const touchRef = useRef<Pt | null>(null)

  const [score, setScore] = useState(0)
  const [high, setHigh] = useState(() => getHigh(mode))
  const [gameOver, setGameOver] = useState(false)

  const placeFood = useCallback(() => {
    let p: Pt
    do {
      p = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) }
    } while (snakeRef.current.some((s) => s.x === p.x && s.y === p.y))
    foodRef.current = p
  }, [])

  const draw = useCallback(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = C.bg
    ctx.fillRect(0, 0, SIZE, SIZE)
    ctx.strokeStyle = C.grid
    ctx.lineWidth = 1
    for (let i = 0; i <= COLS; i++) {
      ctx.beginPath()
      ctx.moveTo(i * CELL + 0.5, 0)
      ctx.lineTo(i * CELL + 0.5, SIZE)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i * CELL + 0.5)
      ctx.lineTo(SIZE, i * CELL + 0.5)
      ctx.stroke()
    }
    // food
    ctx.fillStyle = C.food
    ctx.beginPath()
    ctx.arc(
      foodRef.current.x * CELL + CELL / 2,
      foodRef.current.y * CELL + CELL / 2,
      CELL / 2 - 3,
      0,
      Math.PI * 2
    )
    ctx.fill()
    // snake
    snakeRef.current.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? C.head : C.snake
      ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2)
    })
  }, [])

  const gameOverNow = useCallback(() => {
    deadRef.current = true
    window.clearTimeout(loopRef.current)
    const s = scoreRef.current
    const h = Math.max(s, getHigh(mode))
    saveHigh(mode, h)
    setHigh(h)
    setGameOver(true)
  }, [mode])

  const step = useCallback(() => {
    if (deadRef.current) return
    const nd = nextDirRef.current
    const cd = dirRef.current
    if (!(nd.x === -cd.x && nd.y === -cd.y)) dirRef.current = nd
    const head = snakeRef.current[0]
    let nx = head.x + dirRef.current.x
    let ny = head.y + dirRef.current.y
    if (mode === 'nowalls') {
      nx = (nx + COLS) % COLS
      ny = (ny + ROWS) % ROWS
    } else if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) {
      gameOverNow()
      return
    }
    if (snakeRef.current.slice(0, -1).some((s) => s.x === nx && s.y === ny)) {
      gameOverNow()
      return
    }
    snakeRef.current.unshift({ x: nx, y: ny })
    if (nx === foodRef.current.x && ny === foodRef.current.y) {
      scoreRef.current += 1
      setScore(scoreRef.current)
      speedRef.current = Math.max(75, 150 - scoreRef.current * 4)
      placeFood()
    } else {
      snakeRef.current.pop()
    }
    draw()
  }, [mode, draw, placeFood, gameOverNow])

  const loop = useCallback(() => {
    if (deadRef.current) return
    step()
    if (!deadRef.current) loopRef.current = window.setTimeout(loop, speedRef.current)
  }, [step])

  const reset = useCallback(() => {
    const mid = { x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) }
    snakeRef.current = [mid, { x: mid.x - 1, y: mid.y }, { x: mid.x - 2, y: mid.y }]
    dirRef.current = { x: 1, y: 0 }
    nextDirRef.current = { x: 1, y: 0 }
    scoreRef.current = 0
    setScore(0)
    speedRef.current = 150
    deadRef.current = false
    setGameOver(false)
    placeFood()
    draw()
    window.clearTimeout(loopRef.current)
    loopRef.current = window.setTimeout(loop, speedRef.current)
  }, [placeFood, draw, loop])

  const setDir = useCallback((x: number, y: number) => {
    const cd = dirRef.current
    if (x === -cd.x && y === -cd.y) return
    nextDirRef.current = { x, y }
  }, [])

  const exit = useCallback(() => {
    const s = scoreRef.current
    const h = Math.max(s, getHigh(mode))
    saveHigh(mode, h)
    onExit(s, h, mode)
  }, [mode, onExit])

  // init + cleanup
  useEffect(() => {
    reset()
    return () => window.clearTimeout(loopRef.current)
  }, [reset])

  // keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key
      if (k === 'ArrowUp' || k === 'w' || k === 'W') {
        e.preventDefault()
        setDir(0, -1)
      } else if (k === 'ArrowDown' || k === 's' || k === 'S') {
        e.preventDefault()
        setDir(0, 1)
      } else if (k === 'ArrowLeft' || k === 'a' || k === 'A') {
        e.preventDefault()
        setDir(-1, 0)
      } else if (k === 'ArrowRight' || k === 'd' || k === 'D') {
        e.preventDefault()
        setDir(1, 0)
      } else if (k === 'Enter') {
        if (gameOver) reset()
      } else if (k === 'Escape') {
        exit()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [gameOver, setDir, reset, exit])

  // swipe (mobile)
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.changedTouches[0]
    touchRef.current = { x: t.clientX, y: t.clientY }
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchRef.current
    if (!start) return
    const t = e.changedTouches[0]
    const dx = t.clientX - start.x
    const dy = t.clientY - start.y
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return
    if (Math.abs(dx) > Math.abs(dy)) setDir(dx > 0 ? 1 : -1, 0)
    else setDir(0, dy > 0 ? 1 : -1)
  }

  return (
    <div className="flex w-full flex-col items-center gap-3 py-2">
      <div className="flex w-full max-w-[min(72vmin,420px)] items-center justify-between">
          <div className="mono text-xs text-[var(--muted)]">
            snake · {mode === 'walls' ? 'tembok' : 'tanpa tembok'}
          </div>
          <button
            type="button"
            onClick={exit}
            className="rounded border border-[var(--border)] px-2 py-0.5 text-xs text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            ✕ tutup
          </button>
        </div>

        <div className="mono flex w-full max-w-[min(72vmin,420px)] justify-between text-sm">
          <span>
            skor: <span className="text-emerald-400">{score}</span>
          </span>
          <span>
            high: <span className="text-amber-400">{high}</span>
          </span>
        </div>

        <div className="relative w-full max-w-[min(72vmin,420px)]">
          <canvas
            ref={canvasRef}
            width={SIZE}
            height={SIZE}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            className="block h-auto w-full rounded border border-[var(--border)] touch-none"
          />
          {gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded bg-black/75">
              <div className="text-lg font-semibold text-[var(--fg)]">Game Over</div>
              <div className="mono text-sm text-[var(--muted)]">
                skor: <span className="text-emerald-400">{score}</span> · high:{' '}
                <span className="text-amber-400">{high}</span>
              </div>
              <div className="mt-1 flex gap-2">
                <button
                  type="button"
                  onClick={reset}
                  className="rounded bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-black"
                >
                  main lagi
                </button>
                <button
                  type="button"
                  onClick={exit}
                  className="rounded border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)]"
                >
                  tutup
                </button>
              </div>
            </div>
          )}
        </div>

        {/* touch d-pad */}
        <div className="mt-4 flex justify-center">
          <div className="grid grid-cols-3 gap-1">
            <span />
            <DPadButton label="▲" onPress={() => setDir(0, -1)} />
            <span />
            <DPadButton label="◀" onPress={() => setDir(-1, 0)} />
            <span />
            <DPadButton label="▶" onPress={() => setDir(1, 0)} />
            <span />
            <DPadButton label="▼" onPress={() => setDir(0, 1)} />
            <span />
          </div>
        </div>
        <p className="mono mt-3 text-center text-[10px] text-[var(--muted)]">
          panah / WASD · geser layar · atau ketuk ▲▼◀▶
        </p>
    </div>
  )
}

function DPadButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <button
      type="button"
      onPointerDown={(e) => {
        e.preventDefault()
        onPress()
      }}
      className="h-11 w-11 select-none rounded border border-[var(--border)] text-base text-[var(--muted)] active:bg-[hsl(var(--color-accent)/0.2)] sm:h-9 sm:w-9"
    >
      {label}
    </button>
  )
}
