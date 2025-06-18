# Domain Setup Guide: a2zbookshop.com with Zoho Mail

## Step 1: Check Current Domain Status

First, log into your Zoho Mail admin panel:
1. Go to: https://mailadmin.zoho.com/
2. Login with your Zoho account credentials
3. Navigate to **Control Panel** → **Domains**
4. Look for **a2zbookshop.com** in the list

### If Domain Shows "Verified" ✅
- Your domain is ready
- SMTP should work immediately
- Test the email system

### If Domain Shows "Not Verified" or "Pending" ❌
- Continue to Step 2 below

## Step 2: Domain Verification Process

### Get Verification Records from Zoho:
1. In Zoho Mail Admin → **Control Panel** → **Domains**
2. Click on **a2zbookshop.com**
3. Click **"Verify Domain"** or **"Domain Setup"**
4. Zoho will show you specific DNS records to add

### Typical DNS Records Needed:

```
Record Type: MX
Host: @ (or leave blank)
Value: mx.zoho.com
Priority: 10
TTL: 3600

Record Type: TXT
Host: @ (or leave blank) 
Value: zoho-verification=zb12345678 (Zoho will give you exact code)
TTL: 3600

Record Type: CNAME
Host: mail
Value: business.zoho.com
TTL: 3600
```

## Step 3: Add DNS Records

### Where to Add Records:
You need to add these records where you bought a2zbookshop.com domain.

**Common Domain Registrars:**
- **GoDaddy**: My Products → Domain → Manage DNS
- **Namecheap**: Domain List → Manage → Advanced DNS
- **Cloudflare**: DNS → Records
- **Google Domains**: DNS → Custom Records

### How to Add Records:
1. Login to your domain registrar
2. Find DNS Management / DNS Records section
3. Add each record type (MX, TXT, CNAME) exactly as shown by Zoho
4. Save changes

## Step 4: Wait for Propagation

- DNS changes take 15 minutes to 24 hours
- Usually works within 1-2 hours
- Check verification status in Zoho every hour

## Step 5: Verify in Zoho

1. Return to Zoho Mail Admin → Control Panel → Domains
2. Click **"Verify Domain"** button for a2zbookshop.com
3. Zoho will check your DNS records
4. Once verified, status will show **"Verified"** ✅

## Step 6: Enable SMTP

After domain verification:
1. Go to **Zoho Mail** → **Settings** → **Security**
2. Enable **"SMTP Access"**
3. Ensure **"App Passwords"** is enabled
4. Your existing password (KMNpmtwETvQx) should work

## Step 7: Test Email System

Once domain is verified, your A2Z BOOKSHOP will automatically:
- Send order confirmations to customers
- Send admin copies to orders@a2zbookshop.com
- Work with existing password: KMNpmtwETvQx

## Troubleshooting

**If verification fails:**
- Double-check DNS records match exactly
- Wait longer (up to 24 hours)
- Contact your domain registrar for DNS help
- Ensure no typos in record values

**If SMTP still fails after verification:**
- Check SMTP is enabled in Zoho security settings
- Verify orders@a2zbookshop.com account exists
- Regenerate App Password if needed

## Need Help?

**Domain Registrar Support:**
- Each registrar has DNS setup guides
- Contact their support for DNS record help

**Zoho Support:**
- Zoho has domain verification guides
- Check Zoho Mail documentation

Your email system is completely ready - just needs this domain verification step!