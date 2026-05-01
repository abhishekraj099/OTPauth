const admin = require('firebase-admin');
const config = require('../config');
const logger = require('../utils/logger');

let initialized = false;

const initFirebase = () => {
  if (initialized || admin.apps.length) {
    initialized = true;
    return admin.app();
  }

  let credential;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase configuration');
  }

  credential = admin.credential.cert({
    projectId,
    clientEmail,
    privateKey,
  });

  admin.initializeApp({ credential, projectId });
  admin.firestore().settings({ ignoreUndefinedProperties: true });
  initialized = true;
  logger.info('Firebase initialized');
  return admin.app();
};

const getDb = () => admin.firestore();

module.exports = { admin, initFirebase, getDb };
