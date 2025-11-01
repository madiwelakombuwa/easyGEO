# easyGEO API Usage Examples

Your easyGEO Worker is deployed at: **https://easygeo.harsha-4cf.workers.dev/**

## Quick Start

### 1. Check API Status

```bash
curl https://easygeo.harsha-4cf.workers.dev/
```

**Response:**
```json
{
  "name": "easyGEO HTML to Markdown API",
  "version": "1.0.0",
  "description": "Convert HTML content to Markdown format",
  "endpoints": {
    "/convert": { ... },
    "/health": { ... }
  }
}
```

### 2. Health Check

```bash
curl https://easygeo.harsha-4cf.workers.dev/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-01T20:00:00.000Z"
}
```

## Converting HTML to Markdown

### Basic Example

```bash
curl -X POST https://easygeo.harsha-4cf.workers.dev/convert \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<h1>Hello World</h1><p>This is a <strong>test</strong>.</p>"
  }'
```

**Response:**
```json
{
  "success": true,
  "markdown": "# Hello World\n\nThis is a **test**.",
  "length": 35
}
```

### With Base URL for Relative Links

```bash
curl -X POST https://easygeo.harsha-4cf.workers.dev/convert \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<a href=\"/about\">About</a> <img src=\"/logo.png\" alt=\"Logo\">",
    "baseUrl": "https://example.com"
  }'
```

**Response:**
```json
{
  "success": true,
  "markdown": "[About](https://example.com/about) ![Logo](https://example.com/logo.png)",
  "length": 68
}
```

### Complex HTML with Lists and Code

```bash
curl -X POST https://easygeo.harsha-4cf.workers.dev/convert \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<h2>Features</h2><ul><li>Fast</li><li>Reliable</li></ul><pre><code>console.log(\"Hello\");</code></pre>"
  }'
```

**Response:**
```json
{
  "success": true,
  "markdown": "## Features\n\n- Fast\n- Reliable\n\n```\nconsole.log(\"Hello\");\n```",
  "length": 65
}
```

### With Custom Options

```bash
curl -X POST https://easygeo.harsha-4cf.workers.dev/convert \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<p>Text with <img src=\"image.jpg\"> image</p>",
    "options": {
      "includeImages": false,
      "includeLinks": true
    }
  }'
```

## JavaScript/Node.js Examples

### Using Fetch API

```javascript
async function convertHtmlToMarkdown(html) {
  const response = await fetch('https://easygeo.harsha-4cf.workers.dev/convert', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      html: html,
      baseUrl: 'https://example.com'
    })
  });

  const data = await response.json();
  return data.markdown;
}

// Usage
const markdown = await convertHtmlToMarkdown('<h1>Hello</h1><p>World</p>');
console.log(markdown);
```

### Using Axios

```javascript
const axios = require('axios');

async function convertHtml(html) {
  try {
    const response = await axios.post('https://easygeo.harsha-4cf.workers.dev/convert', {
      html: html,
      baseUrl: 'https://example.com',
      options: {
        includeImages: true,
        includeTables: true
      }
    });

    console.log('Markdown:', response.data.markdown);
    console.log('Length:', response.data.length);
  } catch (error) {
    console.error('Conversion failed:', error.response.data);
  }
}

convertHtml('<h1>My Document</h1><p>Content here</p>');
```

## Python Examples

### Using Requests

```python
import requests
import json

def convert_html_to_markdown(html, base_url=None):
    url = 'https://easygeo.harsha-4cf.workers.dev/convert'

    payload = {
        'html': html,
        'baseUrl': base_url,
        'options': {
            'includeImages': True,
            'includeLinks': True,
            'includeTables': True
        }
    }

    response = requests.post(url, json=payload)

    if response.status_code == 200:
        data = response.json()
        return data['markdown']
    else:
        raise Exception(f"Conversion failed: {response.text}")

# Usage
html = '<h1>Hello World</h1><p>This is a <strong>test</strong>.</p>'
markdown = convert_html_to_markdown(html, 'https://example.com')
print(markdown)
```

### Using urllib (No External Dependencies)

```python
import urllib.request
import json

def convert_html(html_content):
    url = 'https://easygeo.harsha-4cf.workers.dev/convert'

    data = {
        'html': html_content
    }

    # Convert to JSON and encode
    json_data = json.dumps(data).encode('utf-8')

    # Create request
    req = urllib.request.Request(url)
    req.add_header('Content-Type', 'application/json')

    # Send request
    with urllib.request.urlopen(req, json_data) as response:
        result = json.loads(response.read().decode('utf-8'))
        return result['markdown']

# Usage
html = '<h2>Title</h2><ul><li>Item 1</li><li>Item 2</li></ul>'
markdown = convert_html(html)
print(markdown)
```

## PHP Example

```php
<?php

function convertHtmlToMarkdown($html, $baseUrl = null) {
    $url = 'https://easygeo.harsha-4cf.workers.dev/convert';

    $data = [
        'html' => $html,
        'baseUrl' => $baseUrl
    ];

    $options = [
        'http' => [
            'header'  => "Content-Type: application/json\r\n",
            'method'  => 'POST',
            'content' => json_encode($data)
        ]
    ];

    $context = stream_context_create($options);
    $result = file_get_contents($url, false, $context);

    $response = json_decode($result, true);
    return $response['markdown'];
}

// Usage
$html = '<h1>Hello</h1><p>This is <strong>bold</strong> text.</p>';
$markdown = convertHtmlToMarkdown($html, 'https://example.com');
echo $markdown;

?>
```

## Ruby Example

```ruby
require 'net/http'
require 'json'
require 'uri'

def convert_html_to_markdown(html, base_url = nil)
  uri = URI.parse('https://easygeo.harsha-4cf.workers.dev/convert')

  request = Net::HTTP::Post.new(uri)
  request.content_type = 'application/json'
  request.body = JSON.dump({
    'html' => html,
    'baseUrl' => base_url
  })

  response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
    http.request(request)
  end

  result = JSON.parse(response.body)
  result['markdown']
end

# Usage
html = '<h1>Welcome</h1><p>This is a <em>test</em>.</p>'
markdown = convert_html_to_markdown(html, 'https://example.com')
puts markdown
```

## Advanced Usage

### Converting a Web Page

```javascript
async function convertWebPage(url) {
  // Fetch the HTML
  const response = await fetch(url);
  const html = await response.text();

  // Convert to Markdown
  const convertResponse = await fetch('https://easygeo.harsha-4cf.workers.dev/convert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      html: html,
      baseUrl: url
    })
  });

  const data = await convertResponse.json();
  return data.markdown;
}

// Usage
const markdown = await convertWebPage('https://example.com/article');
console.log(markdown);
```

### Batch Processing

```python
import requests
import json

def batch_convert(html_snippets):
    url = 'https://easygeo.harsha-4cf.workers.dev/convert'
    results = []

    for html in html_snippets:
        response = requests.post(url, json={'html': html})
        if response.status_code == 200:
            results.append(response.json()['markdown'])
        else:
            results.append(None)

    return results

# Usage
snippets = [
    '<h1>Article 1</h1><p>Content</p>',
    '<h1>Article 2</h1><p>More content</p>',
    '<h1>Article 3</h1><p>Even more</p>'
]

markdowns = batch_convert(snippets)
for i, md in enumerate(markdowns, 1):
    print(f"Article {i}:\n{md}\n")
```

## Error Handling

### Example Error Response

```json
{
  "error": "Missing required field: html"
}
```

### Handling Errors in JavaScript

```javascript
async function safeConvert(html) {
  try {
    const response = await fetch('https://easygeo.harsha-4cf.workers.dev/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html })
    });

    const data = await response.json();

    if (data.error) {
      console.error('Conversion error:', data.error);
      return null;
    }

    return data.markdown;
  } catch (error) {
    console.error('Network error:', error);
    return null;
  }
}
```

## Rate Limits

Cloudflare Workers free tier includes:
- **100,000 requests per day**
- **10ms CPU time per request**

For higher usage, consider upgrading to Cloudflare Workers Paid plan.

## Support

- **API Documentation:** https://easygeo.harsha-4cf.workers.dev/
- **GitHub Issues:** https://github.com/fanrenaz/easyGEO/issues
- **Repository:** https://github.com/fanrenaz/easyGEO

## License

Apache License 2.0
