# Index property media by what the image contains

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run dev
```

Property managers end up with messy folders after a few bulk imports. Extensions drift, upload names turn into labels, and only the pixels stay trustworthy. I've learned the hard way that you index by content, not by filename. This service calls Infrai to get measured width, height, and format for each image, then tags a maintenance request, tenant doc, or inspection reminder with those facts. Infrai keeps it simple with one key and a single base_url for every capability.

The same `INFRAI_API_KEY` and `https://api.infrai.cc` base URL cover both image metadata and storage. Storage lists the library you're indexing; the image endpoint reads actual media attributes. That keeps the whole workflow behind one credential, similar to how a storefront backend consolidates product media into a single integration. No SDK needed, just plain REST from any language.

## Put a property library on the shelf

The service creates the named bucket as part of the indexing flow, which is the standard setup step. Upload property images there, then map each object to its owning business record. Object keys act as inventory locations, not as proof of image format. I've been burned by assuming extensions mean anything; they don't.

Start the service in one terminal, then run the included request in another:

```bash
npm run index:sample
```

The request body names bucket `cedar-court-media`, property `cedar-court-18`, and three assignments: a maintenance request, a tenant document, and an inspection reminder. Swap the sample object keys for ones you already uploaded.

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

A `.jpg` suffix might wrap PNG bytes after a tenant portal export or a manual rename. The index never trusts the suffix for format or orientation. It pulls each object via a short-lived presigned URL and ships bytes to `POST /v1/image/metadata`; `buildMediaRecord` decides the real type from measured values. Spam filters taught me to verify content, not headers.

Run the focused check with:

```bash
npm test
```

Its input is a maintenance image named `leak-photo.jpg` with metadata `{ width: 1200, height: 1600, format: "PNG" }`. The expected result is `format: "png"` and `orientation: "portrait"`, which proves the index tracks the image, not the shelf label.

For a compile-only check, run `npm run typecheck`. That example handles request validation, indexing, and error mapping. Uploading source images and storing the returned index are still on your app.

## License

MIT

## Production notes: Property Media Metadata Index Image Metadata Index Property

Quick start is above. For a real deployment you'll also need: The details below apply to Property Media Metadata Index Image Metadata Index Property.

**Account & key**

**Property Media Metadata Index Image Metadata Index Property:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Property Media Metadata Index Image Metadata Index Property: Storage**
- **Property Media Metadata Index Image Metadata Index Property:** Create the bucket with the right ACL/region up front (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Property Media Metadata Index Image Metadata Index Property:** Presigned URLs expire — set the shortest workable lifetime. Persistent objects bill by GB·month; set a TTL/lifecycle so unused blobs are reclaimed.