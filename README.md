# OTP Auth Service

Email OTP authentication API using Express and Firebase.

## Environment Variables (Render)

Set these in your Render service environment settings.

### Required

- NODE_ENV
- PORT
- JWT_ACCESS_SECRET
- JWT_REFRESH_SECRET
- EMAIL_USER
- EMAIL_PASS

### Firebase

- FIREBASE_PROJECT_ID
- FIREBASE_CLIENT_EMAIL
- FIREBASE_PRIVATE_KEY

Note: These must be set in Render. `FIREBASE_PRIVATE_KEY` should keep newlines escaped (use `\n`).

### JWT

- JWT_ACCESS_EXPIRES
- JWT_REFRESH_EXPIRES

### OTP

- OTP_EXPIRY_MINUTES
- OTP_MAX_ATTEMPTS
- OTP_RESEND_COOLDOWN_SECONDS

### Email (SMTP)

- EMAIL_HOST
- EMAIL_PORT
- EMAIL_FROM

### App

- APP_NAME
- FRONTEND_URL
- ALLOWED_ORIGINS

## Local Run

```bash
npm install
npm run dev
```

## Health Check

- http://localhost:5000/health

## API Docs

- http://localhost:5000/api-docs
