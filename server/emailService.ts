import nodemailer from 'nodemailer';
import { Order, OrderItem, Book } from '../shared/schema';

// Zoho Mail Configuration - Single SMTP account with alias addresses
// All emails authenticate with info@a2zbookshop.com but send from different aliases

const getZohoEmail = (type: 'orders' | 'support' | 'notifications' | 'admin' | 'info' = 'info') => {
  const emailMap = {
    orders: 'orders@a2zbookshop.com',
    support: 'support@a2zbookshop.com',
    notifications: 'notifications@a2zbookshop.com',
    admin: 'admin@a2zbookshop.com',
    info: process.env.ZOHO_EMAIL || 'info@a2zbookshop.com'
  };
  return emailMap[type];
};

// Single transporter that authenticates with Zoho Mail
let transporter: any = null;

const createTransporter = () => {
  // Return existing transporter if already created
  if (transporter) {
    return transporter;
  }

  const zohoEmail = getZohoEmail('info');
  // Strip spaces — Zoho App Passwords are sometimes displayed with spaces
  const zohoPassword = (process.env.ZOHO_PASSWORD || '').replace(/\s/g, '');

  if (!zohoEmail || !zohoPassword) {
    console.error('Zoho Mail credentials not configured. Set ZOHO_EMAIL and ZOHO_PASSWORD environment variables.');
    return null;
  }

  // Port 465 with SSL on India datacenter (smtp.zoho.in)
  transporter = nodemailer.createTransport({
    host: 'smtp.zoho.in',
    port: 465,
    secure: true, // SSL
    auth: {
      user: zohoEmail,
      pass: zohoPassword
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

  return transporter;
};

export const testZohoConnection = async (): Promise<boolean> => {
  try {
    const zohoEmail = process.env.ZOHO_EMAIL;
    const zohoPassword = process.env.ZOHO_PASSWORD;

    if (!zohoEmail || !zohoPassword) {
      console.log('❌ Zoho Mail credentials missing - Set ZOHO_EMAIL and ZOHO_PASSWORD in .env');
      return false;
    }

    // Strip spaces — Zoho App Passwords are sometimes displayed with spaces
    const cleanPassword = zohoPassword.replace(/\s/g, '');
    console.log(`   Zoho: testing connection for ${zohoEmail} via smtp.zoho.in:465 ...`);

    // Always create a fresh transporter for the connection test
    const testTransporter = nodemailer.createTransport({
      host: 'smtp.zoho.in',
      port: 465,
      secure: true,
      auth: {
        user: zohoEmail,
        pass: cleanPassword
      },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 15000
    });

    await testTransporter.verify();
    console.log('✅ Zoho Mail connected successfully - Emails ready via smtp.zoho.in:465');
    console.log(`   Auth account  : ${zohoEmail}`);
    return true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log(`❌ Zoho Mail connection failed - ${msg}`);
    if (msg.includes('535') || msg.includes('Authentication')) {
      console.log('   FIX: Go to Zoho Mail → Settings → Security → App Passwords');
      console.log('        Generate a new App Password and update ZOHO_PASSWORD in .env');
    } else {
      console.log('   Check ZOHO_EMAIL / ZOHO_PASSWORD and that SMTP is enabled in Zoho settings');
    }
    console.log(' Emails will be skipped until Zoho Mail is configured correctly');
    return false;
  }
};

interface OrderEmailData {
  order: Order & { items: (OrderItem & { book: Book })[] };
  customerEmail: string;
  customerName: string;
  notificationEmail?: string; // Optional extra address (e.g. form email when different from account email)
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

interface CancellationEmailData {
  order: Order & { items?: (OrderItem & { book: Book })[] };
  customerEmail: string;
  customerName: string;
  cancelledByCustomer?: boolean;
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

// Newsletter subscription confirmation email
export async function sendNewsletterConfirmationEmail(email: string): Promise<boolean> {
  try {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="x-apple-disable-message-reformatting">
        <title>You're on the list! – A2Z BOOKSHOP</title>
        <style>
          /* Reset */
          * { box-sizing: border-box; }
          body { margin: 0; padding: 0; background: #f1f5f9; font-family: 'Segoe UI', Arial, sans-serif; -webkit-text-size-adjust: 100%; }
          img { border: 0; display: block; max-width: 100%; }
          table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }

          /* Outer wrapper */
          .email-wrapper { width: 100%; background: #f1f5f9; padding: 24px 0; }

          /* Card */
          .email-card {
            width: 100%;
            max-width: 620px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 6px 32px rgba(0,0,0,0.10);
          }

          /* Header */
          .email-header {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f766e 100%);
            padding: 52px 32px 40px;
            text-align: center;
          }
          .email-header .brand {
            margin: 0 0 10px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 4px;
            text-transform: uppercase;
            color: #94a3b8;
          }
          .email-header h1 {
            margin: 0 0 12px;
            font-size: 34px;
            font-weight: 800;
            color: #ffffff;
            line-height: 1.2;
          }
          .email-header .tagline {
            margin: 0;
            font-size: 16px;
            color: #cbd5e1;
            line-height: 1.6;
          }

          /* Gradient bar */
          .gradient-bar { height: 4px; background: linear-gradient(90deg, #0f766e, #0891b2, #6366f1); }

          /* Body */
          .email-body { padding: 36px 32px 28px; }
          .email-body .greeting { margin: 0 0 16px; font-size: 17px; font-weight: 600; color: #1e293b; }
          .email-body .intro { margin: 0 0 28px; font-size: 15px; color: #475569; line-height: 1.75; }
          .email-body .intro strong { color: #0f172a; }

          /* Benefits box */
          .benefits-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 28px 24px;
            margin: 0 0 32px;
          }
          .benefits-box .benefits-title {
            margin: 0 0 20px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 2.5px;
            text-transform: uppercase;
            color: #64748b;
          }
          .benefit-row { display: flex; align-items: flex-start; margin-bottom: 16px; }
          .benefit-row:last-child { margin-bottom: 0; }
          .benefit-text { font-size: 14px; color: #334155; line-height: 1.65; }
          .benefit-text strong { color: #0f172a; }

          /* CTA */
          .cta-wrapper { text-align: center; margin: 0 0 8px; }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #0f766e 0%, #0891b2 100%);
            color: #ffffff !important;
            text-decoration: none;
            font-size: 16px;
            font-weight: 700;
            padding: 18px 48px;
            border-radius: 50px;
            letter-spacing: 0.4px;
            mso-padding-alt: 0;
          }

          /* Divider */
          .divider { border: none; border-top: 1px solid #e2e8f0; margin: 28px 0; }

          /* Footer note */
          .footer-note { padding: 0 0 28px; text-align: center; }
          .footer-note p { margin: 0 0 8px; font-size: 13px; color: #94a3b8; line-height: 1.6; }
          .footer-note a { color: #0891b2; text-decoration: none; }

          /* Bottom bar */
          .bottom-bar { background: #1e293b; padding: 22px 32px; text-align: center; }
          .bottom-bar .brand-name { margin: 0 0 4px; font-size: 13px; font-weight: 700; color: #e2e8f0; letter-spacing: 1px; }
          .bottom-bar .copy { margin: 0; font-size: 12px; color: #64748b; }

          /* ── Mobile ── */
          @media only screen and (max-width: 640px) {
            .email-wrapper { padding: 0 !important; }

            .email-card {
              border-radius: 0 !important;
              max-width: 100% !important;
              width: 100% !important;
            }

            .email-header { padding: 40px 20px 32px !important; }
            .email-header h1 { font-size: 28px !important; }
            .email-header .tagline { font-size: 15px !important; }

            .email-body { padding: 28px 20px 20px !important; }
            .email-body .greeting { font-size: 16px !important; }
            .email-body .intro { font-size: 14px !important; }

            .benefits-box { padding: 22px 16px !important; }
            .benefit-text { font-size: 13px !important; }

            .cta-button {
              display: block !important;
              width: 100% !important;
              text-align: center !important;
              padding: 18px 24px !important;
              border-radius: 12px !important;
              font-size: 15px !important;
            }

            .footer-note { padding: 0 0 24px !important; }
            .bottom-bar { padding: 20px 16px !important; }
          }
        </style>
      </head>
      <body>

        <div class="email-wrapper">
          <div class="email-card">

            <!-- Header -->
            <div class="email-header">
              <p class="brand">A2Z BOOKSHOP</p>
              <h1>You're on the list!</h1>
              <p class="tagline">Welcome to our community of passionate readers.</p>
            </div>

            <!-- Gradient bar -->
            <div class="gradient-bar"></div>

            <!-- Body -->
            <div class="email-body">
              <p class="greeting">Hi there, Book Lover!</p>
              <p class="intro">
                Your email address <strong>${email}</strong> has been successfully added to the
                <strong>A2Z BOOKSHOP newsletter</strong>. Get ready for a world of books delivered
                straight to your inbox.
              </p>

              <!-- Benefits box -->
              <div class="benefits-box">
                <p class="benefits-title">What you'll receive</p>

                <div class="benefit-row">
                  <span class="benefit-text"><strong>New Arrivals</strong> — First look at freshly stocked titles across all genres.</span>
                </div>
                <div class="benefit-row">
                  <span class="benefit-text"><strong>Exclusive Offers</strong> — Member-only discounts and seasonal promotions.</span>
                </div>
                <div class="benefit-row">
                  <span class="benefit-text"><strong>Curated Picks</strong> — Hand-picked recommendations from our bookshop team.</span>
                </div>
                <div class="benefit-row">
                  <span class="benefit-text"><strong>Bookshop News</strong> — Updates, events, and stories from our global community.</span>
                </div>
              </div>

              <!-- CTA -->
              <div class="cta-wrapper">
                <a href="https://a2zbookshop.com" class="cta-button">Browse the Collection →</a>
              </div>

              <hr class="divider">

              <!-- Footer note -->
              <div class="footer-note">
                <p style="font-weight:600;color:#64748b;">This is an automated email — please do not reply to this message.</p>
                <p>Replies to this address are not monitored and will not be received.</p>
                <p>Didn't subscribe? You can safely ignore this email — no action needed.</p>
                <p>For help, contact us at <a href="mailto:support@a2zbookshop.com">support@a2zbookshop.com</a></p>
              </div>
            </div>

            <!-- Bottom bar -->
            <div class="bottom-bar">
              <p class="brand-name">A2Z BOOKSHOP</p>
              <p class="copy">© ${new Date().getFullYear()} A2Z BOOKSHOP. All rights reserved.</p>
            </div>

          </div>
        </div>

      </body>
      </html>
    `;
    return await sendEmail({
      to: email,
      from: getZohoEmail('notifications'),
      subject: "You're subscribed! Welcome to the A2Z BOOKSHOP newsletter",
      html,
      text: `This is an automated email — please do not reply to this message. Replies are not monitored.\n\nHi there! You've successfully subscribed to the A2Z BOOKSHOP newsletter. You'll now receive new arrivals, exclusive offers, curated picks, and bookshop news at ${email}. Visit us at https://a2zbookshop.com. If you didn't subscribe, please ignore this email. For help, contact support@a2zbookshop.com`,
      emailType: 'notifications'
    });
  } catch (error) {
    console.error('Error sending newsletter confirmation email:', error);
    return false;
  }
}

// Generate order confirmation email HTML
const generateOrderConfirmationHTML = (data: OrderEmailData) => {
  const { order, customerName } = data;

  const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  }) : 'N/A';
  const subtotal = (parseFloat(String(order.subtotal ?? 0)) || 0);
  const shipping = (parseFloat(String(order.shipping ?? 0)) || 0);
  const total    = (parseFloat(String(order.total    ?? 0)) || 0);
  const tax      = (parseFloat(String(order.tax      ?? 0)) || 0);

  const paymentStatus = order.paymentStatus || 'N/A';
  const paymentId     = order.paymentId     || 'N/A';
  const rawMethod     = order.paymentMethod || 'N/A';
  const paymentMethodLabel = rawMethod
    .replace('razorpay-international', 'Razorpay (International)')
    .replace('razorpay', 'Razorpay')
    .replace('stripe', 'Stripe')
    .replace('paypal', 'PayPal')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c: string) => c.toUpperCase());
  const paymentStatusColor = paymentStatus.toLowerCase() === 'paid' ? '#065f46' : '#92400e';
  const paymentStatusBg    = paymentStatus.toLowerCase() === 'paid' ? '#d1fae5' : '#fef3c7';


  const shippingAddress = (() => {
    const addr = order.shippingAddress;
    if (!addr) return 'Address not provided';
    if (typeof addr === 'object') {
      const a = addr as any;
      return [a.street, a.city, a.state, a.zip, a.country]
        .filter(Boolean)
        .join('<br>');
    }
    if (typeof addr === 'string') {
      try {
        const parsed = JSON.parse(addr);
        return [parsed.street, parsed.city, parsed.state, parsed.zip, parsed.country]
          .filter(Boolean)
          .join('<br>');
      } catch {
        return addr.split(',').map((s: string) => s.trim()).filter(Boolean).join('<br>');
      }
    }
    return 'Address not provided';
  })();

  const itemsHTML = (order.items || []).map((item, idx) => {    
    const book  = item.book || {} as any;
    const price = parseFloat(String(item.book.price ?? 0)) || 0;
    const qty   = item.quantity || 0;
    const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
    return `
      <tr style="background:${rowBg};">
        <td style="padding:14px 16px;border-bottom:1px solid #e2e8f0;vertical-align:top;">
          <p style="margin:0 0 3px;font-size:14px;font-weight:700;color:#0f172a;">${book.title || 'Unknown Title'}</p>
          <p style="margin:0 0 2px;font-size:12px;color:#64748b;">by ${book.author || 'Unknown Author'}</p>
          <p style="margin:0;font-size:11px;color:#94a3b8;letter-spacing:0.3px;">ISBN: ${book.isbn || 'N/A'}</p>
        </td>
        <td style="padding:14px 12px;border-bottom:1px solid #e2e8f0;text-align:center;vertical-align:middle;font-size:14px;color:#334155;white-space:nowrap;">${qty}</td>
        <td style="padding:14px 12px;border-bottom:1px solid #e2e8f0;text-align:right;vertical-align:middle;font-size:14px;color:#334155;white-space:nowrap;">$${price.toFixed(2)}</td>
        <td style="padding:14px 16px;border-bottom:1px solid #e2e8f0;text-align:right;vertical-align:middle;font-size:14px;font-weight:700;color:#0f172a;white-space:nowrap;">$${(qty * price).toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="x-apple-disable-message-reformatting">
      <title>Order Confirmation #${order.id} - A2Z BOOKSHOP</title>
      <style>
        * { box-sizing:border-box; }
        body { margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;-webkit-text-size-adjust:100%; }
        table { border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt; }

        .email-wrapper { width:100%;background:#f1f5f9;padding:28px 0; }
        .email-card    { width:100%;max-width:640px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 6px 32px rgba(0,0,0,0.10); }

        .header        { background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 55%,#0f766e 100%);padding:48px 36px 36px;text-align:center; }
        .header .brand { margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:#94a3b8; }
        .header h1     { margin:0 0 10px;font-size:30px;font-weight:800;color:#ffffff;line-height:1.25; }
        .header .sub   { margin:0;font-size:15px;color:#cbd5e1;line-height:1.55; }

        .grad-bar { height:4px;background:linear-gradient(90deg,#0f766e,#0891b2,#6366f1); }

        .badge-row        { background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:20px 36px; }
        .badge-row table  { width:100%; }
        .badge-cell       { text-align:center;padding:0 8px; }
        .badge-label      { display:block;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;margin-bottom:5px; }
        .badge-value      { display:block;font-size:15px;font-weight:700;color:#0f172a; }
        .status-pill      { display:inline-block;background:#fef3c7;color:#92400e;font-size:11px;font-weight:700;padding:4px 12px;border-radius:50px;letter-spacing:0.5px;text-transform:uppercase; }

        .body         { padding:32px 36px; }
        .greeting     { margin:0 0 8px;font-size:18px;font-weight:700;color:#0f172a; }
        .intro-text   { margin:0 0 28px;font-size:14px;color:#475569;line-height:1.75; }

        .section-heading { margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:#64748b; }

        .items-table           { width:100%;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:28px; }
        .items-table thead tr  { background:#f1f5f9; }
        .items-table thead th  { padding:11px 16px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#64748b;text-align:left;border-bottom:1px solid #e2e8f0; }
        .items-table thead th.right  { text-align:right; }
        .items-table thead th.center { text-align:center; }

        .summary-box          { background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:4px 24px;margin-bottom:28px; }
        .summary-table        { width:100%;border-collapse:collapse; }
        .summary-table td     { padding:11px 0;font-size:14px;color:#475569;border-bottom:1px solid #e2e8f0; }
        .summary-table tr:last-child td { border-bottom:none;padding-top:16px; }
        .summary-label        { text-align:left; }
        .summary-amount       { text-align:right;font-weight:600;color:#0f172a; }
        .summary-total-label  { text-align:left;font-size:16px;font-weight:800;color:#0f172a; }
        .summary-total-amount { text-align:right;font-size:16px;font-weight:800;color:#0f766e; }

        .address-box { background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;margin-bottom:28px;font-size:14px;color:#334155;line-height:1.8; }

        .steps-box             { background:#eff6ff;border-left:4px solid #3b82f6;border-radius:0 12px 12px 0;padding:20px 24px;margin-bottom:28px; }
        .steps-box .steps-title { margin:0 0 12px;font-size:13px;font-weight:700;color:#1e40af;letter-spacing:0.5px; }
        .steps-box .step       { font-size:13px;color:#1e40af;line-height:1.7;margin:0 0 6px;padding-left:16px;position:relative; }
        .steps-box .step:last-child { margin-bottom:0; }
        .steps-box .step:before { content:'—';position:absolute;left:0; }

        .cta-wrapper { text-align:center;margin:0 0 28px; }
        .cta-btn     { display:inline-block;background:linear-gradient(135deg,#0f766e 0%,#0891b2 100%);color:#ffffff !important;text-decoration:none;font-size:15px;font-weight:700;padding:16px 44px;border-radius:50px;letter-spacing:0.4px; }

        .footer-note          { text-align:center;padding:0 0 4px; }
        .footer-note p        { margin:0 0 6px;font-size:12px;color:#94a3b8;line-height:1.6; }
        .footer-note a        { color:#0891b2;text-decoration:none; }
        .footer-note .no-reply { font-weight:600;color:#64748b;font-size:12px; }

        .bottom-bar       { background:#1e293b;padding:22px 36px;text-align:center; }
        .bottom-bar .bname { margin:0 0 4px;font-size:13px;font-weight:700;color:#e2e8f0;letter-spacing:1px; }
        .bottom-bar .copy  { margin:0;font-size:12px;color:#64748b; }

        @media only screen and (max-width:640px) {
          .email-wrapper { padding:0 !important; }
          .email-card    { border-radius:0 !important;max-width:100% !important; }
          .header        { padding:36px 20px 28px !important; }
          .header h1     { font-size:24px !important; }
          .badge-row     { padding:14px 16px !important; }
          .badge-cell    { padding:0 4px !important; }
          .badge-value   { font-size:12px !important; }
          .badge-label   { font-size:9px !important; }
          .body          { padding:24px 20px !important; }
          .items-table thead th { padding:9px 10px !important;font-size:10px !important; }
          .cta-btn       { display:block !important;width:100% !important;text-align:center !important;padding:16px 20px !important;border-radius:12px !important; }
          .summary-box,.address-box,.steps-box { padding:16px !important; }
          .bottom-bar    { padding:18px 20px !important; }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="email-card">

          <!-- Header -->
          <div class="header">
            <p class="brand">A2Z BOOKSHOP</p>
            <h1>Order Confirmed</h1>
            <p class="sub">Thank you, ${customerName}. Your order has been received and is being processed.</p>
          </div>
          <div class="grad-bar"></div>

          <!-- Order meta badges -->
          <div class="badge-row">
            <table>
              <tr>
                <td class="badge-cell">
                  <span class="badge-label">Order ID</span>
                  <span class="badge-value">#${order.id}</span>
                </td>
                <td class="badge-cell">
                  <span class="badge-label">Date</span>
                  <span class="badge-value">${orderDate}</span>
                </td>
                <td class="badge-cell">
                  <span class="badge-label">Order Status</span>
                  <span class="status-pill">${(order.status || 'Pending')}</span>
                </td>
                <td class="badge-cell">
                  <span class="badge-label">Payment</span>
                  <span style="display:inline-block;background:${paymentStatusBg};color:${paymentStatusColor};font-size:11px;font-weight:700;padding:4px 12px;border-radius:50px;letter-spacing:0.5px;text-transform:uppercase;">${paymentStatus}</span>
                </td>
                <td class="badge-cell">
                  <span class="badge-label">Total Charged</span>
                  <span class="badge-value">$${total.toFixed(2)}</span>
                </td>
              </tr>
            </table>
          </div>

          <!-- Body -->
          <div class="body">

            <p class="greeting">Hello, ${customerName}!</p>
            <p class="intro-text">
              Thank you for your purchase at A2Z BOOKSHOP. We have received your order and will begin
              processing it shortly. A shipping confirmation with tracking details will be sent once
              your books are dispatched.
            </p>

            <!-- Items -->
            <p class="section-heading">Items Ordered</p>
            <table class="items-table">
              <thead>
                <tr>
                  <th style="width:52%;">Book</th>
                  <th class="center" style="width:10%;">Qty</th>
                  <th class="right" style="width:17%;">Unit Price</th>
                  <th class="right" style="width:21%;">Line Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
              </tbody>
            </table>

            <!-- Order Summary -->
            <p class="section-heading">Order Summary</p>
            <div class="summary-box">
              <table class="summary-table">
                <tr>
                  <td class="summary-label">Subtotal</td>
                  <td class="summary-amount">$${subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td class="summary-label">Shipping &amp; Handling</td>
                  <td class="summary-amount">${shipping === 0 ? '<span style="color:#0f766e;font-weight:700;">Free</span>' : '$' + shipping.toFixed(2)}</td>
                </tr>
                <tr>
                  <td class="summary-total-label">Tax</td>
                  <td class="summary-total-amount">$${tax.toFixed(2)}</td>
                </tr>
                <tr>
                  <td class="summary-total-label">Total Charged</td>
                  <td class="summary-total-amount">$${total.toFixed(2)}</td>
                </tr>
              </table>
            </div>

            <!-- Payment Details -->
            <p class="section-heading">Payment Details</p>
            <div class="address-box" style="margin-bottom:28px;">
              <table style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="padding:7px 0;font-size:13px;color:#64748b;width:40%;">Payment Status</td>
                  <td style="padding:7px 0;font-size:13px;font-weight:700;color:${paymentStatusColor};text-align:right;">${paymentStatus.toUpperCase()}</td>
                </tr>
                <tr style="border-top:1px solid #e2e8f0;">
                  <td style="padding:7px 0;font-size:13px;color:#64748b;">Payment Method</td>
                  <td style="padding:7px 0;font-size:13px;font-weight:600;color:#0f172a;text-align:right;">${paymentMethodLabel}</td>
                </tr>
                <tr style="border-top:1px solid #e2e8f0;">
                  <td style="padding:7px 0;font-size:13px;color:#64748b;">Transaction ID</td>
                  <td style="padding:7px 0;font-size:12px;font-family:monospace;color:#334155;text-align:right;word-break:break-all;">${paymentId}</td>
                </tr>
              </table>
            </div>

            <!-- Shipping Address -->
            <p class="section-heading">Shipping Address</p>
            <div class="address-box">
              ${shippingAddress}
            </div>

            <!-- Next Steps -->
            <p class="section-heading">What Happens Next</p>
            <div class="steps-box">
              <p class="steps-title">Your order timeline</p>
              <p class="step">Your order will be processed within 1–2 business days.</p>
              <p class="step">A tracking number will be emailed once your books are dispatched.</p>
              <p class="step">Estimated delivery varies by destination and shipping method.</p>
              <p class="step">30-day hassle-free returns are available on all orders.</p>
            </div>

            <!-- CTA -->
            <div class="cta-wrapper">
              <a href="https://a2zbookshop.com" class="cta-btn">Continue Shopping</a>
            </div>

            <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 24px;">

            <!-- Footer note -->
            <div class="footer-note">
              <p class="no-reply">This is an automated email — please do not reply to this message.</p>
              <p>For order queries, contact us at <a href="mailto:support@a2zbookshop.com">support@a2zbookshop.com</a></p>
            </div>

          </div>

          <!-- Bottom bar -->
          <div class="bottom-bar">
            <p class="bname">A2Z BOOKSHOP</p>
            <p class="copy">© ${new Date().getFullYear()} A2Z BOOKSHOP. All rights reserved.</p>
          </div>

        </div>
      </div>
    </body>
    </html>
  `;
};

// Generate status update email HTML
const generateStatusUpdateHTML = (data: StatusUpdateEmailData) => {
  const { order, customerName, newStatus, trackingNumber, shippingCarrier, notes } = data;

  type StatusConfig = {
    headerBg: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    // icon removed
    headline: string;
    subline: string;
    calloutBg: string;
    calloutBorder: string;
    calloutTitle: string;
    calloutTitleColor: string;
    bullets: string[];
  };

  const statusConfig: { [key: string]: StatusConfig } = {
    pending: {
      headerBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      badgeBg: '#fef3c7',
      badgeText: '#92400e',
      badgeBorder: '#f59e0b',

      headline: 'We\'ve Received Your Order!',
      subline: 'Your order is pending confirmation. We\'ll notify you as soon as it\'s confirmed.',
      calloutBg: '#fffbeb',
      calloutBorder: '#f59e0b',
      calloutTitle: 'What Happens Next?',
      calloutTitleColor: '#92400e',
      bullets: [
        'Our team will review your order shortly',
        'You\'ll receive a confirmation email once processed',
        'Feel free to contact us if you have any questions',
      ],
    },
    confirmed: {
      headerBg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      badgeBg: '#eff6ff',
      badgeText: '#1e40af',
      badgeBorder: '#3b82f6',

      headline: 'Order Confirmed!',
      subline: 'Great news — your order has been confirmed and we\'re getting it ready for you.',
      calloutBg: '#eff6ff',
      calloutBorder: '#3b82f6',
      calloutTitle: 'What Happens Next?',
      calloutTitleColor: '#1e40af',
      bullets: [
        'Our team is now preparing your books',
        'You\'ll receive a shipping notification once dispatched',
        'Sit tight — your books are on their way!',
      ],
    },
    processing: {
      headerBg: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
      badgeBg: '#f5f3ff',
      badgeText: '#5b21b6',
      badgeBorder: '#8b5cf6',

      headline: 'We\'re Packing Your Books!',
      subline: 'Your order is currently being processed and packed with care.',
      calloutBg: '#f5f3ff',
      calloutBorder: '#8b5cf6',
      calloutTitle: 'Currently In Progress',
      calloutTitleColor: '#5b21b6',
      bullets: [
        'Your books are being carefully picked and packed',
        'Quality check is underway',
        'Shipping label will be generated soon',
      ],
    },
    shipped: {
      headerBg: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
      badgeBg: '#f0f9ff',
      badgeText: '#0c4a6e',
      badgeBorder: '#0ea5e9',

      headline: 'Your Order Is On Its Way!',
      subline: 'Your books have been dispatched and are heading your way. How exciting!',
      calloutBg: '#f0f9ff',
      calloutBorder: '#0ea5e9',
      calloutTitle: 'Tracking Your Shipment',
      calloutTitleColor: '#0c4a6e',
      bullets: [
        'Use your tracking number below to follow the journey',
        'Delivery times may vary by location',
        'Someone should be available to receive the package',
      ],
    },
    delivered: {
      headerBg: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
      badgeBg: '#d1fae5',
      badgeText: '#064e3b',
      badgeBorder: '#10b981',

      headline: 'Your Books Have Arrived!',
      subline: 'Your order has been delivered. We hope you love your new reads!',
      calloutBg: '#d1fae5',
      calloutBorder: '#10b981',
      calloutTitle: 'Enjoy Your Books!',
      calloutTitleColor: '#047857',
      bullets: [
        'We hope you enjoy every page!',
        'We offer 30-day returns if something\'s not right',
        'Share your experience — we\'d love a review!',
      ],
    },
    cancelled: {
      headerBg: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
      badgeBg: '#fee2e2',
      badgeText: '#991b1b',
      badgeBorder: '#ef4444',

      headline: 'Order Cancelled',
      subline: 'Your order has been cancelled. We\'re sorry to see this happen.',
      calloutBg: '#fee2e2',
      calloutBorder: '#ef4444',
      calloutTitle: 'Need Help?',
      calloutTitleColor: '#991b1b',
      bullets: [
        'If you didn\'t request this cancellation, please contact us immediately',
        'Any payments will be refunded within 5–7 business days',
        'We\'d love to help you place a new order anytime',
      ],
    },
    refunded: {
      headerBg: 'linear-gradient(135deg, #6b7280 0%, #374151 100%)',
      badgeBg: '#f3f4f6',
      badgeText: '#1f2937',
      badgeBorder: '#6b7280',

      headline: 'Refund Processed',
      subline: 'Your refund has been initiated. The amount will reflect in your account shortly.',
      calloutBg: '#f3f4f6',
      calloutBorder: '#6b7280',
      calloutTitle: 'Refund Details',
      calloutTitleColor: '#1f2937',
      bullets: [
        'Refunds typically take 5–7 business days to appear',
        'The amount will be credited to your original payment method',
        'Reach out if you have any questions about your refund',
      ],
    },
  };

  const cfg = statusConfig[newStatus.toLowerCase()] ?? {
    headerBg: 'linear-gradient(135deg, #6b7280 0%, #374151 100%)',
    badgeBg: '#f3f4f6',
    badgeText: '#1f2937',
    badgeBorder: '#6b7280',

    headline: 'Order Update',
    subline: 'There\'s been an update to your order.',
    calloutBg: '#f3f4f6',
    calloutBorder: '#6b7280',
    calloutTitle: 'What\'s Next?',
    calloutTitleColor: '#1f2937',
    bullets: ['We\'ll keep you posted on any further updates.'],
  } as StatusConfig;

  const formattedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A';

  const orderTotal = `$${(parseFloat(String(order.total ?? 0)) || 0).toFixed(2)}`;

  const trackingBlock = (trackingNumber || shippingCarrier)
    ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f9ff;border-radius:10px;border:1px solid #bae6fd;margin:24px 0;">
        <tr>
          <td style="padding:20px;">
            <p style="margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#0369a1;">Tracking Information</p>
            ${shippingCarrier ? `<p style="margin:6px 0;font-size:15px;color:#1e3a5f;"><strong>Carrier:</strong> ${shippingCarrier}</p>` : ''}
            ${trackingNumber ? `<p style="margin:6px 0;font-size:15px;color:#1e3a5f;"><strong>Tracking #:</strong> <span style="font-family:monospace;background:#dbeafe;padding:2px 8px;border-radius:4px;">${trackingNumber}</span></p>` : ''}
            ${notes ? `<p style="margin:10px 0 0;font-size:14px;color:#334155;"><strong>Note:</strong> ${notes}</p>` : ''}
          </td>
        </tr>
      </table>`
    : (notes ? `<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;margin:24px 0;"><tr><td style="padding:20px;"><p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.06em;">Note from our team</p><p style="margin:0;font-size:15px;color:#334155;">${notes}</p></td></tr></table>` : '');

  const bulletItems = cfg.bullets
    .map(b => `<tr><td style="padding:5px 0;font-size:15px;color:#374151;">&#8226;&nbsp; ${b}</td></tr>`)
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Update #${order.id} — A2Z BOOKSHOP</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

          <!-- ===== HEADER ===== -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 55%,#0f766e 100%);border-radius:16px 16px 0 0;padding:48px 40px 36px;text-align:center;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:#94a3b8;">A2Z BOOKSHOP</p>
              <h1 style="margin:0 0 10px;font-size:30px;font-weight:800;color:#ffffff;line-height:1.25;">${cfg.headline}</h1>
              <p style="margin:0;font-size:15px;color:#cbd5e1;line-height:1.55;">${cfg.subline}</p>
            </td>
          </tr>

          <!-- ===== GRADIENT BAR ===== -->
          <tr>
            <td style="height:4px;background:${cfg.headerBg};"></td>
          </tr>

          <!-- ===== STATUS BADGE ===== -->
          <tr>
            <td style="background:#ffffff;padding:28px 40px 20px;text-align:center;">
              <span style="display:inline-block;background:${cfg.badgeBg};color:${cfg.badgeText};border:1.5px solid ${cfg.badgeBorder};padding:8px 22px;border-radius:999px;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
                ${newStatus.toUpperCase()}
              </span>
            </td>
          </tr>

          <!-- ===== GREETING ===== -->
          <tr>
            <td style="background:#ffffff;padding:0 40px 24px;">
              <p style="margin:0;font-size:15px;color:#374151;line-height:1.7;">
                Hi <strong>${customerName}</strong>,<br>
                Here's the latest on your order. We've summarized everything below for you.
              </p>
            </td>
          </tr>

          <!-- ===== TRACKING / NOTES ===== -->
          ${trackingBlock ? `<tr><td style="background:#ffffff;padding:0 40px;">${trackingBlock}</td></tr>` : ''}

          <!-- ===== ORDER SUMMARY ===== -->
          <tr>
            <td style="background:#ffffff;padding:0 40px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;overflow:hidden;">
                <tr>
                  <td style="padding:14px 20px;background:#f1f5f9;border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;">Order Summary</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:12px 0;font-size:14px;color:#64748b;border-bottom:1px solid #f1f5f9;">Order ID</td>
                        <td style="padding:12px 0;font-size:14px;color:#0f172a;font-weight:600;text-align:right;border-bottom:1px solid #f1f5f9;">#${order.id}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;font-size:14px;color:#64748b;border-bottom:1px solid #f1f5f9;">Order Date</td>
                        <td style="padding:12px 0;font-size:14px;color:#0f172a;font-weight:600;text-align:right;border-bottom:1px solid #f1f5f9;">${formattedDate}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;font-size:14px;color:#64748b;">Order Total</td>
                        <td style="padding:12px 0;font-size:16px;color:#0f172a;font-weight:800;text-align:right;">${orderTotal}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ===== CALLOUT ===== -->
          <tr>
            <td style="background:#ffffff;padding:0 40px 36px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:${cfg.calloutBg};border-radius:10px;border-left:4px solid ${cfg.calloutBorder};">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:${cfg.calloutTitleColor};">${cfg.calloutTitle}</p>
                    <table cellpadding="0" cellspacing="0">
                      ${bulletItems}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ===== CTA BUTTON ===== -->
          <tr>
            <td style="background:#ffffff;padding:0 40px 40px;text-align:center;">
              <a href="https://a2zbookshop.com" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:13px 32px;border-radius:8px;font-size:14px;font-weight:700;letter-spacing:0.04em;">
                Visit A2Z BOOKSHOP →
              </a>
            </td>
          </tr>

          <!-- ===== FOOTER ===== -->
          <tr>
            <td style="background:#0f172a;border-radius:0 0 16px 16px;padding:28px 40px;text-align:center;">
              <p style="margin:0 0 8px;font-size:18px;font-weight:800;color:#ffffff;">
                A<span style="color:#fde68a;">2</span>Z BOOKSHOP
              </p>
              <p style="margin:0 0 14px;font-size:12px;color:#94a3b8;">Your trusted partner in discovering books worldwide</p>
              <p style="margin:0 0 6px;font-size:13px;">
                <a href="mailto:support@a2zbookshop.com" style="color:#7dd3fc;text-decoration:none;">support@a2zbookshop.com</a>
              </p>
              <p style="margin:0;font-size:11px;color:#475569;">
                This is an automated message — please do not reply directly to this email.<br>
                © ${new Date().getFullYear()} A2Z BOOKSHOP. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

// Generate order cancellation email HTML
const generateOrderCancellationHTML = (data: CancellationEmailData): string => {
  const { order, customerName, cancelledByCustomer = true } = data;

  const orderDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A';

  const total    = (parseFloat(String(order.total    ?? 0)) || 0);
  const subtotal = (parseFloat(String(order.subtotal ?? 0)) || 0);
  const shipping = (parseFloat(String(order.shipping ?? 0)) || 0);
  const tax      = (parseFloat(String(order.tax      ?? 0)) || 0);

  const paymentMethod = (order.paymentMethod || '').replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Online Payment';

  const itemsHTML = (order.items || []).map((item, idx) => {
    const book  = item.book || {} as any;
    const price = parseFloat(String(item.price ?? 0)) || 0;
    const qty   = item.quantity || 0;
    const rowBg = idx % 2 === 0 ? '#ffffff' : '#fef2f2';
    return `
      <tr style="background:${rowBg};">
        <td style="padding:12px 16px;border-bottom:1px solid #fee2e2;vertical-align:top;">
          <p style="margin:0 0 2px;font-size:14px;font-weight:700;color:#0f172a;">${book.title || 'Unknown Title'}</p>
          <p style="margin:0;font-size:12px;color:#64748b;">by ${book.author || 'Unknown Author'}</p>
        </td>
        <td style="padding:12px 12px;border-bottom:1px solid #fee2e2;text-align:center;vertical-align:middle;font-size:14px;color:#334155;white-space:nowrap;">${qty}</td>
        <td style="padding:12px 12px;border-bottom:1px solid #fee2e2;text-align:right;vertical-align:middle;font-size:14px;color:#334155;white-space:nowrap;">$${price.toFixed(2)}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #fee2e2;text-align:right;vertical-align:middle;font-size:14px;font-weight:700;color:#0f172a;white-space:nowrap;">$${(qty * price).toFixed(2)}</td>
      </tr>`;
  }).join('');

  const itemsBlock = (order.items && order.items.length > 0) ? `
    <!-- Items Cancelled -->
    <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:#64748b;">Items in This Order</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #fecaca;border-radius:12px;overflow:hidden;margin-bottom:28px;">
      <thead>
        <tr style="background:#fef2f2;">
          <th style="padding:10px 16px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#991b1b;text-align:left;border-bottom:1px solid #fecaca;width:52%;">Book</th>
          <th style="padding:10px 12px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#991b1b;text-align:center;border-bottom:1px solid #fecaca;width:10%;">Qty</th>
          <th style="padding:10px 12px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#991b1b;text-align:right;border-bottom:1px solid #fecaca;width:17%;">Unit</th>
          <th style="padding:10px 16px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#991b1b;text-align:right;border-bottom:1px solid #fecaca;width:21%;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHTML}
      </tbody>
    </table>` : '';

  const refundNote = (order.paymentStatus === 'paid')
    ? 'Since your order was paid, a <strong>full refund of $' + total.toFixed(2) + '</strong> will be processed to your original payment method (' + paymentMethod + ') within <strong>5–7 business days</strong>.'
    : 'No payment was captured for this order, so no refund is necessary.';

  const cancelContext = cancelledByCustomer
    ? 'You requested the cancellation of this order.'
    : 'This order has been cancelled by our team.';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>Order Cancelled #${order.id} — A2Z BOOKSHOP</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#7f1d1d 0%,#b91c1c 55%,#dc2626 100%);border-radius:16px 16px 0 0;padding:48px 40px 36px;text-align:center;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:#fca5a5;">A2Z BOOKSHOP</p>
              <h1 style="margin:0 0 10px;font-size:30px;font-weight:800;color:#ffffff;line-height:1.25;">Order Cancelled</h1>
              <p style="margin:0;font-size:15px;color:#fecaca;line-height:1.55;">Your order has been successfully cancelled.</p>
            </td>
          </tr>

          <!-- COLOUR BAR -->
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,#ef4444,#f97316,#eab308);"></td>
          </tr>

          <!-- ORDER META BADGES -->
          <tr>
            <td style="background:#ffffff;padding:24px 40px;border-bottom:1px solid #fee2e2;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:center;padding:0 8px;">
                    <span style="display:block;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;margin-bottom:5px;">Order ID</span>
                    <span style="display:block;font-size:15px;font-weight:700;color:#0f172a;">#${order.id}</span>
                  </td>
                  <td style="text-align:center;padding:0 8px;">
                    <span style="display:block;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;margin-bottom:5px;">Placed On</span>
                    <span style="display:block;font-size:15px;font-weight:700;color:#0f172a;">${orderDate}</span>
                  </td>
                  <td style="text-align:center;padding:0 8px;">
                    <span style="display:block;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;margin-bottom:5px;">Status</span>
                    <span style="display:inline-block;background:#fee2e2;color:#991b1b;border:1.5px solid #fca5a5;padding:5px 16px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">CANCELLED</span>
                  </td>
                  <td style="text-align:center;padding:0 8px;">
                    <span style="display:block;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;margin-bottom:5px;">Order Total</span>
                    <span style="display:block;font-size:15px;font-weight:700;color:#0f172a;">$${total.toFixed(2)}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background:#ffffff;padding:32px 40px 8px;">
              <p style="margin:0 0 6px;font-size:18px;font-weight:700;color:#0f172a;">Hi, ${customerName}!</p>
              <p style="margin:0 0 28px;font-size:14px;color:#475569;line-height:1.75;">
                ${cancelContext} We want to make sure this process is smooth for you — all the details are below.
              </p>

              ${itemsBlock}

              <!-- ORDER SUMMARY -->
              <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:#64748b;">Order Summary</p>
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:4px 24px;margin-bottom:28px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:11px 0;font-size:14px;color:#64748b;border-bottom:1px solid #e2e8f0;">Subtotal</td>
                    <td style="padding:11px 0;font-size:14px;font-weight:600;color:#0f172a;text-align:right;border-bottom:1px solid #e2e8f0;">$${subtotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="padding:11px 0;font-size:14px;color:#64748b;border-bottom:1px solid #e2e8f0;">Shipping</td>
                    <td style="padding:11px 0;font-size:14px;font-weight:600;color:#0f172a;text-align:right;border-bottom:1px solid #e2e8f0;">${shipping === 0 ? '<span style="color:#0f766e;font-weight:700;">Free</span>' : '$' + shipping.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="padding:11px 0;font-size:14px;color:#64748b;border-bottom:1px solid #e2e8f0;">Tax</td>
                    <td style="padding:11px 0;font-size:14px;font-weight:600;color:#0f172a;text-align:right;border-bottom:1px solid #e2e8f0;">$${tax.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="padding:14px 0 11px;font-size:16px;font-weight:800;color:#0f172a;">Total</td>
                    <td style="padding:14px 0 11px;font-size:16px;font-weight:800;color:#ef4444;text-align:right;">$${total.toFixed(2)}</td>
                  </tr>
                </table>
              </div>

              <!-- REFUND INFO -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border-left:4px solid #f97316;border-radius:0 12px 12px 0;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#c2410c;">Refund Information</p>
                    <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;">${refundNote}</p>
                  </td>
                </tr>
              </table>

              <!-- HELP -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border-left:4px solid #3b82f6;border-radius:0 12px 12px 0;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#1e40af;">Need Help?</p>
                    <p style="margin:0 0 6px;font-size:14px;color:#374151;line-height:1.7;">&#8226;&nbsp; If you didn't request this cancellation, please contact us immediately.</p>
                    <p style="margin:0 0 6px;font-size:14px;color:#374151;line-height:1.7;">&#8226;&nbsp; For refund queries, reach us at <a href="mailto:support@a2zbookshop.com" style="color:#1d4ed8;text-decoration:none;">support@a2zbookshop.com</a></p>
                    <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;">&#8226;&nbsp; We'd love to help you place a new order anytime.</p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <div style="text-align:center;margin:0 0 28px;">
                <a href="https://a2zbookshop.com" style="display:inline-block;background:linear-gradient(135deg,#0f766e 0%,#0891b2 100%);color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:16px 44px;border-radius:50px;letter-spacing:0.4px;">Browse Books Again →</a>
              </div>

              <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 24px;">

              <!-- FOOTER NOTE -->
              <div style="text-align:center;padding-bottom:28px;">
                <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#64748b;">This is an automated email — please do not reply to this message.</p>
                <p style="margin:0;font-size:12px;color:#94a3b8;">For help, contact us at <a href="mailto:support@a2zbookshop.com" style="color:#0891b2;text-decoration:none;">support@a2zbookshop.com</a></p>
              </div>
            </td>
          </tr>

          <!-- FOOTER BAR -->
          <tr>
            <td style="background:#1e293b;border-radius:0 0 16px 16px;padding:22px 40px;text-align:center;">
              <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#e2e8f0;letter-spacing:1px;">A2Z BOOKSHOP</p>
              <p style="margin:0;font-size:12px;color:#64748b;">© ${new Date().getFullYear()} A2Z BOOKSHOP. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

// Send order cancellation email
export const sendOrderCancellationEmail = async (data: CancellationEmailData): Promise<boolean> => {
  try {
    const transport = createTransporter();
    if (!transport) {
      console.log('Email transporter not available - skipping cancellation email');
      return false;
    }

    const htmlContent = generateOrderCancellationHTML(data);
    const orderId = data.order.id;

    const customerMailOptions = {
      from: { name: 'A2Z BOOKSHOP Support', address: getZohoEmail('support') },
      to: data.customerEmail,
      subject: `Order #${orderId} Has Been Cancelled — A2Z BOOKSHOP`,
      html: htmlContent,
      text: `Hi ${data.customerName}, your order #${orderId} has been successfully cancelled. Total: $${(parseFloat(String(data.order.total ?? 0)) || 0).toFixed(2)}. If payment was made, a refund will be processed within 5–7 business days. For help, contact support@a2zbookshop.com`,
    };

    const adminMailOptions = {
      from: { name: 'A2Z BOOKSHOP System', address: getZohoEmail('admin') },
      to: getZohoEmail('admin'),
      subject: `Order #${orderId} Cancelled — ${data.cancelledByCustomer ? 'Customer Request' : 'Admin Action'}`,
      html: htmlContent,
      text: `Order #${orderId} cancelled for customer: ${data.customerEmail}. Total: $${(parseFloat(String(data.order.total ?? 0)) || 0).toFixed(2)}.`,
    };

    await Promise.all([
      transport.sendMail(customerMailOptions),
      transport.sendMail(adminMailOptions),
    ]);

    console.log(`Cancellation emails sent for order #${orderId}`);
    return true;
  } catch (error) {
    console.error('Error sending cancellation email:', error);
    return false;
  }
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
        name: 'A2Z BOOKSHOP Orders',
        address: getZohoEmail('orders')
      },
      to: data.customerEmail,
      subject: `Order Confirmation #${data.order.id} - A2Z BOOKSHOP`,
      html: htmlContent,
      text: `Thank you for your order #${data.order.id}! Your order total is $${(parseFloat(String(data.order.total ?? 0)) || 0).toFixed(2)}. We'll process your order within 1-2 business days and send you tracking information once it ships.`
    };

    // Copy to admin
    const adminMailOptions = {
      from: {
        name: 'A2Z BOOKSHOP System',
        address: getZohoEmail('admin')
      },
      to: getZohoEmail('admin'),
      subject: `New Order #${data.order.id} - Admin Copy`,
      html: htmlContent,
      text: `New order received from ${data.customerEmail}. Order #${data.order.id}, Total: $${(parseFloat(String(data.order.total ?? 0)) || 0).toFixed(2)}`
    };

    // Build recipient list: primary account email + optional notification email
    const customerRecipients: string[] = [data.customerEmail];
    if (data.notificationEmail && data.notificationEmail.toLowerCase() !== data.customerEmail.toLowerCase()) {
      customerRecipients.push(data.notificationEmail);
    }

    // Send to all customer recipients + admin
    await Promise.all([
      ...customerRecipients.map(email => transporter.sendMail({ ...customerMailOptions, to: email })),
      transporter.sendMail(adminMailOptions)
    ]);

    console.log(`Order confirmation emails sent for order #${data.order.id} to: ${customerRecipients.join(', ')}`);
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
        name: 'A2Z BOOKSHOP Support',
        address: getZohoEmail('support')
      },
      to: data.customerEmail,
      subject: `Order Status Update - Order #${data.order.id}`,
      html: htmlContent,
      text: `Your order #${data.order.id} status has been updated to: ${data.newStatus}. ${data.trackingNumber ? `Tracking: ${data.trackingNumber}` : ''}`
    };

    // Copy to admin
    const adminMailOptions = {
      from: {
        name: 'A2Z BOOKSHOP System',
        address: getZohoEmail('admin')
      },
      to: getZohoEmail('admin'),
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
  const fullName = `${user.firstName} ${user.lastName}`.trim();
  const contactInfo = user.email || user.phone || '';
  const registrationMethod = user.authProvider === 'email' ? 'Email' : 'Phone Number';

  const features = [
    { title: 'Vast Collection', desc: 'Thousands of titles across every genre — from classics to contemporary.' },
    { title: 'Global Shipping', desc: 'Worldwide delivery with full tracking on every order.' },
    { title: 'Wishlist & Saves', desc: 'Bookmark your favourite books and come back anytime.' },
    { title: 'Easy Returns', desc: '30-day hassle-free returns on all orders, no questions asked.' },
  ];

  const featureRows = features.map(f => `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid #e2e8f0;vertical-align:top;">
        <p style="margin:0 0 3px;font-size:14px;font-weight:700;color:#0f172a;">${f.title}</p>
        <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">${f.desc}</p>
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>Welcome to A2Z BOOKSHOP</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; background: #f1f5f9; font-family: 'Segoe UI', Arial, sans-serif; -webkit-text-size-adjust: 100%; }
    img { border: 0; display: block; max-width: 100%; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }

    .email-wrapper { width: 100%; background: #f1f5f9; padding: 32px 0; }
    .email-card    { width: 100%; max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 6px 32px rgba(0,0,0,0.10); }

    /* Header */
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 55%, #0f766e 100%); padding: 52px 36px 40px; text-align: center; }
    .header .brand  { margin: 0 0 10px; font-size: 11px; font-weight: 700; letter-spacing: 4px; text-transform: uppercase; color: #94a3b8; }
    .header h1      { margin: 0 0 12px; font-size: 32px; font-weight: 800; color: #ffffff; line-height: 1.2; }
    .header .sub    { margin: 0; font-size: 15px; color: #cbd5e1; line-height: 1.6; }

    /* Gradient bar */
    .grad-bar { height: 4px; background: linear-gradient(90deg, #0f766e, #0891b2, #6366f1); }

    /* Badge strip */
    .badge-strip { background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 18px 36px; }

    /* Body */
    .body { padding: 36px 36px 28px; }
    .greeting   { margin: 0 0 8px; font-size: 19px; font-weight: 700; color: #0f172a; }
    .intro-text { margin: 0 0 28px; font-size: 15px; color: #475569; line-height: 1.75; }

    .section-label { margin: 0 0 14px; font-size: 10px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: #64748b; }

    /* Account details box */
    .account-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 4px 24px; margin-bottom: 28px; }
    .account-table { width: 100%; border-collapse: collapse; }
    .account-table td { padding: 11px 0; font-size: 14px; border-bottom: 1px solid #e2e8f0; }
    .account-table tr:last-child td { border-bottom: none; }
    .account-label  { color: #64748b; width: 42%; }
    .account-value  { color: #0f172a; font-weight: 600; text-align: right; }
    .active-pill    { display: inline-block; background: #d1fae5; color: #047857; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 50px; }

    /* Features box */
    .features-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 4px 24px; margin-bottom: 28px; }

    /* CTA */
    .cta-wrapper { text-align: center; margin: 0 0 28px; }
    .cta-btn     { display: inline-block; background: linear-gradient(135deg, #0f766e 0%, #0891b2 100%); color: #ffffff !important; text-decoration: none; font-size: 16px; font-weight: 700; padding: 17px 48px; border-radius: 50px; letter-spacing: 0.4px; }

    /* Help links */
    .links-box { background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 0 12px 12px 0; padding: 20px 24px; margin-bottom: 28px; }
    .links-box .links-title { margin: 0 0 12px; font-size: 13px; font-weight: 700; color: #1e40af; }
    .links-box .link-row    { font-size: 13px; color: #1e40af; line-height: 1.7; margin: 0 0 5px; padding-left: 16px; position: relative; }
    .links-box .link-row:before { content: '—'; position: absolute; left: 0; }
    .links-box .link-row:last-child { margin-bottom: 0; }
    .links-box a { color: #1e40af; text-decoration: underline; }

    /* Footer note */
    .footer-note   { text-align: center; padding: 0 0 4px; }
    .footer-note p { margin: 0 0 6px; font-size: 12px; color: #94a3b8; line-height: 1.6; }
    .footer-note a { color: #0891b2; text-decoration: none; }
    .footer-note .no-reply { font-weight: 600; color: #64748b; }

    /* Bottom bar */
    .bottom-bar       { background: #1e293b; padding: 24px 36px; text-align: center; }
    .bottom-bar .bname { margin: 0 0 4px; font-size: 13px; font-weight: 700; color: #e2e8f0; letter-spacing: 1px; }
    .bottom-bar .copy  { margin: 0; font-size: 12px; color: #64748b; }

    @media only screen and (max-width: 640px) {
      .email-wrapper { padding: 0 !important; }
      .email-card    { border-radius: 0 !important; max-width: 100% !important; }
      .header        { padding: 40px 20px 32px !important; }
      .header h1     { font-size: 26px !important; }
      .badge-strip   { padding: 14px 20px !important; }
      .body          { padding: 28px 20px 20px !important; }
      .account-box, .features-box { padding: 4px 16px !important; }
      .cta-btn       { display: block !important; width: 100% !important; text-align: center !important; padding: 17px 20px !important; border-radius: 12px !important; }
      .links-box     { padding: 16px !important; }
      .bottom-bar    { padding: 20px 20px !important; }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-card">

      <!-- Header -->
      <div class="header">
        <p class="brand">A2Z BOOKSHOP</p>
        <h1>Welcome Aboard!</h1>
        <p class="sub">Your literary journey starts right here, ${user.firstName}.</p>
      </div>

      <!-- Gradient bar -->
      <div class="grad-bar"></div>

      <!-- Badge strip -->
      <div class="badge-strip">
        <table style="width:100%;">
          <tr>
            <td style="text-align:center;padding:0 8px;">
              <span style="display:block;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;margin-bottom:5px;">Member</span>
              <span style="display:block;font-size:14px;font-weight:700;color:#0f172a;">${fullName}</span>
            </td>
            <td style="text-align:center;padding:0 8px;">
              <span style="display:block;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;margin-bottom:5px;">Registered Via</span>
              <span style="display:block;font-size:14px;font-weight:700;color:#0f172a;">${registrationMethod}</span>
            </td>
            <td style="text-align:center;padding:0 8px;">
              <span style="display:block;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;margin-bottom:5px;">Status</span>
              <span style="display:inline-block;background:#d1fae5;color:#047857;font-size:11px;font-weight:700;padding:4px 12px;border-radius:50px;letter-spacing:0.5px;">ACTIVE</span>
            </td>
          </tr>
        </table>
      </div>

      <!-- Body -->
      <div class="body">

        <p class="greeting">Hello, ${user.firstName}!</p>
        <p class="intro-text">
          We're thrilled to have you as part of the <strong style="color:#0f172a;">A2Z BOOKSHOP</strong> community.
          Your account is all set and ready to go. Explore thousands of books, track your orders,
          and discover your next great read.
        </p>

        <!-- Account Details -->
        <p class="section-label">Your Account Details</p>
        <div class="account-box">
          <table class="account-table">
            <tr>
              <td class="account-label">Full Name</td>
              <td class="account-value">${fullName}</td>
            </tr>
            <tr>
              <td class="account-label">Contact</td>
              <td class="account-value" style="word-break:break-all;">${contactInfo}</td>
            </tr>
            <tr>
              <td class="account-label">Registered Via</td>
              <td class="account-value">${registrationMethod}</td>
            </tr>
            <tr>
              <td class="account-label">Account Status</td>
              <td class="account-value"><span class="active-pill">Active</span></td>
            </tr>
          </table>
        </div>

        <!-- What's included -->
        <p class="section-label">What's Included With Your Account</p>
        <div class="features-box">
          <table style="width:100%;border-collapse:collapse;">
            ${featureRows}
          </table>
        </div>

        <!-- CTA -->
        <div class="cta-wrapper">
          <a href="https://a2zbookshop.com" class="cta-btn">Start Exploring Books →</a>
        </div>

        <!-- Help links -->
        <div class="links-box">
          <p class="links-title">Need Help Getting Started?</p>
          <p class="link-row"><a href="https://a2zbookshop.com">Browse the full book catalog</a></p>
          <p class="link-row"><a href="https://a2zbookshop.com/shipping-info">View shipping information &amp; rates</a></p>
          <p class="link-row"><a href="https://a2zbookshop.com/return-policy">Read our 30-day return policy</a></p>
          <p class="link-row">Contact support at <a href="mailto:support@a2zbookshop.com">support@a2zbookshop.com</a></p>
        </div>

        <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 24px;">

        <!-- Footer note -->
        <div class="footer-note">
          <p class="no-reply">This is an automated email — please do not reply to this message.</p>
          <p>You received this because an account was created using this contact.</p>
          <p>For help, reach us at <a href="mailto:support@a2zbookshop.com">support@a2zbookshop.com</a></p>
        </div>

      </div>

      <!-- Bottom bar -->
      <div class="bottom-bar">
        <p class="bname">A2Z BOOKSHOP</p>
        <p class="copy">© ${new Date().getFullYear()} A2Z BOOKSHOP. All rights reserved.</p>
      </div>

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
        address: getZohoEmail('notifications')
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

// Send payment failed email to customer
export const sendPaymentFailedEmail = async (data: {
  customerEmail: string;
  customerName: string;
  amount: string;
  currency?: string;
  paymentMethod: string;
  errorMessage?: string;
  retryUrl?: string;
}): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log('Email transporter not available - skipping payment failed email');
      return false;
    }

    const { customerEmail, customerName, amount, currency = 'USD', paymentMethod, errorMessage, retryUrl = 'https://a2zbookshop.com/checkout' } = data;
    const displayName = customerName || 'Valued Customer';
    const displayAmount = `${currency} ${parseFloat(amount).toFixed(2)}`;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Failed – A2Z BOOKSHOP</title>
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; padding: 0; background: #f1f5f9; font-family: 'Segoe UI', Arial, sans-serif; -webkit-text-size-adjust: 100%; }
          img { border: 0; display: block; max-width: 100%; }
          .email-wrapper { width: 100%; background: #f1f5f9; padding: 24px 0; }
          .email-card {
            width: 100%;
            max-width: 620px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 6px 32px rgba(0,0,0,0.10);
          }
          .email-header {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #7f1d1d 100%);
            padding: 48px 32px 36px;
            text-align: center;
          }
          .email-header .brand {
            margin: 0 0 10px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 4px;
            text-transform: uppercase;
            color: #94a3b8;
          }
          .email-header h1 { margin: 0 0 12px; font-size: 30px; font-weight: 800; color: #ffffff; line-height: 1.2; }
          .email-header .tagline { margin: 0; font-size: 15px; color: #fca5a5; line-height: 1.6; }
          .gradient-bar { height: 4px; background: linear-gradient(90deg, #dc2626, #f97316, #facc15); }
          .email-body { padding: 36px 32px 28px; }
          .email-body .greeting { margin: 0 0 16px; font-size: 17px; font-weight: 600; color: #1e293b; }
          .email-body .intro { margin: 0 0 24px; font-size: 15px; color: #475569; line-height: 1.75; }
          .info-box {
            background: #fff7f7;
            border: 1px solid #fecaca;
            border-radius: 14px;
            padding: 24px;
            margin: 0 0 28px;
          }
          .info-box .info-title {
            margin: 0 0 16px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 2.5px;
            text-transform: uppercase;
            color: #dc2626;
          }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
          .info-row:last-child { margin-bottom: 0; }
          .info-key { color: #64748b; }
          .info-val { color: #0f172a; font-weight: 600; text-align: right; max-width: 65%; }
          .help-box {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 14px;
            padding: 20px 24px;
            margin: 0 0 28px;
          }
          .help-box .help-title { margin: 0 0 12px; font-size: 13px; font-weight: 700; color: #166534; }
          .help-box ul { margin: 0; padding: 0 0 0 18px; }
          .help-box li { font-size: 13px; color: #374151; line-height: 1.7; }
          .cta-wrapper { text-align: center; margin: 0 0 8px; }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #dc2626 0%, #f97316 100%);
            color: #ffffff !important;
            text-decoration: none;
            font-size: 16px;
            font-weight: 700;
            padding: 16px 44px;
            border-radius: 50px;
            letter-spacing: 0.4px;
          }
          .divider { border: none; border-top: 1px solid #e2e8f0; margin: 28px 0; }
          .footer-note { padding: 0 0 28px; text-align: center; }
          .footer-note p { margin: 0 0 8px; font-size: 13px; color: #94a3b8; line-height: 1.6; }
          .footer-note a { color: #0891b2; text-decoration: none; }
          .bottom-bar { background: #1e293b; padding: 22px 32px; text-align: center; }
          .bottom-bar .brand-name { margin: 0 0 4px; font-size: 13px; font-weight: 700; color: #e2e8f0; letter-spacing: 1px; }
          .bottom-bar .copy { margin: 0; font-size: 12px; color: #64748b; }
          @media only screen and (max-width: 640px) {
            .email-card { border-radius: 0 !important; }
            .email-header { padding: 36px 20px 28px !important; }
            .email-body { padding: 28px 20px 20px !important; }
            .email-header h1 { font-size: 24px !important; }
            .info-row { flex-direction: column; gap: 2px; }
            .info-val { text-align: left !important; max-width: 100% !important; }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-card">
            <div class="email-header">
              <p class="brand">A2Z BOOKSHOP</p>
              <h1>Payment Unsuccessful</h1>
              <p class="tagline">We were unable to process your payment</p>
            </div>
            <div class="gradient-bar"></div>
            <div class="email-body">
              <p class="greeting">Hi ${displayName},</p>
              <p class="intro">
                Unfortunately, your recent payment attempt at <strong>A2Z BOOKSHOP</strong> could not be completed.
                Your cart is saved and your books are still waiting for you — simply retry when you're ready.
              </p>

              <div class="info-box">
                <p class="info-title">Payment Details</p>
                <div class="info-row">
                  <span class="info-key">Amount</span>
                  <span class="info-val">${displayAmount}</span>
                </div>
                <div class="info-row">
                  <span class="info-key">Payment Method</span>
                  <span class="info-val">${paymentMethod}</span>
                </div>
                ${errorMessage ? `
                <div class="info-row">
                  <span class="info-key">Reason</span>
                  <span class="info-val">${errorMessage}</span>
                </div>` : ''}
              </div>

              <div class="help-box">
                <p class="help-title">Common reasons &amp; fixes</p>
                <ul>
                  <li>Insufficient funds — please check your balance</li>
                  <li>Card details were entered incorrectly — try again carefully</li>
                  <li>Card declined by issuing bank — contact your bank</li>
                  <li>3D Secure authentication was not completed</li>
                  <li>Try a different card or payment method</li>
                </ul>
              </div>

              <div class="cta-wrapper">
                <a href="${retryUrl}" class="cta-button">Retry Payment</a>
              </div>

              <hr class="divider" />

              <div class="footer-note">
                <p>Need help? Email us at <a href="mailto:support@a2zbookshop.com">support@a2zbookshop.com</a></p>
                <p>No charge was made to your account for this failed attempt.</p>
              </div>
            </div>
            <div class="bottom-bar">
              <p class="brand-name">A2Z BOOKSHOP</p>
              <p class="copy">&copy; ${new Date().getFullYear()} A2Z BOOKSHOP. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: {
        name: 'A2Z BOOKSHOP Support',
        address: getZohoEmail('support')
      },
      to: customerEmail,
      subject: 'Payment Unsuccessful – A2Z BOOKSHOP',
      html,
      text: `Hi ${displayName}, your payment of ${displayAmount} via ${paymentMethod} could not be processed. ${errorMessage ? `Reason: ${errorMessage}.` : ''} Please retry at ${retryUrl} or contact support@a2zbookshop.com for help.`
    };

    await transporter.sendMail(mailOptions);
    console.log(`Payment failed email sent to ${customerEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending payment failed email:', error);
    return false;
  }
};
interface ReturnRequestEmailData {
  returnRequestNumber: string;
  orderId: number;
  customerEmail: string;
  customerName: string;
  returnReason: string;
  returnDescription: string;
  itemsToReturn: { bookId: number; quantity: number; reason?: string }[];
  totalRefundAmount: string;
  returnDeadline: Date;
  createdAt?: Date | null;
}

const generateReturnRequestHTML = (data: ReturnRequestEmailData): string => {
  const {
    returnRequestNumber,
    orderId,
    customerName,
    returnReason,
    returnDescription,
    itemsToReturn,
    totalRefundAmount,
    returnDeadline,
    createdAt,
  } = data;

  const submittedDate = createdAt
    ? new Date(createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const deadlineDateStr = new Date(returnDeadline).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const reasonLabel: Record<string, string> = {
    damaged: 'Item Arrived Damaged',
    defective: 'Defective Product',
    wrong_item: 'Wrong Item Received',
    not_as_described: 'Not As Described',
    other: 'Other',
  };

  const itemRows = itemsToReturn
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 0;font-size:14px;color:#374151;border-bottom:1px solid #e5e7eb;">
          Book ID #${item.bookId}
          ${item.reason ? `<br><span style="font-size:12px;color:#6b7280;">${item.reason}</span>` : ''}
        </td>
        <td style="padding:12px 0;font-size:14px;font-weight:600;color:#0f172a;text-align:right;border-bottom:1px solid #e5e7eb;">
          Qty: ${item.quantity}
        </td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>Return Request ${returnRequestNumber} — A2Z BOOKSHOP</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a5f 0%,#1d4ed8 55%,#3b82f6 100%);border-radius:16px 16px 0 0;padding:48px 40px 36px;text-align:center;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:#bfdbfe;">A2Z BOOKSHOP</p>
              <h1 style="margin:0 0 10px;font-size:30px;font-weight:800;color:#ffffff;line-height:1.25;">Return Request Received</h1>
              <p style="margin:0;font-size:15px;color:#dbeafe;line-height:1.55;">We've received your return request and will review it shortly.</p>
            </td>
          </tr>

          <!-- COLOUR BAR -->
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,#3b82f6,#6366f1,#8b5cf6);"></td>
          </tr>

          <!-- META BADGES -->
          <tr>
            <td style="background:#ffffff;padding:24px 40px;border-bottom:1px solid #e0e7ff;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:center;padding:0 8px;">
                    <span style="display:block;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;margin-bottom:5px;">Request #</span>
                    <span style="display:block;font-size:15px;font-weight:700;color:#1d4ed8;">${returnRequestNumber}</span>
                  </td>
                  <td style="text-align:center;padding:0 8px;">
                    <span style="display:block;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;margin-bottom:5px;">Order ID</span>
                    <span style="display:block;font-size:15px;font-weight:700;color:#0f172a;">#${orderId}</span>
                  </td>
                  <td style="text-align:center;padding:0 8px;">
                    <span style="display:block;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;margin-bottom:5px;">Status</span>
                    <span style="display:inline-block;background:#dbeafe;color:#1e40af;border:1.5px solid #93c5fd;padding:5px 16px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">PENDING REVIEW</span>
                  </td>
                  <td style="text-align:center;padding:0 8px;">
                    <span style="display:block;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;margin-bottom:5px;">Submitted</span>
                    <span style="display:block;font-size:15px;font-weight:700;color:#0f172a;">${submittedDate}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background:#ffffff;padding:32px 40px 8px;">
              <p style="margin:0 0 6px;font-size:18px;font-weight:700;color:#0f172a;">Hi, ${customerName}!</p>
              <p style="margin:0 0 28px;font-size:14px;color:#475569;line-height:1.75;">
                Your return request <strong>${returnRequestNumber}</strong> has been successfully submitted for Order <strong>#${orderId}</strong>.
                Our team will review it and get back to you within <strong>2–3 business days</strong>.
              </p>

              <!-- REQUEST SUMMARY -->
              <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:#64748b;">Return Reason</p>
              <div style="background:#eff6ff;border-left:4px solid #3b82f6;border-radius:0 12px 12px 0;margin-bottom:24px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:16px 20px;">
                      <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#1e40af;">${reasonLabel[returnReason] || returnReason}</p>
                      <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;">${returnDescription}</p>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- ITEMS TABLE -->
              <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:#64748b;">Items to Return</p>
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:4px 24px;margin-bottom:28px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  ${itemRows}
                </table>
              </div>

              <!-- REFUND -->
              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
                <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#15803d;">Estimated Refund Amount</p>
                <p style="margin:0;font-size:24px;font-weight:800;color:#166534;">$${parseFloat(totalRefundAmount).toFixed(2)}</p>
                <p style="margin:6px 0 0;font-size:13px;color:#4b5563;line-height:1.6;">
                  If approved, the refund will be processed to your original payment method within <strong>5–7 business days</strong>.
                </p>
              </div>

              <!-- DEADLINE -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border-left:4px solid #f97316;border-radius:0 12px 12px 0;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#c2410c;">Return Deadline</p>
                    <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;">
                      Please ship your items back by <strong>${deadlineDateStr}</strong> to be eligible for a refund.
                      You will receive further instructions from our team once your request is approved.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- NEXT STEPS -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;border-left:4px solid #7c3aed;border-radius:0 12px 12px 0;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#5b21b6;">What Happens Next?</p>
                    <p style="margin:0 0 6px;font-size:14px;color:#374151;line-height:1.7;">&#8226;&nbsp; Our team will review your request within <strong>2–3 business days</strong>.</p>
                    <p style="margin:0 0 6px;font-size:14px;color:#374151;line-height:1.7;">&#8226;&nbsp; You'll receive an email with the return shipping instructions once approved.</p>
                    <p style="margin:0 0 6px;font-size:14px;color:#374151;line-height:1.7;">&#8226;&nbsp; Refunds are processed after we receive and inspect the returned items.</p>
                    <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;">&#8226;&nbsp; For questions, contact us at <a href="mailto:support@a2zbookshop.com" style="color:#7c3aed;text-decoration:none;">support@a2zbookshop.com</a> with your request number <strong>${returnRequestNumber}</strong>.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#1e293b;border-radius:0 0 16px 16px;padding:28px 40px;text-align:center;">
              <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#f8fafc;letter-spacing:2px;text-transform:uppercase;">A2Z BOOKSHOP</p>
              <p style="margin:0 0 12px;font-size:12px;color:#94a3b8;">Your one-stop destination for books worldwide</p>
              <p style="margin:0;font-size:11px;color:#64748b;line-height:1.7;">
                Questions? Email us at <a href="mailto:support@a2zbookshop.com" style="color:#60a5fa;text-decoration:none;">support@a2zbookshop.com</a><br>
                &copy; ${new Date().getFullYear()} A2Z BOOKSHOP. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

export const sendReturnRequestEmail = async (data: ReturnRequestEmailData): Promise<boolean> => {
  try {
    const transport = createTransporter();
    if (!transport) {
      console.log('Email transporter not available - skipping return request email');
      return false;
    }

    const htmlContent = generateReturnRequestHTML(data);
    const { returnRequestNumber, orderId, customerEmail, customerName, totalRefundAmount } = data;

    const customerMailOptions = {
      from: { name: 'A2Z BOOKSHOP Support', address: getZohoEmail('support') },
      to: customerEmail,
      subject: `Return Request ${returnRequestNumber} Received — A2Z BOOKSHOP`,
      html: htmlContent,
      text: `Hi ${customerName}, your return request ${returnRequestNumber} for Order #${orderId} has been received. Estimated refund: $${parseFloat(totalRefundAmount).toFixed(2)}. Our team will review it within 2–3 business days. For help, quote ${returnRequestNumber} and email support@a2zbookshop.com`,
    };

    const adminMailOptions = {
      from: { name: 'A2Z BOOKSHOP System', address: getZohoEmail('admin') },
      to: getZohoEmail('admin'),
      subject: `New Return Request ${returnRequestNumber} — Order #${orderId}`,
      html: htmlContent,
      text: `New return request ${returnRequestNumber} from ${customerEmail} for Order #${orderId}. Estimated refund: $${parseFloat(totalRefundAmount).toFixed(2)}.`,
    };

    await Promise.all([
      transport.sendMail(customerMailOptions),
      transport.sendMail(adminMailOptions),
    ]);

    console.log(`Return request emails sent for ${returnRequestNumber}`);
    return true;
  } catch (error) {
    console.error('Error sending return request email:', error);
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
  emailType?: 'orders' | 'support' | 'notifications' | 'admin';
}): Promise<boolean> => {
  try {
    const emailType = params.emailType || 'notifications';
    const transporter = createTransporter();
    if (!transporter) {
      console.log('Email transporter not available');
      return false;
    }

    const info = await transporter.sendMail({
      from: params.from || {
        name: 'A2Z BOOKSHOP',
        address: getZohoEmail(emailType)
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
    const zohoEmail = getZohoEmail('admin');
    const authEmail = getZohoEmail('info');
    const info = await transporter.sendMail({
      from: {
        name: 'A2Z BOOKSHOP',
        address: zohoEmail
      },
      to: zohoEmail,
      subject: 'A2Z BOOKSHOP - Email System Ready (Zoho Mail)',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #d32f2f;">A<span style="color: #d32f2f;">2</span>Z BOOKSHOP</h2>
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px;">
            <h3 style="color: #1e40af;">Email System Test Successful!</h3>
            <p>Your Zoho Mail SMTP configuration is working perfectly.</p>
            <p>Email system ready for order confirmations and notifications.</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Server:</strong> smtp.zoho.com</p>
            <p><strong>Authenticated as:</strong> ${authEmail}</p>
            <p><strong>Sending from:</strong> ${zohoEmail}</p>
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