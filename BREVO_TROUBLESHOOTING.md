# Brevo SMTP Troubleshooting Guide

## Current Issue: 535 5.7.8 Authentication failed

This error means Brevo is rejecting your credentials. Here's how to fix it:

## Step 1: Verify Your Brevo Account Setup

1. **Login to Brevo Dashboard**: https://app.brevo.com/
2. **Check Email Verification**: Go to Settings → Senders & IP → verify your email is confirmed
3. **Confirm SMTP Access**: Go to Settings → SMTP & API → ensure SMTP is enabled

## Step 2: Get Correct SMTP Credentials

### Important: Use SMTP Key (NOT REST API Key)

1. Go to **Settings** → **SMTP & API**
2. Look for **"SMTP"** section (not REST API)
3. Click **"Generate SMTP Key"** or **"Create SMTP Key"**
4. Name it: "A2Z BOOKSHOP SMTP"
5. Copy the generated key (format: xkeysib-xxxxxxxxxxxxxxxx)

### Email Address Requirements:
- Must be verified in your Brevo account
- Go to Settings → Senders & IP → add and verify your email
- Use the exact verified email address

## Step 3: Common Issues & Solutions

### Issue: Wrong API Key Type
- **Problem**: Using REST API key instead of SMTP key
- **Solution**: Generate new SMTP key from SMTP & API section

### Issue: Email Not Verified
- **Problem**: Email address not verified in Brevo
- **Solution**: Add email in Senders & IP section and verify it

### Issue: SMTP Disabled
- **Problem**: SMTP functionality disabled in account
- **Solution**: Enable SMTP in Settings → SMTP & API

### Issue: Free Account Limits
- **Problem**: Free account limitations
- **Solution**: Verify account with phone number and email

## Step 4: Test Configuration

The correct format should be:
```
BREVO_EMAIL=your-verified-email@domain.com
BREVO_API_KEY=xkeysib-your-smtp-key-here
```

## Step 5: Alternative Solutions

If still not working:

### Option 1: Use Different Email Service
- Gmail SMTP (requires app password)
- Outlook SMTP
- Your hosting provider's SMTP

### Option 2: Verify Brevo Account
- Add phone number verification
- Upgrade to paid plan (starts at $25/month)
- Contact Brevo support

## Brevo SMTP Settings (Already Configured)
```
Host: smtp-relay.brevo.com
Port: 587
Security: TLS
Username: Your verified email
Password: Your SMTP API key
```

## Need Help?

1. **Check Brevo Status**: https://status.brevo.com/
2. **Brevo Documentation**: https://developers.brevo.com/docs/send-emails-via-smtp
3. **Contact Brevo Support**: support@brevo.com

The email system will work perfectly once the correct credentials are provided!