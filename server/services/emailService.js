// Email helper for OTP delivery.
import nodemailer from "nodemailer";

// Service logic for Email Service.
const DEFAULT_GMAIL_USER = "akodemy.aeoncarde@gmail.com";

function createTransporter(user) {
  const appPassword = process.env.GMAIL_APP_PASSWORD;
  if (!appPassword) {
    throw new Error("GMAIL_APP_PASSWORD is not set");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass: appPassword,
    },
  });
}

export async function sendOtpEmail(toEmail, otpCode) {
  const gmailUser = process.env.GMAIL_USER || DEFAULT_GMAIL_USER;
  let transporter;
  try {
    transporter = createTransporter(gmailUser);
  } catch (error) {
    console.error("Email configuration error:", error);
    return { success: false, error: "Email service not configured" };
  }

  const mailOptions = {
    from: `"Akodemy" <${gmailUser}>`,
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

export async function sendAccountReactivatedEmail(toEmail, userName) {
  const gmailUser = process.env.GMAIL_USER || DEFAULT_GMAIL_USER;
  let transporter;
  try {
    transporter = createTransporter(gmailUser);
  } catch (error) {
    console.error("Email configuration error:", error);
    return { success: false, error: "Email service not configured" };
  }

  const mailOptions = {
    from: `"Akodemy" <${gmailUser}>`,
    to: toEmail,
    subject: "Akodemy - Account Reactivated",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #8B5CF6; margin: 0;">Akodemy</h1>
          <p style="color: #666; margin-top: 5px;">Coding Challenge Platform</p>
        </div>
        
        <div style="background: #f5f5f5; border-radius: 10px; padding: 30px;">
          <h2 style="color: #333; margin-top: 0;">Account Reactivated</h2>
          <p style="color: #666;">Hello ${userName},</p>
          <p style="color: #666;">
            Great news! Your Akodemy account has been reactivated by an administrator.
          </p>
          
          <div style="background: #D1FAE5; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="color: #065F46; margin: 0; font-weight: 500;">
              You can now log in and access all platform features again.
            </p>
          </div>
          
          <p style="color: #666;">
            Welcome back! We're excited to have you continue your coding journey with Akodemy.
          </p>
          
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            If you have any questions, please reach out to your institution's administrator.
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
    console.log(`Account reactivation email sent to ${toEmail}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to send reactivation email:", error);
    return { success: false, error: error.message };
  }
}

export async function sendAccountDeactivatedEmail(toEmail, userName) {
  const gmailUser = process.env.GMAIL_USER || DEFAULT_GMAIL_USER;
  let transporter;
  try {
    transporter = createTransporter(gmailUser);
  } catch (error) {
    console.error("Email configuration error:", error);
    return { success: false, error: "Email service not configured" };
  }

  const mailOptions = {
    from: `"Akodemy" <${gmailUser}>`,
    to: toEmail,
    subject: "Akodemy - Account Deactivated",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #8B5CF6; margin: 0;">Akodemy</h1>
          <p style="color: #666; margin-top: 5px;">Coding Challenge Platform</p>
        </div>
        
        <div style="background: #f5f5f5; border-radius: 10px; padding: 30px;">
          <h2 style="color: #333; margin-top: 0;">Account Deactivated</h2>
          <p style="color: #666;">Hello ${userName},</p>
          <p style="color: #666;">
            We're writing to inform you that your Akodemy account has been deactivated by an administrator.
          </p>
          
          <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="color: #92400E; margin: 0; font-weight: 500;">
              While your account is deactivated, you will not be able to log in or access the platform.
            </p>
          </div>
          
          <p style="color: #666;">
            If you believe this was done in error or if you would like to request reactivation of your account, 
            please contact an administrator for assistance.
          </p>
          
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            If you have any questions, please reach out to your institution's administrator.
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
    console.log(`Account deactivation email sent to ${toEmail}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to send deactivation email:", error);
    return { success: false, error: error.message };
  }
}



