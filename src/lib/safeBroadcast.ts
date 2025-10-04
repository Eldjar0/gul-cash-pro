// Safe BroadcastChannel helper for Android WebView compatibility
// Falls back to a no-op shim when BroadcastChannel is unavailable

export function createSafeBroadcastChannel(name: string): BroadcastChannel {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      return new (window as any).BroadcastChannel(name);
    } catch (e) {
      console.warn('[safeBroadcast] Failed to create BroadcastChannel:', e);
    }
  }

  // Fallback shim implementing the BroadcastChannel surface
  let _onmessage: ((this: BroadcastChannel, ev: MessageEvent) => any) | null = null;

  const shim: any = {
    name,
    postMessage: (_: any) => {},
    close: () => {},
    addEventListener: (_type: string, _handler: any) => {},
    removeEventListener: (_type: string, _handler: any) => {},
    set onmessage(fn: any) {
      _onmessage = fn;
    },
    get onmessage() {
      return _onmessage;
    },
  };

  return shim as BroadcastChannel;
}
