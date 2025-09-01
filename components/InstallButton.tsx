'use client'
import { useEffect, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed', platform: string }>;
};

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (window as any).navigator.standalone === true;
}

function isiOS() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
}

export default function InstallButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState<boolean>(isStandalone());
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      setInstalled(true);
      setVisible(false);
      setDeferred(null);
    };
    window.addEventListener('beforeinstallprompt', onBIP);
    window.addEventListener('appinstalled', onInstalled);
    if (isiOS() && !isStandalone()) setVisible(true);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBIP);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed || !visible) return null;

  const doInstall = async () => {
    if (deferred) {
      await deferred.prompt();
      try {
        const res = await deferred.userChoice;
        if (res.outcome === 'accepted') setVisible(false);
      } catch {}
    } else if (isiOS()) {
      alert('iOS: Buka menu Share ➜ Add to Home Screen untuk menginstal.');
    } else {
      window.location.href = '/manifest.json';
    }
  };

  return (
    <button onClick={doInstall} className="text-xs rounded-md border px-2 py-1 dark:text-gray-100">
      Install
    </button>
  );
}
