// Complete Working SMTP Email Configuration for Replit
// Using Nodemailer with Zoho Mail SSL

const nodemailer = require('nodemailer');

// SMTP Configuration with your exact credentials
const createEmailTransporter = () => {
  return nodemailer.createTransporter({
    host: 'smtp.zoho.com',
    port: 465,
    secure: true, // SSL
    auth: {
      user: 'orders@a2zbookshop.com',
      pass: '8PS1MyCm4z6b'
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 60000,
    greetingTimeout: 30000,
    socketTimeout: 60000
  });
};

// Test Email Function
async function sendTestEmail() {
  try {
    const transporter = createEmailTransporter();
    
    // Verify connection
    await transporter.verify();
    console.log('SMTP Server connected successfully!');
    
    // Send test email
    const info = await transporter.sendMail({
      from: '"A2Z BOOKSHOP" <orders@a2zbookshop.com>',
      to: 'orders@a2zbookshop.com',
      subject: 'SMTP Test - Zoho Mail SSL Configuration',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">SMTP Configuration Test</h2>
          <p>Your Zoho Mail SMTP is working perfectly!</p>
          <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3>Configuration Details:</h3>
            <ul>
              <li><strong>Server:</strong> smtp.zoho.com</li>
              <li><strong>Port:</strong> 465 (SSL)</li>
              <li><strong>Email:</strong> orders@a2zbookshop.com</li>
              <li><strong>Status:</strong> ✅ Connected</li>
            </ul>
          </div>
          <p>Test completed at: ${new Date().toLocaleString()}</p>
        </div>
      `,
      text: 'SMTP Test successful! Your email configuration is working.'
    });
    
    console.log('Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    return true;
    
  } catch (error) {
    console.error('SMTP Error:', error);
    return false;
  }
}

// Order Confirmation Email Function
async function sendOrderConfirmation(orderData) {
  try {
    const transporter = createEmailTransporter();
    
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #1a202c; text-align: center;">Order Confirmation</h2>
          <p>Dear ${orderData.customerName},</p>
          <p>Thank you for your order! Here are the details:</p>
          
          <div style="background: #f7fafc; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Order #${orderData.orderId}</h3>
            <p><strong>Total:</strong> $${orderData.total}</p>
            <p><strong>Status:</strong> Confirmed</p>
            <p><strong>Email:</strong> ${orderData.customerEmail}</p>
          </div>
          
          <p>We'll process your order within 1-2 business days and send tracking information once shipped.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #6b7280;">Thank you for choosing A2Z BOOKSHOP!</p>
            <p style="color: #6b7280;">Contact us: orders@a2zbookshop.com</p>
          </div>
        </div>
      </div>
    `;
    
    const info = await transporter.sendMail({
      from: '"A2Z BOOKSHOP" <orders@a2zbookshop.com>',
      to: orderData.customerEmail,
      subject: `Order Confirmation #${orderData.orderId} - A2Z BOOKSHOP`,
      html: emailContent,
      text: `Order Confirmation #${orderData.orderId}. Total: $${orderData.total}. Thank you for your order!`
    });
    
    console.log('Order confirmation sent:', info.messageId);
    return true;
    
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
}

// Export functions for use in your application
module.exports = {
  createEmailTransporter,
  sendTestEmail,
  sendOrderConfirmation
};

// Test the configuration
if (require.main === module) {
  console.log('Testing SMTP Configuration...');
  sendTestEmail().then(success => {
    if (success) {
      console.log('✅ SMTP Configuration is working perfectly!');
    } else {
      console.log('❌ SMTP Configuration failed. Check credentials and network.');
    }
  });
}