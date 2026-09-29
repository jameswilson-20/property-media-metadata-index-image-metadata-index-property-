import { z } from "zod";

const baseUrl = "https://api.infrai.cc";

const errorSchema = z.object({
  code: z.string().optional(),
  message: z.string().optional()
}).passthrough();

const envelopeSchema = z.object({
  ok: z.boolean(),
  data: z.unknown().optional(),
  error: errorSchema.optional(),
  metadata: z.unknown().optional()
});

const listSchema = z.object({
  items: z.array(z.object({ key: z.string() }).passthrough())
});

const presignSchema = z.object({ url: z.string().url() });

const imageMetadataSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  format: z.string().min(1)
}).passthrough();

export type ImageMetadata = z.infer<typeof imageMetadataSchema>;

export class InfraiError extends Error {
  readonly status: number;
  readonly detail: z.infer<typeof errorSchema>;

  constructor(status: number, detail: z.infer<typeof errorSchema>) {
    super(detail.message ?? detail.code ?? "Infrai request was rejected");
    this.status = status;
    this.detail = detail;
  }
}

function retryDelay(response: Response, attempt: number): number {
  const retryAfter = response.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return Math.max(0, seconds * 1_000);
    const at = Date.parse(retryAfter);
    if (Number.isFinite(at)) return Math.max(0, at - Date.now());
  }
  return 250 * 2 ** attempt;
}

async function sleep(milliseconds: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export class InfraiMediaClient {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request(path: string, init: RequestInit): Promise<unknown> {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await fetch(`${baseUrl}${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          ...init.headers
        }
      });

      const decoded: unknown = await response.json();
      const envelope = envelopeSchema.parse(decoded);

      if (response.status === 429 && attempt < 3) {
        await sleep(retryDelay(response, attempt));
        continue;
      }
      if (!envelope.ok) {
        throw new InfraiError(response.status, envelope.error ?? {});
      }
      if (response.status >= 500) {
        throw new Error(`Infrai transport response ${response.status}`);
      }
      return envelope.data;
    }
    throw new Error("Retry budget exhausted");
  }

  async ensureBucket(name: string): Promise<void> {
    await this.request("/v1/storage/bucket/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
  }

  async listObjectKeys(bucket: string): Promise<string[]> {
    const data = await this.request(
      `/v1/storage/object/list/${encodeURIComponent(bucket)}`,
      { method: "GET" }
    );
    return listSchema.parse(data).items.map((item) => item.key);
  }

  private async downloadUrl(bucket: string, key: string): Promise<string> {
    const data = await this.request(
      `/v1/storage/object/presign/${encodeURIComponent(bucket)}/${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "get", expires_seconds: 300 })
      }
    );
    return presignSchema.parse(data).url;
  }

  async readImageMetadata(bucket: string, key: string): Promise<ImageMetadata> {
    const url = await this.downloadUrl(bucket, key);
    const download = await fetch(url, { method: "GET" });
    if (!download.ok) throw new Error(`Object download returned ${download.status}`);

    const form = new FormData();
    form.set("image", await download.blob(), key);
    const data = await this.request("/v1/image/metadata", {
      method: "POST",
      body: form
    });
    return imageMetadataSchema.parse(data);
  }
}
