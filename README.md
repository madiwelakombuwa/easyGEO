# easyGEO
easyGEO is an open-source tool designed to help websites achieve GEO (Generative Engine Optimization). With easyGEO, you can effortlessly convert your website's HTML content into Markdown format—paving the way for generative engines and optimized content management.

## Features

### ✅ Cloudflare Workers API (NEW!)
Deploy easyGEO as a serverless API on Cloudflare's global network! The Worker provides a REST API to convert HTML to Markdown with:
- 🚀 Fast global edge deployment
- 🔄 RESTful API endpoints
- 🌐 CORS support for web applications
- 📦 Comprehensive HTML element support
- 🆓 Free tier available (100,000 requests/day)

See [WORKER_DEPLOYMENT.md](WORKER_DEPLOYMENT.md) for deployment instructions.

### ✅ HTML to Markdown Conversion (Chrome Extension)
The core HTML to Markdown conversion functionality is already implemented as a Chrome extension!
You can find it in the html2md-chrome-extension folder.
Download and install to start converting HTML to Markdown right away.
The implementation is inspired by html2md-chrome-extension .

### Upcoming Features:
- Full Site Conversion: Automatically fetch and convert all website content to Markdown files.
- Sitemap Integration: Generate a sitemap that includes indexes of your Markdown content for improved parsing and engine optimization.

## Installation

### Cloudflare Workers Deployment

1. Install dependencies:
```bash
npm install
```

2. Deploy to Cloudflare Workers:
```bash
# Set your Cloudflare API token
export CLOUDFLARE_API_TOKEN=your_api_token_here

# Deploy
npm run deploy
```

For detailed deployment instructions, see [WORKER_DEPLOYMENT.md](WORKER_DEPLOYMENT.md).

### Chrome Extension

For HTML to Markdown conversion in your browser,
go to html2md-chrome-extension for installation instructions and usage.

## Usage

### Cloudflare Worker API

Once deployed, use the API to convert HTML to Markdown:

```bash
curl -X POST https://your-worker.workers.dev/convert \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<h1>Hello World</h1><p>This is a <strong>test</strong>.</p>",
    "baseUrl": "https://example.com"
  }'
```

Response:
```json
{
  "success": true,
  "markdown": "# Hello World\n\nThis is a **test**.",
  "length": 35
}
```

### API Endpoints

- `GET /` - API documentation
- `GET /health` - Health check
- `POST /convert` - Convert HTML to Markdown

See [WORKER_DEPLOYMENT.md](WORKER_DEPLOYMENT.md) for complete API documentation and examples.

### Chrome Extension

See html2md-chrome-extension for details on using the browser extension.

## Contributing
We welcome your feedback and contributions!

Found a bug or have a feature suggestion? Open an issue .
Want to contribute code? Please submit a pull request!

## License
easyGEO is licensed under the Apache License 2.0 .
