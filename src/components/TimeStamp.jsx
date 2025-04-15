'use client';
import { useMemo } from 'react';
export default function TimeStamp() {
  // Capture the time once so that it remains stable between SSR and hydration.
  const timestamp = useMemo(() => new Date().toLocaleTimeString(), []);
  return <span>{timestamp}</span>;
}
