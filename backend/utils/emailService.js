const nodemailer = require("nodemailer");

/**
 * Creates reusable nodemailer transporter based on environment variables
 */
const createTransporter = () => {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
};

/**
 * Send 6-digit OTP email for password reset
 */
exports.sendOtpEmail = async ({ to, otp, userName = "Hotel Partner" }) => {
  const transporter = createTransporter();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Password Reset OTP - E-Annapurna</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;">
      <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #0A2F2F 0%, #155B58 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">E-Annapurna</h1>
          <p style="margin: 6px 0 0 0; color: #99f6e4; font-size: 13px; font-weight: 500;">Hotel Management & Billing Cloud</p>
        </div>
        
        <div style="padding: 32px 28px;">
          <p style="color: #1e293b; font-size: 16px; margin: 0 0 12px 0;">Namaste <strong>${userName}</strong>,</p>
          <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
            Aapke E-Annapurna Hotel Admin account ka password reset karne ke liye yeh 6-digit verification code request kiya gaya hai:
          </p>

          <div style="text-align: center; margin: 28px 0; background-color: #fefce8; border: 2px dashed #f59e0b; border-radius: 16px; padding: 20px;">
            <span style="font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #b45309; font-family: monospace;">
              ${otp}
            </span>
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #b45309; font-weight: 600;">
              Valid for 10 minutes only
            </p>
          </div>

          <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0 0 16px 0;">
            Kripya is code ko login screen par daalkar naya password set karein. Suraksha ke liye is OTP ko kisi ke sath share na karein.
          </p>
          <p style="color: #94a3b8; font-size: 12px; margin: 24px 0 0 0; border-top: 1px solid #f1f5f9; pt-4;">
            Agar aapne yeh request nahi ki hai, to is email ko ignore karein. Aapka password purane wala hi surakshit rahega.
          </p>
        </div>

        <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; color: #94a3b8; font-size: 11px;">
            &copy; ${new Date().getFullYear()} E-Annapurna Systems. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  if (!transporter) {
    console.log(`\n======================================================`);
    console.log(`[EMAIL DISPATCH] SMTP credentials not set in backend/.env`);
    console.log(`TARGET EMAIL: ${to}`);
    console.log(`PASSWORD RESET OTP: >>> ${otp} <<<`);
    console.log(`VALID FOR: 10 Minutes`);
    console.log(`NOTE: To send real emails, add SMTP_USER & SMTP_PASS in backend/.env`);
    console.log(`======================================================\n`);
    return {
      sent: true,
      simulated: true,
      message: "SMTP not configured. OTP printed in backend console for testing.",
    };
  }

  const senderEmail = process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@e-annapurna.co.in";

  const mailOptions = {
    from: `"E-Annapurna Security" <${senderEmail}>`,
    to,
    subject: `${otp} is your E-Annapurna Password Reset OTP`,
    text: `Your E-Annapurna password reset code is ${otp}. It is valid for 10 minutes.`,
    html: htmlContent,
  };

  const info = await transporter.sendMail(mailOptions);
  return { sent: true, messageId: info.messageId };
};

