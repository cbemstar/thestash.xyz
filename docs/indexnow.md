# IndexNow Setup (The Stash)

This app supports IndexNow with:

- Public key file: `/66fe03ab51b74009a5f89604f17ee609.txt`
- Manual trigger endpoint: `POST /api/indexnow`
- Automatic submit on `POST /api/resources` publish

## 1) Environment variables

Set these in your deployment environment:

- `INDEXNOW_KEY=66fe03ab51b74009a5f89604f17ee609`
- `INDEXNOW_WEBHOOK_SECRET=<strong-random-secret>`

Optional:

- `INDEXNOW_KEY_LOCATION=https://www.thestash.xyz/66fe03ab51b74009a5f89604f17ee609.txt`
- `INDEXNOW_ENDPOINT=https://api.indexnow.org/indexnow`

## 2) Verify key file

```bash
curl -sS https://www.thestash.xyz/66fe03ab51b74009a5f89604f17ee609.txt
```

Expected body:

```text
66fe03ab51b74009a5f89604f17ee609
```

## 3) Trigger IndexNow manually

```bash
curl -sS -X POST "https://www.thestash.xyz/api/indexnow" \
  -H "content-type: application/json" \
  -H "x-indexnow-secret: $INDEXNOW_WEBHOOK_SECRET" \
  --data '{"urls":["https://www.thestash.xyz/sitemap.xml","https://www.thestash.xyz/"]}'
```

## 4) Optional: submit a specific changed URL

```bash
curl -sS -X POST "https://www.thestash.xyz/api/indexnow" \
  -H "content-type: application/json" \
  -H "x-indexnow-secret: $INDEXNOW_WEBHOOK_SECRET" \
  --data '{"url":"https://www.thestash.xyz/collections/best-development-tools"}'
```

