import nodemailer from "nodemailer";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local"), override: true });

async function testSMTP() {
  console.log("🧪 Testing SMTP Configuration...\n");

  // Check if SMTP variables are set
  const requiredVars = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM"];
  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error("❌ Missing required environment variables:");
    missingVars.forEach((varName) => console.error(`   - ${varName}`));
    console.error("\n💡 Please add these to your .env.local file");
    console.error("   See SMTP_CONFIGURATION_GUIDE.md for setup instructions");
    process.exit(1);
  }

  console.log("✅ All SMTP environment variables are set");
  console.log(`   Host: ${process.env.SMTP_HOST}`);
  console.log(`   Port: ${process.env.SMTP_PORT}`);
  console.log(`   User: ${process.env.SMTP_USER}`);
  console.log(`   From: ${process.env.SMTP_FROM}\n`);

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  // Test connection
  console.log("🔌 Testing SMTP connection...");
  try {
    await transporter.verify();
    console.log("✅ SMTP connection successful!\n");
  } catch (error: any) {
    console.error("❌ SMTP connection failed:");
    console.error(`   ${error.message}\n`);
    
    if (error.code === "EAUTH") {
      console.error("💡 Authentication failed. Check:");
      console.error("   - SMTP_USER and SMTP_PASSWORD are correct");
      console.error("   - For Gmail: Use App Password (not regular password)");
      console.error("   - For Gmail: Ensure 2FA is enabled");
    } else if (error.code === "ETIMEDOUT" || error.code === "ECONNREFUSED") {
      console.error("💡 Connection failed. Check:");
      console.error("   - SMTP_HOST and SMTP_PORT are correct");
      console.error("   - Firewall isn't blocking the connection");
      console.error("   - Network allows SMTP connections");
    }
    
    process.exit(1);
  }

  // Send test email
  const testEmail = process.env.SMTP_USER; // Send to self
  console.log(`📧 Sending test email to ${testEmail}...`);
  
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: testEmail,
      subject: "Test Email - Ooty Baker SMTP Configuration",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>✅ SMTP Configuration Test</h2>
          <p>This is a test email to verify your SMTP configuration is working correctly.</p>
          <p>If you received this email, your SMTP setup is successful!</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #666; font-size: 12px;">
            Sent from Ooty Baker & Confectioner<br />
            ${new Date().toLocaleString()}
          </p>
        </div>
      `,
    });

    console.log("✅ Test email sent successfully!");
    console.log(`   Message ID: ${info.messageId}\n`);
    
    if (process.env.SMTP_HOST?.includes("mailtrap")) {
      console.log("💡 Check your Mailtrap inbox dashboard to view the email");
    } else {
      console.log(`💡 Check your inbox (${testEmail}) for the test email`);
      console.log("   Don't forget to check spam folder if you don't see it");
    }
    
    console.log("\n🎉 SMTP configuration is working correctly!");
  } catch (error: any) {
    console.error("❌ Failed to send test email:");
    console.error(`   ${error.message}\n`);
    console.error("💡 Check your SMTP credentials and try again");
    process.exit(1);
  }
}

testSMTP().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
