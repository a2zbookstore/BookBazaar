import nodemailer from 'nodemailer';
import { Order, OrderItem, Book } from '../shared/schema';

// Email configuration for Brevo SMTP
const createTransporter = () => {
  // Use the provided SMTP credentials
  const SMTP_USER = '8ffc43003@smtp-brevo.com';
  const SMTP_PASS = 'AW6v3Nmy2CrYs8kV';
  const FROM_EMAIL = 'orders@a2zbookshop.com';

  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false, // TLS
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 60000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development'
  });

  // Verify SMTP connection on startup (non-blocking)
  transporter.verify((error, success) => {
    if (error) {
      console.error('Brevo SMTP Error:', error.message);
      console.log('Email functionality disabled - orders will complete without notifications');
    } else {
      console.log('✅ Brevo SMTP connected successfully');
      console.log('Email system ready: orders@a2zbookshop.com via smtp-relay.brevo.com');
      console.log('Order confirmations and admin notifications will be sent');
    }
  });

  return transporter;
};

interface OrderEmailData {
  order: Order & { items: (OrderItem & { book: Book })[] };
  customerEmail: string;
  customerName: string;
}

interface StatusUpdateEmailData {
  order: Order;
  customerEmail: string;
  customerName: string;
  newStatus: string;
  trackingNumber?: string;
  shippingCarrier?: string;
  notes?: string;
}

interface WelcomeEmailData {
  user: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    authProvider: string;
  };
}

// Generate order confirmation email HTML
const generateOrderConfirmationHTML = (data: OrderEmailData) => {
  const { order, customerName } = data;
  const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'N/A';

  const itemsHTML = order.items.map(item => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px; text-align: left;">
        <strong>${item.book.title}</strong><br>
        <small style="color: #6b7280;">by ${item.book.author}</small><br>
        <small style="color: #6b7280;">ISBN: ${item.book.isbn}</small>
      </td>
      <td style="padding: 12px; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; text-align: right;">$${parseFloat(item.price.toString()).toFixed(2)}</td>
      <td style="padding: 12px; text-align: right;">$${(item.quantity * parseFloat(item.price.toString())).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Confirmation - A2Z BOOKSHOP</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1f2937; margin-bottom: 10px;">A<span style="color: #dc2626;">2</span>Z BOOKSHOP</h1>
        <p style="color: #6b7280; margin: 0;">Your trusted partner in discovering rare and contemporary books</p>
      </div>

      <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h2 style="color: #059669; margin-top: 0;">Order Confirmation</h2>
        <p>Dear ${customerName},</p>
        <p>Thank you for your order! We're excited to get your books to you. Here are the details of your order:</p>
      </div>

      <div style="margin-bottom: 30px;">
        <h3 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Order Details</h3>
        <table style="width: 100%; margin-bottom: 20px;">
          <tr>
            <td style="padding: 8px 0;"><strong>Order ID:</strong></td>
            <td style="padding: 8px 0;">#${order.id}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Order Date:</strong></td>
            <td style="padding: 8px 0;">${orderDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Status:</strong></td>
            <td style="padding: 8px 0;"><span style="background-color: #fbbf24; color: #92400e; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">${(order.status || 'PENDING').toUpperCase()}</span></td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 30px;">
        <h3 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Items Ordered</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 12px; text-align: left; border-bottom: 1px solid #d1d5db;">Item</th>
              <th style="padding: 12px; text-align: center; border-bottom: 1px solid #d1d5db;">Qty</th>
              <th style="padding: 12px; text-align: right; border-bottom: 1px solid #d1d5db;">Price</th>
              <th style="padding: 12px; text-align: right; border-bottom: 1px solid #d1d5db;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>
      </div>

      <div style="margin-bottom: 30px;">
        <h3 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Order Summary</h3>
        <table style="width: 100%;">
          <tr>
            <td style="padding: 8px 0; text-align: right;"><strong>Subtotal:</strong></td>
            <td style="padding: 8px 0 8px 20px; text-align: right;">$${parseFloat(order.subtotal.toString()).toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; text-align: right;"><strong>Shipping:</strong></td>
            <td style="padding: 8px 0 8px 20px; text-align: right;">$${parseFloat(order.shipping.toString()).toFixed(2)}</td>
          </tr>
          <tr style="border-top: 1px solid #e5e7eb;">
            <td style="padding: 12px 0; text-align: right; font-size: 18px;"><strong>Total:</strong></td>
            <td style="padding: 12px 0 12px 20px; text-align: right; font-size: 18px; color: #dc2626;"><strong>$${parseFloat(order.total.toString()).toFixed(2)}</strong></td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 30px;">
        <h3 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Shipping Address</h3>
        <p style="margin: 10px 0; line-height: 1.5;">
          ${typeof order.shippingAddress === 'string' ? order.shippingAddress.split(',').join('<br>') : 'Address not provided'}
        </p>
      </div>

      <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
        <h4 style="color: #1e40af; margin-top: 0;">What's Next?</h4>
        <p style="margin-bottom: 10px;">• We'll process your order within 1-2 business days</p>
        <p style="margin-bottom: 10px;">• You'll receive a tracking number once your order ships</p>
        <p style="margin-bottom: 0;">• We offer 15-day returns on all books</p>
      </div>

      <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; margin-bottom: 15px;">Thank you for choosing A2Z BOOKSHOP!</p>
        
        <div style="margin-bottom: 15px;">
          <p style="color: #6b7280; margin-bottom: 8px;">Visit our website:</p>
          <p style="margin-bottom: 5px;">
            <a href="https://a2zbookshop.com" style="color: #3b82f6; text-decoration: none;">https://a2zbookshop.com</a>
          </p>
          <p style="margin-bottom: 5px;">
            <a href="https://www.a2zbookshop.com" style="color: #3b82f6; text-decoration: none;">https://www.a2zbookshop.com</a>
          </p>
        </div>
        
        <div style="margin-bottom: 15px;">
          <p style="color: #6b7280; margin-bottom: 8px;">Contact us:</p>
          <p style="margin-bottom: 5px;">
            <a href="mailto:support@a2zbookshop.com" style="color: #3b82f6; text-decoration: none;">support@a2zbookshop.com</a>
          </p>
          <p style="margin-bottom: 5px;">
            <a href="mailto:a2zbookshopglobal@gmail.com" style="color: #3b82f6; text-decoration: none;">a2zbookshopglobal@gmail.com</a>
          </p>
        </div>
        
        <p style="color: #6b7280; font-size: 12px;">
          A2Z BOOKSHOP - Your trusted partner in discovering books worldwide
        </p>
      </div>
    </body>
    </html>
  `;
};

// Generate status update email HTML
const generateStatusUpdateHTML = (data: StatusUpdateEmailData) => {
  const { order, customerName, newStatus, trackingNumber, shippingCarrier, notes } = data;
  
  const statusColors: { [key: string]: { bg: string; text: string } } = {
    'pending': { bg: '#fbbf24', text: '#92400e' },
    'confirmed': { bg: '#3b82f6', text: '#1e40af' },
    'processing': { bg: '#8b5cf6', text: '#5b21b6' },
    'shipped': { bg: '#10b981', text: '#047857' },
    'delivered': { bg: '#059669', text: '#064e3b' },
    'cancelled': { bg: '#ef4444', text: '#991b1b' }
  };

  const statusColor = statusColors[newStatus.toLowerCase()] || { bg: '#6b7280', text: '#374151' };

  let trackingInfo = '';
  if (trackingNumber && shippingCarrier) {
    trackingInfo = `
      <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h4 style="color: #0369a1; margin-top: 0;">Tracking Information</h4>
        <p style="margin: 10px 0;"><strong>Carrier:</strong> ${shippingCarrier}</p>
        <p style="margin: 10px 0;"><strong>Tracking Number:</strong> ${trackingNumber}</p>
        ${notes ? `<p style="margin: 10px 0;"><strong>Notes:</strong> ${notes}</p>` : ''}
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Status Update - A2Z BOOKSHOP</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1f2937; margin-bottom: 10px;">A<span style="color: #dc2626;">2</span>Z BOOKSHOP</h1>
        <p style="color: #6b7280; margin: 0;">Your trusted partner in discovering rare and contemporary books</p>
      </div>

      <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h2 style="color: #1f2937; margin-top: 0;">Order Status Update</h2>
        <p>Dear ${customerName},</p>
        <p>We have an update on your order #${order.id}. Your order status has been updated to:</p>
        
        <div style="text-align: center; margin: 20px 0;">
          <span style="background-color: ${statusColor.bg}; color: ${statusColor.text}; padding: 12px 24px; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">
            ${newStatus.toUpperCase()}
          </span>
        </div>
      </div>

      ${trackingInfo}

      <div style="margin-bottom: 30px;">
        <h3 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Order Summary</h3>
        <table style="width: 100%;">
          <tr>
            <td style="padding: 8px 0;"><strong>Order ID:</strong></td>
            <td style="padding: 8px 0;">#${order.id}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Order Total:</strong></td>
            <td style="padding: 8px 0;">$${parseFloat(order.total.toString()).toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Order Date:</strong></td>
            <td style="padding: 8px 0;">${order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</td>
          </tr>
        </table>
      </div>

      <div style="background-color: ${newStatus.toLowerCase() === 'delivered' ? '#d1fae5' : '#eff6ff'}; padding: 20px; border-radius: 8px; border-left: 4px solid ${newStatus.toLowerCase() === 'delivered' ? '#10b981' : '#3b82f6'};">
        <h4 style="color: ${newStatus.toLowerCase() === 'delivered' ? '#047857' : '#1e40af'}; margin-top: 0;">
          ${newStatus.toLowerCase() === 'delivered' ? 'Enjoy Your Books!' : 'What\'s Next?'}
        </h4>
        ${newStatus.toLowerCase() === 'delivered' 
          ? '<p style="margin-bottom: 10px;">• We hope you enjoy your new books!</p><p style="margin-bottom: 10px;">• Remember, we offer 15-day returns if needed</p><p style="margin-bottom: 0;">• Please consider leaving us a review</p>'
          : newStatus.toLowerCase() === 'shipped'
          ? '<p style="margin-bottom: 10px;">• Your order is on its way!</p><p style="margin-bottom: 10px;">• Use the tracking number above to monitor delivery</p><p style="margin-bottom: 0;">• Expected delivery varies by location</p>'
          : '<p style="margin-bottom: 10px;">• We\'ll send another update when your order ships</p><p style="margin-bottom: 0;">• Thank you for your patience</p>'
        }
      </div>

      <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; margin-bottom: 15px;">Thank you for choosing A2Z BOOKSHOP!</p>
        
        <div style="margin-bottom: 15px;">
          <p style="color: #6b7280; margin-bottom: 8px;">Visit our website:</p>
          <p style="margin-bottom: 5px;">
            <a href="https://a2zbookshop.com" style="color: #3b82f6; text-decoration: none;">https://a2zbookshop.com</a>
          </p>
          <p style="margin-bottom: 5px;">
            <a href="https://www.a2zbookshop.com" style="color: #3b82f6; text-decoration: none;">https://www.a2zbookshop.com</a>
          </p>
        </div>
        
        <div style="margin-bottom: 15px;">
          <p style="color: #6b7280; margin-bottom: 8px;">Contact us:</p>
          <p style="margin-bottom: 5px;">
            <a href="mailto:support@a2zbookshop.com" style="color: #3b82f6; text-decoration: none;">support@a2zbookshop.com</a>
          </p>
          <p style="margin-bottom: 5px;">
            <a href="mailto:a2zbookshopglobal@gmail.com" style="color: #3b82f6; text-decoration: none;">a2zbookshopglobal@gmail.com</a>
          </p>
        </div>
        
        <p style="color: #6b7280; font-size: 12px;">
          A2Z BOOKSHOP - Your trusted partner in discovering books worldwide
        </p>
      </div>
    </body>
    </html>
  `;
};

// Send order confirmation email
export const sendOrderConfirmationEmail = async (data: OrderEmailData): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log('Email transporter not available - skipping order confirmation email');
      return false;
    }
    
    const htmlContent = generateOrderConfirmationHTML(data);

    // Email to customer
    const customerMailOptions = {
      from: {
        name: 'A2Z BOOKSHOP',
        address: 'orders@a2zbookshop.com'
      },
      to: data.customerEmail,
      subject: `Order Confirmation #${data.order.id} - A2Z BOOKSHOP`,
      html: htmlContent,
      text: `Thank you for your order #${data.order.id}! Your order total is $${parseFloat(data.order.total.toString()).toFixed(2)}. We'll process your order within 1-2 business days and send you tracking information once it ships.`
    };

    // Copy to admin
    const adminMailOptions = {
      from: {
        name: 'A2Z BOOKSHOP',
        address: 'orders@a2zbookshop.com'
      },
      to: 'orders@a2zbookshop.com',
      subject: `New Order #${data.order.id} - Admin Copy`,
      html: htmlContent,
      text: `New order received from ${data.customerEmail}. Order #${data.order.id}, Total: $${parseFloat(data.order.total.toString()).toFixed(2)}`
    };

    // Send both emails
    await Promise.all([
      transporter.sendMail(customerMailOptions),
      transporter.sendMail(adminMailOptions)
    ]);

    console.log(`Order confirmation emails sent for order #${data.order.id}`);
    return true;
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return false;
  }
};

// Send status update email
export const sendStatusUpdateEmail = async (data: StatusUpdateEmailData): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log('Email transporter not available - skipping status update email');
      return false;
    }
    
    const htmlContent = generateStatusUpdateHTML(data);

    const customerMailOptions = {
      from: {
        name: 'A2Z BOOKSHOP',
        address: 'orders@a2zbookshop.com'
      },
      to: data.customerEmail,
      subject: `Order Status Update - Order #${data.order.id}`,
      html: htmlContent,
      text: `Your order #${data.order.id} status has been updated to: ${data.newStatus}. ${data.trackingNumber ? `Tracking: ${data.trackingNumber}` : ''}`
    };

    // Copy to admin
    const adminMailOptions = {
      from: {
        name: 'A2Z BOOKSHOP',
        address: 'orders@a2zbookshop.com'
      },
      to: 'orders@a2zbookshop.com',
      subject: `Order Status Updated - Order #${data.order.id}`,
      html: htmlContent,
      text: `Order #${data.order.id} status updated to: ${data.newStatus} for customer: ${data.customerEmail}`
    };

    // Send both emails
    await Promise.all([
      transporter.sendMail(customerMailOptions),
      transporter.sendMail(adminMailOptions)
    ]);
    console.log(`Status update email sent for order #${data.order.id}, new status: ${data.newStatus}`);
    return true;
  } catch (error) {
    console.error('Error sending status update email:', error);
    return false;
  }
};

// Test email configuration
// Export the HTML generator for admin preview
export const generateWelcomeHTMLInternal = (data: WelcomeEmailData) => {
  const { user } = data;
  const registrationMethod = user.authProvider === 'email' ? 'email address' : 'phone number';
  const contactInfo = user.email || user.phone || '';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to A2Z BOOKSHOP</title>
        <style>
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                line-height: 1.6; 
                margin: 0; 
                padding: 0; 
                background-color: #f4f4f4; 
            }
            .container { 
                max-width: 600px; 
                margin: 0 auto; 
                background: white; 
                border-radius: 10px; 
                overflow: hidden; 
                box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
            }
            .header { 
                background: linear-gradient(135deg, rgb(41, 128, 185) 0%, rgb(52, 152, 219) 100%); 
                color: white; 
                padding: 40px 30px; 
                text-align: center; 
            }
            .header h1 { 
                margin: 0; 
                font-size: 32px; 
                font-weight: bold; 
            }
            .header .subtitle { 
                margin: 10px 0 0 0; 
                font-size: 16px; 
                opacity: 0.9; 
            }
            .content { 
                padding: 40px 30px; 
            }
            .welcome-message { 
                font-size: 18px; 
                color: #333; 
                margin-bottom: 25px; 
            }
            .personalized-section { 
                background: #f8fafe; 
                border-left: 4px solid rgb(41, 128, 185); 
                padding: 20px; 
                margin: 25px 0; 
                border-radius: 5px; 
            }
            .features-grid { 
                display: grid; 
                grid-template-columns: 1fr 1fr; 
                gap: 20px; 
                margin: 30px 0; 
            }
            .feature-card { 
                background: #f9f9f9; 
                padding: 20px; 
                border-radius: 8px; 
                text-align: center; 
            }
            .feature-icon { 
                font-size: 24px; 
                margin-bottom: 10px; 
            }
            .cta-button { 
                display: inline-block; 
                background: linear-gradient(135deg, rgb(41, 128, 185) 0%, rgb(52, 152, 219) 100%); 
                color: white; 
                padding: 15px 30px; 
                text-decoration: none; 
                border-radius: 25px; 
                font-weight: bold; 
                margin: 20px 0; 
                text-align: center; 
            }
            .footer { 
                background: #333; 
                color: white; 
                padding: 30px; 
                text-align: center; 
                font-size: 14px; 
            }
            .footer a { 
                color: rgb(52, 152, 219); 
                text-decoration: none; 
            }
            @media (max-width: 600px) {
                .features-grid { 
                    grid-template-columns: 1fr; 
                }
                .header h1 { 
                    font-size: 24px; 
                }
                .content { 
                    padding: 20px; 
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Welcome to A2Z BOOKSHOP!</h1>
                <p class="subtitle">Your Literary Journey Begins Here</p>
            </div>
            
            <div class="content">
                <div class="welcome-message">
                    <h2>Hello ${user.firstName} ${user.lastName}!</h2>
                    <p>We're absolutely delighted to welcome you to the A2Z BOOKSHOP family! Thank you for creating your account with us using your ${registrationMethod}.</p>
                </div>
                
                <div class="personalized-section">
                    <h3>🌟 Your Account Details</h3>
                    <p><strong>Name:</strong> ${user.firstName} ${user.lastName}</p>
                    <p><strong>Registration Method:</strong> ${user.authProvider === 'email' ? 'Email' : 'Phone Number'}</p>
                    <p><strong>Contact:</strong> ${contactInfo}</p>
                    <p><strong>Account Status:</strong> Active ✅</p>
                </div>
                
                <div class="features-grid">
                    <div class="feature-card">
                        <div class="feature-icon">📚</div>
                        <h4>Vast Collection</h4>
                        <p>Browse thousands of books across all genres</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">🚚</div>
                        <h4>Global Shipping</h4>
                        <p>We deliver worldwide with tracking</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">💝</div>
                        <h4>Wishlist Feature</h4>
                        <p>Save your favorite books for later</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">🔄</div>
                        <h4>Easy Returns</h4>
                        <p>15-day hassle-free return policy</p>
                    </div>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://a2zbookshop.com" class="cta-button">
                        Start Shopping Now 🛒
                    </a>
                </div>
                
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h4 style="color: #856404; margin-top: 0;">🎁 Special Welcome Offer!</h4>
                    <p style="color: #856404; margin-bottom: 0;">As a new member, enjoy browsing our featured collection and check back for exciting offers!</p>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                    <h4>Need Help Getting Started?</h4>
                    <ul style="padding-left: 20px;">
                        <li>Browse our <a href="https://a2zbookshop.com/catalog" style="color: rgb(41, 128, 185);">book catalog</a></li>
                        <li>Check our <a href="https://a2zbookshop.com/shipping-info" style="color: rgb(41, 128, 185);">shipping information</a></li>
                        <li>Read our <a href="https://a2zbookshop.com/return-policy" style="color: rgb(41, 128, 185);">return policy</a></li>
                        <li>Contact our support team if you need assistance</li>
                    </ul>
                </div>
            </div>
            
            <div class="footer">
                <h3 style="margin-top: 0;">Stay Connected</h3>
                <p>
                    📧 Email: <a href="mailto:support@a2zbookshop.com">support@a2zbookshop.com</a><br>
                    📧 Alternative: <a href="mailto:a2zbookshopglobal@gmail.com">a2zbookshopglobal@gmail.com</a><br>
                    🌐 Website: <a href="https://a2zbookshop.com">https://a2zbookshop.com</a><br>
                    🌐 Alternative: <a href="https://www.a2zbookshop.com">https://www.a2zbookshop.com</a>
                </p>
                <p style="margin-top: 20px; font-size: 12px; opacity: 0.8;">
                    You received this email because you created an account with A2Z BOOKSHOP.<br>
                    © 2025 A2Z BOOKSHOP. All rights reserved.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Send welcome email to new customers
export const sendWelcomeEmail = async (data: WelcomeEmailData): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log('Email transporter not available - skipping welcome email');
      return false;
    }

    const htmlContent = generateWelcomeHTMLInternal(data);
    const customerEmail = data.user.email;

    if (!customerEmail) {
      console.log('No email provided for welcome email - skipping');
      return false;
    }

    const mailOptions = {
      from: {
        name: 'A2Z BOOKSHOP',
        address: 'orders@a2zbookshop.com'
      },
      to: customerEmail,
      subject: 'Welcome to A2Z BOOKSHOP - Your Book Journey Begins!',
      html: htmlContent,
      text: `Welcome to A2Z BOOKSHOP! Thank you for joining our community of book lovers. We're excited to help you discover amazing books from around the world.`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent successfully to ${customerEmail}:`, info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
};

// Generic email sending function
export const sendEmail = async (params: {
  to: string;
  from?: string;
  subject: string;
  text?: string;
  html?: string;
}): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log('Email transporter not available');
      return false;
    }

    const info = await transporter.sendMail({
      from: params.from || {
        name: 'A2Z BOOKSHOP',
        address: 'orders@a2zbookshop.com'
      },
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html
    });

    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

export const testEmailConfiguration = async (): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log('Email transporter not available - test failed');
      return false;
    }
    
    // Test connection
    await transporter.verify();
    console.log('✅ Email configuration test successful');
    
    // Send test email
    const info = await transporter.sendMail({
      from: {
        name: 'A2Z BOOKSHOP',
        address: 'orders@a2zbookshop.com'
      },
      to: 'orders@a2zbookshop.com',
      subject: 'A2Z BOOKSHOP - Email System Ready',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #d32f2f;">A<span style="color: #d32f2f;">2</span>Z BOOKSHOP</h2>
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px;">
            <h3 style="color: #1e40af;">Email System Test Successful!</h3>
            <p>Your Brevo SMTP configuration is working perfectly.</p>
            <p>Email system ready for order confirmations and notifications.</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Server:</strong> smtp-relay.brevo.com</p>
          </div>
        </div>
      `
    });
    
    console.log('✅ Test email sent successfully - Message ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('Email configuration test failed:', error instanceof Error ? error.message : error);
    return false;
  }
};