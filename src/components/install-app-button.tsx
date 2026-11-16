"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Download } from "lucide-react";

// Not in lib.dom yet — Chromium-only event fired when the page is installable.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// iOS never fires beforeinstallprompt: installing goes through Safari's Share
// menu, so there we show instructions instead (unless already installed).
function isIosBrowserTab() {
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
  const standalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return ios && !standalone;
}
const noSubscribe = () => () => {};

export function InstallAppButton({
  label,
  iosHint,
  className,
}: {
  label: string;
  /** Shown on iOS, where installing goes through Safari's Share menu. */
  iosHint: string;
  className?: string;
}) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const isIos = useSyncExternalStore(noSubscribe, isIosBrowserTab, () => false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setDeferred(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!deferred && !isIos) return null;

  async function install() {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
    } else {
      setShowHint((v) => !v);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center gap-2 rounded-full bg-terracotta px-4 py-2 text-sm font-semibold text-white hover:bg-terracotta/90"
      >
        <Download className="h-4 w-4" aria-hidden />
        {label}
      </button>
      {showHint && <p className="mt-2 max-w-xs text-xs opacity-80">{iosHint}</p>}
    </div>
  );
}
