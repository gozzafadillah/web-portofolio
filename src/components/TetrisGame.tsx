import { useCallback, useEffect, useRef, useState } from 'react'

const COLS = 10
const ROWS = 20
const CELL = 24
const W = COLS * CELL
const H = ROWS * CELL

type Cell = string | null
type Shape = number[][]
type Piece = { shape: Shape; color: string; x: number; y: number }

const SHAPES: { m: Shape; color: string }[] = [
  { m: [[1, 1, 1, 1]], color: '#22d3ee' }, // I
  { m: [[1, 1], [1, 1]], color: '#facc15' }, // O
  { m: [[0, 1, 0], [1, 1, 1]], color: '#a855f7' }, // T
  { m: [[0, 1, 1], [1, 1, 0]], color: '#22c55e' }, // S
  { m: [[1, 1, 0], [0, 1, 1]], color: '#ef4444' }, // Z
  { m: [[1, 0, 0], [1, 1, 1]], color: '#3b82f6' }, // J
  { m: [[0, 0, 1], [1, 1, 1]], color: '#f97316' }, // L
]

const rotCW = (m: Shape): Shape => m[0].map((_, i) => m.map((row) => row[i]).reverse())
const linePts = [0, 100, 300, 500, 800]

const getHigh = () => Number(localStorage.getItem('tetris-high') || 0)
const saveHigh = (s: number) => localStorage.setItem('tetris-high', String(s))

function drawCell(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  const px = x * CELL
  const py = y * CELL
  ctx.fillStyle = color
  ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2)
  ctx.fillStyle = 'rgba(255,255,255,0.18)'
  ctx.fillRect(px + 1, py + 1, CELL - 2, 4)
}

export default function TetrisGame({ onExit }: { onExit: (score: number, high: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const boardRef = useRef<Cell[][]>([])
  const pieceRef = useRef<Piece | null>(null)
  const scoreRef = useRef(0)
  const linesRef = useRef(0)
  const levelRef = useRef(0)
  const speedRef = useRef(700)
  const loopRef = useRef(0)
  const deadRef = useRef(false)

  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)
  const [level, setLevel] = useState(0)
  const [high, setHigh] = useState(() => getHigh())
  const [gameOver, setGameOver] = useState(false)

  const draw = useCallback(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#0d1117'
    ctx.fillRect(0, 0, W, H)
    ctx.strokeStyle = '#161b22'
    ctx.lineWidth = 1
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath()
      ctx.moveTo(c * CELL + 0.5, 0)
      ctx.lineTo(c * CELL + 0.5, H)
      ctx.stroke()
    }
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath()
      ctx.moveTo(0, r * CELL + 0.5)
      ctx.lineTo(W, r * CELL + 0.5)
      ctx.stroke()
    }
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) if (boardRef.current[r][c]) drawCell(ctx, c, r, boardRef.current[r][c]!)
    const p = pieceRef.current
    if (p)
      for (let r = 0; r < p.shape.length; r++)
        for (let c = 0; c < p.shape[r].length; c++)
          if (p.shape[r][c]) drawCell(ctx, p.x + c, p.y + r, p.color)
  }, [])

  const collides = useCallback((shape: Shape, px: number, py: number) => {
    for (let r = 0; r < shape.length; r++)
      for (let c = 0; c < shape[r].length; c++)
        if (shape[r][c]) {
          const x = px + c
          const y = py + r
          if (x < 0 || x >= COLS || y >= ROWS) return true
          if (y >= 0 && boardRef.current[y][x]) return true
        }
    return false
  }, [])

  const gameOverNow = useCallback(() => {
    deadRef.current = true
    window.clearTimeout(loopRef.current)
    const s = scoreRef.current
    const h = Math.max(s, getHigh())
    saveHigh(h)
    setHigh(h)
    setGameOver(true)
  }, [])

  const clearLines = useCallback(() => {
    let cleared = 0
    for (let r = ROWS - 1; r >= 0; r--) {
      if (boardRef.current[r].every((cell) => cell !== null)) {
        boardRef.current.splice(r, 1)
        boardRef.current.unshift(new Array(COLS).fill(null))
        cleared++
        r++
      }
    }
    if (cleared > 0) {
      scoreRef.current += linePts[cleared] * (levelRef.current + 1)
      linesRef.current += cleared
      levelRef.current = Math.floor(linesRef.current / 10)
      speedRef.current = Math.max(80, 700 - levelRef.current * 60)
      setScore(scoreRef.current)
      setLines(linesRef.current)
      setLevel(levelRef.current)
    }
  }, [])

  const spawn = useCallback(() => {
    const s = SHAPES[Math.floor(Math.random() * SHAPES.length)]
    const shape = s.m.map((row) => [...row])
    const p: Piece = { shape, color: s.color, x: Math.floor((COLS - shape[0].length) / 2), y: 0 }
    pieceRef.current = p
    if (collides(shape, p.x, p.y)) gameOverNow()
  }, [collides, gameOverNow])

  const lockPiece = useCallback(() => {
    const p = pieceRef.current
    if (!p) return
    for (let r = 0; r < p.shape.length; r++)
      for (let c = 0; c < p.shape[r].length; c++)
        if (p.shape[r][c]) {
          const y = p.y + r
          const x = p.x + c
          if (y >= 0) boardRef.current[y][x] = p.color
        }
    clearLines()
    spawn()
    draw()
  }, [clearLines, spawn, draw])

  const fall = useCallback(() => {
    const p = pieceRef.current
    if (!p) return
    if (!collides(p.shape, p.x, p.y + 1)) p.y++
    else lockPiece()
  }, [collides, lockPiece])

  const tick = useCallback(() => {
    if (deadRef.current) return
    fall()
    draw()
    if (!deadRef.current) loopRef.current = window.setTimeout(tick, speedRef.current)
  }, [fall, draw])

  const reset = useCallback(() => {
    boardRef.current = Array.from({ length: ROWS }, () => new Array(COLS).fill(null))
    scoreRef.current = 0
    linesRef.current = 0
    levelRef.current = 0
    speedRef.current = 700
    setScore(0)
    setLines(0)
    setLevel(0)
    setGameOver(false)
    deadRef.current = false
    spawn()
    draw()
    window.clearTimeout(loopRef.current)
    loopRef.current = window.setTimeout(tick, speedRef.current)
  }, [spawn, draw, tick])

  const moveH = useCallback(
    (dx: number) => {
      const p = pieceRef.current
      if (!p || deadRef.current) return
      if (!collides(p.shape, p.x + dx, p.y)) p.x += dx
      draw()
    },
    [collides, draw]
  )

  const rotatePiece = useCallback(() => {
    const p = pieceRef.current
    if (!p || deadRef.current) return
    const ns = rotCW(p.shape)
    if (!collides(ns, p.x, p.y)) p.shape = ns
    draw()
  }, [collides, draw])

  const softDrop = useCallback(() => {
    if (deadRef.current) return
    fall()
    draw()
  }, [fall, draw])

  const hardDrop = useCallback(() => {
    const p = pieceRef.current
    if (!p || deadRef.current) return
    while (!collides(p.shape, p.x, p.y + 1)) p.y++
    lockPiece()
  }, [collides, lockPiece])

  const exit = useCallback(() => {
    const s = scoreRef.current
    const h = Math.max(s, getHigh())
    saveHigh(h)
    onExit(s, h)
  }, [onExit])

  useEffect(() => {
    reset()
    return () => window.clearTimeout(loopRef.current)
  }, [reset])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key
      if (k === 'ArrowLeft') {
        e.preventDefault()
        moveH(-1)
      } else if (k === 'ArrowRight') {
        e.preventDefault()
        moveH(1)
      } else if (k === 'ArrowUp') {
        e.preventDefault()
        rotatePiece()
      } else if (k === 'ArrowDown') {
        e.preventDefault()
        softDrop()
      } else if (k === ' ' || k === 'Spacebar') {
        e.preventDefault()
        hardDrop()
      } else if (k === 'Enter') {
        if (gameOver) reset()
      } else if (k === 'Escape') {
        exit()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [gameOver, moveH, rotatePiece, softDrop, hardDrop, reset, exit])

  return (
    <div className="flex w-full flex-col items-center gap-3 py-2">
      <div className="mono flex w-full max-w-[min(56vh,440px)] flex-wrap justify-between gap-x-3 text-xs text-[var(--muted)] sm:text-sm">
        <span>
          skor: <span className="text-emerald-400">{score}</span>
        </span>
        <span>
          baris: <span className="text-[var(--fg)]">{lines}</span>
        </span>
        <span>
          level: <span className="text-[var(--fg)]">{level}</span>
        </span>
        <span>
          high: <span className="text-amber-400">{high}</span>
        </span>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="block h-[min(56vh,440px)] w-auto max-w-full rounded border border-[var(--border)]"
        />
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded bg-black/75">
            <div className="text-lg font-semibold text-[var(--fg)]">Game Over</div>
            <div className="mono text-sm text-[var(--muted)]">
              skor: <span className="text-emerald-400">{score}</span> · baris:{' '}
              <span className="text-[var(--fg)]">{lines}</span> · high:{' '}
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

      {/* controls */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Btn onPress={() => moveH(-1)} label="geser kiri">◀</Btn>
        <Btn onPress={rotatePiece} label="putar">⟳</Btn>
        <Btn onPress={() => moveH(1)} label="geser kanan">▶</Btn>
        <Btn onPress={softDrop} label="turun">▼</Btn>
        <Btn onPress={hardDrop} label="jatuh cepat">⤓</Btn>
        <Btn onPress={exit} label="tutup">✕</Btn>
      </div>
      <p className="mono text-center text-[10px] text-[var(--muted)]">
        ←→ geser · ↑ putar · ↓ turun · spasi jatuh · Enter main lagi · Esc tutup
      </p>
    </div>
  )
}

function Btn({
  label,
  onPress,
  children,
}: {
  label: string
  onPress: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault()
        onPress()
      }}
      className="h-11 w-11 select-none rounded border border-[var(--border)] text-base text-[var(--muted)] active:bg-[hsl(var(--color-accent)/0.2)] sm:h-9 sm:w-9"
    >
      {children}
    </button>
  )
}
