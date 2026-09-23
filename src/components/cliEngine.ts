export const CV_PDF = '/CV_ATS_Muhammad_Fadillah_Abdul_Aziz.pdf'
export const SUDO_PASSWORD = 'fadillah'

export type Tone = 'accent' | 'fg' | 'muted'

export type Line =
  | { kind: 'cmd'; text: string }
  | { kind: 'out'; text: string; tone?: Tone }
  | { kind: 'err'; text: string }
  | { kind: 'pre'; text: string; tone?: Tone }
  | { kind: 'link'; label: string; href: string; note?: string; download?: boolean }
  | { kind: 'hero'; name: string; sub: string }

/* Text length that gets typed out per line (0 = reveal whole). */
export function typeLen(line: Line): number {
  switch (line.kind) {
    case 'out':
    case 'err':
    case 'pre':
      return line.text.length
    default:
      return 0
  }
}

export const HELP = `portfolio CLI — available commands

read content (no sudo):
  cat about.md            who I am
  cat skills.txt          technical skills
  ./experience --list     work history
  ls projects/            projects & apprenticeships
  cat education.txt       education
  ./contact               contact & social

actions (sudo pacman):
  sudo pacman cv                          preview CV (new tab), then download
  sudo pacman social-media -t instagram   instagram.com/gmfaaaaa
  sudo pacman social-media -t linkedin    linkedin
  sudo pacman latest-career               where I work now

game:
  bash ./snake -t wall      ular dengan tembok (nabrak = mati)
  bash ./snake -t no-wall   ular tanpa tembok (tembus tepi)
  bash ./tetris             tetris klasik (skor + level + high score)

other:
  clear | cls             clear screen
  help | -h | --help      show this help

notes:
  ↑↓ history · Tab complete · ambiguous → menu: ↑↓ pilih, Enter
  sudo caches your credential for 30s (like Linux)`

export const SNAKE_USAGE = `snake — main ular di terminal

usage: bash ./snake -t <mode>
  bash ./snake -t wall      ada tembok: nabrak dinding = mati
  bash ./snake -t no-wall   tanpa tembok: tembus tepi (wrap)

controls : panah / WASD · geser layar · tombol ▲▼◀▶
points   : +1 tiap makan, makin cepat seiring skor. high score per mode.`

/* ── content builders ── */

function about(): Line[] {
  return [
    {
      kind: 'pre',
      tone: 'muted',
      text: 'Backend Developer dengan pengalaman lebih dari 2 tahun merancang arsitektur sistem berskala besar, API berkinerja tinggi, serta integrasi IoT dan jaringan. Spesialisasi pada Go, PHP (Laravel, CodeIgniter), PostgreSQL, message broker, dan MERN Stack (MongoDB, Express.js, React.js, Node.js).',
    },
  ]
}

function skills(): Line[] {
  const rows = [
    ['Languages          ', 'Go, PHP, SQL, JavaScript, Node.js'],
    ['Frameworks         ', 'Echo, Gin, Laravel, CodeIgniter 4, Express.js, React.js, Vue.js'],
    ['Stacks             ', 'MERN (MongoDB, Express.js, React.js, Node.js)'],
    ['Databases & Caching', 'PostgreSQL, MySQL, Oracle, InfluxDB, RadiusDB, MongoDB'],
    ['Protocols          ', 'MQTT, RESTful API, GraphQL, PPPoE, Single Sign-On (SSO)'],
    ['Tools & OS         ', 'Linux (Arch), Git, Docker, Postman'],
  ]
  return rows.map(([k, v]) => ({ kind: 'pre', text: `${k} : ${v}` }) as Line)
}

function experience(): Line[] {
  const L: Line[] = []
  const head = (t: string) => L.push({ kind: 'pre', text: t, tone: 'accent' })
  const meta = (t: string) => L.push({ kind: 'pre', text: `  ${t}`, tone: 'fg' })
  const item = (t: string) => L.push({ kind: 'pre', text: `  [+] ${t}` })
  const gap = () => L.push({ kind: 'pre', text: '' })

  head('▚ WIT. Indonesia — Bandung, Indonesia')
  meta('Back End Developer (Full-time) · Nov 2023 – Sekarang')
  item('ION Core (2026): Sistem inti ISP berbasis web untuk otomatisasi aktivasi/deaktivasi akses internet dan manajemen usage limit berbasis PPPoE (Go, PostgreSQL, RadiusDB).')
  item('MWX Marketplace (2025): Backend marketplace digital berbasis Go dan PostgreSQL, terintegrasi ekosistem SSO AI.')
  item('MIU (2024): Dashboard transaksi isi ulang air minum + telemetri IoT real-time via MQTT, Go, PostgreSQL.')
  item('FMSS (2024): Sistem transaksi & dashboard pemantauan stasiun pengisian bensin mandiri (Go, PostgreSQL).')
  item('Borromeus Hospital (2024): Audit, optimalisasi, pemeliharaan master data pasien/layanan (Laravel, MySQL).')
  item('Water Monitoring UBS (2023): Pemantauan demineralisasi air daur ulang industri (CodeIgniter 4, Oracle, InfluxDB).')
  item('Habitat Apps (2023): Modul voucher belanja + peningkatan performa query transaksi (Go, PostgreSQL).')
  gap()
  head('▚ GoTo Impact Foundation — Remote')
  meta('Full Stack Engineering Apprentice · Jun 2023 – Dec 2023')
  item('Aplikasi web full stack modular dengan MERN Stack (MongoDB, Express.js, React.js, Node.js).')
  item('RESTful API terstruktur dengan Express.js dan MongoDB.')
  item('Code review rutin dan kolaborasi tim.')
  gap()
  head('▚ Intelligo ID — Bandung, Indonesia')
  meta('Full Stack Developer (Internship) · Jan 2023 – Sep 2023')
  item('Modul UI interaktif dengan Vue.js, terintegrasi MySQL.')
  item('Optimalisasi performa query basis data untuk pelaporan.')
  return L
}

function projects(): Line[] {
  const L: Line[] = []
  L.push({ kind: 'pre', text: '▚ charum/  (2022)', tone: 'accent' })
  L.push({ kind: 'pre', text: '  Lead Frontend Developer & Project Manager · Alterra Academy', tone: 'fg' })
  L.push({ kind: 'pre', text: '  Web Forum Group Discussion (FGD). Memimpin frontend dan alur proyek tim.' })
  L.push({ kind: 'pre', text: '' })
  L.push({ kind: 'pre', text: '▚ bayeue-app/  (2022)', tone: 'accent' })
  L.push({ kind: 'pre', text: '  Backend Developer · Alterra Academy', tone: 'fg' })
  L.push({ kind: 'pre', text: '  Aplikasi PPOB berbasis Golang dengan arsitektur REST API.' })
  return L
}

function education(): Line[] {
  return [
    { kind: 'pre', text: '▚ SMA Negeri 15 Bandung', tone: 'accent' },
    { kind: 'pre', text: '  2016 – 2019', tone: 'fg' },
  ]
}

function contact(): Line[] {
  return [
    { kind: 'pre', text: 'LOCATION : Cimahi Utara, Kota Cimahi' },
    { kind: 'pre', text: 'PHONE    : +62 895-6319-48686' },
    { kind: 'link', label: 'gozzafadillah@gmail.com', href: 'mailto:gozzafadillah@gmail.com', note: 'EMAIL' },
    {
      kind: 'link',
      label: 'linkedin.com/in/muhammad-fadillah-abdul-aziz',
      href: 'https://linkedin.com/in/muhammad-fadillah-abdul-aziz',
      note: 'LINKEDIN',
    },
  ]
}

/* Runs a sudo-authenticated pacman operation. */
export function execPacman(opRaw: string): Line[] {
  const op = opRaw.replace(/^pacman\s*/, '').trim()

  if (/^(cv|download-cv|get-cv)\b/.test(op)) {
    return [
      { kind: 'out', text: '→ resolving CV_ATS_Muhammad_Fadillah_Abdul_Aziz.pdf ...' },
      { kind: 'link', label: 'preview', href: CV_PDF, note: 'lihat dulu di tab baru — belum terunduh' },
      { kind: 'link', label: 'download', href: CV_PDF, download: true, note: 'unduh setelah kamu preview' },
    ]
  }

  if (/^social-media\b/.test(op)) {
    const m = op.match(/(?:-t|--target)\s*["']?([a-z_]+)["']?/i)
    const target = m?.[1]?.toLowerCase()
    if (target === 'instagram') {
      return [
        { kind: 'out', text: '→ target: instagram' },
        { kind: 'link', label: '@gmfaaaaa', href: 'https://instagram.com/gmfaaaaa', note: 'instagram.com/gmfaaaaa' },
      ]
    }
    if (target === 'linkedin') {
      return [
        { kind: 'out', text: '→ target: linkedin' },
        {
          kind: 'link',
          label: 'muhammad-fadillah-abdul-aziz',
          href: 'https://linkedin.com/in/muhammad-fadillah-abdul-aziz',
          note: 'linkedin.com/in/muhammad-fadillah-abdul-aziz',
        },
      ]
    }
    return [{ kind: 'err', text: `error: unknown target '${target ?? ''}'. try -t "instagram" or -t "linkedin"` }]
  }

  if (/^(latest-career|career)\b/.test(op)) {
    return [
      { kind: 'out', text: '→ current: Back End Developer · WIT. Indonesia (Nov 2023 – sekarang)' },
      { kind: 'link', label: 'wit.id', href: 'https://wit.id', note: 'latest career → wit.id' },
    ]
  }

  return [{ kind: 'err', text: `error: unknown operation '${op}'. run: sudo pacman -h` }]
}

/* Match a content-read command to its output. */
function execContent(body: string): Line[] | null {
  const b = body.trim().toLowerCase()
  if (/^(cat\s+)?about(\.md)?$/.test(b)) return about()
  if (/^(cat\s+)?skills(\.txt)?$/.test(b)) return skills()
  if (/^(cat\s+)?experience(\.log)?$/.test(b) || /^\.?\/?experience(\s+--list)?$/.test(b)) return experience()
  if (/^ls\s+projects\/?$/.test(b) || /^(cat\s+)?projects?(\/*)?$/.test(b)) return projects()
  if (/^(cat\s+)?education(\.txt)?$/.test(b)) return education()
  if (/^(cat\s+)?contact(\.txt)?$/.test(b) || /^\.?\/?contact$/.test(b)) return contact()
  return null
}

/* Handles one submitted command line (before sudo auth). */
export function handleCommand(
  raw: string
): { lines: Line[]; pendingSudo?: string; clear?: boolean; game?: 'walls' | 'nowalls' | 'tetris' } {
  const value = raw.trim()
  if (!value) return { lines: [] }

  const isSudo = /^sudo\b/.test(value)
  const body = value.replace(/^sudo\s+/, '').trim()

  if (/^(clear|cls)$/.test(body)) return { lines: [], clear: true }

  if (/^(help|-h|--help)$/.test(body) || /^pacman\s+(-h|--help|help)$/.test(body)) {
    return { lines: [{ kind: 'pre', text: HELP }] }
  }

  if (/^pacman\b/.test(body)) {
    const op = body.replace(/^pacman\s*/, '').trim()
    if (!op || /^(-h|--help|help)$/.test(op)) return { lines: [{ kind: 'pre', text: HELP }] }
    if (!isSudo) return { lines: [{ kind: 'err', text: `error: '${op}' needs root. try: sudo pacman ${op}` }] }
    return { lines: [], pendingSudo: body }
  }

  // snake game: bash ./snake -t wall | no-wall
  const t = body.toLowerCase().trim()
  const s = t.replace(/^bash\s+/, '').replace(/^\.\//, '').trim()
  if (/^snake\b/.test(s)) {
    const arg = s.replace(/^snake\s*/, '').trim()
    const m =
      arg.match(/(?:-t|--type|--mode)\s+["']?([a-z-]+)["']?/) || arg.match(/^["']?([a-z-]+)["']?$/)
    const val = m ? m[1] : ''
    if (!val) return { lines: [{ kind: 'pre', text: SNAKE_USAGE }] }
    if (/^(no-?walls?|wrap|tanpa[-_ ]?tembok)$/.test(val)) return { lines: [], game: 'nowalls' }
    if (/^(walls?|tembok|bounded)$/.test(val)) return { lines: [], game: 'walls' }
    return {
      lines: [{ kind: 'err', text: `error: mode '${val}' tidak dikenal — pakai: bash ./snake -t wall | no-wall` }],
    }
  }

  // tetris game: bash ./tetris
  if (/^(?:bash\s+)?(?:\.\/)?(?:play\s+)?tetris\b/.test(t)) return { lines: [], game: 'tetris' }

  const content = execContent(body)
  if (content) return { lines: content }

  return {
    lines: [
      { kind: 'err', text: `command not found: ${value.split(/\s+/)[0]}` },
      { kind: 'out', text: 'run: help   // lihat command yang tersedia' },
    ],
  }
}
