// AppWrite Cloud Function v5: magic-link
// Handles passwordless authentication via magic links

const { Client, Databases, Query } = require('node-appwrite');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Resend } = require('resend');

/**
 * Main handler for AppWrite Cloud Function
 */
module.exports = async ({ req, res, log, error }) => {
  try {
    // Parse request body safely
    let body = {};
    try {
      body = req.bodyJson || JSON.parse(req.body || '{}');
    } catch (parseError) {
      log(`Body parse error: ${parseError.message}`);
      log(`Raw body: ${req.body}`);
      // If JSON parsing fails, return error
      return res.json({ 
        success: false, 
        error: 'Invalid JSON in request body',
        details: parseError.message 
      }, 400);
    }
    
    const { action, email, token: magicToken } = body;

    log(`Magic-link: action=${action}, email=${email}`);

    // Initialize AppWrite
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);

    // Create magic link
    if (action === 'create') {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = Date.now() + 15 * 60 * 1000;

      await databases.createDocument(
        process.env.APPWRITE_DATABASE_ID,
        'magicLinks',
        'unique()',
        {
          email,
          token,
          redirectUrl: body.redirectUrl || 'https://auth.djamms.app/callback',
          expiresAt,
          used: false
        }
      );

      log(`Magic link created: ${token}`);

      // Send email via Resend
      // Use secret/userId format to match AuthCallback expectations
      const magicLink = `${body.redirectUrl || 'https://auth.djamms.app/callback'}?secret=${token}&userId=${encodeURIComponent(email)}`;
      
      if (process.env.RESEND_API_KEY) {
        try {
          const resend = new Resend(process.env.RESEND_API_KEY);
          
          const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DJAMMS Magic Link</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #1a1a1a; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);">
              <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: 2px;">DJAMMS</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.9); letter-spacing: 1px;">MUSIC • POWERED • BY • YOU</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #ffffff;">Sign In to Your Account</h2>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #a3a3a3;">
                Click the button below to securely sign in to DJAMMS. This link will expire in <strong style="color: #ffffff;">15 minutes</strong>.
              </p>
              
              <!-- Button -->
              <table role="presentation" style="margin: 32px 0; border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <a href="${magicLink}" style="display: inline-block; padding: 16px 48px; font-size: 16px; font-weight: 600; color: #ffffff; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); text-decoration: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4); transition: all 0.3s;">
                      Sign In to DJAMMS
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #737373;">
                Or copy and paste this URL into your browser:
              </p>
              <p style="margin: 8px 0; padding: 12px; font-size: 12px; color: #8b5cf6; background-color: #0a0a0a; border-radius: 6px; word-break: break-all; font-family: 'Courier New', monospace;">
                ${magicLink}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #262626; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #525252;">
                If you didn't request this email, you can safely ignore it.
              </p>
              <p style="margin: 8px 0 0; font-size: 12px; color: #525252;">
                © ${new Date().getFullYear()} DJAMMS. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
          `.trim();

          const { data, error: emailError } = await resend.emails.send({
            from: process.env.SMTP_FROM || 'DJAMMS <noreply@djamms.app>',
            to: [email],
            subject: 'Sign In to DJAMMS',
            html: emailHtml
          });

          if (emailError) {
            error(`Failed to send email: ${JSON.stringify(emailError)}`);
          } else {
            log(`Email sent successfully: ${data?.id}`);
          }
        } catch (emailErr) {
          error(`Email sending error: ${emailErr.message}`);
          // Don't fail the request if email fails - token is still valid
        }
      } else {
        log('RESEND_API_KEY not configured - skipping email send');
      }

      return res.json({
        success: true,
        message: 'Magic link created',
        token: token,
        magicLink: magicLink
      });
    }

    // Verify magic link
    if (action === 'callback' || action === 'verify') {
      // Support both old (secret/userId) and new (token/email) parameter names
      const tokenToVerify = magicToken || body.secret;
      const emailToVerify = email || body.userId;
      
      if (!tokenToVerify || !emailToVerify) {
        return res.json({ success: false, error: 'Missing token or email parameter' }, 400);
      }
      
      const response = await databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID,
        'magicLinks',
        [
          Query.equal('email', emailToVerify),
          Query.equal('token', tokenToVerify),
          Query.equal('used', false)
        ]
      );

      if (response.documents.length === 0) {
        return res.json({ success: false, error: 'Invalid magic link' }, 401);
      }

      const link = response.documents[0];

      if (link.expiresAt < Date.now()) {
        return res.json({ success: false, error: 'Expired magic link' }, 401);
      }

      // Mark as used
      await databases.updateDocument(
        process.env.APPWRITE_DATABASE_ID,
        'magicLinks',
        link.$id,
        { used: true }
      );

      // Get or create user
      const usersResp = await databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID,
        'users',
        [Query.equal('email', emailToVerify)]
      );

      let user;
      if (usersResp.documents.length > 0) {
        user = usersResp.documents[0];
        await databases.updateDocument(
          process.env.APPWRITE_DATABASE_ID,
          'users',
          user.$id,
          { updatedAt: new Date().toISOString() }
        );
      } else {
        const newUser = await databases.createDocument(
          process.env.APPWRITE_DATABASE_ID,
          'users',
          'unique()',
          {
            userId: `user_${Date.now()}`,
            email: emailToVerify,
            role: 'staff',
            autoplay: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        );
        user = newUser;
      }

      // Generate JWT
      const jwtToken = jwt.sign(
        {
          userId: user.userId,
          email: user.email,
          role: user.role,
          venueId: user.venueId,
          autoplay: user.autoplay
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      log(`JWT issued for: ${user.email}`);

      return res.json({
        success: true,
        token: jwtToken,
        user: {
          userId: user.userId,
          email: user.email,
          role: user.role,
          venueId: user.venueId,
          autoplay: user.autoplay
        }
      });
    }

    return res.json({ success: false, error: 'Invalid action' }, 400);

  } catch (err) {
    error(`Error: ${err.message}`);
    error(err.stack);
    return res.json({ success: false, error: err.message }, 500);
  }
};
