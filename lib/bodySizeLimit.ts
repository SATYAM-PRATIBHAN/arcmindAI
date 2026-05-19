export class BodyTooLargeError extends Error {
  constructor(public limit: number) {
    super(`Request body exceeded ${limit} bytes`);
    this.name = "BodyTooLargeError";
  }
}

export async function bodySizeLimit<T = unknown>(
  req: Request,
  maxBytes: number,
): Promise<T> {
  if (!req.body) {
    return {} as T;
  }

  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      throw new BodyTooLargeError(maxBytes);
    }
    chunks.push(value);
  }

  const buf = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    buf.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(buf)) as T;
}
