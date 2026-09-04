const nodemailer = require('nodemailer');
require('dotenv').config({ path: './.env' });

async function testSmtp() {
  console.log('Testing SMTP connection...');
  console.log('User:', process.env.SMTP_USER);
  console.log('Pass:', process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'MISSING');

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    const success = await transporter.verify();
    console.log('SMTP Connection Success:', success);
  } catch (error) {
    console.error('SMTP Connection Failed:');
    console.error(error.message);
  }
}

testSmtp();
