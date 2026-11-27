import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, delay: number): T {
  const [settledValue, setSettledValue] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setSettledValue(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return settledValue;
}
