export type STTCallbacks = {
  onStart?: () => void;
  onResult?: (text: string) => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
};

export function createSTT(lang = 'id-ID', cb: STTCallbacks = {}) {
  if (typeof window === 'undefined') return {
    start: () => {}, stop: () => {}, available: false
  } as const;

  const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) return { start: () => {}, stop: () => {}, available: false } as const;

  const rec = new SR();
  rec.lang = lang;
  rec.interimResults = true;
  rec.continuous = false;

  let finalText = '';

  rec.onstart = () => cb.onStart?.();
  rec.onresult = (e: any) => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; ++i) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) finalText += t + ' ';
      else interim += t;
    }
    cb.onResult?.((finalText + interim).trim());
  };
  rec.onerror = (e: any) => cb.onError?.(e);
  rec.onend = () => cb.onEnd?.();

  return {
    start: () => rec.start(),
    stop: () => rec.stop(),
    available: true as const,
  } as const;
}
