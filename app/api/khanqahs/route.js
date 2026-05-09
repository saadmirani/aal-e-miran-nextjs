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

export async function GET() {
   try {
      const db = admin.firestore();
      const snapshot = await db.collection('khanqahs').get();
      const khanqahs = [];

      snapshot.forEach((doc) => {
         khanqahs.push({
            id: doc.id,
            ...doc.data(),
         });
      });

      return Response.json({ khanqahs });
   } catch (error) {
      console.error('Error fetching khanqahs:', error);
      return Response.json(
         { error: 'Failed to fetch khanqahs', message: error.message },
         { status: 500 }
      );
   }
}

export async function POST(request) {
   try {
      const cookieStore = cookies();
      const sessionCookie = cookieStore.get('__session')?.value;

      if (!sessionCookie) {
         return Response.json(
            { error: 'Unauthorized - No session' },
            { status: 401 }
         );
      }

      // Verify the ID token
      let decodedToken;
      try {
         decodedToken = await admin.auth().verifyIdToken(sessionCookie);
      } catch (authError) {
         if (authError.code === 'auth/id-token-expired') {
            return Response.json(
               { error: 'Session expired. Please login again.' },
               { status: 401 }
            );
         }
         throw authError;
      }

      const uid = decodedToken.uid;
      const db = admin.firestore();

      // Check if user is admin or contributor
      const adminDoc = await db.collection('admins').doc(uid).get();
      const contributorDoc = await db.collection('contributors').doc(uid).get();

      if (!adminDoc.exists && !contributorDoc.exists) {
         return Response.json(
            { error: 'Access denied: Not authorized to add khanqahs' },
            { status: 403 }
         );
      }

      const body = await request.json();
      const { name, sajjadaNashin, location, contactNumber } = body;

      if (!name || !sajjadaNashin || !location || !contactNumber) {
         return Response.json(
            { error: 'Missing required fields' },
            { status: 400 }
         );
      }

      const docRef = await db.collection('khanqahs').add({
         name,
         sajjadaNashin,
         location,
         contactNumber,
         createdAt: admin.firestore.Timestamp.now(),
         updatedAt: admin.firestore.Timestamp.now(),
         createdBy: uid,
      });

      return Response.json({
         id: docRef.id,
         name,
         sajjadaNashin,
         location,
         contactNumber,
         message: 'Khanqah added successfully',
      });
   } catch (error) {
      console.error('Error adding khanqah:', error);
      return Response.json(
         { error: 'Failed to add khanqah', message: error.message },
         { status: 500 }
      );
   }
}
