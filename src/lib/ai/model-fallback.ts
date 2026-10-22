/**
 * Which model actually answers, when the configured one is gone.
 *
 * On 2026-10-21 every AI feature in production — written interviews, the
 * assistant, the resume analyzer, the failure reviews, both tutors — failed
 * at once: NVIDIA stopped serving `nvidia/nemotron-3-super-120b-a12b` to our
 * account (404 "Function '…': Not found for account '…'"), and the older
 * catalogue models answer 410 "has reached its end of life". The model was
 * one environment variable on the instance, so the fix was a shell on the box,
 * and every feature stayed down until someone had one.
 *
 * Now each call site sends through `fetchWithModelFallback`: a 404 that names
 * a missing function or model, or a 410, marks that model unavailable for an
 * hour and the same request goes again on the next model of
 * [configured, ...AI_FALLBACK_MODELS] — so a retired model costs one extra
 * round trip, once an hour, instead of the feature. Any other failure (a 429,
 * a 5xx, a timeout) is the caller's to retry as before: those are about load,
 * not about the model existing.
 *
 * The defaults are the two models the account served on that day, measured on
 * a failure review: nemotron-3-ultra-550b (the larger successor to
 * nemotron-3-super; 2–10 s, valid JSON) then nemotron-3.5-lightning-30b
 * (3–4 s, valid JSON). AI_FALLBACK_MODELS replaces the list, comma-separated.
 */

const DEFAULT_FALLBACKS = ["nvidia/nemotron-3-ultra-550b-a55b", "nvidia/nemotron-3.5-lightning-30b-a3b"];

export const FALLBACK_MODELS: readonly string[] = (() => {
  const set = (process.env["AI_FALLBACK_MODELS"] ?? "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  return set.length ? set : DEFAULT_FALLBACKS;
})();

/** How long a model that answered "gone" is skipped before it is tried again. */
export const UNAVAILABLE_FOR_MS = 60 * 60_000;

const unavailableUntil = new Map<string, number>();

/** A provider answer that says the model itself is not there, as opposed to busy or broken. */
export function isModelUnavailable(status: number, detail: string): boolean {
  if (status === 410) return true;
  if (status === 404) return /not found|does not exist|no such model|unknown model/i.test(detail);
  if (status === 400) return /model\b.*\b(not found|does not exist|not available|unsupported)/i.test(detail);
  return false;
}

export function markUnavailable(model: string, now = Date.now()): void {
  const known = (unavailableUntil.get(model) ?? 0) > now;
  unavailableUntil.set(model, now + UNAVAILABLE_FOR_MS);
  if (!known) console.warn(`[ai] model ${model} is unavailable; using the next of ${FALLBACK_MODELS.join(", ")} for the next hour`);
}

/**
 * The model to send for a request that asked for `wanted`: it, unless it was
 * found gone within the hour, else the first fallback that was not — skipping
 * any already tried for this request. Null when every one has been tried.
 */
export function usableModel(wanted: string, tried: ReadonlySet<string> = new Set(), now = Date.now()): string | null {
  const chain = [...new Set([wanted, ...FALLBACK_MODELS])].filter((m) => !tried.has(m));
  return chain.find((m) => (unavailableUntil.get(m) ?? 0) <= now) ?? chain[0] ?? null;
}

/** The model a request for `wanted` would go to now — for recording beside a stored answer. */
export const currentModel = (wanted: string): string => usableModel(wanted) ?? wanted;

/**
 * Send with `send(model)`; on a "model gone" answer, mark it and send again on
 * the next model. Returns the last response (ok or not) and the model it came
 * from. The response body is unread unless it was a "gone" answer.
 */
export async function fetchWithModelFallback(wanted: string, send: (model: string) => Promise<Response>): Promise<{ response: Response; model: string }> {
  const tried = new Set<string>();
  for (;;) {
    const model = usableModel(wanted, tried) ?? wanted;
    tried.add(model);
    const response = await send(model);
    if (response.ok) return { response, model };
    const detail = await response
      .clone()
      .text()
      .catch(() => "");
    if (!isModelUnavailable(response.status, detail)) return { response, model };
    markUnavailable(model);
    if (usableModel(wanted, tried) == null) return { response, model };
  }
}

/** Test seam. */
export function resetModelAvailability(): void {
  unavailableUntil.clear();
}
