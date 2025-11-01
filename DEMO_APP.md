# easyGEO Demo Application

A beautiful, interactive frontend application to test the easyGEO HTML to Markdown API.

## Features

- **Live Converter** - Real-time HTML to Markdown conversion
- **Multiple Examples** - Pre-built examples to try instantly
- **API Documentation** - Built-in API reference
- **Statistics Display** - Shows input/output sizes and conversion time
- **Copy to Clipboard** - One-click copy of converted Markdown
- **Responsive Design** - Works on desktop and mobile devices
- **Beautiful UI** - Modern, gradient-based design

## Quick Start

### Option 1: Open Locally

Simply open `demo.html` in your web browser:

```bash
# On macOS
open demo.html

# On Linux
xdg-open demo.html

# On Windows
start demo.html
```

### Option 2: Serve with Python

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Then visit: http://localhost:8000/demo.html

### Option 3: Serve with Node.js

```bash
npx serve .
```

Then visit the URL shown in the terminal.

### Option 4: Deploy to GitHub Pages

1. Commit `demo.html` to your repository
2. Go to repository Settings → Pages
3. Select the branch and root folder
4. Your demo will be available at: `https://username.github.io/repository/demo.html`

## Usage

### Converter Tab

1. **Paste HTML** - Enter your HTML in the left textarea
2. **Set Options** - Configure base URL and conversion options
3. **Click Convert** - Press the "Convert to Markdown" button
4. **View Results** - See the Markdown output on the right
5. **Copy** - Use the "Copy Markdown" button to copy the result

**Keyboard Shortcut:** Ctrl+Enter to convert

### Examples Tab

Click any of the 8 pre-built examples to instantly load them into the converter:

- Basic Text
- Text Formatting
- Lists
- Tables
- Links & Images
- Code Blocks
- Blockquotes
- Complex Document

### API Docs Tab

View the complete API documentation including:
- Available endpoints
- Request/response formats
- Supported HTML elements
- Rate limits

## Features Explained

### Conversion Options

- **Include Images** - Convert `<img>` tags to Markdown image syntax
- **Include Links** - Convert `<a>` tags to Markdown link syntax
- **Include Tables** - Convert `<table>` elements to Markdown tables
- **Include Code Blocks** - Convert `<pre><code>` to Markdown code blocks

### Base URL

If your HTML contains relative URLs (e.g., `/images/logo.png`), enter a base URL (e.g., `https://example.com`) to convert them to absolute URLs.

### Statistics

After conversion, view:
- **Input Characters** - Number of characters in HTML input
- **Output Characters** - Number of characters in Markdown output
- **Conversion Time** - Time taken for API request in milliseconds

## Customization

The demo app is a single HTML file with embedded CSS and JavaScript, making it easy to customize:

### Change API URL

Find this line in the JavaScript section:
```javascript
const API_URL = 'https://easygeo.harsha-4cf.workers.dev';
```

Replace with your own API URL if needed.

### Modify Styling

All CSS is in the `<style>` section. The app uses:
- **Primary Color:** Purple gradient (#667eea to #764ba2)
- **Accent Color:** #667eea
- **Font:** System default (-apple-system, etc.)

### Add More Examples

Find the `examples` object in the JavaScript section and add your own:

```javascript
const examples = {
    // ... existing examples ...
    myExample: `<h1>My Example</h1>
<p>Custom HTML here</p>`
};
```

Then add a card in the examples grid:

```html
<div class="example-card" onclick="loadExample('myExample')">
    <div class="example-title">My Example</div>
    <div class="example-preview">Preview text...</div>
</div>
```

## Browser Compatibility

Works in all modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

Requires JavaScript enabled.

## File Structure

```
demo.html          - Single-file application
├── HTML           - Page structure
├── CSS            - Embedded styles
└── JavaScript     - API integration & interactivity
```

## API Integration

The app uses the Fetch API to communicate with the easyGEO API:

```javascript
const response = await fetch(`${API_URL}/convert`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        html: htmlInput,
        baseUrl: baseUrl || undefined,
        options: options
    })
});
```

## Troubleshooting

### "Access denied" Error

If you see this error, it means the API endpoint is protected. This is normal for the `/convert` endpoint in some configurations. The demo app should still work with proper authentication.

### CORS Errors

The API has CORS enabled, but if you're testing from `file://` protocol, some browsers may block requests. Use a local server instead (see Quick Start options).

### Conversion Not Working

1. Check browser console for errors (F12)
2. Verify the API URL is correct
3. Test the API directly with curl
4. Check your internet connection

## Screenshots

### Converter Tab
- Clean split-screen interface
- Real-time character counting
- Conversion statistics

### Examples Tab
- 8 ready-to-use examples
- Instant loading
- Visual preview

### API Docs Tab
- Complete endpoint documentation
- Request/response examples
- Supported elements list

## Performance

- **Lightweight** - Single 25KB HTML file (uncompressed)
- **Fast** - Typical conversion < 200ms
- **No Dependencies** - Pure HTML/CSS/JavaScript
- **Offline-Ready** - Works without internet (except API calls)

## Deployment Options

### Static Hosting

Deploy to any static hosting service:
- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages
- AWS S3
- Firebase Hosting

### CDN

Upload to a CDN and share the link directly.

### Embed

Embed in your existing website using an iframe:

```html
<iframe src="demo.html" width="100%" height="800px" frameborder="0"></iframe>
```

## License

Same as easyGEO - Apache License 2.0

## Support

- **GitHub Issues:** https://github.com/fanrenaz/easyGEO/issues
- **API Docs:** https://easygeo.harsha-4cf.workers.dev/
- **Repository:** https://github.com/fanrenaz/easyGEO
