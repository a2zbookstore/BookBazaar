# Zoho Mail SMTP Setup for A2Z BOOKSHOP

## Current Issue
Authentication failed with error "535 Authentication Failed" when testing Zoho Mail SMTP connection.

## Solution Steps

### 1. Generate Zoho App Password (Required)
1. Log into your Zoho Mail account at mail.zoho.com
2. Click on your profile picture (top right) → Settings
3. Go to **Security** tab
4. Find **App Passwords** section
5. Click **Generate New Password**
6. Application Name: `A2Z BOOKSHOP Website`
7. Copy the generated password (it will look like: `abcd efgh ijkl mnop`)
8. Use this password as `ZOHO_PASSWORD` (NOT your regular login password)

### 2. Enable Two-Factor Authentication (If Required)
- Zoho may require 2FA to be enabled before allowing app passwords
- Go to Security → Two-Factor Authentication and enable it
- Then generate the app password

### 3. Check Domain Settings
- Ensure your domain `a2zbookshop.com` is properly verified in Zoho
- Go to Mail → Settings → Domain Settings to verify

### 4. Alternative SMTP Settings (If Standard Fails)
Try these alternative settings:

**Option 1: SSL/TLS (Port 465)**
```javascript
{
  host: 'smtp.zoho.com',
  port: 465,
  secure: true,
  auth: {
    user: 'orders@a2zbookshop.com',
    pass: 'your_app_password'
  }
}
```

**Option 2: STARTTLS (Port 587)**
```javascript
{
  host: 'smtp.zoho.com',
  port: 587,
  secure: false,
  auth: {
    user: 'orders@a2zbookshop.com',
    pass: 'your_app_password'
  },
  requireTLS: true
}
```

### 5. Zoho Mail Account Requirements
- Account must be active and verified
- Domain must be added and verified in Zoho
- SMTP access must be enabled (usually enabled by default)

### 6. Common Issues and Solutions

**Issue: "Invalid login" or "Authentication failed"**
- Double-check the app password (not regular password)
- Ensure 2FA is enabled on the account
- Verify the email address format

**Issue: "Connection timeout"**
- Check if your hosting provider blocks SMTP ports
- Try different ports (465 vs 587)

**Issue: "Domain not verified"**
- Add and verify a2zbookshop.com in Zoho admin panel

### 7. Testing Steps
Once you have the correct app password:

1. Update the `ZOHO_PASSWORD` secret with the new app password
2. Restart the application
3. The system will automatically test email sending when orders are placed

### 8. Email Features Ready
Once authentication works, these features are active:

✅ **Order Confirmation Emails**
- Sent to customer when order is placed
- Copy sent to orders@a2zbookshop.com
- Professional A2Z BOOKSHOP branding
- Complete order details and tracking info

✅ **Order Status Update Emails**
- Sent when admin updates order status
- Includes tracking information if provided
- Dynamic content based on status (shipped, delivered, etc.)

✅ **Email Templates**
- Professional HTML templates
- Mobile-responsive design
- A2Z BOOKSHOP branding and colors
- Customer service contact information

## Next Steps
1. Generate a new app password in Zoho Mail
2. Update the ZOHO_PASSWORD secret
3. Test by placing an order or updating order status