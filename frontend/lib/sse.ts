import { createParser, type ParsedEvent, type ReconnectInterval } from "eventsource-parser";

/** Parse a fetch streaming response into SSE data tokens; abort is respected by the caller's signal. */
export async function* parseSse(response: Response, signal?: AbortSignal): AsyncGenerator<string, void, undefined> {
  if (!response.ok || !response.body) throw new Error("The biographer could not begin the conversation.");
  const tokens: string[] = [];
  let failure: Error | null = null;
  const parser = createParser((event: ParsedEvent | ReconnectInterval) => { if (event.type === "event" && event.event !== "done" && event.event !== "warning") tokens.push(event.data); if (event.type === "event" && event.event === "warning") failure = new Error(event.data); });
  const reader = response.body.getReader(); const decoder = new TextDecoder();
  try { while (true) { if (signal?.aborted) return; const { done, value } = await reader.read(); parser.feed(decoder.decode(value ?? new Uint8Array(), { stream: !done })); while (tokens.length) yield tokens.shift() ?? ""; if (failure) throw failure; if (done) break; } } finally { reader.releaseLock(); }
}
