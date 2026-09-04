/**
 * email.service.js — FileEX transactional email service
 *
 * Uses Nodemailer with an SMTP transport configured fully from environment
 * variables. No credentials are ever hardcoded.
 *
 * Required env vars:
 *   SMTP_HOST, SMTP_PORT, SMTP_SECURE (true/false),
 *   SMTP_USER, SMTP_PASS,
 *   EMAIL_FROM   (e.g. "FileEX <no-reply@fileex.app>")
 *   CLIENT_URL   (e.g. https://app.fileex.app or http://localhost:5173)
 */

import nodemailer from 'nodemailer';

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  _transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return _transporter;
}

/**
 * Send the account verification email.
 *
 * @param {object} opts
 * @param {string} opts.to         - Recipient email address
 * @param {string} opts.name       - Recipient display name
 * @param {string} opts.rawToken   - The raw (un-hashed) verification token
 */
export async function sendVerificationEmail({ to, name, rawToken }) {
  const clientUrl  = process.env.CLIENT_URL || 'http://localhost:5174';
  const verifyUrl  = `${clientUrl}/verify-email?token=${rawToken}`;
  const expiryHrs  = parseInt(process.env.EMAIL_VERIFY_EXPIRY_HOURS || '24', 10);
  const fromAddr   = process.env.EMAIL_FROM || '"FileEX" <no-reply@fileex.app>';

  // Skip actual sending in test environment
  if (process.env.NODE_ENV === 'test') {
    return true;
  }

  const transporter = getTransporter();

  await transporter.sendMail({
    from:    fromAddr,
    to,
    subject: 'Verify your FileEX email address',
    text: [
      `Hi ${name},`,
      '',
      'Welcome to FileEX! Please verify your email address to activate your account.',
      '',
      `Verification link: ${verifyUrl}`,
      '',
      `This link expires in ${expiryHrs} hour${expiryHrs !== 1 ? 's' : ''}.`,
      '',
      'If you did not create a FileEX account, you can safely ignore this email.',
      '',
      '— The FileEX Team',
    ].join('\n'),
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your FileEX email</title>
</head>
<body style="margin:0;padding:0;background:#F6F6F2;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F6F6F2;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#587463;padding:28px 40px;text-align:center;">
              <span style="font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
                &#9729;&#xfe0f; FileEX
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 24px;">
              <h2 style="margin:0 0 8px;font-size:20px;color:#242724;">Verify your email address</h2>
              <p style="margin:0 0 24px;font-size:15px;color:#515650;line-height:1.6;">
                Hi <strong>${name}</strong>,<br/>
                Welcome to FileEX! Click the button below to verify your email address and activate your account.
              </p>
              <a href="${verifyUrl}"
                style="display:inline-block;background:#587463;color:#ffffff;padding:14px 32px;
                       border-radius:8px;font-size:15px;font-weight:600;text-decoration:none;">
                Verify Email Address
              </a>
              <p style="margin:24px 0 0;font-size:13px;color:#727771;">
                This link expires in <strong>${expiryHrs} hour${expiryHrs !== 1 ? 's' : ''}</strong>.
                If you did not create a FileEX account, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #E6E8E4;margin:0;" />
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9BA59F;">
                © ${new Date().getFullYear()} FileEX. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });
}

/**
 * Send the password reset email.
 *
 * @param {object} opts
 * @param {string} opts.to         - Recipient email address
 * @param {string} opts.name       - Recipient display name
 * @param {string} opts.rawToken   - The raw (un-hashed) reset token
 */
export async function sendPasswordResetEmail({ to, name, rawToken }) {
  const clientUrl  = process.env.CLIENT_URL || 'http://localhost:5174';
  const resetUrl   = `${clientUrl}/reset-password?token=${rawToken}`;
  const expiryMins = parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRY_MINUTES || '30', 10);
  const fromAddr   = process.env.EMAIL_FROM || '"FileEX" <no-reply@fileex.app>';

  // Skip actual sending in test environment
  if (process.env.NODE_ENV === 'test') {
    return true;
  }

  const transporter = getTransporter();

  await transporter.sendMail({
    from:    fromAddr,
    to,
    subject: 'Reset your FileEX password',
    text: [
      `Hi ${name},`,
      '',
      'You requested to reset your FileEX password.',
      '',
      `Reset link: ${resetUrl}`,
      '',
      `This link expires in ${expiryMins} minutes.`,
      '',
      'If you did not request this, you can safely ignore this email. Your password will remain unchanged.',
      '',
      '— The FileEX Team',
    ].join('\n'),
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your FileEX password</title>
</head>
<body style="margin:0;padding:0;background:#F6F6F2;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F6F6F2;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#587463;padding:28px 40px;text-align:center;">
              <span style="font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
                &#9729;&#xfe0f; FileEX
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 24px;">
              <h2 style="margin:0 0 8px;font-size:20px;color:#242724;">Reset your password</h2>
              <p style="margin:0 0 24px;font-size:15px;color:#515650;line-height:1.6;">
                Hi <strong>${name}</strong>,<br/>
                You recently requested to reset the password for your FileEX account. Click the button below to proceed.
              </p>
              <a href="${resetUrl}"
                style="display:inline-block;background:#587463;color:#ffffff;padding:14px 32px;
                       border-radius:8px;font-size:15px;font-weight:600;text-decoration:none;">
                Reset Password
              </a>
              <p style="margin:24px 0 0;font-size:13px;color:#727771;">
                This link expires in <strong>${expiryMins} minutes</strong>.
                If you did not request a password reset, please ignore this email or contact support if you have concerns.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #E6E8E4;margin:0;" />
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9BA59F;">
                © ${new Date().getFullYear()} FileEX. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });
}
