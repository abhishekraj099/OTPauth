const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { admin, getDb } = require('../database/firestore');
const normalizeEmail = require('../utils/normalizeEmail');
const ApiError = require('../utils/ApiError');
const config = require('../config');

const generateOtp = () => crypto.randomInt(100000, 1000000).toString();
const hashOtp = async (otp) => bcrypt.hash(otp, 10);
const verifyOtpHash = async (otp, hash) => bcrypt.compare(otp, hash);

const otpsCollection = () => getDb().collection('otps');
const getOtpRef = (email) => otpsCollection().doc(normalizeEmail(email));

const createOtp = async ({ email, ipAddress, userAgent }) => {
  try {
    const otpRef = getOtpRef(email);
    const snapshot = await otpRef.get();
    const existing = snapshot.exists ? snapshot.data() : null;
    const existingExpiresAt = existing?.expiresAt?.toDate?.() || null;
    const hasActiveOtp = Boolean(existing && !existing.isUsed && (!existingExpiresAt || existingExpiresAt > new Date()));

    if (existing && !hasActiveOtp && existingExpiresAt && existingExpiresAt <= new Date()) {
      await otpRef.delete();
    }

    if (hasActiveOtp) {
      const createdAtMs = existing.createdAtMs || (existing.createdAt?.toDate?.().getTime() || 0);
      const cooldownMs = config.otp.resendCooldown * 1000;
      const timeSinceCreated = Date.now() - createdAtMs;
      if (timeSinceCreated < cooldownMs) {
        const waitSecs = Math.ceil((cooldownMs - timeSinceCreated) / 1000);
        throw new ApiError(429, `Please wait ${waitSecs}s before requesting a new OTP`);
      }
      if ((existing.resendCount || 0) >= 5) {
        throw new ApiError(429, 'Too many OTP requests. Try again after the current OTP expires.');
      }
    }

    console.log('Generating OTP for:', email);
    const otp = generateOtp();
    const otpHash = await hashOtp(otp);
    const expiresAt = new Date(Date.now() + config.otp.expiryMinutes * 60 * 1000);
    const resendCount = hasActiveOtp ? (existing.resendCount || 0) + 1 : 0;

    await otpRef.set({
      email: normalizeEmail(email),
      otpHash,
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAtMs: Date.now(),
      isUsed: false,
      attempts: 0,
      resendCount,
      ipAddress,
      userAgent,
    });

    console.log('OTP saved successfully for:', email);
    return otp;
  } catch (error) {
    console.error('OTP SERVICE ERROR:', error);
    throw error;
  }
};

const verifyOtp = async ({ email, otp }) => {
  const otpRef = getOtpRef(email);
  const now = new Date();

  await getDb().runTransaction(async (tx) => {
    const snapshot = await tx.get(otpRef);
    if (!snapshot.exists) throw new ApiError(400, 'OTP not found or expired. Please request a new one.');
    const data = snapshot.data();

    const expiresAt = data.expiresAt?.toDate?.() || new Date(0);
    if (data.isUsed || expiresAt <= now) {
      if (expiresAt <= now) {
        tx.delete(otpRef);
      }
      throw new ApiError(400, 'OTP not found or expired. Please request a new one.');
    }

    const attempts = data.attempts || 0;
    if (attempts >= config.otp.maxAttempts) {
      tx.delete(otpRef);
      throw new ApiError(429, 'Too many failed attempts. Request a new OTP.');
    }

    const isValid = await verifyOtpHash(otp, data.otpHash);
    if (!isValid) {
      const nextAttempts = attempts + 1;
      tx.update(otpRef, {
        attempts: nextAttempts,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      const remaining = config.otp.maxAttempts - nextAttempts;
      throw new ApiError(400, `Invalid OTP. ${remaining} attempts remaining.`);
    }

    tx.update(otpRef, {
      isUsed: true,
      usedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  return true;
};

const deleteOtp = async (email) => {
  const otpRef = getOtpRef(email);
  await otpRef.delete();
};

module.exports = { createOtp, verifyOtp, deleteOtp };
