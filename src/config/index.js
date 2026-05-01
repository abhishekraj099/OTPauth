const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '..', '..', '.env');
if (process.env.NODE_ENV !== 'production' && fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  isProduction: process.env.NODE_ENV === 'production',
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  },
  otp: {
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 10,
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS, 10) || 5,
    resendCooldown: parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS, 10) || 60,
  },
  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM,
  },
  app: {
    name: process.env.APP_NAME || 'MyApp',
    frontendUrl: process.env.FRONTEND_URL,
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  },
};

const requiredEnvVars = [
  'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'EMAIL_USER', 'EMAIL_PASS',
];
requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    console.error(`FATAL: Missing required env var: ${key}`);
    process.exit(1);
  }
});

module.exports = config;
