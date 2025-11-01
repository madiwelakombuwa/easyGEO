# Cloudflare Pages Deployment Setup

This guide helps you deploy easyGEO to Cloudflare Pages with Workers integration.

## Configuration

When setting up your Cloudflare Pages project, use these build settings:

### Build Settings

| Setting | Value |
|---------|-------|
| **Framework preset** | None |
| **Build command** | `npm run deploy` |
| **Build output directory** | (leave empty) |
| **Root directory** | `/` |

### Alternative: Direct Wrangler Command

If you prefer to use Wrangler directly instead of npm scripts:

| Setting | Value |
|---------|-------|
| **Build command** | `npx wrangler deploy worker/index.js --name easygeo-html2md --compatibility-date=2025-11-01` |

## Environment Variables

In your Cloudflare Pages project settings, you may need to set:

- `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token (if deploying from Pages)
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID

## Configuration Files

The project includes multiple Wrangler configuration files for compatibility:

1. **wrangler.json** - Primary configuration (Wrangler 4.x)
2. **wrangler.jsonc** - Alternative JSON with comments
3. **wrangler.toml** - Legacy TOML format
4. **package.json** - Contains deploy scripts

Wrangler will automatically use the first file it finds in this order:
1. wrangler.json
2. wrangler.jsonc
3. wrangler.toml

## Deployment Commands

### From Command Line

```bash
# Using npm script
npm run deploy

# Using wrangler directly
npx wrangler deploy worker/index.js --name easygeo-html2md

# For production environment
npm run deploy:production
```

### From Cloudflare Pages

Cloudflare Pages will automatically run your configured build command on each push to your connected Git repository.

## Troubleshooting

### "Missing entry-point" Error

If you see this error, ensure:

1. The `worker/index.js` file exists in your repository
2. One of the wrangler configuration files is present
3. The build command explicitly specifies the entry point:
   ```
   npx wrangler deploy worker/index.js --name easygeo-html2md
   ```

### Configuration Not Found

If Wrangler can't find the configuration:

1. Check that configuration files are committed to git
2. Try specifying all options via command line:
   ```bash
   npx wrangler deploy worker/index.js \
     --name easygeo-html2md \
     --compatibility-date=2025-11-01 \
     --compatibility-flags=nodejs_compat
   ```

### Build Fails During Deployment

1. Ensure all files are committed and pushed to your repository
2. Check that `worker/index.js` is not in `.gitignore`
3. Verify the build command in Cloudflare Pages settings matches the documentation

## Verify Deployment

After successful deployment, test your worker:

```bash
# Health check
curl https://easygeo-html2md.your-subdomain.workers.dev/health

# API documentation
curl https://easygeo-html2md.your-subdomain.workers.dev/

# Test conversion
curl -X POST https://easygeo-html2md.your-subdomain.workers.dev/convert \
  -H "Content-Type: application/json" \
  -d '{"html": "<h1>Test</h1>"}'
```

## Next Steps

Once deployed successfully:

1. Note your worker URL
2. Update any client applications to use the new endpoint
3. Configure custom domains if needed in Cloudflare dashboard
4. Set up monitoring and alerts

## Support

For additional help:
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
