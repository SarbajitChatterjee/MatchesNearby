/**
 * SplashScreen — branded overlay shown during app boot.
 *
 * Two-phase fade sequence:
 * 1. Logo + text scale-in immediately (CSS animation)
 * 2. After 1.5s, opacity fades to 0 over 300ms
 * 3. At 1.8s, onComplete fires and the component unmounts
 *
 * Total visible time: ~1.8 seconds — long enough for branding
 * recognition but short enough to not frustrate returning users.
 */

import { useEffect, useState } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFadeOut(true), 1500);
    const t2 = setTimeout(onComplete, 1800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-opacity duration-300 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="animate-splash-in flex flex-col items-center gap-md">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent">
          <span className="text-2xl font-bold text-accent-foreground">M</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Match<span className="text-accent">Nearby</span>
        </h1>
        <p className="text-xs text-muted-foreground">
          Find football near you
        </p>
      </div>
    </div>
  );
}
