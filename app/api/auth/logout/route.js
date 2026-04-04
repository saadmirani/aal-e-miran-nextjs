import { cookies } from 'next/headers';

export async function POST(req) {
   try {
      // Delete the session cookie
      const cookieStore = await cookies();
      cookieStore.delete('__session');

      return new Response(
         JSON.stringify({ message: 'Logout successful' }),
         { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
   } catch (error) {
      console.error('Logout error:', error);
      return new Response(
         JSON.stringify({ error: error.message || 'Logout failed' }),
         { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
   }
}
