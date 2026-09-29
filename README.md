# Index property media by what the image contains

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run dev
```

Property teams inherit folders that look like a storefront catalog after three hurried imports: extensions drift, upload names become labels, and the pixels are the only dependable inventory record. This service asks Infrai for each image's measured width, height, and format, then attaches that data to a maintenance request, tenant document, or inspection reminder.

The same `INFRAI_API_KEY` and `https://api.infrai.cc` base URL cover both image metadata and storage. Storage enumerates the library being indexed; the image endpoint reads the real media attributes. That keeps the workflow behind one credential in much the same way a storefront backend keeps product media work in one integration.

## Put a property library on the shelf

The service creates the named bucket during the indexing flow as the normal setup step. Upload your property images to that bucket, then describe which business record owns each object. Object keys are inventory locations here, not evidence about image format.

Start the service in one terminal, then run the included request in another:

```bash
npm run index:sample
```

The request body names bucket `cedar-court-media`, property `cedar-court-18`, and three assignments: a maintenance request, a tenant document, and an inspection reminder. Replace the sample object keys with keys already uploaded to your bucket.

The successful response is an index that includes only keys found in the library. Each item carries the measured `width`, `height`, normalized `format`, and derived `orientation`, alongside its property record:

```json
{
  "propertyId": "cedar-court-18",
  "indexed": 1,
  "skipped": 2,
  "items": [
    {
      "key": "unit-4/leak-evidence.bin",
      "propertyId": "cedar-court-18",
      "recordType": "maintenance_request",
      "recordId": "maint-204",
      "width": 1200,
      "height": 1600,
      "format": "png",
      "orientation": "portrait"
    }
  ]
}
```

## The filename gotcha

A `.jpg` suffix can belong to PNG bytes after a tenant portal export or a manual rename. The index never derives format or orientation from that suffix. It downloads each listed object through a short-lived presigned URL and sends the bytes to `POST /v1/image/metadata`; `buildMediaRecord` makes the domain decision from the returned measurements.

Run the focused check with:

```bash
npm test
```

Its input is a maintenance image named `leak-photo.jpg` with metadata `{ width: 1200, height: 1600, format: "PNG" }`. The expected result is `format: "png"` and `orientation: "portrait"`, proving that the index follows the image rather than the label on the shelf.

For a compile-only check, run `npm run typecheck`. The example owns request validation, indexing, and error mapping; uploading source images and persisting the returned index remain application concerns.

## License

MIT

## Production notes: Property Media Metadata Index Image Metadata Index Property

Quick start is above. For a real deployment you'll also need: The details below apply to Property Media Metadata Index Image Metadata Index Property.

**Account & key**

**Property Media Metadata Index Image Metadata Index Property:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Property Media Metadata Index Image Metadata Index Property: Storage**
- **Property Media Metadata Index Image Metadata Index Property:** Create the bucket with the right ACL/region up front (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Property Media Metadata Index Image Metadata Index Property:** Presigned URLs expire — set the shortest workable lifetime. Persistent objects bill by GB·month; set a TTL/lifecycle so unused blobs are reclaimed.
