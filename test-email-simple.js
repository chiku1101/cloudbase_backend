const nodemailer = require('nodemailer');
require('dotenv').config();

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
    // Try different configurations
    const configs = [
      {
        name: 'Gmail with port 587',
        config: {
          service: 'gmail',
          port: 587,
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        }
      },
      {
        name: 'Gmail with port 465',
        config: {
          service: 'gmail',
          port: 465,
          secure: true,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        }
      }
    ];

    for (const { name, config } of configs) {
      console.log(`\nTrying ${name}...`);
      
      try {
        const transporter = nodemailer.createTransport(config);
        
        // Test connection
        await transporter.verify();
        console.log(`✅ ${name} - Connection successful!`);
        
        // Send test email
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: process.env.EMAIL_USER,
          subject: 'CampusEdge Email Test',
          text: 'This is a test email from CampusEdge. If you receive this, your email configuration is working!',
        };

        const result = await transporter.sendMail(mailOptions);
        console.log(`✅ ${name} - Test email sent successfully!`);
        console.log('Message ID:', result.messageId);
        return; // Exit on first success
        
      } catch (error) {
        console.log(`❌ ${name} - Failed:`, error.message);
      }
    }
    
    console.log('\n❌ All email configurations failed.');
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure you have enabled 2-Factor Authentication on your Gmail account');
    console.log('2. Generate an App Password:');
    console.log('   - Go to Google Account settings');
    console.log('   - Security → 2-Step Verification → App passwords');
    console.log('   - Generate a new app password for "Mail"');
    console.log('   - Use this password as EMAIL_PASS in your .env file');
    console.log('3. Make sure your firewall allows SMTP connections');
    
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
  }
};

testEmail();
