// lib/tts.ts
export function speak(
  text: string,
  opts?: { lang?: string; voiceName?: string; rate?: number; pitch?: number }
) {
  if (typeof window === 'undefined') return;
  const synth = window.speechSynthesis;
  if (!synth) return;

  const lang = (opts?.lang || 'id-ID').toLowerCase();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;
  if (opts?.rate) utter.rate = opts.rate;
  if (opts?.pitch) utter.pitch = opts.pitch;

  const voices = synth.getVoices();

  // 1) Jika voiceName disediakan, pakai itu
  let chosen =
    (opts?.voiceName
      ? voices.find(v => v.name === opts.voiceName)
      : undefined) || null;

  // 2) Cari voice yang persis match kode bahasa (id-ID, en-US, dll)
  if (!chosen) {
    chosen = voices.find(
      v => (v.lang || '').toLowerCase() === lang
    ) || null;
  }

  // 3) Kalau tidak ada, cari yang cocok prefix bahasa (id, en, dll)
  if (!chosen) {
    const base = lang.split('-')[0];
    chosen = voices.find(
      v => (v.lang || '').toLowerCase().startsWith(base)
    ) || null;
  }

  // 4) Fallback aman: English atau voice pertama
  if (!chosen) {
    chosen =
      voices.find(v => (v.lang || '').toLowerCase().startsWith('en')) ||
      voices[0] ||
      null;
  }

  if (chosen) utter.voice = chosen;

  // Beberapa browser butuh cancel sebelum speak agar ganti voice terpakai
  synth.cancel();
  synth.speak(utter);
}

export function listVoices() {
  if (typeof window === 'undefined') return [] as SpeechSynthesisVoice[];
  return window.speechSynthesis?.getVoices?.() || [];
}
