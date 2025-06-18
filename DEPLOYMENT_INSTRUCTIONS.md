# A2Z BOOKSHOP - Deployment Instructions

## Complete E-commerce Bookstore Application

### System Requirements
- Node.js 20 or higher
- PostgreSQL 16 or higher
- Git (for version control)

### Quick Setup

1. **Extract the archive:**
   ```bash
   tar -xzf a2z-bookshop-complete-*.tar.gz
   cd a2z-bookshop-complete
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Database Setup:**
   - Create a PostgreSQL database
   - Set the DATABASE_URL environment variable:
     ```bash
     export DATABASE_URL="postgresql://username:password@localhost:5432/a2zbookshop"
     ```

4. **Environment Variables:**
   Create a `.env` file with the following:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/a2zbookshop
   BREVO_API_KEY=your_brevo_api_key
   BREVO_EMAIL=your_brevo_email
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   PAYPAL_CLIENT_ID=your_paypal_client_id
   PAYPAL_CLIENT_SECRET=your_paypal_client_secret
   ```

5. **Database Migration:**
   ```bash
   npm run db:push
   ```

6. **Start the application:**
   ```bash
   npm run dev
   ```

7. **Access the application:**
   - Website: http://localhost:5000
   - Admin Panel: Access via secret admin login (lock icon in footer)

### Features Included

#### Customer Features:
- ✅ Complete book catalog with search and filtering
- ✅ Shopping cart and wishlist functionality
- ✅ Guest and registered user checkout
- ✅ PayPal and Razorpay payment integration
- ✅ Order tracking and return requests
- ✅ Location-based currency conversion
- ✅ Mobile-responsive design
- ✅ Email notifications for orders and status updates

#### Admin Features:
- ✅ Complete inventory management
- ✅ Order processing and status updates
- ✅ Customer and sales analytics
- ✅ Shipping rate configuration
- ✅ Excel book import with cover image fetching
- ✅ Return and refund management
- ✅ Email system management
- ✅ Secret admin access system

#### Technical Features:
- ✅ React 18 with TypeScript frontend
- ✅ Express.js backend with PostgreSQL
- ✅ Drizzle ORM for database operations
- ✅ Professional email templates with Brevo SMTP
- ✅ Real-time inventory management
- ✅ Secure authentication system
- ✅ International shipping rate support

### Deployment Options

#### Option 1: Traditional Hosting
1. Upload files to your server
2. Install Node.js and PostgreSQL
3. Set environment variables
4. Run the application with PM2 or similar process manager

#### Option 2: Cloud Platforms
- **Vercel/Netlify:** Frontend deployment
- **Heroku/Railway:** Full-stack deployment
- **DigitalOcean/AWS:** VPS deployment

#### Option 3: Domain Setup (a2zbookshop.com)
1. Point your domain to your server
2. Configure SSL certificate
3. Update environment variables for production
4. Set up nginx reverse proxy if needed

### Configuration Notes

#### Email System:
- Configured with Brevo SMTP (smtp-relay.brevo.com:587)
- Sends order confirmations and status updates
- Includes website links and contact information

#### Payment Systems:
- **Razorpay:** Indian payment gateway (₹ INR)
- **PayPal:** International payments ($ USD)
- Automatic currency conversion based on location

#### Admin Access:
- No visible admin buttons for customers
- Secret access via footer lock icon
- Floating admin button for authenticated admins

### Support and Maintenance

#### Regular Tasks:
1. **Database Backup:** Regular PostgreSQL backups
2. **Email Monitoring:** Check email delivery rates
3. **Inventory Updates:** Import new books via Excel
4. **Order Processing:** Daily order management

#### Troubleshooting:
1. **Database Issues:** Check DATABASE_URL and connection
2. **Email Problems:** Verify BREVO_API_KEY and email settings
3. **Payment Failures:** Check Razorpay/PayPal credentials
4. **Admin Access:** Use secret login in footer

### File Structure
```
a2z-bookshop/
├── client/           # React frontend
├── server/           # Express backend
├── shared/           # Shared types and schemas
├── uploads/          # Book cover images
├── package.json      # Dependencies
├── drizzle.config.ts # Database configuration
└── vite.config.ts    # Build configuration
```

### Security Notes
- All admin functionality is hidden from customers
- Secure session management for authentication
- Environment variables for sensitive data
- Input validation and SQL injection prevention

### Version Information
- **Created:** June 2025
- **Last Updated:** June 18, 2025
- **Version:** Production Ready
- **Features:** Complete e-commerce bookstore

For technical support or questions, contact:
- support@a2zbookshop.com
- a2zbookshopglobal@gmail.com

### Website URLs
- https://a2zbookshop.com
- https://www.a2zbookshop.com