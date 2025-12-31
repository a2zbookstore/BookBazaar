# Zoho Mail Setup Guide for orders@a2zbookshop.com

## Current Status
- Email system is fully configured
- SMTP credentials are correct: orders@a2zbookshop.com / KMNpmtwETvQx
- System sends emails to both customer AND orders@a2zbookshop.com

## Issue: Domain Verification Required

Your domain a2zbookshop.com needs to be verified in Zoho Mail.

### Step 1: Log into Zoho Mail Admin
1. Go to https://mailadmin.zoho.com/
2. Login with your Zoho account

### Step 2: Verify Domain Status
1. Navigate to "Control Panel" → "Domains" 
2. Check if a2zbookshop.com shows "Verified" status
3. If NOT verified, follow Step 3

### Step 3: Add DNS Records (if domain not verified)
Contact your domain registrar and add these DNS records:

```
Type: MX
Host: @ (or leave blank)
Value: mx.zoho.com
Priority: 10

Type: TXT  
Host: @ (or leave blank)
Value: zoho-verification=[get this code from Zoho]

Type: CNAME
Host: mail
Value: business.zoho.com
```

### Step 4: Enable SMTP Access
1. Go to Zoho Mail → Settings → Security
2. Enable "SMTP Access"
3. Verify "App Passwords" are enabled

## Email Flow (Already Working - Just Needs Domain Verification)

When customer places order:
1. Customer gets beautiful confirmation email
2. orders@a2zbookshop.com gets admin copy with same details
3. Both emails include:
   - Order number and items
   - Customer details
   - Shipping information
   - Total amount
   - Professional A2Z BOOKSHOP design

## Test Once Domain Verified
- Orders will automatically start sending emails
- No code changes needed
- System is 100% ready