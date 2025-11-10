export interface SSEOptions {
  withCredentials?: boolean;
  headers?: Record<string, string>;
}

// Conecta a un endpoint SSE devolviendo el EventSource y un helper de cierre
export function connectSSE(url: string, onMessage: (data: any) => void, opts: SSEOptions = {}) {
  // Nota: EventSource estándar no permite headers arbitrarios.
  // Si necesitas auth, usa tokens en querystring o un polyfill.
  const es = new EventSource(url, { withCredentials: !!opts.withCredentials });
  es.onmessage = (ev) => {
    try {
      const data = JSON.parse(ev.data);
      onMessage(data);
    } catch {
      onMessage(ev.data);
    }
  };
  return {
    close: () => es.close(),
    raw: es,
  };
}
