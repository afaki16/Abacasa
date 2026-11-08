import { useCallback, useEffect, useState } from 'react';

/**
 * "Tekrar gönder" sayacı. start() sayacı başlatır; remaining 0 olunca buton açılır.
 * Backend kod/e-posta gönderimini 60 sn'de bir kabul eder (OtpService.ResendCooldownSeconds).
 */
export function useCooldown(seconds = 60) {
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (endsAt === null) return;
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= endsAt) {
        setEndsAt(null);
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [endsAt]);

  const start = useCallback(() => {
    const current = Date.now();
    setNow(current);
    setEndsAt(current + seconds * 1000);
  }, [seconds]);

  const remaining = endsAt === null ? 0 : Math.max(0, Math.ceil((endsAt - now) / 1000));
  return { remaining, isActive: remaining > 0, start };
}
