const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');

let initialized = false;

const initFirebase = () => {
  if (initialized || admin.apps.length) {
    initialized = true;
    return admin.app();
  }

  const serviceAccountPath = config.firebase.serviceAccountPath;
  let credential;
  let projectId = config.firebase.projectId;

  if (serviceAccountPath) {
    const resolvedPath = path.resolve(serviceAccountPath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Firebase service account file not found at ${resolvedPath}`);
    }
    const serviceAccount = require(resolvedPath);
    credential = admin.credential.cert(serviceAccount);
    projectId = projectId || serviceAccount.project_id;
  } else if (config.firebase.clientEmail && config.firebase.privateKey) {
    credential = admin.credential.cert({
      projectId,
      clientEmail: config.firebase.clientEmail,
      privateKey: config.firebase.privateKey,
    });
  } else {
    credential = admin.credential.applicationDefault();
  }

  admin.initializeApp({ credential, projectId });
  admin.firestore().settings({ ignoreUndefinedProperties: true });
  initialized = true;
  logger.info('Firebase initialized');
  return admin.app();
};

const getDb = () => admin.firestore();

module.exports = { admin, initFirebase, getDb };
