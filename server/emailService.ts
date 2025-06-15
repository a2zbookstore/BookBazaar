import nodemailer from 'nodemailer';
import { Order, OrderItem, Book } from '../shared/schema';

// Email configuration for Zoho Mail
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.zoho.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.ZOHO_EMAIL || 'orders@a2zbookshop.com',
      pass: process.env.ZOHO_PASSWORD // App password from Zoho
    },
    tls: {
      rejectUnauthorized: false
    }
  });
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
        <p style="color: #6b7280; margin-bottom: 10px;">Thank you for choosing A2Z BOOKSHOP!</p>
        <p style="color: #6b7280; margin-bottom: 10px;">
          Questions? Contact us at <a href="mailto:orders@a2zbookshop.com" style="color: #3b82f6;">orders@a2zbookshop.com</a>
        </p>
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
            <td style="padding: 8px 0;">$${order.total.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Order Date:</strong></td>
            <td style="padding: 8px 0;">${new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
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
        <p style="color: #6b7280; margin-bottom: 10px;">Thank you for choosing A2Z BOOKSHOP!</p>
        <p style="color: #6b7280; margin-bottom: 10px;">
          Questions? Contact us at <a href="mailto:orders@a2zbookshop.com" style="color: #3b82f6;">orders@a2zbookshop.com</a>
        </p>
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
    const htmlContent = generateOrderConfirmationHTML(data);

    // Email to customer
    const customerMailOptions = {
      from: {
        name: 'A2Z BOOKSHOP',
        address: process.env.ZOHO_EMAIL || 'orders@a2zbookshop.com'
      },
      to: data.customerEmail,
      subject: `Order Confirmation #${data.order.id} - A2Z BOOKSHOP`,
      html: htmlContent,
      text: `Thank you for your order #${data.order.id}! Your order total is $${data.order.total.toFixed(2)}. We'll process your order within 1-2 business days and send you tracking information once it ships.`
    };

    // Copy to admin
    const adminMailOptions = {
      from: {
        name: 'A2Z BOOKSHOP',
        address: process.env.ZOHO_EMAIL || 'orders@a2zbookshop.com'
      },
      to: 'orders@a2zbookshop.com',
      subject: `New Order #${data.order.id} - Admin Copy`,
      html: htmlContent,
      text: `New order received from ${data.customerEmail}. Order #${data.order.id}, Total: $${data.order.total.toFixed(2)}`
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
    const htmlContent = generateStatusUpdateHTML(data);

    const mailOptions = {
      from: {
        name: 'A2Z BOOKSHOP',
        address: process.env.ZOHO_EMAIL || 'orders@a2zbookshop.com'
      },
      to: data.customerEmail,
      subject: `Order #${data.order.id} Status Update - ${data.newStatus.toUpperCase()}`,
      html: htmlContent,
      text: `Your order #${data.order.id} status has been updated to: ${data.newStatus.toUpperCase()}. ${data.trackingNumber ? `Tracking: ${data.trackingNumber}` : ''}`
    };

    await transporter.sendMail(mailOptions);
    console.log(`Status update email sent for order #${data.order.id}, new status: ${data.newStatus}`);
    return true;
  } catch (error) {
    console.error('Error sending status update email:', error);
    return false;
  }
};

// Test email configuration
export const testEmailConfiguration = async (): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email configuration is valid');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
};