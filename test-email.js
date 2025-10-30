const nodemailer = require('nodemailer');
require('dotenv').config();

// Test email configuration
const testEmail = async () => {
  console.log('Testing email configuration...');
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'Not set');
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Email configuration missing!');
    console.log('Please set EMAIL_USER and EMAIL_PASS in your .env file');
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Test connection
    await transporter.verify();
    console.log('✅ Email configuration is valid!');

    // Send test email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to yourself for testing
      subject: 'CampusEdge Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background-color: #000; color: white; padding: 20px; border-radius: 10px; display: inline-block;">
              <h1 style="margin: 0; font-size: 24px;">CampusEdge</h1>
            </div>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-bottom: 20px;">Email Test Successful! 🎉</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Your email configuration is working correctly. You can now send verification emails to users.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #000; color: white; padding: 20px; border-radius: 8px; display: inline-block;">
                <h1 style="margin: 0; font-size: 32px; letter-spacing: 5px; font-family: monospace;">123456</h1>
              </div>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              This is how verification codes will appear in emails.
            </p>
          </div>
          
          <div style="text-align: center; color: #999; font-size: 12px;">
            <p>This email was sent by CampusEdge. Please do not reply to this email.</p>
            <p>© 2024 CampusEdge. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', result.messageId);
    
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    
    if (error.message.includes('Invalid login')) {
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Make sure you have enabled 2-Factor Authentication on your Gmail account');
      console.log('2. Generate an App Password:');
      console.log('   - Go to Google Account settings');
      console.log('   - Security → 2-Step Verification → App passwords');
      console.log('   - Generate a new app password for "Mail"');
      console.log('   - Use this password as EMAIL_PASS in your .env file');
    } else if (error.message.includes('Less secure app access')) {
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Enable 2-Factor Authentication on your Gmail account');
      console.log('2. Use App Password instead of your regular password');
    }
  }
};

testEmail();
