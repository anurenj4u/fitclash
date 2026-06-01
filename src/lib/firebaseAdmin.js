import admin from 'firebase-admin';

if (!admin.apps.length) {
  // Try to initialize only if we have the required project ID, to prevent build-time crashes
  if (process.env.FIREBASE_PROJECT_ID) {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    // Initialize without credentials so build doesn't crash; it will fail at runtime if actually used.
    admin.initializeApp();
  }
}

const adminDb = admin.firestore();
const adminAuth = admin.auth();

export { adminDb, adminAuth };
