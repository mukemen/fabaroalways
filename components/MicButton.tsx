'use client'
import { useEffect, useRef, useState } from 'react'
import { createSTT } from '@/lib/stt'

export default function MicButton({ onText }: { onText: (text: string) => void }) {
  const [listening, setListening] = useState(false)
  const [available, setAvailable] = useState(false)
  const recRef = useRef<ReturnType<typeof createSTT> | null>(null)

  useEffect(() => {
    const rec = createSTT('id-ID', {
      onStart: () => setListening(true),
      onResult: (t) => onText(t),
      onEnd: () => setListening(false),
      onError: () => setListening(false),
    })
    recRef.current = rec
    setAvailable(rec.available)
  }, [onText])

  const toggle = () => {
    const rec = recRef.current
    if (!rec || !rec.available) return
    if (listening) rec.stop()
    else rec.start()
  }

  if (!available) return (
    <button disabled className="px-3 py-2 rounded-xl bg-gray-200 text-gray-500">Mic N/A</button>
  )

  return (
    <button onClick={toggle} className={`px-4 py-2 rounded-xl font-medium shadow-sm ${listening ? 'bg-red-500 text-white' : 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 border'} `}>
      {listening ? 'Stop' : 'Mic'}
    </button>
  )
}
