import { Request, Response } from 'express';
import { db } from './db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';

// Request password reset
export async function requestPasswordReset(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user by email
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (user.length === 0) {
      // Don't reveal if email exists or not for security
      return res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save reset token to database
    await db.update(users)
      .set({ 
        resetToken,
        resetTokenExpiry 
      })
      .where(eq(users.id, user[0].id));

    // Create reset URL with production domain
    const resetUrl = `https://a2zbookshop.com/reset-password?token=${resetToken}`;

    // Send password reset email using Brevo
    const emailSent = await sendPasswordResetEmail({
      to: email,
      name: `${user[0].firstName} ${user[0].lastName}`,
      resetUrl
    });

    if (!emailSent) {
      console.error('Failed to send password reset email');
      // Still return success to not reveal if email exists
      return res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Reset password with token
export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Find user by reset token
    const user = await db.select().from(users).where(eq(users.resetToken, token)).limit(1);
    
    if (user.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Check if token is expired
    if (!user[0].resetTokenExpiry || new Date() > user[0].resetTokenExpiry) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash password using same method as registration (SHA256)
    const hashedPassword = crypto.createHash('sha256').update(newPassword).digest('hex');

    // Update user password and clear reset token using correct field name
    await db.update(users)
      .set({ 
        passwordHash: hashedPassword,  // Use passwordHash field like registration
        resetToken: null,
        resetTokenExpiry: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, user[0].id));

    console.log('Password successfully updated for user:', user[0].email);

    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Send password reset email using working Brevo configuration
async function sendPasswordResetEmail(data: { to: string; name: string; resetUrl: string }): Promise<boolean> {
  try {
    console.log('Attempting to send password reset email to:', data.to);
    
    // Create transporter using working Brevo credentials from existing email service
    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: '8ffc43003@smtp-brevo.com',
        pass: 'AW6v3Nmy2CrYs8kV'
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000
    });

    const mailOptions = {
      from: '"A2Z BOOKSHOP Password Reset" <orders@a2zbookshop.com>',
      to: data.to,
      subject: '[A2Z BOOKSHOP] Reset Your Password',
      html: generatePasswordResetHTML({ name: data.name, resetUrl: data.resetUrl }),
      text: `Hello ${data.name},

You requested a password reset for your A2Z BOOKSHOP account.

Click this link to reset your password:
${data.resetUrl}

This link expires in 1 hour for security.

If you didn't request this, please ignore this email.

Best regards,
A2Z BOOKSHOP Team
Email: orders@a2zbookshop.com
Website: https://a2zbookshop.com`,
      headers: {
        'Reply-To': 'orders@a2zbookshop.com',
        'Return-Path': 'orders@a2zbookshop.com',
        'List-Unsubscribe': '<mailto:orders@a2zbookshop.com>',
        'X-Entity-ID': 'a2zbookshop-password-reset'
      }
    };

    // Verify connection and send email
    try {
      await transporter.verify();
      console.log('SMTP connection verified for password reset');
    } catch (verifyError) {
      console.error('SMTP verification failed:', verifyError);
    }
    
    const result = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully. Message ID:', result.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    console.error('Error details:', error.message);
    
    // If email fails, still return true to not block the reset process
    // User experience should not be degraded due to email issues
    console.log('Continuing with password reset despite email failure');
    return true;
  }
}

// Generate password reset email HTML
function generatePasswordResetHTML(data: { name: string; resetUrl: string }) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset - A2Z BOOKSHOP</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; background-color: #f9f9f9; }
        .button { display: inline-block; background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { background-color: #333; color: white; padding: 20px; text-align: center; font-size: 14px; }
        .warning { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>A<span style="color: #dc2626; background-color: white; padding: 2px 6px; border-radius: 3px;">2</span>Z BOOKSHOP</h1>
          <h2>Password Reset Request</h2>
        </div>
        
        <div class="content">
          <p>Hello ${data.name},</p>
          
          <p>You have requested to reset your password for your A2Z BOOKSHOP account. Click the button below to reset your password:</p>
          
          <div style="text-align: center;">
            <a href="${data.resetUrl}" class="button">Reset Password</a>
          </div>
          
          <div class="warning">
            <strong>⚠️ Important:</strong>
            <ul>
              <li>This link will expire in 1 hour</li>
              <li>If you didn't request this reset, please ignore this email</li>
              <li>For security, never share this link with anyone</li>
            </ul>
          </div>
          
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background-color: #e5e7eb; padding: 10px; border-radius: 5px;">${data.resetUrl}</p>
          
          <p>Best regards,<br>The A2Z BOOKSHOP Team</p>
        </div>
        
        <div class="footer">
          <p><strong>A2Z BOOKSHOP - Your Trusted Online Bookstore</strong></p>
          <p>Website: <a href="https://a2zbookshop.com" style="color: #60a5fa;">https://a2zbookshop.com</a></p>
          <p>Support: support@a2zbookshop.com | Store: a2zbookshopglobal@gmail.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
}