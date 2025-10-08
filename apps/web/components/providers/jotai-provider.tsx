'use client';

import { Provider } from 'jotai';
import { useState, useEffect } from 'react';

interface JotaiProviderProps {
  children: React.ReactNode;
}

export function JotaiProvider({ children }: JotaiProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR/prerendering, just render children without Provider to avoid useContext errors
  if (!mounted) {
    return <>{children}</>;
  }

  return <Provider>{children}</Provider>;
}