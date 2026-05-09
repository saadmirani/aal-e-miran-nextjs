import { cookies } from 'next/headers';
import admin from 'firebase-admin';

function ensureFirebaseAdmin() {
   if (!admin.apps.length) {
      admin.initializeApp({
         credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
         }),
         databaseURL: process.env.FIREBASE_DATABASE_URL,
      });
   }

   return admin;
}

export async function requireEditorAuth() {
   const cookieStore = await cookies();
   const sessionCookie = cookieStore.get('__session')?.value;

   if (!sessionCookie) {
      return Response.json({ error: 'Unauthorized - No session' }, { status: 401 });
   }

   try {
      const firebaseAdmin = ensureFirebaseAdmin();
      const decodedToken = await firebaseAdmin.auth().verifyIdToken(sessionCookie);
      const uid = decodedToken.uid;
      const db = firebaseAdmin.firestore();

      let role = null;
      let profile = null;

      let adminDoc = await db.collection('admins').doc(uid).get();
      if (adminDoc.exists) {
         role = 'admin';
         profile = adminDoc.data();
      } else {
         const adminQuery = await db.collection('admins').where('firebaseUid', '==', uid).limit(1).get();
         if (!adminQuery.empty) {
            role = 'admin';
            profile = adminQuery.docs[0].data();
         }
      }

      if (!role) {
         let contributorDoc = await db.collection('contributors').doc(uid).get();
         if (contributorDoc.exists) {
            role = 'contributor';
            profile = contributorDoc.data();
         } else {
            const contributorQuery = await db.collection('contributors').where('firebaseUid', '==', uid).limit(1).get();
            if (!contributorQuery.empty) {
               role = 'contributor';
               profile = contributorQuery.docs[0].data();
            }
         }
      }

      if (!role) {
         return Response.json({ error: 'Forbidden - Contributor/Admin access required' }, { status: 403 });
      }

      return { uid, role, profile, email: decodedToken.email || null };
   } catch (error) {
      const message = String(error?.message || 'Authentication failed');
      const status = /expired|revoked|token/i.test(message) ? 401 : 401;
      return Response.json({ error: status === 401 ? 'Session expired. Please login again.' : 'Unauthorized' }, { status });
   }
}