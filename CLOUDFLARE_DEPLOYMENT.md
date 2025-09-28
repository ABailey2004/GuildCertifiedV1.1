# Cloudflare Pages Configuration

## Build Settings
- **Framework preset**: None (Static Site)
- **Build command**: _(Leave empty)_
- **Build output directory**: `/`
- **Root directory**: `/`

## Environment Variables
No environment variables needed - this is a fully client-side application.

## Custom Headers (Optional)
Add to `_headers` file in root directory for enhanced security:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
```

## Redirects (Optional)
Add to `_redirects` file in root directory for SPA routing:

```
# Redirect all paths to index.html for client-side routing
/* /index.html 200
```

## Custom Domains
1. In Cloudflare Pages dashboard, go to Custom Domains
2. Add your domain (e.g., `ratemyserver.com`)
3. Update Discord OAuth redirect URIs to include your custom domain
4. SSL is automatically provided by Cloudflare

## Performance Optimizations
- Static assets are automatically cached by Cloudflare CDN
- Gzip compression is enabled by default
- HTTP/2 and HTTP/3 are automatically enabled
- Global edge network ensures fast loading worldwide

## Deploy Process
1. Connect GitHub repository to Cloudflare Pages
2. Select production branch (usually `main` or `master`)
3. Set build settings as above
4. Deploy!
5. Updates automatically deploy on git push to production branch

## Monitoring
- Use Cloudflare Analytics for visitor insights
- Check Functions logs for any errors
- Monitor Core Web Vitals in Speed tab