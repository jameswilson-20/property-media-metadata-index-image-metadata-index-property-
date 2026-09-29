import { z } from "zod";
import type { ImageMetadata } from "./infrai_media_client.js";

export const indexRequestSchema = z.object({
  bucket: z.string().min(3).max(63).regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/),
  propertyId: z.string().min(1).max(80),
  assignments: z.array(z.object({
    key: z.string().min(1),
    recordType: z.enum(["maintenance_request", "tenant_document", "inspection_reminder"]),
    recordId: z.string().min(1).max(80)
  })).min(1)
});

export type IndexRequest = z.infer<typeof indexRequestSchema>;

export type IndexedMedia = {
  key: string;
  propertyId: string;
  recordType: IndexRequest["assignments"][number]["recordType"];
  recordId: string;
  width: number;
  height: number;
  format: string;
  orientation: "portrait" | "landscape" | "square";
};

export function buildMediaRecord(
  input: IndexRequest,
  assignment: IndexRequest["assignments"][number],
  metadata: ImageMetadata
): IndexedMedia {
  const orientation = metadata.width === metadata.height
    ? "square"
    : metadata.width > metadata.height ? "landscape" : "portrait";

  return {
    key: assignment.key,
    propertyId: input.propertyId,
    recordType: assignment.recordType,
    recordId: assignment.recordId,
    width: metadata.width,
    height: metadata.height,
    format: metadata.format.toLowerCase(),
    orientation
  };
}
