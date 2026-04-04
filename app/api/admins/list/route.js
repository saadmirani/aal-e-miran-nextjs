import { cookies } from 'next/headers';
import admin from 'firebase-admin';

// Initialize Firebase Admin
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

export async function GET(req) {
   try {
      const cookieStore = cookies();
      const sessionCookie = cookieStore.get('__session')?.value;

      if (!sessionCookie) {
         return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
         );
      }

      // Verify token
      let decodedToken;
      try {
         decodedToken = await admin.auth().verifyIdToken(sessionCookie);
      } catch (authError) {
         if (authError.code === 'auth/id-token-expired') {
            return new Response(
               JSON.stringify({ error: 'Session expired', code: 'auth/id-token-expired' }),
               { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
         }
         throw authError;
      }

      // Verify user is admin
      const adminDoc = await admin.firestore().collection('admins').doc(decodedToken.uid).get();
      if (!adminDoc.exists) {
         return new Response(
            JSON.stringify({ error: 'Access denied' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
         );
      }

      const db = admin.firestore();
      // Get all admins (without orderBy first to include documents missing createdAt)
      const snapshot = await db.collection('admins').get();

      const admins = [];
      snapshot.forEach(doc => {
         admins.push({
            id: doc.id,
            ...doc.data()
         });
      });

      // Sort by createdAt descending (manually, to handle missing dates)
      admins.sort((a, b) => {
         const dateA = a.createdAt?.toDate?.() || new Date(0);
         const dateB = b.createdAt?.toDate?.() || new Date(0);
         return dateB - dateA;
      });

      return new Response(
         JSON.stringify(admins),
         { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
   } catch (error) {
      console.error('List admins error:', error);
      return new Response(
         JSON.stringify({ error: error.message || 'Failed to fetch admins' }),
         { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
   }
}
