export interface NetworkState {
  online: boolean;
  effectiveType: string;
  downlink: number;
  rtt: number;
}

interface NetworkInformation extends NetworkConnection {
  effectiveType: string;
  downlink: number;
  rtt: number;
}

interface NetworkConnection extends EventTarget {
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

export function useNetworkState(): NetworkState {
  const connection =
    typeof navigator !== 'undefined'
      ? (navigator as unknown as { connection?: NetworkInformation }).connection
      : undefined;

  return {
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
    effectiveType: connection?.effectiveType ?? 'unknown',
    downlink: connection?.downlink ?? 0,
    rtt: connection?.rtt ?? 0,
  };
}
