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

export async function GET(req, { params }) {
   try {
      // Public read access - no authentication required
      const { id } = params;
      const db = admin.firestore();

      const doc = await db.collection('biographies').doc(id).get();

      if (!doc.exists) {
         return new Response(
            JSON.stringify({ error: 'Biography not found' }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
         );
      }

      return new Response(
         JSON.stringify({
            id: doc.id,
            ...doc.data()
         }),
         { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
   } catch (error) {
      console.error('Get biography error:', error);
      return new Response(
         JSON.stringify({ error: error.message || 'Failed to fetch biography' }),
         { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
   }
}

export async function PUT(req, { params }) {
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

      const uid = decodedToken.uid;
      const { id } = params;
      const { urdu, english } = await req.json();

      const db = admin.firestore();

      // Verify user is authorized to edit
      const doc = await db.collection('biographies').doc(id).get();
      if (!doc.exists) {
         return new Response(
            JSON.stringify({ error: 'Biography not found' }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
         );
      }

      // Check permissions
      const adminDoc = await db.collection('admins').doc(uid).get();
      const contributorDoc = await db.collection('contributors').doc(uid).get();

      if (!adminDoc.exists && !contributorDoc.exists) {
         return new Response(
            JSON.stringify({ error: 'Access denied' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
         );
      }

      // Only admins can edit others' biographies
      if (!adminDoc.exists && doc.data().createdBy !== uid) {
         return new Response(
            JSON.stringify({ error: 'Access denied: Cannot edit other users\' biographies' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
         );
      }

      // Update biography
      const buildLanguageData = (langData) => {
         const result = {};
         Object.entries(langData).forEach(([key, value]) => {
            if (value && value.trim && value.trim() !== '') {
               result[key] = value.trim();
            } else if (value && typeof value !== 'string') {
               result[key] = value;
            }
         });
         return result;
      };

      await db.collection('biographies').doc(id).update({
         urdu: buildLanguageData(urdu),
         english: buildLanguageData(english || {}),
         updatedAt: admin.firestore.FieldValue.serverTimestamp(),
         updatedBy: uid,
      });

      return new Response(
         JSON.stringify({ message: 'Biography updated successfully', id }),
         { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
   } catch (error) {
      console.error('Update biography error:', error);
      return new Response(
         JSON.stringify({ error: error.message || 'Failed to update biography' }),
         { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
   }
}

export async function DELETE(req, { params }) {
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

      const uid = decodedToken.uid;
      const { id } = params;

      const db = admin.firestore();

      // Get biography
      const doc = await db.collection('biographies').doc(id).get();
      if (!doc.exists) {
         return new Response(
            JSON.stringify({ error: 'Biography not found' }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
         );
      }

      // Check permissions - Only admins can delete
      const adminDoc = await db.collection('admins').doc(uid).get();

      if (!adminDoc.exists) {
         return new Response(
            JSON.stringify({ error: 'Access denied: Only admins can delete biographies' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
         );
      }

      // Delete biography
      await db.collection('biographies').doc(id).delete();

      return new Response(
         JSON.stringify({ message: 'Biography deleted successfully', id }),
         { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
   } catch (error) {
      console.error('Delete biography error:', error);
      return new Response(
         JSON.stringify({ error: error.message || 'Failed to delete biography' }),
         { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
   }
}
