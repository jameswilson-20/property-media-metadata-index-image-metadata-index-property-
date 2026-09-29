import { createServer, type ServerResponse } from "node:http";
import { ZodError } from "zod";
import { InfraiError, InfraiMediaClient } from "./infrai_media_client.js";
import { buildMediaRecord, indexRequestSchema } from "./property_media_index.js";

const apiKey = process.env.INFRAI_API_KEY;
if (!apiKey) throw new Error("Set INFRAI_API_KEY before starting the service");

const client = new InfraiMediaClient(apiKey);

function json(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}

const server = createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/media/index") {
    json(response, 404, { error: "Route not found" });
    return;
  }

  try {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    const input = indexRequestSchema.parse(JSON.parse(Buffer.concat(chunks).toString("utf8")));

    await client.ensureBucket(input.bucket);
    const available = new Set(await client.listObjectKeys(input.bucket));
    const selected = input.assignments.filter((assignment) => available.has(assignment.key));
    const items = await Promise.all(selected.map(async (assignment) => {
      const metadata = await client.readImageMetadata(input.bucket, assignment.key);
      return buildMediaRecord(input, assignment, metadata);
    }));

    json(response, 200, {
      propertyId: input.propertyId,
      indexed: items.length,
      skipped: input.assignments.length - items.length,
      items
    });
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      json(response, 400, { error: "Invalid request body" });
      return;
    }
    if (error instanceof InfraiError) {
      const status = error.status >= 400 && error.status < 500 ? error.status : 502;
      json(response, status, { error: error.message, detail: error.detail });
      return;
    }
    json(response, 502, { error: error instanceof Error ? error.message : "Request failed" });
  }
});

const port = Number(process.env.PORT ?? 3000);
server.listen(port, () => console.log(`Property media index listening on http://localhost:${port}`));
