import nodemailer from 'nodemailer';

/**
 * Email Service for MyHubCares
 * 
 * HOW IT WORKS:
 * 
 * 1. CONFIGURATION:
 *    - Uses Gmail SMTP by default
 *    - Requires environment variables:
 *      - EMAIL_HOST (default: smtp.gmail.com)
 *      - EMAIL_PORT (default: 587)
 *      - EMAIL_USER (Gmail address)
 *      - EMAIL_PASS (Gmail App Password - NOT regular password!)
 *      - EMAIL_FROM (sender name and email)
 * 
 * 2. GMAIL SETUP:
 *    - Enable 2-Step Verification on your Gmail account
 *    - Generate App Password: Google Account → Security → App Passwords
 *    - Use the 16-character app password (not your regular password)
 * 
 * 3. USAGE:
 *    - sendEmail(to, subject, html, text) - Send any email
 *    - sendMFACode(email, code) - Send MFA verification code
 *    - sendNotification(email, subject, message) - Send notifications
 */

// Create reusable transporter
let transporter = null;

/**
 * Initialize email transporter
 */
function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const emailPort = parseInt(process.env.EMAIL_PORT || '587');
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const emailFrom = process.env.EMAIL_FROM || 'MyHubCares <noreply@myhubcares.com>';

  if (!emailUser || !emailPass) {
    console.warn('⚠️  Email service not configured. Set EMAIL_USER and EMAIL_PASS environment variables.');
    console.warn('   For Gmail: Use App Password (not regular password)');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: emailHost,
    port: emailPort,
    secure: emailPort === 465, // true for 465, false for other ports
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    // Gmail specific settings
    ...(emailHost.includes('gmail.com') && {
      service: 'gmail',
    }),
  });

  return transporter;
}

/**
 * Send email
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML content
 * @param {string} text - Plain text content (optional)
 * @returns {Promise<Object>} Result object with success status
 */
export async function sendEmail(to, subject, html, text = null) {
  try {
    const emailTransporter = getTransporter();
    
    if (!emailTransporter) {
      console.error('❌ Email service not configured. Email not sent.');
      console.log(`[EMAIL SIMULATION] To: ${to}, Subject: ${subject}`);
      return { 
        success: false, 
        error: 'Email service not configured',
        simulated: true 
      };
    }

    const emailFrom = process.env.EMAIL_FROM || 'MyHubCares <noreply@myhubcares.com>';

    const mailOptions = {
      from: emailFrom,
      to: to,
      subject: subject,
      html: html,
      ...(text && { text: text }),
    };

    const info = await emailTransporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully:', info.messageId);
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    
    return { 
      success: true, 
      messageId: info.messageId,
      response: info.response 
    };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

/**
 * Send MFA verification code via email
 * @param {string} email - Recipient email address
 * @param {string} code - 6-digit MFA code
 * @param {string} username - Username (optional)
 * @returns {Promise<Object>} Result object
 */
export async function sendMFACode(email, code, username = 'User') {
  const subject = 'MyHubCares - Verification Code';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(to right, #D84040, #A31D1D);
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background: #f9fafb;
          padding: 30px;
          border: 1px solid #e5e7eb;
          border-top: none;
        }
        .code-box {
          background: white;
          border: 2px solid #D84040;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin: 20px 0;
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 8px;
          color: #D84040;
          font-family: 'Courier New', monospace;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #6b7280;
          font-size: 12px;
          border-top: 1px solid #e5e7eb;
          margin-top: 20px;
        }
        .warning {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 12px;
          margin: 20px 0;
          border-radius: 4px;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0;">MyHubCares</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Multi-Factor Authentication</p>
      </div>
      <div class="content">
        <h2 style="color: #1f2937; margin-top: 0;">Verification Code</h2>
        <p>Hello ${username},</p>
        <p>You requested a verification code to complete your login. Use the code below:</p>
        
        <div class="code-box">
          ${code}
        </div>
        
        <div class="warning">
          <strong>⚠️ Security Notice:</strong><br>
          This code will expire in 10 minutes. Do not share this code with anyone. 
          If you didn't request this code, please ignore this email.
        </div>
        
        <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
          If you're having trouble, you can copy and paste the code above into the verification field.
        </p>
      </div>
      <div class="footer">
        <p style="margin: 0;">This is an automated message from MyHubCares.</p>
        <p style="margin: 5px 0 0 0;">Please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
MyHubCares - Verification Code

Hello ${username},

You requested a verification code to complete your login.

Your verification code is: ${code}

This code will expire in 10 minutes. Do not share this code with anyone.

If you didn't request this code, please ignore this email.

---
This is an automated message from MyHubCares.
Please do not reply to this email.
  `.trim();

  return await sendEmail(email, subject, html, text);
}

/**
 * Send notification email
 * @param {string} email - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} message - Email message/content
 * @returns {Promise<Object>} Result object
 */
export async function sendNotification(email, subject, message) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(to right, #D84040, #A31D1D);
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background: #f9fafb;
          padding: 30px;
          border: 1px solid #e5e7eb;
          border-top: none;
          white-space: pre-wrap;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0;">MyHubCares</h1>
      </div>
      <div class="content">
        ${message.replace(/\n/g, '<br>')}
      </div>
    </body>
    </html>
  `;

  return await sendEmail(email, subject, html, message);
}

/**
 * Test email configuration
 * @returns {Promise<Object>} Test result
 */
export async function testEmailConfig() {
  try {
    const emailTransporter = getTransporter();
    
    if (!emailTransporter) {
      return { 
        success: false, 
        error: 'Email service not configured' 
      };
    }

    await emailTransporter.verify();
    return { 
      success: true, 
      message: 'Email service configured correctly' 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
}

export default {
  sendEmail,
  sendMFACode,
  sendNotification,
  testEmailConfig,
};

