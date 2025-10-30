const nodemailer = require('nodemailer');
require('dotenv').config();

const testEmail = async () => {
  console.log('🔍 Testing email configuration...');
  console.log('📧 EMAIL_USER:', process.env.EMAIL_USER);
  console.log('🔑 EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set (App Password)' : 'Not set');
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Email configuration missing!');
    console.log('Please set EMAIL_USER and EMAIL_PASS in your .env file');
    return;
  }

  // Try different Gmail configurations
  const configs = [
    {
      name: 'Gmail SMTP (Port 587)',
      config: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        tls: {
          rejectUnauthorized: false
        },
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000,
      }
    },
    {
      name: 'Gmail SMTP (Port 465)',
      config: {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        tls: {
          rejectUnauthorized: false
        },
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000,
      }
    },
    {
      name: 'Gmail Service (Auto-detect)',
      config: {
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        tls: {
          rejectUnauthorized: false
        },
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000,
      }
    }
  ];

  for (const { name, config } of configs) {
    console.log(`\n🔄 Trying ${name}...`);
    
    try {
      const transporter = nodemailer.createTransport(config);
      
      // Test connection with timeout
      console.log('   📡 Testing connection...');
      await Promise.race([
        transporter.verify(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 30000)
        )
      ]);
      
      console.log(`   ✅ ${name} - Connection successful!`);
      
      // Send test email
      console.log('   📤 Sending test email...');
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: 'CampusEdge Email Test - SUCCESS! 🎉',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="background-color: #000; color: white; padding: 20px; border-radius: 10px; display: inline-block;">
                <h1 style="margin: 0; font-size: 24px;">CampusEdge</h1>
              </div>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
              <h2 style="color: #333; margin-bottom: 20px;">🎉 Email Configuration Working!</h2>
              
              <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Your email configuration is working correctly! You can now send verification emails to users.
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
      console.log(`   ✅ ${name} - Test email sent successfully!`);
      console.log('   📧 Message ID:', result.messageId);
      console.log(`   📬 Check your inbox at ${process.env.EMAIL_USER}`);
      
      console.log('\n🎉 SUCCESS! Your email verification system is ready!');
      console.log('✅ You can now register users and send verification codes.');
      return; // Exit on first success
      
    } catch (error) {
      console.log(`   ❌ ${name} - Failed:`, error.message);
      
      if (error.message.includes('Invalid login')) {
        console.log('   🔧 Issue: Invalid credentials');
        console.log('   💡 Solution: Make sure you\'re using Gmail App Password, not regular password');
      } else if (error.message.includes('timeout')) {
        console.log('   🔧 Issue: Connection timeout');
        console.log('   💡 Solution: Check your internet connection and firewall settings');
      } else if (error.message.includes('ETIMEDOUT')) {
        console.log('   🔧 Issue: Network timeout');
        console.log('   💡 Solution: Try using a different network or VPN');
      }
    }
  }
  
  console.log('\n❌ All email configurations failed.');
  console.log('\n🔧 Troubleshooting Steps:');
  console.log('1. ✅ Verify Gmail App Password is correct');
  console.log('2. 🌐 Check your internet connection');
  console.log('3. 🔥 Check if firewall is blocking SMTP connections');
  console.log('4. 🔄 Try using a different network (mobile hotspot)');
  console.log('5. 📱 Try using a VPN if you\'re on a restricted network');
  console.log('\n💡 Alternative: Use a different email service like Outlook or Yahoo');
};

testEmail();
