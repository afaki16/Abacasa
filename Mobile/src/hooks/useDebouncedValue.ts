import { useEffect, useState } from 'react';

/** Arama kutuları için: kullanıcı yazmayı bırakınca (varsayılan 350 ms) değer güncellenir. */
export function useDebouncedValue<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
