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

    // Send password reset email using Zoho Mail
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

// Send password reset email using Zoho Mail
async function sendPasswordResetEmail(data: { to: string; name: string; resetUrl: string }): Promise<boolean> {
  try {
    console.log('Attempting to send password reset email to:', data.to);

    // Create transporter using Zoho Mail SMTP - India datacenter
    const transporter = nodemailer.createTransport({
      host: 'smtp.zoho.in',
      port: 465,
      secure: true,
      auth: {
        user: process.env.ZOHO_EMAIL || 'info@a2zbookshop.com',
        pass: (process.env.ZOHO_PASSWORD || '').replace(/\s/g, '')
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000
    });

    const mailOptions = {
      from: '"A2Z BOOKSHOP — No Reply" <support@a2zbookshop.com>',
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
Website: https://a2zbookshop.com

(This is an automated email — please do not reply)`,
      headers: {
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
    console.error('Error details:', error instanceof Error ? error.message : String(error));

    // If email fails, still return true to not block the reset process
    // User experience should not be degraded due to email issues
    console.log('Continuing with password reset despite email failure');
    return true;
  }
}

// Generate password reset email HTML
function generatePasswordResetHTML(data: { name: string; resetUrl: string }) {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Reset Your Password — A2Z BOOKSHOP</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <!-- Preheader (hidden preview text) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    Reset your A2Z BOOKSHOP password — this link expires in 1 hour.
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f4f6;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Outer card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;">

          <!-- ── HEADER / LOGO ── -->
          <tr>
            <td align="center" style="background-color:#dc2626;border-radius:12px 12px 0 0;padding:32px 24px 24px;">
              <!-- Logo badge -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <div style="display:inline-block;background:#fff;border-radius:50%;width:72px;height:72px;line-height:72px;text-align:center;font-size:28px;font-weight:900;color:#dc2626;letter-spacing:-1px;vertical-align:middle;">
                      <img src="https://a2zbookshop.com/favicon.jpeg" alt="A2Z" width="60" height="60" style="border-radius:50%;display:block;margin:6px auto;" onerror="this.style.display='none'">
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:12px;">
                    <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:1px;text-transform:uppercase;">A2Z BOOKSHOP</span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:4px;">
                    <span style="font-size:12px;color:#fca5a5;letter-spacing:2px;text-transform:uppercase;">Your Trusted Book Store</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── BODY ── -->
          <tr>
            <td style="background-color:#ffffff;padding:40px 40px 32px;">

              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;text-align:center;">Password Reset Request</h1>
              <p style="margin:0 0 28px;font-size:14px;color:#6b7280;text-align:center;">We received a request to reset the password for your account.</p>

              <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
                Hi <strong style="color:#111827;">${data.name}</strong>,
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.6;">
                Someone (hopefully you!) requested a password reset for your <strong>A2Z BOOKSHOP</strong> account linked to this email address. Click the button below to choose a new password.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom:32px;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${data.resetUrl}" style="height:50px;v-text-anchor:middle;width:220px;" arcsize="12%" stroke="f" fillcolor="#dc2626">
                    <w:anchorlock/>
                    <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:700;">Reset My Password</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="${data.resetUrl}"
                       style="display:inline-block;background-color:#dc2626;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:8px;letter-spacing:0.3px;mso-hide:all;">
                      Reset My Password
                    </a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-top:1px solid #e5e7eb;padding-top:28px;"></td>
                </tr>
              </table>

              <!-- Warning box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fffbeb;border:1px solid #fde68a;border-radius:8px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#92400e;">⚠️ Important security notes</p>
                    <ul style="margin:0;padding-left:20px;font-size:13px;color:#78350f;line-height:1.8;">
                      <li>This link expires in <strong>1 hour</strong></li>
                      <li>It can only be used <strong>once</strong></li>
                      <li>If you didn't request this, you can safely ignore this email</li>
                      <li>Never share this link with anyone</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- Fallback URL -->
              <p style="margin:24px 0 4px;font-size:13px;color:#6b7280;">Button not working? Copy and paste this link into your browser:</p>
              <p style="margin:0;font-size:12px;color:#dc2626;word-break:break-all;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:10px 12px;">${data.resetUrl}</p>

            </td>
          </tr>

          <!-- ── FOOTER ── -->
          <tr>
            <td style="background-color:#1f2937;border-radius:0 0 12px 12px;padding:28px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <span style="font-size:16px;font-weight:800;color:#ffffff;letter-spacing:1px;">A2Z BOOKSHOP</span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:16px;">
                    <a href="https://a2zbookshop.com" style="color:#93c5fd;font-size:13px;text-decoration:none;">a2zbookshop.com</a>
                    &nbsp;·&nbsp;
                    <a href="mailto:support@a2zbookshop.com" style="color:#93c5fd;font-size:13px;text-decoration:none;">support@a2zbookshop.com</a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <p style="margin:0;font-size:11px;color:#6b7280;line-height:1.6;">
                      This is an automated email — please do not reply to this message.<br>
                      © ${year} A2Z BOOKSHOP. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Bottom spacing -->
          <tr><td style="height:24px;"></td></tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}