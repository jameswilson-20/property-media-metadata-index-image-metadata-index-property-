import test from "node:test";
import assert from "node:assert/strict";
import { buildMediaRecord, indexRequestSchema } from "../src/property_media_index.js";

test("indexes a misleading filename from measured image metadata", () => {
  const input = indexRequestSchema.parse({
    bucket: "cedar-court-media",
    propertyId: "cedar-court-18",
    assignments: [{
      key: "unit-4/leak-photo.jpg",
      recordType: "maintenance_request",
      recordId: "maint-204"
    }]
  });

  const record = buildMediaRecord(input, input.assignments[0], {
    width: 1200,
    height: 1600,
    format: "PNG"
  });

  assert.equal(record.format, "png");
  assert.equal(record.orientation, "portrait");
  assert.equal(record.recordType, "maintenance_request");
});
