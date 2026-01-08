import nodemailer from "nodemailer";

const GMAIL_USER = "akodemy.aeoncarde@gmail.com";
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
});

export async function sendOtpEmail(toEmail, otpCode) {
  const mailOptions = {
    from: `"Akodemy" <${GMAIL_USER}>`,
    to: toEmail,
    subject: "Akodemy - Password Reset Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #8B5CF6; margin: 0;">Akodemy</h1>
          <p style="color: #666; margin-top: 5px;">Coding Challenge Platform</p>
        </div>
        
        <div style="background: #f5f5f5; border-radius: 10px; padding: 30px; text-align: center;">
          <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
          <p style="color: #666;">Use the following code to reset your password:</p>
          
          <div style="background: #8B5CF6; color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 20px 40px; border-radius: 8px; display: inline-block; margin: 20px 0;">
            ${otpCode}
          </div>
          
          <p style="color: #999; font-size: 14px; margin-top: 20px;">
            This code expires in <strong>2 minutes</strong>.
          </p>
          <p style="color: #999; font-size: 14px;">
            If you didn't request this, please ignore this email.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} Akodemy. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${toEmail}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    return { success: false, error: error.message };
  }
}

export function generateOtp() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let otp = "";
  for (let i = 0; i < 6; i++) {
    otp += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return otp;
}
