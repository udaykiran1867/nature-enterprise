const STORE = "ne-idem-v1";

/** Stable key per cart contents (survives reloads), so retries and double clicks never duplicate an order. */
export function getIdempotencyKey(signature: string): string {
  try {
    const raw = sessionStorage.getItem(STORE);
    if (raw) {
      const saved = JSON.parse(raw) as { sig: string; key: string };
      if (saved.sig === signature) return saved.key;
    }
  } catch { /* storage unavailable */ }
  const key = crypto.randomUUID();
  try { sessionStorage.setItem(STORE, JSON.stringify({ sig: signature, key })); } catch { /* ignore */ }
  return key;
}

export function clearIdempotencyKey() {
  try { sessionStorage.removeItem(STORE); } catch { /* ignore */ }
}
