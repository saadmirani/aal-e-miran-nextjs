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
      const cookieStore = cookies();
      const sessionCookie = cookieStore.get('__session')?.value;

      if (!sessionCookie) {
         return new Response(
            JSON.stringify({ error: 'Unauthorized: No session' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
         );
      }

      // Verify the ID token
      let decodedToken;
      try {
         decodedToken = await admin.auth().verifyIdToken(sessionCookie);
      } catch (authError) {
         if (authError.code === 'auth/id-token-expired') {
            return new Response(
               JSON.stringify({
                  error: 'Session expired. Please login again.',
                  code: 'auth/id-token-expired'
               }),
               { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
         }
         throw authError;
      }

      const uid = decodedToken.uid;

      // Check if user is admin or contributor
      const db = admin.firestore();
      const adminDoc = await db.collection('admins').doc(uid).get();
      const contributorDoc = await db.collection('contributors').doc(uid).get();

      if (!adminDoc.exists && !contributorDoc.exists) {
         return new Response(
            JSON.stringify({ error: 'Access denied: Not authorized to create biographies' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
         );
      }

      // Get request body
      const biographyPayload = await req.json();
      const { urdu, english, slug, createdAt } = biographyPayload;

      // Validate required fields in Urdu
      if (!urdu?.name || !urdu.name.trim()) {
         return new Response(
            JSON.stringify({ error: 'Urdu name is required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
         );
      }

      if (!urdu?.about || !urdu.about.trim()) {
         return new Response(
            JSON.stringify({ error: 'Urdu about section is required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
         );
      }

      // Validate word count in Urdu about
      const wordCount = urdu.about
         .replace(/<[^>]*>/g, '')
         .trim()
         .split(/\s+/)
         .filter((word) => word.length > 0).length;

      if (wordCount < 3) {
         return new Response(
            JSON.stringify({ error: 'Urdu about section must contain at least 3 words' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
         );
      }

      // Build biography data - only include non-empty fields
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

      const biographyData = {
         urdu: buildLanguageData(urdu),
         english: buildLanguageData(english || {}),
         slug: slug || urdu.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
         createdBy: uid,
         createdByRole: adminDoc.exists ? 'admin' : 'contributor',
         createdAt: admin.firestore.FieldValue.serverTimestamp(),
         updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Save to Firestore
      const docRef = await db.collection('biographies').add(biographyData);

      return new Response(
         JSON.stringify({
            message: 'Biography created successfully',
            id: docRef.id,
         }),
         { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
   } catch (error) {
      console.error('Create biography error:', error);
      return new Response(
         JSON.stringify({ error: error.message || 'Failed to create biography' }),
         { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
   }
}
