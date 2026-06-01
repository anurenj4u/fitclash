import admin from 'firebase-admin';

export function getFirebaseAdmin() {
  if (!admin.apps.length) {
    if (!process.env.FIREBASE_PROJECT_ID) {
      throw new Error('FIREBASE_PROJECT_ID is missing in environment variables');
    }

    const projectId = process.env.FIREBASE_PROJECT_ID.trim();
    const serviceAccount = {
      projectId: projectId,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL.trim(),
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n').trim(),
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: projectId,
    });
  }

  return {
    adminDb: admin.firestore(),
    adminAuth: admin.auth(),
  };
}
