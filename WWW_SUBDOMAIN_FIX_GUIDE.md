# WWW Subdomain Fix Guide for a2zbookshop.com

## Problem
- `a2zbookshop.com` works fine
- `www.a2zbookshop.com` shows "Page Not Found"

## Solution Options

### Option 1: DNS CNAME Record (Recommended)
1. **Go to your domain registrar** (where you bought a2zbookshop.com)
2. **Find DNS Management** section
3. **Add a CNAME record:**
   - Name/Host: `www`
   - Value/Points to: `a2zbookshop.com`
   - TTL: 3600 (or default)

### Option 2: A Record Method
1. **Go to your domain registrar**
2. **Find DNS Management** section
3. **Add an A record:**
   - Name/Host: `www`
   - Value/IP Address: [Same IP as a2zbookshop.com]
   - TTL: 3600 (or default)

### Option 3: URL Redirect (If supported by registrar)
1. **Go to your domain registrar**
2. **Find URL Forwarding/Redirect** section
3. **Set up redirect:**
   - From: `www.a2zbookshop.com`
   - To: `https://a2zbookshop.com`
   - Type: 301 Permanent Redirect

## Common Domain Registrars Instructions

### GoDaddy
1. Log into GoDaddy account
2. Go to "My Products" → "DNS"
3. Click "Manage DNS" for a2zbookshop.com
4. Add CNAME record: `www` → `a2zbookshop.com`

### Namecheap
1. Log into Namecheap account
2. Go to "Domain List" → "Manage"
3. Click "Advanced DNS"
4. Add CNAME record: `www` → `a2zbookshop.com`

### Cloudflare (if using)
1. Log into Cloudflare dashboard
2. Select a2zbookshop.com domain
3. Go to "DNS" section
4. Add CNAME record: `www` → `a2zbookshop.com`

### Google Domains
1. Log into Google Domains
2. Select a2zbookshop.com
3. Go to "DNS" section
4. Add CNAME record: `www` → `a2zbookshop.com`

## Server-Side Solution (If you have server access)

If you're using a web server like Apache or Nginx, you can also fix this with redirects:

### Apache (.htaccess)
```apache
RewriteEngine On
RewriteCond %{HTTP_HOST} ^www\.a2zbookshop\.com$ [NC]
RewriteRule ^(.*)$ https://a2zbookshop.com/$1 [R=301,L]
```

### Nginx
```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name www.a2zbookshop.com;
    return 301 https://a2zbookshop.com$request_uri;
}
```

## Verification Steps

After making DNS changes:

1. **Wait 24-48 hours** for DNS propagation
2. **Test both URLs:**
   - `https://a2zbookshop.com` (should work)
   - `https://www.a2zbookshop.com` (should redirect to above)

3. **Use online tools to check:**
   - DNS Checker: https://dnschecker.org/
   - WhatsMyDNS: https://whatsmydns.net/

## Quick DNS Check Commands

```bash
# Check current DNS records
nslookup a2zbookshop.com
nslookup www.a2zbookshop.com

# Check with dig command
dig a2zbookshop.com
dig www.a2zbookshop.com
```

## Important Notes

1. **DNS changes take time** - Usually 1-24 hours for full propagation
2. **Clear browser cache** after making changes
3. **Test in incognito/private mode** to avoid cached results
4. **Both domains should work** after proper configuration

## Recommended Action

**Go to your domain registrar (where you purchased a2zbookshop.com) and add a CNAME record:**
- Host: `www`
- Points to: `a2zbookshop.com`

This is the standard and most reliable solution for this issue.