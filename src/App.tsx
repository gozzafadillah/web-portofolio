import { useEffect, useState } from 'react'
import BootScreen from './components/BootScreen'
import Hero from './components/Hero'

function App() {
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    document.body.style.overflow = booting ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [booting])

  return (
    <>
      {booting && <BootScreen onDone={() => setBooting(false)} />}
      <div className={`transition-opacity duration-500 ${booting ? 'opacity-0' : 'opacity-100'}`}>
        <main>
          <Hero />
        </main>
        <footer className="px-4 pb-8">
          <p className="mono mx-auto max-w-4xl text-center text-xs text-[var(--muted)]">
            <span className="text-[var(--accent)]">▚</span> © 2026 Muhammad Fadillah Abdul Aziz ·
            built on <span className="path">arch</span> linux
          </p>
        </footer>
      </div>
    </>
  )
}

export default App
