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
      // Public endpoint - no authentication required for reading biographies
      const db = admin.firestore();

      // Get search parameter if provided
      const { searchParams } = new URL(req.url);
      const searchTerm = searchParams.get('search');

      let query = db.collection('biographies');

      if (searchTerm) {
         // Search by name (both Urdu and English)
         query = query
            .where('urdu.name', '>=', searchTerm)
            .where('urdu.name', '<=', searchTerm + '\uf8ff')
            .limit(50);
      } else {
         query = query.orderBy('createdAt', 'desc').limit(100);
      }

      const snapshot = await query.get();

      const biographies = [];
      snapshot.forEach((doc) => {
         biographies.push({
            id: doc.id,
            ...doc.data(),
         });
      });

      return new Response(
         JSON.stringify({ biographies }),
         { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
   } catch (error) {
      console.error('List biographies error:', error);
      return new Response(
         JSON.stringify({ error: error.message || 'Failed to fetch biographies' }),
         { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
   }
}
