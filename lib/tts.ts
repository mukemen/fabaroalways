export function speak(text: string, opts?: { lang?: string; rate?: number; pitch?: number; voiceName?: string }) {
  if (typeof window === 'undefined') return;
  const synth = window.speechSynthesis;
  if (!synth) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = opts?.lang || 'id-ID';
  if (opts?.rate) utter.rate = opts.rate;
  if (opts?.pitch) utter.pitch = opts.pitch;
  if (opts?.voiceName) {
    const v = synth.getVoices().find(v => v.name === opts.voiceName);
    if (v) utter.voice = v;
  } else {
    const idVoice = synth.getVoices().find(v => v.lang?.toLowerCase().startsWith('id'))
                  || synth.getVoices().find(v => v.lang?.toLowerCase().startsWith('en'));
    if (idVoice) utter.voice = idVoice;
  }
  synth.cancel();
  synth.speak(utter);
}

export function listVoices() {
  if (typeof window === 'undefined') return [] as SpeechSynthesisVoice[];
  return window.speechSynthesis?.getVoices?.() || [];
}
