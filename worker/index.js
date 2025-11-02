// easyGEO Cloudflare Worker - HTML to Markdown API
// This worker provides an API endpoint to convert HTML to Markdown

import { parseHTML } from 'linkedom';

class HTML2Markdown {
    constructor(options = {}) {
        this.options = {
            preserveWhitespace: true,
            includeImages: true,
            includeLinks: true,
            includeTables: true,
            includeCodeBlocks: true,
            baseUrl: null, // Base URL for resolving relative URLs
            ...options
        };
    }

    convert(html) {
        // Use linkedom for DOM parsing in Workers environment
        const { document } = parseHTML(html);

        // Remove unwanted elements but preserve structure
        this.cleanDocument(document);

        // Get the body or fallback to entire document
        const rootElement = document.body || document.documentElement;

        // Convert to markdown
        let markdown = this.convertElement(rootElement);

        // Clean up the final markdown
        return this.cleanMarkdown(markdown);
    }

    cleanDocument(doc) {
        // Remove script, style, and meta elements
        const unwantedElements = doc.querySelectorAll('script, style, noscript, meta, link[rel="stylesheet"]');
        unwantedElements.forEach(el => el.remove());

        // Remove comments
        const walker = doc.createTreeWalker(
            doc.body || doc.documentElement,
            128, // NodeFilter.SHOW_COMMENT
            null,
            false
        );

        const comments = [];
        let node;
        while (node = walker.nextNode()) {
            comments.push(node);
        }
        comments.forEach(comment => comment.remove());
    }

    convertElement(element, context = { listDepth: 0, inTable: false }) {
        if (!element) return '';

        let result = '';

        for (const node of element.childNodes) {
            if (node.nodeType === 3) { // TEXT_NODE
                const text = node.textContent;
                if (text.trim() || context.inTable) {
                    result += this.processTextNode(text, context);
                }
            } else if (node.nodeType === 1) { // ELEMENT_NODE
                result += this.convertElementNode(node, context);
            }
        }

        return result;
    }

    processTextNode(text, context) {
        if (context.inTable) {
            return text.replace(/\n/g, ' ').replace(/\s+/g, ' ');
        }
        return text;
    }

    convertElementNode(node, context) {
        const tagName = node.tagName.toLowerCase();
        const content = this.convertElement(node, { ...context, inTable: context.inTable || tagName === 'table' });

        switch (tagName) {
            // Headings
            case 'h1': return this.formatHeading(content, 1);
            case 'h2': return this.formatHeading(content, 2);
            case 'h3': return this.formatHeading(content, 3);
            case 'h4': return this.formatHeading(content, 4);
            case 'h5': return this.formatHeading(content, 5);
            case 'h6': return this.formatHeading(content, 6);

            // Paragraphs and breaks
            case 'p': return this.formatParagraph(content);
            case 'br': return '\n';
            case 'hr': return '\n\n---\n\n';

            // Text formatting
            case 'strong':
            case 'b': return this.formatStrong(content);
            case 'em':
            case 'i': return this.formatEmphasis(content);
            case 'u': return this.formatUnderline(content);
            case 'del':
            case 's':
            case 'strike': return this.formatStrikethrough(content);
            case 'mark': return this.formatHighlight(content);
            case 'sup': return this.formatSuperscript(content);
            case 'sub': return this.formatSubscript(content);

            // Code
            case 'code': return this.formatInlineCode(content);
            case 'pre': return this.formatCodeBlock(node);
            case 'kbd': return this.formatKeyboard(content);
            case 'samp': return this.formatSample(content);
            case 'var': return this.formatVariable(content);

            // Lists
            case 'ul': return this.formatUnorderedList(content, context);
            case 'ol': return this.formatOrderedList(content, context);
            case 'li': return this.formatListItem(content, node, context);
            case 'dl': return this.formatDescriptionList(content);
            case 'dt': return this.formatDescriptionTerm(content);
            case 'dd': return this.formatDescriptionDefinition(content);

            // Links and media
            case 'a': return this.formatLink(node, content);
            case 'img': return this.formatImage(node);
            case 'figure': return this.formatFigure(node, content);
            case 'figcaption': return this.formatFigureCaption(content);

            // Tables
            case 'table': return this.formatTable(node);
            case 'thead': return content;
            case 'tbody': return content;
            case 'tfoot': return content;
            case 'tr': return content;
            case 'th':
            case 'td': return content;

            // Quotes and citations
            case 'blockquote': return this.formatBlockquote(content);
            case 'q': return this.formatQuote(content);
            case 'cite': return this.formatCitation(content);

            // Sections and structure
            case 'div':
            case 'section':
            case 'article':
            case 'main':
            case 'header':
            case 'footer':
            case 'nav':
            case 'aside':
            case 'address': return content;

            // Spans and inline elements
            case 'span':
            case 'small':
            case 'time':
            case 'abbr':
            case 'acronym': return content;

            // Form elements
            case 'input': return this.formatInput(node);
            case 'textarea': return this.formatTextarea(node);
            case 'select': return this.formatSelect(node);
            case 'button': return this.formatButton(node, content);
            case 'label': return this.formatLabel(content);

            // Details and summary
            case 'details': return this.formatDetails(node, content);
            case 'summary': return this.formatSummary(content);

            default:
                return content;
        }
    }

    // Formatting methods
    formatHeading(content, level) {
        const trimmed = content.trim();
        if (!trimmed) return '';
        const prefix = '#'.repeat(level);
        return `\n\n${prefix} ${trimmed}\n\n`;
    }

    formatParagraph(content) {
        const trimmed = content.trim();
        if (!trimmed) return '';
        return `\n\n${trimmed}\n\n`;
    }

    formatStrong(content) {
        const trimmed = content.trim();
        return trimmed ? `**${trimmed}**` : content;
    }

    formatEmphasis(content) {
        const trimmed = content.trim();
        return trimmed ? `*${trimmed}*` : content;
    }

    formatUnderline(content) {
        const trimmed = content.trim();
        return trimmed ? `<u>${trimmed}</u>` : content;
    }

    formatStrikethrough(content) {
        const trimmed = content.trim();
        return trimmed ? `~~${trimmed}~~` : content;
    }

    formatHighlight(content) {
        const trimmed = content.trim();
        return trimmed ? `==${trimmed}==` : content;
    }

    formatSuperscript(content) {
        const trimmed = content.trim();
        return trimmed ? `^${trimmed}^` : content;
    }

    formatSubscript(content) {
        const trimmed = content.trim();
        return trimmed ? `~${trimmed}~` : content;
    }

    formatInlineCode(content) {
        const trimmed = content.trim();
        return trimmed ? `\`${trimmed}\`` : content;
    }

    formatCodeBlock(node) {
        const content = node.textContent || '';
        const language = this.getCodeLanguage(node);
        return `\n\n\`\`\`${language}\n${content}\n\`\`\`\n\n`;
    }

    formatKeyboard(content) {
        const trimmed = content.trim();
        return trimmed ? `<kbd>${trimmed}</kbd>` : content;
    }

    formatSample(content) {
        const trimmed = content.trim();
        return trimmed ? `\`${trimmed}\`` : content;
    }

    formatVariable(content) {
        const trimmed = content.trim();
        return trimmed ? `*${trimmed}*` : content;
    }

    formatUnorderedList(content, context) {
        return `\n\n${content}\n\n`;
    }

    formatOrderedList(content, context) {
        return `\n\n${content}\n\n`;
    }

    formatListItem(content, node, context) {
        const parentTag = node.parentElement?.tagName.toLowerCase();
        const trimmed = content.trim();

        if (parentTag === 'ul') {
            return `${'  '.repeat(context.listDepth)}- ${trimmed}\n`;
        } else if (parentTag === 'ol') {
            const index = Array.from(node.parentElement.children).indexOf(node) + 1;
            return `${'  '.repeat(context.listDepth)}${index}. ${trimmed}\n`;
        }

        return trimmed;
    }

    formatDescriptionList(content) {
        return `\n\n${content}\n\n`;
    }

    formatDescriptionTerm(content) {
        const trimmed = content.trim();
        return trimmed ? `**${trimmed}**\n` : '';
    }

    formatDescriptionDefinition(content) {
        const trimmed = content.trim();
        return trimmed ? `: ${trimmed}\n\n` : '';
    }

    formatLink(node, content) {
        if (!this.options.includeLinks) return content;

        const href = node.getAttribute('href');
        const title = node.getAttribute('title');
        const trimmed = content.trim();

        if (!href || !trimmed) return content;

        // Handle relative URLs
        let url = this.resolveUrl(href);

        if (title) {
            return `[${trimmed}](${url} "${title}")`;
        }

        return `[${trimmed}](${url})`;
    }

    formatImage(node) {
        if (!this.options.includeImages) return '';

        const src = node.getAttribute('src');
        const alt = node.getAttribute('alt') || '';
        const title = node.getAttribute('title');

        if (!src) return '';

        // Handle relative URLs
        let url = this.resolveUrl(src);

        if (title) {
            return `![${alt}](${url} "${title}")`;
        }

        return `![${alt}](${url})`;
    }

    resolveUrl(url) {
        if (!url) return url;

        // Already absolute URL
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }

        // Protocol-relative URL
        if (url.startsWith('//')) {
            return 'https:' + url;
        }

        // Relative URL - need base URL
        if (this.options.baseUrl && url.startsWith('/')) {
            try {
                const base = new URL(this.options.baseUrl);
                return base.origin + url;
            } catch (e) {
                return url;
            }
        }

        return url;
    }

    formatFigure(node, content) {
        return `\n\n${content}\n\n`;
    }

    formatFigureCaption(content) {
        const trimmed = content.trim();
        return trimmed ? `\n*${trimmed}*\n` : '';
    }

    formatTable(node) {
        if (!this.options.includeTables) return '';

        const rows = node.querySelectorAll('tr');
        if (rows.length === 0) return '';

        let markdown = '\n\n';
        let isFirstRow = true;

        for (const row of rows) {
            const cells = row.querySelectorAll('td, th');
            if (cells.length === 0) continue;

            const cellContents = Array.from(cells).map(cell => {
                const cellMarkdown = this.convertElement(cell, { inTable: true });
                return cellMarkdown.trim().replace(/\n/g, ' ').replace(/\|/g, '\\|');
            });

            markdown += '| ' + cellContents.join(' | ') + ' |\n';

            if (isFirstRow) {
                markdown += '| ' + cellContents.map(() => '---').join(' | ') + ' |\n';
                isFirstRow = false;
            }
        }

        return markdown + '\n\n';
    }

    formatBlockquote(content) {
        const trimmed = content.trim();
        if (!trimmed) return '';

        const lines = trimmed.split('\n');
        const quotedLines = lines.map(line => `> ${line.trim()}`).join('\n');
        return `\n\n${quotedLines}\n\n`;
    }

    formatQuote(content) {
        const trimmed = content.trim();
        return trimmed ? `"${trimmed}"` : content;
    }

    formatCitation(content) {
        const trimmed = content.trim();
        return trimmed ? `*${trimmed}*` : content;
    }

    formatInput(node) {
        const type = node.getAttribute('type') || 'text';
        const value = node.getAttribute('value') || '';
        const placeholder = node.getAttribute('placeholder') || '';

        if (type === 'submit' || type === 'button') {
            return `[${value || 'Button'}]`;
        }

        return `[${type}: ${value || placeholder || 'input'}]`;
    }

    formatTextarea(node) {
        const value = node.value || node.textContent || '';
        const placeholder = node.getAttribute('placeholder') || '';

        return `[textarea: ${value || placeholder || 'text area'}]`;
    }

    formatSelect(node) {
        const selectedOption = node.querySelector('option[selected]');
        const value = selectedOption?.textContent || 'select';

        return `[select: ${value}]`;
    }

    formatButton(node, content) {
        const trimmed = content.trim();
        return `[${trimmed || 'Button'}]`;
    }

    formatLabel(content) {
        return content;
    }

    formatDetails(node, content) {
        const summary = node.querySelector('summary');
        const summaryText = summary ? summary.textContent.trim() : 'Details';

        return `\n\n<details>\n<summary>${summaryText}</summary>\n\n${content}\n</details>\n\n`;
    }

    formatSummary(content) {
        return content.trim();
    }

    getCodeLanguage(node) {
        const className = node.className || '';
        const languageMatch = className.match(/language-(\w+)/);

        if (languageMatch) {
            return languageMatch[1];
        }

        const parent = node.parentElement;
        if (parent) {
            const parentClass = parent.className || '';
            const parentLanguageMatch = parentClass.match(/language-(\w+)/);
            if (parentLanguageMatch) {
                return parentLanguageMatch[1];
            }
        }

        return '';
    }

    cleanMarkdown(markdown) {
        return markdown
            .replace(/\n{4,}/g, '\n\n\n')
            .replace(/\*\*\s+/g, '**')
            .replace(/\s+\*\*/g, '**')
            .replace(/\*\s+/g, '*')
            .replace(/\s+\*/g, '*')
            .replace(/\n\n-/g, '\n-')
            .replace(/\n\n\d+\./g, '\n1.')
            .replace(/[ \t]+$/gm, '')
            .trim();
    }
}

// CORS headers helper
function corsHeaders(origin) {
    return {
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
    };
}

// Get demo HTML (embedded to avoid file system dependencies)
async function getDemoHTML(apiOrigin) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SkyaboveGEO - HTML to Markdown Converter</title>
    <meta name="description" content="Interactive demo for SkyaboveGEO HTML to Markdown API">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --slds-brand: #0176d3;
            --slds-brand-dark: #014486;
            --slds-gray-1: #f3f2f2;
            --slds-gray-2: #ecebea;
            --slds-gray-3: #dddbda;
            --slds-gray-4: #c9c7c5;
            --slds-gray-5: #b0adab;
            --slds-gray-6: #706e6b;
            --slds-gray-7: #514f4d;
            --slds-gray-8: #3e3e3c;
            --slds-white: #ffffff;
            --slds-success: #2e844a;
            --slds-error: #c23934;
        }

        body {
            font-family: 'Salesforce Sans', Arial, sans-serif;
            background: var(--slds-gray-1);
            min-height: 100vh;
            padding: 0;
            color: var(--slds-gray-8);
            margin: 0;
        }

        .container {
            width: 100%;
            margin: 0;
        }

        header {
            background: var(--slds-brand);
            color: var(--slds-white);
            padding: 2rem 2rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        h1 {
            font-size: 2rem;
            font-weight: 300;
            margin-bottom: 0.5rem;
        }

        .subtitle {
            font-size: 1rem;
            opacity: 0.95;
            font-weight: 400;
        }

        .main-content {
            background: var(--slds-white);
            margin: 2rem;
            border-radius: 0.25rem;
            box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.1);
            border: 1px solid var(--slds-gray-3);
        }

        .tabs {
            display: flex;
            background: var(--slds-white);
            border-bottom: 1px solid var(--slds-gray-3);
        }

        .tab {
            flex: 1;
            padding: 1rem;
            text-align: center;
            cursor: pointer;
            font-weight: 400;
            transition: all 0.2s;
            border: none;
            background: transparent;
            font-size: 0.875rem;
            color: var(--slds-gray-7);
            border-bottom: 2px solid transparent;
        }

        .tab:hover {
            background: var(--slds-gray-1);
            color: var(--slds-brand);
        }

        .tab.active {
            background: var(--slds-white);
            color: var(--slds-brand);
            border-bottom-color: var(--slds-brand);
            font-weight: 600;
        }

        .tab-content {
            display: none;
            padding: 2rem;
        }

        .tab-content.active {
            display: block;
        }

        .converter-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }

        @media (max-width: 768px) {
            .converter-section {
                grid-template-columns: 1fr;
            }
            h1 {
                font-size: 2em;
            }
        }

        .input-group {
            display: flex;
            flex-direction: column;
        }

        label {
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: var(--slds-gray-7);
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.025rem;
        }

        .char-count {
            font-size: 0.75rem;
            color: var(--slds-gray-6);
            font-weight: normal;
            text-transform: none;
        }

        textarea {
            width: 100%;
            min-height: 300px;
            padding: 0.75rem;
            border: 1px solid var(--slds-gray-4);
            border-radius: 0.25rem;
            font-family: 'Courier New', monospace;
            font-size: 0.875rem;
            resize: vertical;
            transition: border-color 0.15s, box-shadow 0.15s;
            background: var(--slds-white);
        }

        textarea:focus {
            outline: none;
            border-color: var(--slds-brand);
            box-shadow: 0 0 3px var(--slds-brand);
        }

        .output-area {
            background: var(--slds-gray-1);
            border: 1px solid var(--slds-gray-3);
        }

        input[type="text"], input[type="password"] {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid var(--slds-gray-4);
            border-radius: 0.25rem;
            font-size: 0.875rem;
            transition: border-color 0.15s, box-shadow 0.15s;
            background: var(--slds-white);
        }

        input[type="text"]:focus, input[type="password"]:focus {
            outline: none;
            border-color: var(--slds-brand);
            box-shadow: 0 0 3px var(--slds-brand);
        }

        .options-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }

        .checkbox-group {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .checkbox-group input[type="checkbox"] {
            width: 20px;
            height: 20px;
            cursor: pointer;
        }

        .checkbox-group label {
            margin: 0;
            cursor: pointer;
            font-weight: normal;
        }

        .button-group {
            display: flex;
            gap: 1rem;
            margin-top: 1.5rem;
            flex-wrap: wrap;
        }

        button {
            padding: 0.75rem 1.5rem;
            border: 1px solid var(--slds-gray-4);
            border-radius: 0.25rem;
            font-size: 0.875rem;
            font-weight: 400;
            cursor: pointer;
            transition: all 0.2s;
            line-height: 1.5;
        }

        .btn-primary {
            background: var(--slds-brand);
            color: var(--slds-white);
            border-color: var(--slds-brand);
            flex: 1;
        }

        .btn-primary:hover {
            background: var(--slds-brand-dark);
            border-color: var(--slds-brand-dark);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .btn-primary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .btn-secondary {
            background: var(--slds-white);
            color: var(--slds-gray-8);
            border-color: var(--slds-gray-4);
        }

        .btn-secondary:hover {
            background: var(--slds-gray-1);
            border-color: var(--slds-gray-5);
        }

        .btn-copy {
            background: var(--slds-success);
            color: var(--slds-white);
            border-color: var(--slds-success);
        }

        .btn-copy:hover {
            background: #1d6f39;
            border-color: #1d6f39;
        }

        .examples {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
        }

        .example-card {
            background: var(--slds-white);
            padding: 1rem;
            border-radius: 0.25rem;
            border: 1px solid var(--slds-gray-3);
            cursor: pointer;
            transition: all 0.2s;
        }

        .example-card:hover {
            border-color: var(--slds-brand);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .example-title {
            font-weight: 600;
            color: #667eea;
            margin-bottom: 8px;
        }

        .example-preview {
            font-size: 0.85em;
            color: #6c757d;
            font-family: 'Courier New', monospace;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .status-message {
            padding: 1rem;
            border-radius: 0.25rem;
            margin-bottom: 1.5rem;
            display: none;
            font-size: 0.875rem;
        }

        .status-message.success {
            background: #ecf3ec;
            color: #2e844a;
            border: 1px solid #91db8b;
            display: block;
        }

        .status-message.error {
            background: #feded8;
            color: #c23934;
            border: 1px solid #ea001e;
            display: block;
        }

        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
            margin-bottom: 1.5rem;
        }

        .stat-card {
            background: var(--slds-white);
            border: 1px solid var(--slds-gray-3);
            color: var(--slds-gray-8);
            padding: 1rem;
            border-radius: 0.25rem;
            text-align: center;
        }

        .stat-value {
            font-size: 1.75rem;
            font-weight: 300;
            margin-bottom: 0.25rem;
            color: var(--slds-brand);
        }

        .stat-label {
            font-size: 0.75rem;
            color: var(--slds-gray-6);
            text-transform: uppercase;
            letter-spacing: 0.025rem;
        }

        .loading {
            display: none;
            text-align: center;
            padding: 20px;
        }

        .loading.active {
            display: block;
        }

        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 10px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .api-docs {
            line-height: 1.8;
        }

        .api-docs h2 {
            color: #667eea;
            margin: 30px 0 15px 0;
        }

        .api-docs h3 {
            color: #495057;
            margin: 20px 0 10px 0;
        }

        .code-block {
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            padding: 15px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            overflow-x: auto;
            margin: 10px 0;
        }

        footer {
            text-align: center;
            color: var(--slds-gray-6);
            padding: 2rem;
            font-size: 0.75rem;
        }

        footer a {
            color: var(--slds-brand);
            text-decoration: none;
        }

        footer a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>SkyaboveGEO</h1>
            <div class="subtitle">Enterprise HTML to Markdown Conversion API</div>
        </header>

        <div class="main-content">
            <div class="tabs">
                <button class="tab active" onclick="switchTab('converter', this)">Converter</button>
                <button class="tab" onclick="switchTab('examples', this)">Examples</button>
                <button class="tab" onclick="switchTab('aiOverview', this)">AI Overview</button>
                <button class="tab" onclick="switchTab('docs', this)">API Docs</button>
            </div>

            <div id="converter" class="tab-content active">
                <div id="statusMessage" class="status-message"></div>

                <div class="stats" id="stats" style="display: none;">
                    <div class="stat-card">
                        <div class="stat-value" id="inputLength">0</div>
                        <div class="stat-label">Input Characters</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="outputLength">0</div>
                        <div class="stat-label">Output Characters</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="conversionTime">0ms</div>
                        <div class="stat-label">Conversion Time</div>
                    </div>
                </div>

                <div class="input-group" style="margin-bottom: 20px;">
                    <label for="baseUrl">Base URL (Optional)</label>
                    <input type="text" id="baseUrl" placeholder="https://example.com">
                </div>

                <div class="input-group" style="margin-bottom: 20px;">
                    <label for="openaiKey">OpenAI API Key (Optional - for AI SEO Analysis)</label>
                    <input type="password" id="openaiKey" placeholder="sk-...">
                    <p style="font-size: 0.75rem; color: var(--slds-gray-6); margin-top: 0.25rem;">Your API key is stored locally in your browser and never sent to our servers</p>
                </div>

                <div class="options-grid">
                    <div class="checkbox-group">
                        <input type="checkbox" id="includeImages" checked>
                        <label for="includeImages">Include Images</label>
                    </div>
                    <div class="checkbox-group">
                        <input type="checkbox" id="includeLinks" checked>
                        <label for="includeLinks">Include Links</label>
                    </div>
                    <div class="checkbox-group">
                        <input type="checkbox" id="includeTables" checked>
                        <label for="includeTables">Include Tables</label>
                    </div>
                    <div class="checkbox-group">
                        <input type="checkbox" id="includeCodeBlocks" checked>
                        <label for="includeCodeBlocks">Include Code Blocks</label>
                    </div>
                </div>

                <div class="converter-section">
                    <div class="input-group">
                        <label for="htmlInput">
                            HTML Input
                            <span class="char-count" id="inputCount">0 characters</span>
                        </label>
                        <textarea id="htmlInput" placeholder="Paste your HTML here..."></textarea>
                    </div>

                    <div class="input-group">
                        <label for="markdownOutput">
                            Markdown Output
                            <span class="char-count" id="outputCount">0 characters</span>
                        </label>
                        <textarea id="markdownOutput" class="output-area" readonly placeholder="Markdown will appear here..."></textarea>
                    </div>
                </div>

                <div class="loading" id="loading">
                    <div class="spinner"></div>
                    <div>Converting...</div>
                </div>

                <div class="button-group">
                    <button class="btn-primary" id="convertBtn" onclick="convertHTML()">Convert to Markdown</button>
                    <button class="btn-copy" onclick="copyToClipboard()">Copy Markdown</button>
                    <button class="btn-secondary" onclick="clearAll()">Clear All</button>
                </div>
            </div>

            <div id="examples" class="tab-content">
                <h2 style="margin-bottom: 20px; color: #667eea;">Click an example to try it:</h2>
                <div class="examples">
                    <div class="example-card" onclick="loadExample('basic')">
                        <div class="example-title">Basic Text</div>
                        <div class="example-preview">&lt;h1&gt;Hello&lt;/h1&gt;&lt;p&gt;World&lt;/p&gt;</div>
                    </div>
                    <div class="example-card" onclick="loadExample('formatting')">
                        <div class="example-title">Text Formatting</div>
                        <div class="example-preview">&lt;strong&gt;Bold&lt;/strong&gt; &lt;em&gt;Italic&lt;/em&gt;</div>
                    </div>
                    <div class="example-card" onclick="loadExample('list')">
                        <div class="example-title">Lists</div>
                        <div class="example-preview">&lt;ul&gt;&lt;li&gt;Item 1&lt;/li&gt;&lt;li&gt;Item 2&lt;/li&gt;&lt;/ul&gt;</div>
                    </div>
                    <div class="example-card" onclick="loadExample('table')">
                        <div class="example-title">Table</div>
                        <div class="example-preview">&lt;table&gt;&lt;tr&gt;&lt;th&gt;Header&lt;/th&gt;...</div>
                    </div>
                    <div class="example-card" onclick="loadExample('links')">
                        <div class="example-title">Links & Images</div>
                        <div class="example-preview">&lt;a href="..."&gt;Link&lt;/a&gt;&lt;img src="..."&gt;</div>
                    </div>
                    <div class="example-card" onclick="loadExample('code')">
                        <div class="example-title">Code Blocks</div>
                        <div class="example-preview">&lt;pre&gt;&lt;code&gt;console.log()&lt;/code&gt;&lt;/pre&gt;</div>
                    </div>
                    <div class="example-card" onclick="loadExample('blockquote')">
                        <div class="example-title">Blockquote</div>
                        <div class="example-preview">&lt;blockquote&gt;Quote text&lt;/blockquote&gt;</div>
                    </div>
                    <div class="example-card" onclick="loadExample('complex')">
                        <div class="example-title">Complex Document</div>
                        <div class="example-preview">Full article with multiple elements</div>
                    </div>
                </div>
            </div>

            <div id="aiOverview" class="tab-content">
                <h2 style="font-size: 1.5rem; font-weight: 300; margin-bottom: 1rem; color: var(--slds-gray-8);">AI SEO Analysis</h2>
                <p style="color: var(--slds-gray-7); margin-bottom: 1.5rem;">Get AI-powered suggestions to improve your HTML and Markdown content for better search engine optimization.</p>

                <div id="aiStatusMessage" class="status-message"></div>

                <div style="background: var(--slds-gray-1); border: 1px solid var(--slds-gray-4); border-radius: 0.25rem; padding: 1rem; margin-bottom: 1.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; color: var(--slds-brand);">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm1 12H7V7h2v5zm0-6H7V4h2v2z"/>
                        </svg>
                        <strong>How it works</strong>
                    </div>
                    <ol style="font-size: 0.875rem; color: var(--slds-gray-7); margin-left: 1.5rem; line-height: 1.6;">
                        <li>Enter your OpenAI API key in the Converter tab</li>
                        <li>Convert your HTML to Markdown</li>
                        <li>Click "Analyze for SEO" to get AI-powered suggestions</li>
                        <li>Review recommendations to improve search engine visibility</li>
                    </ol>
                </div>

                <div class="button-group">
                    <button id="analyzeBtn" class="btn-primary" onclick="analyzeSEO()">
                        Analyze for SEO
                    </button>
                    <button class="btn-secondary" onclick="clearAIAnalysis()">Clear Analysis</button>
                </div>

                <div id="aiLoading" style="display: none; padding: 2rem; text-align: center; color: var(--slds-gray-6);">
                    <div class="spinner"></div>
                    <p style="margin-top: 1rem;">Analyzing content with AI...</p>
                </div>

                <div id="aiResults" style="display: none; margin-top: 2rem;">
                    <div style="background: var(--slds-white); border: 1px solid var(--slds-gray-3); border-left: 4px solid var(--slds-brand); border-radius: 0.25rem; padding: 1.5rem; margin-bottom: 1.5rem;">
                        <h3 style="font-size: 1rem; font-weight: 600; color: var(--slds-gray-8); margin-bottom: 1rem;">SEO Analysis Results</h3>
                        <div id="aiAnalysisContent" style="font-size: 0.875rem; line-height: 1.6; color: var(--slds-gray-7);"></div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                        <div style="background: var(--slds-white); border: 1px solid var(--slds-gray-3); border-radius: 0.25rem; padding: 1rem;">
                            <h4 style="font-size: 0.875rem; font-weight: 600; color: var(--slds-gray-8); margin-bottom: 0.75rem;">HTML Content</h4>
                            <div id="htmlPreview" style="max-height: 300px; overflow-y: auto; font-size: 0.75rem; font-family: 'Courier New', monospace; background: var(--slds-gray-1); padding: 1rem; border-radius: 0.25rem;"></div>
                        </div>
                        <div style="background: var(--slds-white); border: 1px solid var(--slds-gray-3); border-radius: 0.25rem; padding: 1rem;">
                            <h4 style="font-size: 0.875rem; font-weight: 600; color: var(--slds-gray-8); margin-bottom: 0.75rem;">Markdown Content</h4>
                            <div id="markdownPreview" style="max-height: 300px; overflow-y: auto; font-size: 0.75rem; font-family: 'Courier New', monospace; background: var(--slds-gray-1); padding: 1rem; border-radius: 0.25rem;"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div id="docs" class="tab-content">
                <div class="api-docs">
                    <h2>API Endpoints</h2>

                    <h3>1. GET / - API Documentation</h3>
                    <p>Returns API information and available endpoints.</p>
                    <div class="code-block">curl ${apiOrigin}/</div>

                    <h3>2. GET /health - Health Check</h3>
                    <p>Check if the API is operational.</p>
                    <div class="code-block">curl ${apiOrigin}/health</div>

                    <h3>3. POST /convert - Convert HTML to Markdown</h3>
                    <p>Convert HTML content to Markdown format.</p>

                    <h4>Request Body:</h4>
                    <div class="code-block">{
  "html": "string (required)",
  "baseUrl": "string (optional)",
  "options": {
    "includeImages": true,
    "includeLinks": true,
    "includeTables": true,
    "includeCodeBlocks": true
  }
}</div>

                    <h4>Example Request:</h4>
                    <div class="code-block">curl -X POST ${apiOrigin}/convert \\
  -H "Content-Type: application/json" \\
  -d '{"html": "&lt;h1&gt;Hello World&lt;/h1&gt;&lt;p&gt;Test&lt;/p&gt;"}'</div>

                    <h2>Supported HTML Elements</h2>
                    <ul style="line-height: 2;">
                        <li>Headings: h1-h6</li>
                        <li>Text formatting: strong, em, u, del, mark, sup, sub</li>
                        <li>Lists: ul, ol, dl</li>
                        <li>Links and images: a, img</li>
                        <li>Tables: table, tr, td, th</li>
                        <li>Code: pre, code, kbd</li>
                        <li>Blockquotes: blockquote</li>
                        <li>And many more!</li>
                    </ul>

                    <h2>Rate Limits</h2>
                    <p>Free tier includes 100,000 requests per day with 10ms CPU time per request.</p>
                </div>
            </div>
        </div>

        <footer>
            <p>
                Powered by SkyaboveGEO | Deployed on Cloudflare Workers
            </p>
        </footer>
    </div>

    <script>
        const API_URL = '${apiOrigin}';

        function switchTab(tabName, clickedButton) {
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

            if (clickedButton) {
                clickedButton.classList.add('active');
            }
            document.getElementById(tabName).classList.add('active');
        }

        document.getElementById('htmlInput').addEventListener('input', function() {
            const count = this.value.length;
            document.getElementById('inputCount').textContent = \`\${count.toLocaleString()} characters\`;
        });

        document.getElementById('markdownOutput').addEventListener('input', function() {
            const count = this.value.length;
            document.getElementById('outputCount').textContent = \`\${count.toLocaleString()} characters\`;
        });

        async function convertHTML() {
            const htmlInput = document.getElementById('htmlInput').value;

            if (!htmlInput.trim()) {
                showStatus('Please enter some HTML to convert', 'error');
                return;
            }

            const baseUrl = document.getElementById('baseUrl').value;
            const options = {
                includeImages: document.getElementById('includeImages').checked,
                includeLinks: document.getElementById('includeLinks').checked,
                includeTables: document.getElementById('includeTables').checked,
                includeCodeBlocks: document.getElementById('includeCodeBlocks').checked
            };

            const convertBtn = document.getElementById('convertBtn');
            convertBtn.disabled = true;
            document.getElementById('loading').classList.add('active');
            document.getElementById('statusMessage').style.display = 'none';

            const startTime = performance.now();

            try {
                const response = await fetch(\`\${API_URL}/convert\`, {
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

                const data = await response.json();
                const endTime = performance.now();
                const duration = Math.round(endTime - startTime);

                if (data.success) {
                    document.getElementById('markdownOutput').value = data.markdown;
                    document.getElementById('outputCount').textContent = \`\${data.length.toLocaleString()} characters\`;

                    document.getElementById('inputLength').textContent = htmlInput.length.toLocaleString();
                    document.getElementById('outputLength').textContent = data.length.toLocaleString();
                    document.getElementById('conversionTime').textContent = \`\${duration}ms\`;
                    document.getElementById('stats').style.display = 'grid';

                    showStatus('✓ Conversion successful!', 'success');
                } else {
                    showStatus(\`Error: \${data.error || 'Conversion failed'}\`, 'error');
                }
            } catch (error) {
                showStatus(\`Error: \${error.message}\`, 'error');
            } finally {
                convertBtn.disabled = false;
                document.getElementById('loading').classList.remove('active');
            }
        }

        function copyToClipboard() {
            const output = document.getElementById('markdownOutput');
            if (!output.value) {
                showStatus('Nothing to copy!', 'error');
                return;
            }

            output.select();
            document.execCommand('copy');
            showStatus('✓ Copied to clipboard!', 'success');
        }

        function clearAll() {
            document.getElementById('htmlInput').value = '';
            document.getElementById('markdownOutput').value = '';
            document.getElementById('baseUrl').value = '';
            document.getElementById('inputCount').textContent = '0 characters';
            document.getElementById('outputCount').textContent = '0 characters';
            document.getElementById('stats').style.display = 'none';
            document.getElementById('statusMessage').style.display = 'none';
        }

        function showStatus(message, type) {
            const statusEl = document.getElementById('statusMessage');
            statusEl.textContent = message;
            statusEl.className = \`status-message \${type}\`;

            if (type === 'success') {
                setTimeout(() => {
                    statusEl.style.display = 'none';
                }, 3000);
            }
        }

        const examples = {
            basic: \`<h1>Hello World</h1>
<p>This is a simple paragraph with some <strong>bold text</strong> and <em>italic text</em>.</p>
<p>Here's another paragraph.</p>\`,

            formatting: \`<p>This paragraph contains:</p>
<ul>
<li><strong>Bold text</strong></li>
<li><em>Italic text</em></li>
<li><u>Underlined text</u></li>
<li><del>Strikethrough text</del></li>
<li><code>inline code</code></li>
<li>Sup<sup>erscript</sup> and Sub<sub>script</sub></li>
</ul>\`,

            list: \`<h2>Shopping List</h2>
<ul>
<li>Milk</li>
<li>Eggs</li>
<li>Bread</li>
<li>Coffee</li>
</ul>

<h2>TODO</h2>
<ol>
<li>Wake up</li>
<li>Brush teeth</li>
<li>Have breakfast</li>
<li>Start coding</li>
</ol>\`,

            table: \`<h2>Product Comparison</h2>
<table>
<tr>
<th>Product</th>
<th>Price</th>
<th>Rating</th>
</tr>
<tr>
<td>Widget A</td>
<td>$19.99</td>
<td>★★★★☆</td>
</tr>
<tr>
<td>Widget B</td>
<td>$29.99</td>
<td>★★★★★</td>
</tr>
<tr>
<td>Widget C</td>
<td>$14.99</td>
<td>★★★☆☆</td>
</tr>
</table>\`,

            links: \`<h2>Useful Links</h2>
<p>Visit our <a href="https://example.com">website</a> for more information.</p>
<p>Check out our <a href="https://github.com/example" title="GitHub Repository">GitHub repo</a>.</p>

<h2>Images</h2>
<p>Here's our logo:</p>
<img src="https://via.placeholder.com/150" alt="Company Logo" title="Our Logo">\`,

            code: \`<h2>Code Example</h2>
<p>Here's a JavaScript function:</p>
<pre><code class="language-javascript">function greet(name) {
    console.log("Hello, " + name + "!");
}

greet("World");
</code></pre>

<p>And here's some inline code: <code>const x = 42;</code></p>\`,

            blockquote: \`<h2>Famous Quote</h2>
<blockquote>
<p>The only way to do great work is to love what you do.</p>
<p>- Steve Jobs</p>
</blockquote>

<p>This quote inspires many developers.</p>\`,

            complex: \`<article>
<h1>Getting Started with easyGEO</h1>

<p>Welcome to <strong>easyGEO</strong>, the easiest way to convert HTML to Markdown!</p>

<h2>Features</h2>
<ul>
<li>Fast conversion</li>
<li>Supports all HTML elements</li>
<li>Free API access</li>
<li>Global CDN</li>
</ul>

<h2>Installation</h2>
<p>You can use the API with a simple HTTP request:</p>
<pre><code>curl -X POST ${apiOrigin}/convert \\\\
  -H "Content-Type: application/json" \\\\
  -d '{"html": "&lt;h1&gt;Hello&lt;/h1&gt;"}'
</code></pre>

<h2>Supported Elements</h2>
<table>
<tr>
<th>Element</th>
<th>Supported</th>
</tr>
<tr>
<td>Headings</td>
<td>✓</td>
</tr>
<tr>
<td>Lists</td>
<td>✓</td>
</tr>
<tr>
<td>Tables</td>
<td>✓</td>
</tr>
<tr>
<td>Images</td>
<td>✓</td>
</tr>
</table>

<blockquote>
<p>easyGEO makes content optimization simple and effective!</p>
</blockquote>

<h2>Get Started</h2>
<p>Visit our <a href="https://github.com/fanrenaz/easyGEO">GitHub repository</a> to learn more.</p>
</article>\`
        };

        function loadExample(exampleName) {
            document.getElementById('htmlInput').value = examples[exampleName];
            document.getElementById('inputCount').textContent = \`\${examples[exampleName].length.toLocaleString()} characters\`;
            switchTab('converter');
            document.querySelectorAll('.tab')[0].classList.add('active');
            showStatus(\`Example loaded: \${exampleName}\`, 'success');
        }

        document.getElementById('htmlInput').addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'Enter') {
                convertHTML();
            }
        });

        // Load and save OpenAI API key from localStorage
        window.addEventListener('DOMContentLoaded', function() {
            const savedKey = localStorage.getItem('openaiApiKey');
            if (savedKey && document.getElementById('openaiKey')) {
                document.getElementById('openaiKey').value = savedKey;
            }
        });

        if (document.getElementById('openaiKey')) {
            document.getElementById('openaiKey').addEventListener('change', function() {
                if (this.value) {
                    localStorage.setItem('openaiApiKey', this.value);
                } else {
                    localStorage.removeItem('openaiApiKey');
                }
            });
        }

        async function analyzeSEO() {
            const apiKey = document.getElementById('openaiKey').value;
            const htmlContent = document.getElementById('htmlInput').value;
            const markdownContent = document.getElementById('markdownOutput').value;

            if (!apiKey) {
                showAIStatus('Please enter your OpenAI API key in the Converter tab', 'error');
                return;
            }

            if (!htmlContent || !markdownContent) {
                showAIStatus('Please convert HTML to Markdown first before analyzing', 'error');
                return;
            }

            const analyzeBtn = document.getElementById('analyzeBtn');
            analyzeBtn.disabled = true;
            document.getElementById('aiLoading').style.display = 'block';
            document.getElementById('aiResults').style.display = 'none';
            document.getElementById('aiStatusMessage').style.display = 'none';

            try {
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + apiKey
                    },
                    body: JSON.stringify({
                        model: 'gpt-4o-mini',
                        messages: [
                            {
                                role: 'system',
                                content: 'You are an SEO expert specializing in content optimization. Analyze the provided HTML and Markdown content and provide actionable suggestions to improve search engine optimization. Focus on: meta tags, headings structure, keyword usage, content quality, alt text for images, internal linking, readability, and semantic HTML. Provide specific, practical recommendations.'
                            },
                            {
                                role: 'user',
                                content: 'Please analyze the following HTML and Markdown content for SEO improvements:\\n\\nHTML Content:\\n' + htmlContent + '\\n\\nMarkdown Content:\\n' + markdownContent + '\\n\\nProvide detailed SEO improvement suggestions.'
                            }
                        ],
                        temperature: 0.7,
                        max_tokens: 2000
                    })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error?.message || 'OpenAI API request failed');
                }

                const data = await response.json();
                const analysis = data.choices[0].message.content;

                // Display results
                document.getElementById('aiAnalysisContent').innerHTML = formatAnalysis(analysis);
                document.getElementById('htmlPreview').textContent = htmlContent.substring(0, 1000) + (htmlContent.length > 1000 ? '...' : '');
                document.getElementById('markdownPreview').textContent = markdownContent.substring(0, 1000) + (markdownContent.length > 1000 ? '...' : '');

                document.getElementById('aiResults').style.display = 'block';
                showAIStatus('SEO analysis completed successfully', 'success');
            } catch (error) {
                showAIStatus('Error: ' + error.message, 'error');
            } finally {
                analyzeBtn.disabled = false;
                document.getElementById('aiLoading').style.display = 'none';
            }
        }

        function formatAnalysis(text) {
            // Convert markdown-style formatting to HTML
            let formatted = text
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.+?)\*/g, '<em>$1</em>')
                .replace(/^### (.+)$/gm, '<h4 style="font-size: 0.95rem; font-weight: 600; margin: 1.5rem 0 0.5rem; color: var(--slds-gray-8);">$1</h4>')
                .replace(/^## (.+)$/gm, '<h3 style="font-size: 1.05rem; font-weight: 600; margin: 1.5rem 0 0.75rem; color: var(--slds-gray-8);">$1</h3>')
                .replace(/^# (.+)$/gm, '<h2 style="font-size: 1.15rem; font-weight: 600; margin: 1.5rem 0 1rem; color: var(--slds-gray-8);">$1</h2>')
                .replace(/^- (.+)$/gm, '<li style="margin-left: 1.5rem; margin-bottom: 0.5rem;">$1</li>')
                .replace(/^\d+\. (.+)$/gm, '<li style="margin-left: 1.5rem; margin-bottom: 0.5rem; list-style-type: decimal;">$1</li>')
                .replace(/\x60(.+?)\x60/g, '<code style="background: var(--slds-gray-2); padding: 0.125rem 0.25rem; border-radius: 0.125rem; font-family: monospace; font-size: 0.85em;">$1</code>')
                .replace(/\n\n/g, '</p><p style="margin-bottom: 1rem;">');

            return '<p style="margin-bottom: 1rem;">' + formatted + '</p>';
        }

        function clearAIAnalysis() {
            document.getElementById('aiResults').style.display = 'none';
            document.getElementById('aiStatusMessage').style.display = 'none';
            document.getElementById('aiAnalysisContent').innerHTML = '';
            document.getElementById('htmlPreview').textContent = '';
            document.getElementById('markdownPreview').textContent = '';
        }

        function showAIStatus(message, type) {
            const statusEl = document.getElementById('aiStatusMessage');
            statusEl.textContent = message;
            statusEl.className = 'status-message ' + type;

            if (type === 'success') {
                setTimeout(function() {
                    statusEl.style.display = 'none';
                }, 4000);
            }
        }
    </script>
</body>
</html>`;
}

// Main Worker handler
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: corsHeaders(request.headers.get('Origin'))
            });
        }

        // Demo page endpoint
        if (url.pathname === '/demo' && request.method === 'GET') {
            const demoHTML = await getDemoHTML(url.origin);
            return new Response(demoHTML, {
                headers: {
                    'Content-Type': 'text/html; charset=utf-8',
                    'Cache-Control': 'public, max-age=3600',
                    ...corsHeaders(request.headers.get('Origin'))
                }
            });
        }

        // Root endpoint - API documentation or redirect
        if (url.pathname === '/' && request.method === 'GET') {
            // Check if browser or API client
            const accept = request.headers.get('Accept') || '';

            // If browser (accepts HTML), redirect to demo
            if (accept.includes('text/html')) {
                return Response.redirect(url.origin + '/demo', 302);
            }

            // If API client (curl, etc), return JSON
            return new Response(JSON.stringify({
                name: 'easyGEO HTML to Markdown API',
                version: '1.0.0',
                description: 'Convert HTML content to Markdown format',
                demo: url.origin + '/demo',
                endpoints: {
                    '/demo': {
                        method: 'GET',
                        description: 'Interactive demo application'
                    },
                    '/convert': {
                        method: 'POST',
                        description: 'Convert HTML to Markdown',
                        body: {
                            html: 'string (required) - HTML content to convert',
                            baseUrl: 'string (optional) - Base URL for resolving relative links',
                            options: {
                                includeImages: 'boolean (default: true)',
                                includeLinks: 'boolean (default: true)',
                                includeTables: 'boolean (default: true)',
                                includeCodeBlocks: 'boolean (default: true)',
                            }
                        },
                        example: {
                            html: '<h1>Hello World</h1><p>This is a <strong>test</strong>.</p>',
                            baseUrl: 'https://example.com',
                            options: { includeImages: true }
                        }
                    },
                    '/health': {
                        method: 'GET',
                        description: 'Health check endpoint'
                    }
                }
            }, null, 2), {
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders(request.headers.get('Origin'))
                }
            });
        }

        // Health check endpoint
        if (url.pathname === '/health' && request.method === 'GET') {
            return new Response(JSON.stringify({
                status: 'healthy',
                timestamp: new Date().toISOString()
            }), {
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders(request.headers.get('Origin'))
                }
            });
        }

        // Convert endpoint
        if (url.pathname === '/convert' && request.method === 'POST') {
            try {
                const body = await request.json();

                if (!body.html) {
                    return new Response(JSON.stringify({
                        error: 'Missing required field: html'
                    }), {
                        status: 400,
                        headers: {
                            'Content-Type': 'application/json',
                            ...corsHeaders(request.headers.get('Origin'))
                        }
                    });
                }

                // Create converter with options
                const options = {
                    ...body.options,
                    baseUrl: body.baseUrl
                };

                const converter = new HTML2Markdown(options);
                const markdown = converter.convert(body.html);

                return new Response(JSON.stringify({
                    success: true,
                    markdown: markdown,
                    length: markdown.length
                }), {
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders(request.headers.get('Origin'))
                    }
                });

            } catch (error) {
                return new Response(JSON.stringify({
                    error: 'Failed to convert HTML',
                    message: error.message
                }), {
                    status: 500,
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders(request.headers.get('Origin'))
                    }
                });
            }
        }

        // 404 for unknown routes
        return new Response(JSON.stringify({
            error: 'Not found',
            message: 'The requested endpoint does not exist. Visit / for API documentation.'
        }), {
            status: 404,
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders(request.headers.get('Origin'))
            }
        });
    }
};
