import { cookies } from 'next/headers';
import admin from 'firebase-admin';

// Initialize Firebase Admin (if not already initialized)
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

export async function POST(req) {
   try {
      const { token } = await req.json();

      if (!token) {
         return new Response(
            JSON.stringify({ error: 'Missing token' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
         );
      }

      // Verify the ID token
      const decodedToken = await admin.auth().verifyIdToken(token);
      const uid = decodedToken.uid;

      // Check if user is admin or contributor in Firestore
      const db = admin.firestore();
      let userData = null;
      let userRole = null;

      // Check admins collection first
      let adminDoc = await db.collection('admins').doc(uid).get();
      if (adminDoc.exists) {
         userData = adminDoc.data();
         userRole = 'admin';
      } else {
         // Fallback: search by firebaseUid field (for legacy documents)
         let adminQuery = await db.collection('admins').where('firebaseUid', '==', uid).limit(1).get();
         if (!adminQuery.empty) {
            adminDoc = adminQuery.docs[0];
            userData = adminDoc.data();
            userRole = 'admin';
         }
      }

      // If not admin, check contributors
      if (!userData) {
         let contributorDoc = await db.collection('contributors').doc(uid).get();
         if (contributorDoc.exists) {
            userData = contributorDoc.data();
            userRole = 'contributor';
         } else {
            // Fallback: search by firebaseUid field (for legacy documents)
            let contributorQuery = await db.collection('contributors').where('firebaseUid', '==', uid).limit(1).get();
            if (!contributorQuery.empty) {
               contributorDoc = contributorQuery.docs[0];
               userData = contributorDoc.data();
               userRole = 'contributor';
            }
         }
      }

      if (!userData || !userRole) {
         return new Response(
            JSON.stringify({ error: 'Access denied. User does not have required permissions.' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
         );
      }

      // Set secure session cookie
      cookies().set('__session', token, {
         httpOnly: true,
         secure: process.env.NODE_ENV === 'production',
         sameSite: 'lax',
         path: '/',
         maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      return new Response(
         JSON.stringify({
            message: 'Login successful',
            uid,
            name: userData.name || 'User',
            email: decodedToken.email,
            role: userRole
         }),
         { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
   } catch (error) {
      console.error('Login error:', error);
      return new Response(
         JSON.stringify({ error: error.message || 'Authentication failed' }),
         { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
   }
}
