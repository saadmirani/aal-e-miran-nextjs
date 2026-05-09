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

export async function GET(request, { params }) {
   try {
      const db = admin.firestore();
      const khanqahDoc = await db.collection('khanqahs').doc(params.id).get();

      if (!khanqahDoc.exists) {
         return Response.json(
            { error: 'Khanqah not found' },
            { status: 404 }
         );
      }

      return Response.json({
         id: khanqahDoc.id,
         ...khanqahDoc.data(),
      });
   } catch (error) {
      console.error('Error fetching khanqah:', error);
      return Response.json(
         { error: 'Failed to fetch khanqah', message: error.message },
         { status: 500 }
      );
   }
}

export async function PUT(request, { params }) {
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
            { error: 'Access denied: Not authorized to update khanqahs' },
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

      await db.collection('khanqahs').doc(params.id).update({
         name,
         sajjadaNashin,
         location,
         contactNumber,
         updatedAt: admin.firestore.Timestamp.now(),
      });

      return Response.json({
         id: params.id,
         name,
         sajjadaNashin,
         location,
         contactNumber,
         message: 'Khanqah updated successfully',
      });
   } catch (error) {
      console.error('Error updating khanqah:', error);
      return Response.json(
         { error: 'Failed to update khanqah', message: error.message },
         { status: 500 }
      );
   }
}

export async function DELETE(request, { params }) {
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
            { error: 'Access denied: Not authorized to delete khanqahs' },
            { status: 403 }
         );
      }

      await db.collection('khanqahs').doc(params.id).delete();

      return Response.json({
         message: 'Khanqah deleted successfully',
      });
   } catch (error) {
      console.error('Error deleting khanqah:', error);
      return Response.json(
         { error: 'Failed to delete khanqah', message: error.message },
         { status: 500 }
      );
   }
}
