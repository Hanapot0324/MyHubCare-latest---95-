# Email Service Setup Guide

## Problem: Gmail Not Notifying

The email service was not implemented - emails were only being logged to console, not actually sent. This has been fixed with a proper email service using Nodemailer.

## Setup Instructions

### Step 1: Install Nodemailer

```bash
cd backend
npm install nodemailer
```

### Step 2: Configure Gmail App Password

**IMPORTANT**: You cannot use your regular Gmail password. You need to create an App Password.

1. **Enable 2-Step Verification** (if not already enabled):
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable "2-Step Verification"

2. **Generate App Password**:
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Other (Custom name)"
   - Enter name: "MyHubCares"
   - Click "Generate"
   - **Copy the 16-character password** (looks like: `abcd efgh ijkl mnop`)

### Step 3: Configure Environment Variables

Create or update `.env` file in the `backend` folder:

```env
# Email Configuration (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
EMAIL_FROM=MyHubCares <your-email@gmail.com>
```

**Example**:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=myhubcares@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
EMAIL_FROM=MyHubCares <myhubcares@gmail.com>
```

### Step 4: Restart Server

After configuring, restart your backend server:

```bash
npm start
# or
npm run dev
```

## Testing Email Service

The email service will automatically:
- ✅ Send MFA codes via email when MFA is enabled
- ✅ Send appointment reminders (if configured)
- ✅ Send medication reminders (if configured)

## Troubleshooting

### "Email service not configured" warning
- Check that `.env` file exists in `backend` folder
- Verify `EMAIL_USER` and `EMAIL_PASS` are set
- Restart server after adding environment variables

### "Invalid login" error
- Make sure you're using **App Password**, not regular password
- Verify 2-Step Verification is enabled
- Check that email address is correct

### "Connection timeout" error
- Check internet connection
- Verify firewall isn't blocking port 587
- Try using port 465 with `secure: true` (update EMAIL_PORT=465)

### Emails going to Spam
- Gmail may mark automated emails as spam initially
- Check Spam folder
- Consider using a dedicated email service (SendGrid, AWS SES) for production

## Alternative Email Services

For production, consider using:
- **SendGrid** (free tier: 100 emails/day)
- **AWS SES** (very cheap, $0.10 per 1000 emails)
- **Mailgun** (free tier: 5000 emails/month)

Update `emailService.js` to use their SMTP settings instead of Gmail.

## How It Works

1. **MFA Email Flow**:
   ```
   User logs in → MFA enabled → Generate code → Send email via emailService → User receives email
   ```

2. **Email Service**:
   - Uses Nodemailer library
   - Connects to Gmail SMTP (smtp.gmail.com:587)
   - Sends HTML formatted emails
   - Logs success/failure

3. **Security**:
   - Uses App Password (not regular password)
   - Codes expire in 10 minutes
   - Codes are hashed in database

## Verification

After setup, test by:
1. Enable MFA for a user (Settings → Security → Enable MFA → Email)
2. Try logging in with that user
3. Check email inbox (and spam folder) for verification code

If you see the code in email, setup is successful! ✅

