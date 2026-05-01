const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { admin, getDb } = require('../database/firestore');
const serializeUser = require('../utils/serializeUser');
const config = require('../config');
const ApiError = require('../utils/ApiError');

const generateAccessToken = (payload) =>
  jwt.sign(payload, config.jwt.accessSecret, { expiresIn: config.jwt.accessExpiresIn });

const hashRefreshToken = (token) =>
  crypto.createHmac('sha256', config.jwt.refreshSecret).update(token).digest('hex');

const sessionsCollection = () => getDb().collection('sessions');
const usersCollection = () => getDb().collection('users');

const createSession = async (userId, deviceInfo) => {
  const refreshToken = uuidv4();
  const refreshTokenHash = hashRefreshToken(refreshToken);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  await sessionsCollection().doc(refreshTokenHash).set({
    userId,
    refreshTokenHash,
    deviceInfo,
    expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
    isRevoked: false,
    lastUsedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return refreshToken;
};

const refreshAccessToken = async (refreshToken) => {
  const refreshTokenHash = hashRefreshToken(refreshToken);
  const sessionSnap = await sessionsCollection().doc(refreshTokenHash).get();
  if (!sessionSnap.exists) throw new ApiError(401, 'Invalid or expired refresh token');

  const session = sessionSnap.data();
  const expiresAt = session.expiresAt?.toDate?.();
  if (session.isRevoked || !expiresAt || expiresAt <= new Date()) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  await sessionsCollection().doc(refreshTokenHash).set({
    isRevoked: true,
    rotatedAt: admin.firestore.FieldValue.serverTimestamp(),
    lastUsedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  const userSnap = await usersCollection().doc(session.userId).get();
  if (!userSnap.exists) throw new ApiError(401, 'User not found');
  const user = serializeUser(userSnap);

  const accessToken = generateAccessToken({ id: user.id, email: user.email });
  const newRefreshToken = await createSession(user.id, session.deviceInfo || {});
  return { accessToken, refreshToken: newRefreshToken, user };
};

const revokeSession = async (refreshToken) => {
  const refreshTokenHash = hashRefreshToken(refreshToken);
  await sessionsCollection().doc(refreshTokenHash).set({
    isRevoked: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
};

const revokeAllSessions = async (userId) => {
  const snapshot = await sessionsCollection()
    .where('userId', '==', userId)
    .where('isRevoked', '==', false)
    .get();

  if (snapshot.empty) return;
  const batch = getDb().batch();
  snapshot.forEach((doc) => {
    batch.update(doc.ref, {
      isRevoked: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
  await batch.commit();
};

module.exports = { generateAccessToken, createSession, refreshAccessToken, revokeSession, revokeAllSessions };
