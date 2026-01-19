# Email Notifications Setup with Brevo

This guide explains how to configure email notifications for booking status changes using Brevo (formerly Sendinblue).

## Overview

The application automatically sends email notifications when:
- A new booking is created (owner is notified)
- A booking is approved (customer is notified)
- A booking is rejected (customer is notified)
- A booking is cancelled (both parties are notified)
- A booking is completed (both parties are notified)

## Brevo Setup

### 1. Create a Brevo Account

1. Go to [Brevo](https://www.brevo.com/)
2. Sign up for a free account (300 emails/day on free tier)
3. Verify your email address

### 2. Get Your SMTP Credentials

1. Log in to your Brevo dashboard
2. Go to **Settings** → **SMTP & API** (or **Senders & IP** → **SMTP & API**)
3. Navigate to the **SMTP** section
4. Your SMTP credentials will be displayed:
   - **SMTP Server**: `smtp-relay.brevo.com`
   - **Port**: `587`
   - **Login**: Your SMTP login (e.g., `a06867001@smtp-brevo.com`)
   - **Password**: Your SMTP password (click "Generate SMTP key" if you don't have one)

### 3. Configure Environment Variables

Add the following to your `.env` file:

```env
# Brevo SMTP Configuration
BREVO_SMTP_USER=a06867001@smtp-brevo.com
BREVO_SMTP_PASSWORD=your-smtp-password-here

# Default from email address (must be a verified sender in Brevo)
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
```

**Important:** Replace:
- `a06867001@smtp-brevo.com` with your actual SMTP login
- `your-smtp-password-here` with your actual SMTP password
- `noreply@yourdomain.com` with your verified sender email

### 4. Verify Sender Email

Before sending emails, you need to verify your sender email address:

1. In Brevo dashboard, go to **Senders & IP** → **Senders**
2. Click **Add a sender**
3. Enter your email address and sender name
4. Fill in the required information
5. Click **Save**
6. Check your email inbox and click the verification link

**Note:** The email address used in `DEFAULT_FROM_EMAIL` must be a verified sender in Brevo.

## Testing

### Development Mode (Console Backend)

To test email functionality without actually sending emails, you can use the console backend:

```env
# Remove or comment out Brevo credentials
# BREVO_SMTP_USER=
# BREVO_SMTP_PASSWORD=

# Use console backend
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

Emails will be printed to the console when bookings are created or status changes occur.

### Production Mode (Brevo SMTP)

With Brevo configured, emails will be sent automatically. You can monitor them in your Brevo dashboard:

1. Go to **Statistics** → **Email**
2. View sent emails, opens, clicks, bounces, etc.

## Email Templates

Email templates are located in:
- `apps/bookings/templates/bookings/emails/`

Each status has both HTML and plain text versions:
- `pending_owner.html` / `pending_owner.txt` - New booking notification to owner
- `approved_customer.html` / `approved_customer.txt` - Approval notification to customer
- `rejected_customer.html` / `rejected_customer.txt` - Rejection notification to customer
- `cancelled.html` / `cancelled.txt` - Cancellation notification
- `completed.html` / `completed.txt` - Completion notification

You can customize these templates to match your branding.

## Troubleshooting

### Emails Not Sending

1. **Check Credentials**: Ensure `BREVO_SMTP_USER` and `BREVO_SMTP_PASSWORD` are set correctly in your `.env` file
2. **Check Sender Verification**: Make sure your sender email is verified in Brevo
3. **Check Logs**: Look for error messages in your Django logs
4. **Check Brevo Dashboard**: View the Statistics page for delivery issues

### Common Issues

- **"Authentication failed"**: Double-check your SMTP username and password
- **"Invalid sender"**: The DEFAULT_FROM_EMAIL must be a verified sender in Brevo
- **"Connection refused"**: Check that port 587 is not blocked by your firewall

### Rate Limits

Free tier allows:
- **300 emails/day**
- **200 emails/day** after initial verification period
- Monitor usage in Brevo dashboard under **Statistics** → **Email**

## Configuration Details

The email backend automatically uses Brevo SMTP if `BREVO_SMTP_USER` and `BREVO_SMTP_PASSWORD` are set. Configuration:
- **SMTP Server**: `smtp-relay.brevo.com`
- **Port**: `587`
- **Encryption**: TLS (STARTTLS)

To use a different email backend, you can override in your `.env` file:

```env
# For other SMTP providers
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-password
```

## Security Notes

- **Never commit your SMTP password** to version control
- Keep your `.env` file in `.gitignore`
- Use environment variables in production (not `.env` files)
- Consider rotating your SMTP password periodically

## Your Current Configuration

Based on your provided settings:
- **SMTP Server**: `smtp-relay.brevo.com`
- **Port**: `587`
- **Login**: `a06867001@smtp-brevo.com`

You just need to add your SMTP password to the `.env` file:

```env
BREVO_SMTP_USER=a06867001@smtp-brevo.com
BREVO_SMTP_PASSWORD=your-actual-password-here
DEFAULT_FROM_EMAIL=your-verified-sender@yourdomain.com
```

## Additional Resources

- [Brevo Documentation](https://help.brevo.com/hc/en-us/articles/209467485)
- [Brevo SMTP Settings](https://help.brevo.com/hc/en-us/articles/209467485-How-to-find-my-SMTP-credentials)
- [Django Email Documentation](https://docs.djangoproject.com/en/4.2/topics/email/)
