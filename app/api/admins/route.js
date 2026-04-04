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

// Add new admin
export async function POST(req) {
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

      const { email, name, userId } = await req.json();

      if (!email || !name) {
         return new Response(
            JSON.stringify({ error: 'Email and name are required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
         );
      }

      const db = admin.firestore();

      // Check if admin with this email already exists
      const existing = await db.collection('admins').where('email', '==', email).get();
      if (!existing.empty) {
         return new Response(
            JSON.stringify({ error: 'Admin with this email already exists' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
         );
      }

      // Create Firebase Auth user
      let firebaseUser;
      try {
         firebaseUser = await admin.auth().createUser({
            email,
            emailVerified: false,
         });
      } catch (authError) {
         if (authError.code === 'auth/email-already-exists') {
            return new Response(
               JSON.stringify({ error: 'This email is already registered' }),
               { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
         }
         throw authError;
      }

      // Set custom claims for admin role
      await admin.auth().setCustomUserClaims(firebaseUser.uid, { role: 'admin' });

      // Add admin to Firestore using Firebase UID as document ID
      await db.collection('admins').doc(firebaseUser.uid).set({
         email,
         name,
         firebaseUid: firebaseUser.uid,
         role: 'admin',
         createdAt: admin.firestore.FieldValue.serverTimestamp(),
         createdBy: decodedToken.uid,
      });

      // Generate password reset link
      let resetLink = null;
      try {
         resetLink = await admin.auth().generatePasswordResetLink(email);
         console.log(`Password reset link for ${email}: ${resetLink}`);
      } catch (emailError) {
         console.error('Error generating password reset link:', emailError);
      }

      return new Response(
         JSON.stringify({
            message: 'Admin added successfully. Share the password setup link with them.',
            id: firebaseUser.uid,
            firebaseUid: firebaseUser.uid,
            email: email,
            passwordResetLink: resetLink,
         }),
         { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
   } catch (error) {
      console.error('Add admin error:', error);
      return new Response(
         JSON.stringify({ error: error.message || 'Failed to add admin' }),
         { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
   }
}

// Update admin
export async function PUT(req) {
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

      const { id, name } = await req.json();

      if (!id || !name) {
         return new Response(
            JSON.stringify({ error: 'ID and name are required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
         );
      }

      const db = admin.firestore();

      await db.collection('admins').doc(id).update({
         name,
         updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return new Response(
         JSON.stringify({ message: 'Admin updated successfully' }),
         { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
   } catch (error) {
      console.error('Update admin error:', error);
      return new Response(
         JSON.stringify({ error: error.message || 'Failed to update admin' }),
         { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
   }
}

// Delete admin
export async function DELETE(req) {
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

      const { id } = await req.json();

      if (!id) {
         return new Response(
            JSON.stringify({ error: 'ID is required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
         );
      }

      // Cannot delete self
      if (id === decodedToken.uid) {
         return new Response(
            JSON.stringify({ error: 'Cannot delete your own admin account' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
         );
      }

      const db = admin.firestore();

      // Get admin document to find firebaseUid
      const adminDocData = await db.collection('admins').doc(id).get();
      if (!adminDocData.exists) {
         return new Response(
            JSON.stringify({ error: 'Admin not found' }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
         );
      }

      const firebaseUid = adminDocData.data().firebaseUid || id;

      // Delete from Firestore
      await db.collection('admins').doc(id).delete();

      // Delete Firebase Auth user
      try {
         await admin.auth().deleteUser(firebaseUid);
      } catch (authError) {
         console.error('Error deleting Firebase user:', authError);
      }

      return new Response(
         JSON.stringify({ message: 'Admin deleted successfully' }),
         { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
   } catch (error) {
      console.error('Delete admin error:', error);
      return new Response(
         JSON.stringify({ error: error.message || 'Failed to delete admin' }),
         { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
   }
}
