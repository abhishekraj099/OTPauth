const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('../utils/logger');

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465,
  auth: { user: config.email.user, pass: config.email.pass },
});

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
    await transporter.sendMail({
      from: config.email.from,
      to,
      subject: `${otp} is your ${config.app.name} login code`,
      html: renderOtpTemplate(otp, config.otp.expiryMinutes),
    });
    logger.info(`OTP email sent to ${to}`);
  } catch (err) {
    logger.error('Email send error:', err.message);
    throw new Error('Email delivery failed');
  }
};

module.exports = { sendOtpEmail };
