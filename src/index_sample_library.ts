const body = {
  bucket: process.env.PROPERTY_MEDIA_BUCKET ?? "cedar-court-media",
  propertyId: "cedar-court-18",
  assignments: [
    { key: "unit-4/leak-evidence.bin", recordType: "maintenance_request", recordId: "maint-204" },
    { key: "unit-4/lease-scan.upload", recordType: "tenant_document", recordId: "lease-88" },
    { key: "unit-4/smoke-alarm-check.asset", recordType: "inspection_reminder", recordId: "inspect-31" }
  ]
};

const response = await fetch("http://localhost:3000/media/index", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body)
});

console.log(JSON.stringify(await response.json(), null, 2));
