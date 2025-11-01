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

        // Root endpoint - API documentation
        if (url.pathname === '/' && request.method === 'GET') {
            return new Response(JSON.stringify({
                name: 'easyGEO HTML to Markdown API',
                version: '1.0.0',
                description: 'Convert HTML content to Markdown format',
                endpoints: {
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
