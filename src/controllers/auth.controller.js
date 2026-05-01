const { createOtp, verifyOtp, deleteOtp } = require('../services/otp.service');
const { generateAccessToken, createSession, refreshAccessToken, revokeSession, revokeAllSessions } = require('../services/jwt.service');
const { sendOtpEmail } = require('../services/email.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { admin, getDb } = require('../database/firestore');
const normalizeEmail = require('../utils/normalizeEmail');
const serializeUser = require('../utils/serializeUser');

const getDeviceInfo = (req) => ({
  ip: req.ip || req.connection.remoteAddress,
  userAgent: req.get('User-Agent'),
  platform: req.get('sec-ch-ua-platform') || 'unknown',
});

const usersCollection = () => getDb().collection('users');
const loginHistoryCollection = () => getDb().collection('loginHistory');

const logEvent = async ({ userId, email, event, ipAddress, userAgent, metadata }) => {
  await loginHistoryCollection().add({
    userId,
    email,
    event,
    ipAddress,
    userAgent,
    metadata,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
};

exports.sendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const { ip, userAgent } = getDeviceInfo(req);
  const otp = await createOtp({ email, ipAddress: ip, userAgent });
  try {
    await sendOtpEmail({ to: email, otp });
  } catch (err) {
    await deleteOtp(email);
    throw err;
  }
  await logEvent({ email: normalizeEmail(email), event: 'OTP_SENT', ipAddress: ip, userAgent });
  res.status(200).json(new ApiResponse(200, { email }, 'OTP sent to your email'));
});

exports.verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const { ip, userAgent } = getDeviceInfo(req);
  await verifyOtp({ email, otp });

  const emailKey = normalizeEmail(email);
  const userRef = usersCollection().doc(emailKey);
  const userSnap = await userRef.get();
  const isNewUser = !userSnap.exists;

  if (!userSnap.exists) {
    await userRef.set({
      email: emailKey,
      isEmailVerified: true,
      isActive: true,
      isDeleted: false,
      loginCount: 0,
      metadata: { registeredIp: ip, userAgent },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } else {
    const existing = userSnap.data();
    const metadata = { ...(existing.metadata || {}), lastLoginIp: ip, userAgent };
    await userRef.set({
      isEmailVerified: true,
      lastLoginAt: admin.firestore.Timestamp.fromDate(new Date()),
      loginCount: admin.firestore.FieldValue.increment(1),
      metadata,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  const refreshedSnap = await userRef.get();
  const user = serializeUser(refreshedSnap);

  const accessToken = generateAccessToken({ id: user.id, email: user.email });
  const refreshToken = await createSession(user.id, { ip, userAgent });

  await logEvent({
    userId: user.id,
    email: user.email,
    event: 'LOGIN_SUCCESS',
    ipAddress: ip,
    userAgent,
    metadata: { isNewUser },
  });

  res.status(200).json(new ApiResponse(200,
    { accessToken, refreshToken, user, isNewUser },
    isNewUser ? 'Account created and logged in' : 'Login successful'
  ));
});

exports.refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new ApiError(400, 'Refresh token required');
  const data = await refreshAccessToken(refreshToken);
  res.status(200).json(new ApiResponse(200, data, 'Token refreshed'));
});

exports.logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) await revokeSession(refreshToken);
  await logEvent({ userId: req.user?.id, event: 'LOGOUT', ipAddress: req.ip });
  res.status(200).json(new ApiResponse(200, {}, 'Logged out successfully'));
});

exports.logoutAll = asyncHandler(async (req, res) => {
  await revokeAllSessions(req.user.id);
  res.status(200).json(new ApiResponse(200, {}, 'Logged out from all devices'));
});
