// app/page.tsx
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import MessageBubble from '@/components/MessageBubble'
import MicButton from '@/components/MicButton'
import InstallButton from '@/components/InstallButton'
import { speak, listVoices } from '@/lib/tts'

type Msg = { role: 'user' | 'assistant' | 'system'; content: string }

// Fallback label bahasa jika Intl.DisplayNames tidak tersedia
const FALLBACK_LABELS: Record<string, string> = {
  'id-ID': 'Bahasa Indonesia',
  'en-US': 'English (United States)',
  'en-GB': 'English (United Kingdom)',
  'ms-MY': 'Bahasa Melayu',
  'ja-JP': '日本語 (Japan)',
  'ko-KR': '한국어 (Korea)',
  'zh-CN': '中文（中国大陆）',
  'zh-TW': '中文（台灣）',
  'ar-SA': 'العربية (Saudi Arabia)',
  'hi-IN': 'हिन्दी (India)',
  'fr-FR': 'Français (France)',
  'de-DE': 'Deutsch (Deutschland)',
  'es-ES': 'Español (España)',
  'es-MX': 'Español (México)',
  'pt-BR': 'Português (Brasil)',
  'ru-RU': 'Русский (Россия)',
}

function displayLangLabel(code: string): string {
  try {
    const [langPart, regionPart] = code.split('-')
    // @ts-ignore (beberapa env TS lama)
    const lang = new Intl.DisplayNames(['id'], { type: 'language' }).of(langPart)
    // @ts-ignore
    const region = regionPart ? new Intl.DisplayNames(['id'], { type: 'region' }).of(regionPart.toUpperCase()) : ''
    const langLabel = lang ? lang.charAt(0).toUpperCase() + lang.slice(1) : (FALLBACK_LABELS[code] || code)
    return region ? `${langLabel} (${region})` : langLabel
  } catch {
    return FALLBACK_LABELS[code] || code
  }
}

export default function Page() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Msg[]>([{
    role: 'assistant',
    content: 'Halo, aku FABARO ALWAYS. Ceritakan apa yang kamu rasakan — aku siap mendengarkan. 🎧',
  }])
  const [loading, setLoading] = useState(false)
  const [autoVoice, setAutoVoice] = useState(true)

  // Bahasa TTS (label manusiawi, value tetap kode BCP-47)
  const [selectedLang, setSelectedLang] = useState<string>('id-ID')
  const [langOptions, setLangOptions] = useState<string[]>(['id-ID', 'en-US'])

  // Tema
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    (typeof window !== 'undefined' && document.documentElement.classList.contains('dark')) ? 'dark' : 'light'
  )

  const listRef = useRef<HTMLDivElement>(null)
  const keyLocal = 'fabaro-always-chat-v1'

  // Load & persist history
  useEffect(() => {
    const raw = localStorage.getItem(keyLocal)
    if (raw) {
      try { setMessages(JSON.parse(raw)) } catch { /* ignore */ }
    }
  }, [])
  useEffect(() => {
    localStorage.setItem(keyLocal, JSON.stringify(messages))
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  // Kumpulkan daftar bahasa dari voices yang tersedia
  useEffect(() => {
    const handle = () => {
      const voices = listVoices()
      const langs = Array.from(new Set(voices.map(v => v.lang || 'en-US')))
      // Prioritaskan id-ID di urutan atas
      langs.sort((a, b) => (a === 'id-ID' ? -1 : b === 'id-ID' ? 1 : a.localeCompare(b)))
      if (langs.length) setLangOptions(langs)
      if (langs.includes('id-ID')) setSelectedLang('id-ID')
      else if (langs[0]) setSelectedLang(langs[0])
    }
    window.speechSynthesis?.addEventListener('voiceschanged', handle)
    handle()
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', handle)
  }, [])

  // Register service worker (PWA)
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
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
          // model & temperature tidak dikirim; server baca dari ENV
        }),
      })
      const data = await r.json()
      const reply = (data?.content || '').trim() || 'Maaf, aku sedang kesulitan menjawab. Coba lagi ya.'
      const after = [...next, { role: 'assistant', content: reply } as Msg]
      setMessages(after)
      if (autoVoice) speak(reply, { lang: selectedLang })
    } catch (e) {
      setMessages([...next, { role: 'assistant', content: 'Terjadi gangguan jaringan. Coba lagi ya.' }])
    } finally {
      setLoading(false)
    }
  }, [input, messages, autoVoice, selectedLang])

  const onMicText = useCallback((t: string) => setInput(t), [])

  // 🔴 Clear chat: reset state + hapus history di localStorage
  const clearChat = () => {
    const init: Msg[] = [{
      role: 'assistant',
      content: 'Halo, aku FABARO ALWAYS. Ceritakan apa yang kamu rasakan — aku siap mendengarkan. 🎧',
    }]
    if (confirm('Hapus semua riwayat chat ini?')) {
      setMessages(init)
      try { localStorage.setItem(keyLocal, JSON.stringify(init)) } catch {}
    }
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
      {/* Header */}
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

      {/* Messages */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role}>{m.content}</MessageBubble>
        ))}
        {loading && <MessageBubble role="assistant">Mengetik…</MessageBubble>}
      </div>

      {/* Composer */}
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

        {/* Kontrol sederhana */}
        <div className="px-3 pb-3 text-xs text-gray-700 dark:text-gray-200 space-y-2 max-w-md mx-auto">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={autoVoice} onChange={(e) => setAutoVoice(e.target.checked)} />
              Auto-suara jawaban
            </label>
            <label className="flex items-center gap-1">
              Bahasa:
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                className="border rounded-md px-2 py-1 dark:bg-zinc-800 dark:border-zinc-700"
              >
                {langOptions.map(code => (
                  <option key={code} value={code}>
                    {displayLangLabel(code)}
                  </option>
                ))}
              </select>
            </label>

            {/* Tombol Clear chat */}
            <button onClick={clearChat} className="px-3 py-1 rounded-lg border dark:border-zinc-700">
              Clear chat
            </button>
          </div>

          <p className="leading-relaxed text-xs">
            ⚠️ <b>Disclaimer:</b> Ini bukan pengganti konselor profesional. Jika kamu dalam kondisi darurat,
            hubungi layanan darurat setempat.
          </p>
        </div>
      </div>
    </main>
  )
}
