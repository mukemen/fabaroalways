'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import MessageBubble from '@/components/MessageBubble'
import MicButton from '@/components/MicButton'
import InstallButton from '@/components/InstallButton'
import { listVoices, speak } from '@/lib/tts'

type Msg = { role: 'user' | 'assistant' | 'system'; content: string }

const MODEL_OPTIONS = [
  'meta-llama/llama-3.1-8b-instruct:free',
  'meta-llama/llama-3.1-70b-instruct',
  'openai/gpt-4o-mini',
  'qwen/qwen-2.5-14b-instruct',
]

export default function Page() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Msg[]>([{
    role: 'assistant',
    content: 'Halo, aku FABARO ALWAYS. Ceritakan apa yang kamu rasakan — aku siap mendengarkan. 🎧',
  }])
  const [loading, setLoading] = useState(false)
  const [autoVoice, setAutoVoice] = useState(true)
  const [voiceName, setVoiceName] = useState<string>('')
  const [rate, setRate] = useState(1)
  const [pitch, setPitch] = useState(1)
  const [model, setModel] = useState<string>(MODEL_OPTIONS[0])
  const [temperature, setTemperature] = useState<number>(0.6)
  const [theme, setTheme] = useState<'light'|'dark'>(() => (typeof window !== 'undefined' && document.documentElement.classList.contains('dark')) ? 'dark' : 'light')
  const listRef = useRef<HTMLDivElement>(null)
  const keyLocal = 'fabaro-always-chat-v1'

  useEffect(() => {
    const raw = localStorage.getItem(keyLocal)
    if (raw) {
      try { setMessages(JSON.parse(raw)) } catch {}
    }
  }, [])
  useEffect(() => {
    localStorage.setItem(keyLocal, JSON.stringify(messages))
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const voiceOptions = useMemo(() => listVoices(), [])
  useEffect(() => {
    const h = () => {
      const v = listVoices()
      const id = v.find(x => x.lang?.toLowerCase().startsWith('id')) || v[0]
      setVoiceName(id?.name || '')
    }
    window.speechSynthesis?.addEventListener('voiceschanged', h)
    h()
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', h)
  }, [])

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(()=>{})
    }
  }, [])

  const send = useCallback(async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content) return
    setInput('')
    setLoading(true)

    const next = [...messages, { role: 'user', content } as Msg]
    setMessages(next)

    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next.map(({ role, content }) => ({ role, content })),
          model,
          temperature,
        }),
      })
      const data = await r.json()
      const reply = (data?.content || '').trim() || 'Maaf, aku sedang kesulitan menjawab. Coba lagi ya.'
      const after = [...next, { role: 'assistant', content: reply } as Msg]
      setMessages(after)
      if (autoVoice) speak(reply, { lang: 'id-ID', rate, pitch, voiceName })
    } catch (e) {
      setMessages([...next, { role: 'assistant', content: 'Terjadi gangguan jaringan. Coba lagi ya.' }])
    } finally {
      setLoading(false)
    }
  }, [input, messages, autoVoice, rate, pitch, voiceName, model, temperature])

  const onMicText = useCallback((t: string) => setInput(t), [])

  const clearChat = () => {
    const init: Msg[] = [{
      role: 'assistant',
      content: 'Halo, aku FABARO ALWAYS. Ceritakan apa yang kamu rasakan — aku siap mendengarkan. 🎧',
    }]
    setMessages(init)
    localStorage.setItem(keyLocal, JSON.stringify(init))
  }

  const exportTxt = () => {
    const lines = messages.map(m => (m.role === 'user' ? 'Kamu: ' : 'FABARO: ') + m.content)
    const blob = new Blob([lines.join('\n\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'fabaro-always-chat.txt'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    if (next === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    try { localStorage.setItem('fabaro-theme', next) } catch {}
  }

  return (
    <main className="app mx-auto max-w-md min-h-screen flex flex-col bg-gradient-to-b from-white to-gray-50 dark:from-zinc-900 dark:to-zinc-950">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/80 dark:bg-zinc-900/80 border-b border-gray-200 dark:border-zinc-800">
        <div className="px-4 py-3 flex items-center gap-3">
          <img src="/logo.png" alt="FABARO" className="w-9 h-9 rounded-2xl object-cover" />
          <div className="flex-1">
            <h1 className="text-base font-semibold leading-tight dark:text-white">FABARO ALWAYS</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Teman curhat yang empatik & menjaga privasi</p>
          </div>
          <button onClick={toggleTheme} className="text-xs rounded-md border px-2 py-1 dark:text-gray-100">
            {theme === 'light' ? 'Dark' : 'Light'}
          </button>
          <InstallButton />
        </div>
      </header>

      <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role}>{m.content}</MessageBubble>
        ))}
        {loading && <MessageBubble role="assistant">Mengetik…</MessageBubble>}
      </div>

      <div className="sticky bottom-0 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800">
        <div className="p-3 flex items-end gap-2 max-w-md mx-auto">
          <MicButton onText={onMicText} />
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tulis atau tekan Mic untuk bicara…"
            rows={1}
            className="flex-1 resize-none rounded-2xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/40 dark:bg-zinc-800 dark:text-gray-100 dark:border-zinc-700"
          />
          <button
            onClick={() => send()}
            disabled={loading}
            className="px-4 py-2 rounded-2xl bg-brand text-white font-semibold shadow-sm disabled:opacity-50"
          >Kirim</button>
        </div>

        <div className="px-3 pb-3 text-xs text-gray-700 dark:text-gray-200 space-y-2 max-w-md mx-auto">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={autoVoice} onChange={(e) => setAutoVoice(e.target.checked)} />
              Auto‑suara jawaban
            </label>
            <select value={voiceName} onChange={(e) => setVoiceName(e.target.value)} className="border rounded-md px-2 py-1 dark:bg-zinc-800 dark:border-zinc-700">
              {voiceOptions.map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
            </select>
            <label className="flex items-center gap-1">Rate <input type="range" min={0.8} max={1.3} step={0.05} value={rate} onChange={e=>setRate(parseFloat(e.target.value))}/></label>
            <label className="flex items-center gap-1">Pitch <input type="range" min={0.7} max={1.3} step={0.05} value={pitch} onChange={e=>setPitch(parseFloat(e.target.value))}/></label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-1">
              Model:
              <select value={model} onChange={(e)=>setModel(e.target.value)} className="border rounded-md px-2 py-1 dark:bg-zinc-800 dark:border-zinc-700">
                {MODEL_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-1">Temperature
              <input type="range" min={0} max={1} step={0.05} value={temperature} onChange={e => setTemperature(parseFloat(e.target.value))} />
              <span className="w-8 text-right">{temperature.toFixed(2)}</span>
            </label>
            <button onClick={clearChat} className="px-3 py-1 rounded-lg border dark:border-zinc-700">Clear chat</button>
            <button onClick={exportTxt} className="px-3 py-1 rounded-lg border dark:border-zinc-700">Export .txt</button>
          </div>
          <p className="leading-relaxed text-xs">⚠️ <b>Disclaimer:</b> Ini bukan pengganti konselor profesional. Jika kamu dalam kondisi darurat, hubungi layanan darurat setempat.</p>
        </div>
      </div>
    </main>
  )
}
