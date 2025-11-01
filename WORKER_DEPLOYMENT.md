# easyGEO Cloudflare Worker Deployment

This document provides instructions for deploying the easyGEO HTML to Markdown converter as a Cloudflare Worker.

## Overview

The easyGEO Worker provides a simple REST API to convert HTML content to Markdown format. It's built to run on Cloudflare's global edge network for fast, reliable conversions.

## Prerequisites

Before deploying, you'll need:

1. A Cloudflare account (free tier works fine)
2. Node.js installed (v18 or higher recommended)
3. npm or yarn package manager

## Installation

1. Install dependencies:
```bash
npm install
```

## Deployment

### First-time Setup

1. Authenticate with Cloudflare:
```bash
npx wrangler login
```

This will open your browser to authenticate with your Cloudflare account.

### Deploy to Production

Deploy the worker to Cloudflare:

```bash
npm run deploy
```

Or for production environment specifically:

```bash
npm run deploy:production
```

After deployment, Wrangler will provide you with the worker URL (e.g., `https://easygeo-html2md.your-subdomain.workers.dev`).

## Local Development

To test the worker locally:

```bash
npm run dev
```

This starts a local development server at `http://localhost:8787`.

## API Endpoints

### 1. Root Endpoint - API Documentation
**GET /**

Returns API documentation in JSON format.

### 2. Health Check
**GET /health**

Returns health status:
```json
{
  "status": "healthy",
  "timestamp": "2024-11-01T12:00:00.000Z"
}
```

### 3. Convert HTML to Markdown
**POST /convert**

Converts HTML content to Markdown.

**Request Body:**
```json
{
  "html": "<h1>Hello World</h1><p>This is a <strong>test</strong>.</p>",
  "baseUrl": "https://example.com",
  "options": {
    "includeImages": true,
    "includeLinks": true,
    "includeTables": true,
    "includeCodeBlocks": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "markdown": "# Hello World\n\nThis is a **test**.",
  "length": 35
}
```

## Usage Examples

### Using cURL

```bash
curl -X POST https://easygeo-html2md.your-subdomain.workers.dev/convert \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<h1>Hello World</h1><p>This is a <strong>test</strong>.</p>",
    "baseUrl": "https://example.com"
  }'
```

### Using JavaScript/Fetch

```javascript
const response = await fetch('https://easygeo-html2md.your-subdomain.workers.dev/convert', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    html: '<h1>Hello World</h1><p>This is a <strong>test</strong>.</p>',
    baseUrl: 'https://example.com',
    options: {
      includeImages: true,
      includeLinks: true,
      includeTables: true
    }
  })
});

const data = await response.json();
console.log(data.markdown);
```

### Using Python

```python
import requests

url = 'https://easygeo-html2md.your-subdomain.workers.dev/convert'
payload = {
    'html': '<h1>Hello World</h1><p>This is a <strong>test</strong>.</p>',
    'baseUrl': 'https://example.com'
}

response = requests.post(url, json=payload)
result = response.json()
print(result['markdown'])
```

## Configuration

Edit `wrangler.toml` to customize:

- `name`: Worker name
- `compatibility_date`: Cloudflare Workers compatibility date
- `limits.cpu_ms`: Maximum CPU time per request

## Features

The HTML to Markdown converter supports:

- ✅ Headings (h1-h6)
- ✅ Paragraphs and line breaks
- ✅ Text formatting (bold, italic, underline, strikethrough)
- ✅ Code blocks and inline code
- ✅ Lists (ordered, unordered, description)
- ✅ Links and images
- ✅ Tables
- ✅ Blockquotes
- ✅ Form elements representation
- ✅ HTML5 semantic elements
- ✅ CORS support

## Monitoring

View real-time logs:

```bash
npm run tail
```

## Troubleshooting

### Authentication Issues

If you get authentication errors, run:
```bash
npx wrangler login
```

### Deployment Fails

1. Check that you have a valid Cloudflare account
2. Verify your account has Workers enabled
3. Ensure `wrangler.toml` has valid configuration

### Worker Not Responding

1. Check worker status in Cloudflare dashboard
2. View logs with `npm run tail`
3. Test locally with `npm run dev`

## Cost

Cloudflare Workers free tier includes:
- 100,000 requests per day
- 10ms CPU time per request
- Up to 30 workers

The easyGEO worker is optimized to stay within these limits.

## Support

For issues or questions:
- GitHub Issues: https://github.com/fanrenaz/easyGEO/issues
- Cloudflare Workers Docs: https://developers.cloudflare.com/workers/

## License

Apache License 2.0 - See LICENSE file for details.
