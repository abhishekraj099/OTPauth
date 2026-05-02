const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('../utils/logger');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

(async () => {
  await transporter.verify()
    .then(() => console.log("SMTP connection verified"))
    .catch(err => console.error("SMTP VERIFY ERROR:", err));
})();

const templatePath = path.resolve(__dirname, '..', 'templates', 'otp-email.html');
const templateHtml = fs.readFileSync(templatePath, 'utf8');

const renderOtpTemplate = (otp, expiryMins) => {
  const digits = String(otp).padStart(6, '0').split('');
  return templateHtml
    .replace(/{{APP_NAME}}/g, config.app.name)
    .replace(/{{OTP_1}}/g, digits[0])
    .replace(/{{OTP_2}}/g, digits[1])
    .replace(/{{OTP_3}}/g, digits[2])
    .replace(/{{OTP_4}}/g, digits[3])
    .replace(/{{OTP_5}}/g, digits[4])
    .replace(/{{OTP_6}}/g, digits[5])
    .replace(/{{OTP_EXPIRY_MINUTES}}/g, String(expiryMins));
};

const sendOtpEmail = async ({ to, otp }) => {
  try {
    const info = await transporter.sendMail({
      from: config.email.from,
      to,
      subject: `${otp} is your ${config.app.name} login code`,
      html: renderOtpTemplate(otp, config.otp.expiryMinutes),
    });
    console.log("EMAIL SENT SUCCESS:", info.response);
    return info;
  } catch (error) {
    console.error("🔥 REAL EMAIL ERROR FULL:", error);
    console.error("🔥 ERROR MESSAGE:", error.message);
    console.error("🔥 ERROR RESPONSE:", error.response);
    console.error("🔥 ERROR CODE:", error.code);
    throw error; // DO NOT replace with custom error
  }
};

module.exports = { sendOtpEmail };
