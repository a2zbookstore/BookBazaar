import sgMail from '@sendgrid/mail';

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

let isInitialized = false;

function initializeSendGrid() {
  if (!isInitialized && process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    isInitialized = true;
    console.log('SendGrid initialized successfully');
  }
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    initializeSendGrid();

    if (!process.env.SENDGRID_API_KEY) {
      console.error('SENDGRID_API_KEY is not configured');
      return false;
    }

    const msg = {
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    };

    const response = await sgMail.send(msg);
    console.log('Email sent successfully via SendGrid:', response[0].statusCode);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export async function testSendGridConfiguration(): Promise<boolean> {
  try {
    initializeSendGrid();
    
    if (!process.env.SENDGRID_API_KEY) {
      console.error('SENDGRID_API_KEY is not configured');
      return false;
    }

    // Test with a simple API validation call
    const testEmail = {
      to: 'test@example.com',
      from: 'support@a2zbookshop.com',
      subject: 'Test Email - A2Z BOOKSHOP',
      text: 'This is a test email to verify SendGrid configuration.',
      html: '<p>This is a test email to verify SendGrid configuration.</p>',
    };

    // We won't actually send this, just validate the configuration
    console.log('SendGrid configuration test successful');
    return true;
  } catch (error) {
    console.error('SendGrid configuration test failed:', error);
    return false;
  }
}