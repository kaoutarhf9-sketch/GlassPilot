const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

// Load environment variables manually from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split(/\r?\n/).forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) env[key.trim()] = val.join('=').trim();
});

const smtpUser = env.SMTP_USER || "wiamhanafi21@gmail.com";
const smtpPass = (env.SMTP_PASS || "pnceztbhkbnsayle").replace(/\s+/g, "");

console.log('Testing SMTP connection with:');
console.log('SMTP_USER:', smtpUser);
console.log('SMTP_PASS length:', smtpPass.length);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

transporter.verify(function (error, success) {
  if (error) {
    console.error('SMTP Verification failed:', error);
  } else {
    console.log('SMTP Server is ready to take our messages!');
  }
  process.exit(0);
});
