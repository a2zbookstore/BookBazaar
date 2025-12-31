# Brevo Email Configuration Guide

## Step 1: Get Brevo Account
1. Go to https://www.brevo.com/ (formerly Sendinblue)
2. Sign up for free account (includes 300 emails/day)
3. Verify your email address

## Step 2: Get SMTP Credentials

### Get Your Email Address:
- Use any verified email in your Brevo account
- Can be your personal email or business email
- No need to own a domain like a2zbookshop.com

### Get API Key:
1. Login to Brevo dashboard
2. Go to **Settings** → **SMTP & API**
3. Click **Generate a new API key**
4. Name it "A2Z BOOKSHOP SMTP"
5. Copy the generated API key (starts with xkeysib-)

## Step 3: Provide Credentials

I need these two values:
```
BREVO_EMAIL=your-verified-email@domain.com
BREVO_API_KEY=xkeysib-xxxxxxxxxxxxx
```

## Brevo SMTP Settings (Already Configured)
```
Server: smtp-relay.brevo.com
Port: 587 (TLS)
Username: Your verified email
Password: Your API key
```

## Email Flow After Configuration

When customer places order:
1. Customer gets confirmation email FROM your Brevo email
2. You get admin copy at your Brevo email
3. Professional A2Z BOOKSHOP templates
4. No domain verification needed

## Benefits of Brevo

✅ **No Domain Setup Required** - Works with any email
✅ **Better Deliverability** - Professional email infrastructure  
✅ **Free Tier Available** - 300 emails/day free
✅ **Easy Setup** - Just email + API key
✅ **Advanced Features** - Email tracking, analytics
✅ **Reliable** - Enterprise-grade service

## After Setup

Your email system will immediately work:
- Order confirmations to customers
- Admin notifications to your email
- Professional branding
- Automatic tracking and delivery status

Just provide your Brevo email and API key!